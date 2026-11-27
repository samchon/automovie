import {
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
  AutoMovieEngineMotionSampling,
  AutoMovieEngineMath,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanKickGeometry,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { walkFoot } from "../../actions/internal/walkFoot";
import { walkLeg } from "../../actions/internal/walkLeg";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { KickCarriage } from "./KickCarriage";
import { KickChain } from "./KickChain";
import type { KickChamber } from "./KickChamber";
import { KickForm } from "./KickForm";
import { KickRocker } from "./KickRocker";
import { KickSwingTurned } from "./KickSwingTurned";
import { KickThrust } from "./KickThrust";
import { StrikingStroke } from "./StrikingStroke";

/*
 * The kicking leg's path: from its plant up to the chamber, out to the contact,
 * back to the chamber and down to the replant.
 *
 * The chamber is the fitted contact leg with only the knee folded
 * (KickChamber), so between the two the hip joint does not move and the
 * ankle travels on the knee's own hinge arc about the fitted knee. The arc, the
 * knee and the foot's rotation are held in the pelvis's frame at the contact
 * and carried by whatever body the leg hangs from, so every goal on the way is
 * a pose the leg can hold inside the hip's range of motion, also while the body
 * turns back under a recoiling leg or a redirect blends two carriages. A
 * world-straight path between the same two ankles is not: it leaves the leg's
 * reach as soon as the hip moves.
 *
 * A push kick goes on a thrust instead (KickThrust): its chamber lifts
 * the knee to the target's height with the foot folded under it, and the ankle
 * travels straight from there to the fitted contact on the same unit, in the
 * same pelvis frame, while the carriage drives the pelvis along the line behind
 * it (`IAutoMovieMotionHumanKickGeometry.ICarriage.drive`). The hinge's arc
 * from a chamber that only folds the contact leg's knee is a front snap: it
 * swings the foot up from below the target, through an opponent's lead thigh.
 *
 * The knee opens on one minimum-jerk unit that begins before the chamber key is
 * reached, so the ankle rounds the chamber instead of resting on it (Flash and
 * Hogan 1985), and that is aimed past the contact, so the shin arrives with its
 * share of the unit's peak speed (StrikingStroke.impactShare) and would
 * travel on through the target. The knee never opens past the technique's least
 * flexion: when the aim past the contact would, the unit ends nearer the
 * contact and the shin arrives slower. From the contact the knee folds back
 * over the re-chamber's share of the recoil.
 *
 * The lift from the plant and the lowering to the replant run on the leg's own
 * joint arc too. The planted leg is solved from the hip the body has at that
 * instant (the two-segment triangle from the hip to the planted ankle, its knee
 * on the planted knee's side), and the thigh and the shank each turn from their
 * planted direction to their chambered one on a minimum-jerk share, the ankle
 * following by forward kinematics. In the leg's own plane that is the hip's and
 * the knee's flexion each on the share, so the knee leads the lift and the foot
 * trails under it, as a chamber is coached. A world-straight line from the
 * planted ankle to the chambered one carries the foot forward of that arc,
 * through whatever stands in front of the shin: measured on the staged push
 * kick, the foot's capsule met the partner's lead leg at 0.970 s, during the
 * lift. On the floor the plant's foot rocks onto its forefoot as the weight
 * leaves it (KickRocker), and in from the air to the replant. Off the
 * floor the plant's foot rides the shank (turned by what turns the planted
 * shank onto the lifted one) while it blends to the chambered foot, so the
 * ankle keeps the plant's bend instead of dorsiflexing past what a foot bearing
 * nothing reaches as the shank swings forward over a foot held flat in the
 * world.
 */
export namespace KickSwing {
  /*
   * The last share of the lowering in which the foot comes straight down onto
   * its replant from a walking foot's clearance (provisional: the terminal
   * swing's descent, Winter 1992).
   */
  export const SET_DOWN: number = 1 / 3;

  /*
   * What a kicking leg's path is built from.
   */
  export interface IProps {
    /*
     * The kicking body.
     */
    body: IAutoMovieMotionHumanBody;

    /*
     * The kicking side.
     */
    side: AutoMovieHumanSide;

    /*
     * The kick's timing.
     */
    timing: IAutoMovieMotionHumanKickGeometry.ITiming;

    /*
     * The body's posture at the contact, under which the leg was fitted.
     */
    base: IAutoMovieMotionHumanPosture;

    /*
     * The chambered leg under that posture.
     */
    key: KickChamber.IKey;

    /*
     * How the leg goes from its chamber to its contact: on the knee's `hinge`
     * under a still thigh (the round kick's snap), or on a `thrust`, the ankle
     * straight from a chamber with the knee lifted to the target's height (the
     * push kick).
     */
    path: PropsPath;

    /*
     * The fitted contact leg under that posture; the chamber itself for a
     * hinge's feint.
     */
    contact: KickChamber.IKey;

    /*
     * The knee's flexion at the chamber and at the contact, and the least it
     * may open to, degrees.
     */
    flexion: IPropsFlexion;

    /*
     * The share of the opening's peak speed left at the contact, in (0, 1].
     */
    speed: number;

    /*
     * The kicking leg on the floor at the launch: its knee, its ankle and its
     * foot's rotation.
     */
    plant: KickChamber.IKey;

    /*
     * The replant's displacement from the launch plant, world metres.
     */
    step: IAutoMovieVector3;
  }

  /*
   * Build a kicking leg's path.
   * Parameter props: The fitted contact, its chamber, the plant and the timing.
   * Returns: The leg's goal as a pure function of its clock, the body it hangs
   * from and the launch plant's shift.
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
    const inverse: IAutoMovieQuaternion = AutoMovieEngineQuaternion.inverse(
      humanPostureHeading(props.base),
    );
    const local = (v: IAutoMovieVector3): IAutoMovieVector3 =>
      AutoMovieEngineQuaternion.rotateVector(inverse, v);
    const knee: IAutoMovieVector3 = local(AutoMovieEngineVector3.subtract(key.knee, hip));
    const shank: IAutoMovieVector3 = local(
      AutoMovieEngineVector3.subtract(key.ankle, key.knee),
    );
    const folded: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      inverse,
      key.rotation,
    );
    const hinge: IHinge = turn(
      AutoMovieEngineQuaternion.multiply(contact.rotation, AutoMovieEngineQuaternion.inverse(key.rotation)),
      local,
    );
    const lengths: readonly [number, number] = [
      AutoMovieEngineVector3.length(knee),
      AutoMovieEngineVector3.length(shank),
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
            AutoMovieEngineMotionSampling.minimumJerkShare(StrikingStroke.impactShare(props.speed)),
            Math.min(1, opening / most),
          );
    const begin: number = chamber - KickForm.VIA_OVERLAP * (chamber - prep);
    const span: number = Math.max(1e-3, impact - begin) / unit(share);
    const extended = (clock: number): number =>
      (AutoMovieEngineMotionSampling.minimumJerkShare((clock - begin) / span) / share) *
      (1 - AutoMovieEngineMotionSampling.minimumJerkShare((clock - impact) / Math.max(1e-3, folding)));
    const angle = (clock: number): number => hinge.degrees * extended(clock);

    // A thrust's two ends in the contact pelvis's frame: the fitted contact
    // leg and the chamber drawn from it. A feint holds the chamber.
    const reached: KickThrust.ILeg = {
      thigh: local(AutoMovieEngineVector3.subtract(contact.knee, hip)),
      shank: local(AutoMovieEngineVector3.subtract(contact.ankle, contact.knee)),
    };
    const thrust: ((share: number) => KickThrust.ILeg) | undefined =
      props.path === "thrust"
        ? KickThrust.thrusting(
            KickThrust.drawn(
              reached,
              lengths,
              props.flexion.chamber,
              local({ x: 0, y: 1, z: 0 }),
            ),
            reached,
            lengths,
            props.flexion.least,
          )
        : undefined;
    const held: boolean = props.flexion.contact >= props.flexion.chamber;
    const struck: IAutoMovieQuaternion = AutoMovieEngineQuaternion.multiply(
      inverse,
      contact.rotation,
    );
    const rising = (clock: number): number =>
      AutoMovieEngineMotionSampling.minimumJerkShare((clock - prep) / Math.max(1e-3, chamber - prep));
    const lowering = (clock: number): number =>
      AutoMovieEngineMotionSampling.minimumJerkShare(
        (clock - impact - folding) / Math.max(1e-3, recoil - folding),
      );
    // The plant's foot on the floor rises on its forefoot rocker as the
    // weight leaves it (`KickRocker`).
    const rocked: KickRocker.Reader = KickRocker(body, side, plant);
    return (
      clock: number,
      base: IAutoMovieMotionHumanPosture,
      shift: IAutoMovieVector3,
      atHip?: IAutoMovieVector3,
    ): IAutoMovieMotionHumanKickGeometry.ILeg => {
      const heading: IAutoMovieQuaternion = humanPostureHeading(base);
      const currentHip: IAutoMovieVector3 =
        atHip ?? KickCarriage.hip(body, base, side);
      const opened: IAutoMovieQuaternion = AutoMovieEngineQuaternion.fromAxisAngle(
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
          ? { thigh: knee, shank: AutoMovieEngineQuaternion.rotateVector(opened, shank) }
          : thrust(held ? 0 : extended(clock));
      const chambered: KickThrust.ILeg = {
        thigh: AutoMovieEngineQuaternion.rotateVector(heading, carried.thigh),
        shank: AutoMovieEngineQuaternion.rotateVector(heading, carried.shank),
      };
      const foot: IAutoMovieQuaternion =
        thrust === undefined
          ? AutoMovieEngineQuaternion.multiply(opened, folded)
          : AutoMovieEngineQuaternion.multiply(
              KickThrust.footed(reached.shank, carried.shank),
              struck,
            );

      // Between the plant and the chamber each segment turns on its share;
      // the planted leg is the one the current hip holds on the plant.
      const forward: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(heading, {
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
      const moved: IAutoMovieVector3 | undefined =
        lowered > 0 ? props.step : lifted < 1 ? shift : undefined;
      const on: KickRocker.IRocked | undefined =
        moved === undefined
          ? undefined
          : rocked(
              currentHip,
              moved,
              walkLeg.dorsal(
                lowered > 0
                  ? 0
                  : 1 - AutoMovieEngineMotionSampling.minimumJerkShare(clock / Math.max(1e-3, prep)),
              ) - KickChain.DORSAL_MARGIN,
            );
      // The lowering carries the foot over its replant first and sets it
      // down straight in the last `SET_DOWN` of it, from a walking foot's
      // clearance (`walkFoot.CLEARANCE`), so it never travels on the floor.
      const travel: number =
        lowered > 0 ? Math.min(1, lowered / (1 - KickSwing.SET_DOWN)) : 0;
      const over: number =
        lowered > 0
          ? walkFoot.CLEARANCE *
            (1 -
              AutoMovieEngineMotionSampling.minimumJerkShare(
                (lowered - (1 - KickSwing.SET_DOWN)) / KickSwing.SET_DOWN,
              ))
          : 0;
      const floor: KickThrust.ILeg | undefined =
        on === undefined
          ? undefined
          : KickThrust.planted(
              currentHip,
              { ...on.foot.ankle, y: on.foot.ankle.y + over },
              AutoMovieEngineVector3.add(plant.knee, moved!),
              lengths,
              forward,
            );
      const posed: KickThrust.ILeg =
        floor === undefined
          ? chambered
          : between(floor, chambered, lowered > 0 ? 1 - travel : lifted);
      // Off the floor the plant's foot rides its shank, so the ankle keeps
      // the plant's bend instead of dorsiflexing as the shank swings forward
      // over a foot still flat in the world; it is the plant's own foot again
      // wherever the leg is the planted one.
      const riding: IAutoMovieQuaternion =
        floor === undefined
          ? plant.rotation
          : AutoMovieEngineQuaternion.normalize(
              AutoMovieEngineQuaternion.multiply(
                AutoMovieEngineMath.rotationBetween(
                  AutoMovieEngineVector3.normalize(floor.shank),
                  AutoMovieEngineVector3.normalize(posed.shank),
                ),
                on!.foot.rotation,
              ),
            );
      const hint: IAutoMovieVector3 = AutoMovieEngineVector3.add(currentHip, posed.thigh);
      const ankle: IAutoMovieVector3 = AutoMovieEngineVector3.add(hint, posed.shank);
      const turned: IAutoMovieQuaternion = AutoMovieEngineQuaternion.slerp(
        AutoMovieEngineQuaternion.slerp(
          riding,
          AutoMovieEngineQuaternion.normalize(AutoMovieEngineQuaternion.multiply(heading, foot)),
          up,
        ),
        riding,
        down,
      );
      return {
        ankle,
        hint,
        // Off the floor the foot bears nothing: its ankle is kept within a
        // weightless ankle's dorsiflexion (`KickChain.unloaded`).
        rotation:
          clock > prep && clock < duration
            ? KickChain.unloaded(turned, hint, ankle)
            : turned,
        // The rocker's toe extension, eased out as the foot leaves the floor
        // and in as it comes down to the replant.
        ...(on === undefined || on.toes === 0
          ? {}
          : { toes: on.toes * (lowered > 0 ? down : 1 - up) }),
      };
    };
  }

  /*
   * The share of a span elapsed, within 0 to 1, over at least a millisecond.
   * Parameter elapsed: The seconds elapsed.
   * Parameter span: The span's seconds.
   * Returns: 0 to 1.
   */
  export function shared(elapsed: number, span: number): number {
    return Math.min(1, Math.max(0, elapsed / Math.max(1e-3, span)));
  }

  /*
   * A leg between two keys: the thigh swung on the hip's minimum-jerk share,
   * the shank folded ahead of it by `KickForm.KNEE_LEAD` in the thigh's own
   * frame.
   * Parameter from: The leg it leaves.
   * Parameter to: The leg it reaches.
   * Parameter share: The swing's share, 0 to 1.
   * Returns: The leg.
   */
  export function between(
    from: KickThrust.ILeg,
    to: KickThrust.ILeg,
    share: number,
  ): KickThrust.ILeg {
    const hip: number = AutoMovieEngineMotionSampling.minimumJerkShare(share);
    const knee: number = AutoMovieEngineMotionSampling.minimumJerkShare(
      Math.min(1, share / KickForm.KNEE_LEAD),
    );
    const thigh: IAutoMovieVector3 = KickSwingTurned(from.thigh, to.thigh, hip);
    const stood: IAutoMovieVector3 = AutoMovieEngineVector3.normalize(from.thigh);
    const folded: IAutoMovieVector3 = KickSwingTurned(
      from.shank,
      AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineQuaternion.inverse(AutoMovieEngineMath.rotationBetween(stood, AutoMovieEngineVector3.normalize(to.thigh))),
        to.shank,
      ),
      knee,
    );
    return {
      thigh,
      shank: AutoMovieEngineQuaternion.rotateVector(
        AutoMovieEngineMath.rotationBetween(stood, AutoMovieEngineVector3.normalize(thigh)),
        folded,
      ),
    };
  }

  /*
   * A rotation as an axis and an angle.
   */
  export interface IHinge {
    /*
     * The unit axis, in the contact pelvis's frame.
     */
    axis: IAutoMovieVector3;

    /*
     * The turn about it, degrees, in [0, 180].
     */
    degrees: number;
  }

  /*
   * A rotation's hinge: its unit axis, read in a local frame, and its angle in
   * [0, 180], the short way round; none for no rotation.
   * Parameter rotation: The rotation.
   * Parameter local: Reads a world direction in the local frame.
   * Returns: The hinge.
   */
  export function turn(
    rotation: IAutoMovieQuaternion,
    local: (v: IAutoMovieVector3) => IAutoMovieVector3,
  ): IHinge {
    const q: IAutoMovieQuaternion = AutoMovieEngineQuaternion.normalize(rotation);
    const sign: number = q.w < 0 ? -1 : 1;
    const sine: number = Math.hypot(q.x, q.y, q.z);
    if (sine < 1e-9) return { axis: { x: 1, y: 0, z: 0 }, degrees: 0 };
    return {
      axis: local(AutoMovieEngineVector3.scale({ x: q.x, y: q.y, z: q.z }, sign / sine)),
      degrees: (2 * Math.atan2(sine, sign * q.w)) / AutoMovieEngineQuaternion.DEG2RAD,
    };
  }

  /*
   * The share of a minimum-jerk unit's time at which it has covered a share of
   * its travel.
   * Parameter travel: The travel's share.
   * Returns: The time's share.
   */
  export function unit(travel: number): number {
    return AutoMovieEngineMotionSampling.minimumJerkTime(travel);
  }
}

/*
 * The record of `IPropsFlexion`'s site.
 */
type IPropsFlexion = { chamber: number; contact: number; least: number };

/*
 * The alternatives of `PropsPath`'s site.
 */
type PropsPath = "hinge" | "thrust";
