import { type Bounds, MeshWriter, type Vec, metricUv, sub } from "./orthogonal-mesh";
import { SEGMENTS, TAU } from "./round-mesh";

/**
 * Draft rectangular host with an axial 24-sided circular bore.
 *
 * Only -x and -z axes are supported; unsupported axes and malformed/nonfinite span tokens throw. Out-of-host spans, reversed or zero spans, nonpositive radii and circles touching the transverse host boundary return false before writing. Centre/radius finiteness and increasing finite host bounds remain caller premises. Axial comparisons use 1e-8 metres and boundary grouping uses 1e-9 metres.
 *
 * Accepted recipes append outer host faces, inward bore walls and caps at blind ends using 24 angular segments. UVs use projected face metres and sampled bore arc lengths. Boundary sorting and repeated reference scans are bounded by that fixed population. Local rings and boundary lists end with the call; the supplied writer retains emitted arrays and calls do not share cached geometry.
 */
export function boxWithBore(
  w: MeshWriter,
  b: Bounds,
  bore: { axis: string; args: string[] },
): boolean {
  if (bore.axis !== "-x" && bore.axis !== "-z")
    throw new Error(`unsupported box bore axis ${bore.axis}`);
  const numeric: (s: string) => number = (s: string) : number => Number(s.replace("−", "-"));
  const range: (s: string) => [number, number] = (s: string): [number, number] => {
    const values: number[] = s.split("..").map(numeric);
    if (values.length !== 2 || !values.every(Number.isFinite))
      throw new Error(`invalid bore ${s}`);
    return [values[0], values[1]];
  };
  const axis: 0 | 2 = bore.axis === "-x" ? 0 : 2;
  const axial: [number, number] = axis === 0 ? b.x : b.z;
  const span: [number, number] = axis === 0 ? range(bore.args[0]) : range(bore.args[3]);
  const centerU: number = axis === 0 ? numeric(bore.args[1]) : numeric(bore.args[0]);
  const centerV: number = axis === 0 ? numeric(bore.args[2]) : numeric(bore.args[1]);
  const radius: number = axis === 0 ? numeric(bore.args[3]) : numeric(bore.args[2]);
  const u: [number, number] = axis === 0 ? b.y : b.x,
    v: [number, number] = axis === 0 ? b.z : b.y;
  if (
    span[0] < axial[0] - 1e-8 ||
    span[1] > axial[1] + 1e-8 ||
    span[1] <= span[0] ||
    radius <= 0 ||
    centerU - radius <= u[0] ||
    centerU + radius >= u[1] ||
    centerV - radius <= v[0] ||
    centerV + radius >= v[1]
  )
    return false;
  const point: (axialValue: number, uu: number, vv: number) => Vec = (axialValue: number, uu: number, vv: number): Vec =>
    axis === 0 ? [axialValue, uu, vv] : [uu, vv, axialValue];
  const normal: (sign: number) => Vec = (sign: number): Vec =>
    axis === 0 ? [sign, 0, 0] : [0, 0, sign];
  const circle: (at: number, i: number) => Vec = (at: number, i: number): Vec =>
    point(
      at,
      centerU + radius * Math.cos((TAU * i) / SEGMENTS),
      centerV + radius * Math.sin((TAU * i) / SEGMENTS),
    );
  const outer: (at: number, i: number) => { point: Vec; side: number; } = (at: number, i: number): { point: Vec; side: number } => {
    const du: number = Math.cos((TAU * i) / SEGMENTS),
      dv: number = Math.sin((TAU * i) / SEGMENTS);
    const tu: number =
      du > 0
        ? (u[1] - centerU) / du
        : du < 0
          ? (u[0] - centerU) / du
          : Infinity;
    const tv: number =
      dv > 0
        ? (v[1] - centerV) / dv
        : dv < 0
          ? (v[0] - centerV) / dv
          : Infinity;
    const scale: number = Math.min(tu, tv),
      side: 0 | 2 | 3 | 1 = tu <= tv ? (du > 0 ? 0 : 2) : dv > 0 ? 1 : 3;
    let uu: number = centerU + du * scale,
      vv: number = centerV + dv * scale;
    if (side === 0) uu = u[1];
    else if (side === 2) uu = u[0];
    else if (side === 1) vv = v[1];
    else vv = v[0];
    return { point: point(at, uu, vv), side };
  };
  const corner: (side: number) => [number, number] = (side: number): [number, number] =>
    side === 0
      ? [u[1], v[1]]
      : side === 1
        ? [u[0], v[1]]
        : side === 2
          ? [u[0], v[0]]
          : [u[1], v[0]];
  const boundary: Array<[number, number]> = [];
  for (let i: number = 0; i < SEGMENTS; i++) {
    const a: { point: Vec; side: number; } = outer(0, i),
      next: { point: Vec; side: number; } = outer(0, (i + 1) % SEGMENTS);
    boundary.push(
      axis === 0 ? [a.point[1], a.point[2]] : [a.point[0], a.point[1]],
    );
    if (a.side !== next.side) boundary.push(corner(a.side));
  }
  for (let side: number = 0; side < 4; side++) {
    const fixed: number =
      side === 0 ? u[1] : side === 1 ? v[1] : side === 2 ? u[0] : v[0];
    const along: 0 | 1 = side === 0 || side === 2 ? 1 : 0;
    const values: number[] = [
      ...new Set(
        boundary
          .filter((p: [number, number]) : boolean => Math.abs(p[1 - along] - fixed) < 1e-9)
          .map((p: [number, number]) : number => p[along]),
      ),
    ].sort((a: number, b: number) : number => a - b);
    const n: Vec =
      axis === 0
        ? side === 0
          ? [0, 1, 0]
          : side === 1
            ? [0, 0, 1]
            : side === 2
              ? [0, -1, 0]
              : [0, 0, -1]
        : side === 0
          ? [1, 0, 0]
          : side === 1
            ? [0, 1, 0]
            : side === 2
              ? [-1, 0, 0]
              : [0, -1, 0];
    const uvReference: Vec[] = [
      point(axial[0], u[0], v[0]),
      point(axial[1], u[1], v[1]),
    ];
    for (let i: number = 0; i < values.length - 1; i++) {
      const cross0: [number, number] =
        along === 1 ? [fixed, values[i]] : [values[i], fixed];
      const cross1: [number, number] =
        along === 1 ? [fixed, values[i + 1]] : [values[i + 1], fixed];
      w.quad(
        [
          point(axial[0], ...cross0),
          point(axial[1], ...cross0),
          point(axial[1], ...cross1),
          point(axial[0], ...cross1),
        ],
        n,
        uvReference,
      );
    }
  }
  const faceReference: Vec[] = [point(0, u[0], v[0]), point(0, u[1], v[1])];
  for (const [end, sign] of [
    [0, -1],
    [1, 1],
  ] as const) {
    const at: number = axial[end],
      n: Vec = normal(sign);
    if (Math.abs(at - span[end]) > 1e-8) {
      const ci: number = w.vertex(
        point(at, centerU, centerV),
        n,
        metricUv(point(at, centerU, centerV), n, faceReference),
      );
      for (let i: number = 0; i < boundary.length; i++) {
        const a: Vec = point(at, ...boundary[i]),
          next: Vec = point(at, ...boundary[(i + 1) % boundary.length]);
        const ia: number = w.vertex(a, n, metricUv(a, n, faceReference)),
          ib: number = w.vertex(next, n, metricUv(next, n, faceReference));
        w.triangle(ci, ia, ib);
      }
      continue;
    }
    for (let i: number = 0; i < SEGMENTS; i++) {
      const a: { point: Vec; side: number; } = outer(at, i),
        next: { point: Vec; side: number; } = outer(at, (i + 1) % SEGMENTS);
      w.quad(
        [a.point, next.point, circle(at, (i + 1) % SEGMENTS), circle(at, i)],
        n,
        faceReference,
      );
      if (a.side !== next.side) {
        const vertex: [number, number] = corner(a.side),
          p: Vec = point(at, vertex[0], vertex[1]);
        if (
          Math.hypot(...sub(a.point, p)) > 1e-12 &&
          Math.hypot(...sub(next.point, p)) > 1e-12
        ) {
          const ids: number[] = [a.point, p, next.point].map((q: Vec) : number =>
            w.vertex(q, n, metricUv(q, n, faceReference)),
          );
          w.triangle(ids[0], ids[1], ids[2]);
        }
      }
    }
  }
  let arc: number = 0;
  for (let i: number = 0; i < SEGMENTS; i++) {
    const edge: number = Math.hypot(...sub(circle(span[0], i + 1), circle(span[0], i)));
    const radial: Vec =
      axis === 0
        ? [
            0,
            -Math.cos((TAU * (i + 0.5)) / SEGMENTS),
            -Math.sin((TAU * (i + 0.5)) / SEGMENTS),
          ]
        : [
            -Math.cos((TAU * (i + 0.5)) / SEGMENTS),
            -Math.sin((TAU * (i + 0.5)) / SEGMENTS),
            0,
          ];
    const points: Vec[] = [
      circle(span[0], i),
      circle(span[0], i + 1),
      circle(span[1], i + 1),
      circle(span[1], i),
    ];
    const uv: [
      [number, number],
      [number, number],
      [number, number],
      [number, number],
    ] = [
      [arc, 0],
      [arc + edge, 0],
      [arc + edge, span[1] - span[0]],
      [arc, span[1] - span[0]],
    ];
    const ids: number[] = points.map((p: Vec, j: number) : number => w.vertex(p, radial, uv[j]));
    w.triangle(ids[0], ids[1], ids[2]);
    w.triangle(ids[0], ids[2], ids[3]);
    arc += edge;
  }
  for (const [at, sign] of [
    [span[0], 1],
    [span[1], -1],
  ] as const) {
    if (Math.abs(at - axial[sign > 0 ? 0 : 1]) <= 1e-8) continue;
    const n: Vec = normal(sign),
      center: Vec = point(at, centerU, centerV),
      reference: Vec[] = [
        point(at, centerU - radius, centerV - radius),
        point(at, centerU + radius, centerV + radius),
      ];
    const ci: number = w.vertex(center, n, metricUv(center, n, reference));
    for (let i: number = 0; i < SEGMENTS; i++) {
      const a: Vec = circle(at, i),
        next: Vec = circle(at, i + 1);
      const ia: number = w.vertex(a, n, metricUv(a, n, reference)),
        ib: number = w.vertex(next, n, metricUv(next, n, reference));
      w.triangle(ci, ia, ib);
    }
  }
  return true;
}
