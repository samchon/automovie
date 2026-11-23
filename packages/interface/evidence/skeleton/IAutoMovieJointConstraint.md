# src/skeleton/IAutoMovieJointConstraint.ts#IAutoMovieJointConstraint

## @evidence contracts/development/design.md#principled-representation

Per-axis finite degree intervals admit clinical flexion, abduction and twist, while optional swing bounds their combined quaternion-derived sweep on top of the axis boxes.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Three nullable ranges and one optional combined cap describe rig-specific motion limits independently from engine default tables and FK axis definitions.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Null axis admits neutral null/zero and rejects nonzero motion. Under the usual per-axis absolute bounds of 180 degrees, the swing metric stays at most 180, so a 180-degree cap adds no restriction; broader or multi-turn angles need that premise stated and are not a complete anatomy or dynamics proof.

## @evidence contracts/development/common.md#meaningful-documentation

Defines clinical signs and degrees, null-axis meaning, rig overrides, the combined-swing formula and headroom limit, and the optional swing-twist gate of a ball joint.
