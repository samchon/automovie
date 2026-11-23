# src/motion/human/perform/IAutoMovieMotionHumanTether.ts#IAutoMovieMotionHumanTether

## @evidence contracts/development/common.md#meaningful-documentation

States the ends, the two lengths, the pull and the hang.

## @evidence contracts/development/design.md#principled-representation

Two named prop points and a length that is either a constant or an articulation's travel times a rate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The id, the far end and the length a line needs; the near end is the declaring prop.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A length of no line or a missing point is refused when the performance reads the line.

# src/motion/human/perform/IAutoMovieMotionHumanTether.ts#IAutoMovieMotionHumanTether.IEnd

## @evidence contracts/development/common.md#meaningful-documentation

Names the prop and its point by id.

## @evidence contracts/development/design.md#principled-representation

A prop by scene subject and one of its affordances by id, resolved to a world point at each second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Two members, used for the line's far end and the driving articulation, and resolved by HumanPerformanceTether.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An unknown prop or point is not ruled out by the type and is refused by HumanPerformanceTether at runtime.

# src/motion/human/perform/IAutoMovieMotionHumanTether.ts#IAutoMovieMotionHumanTether.Length

## @evidence contracts/development/common.md#meaningful-documentation

Names the two ways the line out is given.

## @evidence contracts/development/design.md#principled-representation

A union discriminated on `kind`: a constant length or one driven by an articulation's travel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The line's `length` member; HumanPerformanceTether branches on `kind` to measure the line out.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The discriminant keeps a driven length's articulation and rate off a fixed length.

# src/motion/human/perform/IAutoMovieMotionHumanTether.ts#IAutoMovieMotionHumanTether.IFree

## @evidence contracts/development/common.md#meaningful-documentation

States the discriminant and the line out in metres.

## @evidence contracts/development/design.md#principled-representation

A constant length of line out, metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant and one length, read by HumanPerformanceTether.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A length of no line is not ruled out by the type and is refused by HumanPerformanceTether at runtime.

# src/motion/human/perform/IAutoMovieMotionHumanTether.ts#IAutoMovieMotionHumanTether.IDriven

## @evidence contracts/development/common.md#meaningful-documentation

States the length rule, its floor at zero, and each member's unit.

## @evidence contracts/development/design.md#principled-representation

The line out at zero travel in metres, the driving articulation by prop and id, and a rate in metres per unit of its travel.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The discriminant and the three inputs of the length rule, read by HumanPerformanceTether.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The rate's unit follows the articulation's travel unit and is not encoded in the type; an unknown articulation is refused at runtime.

# src/motion/human/perform/IAutoMovieMotionHumanTether.ts#IAutoMovieMotionHumanTether.ISpan

## @evidence contracts/development/common.md#meaningful-documentation

States the ends, the length, the taut flag and the points, with their frame and unit.

## @evidence contracts/development/design.md#principled-representation

World metres for the ends and the points along the line, metres of line out, and whether it runs straight.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanPerformanceTether.span produces it and HumanPerformance returns it to readers of a line at a second.

## @evidence contracts/development/design.md#prohibited-design-shortcuts `taut` and the point count are not tied by the type: two points when taut and a catenary when slack remain the producer's invariant.
