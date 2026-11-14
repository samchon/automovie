import {
  type IAutoMovieRandom,
  minimumJerk,
  wrapDegrees,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import type { IHumanEntryState } from "../law/IHumanEntryState";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanSkill } from "../skill/HumanSkill";
import type { IWalkGait } from "./IWalkGait";
import { WalkPace } from "./WalkPace";
import { WalkPath } from "./WalkPath";
import { WalkTurn } from "./WalkTurn";
import { runStance } from "./runStance";
import { stand } from "./stand";
import type { walkFacing } from "./walkFacing";
import { walkFoot } from "./walkFoot";
import { walkHeading } from "./walkHeading";
import { walkReach } from "./walkReach";
import { walkStepFoot } from "./walkStepFoot";

/**
 * The footstep plan of a walk: footprints, their heel-strike and toe-off
 * times, each foot's scheduled stance, and the pelvis path, all as closed
 * functions of seconds.
 *
 * Footprints lie along the path from the feet's midpoint through the `via`
 * points to the destination, at least two steps whenever there is a way to
 * go. Each lies where the pelvis is `front` step periods after its heel
 * strike, so the footprints are one even step, at most `longest`, apart in
 * full stride and closer while the pelvis gathers and sheds its speed, and no
 * landing is further ahead of the pelvis than in full stride. Each is turned
 * to the path's heading averaged over one step so a corner is taken over a
 * step, alternately half a step width to either side (step width 0.1 hip
 * heights, about 9 cm, inside the 7 to 12 cm of normal adult gait, Perry and
 * Burnfield; a run passes its swing share, mid-swing lift and vertical
 * oscillation), the foot behind stepping first and the last two ending at
 * the body's rest separation, facing `face` when given: the two footfalls
 * before the closing pair turn a third and two thirds of the way, a stepping
 * turn, and the closing pair faces the arrival. A walk setting off away from
 * the way it faces turns about over its first footfalls, each foot turning
 * no more per swing than in a standing turn, and a footprint leans its leg
 * no further than the ankle holds (`walkHeading`). The pelvis's heading
 * follows the footprints (`WalkTurn`): at each heel strike it faces midway
 * between the two feet it stands on, so no foot needs more hip rotation than
 * the hip's range.
 * `WalkPace` owns the timing: each step's heel strike comes one step period
 * after the previous; its toe-off one swing (0.8 step periods, 40 % of a
 * stride) before its heel strike; the first toe-off comes after the gait's
 * initiation. `walkFoot` owns the rockers of each stance, toes-down by up to
 * 55° at toe-off.
 *
 * With `facing` (`walkFacing.IFacing`), the footprints and the pelvis face it
 * while the footprints still lie along the path: a walk backward, aside or
 * round a target, the side offset taken across the facing.
 *
 * The plan's root is the unconstrained pelvis path; `walkReach` then makes
 * every foot goal reachable on the actual pelvis.
 */
export namespace walkSteps {
  /** Planner input. */
  export interface IInput {
    /** The body. */
    body: IHumanBody;

    /** The state the walk starts from. */
    entry: IHumanEntryState;

    /** The destination floor point, world metres. */
    to: IAutoMovieVector3;

    /** Floor points passed in order before the destination, world metres. */
    via?: readonly IAutoMovieVector3[];

    /** The heading at arrival, degrees; the last leg's direction when absent. */
    face?: number;

    /** Which way the body faces while it walks; along the path when absent. */
    facing?: walkFacing.IFacing;

    /** Walking speed, m/s. */
    speed: number;

    /** The longest step, metres. */
    longest: number;

    /** The realised step period for a planned one, seconds (timing variability). */
    period(seconds: number): number;

    /** Swing duration in step periods; 0.8 (a walk's 40 % of the stride) when absent, above 1 for a run's flight. */
    swing?: number;

    /** What the plan reads of the gait beyond its timing: its vertical oscillation in hip heights (the mean drop and the amplitude, lowest at mid-stance; a walk's when absent) and how far it holds the heels off the floor, degrees (flat when absent). */
    gait?: Pick<IWalkGait, "bob" | "heels" | "stiff">;
  }

  /** The plan. */
  export interface IPlan {
    /** Seconds. */
    duration: number;

    /** Named instants in seconds. */
    events: { name: string; seconds: number }[];

    /** Stance spans per foot, seconds. */
    stances: { side: "left" | "right"; from: number; to: number }[];

