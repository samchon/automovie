/**
 * ANSUR II fitted pelvic and breast relations across survey people.
 * These ordered rows are authored data of the simple body table, not a
 * second evaluator. Curves and source notes remain beside each row.
 */
import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Ordered ANSUR II fits for hip breadth/depth, proximal limb tissue and
 * breast-point height in the current contiguous table segment.
 *
 * The rows are regression-like corrections to the MPFB-derived skin, using
 * the survey measurements and covariates identified beside each term. The
 * 2012 ANSUR II working database has 4,082 men, 1,986 women and 93 direct
 * measurements (US Army Public Health Center). These outer measurements
 * do not infer acetabular width or pelvic bone shape from outer hip girth;
 * those quantities cannot be linked by one uniform pelvic scale. The adult
 * US Army population does not establish a growth law for children or
 * unobserved body forms.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_SURVEY_PELVIS: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
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
    {
      // ANSUR II people: upperlegFatLeft, women
      channel: "upperlegFatLeft",
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
            [22, 0.084],
            [26, 0.068],
            [30, 0.015],
            [35, 0.036],
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
      // ANSUR II people: upperlegFatRight, women
      channel: "upperlegFatRight",
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
            [22, 0.084],
            [26, 0.068],
            [30, 0.015],
            [35, 0.036],
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
      // ANSUR II people: lowerlegFatLeft, women
      channel: "lowerlegFatLeft",
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
            [18, 0.006],
            [22, 0.099],
            [26, 0.155],
            [30, 0.119],
            [35, 0.052],
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
      // ANSUR II people: lowerlegFatRight, women
      channel: "lowerlegFatRight",
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
            [18, 0.006],
            [22, 0.099],
            [26, 0.155],
            [30, 0.119],
            [35, 0.052],
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
      // ANSUR II people: breastTransDownUp, women
      channel: "breastTransDownUp",
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
            [18, -0.594],
            [22, -0.257],
            [26, 0.083],
            [30, 0.411],
            [40, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: hipScaleVert, women. The reproduced women's crotch
      // stood below theirs; a shorter pelvis raises the crotch by 20 mm per
      // unit with stature, girths and mass re-solved, but also lowers the
      // buttock and points it, so under the fit's surface cost it stays
      // small. It fades as the other rows do past the survey's support (a
      // thin woman of 90 folded her thigh)
      channel: "hipScaleVert",
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
            [18, -0.102],
            [22, -0.143],
            [26, -0.145],
            [30, -0.1],
            [35, -0.037],
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
