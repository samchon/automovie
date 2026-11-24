import type { FamilyConicSection as C } from "./FamilyConicSection";
import { AutoMovieMeshExtract as M } from "@automovie/engine";
import type {
  IAutoMovieLoftSectionFrame,
  IAutoMovieMeshSectionChain,
  IAutoMovieMeshSectionCut,
  IAutoMovieMeshSectionFrame,
  IAutoMovieMillimeterMesh,
} from "@automovie/interface";

/** Plane-section readers and polygon measures for an explicitly supplied indexed mesh in millimetres. */
export namespace FamilyConicSource {
  /** A point or direction in the caller's frame. */
  export type V = [number, number, number];

  /** One exact plane cut about a frame's origin. */
  export interface ICut {
    /** The outermost closed loop winding round the origin, counter-clockwise in the `(u, v)` chart, or null when none does. */
    loop: C.P[] | null;

    /** Closed loops that wind round the origin. */
    around: number;

    /** Every chained piece of the cut, closed or open. */
    pieces: number;

    /** By outgoing edge of the selected loop, whether it came from the source cut. */
    measured?: boolean[];
  }

  /** The cut readers sharing one mesh's prepared topology and spatial index. */
  export interface IPrepared {
    /** The outermost section that winds around the origin. */
    cut(
      frame: IAutoMovieLoftSectionFrame,
      bridge?: number,
      observeEdges?: boolean,
    ): ICut;
    /** All raw section chains in the frame chart. */
    chains(
      frame: IAutoMovieLoftSectionFrame,
    ): { points: C.P[]; closed: boolean }[];
    /** The closed section loops, counter-clockwise in the frame chart. */
    loops(frame: IAutoMovieLoftSectionFrame): C.P[][];
  }

  /** Prepare one mesh for the series of section planes a course or fit observes. */
  export function prepare(mesh: IAutoMovieMillimeterMesh): IPrepared {
    const outline: ReturnType<typeof M.prepareOutline> = M.prepareOutline(mesh);
    return {
      cut: (frame, bridge = 3, observeEdges = false): ICut =>
        cutFrom(outline, frame, bridge, observeEdges),
      chains: (frame): ReturnType<IPrepared["chains"]> =>
        chainsFrom(outline, frame),
      loops: (frame): C.P[][] => loopsFrom(outline, frame),
    };
  }

  /**
   * Cut a mesh by a frame's plane and read the loop round its origin in the
   * frame's chart.
   *
   * @param bridge Longest gap between open chains' ends the outer boundary
   *   closes where no closed loop winds round the origin, mm.
   * @param observeEdges Record exact original edges so a joined boundary's
   *   synthetic gap cannot become an observation.
   */
  export function cut(
    mesh: IAutoMovieMillimeterMesh,
    frame: IAutoMovieLoftSectionFrame,
    bridge: number = 3,
    observeEdges: boolean = false,
  ): ICut {
    return cutFrom(
      M.outline.bind(undefined, mesh),
      frame,
      bridge,
      observeEdges,
    );
  }

  /** Read the holding loop from the selected outline source. */
  function cutFrom(
    outline: ReturnType<typeof M.prepareOutline>,
    frame: IAutoMovieLoftSectionFrame,
    bridge: number,
    observeEdges: boolean,
  ): ICut {
    const place: IAutoMovieMeshSectionFrame = sectionFrame(frame);
    const section: IAutoMovieMeshSectionCut = outline(
      place,
      [0],
      0,
      0.5,
      0,
    )[0]!;
    const closed = (loops: readonly IAutoMovieMeshSectionChain[]): C.P[][] =>
      loops
        .filter(
          (loop: IAutoMovieMeshSectionChain): boolean =>
            loop.closed && winds(loop.points),
        )
        .map((loop: IAutoMovieMeshSectionChain): C.P[] =>
          area(loop.points) < 0 ? [...loop.points].reverse() : [...loop.points],
        );
    let round: C.P[][] = closed(section.loops);

    // Where the body and head skins meet their rims do not share vertices, so a cut through the seam chains into open pieces; the extractor's own bridging joins ends up to 3 mm apart into the outer boundary.
    if (round.length === 0)
      round = closed(outline(place, [0], 0, 0.5, bridge)[0]!.outer);
    // Several loops round the origin are nested shells (the head mesh carries its mouth and throat lining): the skin is the outermost, the one of largest area.
    const outer: C.P[] | null =
      round.length === 0
        ? null
        : round.reduce((a: C.P[], b: C.P[]): C.P[] =>
            area(b) > area(a) ? b : a,
          );
    if (!observeEdges || outer === null)
      return {
        loop: outer,
        around: round.length,
        pieces: section.loops.length,
      };
    const edge = (a: readonly number[], b: readonly number[]): string => {
      const [p, q] = [a.join(","), b.join(",")];
      return p < q ? p + "/" + q : q + "/" + p;
    };
    const recorded: Set<string> = new Set(
      section.loops.flatMap((loop: IAutoMovieMeshSectionChain): string[] =>
        loop.points
          .slice(0, loop.closed ? loop.points.length : -1)
          .map((p, i): string =>
            edge(p, loop.points[(i + 1) % loop.points.length]!),
          ),
      ),
    );
    const measured = outer.map((p: C.P, i: number): boolean =>
      recorded.has(edge(p, outer[(i + 1) % outer.length]!)),
    );
    return {
      loop: outer,
      around: round.length,
      pieces: section.loops.length,
      measured,
    };
  }

