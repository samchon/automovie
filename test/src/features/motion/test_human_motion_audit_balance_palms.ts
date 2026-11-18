import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanAuditMotion,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";
import { AutoMovieMotionHumanAuditBalance } from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

import { motionAuditMoved } from "../internal/motionAuditMoved";
import { motionHumanBody } from "../internal/motionHumanBody";
import { motionHumanStance } from "../internal/motionHumanStance";

/**
 * The balance audit's base of support holds every part that bears on the
 * floor: palms laid on the floor bear as knees do, so a body leant over its
 * hands stands inside the base its feet and palms make.
 *
 * The body is the average man's quiet stance, still for 1 s, with every bone
 * but the feet carried 0.3 m ahead and the hands and fingers 0.6 m ahead, so
 * its centre of mass lies well ahead of its feet and behind its palms.
 *
 * Scenarios, the margin read at 0.5 s:
 * 1. Both feet and both hands declared planted on the ground: the margin is
 *    positive, the centre inside the hull of the soles and the palms.
 * 2. The same with a knee also bearing (`bear`): still positive.
 * 3. Only the feet declared: the margin is negative, the centre ahead of the
 *    soles, so the palms in scenario 1 are what holds it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Reads the public margin of a hand-made motion whose geometry the test writes; a base that leaves out planted palms reads scenario 1 as outside, and a base that counts undeclared parts reads scenario 3 as inside.
 * @evidence contracts/development/testing.md#independent-expectations The expectation is the support polygon's definition (Winter: the hull of every bearing contact) applied to translations the test chose, 0.3 m and 0.6 m, far beyond any sole length; no value is read from the audit.
 * @evidence contracts/development/testing.md#distinguishing-cases Palms planted, palms with a bearing knee, and no palms on the same body and instant.
 * @evidence contracts/development/testing.md#execution-ownership In memory on one prepared body; the test program discovers every `test_` function.
 * @evidence contracts/development/common.md#meaningful-documentation States the film, its translations and the three scenarios with their expected signs.
 */
export function test_human_motion_audit_balance_palms(): void {
  const body: IAutoMovieMotionHumanBody = motionHumanBody("m-average");
  const stance: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
    motionHumanStance(body);
  const move: (bone: AutoMovieHumanoidBone) => IAutoMovieVector3 = (
    bone: AutoMovieHumanoidBone,
  ): IAutoMovieVector3 =>
    /(Foot|Toes)$/.test(bone)
      ? { x: 0, y: 0, z: 0 }
      : /(Hand|Thumb|Index|Middle|Ring|Little)/.test(bone)
        ? { x: 0, y: 0, z: 0.6 }
        : { x: 0, y: 0, z: 0.3 };
  const window: (
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind?: IAutoMovieMotionHumanContactWindow["kind"],
  ) => IAutoMovieMotionHumanContactWindow = (
    part: IAutoMovieMotionHumanContactWindow["part"],
    kind: IAutoMovieMotionHumanContactWindow["kind"] = "plant",
  ): IAutoMovieMotionHumanContactWindow => ({
    part,
    kind,
    from: 0,
    to: 1,
    support: { kind: "ground" },
  });
  const margin: (contacts: IAutoMovieMotionHumanContactWindow[]) => number = (
    contacts: IAutoMovieMotionHumanContactWindow[],
  ): number => {
    const motion: IAutoMovieMotionHumanAuditMotion = motionAuditMoved(
      stance,
      1,
      move,
      [
        {
          name: "lean",
          start: 0,
          entryTime: 0,
          end: 1,
          plan: { duration: 1, contacts },
        },
      ],
    );
    return AutoMovieMotionHumanAuditBalance.margin(
      motion,
      "a",
      body,
      body.massModel,
      0.5,
    );
  };
  const feet: IAutoMovieMotionHumanContactWindow[] = [
    window("leftFoot"),
    window("rightFoot"),
  ];
  const palms: number = margin([
    ...feet,
    window("leftHand"),
    window("rightHand"),
  ]);
  const kneeling: number = margin([
    ...feet,
    window("leftHand"),
    window("rightHand"),
    window("leftLowerLeg", "bear"),
  ]);
  const unsupported: number = margin(feet);
  TestValidator.predicate(
    `palms on the floor bear: margins ${palms.toFixed(3)} with palms, ${kneeling.toFixed(3)} with palms and a knee, ${unsupported.toFixed(3)} on the feet alone`,
    palms > 0 && kneeling > 0 && unsupported < 0,
  );
}
