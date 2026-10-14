import { IAutoMovieCompiledShotSource } from "@automovie/interface";

import { IAutoMovieRenderPlanting } from "./IAutoMovieRenderPlanting";
import { IAutoMovieRenderSoftPanel } from "./IAutoMovieRenderSoftPanel";
import { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import type { IAutoMovieRenderTextureResidency } from "./IAutoMovieRenderTextureResidency";
import { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";
import { IAutoMovieRenderWaterBody } from "./IAutoMovieRenderWaterBody";

/**
 * Read a compiled shot as a render subject.
 *
 * The canonical compiled-shot adapter uses this field projection and derives
 * the artifact's simulated drawable rows. Other callers must supply those rows
 * explicitly; omitted supplemental arrays become empty. Texture upload and
 * residency facts come from the capture host, rather than the compiled artifact.
 *
 * @evidence contracts/common.md#principled-implementation Project ordinary compiled scene/models/environments/populations/effects into one render subject and attach caller-supplied simulation/texture facts; absent supplemental arrays become empty under this lower-level adapter's explicit contract.
 * @evidence contracts/common.md#clear-and-simple-design This shared projection is consumed by autoMovieRenderSubjectOfCompiledShot, which derives simulated rows; callers needing complete artifact coverage use that canonical conversion.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty supplemental arrays are a caller responsibility rather than proof that a compiled artifact has no domains; this adapter does not synthesize missing texture bytes or branch geometry costs.
 * @evidence contracts/common.md#meaningful-documentation Docs identify borrowed compiled records, optional supplemental facts and omitted-residency fresh-context meaning, correcting the obsolete claim that this has only test callers.
 * @evidence contracts/performance.md#efficient-algorithms The adapter creates one fixed-field record and borrows arrays, so work/storage is O(1) apart from newly allocated empty defaults; expensive derivation belongs to the canonical caller.
 * @evidence contracts/performance.md#reuse-equivalent-work Canonical compiled conversion shares this field projection; result references intentionally track input arrays, so caching would not create an immutable subject snapshot.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned subject owns its wrapper and defaults while input arrays remain caller-owned; no domain solver, texture handle or task is retained.
 */
export const autoMovieRenderSubjectOfShot: (props: {
  compiled: IAutoMovieCompiledShotSource;
  waterBodies?: readonly IAutoMovieRenderWaterBody[];
  softBodies?: readonly IAutoMovieRenderSoftPanel[];
  plantings?: readonly IAutoMovieRenderPlanting[];
  textures?: readonly IAutoMovieRenderTextureSource[];
  textureResidency?: IAutoMovieRenderTextureResidency;
}) => IAutoMovieRenderSubject = (props: {
  /** Fully builder-owned shot artifact. */
  compiled: IAutoMovieCompiledShotSource;
  /** Declared water bodies, if the production has any. */
  waterBodies?: readonly IAutoMovieRenderWaterBody[];
  /** Declared cloth panels, if the production has any. */
  softBodies?: readonly IAutoMovieRenderSoftPanel[];
  /** Declared planting clusters, if the production has any. */
  plantings?: readonly IAutoMovieRenderPlanting[];
  /** Known texture dimensions, if the caller resolved the assets. */
  textures?: readonly IAutoMovieRenderTextureSource[];
  /** Other live scopes and context-retained texture storage, when not fresh. */
  textureResidency?: IAutoMovieRenderTextureResidency;
}): IAutoMovieRenderSubject => ({
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
