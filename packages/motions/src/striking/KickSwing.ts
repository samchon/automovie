import { Quaternion, Vector3, minimumJerk } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import type { IKickGeometry } from "./IKickGeometry";
import { KickCarriage } from "./KickCarriage";
import type { KickChamber } from "./KickChamber";
import { KickForm } from "./KickForm";
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
 * The knee opens on one minimum-jerk unit that begins before the chamber key
 * is reached, so the ankle rounds the chamber instead of resting on it (Flash
 * and Hogan 1985), and that is aimed past the contact, so the shin arrives
 * with its share of the unit's peak speed ({@link StrikingStroke.impactShare})
 * and would travel on through the target. The knee never opens past the
 * technique's least flexion: when the aim past the contact would, the unit
 * ends nearer the contact and the shin arrives slower. From the contact the
 * knee folds back over the re-chamber's share of the recoil.
 *
 * The lift from the plant and the lowering to the replant blend the carried
 * leg with the world plant on minimum-jerk weights.
 */
export namespace KickSwing {
  /** What a kicking leg's path is built from. */
  export interface IProps {
    /** The kicking body. */
    body: IHumanBody;

    /** The kicking side. */
    side: "left" | "right";

    /** The kick's timing. */
    timing: IKickGeometry.ITiming;

    /** The body's posture at the contact, under which the leg was fitted. */
    base: IHumanPosture;

    /** The chambered leg under that posture. */
    key: KickChamber.IKey;

    /** The fitted contact leg under that posture; the chamber itself for a feint. */
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
   */
  export function create(
    props: IProps,
  ): (
    clock: number,
    base: IHumanPosture,
    shift: IAutoMovieVector3,
  ) => IKickGeometry.ILeg {
    const { body, side, timing, key, contact, plant } = props;
    const { prep, chamber, impact } = timing;

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

    // The opening's unit: from before the chamber key to past the contact,
    // reaching the contact at the share of its travel that leaves the asked
    // speed, bounded so its end never opens the knee past the least flexion.
    const opening: number = props.flexion.chamber - props.flexion.contact;
    const most: number = props.flexion.chamber - props.flexion.least;
    const share: number =
      opening <= 0 || most <= 0
        ? 1
        : Math.max(
            minimumJerk(StrikingStroke.impactShare(props.speed)).s,
            Math.min(1, opening / most),
          );
    const begin: number = chamber - KickForm.VIA_OVERLAP * (chamber - prep);
    const span: number = Math.max(1e-3, impact - begin) / unit(share);
    const angle = (clock: number): number =>
      ((hinge.degrees * minimumJerk((clock - begin) / span).s) / share) *
      (1 - timing.clock.progress("stroke", "folded", clock));
    const rising = (clock: number): number =>
      timing.clock.progress("launch", "chamber", clock);
    const lowering = (clock: number): number =>
      timing.clock.progress("folded", "replant", clock);
    return (
      clock: number,
      base: IHumanPosture,
      shift: IAutoMovieVector3,
    ): IKickGeometry.ILeg => {
      const heading: IAutoMovieQuaternion = resolveHumanPosture.heading(base);
      const carried = (v: IAutoMovieVector3): IAutoMovieVector3 =>
        Vector3.add(
          KickCarriage.hip(body, base, side),
          Quaternion.rotateVector(heading, v),
        );
      const opened: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        hinge.axis,
        angle(clock),
      );
      const up: number = rising(clock);
      const down: number = lowering(clock);
      return {
        ankle: Vector3.lerp(
          Vector3.lerp(
            Vector3.add(plant.ankle, shift),
            carried(Vector3.add(knee, Quaternion.rotateVector(opened, shank))),
            up,
          ),
          Vector3.add(plant.ankle, props.step),
          down,
        ),
        hint: Vector3.lerp(
          Vector3.lerp(Vector3.add(plant.knee, shift), carried(knee), up),
          Vector3.add(plant.knee, props.step),
          down,
        ),
        rotation: Quaternion.slerp(
          Quaternion.slerp(
            plant.rotation,
            Quaternion.normalize(
              Quaternion.multiply(
                heading,
                Quaternion.multiply(opened, folded),
              ),
            ),
            up,
          ),
          plant.rotation,
          down,
        ),
      };
    };
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
      if (minimumJerk(mid).s < travel) lo = mid;
      else hi = mid;
    }
    return hi;
  }
}
