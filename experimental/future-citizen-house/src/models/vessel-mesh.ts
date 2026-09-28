import {
  type Bounds,
  MeshWriter,
  type Vec,
  metricUv,
  normalize,
} from "./orthogonal-mesh";
import type { ModelPartRecord, ModelStateRecord } from "./representation";
import { SEGMENTS, TAU } from "./round-mesh";

/** Reviewed model geometry; docs/models/000-representation.md owns topology and UVs. */
export function radialShell(
  w: MeshWriter,
  b: Bounds,
  r: [number, number, number, number],
): void {
  const [cx, cz, inner, outer] = r;
  lathedShell(
    w,
    cx,
    cz,
    [
      [b.y[0], outer, outer],
      [b.y[1], outer, outer],
    ],
    [
      [b.y[0], inner, inner],
      [b.y[1], inner, inner],
    ],
    true,
  );
}

type Ring = [number, number, number]; // local Y, X radius, Z radius
function lathedShell(
  w: MeshWriter,
  cx: number,
  cz: number,
  outer: Ring[],
  inner: Ring[],
  through: boolean,
): void {
  const point = (ring: Ring, i: number): Vec => [
    cx + Math.sin((TAU * i) / SEGMENTS) * ring[1],
    ring[0],
    cz - Math.cos((TAU * i) / SEGMENTS) * ring[2],
  ];
  const wall = (rings: Ring[], inward: boolean): void => {
    let meridian = 0;
    for (let level = 0; level < rings.length - 1; level++) {
      const lo = rings[level],
        hi = rings[level + 1];
      const step = Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
      for (let i = 0; i < SEGMENTS; i++) {
        const p0 = point(lo, i),
          p1 = point(lo, i + 1),
          p2 = point(hi, i + 1),
          p3 = point(hi, i);
        const normal = normalize([
          Math.sin((TAU * (i + 0.5)) / SEGMENTS) / Math.max(lo[1], 0.000001),
          0,
          -Math.cos((TAU * (i + 0.5)) / SEGMENTS) / Math.max(lo[2], 0.000001),
        ]);
        const n = inward
          ? ([-normal[0], -normal[1], -normal[2]] as Vec)
          : normal;
        let arc = 0;
        for (let j = 0; j < i; j++)
          arc += Math.hypot(
            point(lo, j + 1)[0] - point(lo, j)[0],
            point(lo, j + 1)[2] - point(lo, j)[2],
          );
        const edge = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]);
        const a = w.vertex(p0, n, [arc, meridian]),
          b = w.vertex(p1, n, [arc + edge, meridian]);
        const c = w.vertex(p2, n, [arc + edge, meridian + step]),
          d = w.vertex(p3, n, [arc, meridian + step]);
        if (inward) {
          w.triangle(a, c, b);
          w.triangle(a, d, c);
        } else {
          w.triangle(a, b, c);
          w.triangle(a, c, d);
        }
      }
      meridian += step;
    }
  };
  const cap = (y: number, rx: number, rz: number, n: Vec) => {
    const center: Vec = [cx, y, cz];
    const ci = w.vertex(center, n, [rx, rz]);
    const points = Array.from(
      { length: SEGMENTS },
      (_, i): Vec => [
        cx + Math.sin((TAU * i) / SEGMENTS) * rx,
        y,
        cz - Math.cos((TAU * i) / SEGMENTS) * rz,
      ],
    );
    const ids = points.map((p) => w.vertex(p, n, metricUv(p, n, points)));
    for (let i = 0; i < SEGMENTS; i++) {
      const a = ids[i],
        b = ids[(i + 1) % SEGMENTS];
      if (n[1] > 0) w.triangle(ci, b, a);
      else w.triangle(ci, a, b);
    }
  };
  wall(outer, false);
  wall(inner, true);
  const bridge = (o: Ring, ir: Ring, n: Vec) => {
    const reference = Array.from({ length: SEGMENTS }, (_, i) => point(o, i));
    for (let i = 0; i < SEGMENTS; i++) {
      const a = point(o, i),
        b = point(o, i + 1),
        c = point(ir, i + 1),
        d = point(ir, i);
      w.quad([a, b, c, d], n, reference);
    }
  };
  bridge(outer[outer.length - 1], inner[inner.length - 1], [0, 1, 0]);
  if (through) bridge(inner[0], outer[0], [0, -1, 0]);
  else {
    cap(outer[0][0], outer[0][1], outer[0][2], [0, -1, 0]);
    cap(inner[0][0], inner[0][1], inner[0][2], [0, 1, 0]);
  }
}

