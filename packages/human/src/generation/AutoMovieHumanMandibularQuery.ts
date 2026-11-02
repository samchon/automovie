import { AutoMovieHumanMandibularBorder as Border } from "./AutoMovieHumanMandibularBorder";
import { AutoMovieHumanMandibularSweep as Sweep } from "./AutoMovieHumanMandibularSweep";
import { AutoMovieHumanMandibularMeshField as MeshField } from "./AutoMovieHumanMandibularMeshField";

/** Cached physical normal-section query for the existing jaw radial march. */
export namespace AutoMovieHumanMandibularQuery {
  /** One preparation followed by allocation-bounded physical point queries. */
  export interface IPrepared {
    /** Source station frames supporting this query. */
    stations: Sweep.IStation[];
    /** Lowest emitted mandibular-border height in body millimetres. */
    minimumY: number;
    /** Actual generated midline curve and its physical normal-section frame. */
    midline: Border.ICurve;
    /** Signed millimetres from the rounded mandibular side, negative inside. */
    field(x: number, y: number, z: number): number;
    /** Diagnostic continuous normal-section field, ambiguous inside the evolute. */
    sectionField(x: number, y: number, z: number): number;
  }

  /** Physical dot product. */
  function dot(a: Border.Point, b: Border.Point): number { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }

  /** Normalize an interpolated physical normal, never a scalar field proxy. */
  function unit(a: Border.Point): Border.Point {
    const n: number = Math.hypot(...a);
    if (!(n > 0 && Number.isFinite(n))) throw new Error("The physical mandibular query has no supported normal frame.");
    return [a[0] / n, a[1] / n, a[2] / n];
  }

  /** Hermite origin and its first two angular derivatives. */
  function origin(a: Sweep.IStation, b: Sweep.IStation, u: number, h: number): {
    /** Interpolated arch intersection in body millimetres. */
    point: Border.Point;
    /** Arch-position derivative with respect to polar angle, millimetres per radian. */
    first: Border.Point;
    /** Second angular derivative of the arch position, millimetres per squared radian. */
    second: Border.Point;
  } {
    const point: Border.Point = [0, 0, 0];
    const first: Border.Point = [0, 0, 0];
    const second: Border.Point = [0, 0, 0];
    for (let j: number = 0; j < 3; j++) {
      const p: number = a.origin[j]!;
      const v: number = h * a.tangent[j]!;
      const c: number = 3 * (b.origin[j]! - p) - 2 * v - h * b.tangent[j]!;
      const d: number = 2 * (p - b.origin[j]!) + v + h * b.tangent[j]!;
      point[j] = p + u * (v + u * (c + u * d));
      first[j] = (v + u * (2 * c + 3 * u * d)) / h;
      second[j] = (2 * c + 6 * u * d) / (h * h);
    }
    return { point, first, second };
  }

  /** Hermite unit-normal interpolation uses the actual source normal jets. */
  function normal(a: Border.Point, da: Border.Point, b: Border.Point, db: Border.Point, u: number, h: number): Border.Point {
    const result: Border.Point = [0, 0, 0];
    for (let j: number = 0; j < 3; j++) {
      const v: number = h * da[j]!;
      const c: number = 3 * (b[j]! - a[j]!) - 2 * v - h * db[j]!;
      const d: number = 2 * (a[j]! - b[j]!) + v + h * db[j]!;
      result[j] = a[j]! + u * (v + u * (c + u * d));
    }
    return unit(result);
  }

