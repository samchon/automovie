import type { IAutoMovieHumanBrowAppearance } from "@automovie/interface";
import type { tags } from "typia";

/**
 * One eyebrow's appearance for a typia validator or schema. Optional thickness
 * is a width multiplier. Optional density is a fraction of covered skin at the
 * full body of the brow.
 */
export type IAutoMovieHumanBrowAppearanceSchema =
  IAutoMovieHumanBrowAppearance & {
    /**
     * Multiplier on the brow's reference width, from 0.3 to 2.
     */
    thickness?: number & tags.Minimum<0.3> & tags.Maximum<2>;

    /**
     * Skin coverage at the full body of the brow, from bare skin (0) to solid colour (1).
     */
    density?: number & tags.Minimum<0> & tags.Maximum<1>;
  };
