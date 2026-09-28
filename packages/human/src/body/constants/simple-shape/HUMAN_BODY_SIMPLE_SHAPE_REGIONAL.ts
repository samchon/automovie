/**
 * Regional abdominal, breast, neck and limb tissue relations.
 * These ordered rows are authored data of the simple body table, not a
 * second evaluator. Curves and source notes remain beside each row.
 */
import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";
import { MUSCLE_THICKNESS_BY_SEX } from "./MUSCLE_THICKNESS_BY_SEX";

type Term = IAutoMovieHumanBodySimpleShapeTable["terms"][number];

/**
 * Ordered abdominal, breast, neck and limb appearance relations.
 *
 * The sex-dependent relief curve shares the L3 CT rectus-thickness observation
 * of Kelly et al. (doi:10.1016/j.acra.2021.06.005) and whole-body MRI muscle
 * distribution of Janssen et al. (doi:10.1152/jappl.2000.89.1.81) with
 * `MUSCLE_THICKNESS_BY_SEX`. Fat visibility,
 * breast position and regional fullness rows have their own source notes and
 * authored interpolation knots beside them. Their product is a channel weight
 * for the connected MPFB-derived skin, not a measured tissue thickness or an
 * independent anatomical compartment. `HUMAN_BODY_SIMPLE_SHAPE` preserves
 * their order when composing the simple editor tier.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_REGIONAL: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
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
    {
      // the breast descends with age, most across menopause, and with body mass (Regnault grades; post-menopause and BMI are independent risk factors)
      channel: "breastTransDownUp",
      gain: -0.6,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [25, 0],
            [45, 0.3],
            [55, 0.7],
            [80, 1],
          ],
        },
      ],
    },
    {
      // heavier breasts descend further
      channel: "breastTransDownUp",
      gain: -0.3,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [30, 0.7],
            [40, 1],
          ],
        },
      ],
    },
    {
      // the lower pole fills as the gland involutes to fat
      channel: "breastVolumeVertDownUp",
      gain: -0.5,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [50, 0.4],
            [70, 0.9],
            [90, 1],
          ],
        },
      ],
    },
    {
      // and loses projection
      channel: "breastPoint",
      gain: -0.4,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [60, 0.7],
            [85, 1],
          ],
        },
      ],
    },
    {
      // breast volume tracks body fat (the breast is largely adipose)
      channel: "macroCupsize",
      gain: 0.5,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [18, -0.6],
            [22, 0],
            [30, 0.6],
            [40, 1],
          ],
        },
      ],
    },
    {
      // an adipose male chest (pseudogynecomastia) with body mass, held back by the pectoral muscle
      channel: "macroCupsize",
      gain: 0.4,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [26, 0],
            [32, 0.6],
            [40, 1],
          ],
        },
        {
          parameter: "developedMuscle",
          points: [
            [-1, 1],
            [0, 1],
            [1, 0.4],
          ],
        },
      ],
    },
    {
      // the abdominal wall's tone: raised by muscle
      channel: "stomachTone",
      gain: 0.5,
      curves: [
        {
          parameter: "developedMuscle",
          points: [
            [-1, -1],
            [1, 1],
          ],
        },
      ],
    },
    {
      // lost with age (diastasis and laxity)
      channel: "stomachTone",
      gain: -0.5,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [30, 0],
            [60, 0.6],
            [90, 1],
          ],
        },
      ],
    },
    {
      // and with abdominal fat
      channel: "stomachTone",
      gain: -0.4,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [25, 0],
            [32, 0.6],
            [40, 1],
          ],
        },
      ],
    },
    {
      // the navel lowers as abdominal fat grows
      channel: "stomachNavelDownUp",
      gain: -0.4,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [25, 0],
            [35, 0.7],
            [45, 1],
          ],
        },
      ],
    },
    {
      // submental fat with body mass
      channel: "neckDouble",
      gain: 0.8,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [25, 0],
            [32, 0.5],
            [40, 1],
          ],
        },
      ],
    },
    {
      // and with age as the neck's skin loosens
      channel: "neckDouble",
      gain: 0.3,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [40, 0],
            [80, 1],
          ],
        },
      ],
    },
    {
      // upper-arm fat, more on women (triceps site)
      channel: "upperarmFatLeft",
      gain: 0.6,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0.4],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [30, 0.6],
            [40, 1],
          ],
        },
      ],
    },
    {
      // thigh fat, more on women (gynoid, front and lateral thigh sites)
      channel: "upperlegFatLeft",
      gain: 0.5,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0.3],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [30, 0.6],
            [40, 1],
          ],
        },
      ],
    },
    {
      // upper-arm fat, more on women (triceps site)
      channel: "upperarmFatRight",
      gain: 0.6,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0.4],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [30, 0.6],
            [40, 1],
          ],
        },
      ],
    },
    {
      // thigh fat, more on women (gynoid, front and lateral thigh sites)
      channel: "upperlegFatRight",
      gain: 0.5,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0.3],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [30, 0.6],
            [40, 1],
          ],
        },
      ],
    },
];
