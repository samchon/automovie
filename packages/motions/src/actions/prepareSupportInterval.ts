import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { knockdown } from "../reaction/knockdown";
import { supportContact } from "./supportContact";
import { supportKey } from "./supportKey";

/** A support key's immutable authored posture and contact order. */
interface IKey {
  /** The key's joint-space posture, world metres and clinical degrees. */
  posture: IAutoMovieMotionHumanPosture;

  /** The ordered contacts that choose the interval's first common pin. */
  contacts: readonly IAutoMovieMotionHumanSupport.IContact[];
}

/** One interval's writer and standard scheduling invalidation boundary. */
interface IInterval {
  /** Read the interior progress with fresh contact/floor observations. */
  write(
    w: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture;

  /** Drop target-dependent observations made before the performance settled. */
  settle(): void;
}

/** A hand or foot held through the interval: its limb and the bones its end and middle joints are. */
interface IHeld {
  /** The limb goal's name. */
  limb: "leftArm" | "rightArm" | "leftLeg" | "rightLeg";

  /** The wrist's or ankle's bone. */
  end: AutoMovieHumanoidBone;

  /** The elbow's or knee's bone. */
  middle: AutoMovieHumanoidBone;
}

/** A held limb's achieved end and middle joints at both keys, world metres and world rotations. */
interface IHeldFrames {
  /** The limb. */
  limb: IHeld["limb"];

  /** The end joint's position at the key before, then after. */
  point: readonly [IAutoMovieVector3, IAutoMovieVector3];

  /** The end joint's rotation at the key before, then after. */
  rotation: readonly [IAutoMovieQuaternion, IAutoMovieQuaternion];

