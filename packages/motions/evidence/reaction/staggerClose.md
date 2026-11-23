# src/reaction/staggerClose.ts#staggerClose

## @evidence contracts/development/common.md#meaningful-documentation

States the closing step, its capture, the settling and its source.

## @evidence contracts/development/design.md#principled-representation

One function over the pendulum the catching steps left, returning the whole recovery.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One function, read by `staggerRecover`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The closing stance is at least the entry's width, and the rest the place the body stood over its feet at the entry.

# src/reaction/staggerClose.ts#staggerClose.of

## @evidence contracts/development/common.md#meaningful-documentation

States each input, the closing placement, its prediction and the null.

## @evidence contracts/development/implementation.md#principled-implementation

Hof's held-pressure pendulum predicts the extrapolated centre of mass at the closing landing in closed form (xi - p grows as e^(omega t)); then p = xi - xi_ref' / omega + `TRACKING` (xi - xi_ref) inside the base, reached from the swing's held pressure on a minimum-jerk share over the measured weight shift so the pressure never jumps, xi' = omega (xi - p), x' = omega (xi - x), integrated exactly per held step until both rest within `SETTLED`.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The closing step from its prediction, its capture test, the settling loop, the courses.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A close that leaves the extrapolated centre of mass outside the base, or never settles, is null rather than a course that ends off balance.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work for the closing step and one millisecond loop of at most `(righting + 20 / omega) / STEP` held spans for the settling.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Fixed support prepares ordered edge differences/spans once, and fixed righting/frequency/STEP prepare the same rate and growth/decay coefficients; before settling the pendulum's own course readers answer.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned readers retain the settling arrays and the pendulum's course readers with their recovery record, and no time-keyed samples.
