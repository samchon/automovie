import { AutoMovieRecoveryCameraMap } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `predictRecoveryMapDecrease` predicts the Gauss-Newton model change -g·δ -
 * ½‖Jδ‖² from the gradient and the original camera and point rows.
 *
 * Scenarios, with one camera coordinate and one point:
 *
 * 1. Gradient (1, 0, 0, 2), increment (1, 0, 0, 1) and the row camera [1], point
 *    [0, 0, 1]: g·δ = 3, Jδ = 2, so -3 - 2 = -5.
 * 2. A second row [0] | [1, 0, 0] adds nothing for this increment: still -5.
 * 3. An increment of the wrong length is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names physical gradient and original Jacobian action, including a silent row.
 * @evidence contracts/development/testing.md#behavioral-verification Predicts change for one observation, adds a row orthogonal to the step and refuses a short increment.
 * @evidence contracts/development/testing.md#independent-expectations The model's linear term is three and its sole changing row has action two, giving predicted decrease −5.
 */
export function test_recovery_internal_predict_map_decrease(): void {
  TestValidator.equals(
    "one row",
    AutoMovieRecoveryCameraMap.predictMapDecrease(
      [{ cameraRows: [[1]], pointRows: [[0, 0, 1]], right: [0] }],
      [1, 0, 0, 2],
      [1, 0, 0, 1],
    ),
    -5,
  );
  TestValidator.equals(
    "a silent row",
    AutoMovieRecoveryCameraMap.predictMapDecrease(
      [
        {
          cameraRows: [[1], [0]],
          pointRows: [
            [0, 0, 1],
            [1, 0, 0],
          ],
          right: [0, 0],
        },
      ],
      [1, 0, 0, 2],
      [1, 0, 0, 1],
    ),
    -5,
  );
  TestValidator.error("a short increment", (): unknown =>
    AutoMovieRecoveryCameraMap.predictMapDecrease(
      [{ cameraRows: [[1]], pointRows: [[0, 0, 1]], right: [0] }],
      [1, 0, 0, 2],
      [1, 0, 0],
    ),
  );
}
