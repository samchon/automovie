# src/construction/IAutoMovieLoftWorldJetLocal.ts#IAutoMovieLoftWorldJetLocal

## @evidence contracts/development/common.md#meaningful-documentation

The comment specifies the full input, the two coordinate scales and the caller's responsibility to preserve one phase clock.

## @evidence contracts/development/design.md#principled-representation

loftWorldJet consumes p, s, t, ss, st and tt along with the frame value and station derivative rows. LoftJet passes polar radians; ConstructionProfileSurface rescales the phase rows before placement.

## @evidence contracts/development/design.md#minimal-and-owned-surface

This boundary borrows the existing two-number vector tuples. The surrounding profile owns any clock remap and the product rule owns placement.

# src/construction/IAutoMovieLoftWorldJetLocal.ts#IAutoMovieLoftWorldJetLocal.p

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the position's local chart and millimetre units.

# src/construction/IAutoMovieLoftWorldJetLocal.ts#IAutoMovieLoftWorldJetLocal.s

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the physical coordinate and derivative scale.

# src/construction/IAutoMovieLoftWorldJetLocal.ts#IAutoMovieLoftWorldJetLocal.t

## @evidence contracts/development/common.md#meaningful-documentation

The comment preserves the local caller's phase scale.

# src/construction/IAutoMovieLoftWorldJetLocal.ts#IAutoMovieLoftWorldJetLocal.ss

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the station derivative order and units.

# src/construction/IAutoMovieLoftWorldJetLocal.ts#IAutoMovieLoftWorldJetLocal.st

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies both partial axes and the resulting scale.

# src/construction/IAutoMovieLoftWorldJetLocal.ts#IAutoMovieLoftWorldJetLocal.tt

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the second derivative and caller-dependent scale.
