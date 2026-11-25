import type { IAutoMovieMaterial } from "../material/IAutoMovieMaterial";
import type { IAutoMovieModelPart } from "../model/IAutoMovieModelPart";
import type { IAutoMovieViolationCollector } from "./IAutoMovieViolationCollector";

/** Data and callback contracts shared by the ValidateMaterialLobes operations. */
export namespace IAutoMovieValidateMaterialLobes {
  /**
   * Admit the optional anisotropy, sheen and specular-intensity lobes of one
   * material: record shapes, `[0, 1]` strengths and roughness, a finite
   * rotation and a linear sheen colour.
   *
   * Absent lobes are left alone, because omission is the renderer's neutral
   * response. The anisotropy direction image is admitted with every other
   * binding by `materialTextureSlots`, and a part citing an anisotropic
   * material must be a mesh carrying UV0, because the highlight direction is
   * measured in that tangent frame and tessellated primitives emit no texture
   * coordinates.
   */
  export type IProps = {
    /** The material whose lobes are admitted. */
    material: IAutoMovieMaterial;

    /** Diagnostic path of the material. */
    path: string;

    /** The model's parts, searched for meshes that cite the material. */
    parts: readonly IAutoMovieModelPart[];

    /** Diagnostic path of the parts list. */
    partsPath: string;

    /** Collector receiving findings. */
    collector: IAutoMovieViolationCollector;
  };
}
