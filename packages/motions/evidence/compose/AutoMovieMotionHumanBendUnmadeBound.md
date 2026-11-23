# src/compose/AutoMovieMotionHumanBendUnmadeBound.ts#AutoMovieMotionHumanBendUnmadeBound.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The rotations the lower arm's world rotation is composed of, the hand's goal, the forearm's twist axis and range, and the hand's basis, rest frame and range.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Eight members, all read by the preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The members are the chain's and the rig's own, as the strain composes them.

# src/compose/AutoMovieMotionHumanBendUnmadeBound.ts#AutoMovieMotionHumanBendUnmadeBound.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the reader and the null case.

## @evidence contracts/development/implementation.md#principled-implementation

The namespace's derivation: exact sinusoid fits, closed-form enclosures, both charts and every alias, the swing identity on a proximal hand along the forearm; 0 where it cannot be certified.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Fits and premise checks once per branch, three enclosures and three excesses per interval.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An uncertified term returns 0, never an estimate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Ten quaternion products per branch, six sinusoid evaluations per interval.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fit is `swivelArcs.fitted`, the enclosures and excesses `AutoMovieMotionHumanBendEnclosure`'s, the reserve the strain's own `RESERVE`.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each branch's reader retains five sinusoids and the fixed terms until the sweep releases it.
