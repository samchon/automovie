import { Quaternion, minimumJerk } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarriedLift,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanTurnHumanPosture,
  IAutoMovieQuaternion,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanFrame } from "../posture/HumanFrame";
import { prepareHumanPoseResolution } from "../posture/prepareHumanPoseResolution";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { turnHumanPosture } from "../posture/turnHumanPosture";
import { GymnasticsFlight } from "../sport/GymnasticsFlight";
import { HumanCarriedLiftKnots } from "./HumanCarriedLiftKnots";

/**
 * The lift into a carry and the set-down out of it (#3349): the carried
 * body leaves the posture it was entered in for the carry's over the first
 * `lift` seconds, and over the last `setDown` seconds comes down to stand
 * where the carrier has brought it.
 *
 * Both are a blend on minimum-jerk progress between two whole postures: the
 * displayed root rises before it crosses and crosses before it comes down,
 * each on a minimum-jerk half of the phase, so the body goes over the
 * carrier rather than through it; its quaternion follows
 * the shortest rotation and the joints go with it, and the carry's own posture keeps following the carrier
 * meanwhile, so the body arrives on a carrier who walks. The carried body's
 * contact with the carrier is declared only between the two, while it
 * rests there; the feet leave the floor as the lift begins and come back
 * to it as the set-down ends, so no floor window lies inside either phase
 * (#3437).
 *
 * First pass: the body is carried through the blend by nothing that is
 * shown (the carrier's hands arrive by `bearing`'s own take-up, and no hand
 * is placed under the body while it rises); the arms that cling are blended
 * from where they hung to where their hold's goal puts them, as joint angles,
 * and take the goal itself once the lift is done; the body is set down
 * standing, whatever the carry, on the floor under where its root is
 * carried.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the two phases do, what the blend is, when the contact is declared and what the first pass leaves out.
 * @evidence contracts/development/design.md#principled-representation A wrapper of the carried plan: the carry's law is unchanged and the two phases are one blend each over its posture.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The two parameters and the wrapper `borne` returns through.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts With neither parameter given the plan is returned as it is, so a carry without the phases is what it was.
 */
