import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanPutDown,
  IAutoMoviePose,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { HumanPropFrame } from "../perform/HumanPropFrame";
import { poseBones } from "../posture/poseBones";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { StrikingRoll } from "../striking/StrikingRoll";

/** The supplier of the body's pose at the entry. */
type OfPose = () => IAutoMoviePose;

/** The alternatives of `OfContext`'s site. */
type OfContext = "params" | "body" | "prop" | "start";

/** The alternatives of `SeatedContext`'s site. */
type SeatedContext = "params" | "prop" | "start";

/** The record of `ITrackMountsItem2`'s site. */
type ITrackMountsItem2 = {
  parent: IAutoMovieMotionHumanPropReader;
  point: string;
};

/** The record of `ITrackMountsItem`'s site. */
type ITrackMountsItem = {
  parent: IAutoMovieMotionHumanPropReader;
  point: string;
};

/** The raw rigid socket frame at the prop's displayed articulation state. */
function socketFrame(
  reader: IAutoMovieMotionHumanPropReader,
  id: string,
  seconds: number,
): IAutoMovieRigidTransform {
  const prop: string = reader.prop.subject;
  const contacts: readonly IAutoMovieAffordance[] =
    reader.prop.articulate === undefined
      ? (reader.prop.affordances ?? [])
      : reader.prop.articulate(reader.state?.(seconds) ?? {}).affordances;
  const found: IAutoMovieAffordance | undefined = contacts.find(
    (a: IAutoMovieAffordance): boolean => a.id === id,
  );
  if (found === undefined)
    throw new HumanRefusal({
      kind: "affordance",
      axis: "onto",
      value: `${prop}.${id}`,
      feasible: {
        kind: "alternatives",
        values: contacts.map((a: IAutoMovieAffordance): string => a.id),
      },
      reason: `${prop} has no socket named ${id}`,
      fix: "name a socket the prop declares",
    });
  const frame: IAutoMovieRigidTransform = {
    position: found.frame.translation,
    rotation: found.frame.rotation,
  };
  requireRigid(frame, `${prop}.${id}`, seconds);
  return frame;
}

/**
 * Read the socket in world metres at a film second. A receiver that publishes
 * its contacts' displayed frames (a horse's head, a carrier on a moving body)
 * is read there, so the socket follows what moves within the prop; otherwise
 * the prop's rigid frame carries its declared socket.
 */
function worldSocket(
  reader: IAutoMovieMotionHumanPropReader,
  id: string,
  seconds: number,
): IAutoMovieRigidTransform {
  const placed: IAutoMovieMotionHumanProp.IPlacedPoint | undefined =
    reader.prop.point?.(id, seconds);
  if (placed?.rotation !== undefined) {
    const moving: IAutoMovieRigidTransform = {
      position: placed.point,
      rotation: placed.rotation,
    };
    requireRigid(moving, `${reader.prop.subject}.${id}`, seconds);
    return moving;
  }
  const world: IAutoMovieRigidTransform = reader.frame(seconds);
  requireRigid(world, reader.prop.subject, seconds);
  return HumanPropFrame.compose(world, socketFrame(reader, id, seconds));
}

/** Refuse malformed frames before rigid composition can normalize them. */
function requireRigid(
  frame: IAutoMovieRigidTransform,
  name: string,
  seconds: number,
): void {
  if (!rigid(frame))
    throw new HumanRefusal({
      kind: "parameter",
      axis: "onto",
      value: name,
      reason: `${name} has a non-rigid frame at ${seconds} s`,
      fix: "give the prop or socket a finite position and a unit rotation",
    });
}

/** Whether the rotation is already unit length. */
function rigid(frame: IAutoMovieRigidTransform): boolean {
  const q: IAutoMovieRigidTransform["rotation"] = frame.rotation;
  return Math.abs(Math.hypot(q.x, q.y, q.z, q.w) - 1) <= 1e-6;
}

/**
 * The prop's fixed placing frame, or undefined for a free world placement.
 *
 * @param context The authored destination, body, props and entry second.
 * @param pose The synchronous supplier of the body at that entry, including a
 *   prospective grasp's stance, evaluated only for a bone-mounted destination.
 * @returns The placing frame, world metres and a unit quaternion.
 * @throws {HumanRefusal} On onto when either named socket is absent.
 */
export function putDownTarget(
  context: Pick<
    IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPutDown.IParams>,
    OfContext
  >,
  pose: OfPose,
): IAutoMovieRigidTransform | undefined {
  const onto: IAutoMovieMotionHumanPutDown.IParams["onto"] =
    context.params.onto;
  if (onto === undefined) {
    const on: IAutoMovieMotionHumanPutDown.IParams["on"] = context.params.on;
    if (on === undefined) return undefined;
    return HumanPropFrame.compose(
      HumanPropFrame.bone(
        poseBones(
          context.body,
          pose(),
          undefined,
          new Set<AutoMovieHumanoidBone>([on.bone]),
        ).get(on.bone)!,
      ),
      on.offset,
    );
  }

  const destination: IAutoMovieRigidTransform = worldSocket(
    context.prop(onto.prop),
    onto.point,
    context.start,
  );
  if (onto.via === undefined) return destination;

  const source: IAutoMovieRigidTransform = socketFrame(
    context.prop(context.params.prop),
    onto.via,
    context.start,
  );
  const rotation: IAutoMovieRigidTransform["rotation"] = Quaternion.normalize(
    Quaternion.multiply(
      destination.rotation,
      Quaternion.inverse(source.rotation),
    ),
  );
  return {
    position: Vector3.subtract(
      destination.position,
      Quaternion.rotateVector(rotation, source.position),
    ),
    rotation,
  };
}

