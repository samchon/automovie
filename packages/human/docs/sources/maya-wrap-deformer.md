# Maya, wrap deformer node

Autodesk Maya 2024 technical documentation, node "wrap", https://help.autodesk.com/cloudhelp/2024/ENU/Maya-Tech-Docs/Nodes/wrap.html.

## Licence

Product documentation under Autodesk's terms. Read for practice only.

## What it says

- Binds a geometry to one or more influence objects so their transforms or deformations deform the geometry.
- `maxDistance`: points beyond this distance are not affected; zero turns it off.
- `exclusiveBind`: weights only zero or one (mesh influences).
- `dropoff`: per-influence dropoff rates.
- `falloffMode`: volume-based (3D distance from the influence) or surface-based (distance across the surface).
- `weightThreshold`: below it no deformation takes place.

## What Human takes

The industry baseline for garment binding and its weakness for Human: distance-based weights pick up nearby but unrelated surfaces, which a semantic skin coordinate avoids (`../techniques/garment-binding.md`).
