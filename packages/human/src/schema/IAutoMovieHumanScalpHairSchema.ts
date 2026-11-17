import type { IAutoMovieHumanScalpHair } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanScalpHair. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanScalpHairSchema = IAutoMovieHumanScalpHair & {
  /**
   * Length of the longest scalp hair from the scalp to the tip, straightened, millimetres; zero is a shaved scalp. The style shapes how lengths vary over the scalp: a crop is even, a short cut tapers to a third of this at the nape and sides, and a bob ends at a level this far below the vertex.
   */
  length: number & tags.Minimum<0> & tags.Maximum<1500>;
};
