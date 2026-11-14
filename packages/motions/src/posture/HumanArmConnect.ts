/**
 * A valid path between two configurations of a joint space, by RRT-Connect
 * (Kuffner and LaValle 2000, "RRT-Connect: an efficient approach to
 * single-query path planning", ICRA): two trees grown from the start and the
 * goal, each extended a step toward a sample and the other connected toward
 * the new vertex by repeated steps, the roles swapped every iteration. The
 * first sample is the goal itself, so where the straight segment is valid
 * the trees meet on it at once. The path is then shortcut, each vertex joined
 * to the farthest later one its straight segment reaches. Samples come from a
 * seeded generator, and the iterations are counted rather than timed, so a\n * query has one answer; the step and the edge's check spacing are OMPL's\n * defaults, a fifth and a hundredth of the space's extent.
 *
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
  }

  /**
   * The path from the start to the goal.
   *
   * @param query The query.
   * @returns The path's vertices from the start to the goal, or `null` when the start or the goal is invalid or the trees did not meet.
   */
  export function connect(query: IQuery): number[][] | null {
    if (!query.valid(query.start) || !query.valid(query.goal)) return null;
    const range: number = RANGE * query.extent;
    const resolution: number = RESOLUTION * query.extent;
    const random: () => number = generator(SEED);
    const clear = (a: readonly number[], b: readonly number[]): boolean => {
      const steps: number = Math.ceil(distance(a, b) / resolution);
      for (let i: number = 1; i <= steps; ++i)
        if (!query.valid(lerp(a, b, i / steps))) return false;
      return true;
    };
    const from: ITree = { nodes: [[...query.start]], parent: [-1] };
    const to: ITree = { nodes: [[...query.goal]], parent: [-1] };
    // Extend a tree one step toward a configuration.
    const extend = (tree: ITree, q: readonly number[]): Status => {
      let near: number = 0;
      let least: number = Infinity;
      tree.nodes.forEach((node: readonly number[], i: number): void => {
        const d: number = distance(node, q);
        if (d < least) {
          least = d;
          near = i;
        }
      });
      const reached: boolean = least <= range;
      const next: number[] = reached ? [...q] : lerp(tree.nodes[near]!, q, range / least);
      if (!clear(tree.nodes[near]!, next)) return "trapped";
      tree.nodes.push(next);
      tree.parent.push(near);
      return reached ? "reached" : "advanced";
    };
    let a: ITree = from;
    let b: ITree = to;
    for (let i: number = 0; i < ITERATIONS; ++i) {
      const target: number[] = i === 0 ? [...query.goal] : query.sample(random);
      if (extend(a, target) !== "trapped") {
        const made: number[] = a.nodes[a.nodes.length - 1]!;
        let status: Status;
        do status = extend(b, made);
        while (status === "advanced");
        if (status === "reached") return shortcut(joined(from, to), clear);
      }
      [a, b] = [b, a];
    }
    return null;
  }


  /** The path through the two trees' last vertices, which coincide: the start tree's from its root, then the goal tree's to its root. */
  function joined(from: ITree, to: ITree): number[][] {
    const trace = (tree: ITree): number[][] => {
      const out: number[][] = [];
      for (let i: number = tree.nodes.length - 1; i >= 0; i = tree.parent[i]!) out.push(tree.nodes[i]!);
      return out;
    };
    return [...trace(from).reverse(), ...trace(to).slice(1)];
  }

  /** The path with each vertex joined to the farthest later one its straight segment reaches. */
  function shortcut(path: number[][], clear: (a: readonly number[], b: readonly number[]) => boolean): number[][] {
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
  export function lerp(a: readonly number[], b: readonly number[], u: number): number[] {
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

/** A tree: its vertices and each one's parent, -1 at the root. */
interface ITree {
  nodes: number[][];
  parent: number[];
}

/** A step of a tree toward a sample, a share of the space's extent: OMPL's default range. */
const RANGE: number = 0.2;

/** The spacing of the validity checks along an edge, a share of the space's extent: OMPL's longest valid segment. */
const RESOLUTION: number = 0.01;

/** Iterations before the query is given up. */
const ITERATIONS: number = 1000;

/** The generator's seed. */
const SEED: number = 1;
