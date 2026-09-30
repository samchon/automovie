import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";
import { MUSCLE_THICKNESS_BY_SEX } from "./MUSCLE_THICKNESS_BY_SEX";

type Term = IAutoMovieHumanBodySimpleShapeTable["terms"][number];

/**
 * Abdominal, deltoid and scapular visible definition. Kelly et al. (doi:10.1016/j.acra.2021.06.005) measured L3 rectus thickness and Janssen et al. (doi:10.1152/jappl.2000.89.1.81) regional muscle mass; applying one multiplier to several superficial regions is an authored proxy.
 *
 * These dimensionless rows set visible skin channel weights. They neither reconstruct tissue volumes nor establish safe contact in a combined pose.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_MUSCLE_RELIEF: IAutoMovieHumanBodySimpleShapeTable["terms"] =
  [
    {
      channel: "absDefinition",
      gain: 1,
      curves: [
        MUSCLE_THICKNESS_BY_SEX,
        {
          parameter: "developedMuscle",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          // the rectus shows in outline at about 10-12 percent fat on a man
          // and 20-22 on a woman and distinctly below about 9 and 16: over
          // each sex's essential fat, one band (consumer body-composition
          // guidance, not a clinical study)
          parameter: "excessFatPercent",
          points: [
            [2, 1],
            [5, 0.7],
            [9, 0.3],
            [14, 0],
          ],
        },
      ],
    },
    ...[
      "deltoidDefinitionLeft",
      "deltoidDefinitionRight",
      "scapularDefinition",
    ].map(
      (channel): Term => ({
        channel,
        gain: 1,
        curves: [
          MUSCLE_THICKNESS_BY_SEX,
          {
            parameter: "developedMuscle",
            points: [
              [0, 0],
              [1, 1],
            ],
          },
          {
            parameter: "excessFatPercent",
            points: [
              [8, 1],
              [16, 0],
            ],
          },
        ],
      }),
    ),
  ];
