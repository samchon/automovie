import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Male exterior hip-height correction. The visible hip level is not an acetabular centre or pelvic-bone measurement.
 *
 * The 2012 ANSUR II working database contains 4,082 men, 1,986 women and 93 direct measurements. The connected body's authoring fit used a 300-person subset. These exterior and rig proportions are not internal bone geometry or a universal growth law.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_SURVEY_HIP_HEIGHT_MALE: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
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
