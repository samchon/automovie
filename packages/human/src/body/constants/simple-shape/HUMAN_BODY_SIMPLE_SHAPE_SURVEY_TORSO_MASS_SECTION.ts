import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Mass-conditioned trunk breadth and depth corrections in the sampled survey population.
 *
 * The 2012 ANSUR II working database contains 4,082 men, 1,986 women and 93 direct measurements. The connected body's authoring fit used a 300-person subset. These exterior and rig proportions are not internal bone geometry or a universal growth law.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_SURVEY_TORSO_MASS_SECTION: IAutoMovieHumanBodySimpleShapeTable["terms"] =
  [
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
  ];
