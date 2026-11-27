import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanLimb,
  AutoMovieHumanoidBone,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanPerformerReader,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanColliders } from "../../posture/internal/HumanColliders";

/** The alternatives of `ContactSlopeK`'s site. */
type ContactSlopeK = 0 | 1 | 2;

/** The alternatives of `ContactAxisK`'s site. */
type ContactAxisK = 0 | 1 | 2;

/**
 * A stopped weapon riding the body it met: after a strike's limb has stopped on
 * another person, that person keeps moving (a cover still closing, a trunk
 * still turning), and a limb held at the world point of the contact would be
 * run through by the surface it rests on. The ride gives the limb's goal way
 * before that surface.
 *
 * The contact is one-sided: the met segment's rigid motion since the stop, read
 * at the weapon's point nearest the met body, is applied to the limb's goal
 * only along the contact normal (out of the met body toward the weapon) and
 * only outward, so the limb is pushed off by a surface advancing into it from
 * any side (a covering glove closing across the line as much as one coming down
 * it) and is never dragged after one that withdraws, the non-penetration
 * constraint of a frictionless contact. The push is what the surface has
 * advanced along the normal less what the law's own goal has moved away from
 * the contact along it since the stop: whole while the weapon rests on the
 * surface for the dwell ({@link StrikingStroke.DWELL}), gone once the law's
 * withdrawal outruns the surface, and held where the law's path would carry the
 * limb back into the surface (a guard that lies beyond a contact made early,
 * near the striker's own body).
 *
 * The contact at the stop, the met segment's frame there and the law's goal
 * there are solved when the ride is made, which the striking plan does when it
 * is prepared. A pose then reads the met segment at its own second less a lag
 * of two steps: two people's poses can each depend on the other's (each rides
 * the other's arm), and the lag makes every such read reach a strictly earlier
 * second, until one falls before its stop and reads nothing back.
 */
export namespace StrikingRide {
  /**
   * Half the lag behind the shown second, seconds: half the 1/120 s step of the
   * performance's contact resolution, so the lag is one resolution step.
   */
  export const STEP: number = 1 / 240;

  /** What a ride is built from. */
  export interface IProps {
    /**
     * The person the weapon met.
     *
     * @returns Their body and bone query.
     */
    other(): IAutoMovieMotionHumanPerformerReader;

    /** Film second of the stop. */
    stop: number;

    /**
     * The stopped limb's own goal point as its law shows it, before any ride.
     *
     * @param seconds Film seconds; read at the stop only.
     * @returns World metres.
     */
    goal(seconds: number): IAutoMovieVector3;

    /**
     * The met weapon's axis from the performer's own shown bones.
     *
     * @param seconds Film seconds, at or before the stop.
     * @returns The axis ends, world metres.
     */
    axis(seconds: number): readonly [IAutoMovieVector3, IAutoMovieVector3];
  }

  /** A built ride. */
  export interface IRide {
    /**
     * A posture with one limb's goal carried by the met segment.
     *
     * @param posture The law's posture at the second.
     * @param limb The stopped limb.
     * @param seconds Film seconds.
     * @returns The posture, unchanged until two steps past the stop.
     */
    carry(
      posture: IAutoMovieMotionHumanPosture,
      limb: AutoMovieHumanLimb,
      seconds: number,
    ): IAutoMovieMotionHumanPosture;
  }

  /** Where the weapon touched the met body at the stop. */
  export interface IContact {
    /** The weapon's axis point nearest the met body, world metres. */
    point: IAutoMovieVector3;

    /** The unit normal out of the met body toward the weapon. */
    normal: IAutoMovieVector3;

    /** The met body's bone the contact lies on. */
    bone: AutoMovieHumanoidBone;
  }

  /** The met segment's world frame at a second. */
  export interface IFrame {
    /** Its joint, world metres. */
    position: IAutoMovieVector3;

    /** Its world rotation. */
    rotation: IAutoMovieQuaternion;
  }

  /**
   * The step of the central differences that read the met surface's normal,
   * metres: 1 mm, well under every collider radius, so both samples lie on the
   * same side of the surface the weapon touches.
   */
  const NORMAL_STEP: number = 0.001;

  /**
   * The intervals the weapon's axis is sampled in for its point nearest the met
   * body.
   */
  const AXIS_SAMPLES: number = 8;

