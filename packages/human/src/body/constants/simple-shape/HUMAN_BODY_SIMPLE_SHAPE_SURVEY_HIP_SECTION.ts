import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Hip breadth and depth corrections fitted on the ANSUR II study subset. These exterior measurements do not determine the acetabular span or pelvic bone shape.
 *
 * ANSUR II is a 2012 US Army working database of 4,082 men and 1,986 women
 * with 93 direct measurements. The connected body's fit used a 300-person
 * study subset and authored interpolation beyond observed samples; neither
 * is a universal relation for children or unobserved populations. The table
 * assembly preserves these rows' original summation order.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_SURVEY_HIP_SECTION: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
    // The ANSUR II people rows (below): reproduced from their own sex, age,
    // stature, mass and chest and buttock girths, the survey's people read
    // buttocks, waists at the omphalion, thighs, crotches and (men's) hip
    // joints out of place. These rows are the channel weights over the body
    // mass index that minimize those unpinned residuals, fitted on all 300
    // surveyed people with the stature, the tape pins and the mass re-solved.
    // Each channel also pays for the ridge its field raises (its 1 to 4 cm
    // heat-diffusion band above a plain scale field's), since a fit that
    // matches tapes cannot see its surface: without that cost the women's
    // buttocks stood as pointed pads, and with it neither sex keeps a gluteal
    // projection or belly row. The rows fade to zero past the survey's
    // support, over the body mass index and over age, where they crossed the
    // census's extreme bodies (the study README).
    {
      // ANSUR II people: hipScaleHoriz, women
      channel: "hipScaleHoriz",
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
            [18, 0.143],
            [22, -0.119],
            [26, -0.342],
            [30, -0.544],
            [35, -0.789],
            [45, 0],
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
      // ANSUR II people: hipScaleDepth, women
      channel: "hipScaleDepth",
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
            [18, -0.053],
            [22, 0.0],
            [26, 0.068],
            [30, 0.168],
            [35, 0.268],
            [45, 0],
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
