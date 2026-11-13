import {
  type IAutoMovieResolvedBone,
  getConstraint,
  jointRomOvershoot,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMoviePose,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanArm,
  AutoMovieMotionHumanBend,
  HumanArmClearance,
  HumanColliders,
  type IHumanBody,
  type IHumanPosture,
  blendHumanJoint,
  poseBones,
  resolveHumanPosture,
  stand,
} from "@automovie/motions";

import { motionComplaints } from "../internal/motionComplaints";
import { motionHumanBody } from "../internal/motionHumanBody";

/**
 * An arm carried in joint space between the angles it holds and the solution
 * of a hand goal (`AutoMovieMotionHumanArm.carry`) arrives exactly at both
 * ends and keeps its forearm out of the body, and out of a partner standing
 * close, between them.
 *
 * Each cell starts from the quiet stance (`stand.posture`): the held angles
 * are the stance's own arm (`AutoMovieMotionHumanArm.angles`), and the goal
 * puts the wrist across the belly, on the front of the other shoulder,
 * ahead at chest height, or ahead at chest height with a partner of the
 * average man's body standing 0.35 m ahead facing back, whose colliders the
 * goal names to keep clear of (`IHumanPosture.IGoal.clear`). The elbow is
 * bent the way a hanging arm bends (`AutoMovieMotionHumanBend.hang`).
 *
 * The forearm's need for room is read on the displayed bones of the carried
 * posture with `HumanArmClearance.overshoot` against the trunk, the thighs
 * and the other arm, the colliders a limb fit keeps a forearm out of, and
 * against the partner's colliders. The carry promises that its two ends keep the room
 * they hold and that between them the forearm asks no more than the share's
 * blend of the two ends' needs: the overshoot at a share `s` may exceed
 * `(1 - s) * O(0) + s * O(1)` by no more than the clearing's tolerance of a
 * twentieth of a degree (a quarter of a millimetre at the elbow).
 *
 * Scenarios, per body of `motionHumanBody.EXTREMES`, arm and goal:
 * 1. At share 0 the displayed arm is the stance's arm, and at share 1 the
 *    goal's solution, within a micrometre.
 * 2. At shares 0.2, 0.4, 0.6 and 0.8 the displayed forearm's overshoot is
 *    within the blended allowance plus 0.05 degrees.
 * 3. No arm joint is pushed further out of its range of motion than the
 *    plain blend of its two ends (`blendHumanJoint`) is, the hand is that
 *    blend exactly, and every joint off the carried arm is the posture's.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Carries real arms of real bodies and reads the displayed bones of the resolved posture; a forearm left through the waist or the partner, an end that misses its angles, a joint turned out of its range or a changed hand fails with its cell.
 * @evidence contracts/development/testing.md#independent-expectations The ends are the stance and the goal's own solution; the allowance is the documented blend of the two ends' needs measured on their displayed bones; the range bound is the blend's own overshoot.
 * @evidence contracts/development/testing.md#distinguishing-cases Four bodies from the lightest to the heaviest, both arms, a goal across the belly, one across the chest, one clear ahead and one into a partner's space, at both ends and four shares between.
 * @evidence contracts/development/testing.md#execution-ownership In memory; slow because each cell solves a fitted posture; the test program discovers every `test_` function, so `pnpm test` and the CI test job run it.
 * @evidence contracts/development/common.md#meaningful-documentation States the stance, the goals, the reading of the forearm's room, the allowance and the 3 scenarios with their bounds.
 */
