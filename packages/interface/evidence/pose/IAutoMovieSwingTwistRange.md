# src/pose/IAutoMovieSwingTwistRange.ts#IAutoMovieSwingTwistRange

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit: the limb's unit direction in the rest frame, the swing in degrees, the azimuth in degrees about the rest direction from the flexion axis and the clinical twist in [-180, 180). States that the axes are the joint's clinical basis and that the rest frame lifts its angles, and that an absent frame leaves angles rest-relative.

## @evidence contracts/development/design.md#principled-representation

The two quantities a ball joint's range limits independently, where the limb points (the direction with its swing and azimuth) and how it is turned about itself (the twist), in degrees and the bone's rest frame. Canonical clinical axes and an optional canonical rest frame map rig rotation to clinical degrees; an absent frame leaves angles rest-relative.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, all read by `overshoot` and `project`; the direction is kept so `project` need not recompute it. Two members, both read by every function here; the radius table is cached on them; `of` gives them for a rig's bone.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Neither the swing nor the twist is read through a three-angle chart; the record names no joint and no bone. No joint or bone is named, and no type is duplicated.

# src/pose/IAutoMovieSwingTwistRange.ts#IAutoMovieSwingTwistRange.IReading

## @evidence contracts/development/common.md#meaningful-documentation

States each member's frame and unit: the limb's unit direction in the rest frame, the swing in degrees, the azimuth in degrees about the rest direction from the flexion axis and the clinical twist in [-180, 180).

## @evidence contracts/development/design.md#principled-representation

The two quantities a ball joint's range limits independently, where the limb points (the direction with its swing and azimuth) and how it is turned about itself (the twist), in degrees and the bone's rest frame.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Four members, all read by `overshoot` and `project`; the direction is kept so `project` need not recompute it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Neither the swing nor the twist is read through a three-angle chart; the record names no joint and no bone.
