# src/physics/IAutoMovieSuggestCollisionResponse.ts#IAutoMovieSuggestCollisionResponse.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Specifies the two impact bodies, normal, recoil gain and optional rig-bounded flinch context.

## @evidence contracts/development/design.md#principled-representation

Impact states carry SI mass/velocity; the unit world normal points from a to b and recoil gain is clinical degrees per N s.

## @evidence contracts/development/design.md#minimal-and-owned-surface

suggestCollisionResponse reuses resolveImpact and impactRecoil for collision diagnostics; skeleton and chain remain canonical humanoid contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A flinch requires both optional chain and skeleton at runtime; this suggestion is neither an applied physical impulse nor a guaranteed valid performed pose.