  /**
   * Every chain of a mesh's cut by a frame's plane in the frame's chart, closed
   * or open, in the order the cut gives them: a plane through an opening of the
   * mesh has open chains only.
   */
  export function chains(
    mesh: IAutoMovieMillimeterMesh,
    frame: IAutoMovieLoftSectionFrame,
  ): { points: C.P[]; closed: boolean }[] {
    return chainsFrom(M.outline.bind(undefined, mesh), frame);
  }

  /** Read all raw chains from the selected outline source. */
  function chainsFrom(
    outline: ReturnType<typeof M.prepareOutline>,
    frame: IAutoMovieLoftSectionFrame,
  ): ReturnType<IPrepared["chains"]> {
    const section: IAutoMovieMeshSectionCut = outline(
      sectionFrame(frame),
      [0],
      0,
      0.5,
      0,
    )[0]!;
    return section.loops.map(
      (
        loop: IAutoMovieMeshSectionChain,
      ): { points: C.P[]; closed: boolean } => ({
        points: [...loop.points],
        closed: loop.closed,
      }),
    );
  }

  /**
   * Every closed loop of a mesh's cut by a frame's plane, counter-clockwise in
   * the frame's chart, whether or not it winds round the origin.
   */
  export function loops(
    mesh: IAutoMovieMillimeterMesh,
    frame: IAutoMovieLoftSectionFrame,
  ): C.P[][] {
    return loopsFrom(M.outline.bind(undefined, mesh), frame);
  }

  /** Read the wound closed loops from the selected outline source. */
  function loopsFrom(
    outline: ReturnType<typeof M.prepareOutline>,
    frame: IAutoMovieLoftSectionFrame,
  ): C.P[][] {
    const section: IAutoMovieMeshSectionCut = outline(
      sectionFrame(frame),
      [0],
      0,
      0.5,
      0,
    )[0]!;
    return section.loops
      .filter((loop: IAutoMovieMeshSectionChain): boolean => loop.closed)
      .map((loop: IAutoMovieMeshSectionChain): C.P[] =>
        area(loop.points) < 0 ? [...loop.points].reverse() : [...loop.points],
      );
  }

  /** Express the course section as an outline frame with normal `v × u`. */
  function sectionFrame(
    frame: IAutoMovieLoftSectionFrame,
  ): IAutoMovieMeshSectionFrame {
    const n: V = [
      frame.v[1] * frame.u[2] - frame.v[2] * frame.u[1],
      frame.v[2] * frame.u[0] - frame.v[0] * frame.u[2],
      frame.v[0] * frame.u[1] - frame.v[1] * frame.u[0],
    ];
    return {
      origin: [...frame.origin] as V,
      axes: [n, [...frame.u] as V, [...frame.v] as V],
    };
  }

  /**
   * Convex hull of a chart polygon, counter-clockwise (Andrew's monotone
   * chain). It is the path a taut tape takes round the section, so a family
   * fitted to it is the part's tape wall, and what lies inside it is relief.
   */
  export function hull(points: readonly C.P[]): C.P[] {
    const sorted: C.P[] = [...points].sort(
      (a: C.P, b: C.P): number => a[0] - b[0] || a[1] - b[1],
    );
    const turn = (o: C.P, a: C.P, b: C.P): number =>
      (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const half = (source: C.P[]): C.P[] => {
      const out: C.P[] = [];
      for (const p of source) {
        while (
          out.length >= 2 &&
          turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0
        )
          out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    return [...half(sorted), ...half([...sorted].reverse())];
  }

  /** Signed area of a chart polygon, mm^2, positive counter-clockwise. */
  export function area(points: readonly C.P[]): number {
    let sum: number = 0;
    for (let i: number = 0; i < points.length; ++i) {
      const p: C.P = points[i]!;
      const q: C.P = points[(i + 1) % points.length]!;
      sum += p[0] * q[1] - p[1] * q[0];
    }
    return sum / 2;
  }

  /** Whether a polygon encloses the chart origin, by the parity of its crossings of the positive `u` axis. */
  function winds(points: readonly C.P[]): boolean {
    let inside: boolean = false;
    for (let i: number = 0; i < points.length; ++i) {
      const a: C.P = points[i]!;
      const b: C.P = points[(i + 1) % points.length]!;
      if (
        a[1] > 0 !== b[1] > 0 &&
        a[0] + ((b[0] - a[0]) * -a[1]) / (b[1] - a[1]) > 0
      )
        inside = !inside;
    }
    return inside;
  }
}
