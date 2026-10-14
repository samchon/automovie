import { MeshWriter, type Vec, metricUv, normalize } from "./orthogonal-mesh";
import { SEGMENTS, TAU } from "./round-mesh";



type Ring = [number, number, number];
/**
 * Existing inner and outer ring mesh with rim and optional bottom closure.
 *
 * Ring tuples carry world-local Y and X/Z radii in metres around cx/cz. Nonempty inner/outer arrays with compatible end planes and finite positive radii are caller premises. Twenty-four angular segments join each wall and bridge the top rim; through shells bridge their bottoms, while closed vessels emit separate inner-floor and outer-bottom discs.
 *
 * Wall normals remain horizontal even where radii vary with Y, and their radius divisor is floored at 1e-6 metres. V accumulates a combined Y/X-radius/Z-radius step rather than a true meridian for each angle. For R rings and S samples, repeated arc prefixes and cap/reference scans take O(R*S^2) work with O(R*S) emitted output; S is fixed at 24. The writer retains output, local lists end on return, and no cross-call geometry is cached.
 */
export function lathedShell(
  w: MeshWriter,
  cx: number,
  cz: number,
  outer: Ring[],
  inner: Ring[],
  through: boolean,
): void {
  const point: (ring: Ring, i: number) => Vec = (ring: Ring, i: number): Vec => [
    cx + Math.sin((TAU * i) / SEGMENTS) * ring[1],
    ring[0],
    cz - Math.cos((TAU * i) / SEGMENTS) * ring[2],
  ];
  const wall: (rings: Ring[], inward: boolean) => void = (rings: Ring[], inward: boolean): void => {
    let meridian: number = 0;
    for (let level: number = 0; level < rings.length - 1; level++) {
      const lo: Ring = rings[level],
        hi: Ring = rings[level + 1];
      const step: number = Math.hypot(hi[0] - lo[0], hi[1] - lo[1], hi[2] - lo[2]);
      for (let i: number = 0; i < SEGMENTS; i++) {
        const p0: Vec = point(lo, i),
          p1: Vec = point(lo, i + 1),
          p2: Vec = point(hi, i + 1),
          p3: Vec = point(hi, i);
        const normal: Vec = normalize([
          Math.sin((TAU * (i + 0.5)) / SEGMENTS) / Math.max(lo[1], 0.000001),
          0,
          -Math.cos((TAU * (i + 0.5)) / SEGMENTS) / Math.max(lo[2], 0.000001),
        ]);
        const n: Vec = inward
          ? ([-normal[0], -normal[1], -normal[2]] as Vec)
          : normal;
        let arc: number = 0;
        for (let j: number = 0; j < i; j++)
          arc += Math.hypot(
            point(lo, j + 1)[0] - point(lo, j)[0],
            point(lo, j + 1)[2] - point(lo, j)[2],
          );
        const edge: number = Math.hypot(p1[0] - p0[0], p1[2] - p0[2]);
        const a: number = w.vertex(p0, n, [arc, meridian]),
          b: number = w.vertex(p1, n, [arc + edge, meridian]);
        const c: number = w.vertex(p2, n, [arc + edge, meridian + step]),
          d: number = w.vertex(p3, n, [arc, meridian + step]);
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
  const cap: (y: number, rx: number, rz: number, n: Vec) => void = (y: number, rx: number, rz: number, n: Vec) : void => {
    const center: Vec = [cx, y, cz];
    const ci: number = w.vertex(center, n, [rx, rz]);
    const points: Vec[] = Array.from(
      { length: SEGMENTS },
      (_: unknown, i: number): Vec => [
        cx + Math.sin((TAU * i) / SEGMENTS) * rx,
        y,
        cz - Math.cos((TAU * i) / SEGMENTS) * rz,
      ],
    );
    const ids: number[] = points.map((p: Vec) : number => w.vertex(p, n, metricUv(p, n, points)));
    for (let i: number = 0; i < SEGMENTS; i++) {
      const a: number = ids[i],
        b: number = ids[(i + 1) % SEGMENTS];
      if (n[1] > 0) w.triangle(ci, b, a);
      else w.triangle(ci, a, b);
    }
  };
  wall(outer, false);
  wall(inner, true);
  const bridge: (o: Ring, ir: Ring, n: Vec) => void = (o: Ring, ir: Ring, n: Vec) : void => {
    const reference: Vec[] = Array.from({ length: SEGMENTS }, (_: unknown, i: number) : Vec => point(o, i));
    for (let i: number = 0; i < SEGMENTS; i++) {
      const a: Vec = point(o, i),
        b: Vec = point(o, i + 1),
        c: Vec = point(ir, i + 1),
        d: Vec = point(ir, i);
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
