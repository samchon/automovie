import type { IAutoMovieCompiledShotSource } from "../production/IAutoMovieCompiledShotSource";
import type { IAutoMovieRenderPlanting } from "./IAutoMovieRenderPlanting";
import type { IAutoMovieRenderSoftPanel } from "./IAutoMovieRenderSoftPanel";
import type { IAutoMovieRenderTextureResidency } from "./IAutoMovieRenderTextureResidency";
import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";
import type { IAutoMovieRenderWaterBody } from "./IAutoMovieRenderWaterBody";

/** Data and callback contracts shared by the RenderSubjectOfShot operations. */
export namespace IAutoMovieRenderSubjectOfShot {
  /**
   * Read a compiled shot as a render subject.
   *
   * The canonical compiled-shot adapter uses this field projection and derives
   * the artifact's simulated drawable rows. Other callers must supply those
   * rows explicitly; omitted supplemental arrays become empty. Texture upload
   * and residency facts come from the capture host, rather than the compiled
   * artifact.
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
