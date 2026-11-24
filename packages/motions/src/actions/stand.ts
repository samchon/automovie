import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieMotionHumanActionName,
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanEntryState,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStand,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanBound } from "../law/HumanBound";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import { prepareStand } from "./prepareStand";
import { prepareStandingLegs } from "./prepareStandingLegs";
import { standFeet } from "./standFeet";
import { standRelaxed } from "./standRelaxed";
import { standRoot } from "./standRoot";
import { standUpright } from "./standUpright";
import { standingLegs } from "./standingLegs";

/**
 * Quiet standing: both feet planted where they are (or under the hips when
 * entered from the air), the pelvis settling over them, the column upright on
 * the plumb line and inclined slightly forward at the ankles
 * ({@link standUpright}), arms hanging relaxed, and the body swaying slightly.
 *
 * The feet keep their entry plants so a stop never slides them; a foot that was
 * not planted lands at its rest place beside the other. The root moves from its
 * entry position to the midpoint of the feet over the first 0.5 s on a
 * minimum-jerk profile and sits 5 mm below full extension so the knees are not
 * locked. A planted foot keeps the heading it stands at, a flat sole turned on
 * the floor sliding across it; a foot set down turns out 7° from the heading,
 * the mean adult foot progression angle (Perry and Burnfield, Gait Analysis,
 * 2nd ed.). Arms hang relaxed (`relaxed`): 12° of elbow flexion, the hand in
 * its position of rest (`HumanHand.shape`, relaxed), and the least shoulder
 * abduction that hangs the hand beside the thigh, its digits clear of the body,
 * read on the stance the feet settle in (`standClearArms`), so a staggered or
 * wide stance kept from the entry hangs its arms clear of its own thighs.
 * Postural sway moves the root on two seeded smooth signals below 1 Hz, side to
 * side and front to back in the body's frame, with an RMS of 3 mm for an elite
 * and 4.8 mm for a novice: quiet-stance centre-of-pressure sway of healthy
 * adults is a few millimetres RMS (Prieto et al. 1996), and experts sway less
 * (Perrin et al. 2002, provisional factor 1.6); a given `sway` replaces that
 * RMS, and 0 stands still. The window of the noise keeps the start and the end
 * of the stand exact. A law acting with one side that stands on this law's body
 * passes that side (`plan`'s `side`): the side-to-side draw is signed in that
 * side's frame, so a left action's sway is the mirror of a right one's for
 * every seed, its statistics unchanged.
 */
export namespace stand {
  /** The action's name. */
  export const name: AutoMovieMotionHumanActionName = "stand";

