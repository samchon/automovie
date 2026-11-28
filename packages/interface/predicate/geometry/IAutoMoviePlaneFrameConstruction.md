# src/geometry/IAutoMoviePlaneFrameConstruction.ts#IAutoMoviePlaneFrameConstruction.Operation

## @evidence contracts/development/common.md#meaningful-documentation

Build a right-handed plane frame from a finite Cartesian origin, nonzero normal and nonparallel reference direction.

## @evidence contracts/development/design.md#principled-representation

Recovery normalizes the normal and removes its component from the reference. A projected reference magnitude below 1e-6 refuses in supplied direction units.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The operation returns computed axes and retains the input origin tuple. Section slicing and plane-space measurements consume the frame independently.
