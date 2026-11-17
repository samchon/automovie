import type {
  IAutoMovieRenderSubject,
  IAutoMovieRenderSubjectOfShot,
} from "@automovie/interface";

/**
 * Read a compiled shot as a render subject.
 *
 * The canonical compiled-shot adapter uses this field projection and derives
 * the artifact's simulated drawable rows. Other callers must supply those rows
 * explicitly; omitted supplemental arrays become empty. Texture upload and
 * residency facts come from the capture host, rather than the compiled artifact.
 *
 * @evidence contracts/development/implementation.md#principled-implementation Project ordinary compiled scene/models/environments/populations/effects into one render subject and attach caller-supplied simulation/texture facts; absent supplemental arrays become empty under this lower-level adapter's explicit contract.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure This shared projection is consumed by autoMovieRenderSubjectOfCompiledShot, which derives simulated rows; callers needing complete artifact coverage use that canonical conversion.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Empty supplemental arrays are a caller responsibility rather than proof that a compiled artifact has no domains; this adapter does not synthesize missing texture bytes or branch geometry costs.
 * @evidence contracts/development/common.md#meaningful-documentation Docs identify borrowed compiled records, optional supplemental facts and omitted-residency fresh-context meaning, correcting the obsolete claim that this has only test callers.
 * @evidence contracts/development/implementation.md#efficient-algorithms The adapter creates one fixed-field record and borrows arrays, so work/storage is O(1) apart from newly allocated empty defaults; expensive derivation belongs to the canonical caller.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Canonical compiled conversion shares this field projection; result references intentionally track input arrays, so caching would not create an immutable subject snapshot.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned subject owns its wrapper and defaults while input arrays remain caller-owned; no domain solver, texture handle or task is retained.
 */
export const autoMovieRenderSubjectOfShot: (
  props: IAutoMovieRenderSubjectOfShot.IProps,
) => IAutoMovieRenderSubject = (
  props: IAutoMovieRenderSubjectOfShot.IProps,
): IAutoMovieRenderSubject => ({
  scene: props.compiled.scene,
  models: props.compiled.models,
  environments: props.compiled.builtEnvironments ?? [],
  instanceSets: props.compiled.instanceSets,
  formations: props.compiled.formations,
  effects: props.compiled.effects,
  waterBodies: props.waterBodies ?? [],
  softBodies: props.softBodies ?? [],
  plantings: props.plantings ?? [],
  textures: props.textures ?? [],
  textureResidency: props.textureResidency,
});
