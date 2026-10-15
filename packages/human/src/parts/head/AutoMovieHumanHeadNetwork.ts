import { IAutoMovieSurfaceNetwork, IAutoMovieSweep } from "@automovie/engine";
import { IAutoMovieVector3 } from "@automovie/interface";

/**
 * Builds the head's surface network one quad at a time from points of the head sweep's domain and free points.
 *
 * A point of the sweep is a domain coordinate `(u, v)`, evaluated on the sweep by the engine, so the regions of the head that follow the loft lie exactly on it; a free point is a position the head computes itself, such as a lid margin resting on the eyeball or a lip's inner edge folding back into the mouth. Each quad is a Coons patch of one face whose four sides are network curves between its corners' nodes; a sweep point's node is the sweep at that domain point, so the quads lie exactly on the sweep rather than on an average of it over their cells. Neighbouring quads that name the same corners share them, so the network welds exactly where the quads meet. A quad is wound counterclockwise seen from outside, which in the domain is increasing `v` then increasing `u`; the builder orients each quad by its signed area in the domain and so needs only its corners in order around it.
 *
 * Positions are metres in the model frame, like the sweep's.
 *
 * @author Samchon
 */
export class AutoMovieHumanHeadNetwork {
  private readonly nodes_: Record<string, IAutoMovieSurfaceNetwork.INode> = {};
  private readonly curves_: Record<string, IAutoMovieSurfaceNetwork.ICurve> = {};
  private readonly patches_: IAutoMovieSurfaceNetwork.IPatch[] = [];
  private readonly rings_: IAutoMovieSurfaceNetwork.IRing[] = [];
  private readonly names_: Map<IAutoMovieSurfaceNetwork.IPatch, string> = new Map();

  /** Name of the head's sweep in the network. */
  public readonly sweep: string;

  /**
   * @param sweep Name of the head's sweep in the network
   */
  public constructor(sweep: string) {
    this.sweep = sweep;
  }

  /**
   * A point of the sweep's domain.
   *
   * @param u Along the spine, 0 to 1
   * @param v Around it, any real number, read modulo one
   * @returns The point
   */
  public on(u: number, v: number): AutoMovieHumanHeadNetwork.IPoint {
    const wrapped: number = ((v % 1) + 1) % 1;
    return { type: "sweep", u, v: wrapped, domain: { u, v: wrapped } };
  }

  /**
   * A free point.
   *
   * @param name Name unique among free points
   * @param position Model frame, metres
   * @param domain Where it lies over the sweep's domain, for orienting the quads it bounds
   * @returns The point
   */
  public free(
    name: string,
    position: IAutoMovieVector3,
    domain: { u: number; v: number },
  ): AutoMovieHumanHeadNetwork.IPoint {
    const key: string = `f.${name}`;
    this.nodes_[key] = { type: "point", position };
    return { type: "free", name: key, domain };
  }

  /**
   * Add one quad.
   *
   * @param corners The four corners in order around it, either way round
   * @param group Name of the region it belongs to, the prefix of its patch name
   * @param orient Whether to orient the quad by its area in the domain; false keeps the corners' order, which must then run counterclockwise seen from outside
   * @returns The patch
   */
  public quad(
    corners: [
      AutoMovieHumanHeadNetwork.IPoint,
      AutoMovieHumanHeadNetwork.IPoint,
      AutoMovieHumanHeadNetwork.IPoint,
      AutoMovieHumanHeadNetwork.IPoint,
    ],
    group: string,
    orient: boolean = true,
  ): IAutoMovieSurfaceNetwork.ICoonsPatch {
    const ordered = !orient || area(corners) >= 0 ? corners : ([corners[0], corners[3], corners[2], corners[1]] as typeof corners);
    const patch: IAutoMovieSurfaceNetwork.ICoonsPatch = {
      type: "coons",
      name: `${group}.${this.patches_.length}`,
      sides: [
        this.edge(ordered[0], ordered[1]),
        this.edge(ordered[1], ordered[2]),
        this.edge(ordered[2], ordered[3]),
        this.edge(ordered[3], ordered[0]),
      ],
    };
    this.patches_.push(patch);
    this.names_.set(patch, group);
    return patch;
  }

  /**
   * A loop of sweep points between two loops of equal count, each point the domain's linear blend of its two.
   *
   * @param a The loop at share 0
   * @param b The loop at share 1
   * @param t Share of the way from `a` to `b`
   * @returns The blended loop
   */
  public between(
    a: AutoMovieHumanHeadNetwork.IPoint[],
    b: AutoMovieHumanHeadNetwork.IPoint[],
    t: number,
  ): AutoMovieHumanHeadNetwork.IPoint[] {
    return a.map((p: AutoMovieHumanHeadNetwork.IPoint, k: number): AutoMovieHumanHeadNetwork.IPoint => {
      const q: AutoMovieHumanHeadNetwork.IPoint = b[k]!;
      const v: number = q.domain.v + Math.round(p.domain.v - q.domain.v);
      return this.on(p.domain.u + (q.domain.u - p.domain.u) * t, p.domain.v + (v - p.domain.v) * t);
    });
  }

