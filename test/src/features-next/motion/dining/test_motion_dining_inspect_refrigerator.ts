import { createAppliance } from "@automovie/archetypes";
import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanSegment,
  IAutoMoviePhysicalShape,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanDining,
  HumanChain,
  HumanObject,
  HumanPerformance,
  HumanRefusal,
} from "@automovie/motions";
import { HumanHand } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../../../features/internal/motionHumanBody";

/**
 * A person opens the refrigerator compartment and looks at the chosen shelf.
 *
 * Scenarios:
 * 1. A standing performer pulls the door through 30 degrees. At stroke end,
 *    the right grip is within 10 mm of the handle, measured from the
 *    modeled bar's rest coordinates and the authored angle. The freezer remains shut.
 * 2. The look starts after the pull, with the door still 30 degrees open.
 *    Both eyes settle within 0.5 degrees of the third shelf's centre.
 * 3. The same request from another two metres back is refused on reach. A
 *    zero-degree opening is refused before staging.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Resolves the public composition with a refrigerator prop. It measures the displayed grip and eyes and reads the two door states through the look.
 * @evidence contracts/development/testing.md#independent-expectations The manual circular arc follows the appliance's right hinge and the authored swing. The distance and angle bounds come from the affordance and gaze specifications, respectively. The eye-axis check measures targeting without modeling visual occlusion.
 * @evidence contracts/development/testing.md#distinguishing-cases The refrigerator door moves while the freezer stays shut. The look preserves the resulting door state. The two refusal cases separate unreachable staging from a zero opening.
 * @evidence contracts/development/testing.md#execution-ownership One in-memory performance and one refused setup through the discovered feature entry.
 * @evidence contracts/development/common.md#meaningful-documentation States the interaction, the sampled moments and the bounds.
 */
export function test_motion_dining_inspect_refrigerator(): void {
  const pullHeight: number = 1.18;
  const fridge: ReturnType<typeof createAppliance> = createAppliance({
    kind: "refrigerator",
    pullHeight,
  });
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const hinge: IAutoMovieVector3 =
    fridge.affordance("fridgeDoor").frame.translation;
  const shelf: IAutoMovieVector3 =
    fridge.affordance("shelf3").frame.translation;
  const swing: number = 30;
  const chain: IAutoMovieMotionHumanChain =
    AutoMovieMotionHumanDining.inspectRefrigerator(HumanChain.subject("cook"), {
      refrigerator: "fridge",
      shelf: 3,
      swing,
    });
  /** Stage the same beat at the authored distance or further back. */
  const stage = (back: number): HumanPerformance =>
    new HumanPerformance({
      seed: "fridge-inspection",
      performers: [
        {
          subject: "cook",
          body,
          at: {
            x: -fridge.dimensions.width! / 2 - 0.15,
            y: 0,
            z: hinge.z + 0.55 + back,
          },
          yaw: 180,
          proficiency: { level: "trained" },
        },
      ],
      props: [
        HumanObject.prop("fridge", fridge, {
          at: { x: 0, y: 0, z: 0 },
          yaw: 0,
          fixed: true,
        }),
      ],
      composition: chain.node,
    });
  const performance: HumanPerformance = stage(0);
  const [pull, look]: readonly IAutoMovieMotionHumanSegment[] =
    performance.segments("cook");
  TestValidator.predicate(
    "the shelf inspection follows the complete pull",
    pull?.name === "operate" &&
      look?.name === "look" &&
      Math.abs(look.start - pull.end) <= 1e-9,
  );
  if (pull === undefined || look === undefined) return;

  const stop: number =
    pull.start +
    pull.plan.events.find((event) => event.name === "strokeEnd")!.share *
      pull.plan.duration;
  const bar: IAutoMoviePhysicalShape = fridge
    .shapes()
    .find(
      (shape: IAutoMoviePhysicalShape): boolean =>
        shape.id === "fridgeHandle-bar",
    )!;
  const rest: IAutoMovieVector3 = bar.transform.position;
  const dx: number = rest.x - hinge.x;
  const dz: number = rest.z - hinge.z;
  const radians: number = (swing * Math.PI) / 180;
  const expected: IAutoMovieVector3 = {
    x: hinge.x + dx * Math.cos(radians) + dz * Math.sin(radians),
    y: pullHeight,
    z: hinge.z - dx * Math.sin(radians) + dz * Math.cos(radians),
  };
  const grip: IAutoMovieVector3 = HumanHand.frame(
    body,
    performance.bones("cook", stop),
    "right",
    "grip",
    "relaxed",
  ).point;
  TestValidator.predicate(
    "the grip follows the right-hinged door within 10 mm",
    Vector3.length(Vector3.subtract(grip, expected)) <= 0.01,
  );

  const settled: number =
    look.start +
    look.plan.events.find((event) => event.name === "settled")!.share *
      look.plan.duration;
  for (const seconds of [look.start, settled, look.end]) {
    const state: Record<string, number> = performance.state("fridge", seconds);
    TestValidator.predicate(
      `the refrigerator stays open and the freezer stays shut at ${seconds.toFixed(3)} s`,
      Math.abs((state.fridgeDoor ?? 0) - swing) <= 1e-9 &&
        Math.abs(state.freezerDoor ?? 0) <= 1e-9,
    );
  }
  const bones: ReturnType<HumanPerformance["bones"]> = performance.bones(
    "cook",
    settled,
  );
  for (const name of ["leftEye", "rightEye"] as const) {
    const eye = bones.get(name)!;
    const forward: IAutoMovieVector3 = Quaternion.rotateVector(
      eye.worldRotation,
      { x: 0, y: 0, z: 1 },
    );
    const target: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(shelf, eye.worldPosition),
    );
    TestValidator.predicate(
      `${name} settles within 0.5 degrees of shelf 3`,
      Vector3.dot(forward, target) >= Math.cos((0.5 * Math.PI) / 180),
    );
  }

  let refusal: unknown;
  try {
    stage(2);
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "the performer cannot reach the refrigerator from two metres further back",
    refusal instanceof HumanRefusal && refusal.kind === "reach",
  );

  refusal = undefined;
  try {
    AutoMovieMotionHumanDining.inspectRefrigerator(HumanChain.subject("cook"), {
      refrigerator: "fridge",
      shelf: 3,
      swing: 0,
    });
  } catch (error) {
    refusal = error;
  }
  TestValidator.predicate(
    "the beat requires an opening greater than zero",
    refusal instanceof HumanRefusal && refusal.axis === "swing",
  );
}
