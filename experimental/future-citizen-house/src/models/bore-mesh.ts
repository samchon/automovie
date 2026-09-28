import {
  type Bounds,
  MeshWriter,
  type Vec,
  metricUv,
  sub,
} from "./orthogonal-mesh";
import { SEGMENTS, TAU } from "./round-mesh";

/** Reviewed model geometry; docs/models/000-representation.md owns topology and UVs. */
export function boxWithBore(
  w: MeshWriter,
  b: Bounds,
  bore: { axis: string; args: string[] },
): boolean {
  if (bore.axis !== "-x" && bore.axis !== "-z")
    throw Error(`unsupported box bore axis ${bore.axis}`);
  const numeric = (s: string) => Number(s.replace("−", "-"));
  const range = (s: string): [number, number] => {
    const values = s.split("..").map(numeric);
    if (values.length !== 2 || !values.every(Number.isFinite))
      throw Error(`invalid bore ${s}`);
    return [values[0], values[1]];
  };
  const axis = bore.axis === "-x" ? 0 : 2;
  const axial = axis === 0 ? b.x : b.z;
  const span = axis === 0 ? range(bore.args[0]) : range(bore.args[3]);
  const centerU = axis === 0 ? numeric(bore.args[1]) : numeric(bore.args[0]);
  const centerV = axis === 0 ? numeric(bore.args[2]) : numeric(bore.args[1]);
  const radius = axis === 0 ? numeric(bore.args[3]) : numeric(bore.args[2]);
  const u = axis === 0 ? b.y : b.x,
    v = axis === 0 ? b.z : b.y;
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
  const point = (axialValue: number, uu: number, vv: number): Vec =>
    axis === 0 ? [axialValue, uu, vv] : [uu, vv, axialValue];
  const normal = (sign: number): Vec =>
    axis === 0 ? [sign, 0, 0] : [0, 0, sign];
  const circle = (at: number, i: number): Vec =>
    point(
      at,
      centerU + radius * Math.cos((TAU * i) / SEGMENTS),
      centerV + radius * Math.sin((TAU * i) / SEGMENTS),
    );
  const outer = (at: number, i: number): { point: Vec; side: number } => {
    const du = Math.cos((TAU * i) / SEGMENTS),
      dv = Math.sin((TAU * i) / SEGMENTS);
    const tu =
      du > 0
        ? (u[1] - centerU) / du
        : du < 0
          ? (u[0] - centerU) / du
          : Infinity;
    const tv =
      dv > 0
        ? (v[1] - centerV) / dv
        : dv < 0
          ? (v[0] - centerV) / dv
          : Infinity;
    const scale = Math.min(tu, tv),
      side = tu <= tv ? (du > 0 ? 0 : 2) : dv > 0 ? 1 : 3;
    let uu = centerU + du * scale,
      vv = centerV + dv * scale;
    if (side === 0) uu = u[1];
    else if (side === 2) uu = u[0];
    else if (side === 1) vv = v[1];
    else vv = v[0];
    return { point: point(at, uu, vv), side };
  };
  const corner = (side: number): [number, number] =>
    side === 0
      ? [u[1], v[1]]
      : side === 1
        ? [u[0], v[1]]
        : side === 2
          ? [u[0], v[0]]
          : [u[1], v[0]];
  const boundary: Array<[number, number]> = [];
  for (let i = 0; i < SEGMENTS; i++) {
    const a = outer(0, i),
      next = outer(0, (i + 1) % SEGMENTS);
    boundary.push(
      axis === 0 ? [a.point[1], a.point[2]] : [a.point[0], a.point[1]],
    );
    if (a.side !== next.side) boundary.push(corner(a.side));
  }
  for (let side = 0; side < 4; side++) {
    const fixed =
      side === 0 ? u[1] : side === 1 ? v[1] : side === 2 ? u[0] : v[0];
    const along = side === 0 || side === 2 ? 1 : 0;
    const values = [
      ...new Set(
        boundary
          .filter((p) => Math.abs(p[1 - along] - fixed) < 1e-9)
          .map((p) => p[along]),
      ),
    ].sort((a, b) => a - b);
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
    const uvReference = [
      point(axial[0], u[0], v[0]),
      point(axial[1], u[1], v[1]),
    ];
    for (let i = 0; i < values.length - 1; i++) {
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
  const faceReference = [point(0, u[0], v[0]), point(0, u[1], v[1])];
  for (const [end, sign] of [
    [0, -1],
    [1, 1],
  ] as const) {
    const at = axial[end],
      n = normal(sign);
    if (Math.abs(at - span[end]) > 1e-8) {
      const ci = w.vertex(
        point(at, centerU, centerV),
        n,
        metricUv(point(at, centerU, centerV), n, faceReference),
      );
      for (let i = 0; i < boundary.length; i++) {
        const a = point(at, ...boundary[i]),
          next = point(at, ...boundary[(i + 1) % boundary.length]);
        const ia = w.vertex(a, n, metricUv(a, n, faceReference)),
          ib = w.vertex(next, n, metricUv(next, n, faceReference));
        w.triangle(ci, ia, ib);
      }
      continue;
    }
    for (let i = 0; i < SEGMENTS; i++) {
      const a = outer(at, i),
        next = outer(at, (i + 1) % SEGMENTS);
      w.quad(
        [a.point, next.point, circle(at, (i + 1) % SEGMENTS), circle(at, i)],
        n,
        faceReference,
      );
      if (a.side !== next.side) {
        const vertex = corner(a.side),
          p = point(at, vertex[0], vertex[1]);
        if (
          Math.hypot(...sub(a.point, p)) > 1e-12 &&
          Math.hypot(...sub(next.point, p)) > 1e-12
        ) {
          const ids = [a.point, p, next.point].map((q) =>
            w.vertex(q, n, metricUv(q, n, faceReference)),
          );
          w.triangle(ids[0], ids[1], ids[2]);
        }
      }
    }
  }
  let arc = 0;
  for (let i = 0; i < SEGMENTS; i++) {
    const edge = Math.hypot(...sub(circle(span[0], i + 1), circle(span[0], i)));
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
    const points = [
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
    const ids = points.map((p, j) => w.vertex(p, radial, uv[j]));
    w.triangle(ids[0], ids[1], ids[2]);
    w.triangle(ids[0], ids[2], ids[3]);
    arc += edge;
  }
  for (const [at, sign] of [
    [span[0], 1],
    [span[1], -1],
  ] as const) {
    if (Math.abs(at - axial[sign > 0 ? 0 : 1]) <= 1e-8) continue;
    const n = normal(sign),
      center = point(at, centerU, centerV),
      reference = [
        point(at, centerU - radius, centerV - radius),
        point(at, centerU + radius, centerV + radius),
      ];
    const ci = w.vertex(center, n, metricUv(center, n, reference));
    for (let i = 0; i < SEGMENTS; i++) {
      const a = circle(at, i),
        next = circle(at, i + 1);
      const ia = w.vertex(a, n, metricUv(a, n, reference)),
        ib = w.vertex(next, n, metricUv(next, n, reference));
      w.triangle(ci, ia, ib);
    }
  }
  return true;
}

export function boreCuts(
  bore: { axis: string; args: string[] },
  part: Bounds,
): Bounds[] {
  let axis: 0 | 1 | 2,
    centerA: number,
    centerB: number,
    radius: number,
    interval: [number, number];
  const numeric = (s: string) => Number(s.replace("−", "-"));
  const span = (s: string): [number, number] => {
    const values = s.split("..").map(numeric);
    if (values.length !== 2 || !values.every(Number.isFinite))
      throw Error(`invalid bore span ${s}`);
    return [values[0], values[1]];
  };
  if (bore.axis === "-z") {
    axis = 2;
    centerA = numeric(bore.args[0]);
    centerB = numeric(bore.args[1]);
    radius = numeric(bore.args[2]);
    interval = span(bore.args[3]);
  } else if (bore.axis === "-x") {
    axis = 0;
    interval = span(bore.args[0]);
    centerA = numeric(bore.args[1]);
    centerB = numeric(bore.args[2]);
    radius = numeric(bore.args[3]);
  } else {
    axis = 1;
    radius = numeric(bore.args[0]);
    interval = span(bore.args[1]);
    centerA = (part.x[0] + part.x[1]) / 2;
    centerB = (part.z[0] + part.z[1]) / 2;
  }
  // The axial 24-gon is represented by its twelve symmetric rectangular
  // bands for the common orthogonal cut producer. Its bore axis and radius
  // come from the reviewed @bore declaration, not from a viewer tolerance.
  const values = [
    ...new Set(
      Array.from(
        { length: SEGMENTS },
        (_, i) =>
          Math.round(Math.sin((TAU * i) / SEGMENTS) * radius * 1e9) / 1e9,
      ),
    ),
  ].sort((a, b) => a - b);
  const cuts: Bounds[] = [];
  for (let i = 0; i < values.length - 1; i++) {
    const mid = (values[i] + values[i + 1]) / 2;
    const half =
      radius * Math.cos(Math.asin(Math.min(1, Math.abs(mid / radius))));
    const a: [number, number] = [centerA - half, centerA + half];
    const b: [number, number] = [centerB + values[i], centerB + values[i + 1]];
    cuts.push(
      axis === 2
        ? { x: a, y: b, z: interval }
        : axis === 0
          ? { x: interval, y: b, z: a }
          : { x: a, y: interval, z: b },
    );
  }
  return cuts;
}
