/**
 * Greatest number of lattice cells one zone may be enumerated over.
 *
 * @evidence requirements/interior/textures-patterns-and-variation.md#interior-pattern-source `AUTOMOVIE_MAX_PATTERN_CELLS` fixes the greatest number of lattice cells one zone may be enumerated over. This ensures authored physical-module placement and texture sampling remain under project control.
 * @evidence specifications/interior-space/patterns-tolerances-and-aging.md#interior-space-physical-module-pattern `AUTOMOVIE_MAX_PATTERN_CELLS` bounds the max pattern cells policy while the engine resolves the declared physical-module pattern deterministically.
 * @evidence requirements/building-exterior/patterns-and-instances.md#building-exterior-instance-bounded-expansion `AUTOMOVIE_MAX_PATTERN_CELLS` hard-bounds the number of repeated facade lattice cells one zone may expand before the Engine refuses it.
 * @evidence specifications/building-envelope/external-assets-patterns-and-instances.md#building-envelope-repeated-building-budget-failures `AUTOMOVIE_MAX_PATTERN_CELLS` provides the deterministic expansion ceiling used by the repeated-building pattern refusal.
 */
export const AUTOMOVIE_MAX_PATTERN_CELLS = 1_000_000;
