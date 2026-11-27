import { Quaternion, Vector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanResolveHumanPosture,
  IAutoMovieMotionHumanSupport,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanArmCourse } from "../../compose/internal/AutoMovieMotionHumanArmCourse";
import { lowerHumanPosture } from "../../posture/internal/lowerHumanPosture";
import { prepareHumanPoseResolution } from "../../posture/internal/prepareHumanPoseResolution";
import { prepareHumanPostureProjection } from "../../posture/internal/prepareHumanPostureProjection";
import { knockdown } from "../../reaction/internal/knockdown";
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
  /** Read the interior progress and the material at the action's actual second. */
  write(
    w: number,
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture;

  /** Prepare the target-dependent constants again from the placed observations. */
  prepare(): void;
}

/** A contact the root can keep through an interval. */
type Pin = IAutoMovieMotionHumanSupport.IContact | undefined;

/** What a share's bounded posture reads of its interval. */
interface IPosed {
  /** The unchanged body. */
  body: IAutoMovieMotionHumanBody;

  /** The joint blend between the two keys. */
  blend: ReturnType<typeof supportKey.prepareBlended>;

  /** The floor bound. */
  floor: ReturnType<typeof knockdown.prepareRest>;
}

/** The pin's prepared points and the held limbs' frames. */
interface IPinned {
  /** The pin's achieved points at the two keys and its readers. */
  fixed: IPrepareSupportIntervalFixed;

  /** The held hands' and feet's prepared goal writers. */
  goals: readonly (readonly [prepareSupportHeldFrames.IHeld["limb"], IGoal])[];

  /** Each distinct retained material frame, in its prepared slot. */
  sites: readonly prepareSupportInterval.Site[];

  /** Whether a held foot stands raised above the floor. */
  elevatedFoot: boolean;
}

/** An interval's target-dependent constants, prepared with its observations. */
interface IPrepared {
  /** The pin's points and held frames; none without a pin. */
  pinned?: IPinned;

  /** The held legs' lift course; none without a held leg. */
  lifts?: prepareSupportLiftCourse.ICourse;
}
/** The record of `IPrepareSupportIntervalFixed`'s site. */
type IPrepareSupportIntervalFixed = {
  point: IPoint;
  originalPoint: ReturnType<typeof supportContact.preparePoints>;
  pinFloor: ReturnType<typeof prepareSupportPinFloor>;
};

/** The world-mode interval needs no material frame observations. */
const NO_SITES: readonly IAutoMovieRigidTransform[] = [];

/** The site slot and its world frames at the solved keys. */
interface IMaterial {
  /** The index of the material frame in one interval evaluation. */
  index: number;

  /** The material's frame at the departing and arriving keys. */
  endpoints: readonly [IAutoMovieRigidTransform, IAutoMovieRigidTransform];
}

/** Read a prepared contact point from the current interval frames and share. */
type IPoint = (
  share: number,
  sites: readonly IAutoMovieRigidTransform[],
) => IAutoMovieVector3;

