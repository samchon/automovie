import { HumanMersenneTwister as MT } from "./HumanMersenneTwister";

/*
 * A sampling planner's path shortened while it stays valid: the smoothing
 * EXOTica's time-indexed RRT-Connect solver gives its path
 * (`TimeIndexedRRTConnectSolver::GetPath`, `parameters_.Smooth`,
 * github.com/ipab-slmc/exotica
 * exotations/solvers/exotica_time_indexed_rrt_connect_solver/src/time_indexed_rrt_connect.cpp
 * at commit cb0124423e7e22c0018a6ff8d5bfb0b5feee7f97, BSD-3-Clause, Copyright
 * (c) 2018, University of Edinburgh), over OMPL's path simplifier
 * (`ompl::geometric::PathSimplifier`, github.com/ompl/ompl
 * src/ompl/geometric/src/PathSimplifier.cpp at commit
 * 340bd214be6e87fe758a75e04203d665429b020f, BSD-3-Clause, Copyright (c) 2008,
 * Willow Garage, Inc.): `reduceVertices`, `collapseCloseVertices`, then
 * `reduceVertices` at most ten times more while it shortens, then the partial
 * shortcut (`partialShortcutPath`, the function EXOTica calls `shortcutPath`)
 * while it shortens, the ten passes counted together; each step only while the
 * planner's termination condition has not fired. Path cost is OMPL's default
 * objective, the path's length in the space's metric.
 */
export namespace HumanArmPathSimplify {
  /*
   * The space a path lies in, as the simplifier reads it.
   */
  export interface ISpace {
    /*
     * The metric (`StateSpace::distance`).
     */
    distance: (a: readonly number[], b: readonly number[]) => number;

    /*
     * The state a share of the way from one to another (`interpolate`).
     */
    interpolate: (
      a: readonly number[],
      b: readonly number[],
      t: number,
    ) => number[];

    /*
     * Whether the straight motion between two states is valid (`checkMotion`).
     */
    checkMotion: (a: readonly number[], b: readonly number[]) => boolean;
  }

  /*
   * OMPL's iteration termination condition
   * (`ompl::base::IterationTerminationCondition`,
   * src/ompl/base/terminationconditions/src/IterationTerminationCondition.cpp
   * at the same commit): it fires once it has been asked more than `max`
   * times.
   */
  export interface ITermination {
    /*
     * How many times it has been asked (`timesCalled_`).
     */
    calls: number;

    /*
     * How many asks it answers no to (`maxCalls_`).
     */
    max: number;
  }

  /*
   * Ask the termination condition (`IterationTerminationCondition::eval`).
   * Parameter ptc: The condition, its count advanced.
   * Returns: Whether the planner must stop.
   */
  export function fired(ptc: ITermination): boolean {
    ++ptc.calls;
    return ptc.calls > ptc.max;
  }

  /*
   * EXOTica's smoothing of a solution path (`GetPath`, `Smooth`).
   * Parameter path: The path's states, shortened in place.
   * Parameter space: The space.
   * Parameter rng: The planner's generator.
   * Parameter ptc: The planner's termination condition.
   */
  export function smooth(
    path: number[][],
    space: ISpace,
    rng: MT.IState,
    ptc: ITermination,
  ): void {
    let tryMore: boolean = false;
    if (!fired(ptc)) tryMore = reduceVertices(path, space, rng);
    if (!fired(ptc)) collapseCloseVertices(path, space);
    let times: number = 0;
    while (times < 10 && tryMore && !fired(ptc)) {
      tryMore = reduceVertices(path, space, rng);
      ++times;
    }
    if (!fired(ptc)) tryMore = partialShortcutPath(path, space, rng);
    else tryMore = false;
    while (times < 10 && tryMore && !fired(ptc)) {
      tryMore = partialShortcutPath(path, space, rng);
      ++times;
    }
  }

