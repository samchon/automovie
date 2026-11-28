import type { IAutoMovieHumanAcne } from "@automovie/interface";
import type { tags } from "typia";

/**
 * Acne mark input for a typia validator or schema. Density specifies expected
 * facial spots per square centimetre. The diameter is a maximum in
 * rest-surface millimetres and severity describes normalized redness.
 */
export type IAutoMovieHumanAcneSchema = IAutoMovieHumanAcne & {
  /** Expected spots per square centimetre of rest surface on the face, 0 to 10. */
  density: number & tags.Minimum<0> & tags.Maximum<10>;

  /** Maximum inflamed spot diameter in rest-surface millimetres, 3 to 10. */
  diameterMm: number & tags.Minimum<3> & tags.Maximum<10>;

  /** Redness coverage in [0, 1]. */
  severity: number & tags.Minimum<0> & tags.Maximum<1>;
};
