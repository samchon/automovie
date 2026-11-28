# src/sport/internal/scoreWaterPoloGoal.ts#scoreWaterPoloGoal

## @evidence contracts/development/common.md#meaningful-documentation

The contract identifies the scorer's inputs, aperture placement and axes, the complete sphere rule in metres and the earliest cutoff on the film clock.

## @evidence contracts/development/implementation.md#principled-implementation

A fixed vertical mouth makes the field-normal coordinate of a direct stock flight linear in time. The sphere clears the plane when its centre reaches negative radius. The reader checks the same projectile's centre across and above the sill at that instant, and withholds credit at or after contact, capture or supersession.

## @evidence contracts/development/implementation.md#efficient-algorithms

The scorer resolves the fixed mouth frame once and traverses the ball's listed flights once. Each admissible flight has at most one closed-form crossing to sample. The reader creates only the returned cue list and keeps no state.
