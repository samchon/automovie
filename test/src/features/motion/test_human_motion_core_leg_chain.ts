import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import {
  HumanLegChain,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * A leg's swivel names the knee the posture shows, and the posture's own fit
 * run on the pelvis alone gives that swivel.
 *
 * Scenario: the average man stands quietly, then with his left foot set
 * down across the right one, 12 cm to its right and 20 cm in front of it or
 * behind it, the knee bent toward a point ahead of the ankle. Each posture
 * is resolved. For each leg, the branch and swivel read off the shown bones
 * (`HumanLegChain.read`) pose the knee (`HumanLegChain.pose`) within a
 * micrometre of the shown one, and the posture's leg fit run on the shown
 * pelvis, hip, ankle, knee hint and foot (`HumanLegChain.fit`) poses it
 * there too: the posture places the knee by the very fit, so the two meet
 * to the solver's own 1e-7 m residual bucket and its rounding.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves real postures and compares the knees the chain poses with the shown ones; a swivel read or fitted off the shown knee fails.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the resolved posture's own knee; the crossings are written here.
 * @evidence contracts/development/testing.md#distinguishing-cases The quiet stance against crossings in front and behind.
 * @evidence contracts/development/testing.md#execution-ownership An in-memory unit on one prepared body; it runs in CI.
 * @evidence contracts/development/common.md#meaningful-documentation States the scenario and its bound.
 */
export function test_human_motion_core_leg_chain(): void {
  const body: IHumanBody = motionHumanBody("m-average");
  const quiet: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
  const right: IAutoMovieVector3 = poseBones(
    body,
    resolveHumanPosture(body, quiet),
  ).get("rightFoot")!.worldPosition;
  const postures: [string, IHumanPosture][] = [["quiet", quiet]];
  for (const ahead of [-0.2, 0.2]) {
    const ankle: IAutoMovieVector3 = {
      x: right.x - 0.12,
      y: right.y,
      z: right.z + ahead,
    };
    postures.push([
      `crossed ${ahead} m ahead`,
      {
        ...quiet,
        limbs: {
          ...quiet.limbs,
          leftLeg: {
            ...quiet.limbs.leftLeg!,
            point: ankle,
            bend: Vector3.add(ankle, { x: 0, y: 0.5, z: 1 }),
          },
        },
      },
    ]);
  }
  for (const [label, posture] of postures) {
    const bones = poseBones(body, resolveHumanPosture(body, posture));
    for (const side of ["left", "right"] as const) {
      const goal: IHumanPosture.IGoal = posture.limbs[`${side}Leg`]!;
      const pelvis = bones.get("hips")!.worldRotation;
      const hip: IAutoMovieVector3 = bones.get(
        `${side}UpperLeg`,
      )!.worldPosition;
      const ankle: IAutoMovieVector3 = bones.get(`${side}Foot`)!.worldPosition;
      const shown: IAutoMovieVector3 = bones.get(
        `${side}LowerLeg`,
      )!.worldPosition;
      const knee = (swivel: HumanLegChain.ISwivel): IAutoMovieVector3 =>
        HumanLegChain.pose(body, side, pelvis, hip, ankle, swivel)!.knee;
      const read: HumanLegChain.ISwivel = HumanLegChain.read(body, side, bones);
      TestValidator.predicate(
        `${label}: the ${side} knee posed from its read swivel is the shown one`,
        Vector3.length(Vector3.subtract(knee(read), shown)) <= 1e-6,
      );
      const fitted: HumanLegChain.ISwivel = HumanLegChain.fit(
        body,
        side,
        pelvis,
        hip,
        ankle,
        goal.bend,
        bones.get(`${side}Foot`)!.worldRotation,
      );
      TestValidator.predicate(
        `${label}: the ${side} knee the fit poses is the shown one`,
        Vector3.length(Vector3.subtract(knee(fitted), shown)) <= 1e-6,
      );
    }
  }
}