export function vessel(
  w: MeshWriter,
  b: Bounds,
  st: ModelStateRecord,
  part: ModelPartRecord,
): boolean {
  const rx = (b.x[1] - b.x[0]) / 2,
    rz = (b.z[1] - b.z[0]) / 2,
    cx = (b.x[0] + b.x[1]) / 2,
    cz = (b.z[0] + b.z[1]) / 2;
  if (st.plantSpec && part.id === "pot") {
    const spec = st.plantSpec,
      H = Number(st.state) / 1000,
      t = Math.max(spec.wallMinimum, spec.wallFactor * H);
    const bottomR = spec.potBottomRadius * H,
      topR = spec.potTopRadius * H;
    const bottomInner =
      bottomR + ((topR - bottomR) * t) / (b.y[1] - b.y[0]) - t;
    lathedShell(
      w,
      0,
      0,
      [
        [b.y[0], bottomR, bottomR],
        [b.y[1], topR, topR],
      ],
      [
        [b.y[0] + t, bottomInner, bottomInner],
        [b.y[1], topR - t, topR - t],
      ],
      false,
    );
    return true;
  }
  const profile = st.profiles?.[part.id];
  if (profile) {
    const [section, bottomDivisor, shoulderRatio, wallDivisor, mouthRadius] =
      profile;
    const H = b.y[1] - b.y[0],
      floor = H / Number(bottomDivisor),
      shoulder =
        Number(shoulderRatio.split("/")[0]) /
        Number(shoulderRatio.split("/")[1]);
    const wall = H / Number(wallDivisor),
      neck = Number(mouthRadius) + wall;
    const nr = section === "ellipse" ? neck : neck;
    lathedShell(
      w,
      cx,
      cz,
      [
        [b.y[0], rx, rz],
        [b.y[0] + H * shoulder, rx, rz],
        [b.y[1], nr, nr],
      ],
      [
        [
          b.y[0] + floor,
          Math.max(rx - wall, 0.000001),
          Math.max(rz - wall, 0.000001),
        ],
        [
          b.y[0] + H * shoulder,
          Math.max(rx - wall, 0.000001),
          Math.max(rz - wall, 0.000001),
        ],
        [b.y[1], Number(mouthRadius), Number(mouthRadius)],
      ],
      false,
    );
    return true;
  }
  const ellipse = st.ellipse?.[part.id];
  if (ellipse) {
    const [ex, ez, ix, iz, ox, oz] = ellipse;
    const through = part.id !== "bowl";
    const floor = through ? b.y[0] : b.y[1] - 0.14; // toilet H2: bowl-cavity-depth = 0.14 m
    lathedShell(
      w,
      ex,
      ez,
      [
        [b.y[0], ox, oz],
        [b.y[1], ox, oz],
      ],
      [
        [floor, ix, iz],
        [b.y[1], ix, iz],
      ],
      through,
    );
    return true;
  }
  const bore = st.bores?.[part.id];
  if (bore?.axis === "-y" && !st.voids?.[part.id]) {
    const radius = Number(bore.args[0]),
      yrange = bore.args[1].replace("−", "-").split("..").map(Number);
    if (yrange.length !== 2 || !yrange.every(Number.isFinite))
      throw Error(`invalid bore ${part.id}`);
    lathedShell(
      w,
      cx,
      cz,
      [
        [b.y[0], rx, rz],
        [b.y[1], rx, rz],
      ],
      [
        [yrange[0], radius, radius],
        [b.y[1], radius, radius],
      ],
      yrange[0] === b.y[0],
    );
    return true;
  }
  return false;
}

/** A 24-sided axial bore through the authored interval of a rectangular host. */
