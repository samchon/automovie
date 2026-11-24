import { physicalShapeSpan } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieCurlChainUntilContact,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanGrasp,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanPropReader,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanGraspHand } from "./HumanGraspHand";
import { HumanGraspReach } from "./HumanGraspReach";
import { HumanGraspSearch } from "./HumanGraspSearch";
import { HumanGraspTarget } from "./HumanGraspTarget";

/** The alternatives of `StandingBonesEntry`'s site. */
type StandingBonesEntry = "worldPosition" | "worldRotation";

/** The alternatives of `Frame`'s site. */
type Frame = "point" | "approach" | "axis" | "width";

/**
 * A prop's grip affordance as a grasp target, and the hand that grasps it:
 * where the grip socket goes, how the hand turns, how wide it opens on the way
 * and how its digits close.
 *
 * The affordance frame follows the one convention of `AutoMovieAffordanceKind`:
 * `+Y` points out of the contact, so the hand arrives along `-Y` with its palm
 * facing into the object, and the wrapped axis runs along `+X`, the thumb side
 * toward `+X`. The grasp lays the hand's grip socket (the centre of a power
 * grip, 25 mm out from the palm) on the affordance point with the socket's palm
 * normal along `-Y` and its thumb-side forward along `+X` (`HumanHand.reach`),
 * which fixes the hand's rotation, and then sets the palm on the grasped part's
 * near surface, half the grasped width back from the affordance point on the
 * part's axis, so a thick part is not entered by a palm placed for the socket's
 * nominal 50 mm handle; the arm is then solved by inverse kinematics to that
 * effector frame, laid on the object's authored grip marker (Tolani, Goswami
 * and Badler 2000, Graphical Models 62(5):353).
 *
 * The grasped width is the affordance's `aperture`, or else the extent along
 * the approach axis of the prop's collider nearest the grip point (the span the
 * closing hand must clear), read from the engine's `physicalShapeSpan`.
 * `HumanPreshape` opens the hand for it on the way.
 */
export namespace HumanGrasp {
  /** The existing target fields a hand placement actually consumes. */
  export type IFrame = Pick<IAutoMovieMotionHumanGrasp.ITarget, Frame>;

  /**
   * A prop affordance as a target at a film second, from its displayed frame.
   *
   * @param context The action's context.
   * @param subject The prop.
   * @param id The affordance id.
   * @param seconds Film seconds.
   * @returns The target.
   * @throws {HumanRefusal} When the prop declares no such affordance or no
   *   colliders.
   */
  export function target(
    context: Pick<IAutoMovieMotionHumanActionContext, "prop">,
    subject: string,
    id: string,
    seconds: number,
  ): IAutoMovieMotionHumanGrasp.ITarget {
    const prop: IAutoMovieMotionHumanPropReader = context.prop(subject);
    return HumanGrasp.at(prop.prop, id, prop.frame(seconds));
  }

  /**
   * A prop affordance as a target with the prop at a given world frame, such as
   * where another person's hand will hold it.
   *
   * @param prop The prop.
   * @param id The affordance id.
   * @param frame The prop's world frame.
   * @returns The target.
   * @throws {HumanRefusal} When the prop declares no such affordance or no
   *   colliders.
   */
  export function at(
    prop: IAutoMovieMotionHumanProp,
    id: string,
    frame: IAutoMovieRigidTransform,
  ): IAutoMovieMotionHumanGrasp.ITarget {
    return HumanGraspTarget(prop, id).at(frame);
  }

  /**
   * The wrist goal that lays the grip socket on a target.
   *
   * @param body The body.
   * @param side The hand.
   * @param target The target.
   * @param tilt Degrees the hand turns about the approach, for an oblique grip;
   *   0 when absent.
   * @returns The wrist point and the hand's rotation.
   */
  export function hand(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    target: IFrame,
    tilt: number = 0,
  ): IAutoMovieMotionHumanHand.IWrist {
    return HumanGraspHand.prepare(body, side)(target, tilt);
  }

