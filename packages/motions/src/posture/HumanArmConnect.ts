import { HumanArmPathSimplify as Simplify } from "./HumanArmPathSimplify";
import { HumanMersenneTwister as MT } from "./HumanMersenneTwister";
import { HumanRandomSeeds } from "./HumanRandomSeeds";

/**
 * A valid path between two configurations of a time-indexed joint space:
 * EXOTica's time-indexed RRT-Connect (`OMPLTimeIndexedRRTConnect`,
 * github.com/ipab-slmc/exotica
 * exotations/solvers/exotica_time_indexed_rrt_connect_solver/src/time_indexed_rrt_connect.cpp
 * and
 * include/exotica_time_indexed_rrt_connect_solver/time_indexed_rrt_connect.h at
 * commit cb0124423e7e22c0018a6ff8d5bfb0b5feee7f97, BSD-3-Clause, Copyright (c)
 * 2018, University of Edinburgh), itself OMPL's RRT-Connect
 * (`ompl::geometric::RRTConnect`, github.com/ompl/ompl
 * src/ompl/geometric/planners/rrt/src/RRTConnect.cpp at commit
 * 340bd214be6e87fe758a75e04203d665429b020f, BSD-3-Clause, Copyright (c) 2008,
 * Willow Garage, Inc.; Kuffner and LaValle 2000, ICRA) over a compound space of
 * the joint coordinates and a time coordinate: the start tree reaches only
 * forward in time and the goal tree only backward (`reverseTimeDistance`,
 * `forwardTimeDistance`, `correctTime`); the trees swap each iteration, the one
 * grown toward a uniform sample, the other connected toward the state it added.
 * The space is OMPL's `CompoundStateSpace` of a `RealVectorStateSpace` and a
 * `TimeStateSpace`, each weighted 1: its distance the sum of the joint
 * coordinates' Euclidean distance in radians and the time's in seconds, a
 * tree's step EXOTica's default range (`RANGE`), and a motion checked by
 * `DiscreteMotionValidator::checkMotion`, the end state first, then the
 * midpoints of a queue of intervals, at a hundredth of each component's extent
 * (`longestValidSegmentFraction_`). The planner stops when OMPL's iteration
 * condition fires (`IterationTerminationCondition`, its count `ITERATIONS`),
 * asked as OMPL's planner asks it; its draws are OMPL's generators'
 * (`HumanMersenneTwister`), each seeded by OMPL's seed generator
 * (`HumanRandomSeeds`) from its engine's default first seed. The path found is
 * smoothed as EXOTica smooths it (`HumanArmPathSimplify`).
 *
 * An invalid start is repaired as MoveIt's start-state adapter repairs it
 * (`FixStartStateCollision`, `repair`), and the path leaves the start for the
 * repaired state, as the adapter prefixes it.
 */
export namespace HumanArmConnect {
  /** A query. */
  export interface IQuery {
    /** The configuration the path leaves, its time coordinate last. */
    start: readonly number[];

    /** The configuration it reaches, its time coordinate last. */
    goal: readonly number[];

    /** Each joint coordinate's least value (`RealVectorBounds::low`). */
    low: readonly number[];

    /** Each joint coordinate's greatest value (`RealVectorBounds::high`). */
    high: readonly number[];

    /** Whether a configuration is valid at the time it carries. */
    valid: (q: readonly number[]) => boolean;

    /** The seconds one unit of the time coordinate spans. */
    seconds: number;

    /**
     * Each joint coordinate's velocity limit, coordinate units per second
     * (`GetVelocityLimits`).
     */
    velocities: readonly number[];
  }

