import { IAutoMovieCompiledFormationLod } from "@automovie/interface";

/** One automatic LOD decision with its combined selection metric. */
export interface IAutoMovieFormationLodSelection {
  /** Selected compiled tier. */
  lod: IAutoMovieCompiledFormationLod;
  /** Distance enlarged as projected contribution shrinks. */
  effectiveDistance: number;
}
