"use client"

import { useState, useEffect, useRef } from "react"
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Area,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts"

const FullyCustomizableBathymetry = () => {
  // State for customizations
  const [totalDistance, setTotalDistance] = useState(20)
  const [sectionsCount, setSectionsCount] = useState(11)
  const [customMode, setCustomMode] = useState(false)
  const [waterSpeed, setWaterSpeed] = useState(1.0)
  const [velocityType, setVelocityType] = useState("average")
  const [correctionFactor, setCorrectionFactor] = useState(0.85)

  // Dynamic data states
  const [distanceValues, setDistanceValues] = useState([])
  const [depthValues, setDepthValues] = useState([])
  const [customSections, setCustomSections] = useState([
    { distance: 0, depth: 0 },
    { distance: 2, depth: 33 },
    { distance: 4, depth: 27 },
    { distance: 6, depth: 53 },
    { distance: 8, depth: 84 },
    { distance: 10, depth: 65 },
    { distance: 12, depth: 58 },
    { distance: 14, depth: 68 },
    { distance: 16, depth: 83 },
    { distance: 18, depth: 150 },
    { distance: 20, depth: 150 },
  ])

  // Section speeds (new state)
  const [sectionSpeeds, setSectionSpeeds] = useState([])

  // Initialize or update evenly spaced sections
  useEffect(() => {
    if (!customMode) {
      const newDistances = []
      const newDepths = []

      if (sectionsCount > 1) {
        const step = totalDistance / (sectionsCount - 1)

        for (let i = 0; i < sectionsCount; i++) {
          const distance = i * step
          newDistances.push(Math.round(distance * 100) / 100) // Round to 2 decimal places

          // If we already have depth values, try to preserve them or interpolate
          if (i < depthValues.length) {
            newDepths.push(depthValues[i])
          } else {
            newDepths.push(0) // Default to 0 for new sections
          }
        }
      }

      setDistanceValues(newDistances)
      setDepthValues(newDepths)

      // Initialize section speeds with default water speed
      const newSpeeds = new Array(newDistances.length).fill(waterSpeed)
      setSectionSpeeds(newSpeeds)
    }
  }, [totalDistance, sectionsCount, customMode])

  // Initialize section speeds when water speed changes
  useEffect(() => {
    if (!customMode) {
      const newSpeeds = new Array(distanceValues.length).fill(waterSpeed)
      setSectionSpeeds(newSpeeds)
    } else {
      const newSpeeds = new Array(customSections.length).fill(waterSpeed)
      setSectionSpeeds(newSpeeds)
    }
  }, [waterSpeed, customMode, distanceValues.length, customSections.length])

  // Prepare data for chart
  const chartData = customMode
    ? customSections
    : distanceValues.map((dist, index) => ({
        distance: dist,
        depth: depthValues[index] || 0,
      }))

  // Calculate the area using the trapezoidal rule
  const calculateArea = () => {
    const data = customMode ? customSections : chartData

    if (data.length < 2) return 0

    // Sort data by distance to ensure correct area calculation
    const sortedData = [...data].sort((a, b) => a.distance - b.distance)

    let area = 0
    for (let i = 0; i < sortedData.length - 1; i++) {
      const width = sortedData[i + 1].distance - sortedData[i].distance
      const avgHeight = (sortedData[i].depth + sortedData[i + 1].depth) / 2
      area += width * avgHeight
    }

    // Convert area from m*cm to m²
    return area / 100
  }

  // Get effective velocity based on type and correction factor
  const getEffectiveVelocity = () => {
    if (velocityType === "average") {
      return waterSpeed
    } else {
      return waterSpeed * correctionFactor
    }
  }

  // Calculate section areas and discharges
  const calculateSectionData = () => {
    const data = customMode ? customSections : chartData

    if (data.length < 2) return []

    // Sort data by distance to ensure correct calculation
    const sortedData = [...data].sort((a, b) => a.distance - b.distance)

    const sectionData = []
    let totalArea = 0
    let totalDischarge = 0

    for (let i = 0; i < sortedData.length - 1; i++) {
      const width = sortedData[i + 1].distance - sortedData[i].distance
      const avgDepth = (sortedData[i].depth + sortedData[i + 1].depth) / 2
      const sectionArea = (width * avgDepth) / 100 // Convert to m²

      // Get section speed (either from state or default to effective velocity)
      const sectionSpeed =
        sectionSpeeds[i] !== undefined
          ? velocityType === "average"
            ? sectionSpeeds[i]
            : sectionSpeeds[i] * correctionFactor
          : getEffectiveVelocity()

      const sectionDischarge = sectionArea * sectionSpeed

      totalArea += sectionArea
      totalDischarge += sectionDischarge

      sectionData.push({
        startDistance: sortedData[i].distance,
        endDistance: sortedData[i + 1].distance,
        width,
        avgDepth,
        area: sectionArea,
        speed: sectionSpeed,
        discharge: sectionDischarge,
      })
    }

    return {
      sections: sectionData,
      totalArea,
      totalDischarge,
      averageDischarge: totalDischarge / sectionData.length,
    }
  }

  const areaInSquareMeters = calculateArea()
  const effectiveVelocity = getEffectiveVelocity()
  const discharge = areaInSquareMeters * effectiveVelocity
  const sectionData = calculateSectionData()

  // Handle depth change for regular sections
  const handleDepthChange = (index, value) => {
    const newValue = Number.parseFloat(value) || 0
    const newDepths = [...depthValues]
    newDepths[index] = newValue
    setDepthValues(newDepths)
  }

  // Handle water speed change
  const handleSpeedChange = (value) => {
    const newValue = Number.parseFloat(value) || 0
    setWaterSpeed(newValue)
  }

  // Handle section speed change
  const handleSectionSpeedChange = (index, value) => {
    const newValue = Number.parseFloat(value) || 0
    const newSpeeds = [...sectionSpeeds]
    newSpeeds[index] = newValue
    setSectionSpeeds(newSpeeds)
  }

  // Add new custom section
  const addCustomSection = () => {
    // Default to middle of current range or 0 if none exist
    let newDistance = 0
    if (customSections.length > 0) {
      const maxDist = Math.max(...customSections.map((s) => s.distance))
      newDistance = maxDist + 2 // Add 2m beyond current max
    }

    setCustomSections([...customSections, { distance: newDistance, depth: 0 }])

    // Add default speed for the new section
    setSectionSpeeds([...sectionSpeeds, waterSpeed])
  }

  // Remove a custom section
  const removeCustomSection = (index) => {
    if (customSections.length <= 2) {
      alert("You need at least two sections to calculate area.")
      return
    }

    const newSections = [...customSections]
    newSections.splice(index, 1)
    setCustomSections(newSections)

    // Remove speed for the deleted section
    const newSpeeds = [...sectionSpeeds]
    newSpeeds.splice(index, 1)
    setSectionSpeeds(newSpeeds)
  }

  // Update custom section
  const updateCustomSection = (index, field, value) => {
    const newValue = Number.parseFloat(value) || 0
    const newSections = [...customSections]
    newSections[index] = {
      ...newSections[index],
      [field]: newValue,
    }
    setCustomSections(newSections)
  }

  // Switch to custom mode
  const switchToCustomMode = () => {
    if (!customMode) {
      // Initialize custom sections from current data
      const initialCustomSections = distanceValues.map((dist, index) => ({
        distance: dist,
        depth: depthValues[index] || 0,
      }))
      setCustomSections(initialCustomSections)
    }
    setCustomMode(!customMode)
  }

  // Reset values
  const resetValues = () => {
    if (customMode) {
      setCustomSections([
        { distance: 0, depth: 0 },
        { distance: 2, depth: 33 },
        { distance: 4, depth: 27 },
        { distance: 6, depth: 53 },
        { distance: 8, depth: 84 },
        { distance: 10, depth: 65 },
        { distance: 12, depth: 58 },
        { distance: 14, depth: 68 },
        { distance: 16, depth: 83 },
        { distance: 18, depth: 150 },
        { distance: 20, depth: 150 },
      ])
    } else {
      setTotalDistance(20)
      setSectionsCount(11)
      // Default depths will be set by the useEffect
    }
    setWaterSpeed(1.0)
    setVelocityType("average")
    setCorrectionFactor(0.85)

    // Reset section speeds
    const newSpeeds = new Array(customMode ? customSections.length : distanceValues.length).fill(1.0)
    setSectionSpeeds(newSpeeds)
  }

  // Export data as JSON file
  const exportToJson = () => {
    const data = {
      totalDistance,
      sectionsCount,
      customMode,
      waterSpeed,
      velocityType,
      correctionFactor,
      distanceValues,
      depthValues,
      customSections,
      sectionSpeeds,
    }

    const jsonString = JSON.stringify(data, null, 2)
    const blob = new Blob([jsonString], { type: "application/json" })
    const url = URL.createObjectURL(blob)

    const a = document.createElement("a")
    a.href = url
    a.download = "bathymetry-data.json"
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // Import data from JSON file
  const importFromJson = (event) => {
    const file = event.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target.result)

        // Update state with imported data
        if (data.totalDistance) setTotalDistance(data.totalDistance)
        if (data.sectionsCount) setSectionsCount(data.sectionsCount)
        if (data.customMode !== undefined) setCustomMode(data.customMode)
        if (data.waterSpeed) setWaterSpeed(data.waterSpeed)
        if (data.velocityType) setVelocityType(data.velocityType)
        if (data.correctionFactor) setCorrectionFactor(data.correctionFactor)
        if (data.distanceValues) setDistanceValues(data.distanceValues)
        if (data.depthValues) setDepthValues(data.depthValues)
        if (data.customSections) setCustomSections(data.customSections)
        if (data.sectionSpeeds) setSectionSpeeds(data.sectionSpeeds)

        // Reset file input
        fileInputRef.current.value = ""

        alert("Data imported successfully!")
      } catch (error) {
        console.error("Error importing data:", error)
        alert("Error importing data. Please check the file format.")
      }
    }
    reader.readAsText(file)
  }

  const fileInputRef = useRef(null)

  return (
    <div className="flex flex-col p-4 space-y-6 w-full">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold">Cross Section Discharge Tool</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-w-2xl mx-auto">
          <div className="bg-blue-50 p-2 rounded">
            <span className="font-semibold">Cross-sectional area:</span>
            <span className="font-bold text-blue-600">{areaInSquareMeters.toFixed(2)} m²</span>
          </div>
          <div className="bg-green-50 p-2 rounded">
            <span className="font-semibold">Discharge (Q):</span>
            <span className="font-bold text-green-600">{discharge.toFixed(2)} m³/s</span>
          </div>
        </div>
      </div>

      <div className="border p-4 rounded bg-gray-50">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="text-lg font-semibold">Section Configuration</div>

          <div className="flex items-center">
            <button
              onClick={switchToCustomMode}
              className={`px-4 py-2 rounded ${customMode ? "bg-blue-600 text-white" : "bg-gray-200"}`}
            >
              {customMode ? "Using Custom Sections" : "Switch to Custom Sections"}
            </button>
          </div>
        </div>

        {!customMode && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center space-x-4">
              <label className="w-40">Total Distance:</label>
              <input
                type="number"
                min="1"
                step="1"
                value={totalDistance}
                onChange={(e) => setTotalDistance(Number.parseFloat(e.target.value) || 1)}
                className="w-24 p-1 border rounded"
              />
              <span>meters</span>
            </div>

            <div className="flex items-center space-x-4">
              <label className="w-40">Number of Sections:</label>
              <input
                type="number"
                min="2"
                step="1"
                value={sectionsCount}
                onChange={(e) => setSectionsCount(Math.max(2, Number.parseInt(e.target.value) || 2))}
                className="w-24 p-1 border rounded"
              />
            </div>
          </div>
        )}
      </div>

      <div className="h-64 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="distance"
              label={{ value: "Distance (m)", position: "insideBottom", offset: -5 }}
              domain={[0, "auto"]}
            />
            <YAxis label={{ value: "Depth (cm)", angle: -90, position: "insideLeft" }} domain={[0, "auto"]} reversed />
            <Tooltip
              formatter={(value) => [`${value} cm`, "Depth"]}
              labelFormatter={(value) => `Distance: ${value} m`}
            />
            <Legend />
            <ReferenceLine y={0} stroke="#000" strokeWidth={2} label="Water Surface" />
            <Area type="monotone" dataKey="depth" stroke="#0066cc" fill="#0099ff" fillOpacity={0.6} name="Depth" />
            <Line
              type="monotone"
              dataKey="depth"
              stroke="#0066cc"
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              name="Depth"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="border p-4 rounded bg-gray-50">
        <div className="text-lg font-semibold mb-4">Water Velocity Input</div>

        <div className="mb-4 p-3 bg-yellow-50 rounded border border-yellow-200">
          <div className="flex items-center space-x-4 mb-2">
            <label className="font-medium">Velocity Type:</label>
            <div className="flex space-x-4">
              <label className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="velocityType"
                  checked={velocityType === "average"}
                  onChange={() => setVelocityType("average")}
                />
                <span>Average Velocity</span>
              </label>
              <label className="flex items-center space-x-1">
                <input
                  type="radio"
                  name="velocityType"
                  checked={velocityType === "surface"}
                  onChange={() => setVelocityType("surface")}
                />
                <span>Surface Velocity</span>
              </label>
            </div>
          </div>

          {velocityType === "surface" && (
            <div className="flex items-center space-x-4 mt-2">
              <label className="w-48">Correction Factor:</label>
              <input
                type="range"
                min="0.6"
                max="0.9"
                step="0.01"
                value={correctionFactor}
                onChange={(e) => setCorrectionFactor(Number.parseFloat(e.target.value))}
                className="flex-1"
              />
              <div className="flex items-center">
                <input
                  type="number"
                  min="0.6"
                  max="0.9"
                  step="0.01"
                  value={correctionFactor}
                  onChange={(e) => setCorrectionFactor(Number.parseFloat(e.target.value) || 0.85)}
                  className="w-20 p-1 border rounded"
                />
              </div>
            </div>
          )}

          <div className="mt-2 text-sm text-gray-600">
            {velocityType === "surface"
              ? `Surface velocity is being multiplied by ${correctionFactor} to estimate average velocity`
              : "Using directly measured or estimated average velocity"}
          </div>
        </div>

        <div className="flex items-center space-x-4 mb-6">
          <label className="w-32">Water Speed:</label>
          <input
            type="range"
            min="0"
            max="5"
            step="0.1"
            value={waterSpeed}
            onChange={(e) => handleSpeedChange(e.target.value)}
            className="flex-1"
          />
          <div className="flex items-center">
            <input
              type="number"
              min="0"
              step="0.1"
              value={waterSpeed}
              onChange={(e) => handleSpeedChange(e.target.value)}
              className="w-20 p-1 border rounded"
            />
            <span className="ml-2">m/s</span>
          </div>
        </div>

        <div className="text-lg font-semibold mb-2">{customMode ? "Custom Sections" : "Adjust Depth Values (cm)"}</div>

        {customMode ? (
          <div className="space-y-4">
            <div className="overflow-y-auto max-h-64">
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    <th className="p-2 border bg-gray-100">Distance (m)</th>
                    <th className="p-2 border bg-gray-100">Depth (cm)</th>
                    <th className="p-2 border bg-gray-100">Speed (m/s)</th>
                    <th className="p-2 border bg-gray-100">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {customSections.map((section, index) => (
                    <tr key={index}>
                      <td className="p-2 border">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={section.distance}
                          onChange={(e) => updateCustomSection(index, "distance", e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          min="0"
                          step="1"
                          value={section.depth}
                          onChange={(e) => updateCustomSection(index, "depth", e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border">
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={sectionSpeeds[index] || waterSpeed}
                          onChange={(e) => handleSectionSpeedChange(index, e.target.value)}
                          className="w-full p-1 border rounded"
                        />
                      </td>
                      <td className="p-2 border text-center">
                        <button
                          onClick={() => removeCustomSection(index)}
                          className="px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex justify-center">
              <button
                onClick={addCustomSection}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Add New Section
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {distanceValues.map((x, index) => (
              <div key={index} className="flex flex-col space-y-2">
                <div className="flex items-center space-x-2">
                  <label className="w-24">{x}m:</label>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    value={depthValues[index] || 0}
                    onChange={(e) => handleDepthChange(index, e.target.value)}
                    className="flex-1"
                  />
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={depthValues[index] || 0}
                    onChange={(e) => handleDepthChange(index, e.target.value)}
                    className="w-16 p-1 border rounded"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <label className="w-24 text-sm">Speed:</label>
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={sectionSpeeds[index] || waterSpeed}
                    onChange={(e) => handleSectionSpeedChange(index, e.target.value)}
                    className="w-16 p-1 border rounded"
                  />
                  <span className="text-sm">m/s</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button onClick={resetValues} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
            Reset to Original Values
          </button>
        </div>
      </div>

      {/* Section Data Table */}
      <div className="border p-4 rounded bg-gray-50">
        <h3 className="text-lg font-semibold mb-4">Section Data</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="p-2 border bg-gray-100">Section</th>
                <th className="p-2 border bg-gray-100">Distance (m)</th>
                <th className="p-2 border bg-gray-100">Width (m)</th>
                <th className="p-2 border bg-gray-100">Avg Depth (cm)</th>
                <th className="p-2 border bg-gray-100">Area (m²)</th>
                <th className="p-2 border bg-gray-100">Speed (m/s)</th>
                <th className="p-2 border bg-gray-100">Discharge (m³/s)</th>
              </tr>
            </thead>
            <tbody>
              {sectionData.sections &&
                sectionData.sections.map((section, index) => (
                  <tr key={index}>
                    <td className="p-2 border text-center">{index + 1}</td>
                    <td className="p-2 border text-center">
                      {section.startDistance} - {section.endDistance}
                    </td>
                    <td className="p-2 border text-center">{section.width.toFixed(2)}</td>
                    <td className="p-2 border text-center">{section.avgDepth.toFixed(2)}</td>
                    <td className="p-2 border text-center">{section.area.toFixed(3)}</td>
                    <td className="p-2 border text-center">{section.speed.toFixed(2)}</td>
                    <td className="p-2 border text-center">{section.discharge.toFixed(3)}</td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="bg-blue-50">
                <td colSpan={4} className="p-2 border font-semibold text-right">
                  Totals:
                </td>
                <td className="p-2 border text-center font-semibold">{sectionData.totalArea?.toFixed(3) || 0}</td>
                <td className="p-2 border text-center font-semibold">-</td>
                <td className="p-2 border text-center font-semibold">{sectionData.totalDischarge?.toFixed(3) || 0}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      <div className="border p-4 rounded bg-blue-50">
        <h3 className="text-lg font-semibold mb-2">Hydrological Information</h3>
        <p>Discharge is calculated using the formula: Q = A × v</p>
        <ul className="list-disc ml-6 mt-2">
          <li>Q = Discharge (m³/s)</li>
          <li>A = Cross-sectional area (m²) = {areaInSquareMeters.toFixed(2)} m²</li>
          <li>
            v = Water velocity (m/s) ={" "}
            {velocityType === "surface"
              ? `${waterSpeed.toFixed(2)} m/s (surface) × ${correctionFactor} (correction) = ${effectiveVelocity.toFixed(2)} m/s (average)`
              : `${waterSpeed.toFixed(2)} m/s (average)`}
          </li>
        </ul>
        <p className="mt-2">
          Current discharge: <span className="font-bold">{discharge.toFixed(2)} m³/s</span>
        </p>

        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-3 bg-white rounded border">
            <h4 className="font-semibold">Discharge Calculations</h4>
            <ul className="list-disc ml-6 mt-1">
              <li>
                Original calculation: <span className="font-bold">{discharge.toFixed(2)} m³/s</span>
              </li>
              <li>
                Section-based calculation:{" "}
                <span className="font-bold">{sectionData.totalDischarge?.toFixed(2) || 0} m³/s</span>
              </li>
              <li>
                Average section discharge:{" "}
                <span className="font-bold">{sectionData.averageDischarge?.toFixed(2) || 0} m³/s</span>
              </li>
            </ul>
          </div>

          <div className="p-3 bg-white rounded border">
            <h4 className="font-semibold">Velocity Correction Factors in Hydrology</h4>
            <p className="mt-1">According to hydrological literature:</p>
            <ul className="list-disc ml-6 mt-1">
              <li>Surface velocity is typically faster than the average velocity throughout the cross-section</li>
              <li>
                For natural rivers and streams, average velocity typically ranges from 0.8 to 0.9 of surface velocity
                (depending on channel characteristics)
              </li>
              <li>For artificial channels with smooth bottoms, a factor of 0.85 to 0.9 is common</li>
              <li>For shallow rocky streams, a factor of 0.6 to 0.75 may be more appropriate</li>
              <li>
                The default value of 0.85 is a widely accepted approximation for natural channels under normal flow
                conditions
              </li>
            </ul>
            <p className="mt-2 text-sm italic">
              References: USGS Water-Supply Paper 2175, ISO 748, WMO Guide to Hydrological Practices
            </p>
          </div>
        </div>
      </div>

      <div className="border p-4 rounded bg-gray-100 mt-6">
        <h3 className="text-lg font-semibold mb-4">Save & Load Data</h3>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={exportToJson}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
            Save as JSON
          </button>

          <div className="relative">
            <input
              type="file"
              ref={fileInputRef}
              onChange={importFromJson}
              accept=".json"
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z"
                  clipRule="evenodd"
                  transform="rotate(180 10 10)"
                />
              </svg>
              Load from JSON
            </button>
          </div>
        </div>
        <p className="text-sm text-gray-600 mt-2">
          Save your current configuration to a JSON file or load a previously saved configuration.
        </p>
      </div>
    </div>
  )
}

export default FullyCustomizableBathymetry

