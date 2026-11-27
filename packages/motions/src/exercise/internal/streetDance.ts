import { AutoMovieEngineVector3, AutoMovieEngineMotionSampling } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieMotionHumanActionKey,
  IAutoMovieMotionClockInstant,
  IAutoMovieMotionHumanActionContext,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanActionPlan,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanDanceBeats,
  IAutoMovieMotionHumanDanceFootKey,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieMotionHumanStreetDance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanInterrupt } from "../../compose/internal/AutoMovieMotionHumanInterrupt";
import { HumanBound } from "../../law/internal/HumanBound";
import { HumanFoot } from "../../posture/internal/HumanFoot";
import { HumanFrame } from "../../posture/internal/HumanFrame";
import { DanceFootwork } from "./DanceFootwork";
import { ExerciseKey } from "./ExerciseKey";
import { balletPositions } from "./balletPositions";
import { dance } from "./dance";
import { danceGrooveEnvelope } from "./danceGrooveEnvelope";
import { prepareDanceBeats } from "./prepareDanceBeats";

/*
 * Street grooves on the dance law's beat clock.
 *
 * - Rock: the knees give `BOUNCE` of the stature on every beat; the chest
 *   isolates `CHEST` degrees side to side and the head `HEAD` degrees the other
 *   way, one side a beat; each popping hit drives the forearms to a struck pose
 *   that peaks exactly on its subdivision, rising over `RISE` of a beat on a
 *   sharp ease-in and released over the half beat after.
 * - Moonwalk: one foot stands on its ball, the heel up `HEEL` degrees, while the
 *   other slides back flat along the floor, never lifting, from `STEP` foot
 *   lengths ahead of the standing foot to as far behind; on the beat the slid
 *   foot rises onto its ball and the standing heel drops, so the roles change
 *   every beat and the dancer travels backward while seeming to step forward.
 *   The hips ride over the feet's midpoint.
 *
 * Every instant of a member strays from the beat by an offset drawn once from
 * its seed within `vary`, so a crowd keeps the beat without moving cloned
 * (Burger et al. 2013 measured such individual timing in groove).
 *
 * Events: `beat{k}`, the rock's `hit{n}`, the moonwalk's `slide{k}`, `relax`.
 */
export namespace streetDance {
  /*
   * The action's name.
   */
  export const name: AutoMovieMotionHumanActionKey = "streetDance";

  /*
   * Cancel table: from the last beat, into standing, another groove or a dance.
   */
  export const interrupts: IAutoMovieMotionHumanActionLaw["interrupts"] =
    AutoMovieMotionHumanInterrupt.table({
      stand: ["fromRelax", "smooth"],
      streetDance: ["fromRelax", "smooth"],
      dance: ["fromRelax", "smooth"],
      walk: ["fromRelax", "smooth"],
    });

  /*
   * The rock's knee give, a share of the stature (provisional).
   */
  export const BOUNCE: number = 0.015;

  /*
   * The chest's side isolation, degrees (provisional).
   */
  export const CHEST: number = 12;

  /*
   * The head's counter isolation, degrees (provisional).
   */
  export const HEAD: number = 10;

  /*
   * A hit's rise, a share of a beat: short, so it stops sharp (provisional).
   */
  export const RISE: number = 0.15;

  /*
   * How low the hips ride in the moonwalk, a share of the stature: enough for
   * the sliding leg to reach the floor behind (provisional).
   */
  export const CROUCH: number = 0.025;

  /*
   * The moonwalk's standing heel lift, degrees about the ball (provisional).
   */
  export const HEEL: number = 35;

  /*
   * The moonwalk's slide, foot lengths ahead of and behind the standing foot
   * (provisional).
   */
  export const STEP: number = 0.5;

