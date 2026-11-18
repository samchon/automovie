import {
  Quaternion,
  Vector3,
  minimumJerk,
  rotationBetween,
} from "@automovie/engine";
import type {
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKickGeometry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { KickCarriage } from "./KickCarriage";
import type { KickChamber } from "./KickChamber";
import { KickForm } from "./KickForm";
import { KickThrust } from "./KickThrust";
import { StrikingStroke } from "./StrikingStroke";

/**
 * The kicking leg's path: from its plant up to the chamber, out to the
 * contact, back to the chamber and down to the replant.
 *
 * The chamber is the fitted contact leg with only the knee folded
 * ({@link KickChamber}), so between the two the hip joint does not move and
 * the ankle travels on the knee's own hinge arc about the fitted knee. The
 * arc, the knee and the foot's rotation are held in the pelvis's frame at the
 * contact and carried by whatever body the leg hangs from, so every goal on
 * the way is a pose the leg can hold inside the hip's range of motion, also
 * while the body turns back under a recoiling leg or a redirect blends two
 * carriages. A world-straight path between the same two ankles is not: it
 * leaves the leg's reach as soon as the hip moves.
 *
 * A push kick goes on a thrust instead ({@link KickThrust}): its chamber
 * lifts the knee to the target's height with the foot folded under it, and
 * the ankle travels straight from there to the fitted contact on the same
 * unit, in the same pelvis frame, while the carriage drives the pelvis along
 * the line behind it (`IAutoMovieMotionHumanKickGeometry.ICarriage.drive`). The hinge's arc from a
 * chamber that only folds the contact leg's knee is a front snap: it swings
 * the foot up from below the target, through an opponent's lead thigh.
 *
 * The knee opens on one minimum-jerk unit that begins before the chamber key
 * is reached, so the ankle rounds the chamber instead of resting on it (Flash
 * and Hogan 1985), and that is aimed past the contact, so the shin arrives
 * with its share of the unit's peak speed ({@link StrikingStroke.impactShare})
 * and would travel on through the target. The knee never opens past the
 * technique's least flexion: when the aim past the contact would, the unit
 * ends nearer the contact and the shin arrives slower. From the contact the
 * knee folds back over the re-chamber's share of the recoil.
 *
 * The lift from the plant and the lowering to the replant run on the leg's
 * own joint arc too. The planted leg is solved from the hip the body has at
 * that instant (the two-segment triangle from the hip to the planted ankle,
 * its knee on the planted knee's side), and the thigh and the shank each
 * turn from their planted direction to their chambered one on a minimum-jerk
 * share, the ankle following by forward kinematics. In the leg's own plane
 * that is the hip's and the knee's flexion each on the share, so the knee
 * leads the lift and the foot trails under it, as a chamber is coached. A
 * world-straight line from the planted ankle to the chambered one carries
 * the foot forward of that arc, through whatever stands in front of the
 * shin: measured on the staged push kick, the foot's capsule met the
 * partner's lead leg at 0.970 s, during the lift.
 */
export namespace KickSwing {
  /** What a kicking leg's path is built from. */
  export interface IProps {
    /** The kicking body. */
    body: IAutoMovieMotionHumanBody;

    /** The kicking side. */
    side: "left" | "right";

    /** The kick's timing. */
    timing: IAutoMovieMotionHumanKickGeometry.ITiming;

    /** The body's posture at the contact, under which the leg was fitted. */
    base: IAutoMovieMotionHumanPosture;

    /** The chambered leg under that posture. */
    key: KickChamber.IKey;

    /**
     * How the leg goes from its chamber to its contact: on the knee's
     * `hinge` under a still thigh (the round kick's snap), or on a `thrust`,
     * the ankle straight from a chamber with the knee lifted to the target's
     * height (the push kick).
     */
    path: "hinge" | "thrust";

    /** The fitted contact leg under that posture; the chamber itself for a hinge's feint. */
    contact: KickChamber.IKey;

    /** The knee's flexion at the chamber and at the contact, and the least it may open to, degrees. */
    flexion: { chamber: number; contact: number; least: number };

    /** The share of the opening's peak speed left at the contact, in (0, 1]. */
    speed: number;

    /** The kicking leg on the floor at the launch: its knee, its ankle and its foot's rotation. */
    plant: KickChamber.IKey;

    /** The replant's displacement from the launch plant, world metres. */
    step: IAutoMovieVector3;
  }

  /**
   * Build a kicking leg's path.
   *
   * @param props The fitted contact, its chamber, the plant and the timing.
   * @returns The leg's goal as a pure function of its clock, the body it hangs from and the launch plant's shift.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the fitted chamber/contact, knee hinge, world plant, timing and optional exact same-base hip of the returned path.
   * @evidence contracts/development/implementation.md#principled-implementation Keeps the pelvis-local knee/shank and hinge rotation and the minimum-jerk opening with its speed/flexion bounds; the lift and the lowering turn the thigh and the shank between the planted leg, solved from the current hip, and the chambered leg on minimum-jerk shares, the ankle by forward kinematics.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed contact-frame geometry is prepared once and the returned time reader carries it by the current body's heading and one shared hip; one segment-turn helper serves the lift and the lowering.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every clock, band, hinge angle and weight remains; the planted ankle is met exactly at either end of the arc even when the hip stands farther from it than the leg is long, the shank then carrying the excess that the share blends out; a supplied hip must belong to the same body/base currently being evaluated.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant path arithmetic plus one hip FK when the caller has not already read it; the planted triangle is solved in closed form only during the lift and the lowering; ankle and knee share that hip and superposed paths may borrow the same exact value.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Contact-local vectors and the hinge are fixed by the actual fitted contact; same-call knee/ankle and superposed candidate paths share only the exact current base's hip, never a pose from another time or context.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned path keeps fixed contact geometry and plant/timing data for its plan lifetime; each evaluation retains no current posture, hip or query history after returning its fresh leg goal.
   */
  export function create(
    props: IProps,
  ): (
    clock: number,
    base: IAutoMovieMotionHumanPosture,
    shift: IAutoMovieVector3,
    hip?: IAutoMovieVector3,
  ) => IAutoMovieMotionHumanKickGeometry.ILeg {
    const { body, side, timing, key, contact, plant } = props;
    const { prep, chamber, impact, duration } = timing;
    const recoil: number = duration - impact;
    const folding: number = KickForm.RECHAMBER_SHARE * recoil;

    // The contact pelvis's frame, in which the knee and the chambered shank
    // are fixed, and the knee's hinge turn from the chamber to the contact:
    // the rotation that carries the chambered foot onto the contact foot.
    const hip: IAutoMovieVector3 = KickCarriage.hip(body, props.base, side);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      resolveHumanPosture.heading(props.base),
    );
    const local = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(inverse, v);
    const knee: IAutoMovieVector3 = local(Vector3.subtract(key.knee, hip));
    const shank: IAutoMovieVector3 = local(
      Vector3.subtract(key.ankle, key.knee),
    );
    const folded: IAutoMovieQuaternion = Quaternion.multiply(
      inverse,
      key.rotation,
    );
    const hinge: IHinge = turn(
      Quaternion.multiply(contact.rotation, Quaternion.inverse(key.rotation)),
      local,
    );
    const lengths: readonly [number, number] = [
      Vector3.length(knee),
      Vector3.length(shank),
    ];

    // The opening's unit: from before the chamber key to past the contact,
    // reaching the contact at the share of its travel that leaves the asked
    // speed, bounded so its end never opens the knee past the least flexion.
    const opening: number = props.flexion.chamber - props.flexion.contact;
    const most: number = props.flexion.chamber - props.flexion.least;
    const share: number =
      opening <= 0 || most <= 0
        ? 1
        : Math.max(
            minimumJerk.share(StrikingStroke.impactShare(props.speed)),
            Math.min(1, opening / most),
          );
    const begin: number = chamber - KickForm.VIA_OVERLAP * (chamber - prep);
    const span: number = Math.max(1e-3, impact - begin) / unit(share);
    const extended = (clock: number): number =>
      (minimumJerk.share((clock - begin) / span) / share) *
      (1 - minimumJerk.share((clock - impact) / Math.max(1e-3, folding)));
    const angle = (clock: number): number => hinge.degrees * extended(clock);

    // A thrust's two ends in the contact pelvis's frame: the fitted contact
    // leg and the chamber drawn from it. A feint holds the chamber.
    const reached: KickThrust.ILeg = {
      thigh: local(Vector3.subtract(contact.knee, hip)),
      shank: local(Vector3.subtract(contact.ankle, contact.knee)),
    };
    const thrust: ((share: number) => KickThrust.ILeg) | undefined =
      props.path === "thrust"
        ? KickThrust.thrusting(
            KickThrust.drawn(reached, lengths, props.flexion.chamber, local({ x: 0, y: 1, z: 0 })),
            reached,
            lengths,
            props.flexion.least,
          )
        : undefined;
    const held: boolean = props.flexion.contact >= props.flexion.chamber;
    const struck: IAutoMovieQuaternion = Quaternion.multiply(
      inverse,
      contact.rotation,
    );
    const rising = (clock: number): number =>
      minimumJerk.share((clock - prep) / Math.max(1e-3, chamber - prep));
    const lowering = (clock: number): number =>
      minimumJerk.share(
        (clock - impact - folding) / Math.max(1e-3, recoil - folding),
      );
    return (
      clock: number,
      base: IAutoMovieMotionHumanPosture,
      shift: IAutoMovieVector3,
      atHip?: IAutoMovieVector3,
    ): IAutoMovieMotionHumanKickGeometry.ILeg => {
      const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(base);
      const currentHip: IAutoMovieVector3 = atHip ?? KickCarriage.hip(body, base, side);
      const opened: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        hinge.axis,
        angle(clock),
      );
      const up: number = rising(clock);
      const down: number = lowering(clock);

      // The carried leg from the hip: the chambered thigh and the shank
      // opened about the knee's hinge, or the thrust's leg at its share. The
      // foot is carried by the shank: turned on the hinge from the chamber,
      // or from the contact by the thrust's own turn (`KickThrust.footed`).
      const carried: KickThrust.ILeg =
        thrust === undefined
          ? { thigh: knee, shank: Quaternion.rotateVector(opened, shank) }
          : thrust(held ? 0 : extended(clock));
      const chambered: KickThrust.ILeg = {
        thigh: Quaternion.rotateVector(heading, carried.thigh),
        shank: Quaternion.rotateVector(heading, carried.shank),
      };
      const foot: IAutoMovieQuaternion =
        thrust === undefined
          ? Quaternion.multiply(opened, folded)
          : Quaternion.multiply(
              KickThrust.footed(reached.shank, carried.shank),
              struck,
            );

      // Between the plant and the chamber each segment turns on its share;
      // the planted leg is the one the current hip holds on the plant.
      const forward: IAutoMovieVector3 = Quaternion.rotateVector(heading, {
        x: 0,
        y: 0,
        z: 1,
      });
      // The lowering is the lift from the replant, run backwards.
      const lifted: number = shared(clock - prep, chamber - prep);
      const lowered: number = shared(
        clock - impact - folding,
        recoil - folding,
      );
      const posed: KickThrust.ILeg =
        lowered > 0
          ? between(
              KickThrust.planted(
                currentHip,
                Vector3.add(plant.ankle, props.step),
                Vector3.add(plant.knee, props.step),
                lengths,
                forward,
              ),
              chambered,
              1 - lowered,
            )
          : lifted < 1
            ? between(
                KickThrust.planted(
                  currentHip,
                  Vector3.add(plant.ankle, shift),
                  Vector3.add(plant.knee, shift),
                  lengths,
                  forward,
                ),
                chambered,
                lifted,
              )
            : chambered;
      const hint: IAutoMovieVector3 = Vector3.add(currentHip, posed.thigh);
      return {
        ankle: Vector3.add(hint, posed.shank),
        hint,
        rotation: Quaternion.slerp(
          Quaternion.slerp(
            plant.rotation,
            Quaternion.normalize(Quaternion.multiply(heading, foot)),
            up,
          ),
          plant.rotation,
          down,
        ),
      };
    };
  }

  /** A clock's linear share of a span, held in [0, 1]. */
  function shared(elapsed: number, span: number): number {
    return Math.min(1, Math.max(0, elapsed / Math.max(1e-3, span)));
  }

  /**
   * A leg between a planted one and a chambered one at a linear share of
   * the lift: the thigh turns at the hip on the share's minimum-jerk
   * profile, and the shank folds at the knee, in the thigh's own frame, on
   * the profile of the share over `KickForm.KNEE_LEAD`, so the knee has
   * folded when the hip is part of its way. The foot then leaves the floor
   * upward and back, as a heel rises before its thigh swings; with both
   * joints on one share the ankle slid forward along the floor first (the
   * thigh's turn carrying an unfolded shank), and a push kick thrown toe to
   * toe was stopped on the partner's lead foot at its launch (measured: the
   * knee 12.8 degrees at the chamber and the foot 147 mm high at impact).
   */
  function between(from: KickThrust.ILeg, to: KickThrust.ILeg, share: number): KickThrust.ILeg {
    const hip: number = minimumJerk.share(share);
    const knee: number = minimumJerk.share(
      Math.min(1, share / KickForm.KNEE_LEAD),
    );
    const thigh: IAutoMovieVector3 = turned(from.thigh, to.thigh, hip);
    const stood: IAutoMovieVector3 = Vector3.normalize(from.thigh);
    const folded: IAutoMovieVector3 = turned(
      from.shank,
      Quaternion.rotateVector(
        Quaternion.inverse(
          rotationBetween(stood, Vector3.normalize(to.thigh)),
        ),
        to.shank,
      ),
      knee,
    );
    return {
      thigh,
      shank: Quaternion.rotateVector(
        rotationBetween(stood, Vector3.normalize(thigh)),
        folded,
      ),
    };
  }

  /**
   * A segment turned from one direction to another by a share of the angle
   * between them, on their great arc, its length going linearly: a joint's
   * turn, not a chord. Opposite directions have no arc of their own, so they
   * turn about a horizontal axis across the first.
   */
  function turned(
    from: IAutoMovieVector3,
    to: IAutoMovieVector3,
    share: number,
  ): IAutoMovieVector3 {
    const a: number = Vector3.length(from);
    const b: number = Vector3.length(to);
    if (a < 1e-9 || b < 1e-9) return Vector3.lerp(from, to, share);
    const u: IAutoMovieVector3 = Vector3.scale(from, 1 / a);
    const v: IAutoMovieVector3 = Vector3.scale(to, 1 / b);
    const angle: number = Math.acos(
      Math.min(1, Math.max(-1, Vector3.dot(u, v))),
    );
    const sine: number = Math.sin(angle);
    const length: number = a + (b - a) * share;
    if (angle < 1e-6) return Vector3.scale(Vector3.lerp(u, v, share), length);
    if (sine < 1e-6) {
      const across: IAutoMovieVector3 = Vector3.cross(
        u,
        Math.abs(u.y) < 0.9 ? { x: 0, y: 1, z: 0 } : { x: 1, y: 0, z: 0 },
      );
      return Vector3.scale(
        Quaternion.rotateVector(
          Quaternion.fromAxisAngle(
            Vector3.normalize(across),
            (angle * share) / Quaternion.DEG2RAD,
          ),
          u,
        ),
        length,
      );
    }
    return Vector3.scale(
      Vector3.add(
        Vector3.scale(u, Math.sin((1 - share) * angle) / sine),
        Vector3.scale(v, Math.sin(share * angle) / sine),
      ),
      length,
    );
  }

  /** A hinge turn: its unit axis in the pelvis's frame and its angle. */
  interface IHinge {
    /** The unit axis, in the contact pelvis's frame. */
    axis: IAutoMovieVector3;

    /** The turn about it, degrees, in [0, 180]. */
    degrees: number;
  }

  /**
   * The axis and angle of a world rotation, the axis taken into the pelvis's
   * frame; a rotation too small to give an axis is no turn about any.
   */
  function turn(
    rotation: IAutoMovieQuaternion,
    local: (v: IAutoMovieVector3) => IAutoMovieVector3,
  ): IHinge {
    const q: IAutoMovieQuaternion = Quaternion.normalize(rotation);
    const sign: number = q.w < 0 ? -1 : 1;
    const sine: number = Math.hypot(q.x, q.y, q.z);
    if (sine < 1e-9) return { axis: { x: 1, y: 0, z: 0 }, degrees: 0 };
    return {
      axis: local(
        Vector3.scale({ x: q.x, y: q.y, z: q.z }, sign / sine),
      ),
      degrees: (2 * Math.atan2(sine, sign * q.w)) / Quaternion.DEG2RAD,
    };
  }

  /**
   * The share of a minimum-jerk unit's duration at which it has covered a
   * share of its travel: the profile is monotonic, so 48 bisections give the
   * share to rounding.
   */
  function unit(travel: number): number {
    if (travel >= 1) return 1;
    let lo: number = 0;
    let hi: number = 1;
    for (let i: number = 0; i < 48; i++) {
      const mid: number = (lo + hi) / 2;
      if (minimumJerk.share(mid) < travel) lo = mid;
      else hi = mid;
    }
    return hi;
  }
}