  /**
   * Join concentric loops of equal count with one band of quads between each loop and the next.
   *
   * Every loop runs the same way round, point `m` of one loop facing point `m` of the next. The first band, whose loops lie over the domain where the sweep is, decides the winding by its area in the domain; every later band takes the same winding, so loops off the sweep, such as a lid margin a millimetre from its neighbour or the walls of a pocket, need no domain area of their own.
   *
   * @param loops Loops from the outermost inward, at least two
   * @param group Region name
   * @returns Whether the quads run along each loop in its own direction on their outer side, which a cap closing the last loop needs
   */
  public bands(loops: AutoMovieHumanHeadNetwork.IPoint[][], group: string): boolean {
    const n: number = loops[0]!.length;
    const a: AutoMovieHumanHeadNetwork.IPoint[] = loops[0]!;
    const b: AutoMovieHumanHeadNetwork.IPoint[] = loops[1]!;
    let sum: number = 0;
    for (let m: number = 0; m < n; ++m) sum += area([a[m]!, a[(m + 1) % n]!, b[(m + 1) % n]!, b[m]!]);
    const forward: boolean = sum >= 0;
    for (let k: number = 0; k + 1 < loops.length; ++k) {
      const outer: AutoMovieHumanHeadNetwork.IPoint[] = loops[k]!;
      const inner: AutoMovieHumanHeadNetwork.IPoint[] = loops[k + 1]!;
      for (let m: number = 0; m < n; ++m) {
        const q: [AutoMovieHumanHeadNetwork.IPoint, AutoMovieHumanHeadNetwork.IPoint, AutoMovieHumanHeadNetwork.IPoint, AutoMovieHumanHeadNetwork.IPoint] = [
          outer[m]!,
          outer[(m + 1) % n]!,
          inner[(m + 1) % n]!,
          inner[m]!,
        ];
        this.quad(forward ? q : [q[0], q[3], q[2], q[1]], group, false);
      }
    }
    return forward;
  }

  /**
   * Report a closed loop of points as a ring, optionally pinned to positions.
   *
   * @param name Ring name
   * @param points The loop in order, not repeating the first
   * @param positions Positions the loop's vertices keep, model frame, metres; omitted, fitted
   */
  public ring(
    name: string,
    points: AutoMovieHumanHeadNetwork.IPoint[],
    positions?: IAutoMovieVector3[],
  ): void {
    this.rings_.push({
      name,
      edges: points.map(
        (p: AutoMovieHumanHeadNetwork.IPoint, k: number): IAutoMovieSurfaceNetwork.IEdge =>
          this.edge(p, points[(k + 1) % points.length]!),
      ),
      ...(positions !== undefined ? { positions } : {}),
    });
  }

  /**
   * The group each patch was added under, in patch order.
   *
   * @returns Group names
   */
  public groups(): string[] {
    return this.patches_.map((p: IAutoMovieSurfaceNetwork.IPatch): string => this.names_.get(p)!);
  }

  /**
   * The network over a sweep.
   *
   * @param sweep The sweep, model frame, metres
   * @returns The network
   */
  public build(sweep: IAutoMovieSweep): IAutoMovieSurfaceNetwork {
    return {
      sweeps: { [this.sweep]: sweep },
      nodes: this.nodes_,
      curves: this.curves_,
      patches: this.patches_,
      rings: this.rings_,
    };
  }

  /** The side from one corner to the next: a network curve between their nodes, so a point of the sweep is the sweep's own point there, not an average over a cell. */
  private edge(
    a: AutoMovieHumanHeadNetwork.IPoint,
    b: AutoMovieHumanHeadNetwork.IPoint,
  ): IAutoMovieSurfaceNetwork.IEdge {
    const from: string = this.node(a);
    const to: string = this.node(b);
    const forward: string = `${from}>${to}`;
    const backward: string = `${to}>${from}`;
    if (this.curves_[backward] !== undefined) return { type: "curve", curve: backward, reverse: true };
    if (this.curves_[forward] === undefined) this.curves_[forward] = { from, to, segments: ONE };
    return { type: "curve", curve: forward };
  }

  /** The node of a point, registering a sweep point's node on first use. */
  private node(p: AutoMovieHumanHeadNetwork.IPoint): string {
    if (p.type === "free") return p.name;
    const key: string = `s.${p.u.toFixed(9)}.${p.v.toFixed(9)}`;
    if (this.nodes_[key] === undefined)
      this.nodes_[key] = { type: "sweep", sweep: this.sweep, u: p.u, v: p.v };
    return key;
  }
}
export namespace AutoMovieHumanHeadNetwork {
  /**
   * A corner of the head's quads.
   *
   * @author Samchon
   */
  export type IPoint = ISweepPoint | IFreePoint;

  /**
   * A point of the sweep's domain.
   *
   * @author Samchon
   */
  export interface ISweepPoint {
    /** Discriminator. */
    type: "sweep";

    /** Along the spine. */
    u: number;

    /** Around it, 0 to 1. */
    v: number;

    /** The same coordinates, for orientation. */
    domain: { u: number; v: number };
  }

  /**
   * A free point.
   *
   * @author Samchon
   */
  export interface IFreePoint {
    /** Discriminator. */
    type: "free";

    /** Node name. */
    name: string;

    /** Where it lies over the domain, for orientation. */
    domain: { u: number; v: number };
  }
}

/** One segment at every tier: each quad of the head's layout is one face of its cage. */
const ONE: IAutoMovieSurfaceNetwork.ICounts = { lowest: 1, low: 1, medium: 1, high: 1 };

/** Signed area of a quad in the domain, `v` across and `u` up, the seam unwrapped about the first corner. */
const area = (corners: AutoMovieHumanHeadNetwork.IPoint[]): number => {
  const v0: number = corners[0]!.domain.v;
  const pts: Array<[number, number]> = corners.map((c: AutoMovieHumanHeadNetwork.IPoint): [number, number] => {
    let v: number = c.domain.v;
    while (v - v0 > 0.5) v -= 1;
    while (v - v0 < -0.5) v += 1;
    return [v, c.domain.u];
  });
  let sum: number = 0;
  for (let k: number = 0; k < pts.length; ++k) {
    const [x0, y0] = pts[k]!;
    const [x1, y1] = pts[(k + 1) % pts.length]!;
    sum += x0 * y1 - x1 * y0;
  }
  return sum;
};
