import { AutoMovieEngineMath } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanWalkFacing,
  IAutoMovieMotionHumanWalkSteps,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { WalkPace } from "./WalkPace";
import { WalkPath } from "./WalkPath";
import { WalkTurn } from "./WalkTurn";
import { runStance } from "./runStance";
import { stand } from "./stand";
import { walkFoot } from "./walkFoot";
import { walkHeading } from "./walkHeading";
import { walkReach } from "./walkReach";
import { walkRoot } from "./walkRoot";
import { walkStepFoot } from "./walkStepFoot";
import { walkStepsFootprints } from "./walkStepsFootprints";
import { walkStepsPelvis } from "./walkStepsPelvis";
import { walkStepsTempo } from "./walkStepsTempo";
import { walkStride } from "./walkStride";

/**
 * The footstep plan of a walk: footprints, their heel-strike and toe-off times,
 * each foot's scheduled stance, and the pelvis path, all as closed functions of
 * seconds.
 *
 * Footprints lie along the path from the feet's midpoint through the `via`
 * points to the destination, at least two steps whenever there is a way to go.
 * Each lies where the pelvis is `front` step periods after its heel strike, so
 * the footprints are one even step, at most `longest`, apart in full stride and
 * closer while the pelvis gathers and sheds its speed, and no landing is
 * further ahead of the pelvis than in full stride. Each is turned to the path's
 * heading averaged over one step so a corner is taken over a step, alternately
 * half a step width to either side (the gait's `width`, else `WIDTH`; a run
 * passes its swing share, mid-swing lift and vertical oscillation), the foot
 * behind stepping first and the last two ending at the body's rest separation,
 * facing `face` when given: the two footfalls before the closing pair turn a
 * third and two thirds of the way, a stepping turn, and the closing pair faces
 * the arrival. A walk setting off away from the way it faces turns about over
 * its first footfalls, each foot turning no more per swing than in a standing
 * turn, and a footprint leans its leg no further than the ankle holds
 * (`walkHeading`). The pelvis's heading follows the footprints (`WalkTurn`): at
 * each heel strike it faces midway between the two feet it stands on, so no
 * foot needs more hip rotation than the hip's range. `WalkPace` owns the
 * timing: each step's heel strike comes one step period after the previous; its
 * toe-off one swing (0.8 step periods, 40 % of a stride) before its heel
 * strike; the first toe-off comes after the gait's initiation. `walkFoot` owns
 * the rockers of each stance, toes-down by up to 55° at toe-off.
 *
 * With `facing` (`walkFacing.IFacing`), the footprints and the pelvis face it
 * while the footprints still lie along the path: a walk backward, aside or
 * round a target, the side offset taken across the facing.
 *
 * The plan's root is the unconstrained pelvis path; `walkReach` then makes
 * every foot goal reachable on the actual pelvis.
 */
export namespace walkSteps {
  /** One footfall (walkStepFoot.IStep). */

  /** The chosen opening foot and any setup turn before forward travel. */
  export interface IOpening {
    /** The foot that takes the first step. */
    lead: AutoMovieHumanSide;

    /** Number of opening steps taken before forward travel. */
    turning: number;

    /** Time spent in the opening turn, on the stepping clock. */
    seconds: number;
  }

  /** The stream a take's tempo is drawn from (walkStepsTempo). */
  export const tempo: typeof walkStepsTempo = walkStepsTempo;

  /**
   * The step width of a gait that names none, hip heights: 0.1, about 9 cm,
   * inside the 7 to 12 cm of normal adult gait (Perry and Burnfield).
   */
  export const WIDTH: number = 0.1;
  /** The record of `IPlanResult`'s site. */
  type IPlanResult = { opening: IOpening };

