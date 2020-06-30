# Edit OS Vector Tile Styles in Maputnik


Open https://maputnik.github.io/editor/

In `Data Sources`:
- Delete the existing Active Sources
- Add New Source with 

| | |
| --- | --- |
| Source ID | `"esri"` |
| Source Type | `Vector (XYZ URLs)` |
| 1st Tile URL | `https://osdatahubapi.os.uk/OSVectorTileAPI/vts/v1/tile/{z}/{y}/{x}.pbf?srs=3857&key={YOUR KEY}` |


Open Style > Load from URL with `https://osdatahubapi.os.uk/OSVectorTileAPI/vts/v1/resources/styles?srs=3857&key={YOUR KEY}`