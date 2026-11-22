/**
 * A valid path between two configurations of a joint space, by RRT-Connect
 * (Kuffner and LaValle 2000, "RRT-Connect: an efficient approach to
 * single-query path planning", ICRA): two trees grown from the start and the
 * goal, each extended a step toward a sample and the other connected toward
 * the new vertex by repeated steps, the roles swapped every iteration. The
 * first sample is the goal itself, so where the straight segment is valid
 * the trees meet on it at once. The path is then shortcut, each vertex joined
 * to the farthest later one its straight segment reaches. Samples come from a
 * seeded generator, and the iterations are counted rather than timed, so a
 * query has one answer; the step and the edge's check spacing are OMPL's
 * defaults, a fifth and a hundredth of the space's extent.
 *
 * A query whose validity changes along the path, as a body moves while an
 * arm reaches, indexes its configurations by a coordinate that rises from
 * the start to the goal (`IQuery.rising`), and each state is valid or not
 * where that coordinate puts it: the time-indexed RRT-Connect of EXOTica
 * (ipab-slmc/exotica, `time_indexed_rrt_connect`), whose start tree grows
 * only forward in time and whose goal tree only backward, by directional
 * distances that refuse the other way.
 *
 * A start the validity reading refuses (an arm shown a hair deeper in the
 * body than the planner's margin lets a state lie) is repaired as MoveIt's
 * start-state adapter repairs it (`FixStartStateCollision`): a valid state
 * is drawn near it, each coordinate perturbed by up to `JIGGLE` of the
 * space's extent, `ATTEMPTS` times at most, and the path leaves the start
 * for that state, the planner growing its tree from there; a start no draw
 * repairs has no path.
 *
 * Every step of a tree is `RANGE` of the extent long, so connecting a tree to
 * a vertex `d` away ends after at most `d / range` steps; a space whose
 * extent is zero or not finite steps no length (or none that is a number), a
 * connection would add the same vertex without end, and such a query is
 * refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the planner and its sources, the time-indexed variant, the start repair, the step that bounds a connection and the refused extent.
 * @evidence contracts/development/design.md#principled-representation A query is a joint space's two configurations, its sampler, its validity reading, its extent and its optional rising coordinate; the result is a path of configurations or none.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The query, the planner, and the distance, interpolation and seeded generator it and its arm-seed caller read.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint, arm or body is named; the step, spacing and repair are OMPL's and MoveIt's defaults as shares of the extent.
 */
export namespace HumanArmConnect {
  /** A query. */
  export interface IQuery {
    /** The configuration the path leaves. */
    start: readonly number[];
    /** The configuration it reaches. */
    goal: readonly number[];
    /** A configuration drawn uniformly from the space, from the generator's numbers in [0, 1). */
    sample: (random: () => number) => number[];
    /** Whether a configuration is valid. */
    valid: (q: readonly number[]) => boolean;
    /** The space's largest extent, coordinate units. */
    extent: number;
    /** The index of the coordinate that rises from the start to the goal along every edge; none when absent. */
    rising?: number;
  }

  /**
   * The path from the start to the goal.
   *
   * @param query The query.
   * @returns The path's vertices from the start to the goal, or `null` when the goal is invalid, the start is invalid and no draw near it repairs it, or the trees did not meet.
   * @throws {RangeError} For an extent that is not positive and finite, across which no step advances a tree.
   */
  export function connect(input: IQuery): number[][] | null {
    if (!(Number.isFinite(input.extent) && input.extent > 0))
      throw new RangeError(
        `A joint space's extent must be positive and finite for a tree to step across it, not ${input.extent}`,
      );
    // Each state is checked once: the trees, their extensions and the
    // shortcut meet the same states again, and a state's validity is a pure
    // function of it, so it is kept by its coordinates for the query.
    const known: Map<string, boolean> = new Map();
    const query: IQuery = {
      ...input,
      valid: (q: readonly number[]): boolean => {
        const key: string = q.join(",");
        let found: boolean | undefined = known.get(key);
        if (found === undefined) {
          found = input.valid(q);
          known.set(key, found);
        }
        return found;
      },
    };
    if (!query.valid(query.goal)) return null;
    const range: number = RANGE * query.extent;
    const resolution: number = RESOLUTION * query.extent;
    const random: () => number = generator(SEED);
    const fixed: boolean = !query.valid(query.start);
    const root: number[] | undefined = fixed
      ? repaired(query, random)
      : [...query.start];
    if (root === undefined) return null;

    // A repaired start's path leaves the start itself for the repaired state.
    const leave = (path: number[][]): number[][] =>
      fixed ? [[...query.start], ...path] : path;
    // Each edge is checked once, whichever tree or the shortcut asks.
    const edges: Map<string, boolean> = new Map();
    const clear = (a: readonly number[], b: readonly number[]): boolean => {
      const key: string = `${a.join(",")}|${b.join(",")}`;
      const seen: boolean | undefined = edges.get(key);
      if (seen !== undefined) return seen;
      // The edge is open where every state at its spacing is valid. They are
      // read the far end first, then by bisection, OMPL's discrete motion
      // validator's order: an obstacle across the edge is met after a few
      // states rather than after the states before it, and an open edge
      // reads every state once all the same.
      const steps: number = Math.ceil(distance(a, b) / resolution);
      let open: boolean = steps < 1 || query.valid(lerp(a, b, 1));
      const intervals: [number, number][] = [[0, steps]];
      for (let next: number = 0; open && next < intervals.length; ++next) {
        const [low, high]: [number, number] = intervals[next]!;
        if (high - low < 2) continue;
        const middle: number = Math.floor((low + high) / 2);
        if (!query.valid(lerp(a, b, middle / steps))) open = false;
        intervals.push([low, middle], [middle, high]);
      }
      edges.set(key, open);
      return open;
    };
    const from: ITree = {
      nodes: [root],
      parent: [-1],
      forward: true,
    };
    const to: ITree = {
      nodes: [[...query.goal]],
      parent: [-1],
      forward: false,
    };

    // An edge of a tree runs the way its tree grows in the rising
    // coordinate: up from the start, down from the goal.
    const admits = (
      tree: ITree,
      node: readonly number[],
      q: readonly number[],
    ): boolean =>
      query.rising === undefined ||
      (tree.forward
        ? q[query.rising]! > node[query.rising]!
        : q[query.rising]! < node[query.rising]!);
    // Extend a tree one step toward a configuration.
    const extend = (tree: ITree, q: readonly number[]): Status => {
      let near: number = 0;
      let least: number = Infinity;
      tree.nodes.forEach((node: readonly number[], i: number): void => {
        if (!admits(tree, node, q)) return;
        const d: number = distance(node, q);
        if (d < least) {
          least = d;
          near = i;
        }
      });
      if (least === Infinity) return "trapped";
      const reached: boolean = least <= range;
      const next: number[] = reached
        ? [...q]
        : lerp(tree.nodes[near]!, q, range / least);
      if (!clear(tree.nodes[near]!, next)) return "trapped";
      tree.nodes.push(next);
      tree.parent.push(near);
      return reached ? "reached" : "advanced";
    };
    let a: ITree = from;
    let b: ITree = to;
    for (let i: number = 0; i < ((globalThis as { G1_ITER?: number }).G1_ITER ?? ITERATIONS); ++i) {
      const target: number[] = i === 0 ? [...query.goal] : query.sample(random);
      if (extend(a, target) !== "trapped") {
        const made: number[] = a.nodes[a.nodes.length - 1]!;
        let status: Status;
        do status = extend(b, made);
        while (status === "advanced");
        if (status === "reached")
          return leave(shortcut(joined(from, to), clear));
      }
      [a, b] = [b, a];
    }
    return null;
  }

