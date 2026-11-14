import type { IAutoMovieResolvedBone } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieJointPose,
  IAutoMoviePose,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanAudit,
  AutoMovieMotionHumanAuditTangle,
  HumanArmClearance,
  type IHumanBody,
  type IHumanPosture,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * The tangle audit passes an arm that swings along the flank it hangs
 * against and still finds a limb that crosses the body.
 *
 * A convex collider cannot give the way flesh does, so a body's upper arm
 * and trunk colliders, and a heavy body's thighs, already share a volume
 * while it stands at rest. A walking arm slides along that flank a few
 * millimetres deeper than it hangs; an audit that takes every corner's own
 * rest depth as its allowance reads the slide as a tangle and forces the arm
 * out sideways, which no walking person does. What the audit must still
 * find is a limb that passes through another part: a forearm run into the
 * belly, a leg swung through the other leg.
 *
 * Scenarios, on the smallest, the average and the largest body:
 * 1. The quiet stance reads no tangle at all.
 * 2. Both arms swung 15 degrees forward and 15 degrees back from the stance,
 *    the elbows as they hang (a walk's arm swing, Collins, Adamczyk and Kuo
 *    2009), each let out at the shoulder as a gait lets an arm out of what
 *    stands in its way: the deepest tangle stays within the audit's 10 mm
 *    limit.
 * 3. An elbow bent 90 degrees with the upper arm turned so that the hand
 *    points across the body's midline, the forearm through the trunk: a
 *    tangle deeper than the limit, between that arm and the trunk.
 * 4. A straight leg adducted 25 degrees, its foot carried across the
 *    midline through the other leg: a tangle deeper than the limit, between
 *    the two legs.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Poses real bodies and reads the public audit; an audit that fails a walking arm, or passes a forearm in the belly or a leg through a leg, fails.
 * @evidence contracts/development/testing.md#independent-expectations The stance is the audit's own reference and reads nothing; a walking arm passes because people walk with their arms along their flanks; the two crossings are staged by joint angles alone and the side that crosses is chosen by where the hand or foot ends, not by the audit.
 * @evidence contracts/development/testing.md#distinguishing-cases Three bodies whose colliders share nothing, a little and much at rest; the reference posture, a slide along a shared surface, and two crossings of different limbs.
 * @evidence contracts/development/testing.md#execution-ownership Prepares polygon men, so it runs locally and wherever CI runs the human motion tests.
 * @evidence contracts/development/common.md#meaningful-documentation States why a shared rest volume must not read as a tangle, what must still be found, and the 4 scenarios.
 */
