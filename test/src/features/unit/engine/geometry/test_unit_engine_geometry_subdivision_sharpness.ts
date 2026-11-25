import {
  decaySubdivisionSharpness,
  subdivisionEdgeSmoothness,
} from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * Semi-sharp creases after DeRose, Kass and Truong (1998):
 * `decaySubdivisionSharpness(s)` lowers a sharpness by one per step, never
 * below 0, keeping the infinite 10; `subdivisionEdgeSmoothness(s)` is the smooth
 * edge rule's share, 1 - s below 1 and 0 from 1 up.
 *
 * Scenarios:
 *
 * 1. Decay: 0 and 0.5 to 0, 2.5 to 1.5, 10 and 12 to 10.
 * 2. Smoothness: 0 to 1, 0.25 to 0.75, 1, 3 and 10 to 0.
 */
export function test_unit_engine_geometry_subdivision_sharpness(): void {
  // 1.
  TestValidator.equals("decay", [0, 0.5, 2.5, 10, 12].map(decaySubdivisionSharpness), [0, 0, 1.5, 10, 10]);

  // 2.
  TestValidator.equals("smoothness", [0, 0.25, 1, 3, 10].map(subdivisionEdgeSmoothness), [1, 0.75, 0, 0, 0]);
}
