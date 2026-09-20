import { IAutoMovieCompiledShotSource } from "@automovie/interface";
import { IAutoMovieRenderPlanting } from "./IAutoMovieRenderPlanting";
import { IAutoMovieRenderSoftPanel } from "./IAutoMovieRenderSoftPanel";
import { IAutoMovieRenderSubject } from "./IAutoMovieRenderSubject";
import { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";
import { IAutoMovieRenderWaterBody } from "./IAutoMovieRenderWaterBody";

/**
 * Read a compiled shot as a render subject.
 *
 * One conversion is the point: every evidence path reading its subject here
 * would measure the same artifact. The test suite is currently the only caller,
 * so that is a property of the signature and not of the pipeline. It becomes a
 * property of the pipeline when the inventory path and the capture path both
 * take their subject from this call instead of assembling one each.
 *
 * Simulated drawables and texture dimensions are not carried by the compiled
 * shot yet and are supplied by the caller, which is why they are separate
 * arguments rather than silently defaulted to empty inside a report that would
 * then read as complete.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Combines staged nodes, models, instances, simulated drawables, and texture facts into the inventory's measurement boundary.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Prevents mask and budget preflight from assembling different drawable closures for the same compiled shot.
 */
export const autoMovieRenderSubjectOfShot = (props: {
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
});
