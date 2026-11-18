import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import { HumanArmTrajectoryLimits as L } from "./HumanArmTrajectoryLimits";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryMaterialSweep } from "./HumanArmTrajectoryMaterialSweep";
import { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";

/**
 * The objective and the constraints' violations of an arms' trajectory at an
 * iterate (`HumanArmTrajectoryModel.evaluate`, which states the terms).
 *
 * A reading of an iterate that differs from an earlier one's only at some
 * waypoints (`kept`, a laid course's detour round, which lays a transport's
 * inner waypoints again and leaves every other as it was) takes the earlier
 * reading's arm placement, pairs and crossings at every waypoint it does not
 * name, and its sweeps over every interval both of whose ends it does not
 * name: each is a function of the context and the coordinates at its own
 * waypoints alone, so they are the same values. Every term is then summed by
 * the same loop in the same order, so the objective, the violation and the
 * worst term are the ones a reading of the whole iterate gives, bit for bit.
 *
 * @param c The context.
 * @param x Each arm's coordinates at each waypoint.
 * @param kept An earlier reading of the same context and the waypoints whose coordinates changed since it (`laid[k]` true), every other waypoint's coordinates being those that reading read; absent, every waypoint is read.
 * @param contact The waypoints whose clearance pairs (the probes' deepest, the body's corners embedded, the two arms' crossings) are read, `contact[k]` true: an optimiser's rounds read them at its knots, the sweeps between consecutive waypoints keeping the continuous check, and the converged path is read whole; absent, every waypoint's are read.
 * @returns The arms placed, the objective, the summed violation and the worst one past its slack, with the pairs, sweeps and crossings the reading found and the waypoints that take part in a violation past the tolerance.
 */
export function HumanArmTrajectoryEvaluate(
  c: M.IContext,
  x: readonly (readonly number[])[][],
  kept?: { reading: M.IEvaluation; laid: readonly boolean[] },
  contact?: readonly boolean[],
): M.IEvaluation {
  // Whether a waypoint's clearance pairs are read.
  const reads = (k: number): boolean =>
    contact === undefined || contact[k] === true;
  // Whether a waypoint's reading is the earlier one's.
  const same = (k: number): boolean =>
    kept !== undefined && kept.laid[k] !== true;
  const placed: IAutoMovieMotionHumanArmGeometry.IPlaced[][] = x.map(
    (
      arm: readonly (readonly number[])[],
      a: number,
    ): IAutoMovieMotionHumanArmGeometry.IPlaced[] =>
      arm.map(
        (
          v: readonly number[],
          k: number,
        ): IAutoMovieMotionHumanArmGeometry.IPlaced =>
          same(k)
            ? kept!.reading.placed[a]![k]!
            : G.placed(c.setups[a]!, c.frames[a]![k]!, v),
      ),
  );
  let objective: number = 0;
  let violation: number = 0;
  let worst: M.IEvaluation["worst"] = {
    value: 0,
    what: "",
    axis: "region",
    at: 0,
    term: "",
  };
  // A clearance miss refuses only past the audit's own skin, the margin
  // the allowance keeps below it aside (`HumanArmTrajectoryTerms.SKIN`).
  // The waypoint the loop below reads, where a violation noted is placed.
  let here: number = 0;
  const pairs: M.IEvaluation["pairs"] = x.map(
    (): M.IEvaluation["pairs"][number] => [],
  );
  const swept: M.IEvaluation["swept"] = x.map(
    (): M.IEvaluation["swept"][number] => [],
  );
  const crossing: M.IEvaluation["crossing"] = [];
  const failing: boolean[] = new Array<boolean>(c.n).fill(false);
  // Whether the violation noted is read over the interval `here` starts.
  let interval: boolean = false;
  // A term's refusal axis: a speed asks for time, a task point names its
  // target, every other term the region.
  const note = (
    v: number,
    term:
      | "speed"
      | "swept"
      | "site"
      | "lift"
      | "limit"
      | "probe"
      | "embedded"
      | "crossing",
    what: () => string,
    slack: number = 0,
  ): void => {
    if (v <= 0) return;
    violation += v;
    if (v - slack > M.TOLERANCE) {
      failing[here] = true;
      if (interval) failing[here + 1] = true;
    }
    if (v - slack > worst.value)
      worst = {
        value: v - slack,
        what: what(),
        at: here,
        term,
        axis:
          term === "speed"
            ? "duration"
            : term === "limit"
              ? "target"
              : "region",
      };
  };
  const n: number = c.n;
  const times: readonly number[] = c.times;
  x.forEach((arm: readonly (readonly number[])[], a: number): void => {
    // A still configuration's waypoints are smoothed among themselves
    // only: its ends are not part of it.
    for (let k: number = c.still ? 2 : 0; k < (c.still ? n - 2 : n); ++k)
      for (const d of c.free[a]!) {
        // An end's neighbour beyond it: the course beyond a stretch
        // (`M.IContext.beyond`), or the end itself.
        const after: readonly number[] | undefined =
          k === n - 1 ? c.beyond?.after?.[a] : undefined;
        const before: readonly number[] | undefined =
          k === 0 ? c.beyond?.before?.[a] : undefined;
        const acc: number =
          (after === undefined ? arm[Math.min(n - 1, k + 1)]! : after)[d]! -
          2 * arm[k]![d]! +
          (before === undefined ? arm[Math.max(0, k - 1)]! : before)[d]!;
        objective += T.ACCELERATION * acc * acc;
      }
    // A still configuration drawn to its anchor.
    const anchor: readonly number[] | undefined = c.anchor?.[a];
    if (anchor !== undefined)
      for (let k: number = 1; k + 1 < n; ++k)
        for (const d of c.free[a]!) {
          const off: number = arm[k]![d]! - anchor[d]!;
          objective += T.ANCHOR * off * off;
        }
    for (let k: number = 0; k + 1 < n; ++k) {
      here = k;
      interval = true;
      // A probe's travel is read against the arm's own base, so a carried
      // body's travel is never charged to the arm (`HumanArmTrajectoryTravel`).
      const travel = (p: number): number =>
        1000 *
        Vector3.length(
          V.step(
            c.frames[a]![k]!,
            c.frames[a]![k + 1]!,
            placed[a]![k]!.probes[p]![0],
            placed[a]![k + 1]!.probes[p]![0],
          ),
        );
      const dt: number = times[k + 1]! - times[k]!;
      const limit: number = M.stepLimit(c, k);
      for (const p of c.still ? [] : T.SPEED) {
        const step: number = travel(p);
        // The path objective uses the elbow and wrist, whose travel also
        // bounds speed. Read every contributing probe just once.
        if (T.PATH.includes(p)) objective += T.LENGTH * step * step;
        note(
          step - limit,
          "speed",
          () =>
            `probe ${p} moves ${(step / dt / 1000).toFixed(2)} m/s at ${times[k]!.toFixed(3)} s`,
        );
      }
      const sweeps: HumanArmTrajectorySweep.ISwept[] = c.still
        ? []
        : same(k) && same(k + 1)
          ? kept!.reading.swept[a]![k]!
          : HumanArmTrajectorySweep.of(
              c,
              a,
              k,
              placed[a]![k]!,
              placed[a]![k + 1]!,
            );
      swept[a]![k] = sweeps;
      for (const sweep of sweeps) {
        const short: number = 1000 * (sweep.lower - sweep.clear);
        note(
          short,
          "swept",
          () =>
            `probe ${sweep.probe} swept ${short.toFixed(1)} mm inside shape ${sweep.shape} after ${times[k]!.toFixed(3)} s`,
        );
      }
    }
    interval = false;
    for (let k: number = 1; k < n; ++k) {
      if (!M.inner(c, k)) continue;
      here = k;
      const site: M.ISite | undefined = c.sites[a]![k];
      if (site !== undefined) {
        const at: P.ILocated = P.located(c, placed, a, k, site);
        const contact: IAutoMovieVector3 = P.pad(placed[a]![k]!, site.contact);
        const off: IAutoMovieVector3 = Vector3.scale(
          Vector3.subtract(contact, at.point),
          1000,
        );
        const normal: IAutoMovieVector3 | undefined = at.normal;
        const across: number =
          normal === undefined ? 0 : Vector3.dot(off, normal);
        const slide: number = Vector3.length(
          normal === undefined
            ? off
            : Vector3.subtract(off, Vector3.scale(normal, across)),
        );
        // The contact's height above the touched collider, less the site's
        // own: the site's standing off the surface is kept where the region
        // curves away from its plane.
        const lift: number =
          normal === undefined || at.shape === undefined
            ? 0
            : 1000 * (at.gap(contact) - at.gap(at.point));
        note(
          slide - 1000 * site.disc,
          "site",
          () =>
            `the hand ${slide.toFixed(1)} mm off its site along the surface at ${times[k]!.toFixed(3)} s, beyond the region's ${(1000 * site.disc).toFixed(0)} mm`,
        );
        objective += T.SITE * slide * slide;
        note(
          -lift,
          "lift",
          () =>
            `the hand ${(-lift).toFixed(1)} mm inside its site at ${times[k]!.toFixed(3)} s`,
        );
        objective += T.LIFT * lift * lift;
        for (const limit of L.of(site, at, placed[a]![k]!))
          note(
            limit.distance - limit.allowance,
            "limit",
            () =>
              `a task point ${limit.distance.toFixed(1)} mm off its asked place at ${times[k]!.toFixed(3)} s`,
          );
        if (site.rotation !== undefined) {
          const turned: number = P.angle(
            at.rotation ?? site.rotation,
            placed[a]![k]!.hand,
          );
          objective += T.ROTATION * turned * turned;
        }
      }
      // Only the pairs the merit and the convex model can use are read
      // exactly (`HumanArmTrajectoryPairs.CUT`).
      const known: M.IEvaluation["pairs"][number][number] | undefined = same(k)
        ? kept!.reading.pairs[a]![k]
        : undefined;
      const deepest: Map<number, P.IPair> =
        known?.deepest ??
        (reads(k) ? P.deepest(c, a, k, placed[a]![k]!, P.CUT) : new Map());
      const embedded: Map<number, P.IEmbedded> =
        known?.embedded ??
        (reads(k) ? P.embedded(c, a, k, placed[a]![k]!, P.CUT) : new Map());
      pairs[a]![k] = { deepest, embedded };
      for (const pair of deepest.values()) {
        note(
          pair.short,
          "probe",
          () =>
            `probe ${pair.probe} ${pair.short.toFixed(1)} mm inside shape ${pair.shape} at ${times[k]!.toFixed(3)} s`,
          T.SKIN,
        );
        // A declared rest is drawn to where its segments meet.
        if (pair.rested) objective += T.LIFT * pair.short * pair.short;
      }
      for (const pair of embedded.values()) {
        note(
          pair.short,
          "embedded",
          () =>
            `the body's ${pair.bone} ${pair.short.toFixed(1)} mm inside the arm's ${pair.shape.bone} at ${times[k]!.toFixed(3)} s`,
          T.SKIN,
        );
        if (pair.rested) objective += T.LIFT * pair.short * pair.short;
      }
    }
    if (!c.still) {
      for (let k: number = 0; k + 1 < n; ++k) {
        if (same(k) && same(k + 1)) continue;
        const material: HumanArmTrajectorySweep.ISwept[] = HumanArmTrajectoryMaterialSweep(
          c, a, k, placed[a]![k]!, placed[a]![k + 1]!, pairs[a]!,
        );
        here = k;
        interval = true;
        for (const sweep of material) {
          swept[a]![k]!.push(sweep);
          const short: number = 1000 * (sweep.lower - sweep.clear);
          note(short, "swept", () => `probe ${sweep.probe} swept ${short.toFixed(1)} mm inside shape ${sweep.shape} after ${times[k]!.toFixed(3)} s`);
        }
      }
      interval = false;
    }
  });
  if (x.length === 2)
    for (let k: number = 1; k < n; ++k) {
      if (!M.inner(c, k)) continue;
      crossing[k] =
        (same(k) ? kept!.reading.crossing[k] : undefined) ??
        (reads(k)
          ? P.crossing(c, k, placed[0]![k]!, placed[1]![k]!, P.CUT)
          : new Map());
      for (const pair of crossing[k]!.values()) {
        here = k;
        note(
          pair.short,
          "crossing",
          () =>
            `probe ${pair.probe} of the ${pair.a === 0 ? "first" : "second"} arm ${pair.short.toFixed(1)} mm inside the other's ${pair.bone} at ${times[k]!.toFixed(3)} s`,
          T.SKIN,
        );
        if (pair.rested) objective += T.LIFT * pair.short * pair.short;
      }
    }
  return {
    placed,
    objective,
    violation,
    worst,
    pairs,
    swept,
    crossing,
    failing,
  };
}
