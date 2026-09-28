/**
 * ANSUR II wrist and ankle measurement fits.
 * These ordered rows are authored data of the simple body table, not a
 * second evaluator. Curves and source notes remain beside each row.
 */
import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/** Ordered survey fits for the distal limbs. */
export const HUMAN_BODY_SIMPLE_SHAPE_SURVEY_DISTAL: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
    {
      // ANSUR II people: measureWristCirc, women. The reproduced women's wrists
      // stood thin, most when lean (-30 mm at a body mass index of 18, -5 at
      // 35, over 126 people). The mass the wrist and ankle rows add is taken
      // back over the whole body by the mass solve: together they narrowed a
      // surveyed woman's waist at the omphalion by 7.6 mm and a man's by 1.4.
      // It fades like the other rows
      channel: "measureWristCirc",
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
            [18, 0.586],
            [22, 0.517],
            [26, 0.403],
            [30, 0.256],
            [35, 0.103],
            [45, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: measureAnkleCirc, women. The reproduced women's ankles
      // stood thin, most when heavy (-14 mm at a body mass index of 18, -45 at
      // 35, over 126 people). The mass the wrist and ankle rows add is taken
      // back over the whole body by the mass solve: together they narrowed a
      // surveyed woman's waist at the omphalion by 7.6 mm and a man's by 1.4.
      // It fades like the other rows
      channel: "measureAnkleCirc",
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
            [18, 0.253],
            [22, 0.423],
            [26, 0.559],
            [30, 0.68],
            [35, 0.808],
            [45, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: measureWristCirc, men. The reproduced men's wrists
      // stood thin when lean and thick when heavy (-34 mm at a body mass index
      // of 18, +17 at 35, over 128 people). The mass the wrist and ankle rows
      // add is taken back over the whole body by the mass solve: together they
      // narrowed a surveyed woman's waist at the omphalion by 7.6 mm and a
      // man's by 1.4. It fades like the other rows
      channel: "measureWristCirc",
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
            [18, 0.645],
            [22, 0.413],
            [26, 0.151],
            [30, -0.098],
            [35, -0.323],
            [45, 0],
          ],
        },
      ],
    },
    {
      // ANSUR II people: measureAnkleCirc, men. The reproduced men's ankles
      // thickened less with the body mass index than theirs (+13 mm at a body
      // mass index of 18, -19 at 35, over 128 people). The mass the wrist and
      // ankle rows add is taken back over the whole body by the mass solve:
      // together they narrowed a surveyed woman's waist at the omphalion by 7.6
      // mm and a man's by 1.4. It fades like the other rows
      channel: "measureAnkleCirc",
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
            [18, -0.249],
            [22, -0.104],
            [26, 0.031],
            [30, 0.184],
            [35, 0.359],
            [45, 0],
          ],
        },
      ],
    },
];
