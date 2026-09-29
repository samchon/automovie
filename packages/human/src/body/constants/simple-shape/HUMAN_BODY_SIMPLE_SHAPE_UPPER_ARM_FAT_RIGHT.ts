import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Right upper-arm superficial fat appearance. The paired control remains independently authorable for asymmetry.
 *
 * These dimensionless rows set visible skin channel weights. They neither reconstruct tissue volumes nor establish safe contact in a combined pose.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_UPPER_ARM_FAT_RIGHT: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
    {
      // upper-arm fat, more on women (triceps site)
      channel: "upperarmFatRight",
      gain: 0.6,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0.4],
          ],
        },
        {
          parameter: "bodyMassIndex",
          points: [
            [22, 0],
            [30, 0.6],
            [40, 1],
          ],
        },
      ],
    },
];