  /**
   * The path from the start to the goal.
   *
   * @param query The query.
   * @returns The path's states from the start to the goal, or `null` when the
   *   goal is invalid, the start is invalid and no draw repairs it, or the
   *   trees did not meet before the iteration condition fired.
   */
  export function connect(query: IQuery): number[][] | null {
    const space: ISpace = spaceOf(query);

    // Each generator draws its own local seed from OMPL's seed generator,
    // in the order a MoveIt request creates them: the simplifier with the
    // planning context, the start repair before planning, the planner's
    // sampler when it solves (`RNG::RNG`, `RNGSeedGenerator::nextSeed`).
    const seeds: HumanRandomSeeds.IState = HumanRandomSeeds.create(
      HumanRandomSeeds.DEFAULT_SEED,
    );
    const simplifying: MT.IState = MT.create(HumanRandomSeeds.next(seeds));
    const repairing: MT.IState = MT.create(HumanRandomSeeds.next(seeds));
    const sampling: MT.IState = MT.create(HumanRandomSeeds.next(seeds));
    const ptc: Simplify.ITermination = { calls: 0, max: ITERATIONS };
    if (!query.valid(query.goal)) return null;
    const repaired: boolean = !query.valid(query.start);
    const root: number[] | null = repaired
      ? repair(query, repairing)
      : [...query.start];
    if (root === null) return null;

    const start: ITree = { nodes: [root], parent: [-1], forward: true };
    const goal: ITree = { nodes: [], parent: [], forward: false };
    let startTree: boolean = true;
    while (!Simplify.fired(ptc)) {
      const tree: ITree = startTree ? start : goal;
      startTree = !startTree;
      const other: ITree = startTree ? start : goal;

      // The goal state joins its tree at the first iteration, a valid goal
      // sampled without asking the condition (`PlannerInputStates::nextGoal`).
      if (goal.nodes.length === 0) {
        goal.nodes.push([...query.goal]);
        goal.parent.push(-1);
      }

      // Grow toward a uniform sample, then connect the other tree toward the
      // state added.
      const sample: number[] = space.sample(sampling);
      const grown: IGrowth = grow(tree, sample, space, false);
      if (grown.state === "trapped") continue;
      const target: number[] = [...tree.nodes[grown.added]!];
      let connected: IGrowth = { state: "advanced", added: -1 };
      while (!Simplify.fired(ptc) && connected.state === "advanced")
        connected = grow(other, target, space, true);
      if (connected.state !== "reached") continue;

      // The path: the start tree's branch, then the goal tree's, the joined
      // state once (the reaching tree's own copy dropped).
      let startEnd: number = tree.forward ? grown.added : connected.added;
      let goalEnd: number = tree.forward ? connected.added : grown.added;
      if (start.parent[startEnd]! >= 0) startEnd = start.parent[startEnd]!;
      else goalEnd = goal.parent[goalEnd]!;
      const path: number[][] = [
        ...branch(start, startEnd).reverse(),
        ...branch(goal, goalEnd),
      ];
      Simplify.smooth(path, space, simplifying, ptc);
      return repaired ? [[...query.start], ...path] : path;
    }
    return null;
  }

  /**
   * The configuration a share of the way from one to another
   * (`StateSpace::interpolate`, component by component).
   *
   * @param a The configuration at share 0.
   * @param b The configuration at share 1.
   * @param u The share.
   * @returns The configuration.
   */
  export function lerp(
    a: readonly number[],
    b: readonly number[],
    u: number,
  ): number[] {
    return a.map((v: number, i: number): number => v + (b[i]! - v) * u);
  }

