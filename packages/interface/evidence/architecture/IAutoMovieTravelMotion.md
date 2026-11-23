# src/architecture/IAutoMovieTravelMotion.ts#IAutoMovieTravelMotion

## @evidence contracts/development/design.md#principled-representation

A revolute value becomes a right-handed quaternion turn about the normalized local axis with translation `pivot - rotate(pivot)`; a prismatic value translates along that unit axis. Building admission requires finite components/computed axis length above 1e-12, finite pivot when present, finite ordered travel containing zero and revolute span at most 2*pi + 1e-6 radians. World staging composes rest times delta, then parent world; finite authored values alone do not ensure finite derived matrices, which named-state staging checks separately.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Panels and carriages both reference this one record, and each variant carries only the fields its joint needs, so a slide has no pivot and neither variant repeats the per-state values that `IAutoMovieCarriageValue` and the opening states own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No joint is special-cased by element kind; the axis length is ignored by normalization rather than reinterpreted as a gain, and a degenerate axis or empty range is refused by the validator instead of being clamped.

## @evidence contracts/development/common.md#meaningful-documentation

States that values are displacements from the rest pose at `0`, the local frame of axis and pivot, radians for revolute and metres for prismatic travel, the sign bounds on `min` and `max`, and the full-turn limit.

# src/architecture/IAutoMovieTravelMotion.ts#IAutoMovieTravelMotion.IRevolute

## @evidence contracts/development/design.md#principled-representation

A value becomes the unit quaternion of that angle about the normalized axis, composed with the translation `pivot - rotate(pivot)` so the pivot stays fixed; the premise is a non-degenerate axis, which the validator enforces before any displacement is built.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Axis, pivot and the two range ends are the whole hinge; the angle for each named state lives on the state, so the joint stores only what every state shares.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The full-turn limit carries a `1e-6` radian slack that validation shares with the swept-envelope solver, whose critical-angle walk that cap bounds, so the two cannot disagree; no hinge orientation or member kind gets a different rule.

## @evidence contracts/development/common.md#meaningful-documentation

States the rotation sense, the local frame of axis and pivot, radian units, that `min` is at most rest and `max` at least rest, and that the range spans at most one turn.

# src/architecture/IAutoMovieTravelMotion.ts#IAutoMovieTravelMotion.IPrismatic

## @evidence contracts/development/design.md#principled-representation

A value becomes a pure translation of that many metres along the normalized axis, with identity rotation and unit scale, so the member's orientation is unchanged at every state.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Axis and the two range ends are the whole slide; it has no pivot because a translation has no fixed point to name.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The slide has no turn limit and no special case for vertical travel, so a lift car and a sliding door take the same rule.

## @evidence contracts/development/common.md#meaningful-documentation

States the local frame of the axis, that only its direction matters, metre units along the unit axis, and the sign bounds on `min` and `max`.
