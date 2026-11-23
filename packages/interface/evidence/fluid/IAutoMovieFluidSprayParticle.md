# src/fluid/IAutoMovieFluidSprayParticle.ts#IAutoMovieFluidSprayParticle

## @evidence contracts/development/design.md#principled-representation

sampleFluidSpray combines seeded spawn-index jitter and age time - index / rate into a closed-form ballistic position. Valid domain/state and representable index, direction and age arithmetic remain sampling premises; this record performs no admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Emitter id and spawn index identify the sample, while position, size and ageRatio supply projection attributes; velocity and launch direction stay with sampling rather than being duplicated here.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Size is copied from the emitter without age/distance scaling. Float32 projection may round values, and the default point material leaves per-particle size and age unused rather than implementing implicit fading.

## @evidence contracts/development/common.md#meaningful-documentation

Identifies producer, emitter-scoped spawn identity, ballistic metre position, size and age conventions, Float32 projection and default-material limitations.
