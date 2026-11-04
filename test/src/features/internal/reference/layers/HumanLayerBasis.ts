import { HumanAnatomy } from "../../HumanAnatomy";
import type { HumanLayerIndex } from "../../HumanLayerIndex";
import { HumanLayerPlane } from "../../HumanLayerPlane";
import { HumanLayerPolygon } from "../../HumanLayerPolygon";
import { HumanPeople } from "../../HumanPeople";
import type { HumanPopulation } from "../../HumanPopulation";
import { HumanReference } from "../bodies/HumanReference";
import { HumanReferenceBodies } from "../bodies/HumanReferenceBodies";
import { HumanReferenceFiles } from "../bodies/HumanReferenceFiles";
import { HumanReferenceRawOrder } from "../bodies/HumanReferenceRawOrder";
import { HumanReferenceSurface } from "../surface/HumanReferenceSurface";
import { HumanReferenceSurfacePopulation } from "../surface/HumanReferenceSurfacePopulation";

/** A point in space, mm. */
type V3 = HumanAnatomy.V3;

/** A point in a section's plane, mm. */
type V2 = [number, number];

/** The shared vector helpers, by a short name. */
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * What a reference comparison's limits rest on: the population's bodies read
 * at the reference's own cut edges.
 *
 * Every limit flags only a gross departure, and a universal section may differ
 * from its reference within the range real bodies take and read better, so a
 * limit is 2.576 unconditional standard deviations over the bodies as
 * measured, neither scaled to the reference's stature nor aligned to it, never
 * a residual or a conditional spread, and never a function of the generated
 * skin.
 */
export namespace HumanLayerBasis {
  /** One population body as measured. */
  export interface IBody {
    /** Reference alias. */
    id: string;

    /** Raw positions, mm, its parts concatenated in file order (the population's shared vertex order). */
    P: Float32Array;
  }

  /** What a reference comparison rests on. */
  export interface IBasis {
    /** Reference alias. */
    id: string;

    /** The sex whose ANSUR 1988 statistics floor the limits. */
    sex: HumanPopulation.Sex;

    /** Outward unit normal per welded reference vertex. */
    normal: Float64Array;

    /** First raw vertex of each welded vertex, the population's shared vertex order. */
    raw: Int32Array;

    /** Whether each welded vertex belongs to the head part alone. */
    head: Uint8Array;

    /** The body population as measured: every reference body but this one and `HumanReferenceSurface.EXCLUDED`. */
    bodies: IBody[];

    /** The four fitted heads, this one's included, as measured. */
    heads: IBody[];
  }

  /** The population's spread of one reference section, standard deviations. */
  export interface ISpread {
    /** Of the perimeter, mm. */
    girth: number;

    /** Of the taut-tape girth, mm. */
    taut: number;

    /** Of the enclosed area, mm². */
    area: number;

    /** Of each point's distance from its own section's centroid, mm, per loop point. */
    radius: Float64Array;
  }

  /**
   * Builds the basis of a reference's comparison, for each call; the
   * population bodies come from `HumanReferenceBodies`, shared with the
   * surface comparison.
   *
   * @param id The reference alias.
   * @throws Error when fewer than `HumanReferenceSurface.MINIMUM` other bodies or not all four fitted heads are present.
   */
  export function build(id: string): IBasis {
    const mesh: HumanReference.IMesh = HumanReference.mesh(id);
    const bodies: string[] = HumanReferenceSurface.population().filter((other: string): boolean => other !== id);
    const heads: string[] = HumanReference.IDS.filter((other: string): boolean => HumanReferenceFiles.exists(other));

    if (bodies.length < HumanReferenceSurface.MINIMUM)
      throw new Error(`the reference population holds ${bodies.length} bodies besides ${id}, fewer than ${HumanReferenceSurface.MINIMUM}; the layer limits have no basis`);

    if (heads.length !== HumanReference.IDS.length)
      throw new Error(`the head population holds ${heads.length} of the ${HumanReference.IDS.length} fitted heads`);

    return {
      id,
      sex: HumanPeople.sex(id),
      normal: outwardNormals(mesh.P, mesh.I),
      raw: HumanReferenceRawOrder.get(id),
      head: HumanReferenceSurfacePopulation.headOnly(mesh),
      bodies: bodies.map(measured),
      heads: heads.map(measured),
    };
  }

