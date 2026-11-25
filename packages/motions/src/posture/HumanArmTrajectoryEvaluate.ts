import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieMotionHumanArmGeometry,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanArmGeometry as G } from "./HumanArmGeometry";
import type { HumanArmTrajectoryHalfStep } from "./HumanArmTrajectoryHalfStep";
import { HumanArmTrajectoryLimits as L } from "./HumanArmTrajectoryLimits";
import { HumanArmTrajectoryMaterialSweep } from "./HumanArmTrajectoryMaterialSweep";
import { HumanArmTrajectoryModel as M } from "./HumanArmTrajectoryModel";
import { HumanArmTrajectoryPairs as P } from "./HumanArmTrajectoryPairs";
import { HumanArmTrajectoryRangeExcess as R } from "./HumanArmTrajectoryRangeExcess";
import { HumanArmTrajectorySweep } from "./HumanArmTrajectorySweep";
import { HumanArmTrajectoryTerms as T } from "./HumanArmTrajectoryTerms";
import { HumanArmTrajectoryTravel as V } from "./HumanArmTrajectoryTravel";
import { nameArmTrajectoryPair } from "./nameArmTrajectoryPair";

/** The alternatives of `HumanArmTrajectoryEvaluateNoteTerm`'s site. */
type HumanArmTrajectoryEvaluateNoteTerm =
  | "speed"
  | "range"
  | "swept"
  | "site"
  | "lift"
  | "limit"
  | "probe"
  | "embedded"
  | "crossing";

/** The record of `IHumanArmTrajectoryEvaluateKept`'s site. */
type IHumanArmTrajectoryEvaluateKept = {
  reading: M.IEvaluation;
  laid: readonly boolean[];
};

/** Placements of immutable waypoints, indexed by arm and waypoint. */
type FixedPlacements = readonly (readonly (
  | IAutoMovieMotionHumanArmGeometry.IPlaced
  | undefined
)[])[];

/**
 * The objective and the constraints' violations of an arms' trajectory at an
 * iterate (`HumanArmTrajectoryModel.evaluate`, which states the terms).
 *
 * The motion terms (the accelerations, the steps and their speeds, the sites
 * and the task points) are read at every waypoint. The clearance is read at the
 * read waypoints (`contact`, an optimiser's knots, or every waypoint), each
 * pair at the waypoint (`HumanArmTrajectoryPairs.deepest`), and over each
 * interval to the next read waypoint every probe's course through every frame
 * between, each frame step its own sweep (`HumanArmTrajectorySweep`: the axis
 * spheres as capsules, the collider probes under their parts' cast hulls,
 * TrajOpt's hulls of consecutive poses): a reading that admits the trajectory
 * there admits it at every instant between, so no finer reading follows
 * (trajopt reads its timesteps and the casts between them, each subdivided cast
 * its own contact, and nothing finer).
 *
 * A reading of an iterate that differs from an earlier one's only at some
 * waypoints (`kept`: a laid course's detour round, or an optimiser's trial that
 * leaves some knots as they were) takes the earlier reading's arm placement at
 * every waypoint it does not name, its pairs and crossings at every read
 * waypoint it does not name, and its sweeps over every read interval whose
 * window (the interval's waypoints and the waypoints about them) it does not
 * name: each is a function of the context and the coordinates in its window
 * alone, so they are the same values. Every term is then summed by the same
 * loop in the same order, so the objective, the violation and the worst term
 * are the ones a reading of the whole iterate gives, bit for bit.
 *
 * @param c The context.
 * @param x Each arm's coordinates at each waypoint.
 * @param kept An earlier reading of the same context and the waypoints whose
 *   coordinates changed since it (`laid[k]` true), every other waypoint's
 *   coordinates being those that reading read; absent, every waypoint is read.
 * @param contact The waypoints the clearance is read at, `contact[k]` true: an
 *   optimiser's knots; absent, every waypoint.
 * @param fixed The already placed immutable endpoints of a still solve.
 * @returns The arms placed, the objective, the summed violation and the worst
 *   one past its slack, with the pairs, sweeps and crossings the reading found
 *   and the waypoints that take part in a violation past the tolerance.
 */
