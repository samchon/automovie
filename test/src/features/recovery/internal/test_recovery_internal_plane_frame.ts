import { AutoMovieRecoveryGeometry } from "@automovie/recovery";
import { TestValidator } from "@nestia/e2e";

/**
 * `planeFrame` builds a plane's unit normal, its in-plane `v` from the
 * reference's part off the normal, and `u = v × n`.
 *
 * Scenarios:
 *
 * 1. Normal (0, 0, 2) and reference (1, 0, 1): n = z, the reference less its
 *    normal part is (1, 0, 0) = v, and u = x × z = (0, -1, 0).
 * 2. A zero normal and a reference along the normal are refused.
 */
export function test_recovery_internal_plane_frame(): void {
  TestValidator.equals(
    "the frame",
    AutoMovieRecoveryGeometry.planeFrame([1, 2, 3], [0, 0, 2], [1, 0, 1]),
    { origin: [1, 2, 3], n: [0, 0, 1], u: [0, -1, 0], v: [1, 0, 0] },
  );
  TestValidator.error("a zero normal", (): unknown =>
    AutoMovieRecoveryGeometry.planeFrame([0, 0, 0], [0, 0, 0], [1, 0, 0]),
  );
  TestValidator.error("a parallel reference", (): unknown =>
    AutoMovieRecoveryGeometry.planeFrame([0, 0, 0], [0, 0, 1], [0, 0, 3]),
  );
}
