# src/human/generation/frame/IAutoMovieHumanSegmentFrame.ts#IAutoMovieHumanSegmentFrame

## @evidence contracts/development/common.md#meaningful-documentation

States millimetres, basis-column order, operation-owned reference frames and mutable ownership without a validation promise.

## @evidence contracts/development/design.md#principled-representation

An origin and three right-handed unit basis vectors describe a rigid frame; frame selection, finite components and orthonormality remain premises of its producer and operation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by AutoMovieHumanF1Frames.world, AutoMovieHumanF1Placement.frame, AutoMovieHumanSegmentFrame.fromYZ. Read by AutoMovieHumanSegmentFrame.parallel, AutoMovieHumanSegmentFrame.matrix, AutoMovieHumanSegmentFrame.toLocal. Also types AutoMovieHumanF1.pelvis, AutoMovieHumanF1Frames.pelvis.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `origin`, `axes`; callers supply the complete record.

# src/human/generation/frame/IAutoMovieHumanSegmentFrame.ts#IAutoMovieHumanSegmentFrame.IRelativeResult

## @evidence contracts/development/common.md#meaningful-documentation `child` written in `parent`'s frame: its origin `A_p^T (o_c - o_p)` and its rotation `A_p^T A_c`.

## @evidence contracts/development/design.md#principled-representation `offset`: Child origin expressed in the parent frame, millimetres. `rotation`: Child basis expressed in the parent basis as a 3 by 3 rotation matrix.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSegmentFrame.IRelativeResult is the canonical exchange used by AutoMovieHumanSegmentFrame.relative.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Required fields are `offset`, `rotation`; callers supply the complete record.

# src/human/generation/frame/IAutoMovieHumanSegmentFrame.ts#IAutoMovieHumanSegmentFrame.ChainSegments

## @evidence contracts/development/common.md#meaningful-documentation

Distinguishes common-frame inputs from the parent-local joint records produced by chain, and states tree ordering and borrowed access.

## @evidence contracts/development/design.md#principled-representation

Each name and nullable parent identifies one frame in a parent-first tree; all input origins use registered millimetres and all axes share the figure reference coordinates.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanSegmentFrame.chain consumes these source frames to derive IAutoMovieHumanSegmentJoint records; relative transforms are computed by that operation rather than supplied twice.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The type does not claim to validate uniqueness, cycles or orthonormality; chain rejects a parent it cannot find, while callers own the complete tree premises.

# src/human/generation/frame/IAutoMovieHumanSegmentFrame.ts#IAutoMovieHumanSegmentFrame.WorldPose

## @evidence contracts/development/common.md#meaningful-documentation

The frames of a posed chain: `A_child = A_parent R` and `o_child = o_parent + A_parent offset`, parent first.

## @evidence contracts/development/design.md#principled-representation

The frames of a posed chain: `A_child = A_parent R` and `o_child = o_parent + A_parent offset`, parent first. The callable takes name and returns AutoMovieMatrix3Tuple | undefined.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSegmentFrame.WorldPose is the canonical exchange used by AutoMovieHumanSegmentFrame.world.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanSegmentFrame.world for the frames of a posed chain: `A_child = A_parent R` and `o_child = o_parent + A_parent offset`, parent first.

# src/human/generation/frame/IAutoMovieHumanSegmentFrame.ts#IAutoMovieHumanSegmentFrame.CardanZXYResult

## @evidence contracts/development/common.md#meaningful-documentation

The ISB joint-coordinate angles of a Z-X-Y Cardan sequence (Grood and Suntay 1983, as ISB writes the hip, knee and ankle in Wu et al.

## @evidence contracts/development/design.md#principled-representation

The ISB joint-coordinate angles of a Z-X-Y Cardan sequence (Grood and Suntay 1983, as ISB writes the hip, knee and ankle in Wu et al. Ordered tuple slots are 0, 1, 2; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSegmentFrame.CardanZXYResult is the canonical exchange used by AutoMovieHumanSegmentFrame.cardanZXY.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanSegmentFrame.cardanZXY for the ISB joint-coordinate angles of a Z-X-Y Cardan sequence (Grood and Suntay 1983, as ISB writes the hip, knee and ankle in Wu et al.

# src/human/generation/frame/IAutoMovieHumanSegmentFrame.ts#IAutoMovieHumanSegmentFrame.EulerYXYResult

## @evidence contracts/development/common.md#meaningful-documentation

The ISB shoulder angles, a Y-X-Y Euler sequence (Wu et al.

## @evidence contracts/development/design.md#principled-representation

The ISB shoulder angles, a Y-X-Y Euler sequence (Wu et al. Ordered tuple slots are 0, 1, 2; fixed arity preserves their correspondence.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanSegmentFrame.EulerYXYResult is the canonical exchange used by AutoMovieHumanSegmentFrame.eulerYXY.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanSegmentFrame.eulerYXY for the ISB shoulder angles, a Y-X-Y Euler sequence (Wu et al.
