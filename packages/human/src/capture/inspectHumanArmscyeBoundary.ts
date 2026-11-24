import { AutoMovieSolidVector as V } from "@automovie/engine";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieConstructionRealization,
  IAutoMovieSolidSurface,
} from "@automovie/interface";

/** Match the realized band's periodic boundaries to both original owners. */
export function inspectHumanArmscyeBoundary(
  result: Pick<
    IAutoMovieConstructionRealization.IRealization,
    "surfaces" | "body"
  >,
  side: "left" | "right",
) {
  const arm: string = `arm.${side}`;
  const name: string = `blend.${arm}.trunk`;
  const band = result.body.faces.find(({ chain }) => chain === name);
  const surface = result.surfaces.find(({ name: face }) => face === name);
  if (band === undefined || surface === undefined) return [];
  return (
    [
      { end: "start", chain: "trunk" },
      { end: "end", chain: arm },
    ] as const
  ).map(({ end, chain }) => {
    const edge = band.cycles.find(({ kind }) => kind === end);
    const owner = result.surfaces.find(({ name: face }) => face === chain);
    const ownerFace = result.body.faces.find(
      ({ chain: face }) => face === chain,
    );
    const contact = ownerFace?.cycles.find(
      (cycle) => edge !== undefined && cycle.points.includes(edge.points[0]!),
    );
    if (edge === undefined || owner === undefined || contact === undefined)
      throw new Error(
        `${name} has no shared ${end} atlas boundary with ${chain}`,
      );
    const charts: Map<number, [number, number]> = new Map(
      contact.points.map(
        (id: number, i: number): [number, [number, number]] => [
          id,
          contact.chart[i]!,
        ],
      ),
    );
    const maximum = { position: 0, tangentSine: 0, normalCurvature: 0 };
    for (const [i, point] of edge.points.entries()) {
      const chart: [number, number] | undefined = charts.get(point);
      if (chart === undefined)
        throw new Error(
          `${name} ${end} point ${point} has no original atlas address`,
        );
      const a: IAutoMovieSolidSurface.IJet = surface.jet(...edge.chart[i]!);
      const b: IAutoMovieSolidSurface.IJet = owner.jet(...chart);
      const gap = difference(a, b);
      maximum.position = Math.max(maximum.position, gap.position);
      maximum.tangentSine = Math.max(maximum.tangentSine, gap.tangentSine);
      maximum.normalCurvature = Math.max(
        maximum.normalCurvature,
        gap.normalCurvature,
      );
    }
    return { owner: chain, samples: edge.points.length, ...maximum };
  });
}

/** Compare contact invariant under either original station and phase chart. */
function difference(
  a: IAutoMovieSolidSurface.IJet,
  b: IAutoMovieSolidSurface.IJet,
): {
  position: number;
  tangentSine: number;
  normalCurvature: number;
} {
  const area: AutoMovieVector3Tuple = V.cross(b.u, b.v);
  const scale: number = V.norm(area);
  const m: AutoMovieVector3Tuple | null = V.unit(area);
  const n: AutoMovieVector3Tuple | null = V.unit(V.cross(a.u, a.v));
  if (m === null || n === null)
    throw new Error(
      "The published armscye boundary has a singular tangent plane",
    );

  // Express each band direction in the owner's tangent chart. Chart
  // acceleration is tangent and drops out of the normal second derivatives.
  const address = (d: AutoMovieVector3Tuple): [number, number] => [
    V.dot(V.cross(d, b.v), m) / scale,
    V.dot(V.cross(b.u, d), m) / scale,
  ];
  const u: [number, number] = address(a.u);
  const v: [number, number] = address(a.v);
  const normal = (p: [number, number], q: [number, number]): number =>
    V.dot(m, b.uu) * p[0] * q[0] +
    V.dot(m, b.uv) * (p[0] * q[1] + p[1] * q[0]) +
    V.dot(m, b.vv) * p[1] * q[1];
  const us: number = V.norm(a.u);
  const vs: number = V.norm(a.v);
  return {
    position: V.norm(V.sub(a.p, b.p)),
    tangentSine: V.norm(V.cross(m, n)),
    normalCurvature: Math.max(
      Math.abs(V.dot(m, a.uu) - normal(u, u)) / (us * us),
      Math.abs(V.dot(m, a.uv) - normal(u, v)) / (us * vs),
      Math.abs(V.dot(m, a.vv) - normal(v, v)) / (vs * vs),
    ),
  };
}