  /**
   * Cache the 65 real source sections and their 257-point turns once. The
   * consuming field observes the actual emitted patch through a closest-point
   * BVH and physical source normals. The separate continuous-section query is
   * diagnostic: normal planes can have multiple roots inside the arch evolute
   * and do not necessarily describe the linear emitted triangle interior.
   * No old plan/border scalar becomes a physical coordinate. The caller keeps
   * its existing ramus/top/face-neck clipping ownership.
   */
  export function prepare(m: Sweep.IMandible): IPrepared {
    const maximum: number = Math.atan2(m.width, m.gonion - m.origin);
    const count: number = 64;
    const h: number = 2 * maximum / count;
    const mesh: Sweep.IOutput = Sweep.generate(m, count, 256);
    if (mesh.failures.length > 0) throw new Error(`Unsupported physical mandibular patch: ${JSON.stringify(mesh.failures)}`);
    const stations: Sweep.IStation[] = mesh.stations;
    const normals: Border.Point[] = stations.flatMap((at: Sweep.IStation): Border.Point[] => Array.from({ length: 257 }, (_: unknown, i: number): Border.Point => {
      const t: number = i / 256;
      const angle: number = at.curve.profile.angle * t ** 3 * (10 - 15 * t + 6 * t * t);
      return at.curve.frame.outward.map((v: number, j: number): number => Math.cos(angle) * v + Math.sin(angle) * at.curve.frame.below[j]!) as Border.Point;
    }));
    const physicalMesh: MeshField.IPrepared = MeshField.prepare(mesh.vertices, mesh.triangles, normals);

    /** Read one physical section after its source arch position is located. */
    function evaluate(theta: number, x: number, y: number, z: number): number {
        const i: number = Math.max(0, Math.min(count - 1, Math.floor((theta + maximum) / h)));
        const a: Sweep.IStation = stations[i]!;
        const b: Sweep.IStation = stations[i + 1]!;
        const u: number = Math.max(0, Math.min(1, (theta - a.angle) / h));
        const jet: ReturnType<typeof origin> = origin(a, b, u, h);
        const outward: Border.Point = normal(a.sideNormal, a.sideNormalDerivative, b.sideNormal, b.sideNormalDerivative, u, h);
        const under: Border.Point = normal(a.underNormal, a.underNormalDerivative, b.underNormal, b.underNormalDerivative, u, h);
        const cosine: number = dot(outward, under);
        const below: Border.Point = unit([under[0] - cosine * outward[0], under[1] - cosine * outward[1], under[2] - cosine * outward[2]]);
        const delta: Border.Point = [x - jet.point[0], y - jet.point[1], z - jet.point[2]];
        const plan: number = dot(delta, outward);
        const fall: number = dot(delta, below);
      return (1 - u) * Border.field(a.curve.profile, plan, fall) + u * Border.field(b.curve.profile, plan, fall);
    }

    return {
      stations,
      minimumY: Math.min(...mesh.vertices.map((p: Border.Point): number => p[1])),
      midline: stations[Math.floor(stations.length / 2)]!.curve,
      field: physicalMesh.field,
      /** Inspect all supported source normal-plane roots without certifying mesh equivalence. */
      sectionField(x: number, y: number, z: number): number {
        let closest: number = Infinity;
        let previous: number = 0;

        // A point inside an arch's evolute can lie on several normal planes.
        // Inspect every source bracket rather than trusting one polar seed.
        // Candidate sections compete by their actual physical skin distance.
        for (let i: number = 0; i <= count; i++) {
          const at: Sweep.IStation = stations[i]!;
          const residual: number = (x - at.origin[0]) * at.tangent[0] + (y - at.origin[1]) * at.tangent[1] + (z - at.origin[2]) * at.tangent[2];
          if (Math.abs(residual) <= 1e-10 * Math.max(1, Math.hypot(...at.tangent))) {
            const distance: number = evaluate(at.angle, x, y, z);
            if (Math.abs(distance) < Math.abs(closest)) closest = distance;
          }
          if (i > 0 && previous * residual < 0) {
            let lo: number = stations[i - 1]!.angle;
            let hi: number = at.angle;
            let flo: number = previous;
            let theta: number = (lo + hi) / 2;
            for (let iteration: number = 0; iteration < 32; iteration++) {
              const u: number = (theta - stations[i - 1]!.angle) / h;
              const jet: ReturnType<typeof origin> = origin(stations[i - 1]!, at, u, h);
              const delta: Border.Point = [x - jet.point[0], y - jet.point[1], z - jet.point[2]];
              const f: number = dot(delta, jet.first);
              if (Math.abs(f) <= 1e-10 * Math.max(1, Math.hypot(...jet.first))) break;
              if (flo * f <= 0) hi = theta;
              else { lo = theta; flo = f; }
              const df: number = -dot(jet.first, jet.first) + dot(delta, jet.second);
              const proposed: number = theta - f / df;
              theta = Number.isFinite(proposed) && proposed > lo && proposed < hi ? proposed : (lo + hi) / 2;
            }
            const distance: number = evaluate(theta, x, y, z);
            if (Math.abs(distance) < Math.abs(closest)) closest = distance;
          }
          previous = residual;
        }

        // End sections extend the body until the caller's ramus clips it.
        // They do not compete with a supported interior normal-plane root.
        if (!Number.isFinite(closest)) {
          const a: number = evaluate(-maximum, x, y, z);
          const b: number = evaluate(maximum, x, y, z);
          closest = Math.abs(a) < Math.abs(b) ? a : b;
        }
        return closest;
      },
    };
  }
}
