/**
 * Muscle and skeletal definition gated by tissue and training.
 * These ordered rows are authored data of the simple body table, not a
 * second evaluator. Curves and source notes remain beside each row.
 */
import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";
import { MUSCLE_THICKNESS_BY_SEX } from "./MUSCLE_THICKNESS_BY_SEX";

/** Ordered muscle and skeletal definition relations. */
export const HUMAN_BODY_SIMPLE_SHAPE_DEFINITION: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
    {
      // a trained upper body widens from the latissimus and deltoids into a
      // V over a narrower waist, more on a man (swimmers' wide shoulders and
      // narrow pelvis; the latissimus drives every stroke)
      channel: "torsoVshape",
      gain: 0.6,
      curves: [
        {
          parameter: "developedMuscle",
          points: [
            [0, 0],
            [1, 1],
          ],
        },
        {
          parameter: "sex",
          points: [
            [-1, 0.5],
            [1, 1],
          ],
        },
      ],
    },
    {
      // the superficial musculature shows through thin subcutaneous fat:
      // an average body at low fat shows some of it, a muscular one all of
      // it, and it is gone well before the fat bands where the belly and the
      // hips keep their fat longest
      channel: "musculatureDefinition",
      gain: 1,
      curves: [
        MUSCLE_THICKNESS_BY_SEX,
        {
          parameter: "developedMuscle",
          points: [
            [-1, 0],
            [0, 0.35],
            [1, 1],
          ],
        },
        {
          parameter: "excessFatPercent",
          points: [
            [2, 1],
            [6, 0.6],
            [12, 0.15],
            [16, 0],
          ],
        },
      ],
    },
    {
      // the same relief over the breast mound, gated by sex
      channel: "chestDefinition",
      gain: 1,
      curves: [
        {
          // over the breast mound the gland and its fat cover the pectoralis
          parameter: "sex",
          points: [
            [-1, 0.15],
            [1, 1],
          ],
        },
        {
          parameter: "developedMuscle",
          points: [
            [-1, 0],
            [0, 0.35],
            [1, 1],
          ],
        },
        {
          parameter: "excessFatPercent",
          points: [
            [2, 1],
            [6, 0.6],
            [12, 0.15],
            [16, 0],
          ],
        },
      ],
    },
    {
      // the skeleton reads through where little more than essential fat
      // covers it and little muscle does: a lean athlete's ribs and spine sit
      // under the latissimus and the erectors, an emaciated body's do not
      channel: "skeletalProminence",
      gain: 1,
      curves: [
        {
          parameter: "developedMuscle",
          points: [
            [-1, 1],
            [0, 0.8],
            [1, 0.25],
            [2, 0.1],
          ],
        },
        {
          parameter: "excessFatPercent",
          points: [
            [2, 1],
            [6, 0.6],
            [12, 0],
          ],
        },
      ],
    },
];
