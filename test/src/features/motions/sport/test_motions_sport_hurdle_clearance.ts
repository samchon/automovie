import { Quaternion, AutoMovieEnginePhysics } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanColliders,
  IAutoMovieMotionHumanPropReader,
  IAutoMoviePhysicalShape,
  IAutoMoviePhysicalShapeBounds,
  IAutoMovieRigidTransform,
} from "@automovie/interface";
import {
  HumanColliders,
  HumanRefusal,
  crossingClearance,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { humanFixtureBody } from "../../internal/fixtures/humanFixtureBody";
import { syntheticHumanPlan } from "../../internal/synthetic/syntheticHumanPlan";

/**
 * Clear an obstacle with the displayed lower-leg geometry.
 *
 * Scenarios:
 *
 * 1. Equal finite bars offset to miss or enter one lower leg by 5 mm receive
 *    different decisions.
 * 2. Keeping the height and depth while placing the bar past the foot's finite
 *    lateral end leaves clearance.
 */
export async function test_motions_sport_hurdle_clearance(): Promise<void> {
  const body: IAutoMovieMotionHumanBody = await humanFixtureBody("m-average");
  const frame: IAutoMovieRigidTransform = {
    position: { x: 0, y: 0, z: 0 },
    rotation: Quaternion.identity(),
  };
  const posture = stand.posture(body, frame.position, 0);
  const plan = syntheticHumanPlan({ posture, duration: 0.02 });
  const actual: readonly IAutoMovieMotionHumanColliders.IPlaced[] =
    HumanColliders.placed(
      body,
      poseBones(body, resolveHumanPosture(body, posture)),
    );
  for (const bone of [
    "leftLowerLeg",
    "leftFoot",
    "rightLowerLeg",
    "rightFoot",
  ] as const) {
    const shown = actual.find((segment): boolean => segment.bone === bone)!;
    const boxes: IAutoMoviePhysicalShapeBounds.IResult[] = shown.shapes.map(
      (shape: IAutoMoviePhysicalShape): IAutoMoviePhysicalShapeBounds.IResult =>
        AutoMovieEnginePhysics.physicalShapeBounds(shown.pose, shape),
    );
    const face: number = Math.max(...boxes.map((box): number => box.max.x));
    const edge = boxes.find((box): boolean => box.max.x === face)!;
    const make = (
      shift: number,
      beyond: boolean,
    ): IAutoMovieMotionHumanPropReader => ({
      prop: {
        subject: "bar",
        frame,
        fixed: true,
        points: {},
        shapes: [
          {
            kind: "box",
            id: "bar",
            material: "test",
            halfExtents: {
              x: 0.02,
              y: edge.max.y - edge.min.y + 0.05,
              z: edge.max.z - edge.min.z + 0.05,
            },
            transform: {
              rotation: frame.rotation,
              position: {
                x: face + 0.02 + shift + (beyond ? 1 : 0),
                y: (edge.min.y + edge.max.y) / 2,
                z: (edge.min.z + edge.max.z) / 2,
              },
            },
          },
        ],
      },
      frame: (): IAutoMovieRigidTransform => frame,
    });
    const check = (shift: number, beyond: boolean): boolean => {
      try {
        crossingClearance(
          { body, start: 0, prop: () => make(shift, beyond) },
          plan,
          ["bar"],
          {
            bones: new Set<AutoMovieHumanoidBone>([bone]),
            rate: 240,
            allowance: 0.001,
          },
        );
        return true;
      } catch (error: unknown) {
        if (!(error instanceof HumanRefusal) || !error.reason.includes(bone))
          throw error;
        return false;
      }
    };
    TestValidator.predicate(
      `finite 5 mm gap and overlap on ${bone}`,
      check(0.005, false) && !check(-0.005, false) && check(-0.005, true),
    );
  }
}