  /**
   * Plan the footsteps of a walk.
   *
   * @param input The body, its entry state, the destination, the speed, the
   *   longest step and the period law.
   * @param opening The fixed opening of a timed course when refitting its
   *   arrival.
   * @returns The plan.
   */
  export function plan(
    input: IAutoMovieMotionHumanWalkSteps.IInput,
    opening?: IOpening,
  ): IAutoMovieMotionHumanWalkSteps.IPlan & IPlanResult {
    const body: IAutoMovieMotionHumanBody = input.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const l: number = m.hipHeight;
    const yaw0: number = input.entry.posture.yaw;
    const flatten: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanFoot.IPlacement => ({
      ankle: { ...input.entry.feet[side].ankle, y: m.ankleHeight },
      rotation: HumanFoot.rotation(
        HumanFoot.heading(input.entry.feet[side].rotation),
        0,
      ),
    });
    const start: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = {
      left: flatten("left"),
      right: flatten("right"),
    };
    const S: IAutoMovieVector3 = {
      x: (start.left.ankle.x + start.right.ankle.x) / 2,
      y: 0,
      z: (start.left.ankle.z + start.right.ankle.z) / 2,
    };
    const facing: IAutoMovieMotionHumanWalkFacing.IFacing | undefined =
      input.facing;
    const placement: IAutoMovieVector3 = input.entry.posture.root;
    const floorOf = (side: AutoMovieHumanSide): IAutoMovieVector3 => {
      const goal: IAutoMovieVector3 =
        input.entry.posture.limbs[`${side}Leg`]?.point ?? start[side].ankle;
      const offset: IAutoMovieVector3 = HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: yaw0 },
        body.rest.get(`${side}Foot`)!,
      );
      return { x: goal.x - offset.x, y: 0, z: goal.z - offset.z };
    };
    const leftFloor: IAutoMovieVector3 = floorOf("left");
    const rightFloor: IAutoMovieVector3 = floorOf("right");
    const roundoff: number =
      Math.sqrt(Number.EPSILON) *
      Math.max(body.measure.stature, Math.hypot(placement.x, placement.z));
    const inPlace: boolean =
      (input.swing ?? 0.8) <= 1 &&
      input.face !== undefined &&
      facing === undefined &&
      (input.via?.length ?? 0) === 0 &&
      ((input.to.x === placement.x && input.to.z === placement.z) ||
        // The scene places a standing body by its footprint datum; the
        // quiet alignment can translate the pelvis relative to that datum.
        Math.hypot(
          input.to.x - (leftFloor.x + rightFloor.x) / 2,
          input.to.z - (leftFloor.z + rightFloor.z) / 2,
        ) <= roundoff);
    const path: WalkPath = new WalkPath(
      (inPlace ? [S, S] : [S, ...(input.via ?? []), input.to]).map(
        (p: IAutoMovieVector3): IAutoMovieVector3 => ({ x: p.x, y: 0, z: p.z }),
      ),
    );
    const D: number = path.length;
    // A flight gait's contact rolls from the heel to the ball, or stays on
    // the ball of a foot whose heel is held up; the middle of that way lies
    // ahead of the ankle.
    const raised: number = input.gait?.heels ?? 0;
    const rolled: number =
      raised > 0
        ? HumanFoot.offset(body, "left", "mtp").z
        : (HumanFoot.offset(body, "left", "heel").z +
            HumanFoot.offset(body, "left", "mtp").z) /
          2;
    // A gait entered moving (a run out of a hurdle clearance) keeps the
    // pelvis's horizontal speed along the way's opening direction.
    const ahead: IAutoMovieVector3 = path.at(Math.min(D, WalkPace.FLOOR));
    const reach: number = Math.hypot(ahead.x - S.x, ahead.z - S.z);
    const entrySpeed: number =
      reach > 0
        ? Math.max(
            0,
            (input.entry.velocity.linear.x * (ahead.x - S.x) +
              input.entry.velocity.linear.z * (ahead.z - S.z)) /
              reach,
          )
        : 0;
    // A foot entered in the air while the other stands is entered in stride (`walkStride`).
    const airborne: AutoMovieHumanSide | undefined = walkStride.airborne(
      input.entry,
    );
    const inherited: walkStride.IFlight | undefined = walkStride.flight(
      input.entry,
    );
    const pace: WalkPace = walkStride.pace(
      {
        ...input,
        distance: D,
        share: input.swing ?? 0.8,
        period: (seconds: number): number => input.period(seconds),
        lead: rolled,
        entrySpeed,
      },
      input.longest,
      input.entry,
      reach > 0
        ? { x: (ahead.x - S.x) / reach, y: 0, z: (ahead.z - S.z) / reach }
        : undefined,
      inherited,
    );
    const delta: number = D / pace.steps;
    // The equivalent of an angle nearest a reference heading, so the headings
    // read along the path never jump by a full turn between footprints.
    const unwrap: (angle: number, near: number) => number = (
      angle: number,
      near: number,
    ): number => near + AutoMovieEngineMath.wrapDegrees(angle - near);
    const heading: number =
      D < 1e-6 ? yaw0 : unwrap(path.heading(0, delta / 2), yaw0);
    const along$: (s: number) => number = (s: number): number =>
      D < 1e-6 ? heading : unwrap(path.heading(s, delta / 2), heading);
    // The heading faced at a floor point, nearest the starting heading.
    const faced$: (at: IAutoMovieVector3) => number = (
      at: IAutoMovieVector3,
    ): number =>
      facing === undefined
        ? NaN
        : unwrap(
            "yaw" in facing
              ? facing.yaw
              : (Math.atan2(facing.toward.x - at.x, facing.toward.z - at.z) *
                  180) /
                  Math.PI +
                  (facing.turn ?? 0),
            yaw0,
          );
    const ending: number =
      facing === undefined
        ? unwrap(
            input.face ?? (D < 1e-6 ? heading : path.heading(D, delta / 2)),
            along$(D),
          )
        : unwrap(input.face ?? faced$(path.at(D)), yaw0);
    const frame: IAutoMovieMotionHumanFrame = { origin: S, yaw: heading };
    const along: (side: AutoMovieHumanSide) => number = (
      side: AutoMovieHumanSide,
    ): number => HumanFrame.local(frame, start[side].ankle).z;
    const half: number = ((input.gait?.width ?? WIDTH) / 2) * l;
    const restWidth: Record<AutoMovieHumanSide, number> = {
      left: Math.abs(body.rest.get("leftFoot")!.x),
      right: Math.abs(body.rest.get("rightFoot")!.x),
    };
    const hipWidth: Record<AutoMovieHumanSide, number> = {
      left: Math.abs(body.rest.get("leftUpperLeg")!.x),
      right: Math.abs(body.rest.get("rightUpperLeg")!.x),
    };
    const rest: (side: AutoMovieHumanSide) => number = (
      side: AutoMovieHumanSide,
    ): number => restWidth[side];
    const T: number = pace.period;
    const swing: number = pace.swing;
    const first: number = pace.first;
    // A walk setting off further from its facing than a foot turns in a
    // swing first turns about in place, and the pelvis sets off after those
    // footfalls at the same cadence (`walkHeading.opening`).
    const facings: Record<AutoMovieHumanSide, number> = {
      left: HumanFoot.heading(start.left.rotation) - stand.TOE_OUT,
      right: HumanFoot.heading(start.right.rotation) + stand.TOE_OUT,
    };
    // The foot behind sets off, unless its first footprint would cross the
    // standing foot (`walkHeading.uncrossed`): then the inside foot steps
    // first and the walk turns in place before it sets off.
    const behind: AutoMovieHumanSide =
      along("left") < along("right") - 1e-6 ? "left" : "right";
    const lead: AutoMovieHumanSide =
      inherited?.side ??
      opening?.lead ??
      airborne ??
      (inPlace
        ? ending >= yaw0
          ? "left"
          : "right"
        : walkHeading.uncrossed(
            behind,
            { left: start.left.ankle, right: start.right.ankle },
            facings,
            path.at(Math.min(D, pace.progress(first + swing + pace.front * T))),
            heading,
            half,
          ));
    const turning: number =
      (inherited === undefined ? opening?.turning : 0) ??
      (facing === undefined
        ? walkHeading.opening(
            heading,
            lead,
            facings,
            yaw0,
            walkReach.TWIST,
            !inPlace && lead !== behind,
          )
        : 0);
    // In a step turn the turning foot moves first, then the other replaces
    // it at the new heading (Hase and Stein 1999). Adjacent flat footprints
    // differ by at most one hip's usable twist after both feet's toe-out,
    // so a support need not spin to make the next step; a gait that turns by
    // shorter steps takes its share of that.
    const turnStep: number =
      (walkReach.TWIST - stand.TOE_OUT) * (input.gait?.turn ?? 1);
    const arrival: number =
      inPlace || facing !== undefined ? 0 : ending - along$(D);
    const closing: number = walkHeading.closing(arrival, turnStep);

    // Each of the two travelling footfalls before the closing pair can take
    // one supported turn. A larger rotation needs steps around the standing
    // foot at arrival to keep the closing pair from crossing. A station
    // sets its own travel clock.
    const turnAtArrival: boolean =
      closing > walkHeading.CLOSING ||
      (input.travel === undefined &&
        swing < T &&
        Math.abs(arrival) > (walkHeading.CLOSING - 1) * turnStep);

    // A walk facing off its entry turns by at most one step turn per footfall.
    const extra: number =
      facing !== undefined
        ? Math.max(
            0,
            Math.ceil(Math.abs(ending - yaw0) / turnStep) -
              pace.steps -
              turning,
          )
        : turnAtArrival
          ? closing
          : 0;
    const n: number = inPlace
      ? Math.max(1, Math.ceil(Math.abs(ending - yaw0) / turnStep))
      : pace.steps + turning + extra;
    const lag: number = turning * T;
    const last: number = inPlace
      ? first + swing + n * T
      : pace.last + lag + extra * T;
    const front: number = pace.front;
    // The stop is made over the final step (`walkRoot`): the take arrives
    // once the closing foot has accepted the weight, its loading response
    // (`walkRoot.LOADING`), and a foot held on its ball has settled its heel
    // (`walkFoot.RISE`), whichever is later.
    const duration: number =
      last + Math.max(walkRoot.LOADING * 2 * T, raised > 0 ? walkFoot.RISE : 0);
    const progress: (t: number) => number = (t: number): number =>
      pace.progress(t - lag);
    const flight: runStance.IStance | undefined =
      swing > T
        ? runStance.plan(body, {
            stride: pace.stride,
            share: swing / T,
            front,
            lead: rolled,
            heels: raised,
          })
        : undefined;

    // A footprint lies where the pelvis is `front` periods after its heel
    // strike, one cruising step from the last in full stride and closer in
    // the ramps, so a landing is never further ahead of the pelvis than in
    // full stride; the closing pair lies at the destination.
    const place: (j: number) => number = (j: number): number =>
      j >= n
        ? D
        : Math.min(D, progress(first + swing + (j - 1) * T + front * T));

    // The `closing` footfalls turn by equal shares, a third and two thirds
    // for an ordinary arrival; the pair faces the arrival. A walk that sets off away from its facing turns
    // about over its first footfalls, each foot as far as a swing turns it.
    const asked: number[] = Array.from(
      { length: n + 1 },
      (_: unknown, i: number): number => {
        const d: number = place(i + 1);
        if (inPlace) return yaw0 + (ending - yaw0) * Math.min(1, (i + 1) / n);
        if (facing !== undefined)
          return walkHeading.capped(
            yaw0,
            i >= n - 1 ? ending : faced$(path.at(d)),
            turnStep * (i + 1),
          );
        if (i >= n - 1) return ending;
        const along: number = along$(d);
        return i >= n - closing
          ? along + ((ending - along) * (i - n + closing + 1)) / closing
          : along;
      },
    );
    const towards: number[] =
      inPlace || facing !== undefined
        ? asked
        : walkHeading.about(asked, lead, facings, yaw0, 2);
    const towardAt: (j: number) => number = (j: number): number =>
      towards[j - 1]!;

    const { steps, knots, turnedAt }: walkStepsFootprints.IFootprints =
      walkStepsFootprints({
        body,
        m,
        path,
        facing,
        inPlace,
        airborne,
        doubleFlight: inherited !== undefined,
        landing: inherited?.landing,
        yaw0,
        lead,
        n,
        turning,
        extra,
        first,
        swing,
        T,
        half,
        hipWidth,
        rest,
        place,
        progress,
        along$,
        towardAt,
      });
    const turn: WalkTurn = new WalkTurn(knots);
    const yawAt: (t: number) => number = (t: number): number => turn.at(t);
    const { events, stances }: ReturnType<typeof walkStepFoot.windows> =
      walkStepFoot.windows(steps, last, duration);

    const { firstLeft, own, foot, root, amount }: walkStepsPelvis.IPelvis =
      walkStepsPelvis({
        input,
        body,
        start,
        placement,
        path,
        pace,
        flight,
        facing,
        inPlace,
        raised,
        steps,
        doubleFlight: inherited !== undefined,
        yawAt,
        T,
        swing,
        lag,
        first,
        last,
        front,
        progress,
        along$,
        faced$,
      });
    return {
      duration,
      opening: { lead, turning, seconds: lag },
      events,
      stances: stances.map(
        (
          s: IAutoMovieMotionHumanWalkSteps.IStance,
        ): IAutoMovieMotionHumanWalkSteps.IStance =>
          turnedAt.has(s.from) ? { ...s, inPlace: true } : s,
      ),
      root,
      yaw: yawAt,
      // The stride's phase, a quarter at the first left heel strike, where
      // `sin(2 pi phase)` peaks: the arms are swung furthest, opposite the
      // legs, as the left leg lands ahead.
      phase: (t: number): number => (t - firstLeft) / (2 * T) + 0.25,
      amount,
      foot,
      inPlace,
      lastLanding: {
        left: own.left.at(-1)?.heelStrike ?? -Infinity,
        right: own.right.at(-1)?.heelStrike ?? -Infinity,
      },
    };
  }
}
