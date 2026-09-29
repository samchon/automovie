import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Upper- and lower-leg length corrections from anthropometric height measurements. These are rig and exterior proportions, not femoral or tibial mesh lengths.
 *
 * The 2012 ANSUR II working database contains 4,082 men, 1,986 women and 93 direct measurements. The connected body's authoring fit used a 300-person subset. These exterior and rig proportions are not internal bone geometry or a universal growth law.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_SURVEY_LEG_LENGTH: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
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
];
