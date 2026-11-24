# src/everyday/HumanBalanceExtrapolated.ts#HumanBalanceExtrapolated

## @evidence contracts/development/common.md#meaningful-documentation

States the callback's argument, the solving, the world-metre sign and the three instants observed.

## @evidence contracts/development/implementation.md#principled-implementation

Hof's extrapolated centre of mass from the velocity of the t - 1/240 s and t + 1/240 s centres and a pendulum of 1.34 hip heights, measured to the foot outlines at t.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

A one-off use of `prepare`: the same reader, built and read once, with the callback narrowed to its one argument.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every instant's posture is fully solved; no sample or centre is substituted.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three full posture fits; callers observing many instants use `prepare` to bind the bone names once.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The three fits share one FK workspace and ROM projector; nothing is reused across calls.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader and its workspaces end with the call; only a scalar escapes.

# src/everyday/HumanBalanceExtrapolated.ts#HumanBalanceExtrapolated.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the body's lifetime, the movement and time inputs, the optional borrowed workspaces, the callback's arguments and the signed metre output.

## @evidence contracts/development/implementation.md#principled-implementation

Binds the mass-bearing and foot bone names once; each observation solves the two neighbouring postures and the current one fully, takes the central difference, extrapolates the centre (Hof, Gazendam and Sinke 2005) and measures it to the support hull.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One centre reader and one bone reader for the final posture are built once; each observation runs the three fits, lending them any supplied workspaces.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every limb, digit and contact goal is fitted; the final reading omits only bones no measure reads.

## @evidence contracts/development/implementation.md#efficient-algorithms

The name lookup runs once across Q observations; each observation costs three full fits and the mass and support work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The body fixes the bone names; each observation lends its own or its caller's FK workspace and ROM projector to its fits, and nothing keys a result.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The caller holds the body and the two readers until release; movements, postures, centres and workspaces stay within each observation.
