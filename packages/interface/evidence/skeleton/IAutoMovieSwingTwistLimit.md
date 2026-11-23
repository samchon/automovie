# src/skeleton/IAutoMovieSwingTwistLimit.ts#IAutoMovieSwingTwistLimit

## @evidence contracts/development/common.md#meaningful-documentation

States the measure, its origin, its unit and its sign.

## @evidence contracts/development/design.md#principled-representation

An interval of the twist about the limb's own axis left after the shortest swing from rest, by the swing-twist decomposition whose only singularity lies at the rest direction's antipode, which the farthest reach keeps outside.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members: the twist interval and the farthest reach; the swing's region is read from the constraint's own flexion and abduction intervals, not restated, and the record is additive and optional on the constraint.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None: a constraint without it keeps the three-angle gate unchanged.