  /*
   * Plan a groove.
   * Parameter context: The action's context.
   * Returns: The plan.
   * When the tempo, the beat count or the variation is
   * not admitted.
   */
  export function plan(
    context: IAutoMovieMotionHumanActionContext<IAutoMovieMotionHumanStreetDance.IParams>,
  ): IAutoMovieMotionHumanActionPlan {
    const p: IAutoMovieMotionHumanStreetDance.IParams = context.params;
    const body: IAutoMovieMotionHumanBody = context.body;
    const entry: IAutoMovieMotionHumanPosture = context.entry.posture;
    const vary: number = p.vary ?? 0.02;
    HumanBound.least("vary", vary, 0, "s");
    const clock: IAutoMovieMotionHumanDanceBeats = prepareDanceBeats(
      context,
      p.bpm ?? dance.BPM,
      p.count ?? 8,
      p.lock,
    );
    // The member's own offset from the beat, drawn once from its seed.
    const offset: number =
      vary * (2 * context.random("streetDance").float(0) - 1);
    const beats: IAutoMovieMotionHumanDanceBeats = {
      ...clock,
      lead: clock.lead + offset,
      at: (k: number): number => clock.at(k) + offset,
    };
    const end: number = beats.at(beats.count) + beats.period;
    const instants: IAutoMovieMotionClockInstant[] = [];
    for (let k: number = 1; k <= beats.count; k++)
      instants.push({ name: `beat${k}`, seconds: beats.at(k) });
    instants.push({ name: "relax", seconds: beats.at(beats.count) });
    const standing: IAutoMovieVector3 = balletPositions.hips(body, entry);
    const stood: (
      side: AutoMovieHumanSide,
    ) => IAutoMovieMotionHumanDanceFootKey = (
      side: AutoMovieHumanSide,
    ): IAutoMovieMotionHumanDanceFootKey => ({
      at: 0,
      leave: end,
      place: {
        ankle: context.entry.feet[side].ankle,
        rotation: context.entry.feet[side].rotation,
      },
      bears: true,
      clearance: 0,
    });

    if (p.groove === "rock") {
      const hits: readonly number[] =
        p.hits ??
        Array.from(
          { length: beats.count },
          (_: unknown, k: number): number => 4 * k + 2,
        );
      const peaks: number[] = hits.map((h: number): number =>
        beats.at(1 + h / 4),
      );
      peaks.forEach((s: number, n: number): void => {
        instants.push({ name: `hit${n + 1}`, seconds: s });
      });
      const side: (t: number) => number = (t: number): number =>
        Math.sin((Math.PI * (t - beats.at(1))) / beats.period) *
        danceGrooveEnvelope(t, beats, end);
      const struck: (t: number) => number = (t: number): number => {
        let best: number = 0;
        for (const s of peaks) {
          const rise: number = RISE * beats.period;
          const fall: number = 0.5 * beats.period;
          const v: number =
            t <= s - rise || t >= s + fall
              ? 0
              : t <= s
                ? Math.pow((t - (s - rise)) / rise, 3)
                : 1 - AutoMovieEngineMotionSampling.minimumJerkShare((t - s) / fall);
          best = Math.max(best, v);
        }
        return best;
      };
      const loose: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
        body,
        {},
        { shoulder: 15, raise: 20, elbow: 60 },
      ).joints;
      const hit: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
        body,
        {},
        { shoulder: 45, raise: 40, elbow: 95 },
      ).joints;
      return DanceFootwork.compose(
        body,
        entry,
        {
          duration: end,
          left: [stood("left")],
          right: [stood("right")],
          hips: (t: number): IAutoMovieVector3 => ({
            ...standing,
            y:
              standing.y -
              BOUNCE *
                body.measure.stature *
                danceGrooveEnvelope(t, beats, end) *
                (0.5 +
                  0.5 *
                    Math.cos((2 * Math.PI * (t - beats.at(1))) / beats.period)),
          }),
          yaw: (): number => entry.yaw,
          joints: (t: number): IAutoMovieMotionHumanPosture["joints"] => {
            const s: number = side(t);
            const h: number = struck(t);
            return {
              ...blend(loose, hit, h),
              chest: [0, CHEST * s, 0],
              neck: [0, -HEAD * s, 0],
            };
          },
          instants,
        },
        { kind: "ground" },
      );
    }

    // The moonwalk: each beat, the flat foot slides back past the one on
    // its ball; then they change.
    const back: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: entry.yaw },
      { x: 0, y: 0, z: -1 },
    );
    const step: number = STEP * body.measure.footLength;
    const roll: number = 0.15 * beats.period;
    const clearance: number = 0.03 * body.measure.stature;
    const first: AutoMovieHumanSide = p.side ?? "right";
    const second: AutoMovieHumanSide = first === "left" ? "right" : "left";
    const shift: (
      place: IAutoMovieMotionHumanFoot.IPlacement,
      by: number,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      place: IAutoMovieMotionHumanFoot.IPlacement,
      by: number,
    ): IAutoMovieMotionHumanFoot.IPlacement => ({
      ankle: AutoMovieEngineVector3.add(place.ankle, AutoMovieEngineVector3.scale(back, by)),
      rotation: place.rotation,
    });
    const ball: (
      side: AutoMovieHumanSide,
      place: IAutoMovieMotionHumanFoot.IPlacement,
    ) => IAutoMovieMotionHumanFoot.IPlacement = (
      side: AutoMovieHumanSide,
      place: IAutoMovieMotionHumanFoot.IPlacement,
    ): IAutoMovieMotionHumanFoot.IPlacement =>
      HumanFoot.pivot(
        body,
        side,
        "ball",
        HumanFoot.point(body, side, "ball", place),
        HumanFoot.heading(place.rotation),
        -HEEL,
        HEEL,
      );

    // Before the first beat the first slider sets itself a step ahead on
    // its ball, and the other rises onto its ball where it stands.
    const lead: number = beats.at(1);
    const ground: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanFoot.IPlacement
    > = {
      left: shift(stood("left").place, first === "left" ? -step : 0),
      right: shift(stood("right").place, first === "right" ? -step : 0),
    };
    const keys: Record<
      AutoMovieHumanSide,
      IAutoMovieMotionHumanDanceFootKey[]
    > = {
      left: [],
      right: [],
    };
    keys[first].push(
      { ...stood(first), leave: 0.1 * lead },
      {
        at: 0.5 * lead,
        leave: lead,
        place: ball(first, ground[first]),
        bears: true,
        clearance,
      },
    );
    keys[second].push(
      { ...stood(second), leave: 0.6 * lead },
      {
        at: 0.9 * lead,
        leave: Infinity,
        place: ball(second, ground[second]),
        bears: true,
        clearance: 0,
      },
    );

    // Each beat: the slider's heel drops, it slides back flat past the
    // standing ball, and it rises onto its own ball by the next beat.
    for (let k: number = 1; k <= beats.count; k++) {
      const slider: AutoMovieHumanSide = k % 2 === 1 ? first : second;
      const from: number = beats.at(k);
      const last: boolean = k === beats.count;
      const to: number = last ? end - 0.3 * beats.period : beats.at(k + 1);
      const list: IAutoMovieMotionHumanDanceFootKey[] = keys[slider];
      list[list.length - 1]!.leave = from;
      const behind: IAutoMovieMotionHumanFoot.IPlacement = shift(
        ground[slider],
        2 * step,
      );
      list.push(
        {
          at: from + roll,
          leave: from + roll,
          place: ground[slider],
          bears: false,
          clearance: 0,
        },
        {
          at: to - roll,
          leave: last ? end : to - roll,
          place: behind,
          bears: last,
          clearance: 0,
        },
      );
      if (!last)
        list.push({
          at: to,
          leave: Infinity,
          place: ball(slider, behind),
          bears: true,
          clearance: 0,
        });
      ground[slider] = behind;
      instants.push({ name: `slide${k}`, seconds: from + roll });
    }
    // The last standing foot lowers its heel.
    const standingLast: AutoMovieHumanSide =
      beats.count % 2 === 1 ? second : first;
    const held: IAutoMovieMotionHumanDanceFootKey[] = keys[standingLast];
    held[held.length - 1]!.leave = end - 0.3 * beats.period;
    held.push({
      at: end - 0.1 * beats.period,
      leave: end,
      place: ground[standingLast],
      bears: true,
      clearance: 0,
    });
    const left: DanceFootwork.IFoot = DanceFootwork.foot(
      body,
      "left",
      keys.left,
      end,
      { kind: "ground" },
    );
    const right: DanceFootwork.IFoot = DanceFootwork.foot(
      body,
      "right",
      keys.right,
      end,
      { kind: "ground" },
    );
    const arms: IAutoMovieMotionHumanPosture["joints"] = ExerciseKey.from(
      body,
      {},
      { shoulder: 10, raise: 15, elbow: 50 },
    ).joints;
    return DanceFootwork.compose(
      body,
      entry,
      {
        duration: end,
        left: keys.left,
        right: keys.right,
        hips: (t: number): IAutoMovieVector3 => {
          const mid: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(
            left.placed(t).ankle,
            right.placed(t).ankle,
            0.5,
          );
          const start: IAutoMovieVector3 = AutoMovieEngineVector3.lerp(
            context.entry.feet.left.ankle,
            context.entry.feet.right.ankle,
            0.5,
          );
          // The hips sink to the crouch by the first beat and rise after the
          // last, on the groove's envelope, as the rock's bounce does: sunk
          // at once, the knees jumped as the groove began.
          return {
            x: standing.x + mid.x - start.x,
            y:
              standing.y -
              CROUCH *
                body.measure.stature *
                danceGrooveEnvelope(t, beats, end),
            z: standing.z + mid.z - start.z,
          };
        },
        yaw: (): number => entry.yaw,
        joints: (): IAutoMovieMotionHumanPosture["joints"] => arms,
        instants,
      },
      { kind: "ground" },
    );
  }

  /*
   * Two joint sets mixed by a share.
   */
  function blend(
    a: IAutoMovieMotionHumanPosture["joints"],
    b: IAutoMovieMotionHumanPosture["joints"],
    share: number,
  ): IAutoMovieMotionHumanPosture["joints"] {
    const out: Record<string, readonly [number, number, number]> = {};
    for (const bone of Object.keys(a) as (keyof typeof a)[]) {
      const x: readonly [number, number, number] = a[bone]!;
      const y: readonly [number, number, number] = b[bone] ?? x;
      out[bone] = [
        x[0] + (y[0] - x[0]) * share,
        x[1] + (y[1] - x[1]) * share,
        x[2] + (y[2] - x[2]) * share,
      ];
    }
    return out;
  }
}