export function test_human_motion_audit_tangle_reference(): void {
  const limit: number = AutoMovieMotionHumanAudit.LIMITS.tangle;
  const complaints: string[] = [];
  for (const name of ["f-small", "m-average", "m-large"] as const) {
    const body: IHumanBody = motionHumanBody(name);
    const stance: IAutoMoviePose = resolveHumanPosture(
      body,
      stand.posture(body, { x: 0, y: 0, z: 0 }, 0),
    );
    const angles = (
      pose: IAutoMoviePose,
      bone: AutoMovieHumanoidBone,
    ): readonly [number, number, number] => {
      const joint: IAutoMovieJointPose | undefined = pose.joints.find(
        (j: IAutoMovieJointPose): boolean => j.bone === bone,
      );
      return [joint?.flexion ?? 0, joint?.abduction ?? 0, joint?.twist ?? 0];
    };
    const arm = (
      pose: IAutoMoviePose,
      side: "left" | "right",
      change: (now: HumanArmClearance.IArm) => HumanArmClearance.IArm,
    ): IAutoMoviePose =>
      HumanArmClearance.posed(
        pose,
        side,
        change({
          upper: angles(pose, `${side}UpperArm`),
          lower: angles(pose, `${side}LowerArm`),
          hand: angles(pose, `${side}Hand`),
        }),
      );
    const bones = (
      pose: IAutoMoviePose,
    ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
      poseBones(body, pose);
    const deepest = (
      pose: IAutoMoviePose,
      among: RegExp = /./,
    ): { depth: number; where: string } => {
      let worst: { depth: number; where: string } = { depth: 0, where: "none" };
      for (const pair of AutoMovieMotionHumanAuditTangle.pose(
        body,
        bones(pose),
      ))
        if (
          (among.test(pair.a) || among.test(pair.b)) &&
          pair.depth > worst.depth
        )
          worst = { depth: pair.depth, where: `${pair.a} in ${pair.b}` };
      return worst;
    };
    const mm = (metres: number): string => (metres * 1000).toFixed(1);

    // 1. The reference posture.
    const rest = deepest(stance);
    if (rest.depth > 1e-6)
      complaints.push(
        `${name}: the quiet stance reads ${mm(rest.depth)} mm (${rest.where}), nothing expected`,
      );

    // 2. A walk's arm swing along the flank, each arm let out as a gait
    // lets it out of what stands in its way.
    for (const swing of [15, -15]) {
      const standing: IHumanPosture = stand.posture(
        body,
        { x: 0, y: 0, z: 0 },
        0,
      );
      const joints: IHumanPosture["joints"] = { ...standing.joints };
      for (const side of ["left", "right"] as const) {
        const now: readonly [number, number, number] = angles(
          stance,
          `${side}UpperArm`,
        );
        joints[`${side}UpperArm`] = [
          now[0] + (side === "left" ? swing : -swing),
          now[1],
          now[2],
        ];
      }
      const swung = deepest(
        resolveHumanPosture(
          body,
          HumanArmClearance.swung(body, { ...standing, joints }, [
            "left",
            "right",
          ]),
        ),
        /Arm$/,
      );
      if (swung.depth > limit)
        complaints.push(
          `${name}: arms swung ${swing} degrees read ${mm(swung.depth)} mm (${swung.where}), within ${mm(limit)} mm expected`,
        );
    }

    // 3. A forearm through the trunk: of the two ways the upper arm can turn,
    // the one that carries the hand across the midline.
    const crossed: IAutoMoviePose[] = [90, -90].map(
      (twist: number): IAutoMoviePose =>
        arm(stance, "right", (now) => ({
          upper: [now.upper[0], now.upper[1], twist],
          lower: [90, now.lower[1], now.lower[2]],
          hand: now.hand,
        })),
    );
    const across = (pose: IAutoMoviePose): number =>
      bones(pose).get("rightHand")!.worldPosition.x;
    const inward: IAutoMoviePose =
      across(crossed[0]!) > across(crossed[1]!) ? crossed[0]! : crossed[1]!;
    const forearm = deepest(
      inward,
      /^right(LowerArm|Hand|Index|Middle|Ring|Little|Thumb)/,
    );
    if (!(forearm.depth > limit))
      complaints.push(
        `${name}: a forearm through the trunk reads ${mm(forearm.depth)} mm (${forearm.where}), more than ${mm(limit)} mm expected`,
      );

    // 4. A leg through the other leg: of the two ways the hip can abduct,
    // the one that carries the foot across the midline.
    const adducted = (degrees: number): IAutoMoviePose => ({
      ...stance,
      joints: [
        ...stance.joints.filter(
          (j: IAutoMovieJointPose): boolean => j.bone !== "leftUpperLeg",
        ),
        {
          bone: "leftUpperLeg",
          flexion: angles(stance, "leftUpperLeg")[0],
          abduction: degrees,
          twist: angles(stance, "leftUpperLeg")[2],
        },
      ],
    });
    const legs: IAutoMoviePose[] = [25, -25].map(adducted);
    const foot = (pose: IAutoMoviePose): number =>
      bones(pose).get("leftFoot")!.worldPosition.x;
    const through: IAutoMoviePose =
      foot(legs[0]!) < foot(legs[1]!) ? legs[0]! : legs[1]!;
    const leg = deepest(through, /Leg$|Foot$|Toes$/);
    if (!(leg.depth > limit))
      complaints.push(
        `${name}: a leg through the other leg reads ${mm(leg.depth)} mm (${leg.where}), more than ${mm(limit)} mm expected`,
      );
  }
  TestValidator.equals("the tangle audit's readings", complaints, []);
}
