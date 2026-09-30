import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Left upper-arm superficial fat appearance. A right-side counterpart follows later in the unchanged summation order.
 *
 * These dimensionless rows set visible skin channel weights. They neither reconstruct tissue volumes nor establish safe contact in a combined pose.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_UPPER_ARM_FAT_LEFT: IAutoMovieHumanBodySimpleShapeTable["terms"] =
  [
    {
      // upper-arm fat, more on women (triceps site)
      channel: "upperarmFatLeft",
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