/**
 * The rigid frame a prop is set on: a bone of the performer or another prop's
 * socket. The placement and the grasp chosen for it read this same frame, with
 * both sockets posed by their articulations at the entry.
 */
export namespace putDownTarget {
  /**
   * Check the source socket's displayed fit at the moving transfer.
   *
   * @param context The receiving socket and film clock.
   * @param posture The placement plan's contact posture.
   * @param side The hand carrying the source.
   * @param offset The source prop frame kept in the wrist bone.
   * @param seconds Seconds from placement entry to transfer.
   * @throws {HumanRefusal} If the fitted source exceeds the position or
   *   attitude bound.
   */
  export function checkContact(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPutDown.IParams>,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    offset: IAutoMovieRigidTransform,
    seconds: number,
  ): void {
    const { body } = context;
    const onto: NonNullable<typeof context.params.onto> = context.params.onto!;
    const time: number = context.start + seconds;
    requireRigid(offset, context.params.prop, context.start);
    const wrist: IAutoMovieRigidTransform = HumanPropFrame.bone(
      poseBones(body, resolveHumanPosture(body, posture)).get(`${side}Hand`)!,
    );
    const prop: IAutoMovieRigidTransform = HumanPropFrame.compose(
      wrist,
      offset,
    );
    const source: IAutoMovieRigidTransform =
      onto.via === undefined
        ? prop
        : HumanPropFrame.compose(
            prop,
            socketFrame(context.prop(context.params.prop), onto.via, time),
          );
    const target: IAutoMovieRigidTransform = worldSocket(
      context.prop(onto.prop),
      onto.point,
      time,
    );
    const missed: number = Vector3.length(
      Vector3.subtract(source.position, target.position),
    );
    if (!(missed <= StrikingRoll.MISS))
      throw new HumanRefusal({
        kind: "reach",
        axis: "onto",
        value: missed,
        feasible: {
          kind: "range",
          minimum: 0,
          maximum: StrikingRoll.MISS,
          unit: "m",
        },
        reason:
          "the fitted hand cannot align the held socket at the moving transfer",
        fix: "take a grasp that aligns both sockets, or bring the carrier closer",
      });

    // Use the 15-degree alignment bound of the static aperture placement specification.
    const angle: number =
      (Quaternion.angle(source.rotation, target.rotation) * 180) / Math.PI;
    if (!(angle <= 15))
      throw new HumanRefusal({
        kind: "reach",
        axis: "onto",
        value: angle,
        feasible: { kind: "range", minimum: 0, maximum: 15, unit: "deg" },
        reason:
          "the fitted source and receiving socket attitudes differ at the moving transfer",
        fix: "take a grasp that aligns the socket attitudes, or turn the carrier",
      });
  }