  /**
   * Unconditional standard deviations of a reference section's girth, taut
   * girth, area and, point by point, distance from its own centroid over the
   * population.
   *
   * Every other body is read as measured at the same mesh edges and the same
   * positions along them (the bodies share one vertex order), so the spread
   * is the range real bodies take at this site, size included. Each quantity
   * is unchanged by a rigid motion; taut girth, area and the centroid are read
   * in the plane of the body's own curve (Newell's normal). A section whose
   * points lie mostly on head-only vertices reads the four fitted heads.
   *
   * Turning is not read this way: another body's points at this body's cut
   * edges leave a plane by a fraction of a millimetre from edge to edge, and
   * that zigzag turns by more than any fold, so the fold limit stands on the
   * reference's own section instead.
   *
   * @param b The reference's basis.
   * @param loop The reference's section loop.
   */
  export function spread(b: IBasis, loop: HumanLayerIndex.ILoop): ISpread {
    const m: number = loop.points.length;
    const sum: Float64Array = new Float64Array(m);
    const square: Float64Array = new Float64Array(m);
    const values: number[][] = [[], [], []];
    let headVotes: number = 0;

    for (let j: number = 0; j < m; j++) if (b.head[loop.a[j]!] === 1 && b.head[loop.b[j]!] === 1) headVotes++;

    const people: IBody[] = headVotes * 2 > m ? b.heads : b.bodies;

    for (const body of people) {
      const section: ISection = flatten(body, b, loop);
      const flat: V2[] = section.flat;
      const c: V2 = HumanLayerPolygon.centroid(flat);

      values[0]!.push(section.girth);
      values[1]!.push(HumanLayerPolygon.taut(flat));
      values[2]!.push(Math.abs(HumanLayerPolygon.area(flat)));

      for (let j: number = 0; j < m; j++) {
        const r: number = Math.hypot(flat[j]![0] - c[0], flat[j]![1] - c[1]);

        sum[j] += r;
        square[j] += r * r;
      }
    }

    const n: number = people.length;

    return {
      girth: deviation(values[0]!),
      taut: deviation(values[1]!),
      area: deviation(values[2]!),
      radius: Float64Array.from(sum, (s: number, j: number): number =>
        n < 2 ? 0 : Math.sqrt(Math.max(0, (square[j]! - (s * s) / n) / (n - 1))),
      ),
    };
  }
}

/** A body's section at a reference's cut edges. */
interface ISection {
  /** The section flattened into the plane of its own curve (Newell's normal), mm. */
  flat: V2[];

  /** The section's girth along its three-dimensional edges, mm. */
  girth: number;
}

/** A body's section at a reference's cut edges, flattened into the plane of its own curve (Newell's normal). */
function flatten(body: HumanLayerBasis.IBody, b: HumanLayerBasis.IBasis, loop: HumanLayerIndex.ILoop): ISection {
  const m: number = loop.points.length;
  const points: V3[] = [];
  let newell: V3 = [0, 0, 0];

  for (let j: number = 0; j < m; j++) {
    const ra: number = 3 * b.raw[loop.a[j]!]!;
    const rb: number = 3 * b.raw[loop.b[j]!]!;
    const s: number = loop.s[j]!;

    points.push([0, 1, 2].map((k: number): number => (1 - s) * body.P[ra + k]! + s * body.P[rb + k]!) as V3);
  }

  let girth: number = 0;

  for (let j: number = 0; j < m; j++) {
    newell = A.add(newell, A.cross(points[j]!, points[(j + 1) % m]!));
    girth += A.dist(points[j]!, points[(j + 1) % m]!);
  }

  const plane: HumanLayerPlane.IPlane = HumanLayerPlane.chart(points[0]!, newell, A.basis(A.unit(newell))[0]);

  return { flat: points.map((p: V3): V2 => HumanLayerPlane.local(plane, p)), girth };
}

/** Sample standard deviation; zero for fewer than two values. */
function deviation(x: number[]): number {
  if (x.length < 2) return 0;

  const mean: number = x.reduce((s: number, v: number): number => s + v, 0) / x.length;

  return Math.sqrt(x.reduce((s: number, v: number): number => s + (v - mean) ** 2, 0) / (x.length - 1));
}

/** Outward unit vertex normals, area weighted; a mesh wound inward is turned by its signed volume. */
function outwardNormals(P: Float64Array, I: Uint32Array): Float64Array {
  const N: Float64Array = new Float64Array(P.length);
  let volume: number = 0;

  for (let t: number = 0; t < I.length; t += 3) {
    const a: number = 3 * I[t]!;
    const b: number = 3 * I[t + 1]!;
    const c: number = 3 * I[t + 2]!;
    const ux: number = P[b]! - P[a]!;
    const uy: number = P[b + 1]! - P[a + 1]!;
    const uz: number = P[b + 2]! - P[a + 2]!;
    const vx: number = P[c]! - P[a]!;
    const vy: number = P[c + 1]! - P[a + 1]!;
    const vz: number = P[c + 2]! - P[a + 2]!;
    const x: number = uy * vz - uz * vy;
    const y: number = uz * vx - ux * vz;
    const z: number = ux * vy - uy * vx;

    volume += P[a]! * x + P[a + 1]! * y + P[a + 2]! * z;

    for (const o of [a, b, c]) {
      N[o] += x;
      N[o + 1] += y;
      N[o + 2] += z;
    }
  }

  const sign: number = volume < 0 ? -1 : 1;

  for (let v: number = 0; v < N.length; v += 3) {
    const l: number = Math.hypot(N[v]!, N[v + 1]!, N[v + 2]!) || 1;

    N[v] = (sign * N[v]!) / l;
    N[v + 1] = (sign * N[v + 1]!) / l;
    N[v + 2] = (sign * N[v + 2]!) / l;
  }

  return N;
}

/**
 * A population body as measured, from the cache the surface comparison shares.
 *
 * @param id Reference alias.
 */
function measured(id: string): HumanLayerBasis.IBody {
  return { id, P: HumanReferenceBodies.get(id).P };
}
