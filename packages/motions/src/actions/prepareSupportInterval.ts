import { Quaternion, Vector3, resolveAutoMovieHumanoidSurfaces } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
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

  /** A held foot's pivot: the sole socket it bears on at the key before (the lower of its heel and ball), in the foot's frame, and where it lies at each key. Absent for a hand. */
  pivot?: {
    /** The socket in the foot bone's frame, metres. */
    local: IAutoMovieVector3;

    /** The socket's world place at the key before, then after. */
    at: readonly [IAutoMovieVector3, IAutoMovieVector3];
  };
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
 * held foot rolls on its contact rather than swinging about its ankle: the
 * sole socket it bears on where the move starts (the lower of its heel and
 * ball) is carried between its places at the two keys while the foot turns
 * about it, so the sole comes onto the floor about that point and no part
 * of it passes through the floor. The floor bound, read on the blend, is
 * then confirmed on the held legs as their goals fit them, reading only
 * their chains, and the root lifted by what they still sink: with a foot
 * planted, a hip the blend carries lower folds the knee toward the floor. A
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
 * @evidence contracts/development/implementation.md#principled-implementation supportKey.prepareBlended's ROM/root interpolation, then the first common contact's root pin (the source key's achieved contact point against the current one), then per held hand or foot an end-joint goal interpolated between the keys' achieved frames (a hand's position lerped, a foot's placed by its bearing socket lerped while the foot's rotation slerps about it, the foot rolling on its contact) with the keys' middle joints as the bend pole, fitted by resolveHumanPosture's analytic limb fit, then the floor nonpenetration/rest rule, confirmed on the held legs' own fitted chains and the root lifted by their remaining sink.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the blend and common pin, measure the held limbs' key frames once, then per share blend, pin, add the held-limb goals and bound the root.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No contact is moved off its achieved place to keep the root's path; no whole-body solve or sampled pose replaces the per-limb fit. Knee and trunk contacts are not limb-pinned, which the documentation states.
 * @evidence contracts/development/implementation.md#efficient-algorithms The C-by-D common-contact search and the held limbs' key FK (two solves of fixed keys) run once per interval; each write adds at most four analytic limb fits to the resolve the caller makes, with the pin's point solve and floor reading, and one reading of the held legs' chains alone (more only while they sink, at most `LIFTS`).
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Keys/body/contact order are fixed for the plan, so the held key frames serve every write. Schedule-dependent target/source observations clear on settle; every changing pose resolves normally.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The interval owns one blend, the common contact, at most four held-limb frame records, one collider reader and one held-leg chain reader until release, plus one schedule-dependent target/source record until settle or release. Query FK/ROM loans end with write; no share, interpolated pose, point, floor result or workspace is retained.
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
    const bounded: IAutoMovieMotionHumanPosture = {
      ...moved,
      root: {
        ...moved.root,
        y: fixed.floor ? rest(moved) : Math.max(moved.root.y, rest(moved)),
      },
    };

    // The floor bound reads the blend, but a held leg is shown as its goal
    // fits it: with its foot planted, a lower hip folds the knee toward the
    // floor and can carry the shin through it. Only the held legs' own
    // chains are read, at the bounded root and again after each lift, until
    // their lowest collider is clear (raising the hip with the foot planted
    // raises the knee, so the reading only rises with the root).
    legs ??= prepareLegs(body, frames);
    if (legs === null) return bounded;
    let lifted: IAutoMovieMotionHumanPosture = bounded;
    for (let pass: number = 0; pass < LIFTS; ++pass) {
      const low: number = legs.lowest(lifted, read, project);
      if (!(low < -SINK)) break;
      lifted = { ...lifted, root: { ...lifted.root, y: lifted.root.y - low } };
    }
    return lifted;
  };
  let legs: ReturnType<typeof prepareLegs> | undefined;
  return {
    write,
    settle: (): void => {
      fixed = undefined;
    },
  };
}

