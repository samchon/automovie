import { wrapDegrees } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanBody,
  AutoMovieHumanSide,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanFrame,
  IAutoMovieMotionHumanWalkFacing,
  IAutoMovieMotionHumanWalkFoot,
  IAutoMovieMotionHumanWalkSteps,
  IAutoMovieRandom,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanSkill } from "../skill/HumanSkill";
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

  /** One footfall (walkStepFoot.IStep). */
  type IStep = walkStepFoot.IStep;

  /** Heading knots of the turn, in action seconds and unwrapped degrees. */
  interface IHeading {
    /** Action seconds. */
    seconds: number;

    /** Pelvis heading in degrees. */
    yaw: number;
  }

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
    context: Pick<IAutoMovieMotionHumanActionContext, "skill" | "subject" | "series">,
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation The namespace defines measured footprint geometry, timing and turning; input members name their body/path/time units and the returned plan exposes root/foot/phase readers.
   * @evidence contracts/development/implementation.md#principled-implementation `WalkPace` timing and the flight stance (`runStance`), the footprint, turn and ankle-lean rules the namespace states, the closing pair, and the shared gait root (`walkRoot`) and stance (`walkStepFoot`) owners; an opening or closing stance's rockers take their shares of the cruising stance, two periods less a swing.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Fixed path/body geometry precedes timing, requested/bounded footprint headings, step records, per-side schedules and the unconstrained root.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Every step, corner, timing draw, bound, opening turn and endpoint is kept; the context's period law is called for the period, and the arrival is the closing foot's loading response (`walkRoot.LOADING`, Perry and Burnfield) or a raised heel's settling, whichever is later.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation scales with authored footfalls and the path/timing searches. Path segments and rest-foot widths prepare once; each side's hip width is read on its first nonclosing footprint, then reused across later footprints.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One take fixes its measured rest body, private floor path and step timing; fixed scalar geometry is shared without sharing a later queried posture or resampling a numerical result.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Construction-local width/heading work releases on return or throw; the plan owns its step/path/schedule/root geometry, linear in footfalls and corners, without an arbitrary-time pose history or external handle.
   */
  export function plan(input: IAutoMovieMotionHumanWalkSteps.IInput): IAutoMovieMotionHumanWalkSteps.IPlan {
    const body: IAutoMovieMotionHumanBody = input.body;
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const l: number = m.hipHeight;
    const yaw0: number = input.entry.posture.yaw;
    const flatten: (side: "left" | "right") => IAutoMovieMotionHumanFoot.IPlacement = (side: "left" | "right"): IAutoMovieMotionHumanFoot.IPlacement => ({
      ankle: { ...input.entry.feet[side].ankle, y: m.ankleHeight },
      rotation: HumanFoot.rotation(
        HumanFoot.heading(input.entry.feet[side].rotation),
        0,
      ),
    });
    const start: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> = {
      left: flatten("left"),
      right: flatten("right"),
    };
    const S: IAutoMovieVector3 = {
      x: (start.left.ankle.x + start.right.ankle.x) / 2,
      y: 0,
      z: (start.left.ankle.z + start.right.ankle.z) / 2,
    };
    const facing: IAutoMovieMotionHumanWalkFacing.IFacing | undefined = input.facing;
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
    const roundoff: number = Math.sqrt(Number.EPSILON) * Math.max(
      body.measure.stature, Math.hypot(placement.x, placement.z),
    );
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
    const pace: WalkPace = WalkPace.fit(
      {
        ...input,
        distance: D,
        share: input.swing ?? 0.8,
        period: (seconds: number): number => input.period(seconds),
        lead: rolled,
      },
      input.longest,
    );
    const delta: number = D / pace.steps;
    // The equivalent of an angle nearest a reference heading, so the headings
    // read along the path never jump by a full turn between footprints.
    const unwrap: (angle: number, near: number) => number = (angle: number, near: number): number =>
      near + wrapDegrees(angle - near);
    const heading: number =
      D < 1e-6 ? yaw0 : unwrap(path.heading(0, delta / 2), yaw0);
    const along$: (s: number) => number = (s: number): number =>
      D < 1e-6 ? heading : unwrap(path.heading(s, delta / 2), heading);
    // The heading faced at a floor point, nearest the starting heading.
    const faced$: (at: IAutoMovieVector3) => number = (at: IAutoMovieVector3): number =>
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
    const along: (side: "left" | "right") => number = (side: "left" | "right"): number =>
      HumanFrame.local(frame, start[side].ankle).z;
    const lead: AutoMovieHumanSide = inPlace
      ? ending >= yaw0 ? "left" : "right"
      : along("left") < along("right") - 1e-6 ? "left" : "right";
    const half: number = 0.05 * l;
    const restWidth: Record<"left" | "right", number> = {
      left: Math.abs(body.rest.get("leftFoot")!.x), right: Math.abs(body.rest.get("rightFoot")!.x),
    };
    const hipWidth: Partial<Record<"left" | "right", number>> = {};
    const rest: (side: "left" | "right") => number = (side: "left" | "right"): number => restWidth[side];
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
    // In a step turn the turning foot moves first, then the other replaces
    // it at the new heading (Hase and Stein 1999). Adjacent flat footprints
    // differ by at most one hip's usable twist after both feet's toe-out,
    // so a support need not spin to make the next step.
    const turnStep: number = walkReach.TWIST - stand.TOE_OUT;
    const n: number = inPlace
      ? Math.max(1, Math.ceil(Math.abs(ending - yaw0) / turnStep))
      : pace.steps + turning;
    const lag: number = turning * T;
    const last: number = inPlace ? first + swing + n * T : pace.last + lag;
    const front: number = pace.front;
    // The stop is made over the final step (`walkRoot`): the take arrives
    // once the closing foot has accepted the weight, its loading response
    // (`walkRoot.LOADING`), and a foot held on its ball has settled its heel
    // (`walkFoot.RISE`), whichever is later.
    const duration: number =
      last + Math.max(walkRoot.LOADING * 2 * T, raised > 0 ? walkFoot.RISE : 0);
    const progress: (t: number) => number = (t: number): number => pace.progress(t - lag);
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

    // The footfalls before the closing pair turn a third and two thirds; the
    // pair faces the arrival. A walk that sets off away from its facing turns
    // about over its first footfalls, each foot as far as a swing turns it.
    const asked: number[] = Array.from(
      { length: n + 1 },
      (_: unknown, i: number): number => {
        const d: number = place(i + 1);
        if (inPlace) return yaw0 + (ending - yaw0) * Math.min(1, (i + 1) / n);
        if (facing !== undefined)
          return i >= n - 1 ? ending : faced$(path.at(d));
        if (i >= n - 1) return ending;
        const along: number = along$(d);
        return i >= n - 3 ? along + ((ending - along) * (i - n + 4)) / 3 : along;
      },
    );
    const towards: number[] =
      inPlace || facing !== undefined
        ? asked
        : walkHeading.about(asked, lead, facings, yaw0, 2);
    const towardAt: (j: number) => number = (j: number): number => towards[j - 1]!;

    // The footprints, and the pelvis's heading at each heel strike: midway
    // between the facings of the two feet it then stands on.
    const leeway: number =
      Math.tan((walkHeading.ROLL * Math.PI) / 180) *
      (m.hipHeight - m.ankleHeight);
    const steps: IStep[] = [];
    const knots: IHeading[] = [
      { seconds: 0, yaw: yaw0 },
    ];
    let faced: number = yaw0;
    for (let j: number = 1; j <= n + 1; j++) {
      const side: "left" | "right" =
        j % 2 === 1 ? lead : lead === "left" ? "right" : "left";
      const heelStrike: number = first + swing + (j - 1) * T;
      const toeOut: number = side === "left" ? stand.TOE_OUT : -stand.TOE_OUT;
      const distance: number = place(j);
      const along: number = facing === undefined ? 0 : along$(distance);
      // Going aside, the feet keep their rest separation and never cross.
      const aside: number =
        facing === undefined
          ? 0
          : Math.sin(((along - towardAt(j)) * Math.PI) / 180) ** 2;
      const lateral: number =
        (side === "left" ? 1 : -1) *
        (inPlace || j >= n || j <= turning
          ? rest(side)
          : half + (rest(side) - half) * aside);
      const toward: number = towardAt(j);
      const point: IAutoMovieVector3 = HumanFrame.point(
        { origin: path.at(distance), yaw: toward },
        { x: lateral, y: m.ankleHeight, z: 0 },
      );
      // A footprint the pelvis leaves behind leans its leg no further than
      // the ankle holds when the foot lifts, at the toe-off two footfalls on,
      // the hip then being furthest past it and the pelvis facing between
      // this footprint and the next; a hip behind a foot walking a way it
      // does not face leans the leg the other way.
      const footHeading: number =
        !inPlace && j < n
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
                    (hipWidth[side] ??= Math.abs(body.rest.get(`${side}UpperLeg`)!.x)),
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
        Math.cos(((along - toward) * Math.PI) / 180) < -0.5
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
    const yawAt: (t: number) => number = (t: number): number => turn.at(t);
    const { events, stances }: ReturnType<typeof walkStepFoot.windows> = walkStepFoot.windows(steps, last, duration);

    // The pelvis: progression with smooth start and stop, sway and bob.
    const firstLeft: number = steps.find(
      (s: IStep): boolean => s.side === "left",
    )!.heelStrike;
    // A flight gait's straight push is its stance's own (`runStance`).
    if (!inPlace)
      walkStepFoot.pushed(
        steps,
        start,
        yawAt,
        flight?.push ?? walkStepFoot.PUSH,
        input.gait?.stiff,
      );
    const gaitBob: { mean: number; amplitude: number } | undefined =
      flight?.bob ?? input.gait?.bob;
    // A cruising stance runs from a heel strike to the same foot's toe-off
    // two steps on: two periods less a swing.
    const typical: number = 2 * T - swing;
    const own: Record<"left" | "right", IStep[]> = {
      left: steps.filter((s: IStep): boolean => s.side === "left"),
      right: steps.filter((s: IStep): boolean => s.side === "right"),
    };
    const schedules: Record<
      "left" | "right",
      (t: number) => IAutoMovieMotionHumanWalkFoot.IScheduled
    > = {
      left: walkStepFoot.schedule(body, "left", start.left, own.left, typical, raised, inPlace),
      right: walkStepFoot.schedule(
        body,
        "right",
        start.right,
        own.right,
        typical,
        raised,
        inPlace,
      ),
    };
    const foot: (side: "left" | "right", t: number) => IAutoMovieMotionHumanWalkFoot.IScheduled = (side: "left" | "right", t: number): IAutoMovieMotionHumanWalkFoot.IScheduled =>
      schedules[side](t);
    const { root, amount }: Pick<IAutoMovieMotionHumanWalkSteps.IPlan, "root" | "amount"> = inPlace ? {
      root: (): IAutoMovieVector3 => ({ ...placement }),
      amount: (): number => 0,
    } : walkRoot({
      body, start: input.entry.posture.root, period: T, lag, first, last,
      front, swing, stop: steps.at(-2)!.heelStrike, firstLeft, bob: gaitBob,
      progress, yaw: yawAt, at: (s: number): IAutoMovieVector3 => path.at(s),
      heading: (s: number, point: IAutoMovieVector3): number => facing === undefined ? along$(s) : faced$(point),
    });
    return {
      duration,
      events,
      stances,
      root,
      yaw: yawAt,
      // The stride's phase, a quarter at the first left heel strike, where
      // `sin(2 pi phase)` peaks: the arms are swung furthest, opposite the
      // legs, as the left leg lands ahead.
      phase: (t: number): number => (t - firstLeft) / (2 * T) + 0.25,
      amount,
      foot,
      inPlace,
    };
  }
}
