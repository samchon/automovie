# src/architecture/IAutoMovieBuiltFloatingBody.ts#IAutoMovieBuiltFloatingBody

## @evidence contracts/development/design.md#principled-representation

The subject's union AABB supplies its underside and footprint; the highest candidate part-box top within underside plus tolerance and positive XZ overlap supplies below. Static CPU boxes and compact population envelopes can bridge empty space, so this is nearest-proxy classification, not proof that a sloped/stepped mesh has clear air or physical support over its actual underside.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A floating finding is a locator, its basis, and one nullable nearest-body pair; the census counts and the cost live on `IAutoMovieBuiltSupportSweepReport`, so this record carries only what tells one finding from another.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The basis excludes `surface-height-rule` because the sweep's subjects are only elements and populations, and the clearance threshold is the caller's tolerance with no body kind or id treated differently.

## @evidence contracts/development/common.md#meaningful-documentation

States that the finding is a measurement rather than a support claim, what "under" means geometrically, that clearance is in metres and always above the tolerance, and that a null `below` means nothing measurable lies underneath.
