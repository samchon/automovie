import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../compose/AutoMovieMotionHumanArmCourse";
import { lowerHumanPosture } from "../posture/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../posture/prepareHumanPostureProjection";
import { knockdown } from "../reaction/knockdown";
import { prepareSupportHeldFrames } from "./prepareSupportHeldFrames";
import { prepareSupportHeldLegs } from "./prepareSupportHeldLegs";
import { prepareSupportLiftCourse } from "./prepareSupportLiftCourse";
import { prepareSupportPinFloor } from "./prepareSupportPinFloor";
import { supportContact } from "./supportContact";
import { supportKey } from "./supportKey";

/** A support key's immutable authored posture and contact order. */
interface IKey {
  /** The key's joint-space posture, world metres and clinical degrees. */
  posture: IAutoMovieMotionHumanPosture;

  /** The ordered contacts that choose the interval's first common pin. */
  contacts: readonly IAutoMovieMotionHumanSupport.IContact[];

  /** When the key is reached, seconds since the action's start. */
  seconds: number;
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
/** The record of `IPrepareSupportIntervalFixed`'s site. */
type IPrepareSupportIntervalFixed = {
  held: IAutoMovieVector3;
  arrived: IAutoMovieVector3;
  originalPoint: ReturnType<typeof supportContact.preparePoints>;
  pinFloor: ReturnType<typeof prepareSupportPinFloor>;
};

/**
 * Prepare one support interval: the joint blend between its two keys, the root
 * translation that keeps its common knee or trunk contact, or the first common
 * hand or foot contact, on its achieved point, the floor bound, and an analytic
 * two-bone fit of every hand and foot both keys hold, so no held contact slides
 * while the body moves.
 *
 * Every held hand or foot is posed after the joint blend, as an animation
 * pipeline's late contact pass is. Above the floor the same toe, palm or grip
 * datum used to solve the keys stays on the achieved contact while the wrist or
 * ankle turns. On the floor a foot rolls about the lower of its starting heel
 * and ball sockets and a hand keeps its wrist placement. The elbow or knee
 * bends toward the keys' own middle joints. The floor bound is checked after
 * limiting hip height to the reach of any elevated foot, then confirmed on the
 * held legs as their goals fit them, reading only their chains, and the root
 * lifted by what they still sink: with a foot planted, a hip the blend carries
 * lower folds the knee toward the floor. That lift is planned on the interval's
 * share at knots and read between them within the solver's millimetre
 * (`prepareSupportLiftCourse`). A held knee or trunk contact has no two-bone
 * chain ending at it and stays held only through the root pin and the floor
 * bound.
 *
 * @param body The unchanged body.
 * @param a The fixed key before the interval.
 * @param b The fixed key after it.
 * @param place The entry-time contact lookup, which may observe an unsettled
 *   schedule.
 * @param socket The sole socket each floor foot holds through its window
 *   (`supportHeldSocket`); the lower of its heel and ball at the key before
 *   when absent.
 * @returns The interior writer and invalidation of its target observations at
 *   plan settlement.
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
  let fixed: IPrepareSupportIntervalFixed | undefined;
  const floor: ReturnType<typeof knockdown.prepareRest> =
    knockdown.prepareRest(body);
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
      floor(posture, read, project);
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
        ? lowerHumanPosture(body, moved, undefined, read)
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
    legs ??= prepareSupportHeldLegs(body, frames);
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
    const chains: prepareSupportHeldLegs.IReader = legs;
    const reach: readonly [number, number] = sunk;
    const swivels: NonNullable<typeof ends> = ends;
    // The exact lift at a share: the held legs fitted at the bounded root,
    // continuing the ends' swivels carried by the share, and the root raised
    // by what they still sink, at most LIFTS times.
    const exact: prepareSupportLiftCourse.Exact = (s: number): number => {
      const start: IAutoMovieMotionHumanPosture = s === w ? bounded : placed(s);
      const near: IAutoMovieMotionHumanResolveHumanPosture.INear =
        chains.between(swivels[0], swivels[1], s);
      const allowed: number = reach[0] + (reach[1] - reach[0]) * s;
      let lifted: IAutoMovieMotionHumanPosture = start;
      for (let pass: number = 0; pass < LIFTS; ++pass) {
        const low: number = chains.lowest(lifted, read, project, near);
        if (!(low < allowed - SINK)) break;
        lifted = {
          ...lifted,
          root: { ...lifted.root, y: lifted.root.y + allowed - low },
        };
      }
      return lifted.root.y - start.root.y;
    };
    // The lift is planned once on the share and read by every sample
    // (`prepareSupportLiftCourse`): the held legs are fitted at its knots
    // alone, not at every displayed second.
    return {
      ...bounded,
      root: { ...bounded.root, y: bounded.root.y + lifts.read(w, exact) },
    };
  };
  let legs: prepareSupportHeldLegs.IReader | null | undefined;
  let sunk: readonly [number, number] | undefined;
  let ends:
    | readonly [
        IAutoMovieMotionHumanResolveHumanPosture.INear,
        IAutoMovieMotionHumanResolveHumanPosture.INear,
      ]
    | undefined;
  let settled: IAutoMovieMotionHumanPosture | undefined;
  // The lift course splits no finer than the frame grid's share of the
  // interval's seconds.
  const lifts: prepareSupportLiftCourse.ICourse = prepareSupportLiftCourse(
    AutoMovieMotionHumanArmCourse.STEP /
      Math.max(b.seconds - a.seconds, AutoMovieMotionHumanArmCourse.STEP),
  );
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
      lifts.clear();
    },
  };
}

/**
 * The hands and feet among the contacts both keys hold, one per limb in contact
 * order.
 */
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

/**
 * Rotate the end joint about its retained contact and blend the elbow or knee
 * pole.
 */
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

/**
 * The root lifts at most that clear the held legs of the floor: each removes
 * what the last left sinking, the refit after a lift raising the knee by no
 * more than the lift (provisional).
 */
const LIFTS: number = 4;

/**
 * How far under the floor a held leg may read before the root is lifted,
 * metres: a micrometre, far under the floor audit's 5 mm (provisional).
 */
const SINK: number = 1e-6;
