import cv2, os, sys, threading, shutil
import tkinter as tk
from tkinter import ttk, filedialog, simpledialog, Frame, Button, Label
import numpy as np
import matplotlib
import matplotlib.pyplot as plt
import matplotlib.image as mpimg
from matplotlib.backends.backend_tkagg import FigureCanvasTkAgg
import pandas as pd
import scipy.interpolate as interp
import opyf  

class SharedData:
    def __init__(self):
        self.video_path = None
        self.saved_frame_path = None
        self.calibration_factor = None
        self.calibration_points = None
        self.optical_flow_csv = None
        self.optical_flow_output_dir = None

class VideoFrameTab(Frame):
    def __init__(self, master, shared):
        super().__init__(master)
        self.shared = shared
        self.btn_select = Button(self, text="Select Video", command=self.load_video)
        self.btn_select.pack(pady=5)
        self.slider = ttk.Scale(self, from_=0, to=100, orient="horizontal", command=self.update_frame)
        self.slider.pack(fill='x', padx=5)
        self.label = Label(self, text="Frame: 0 | Time: 0.00s")
        self.label.pack(pady=5)
        self.btn_save = Button(self, text="Save Frame", command=self.save_frame)
        self.btn_save.pack(pady=5)
        self.cap = None
        self.total_frames = 0
        self.fps = 0
        self.current_frame = None
        self.current_frame_idx = 0
        self.show_frames = True

    def load_video(self):
        self.shared.video_path = filedialog.askopenfilename(filetypes=[("Video files", "*.mp4;*.avi;*.mov;*.mkv")])
        if not self.shared.video_path: 
            return
        self.cap = cv2.VideoCapture(self.shared.video_path)
        if not self.cap.isOpened(): 
            return
        self.total_frames = int(self.cap.get(cv2.CAP_PROP_FRAME_COUNT))
        self.fps = self.cap.get(cv2.CAP_PROP_FPS)
        self.slider.config(to=self.total_frames-1)
        self.update_frame(0)

    def update_frame(self, val):
        frame_idx = int(float(val))
        if self.cap:
            self.cap.set(cv2.CAP_PROP_POS_FRAMES, frame_idx)
            ret, frame = self.cap.read()
            if ret:
                self.current_frame = frame
                self.current_frame_idx = frame_idx
                timestamp = frame_idx/self.fps if self.fps else 0
                self.label.config(text=f"Frame: {frame_idx} | Time: {timestamp:.2f}s")
                frame_disp = cv2.resize(cv2.cvtColor(frame, cv2.COLOR_BGR2RGB), (800,600))
                cv2.imshow("Frame Viewer", frame_disp)

    def save_frame(self):
        if self.current_frame is not None and self.shared.video_path:
            directory = os.path.dirname(self.shared.video_path)
            fname = os.path.join(directory, f"frame_{self.current_frame_idx}.png")
            cv2.imwrite(fname, self.current_frame)
            self.shared.saved_frame_path = fname
            print(f"Frame saved as {fname}")

    def __del__(self):
        if self.cap: 
            self.cap.release()
        cv2.destroyAllWindows()

