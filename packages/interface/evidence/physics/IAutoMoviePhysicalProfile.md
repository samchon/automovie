# src/physics/IAutoMoviePhysicalProfile.ts#IAutoMoviePhysicalProfile

## @evidence contracts/development/design.md#principled-representation

Mass, centre of mass, principal inertia and explicit joint/collider frames specify a rigid articulation in kilograms, metres, seconds and radians; the validator checks numerical and cross-record invariants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Providers, physical simulation and auditing share this canonical description; optical materials and authored anatomical degrees remain separate contracts.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Bone names are unrestricted identities rather than a humanoid catalogue, and equipment changes physical mass instead of adding a second overlapping body.

## @evidence contracts/development/common.md#meaningful-documentation

Defines frame ownership, SI units, provider provenance and the validation path and its refusal-only behavior.
