import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Left upper-leg superficial fat appearance. The endpoint remains a skin displacement, not tissue volume.
 *
 * These dimensionless rows set visible skin channel weights. They neither reconstruct tissue volumes nor establish safe contact in a combined pose.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_UPPER_LEG_FAT_LEFT: IAutoMovieHumanBodySimpleShapeTable["terms"] = [
    {
      // thigh fat, more on women (gynoid, front and lateral thigh sites)
      channel: "upperlegFatLeft",
      gain: 0.5,
      curves: [
        {
          parameter: "sex",
          points: [
            [-1, 1],
            [1, 0.3],
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
