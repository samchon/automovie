import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieMotionHumanSeated,
  IAutoMovieQuaternion,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { carryHumanPosture } from "../../posture/internal/carryHumanPosture";

/** The context of the seat's carrier and film clock. */
type SitCarriedContext = Pick<
  IAutoMovieMotionHumanActionContext,
  "prop" | "start"
>;

/**
 * Carry a low sit in the frame of its moving seat. A high mount has already
 * placed its feet in their material supports before preparing its limb
 * courses.
 *
 * @param context The sit's start and props.
 * @param seat The seat, read where its carrier stands at the sit's start.
 * @param plan The sit's prepared plan.
 * @param declared Whether the mount already applied its carrier.
 * @returns The plan in its displayed frames.
 */
export function sitCarried(
  context: SitCarriedContext,
  seat: IAutoMovieMotionHumanSeated.ISeat,
  plan: IAutoMovieMotionHumanActionPlan,
  declared: boolean = false,
): IAutoMovieMotionHumanActionPlan {
  if (declared || seat.carrier === undefined) return plan;
  const subject: string = seat.carrier;
  const finite: boolean = plan.contacts.some(
    (contact: IAutoMovieMotionHumanContactWindow): boolean =>
      contact.part === "seat" && contact.material !== undefined,
  );
  const carry: sitCarried.Pose = sitCarried.prepare(
    context,
    seat,
    plan.duration,
    finite ? plan.contacts : undefined,
  );
  return {
    ...plan,
    contacts: plan.contacts.map(
      (
        window: IAutoMovieMotionHumanContactWindow,
      ): IAutoMovieMotionHumanContactWindow =>
        !finite &&
        (window.part === "seat" ||
          window.part === "leftFoot" ||
          window.part === "rightFoot")
          ? { ...window, support: { kind: "prop", subject } }
          : window,
    ),
    posture: (seconds, channels, resolution, projection) =>
      carry(plan.posture(seconds, channels, resolution, projection), seconds),
  };
}

/** A foot's ground windows and its optional part-relative approach and rest. */
interface IFootSupport {
  /** The leg the support holds. */
  limb: AutoMovieHumanLimb;

  /** Windows in which the leg keeps its original world goal on the floor. */
  ground: readonly IAutoMovieMotionHumanContactWindow[];

  /** The moving footrest, when the seat names one that supplies a frame. */
  part?: {
    /** The prop's affordance id. */
    id: string;

    /** The foothold where the mount starts, world metres. */
    position: IAutoMovieVector3;

    /** The inverse rotation of the starting foothold. */
    inverse: IAutoMovieQuaternion;

    /** Whether the free approach starts in a world floor plant. */
    fromFloor: boolean;

    /** The second the foot leaves its starting support. */
    release: number;

    /** The second the foot lands on the foothold. */
    bearing: number;
  };
}

/** Place the seat and the mount's material supports on a common clock. */
export namespace sitCarried {
  /** Place one authored posture at a local second. */
  export type Pose = (
    posture: IAutoMovieMotionHumanPosture,
    seconds: number,
  ) => IAutoMovieMotionHumanPosture;