class CalibrationTab(Frame):
    def __init__(self, master, shared):
        super().__init__(master)
        self.shared = shared
        self.btn_select = Button(self, text="Select Calibration Image", command=self.select_image)
        self.btn_select.pack(pady=5)
        self.info_label = Label(self, text="Calibration factor not set.")
        self.info_label.pack(pady=5)
        self.fig, self.ax = plt.subplots(figsize=(5,4))
        self.canvas = FigureCanvasTkAgg(self.fig, master=self)
        self.canvas.get_tk_widget().pack(fill='both', expand=True)
        self.img = None
        self.points = []
        self.cid = None

    def select_image(self):
        file_path = filedialog.askopenfilename(title="Select Calibration Image",
                                               filetypes=[("Image Files", "*.png;*.jpg;*.jpeg")])
        if not file_path: 
            return
        self.img = mpimg.imread(file_path)
        self.ax.clear()
        self.ax.imshow(self.img, origin='upper')
        self.ax.set_title("Click TWO points for calibration")
        self.canvas.draw()
        self.points = []
        if self.cid is not None:
            self.canvas.mpl_disconnect(self.cid)
        self.cid = self.canvas.mpl_connect('button_press_event', self.on_click)

    def on_click(self, event):
        if event.inaxes != self.ax: 
            return
        self.points.append((event.xdata, event.ydata))
        self.ax.plot(event.xdata, event.ydata, 'ro')
        self.canvas.draw()
        if len(self.points) == 2:
            (x1, y1), (x2, y2) = self.points
            self.ax.plot([x1, x2], [y1, y2], 'r--')
            self.canvas.draw()
            px_dist = np.sqrt((x2-x1)**2+(y2-y1)**2)
            dstr = f"Selected distance: {px_dist:.2f} pixels"
            real = simpledialog.askstring("Calibration", dstr+"\nEnter real distance (meters):", parent=self)
            try:
                real = float(real)
            except:
                self.info_label.config(text="Invalid real distance provided.")
                return
            self.shared.calibration_factor = real/px_dist
            self.info_label.config(text=f"Calibration: 1 px = {self.shared.calibration_factor:.5f} m")
            self.shared.calibration_points = self.points
            self.canvas.mpl_disconnect(self.cid)

class OpticalFlowTab(Frame):
    def __init__(self, master, shared):
        super().__init__(master)
        self.shared = shared
        Label(self, text="Optical Flow Analysis (opyf)").pack(pady=5)
        self.frm = Frame(self)
        self.frm.pack(pady=5)
        Label(self.frm, text="Starting Frame:").grid(row=0, column=0, padx=5, pady=2)
        self.start_entry = tk.Entry(self.frm, width=8)
        self.start_entry.grid(row=0, column=1, padx=5, pady=2)
        self.start_entry.insert(0, "150")
        Label(self.frm, text="Vlim (max velocity):").grid(row=1, column=0, padx=5, pady=2)
        self.vlim_entry = tk.Entry(self.frm, width=8)
        self.vlim_entry.grid(row=1, column=1, padx=5, pady=2)
        self.vlim_entry.insert(0, "10")
        self.btn_run = Button(self, text="Run Optical Flow Analysis", command=self.run_optical_flow)
        self.btn_run.pack(pady=5)
        self.btn_select_output = Button(self, text="Select Optical Flow Output Directory", command=self.select_output_dir)
        self.btn_select_output.pack(pady=5)
        self.status = Label(self, text="Waiting for input.")
        self.status.pack(pady=5)

    def select_output_dir(self):
        directory = filedialog.askdirectory(title="Select Optical Flow Output Directory")
        if directory:
            self.shared.optical_flow_output_dir = directory
            self.status.config(text=f"Output directory set to {directory}")
        else:
            self.status.config(text="Using default output directory.")

    def run_optical_flow(self):
        if not self.shared.video_path:
            self.status.config(text="Select a video in Step 1.")
            return
        if self.shared.calibration_factor is None:
            self.status.config(text="Set calibration factor in Step 2.")
            return
        try:
            start_frame = int(self.start_entry.get())
            vlim = float(self.vlim_entry.get())
        except Exception as e:
            self.status.config(text="Invalid parameters.")
            return
        self.status.config(text="Processing optical flow...")
        def worker():
            import matplotlib.pyplot as plt
            matplotlib.use('Agg')
            print("Worker started. Using backend:", matplotlib.get_backend())
            try:
                video = opyf.videoAnalyzer(self.shared.video_path)
                print("videoAnalyzer created")
                video.set_vecTime(Ntot=8, shift=1, step=2, starting_frame=start_frame)
                print("set_vecTime done")
                video.extractGoodFeaturesAndDisplacements(display=None, displayColor=False, width=0.002)
                print("extractGoodFeaturesAndDisplacements done")
                plt.close('all')
                video.set_vlim([0, vlim])
                print("set_vlim done")
                video.extractGoodFeaturesAndDisplacements(display=None, displayColor=False, width=0.002)
                print("second extractGoodFeaturesAndDisplacements done")
                plt.close('all')
                video.set_filtersParams(wayBackGoodFlag=4, RadiusF=20, maxDevInRadius=1, CLAHE=True)
                print("set_filtersParams done")
                video.set_goodFeaturesToTrackParams(maxCorners=40000, qualityLevel=0.005)
                print("set_goodFeaturesToTrackParams done")
                video.set_opticalFlowParams(maxLevel=3)
                print("set_opticalFlowParams done")
                video.extractGoodFeaturesPositionsDisplacementsAndInterpolate(display=None, displayColor=False, scale=10, width=0.005)
                print("extractGoodFeaturesPositionsDisplacementsAndInterpolate done")
                plt.close('all')
                video.scaleData(framesPerSecond=30, metersPerPx=self.shared.calibration_factor, unit=['m','s'], origin=[0, video.Hvis])
                print("scaleData done")
                video.writeVelocityField(fileFormat='csv')
                print("writeVelocityField done")
                plt.close('all')
                output_dir = self.shared.optical_flow_output_dir if self.shared.optical_flow_output_dir else os.getcwd()
                filename = os.path.join(output_dir, "velocity_field.csv")
                if os.path.exists(os.path.join(os.getcwd(), "velocity_field.csv")):
                    shutil.move(os.path.join(os.getcwd(), "velocity_field.csv"), filename)
                self.shared.optical_flow_csv = filename
                self.status.config(text="Optical flow analysis complete. CSV saved.")
                print("Optical flow worker finished.")
            except Exception as e:
                print("Error in optical flow worker:", e)
                self.status.config(text=f"Error: {e}")
        threading.Thread(target=worker).start()

