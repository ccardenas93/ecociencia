# Análisis de Cobertura y Uso del Suelo (LULC) — Ecuador

Este proyecto realiza un **análisis de cambios en la cobertura y uso del suelo** en Ecuador utilizando los datos de [MapBiomas Ecuador](https://ecuador.mapbiomas.org).
El objetivo es comparar mapas anuales (por ejemplo 2004–2023) para evaluar las transiciones entre coberturas naturales y antrópicas dentro de cuencas hidrográficas.

---

## Características principales

- Enmascaramiento automático de los mapas de MapBiomas usando los límites de cuencas (`HYBAS_ID`).
- Cálculo de estadísticas zonales (`zonal_stats`) para determinar el porcentaje de cada clase de cobertura dentro de una cuenca.
- Análisis de cambios entre dos años (por ejemplo, 2004 y 2023).
- Visualizaciones de los cambios por clase y por cuenca.
- Exportación de resultados resumidos a CSV.

---

## MapBiomas Ecuador

**Sitio web oficial:** https://ecuador.mapbiomas.org

MapBiomas Ecuador provee mapas anuales de cobertura y uso del suelo desde **1985 hasta 2023**.
Los mapas pueden descargarse en formato **GeoTIFF** desde el bucket público de Google Cloud.

### 🔗 Ejemplo: enlaces de descarga directa

Para descargar un mapa de cobertura de un año específico, copia el enlace correspondiente y pégalo en tu navegador:

| Año | Enlace directo |
|-----|----------------|
| 2023 | https://storage.googleapis.com/mapbiomas-public/initiatives/ecuador/coverage/ecuador_coverage_2023.tif |
| 2005 | https://storage.googleapis.com/mapbiomas-public/initiatives/ecuador/coverage/ecuador_coverage_2005.tif |
| 1985 | https://storage.googleapis.com/mapbiomas-public/initiatives/ecuador/coverage/ecuador_coverage_1985.tif |

Para otro año, simplemente reemplaza el número del año en el enlace.
Por ejemplo, para 1998:
https://storage.googleapis.com/mapbiomas-public/initiatives/ecuador/coverage/ecuador_coverage_1998.tif

---

## Flujo de trabajo del cuaderno (`LULC_analysis.ipynb`)

1. **Instalar dependencias**
   ```bash
   pip install rasterstats geopandas rasterio matplotlib
   ```
2. **Cargar cuencas hidrográficas (HydroBASINS nivel 8)** y reproyectarlas al CRS del ráster.
3. **Enmascarar** los mapas de MapBiomas con el límite de las cuencas.
4. **Calcular estadísticas zonales** para obtener porcentaje de cada clase de cobertura.
5. **Comparar** los resultados entre dos años.
6. **Exportar resultados** a `landcover_percentage.csv`.
7. **Visualizar** los cambios con gráficos de barras (por clase o por cuenca).

---

## Salidas principales

- **CSV:** `landcover_percentage.csv`
  Contiene las columnas:
  ```
  HYBAS_ID, pixel_id, clase_de_cobertura, pct_2004, pct_2023, change_pct
  ```

- **Gráficos:**
  - Cambios totales de cobertura en todo el país (2004–2023).
  - Cambios de cobertura por cuenca (`HYBAS_ID`).

---

## 🌿 Leyenda simplificada de clases de cobertura

| Código | Clase de cobertura |
|--------|--------------------|
| 1.1 | Bosque |
| 1.2 | Bosque abierto |
| 1.3 | Manglar |
| 1.4 | Bosque inundable |
| 2.2 | Herbazal |
| 3.5 | Mosaico de agricultura y/o pastos |
| 4.2 | Infraestructura urbana |
| 4.3 | Minería |
| 5.1 | Río, lago u océano |
| … | … |

(Consulta el cuaderno para ver la leyenda completa utilizada en MapBiomas Ecuador.)

---

## 📈 Ejemplos de gráficos

### 🔸 Cambios totales de cobertura (2004–2023)
![Ejemplo de cambio total](https://user-images.githubusercontent.com/example/LULC_total_change.png)

Gráfico de barras horizontales que muestra el cambio total en porcentaje de cada clase de cobertura a nivel nacional.
Los valores positivos indican **ganancia** de área, y los negativos, **pérdida**.

---

### 🔸 Cambios por cuenca hidrográfica
![Ejemplo por cuenca](https://user-images.githubusercontent.com/example/LULC_basin_change.png)

Cada gráfico muestra los cambios de cobertura (en %) para una cuenca específica (`HYBAS_ID`).

---

## 🧾 Cita recomendada

Si utilizas los datos de MapBiomas Ecuador, por favor cita:

**MapBiomas Ecuador Project — Colección 2.0**  
Disponible en: https://ecuador.mapbiomas.org

---

## 👨‍💻 Autor

**Carlos Cárdenas**  
Análisis de Datos y Modelamiento Geoespacial — Ecociencia  
GitHub: https://github.com/ccardenas93

---

## 🪶 Licencia

Este proyecto se distribuye bajo la **Licencia MIT**.
Los datos de MapBiomas están sujetos a los Términos de Uso de MapBiomas: https://mapbiomas.org/termos-de-uso
