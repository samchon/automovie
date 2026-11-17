import type { IAutoMovieHumanMouth } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanMouth. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanMouthSchema = IAutoMovieHumanMouth & {
  /** Cheilion to cheilion. */
  width: number & tags.Minimum<15> & tags.Maximum<90>;

  /** Labiale superius to stomion. */
  upperVermilionHeight: number & tags.Minimum<1> & tags.Maximum<25>;

  /** Stomion to labiale inferius. */
  lowerVermilionHeight: number & tags.Minimum<1> & tags.Maximum<25>;
};
