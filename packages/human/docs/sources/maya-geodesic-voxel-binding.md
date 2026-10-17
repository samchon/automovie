# Maya, geodesic voxel binding

Autodesk Maya 2017 help, "Geodesic Voxel binding", https://help.autodesk.com/cloudhelp/2017/ENU/Maya/files/GUID-5EFDB81B-E332-4D6C-B1BB-0B989AD2F2C7.htm (the 2018 Maya LT page has the same text). The underlying paper, Dionne O, de Lasa M, "Geodesic Voxel Binding for Production Character Meshes", SCA 2013, could not be opened (the Eurographics library returned 403).

## Licence

Product documentation under Autodesk's terms. Read for technique comparison only.

## What it says

- Voxelizes the input geometry and derives weights from the geodesic distance between skeleton voxels and mesh voxels.
- Several meshes are treated as one volume, so weighting is continuous across them; weights work with linear blend or dual quaternion skinning.
- Designed for meshes that are non-manifold, non-watertight, self-intersecting or in several components.
- All joint influences must lie inside the mesh volume, and front faces must point outward.

## What Human takes

A candidate to compare with analytic weights derived from part, station and angular semantics. A semantic cage alone does not establish a suitable weight field; [skinning research](../techniques/skinning.md) compares the deformation premises.
