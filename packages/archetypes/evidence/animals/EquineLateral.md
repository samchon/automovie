# src/animals/EquineLateral.ts#EquineLateral.Side

## @evidence contracts/development/common.md#meaningful-documentation

Names the side of the sideways travel.

## @evidence contracts/development/design.md#principled-representation

A closed literal union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the figures' heading sign.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineLateral.ts#EquineLateral.TwoTrackKind

## @evidence contracts/development/common.md#meaningful-documentation

Names leg-yielding and half-pass.

## @evidence contracts/development/design.md#principled-representation

A closed literal union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `ITwoTrack.kind`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineLateral.ts#EquineLateral.IShoulderIn

## @evidence contracts/development/common.md#meaningful-documentation

States the side and the blend.

## @evidence contracts/development/design.md#principled-representation

The angle is not authored: the hooves fix it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A member of `Technique`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineLateral.ts#EquineLateral.ITwoTrack

## @evidence contracts/development/common.md#meaningful-documentation

States the side, the angle in degrees and the blend.

## @evidence contracts/development/design.md#principled-representation

The angle between the body heading and the travel heading, positive degrees.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A member of `Technique`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The angle is bounded by `MAXIMUM` at admission.

# src/animals/EquineLateral.ts#EquineLateral.IPirouette

## @evidence contracts/development/common.md#meaningful-documentation

States the blend; the turn's sign gives the inside.

## @evidence contracts/development/design.md#principled-representation

The leg's radius is the root's circle; the heading follows from the pivot hoof.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A member of `Technique`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineLateral.ts#EquineLateral.Technique

## @evidence contracts/development/common.md#meaningful-documentation

Lists the figures.

## @evidence contracts/development/design.md#principled-representation

A discriminated union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Part of `EquineFootwork.Technique`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineLateral.ts#EquineLateral.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

States its film seconds, its blend and its full offset.

## @evidence contracts/development/design.md#principled-representation

An interval with a ramp at each end and a signed offset in degrees, positive to the left.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `heading`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/EquineLateral.ts#EquineLateral.admit

## @evidence contracts/development/common.md#meaningful-documentation

States each refusal and the units.

## @evidence contracts/development/implementation.md#principled-implementation

Headings are degrees positive to the left, so moving toward the left puts the travel left of the body and the body offset is negative. Shoulder-in's offset puts the inside hind and the outside fore on one line along the travel. A pirouette turns the body so the vector from the root to the inside hind points at the turn's centre; the hind's circle is the leg's radius less that hoof's distance, admitted from zero up to the hind track width so the outside hind still moves round the inside hind (DR112.3).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Check the leg, then compute the one offset its figure defines.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No angle is clamped and no radius widened.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads the course plan's leg times and the hooves.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one small record.

# src/animals/EquineLateral.ts#EquineLateral.heading

## @evidence contracts/development/common.md#meaningful-documentation

States the units and the zero outside.

## @evidence contracts/development/implementation.md#principled-implementation

Inside its leg each figure ramps in over its blend from the leg's start and out over its blend to the leg's end on the minimum-jerk profile, so the heading and its rate are continuous with straight travel at both ends.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the windows.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

No case to special-case.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(W) in the figures.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the engine's `minimumJerk`.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/animals/EquineLateral.ts#EquineLateral.crossing

## @evidence contracts/development/common.md#meaningful-documentation

States the rule, the formula, its symbols and units, the provisional adduction and the search that found no bound.

## @evidence contracts/development/implementation.md#principled-implementation

Δ is the shift that puts the crossing footprint 2r beyond its partner's release point given the rigid trunk's lateral travel D; the stance's figure share and heading are read at the stance's middle second.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The figure owns which legs cross and by how much; the hoof track only offsets the neutral point it already centres.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No angle is clamped; W and r are the rig's; an unreachable shift is refused by the limb fit, not shortened.

## @evidence contracts/development/implementation.md#efficient-algorithms

O(W) in the figures per stance, after one read of four pasterns.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Shares the heading's minimum-jerk share.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned reader retains the windows and two widths and radii for the ride's lifetime.
