import { type IAutoMovieSurfaceNetwork } from "@automovie/engine";
import { type IAutoMovieVector3 } from "@automovie/interface";

/** Segments of every rectangle side and loop arc by tier. */
const ARC: IAutoMovieSurfaceNetwork.ICounts = {
  lowest: 1,
  low: 2,
  medium: 3,
  high: 5,
};

/** Segments of every spoke between two loops by tier. */
const SPOKE: IAutoMovieSurfaceNetwork.ICounts = {
  lowest: 1,
  low: 1,
  medium: 2,
  high: 3,
};

/** Interior points each arc and spoke passes through, so every curve lies on the dome. */
const THROUGH: number = 3;

/**
 * A curve network with two holes on a dome, the layout a face's eye or mouth
 * openings take: each half of a rectangle holds a hole surrounded by two
 * concentric loops, and the regions between the rectangle and the outer loop
 * and between the two loops are rings of four Coons patches joined by spokes.
 * The inner loops are left open and reported as rings, and so is the
 * rectangle's outer boundary.
 *
 * Every node and curve point lies on the dome `z = height (1 - (x^2 + y^2) / 0.5)`,
 * so the Coons patches fill a surface bounded by curves on it. Corners of each
 * rectangle half and loop run counterclockwise seen from `+Z`, and each patch
 * lists its sides counterclockwise, so its faces face `+Z`.
 *
 * `height` changes the shape without touching the layout, so every value gives
 * the same topology at a tier.
 *
 * @param height Dome height in metres, 0.1 by default.
 * @returns The network, metres.
 */
export function sweepHoledNetwork(
  height: number = 0.1,
): IAutoMovieSurfaceNetwork {
  const dome = (x: number, y: number): IAutoMovieVector3 => ({
    x,
    y,
    z: height * (1 - (x * x + y * y) / 0.5),
  });
  const nodes: Record<string, IAutoMovieSurfaceNetwork.INode> = {};
  const curves: Record<string, IAutoMovieSurfaceNetwork.ICurve> = {};
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  const at = (name: string, x: number, y: number): string => {
    nodes[name] = { type: "point", position: dome(x, y) };
    return name;
  };
  // a curve between two nodes through points on the dome, straight in plan or round an arc
  const curve = (
    from: string,
    to: string,
    segments: IAutoMovieSurfaceNetwork.ICounts,
    plan: (t: number) => [number, number],
  ): string => {
    const name: string = `${from}-${to}`;
    curves[name] = {
      from,
      to,
      segments,
      through: Array.from(
        { length: THROUGH },
        (_: unknown, k: number): IAutoMovieVector3 =>
          dome(...plan((k + 1) / (THROUGH + 1))),
      ),
    };
    return name;
  };
  const position = (name: string): [number, number] => {
    const n = nodes[name] as IAutoMovieSurfaceNetwork.IFreeNode;
    return [n.position.x, n.position.y];
  };
  const line = (
    from: string,
    to: string,
    segments: IAutoMovieSurfaceNetwork.ICounts,
  ): string => {
    const [ax, ay] = position(from);
    const [bx, by] = position(to);
    return curve(from, to, segments, (t: number): [number, number] => [
      ax + (bx - ax) * t,
      ay + (by - ay) * t,
    ]);
  };
  const forward = (name: string): IAutoMovieSurfaceNetwork.ICurveEdge => ({
    type: "curve",
    curve: name,
  });
  const backward = (name: string): IAutoMovieSurfaceNetwork.ICurveEdge => ({
    type: "curve",
    curve: name,
    reverse: true,
  });

  // the rectangle, its middle side shared by both halves
  const corners: Record<string, string> = {
    a: at("a", -0.32, -0.2),
    b: at("b", 0, -0.2),
    c: at("c", 0.32, -0.2),
    d: at("d", 0.32, 0.25),
    e: at("e", 0, 0.25),
    f: at("f", -0.32, 0.25),
  };
  const shared: string = line(corners.b!, corners.e!, ARC);
  const halves: Array<{
    name: string;
    centre: [number, number];
    box: string[];
  }> = [
    {
      name: "left",
      centre: [-0.16, 0.025],
      box: [corners.a!, corners.b!, corners.e!, corners.f!],
    },
    {
      name: "right",
      centre: [0.16, 0.025],
      box: [corners.b!, corners.c!, corners.d!, corners.e!],
    },
  ];
  const rings: IAutoMovieSurfaceNetwork.IRing[] = [];
  for (const half of halves) {
    // the rectangle half's sides, counterclockwise from its lower left corner
    const box: IAutoMovieSurfaceNetwork.ICurveEdge[] = half.box.map(
      (from: string, k: number): IAutoMovieSurfaceNetwork.ICurveEdge => {
        const to: string = half.box[(k + 1) % 4]!;
        if (from === "b" && to === "e") return forward(shared);
        if (from === "e" && to === "b") return backward(shared);
        return forward(line(from, to, ARC));
      },
    );
    let previous: IAutoMovieSurfaceNetwork.ICurveEdge[] = box;
    let previousCorners: string[] = half.box;
    for (const [loop, radius] of [
      ["outer", 0.1],
      ["inner", 0.055],
    ] as const) {
      const [cx, cy] = half.centre;
      const loopCorners: string[] = [225, 315, 45, 135].map(
        (degrees: number, k: number): string => {
          const r: number = (degrees * Math.PI) / 180;
          return at(
            `${half.name}.${loop}.${k}`,
            cx + radius * Math.cos(r),
            cy + radius * Math.sin(r),
          );
        },
      );
      const arcs: IAutoMovieSurfaceNetwork.ICurveEdge[] = loopCorners.map(
        (from: string, k: number): IAutoMovieSurfaceNetwork.ICurveEdge => {
          const start: number = ((225 + 90 * k) * Math.PI) / 180;
          return forward(
            curve(
              from,
              loopCorners[(k + 1) % 4]!,
              ARC,
              (t: number): [number, number] => [
                cx + radius * Math.cos(start + (t * Math.PI) / 2),
                cy + radius * Math.sin(start + (t * Math.PI) / 2),
              ],
            ),
          );
        },
      );
      const spokes: string[] = loopCorners.map(
        (to: string, k: number): string => line(previousCorners[k]!, to, SPOKE),
      );
      for (let k: number = 0; k < 4; ++k) {
        const l: number = (k + 1) % 4;
        patches.push({
          type: "coons",
          name: `${half.name}.${loop}.${k}`,
          sides: [
            previous[k]!,
            forward(spokes[l]!),
            { ...arcs[k]!, reverse: true },
            backward(spokes[k]!),
          ],
        });
      }
      previous = arcs;
      previousCorners = loopCorners;
    }
    rings.push({ name: `${half.name}.hole`, edges: previous });
  }
  // the rectangle's outer boundary, counterclockwise seen from +Z
  rings.push({
    name: "rim",
    edges: ["a-b", "b-c", "c-d", "d-e", "e-f", "f-a"].map(forward),
  });
  return { sweeps: {}, nodes, curves, patches, rings };
}
