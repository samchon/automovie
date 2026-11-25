import { AutoMovieSolidVector as Vec } from "@automovie/engine";
import type {
  AutoMovieVector2Tuple as P2,
  AutoMovieVector3Tuple as P3,
  IAutoMovieSolidSurface as Solid,
} from "@automovie/interface";

import { AutoMovieHumanDigitalSection as Section } from "./AutoMovieHumanDigitalSection";

const TURN: number = 2 * Math.PI;

/** The common visibility kernel of the two actual projected boundaries. */
export function AutoMovieHumanBranchClock(
  parent: (phase: number) => Solid.IJet,
  arc: readonly [number, number],
  receiver: {
    point: (phase: number) => P3;
    jet: (phase: number) => Solid.IJet;
  },
  tape: readonly P3[],
  frame: { origin: P3; u: P3; v: P3 },
) {
  const { origin, u, v } = frame;
  const project = (p: P3): P2 => [Vec.dot(p, u), Vec.dot(p, v)];
  const local = (p: P3): P2 => project(Vec.sub(p, origin));
  const cross = ([x, y]: P2, [a, b]: P2): number => x * b - y * a;
  const sub = ([x, y]: P2, [a, b]: P2): P2 => [x - a, y - b];
  const sense = (p: readonly P2[]): number =>
    Math.sign(
      p.reduce(
        (sum, a, i): number => sum + cross(a, p[(i + 1) % p.length]!),
        0,
      ),
    );
  const chart = ({ p, v }: Solid.IJet) => ({ p: local(p), v: project(v) });
  const outer = Array.from({ length: tape.length / 2 + 1 }, (_, i) =>
    chart(parent(arc[0] + ((arc[1] - arc[0]) * i * 2) / tape.length)),
  );
  const inner = tape.map((_, i) =>
    chart(receiver.jet((i * TURN) / tape.length)),
  );
  const turnOuter = sense(outer.map(({ p }) => p));
  const turnInner = sense(inner.map(({ p }) => p));
  const min: P2 = [
    Math.min(...inner.map(({ p }) => p[0])),
    Math.min(...inner.map(({ p }) => p[1])),
  ];
  const max: P2 = [
    Math.max(...inner.map(({ p }) => p[0])),
    Math.max(...inner.map(({ p }) => p[1])),
  ];
  let kernel: P2[] = [min, [max[0], min[1]], max, [min[0], max[1]]];

  // Lee and Preparata, 1979. Intersect the interior half-planes. For the
  // smooth sections the native tangents refine the sampled edge constraints.
  // https://doi.org/10.1145/322139.322142
  const edges = (loop: typeof outer, winding: number) =>
    loop.flatMap(({ p, v }, i) => [
      { p, v, winding },
      { p, v: sub(loop[(i + 1) % loop.length]!.p, p), winding },
    ]);
  const limits = [...edges(outer, turnOuter), ...edges(inner, turnInner)];
  for (const { p, v, winding } of limits) {
    const distance = (q: P2): number => winding * cross(v, sub(q, p));
    kernel = kernel.flatMap((a, i): P2[] => {
      const b = kernel[(i + 1) % kernel.length]!;
      const first = distance(a);
      const last = distance(b);
      const kept: P2[] = first >= 0 ? [a] : [];
      if (first < 0 === last < 0) return kept;
      const t = first / (first - last);
      return [...kept, [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])]];
    });
    if (kernel.length < 3)
      return "The original parent arc and protected receiving section have no common radial visibility kernel";
  }
  const middle: P2 = [
    kernel.reduce((sum, p): number => sum + p[0], 0) / kernel.length,
    kernel.reduce((sum, p): number => sum + p[1], 0) / kernel.length,
  ];
  const margin = Math.min(
    ...limits.map(
      ({ p, v, winding }): number =>
        (winding * cross(v, sub(middle, p))) / Math.hypot(...v),
    ),
  );
  if (!(margin > 0))
    return "The projected boundaries have no strict radial visibility kernel";
  const center: P3 = Vec.combine([
    [1, origin],
    [middle[0], u],
    [middle[1], v],
  ]);
  const native = Section.physicalClock(receiver, tape, center, u, v);
  if (!(native.minimumAngularStep > 0))
    return "The protected receiving section reverses its native angular cycle";
  const orientation: number = turnOuter * turnInner;
  const orient = (address: number): number =>
    (((orientation * address) % TURN) + TURN) % TURN;
  return {
    center,
    margin,
    orientation,
    phase: (p: P3): number => orient(native.phase(p)),
    rate: (p: P3, d: P3): number => orientation * native.rate(p, d),
    read: (address: number) => native.read(orient(address)),
    ray: (p: P3) => {
      const [a, b] = project(Vec.sub(p, center));
      return {
        origin: center,
        direction: Vec.unit(
          Vec.combine([
            [a, u],
            [b, v],
          ]),
        )!,
      };
    },
  };
}