  /**
   * A seeded generator of numbers in [0, 1) (mulberry32), kept for its caller
   * outside the planner (`floor/sleep.ts`).
   *
   * @param seed The seed.
   * @returns The generator; each call returns the next number.
   */
  export function generator(seed: number): () => number {
    let s: number = seed >>> 0;
    return (): number => {
      s = (s + 0x6d2b79f5) >>> 0;
      let t: number = s;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  /**
   * OMPL's compound space of the query: its metric, its uniform sampler, its
   * motion validator and a tree's step.
   */
  function spaceOf(query: IQuery): ISpace {
    const dims: number = query.low.length;
    const time: [number, number] = [query.start[dims]!, query.goal[dims]!];
    const joints: number = Math.hypot(
      ...query.low.map(
        (low: number, i: number): number => query.high[i]! - low,
      ),
    );
    const span: number = time[1] - time[0];
    const distance: Metric = (
      a: readonly number[],
      b: readonly number[],
    ): number =>
      RADIANS *
        Math.hypot(
          ...a.slice(0, dims).map((v: number, i: number): number => v - b[i]!),
        ) +
      query.seconds * Math.abs(a[dims]! - b[dims]!);

    // `CompoundStateSpace::validSegmentCount`: the larger of the components'
    // counts, each its distance over a hundredth of its extent.
    const segments: Metric = (
      a: readonly number[],
      b: readonly number[],
    ): number =>
      Math.max(
        Math.ceil(
          Math.hypot(
            ...a
              .slice(0, dims)
              .map((v: number, i: number): number => v - b[i]!),
          ) /
            (LONGEST_VALID * joints),
        ),
        Math.ceil(Math.abs(a[dims]! - b[dims]!) / (LONGEST_VALID * span)),
      );
    const checkMotion: Motion = (
      a: readonly number[],
      b: readonly number[],
    ): boolean => {
      if (!query.valid(b)) return false;
      const nd: number = segments(a, b);
      if (nd < 2) return true;
      const queue: [number, number][] = [[1, nd - 1]];
      for (let next: number = 0; next < queue.length; ++next) {
        const [first, second]: [number, number] = queue[next]!;
        const mid: number = Math.floor((first + second) / 2);
        if (!query.valid(lerp(a, b, mid / nd))) return false;
        if (first < mid) queue.push([first, mid - 1]);
        if (second > mid) queue.push([mid + 1, second]);
      }
      return true;
    };
    return {
      distance,
      interpolate: lerp,
      checkMotion,
      valid: query.valid,
      sample: (rng: MT.IState): number[] => [
        ...query.low.map((low: number, i: number): number =>
          MT.uniformReal(rng, low, query.high[i]!),
        ),
        MT.uniformReal(rng, time[0], time[1]),
      ],
      range: RANGE,
      time,
      dims,
      velocities: query.velocities.map(
        (v: number): number => v * query.seconds,
      ),
    };
  }

  /**
   * EXOTica's `growTree`: the tree's nearest state that the time order admits,
   * the sample's time corrected (`correctTime`), a step of the tree's range
   * toward it, kept where its motion is valid.
   *
   * @param check EXOTica's `reverse_check_`: while the other tree connects, a
   *   sample too near in time is refused rather than moved.
   */
  function grow(
    tree: ITree,
    sample: number[],
    space: ISpace,
    check: boolean,
  ): IGrowth {
    // The nearest by the time-ordered distance: a state the time order
    // refuses is 1e10 away (`reverseTimeDistance`, `forwardTimeDistance`).
    let near: number = 0;
    let least: number = Infinity;
    tree.nodes.forEach((node: readonly number[], i: number): void => {
      const late: boolean = tree.forward
        ? node[space.dims]! > sample[space.dims]!
        : node[space.dims]! < sample[space.dims]!;
      const d: number = late ? REFUSED : space.distance(sample, node);
      if (d < least) {
        least = d;
        near = i;
      }
    });
    const from: readonly number[] = tree.nodes[near]!;

    // correctTime (time_indexed_rrt_connect.h): the least time between the
    // two states is the slowest coordinate's, its change over its velocity
    // limit; a sample nearer in time is moved to it, forward from the start
    // tree and backward from the goal tree, in place, or refused while the
    // other tree connects; a time outside the query's is refused.
    let shortest: number = 0;
    for (let i: number = 0; i < space.dims; ++i)
      shortest = Math.max(
        shortest,
        Math.abs(sample[i]! - from[i]!) / space.velocities[i]!,
      );
    let changed: boolean = false;
    if (Math.abs(sample[space.dims]! - from[space.dims]!) < shortest) {
      if (check) return { state: "trapped", added: -1 };
      sample[space.dims] =
        from[space.dims]! + (tree.forward ? shortest : -shortest);
      changed = true;
    }
    if (
      sample[space.dims]! < space.time[0] ||
      sample[space.dims]! > space.time[1]
    )
      return { state: "trapped", added: -1 };
    let reach: boolean = !changed;
    let state: number[] = [...sample];
    const d: number = space.distance(from, sample);
    if (d > space.range) {
      state = lerp(from, sample, space.range / d);
      reach = false;
    }
    const valid: boolean = tree.forward
      ? space.checkMotion(from, state)
      : space.valid(state) && space.checkMotion(state, from);
    if (!valid) return { state: "trapped", added: -1 };
    tree.nodes.push(state);
    tree.parent.push(near);
    return {
      state: reach ? "reached" : "advanced",
      added: tree.nodes.length - 1,
    };
  }

  /** A tree's states from one to its root. */
  function branch(tree: ITree, from: number): number[][] {
    const out: number[][] = [];
    for (let i: number = from; i >= 0; i = tree.parent[i]!)
      out.push(tree.nodes[i]!);
    return out;
  }

  /**
   * MoveIt's start repair (`FixStartStateCollision::adaptAndPlan`,
   * moveit/moveit
   * moveit_ros/planning/planning_request_adapter_plugins/src/fix_start_state_collision.cpp
   * lines 125-149 at commit f6a684f979ded4ac93c6c66a699d74b2c7d52864,
   * BSD-3-Clause, Copyright (c) 2012, Willow Garage, Inc.): each attempt walks
   * the joint coordinates in order, draws one uniformly within `JIGGLE` of its
   * range about its original value, clipped to the range
   * (`getVariableRandomPositionsNearBy`), keeps it in the state, and stops at
   * the first valid state; the time is kept.
   */
  function repair(query: IQuery, rng: MT.IState): number[] | null {
    const dims: number = query.low.length;
    const state: number[] = [...query.start];
    for (let c: number = 0; c < ATTEMPTS; ++c)
      for (let i: number = 0; i < dims; ++i) {
        const reach: number = JIGGLE * (query.high[i]! - query.low[i]!);
        state[i] = MT.uniformReal(
          rng,
          Math.max(query.low[i]!, query.start[i]! - reach),
          Math.min(query.high[i]!, query.start[i]! + reach),
        );
        if (query.valid(state)) return state;
      }
    return null;
  }
  /** The compound space as the planner reads it. */
  interface ISpace extends Simplify.ISpace {
    /** A uniform sample (`CompoundStateSampler::sampleUniform`). */
    sample: (rng: MT.IState) => number[];

    /** Whether a state is valid (`StateValidityChecker::isValid`). */
    valid: (q: readonly number[]) => boolean;

    /** A tree's step (`maxDistance_`). */
    range: number;

    /** The time coordinate's bounds, the start's and the goal's. */
    time: [number, number];

    /** The joint coordinates' count; the time coordinate's index. */
    dims: number;

    /**
     * Each joint coordinate's velocity limit, coordinate units per unit of the
     * time coordinate.
     */
    velocities: number[];
  }

  /** A tree: its states and each one's parent, -1 at its root. */
  interface ITree {
    /** The states. */
    nodes: number[][];

    /** Each state's parent's index. */
    parent: number[];

    /** Whether the tree grows from the start, forward in time. */
    forward: boolean;
  }

  /** What growing a tree did, and the index of the state it added. */
  interface IGrowth {
    /** `REACHED`, `ADVANCED` or `TRAPPED`. */
    state: GrowState;

    /** The added state's index; -1 when trapped. */
    added: number;
  }

  /** A number of two states: a distance or a segment count. */
  type Metric = (a: readonly number[], b: readonly number[]) => number;

  /** Whether the motion between two states is valid. */
  type Motion = (a: readonly number[], b: readonly number[]) => boolean;

  /** EXOTica's and OMPL's `GrowState`. */
  type GrowState = "reached" | "advanced" | "trapped";
}

/**
 * A tree's step (`maxDistance_`): EXOTica's default `Range` "1"
 * (exotations/solvers/exotica_time_indexed_rrt_connect_solver/init/time_indexed_rrt_connect.in
 * at the same commit), which the solver sets before the planner's setup
 * (time_indexed_rrt_connect.cpp line 127), so OMPL's automatic range
 * (`SelfConfig::configurePlannerRange`) keeps it. The metric is EXOTica's,
 * joint radians plus time seconds.
 */
const RANGE: number = 1;

/** A coordinate's unit in radians: the arms' coordinates are near a degree. */
const RADIANS: number = Math.PI / 180;

/**
 * A motion's check spacing, a share of each component's extent: OMPL's
 * `longestValidSegmentFraction_` default (StateSpace.cpp line 93).
 */
const LONGEST_VALID: number = 0.01;

/** The distance EXOTica gives a state the time order refuses. */
const REFUSED: number = 1e10;

/**
 * The iteration condition's count: OMPL's own deterministic test of a
 * time-indexed RRT bounds its planner by `IterationTerminationCondition
 * itc(1000)` (tests/geometric/spacetime/STRRTstar_test.cpp line 142 at the same
 * commit), the form MoveIt exposes as `termination_condition: Iteration[n]`
 * (moveit/moveit2 moveit_planners/ompl/ompl_interface/src/
 * model_based_planning_context.cpp lines 571-584 at commit
 * 8c99e523bc23149d24a61990c64d53c9c7d2905f, BSD-3-Clause).
 */
const ITERATIONS: number = 1000;

/**
 * How far a repaired start's coordinates may move, a share of each one's range:
 * MoveIt's `FixStartStateCollision` default `jiggle_fraction`.
 */
const JIGGLE: number = 0.02;

/**
 * The draws a start's repair tries: MoveIt's `FixStartStateCollision` default
 * `max_sampling_attempts`.
 */
const ATTEMPTS: number = 100;