/** A reader of the lowest collider of the held legs as their goals fit them, reading only their chains; null where no leg is held. */
function prepareLegs(
  body: IAutoMovieMotionHumanBody,
  frames: readonly IHeldFrames[],
): {
  lowest: (
    posture: IAutoMovieMotionHumanPosture,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
  ) => number;
} | null {
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  for (const frame of frames) {
    if (!frame.limb.endsWith("Leg")) continue;
    const side: "left" | "right" = frame.limb.startsWith("left") ? "left" : "right";
    for (const bone of ["UpperLeg", "LowerLeg", "Foot", "Toes"] as const)
      requested.add(`${side}${bone}`);
  }
  if (requested.size === 0) return null;
  const placed: ReturnType<typeof poseBones.prepare> = poseBones.prepare(body, requested);
  const minimum: ReturnType<typeof HumanColliders.prepareMinima> =
    HumanColliders.prepareMinima(body, [requested]);
  return {
    lowest: (
      posture: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
    ): number =>
      minimum(
        placed(
          resolveHumanPosture.seeded(body, posture, undefined, undefined, read, requested, project).pose,
          read(),
        ),
      )[0]!,
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

  // A held foot's heel and ball sockets, which ride the foot bone itself.
  const soles = (limb: IHeld): IAutoMovieHumanoidSurfaces.IFrame[] => {
    const side: "Left" | "Right" = limb.end.startsWith("left") ? "Left" : "Right";
    return [body.surfaces.sockets[`heel${side}`], body.surfaces.sockets[`ball${side}`]];
  };
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
  return limbs.map((limb: IHeld): IHeldFrames => {
    const a0: IAutoMovieResolvedBone = before.get(limb.end)!;
    const b0: IAutoMovieResolvedBone = after.get(limb.end)!;
    const frames: IHeldFrames = {
      limb: limb.limb,
      point: [{ ...a0.worldPosition }, { ...b0.worldPosition }],
      rotation: [{ ...a0.worldRotation }, { ...b0.worldRotation }],
      bend: [
        { ...before.get(limb.middle)!.worldPosition },
        { ...after.get(limb.middle)!.worldPosition },
      ],
    };
    if (!limb.end.endsWith("Foot")) return frames;

    // The foot rolls on the sole socket it bears on where the move starts:
    // that point is carried from its place at one key to its place at the
    // other while the foot turns about it, so the sole comes onto the floor
    // about its contact and no part of it is swung through the floor.
    const placed: IAutoMovieVector3[] = soles(limb).map(
      (frame: IAutoMovieHumanoidSurfaces.IFrame): IAutoMovieVector3 =>
        resolveAutoMovieHumanoidSurfaces.point(frame, a0),
    );
    const pivot: IAutoMovieVector3 = placed[0]!.y <= placed[1]!.y ? placed[0]! : placed[1]!;
    const local: IAutoMovieVector3 = Quaternion.rotateVector(
      Quaternion.inverse(a0.worldRotation),
      Vector3.subtract(pivot, a0.worldPosition),
    );
    return {
      ...frames,
      pivot: {
        local,
        at: [
          { ...pivot },
          Vector3.add(b0.worldPosition, Quaternion.rotateVector(b0.worldRotation, local)),
        ],
      },
    };
  });
}

/** A held limb's goal at a share: its end joint between the keys' frames (a foot's placed by its pivot, which the share carries between the keys while the foot turns about it), its middle joint's pole between theirs, planted. */
function heldGoal(frame: IHeldFrames, w: number): IAutoMovieHumanLimbGoal {
  const rotation: IAutoMovieQuaternion = Quaternion.slerp(frame.rotation[0], frame.rotation[1], w);
  return {
    point:
      frame.pivot === undefined
        ? Vector3.lerp(frame.point[0], frame.point[1], w)
        : Vector3.subtract(
            Vector3.lerp(frame.pivot.at[0], frame.pivot.at[1], w),
            Quaternion.rotateVector(rotation, frame.pivot.local),
          ),
    rotation,
    bend: Vector3.lerp(frame.bend[0], frame.bend[1], w),
    planted: true,
  };
}

/** The root lifts at most that clear the held legs of the floor: each removes what the last left sinking, the refit after a lift raising the knee by no more than the lift (provisional). */
const LIFTS: number = 4;

/** How far under the floor a held leg may read before the root is lifted, metres: a micrometre, far under the floor audit's 5 mm (provisional). */
const SINK: number = 1e-6;
