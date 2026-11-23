# src/render/AutoMovieSemanticMaskVerificationError.ts#AutoMovieSemanticMaskVerificationError

## @evidence contracts/development/design.md#principled-representation

Carry one of unsupported, invalid or digest-mismatch on the Error so receipt consumers classify a verifier refusal by constructor identity and a typed reason rather than prose parsing.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One canonical class is shared by verifyAutoMovieSemanticMask and autoMovieSemanticMaskVerificationFailure; duplicated constructors would break instanceof classification.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reason comes from actual verifier branches and no expected receipt or fixture changes its classification; unrelated exceptions remain outside this class.

## @evidence contracts/development/common.md#meaningful-documentation

The constructor documents the refusal reason and retains the ordinary message for human diagnosis; classification is independent of message text.