class VelocityAnalysisTab(Frame):
    def __init__(self, master, shared):
        super().__init__(master)
        self.shared = shared
        Label(self, text="Velocity Field Analyzer").pack(pady=5)
        ctrl = Frame(self)
        ctrl.pack(pady=5)
        Button(ctrl, text="1. Select CSV File", command=self.select_csv).grid(row=0, column=0, padx=5)
        Button(ctrl, text="2. Select Image", command=self.select_image).grid(row=0, column=1, padx=5)
        Button(ctrl, text="3. Apply Rescaling", command=self.apply_rescaling).grid(row=0, column=2, padx=5)
        Button(ctrl, text="4. Select Save Directory", command=self.select_save_dir).grid(row=0, column=3, padx=5)
        self.analyze_btn = Button(ctrl, text="5. Analyze Data", command=self.calculate_velocity_profile, state=tk.DISABLED)
        self.analyze_btn.grid(row=0, column=4, padx=5)
        Button(ctrl, text="Clear Selection", command=self.clear_selection).grid(row=0, column=5, padx=5)
        Button(ctrl, text="Reload Points", command=self.reload_points).grid(row=0, column=6, padx=5)
        self.status = Label(self, text="Step 1: Select CSV file", anchor='w')
        self.status.pack(fill='x', padx=5, pady=5)
        top = Frame(self)
        top.pack(fill='both', expand=True, padx=5, pady=5)
        self.fig_frame = plt.Figure(figsize=(6,5), dpi=100)
        self.ax_frame = self.fig_frame.add_subplot(111)
        self.canvas_frame = FigureCanvasTkAgg(self.fig_frame, master=top)
        self.canvas_frame.get_tk_widget().pack(side=tk.LEFT, fill='both', expand=True)
        self.fig_velocity = plt.Figure(figsize=(6,5), dpi=100)
        self.ax_velocity = self.fig_velocity.add_subplot(111)
        self.canvas_velocity = FigureCanvasTkAgg(self.fig_velocity, master=top)
        self.canvas_velocity.get_tk_widget().pack(side=tk.RIGHT, fill='both', expand=True)
        bot = Frame(self)
        bot.pack(fill='both', expand=True, padx=5, pady=5)
        self.fig_profile = plt.Figure(figsize=(10,4), dpi=100)
        self.ax_profile = self.fig_profile.add_subplot(111)
        self.canvas_profile = FigureCanvasTkAgg(self.fig_profile, master=bot)
        self.canvas_profile.get_tk_widget().pack(fill='both', expand=True)
        self.save_dir = os.getcwd()
        self.csv_file = None; self.image_file = None
        self.X = None; self.Y = None; self.Ux = None; self.Uy = None; self.vel = None; self.img = None; self.extent = None
        self.selected_points = []

    def select_csv(self):
        self.csv_file = filedialog.askopenfilename(title="Select CSV with velocity data",
                                                   filetypes=[("CSV Files","*.csv")])
        if self.csv_file:
            self.status.config(text=f"CSV selected: {os.path.basename(self.csv_file)}")
            self.load_velocity_data()

    def load_velocity_data(self):
        try:
            df = pd.read_csv(self.csv_file)
            self.X = df["X"].values
            self.Y = df["Y"].values
            for key in ["Ux_[m.s^{-1}]", "Ux_[m.s-1]", "Ux"]:
                if key in df.columns:
                    self.Ux = df[key].values; break
            for key in ["Uy_[m.s^{-1}]", "Uy_[m.s-1]", "Uy"]:
                if key in df.columns:
                    self.Uy = df[key].values; break
            self.vel = np.sqrt(self.Ux**2+self.Uy**2)
            self.display_velocity_field()
            self.status.config(text="Velocity data loaded. Now select an image (Step 2).")
        except Exception as e:
            self.status.config(text=f"Error loading CSV: {e}")

    def display_velocity_field(self):
        if self.vel is None:
            return
        self.ax_velocity.clear()
        sc = self.ax_velocity.scatter(self.X, self.Y, c=self.vel, cmap="plasma", alpha=0.8, s=15)
        self.fig_velocity.colorbar(sc, ax=self.ax_velocity, label="Velocity (m/s)")
        self.ax_velocity.set_title("Velocity Field (m/s)")
        self.ax_velocity.set_xlabel("X (m)")
        self.ax_velocity.set_ylabel("Y (m)")
        # If the rescaled extent is available, use it:
        if self.extent is not None:
            self.ax_velocity.set_xlim(self.extent[0], self.extent[1])
            self.ax_velocity.set_ylim(self.extent[2], self.extent[3])
        self.ax_velocity.set_aspect('equal', adjustable='box')
        self.fig_velocity.tight_layout()
        self.canvas_velocity.draw()

    def select_image(self):
        self.image_file = filedialog.askopenfilename(title="Select Background Image",
                                                     filetypes=[("Image Files","*.png;*.jpg;*.jpeg")])
        if self.image_file:
            self.status.config(text=f"Image selected: {os.path.basename(self.image_file)}")
            try:
                self.img = mpimg.imread(self.image_file)
                self.display_unscaled_image()
            except Exception as e:
                self.status.config(text=f"Error loading image: {e}")

    def display_unscaled_image(self):
        if self.img is None:
            return
        self.ax_frame.clear()
        self.ax_frame.imshow(self.img, origin='upper')
        self.ax_frame.set_title("Original Frame (pixels)")
        self.ax_frame.set_xlabel("X (pixels)")
        self.ax_frame.set_ylabel("Y (pixels)")
        self.fig_frame.tight_layout()
        self.canvas_frame.draw()
        self.status.config(text="Frame loaded. Applying calibration factor for rescaling (Step 3).")

    def apply_rescaling(self):
        if not self.image_file:
            self.status.config(text="Select image first.")
            return
        if self.shared.calibration_factor is None:
            self.status.config(text="Calibration factor not set. Go to Step 2.")
            return
        self.scale = self.shared.calibration_factor
        try:
            h, w = self.img.shape[0], self.img.shape[1]
            width_m, height_m = w * self.scale, h * self.scale
            self.extent = [0, width_m, 0, height_m]
            self.display_scaled_image()
            # Clear previous selection and enable interactive point selection.
            self.selected_points = []
            self.canvas_frame.mpl_connect('button_press_event', self.on_frame_click)
            self.canvas_velocity.mpl_connect('button_press_event', self.on_velocity_click)
            self.status.config(text="Image rescaled. Click on the frame or velocity field to select two points.")
        except Exception as e:
            self.status.config(text=f"Error in rescaling: {e}")

    def display_scaled_image(self):
        if self.img is None or self.extent is None:
            return
        self.ax_frame.clear()
        self.ax_frame.imshow(self.img, extent=self.extent, origin='upper')
        self.ax_frame.set_title("Rescaled Frame (meters)")
        self.ax_frame.set_xlabel("X (m)")
        self.ax_frame.set_ylabel("Y (m)")
        self.ax_frame.set_aspect('equal', adjustable='box')
        self.fig_frame.tight_layout()
        self.canvas_frame.draw()

    def on_frame_click(self, event):
        if event.inaxes != self.ax_frame or len(self.selected_points) >= 2:
            return
        self.add_point(event.xdata, event.ydata)

    def on_velocity_click(self, event):
        if event.inaxes != self.ax_velocity or len(self.selected_points) >= 2:
            return
        self.add_point(event.xdata, event.ydata)

    def add_point(self, x, y):
        self.selected_points.append((x, y))
        self.ax_frame.plot(x, y, 'ro', markersize=8)
        self.canvas_frame.draw()
        self.ax_velocity.plot(x, y, 'ro', markersize=8)
        self.canvas_velocity.draw()
        if len(self.selected_points) == 2:
            (x1, y1), (x2, y2) = self.selected_points
            self.ax_frame.plot([x1, x2], [y1, y2], 'r--', lw=2)
            self.ax_velocity.plot([x1, x2], [y1, y2], 'r--', lw=2)
            self.canvas_frame.draw()
            self.canvas_velocity.draw()
            self.analyze_btn.config(state=tk.NORMAL)
            self.status.config(text="Two points selected. Click 'Analyze Data'.")

    def clear_selection(self):
        self.selected_points = []
        self.analyze_btn.config(state=tk.DISABLED)
        if self.extent is not None and self.img is not None:
            self.display_scaled_image()
        elif self.img is not None:
            self.display_unscaled_image()
        if self.vel is not None:
            self.display_velocity_field()
        self.ax_profile.clear()
        self.ax_profile.set_title("Velocity Profile")
        self.ax_profile.set_xlabel("Distance (m)")
        self.ax_profile.set_ylabel("Velocity (m/s)")
        self.fig_profile.tight_layout()
        self.canvas_profile.draw()
        self.status.config(text="Selection cleared.")

    def select_save_dir(self):
        d = filedialog.askdirectory(title="Select Save Directory")
        if d:
            self.save_dir = d
            self.status.config(text=f"Save directory: {d}")
        else:
            self.status.config(text="Using default save directory.")

    def reload_points(self):
        pf = filedialog.askopenfilename(title="Select CSV with saved points",
                                        filetypes=[("CSV Files","*.csv")])
        if pf:
            try:
                df = pd.read_csv(pf)
                if df.shape[0] < 2:
                    self.status.config(text="CSV must have at least two points.")
                    return
                self.selected_points = df.iloc[:2, :].values.tolist()
                if self.img is not None:
                    if self.extent is not None:
                        self.display_scaled_image()
                    else:
                        self.display_unscaled_image()
                if self.vel is not None:
                    self.display_velocity_field()
                for x, y in self.selected_points:
                    self.ax_frame.plot(x, y, 'ro', markersize=8)
                    self.ax_velocity.plot(x, y, 'ro', markersize=8)
                if len(self.selected_points) == 2:
                    (x1, y1), (x2, y2) = self.selected_points
                    self.ax_frame.plot([x1, x2], [y1, y2], 'r--', lw=2)
                    self.ax_velocity.plot([x1, x2], [y1, y2], 'r--', lw=2)
                    self.analyze_btn.config(state=tk.NORMAL)
                self.canvas_frame.draw()
                self.canvas_velocity.draw()
                self.status.config(text=f"Reloaded points from {os.path.basename(pf)}")
            except Exception as e:
                self.status.config(text=f"Error reloading points: {e}")
        else:
            self.status.config(text="No file selected.")

    def calculate_velocity_profile(self):
        if len(self.selected_points) != 2 or self.vel is None:
            self.status.config(text="Select two points and load velocity data.")
            return
        (x1, y1), (x2, y2) = self.selected_points
        num = 200
        x_line = np.linspace(x1, x2, num)
        y_line = np.linspace(y1, y2, num)
        v_line = interp.griddata((self.X, self.Y), self.vel, (x_line, y_line), method='linear')
        if np.any(np.isnan(v_line)):
            v_line[np.isnan(v_line)] = interp.griddata((self.X, self.Y), self.vel, (x_line[np.isnan(v_line)], y_line[np.isnan(v_line)]), method='nearest')
        dist = np.sqrt((x_line - x_line[0])**2 + (y_line - y_line[0])**2)
        mean_vel = np.nanmean(v_line)
        n_sections = simpledialog.askinteger("Number of Sections", "Enter number of sections:", minvalue=1, parent=self)
        if n_sections is None:
            self.status.config(text="Section number not provided.")
            return
        sections_v = np.array_split(v_line, n_sections)
        sections_dist = np.array_split(dist, n_sections)
        sec_avg = [np.mean(sec) for sec in sections_v]
        sec_center = [np.mean(secd) for secd in sections_dist]
        self.status.config(text=f"Mean velocity: {mean_vel:.4f} m/s")
        self.ax_profile.clear()
        self.ax_profile.plot(dist, v_line, '-o', markersize=3, label='Interpolated Velocity')
        self.ax_profile.set_xlabel("Distance (m)")
        self.ax_profile.set_ylabel("Velocity (m/s)")
        self.ax_profile.set_title("Velocity Profile")
        self.ax_profile.axhline(mean_vel, color='red', linestyle='--', label=f"Mean = {mean_vel:.2f} m/s")
        self.ax_profile.grid(True)
        for i in range(1, n_sections):
            self.ax_profile.axvline(x=sections_dist[i][0], color='gray', linestyle='--', alpha=0.5)
        self.ax_profile.plot(sec_center, sec_avg, 'ks', markersize=8, label="Section Averages")
        self.fig_profile.canvas.draw()
        ylim = self.ax_profile.get_ylim()
        offset = (ylim[1]-ylim[0]) * 0.03
        for cen, avg in zip(sec_center, sec_avg):
            self.ax_profile.text(cen, avg+offset, f"{avg:.2f}", fontsize=8, ha='center', va='bottom')
        self.ax_profile.legend()
        self.fig_profile.tight_layout()
        self.canvas_profile.draw()
        df_cross = pd.DataFrame({"Distance (m)": dist, "Velocity (m/s)": v_line})
        df_cross.to_csv(os.path.join(self.save_dir, "velocity_cross_section.csv"), index=False)
        df_sec = pd.DataFrame({"Section": list(range(1, n_sections+1)), "Section Center (m)": sec_center, "Average Velocity (m/s)": sec_avg})
        df_sec.to_csv(os.path.join(self.save_dir, "section_average_velocities.csv"), index=False)
        df_points = pd.DataFrame(self.selected_points, columns=["X", "Y"])
        df_points.to_csv(os.path.join(self.save_dir, "selected_points.csv"), index=False)

def main():
    root = tk.Tk()
    root.title("River Surface Velocity Analyzer")
    shared = SharedData()
    nb = ttk.Notebook(root)
    nb.pack(fill='both', expand=True)
    tab1 = VideoFrameTab(nb, shared)
    tab2 = CalibrationTab(nb, shared)
    tab3 = OpticalFlowTab(nb, shared)
    tab4 = VelocityAnalysisTab(nb, shared)
    nb.add(tab1, text="Step 1: Video Frame")
    nb.add(tab2, text="Step 2: Calibration")
    nb.add(tab3, text="Step 3: Optical Flow")
    nb.add(tab4, text="Step 4: Velocity Analysis")
    root.mainloop()

if __name__=="__main__":
    main()
