import type {
  AutoMovieHumanoidBone,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { StanceVerdicts } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../../internal/nclose";

/** A resolved bone at a world point, unturned. */
const at = (
  bone: AutoMovieHumanoidBone,
  worldPosition: IAutoMovieVector3,
): [AutoMovieHumanoidBone, IAutoMovieResolvedBone] => [
  bone,
  {
    bone,
    localRotation: { x: 0, y: 0, z: 0, w: 1 },
    worldPosition,
    worldRotation: { x: 0, y: 0, z: 0, w: 1 },
  },
];

/**
 * `StanceVerdicts.included` is the angle at a middle joint between the segments
 * to its neighbours, degrees: 180 for a straight limb.
 *
 * Scenarios:
 *
 * 1. A hip, knee and ankle in a straight line read 180.
 * 2. The ankle swung to a right angle reads 90; folded halfway back, 45.
 */
export function test_unit_motions_executable_stance_verdicts_included(): void {
  const leg = (
    ankle: IAutoMovieVector3,
  ): Parameters<typeof StanceVerdicts.included>[0] => ({
    bones: (): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      new Map([
        at("leftUpperLeg", { x: 0, y: 1, z: 0 }),
        at("leftLowerLeg", { x: 0, y: 0.5, z: 0 }),
        at("leftFoot", ankle),
      ]),
  });
  const angle = (ankle: IAutoMovieVector3): number =>
    StanceVerdicts.included(
      leg(ankle),
      "a",
      "leftUpperLeg",
      "leftLowerLeg",
      "leftFoot",
      0,
    );
  TestValidator.predicate(
    "straight, right and folded",
    nclose(angle({ x: 0, y: 0, z: 0 }), 180, 1e-9) &&
      nclose(angle({ x: 0, y: 0.5, z: 0.5 }), 90, 1e-9) &&
      nclose(angle({ x: 0, y: 0.5 + Math.SQRT1_2, z: Math.SQRT1_2 }), 45, 1e-9),
  );
}
