import type { IAutoMovieCompiledShotSource } from "../production/IAutoMovieCompiledShotSource";
import type { IAutoMovieRenderPlanting } from "./IAutoMovieRenderPlanting";
import type { IAutoMovieRenderSoftPanel } from "./IAutoMovieRenderSoftPanel";
import type { IAutoMovieRenderTextureResidency } from "./IAutoMovieRenderTextureResidency";
import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";
import type { IAutoMovieRenderWaterBody } from "./IAutoMovieRenderWaterBody";

/**
 * Data and callback contracts shared by the RenderSubjectOfShot operations.
 *
 * @evidence contracts/development/design.md#principled-representation A compiled shot plus optional water, cloth and planting rows describe the selected drawable world; omitted supplemental arrays mean empty.
 * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieRenderSubjectOfShot is the shared field projection used by the complete compiled-shot adapter and explicit-subset callers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Omission does not infer simulation rows from the artifact; callers requiring full domain coverage use the compiled-shot adapter.
 * @evidence contracts/development/common.md#meaningful-documentation Documents supplemental-array absence and separate host ownership of texture facts.
 */
export namespace IAutoMovieRenderSubjectOfShot {
  /**
   * Read a compiled shot as a render subject.
   *
   * The canonical compiled-shot adapter uses this field projection and derives
   * the artifact's simulated drawable rows. Other callers must supply those rows
   * explicitly; omitted supplemental arrays become empty. Texture upload and
   * residency facts come from the capture host, rather than the compiled artifact.
   *
   * @evidence contracts/development/design.md#principled-representation A compiled shot plus optional water, cloth and planting rows describe the selected drawable world; omitted supplemental arrays mean empty.
   * @evidence contracts/development/design.md#minimal-and-owned-surface autoMovieRenderSubjectOfShot is the shared field projection used by the complete compiled-shot adapter and explicit-subset callers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Omission does not infer simulation rows from the artifact; callers requiring full domain coverage use the compiled-shot adapter.
   * @evidence contracts/development/common.md#meaningful-documentation Documents supplemental-array absence and separate host ownership of texture facts.
   */
  export type IProps = {
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
  };
}
