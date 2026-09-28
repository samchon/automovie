/**
 * ANSUR II torso, limb-length and pelvic-height fits.
 * These ordered rows are authored data of the simple body table, not a
 * second evaluator. Curves and source notes remain beside each row.
 */
import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Ordered ANSUR II fits for trunk section, limb length and pelvic height.
 *
 * The current table stores this contiguous sequence together to preserve
 * floating-point summation order. Its row notes distinguish waist/bust
 * sections from anthropometric limb lengths and vertical hip placement.
 * These are visible exterior and rig proportions, not estimates of internal
 * bone geometry. The 2012 ANSUR II working database contains 4,082 men and
 * 1,986 women measured in the US Army; it is not a universal body prior.
 * `HUMAN_BODY_SIMPLE_SHAPE` composes these rows after the distal survey terms.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_SURVEY_TRUNK: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
    {
      // ANSUR II people: torsoScaleHoriz, women. The waist section stood too
      // wide and too flat; fitted with the other rows.
      channel: "torsoScaleHoriz",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.023],
            [22, -0.181],
            [26, -0.377],
            [30, -0.544],
            [35, -0.702],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: torsoScaleDepth, women. The waist section stood too
      // wide and too flat; fitted with the other rows.
      channel: "torsoScaleDepth",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [0, 0],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.137],
            [22, 0.202],
            [26, 0.214],
            [30, 0.166],
            [35, 0.112],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: measureUpperlegHeight, men. The reproduced men's hip
      // joint stood 51 mm above the survey's trochanterion and their knee 29 mm
      // high: the legs about 5 cm long for their stature, the pelvis and buttock
      // high with them. Both leg segments shorten together with the stature re-
      // solved; the survey's people are 17 and older, so the row rises from
      // nothing at 11 to its full value at 17.
      channel: "measureUpperlegHeight",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.094],
            [22, -0.05],
            [26, -0.23],
            [30, -0.436],
            [35, -0.639],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: measureLowerlegHeight, men. The reproduced men's hip
      // joint stood 51 mm above the survey's trochanterion and their knee 29 mm
      // high: the legs about 5 cm long for their stature, the pelvis and buttock
      // high with them. Both leg segments shorten together with the stature re-
      // solved; the survey's people are 17 and older, so the row rises from
      // nothing at 11 to its full value at 17.
      channel: "measureLowerlegHeight",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.094],
            [22, -0.05],
            [26, -0.23],
            [30, -0.436],
            [35, -0.639],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: torsoScaleHoriz, men. The waist section stood too wide
      // and too flat; fitted with the other rows.
      channel: "torsoScaleHoriz",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, -0.377],
            [22, -0.179],
            [26, 0.045],
            [30, 0.309],
            [35, 0.551],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: torsoScaleDepth, men. The waist section stood too wide
      // and too flat; fitted with the other rows.
      channel: "torsoScaleDepth",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, -0.46],
            [22, -0.327],
            [26, -0.105],
            [30, 0.224],
            [35, 0.49],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: hipScaleVert, men. A taller pelvis lowers the
      // reproduced men's crotch, fitted with the other rows.
      channel: "hipScaleVert",
      gain: 1,
      curves: [
        {
          parameter: "sex",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [15, 0],
            [18, 0.088],
            [22, 0.088],
            [26, 0.082],
            [30, 0.111],
            [35, 0.09],
            [40, 0],
          ],
        },
        {
          parameter: "ageYears",
          points: [
            [11, 0],
            [17, 1],
            [60, 1],
            [80, 0],
          ],
        },
      ],
    },
];
