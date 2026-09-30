import type { IAutoMovieHumanBodySimpleShapeTable } from "../../structures/IAutoMovieHumanBodySimpleShapeTable";

/**
 * Submental skin fullness on the shared body surface. The age and fat relation is an authored visible contour, not an independently segmented neck-fat compartment.
 *
 * These dimensionless rows set visible skin channel weights. They neither reconstruct tissue volumes nor establish safe contact in a combined pose.
 */
export const HUMAN_BODY_SIMPLE_SHAPE_NECK: IAutoMovieHumanBodySimpleShapeTable["terms"] =
  [
    {
      // submental fat with body mass
      channel: "neckDouble",
      gain: 0.8,
      curves: [
        {
          parameter: "bodyMassIndex",
          points: [
            [25, 0],
            [32, 0.5],
            [40, 1],
          ],
        },
      ],
    },
    {
      // and with age as the neck's skin loosens
      channel: "neckDouble",
      gain: 0.3,
      curves: [
        {
          parameter: "ageYears",
          points: [
            [40, 0],
            [80, 1],
          ],
        },
      ],
    },
  ];
