# src/soft/IAutoMovieSoftBodyResolvedCapsule.ts#IAutoMovieSoftBodyResolvedCapsule

## @evidence contracts/development/design.md#principled-representation

Two resolved endpoints and a radius define the same segment-plus-ball proxy as body validation, keeping collision geometry separate from the rig that generated it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Stable capsule identity joins an authored body collider to its current geometry without embedding an actor pose or skeleton in the soft solver.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Complete boundary admission checks authored identities and finite positive geometry, so an unresolved body capsule is not replaced by a generic sphere or origin segment.

## @evidence contracts/development/common.md#meaningful-documentation

States proxy meaning, world-metre endpoints, absolute-step provenance and stable source identity.
