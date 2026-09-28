import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Authored abdominal overhang and flank-fat response to age, BMI and sex. The visible skin endpoints are not segmented abdominal fat or a clinical measurement.
 *
 * The rows are authored MPFB-derived skin controls, not muscle or fat compartment measurements. Their age and sex sources and extrapolation limits are stated beside the relation they own.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_ABDOMINAL_FAT: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
    {
      channel: "stomachOverhang",
      gain: 1,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [25, 0],
            [30, 0.4],
            [35, 0.8],
            [40, 1],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [20, 0.8],
            [60, 1],
          ],
        },
      ],
    },
    {
      // android fat: the flanks, more on men and with age
      channel: "flankFat",
      gain: 1,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [27, 0.5],
            [35, 1],
          ],
        },
        {
          parameter: "sex",
          points: [
            [-1, 0.6],
            [1, 1],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [25, 0.8],
            [65, 1],
          ],
        },
      ],
    },
];
