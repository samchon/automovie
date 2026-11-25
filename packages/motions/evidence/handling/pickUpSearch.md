# src/handling/pickUpSearch.ts#pickUpSearch.ISearched

## @evidence contracts/development/common.md#meaningful-documentation

Members identify the original chosen reach, world-metre elbow hint and exact body stance that produced them.

## @evidence contracts/development/design.md#principled-representation

Retains HumanGrasp's reach and pickUpPosture's stance types with their original world coordinates, complete goals, reference and judgement reports.

## @evidence contracts/development/design.md#minimal-and-owned-surface

pickUpStance chooses among these records and pickUp consumes all three fields to author the original lift; no prepared token or new pose representation escapes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Every record comes from its own actual stance search, without reusing another stance's wrist, goal, solution or refusal verdict.

# src/handling/pickUpSearch.ts#pickUpSearch

## @evidence contracts/development/common.md#meaningful-documentation

States each input and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The grip's turns and tilts judged by the arm's fit over the grasp, the lift and any use's pose (`HumanGrasp.reachable`), the use's pose first when one is asked.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The elbow hint, the goals, one search.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A grasp beyond the straight arm is tried only when every one is.

## @evidence contracts/development/implementation.md#efficient-algorithms

Preserves all original candidate goals, coupled fits, lazy stroke keys and required-first wider search. Each candidate that reaches a use or demand reads its current geometry at that original point; arbitrary callbacks prevent sharing direct source assembly across fits or stances.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The public reachable owner shares only exact current FK dependencies. Entry, params, prop reads and demanded postures remain live across external demand callbacks; no object identity or callback absence is treated as proof of a fixed body/posture source.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing past the call.
