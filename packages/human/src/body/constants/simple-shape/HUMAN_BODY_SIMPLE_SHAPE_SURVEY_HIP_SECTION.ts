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
export const HUMAN_BODY_SIMPLE_SHAPE_SURVEY_HIP_SECTION: IAutoMovieHumanBodySimpleShapeTable["terms"] =
  [
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
      // ANSUR II people: hipScaleHoriz, women. Refit under the rearmost hip
      // rule: read the way the survey reads it, the r10 knots left a woman's
      // buttock circumference 25 mm (thin), 26 mm (average) and 45 mm
      // (heavy) above the survey's across 60 women spread over the 1st to
      // 99th body mass index percentile (`ansur-proportion-census.ts`, identity
      // card only), and lying the legs together changed that tape by under
      // 11 mm, so the stance was not the cause. Each knot below is the r10
      // value less the bias the census measured at its body mass index, over
      // 70 mm per unit of this channel, which the census measured by two
      // offsets (-0.1 and -0.2). The channel's own limit is -1, so the
      // heavy knots stop there and keep the part of the bias this row cannot
      // reach.
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
            [18, -0.207],
            [22, -0.469],
            [26, -0.742],
            [30, -1],
            [35, -1],
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