/** Read a prepared held-limb goal from the same interval frames and share. */
type IGoal = (
  share: number,
  sites: readonly IAutoMovieRigidTransform[],
) => IAutoMovieHumanLimbGoal;

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
 * share at knots AutoKnots places, no finer than the frame grid, and read
 * between them (`prepareSupportLiftCourse`). A held knee or trunk contact has
 * no two-bone chain ending at it and stays held only through the root pin and
 * the floor bound.
 *
 * @param body The unchanged body.
 * @param a The fixed key before the interval.
 * @param b The fixed key after it.
 * @param place The entry-time contact lookup, which may observe an unsettled
 *   schedule.
 * @param socket The sole socket each floor foot holds through its window
 *   (`supportHeldSocket`); the lower of its heel and ball at the key before
 *   when absent.
 * @param bind The exact reader of a shared contact's named material, when
 *   given.
 * @param floor The unchanged body's prepared floor bound, shared by the plan.
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
  bind?: prepareSupportInterval.Material,
  floor: ReturnType<typeof knockdown.prepareRest> = knockdown.prepareRest(body),
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
  // The finest spacing of the lift course's knots: the frame grid's share
  // of the interval's seconds.
  const span: number = b.seconds - a.seconds;
  const least: number =
    AutoMovieMotionHumanArmCourse.STEP /
    Math.max(span, AutoMovieMotionHumanArmCourse.STEP);
  const posed: IPosed = { body, blend, floor };
  // The target-dependent constants: the pin's achieved points, the held
  // limbs' frames, the held legs' chains, their sinks and end swivels and the
  // lift course, prepared as the interval is planned and again once when the
  // schedule settles the observations they read.
  const prepare: () => IPrepared = (): IPrepared => {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution();
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      prepareHumanPostureProjection(body);
    if (pin === undefined) return {};
    const target: IAutoMovieVector3 | null = place(pin);
    const aimed: IAutoMovieVector3 | null =
      target === null ? null : { ...target };
    const point: ReturnType<typeof supportContact.preparePoints> =
      supportContact.preparePoints(body, [{ contact: pin, at: aimed }]);
    const sites: prepareSupportInterval.Site[] = [];
    const materials: Map<prepareSupportInterval.Site, IMaterial> | undefined =
      bind === undefined ? undefined : new Map();
    const material = (
      contact: IAutoMovieMotionHumanSupport.IContact,
    ): IMaterial | undefined => {
      const at: prepareSupportInterval.Site | undefined = bind?.(contact);
      if (at === undefined || materials === undefined) return undefined;
      const known: IMaterial | undefined = materials.get(at);
      if (known !== undefined) return known;
      const found: IMaterial = {
        index: sites.length,
        endpoints: [at(a.seconds), at(b.seconds)],
      };
      sites.push(at);
      materials.set(at, found);
      return found;
    };
    const fixed: IPrepareSupportIntervalFixed = {
      point: retainedPoint(
        [
          point(a.posture, read, project)[0]!,
          point(b.posture, read, project)[0]!,
        ],
        material(pin),
      ),
      pinFloor: prepareSupportPinFloor(body, pin, aimed),
      originalPoint: point,
    };
    const frames: prepareSupportHeldFrames.IHeldFrames[] =
      prepareSupportHeldFrames(
        body,
        a.posture,
        b.posture,
        limbs,
        place,
        read,
        project,
        socket,
      );
    const pinned: IPinned = {
      fixed,
      goals: frames.map((frame, i): IPinned["goals"][number] => [
        frame.limb,
        heldGoal(frame, material(limbs[i]!.contact)),
      ]),
      sites,
      elevatedFoot: frames.some(
        (frame: prepareSupportHeldFrames.IHeldFrames): boolean =>
          frame.elevated && frame.limb.endsWith("Leg"),
      ),
    };
    // The floor bound reads the blend, but a held leg is shown as its goal
    // fits it: with its foot planted, a lower hip folds the knee toward the
    // floor and can carry the shin through it. Only the held legs' own
    // chains are read, at the bounded root and again after each lift, until
    // their lowest collider is clear (raising the hip with the foot planted
    // raises the knee, so the reading only rises with the root).
    const chains: prepareSupportHeldLegs.IReader | null =
      prepareSupportHeldLegs(body, frames);
    if (chains === null) return { pinned };
    // The keys' own held legs may rest within the fit's tolerance under the
    // floor; the bound is theirs carried between them, so the course meets
    // each key as it is instead of lifting it at its instant.
    const reach: readonly [number, number] = [
      Math.min(0, chains.lowest(a.posture, read, project)),
      Math.min(0, chains.lowest(b.posture, read, project)),
    ];
    // The held legs' fits at the interval's two ends, swept once each; every
    // fit between them continues the fit from their swivels carried by the
    // share (IAutoMovieSwivelNear), a refinement in place of a sweep.
    const swivels: readonly [
      IAutoMovieMotionHumanResolveHumanPosture.INear,
      IAutoMovieMotionHumanResolveHumanPosture.INear,
    ] = [
      chains.seeds(
        placed(posed, pinned, 0, a.seconds, read, project),
        read,
        project,
      ),
      chains.seeds(
        placed(posed, pinned, 1, b.seconds, read, project),
        read,
        project,
      ),
    ];
    // The exact lift at a share: the held legs fitted at the bounded root,
    // continuing the ends' swivels carried by the share, and the root raised
    // by what they still sink, at most LIFTS times.
    const exact: prepareSupportLiftCourse.Exact = (share: number): number => {
      // Material travels on the action clock, not on the eased pose share.
      const s: number = sites.length === 0 ? share : AutoMovieEngineMotionSampling.minimumJerkShare(share);
      const start: IAutoMovieMotionHumanPosture = placed(
        posed,
        pinned,
        s,
        a.seconds + share * span,
        read,
        project,
      );
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
    return { pinned, lifts: prepareSupportLiftCourse(least, exact) };
  };
  const write: IInterval["write"] = (
    w: number,
    seconds: number,
    resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
    projection?: ReturnType<typeof prepareHumanPostureProjection>,
  ): IAutoMovieMotionHumanPosture => {
    const read: ReturnType<typeof prepareHumanPoseResolution> =
      prepareHumanPoseResolution(resolution);
    const project: ReturnType<typeof prepareHumanPostureProjection> =
      projection ?? prepareHumanPostureProjection(body);
    if (prepared.pinned === undefined) {
      const shaped: IAutoMovieMotionHumanPosture = blend(w);
      return {
        ...shaped,
        root: {
          ...shaped.root,
          y: Math.max(shaped.root.y, floor(shaped, read, project)),
        },
      };
    }
    const bounded: IAutoMovieMotionHumanPosture = placed(
      posed,
      prepared.pinned,
      w,
      seconds,
      read,
      project,
    );
    return prepared.lifts === undefined
      ? bounded
      : {
          ...bounded,
          root: {
            ...bounded.root,
            y:
              bounded.root.y +
              prepared.lifts.read(
                prepared.pinned.sites.length === 0 || span <= 0
                  ? w
                  : (seconds - a.seconds) / span,
              ),
          },
        };
  };
  // A stationary key keeps the same planted goals through compositing: its
  // one posture is written once with each preparation.
  const still: () => IAutoMovieMotionHumanPosture | undefined = ():
    | IAutoMovieMotionHumanPosture
    | undefined =>
    a.posture === b.posture && (prepared.pinned?.sites.length ?? 0) === 0
      ? write(0, a.seconds)
      : undefined;
  let prepared: IPrepared = prepare();
  let stationary: IAutoMovieMotionHumanPosture | undefined = still();
  return {
    write: (
      w: number,
      seconds: number,
      resolution?: Parameters<typeof prepareHumanPoseResolution>[0],
      projection?: ReturnType<typeof prepareHumanPostureProjection>,
    ): IAutoMovieMotionHumanPosture =>
      stationary ?? write(w, seconds, resolution, projection),
    prepare: (): void => {
      prepared = prepare();
      stationary = still();
    },
  };
}

