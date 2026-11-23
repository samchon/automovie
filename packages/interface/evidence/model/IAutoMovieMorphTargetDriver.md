# src/model/IAutoMovieMorphTargetDriver.ts#IAutoMovieMorphTargetDriver

## @evidence contracts/development/design.md#principled-representation

One scalar joint angle mapped through a driven-key curve, the pose-space deformation of Lewis et al. 2000 restricted to one input; the angle is the authored clinical value, so it needs no forward kinematics and reads the same in the engine and the viewer.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A bone, an axis and the existing {@link IAutoMovieDrivenCurve} reuse the clip driver's curve semantics instead of a second mapping type, and live on the target they drive.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Admission requires a skeleton bone, a known axis and a nonempty finite strictly increasing curve, and refuses a driven target whose name an expression also writes, so neither silently overwrites the other.

## @evidence contracts/development/common.md#meaningful-documentation

States the angle's source, unit and neutral reading, the duplicate-joint rule, the curve evaluation and extension, the unclamped weight and when the viewer applies it.
