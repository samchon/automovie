# src/human/generation/IAutoMovieHumanTrunkGlutealCleft.ts#IAutoMovieHumanTrunkGlutealCleft

## @evidence contracts/development/common.md#meaningful-documentation

A lateral displacement window and its height-conditioned gluteal-cleft jet evaluator. Member comments specify the individual units, frames and optional-value meanings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The namespace groups only AtCut, AtResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.

## @evidence contracts/development/design.md#principled-representation

AtCut, AtResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.

## @evidence contracts/development/design.md#minimal-and-owned-surface

AutoMovieHumanTrunkGlutealCleft exchanges the named AtCut, AtResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.

# src/human/generation/IAutoMovieHumanTrunkGlutealCleft.ts#IAutoMovieHumanTrunkGlutealCleft.AtCut

## @evidence contracts/development/common.md#meaningful-documentation

The back's displacement toward the front at a height over the ring.

## @evidence contracts/development/design.md#principled-representation

The back's displacement toward the front at a height over the ring. The outer tuple/array is readonly; nested element types determine whether their contents can change.

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkGlutealCleft.AtCut is the canonical exchange used by AutoMovieHumanTrunkGlutealCleft.at.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkGlutealCleft.at for the back's displacement toward the front at a height over the ring.

# src/human/generation/IAutoMovieHumanTrunkGlutealCleft.ts#IAutoMovieHumanTrunkGlutealCleft.AtResult

## @evidence contracts/development/common.md#meaningful-documentation

The back's displacement toward the front at a height over the ring.

## @evidence contracts/development/design.md#principled-representation

The back's displacement toward the front at a height over the ring. The callable takes z and returns [number, number, number].

## @evidence contracts/development/design.md#minimal-and-owned-surface

IAutoMovieHumanTrunkGlutealCleft.AtResult is the canonical exchange used by AutoMovieHumanTrunkGlutealCleft.at.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The representation is used by AutoMovieHumanTrunkGlutealCleft.at for the back's displacement toward the front at a height over the ring.
