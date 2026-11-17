import type { IAutoMovieHumanBrowAppearance } from "@automovie/interface";
import type { tags } from "typia";

/** Typia admission/schema metadata for IAutoMovieHumanBrowAppearance. The canonical shape belongs to interface; this refinement adds its existing ranges and nested schema metadata. Import this schema type when generating validators or schemas: the plain canonical type intentionally carries no typia dependency. */
export type IAutoMovieHumanBrowAppearanceSchema =
  IAutoMovieHumanBrowAppearance & {
    /**
     * Factor on the brow's width across its length (Park 2017's widths: 9 mm above the medial canthus, 2 mm at the tail); omitted, 1.
     */
    thickness?: number & tags.Minimum<0.3> & tags.Maximum<2>;

    /**
     * Coverage of the skin by brow hair at the brow's full body, from bare skin (0) to solid colour (1); it thins toward the head and the tail as hair does. Omitted, 0.85.
     */
    density?: number & tags.Minimum<0> & tags.Maximum<1>;
  };
