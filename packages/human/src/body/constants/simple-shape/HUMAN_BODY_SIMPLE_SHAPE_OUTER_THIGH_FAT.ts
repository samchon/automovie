import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

type Term = IAutoMovieHumanBodySimpleShapeTable["terms"][number];

/**
 * Sex- and age-conditioned outer-thigh fat appearance. This is an authored gynoid distribution proxy on the shared skin, not an adipose compartment volume.
 *
 * The rows are authored MPFB-derived skin controls, not muscle or fat compartment measurements. Their age and sex sources and extrapolation limits are stated beside the relation they own.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_OUTER_THIGH_FAT: IAutoMovieHumanBodySimpleShapeTable["terms"] =
  [
    ...["outerThighFatLeft", "outerThighFatRight"].map(
      (channel): Term => ({
        // gynoid fat: the outer thighs, more on women, less with age
        channel,
        gain: 1,
        curves: [
          {
            parameter: "bodyMassIndex",
            points: [
              [22, 0],
              [28, 0.6],
              [35, 1],
            ],
          },
          {
            parameter: "sex",
            points: [
              [-1, 1],
              [1, 0.3],
            ],
          },
          {
            parameter: "ageYears",
            points: [
              [25, 1],
              [70, 0.6],
            ],
          },
        ],
      }),
    ),
  ];
