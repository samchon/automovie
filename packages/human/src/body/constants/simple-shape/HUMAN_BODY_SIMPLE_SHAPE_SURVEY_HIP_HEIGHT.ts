import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Vertical hip-region correction fitted on the ANSUR II study subset. External height is not an internal femoral-head or acetabular measurement.
 *
 * ANSUR II is a 2012 US Army working database of 4,082 men and 1,986 women
 * with 93 direct measurements. The connected body's fit used a 300-person
 * study subset and authored interpolation beyond observed samples; neither
 * is a universal relation for children or unobserved populations. The table
 * assembly preserves these rows' original summation order.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_SURVEY_HIP_HEIGHT: IAutoMovieHumanBodySimpleShapeTable["terms"] =
  [
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
