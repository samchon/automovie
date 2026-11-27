import type { IAutoMovieMaterial } from "../material/IAutoMovieMaterial";
import type { IAutoMovieModelPart } from "../model/IAutoMovieModelPart";
import type { IAutoMovieViolationAppendSurfaceItemsSink } from "./IAutoMovieViolationAppendSurfaceItemsSink";

/**
 * Input of `validateMaterialProcedural`, the engine's admission of one
 * material's procedural surface within its model.
 */
export namespace IAutoMovieValidateMaterialProcedural {
  /**
   * One material with the parts that may cite it, so a pattern piece's surface
   * can require UV0 on every part that cites it.
   */
  export type IProps = {
    /** The material whose `procedural` surface is admitted. */
    material: IAutoMovieMaterial;

    /** Diagnostic path of the material. */
    path: string;

    /** The model's parts, searched for parts that cite the material. */
    parts: readonly IAutoMovieModelPart[];

    /** Diagnostic path of the parts list. */
    partsPath: string;

    /** Collector receiving findings. */
    collector: IAutoMovieViolationAppendSurfaceItemsSink;
  };
}
