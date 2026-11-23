# src/motion/human/next/IAutoMovieMotionHumanRide.ts#IAutoMovieMotionHumanRide

## @evidence contracts/development/common.md#meaningful-documentation

States the family's shared model and what its methods have in common.

## @evidence contracts/development/design.md#principled-representation

One method per law of the Ride family, each taking the law's own parameter type.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The Ride laws and nothing the other families own.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Each method takes the existing parameter type of its law; nothing is redefined.

# src/motion/human/next/IAutoMovieMotionHumanRide.ts#IAutoMovieMotionHumanRide.IParams

## @evidence contracts/development/common.md#meaningful-documentation

duration: Seconds ridden, more than none. Exclusive minimum: 0. Unit: "s". rising: A rising trot: the mount's stride time, seconds, or the cue track of the performance that holds its strides (the footfalls of one diagonal, as the mount's own ride publishes them). The rider stands in the stirrups and sits again once a stride, the seat rising `POST` thigh lengths off the saddle, so both feet must rest on the support. On a cue track the seat is down at each of its instants and seated before the first and after the last. Seated throughout when absent. seat: The support's point the seat stays on, by its id, where the seat itself moves within the support: a saddle on a horse's trunk, which rises and falls with the stride over the course its root follows. The body is carried with the support alone when absent.

## @evidence contracts/development/design.md#principled-representation

duration: Seconds ridden, more than none. Exclusive minimum: 0. Unit: "s". rising: A rising trot: the mount's stride time, seconds, or the cue track of the performance that holds its strides (the footfalls of one diagonal, as the mount's own ride publishes them). The rider stands in the stirrups and sits again once a stride, the seat rising `POST` thigh lengths off the saddle, so both feet must rest on the support. On a cue track the seat is down at each of its instants and seated before the first and after the last. Seated throughout when absent. seat: The support's point the seat stays on, by its id, where the seat itself moves within the support: a saddle on a horse's trunk, which rises and falls with the stride over the course its root follows. The body is carried with the support alone when absent.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Runtime boundary references: lexicon/HumanRide.ts (HumanRide.ride, context); lexicon/HumanRide.ts (HumanRide.ride).

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Optional riding, restraint and rising choices refer to the support's declared affordances and cue tracks; the ride planner owns missing-support refusals.

# src/motion/human/next/IAutoMovieMotionHumanRide.ts#IAutoMovieMotionHumanRide.IEquestrianStride

## @evidence contracts/development/common.md#meaningful-documentation

Identifies actual hoof cue tracks, their film clock, three admitted body responses and canter lead.

## @evidence contracts/development/design.md#principled-representation

A named cue track and gait select the response. Canter lead controls lateral sign. Runtime planning orders authored windows and verifies coverage.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Track cues keep the existing performance time owner. The rider reads this selected response without owning any animal geometry.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No inferred horse motion, reassigned contact or invented touchdown is supplied by this interface.

# src/motion/human/next/IAutoMovieMotionHumanRide.ts#IAutoMovieMotionHumanRide.EquestrianStrides

## @evidence contracts/development/common.md#meaningful-documentation

States the two accepted forms and the ordering rule.

## @evidence contracts/development/design.md#principled-representation

A single record keeps the original one-gait form; a list carries gait and lead changes. Overlap is checked when the ride is planned, since it depends on the cue tracks' film seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read only by the ride's equestrian preparation and its generated schema.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The list is not a map keyed by gait, so the same gait can recur after a change.

# src/motion/human/next/IAutoMovieMotionHumanRide.ts#IAutoMovieMotionHumanRide.EquestrianGait

## @evidence contracts/development/common.md#meaningful-documentation

Names the four gaits whose pelvic response the ride models; the gallop, like the canter, rocks once per stride and rolls to its lead, its amplitudes the canter's, provisional.

## @evidence contracts/development/design.md#principled-representation

A closed literal union; the gaited breeds' clocks have no modeled rider response.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `IEquestrianStride.gait` and the ride's pitch and roll response.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/next/IAutoMovieMotionHumanRide.ts#IAutoMovieMotionHumanRide.EquestrianLead

## @evidence contracts/development/common.md#meaningful-documentation

States what a lead is.

## @evidence contracts/development/design.md#principled-representation

A closed literal union of the two sides.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `IEquestrianStride.lead`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