    /** The rig origin before `reach`, world metres. */
    root(seconds: number): IAutoMovieVector3;

    /** The heading, degrees. */
    yaw(seconds: number): number;

    /** Stride phase: 0.25 at a left heel strike, one per stride. */
    phase(seconds: number): number;

    /** How much the body is walking, 0 standing to 1 in full stride. */
    amount(seconds: number): number;

    /** A foot's scheduled stance at an instant. */
    foot(side: "left" | "right", seconds: number): walkFoot.IScheduled;
  }

  /** One footfall (walkStepFoot.IStep). */
  type IStep = walkStepFoot.IStep;

  /**
   * The stream a take's tempo is drawn from: one per performer and per
   * occurrence of the action in their chain, keyed as a walk whatever the
   * gait is called. A style is the walk with a manner, so a stroll, a sad or
   * a proud walk and the neutral walk in the same place of the same chain
   * under one seed draw the same tempo, and differ only by their style.
   *
   * @param context The action's skill, subject and occurrence.
   * @returns The stream.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is drawn, what keys it and why a style shares the walk's draw.
   * @evidence contracts/development/implementation.md#principled-implementation A draw keyed by stable identities (seed, performer, occurrence), so adding or renaming a style leaves every other take's tempo unchanged.
   * @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The occurrence is the action's own ordinal among its name's uses in the chain, so the first stroll pairs with the first walk of a chain written with a walk in its place.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function tempo(
    context: Pick<IHumanActionContext, "skill" | "subject" | "series">,
  ): IAutoMovieRandom {
    return HumanSkill.stream(
      context.skill,
      context.subject,
      "walk",
      context.series("period").index,
      "period",
    );
  }

  /**
   * Plan the footsteps of a walk.
   *
   * @param input The body, its entry state, the destination, the speed, the longest step and the period law.
   * @returns The plan.
   */
  export function plan(input: IInput): IPlan {
    const { body } = input;
    const m = body.measure;
    const l: number = m.hipHeight;
    const yaw0: number = input.entry.posture.yaw;
    const flatten = (side: "left" | "right"): HumanFoot.IPlacement => ({
      ankle: { ...input.entry.feet[side].ankle, y: m.ankleHeight },
      rotation: HumanFoot.rotation(
        HumanFoot.heading(input.entry.feet[side].rotation),
        0,
      ),
    });
    const start: Record<"left" | "right", HumanFoot.IPlacement> = {
      left: flatten("left"),
      right: flatten("right"),
    };
    const S: IAutoMovieVector3 = {
      x: (start.left.ankle.x + start.right.ankle.x) / 2,
      y: 0,
      z: (start.left.ankle.z + start.right.ankle.z) / 2,
    };
    const path: WalkPath = new WalkPath(
      [S, ...(input.via ?? []), input.to].map(
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
    const pace: WalkPace = WalkPace.fit(
      {
        distance: D,
        speed: input.speed,
        share: input.swing ?? 0.8,
        period: (seconds: number): number => input.period(seconds),
        lead: rolled,
      },
      input.longest,
    );
    const delta: number = D / pace.steps;
    // The equivalent of an angle nearest a reference heading, so the headings
    // read along the path never jump by a full turn between footprints.
    const unwrap = (angle: number, near: number): number =>
      near + wrapDegrees(angle - near);
    const heading: number =
      D < 1e-6 ? yaw0 : unwrap(path.heading(0, delta / 2), yaw0);
    const along$ = (s: number): number =>
      D < 1e-6 ? heading : unwrap(path.heading(s, delta / 2), heading);
    // The heading faced at a floor point, nearest the starting heading.
    const facing: walkFacing.IFacing | undefined = input.facing;
    const faced$ = (at: IAutoMovieVector3): number =>
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
    const frame: HumanFrame.IFrame = { origin: S, yaw: heading };
    const along = (side: "left" | "right"): number =>
      HumanFrame.local(frame, start[side].ankle).z;
    const lead: "left" | "right" =
      along("left") < along("right") - 1e-6 ? "left" : "right";
    const half: number = 0.05 * l;
    const rest = (side: "left" | "right"): number =>
      Math.abs(body.rest.get(`${side}Foot`)!.x);
    const T: number = pace.period;
    const swing: number = pace.swing;
    const first: number = WalkPace.FIRST;
    // A walk setting off further from its facing than a foot turns in a
    // swing first turns about in place, and the pelvis sets off after those
    // footfalls at the same cadence (`walkHeading.opening`).
    const facings: Record<"left" | "right", number> = {
      left: HumanFoot.heading(start.left.rotation) - stand.TOE_OUT,
      right: HumanFoot.heading(start.right.rotation) + stand.TOE_OUT,
    };
    const turning: number =
      facing === undefined
        ? walkHeading.opening(heading, lead, facings, yaw0, walkReach.TWIST)
        : 0;
    const n: number = pace.steps + turning;
    const lag: number = turning * T;
    const last: number = pace.last + lag;
    const front: number = pace.front;
    const duration: number = last + 0.35;
    const progress = (t: number): number => pace.progress(t - lag);
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
    const place = (j: number): number =>
      j >= n
        ? D
        : Math.min(D, progress(first + swing + (j - 1) * T + front * T));

    // The footfalls before the closing pair turn a third and two thirds; the
    // pair faces the arrival. A walk that sets off away from its facing turns
    // about over its first footfalls, each foot as far as a swing turns it.
    const asked: number[] = Array.from(
      { length: n + 1 },
      (_: unknown, i: number): number => {
        const d: number = place(i + 1);
        if (facing !== undefined)
          return i >= n - 1 ? ending : faced$(path.at(d));
        return i >= n - 1
          ? ending
          : i >= n - 3
            ? along$(d) + ((ending - along$(d)) * (i - n + 4)) / 3
            : along$(d);
      },
    );
    const towards: number[] =
      facing !== undefined
        ? asked
        : walkHeading.about(asked, lead, facings, yaw0, 2);
    const towardAt = (j: number): number => towards[j - 1]!;

    // The footprints, and the pelvis's heading at each heel strike: midway
    // between the facings of the two feet it then stands on.
    const leeway: number =
      Math.tan((walkHeading.ROLL * Math.PI) / 180) *
      (m.hipHeight - m.ankleHeight);
    const steps: IStep[] = [];
    const knots: { seconds: number; yaw: number }[] = [
      { seconds: 0, yaw: yaw0 },
    ];
    let faced: number = yaw0;
    for (let j: number = 1; j <= n + 1; j++) {
      const side: "left" | "right" =
        j % 2 === 1 ? lead : lead === "left" ? "right" : "left";
      const heelStrike: number = first + swing + (j - 1) * T;
      const toeOut: number = side === "left" ? stand.TOE_OUT : -stand.TOE_OUT;
      // Going aside, the feet keep their rest separation and never cross.
      const aside: number =
        facing === undefined
          ? 0
          : Math.sin(((along$(place(j)) - towardAt(j)) * Math.PI) / 180) ** 2;
      const lateral: number =
        (side === "left" ? 1 : -1) *
        (j >= n || j <= turning
          ? rest(side)
          : half + (rest(side) - half) * aside);
      const toward: number = towardAt(j);
      const point: IAutoMovieVector3 = HumanFrame.point(
        { origin: path.at(place(j)), yaw: toward },
        { x: lateral, y: m.ankleHeight, z: 0 },
      );
      // A footprint the pelvis leaves behind leans its leg no further than
      // the ankle holds when the foot lifts, at the toe-off two footfalls on,
      // the hip then being furthest past it and the pelvis facing between
      // this footprint and the next; a hip behind a foot walking a way it
      // does not face leans the leg the other way.
      const footHeading: number =
        j < n
          ? walkHeading.leaned(
              toward + toeOut,
              point,
              HumanFrame.point(
                {
                  origin: path.at(progress(first + (j + 1) * T)),
                  yaw: (toward + towardAt(j + 1)) / 2,
                },
                {
                  x:
                    (side === "left" ? 1 : -1) *
                    Math.abs(body.rest.get(`${side}UpperLeg`)!.x),
                  y: 0,
                  z: 0,
                },
              ),
              leeway,
              facing !== undefined,
            )
          : toward + toeOut;
      steps.push({
        side,
        heelStrike,
        toeOff: heelStrike - swing,
        flat: { ankle: point, rotation: HumanFoot.rotation(footHeading, 0) },
        heading: footHeading,
        push: -walkStepFoot.PUSH,
        // Going more than 120 degrees from its facing, a foot steps backward.
        ...(facing !== undefined &&
        Math.cos(((along$(place(j)) - toward) * Math.PI) / 180) < -0.5
          ? { backward: true }
          : {}),
      });
      knots.push({
        seconds: heelStrike,
        yaw: (faced + footHeading - toeOut) / 2,
      });
      faced = footHeading - toeOut;
    }
    const turn: WalkTurn = new WalkTurn(knots);
    const yawAt = (t: number): number => turn.at(t);
    const { events, stances } = walkStepFoot.windows(steps, last, duration);

    // The pelvis: progression with smooth start and stop, sway and bob.
    const firstLeft: number = steps.find(
      (s: IStep): boolean => s.side === "left",
    )!.heelStrike;
    const ramp = (t: number): number => {
      const up: number = minimumJerk((t - lag) / (first + T)).s;
      const down: number =
        1 -
        minimumJerk(
          (t - steps.at(-2)!.heelStrike) /
            (last + 0.2 - steps.at(-2)!.heelStrike),
        ).s;
      return Math.min(up, down);
    };
    const rootStart: IAutoMovieVector3 = input.entry.posture.root;
    const centre = (yaw: number): IAutoMovieVector3 => {
      const a: IAutoMovieVector3 = body.rest.get("leftFoot")!;
      const b: IAutoMovieVector3 = body.rest.get("rightFoot")!;
      return HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw },
        { x: (a.x + b.x) / 2, y: 0, z: (a.z + b.z) / 2 },
      );
    };
    const amount = (t: number): number => Math.max(0, Math.min(1, ramp(t)));
    // A flight gait's straight push is its stance's own (`runStance`).
    walkStepFoot.pushed(
      steps,
      start,
      yawAt,
      flight?.push ?? walkStepFoot.PUSH,
      input.gait?.stiff,
    );
    const gaitBob: { mean: number; amplitude: number } | undefined =
      flight?.bob ?? input.gait?.bob;
    const own: Record<"left" | "right", IStep[]> = {
      left: steps.filter((s: IStep): boolean => s.side === "left"),
      right: steps.filter((s: IStep): boolean => s.side === "right"),
    };
    const schedules: Record<
      "left" | "right",
      (t: number) => walkFoot.IScheduled
    > = {
      left: walkStepFoot.schedule(body, "left", start.left, own.left, raised),
      right: walkStepFoot.schedule(
        body,
        "right",
        start.right,
        own.right,
        raised,
      ),
    };
    const foot = (side: "left" | "right", t: number): walkFoot.IScheduled =>
      schedules[side](t);
    const planned = (t: number): IAutoMovieVector3 => {
      const yaw: number = yawAt(t);
      const c: IAutoMovieVector3 = centre(yaw);
      const a: number = amount(t);
      // The pelvis is over the left footprint `front` periods after its heel
      // strike; a gait's own oscillation is lowest at mid-stance.
      const over: number = firstLeft + front * T;
      const middle: number = firstLeft + (T - swing / 2);
      const sway: number =
        0.02 * (l / 0.93) * a * Math.cos((2 * Math.PI * (t - over)) / (2 * T));
      const bob: number =
        gaitBob === undefined
          ? a * (-0.015 + 0.025 * Math.cos((2 * Math.PI * (t - over)) / T))
          : a *
            l *
            (gaitBob.mean -
              gaitBob.amplitude * Math.cos((2 * Math.PI * (t - middle)) / T));
      const s: number = progress(t);
      const p: IAutoMovieVector3 = HumanFrame.point(
        {
          origin: path.at(s),
          yaw: facing === undefined ? along$(s) : faced$(path.at(s)),
        },
        { x: sway, y: 0, z: 0 },
      );
      return { x: p.x - c.x, y: -0.005 + bob, z: p.z - c.z };
    };
    const offset: IAutoMovieVector3 = {
      x: rootStart.x - planned(0).x,
      y: rootStart.y - planned(0).y,
      z: rootStart.z - planned(0).z,
    };
    const root = (t: number): IAutoMovieVector3 => {
      const fade: number = 1 - minimumJerk(t / 0.3).s;
      const p: IAutoMovieVector3 = planned(t);
      return {
        x: p.x + offset.x * fade,
        y: p.y + offset.y * fade,
        z: p.z + offset.z * fade,
      };
    };
    return {
      duration,
      events,
      stances,
      root,
      yaw: yawAt,
      phase: (t: number): number => (t - firstLeft) / (2 * T) + 0.25,
      amount,
      foot,
    };
  }
}
