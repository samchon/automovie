import {
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieMomentum,
} from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieJointPose,
  IAutoMovieMotionHumanAirborneShape,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanLayer,
  IAutoMovieMotionHumanPosture,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  HumanAirborneShape,
  poseBones,
  resolveHumanPosture,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";
import { vclose } from "../internal/vclose";

/**
 * A flight shape's geometry and goal ownership can be checked without
 * solving a jump. Canonical Human FK supplies the displayed geometry.
 *
 * Scenarios:
 * 1. On the average man and small woman, arms-in lowers the long-axis
 *    moment relative to arms-out rest and tuck lowers the somersault-axis
 *    moment relative to layout, the original signature's inertia checks.
 * 2. Each named leg shape claims only the legs; each arm shape claims only
 *    the arms. With one leg and one arm goal held, the claimed held goal
 *    reaches the shape's actual ankle/wrist, the other goal stays unchanged
 *    and the unheld opposite limb receives no invented goal. The original
 *    exact endpoint bound is retained for tuck and arms-in as for the other
 *    declared shape rows, on both canonical bodies.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States actual Human provenance, the two independent physical inequalities, explicit limb-family ownership and the unchanged exact goal bound.
 * @evidence contracts/development/testing.md#behavioral-verification Applies real public shape layers, ordinary posture resolution, FK and composed inertia; a reversed mass relation, an incorrect limb claim, a dropped held goal or an invented unheld goal fails without planning a turned film.
 * @evidence contracts/development/testing.md#independent-expectations Conservation relates a smaller radial spread to a lower axis moment. Gymnastic shape names independently select leg versus arm ownership. Ordinary full FK observes the ankle/wrist implied by the declared joint row; sharing that row intentionally does not certify its provisional authored angles or the resolver's internal geometry independently.
 * @evidence contracts/development/testing.md#distinguishing-cases Two opposite Human proportions, arms-in versus rest, tuck versus layout, every named leg/arm shape, held versus absent claimed goals and unchanged rival goals. Full flight winding, feasible/refused requests and momentum remain core_flight/core_flight_sample and airborne_signature's integration contracts.
 * @evidence contracts/development/testing.md#execution-ownership This discoverable synchronous unit uses two existing canonical fixtures and in-memory shape/FK/mass computations. It builds no HumanPerformance, integrates no dynamics and starts no renderer, host or process.
 */
export function test_human_motion_airborne_shape(): void {
  type Bones = Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>;
  const findings: string[] = [];
  for (const name of ["m-average", "f-small"] as const) {
    const body: IAutoMovieMotionHumanBody = motionHumanBody(name);
    const model: IAutoMovieResolveCenterOfMass.IModel =
      resolveAutoMovieCenterOfMass(body.skeleton, body.profile);
    const shaped: (shape: IAutoMovieMotionHumanAirborneShape.Shape | null) => Bones = (
      shape: IAutoMovieMotionHumanAirborneShape.Shape | null,
    ): Bones => poseBones(body, {
      skeleton: body.skeleton.id,
      root: null,
      joints: Object.entries(shape === null ? {} : HumanAirborneShape.ANGLES[shape]).map(
        ([bone, angles]: [string, readonly [number, number, number]]): IAutoMovieJointPose => ({
          bone: bone as AutoMovieHumanoidBone,
          flexion: angles[0], abduction: angles[1], twist: angles[2],
        }),
      ),
    });
    const moment: (bones: Bones, axis: 0 | 1) => number = (bones: Bones, axis: 0 | 1): number =>
      resolveAutoMovieMomentum.inertia(model, bones)[axis]![axis]!;
    if (!(moment(shaped("armsIn"), 1) < moment(shaped(null), 1)))
      findings.push(`${name}: arms in do not lower the moment about the long axis`);
    if (!(moment(shaped("tuck"), 0) < moment(shaped("layout"), 0)))
      findings.push(`${name}: a tuck does not lower the moment about the somersault axis`);

    const standing: IAutoMovieMotionHumanPosture = {
      root: { x: 0, y: 0, z: 0 }, yaw: 0, pitch: 0, roll: 0, joints: {},
      limbs: {
        leftLeg: { point: { x: 0.1, y: 0.1, z: 0 }, bend: { x: 0.1, y: 0.5, z: 0.5 } },
        leftArm: { point: { x: 0.3, y: 1.2, z: 0.3 }, bend: { x: 0.5, y: 1, z: 0 } },
      },
    };
    const context: IAutoMovieMotionHumanLayer.IContext = { body } as IAutoMovieMotionHumanLayer.IContext;
    for (const [shape, limb, kept, bone, set] of [
      ["tuck", "leftLeg", "leftArm", "leftFoot", "leftUpperLeg"],
      ["pike", "leftLeg", "leftArm", "leftFoot", "leftUpperLeg"],
      ["layout", "leftLeg", "leftArm", "leftFoot", "leftUpperLeg"],
      ["straddle", "leftLeg", "leftArm", "leftFoot", "leftUpperLeg"],
      ["armsIn", "leftArm", "leftLeg", "leftHand", "leftUpperArm"],
      ["armsUp", "leftArm", "leftLeg", "leftHand", "leftUpperArm"],
    ] as const) {
      const layer: IAutoMovieMotionHumanLayer = HumanAirborneShape.layer(shape);
      const laid: IAutoMovieMotionHumanPosture = layer.apply(standing, 0, context);
      const moved: IAutoMovieHumanLimbGoal | undefined = laid.limbs[limb];
      const expected: IAutoMovieVector3 = poseBones(body, resolveHumanPosture(body, {
        ...standing,
        joints: HumanAirborneShape.ANGLES[shape],
        limbs: { [kept]: standing.limbs[kept] },
      })).get(bone)!.worldPosition;
      const channels: readonly string[] = limb === "leftLeg"
        ? ["leftLeg", "rightLeg"] : ["leftArm", "rightArm"];
      const claimed: IAutoMovieMotionHumanLayer["channels"] = layer.channels;
      if (
        moved === undefined ||
        !vclose(moved.point, expected, 0) ||
        laid.limbs[kept] !== standing.limbs[kept] ||
        Object.keys(laid.limbs).length !== 2 ||
        laid.joints[set] === undefined ||
        claimed === undefined ||
        claimed.length !== 2 ||
        channels.some((channel: string): boolean => !claimed.includes(channel as AutoMovieHumanLimb))
      ) findings.push(`${name} ${shape}: does not claim exactly its limbs or carry its held goal`);
    }
  }
  TestValidator.equals("airborne shape mass and ownership", findings, []);
}
