# Ecociencia

Repositorio que agrupa distintos flujos de trabajo, notebooks y aplicaciones
para el análisis hidrológico, geomorfológico y ambiental en Latinoamérica.
Cada carpeta contiene un proyecto autónomo con sus propios datos, scripts y
resultados. Este documento ofrece una visión general para ayudarte a explorar
rápidamente el código y reproducir los estudios.

## Tabla de contenidos

- [Estructura general](#estructura-general)
- [Requisitos comunes](#requisitos-comunes)
- [Proyectos](#proyectos)
  - [1. Análisis Morfométrico](#1-análisis-morfométrico)
  - [2. Identificación del cauce principal](#2-identificación-del-cauce-principal)
  - [3. Análisis LULC (Ecuador)](#3-análisis-lulc-ecuador)
  - [4. Velocimetría con óptica remota](#4-velocimetría-con-óptica-remota)
  - [5. Visualizador de batimetría sintética](#5-visualizador-de-batimetría-sintética)
- [Contribuciones y contacto](#contribuciones-y-contacto)

## Estructura general

```
.
├── Analisis_morfometrico/   # Notebook y resultados para métricas de cuencas
├── Cauce_Principal/         # Notebook para extraer el cauce principal por cuenca
├── LULC_Analysis/           # Análisis de uso/cobertura del suelo con MapBiomas
├── Velocimetria/            # Aplicación de escritorio para análisis de flujo óptico
├── enhanced-bathymetry/     # Aplicación web (Next.js) para batimetría sintética
└── README.md                # Este documento
```

Cada directorio incluye notebooks (`.ipynb`), scripts o aplicaciones listos para
usarse. Algunos proyectos descargan datos desde GitHub al momento de la
ejecución, por lo que es recomendable trabajar con un entorno virtual y contar
con conexión a internet.

## Requisitos comunes

- **Python 3.10+** con `pip` para los notebooks y scripts.
- **Google Earth Engine** (cuenta activada) para los análisis que lo requieran.
- **Node.js 18+ / pnpm o npm** para ejecutar la aplicación web de batimetría.
- Dependencias específicas listadas en cada proyecto (ver más abajo).

Se recomienda crear entornos aislados (`venv`, `conda`, `pipenv`) antes de
instalar paquetes.

## Proyectos

### 1. Análisis Morfométrico

Carpeta: [`Analisis_morfometrico/`](Analisis_morfometrico)

Notebook principal: `morph_analysis.ipynb`. Calcula métricas morfométricas e
hidrológicas de cuencas hidrográficas con datos de HydroSHEDS y modelos de
Google Earth Engine. El notebook guía al usuario en la autenticación, selección
interactiva del área de estudio, cálculo de métricas (área, perímetro, factor de
forma, pendientes, tiempo de concentración, longitud del cauce principal) y
exportación a CSV/GeoJSON.【F:Analisis_morfometrico/README.md†L1-L121】

**Recursos clave**

- Resultados tabulares: `basin_metrics_with_network.csv`.
- Instrucciones detalladas y dependencias en
  [`Analisis_morfometrico/README.md`](Analisis_morfometrico/README.md).
- Requiere librerías como `earthengine-api`, `geemap`, `networkx`, `geopandas`
y `pandas`.

### 2. Identificación del cauce principal

Carpeta: [`Cauce_Principal/`](Cauce_Principal)

Notebook principal: `Cauce_principal.ipynb`. Automatiza la descarga de cuencas e
hidrografía desde el repositorio, empareja cada cuenca con los ríos que la
intersectan y selecciona el cauce principal según el orden de jerarquía (`ORD_CLAS`),
caudal medio (`DIS_AV_CMS`) y longitud total dentro de la cuenca. Genera un
GeoPackage y un CSV con el río seleccionado para cada `BASIN_ID`.【F:Cauce_Principal/Cauce_principal.ipynb†L9-L140】

**Entradas y salidas**

- Descargas automáticas de `Cuencas_n5` (shapefile) y `rivers_RAISG_corrected2.gpkg`.
- Resultados en `principal_river_by_basin1.gpkg` y
  `principal1_river_lengths.csv` dentro del mismo directorio.

### 3. Análisis LULC (Ecuador)

Carpeta: [`LULC_Analysis/`](LULC_Analysis)

Notebook principal: `LULC_analysis.ipynb`. Evalúa los cambios de cobertura y uso
del suelo en Ecuador utilizando la colección MapBiomas (2004–2023). Realiza
máscaras por cuenca HydroBASINS, calcula estadísticas zonales y genera gráficos
y tablas de transición. La carpeta incluye ejemplos de imágenes exportadas y un
README con instrucciones paso a paso.【F:LULC_Analysis/README_LULC_Ecuador.md†L1-L108】

**Recursos clave**

- Datos descargados: `ecuador_coverage_2005.tif`, `ecuador_coverage_2023.tif` y
  mosaicos en `mapbiomas_data/`.
- Salidas principales: `landcover_percentage_2005_2023.csv` y gráficos en
  `Images/`.
- Dependencias sugeridas: `rasterstats`, `geopandas`, `rasterio`, `matplotlib`.

### 4. Velocimetría con óptica remota

Carpeta: [`Velocimetria/`](Velocimetria)

Aplicación de escritorio (`Script.py`) construida con Tkinter y OpenCV para:

1. Seleccionar y visualizar vídeos de campo.
2. Calibrar la escala espacial a partir de una imagen de referencia.
3. Ejecutar análisis de flujo óptico con la librería `opyf`, obtener CSVs y
   mapas de velocidad.
4. Ajustar velocidades por sección y visualizar resultados en tiempo real.

Las dependencias requeridas se listan en `requirements.txt` (OpenCV, NumPy,
Matplotlib, SciPy, Pandas, Tkinter y `opyf`).【F:Velocimetria/Script.py†L1-L133】【F:Velocimetria/requirements.txt†L1-L8】

### 5. Visualizador de batimetría sintética

Carpeta: [`enhanced-bathymetry/`](enhanced-bathymetry)

Aplicación web desarrollada con Next.js 15, Tailwind CSS y Recharts para crear y
analizar perfiles batimétricos sintéticos. Permite configurar distancias,
profundidades, velocidades de flujo y factores de corrección, calculando áreas,
caudales por sección y visualizaciones interactivas en un gráfico responsivo.

**Scripts útiles**

- `pnpm install` o `npm install` para instalar dependencias definidas en
  `package.json`.
- `pnpm dev` / `npm run dev` para levantar el entorno de desarrollo.
- `pnpm build` / `npm run build` para generar la versión de producción.【F:enhanced-bathymetry/package.json†L1-L38】【F:enhanced-bathymetry/fully-customizable-bathymetry.tsx†L1-L133】

## Contribuciones y contacto

- Cada proyecto incluye enlaces a notebooks en Google Colab o instrucciones
  detalladas para reproducir los análisis.
- Se agradecen issues, pull requests o sugerencias mediante el repositorio de
  GitHub.
- Autor principal: **Carlos Cárdenas** ([@ccardenas93](https://github.com/ccardenas93)).

¡Explora las carpetas, ejecuta los notebooks y adapta las herramientas a tus
propios estudios ambientales!
