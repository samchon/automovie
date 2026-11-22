import { Quaternion, Vector3, hingedArmSwivel } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieQuaternion,
  IAutoMovieSwivelNear,
  IAutoMovieSwivelSeed,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../posture/HumanColliders";
import { poseBones } from "../posture/poseBones";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { knockdown } from "../reaction/knockdown";
import { prepareSupportHeldFrames } from "./prepareSupportHeldFrames";
import { prepareSupportPinFloor } from "./prepareSupportPinFloor";
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

/** A contact the root can keep through an interval. */
type Pin = IAutoMovieMotionHumanSupport.IContact | undefined;

/** A held leg's limb goal name: the legs are the limbs a floor lift clears. */
type HeldLeg = `${AutoMovieHumanSide}Leg`;

/**
 * Prepare one support interval: the joint blend between its two keys, the
 * root translation that keeps its common knee or trunk contact, or the
 * first common hand or foot contact, on its achieved
 * point, the floor bound, and an analytic two-bone fit of every hand and
 * foot both keys hold, so no held contact slides while the body moves.
 *
 * Every held hand or foot is posed after the joint blend, as an animation
 * pipeline's late contact pass is. Above the floor the same toe, palm or
 * grip datum used to solve the keys stays on the achieved contact while
 * the wrist or ankle turns. On the floor a foot rolls about the lower of
 * its starting heel and ball sockets and a hand keeps its wrist placement.
 * The elbow or knee bends toward the keys' own middle joints. The floor
 * bound is checked after limiting hip height to the reach of any elevated
 * foot, then confirmed on the held legs as their goals fit them, reading only
 * their chains, and the root lifted by what they still sink: with a foot
 * planted, a hip the blend carries lower folds the knee toward the floor. A
 * held knee or trunk contact has no two-bone chain ending at it and stays
 * held only through the root pin and the floor bound.
 *
 * @param body The unchanged body.
 * @param a The fixed key before the interval.
 * @param b The fixed key after it.
 * @param place The entry-time contact lookup, which may observe an unsettled schedule.
 * @param socket The sole socket each floor foot holds through its window (`supportHeldSocket`); the lower of its heel and ball at the key before when absent.
 * @returns The interior writer and invalidation of its target observations at plan settlement.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the keys, the root pin, the held-limb fit, the floor bound, what stays unpinned and the settlement invalidation.
 * @evidence contracts/development/implementation.md#principled-implementation supportKey.prepareBlended's ROM/root interpolation, then the first common contact's root pin (the source key's achieved contact point against the current one), then per held hand or foot an end-joint goal interpolated between the keys' achieved frames (above-floor contacts use their canonical toe, palm or grip datum, floor hands use the wrist and floor feet roll on their starting bearing socket) with the keys' middle joints as the bend pole, fitted by resolveHumanPosture's analytic limb fit, then applies the planted leg reach bound when an elevated toe bears, then checks floor nonpenetration, confirmed on the held legs' own fitted chains and the root lifted by their remaining sink.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare the blend and common pin, measure the held limbs' key frames once, then per share blend, pin, add the held-limb goals and bound the root.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No contact is moved off its achieved place to keep the root's path; no whole-body solve or sampled pose replaces the per-limb fit. Knee and trunk contacts are not limb-pinned, which the documentation states.
 * @evidence contracts/development/implementation.md#efficient-algorithms The C-by-D common-contact search and the held limbs' key FK run once per interval. The admitted direct blend shares one FK for the pin and collider minimum. The actual held-leg chains are read at the bounded root and after any lift (at most `LIFTS`), continuing from the two endpoint swivels prepared once per interval.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Held key frames and the legs' endpoint swivels serve every write in the current schedule. Both clear on settle along with the entry-space contact lookup because the resolved support level selects the pivot.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The interval owns one blend, the common contact, at most four held-limb frame records, one collider reader and one held-leg chain reader until release, plus one schedule-dependent target/source record until settle or release. A stationary interval retains its first requested planted posture until settle or release. Moving shares release their interpolated pose and query FK/ROM workspaces after each write.
 */