  /**
   * The reachable variant of a symmetric hand goal: among the goals a family of
   * turns produces (about a grasped part's own axis, where any azimuth wraps it
   * alike, or about the palm's normal, where the palm's contact is unchanged),
   * the one the arm can actually take from a posture, by the error left after
   * the arm's fit, in millimetres of the hand: the wrist's position miss plus
   * the hand's rotation miss carried as an arc over the hand's length, the
   * characteristic length that makes a pose error dimensionally homogeneous
   * (Angeles, Fundamentals of Robotic Mechanical Systems). The elbow's turn
   * from its hint about the shoulder-to-wrist line, the one freedom a placed
   * wrist leaves the elbow (Tolani, Goswami and Badler 2000), is reported as
   * `departure` and costs nothing here. The authored turn wins ties by a
   * hundredth of a millimetre per degree of turn. Grasp planners rank a part's
   * symmetric grasps by reachability the same way (Miller et al. 2003,
   * Automatic grasp planning using shape primitives), since an authored grip
   * frame alone may ask the wrist for more deviation than it has.
   *
   * A grip is held through a stroke, not at one instant: a lifted bottle is
   * still in the same grip at the top of the lift, a clasped hand at both ends
   * of the pump. `stroke` names those further key poses for a candidate, and a
   * candidate's error is the worst over the grasp and its keys, so the chosen
   * grip is the one the arm keeps over the whole stroke. Each key is fitted
   * with the grasp's own arm solution as its reference, unless it declares
   * `reference: false`, the way the law will show it; the returned `reference`
   * is that solution, for the law to pass on every goal of the stroke
   * (`HumanPosture.IGoal.reference`).
   *
   * @param body The body.
   * @param posture The posture the arm is fitted in (its other limbs and
   *   trunk).
   * @param side The arm.
   * @param bend The elbow hint.
   * @param goal The wrist goal of a turn and a tilt, degrees.
   * @param tilts The tilts tried at each turn; only the authored one when
   *   absent.
   * @param stroke The further key poses the same grip must reach, from its
   *   grasp goal and from the hand the arm shows for that goal: what is held is
   *   rigid in the shown hand, so a key that places the held thing is built
   *   from the shown one. None when absent.
   * @param turns The turns tried, degrees; -90 to 90 in steps of 15 when
   *   absent.
   * @param required What a grip must hold before its cost counts: a measure of
   *   its per-key errors, judgements and the bounds the keys hold their
   *   judgements to (the grasp's, then each stroke key's; `NaN` where none) and
   *   the most it may be. A grip within the bound is chosen before any beyond
   *   it; with none within, the one nearest the bound is returned for the
   *   caller to refuse. Absent, the least cost alone decides.
   * @param admits Whether the caller can take a candidate's grasp goal at all:
   *   a candidate it refuses is tried only when it refuses every one. Every
   *   candidate when absent.
   * @returns The best turn and tilt, their goal, the hand the arm achieves for
   *   it, and the arm's solution there.
   */
  export function reachable(
    body: IAutoMovieMotionHumanBody,
    posture: IAutoMovieMotionHumanPosture,
    side: AutoMovieHumanSide,
    bend: IAutoMovieVector3,
    goal: (turn: number, tilt: number) => IAutoMovieMotionHumanHand.IWrist,
    tilts: readonly number[] = [0],
    stroke?: (
      wrist: IAutoMovieMotionHumanHand.IWrist,
      shown: IAutoMovieMotionHumanHand.IWrist,
    ) => Iterable<IAutoMovieMotionHumanGrasp.IKey>,
    turns: readonly number[] = TURNS,
    required?: IAutoMovieMotionHumanGrasp.IReachableRequired,
    admits?: (wrist: IAutoMovieMotionHumanHand.IWrist) => boolean,
  ): IAutoMovieMotionHumanGrasp.IReach {
    return HumanGraspSearch(body, posture, side, bend)(
      goal,
      tilts,
      stroke,
      turns,
      required,
      admits,
    );
  }

  /**
   * The turns {@link reachable} tries by default, degrees: a quarter turn either
   * way in steps of 15.
   */
  export const TURNS: readonly number[] = Array.from(
    { length: 13 },
    (_: unknown, i: number): number => -90 + 15 * i,
  );

  /**
   * The standing posture a person settles into from where they stand: the stand
   * law's posture centred over the person's displayed feet, facing the way the
   * pelvis faces. A law predicting another person's arm (a handshake's partner,
   * a handover's receiver) reads it, so the prediction starts from the same
   * root the partner's own stand law will hold.
   *
   * @param body The person's body.
   * @param bones The person's displayed world bones.
   * @returns The posture.
   */
  export function standing(
    body: IAutoMovieMotionHumanBody,
    bones: ReadonlyMap<
      AutoMovieHumanoidBone,
      Pick<IAutoMovieResolvedBone, StandingBonesEntry>
    >,
  ): IAutoMovieMotionHumanPosture {
    return HumanGraspReach.standing(body, bones);
  }

  /**
   * A target turned about its wrapped axis through the axis point, as a
   * cylinder's grip may be taken from any side.
   *
   * @param target The target.
   * @param turn Degrees about the wrapped axis.
   * @returns The turned target.
   */
  export function around(
    target: IAutoMovieMotionHumanGrasp.ITarget,
    turn: number,
  ): IAutoMovieMotionHumanGrasp.ITarget;
  /** The same rigid handle turn when only its hand-placement frame is needed. */
  export function around(target: IFrame, turn: number): IFrame;
  /** Delegate both target views to the same wrapped-axis rotation owner. */
  export function around(target: IFrame, turn: number): IFrame {
    return HumanGraspReach.around(target, turn);
  }

  /**
   * The width of colliders along an axis: the extent of their union's
   * projection.
   *
   * @param colliders Placed colliders.
   * @param axis A unit direction.
   * @returns Metres.
   */
  export function extent(
    colliders: readonly IAutoMovieCurlChainUntilContact.ICollider[],
    axis: IAutoMovieVector3,
  ): number {
    const [lo, hi]: readonly [number, number] = span(colliders, axis);
    return hi - lo;
  }

  /**
   * The interval colliders cover along an axis: the lowest and highest
   * projections of their union onto it, so an object's middle along the
   * vertical is the mean of the two.
   *
   * @param colliders Placed colliders.
   * @param axis A unit direction.
   * @returns The low and high projections, metres along the axis from the world
   *   origin.
   */
  export function span(
    colliders: readonly IAutoMovieCurlChainUntilContact.ICollider[],
    axis: IAutoMovieVector3,
  ): readonly [number, number] {
    let lo: number = Infinity;
    let hi: number = -Infinity;
    for (const c of colliders) {
      const [low, high]: readonly [number, number] = physicalShapeSpan(
        c.frame,
        c.shape,
        axis,
      );
      lo = Math.min(lo, low);
      hi = Math.max(hi, high);
    }
    return [lo, hi];
  }
}
