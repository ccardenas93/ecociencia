# Análisis Morfométrico de Cuencas Hidrográficas

[![Abrir en Colab](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/ccardenas93/ecociencia/blob/main/Analisis_morfometrico/morph_analysis.ipynb)

Este proyecto realiza un **análisis morfométrico completo** de cuencas hidrográficas utilizando Google Earth Engine y herramientas de análisis geoespacial. El objetivo es calcular métricas hidrológicas y morfométricas para caracterizar la forma, pendiente y comportamiento hidrológico de cuencas hidrográficas.

---

## Características Principales

- **Análisis morfométrico completo** de cuencas hidrográficas utilizando datos globales
- **Cálculo de métricas hidrológicas** incluyendo factor de forma, pendientes, tiempo de concentración y coeficientes de compacidad
- **Análisis de redes fluviales** para determinar tramos principales y características de drenaje
- **Visualización interactiva** con mapas dinámicos que permiten selección de áreas de estudio personalizadas
- **Exportación de resultados** a formatos CSV y GeoJSON para análisis posteriores

---

## Fuentes de Datos

### Google Earth Engine
- **Cuencas hidrográficas**: `WWF/HydroSHEDS/v1/Basins/hybas_8` (HydroBASINS nivel 8)
- **Redes fluviales**: `WWF/HydroSHEDS/v1/FreeFlowingRivers` (HydroRIVERS)
- **Modelo digital de elevación**: `CGIAR/SRTM90_V4` (SRTM 90m)

### Datos de Salida
- **Archivo CSV**: `basin_metrics_with_network.csv` con métricas calculadas por cuenca
- **Archivos GeoJSON**: Geometrías de cuencas y redes fluviales exportadas

---

## Métricas Calculadas

### Métricas Morfométricas Básicas
- **Área** (km²): Superficie total de la cuenca
- **Perímetro** (km): Longitud del perímetro de la cuenca
- **Factor de forma**: Relación entre el ancho y largo de la cuenca
- **Coeficiente de compacidad**: Medida de la circularidad de la cuenca
- **Radio de circularidad**: Relación entre el área de la cuenca y el área de un círculo con el mismo perímetro

### Métricas de Pendiente
- **Pendiente media** (%): Pendiente promedio de la cuenca
- **Pendiente mínima** (%): Pendiente mínima encontrada
- **Pendiente máxima** (%): Pendiente máxima encontrada

### Métricas Hidrológicas
- **Tiempo de concentración** (horas): Tiempo estimado para que el agua recorra la cuenca
- **Tramo principal** (km): Longitud del tramo fluvial más largo dentro de la cuenca

---

## Dependencias del Sistema

### Librerías Principales
- `earthengine-api`: Interfaz para Google Earth Engine
- `geemap`: Herramientas de análisis geoespacial para Earth Engine
- `folium`: Creación de mapas interactivos
- `networkx`: Análisis de redes y grafos
- `geopandas`: Manipulación de datos geoespaciales
- `pandas`: Análisis de datos tabulares

### Instalación
```bash
pip install earthengine-api geemap folium networkx geopandas pandas
```

---

## Flujo de Trabajo

### 1. Configuración Inicial
- Autenticación con Google Earth Engine
- Instalación y carga de dependencias
- Montaje de Google Drive (opcional)

### 2. Carga de Datos
- Carga de cuencas hidrográficas (HydroBASINS)
- Carga de modelo digital de elevación (SRTM)
- Carga de redes fluviales (HydroRIVERS)

### 3. Definición del Área de Estudio
- Creación de mapa interactivo
- Selección manual de área de análisis mediante polígonos
- Intersección de cuencas con el área de estudio

### 4. Cálculo de Métricas
- Cálculo de métricas morfométricas básicas
- Análisis de pendientes y elevaciones
- Cálculo de métricas hidrológicas
- Análisis de redes fluviales

### 5. Exportación de Resultados
- Exportación a formato CSV
- Exportación de geometrías a GeoJSON
- Visualización de resultados en mapas interactivos

---

## Estructura de Archivos de Salida

### Archivo CSV Principal
El archivo `basin_metrics_with_network.csv` contiene las siguientes columnas:

| Columna | Descripción | Unidad |
|---------|-------------|--------|
| HYBAS_ID | Identificador único de la cuenca | - |
| Area_km2 | Área de la cuenca | km² |
| Perimeter_km | Perímetro de la cuenca | km |
| Shape_Factor | Factor de forma | - |
| Mean_Slope | Pendiente media | % |
| Min_Slope | Pendiente mínima | % |
| Max_Slope | Pendiente máxima | % |
| Concentration_Time | Tiempo de concentración | horas |
| Compactness_Coeff | Coeficiente de compacidad | - |
| Circularity_Ratio | Radio de circularidad | - |
| Main_Stream_Length | Longitud del tramo principal | km |

---

## Uso del Notebook

### Requisitos Previos
1. Cuenta de Google Earth Engine activada
2. Autenticación configurada en el entorno de trabajo
3. Acceso a Google Drive (opcional, para guardar resultados)

### Pasos de Ejecución
1. **Ejecutar celdas de instalación** de dependencias
2. **Autenticar** con Google Earth Engine
3. **Definir área de estudio** usando el mapa interactivo
4. **Ejecutar análisis** de métricas morfométricas
5. **Exportar resultados** a archivos CSV y GeoJSON

### Personalización
- Modificar el área de estudio dibujando polígonos en el mapa interactivo
- Ajustar parámetros de cálculo de métricas
- Personalizar visualizaciones y exportaciones

---

## Aplicaciones

### Investigación Científica
- Análisis hidrológico de cuencas
- Estudios de morfometría fluvial
- Investigación en geomorfología

### Gestión de Recursos Hídricos
- Caracterización de cuencas hidrográficas
- Planificación de infraestructura hidráulica
- Evaluación de riesgos hidrológicos

### Educación y Capacitación
- Enseñanza de conceptos hidrológicos
- Capacitación en análisis geoespacial
- Demostración de herramientas de Earth Engine

---

## Consideraciones Técnicas

### Limitaciones
- Dependencia de conectividad a internet para Google Earth Engine
- Limitaciones de memoria en procesamiento de grandes áreas
- Precisión limitada por resolución de datos SRTM (90m)

### Optimizaciones
- Uso de escalas apropiadas para el análisis
- Procesamiento por lotes para múltiples cuencas
- Optimización de consultas a Earth Engine

---

## Cita Recomendada

Si utiliza este análisis en investigaciones, por favor cite:

**Análisis Morfométrico de Cuencas Hidrográficas**  
Utilizando Google Earth Engine y datos de HydroSHEDS  
Disponible en: https://github.com/ccardenas93/ecociencia

---

## Autor

**Carlos Cárdenas**  
GitHub: https://github.com/ccardenas93

---

## Licencia
 Los datos utilizados están sujetos a las licencias de sus respectivos proveedores:
- **HydroSHEDS**: WWF (World Wildlife Fund)
- **SRTM**: NASA/JPL
- **Google Earth Engine**: Google Cloud Platform