export function prepareSupportInterval(
  body: IAutoMovieMotionHumanBody,
  a: IKey,
  b: IKey,
  place: (
    contact: IAutoMovieMotionHumanSupport.IContact,
  ) => IAutoMovieVector3 | null,
  socket?: prepareSupportHeldFrames.Socket,
): IInterval {
  const blend: ReturnType<typeof supportKey.prepareBlended> =
    supportKey.prepareBlended(body, a.posture, b.posture);
  const common: IAutoMovieMotionHumanSupport.IContact[] = a.contacts.filter(
    (p: IAutoMovieMotionHumanSupport.IContact): boolean =>
      b.contacts.some((q: IAutoMovieMotionHumanSupport.IContact): boolean =>
        supportContact.same(p, q),
      ),
  );
  // The arm and leg endpoints have their own late IK. Give the root to
  // contacts such as a knee or a seat that cannot use that endpoint fit.
  const pin: Pin =
    common.find(
      (contact: IAutoMovieMotionHumanSupport.IContact): boolean =>
        !contact.part.endsWith("Foot") && !contact.part.endsWith("Hand"),
    ) ?? common[0];
  const limbs: prepareSupportHeldFrames.IHeld[] = heldLimbs(common);
  let frames: prepareSupportHeldFrames.IHeldFrames[] | undefined;
  let fixed:
    | {
        held: IAutoMovieVector3;
        arrived: IAutoMovieVector3;
        originalPoint: ReturnType<typeof supportContact.preparePoints>;
        pinFloor: ReturnType<typeof prepareSupportPinFloor>;
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
    const rest = (posture: IAutoMovieMotionHumanPosture): number =>
      (floor ??= knockdown.prepareRest(body))(posture, read, project);
    if (pin === undefined)
      return {
        ...shaped,
        root: { ...shaped.root, y: Math.max(shaped.root.y, rest(shaped)) },
      };
    if (fixed === undefined) {
      const target: IAutoMovieVector3 | null = place(pin);
      const aimed: IAutoMovieVector3 | null =
        target === null ? null : { ...target };
      const point: ReturnType<typeof supportContact.preparePoints> =
        supportContact.preparePoints(body, [{ contact: pin, at: aimed }]);
      fixed = {
        held: point(a.posture, read, project)[0]!,
        arrived: point(b.posture, read, project)[0]!,
        pinFloor: prepareSupportPinFloor(body, pin, aimed),
        originalPoint: point,
      };
    }
    const pin0: NonNullable<typeof fixed> = fixed;
    frames ??= prepareSupportHeldFrames(
      body,
      a.posture,
      b.posture,
      limbs,
      place,
      read,
      project,
      socket,
    );
    const held: prepareSupportHeldFrames.IHeldFrames[] = frames;
    const elevatedFoot: boolean = held.some(
      (frame: prepareSupportHeldFrames.IHeldFrames): boolean =>
        frame.elevated && frame.limb.endsWith("Leg"),
    );

    // The bounded posture at a share: the blend, the pin carried from where
    // the key before achieved it to where the key after does (so the course
    // meets each key's own posture at its ends), each held hand or foot where
    // the keys hold it, fitted by the limb's own chain, and the floor bound.
    const placed: (s: number) => IAutoMovieMotionHumanPosture = (
      s: number,
    ): IAutoMovieMotionHumanPosture => {
      const blended: IAutoMovieMotionHumanPosture = s === w ? shaped : blend(s);
      const fused:
        | ReturnType<ReturnType<typeof prepareSupportPinFloor>>
        | undefined =
        prepareHumanPoseResolution.isNativeSource(read) &&
        project === body.projection
          ? pin0.pinFloor(blended, read, project)
          : undefined;
      const now: IAutoMovieVector3 =
        fused === undefined
          ? pin0.originalPoint(blended, read, project)[0]!
          : fused.point;
      const pinned: IAutoMovieVector3 = Vector3.lerp(
        pin0.held,
        pin0.arrived,
        s,
      );
      const goals: IAutoMovieMotionHumanPosture["limbs"] = { ...blended.limbs };
      for (const frame of held) goals[frame.limb] = heldGoal(frame, s);
      const moved: IAutoMovieMotionHumanPosture = {
        ...blended,
        root: {
          x: blended.root.x + pinned.x - now.x,
          y: blended.root.y + pinned.y - now.y,
          z: blended.root.z + pinned.z - now.z,
        },
        limbs: goals,
      };
      // The hand pin can carry the hip above a raised foot's reachable
      // height between keys. Retain the target and limit the hip first.
      const reachable: IAutoMovieMotionHumanPosture = elevatedFoot
        ? resolveHumanPosture.lower(body, moved, undefined, read)
        : moved;
      const low: number =
        reachable === moved ? (fused?.floor ?? rest(moved)) : rest(reachable);
      return {
        ...reachable,
        root: { ...reachable.root, y: Math.max(reachable.root.y, low) },
      };
    };
    const bounded: IAutoMovieMotionHumanPosture = placed(w);
    // The floor bound reads the blend, but a held leg is shown as its goal
    // fits it: with its foot planted, a lower hip folds the knee toward the
    // floor and can carry the shin through it. Only the held legs' own
    // chains are read, at the bounded root and again after each lift, until
    // their lowest collider is clear (raising the hip with the foot planted
    // raises the knee, so the reading only rises with the root).
    legs ??= prepareLegs(body, frames);
    if (legs === null) return bounded;
    // The keys' own held legs may rest within the fit's tolerance under the
    // floor; the bound is theirs carried between them, so the course meets
    // each key as it is instead of lifting it at its instant.
    sunk ??= [
      Math.min(0, legs.lowest(a.posture, read, project)),
      Math.min(0, legs.lowest(b.posture, read, project)),
    ];

    // The held legs' fits at the interval's two ends, swept once each; every
    // read between them continues the fit from their swivels carried by the
    // share (IAutoMovieSwivelNear), a refinement in place of a sweep.
    ends ??= [
      legs.seeds(placed(0), read, project),
      legs.seeds(placed(1), read, project),
    ];
    const near: IAutoMovieMotionHumanResolveHumanPosture.INear = legs.between(
      ends[0],
      ends[1],
      w,
    );
    const allowed: number = sunk[0] + (sunk[1] - sunk[0]) * w;
    let lifted: IAutoMovieMotionHumanPosture = bounded;
    for (let pass: number = 0; pass < LIFTS; ++pass) {
      const low: number = legs.lowest(lifted, read, project, near);
      if (!(low < allowed - SINK)) break;
      lifted = {
        ...lifted,
        root: { ...lifted.root, y: lifted.root.y + allowed - low },
      };
    }
    return lifted;
  };
  let legs: ReturnType<typeof prepareLegs> | undefined;
  let sunk: readonly [number, number] | undefined;
  let ends:
    | readonly [
        IAutoMovieMotionHumanResolveHumanPosture.INear,
        IAutoMovieMotionHumanResolveHumanPosture.INear,
      ]
    | undefined;
  let settled: IAutoMovieMotionHumanPosture | undefined;
  return {
    // A stationary key keeps the same planted goals through compositing.
    write:
      a.posture !== b.posture
        ? write
        : (
            ...[_share, resolution, projection]: Parameters<IInterval["write"]>
          ): IAutoMovieMotionHumanPosture => {
            settled ??= write(0, resolution, projection);
            return settled;
          },
    settle: (): void => {
      settled = undefined;
      fixed = undefined;
      frames = undefined;
      ends = undefined;
    },
  };
}

