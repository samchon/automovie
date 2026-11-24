# src/handling/drawFromCarrierOver.ts#drawFromCarrierOver
## @evidence contracts/development/common.md#meaningful-documentation

States who draws over a carrier, which channels the draw claims and in which frame its goals ride.

## @evidence contracts/development/implementation.md#principled-implementation

The grounded draw's wrist and elbow paths are carried into the frame of the bone the carrier is worn on, read once at the entry, so the hands follow the line as the carrier moves the body; the carrier action keeps the body (`AutoMovieMotionHumanBase.under`).

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Split out of `drawFromCarrier` as the carried variant of the plan: the grounded plan hands it the paths it built (`IOver`) and returns its plan.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A carrier not worn by the performer rides the hips' frame, the body's own root; no other substitute.

## @evidence contracts/development/implementation.md#efficient-algorithms

One bone read at the entry; each sample is the base posture plus two frame transforms per moving arm.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one plan from prepared paths; shares nothing between plans.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The plan holds its paths for its own lifetime.

# src/handling/drawFromCarrierOver.ts#drawFromCarrierOver.IOver

## @evidence contracts/development/common.md#meaningful-documentation

Each member names what it holds and its frame.

## @evidence contracts/development/design.md#principled-representation

The paths and hints the grounded draw prepared, world at the entry, with the context they came from.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Written by the draw plan and read only by `drawFromCarrierOver`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The optional pull is `null` with its transport, never a partial record.
