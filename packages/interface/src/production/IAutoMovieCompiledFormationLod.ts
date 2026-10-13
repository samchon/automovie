import { AutoMovieContentDigest } from "./AutoMovieContentDigest";

/** One camera-selected runtime representation for anonymous formation slots. */
export interface IAutoMovieCompiledFormationLod {
  /** Semantic near-to-far tier. */
  tier: "hero" | "near" | "far";

  /** Positive maximum distance, or null only for the final tier. */
  maxDistance: number | null;

  /** Design recipe id. */
  recipe: string;

  /** Exact current recipe digest, including geometry and palette parameters. */
  recipeDigest: AutoMovieContentDigest;

  /** Compiler-owned runtime model id. */
  model: string;
}