/** A reader of the lowest collider of the held legs as their goals fit them, reading only their chains; null where no leg is held. */
function prepareLegs(
  body: IAutoMovieMotionHumanBody,
  frames: readonly prepareSupportHeldFrames.IHeldFrames[],
): {
  lowest: (
    posture: IAutoMovieMotionHumanPosture,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
    near?: IAutoMovieMotionHumanResolveHumanPosture.INear,
  ) => number;
  seeds: (
    posture: IAutoMovieMotionHumanPosture,
    read: ReturnType<typeof prepareHumanPoseResolution>,
    project: ReturnType<typeof prepareHumanPostureProjection>,
  ) => IAutoMovieMotionHumanResolveHumanPosture.INear;
  between: (
    a: IAutoMovieMotionHumanResolveHumanPosture.INear,
    b: IAutoMovieMotionHumanResolveHumanPosture.INear,
    w: number,
  ) => IAutoMovieMotionHumanResolveHumanPosture.INear;
} | null {
  const requested: Set<AutoMovieHumanoidBone> = new Set();
  for (const frame of frames) {
    if (!frame.limb.endsWith("Leg")) continue;
    const side: AutoMovieHumanSide = frame.limb.startsWith("left")
      ? "left"
      : "right";
    for (const bone of ["UpperLeg", "LowerLeg", "Foot", "Toes"] as const)
      requested.add(`${side}${bone}`);
  }
  if (requested.size === 0) return null;
  const placed: ReturnType<typeof poseBones.prepare> = poseBones.prepare(
    body,
    requested,
  );
  const minimum: ReturnType<typeof HumanColliders.prepareMinima> =
    HumanColliders.prepareMinima(body, [requested]);
  const held: HeldLeg[] = frames.flatMap(
    (frame: prepareSupportHeldFrames.IHeldFrames): HeldLeg[] =>
      frame.limb === "leftLeg" || frame.limb === "rightLeg" ? [frame.limb] : [],
  );
  return {
    lowest: (
      posture: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
      near?: IAutoMovieMotionHumanResolveHumanPosture.INear,
    ): number =>
      minimum(
        placed(
          resolveHumanPosture.seeded(
            body,
            posture,
            undefined,
            near,
            read,
            requested,
            project,
          ).pose,
          read(),
        ),
      )[0]!,
    seeds: (
      posture: IAutoMovieMotionHumanPosture,
      read: ReturnType<typeof prepareHumanPoseResolution>,
      project: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanResolveHumanPosture.INear => {
      const seeds: IAutoMovieMotionHumanResolveHumanPosture.ISeeded["seeds"] =
        resolveHumanPosture.seeded(
          body,
          posture,
          undefined,
          undefined,
          read,
          requested,
          project,
        ).seeds;
      const out: Partial<Record<HeldLeg, IAutoMovieSwivelNear>> = {};
      for (const limb of held) {
        const seed: IAutoMovieSwivelSeed | null | undefined = seeds[limb];
        if (seed !== null && seed !== undefined)
          out[limb] = {
            branch: seed.branch,
            swivel: seed.swivel,
            tolerance: hingedArmSwivel.RESOLUTION,
          };
      }
      return out;
    },
    between: (
      a: IAutoMovieMotionHumanResolveHumanPosture.INear,
      b: IAutoMovieMotionHumanResolveHumanPosture.INear,
      w: number,
    ): IAutoMovieMotionHumanResolveHumanPosture.INear => {
      // The swivel the shorter way round on the ends' common branch; a leg
      // whose ends differ in branch, or lack a seed, is swept as before.
      const out: Partial<Record<HeldLeg, IAutoMovieSwivelNear>> = {};
      for (const limb of held) {
        const from: IAutoMovieSwivelNear | undefined = a[limb];
        const to: IAutoMovieSwivelNear | undefined = b[limb];
        if (from === undefined || to === undefined || from.branch !== to.branch)
          continue;
        const turn: number = to.swivel - from.swivel;
        const delta: number = turn - 360 * Math.round(turn / 360);
        out[limb] = {
          branch: from.branch,
          swivel: from.swivel + w * delta,
          tolerance: hingedArmSwivel.RESOLUTION,
        };
      }
      return out;
    },
  };
}

/** The hands and feet among the contacts both keys hold, one per limb in contact order. */
function heldLimbs(
  contacts: readonly IAutoMovieMotionHumanSupport.IContact[],
): prepareSupportHeldFrames.IHeld[] {
  const out: prepareSupportHeldFrames.IHeld[] = [];
  for (const contact of contacts) {
    const side: AutoMovieHumanSide = contact.part.startsWith("left")
      ? "left"
      : "right";
    const held: prepareSupportHeldFrames.IHeld | undefined =
      contact.part.endsWith("Hand")
        ? {
            limb: `${side}Arm`,
            end: `${side}Hand`,
            middle: `${side}LowerArm`,
            contact,
          }
        : contact.part.endsWith("Foot")
          ? {
              limb: `${side}Leg`,
              end: `${side}Foot`,
              middle: `${side}LowerLeg`,
              contact,
            }
          : undefined;
    if (
      held !== undefined &&
      !out.some(
        (h: prepareSupportHeldFrames.IHeld): boolean => h.limb === held.limb,
      )
    )
      out.push(held);
  }
  return out;
}

/** Rotate the end joint about its retained contact and blend the elbow or knee pole. */
function heldGoal(
  frame: prepareSupportHeldFrames.IHeldFrames,
  w: number,
): IAutoMovieHumanLimbGoal {
  const rotation: IAutoMovieQuaternion = Quaternion.slerp(
    frame.rotation[0],
    frame.rotation[1],
    w,
  );
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
    reference: {
      upper: mix(frame.reference[0].upper, frame.reference[1].upper, w),
      lower: mix(frame.reference[0].lower, frame.reference[1].lower, w),
    },
    planted: true,
  };
}

/** Two angle triples mixed at a share, each component linearly. */
function mix(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  w: number,
): readonly [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * w,
    a[1] + (b[1] - a[1]) * w,
    a[2] + (b[2] - a[2]) * w,
  ];
}

/** The root lifts at most that clear the held legs of the floor: each removes what the last left sinking, the refit after a lift raising the knee by no more than the lift (provisional). */
const LIFTS: number = 4;

/** How far under the floor a held leg may read before the root is lifted, metres: a micrometre, far under the floor audit's 5 mm (provisional). */
const SINK: number = 1e-6;
