# src/geometry/IAutoMovieRigidTransform.ts#IAutoMovieRigidTransform

## @evidence contracts/development/common.md#meaningful-documentation

States metre translation, unit orientation, field-owned frames, mutable ownership and the separate physical admission and motion-producer responsibilities.

## @evidence contracts/development/design.md#principled-representation

Position and quaternion express a rigid placement without scale or shear; each field states its frame and numerical admission remains with its operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Physical profiles, physical state readers and motion prop placements share the same object representation; the rig adapter retains its distinct borrowed tuple view.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No frame is inferred from an anatomical or prop name, and neither an incompatible frame nor a nonunit quaternion is silently repaired.
