# src/compose/AutoMovieMotionHumanBendBound.ts#AutoMovieMotionHumanBendBound.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The upper arm's admitted basis, rest frame and range, the hanging arm's clinical angles, and the hand's turn when the strain reads one.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Five members, all read by the preparation.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The basis is the one the decomposition reads, admitted once by the sweep.

# src/compose/AutoMovieMotionHumanBendBound.ts#AutoMovieMotionHumanBendBound.prepare

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the reader returned.

## @evidence contracts/development/implementation.md#principled-implementation

The namespace's derivation: closed-form enclosures of each shoulder angle, both charts and every alias, the gimbal floor and the slack, and the hand turn's unmade excess where it is certified; 0 where none holds.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Readings and premise check once per branch, then three axis enclosures, their distances and one sum per interval, and the unmade bound beside them.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An uncertified arc or branch returns 0, never an estimate; no candidate is skipped here, only bounded.

## @evidence contracts/development/implementation.md#efficient-algorithms

Per branch three rotations for the fit and two decompositions for the check; per interval at most a dozen sinusoid evaluations, against a scored place's posing, decompositions, range scan and obstruction queries it can spare.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The readings are the engine's `swivelJointReadings`, the fit `boxExcludedSwivels` refuses arcs by; the halves and squares are `AutoMovieMotionHumanBendStrain`'s.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Each branch's reader retains its three readings and the fixed terms until the sweep releases it.
