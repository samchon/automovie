# src/exercise/workoutSpans.ts#workoutSpans.ISpan

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

An instant's name and two exercise keys.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three values the posture and contact readers take.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A held span names the same key twice.

# src/exercise/workoutSpans.ts#workoutSpans.IBetween

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

Event names and whether the repetition is done on the other side.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What a support borne only in some postures reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The names are the route's own events.

# src/exercise/workoutSpans.ts#workoutSpans.IProps

## @evidence contracts/development/common.md#meaningful-documentation

States each member's unit.

## @evidence contracts/development/design.md#principled-representation

The kind's route, the counts and seconds the author and kind give, and the standing key.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The values `workout.plan` passes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The hold is absent when the author gives none, so the route's own holds apply.

# src/exercise/workoutSpans.ts#workoutSpans.IPlanned

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

Clock phases, spans, repetition records and held instants, in order.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `workout.plan` reads to make its clock, posture and contacts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The four arrays are built together and stay aligned.

# src/exercise/workoutSpans.ts#workoutSpans

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

Way down, each repetition's step and hold in route order (mirrored on alternate sides for an alternating kind), way up unless staying, then the settle.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One span helper and one loop.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Durations are the kind's or the author's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in repetitions times route steps.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The mirrored route is made once.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns fresh arrays and keeps nothing.
