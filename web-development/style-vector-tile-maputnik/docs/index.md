Open https://maputnik.github.io/editor/

In `Data Sources`:
- Delete the existing Active Sources
- Add New Source with

| | |
| --- | --- |
| Source ID | `"esri"` |
| Source Type | `Vector (XYZ URLs)` |
| 1st Tile URL | `https://api.os.uk/maps/vector/v1/vts/tile/{z}/{y}/{x}.pbf?key={YOUR KEY}&srs=3857` |

Open Style > Load from URL with `https://api.os.uk/maps/vector/v1/vts/resources/styles?key={YOUR KEY}&srs=3857`
