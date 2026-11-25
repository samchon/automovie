# src/motion/human/perform/IAutoMovieMotionHumanPropOutcome.ts#IAutoMovieMotionHumanPropOutcome.ILeg

## @evidence contracts/development/common.md#meaningful-documentation

Documents launch-relative seconds, the engine segment, an infinite unended leg and its optional ending contact.

## @evidence contracts/development/design.md#principled-representation

One engine continuation segment retains its timing and observed contact without a parallel trajectory representation; sorted/progressing times remain the producer's obligation.

## @evidence contracts/development/design.md#minimal-and-owned-surface

HumanPropFlight reads segment frames and recorded contacts; legs constructs every field.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing contact is explicit and no predicted impact is substituted for an observed one.

# src/motion/human/perform/IAutoMovieMotionHumanPropOutcome.ts#IAutoMovieMotionHumanPropOutcome.IMeeting

## @evidence contracts/development/common.md#meaningful-documentation

States the sweep-relative hit, target kind and collider identity used for pass exclusion or a resolved bounce's physical departure query, and the struck surface's velocity a bounce acts relative to.

## @evidence contracts/development/design.md#principled-representation

Reuses the engine hit and the flight's target union; their correspondence is supplied by the sweep rather than encoded twice.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The continuation loop reads the hit, target and collider for outcome, settlement and the next sweep, and the surface velocity for the bounce; the sweep records it only for a moving collider, a person or a moving prop.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Contains no inferred material coefficient or alternative collision solver.

# src/motion/human/perform/IAutoMovieMotionHumanPropOutcome.ts#IAutoMovieMotionHumanPropOutcome.ILegsProps

## @evidence contracts/development/common.md#meaningful-documentation

prop: Borrowed prop and physical outcome settings, stable throughout this synchronous continuation call. projectile: Initial projectile whose zero is the original launch. meeting: First observed contact; hit.time is finite nonnegative seconds from the original launch, checked by legs.

## @evidence contracts/development/design.md#principled-representation

prop: Borrowed prop and physical outcome settings, stable throughout this synchronous continuation call. projectile: Initial projectile whose zero is the original launch. meeting: First observed contact; hit.time is finite nonnegative seconds from the original launch, checked by legs.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: perform/HumanPropOutcome.ts (HumanPropOutcome.legs, props).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Shares the canonical IAutoMovieMotionHumanProp, IAutoMovieProjectile, IAutoMovieMotionHumanPropOutcome.IMeeting, IAutoMovieMotionHumanPropFlight.IContact identities used at the listed runtime boundaries; input admission and numerical solving stay with those producers and consumers.