  /**
   * Build a ride: the contact at the stop, the met segment's frame there and
   * the law's goal there, each solved once.
   *
   * @param props The stop, the met person and the weapon's axis.
   * @returns The ride.
   */
  export function create(props: IProps): IRide {
    const met: IContact | null = contact(props);
    if (met === null) return { carry: unchanged };
    const requested: ReadonlySet<AutoMovieHumanoidBone> =
      new Set<AutoMovieHumanoidBone>([met.bone]);
    const frame = (seconds: number): IFrame => {
      const resolved: IAutoMovieResolvedBone = props
        .other()
        .bones(seconds, requested)
        .get(met.bone)!;
      return {
        position: resolved.worldPosition,
        rotation: resolved.worldRotation,
      };
    };
    const first: IFrame = frame(props.stop);
    const held: IAutoMovieVector3 = props.goal(props.stop);
    return {
      carry: (
        posture: IAutoMovieMotionHumanPosture,
        limb: AutoMovieHumanLimb,
        seconds: number,
      ): IAutoMovieMotionHumanPosture => {
        const goal: IAutoMovieHumanLimbGoal | undefined = posture.limbs[limb];
        const lagged: number = seconds - 2 * STEP;
        if (
          goal === undefined ||
          goal.on !== undefined ||
          !(lagged > props.stop)
        )
          return posture;
        const pushed: number = push(
          met,
          first,
          frame(lagged),
          Vector3.dot(Vector3.subtract(goal.point, held), met.normal),
        );
        if (pushed === 0) return posture;
        const shift: IAutoMovieVector3 = Vector3.scale(met.normal, pushed);
        return {
          ...posture,
          limbs: {
            ...posture.limbs,
            [limb]: {
              ...goal,
              point: Vector3.add(goal.point, shift),
              bend: Vector3.add(goal.bend, shift),
            },
          },
        };
      },
    };
  }

  /**
   * How far the met surface pushes the limb out along the contact normal: the
   * contact point carried by the met segment's rigid motion from its frame at
   * the stop to its frame now, read along the normal, less how far the law's
   * own goal has withdrawn along it, and never negative.
   *
   * @param met The contact at the stop.
   * @param first The met segment's frame at the stop.
   * @param now Its frame at the read second.
   * @param withdrawn How far the law's goal has moved out along the normal
   *   since the stop, metres.
   * @returns The push, metres, zero or more.
   */
  export function push(
    met: Pick<IContact, "point" | "normal">,
    first: IFrame,
    now: IFrame,
    withdrawn: number,
  ): number {
    const turn: IAutoMovieQuaternion = Quaternion.multiply(
      now.rotation,
      Quaternion.inverse(first.rotation),
    );
    const carried: IAutoMovieVector3 = Vector3.add(
      now.position,
      Quaternion.rotateVector(
        turn,
        Vector3.subtract(met.point, first.position),
      ),
    );
    const advanced: number = Vector3.dot(
      Vector3.subtract(carried, met.point),
      met.normal,
    );
    return Math.max(0, advanced - withdrawn);
  }

  /**
   * The contact at the stop: the point of the weapon's axis nearest the met
   * body, and the unit normal out of that body toward the weapon, the gradient
   * of the body's signed distance as the axis is translated (central
   * differences of NORMAL_STEP). Null when the gradient vanishes, where no side
   * of the surface is defined and nothing is carried.
   */
  function contact(props: IProps): IContact | null {
    const other: IAutoMovieMotionHumanPerformerReader = props.other();
    const bones: Map<AutoMovieHumanoidBone, IAutoMovieResolvedBone> =
      other.bones(props.stop, HumanColliders.bones(other.body));
    const geometry: ReturnType<typeof HumanColliders.reading> =
      HumanColliders.reading(other.body, bones);
    const [a, b] = props.axis(props.stop);
    const gap = (shift: IAutoMovieVector3): number =>
      geometry.segment(Vector3.add(a, shift), Vector3.add(b, shift)).distance;
    const axis = (k: ContactAxisK): IAutoMovieVector3 => ({
      x: k === 0 ? NORMAL_STEP : 0,
      y: k === 1 ? NORMAL_STEP : 0,
      z: k === 2 ? NORMAL_STEP : 0,
    });
    const slope = (k: ContactSlopeK): number =>
      gap(axis(k)) - gap(Vector3.scale(axis(k), -1));
    const gradient: IAutoMovieVector3 = {
      x: slope(0),
      y: slope(1),
      z: slope(2),
    };
    if (!(Vector3.length(gradient) > 1e-9)) return null;
    let point: IAutoMovieVector3 = a;
    let least: number = Number.POSITIVE_INFINITY;
    for (let i: number = 0; i <= AXIS_SAMPLES; i++) {
      const at: IAutoMovieVector3 = Vector3.lerp(a, b, i / AXIS_SAMPLES);
      const d: number = geometry.segment(at, at).distance;
      if (d < least) {
        least = d;
        point = at;
      }
    }
    return {
      point,
      normal: Vector3.normalize(gradient),
      bone: geometry.segment(a, b).bone,
    };
  }

  /** A posture no ride carries. */
  function unchanged(
    posture: IAutoMovieMotionHumanPosture,
  ): IAutoMovieMotionHumanPosture {
    return posture;
  }
}
