# src/construction/IAutoMovieLoftWorldJetWorld.ts#IAutoMovieLoftWorldJetWorld

## @evidence contracts/development/common.md#meaningful-documentation

The comment states result ownership, coordinate scales and the effects added after placement.

## @evidence contracts/development/design.md#principled-representation

loftWorldJet computes origin + localU × u + localV × v and its first, mixed and second partials using three physical-station frame rows. It refuses overflowing products and sums.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The result uses existing world vectors. The shared placement owner leaves surface-specific lift and relief to the chain or view consumer.

# src/construction/IAutoMovieLoftWorldJetWorld.ts#IAutoMovieLoftWorldJetWorld.p

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the placement and frame used by the point.

# src/construction/IAutoMovieLoftWorldJetWorld.ts#IAutoMovieLoftWorldJetWorld.s

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the scale and two sources of station motion.

# src/construction/IAutoMovieLoftWorldJetWorld.ts#IAutoMovieLoftWorldJetWorld.t

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the retained clock and fixed-station basis.

# src/construction/IAutoMovieLoftWorldJetWorld.ts#IAutoMovieLoftWorldJetWorld.ss

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the scale and includes the frame's change.

# src/construction/IAutoMovieLoftWorldJetWorld.ts#IAutoMovieLoftWorldJetWorld.st

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the mixed derivative unit and contribution of axis motion.

# src/construction/IAutoMovieLoftWorldJetWorld.ts#IAutoMovieLoftWorldJetWorld.tt

## @evidence contracts/development/common.md#meaningful-documentation

The comment states the second derivative scale inherited from the local input.
