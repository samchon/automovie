import { TestValidator } from "@nestia/e2e";

import { physicalReleasedQuality } from "../../../../packages/engine/src/physics/physicalReleasedQuality";

/** A released body adds exactly its declared solver budget above the world's, and nothing otherwise.
 *
 * Scenarios:
 * 1. A released body with a declared quality adds the declared totals minus the world's iterations.
 * 2. Tracking that is not withdrawn adds nothing, even with a declared quality.
 * 3. A declared total below the world's own budget adds nothing rather than a negative count.
 * 4. A released body without a declaration adds nothing.
 */
export function test_physical_balance_release_quality(): void {
  const world: { iterations: number; internalIterations: number } = {
    iterations: 12,
    internalIterations: 1,
  };
  const quality: { iterations: number; internalIterations: number } = {
    iterations: 20,
    internalIterations: 8,
  };
  TestValidator.equals(
    "released totals above the world's budget",
    physicalReleasedQuality({ ...world, quality, released: true }),
    { solver: 8, pgs: 7 },
  );
  TestValidator.equals(
    "tracked body keeps the world's budget",
    physicalReleasedQuality({ ...world, quality, released: false }),
    { solver: 0, pgs: 0 },
  );
  TestValidator.equals(
    "a declaration below the world's budget never subtracts",
    physicalReleasedQuality({
      iterations: 32,
      internalIterations: 16,
      quality,
      released: true,
    }),
    { solver: 0, pgs: 0 },
  );
  TestValidator.equals(
    "no declaration adds nothing",
    physicalReleasedQuality({ ...world, released: true }),
    { solver: 0, pgs: 0 },
  );
}
