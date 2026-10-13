import { IAutoMovieCompiledFormationLod } from "./IAutoMovieCompiledFormationLod";

/** One builder-resolved reusable prototype in a general instance set. */
export interface IAutoMovieCompiledInstancePrototype {
  /** Stable source prototype id. */
  id: string;

  /** Source model recipe. */
  modelRecipe: string;

  /** Positive deterministic selection weight. */
  weight: number;

  /** Ordered automatic LOD representations for this prototype. */
  lod: IAutoMovieCompiledFormationLod[];

  /** Conservative source-model radius before per-slot scaling. */
  projectionRadius: number;
}