export function test_human_motion_compose_arm_carry(): void {
  const complaints: motionComplaints.IGatherer = motionComplaints();
  const partner: IHumanBody = motionHumanBody("m-average");
  const others: HumanColliders.IPlaced[] = HumanColliders.placed(
    partner,
    poseBones(
      partner,
      resolveHumanPosture(
        partner,
        stand.posture(partner, { x: 0, y: 0, z: 0.35 }, 180),
      ),
    ),
  );
  for (const name of motionHumanBody.EXTREMES) {
    const body: IHumanBody = motionHumanBody(name);
    const base: IHumanPosture = stand.posture(body, { x: 0, y: 0, z: 0 }, 0);
    const stance: IAutoMoviePose = resolveHumanPosture(body, base);
    const bones = poseBones(body, stance);
    const at = (bone: AutoMovieHumanoidBone): IAutoMovieVector3 =>
      bones.get(bone)!.worldPosition;
    const hips: IAutoMovieVector3 = at("hips");
    const chest: IAutoMovieVector3 = (bones.get("upperChest") ??
      bones.get("chest"))!.worldPosition;
    for (const side of ["left", "right"] as const) {
      const sign: number = side === "left" ? 1 : -1;
      const shoulder: IAutoMovieVector3 = at(`${side}UpperArm`);
      const held: AutoMovieMotionHumanArm.IAngles =
        AutoMovieMotionHumanArm.angles(stance, side);
      const goals: [string, IAutoMovieVector3, boolean][] = [
        [
          "across the belly",
          { x: hips.x - sign * 0.05, y: hips.y + 0.12, z: hips.z + 0.22 },
          false,
        ],
        [
          "on the other shoulder",
          { x: chest.x - sign * 0.12, y: chest.y, z: chest.z + 0.2 },
          false,
        ],
        ["ahead", { x: shoulder.x, y: chest.y, z: shoulder.z + 0.45 }, false],
        [
          "ahead into a partner",
          { x: shoulder.x, y: chest.y, z: shoulder.z + 0.25 },
          true,
        ],
      ];
      for (const [goal, point, near] of goals) {
        const cell: string = `${name} ${side} ${goal}`;
        const blocking: HumanColliders.IPlaced[] = near ? others : [];
        const posture: IHumanPosture = {
          ...base,
          limbs: {
            ...base.limbs,
            [`${side}Arm`]: {
              point,
              bend: AutoMovieMotionHumanBend.hang(body, base, side, 0),
              ...(near ? { clear: blocking } : {}),
            },
          },
        };
        const solved: IAutoMoviePose = resolveHumanPosture(body, posture);
        const end: AutoMovieMotionHumanArm.IAngles =
          AutoMovieMotionHumanArm.angles(solved, side);
        const carried = (share: number): IHumanPosture =>
          AutoMovieMotionHumanArm.carry(body, posture, { [side]: held }, share);
        const other: string = side === "left" ? "right" : "left";
        const shown = (
          share: number,
        ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
          poseBones(body, resolveHumanPosture(body, carried(share)));
        const room = (
          displayed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
        ): number =>
          HumanArmClearance.overshoot(
            body,
            HumanColliders.placed(body, displayed).filter(
              (s: HumanColliders.IPlaced): boolean =>
                OBSTACLES.has(s.bone) ||
                s.bone === `${other}UpperArm` ||
                s.bone === `${other}LowerArm` ||
                s.bone === `${other}Hand`,
            ),
            displayed.get(`${side}LowerArm`)!.worldPosition,
            displayed.get(`${side}Hand`)!.worldPosition,
            side,
            blocking,
          );
        const arm = (
          displayed: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone>,
        ): IAutoMovieVector3[] =>
          (["UpperArm", "LowerArm", "Hand"] as const).map(
            (b) => displayed.get(`${side}${b}`)!.worldPosition,
          );

        // 1. The ends.
        const first: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          shown(0);
        const last: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
          shown(1);
        const off0: number = apart(arm(first), arm(bones));
        const off1: number = apart(arm(last), arm(poseBones(body, solved)));
        complaints.check(
          `${cell}: share 0 is the held arm, off by ${(off0 * 1000).toFixed(4)} mm`,
          off0 <= 1e-6,
        );
        complaints.check(
          `${cell}: share 1 is the goal's arm, off by ${(off1 * 1000).toFixed(4)} mm`,
          off1 <= 1e-6,
        );

        // 2. The room between the ends.
        const need0: number = room(first);
        const need1: number = room(last);
        for (const share of [0.2, 0.4, 0.6, 0.8]) {
          const allowed: number = need0 * (1 - share) + need1 * share;
          const need: number = room(shown(share));
          const written: IHumanPosture = carried(share);
          // What the carry's own reading says of the written arm, of the
          // plain blend and of the two ends, so a failing row tells a
          // clearing that found no way from one that read another room.
          const own = (arm: HumanArmClearance.IArm): string =>
            HumanArmClearance.room(body, solved, side, arm, blocking).toFixed(
              3,
            );
          const angles = (of: readonly [number, number, number]): string =>
            of.map((v: number): string => v.toFixed(1)).join("/");
          const plain: HumanArmClearance.IArm = {
            upper: blendHumanJoint(
              body,
              `${side}UpperArm`,
              held.upper,
              end.upper,
              share,
            ),
            lower: blendHumanJoint(
              body,
              `${side}LowerArm`,
              held.lower,
              end.lower,
              share,
            ),
            hand: blendHumanJoint(
              body,
              `${side}Hand`,
              held.hand,
              end.hand,
              share,
            ),
          };
          complaints.check(
            `${cell} at share ${share}: forearm overshoot ${need.toFixed(3)} deg over the allowance ${allowed.toFixed(3)} (ends ${need0.toFixed(3)}, ${need1.toFixed(3)}); written upper ${angles(written.joints[`${side}UpperArm`]!)} lower ${angles(written.joints[`${side}LowerArm`]!)}, plain upper ${angles(plain.upper)} lower ${angles(plain.lower)}; by the carry's reading the written arm lacks ${own({ upper: written.joints[`${side}UpperArm`]!, lower: written.joints[`${side}LowerArm`]!, hand: written.joints[`${side}Hand`]! })}, the plain blend ${own(plain)}, the ends ${own(held)} and ${own(end)}`,
            need <= allowed + 0.05,
          );

          // 3. Range, hand and the rest.
          for (const [part, from, to] of [
            ["UpperArm", held.upper, end.upper],
            ["LowerArm", held.lower, end.lower],
          ] as const) {
            const bone: AutoMovieHumanoidBone = `${side}${part}`;
            const plain: number = outside(
              body,
              bone,
              blendHumanJoint(body, bone, from, to, share),
            );
            const turned: number = outside(body, bone, written.joints[bone]!);
            complaints.check(
              `${cell} at share ${share}: ${bone} ${turned.toFixed(3)} deg out of range, the plain blend ${plain.toFixed(3)}`,
              turned <= plain + 1e-6,
            );
          }
          complaints.equals(
            `${cell} at share ${share}: the hand is the plain blend`,
            written.joints[`${side}Hand`],
            blendHumanJoint(body, `${side}Hand`, held.hand, end.hand, share),
          );
          const kept: string[] = Object.keys(posture.joints).filter(
            (bone: string): boolean =>
              !bone.startsWith(`${side}UpperArm`) &&
              !bone.startsWith(`${side}LowerArm`) &&
              bone !== `${side}Hand` &&
              JSON.stringify(written.joints[bone as AutoMovieHumanoidBone]) !==
                JSON.stringify(posture.joints[bone as AutoMovieHumanoidBone]),
          );
          complaints.equals(
            `${cell} at share ${share}: joints off the arm are kept`,
            kept,
            [],
          );
        }
      }
    }
  }
  complaints.assert("every carried arm keeps its ends and its room");
}

/** The colliders a fitted forearm is kept out of: the trunk and the thighs. */
const OBSTACLES: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>([
    "hips",
    "spine",
    "chest",
    "upperChest",
    "neck",
    "head",
    "leftUpperLeg",
    "rightUpperLeg",
  ]);

/** The largest distance between corresponding points, metres. */
function apart(a: IAutoMovieVector3[], b: IAutoMovieVector3[]): number {
  return Math.max(
    ...a.map((p: IAutoMovieVector3, i: number): number =>
      Math.hypot(p.x - b[i]!.x, p.y - b[i]!.y, p.z - b[i]!.z),
    ),
  );
}

/** A joint's range of motion overshoot at a triple, degrees. */
function outside(
  body: IHumanBody,
  bone: AutoMovieHumanoidBone,
  of: readonly [number, number, number],
): number {
  return jointRomOvershoot(
    { bone, flexion: of[0], abduction: of[1], twist: of[2] },
    getConstraint(
      bone,
      body.skeleton.bones.find((b: IAutoMovieBone): boolean => b.bone === bone)
        ?.constraint ?? null,
    ),
  );
}