  /** Cancel table: a stand can be cut anywhere. */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] = {
    any: [{ window: [0, 1], kind: "inertialize", entry: 0 }],
  };

  /**
   * What quiet standing lets an overlay take: the arms, the hands, the head and
   * the trunk's turn.
   */
  export const yields: IAutoMovieMotionHumanActionLaw["yields"] = [
    "head",
    "leftHand",
    "rightHand",
    "leftArm",
    "rightArm",
    "trunkTurn",
  ];

  /**
   * Plan a stand.
   *
   * @param context The action's context.
   * @param side The side of the law that stands on this body, whose frame the
   *   side-to-side sway is signed in: a left side's sway mirrors a right
   *   side's. The right when absent, as for a stand acting with no side.
   * @returns The plan.
   * @throws {HumanRefusal} When the seconds are not positive or the sway is
   *   negative.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
    side: AutoMovieHumanSide = "right",
  ): IAutoMovieMotionHumanActionPlan {
    const duration: number = context.params.hold ?? SECONDS;
    HumanBound.above("hold", duration, 0, "s");
    return prepare(context, side)(duration);
  }

  /**
   * Prepare fixed entry geometry for probe and final-duration standing plans;
   * each positive duration retains its own settle, sway and streams.
   */
  export function prepare(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStand.IParams>,
    side: AutoMovieHumanSide = "right",
  ): ReturnType<typeof prepareStand> {
    return prepareStand(context, side);
  }

  /** A stand's seconds when the author gives none (provisional). */
  export const SECONDS: number = 1.5;

  /**
   * Seconds the root takes to settle from its entry over the feet
   * (provisional).
   */
  export const SETTLE: number = 0.5;

  /**
   * An elite's quiet-stance sway, RMS metres: a few millimetres of
   * centre-of-pressure sway in healthy adults (Prieto et al. 1996), scaled up
   * for lesser skill by `HumanSkill.sway`.
   */
  export const SWAY: number = 0.003;

  /**
   * The highest frequency of the sway's smooth signals, hertz: quiet-stance
   * sway lies below 1 Hz (Prieto et al. 1996).
   */
  export const SWAY_FREQUENCY: number = 0.8;

  /** The relaxed hanging elbow's flexion, degrees (provisional). */
  export const ELBOW: number = 12;

  /**
   * Foot progression angle, degrees outward from the heading (Perry and
   * Burnfield).
   */
  export const TOE_OUT: number = 7;

  /**
   * A body's relaxed hanging arms, clinical degrees: 12 degrees of elbow
   * flexion, each hand in its position of rest (`HumanHand.shape`, relaxed),
   * and the least shoulder abduction at which those relaxed hands lie beside
   * the thighs, every digit clear of the rest of the body
   * (`HumanDigitFit.depth` no more than zero) in the quiet stance. The
   * abduction is found once per body by bisection between none and the
   * shoulder's range, the depth falling as the arm swings out, until the
   * bracket is no wider than the resolution to which a solver resolves a
   * joint's angle (`ROM_TOLERANCE`, the engine's range owner, as the limb fits
   * resolve theirs), and kept: a wider build hangs its arms wider.
   *
   * @param body The body.
   * @returns Angles for both arms and hands.
   */
  export function relaxed(
    body: IAutoMovieMotionHumanBody,
  ): Partial<Record<AutoMovieHumanoidBone, readonly [number, number, number]>> {
    return standRelaxed(body);
  }

  /**
   * The shoulder abduction a body's relaxed arms hang at, degrees (`relaxed`):
   * the one a swinging or raised arm keeps across the body.
   *
   * @param body The body.
   * @returns Degrees.
   */
  export function abduction(body: IAutoMovieMotionHumanBody): number {
    return relaxed(body).leftUpperArm![1];
  }

  /**
   * The bodiless relaxed table's shoulder abduction, degrees (provisional;
   * `relaxed` measures each body's).
   */
  const RELAXED_ABDUCTION: number = 5;

  /**
   * Relaxed hanging arms with no body, clinical degrees: 5 degrees of shoulder
   * abduction, 12 of elbow flexion and the hands at rest. Kept only for the
   * laws whose key tables do not yet take the body; each is moving to
   * `relaxed`, which hangs the arm clear of the body it belongs to, and this
   * goes with the last of them.
   */
  export const RELAXED: Partial<
    Record<AutoMovieHumanoidBone, readonly [number, number, number]>
  > = (() => {
    const out: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    > = {};
    for (const side of ["left", "right"] as const) {
      Object.assign(out, HumanHand.shape(side, "relaxed"));
      out[`${side}UpperArm`] = [0, RELAXED_ABDUCTION, 0];
      out[`${side}LowerArm`] = [ELBOW, 0, 0];
    }
    return out;
  })();

  /**
   * Quiet ankle targets: a planted foot flattened about its displayed bearing
   * socket; another foot at rest on the same measured floor. The world contact
   * stays fixed while the ankle follows its rocker.
   *
   * @param body The body.
   * @param entry The entry state.
   * @param yaw The heading, degrees.
   * @returns Ankle points, world metres.
   */
  export function feet(
    body: IAutoMovieMotionHumanBody,
    entry: IAutoMovieMotionHumanEntryState,
    yaw: number,
  ): Record<AutoMovieHumanSide, IAutoMovieVector3> {
    return standFeet(body, entry, yaw).flat;
  }

  /**
   * The root of a quiet stance over two ankle points: the pelvis over the
   * feet's midpoint as it stands over its rest feet, shifted forward by the
   * upright alignment's lean (`standUpright`), and `DROP` below its rest height
   * above the mean ankle plane so the planted legs are not at full extension,
   * and lowered where feet set wider or staggered than the rest feet would need
   * a hip farther from its ankle than the quiet stance's, so each leg spans its
   * foot with the quiet stance's knee. The single owner of standing root
   * placement: any law that ends or rests standing on its feet places its root
   * here.
   *
   * @param body The body.
   * @param feet Ankle points, world metres.
   * @param yaw The heading, degrees.
   * @returns The root, world metres.
   */
  export function root(
    body: IAutoMovieMotionHumanBody,
    feet: Readonly<Record<AutoMovieHumanSide, IAutoMovieVector3>>,
    yaw: number,
  ): IAutoMovieVector3 {
    return standRoot(body, feet, yaw, DROP);
  }

  /**
   * How far a quiet stance's root sits below its rest height, metres, keeping
   * the planted knees off full extension.
   */
  export const DROP: number = 0.005;

  /**
   * Planted leg goals on given ankle points, knees bending forward.
   *
   * @param body The body.
   * @param root The root, world metres.
   * @param yaw The heading, degrees.
   * @param feet Ankle points, world metres.
   * @returns The leg goals.
   */
  export function legs(
    body: IAutoMovieMotionHumanBody,
    root: IAutoMovieVector3,
    yaw: number,
    feet: Record<AutoMovieHumanSide, IAutoMovieVector3>,
  ): IAutoMovieMotionHumanPosture["limbs"] {
    return standingLegs(body, root, yaw, feet, TOE_OUT);
  }

  /**
   * Prepare the invariant foot rotations and contacts of this body's fixed
   * heading; roots and ankle points remain per-query world-metre inputs.
   */
  export function prepareLegs(
    body: IAutoMovieMotionHumanBody,
    yaw: number,
  ): ReturnType<typeof prepareStandingLegs> {
    return prepareStandingLegs(body, yaw, TOE_OUT);
  }

  /**
   * The standing posture of a body at a floor point and heading, the state
   * every performer starts from.
   *
   * @param body The body.
   * @param at The floor point under the body, world metres.
   * @param yaw The heading, degrees.
   * @returns The posture.
   */
  export function posture(
    body: IAutoMovieMotionHumanBody,
    at: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieMotionHumanPosture {
    return stance(body, at, yaw, relaxed(body));
  }

  /**
   * The standing posture of a body with given arms, as `posture` stands it.
   *
   * @param body The body.
   * @param at The floor point under the body, world metres.
   * @param yaw The heading, degrees.
   * @param arms The arms' and hands' angles, clinical degrees.
   * @returns The posture.
   */
  export function stance(
    body: IAutoMovieMotionHumanBody,
    at: IAutoMovieVector3,
    yaw: number,
    arms: Partial<
      Record<AutoMovieHumanoidBone, readonly [number, number, number]>
    >,
  ): IAutoMovieMotionHumanPosture {
    const frame: IAutoMovieMotionHumanFrame = { origin: at, yaw };
    const foot: (side: AutoMovieHumanSide) => IAutoMovieVector3 = (
      side: AutoMovieHumanSide,
    ): IAutoMovieVector3 => {
      const rest: IAutoMovieVector3 = body.rest.get(`${side}Foot`)!;
      return HumanFrame.point(frame, {
        x: rest.x,
        y: body.measure.ankleHeight,
        z: rest.z,
      });
    };
    const feet: Record<AutoMovieHumanSide, IAutoMovieVector3> = {
      left: foot("left"),
      right: foot("right"),
    };
    const placed: IAutoMovieVector3 = root(body, feet, yaw);
    return {
      root: placed,
      yaw,
      pitch: 0,
      roll: 0,
      joints: { ...arms, ...standUpright(body).joints },
      limbs: legs(body, placed, yaw, feet),
    };
  }

  /**
   * The stand a climb starts from, read at both ends: its first instant is the
   * entry the climb continues, its last the settled quiet stance, so a foot
   * entered on its rocker leaves the floor from where it is while the treads or
   * rungs repeat the settled flat feet.
   *
   * @template Params The climb's parameter type, which the stand replaces.
   * @param context The climb's context; its parameters are not read.
   * @returns The entry posture and both ends' foot placements.
   */
  export function footprints<Params>(
    context: IAutoMovieMotionHumanActionContext<Params>,
  ): IFootprints {
    const stood: IAutoMovieMotionHumanActionPlan = plan({
      ...context,
      params: { hold: 1 },
    });
    const standing: IAutoMovieMotionHumanPosture = stood.posture(0);
    const settled: IAutoMovieMotionHumanPosture = stood.posture(stood.duration);
    const placement: (
      posture: IAutoMovieMotionHumanPosture,
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      posture: IAutoMovieMotionHumanPosture,
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanFoot.IPlacement => {
      const goal: IAutoMovieHumanLimbGoal = posture.limbs[`${side}Leg`]!;
      return {
        ankle: goal.point,
        rotation: goal.rotation ?? HumanFrame.turn(posture.yaw),
      };
    };
    return {
      standing,
      entered: {
        left: placement(standing, "left"),
        right: placement(standing, "right"),
      },
      settled: {
        left: placement(settled, "left"),
        right: placement(settled, "right"),
      },
    };
  }

  /** The stand's two ends as a climb reads them (`footprints`). */
  export interface IFootprints {
    /** The stand's first instant: the entry the climb continues. */
    standing: IAutoMovieMotionHumanPosture;

    /** Each foot where the entry put it, world metres. */
    entered: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;

    /** Each foot flat in the settled quiet stance, world metres. */
    settled: Record<AutoMovieHumanSide, IAutoMovieMotionHumanFoot.IPlacement>;
  }
}