  /*
   * `PathSimplifier::reduceVertices` at its defaults (`maxSteps` and
   * `maxEmptySteps` the state count, `rangeRatio` 0.33): the whole path joined
   * where its ends see each other, else random vertex pairs within the range
   * joined where their segment is valid.
   */
  function reduceVertices(
    states: number[][],
    space: ISpace,
    rng: MT.IState,
  ): boolean {
    if (states.length < 3) return false;
    const maxSteps: number = states.length;
    const maxEmptySteps: number = states.length;
    const rangeRatio: number = 0.33;
    let result: boolean = false;
    let nochange: number = 0;
    if (space.checkMotion(states[0]!, states[states.length - 1]!)) {
      states.splice(1, states.length - 2);
      return true;
    }
    for (
      let i: number = 0;
      i < maxSteps && nochange < maxEmptySteps;
      ++i, ++nochange
    ) {
      const count: number = states.length;
      const maxN: number = count - 1;
      const range: number = 1 + Math.floor(0.5 + count * rangeRatio);
      let p1: number = MT.uniformInt(rng, 0, maxN);
      let p2: number = MT.uniformInt(
        rng,
        Math.max(p1 - range, 0),
        Math.min(maxN, p1 + range),
      );
      if (Math.abs(p1 - p2) < 2) {
        if (p1 < maxN - 1) p2 = p1 + 2;
        else if (p1 > 1) p2 = p1 - 2;
        else continue;
      }
      if (p1 > p2) [p1, p2] = [p2, p1];
      if (space.checkMotion(states[p1]!, states[p2]!)) {
        states.splice(p1 + 1, p2 - p1 - 1);
        nochange = 0;
        result = true;
      }
    }
    return result;
  }

  /*
   * `PathSimplifier::collapseCloseVertices` at its defaults: the closest pair
   * of non-adjacent vertices joined where their segment is valid, a pair whose
   * segment is not valid set aside.
   */
  function collapseCloseVertices(states: number[][], space: ISpace): boolean {
    if (states.length < 3) return false;
    const maxSteps: number = states.length;
    const maxEmptySteps: number = states.length;

    // Pairwise distances, the states keyed by identity as OMPL keys them.
    const distances: Map<
      readonly number[],
      Map<readonly number[], number>
    > = new Map();
    const pairDistance: (
      a: readonly number[],
      b: readonly number[],
    ) => number = (a: readonly number[], b: readonly number[]): number =>
      distances.get(a)!.get(b)!;
    for (let i: number = 0; i < states.length; ++i) {
      const row: Map<readonly number[], number> = new Map();
      for (let j: number = i + 2; j < states.length; ++j)
        row.set(states[j]!, space.distance(states[i]!, states[j]!));
      distances.set(states[i]!, row);
    }
    let result: boolean = false;
    let nochange: number = 0;
    for (
      let s: number = 0;
      s < maxSteps && nochange < maxEmptySteps;
      ++s, ++nochange
    ) {
      let minDist: number = Infinity;
      let p1: number = -1;
      let p2: number = -1;
      for (let i: number = 0; i < states.length; ++i)
        for (let j: number = i + 2; j < states.length; ++j) {
          const d: number = pairDistance(states[i]!, states[j]!);
          if (d < minDist) {
            minDist = d;
            p1 = i;
            p2 = j;
          }
        }
      if (p1 < 0 || p2 < 0) break;
      if (space.checkMotion(states[p1]!, states[p2]!)) {
        states.splice(p1 + 1, p2 - p1 - 1);
        result = true;
        nochange = 0;
      } else distances.get(states[p1]!)!.set(states[p2]!, Infinity);
    }
    return result;
  }

