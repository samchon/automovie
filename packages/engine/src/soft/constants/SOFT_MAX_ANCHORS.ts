/**
 * Anchors one panel may declare.
 *
 * @evidence requirements/effects-and-simulation/soft-bodies-and-deformation.md#effects-soft-anchors Bounds the static and moving attachment inventory.
 * @evidence specifications/simulation-effects-and-sound/soft-bodies-and-deformation.md#soft-static-moving-anchor-input Keeps anchor evaluation finite at each fixed-step boundary.
 * @author Samchon
 */
export const SOFT_MAX_ANCHORS = 4_096;
