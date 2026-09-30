import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Right upper-leg superficial fat appearance. The paired control remains independently authorable for asymmetry.
 *
 * These dimensionless rows set visible skin channel weights. They neither reconstruct tissue volumes nor establish safe contact in a combined pose.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_UPPER_LEG_FAT_RIGHT: IAutoMovieHumanBodySimpleShapeTable["terms"] =
  [
    {
      // thigh fat, more on women (gynoid, front and lateral thigh sites)
      channel: "upperlegFatRight",
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
