# Atelier material sources

Runtime uses six full 2K ambientCG maps and six original 1K Poly Haven maps. Earlier Grey Cartago files are retained for comparison but no longer loaded. Both providers use CC0: [ambientCG](https://docs.ambientcg.com/license/), [Poly Haven](https://polyhaven.com/license). Provenance, local file hashes, download links and processing are recorded in `sources.json`.

| Asset | Author(s) | Use |
| --- | --- | --- |
| [Marble016](https://ambientcg.com/view?id=Marble016) | ambientCG | Full-map dark marble columns, 2K |
| [Granite002A](https://ambientcg.com/view?id=Granite002A) | ambientCG | Full-map counter and wall stone, 2K; neutral color with reduced contrast |
| [Grey Cartago 03](https://polyhaven.com/a/grey_cartago_03) | Lucas Sánchez Ros | Previous iteration only; not loaded |
| [Granite Tile](https://polyhaven.com/a/granite_tile) | Charlotte Baglioni | Floor, 1K |
| [Japanese Cedar Planks](https://polyhaven.com/a/japanese_cedar_planks) | Charlotte Baglioni, Rico Cilliers | Miniature timber house |

Each active asset supplies diffuse, OpenGL normal and roughness maps. Runtime loads local files only. Diffuse uses sRGB; normal/roughness use linear data. Full texture maps use physical-scale UVs without cropped or mirrored stone-face selection. The ambientCG JPEGs are re-encoded locally at their original 2048×2048 dimensions; Granite002A color is neutralized and its contrast reduced. The preparation script, original ZIPs and SHA256 manifest are retained in `output/materials-refined-20261026/`. The older Poly Haven downloads are unmodified. Metal micro-roughness is generated locally, with anisotropic shading on aluminium.