export namespace HumanCarriedLift {
  /**
   * A carried plan with its lift and its set-down.
   *
   * @param context The carried person's context.
   * @param plan The plan of the carry itself, whose posture follows the carrier.
   * @returns The plan with the two phases; `plan` itself when neither is asked.
   * @throws {HumanRefusal} When a phase is negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The posture at a second is the carry's own, blended from the entry posture while the lift lasts and toward a stand under the carried root while the set-down lasts; phases longer than the carry are scaled to fill it. Both ends' displayed roots include their whole-body rotations (`turnHumanPosture`); their positions are blended vertically and across the floor on the two minimum-jerk halves (rising first, coming down last) and their rotations by quaternion slerp, represented as a correction after the blended Euler heading, so a rotation carried outside those angles cannot disappear when a phase starts.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two weights, one blend, the contact windows cut to the hold.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The heading is blended the short way round; a limb goal is blended as the joint angles its solve gives, so no limb jumps when the blend starts or ends.
   * @evidence contracts/development/implementation.md#efficient-algorithms The entry is frozen once per plan; a posture inside a phase freezes the carry's posture once (one whole-posture fit) and blends the joints, and one outside the phases costs the carry's own posture alone.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Within one posture call the carry's plan and the freeze share one forward-kinematics reader and the caller's range-of-motion projector; the bearer's bones the carry reads are its own. Nothing is kept between seconds.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The plan holds the carry's plan, the two phase lengths and the entry and frozen entry postures; each posture call's reader ends with it.
   */
  export function over(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanCarriedLift.IParams>,
    plan: IAutoMovieMotionHumanActionPlan,
  ): IAutoMovieMotionHumanActionPlan {
    const asked: readonly [number, number] = [
      HumanBound.least("lift", context.params.lift ?? 0, 0, "s"),
      HumanBound.least("setDown", context.params.setDown ?? 0, 0, "s"),
    ];
    if (asked[0] + asked[1] === 0) return plan;
    const fit: number = Math.min(1, plan.duration / (asked[0] + asked[1]));
    const lift: number = asked[0] * fit;
    const setDown: number = asked[1] * fit;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const body: IAutoMovieMotionHumanBody = context.body;

    // Each end of a blend is written by its solved joint angles alone
    // (`GymnasticsFlight.frozen`), so a limb a goal places at one end is
    // blended from where that goal put it, never dropped at the start or
    // taken whole half way, and the blend meets each end's displayed pose.
    const stood: IAutoMovieMotionHumanPosture = GymnasticsFlight.frozen(
      body,
      entry,
    );
    const ease: (x: number) => number = (x: number): number =>
      minimumJerk.share(x);
    // The blend at a raw progress `x`. The root rises before it crosses and
    // crosses before it comes down, each on a minimum-jerk half of the
    // phase, so the body goes over the carrier, never through it, and the
    // two halves meet at rest, the root's velocity continuous there. The
    // joints, the heading and the attitude go with the height: the body
    // takes the carry's shape (a straddle's legs open) as it rises, before
    // it crosses, and the stand's as it comes down, after it has crossed.
    const mix = (
      from: IAutoMovieMotionHumanPosture,
      to: IAutoMovieMotionHumanPosture,
      x: number,
    ): IAutoMovieMotionHumanPosture => {
      const lead: number = ease(Math.min(1, 2 * x));
      const lag: number = ease(Math.max(0, 2 * x - 1));
      const a: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
        turnHumanPosture(from);
      const b: IAutoMovieMotionHumanTurnHumanPosture.ITurned =
        turnHumanPosture(to);
      const rising: boolean = b.position.y >= a.position.y;
      const up: number = rising ? lead : lag;
      const across: number = rising ? lag : lead;
      const w: number = up;
      const joints: IAutoMovieMotionHumanPosture["joints"] = {};
      for (const bone of new Set([
        ...Object.keys(from.joints),
        ...Object.keys(to.joints),
      ]) as Set<AutoMovieHumanoidBone>) {
        const a: readonly [number, number, number] = from.joints[bone] ?? [
          0, 0, 0,
        ];
        const b: readonly [number, number, number] = to.joints[bone] ?? [
          0, 0, 0,
        ];
        joints[bone] = [
          a[0] + (b[0] - a[0]) * w,
          a[1] + (b[1] - a[1]) * w,
          a[2] + (b[2] - a[2]) * w,
        ];
      }
      const turn: number = ((((to.yaw - from.yaw) % 360) + 540) % 360) - 180;
      const rotation: IAutoMovieQuaternion = Quaternion.slerp(
        a.rotation,
        b.rotation,
        w,
      );
      const blended: IAutoMovieMotionHumanPosture = {
        root: {
          x: a.position.x + (b.position.x - a.position.x) * across,
          y: a.position.y + (b.position.y - a.position.y) * up,
          z: a.position.z + (b.position.z - a.position.z) * across,
        },
        yaw: from.yaw + turn * w,
        pitch: from.pitch + (to.pitch - from.pitch) * w,
        roll: from.roll + (to.roll - from.roll) * w,
        joints,
        limbs: {},
      };
      return {
        ...blended,
        rotation: {
          about: blended.root,
          turn: Quaternion.multiply(
            rotation,
            Quaternion.inverse(resolveHumanPosture.heading(blended)),
          ),
        },
      };
    };
    // The carry's frozen posture over each phase is kept on knots
    // (`HumanCarriedLiftKnots`): one whole-posture fit a knot, not one a
    // displayed second, the knots as dense as the blend's own error bound
    // needs.
    const rising: HumanCarriedLiftKnots.ICourse = HumanCarriedLiftKnots.course(
      0,
      lift,
    );
    const lowering: HumanCarriedLiftKnots.ICourse =
      HumanCarriedLiftKnots.course(plan.duration - setDown, plan.duration);
    return {
      ...plan,
      events: [
        ...plan.events,
        { name: "lifted", share: lift / plan.duration },
        { name: "setDown", share: 1 - setDown / plan.duration },
      ],
      contacts: [
        ...plan.contacts.map(
          (
            window: IAutoMovieMotionHumanContactWindow,
          ): IAutoMovieMotionHumanContactWindow => ({
            ...window,
            from: Math.max(window.from, lift / plan.duration),
            to: Math.min(window.to, 1 - setDown / plan.duration),
          }),
        ),
        // No floor window inside a phase: the root rises from the lift's
        // first instant and reaches the floor only at the set-down's end, so
        // the feet are off the floor throughout both, and a plant there
        // would hold a foot the body has lifted.
      ],
      posture: (
        at: number,
        _channels?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[1],
        source?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[2],
        projection?: Parameters<IAutoMovieMotionHumanActionPlan["posture"]>[3],
      ): IAutoMovieMotionHumanPosture => {
        const resolution: ReturnType<typeof prepareHumanPoseResolution> =
          prepareHumanPoseResolution(source);
        // The carry's frozen posture at a second of a phase: its knot's own
        // where the phase keeps one, interpolated between knots elsewhere.
        const carried = (
          course: HumanCarriedLiftKnots.ICourse,
        ): HumanCarriedLiftKnots.IReading =>
          HumanCarriedLiftKnots.read(
            course,
            body,
            at,
            (seconds: number): IAutoMovieMotionHumanPosture =>
              GymnasticsFlight.frozen(
                body,
                plan.posture(seconds, undefined, resolution, projection),
                resolution,
                projection,
              ),
          );
        if (lift > 0 && at < lift) {
          const x: number = Math.max(0, at / lift);
          return x <= 0 ? entry : mix(stood, carried(rising).posture, x);
        }
        if (setDown > 0 && at > plan.duration - setDown) {
          const w: number = (at - (plan.duration - setDown)) / setDown;
          if (w <= 0)
            return plan.posture(at, undefined, resolution, projection);
          const reading: HumanCarriedLiftKnots.IReading = carried(lowering);
          return mix(
            reading.posture,
            {
              ...stood,
              root: { x: reading.root.x, y: stood.root.y, z: reading.root.z },
              yaw: HumanFrame.heading(reading.rotation),
            },
            w,
          );
        }
        return plan.posture(at, undefined, resolution, projection);
      },
    };
  }
}
