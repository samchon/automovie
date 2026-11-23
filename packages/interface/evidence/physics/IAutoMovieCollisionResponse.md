# src/physics/IAutoMovieCollisionResponse.ts#IAutoMovieCollisionResponse

## @evidence contracts/development/design.md#principled-representation

suggestCollisionResponse composes resolveImpact, impulseToRecoilPush and optional impactRecoil, keeping material response and clinical pose advice tied to one evaluated collision.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three nested records expose actual stages of the suggestion without adding an imposed simulation state or acceptance policy.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Recoil direction is the current dominant-flexion magnitude heuristic, not a contact-frame vector solve; downstream authors may accept or override this advice.

## @evidence contracts/development/common.md#meaningful-documentation

Documents advisory ownership, impact/push linkage and exact null recoil condition.