/**
 * The bounded posture at a share: the blend, the pin carried from where the key
 * before achieved it to where the key after does (so the course meets each
 * key's own posture at its ends), each held hand or foot where the keys hold
 * it, fitted by the limb's own chain, and the floor bound.
 *
 * @param posed The interval's body, blend, pin and floor bound.
 * @param pinned The prepared pin points and held frames.
 * @param s The interval's eased pose share.
 * @param seconds The local action second for the retained material.
 * @param read The FK reader.
 * @param project The ROM projection.
 * @returns The bounded posture.
 */
function placed(
  posed: IPosed,
  pinned: IPinned,
  s: number,
  seconds: number,
  read: ReturnType<typeof prepareHumanPoseResolution>,
  project: ReturnType<typeof prepareHumanPostureProjection>,
): IAutoMovieMotionHumanPosture {
  const blended: IAutoMovieMotionHumanPosture = posed.blend(s);
  const fused:
    | ReturnType<ReturnType<typeof prepareSupportPinFloor>>
    | undefined =
    project === posed.body.projection
      ? pinned.fixed.pinFloor(blended, read, project)
      : undefined;
  const now: IAutoMovieVector3 =
    fused === undefined
      ? pinned.fixed.originalPoint(blended, read, project)[0]!
      : fused.point;
  const sites: readonly IAutoMovieRigidTransform[] =
    pinned.sites.length === 0
      ? NO_SITES
      : pinned.sites.map((site) => site(seconds));
  const at: IAutoMovieVector3 = pinned.fixed.point(s, sites);
  const goals: IAutoMovieMotionHumanPosture["limbs"] = { ...blended.limbs };
  for (const [limb, goal] of pinned.goals) goals[limb] = goal(s, sites);
  const moved: IAutoMovieMotionHumanPosture = {
    ...blended,
    root: {
      x: blended.root.x + at.x - now.x,
      y: blended.root.y + at.y - now.y,
      z: blended.root.z + at.z - now.z,
    },
    limbs: goals,
  };
  // The hand pin can carry the hip above a raised foot's reachable
  // height between keys. Retain the target and limit the hip first.
  const reachable: IAutoMovieMotionHumanPosture = pinned.elevatedFoot
    ? lowerHumanPosture(posed.body, moved, undefined, read)
    : moved;
  const low: number =
    reachable === moved
      ? (fused?.floor ?? posed.floor(moved, read, project))
      : posed.floor(reachable, read, project);
  return {
    ...reachable,
    root: { ...reachable.root, y: Math.max(reachable.root.y, low) },
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

/** Carry a point pair in its named material when one was bound. */
function retainedPoint(
  points: readonly [IAutoMovieVector3, IAutoMovieVector3],
  material: IMaterial | undefined,
): IPoint {
  if (material === undefined) return (share) => Vector3.lerp(...points, share);
  const read: ReturnType<typeof prepareSupportInterval.materialPoint> =
    prepareSupportInterval.materialPoint(material.endpoints, points);
  return (share, sites) => read(sites[material.index]!, share);
}

/** Rotate a held joint about its retained contact and carry its bend pole. */
function heldGoal(
  frame: prepareSupportHeldFrames.IHeldFrames,
  material: IMaterial | undefined,
): IGoal {
  const point: IPoint = retainedPoint(frame.pivot?.at ?? frame.point, material);
  const bend: IPoint = retainedPoint(frame.bend, material);
  const start: IAutoMovieQuaternion =
    material === undefined
      ? frame.rotation[0]
      : Quaternion.multiply(
          Quaternion.inverse(material.endpoints[0].rotation),
          frame.rotation[0],
        );
  const end: IAutoMovieQuaternion =
    material === undefined
      ? frame.rotation[1]
      : Quaternion.multiply(
          Quaternion.inverse(material.endpoints[1].rotation),
          frame.rotation[1],
        );
  return (share, sites) => {
    const local: IAutoMovieQuaternion = Quaternion.slerp(start, end, share);
    const rotation: IAutoMovieQuaternion =
      material === undefined
        ? local
        : Quaternion.multiply(sites[material.index]!.rotation, local);
    const at: IAutoMovieVector3 = point(share, sites);
    return {
      point:
        frame.pivot === undefined
          ? at
          : Vector3.subtract(
              at,
              Quaternion.rotateVector(rotation, frame.pivot.local),
            ),
      rotation,
      bend: bend(share, sites),
      reference: {
        upper: mix(frame.reference[0].upper, frame.reference[1].upper, share),
        lower: mix(frame.reference[0].lower, frame.reference[1].lower, share),
      },
      planted: true,
    };
  };
}

/** The material used by the support interval and its exact local placement. */
export namespace prepareSupportInterval {
  /** The full named frame at an action second. */
  export type Site = (seconds: number) => IAutoMovieRigidTransform;

  /** Bind an explicit retained contact to its material frame. */
  export type Material = (
    contact: IAutoMovieMotionHumanSupport.IContact,
  ) => Site | undefined;

  /**
   * Carry two achieved endpoint points in their common material frame. Their
   * residual at each solved key stays the same, while the material carries the
   * interval point through its actual intermediate translations and turns.
   *
   * @param endpoints The material's world frames at the two solved keys.
   * @param points The achieved world points at those same keys.
   * @returns The carried point at a full material frame and eased pose share.
   */
  export function materialPoint(
    endpoints: readonly [IAutoMovieRigidTransform, IAutoMovieRigidTransform],
    points: readonly [IAutoMovieVector3, IAutoMovieVector3],
  ): (frame: IAutoMovieRigidTransform, share: number) => IAutoMovieVector3 {
    const local = (
      frame: IAutoMovieRigidTransform,
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        Quaternion.inverse(frame.rotation),
        Vector3.subtract(point, frame.position),
      );
    const start: IAutoMovieVector3 = local(endpoints[0], points[0]);
    const end: IAutoMovieVector3 = local(endpoints[1], points[1]);
    return (frame, share) =>
      Vector3.add(
        frame.position,
        Quaternion.rotateVector(
          frame.rotation,
          Vector3.lerp(start, end, share),
        ),
      );
  }
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
