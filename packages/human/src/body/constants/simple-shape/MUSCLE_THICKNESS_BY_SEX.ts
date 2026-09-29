/**
 * Sex-conditioned superficial muscle thickness used by the regional and
 * definition term populations. The paired CT and muscle-share evidence
 * remains beside the value so both consumers read one named relation.
 */
import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

type Term = IAutoMovieHumanBodySimpleShapeTable["terms"][number];

/**
 * Sex-conditioned superficial muscle-relief multiplier shared by two terms.
 *
 * Kelly et al.'s L3 CT sample of 348 adults found a mean rectus abdominis
 * thickness of 0.97 cm in 109 women and 1.15 cm in 239 men
 * (doi:10.1016/j.acra.2021.06.005). Their ratio is about 0.84. Janssen et
 * al.'s whole-body MRI study of 468 adults found a larger sex difference in
 * upper- than lower-body muscle distribution
 * (doi:10.1152/jappl.2000.89.1.81). The latter is not a measurement of local
 * skin relief or thickness. The shared 0.84 point is an authored proxy for
 * visible relief, not a universal thickness field: subcutaneous tissue,
 * individual muscle shape and site-specific anatomy remain separate.
 */
export const MUSCLE_THICKNESS_BY_SEX = {
  parameter: "sex",
  points: [
    [-1, 0.84],
    [1, 1],
  ],
} as const satisfies Term["curves"][number];
