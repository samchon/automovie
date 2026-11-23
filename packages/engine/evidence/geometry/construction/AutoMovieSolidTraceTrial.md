# src/geometry/construction/AutoMovieSolidTraceTrial.ts#AutoMovieSolidTraceTrial

## @evidence contracts/development/implementation.md#principled-implementation

Piecewise chart Newton uses the atlas's explicit boundary correspondence when a proposed host chart is outside its owned domain; the neighbour's actual finite physical2 supplies the trial.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One reader returns the mapped coordinates together with their actual face/jet, keeping residuals and Jacobians on the same map.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An open boundary, unavailable jet or exhausted crossing budget returns null. A mapped foot is not a solved meeting; no extrapolation, point clamp, replacement curve or callback catch is introduced.

## @evidence contracts/development/common.md#meaningful-documentation

Coordinates use each face's own units; crossed labels one caller-budgeted transition and all callbacks/getters retain their exception identity.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant domain tests and at most one atlas boundary query precede one actual jet; atlas segment lookup and source costs remain their owners' costs.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The returned jet/coordinates supply both the actual residual and an accepted next iteration without reevaluation.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Only the caller owns the small result and its producer's vectors; no atlas, cache or process handle is retained globally.