  /**
   * Admit horizontal translation of a directly placed rigid receiver. The
   * displayed socket is checked at intervals of at most 1/120 s, including when
   * it rides an authored track through initial prop mounts. Fixed sockets keep
   * their original placement path.
   *
   * @param context The placement and its film-clock prop readers.
   * @param duration Full placement duration, in seconds.
   * @param aperture The optional registered insertion path.
   * @returns The displacement from entry as a function of local seconds, or
   *   undefined for fixed destinations.
   * @throws {HumanRefusal} When motion leaves the admitted path or the
   *   displayed socket lacks a rigid authored carrier.
   */
  export function translation(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPutDown.IParams>,
    duration: number,
    aperture: IAutoMovieVector3 | undefined,
  ): ((seconds: number) => IAutoMovieVector3) | undefined {
    const onto: IAutoMovieMotionHumanPutDown.IParams["onto"] =
      context.params.onto;
    if (onto === undefined) return undefined;
    const receiver: IAutoMovieMotionHumanPropReader = context.prop(onto.prop);
    const carrier: ITrack | undefined = track(context, onto.prop);
    const at = (seconds: number): IAutoMovieRigidTransform =>
      worldSocket(receiver, onto.point, context.start + seconds);
    const entry: IAutoMovieRigidTransform = at(0);
    const end: IAutoMovieRigidTransform = at(duration);
    const velocity: IAutoMovieVector3 = Vector3.scale(
      Vector3.subtract(end.position, entry.position),
      1 / duration,
    );
    const samples: number = Math.ceil(duration * 120);
    const samePosition = (
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
    ): boolean => Vector3.length(Vector3.subtract(a, b)) <= 1e-6;
    const carrierEntry: IAutoMovieRigidTransform | undefined =
      carrier?.reader.frame(context.start);
    let moving: boolean = false;
    let followsCarrier: boolean = true;
    for (let index: number = 0; index <= samples; ++index) {
      const time: number = (index / samples) * duration;
      const frame: IAutoMovieRigidTransform = at(time);
      const expected: IAutoMovieVector3 = Vector3.add(
        entry.position,
        Vector3.scale(velocity, time),
      );
      moving ||= !samePosition(frame.position, entry.position);
      if (
        !(
          Math.abs(frame.position.y - entry.position.y) <= 1e-6 &&
          samePosition(frame.position, expected) &&
          Quaternion.angle(entry.rotation, frame.rotation) <= 1e-6
        )
      )
        throw new HumanRefusal({
          kind: "parameter",
          axis: "onto",
          value: onto.prop,
          reason: `the receiving socket leaves its horizontal constant-velocity track at ${context.start + time} s`,
          fix: "give the receiver a fixed rotation and a constant horizontal velocity throughout the placement",
        });

      // Compare the displayed socket with its declared carrier's translation.
      // A hand or articulation taking over the socket cannot borrow that track.
      if (carrier !== undefined && carrierEntry !== undefined) {
        const seconds: number = context.start + time;
        const carried: IAutoMovieRigidTransform = carrier.reader.frame(seconds);
        requireRigid(carried, carrier.reader.prop.subject, seconds);
        for (const { parent, point } of carrier.mounts)
          socketFrame(parent, point, seconds);
        followsCarrier &&=
          samePosition(
            Vector3.subtract(carried.position, carrierEntry.position),
            Vector3.subtract(frame.position, entry.position),
          ) &&
          Quaternion.angle(carrierEntry.rotation, carried.rotation) <= 1e-6;
      }
    }
    if (!moving) return undefined;
    if (
      aperture !== undefined ||
      carrier === undefined ||
      !followsCarrier ||
      context.entry.holds.left === onto.prop ||
      context.entry.holds.right === onto.prop ||
      receiver.prop.soft !== undefined ||
      (receiver.prop.hasArticulations ?? receiver.prop.articulate !== undefined)
    )
      throw new HumanRefusal({
        kind: "parameter",
        axis: "onto",
        value: onto.prop,
        reason:
          "the moving socket requires direct placement on a rigid receiver carried by an authored track",
        fix: "use a rigid tracked receiver for direct placement, or keep the socket static until withdrawal",
      });
    return (seconds: number): IAutoMovieVector3 =>
      Vector3.scale(velocity, seconds);
  }

  /**
   * Find an authored motion track behind the receiver's declared mount chain.
   * The placement still verifies the displayed socket against this track.
   *
   * @param context Prop lookup on the performance.
   * @param subject The receiving prop.
   * @returns The authored carrier and declared sockets to it, if any.
   */
  export function track(
    context: Pick<IAutoMovieMotionHumanActionContext, "prop">,
    subject: string,
  ): ITrack | undefined {
    const visited: Set<string> = new Set();
    const mounts: ITrackMountsItem[] = [];
    let reader: IAutoMovieMotionHumanPropReader = context.prop(subject);
    while (!visited.has(reader.prop.subject)) {
      visited.add(reader.prop.subject);
      if (reader.prop.motion !== undefined) return { reader, mounts };
      const mount: typeof reader.prop.mounted = reader.prop.mounted;
      if (mount === undefined) break;
      reader = context.prop(mount.prop);
      mounts.push({ parent: reader, point: mount.point });
    }
    return undefined;
  }

  /** The authored track and raw ancestor sockets used to reach it. */
  interface ITrack {
    /** The prop that owns the world track. */
    reader: IAutoMovieMotionHumanPropReader;
    /** Links in order from the receiver toward the track. */
    mounts: readonly ITrackMountsItem2[];
  }

  /**
   * The prop's frame in the frame of the socket it is set on (`onto`): the
   * inverse of its own `via` socket, so that socket lands on the receiving one,
   * as `of` places it; the identity without a `via`.
   *
   * @param context The authored destination, props and entry second.
   * @returns The prop's frame in the receiving socket's frame, metres and a
   *   unit quaternion.
   * @throws {HumanRefusal} On onto when the prop's `via` socket is absent.
   */
  export function seated(
    context: Pick<
      IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanPutDown.IParams>,
      SeatedContext
    >,
  ): IAutoMovieRigidTransform {
    const via: string | undefined = context.params.onto?.via;
    if (via === undefined)
      return {
        position: { x: 0, y: 0, z: 0 },
        rotation: Quaternion.identity(),
      };
    const source: IAutoMovieRigidTransform = socketFrame(
      context.prop(context.params.prop),
      via,
      context.start,
    );
    const inverse: IAutoMovieRigidTransform["rotation"] = Quaternion.inverse(
      source.rotation,
    );
    return {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.scale(source.position, -1),
      ),
      rotation: inverse,
    };
  }
}