export function HumanArmTrajectoryEvaluate(
  c: M.IContext,
  x: readonly (readonly number[])[][],
  kept?: IHumanArmTrajectoryEvaluateKept,
  contact?: readonly boolean[],
  fixed?: FixedPlacements,
): M.IEvaluation {
  // Whether a waypoint's clearance is read.
  const reads = (k: number): boolean =>
    contact === undefined || contact[k] === true;
  // Whether a waypoint's reading is the earlier one's.
  const same = (k: number): boolean =>
    kept !== undefined && kept.laid[k] !== true;
  // Whether every waypoint of a window is the earlier reading's.
  const unchanged = (from: number, to: number): boolean => {
    if (kept === undefined) return false;
    for (let g: number = Math.max(0, from); g <= Math.min(c.n - 1, to); ++g)
      if (!same(g)) return false;
    return true;
  };
  // Each read waypoint's next read waypoint.
  const following: number[] = new Array<number>(c.n).fill(-1);
  {
    let last: number = -1;
    for (let k: number = 0; k < c.n; ++k) {
      if (!reads(k)) continue;
      if (last >= 0) following[last] = k;
      last = k;
    }
  }
  // Every waypoint places the arm with its collider probes: the pairs read
  // them at the read waypoints and the sweeps their courses through every
  // waypoint between, whose rows take the Jacobians there.
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
          // An earlier placement serves where it holds the collider probes.
          fixed?.[a]?.[k] ??
          (same(k) && kept!.reading.placed[a]![k]!.probes.length > G.SURFACE
            ? kept!.reading.placed[a]![k]!
            : G.placed(c.setups[a]!, c.frames[a]![k]!, v, true)),
      ),
  );
  // Whether a read interval's sweeps are the earlier reading's: they depend
  // on its waypoints and the waypoints about them; a material encounter also
  // on the pairs at its two ends.
  const sameInterval = (a: number, k: number): boolean =>
    unchanged(k - 1, following[k]! + 1) &&
    ((c.material?.parts[a] ?? -1) < 0 || (same(k) && same(following[k]!)));
  // The arm on the way from read waypoint `k` to its neighbour `n`: every
  // frame between and the neighbour, the course's swept readings read it by.
  const nearOf = (
    a: number,
    k: number,
    n: number,
  ): HumanArmTrajectoryHalfStep.INear => {
    const path: HumanArmTrajectoryHalfStep.IStep[] = [];
    const step: number = n > k ? 1 : -1;
    for (let g: number = k + step; ; g += step) {
      path.push({ at: g, placed: placed[a]![g]! });
      if (g === n) break;
    }
    return {
      at: n,
      placed: placed[a]![n]!,
      path,
    };
  };
  let objective: number = 0;
  let violation: number = 0;
  let worst: M.IWorst = {
    value: 0,
    what: "",
    axis: "region",
    at: 0,
    term: "",
  };
  // The worst of every term but the speed (`M.IEvaluation.placement`).
  let placement: M.IWorst = worst;
  // A clearance miss refuses past its allowance, which keeps a margin below
  // the audit's own skin (`HumanArmTrajectoryTerms.SKIN`).
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
  // The last waypoint of the interval `here` starts that the violation noted
  // is read over; -1 for a reading at `here` alone.
  let interval: number = -1;
  // A term's refusal axis: a speed asks for time, a task point names its
  // target, every other term the region.
  const note = (
    v: number,
    term: HumanArmTrajectoryEvaluateNoteTerm,
    what: () => string,
    slack: number = 0,
  ): void => {
    if (v <= 0) return;
    violation += v;
    // What else bears at this waypoint, read when a site is missed there:
    // the term that keeps the hand off its site.
    if (
      term !== "site" &&
      term !== "limit" &&
      v - slack > (bearing.get(here)?.value ?? -Infinity)
    )
      bearing.set(here, { value: v - slack, what });
    if (v - slack > M.TOLERANCE) {
      failing[here] = true;
      if (interval >= 0) failing[interval] = true;
    }
    const over: boolean = v - slack > worst.value;
    const placing: boolean = term !== "speed" && v - slack > placement.value;
    if (!over && !placing) return;
    const noted: M.IWorst = {
      value: v - slack,
      what: what(),
      at: here,
      term,
      axis:
        term === "speed" ? "duration" : term === "limit" ? "target" : "region",
    };
    if (over) worst = noted;
    if (placing) placement = noted;
  };
  const bearing: Map<number, IBearing> = new Map();
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
      interval = k + 1;
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
      // The axis spheres and the collider probes swept from a read waypoint
      // to the next.
      const next: number = following[k]!;
      const sweeps: HumanArmTrajectorySweep.ISwept[] =
        c.still || !reads(k) || next < 0
          ? []
          : sameInterval(a, k)
            ? kept!.reading.swept[a]![k]!
            : ((): HumanArmTrajectorySweep.ISwept[] => {
                const near: HumanArmTrajectoryHalfStep.INear = nearOf(
                  a,
                  k,
                  next,
                );
                return [
                  ...HumanArmTrajectorySweep(c, a, k, placed[a]![k]!, near),
                  ...HumanArmTrajectorySweep.links(c, a, k, placed[a]!, near),
                ];
              })();
      swept[a]![k] = sweeps;
      for (const sweep of sweeps) {
        const short: number = 1000 * (sweep.lower - sweep.clear);
        // Placed over the course's nearest step.
        here = sweep.from;
        interval = sweep.other;
        note(
          short,
          "swept",
          () =>
            `${nameArmTrajectoryPair(c, a, k, sweep.probe, sweep.shape)} swept ${short.toFixed(1)} mm deep after ${times[sweep.from]!.toFixed(3)} s`,
        );
      }
      here = k;
    }
    interval = -1;
    for (let k: number = 1; k < n; ++k) {
      if (!M.inner(c, k)) continue;
      here = k;
      // The ranges at every frame, the course between knots included.
      note(
        R(c, a, arm[k]!, M.swing(c, a)),
        "range",
        () => `a coordinate out of its range at ${times[k]!.toFixed(3)} s`,
      );
      const site: M.ISite | undefined = c.sites[a]![k];
      if (site !== undefined) {
        const at: P.ILocated = P.located(
          c,
          (arm: number): IAutoMovieMotionHumanArmGeometry.IPlaced =>
            placed[arm]![k]!,
          a,
          k,
          site,
        );
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
        for (const limit of L(site, at, placed[a]![k]!, c.frames[a]![k]!))
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
      // exactly (`HumanArmTrajectoryPairs.CUT`). A waypoint's pairs are a
      // function of its own placement, so they are the earlier reading's
      // wherever the waypoint is.
      const known: M.IEvaluation["pairs"][number][number] | undefined = same(k)
        ? kept!.reading.pairs[a]![k]
        : undefined;
      const deepest: Map<number, P.IPair> = !reads(k)
        ? new Map()
        : (known?.deepest ?? P.deepest(c, a, k, placed[a]![k]!, P.CUT));
      const embedded: Map<number, P.IEmbedded> =
        known?.embedded ??
        (reads(k) ? P.embedded(c, a, k, placed[a]![k]!, P.CUT) : new Map());
      pairs[a]![k] = { deepest, embedded };
      for (const pair of deepest.values()) {
        note(
          pair.short,
          "probe",
          () =>
            `${nameArmTrajectoryPair(c, a, k, pair.probe, pair.shape)} ${pair.short.toFixed(1)} mm deep at ${times[k]!.toFixed(3)} s`,
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
    if (!c.still && (c.material?.parts[a] ?? -1) >= 0) {
      for (let k: number = 0; k + 1 < n; ++k) {
        const next: number = following[k]!;
        if (!reads(k) || next < 0 || sameInterval(a, k)) continue;
        const material: HumanArmTrajectorySweep.ISwept[] =
          HumanArmTrajectoryMaterialSweep(
            c,
            a,
            k,
            next,
            placed[a]![k]!,
            placed[a]![next]!,
            pairs[a]!,
            x[a]!,
          );
        here = k;
        interval = next;
        for (const sweep of material) {
          swept[a]![k]!.push(sweep);
          const short: number = 1000 * (sweep.lower - sweep.clear);
          note(
            short,
            "swept",
            () =>
              `${nameArmTrajectoryPair(c, a, k, sweep.probe, sweep.shape)} swept ${short.toFixed(1)} mm deep after ${times[k]!.toFixed(3)} s`,
          );
        }
      }
      interval = -1;
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
  // A missed site or task point names what kept the hand off it: an
  // obstacle, a speed or another arm, as read at the same waypoint.
  const held = (w: M.IWorst): M.IWorst => {
    const by: IBearing | undefined =
      w.term === "site" || w.term === "limit" ? bearing.get(w.at) : undefined;
    return by === undefined
      ? w
      : { ...w, what: `${w.what}, held off by ${by.what()}` };
  };
  return {
    placed,
    objective,
    violation,
    worst: held(worst),
    placement: held(placement),
    pairs,
    swept,
    crossing,
    failing,
  };
}

/**
 * The strongest reading other than a site's at one waypoint: its excess,
 * millimetres or coordinate units, and its words.
 */
interface IBearing {
  /** The excess past its slack. */
  value: number;

  /** Its words, read only for a refusal. */
  what: () => string;
}