  /**
   * A valid state near an invalid start, MoveIt's start-state repair: each
   * coordinate but the rising one moved by a uniform draw of up to `JIGGLE`'s
   * share of the space's extent either way, the first valid draw of at most
   * `ATTEMPTS` kept.
   *
   * @param query The query.
   * @param random The query's generator.
   * @returns The state, or undefined when no draw is valid.
   */
  function repaired(query: IQuery, random: () => number): number[] | undefined {
    const reach: number = JIGGLE * query.extent;
    for (let i: number = 0; i < ATTEMPTS; ++i) {
      const q: number[] = query.start.map((v: number, d: number): number =>
        d === query.rising ? v : v + (2 * random() - 1) * reach,
      );
      if (query.valid(q)) return q;
    }
    return undefined;
  }

  /** The path through the two trees' last vertices, which coincide: the start tree's from its root, then the goal tree's to its root. */
  function joined(from: ITree, to: ITree): number[][] {
    const trace = (tree: ITree): number[][] => {
      const out: number[][] = [];
      for (let i: number = tree.nodes.length - 1; i >= 0; i = tree.parent[i]!)
        out.push(tree.nodes[i]!);
      return out;
    };
    return [...trace(from).reverse(), ...trace(to).slice(1)];
  }

  /** The path with each vertex joined to the farthest later one its straight segment reaches. */
  function shortcut(
    path: number[][],
    clear: (a: readonly number[], b: readonly number[]) => boolean,
  ): number[][] {
    const out: number[][] = [path[0]!];
    let i: number = 0;
    while (i < path.length - 1) {
      let j: number = path.length - 1;
      while (j > i + 1 && !clear(path[i]!, path[j]!)) --j;
      out.push(path[j]!);
      i = j;
    }
    return out;
  }

  /**
   * The Euclidean distance of two configurations.
   *
   * @param a One configuration.
   * @param b The other.
   * @returns The distance, coordinate units.
   */
  export function distance(a: readonly number[], b: readonly number[]): number {
    let s: number = 0;
    for (let i: number = 0; i < a.length; ++i) s += (a[i]! - b[i]!) ** 2;
    return Math.sqrt(s);
  }

  /**
   * The configuration a share of the way from one to another.
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
   * A seeded generator of numbers in [0, 1) (mulberry32).
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
}

/** What extending a tree toward a configuration did: reached it, moved a step toward it, or was stopped by an invalid edge. */
type Status = "reached" | "advanced" | "trapped";

/** A tree: its vertices, each one's parent, -1 at the root, and whether it grows from the start. */
interface ITree {
  nodes: number[][];
  parent: number[];
  forward: boolean;
}

/** A step of a tree toward a sample, a share of the space's extent: OMPL's default range. */
const RANGE: number = 0.2;

/** The spacing of the validity checks along an edge, a share of the space's extent: OMPL's longest valid segment. */
const RESOLUTION: number = 0.01;

/** How far a repaired start's coordinates may move, a share of the space's extent: MoveIt's `FixStartStateCollision` default `jiggle_fraction`. */
const JIGGLE: number = 0.02;

/** The draws a start's repair tries: MoveIt's `FixStartStateCollision` default `max_sampling_attempts`. */
const ATTEMPTS: number = 100;

/** Iterations before the query is given up. */
const ITERATIONS: number = 1000;

/** The generator's seed. */
const SEED: number = 1;
