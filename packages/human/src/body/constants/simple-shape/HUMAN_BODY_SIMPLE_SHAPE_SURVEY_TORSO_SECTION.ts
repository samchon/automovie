import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Trunk breadth and depth section corrections from ANSUR II measurements.
 *
 * The 2012 ANSUR II working database contains 4,082 men, 1,986 women and 93 direct measurements. The connected body's authoring fit used a 300-person subset. These exterior and rig proportions are not internal bone geometry or a universal growth law.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_SURVEY_TORSO_SECTION: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
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
];