  /** The middle joint's position at the key before, then after, the bend's pole. */
  bend: readonly [IAutoMovieVector3, IAutoMovieVector3];
}

/**
 * Prepare one support interval: the joint blend between its two keys, the
 * root translation that keeps its first common contact on its achieved
 * point, the floor bound, and an analytic two-bone fit of every hand and
 * foot both keys hold, so no held contact slides while the body moves.
 *
 * Every held hand or foot is posed after the joint blend, as an animation
 * pipeline's late contact pass is: its wrist or ankle goes to the place and
 * rotation the two keys' own solutions give it, interpolated by the share,
 * and its elbow or knee bends toward the keys' own middle joint, so the
 * resolver's per-limb fit puts the contact back where both keys hold it. A
 * held knee or trunk contact has no two-bone chain ending at it and stays
 * held only through the root pin and the floor bound.
 *
 * @param body The unchanged body.
 * @param a The fixed key before the interval.
 * @param b The fixed key after it.
 * @param place The entry-time contact lookup, which may observe an unsettled schedule.
 * @returns The interior writer and invalidation of its target observations at plan settlement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the keys, the root pin, the held-limb fit, the floor bound, what stays unpinned and the settlement invalidation.
 * @evidence contracts/development/implementation.md#principled-implementation supportKey.prepareBlended's ROM/root interpolation, then the first common contact's root pin (the source key's achieved contact point against the current one), then per held hand or foot an end-joint goal interpolated between the keys' achieved frames (lerp of positions, slerp of rotations) with the keys' middle joints as the bend pole, fitted by resolveHumanPosture's analytic limb fit, then the floor nonpenetration/rest rule.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the blend and common pin, measure the held limbs' key frames once, then per share blend, pin, add the held-limb goals and bound the root.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No contact is moved off its achieved place to keep the root's path; no whole-body solve or sampled pose replaces the per-limb fit. Knee and trunk contacts are not limb-pinned, which the documentation states.
 * @evidence contracts/development/implementation.md#efficient-algorithms The C-by-D common-contact search and the held limbs' key FK (two solves of fixed keys) run once per interval; each write adds at most four analytic limb fits to the resolve the caller makes, with the pin's point solve and floor reading.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Keys/body/contact order are fixed for the plan, so the held key frames serve every write. Schedule-dependent target/source observations clear on settle; every changing pose resolves normally.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The interval owns one blend, the common contact, at most four held-limb frame records and one collider reader until release, plus one schedule-dependent target/source record until settle or release. Query FK/ROM loans end with write; no share, interpolated pose, point, floor result or workspace is retained.
 */
export function prepareSupportInterval(
  body: IAutoMovieMotionHumanBody,
  a: IKey,
  b: IKey,
  place: (contact: IAutoMovieMotionHumanSupport.IContact) => IAutoMovieVector3 | null,
): IInterval {
  const blend: ReturnType<typeof supportKey.prepareBlended> =
    supportKey.prepareBlended(body, a.posture, b.posture);
  const common: IAutoMovieMotionHumanSupport.IContact[] = a.contacts.filter(
    (p: IAutoMovieMotionHumanSupport.IContact): boolean =>
      b.contacts.some((q: IAutoMovieMotionHumanSupport.IContact): boolean =>
        supportContact.same(p, q),
      ),
  );
  const pin: IAutoMovieMotionHumanSupport.IContact | undefined = common[0];
  const limbs: IHeld[] = heldLimbs(common);
  let frames: IHeldFrames[] | undefined;
  let fixed:
    | {
        held: IAutoMovieVector3;
        floor: boolean;
        point: ReturnType<typeof supportContact.preparePoints>;
      }
    | undefined;
  let floor: ReturnType<typeof knockdown.prepareRest> | undefined;
  const write: IInterval["write"] = (
    w: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture => {
    const shaped: IAutoMovieMotionHumanPosture = blend(w);
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      projection ?? prepareHumanPostureProjection(body);
    const rest: (posture: IAutoMovieMotionHumanPosture) => number = (
      posture: IAutoMovieMotionHumanPosture,
    ): number => {
      floor ??= knockdown.prepareRest(body);
      return floor(posture, read, project);
    };
    if (pin === undefined)
      return {
        ...shaped,
        root: {
          ...shaped.root,
          y: Math.max(shaped.root.y, rest(shaped)),
        },
      };
    if (fixed === undefined) {
      const target: IAutoMovieVector3 | null = place(pin);
      const aimed: IAutoMovieVector3 | null =
        target === null ? null : { ...target };
      const point: ReturnType<typeof supportContact.preparePoints> =
        supportContact.preparePoints(body, [{ contact: pin, at: aimed }]);
      fixed = {
        held: point(a.posture, read, project)[0]!,
        floor: supportContact.onFloorTarget(aimed),
        point,
      };
    }
    const now: IAutoMovieVector3 = fixed.point(shaped, read, project)[0]!;
    frames ??= keyFrames(body, a.posture, b.posture, limbs, read, project);

    // Each held hand or foot goes where the keys hold it, fitted by the
    // limb's own analytic chain after the blend.
    const goals: IAutoMovieMotionHumanPosture["limbs"] = { ...shaped.limbs };
    for (const frame of frames) goals[frame.limb] = heldGoal(frame, w);
    const moved: IAutoMovieMotionHumanPosture = {
      ...shaped,
      root: {
        x: shaped.root.x + fixed.held.x - now.x,
        y: shaped.root.y + fixed.held.y - now.y,
        z: shaped.root.z + fixed.held.z - now.z,
      },
      limbs: goals,
    };
    return {
      ...moved,
      root: {
        ...moved.root,
        y: fixed.floor ? rest(moved) : Math.max(moved.root.y, rest(moved)),
      },
    };
  };
  return {
    write,
    settle: (): void => {
      fixed = undefined;
    },
  };
}

/** The hands and feet among the contacts both keys hold, one per limb in contact order. */
function heldLimbs(
  contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
): IHeld[] {
  const out: IHeld[] = [];
  for (const contact of contacts) {
    const side: "left" | "right" = contact.part.startsWith("left") ? "left" : "right";
    const held: IHeld | undefined = contact.part.endsWith("Hand")
      ? { limb: `${side}Arm`, end: `${side}Hand`, middle: `${side}LowerArm` }
      : contact.part.endsWith("Foot")
        ? { limb: `${side}Leg`, end: `${side}Foot`, middle: `${side}LowerLeg` }
        : undefined;
    if (held !== undefined && !out.some((h: IHeld): boolean => h.limb === held.limb))
      out.push(held);
  }
  return out;
}

/** The held limbs' achieved end and middle joint frames at both keys, read once by forward kinematics of each key's solution. */
function keyFrames(
  body: IAutoMovieMotionHumanBody,
  a: IAutoMovieMotionHumanPosture,
  b: IAutoMovieMotionHumanPosture,
  limbs: readonly IHeld[],
  read: ReturnType<typeof prepareHumanPoseResolution>,
  project: ReturnType<typeof prepareHumanPostureProjection>,
): IHeldFrames[] {
  if (limbs.length === 0) return [];
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  for (const limb of limbs) {
    requested.add(limb.end);
    requested.add(limb.middle);
  }
  const frames: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, requested);
  const at: (posture: IAutoMovieMotionHumanPosture) => Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = (
    posture: IAutoMovieMotionHumanPosture,
  ): Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =>
    frames(
      resolveHumanPosture.seeded(body, posture, undefined, undefined, read, requested, project).pose,
      read(),
    );
  const before: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = at(a);
  const after: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> = at(b);
  return limbs.map((limb: IHeld): IHeldFrames => ({
    limb: limb.limb,
    point: [
      { ...before.get(limb.end)!.worldPosition },
      { ...after.get(limb.end)!.worldPosition },
    ],
    rotation: [
      { ...before.get(limb.end)!.worldRotation },
      { ...after.get(limb.end)!.worldRotation },
    ],
    bend: [
      { ...before.get(limb.middle)!.worldPosition },
      { ...after.get(limb.middle)!.worldPosition },
    ],
  }));
}

/** A held limb's goal at a share: its end joint between the keys' frames, its middle joint's pole between theirs, planted. */
function heldGoal(frame: IHeldFrames, w: number): IAutoMovieHumanLimbGoal {
  return {
    point: Vector3.lerp(frame.point[0], frame.point[1], w),
    rotation: Quaternion.slerp(frame.rotation[0], frame.rotation[1], w),
    bend: Vector3.lerp(frame.bend[0], frame.bend[1], w),
    planted: true,
  };
}
