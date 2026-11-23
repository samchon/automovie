# src/actions/walkTempo.ts#walkTempo

## @evidence contracts/development/common.md#meaningful-documentation

States what varies and what does not, the source of the variation's size, the clock law and why velocity stays continuous.

## @evidence contracts/development/implementation.md#principled-implementation

A time warp: the pose stays a pure function of the film second, and every named instant is mapped by the same warp, so events, contacts and poses agree. The warp is strictly increasing because `k = 2 (planned / lasts - 1)` stays above -1 for any step held within `HOLD`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read the strikes, lay out the stretched steps, then two maps, film to plan in closed form and plan to film by bisection.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts `HOLD` truncates a drawn stretch to the range of steps the planned gait still describes, far outside the 1 to 3 % the draw carries; the size of the variation is the caller's, drawn from the performer's skill and seed.

## @evidence contracts/development/implementation.md#efficient-algorithms

A pose costs a logarithmic step lookup and closed-form map; a named instant costs a 40-step bisection, once per plan. Each step's rate amplitude is computed once.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing to cache beyond the step table built once per plan.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Holds the plan and the step table for as long as the returned plan is held.