  /*
   * `PathSimplifier::partialShortcutPath` at its defaults (`maxSteps` and
   * `maxEmptySteps` the state count, `rangeRatio` 0.33, `snapToVertex` 0.005):
   * two random points along the path, the second within the range of the first,
   * each snapped to a vertex nearer than the threshold, joined where their
   * segment is valid and shorter than the path between them.
   */
  function partialShortcutPath(
    states: number[][],
    space: ISpace,
    rng: MT.IState,
  ): boolean {
    if (states.length < 3) return false;
    const maxSteps: number = states.length;
    const maxEmptySteps: number = states.length;
    const rangeRatio: number = 0.33;
    const snapToVertex: number = 0.005;

    // The path length up to each state (OMPL's costs and dists alike).
    const dists: number[] = [0];
    for (let i: number = 1; i < states.length; ++i)
      dists.push(dists[i - 1]! + space.distance(states[i - 1]!, states[i]!));
    let threshold: number = dists[dists.length - 1]! * snapToVertex;
    let rd: number = rangeRatio * dists[dists.length - 1]!;
    let result: boolean = false;
    let nochange: number = 0;
    for (
      let i: number = 0;
      i < maxSteps && nochange < maxEmptySteps;
      ++i, ++nochange
    ) {
      const total: number = dists[dists.length - 1]!;
      const distTo0: number = MT.uniformReal(rng, 0, total);
      const [pos0, index0]: ISnap = snap(dists, distTo0, threshold);
      const distTo1: number = MT.uniformReal(
        rng,
        Math.max(0, distTo0 - rd),
        Math.min(distTo0 + rd, total),
      );
      const [pos1, index1]: ISnap = snap(dists, distTo1, threshold);

      // Points on the same path segment are not worth a try.
      if (
        pos0 === pos1 ||
        index0 === pos1 ||
        index1 === pos0 ||
        pos0 + 1 === index1 ||
        pos1 + 1 === index0 ||
        (index0 >= 0 && index1 >= 0 && Math.abs(index0 - index1) < 2)
      )
        continue;
      const at: (pos: number, index: number, d: number) => number[] = (
        pos: number,
        index: number,
        d: number,
      ): number[] =>
        index >= 0
          ? states[index]!
          : space.interpolate(
              states[pos]!,
              states[pos + 1]!,
              (d - dists[pos]!) / (dists[pos + 1]! - dists[pos]!),
            );
      let s0: number[] = at(pos0, index0, distTo0);
      let s1: number[] = at(pos1, index1, distTo1);
      if (!space.checkMotion(s0, s1)) continue;
      let [p0, p1, i0, i1]: [number, number, number, number] = [
        pos0,
        pos1,
        index0,
        index1,
      ];
      if (p0 > p1) {
        [p0, p1] = [p1, p0];
        [i0, i1] = [i1, i0];
        [s0, s1] = [s1, s0];
      }

      // The shortcut must be shorter than the path between its ends.
      let alongPath: number = i0 >= 0 ? 0 : space.distance(s0, states[p0 + 1]!);
      for (let k: number = p0 + 1; k < p1; ++k)
        alongPath += space.distance(states[k]!, states[k + 1]!);
      alongPath += i1 >= 0 ? 0 : space.distance(states[p1]!, s1);
      if (alongPath < space.distance(s0, s1)) continue;

      if (i0 < 0 && i1 < 0) {
        if (p0 + 1 === p1) {
          states[p1] = s0;
          states.splice(p1 + 1, 0, s1);
        } else {
          states[p0 + 1] = s0;
          states[p1] = s1;
          states.splice(p0 + 2, p1 - p0 - 2);
        }
      } else if (i0 >= 0 && i1 >= 0) states.splice(i0 + 1, i1 - i0 - 1);
      else if (i0 < 0 && i1 >= 0) {
        states[p0 + 1] = s0;
        states.splice(p0 + 2, i1 - p0 - 2);
      } else {
        states[p1] = s1;
        states.splice(i0 + 1, p1 - i0 - 1);
      }

      // The helper lengths from the first changed state on.
      dists.length = states.length;
      for (let j: number = p0 + 1; j < states.length; ++j)
        dists[j] = dists[j - 1]! + space.distance(states[j - 1]!, states[j]!);
      threshold = dists[dists.length - 1]! * snapToVertex;
      rd = rangeRatio * dists[dists.length - 1]!;
      result = true;
      nochange = 0;
    }
    return result;
  }

  /*
   * A point along the path as `partialShortcutPath` places it: the index of the
   * waypoint at or after it (`std::lower_bound`), moved back to the segment's
   * start, and the waypoint it snaps to, or -1.
   */
  function snap(dists: readonly number[], d: number, threshold: number): ISnap {
    let lower: number = dists.findIndex((v: number): boolean => v >= d);
    let pos: number = lower < 0 ? dists.length - 1 : lower;
    if (pos === 0 || dists[pos]! - d < threshold) return [pos, pos];
    while (pos > 0 && d < dists[pos]!) --pos;
    lower = d - dists[pos]! < threshold ? pos : -1;
    return [pos, lower];
  }

  /*
   * A point's segment start and the waypoint it snapped to, or -1.
   */
  type ISnap = [number, number];
}