  /**
   * Prepare the frame changes from the seat's initial placement. A floor goal
   * stays in the world. A named footrest carries its foot after landing, with
   * the minimum-jerk approach of Flash and Hogan (1985) taking it from its
   * starting frame to the part's own frame over the free interval.
   *
   * @param context The sit's start and props.
   * @param seat The seat, read where its carrier stands at the sit's start.
   * @param duration The plan's length, seconds.
   * @param contacts The mount's explicit ground and carrier contact windows.
   * @returns The frame change shared by preparation and the displayed posture.
   */
  export function prepare(
    context: SitCarriedContext,
    seat: IAutoMovieMotionHumanSeated.ISeat,
    duration: number,
    contacts?: readonly IAutoMovieMotionHumanContactWindow[],
  ): Pose {
    if (seat.carrier === undefined) return (posture) => posture;
    const read: IAutoMovieMotionHumanPropReader = context.prop(seat.carrier);
    const origin: IAutoMovieRigidTransform = read.frame(context.start);
    const turned: IAutoMovieQuaternion = Quaternion.inverse(origin.rotation);
    const named = (
      id: string,
      film: number,
      fallback: IAutoMovieQuaternion,
    ): IAutoMovieRigidTransform | undefined => {
      if (read.site !== undefined) return read.site(id, film);
      const point: IAutoMovieMotionHumanProp.IPlacedPoint | undefined =
        read.prop.point?.(id, film);
      return point === undefined
        ? undefined
        : { position: point.point, rotation: point.rotation ?? fallback };
    };
    const seatId: string | undefined = seat.point;
    const began: IAutoMovieVector3 | undefined =
      seatId === undefined
        ? undefined
        : named(seatId, context.start, origin.rotation)?.position;
    const feet: readonly IFootSupport[] =
      contacts === undefined
        ? []
        : (["left", "right"] as const).map((side): IFootSupport => {
            const windows = contacts.filter(
              (window) =>
                window.kind === "plant" && window.part === `${side}Foot`,
            );
            const ground = windows.filter(
              (window) => window.support.kind === "ground",
            );
            const window = windows.find(
              (item) =>
                item.support.kind === "prop" &&
                item.support.point !== undefined,
            );
            const id: string | undefined =
              window?.support.kind === "prop"
                ? window.support.point
                : undefined;
            const frame: IAutoMovieRigidTransform | undefined =
              id === undefined
                ? undefined
                : named(id, context.start, origin.rotation);
            const floor: IAutoMovieMotionHumanContactWindow | undefined =
              ground.find((item) => item.from === 0);
            return {
              limb: `${side}Leg`,
              ground,
              ...(window === undefined ||
              id === undefined ||
              frame === undefined
                ? {}
                : {
                    part: {
                      id,
                      position: frame.position,
                      inverse: Quaternion.inverse(frame.rotation),
                      fromFloor: floor !== undefined,
                      release: (floor?.to ?? 0) * duration,
                      bearing: window.from * duration,
                    },
                  }),
            };
          });
    return (source, seconds) => {
      const t: number = Math.min(duration, Math.max(0, seconds));
      const film: number = context.start + t;
      const now: IAutoMovieRigidTransform = read.frame(film);
      const posture: IAutoMovieMotionHumanPosture = carryHumanPosture(
        source,
        origin,
        now,
      );
      for (const { limb, ground, part } of feet) {
        const raw: IAutoMovieHumanLimbGoal | undefined = source.limbs[limb];
        const rigid: IAutoMovieHumanLimbGoal | undefined = posture.limbs[limb];
        if (raw === undefined || rigid === undefined) continue;
        if (
          ground.some(
            (window) =>
              t >= window.from * duration && t <= window.to * duration,
          )
        ) {
          posture.limbs[limb] = raw;
          continue;
        }
        if (part === undefined || t < part.release) continue;
        const target: IAutoMovieRigidTransform | undefined = named(
          part.id,
          film,
          now.rotation,
        );
        if (target === undefined) continue;
        const bearing: boolean = t >= part.bearing;
        const fromWorld: boolean = part.fromFloor && !bearing;
        const approach: IAutoMovieHumanLimbGoal = fromWorld ? raw : rigid;
        const share: number = bearing
          ? 1
          : minimumJerk.share(
              (t - part.release) / (part.bearing - part.release),
            );
        const delta: IAutoMovieQuaternion = Quaternion.multiply(
          target.rotation,
          part.inverse,
        );
        const place = (value: IAutoMovieVector3): IAutoMovieVector3 =>
          Vector3.add(
            target.position,
            Quaternion.rotateVector(
              delta,
              Vector3.subtract(value, part.position),
            ),
          );
        const point: IAutoMovieVector3 = place(raw.point);
        const rotation: IAutoMovieQuaternion | undefined =
          raw.rotation === undefined
            ? undefined
            : Quaternion.multiply(delta, raw.rotation);
        posture.limbs[limb] = {
          ...rigid,
          point: bearing ? point : Vector3.lerp(approach.point, point, share),
          bend: bearing
            ? place(raw.bend)
            : fromWorld
              ? Vector3.lerp(raw.bend, rigid.bend, share)
              : rigid.bend,
          ...(rotation === undefined || approach.rotation === undefined
            ? {}
            : {
                rotation: bearing
                  ? rotation
                  : Quaternion.slerp(approach.rotation, rotation, share),
              }),
        };
      }
      const moved: IAutoMovieVector3 | undefined =
        began === undefined || seatId === undefined
          ? undefined
          : named(seatId, film, now.rotation)?.position;
      if (began === undefined || moved === undefined) return posture;
      const carried: IAutoMovieVector3 = Vector3.add(
        now.position,
        Quaternion.rotateVector(
          Quaternion.multiply(now.rotation, turned),
          Vector3.subtract(began, origin.position),
        ),
      );
      return {
        ...posture,
        root: Vector3.add(posture.root, Vector3.subtract(moved, carried)),
      };
    };
  }
}
