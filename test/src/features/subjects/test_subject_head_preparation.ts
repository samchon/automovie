import { buildPortraitHead, preparePortraitHead } from "@automovie/human";
import type { IPortraitComponent } from "@automovie/human/geometry/portraitComponents";
import { TestValidator } from "@nestia/e2e";

import { humanFaceFixture } from "../internal/humanFaceFixture";
import { nclose } from "../internal/predicates";

/**
 * Shared-surface preparation retains dependent component declarations without
 * running their finishers. Final construction alone consumes those declarations
 * after the surface is ready, so an interior never caches a pre-proposal rim.
 *
 * Scenarios:
 * 1. A small topology-free component proposes a resident-vertex displacement.
 *    Preparation changes the final surface, retains the pre-attachment source
 *    and leaves the host untouched, without constructing an interior.
 * 2. The normal head consumer invokes the same finisher exactly once with the
 *    proposed coordinate and reproduces the prepared surface.
 */
export const test_subject_head_preparation = (): void => {
  const { host } = humanFaceFixture().basis;
  const before = structuredClone(host);
  let finishes = 0;
  let finalDepth: number | undefined;
  const component: IPortraitComponent = {
    id: "prepared-interior",
    fit: () => ({
      constraints: [],
      cutFaces: [],
      attach: () => ({
        openings: [],
        finalSurface: (surface) => [
          {
            vertex: 4,
            target: [
              surface.positions[4][0],
              surface.positions[4][1],
              surface.positions[4][2] + 1,
            ],
          },
        ],
        finish: (surface) => {
          ++finishes;
          finalDepth = surface.positions[4][2];
          return [];
        },
      }),
    }),
  };
  const prepared = preparePortraitHead(host, [component], 0);
  TestValidator.equals("preparation defers interior generation", finishes, 0);
  TestValidator.equals("declaration retained", prepared.finishers.length, 1);
  TestValidator.predicate(
    "final proposal applied",
    nclose(prepared.surface.positions[4][2], host.positions[4][2] + 1),
  );
  TestValidator.equals(
    "source precedes final proposals",
    prepared.source,
    host.positions,
  );
  const complete = buildPortraitHead(host, [component], 0);
  TestValidator.equals("consumer finishes once", finishes, 1);
  TestValidator.predicate(
    "finisher reads final surface",
    finalDepth !== undefined && nclose(finalDepth, host.positions[4][2] + 1),
  );
  TestValidator.equals(
    "unsealed assembly unchanged",
    complete.refined,
    prepared.surface,
  );
  TestValidator.equals("caller retains its basis", host, before);
};
