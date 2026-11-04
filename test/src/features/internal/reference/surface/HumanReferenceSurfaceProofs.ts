import type { HumanAnatomy } from "../../HumanAnatomy";
import { HumanReference } from "../bodies/HumanReference";
import { HumanReferenceSurface } from "./HumanReferenceSurface";
import { HumanReferenceSurfaceMesh } from "./HumanReferenceSurfaceMesh";

/** A made skin and the person it is compared for. */
interface ISubject {
  /** Reference alias. */
  id: string;

  /** The welded reference mesh. */
  mesh: HumanReference.IMesh;

  /** The reference as a labelled skin, the body every made skin is cut from. */
  labels: HumanAnatomy.ISkin;

  /** The reference's per-vertex limits, mm. */
  limit: Float64Array;

  /** The reference's outward vertex normals. */
  normal: Float64Array;

  /** Whether each reference vertex lies on the outer skin. */
  outer: Uint8Array;

  /** The reference's stature, mm. */
  stature: number;
}

/**
 * Red and green proofs of the surface comparison on made defects of known
 * size, read through the same `HumanReferenceSurface.compare` the real
 * comparison uses.
 *
 * Every made skin is the reference itself, labelled like it, with one known
 * change: so the correct answer is known exactly, independent of the
 * generator. A defect's size is set from the limit at its own site (the
 * limit plus a margin), so it is gross by construction at any person and any
 * limit, and the reading must return that size. The sites are found by
 * geometry alone, in the body's frame (forward +X, up +Y, left +Z): the
 * lateral surface of each leg just above the knee, where no hand hangs and
 * the leg is wide enough for the defect, and the front of the belly.
 */
export namespace HumanReferenceSurfaceProofs {
  /**
   * Run every proof on one reference and list each that fails.
   *
   * @param id Reference alias present in the checkout.
   * @param generated The generated skin of that person, for the known offset of real generated skin.
   * @returns One line per failed proof; empty when every proof holds.
   */
  export function prove(id: string, generated: HumanAnatomy.ISkin): string[] {
    const mesh: HumanReference.IMesh = HumanReference.mesh(id);
    const labels: HumanAnatomy.ISkin = HumanReference.skin(id);
    const limits: HumanReferenceSurface.ILimits = HumanReferenceSurface.limits(id);
    const s: ISubject = {
      id,
      mesh,
      labels,
      limit: limits.limit,
      normal: HumanReferenceSurfaceMesh.vertexNormals(mesh.P, mesh.I),
      outer: HumanReferenceSurface.outer(mesh.P, mesh.I),
      stature: limits.stature,
    };
    const failures: string[] = [];
    const fail: (what: string) => void = (what: string): void => {
      failures.push(`${id} proof: ${what}`);
    };

    // A correct body: the reference against itself reads nothing.
    const self: HumanReferenceSurface.IReport = compare(s, labels);
    let largest: number = 0;

    for (const d of self.deviation) if (!Number.isNaN(d)) largest = Math.max(largest, Math.abs(d));

    if (self.patches.length !== 0 || largest > 1e-6)
      fail(`the reference against itself reads ${self.patches.length} patches and ${largest} mm, expected none and 0`);

    // Known uniform offsets read their size as the median deviation.
    const medians: number[] = [1, 4].map((d: number): number => median(compare(s, offset(labels, s.normal, d)).deviation));

    if (Math.abs(medians[0]! - 1) > 0.01 || Math.abs(medians[1]! - 4) > 0.01)
      fail(`offsets of 1 and 4 mm read medians ${medians[0]!.toFixed(3)} and ${medians[1]!.toFixed(3)} mm`);

    // A bump outward on the left leg and a dent inward on the right leg.
    for (const [side, sign, direction] of [[1, 1, "outside"], [-1, -1, "inside"]] as [number, number, HumanReferenceSurface.Direction][]) {
      const v: number = site(s, side);
      const h: number = s.limit[v]! + 10;
      const report: HumanReferenceSurface.IReport = compare(s, bump(labels, s.normal, v, sign * h, 2 * h));
      const patch: HumanReferenceSurface.IPatch | undefined = report.patches[0];

      if (report.patches.length !== 1 || patch!.direction !== direction || Math.abs(patch!.max - h) > 1)
        fail(`a ${(sign * h).toFixed(1)} mm ${direction} defect at the ${side > 0 ? "left" : "right"} leg reads ${report.patches.map((p: HumanReferenceSurface.IPatch): string => `${p.direction} ${p.max.toFixed(1)} mm`).join(", ") || "nothing"}, expected one ${direction} patch of ${h.toFixed(1)} mm`);
    }

    // A hole in the belly reads as missing skin there, and only there.
    const belly: number = front(s);
    const holed: HumanReferenceSurface.IReport = compare(s, hole(labels, belly, 25));

    if (holed.patches.length === 0 || holed.patches.some((p: HumanReferenceSurface.IPatch): boolean => p.direction !== "missing" || distance(p.centroid, at(mesh.P, belly)) > 50))
      fail(`a 25 mm hole in the belly reads ${holed.patches.map((p: HumanReferenceSurface.IPatch): string => `${p.direction} at ${distance(p.centroid, at(mesh.P, belly)).toFixed(0)} mm`).join(", ") || "nothing"}, expected missing skin within 50 mm`);

    // A 20 mm cube well beyond the belly's limit reads as one detached part of its own area.
    const floating: HumanReferenceSurface.IReport = compare(s, cube(labels, at(mesh.P, belly), s.limit[belly]! + 200, 20));
    const part: HumanReferenceSurface.IPatch | undefined = floating.patches[0];

    if (floating.patches.length !== 1 || !part!.detached || Math.abs(part!.area - 2400) > 1)
      fail(`a 20 mm cube before the belly reads ${floating.patches.map((p: HumanReferenceSurface.IPatch): string => `${p.detached ? "detached" : p.direction} ${p.area.toFixed(0)} mm²`).join(", ") || "nothing"}, expected one detached part of 2400 mm²`);

    // The real generated skin moved 2 mm along its own normals moves the median reading by 2 mm.
    const before: number = median(compare(s, generated).deviation);
    const after: number = median(compare(s, offset(generated, HumanReferenceSurfaceMesh.vertexNormals(generated.P, generated.I), 2)).deviation);

    if (Math.abs(after - before - 2) > 0.1)
      fail(`the generated skin moved 2 mm outward moves the median reading by ${(after - before).toFixed(3)} mm`);
    return failures;
  }

  /**
   * Compare a made skin with the reference.
   *
   * @param s The subject.
   * @param generated The made skin.
   */
  function compare(s: ISubject, generated: HumanAnatomy.ISkin): HumanReferenceSurface.IReport {
    return HumanReferenceSurface.compare({ person: s.id, generated, reference: s.mesh, labels: s.labels, limit: s.limit });
  }

  /**
   * The outer-skin vertex most to one side, just above the knee: the lateral
   * surface of a leg.
   *
   * @param s The subject.
   * @param side +1 for the left leg (+Z), -1 for the right.
   */
  function site(s: ISubject, side: number): number {
    return extreme(s, 0.3, 0.33, (P: Float64Array, v: number): number => side * P[3 * v + 2]!, (): boolean => true);
  }

  /**
   * The outer-skin vertex most forward at the navel's height, near the median
   * plane: the front of the belly.
   *
   * @param s The subject.
   */
  function front(s: ISubject): number {
    return extreme(s, 0.57, 0.62, (P: Float64Array, v: number): number => P[3 * v]!, (P: Float64Array, v: number): boolean => Math.abs(P[3 * v + 2]!) < 40);
  }

  /**
   * The outer-skin vertex in a height band, as a share of stature, that
   * maximises a score among those a predicate admits.
   *
   * @param s The subject.
   * @param low Lower band edge, share of stature.
   * @param high Upper band edge, share of stature.
   * @param score What to maximise.
   * @param admit Which vertices to consider.
   */
  function extreme(
    s: ISubject,
    low: number,
    high: number,
    score: (P: Float64Array, v: number) => number,
    admit: (P: Float64Array, v: number) => boolean,
  ): number {
    const P: Float64Array = s.mesh.P;
    let best: number = -1;

    for (let v: number = 0; v < P.length / 3; v++) {
      const y: number = P[3 * v + 1]! / s.stature;

      if (s.outer[v] !== 1 || y < low || y > high || !admit(P, v)) continue;
      if (best === -1 || score(P, v) > score(P, best)) best = v;
    }
    if (best === -1) throw new Error(`${s.id}: no outer-skin vertex in the band ${low}..${high} of stature`);
    return best;
  }

  /**
   * A copy of a skin with every vertex moved along its normal.
   *
   * @param skin The skin.
   * @param normal Its outward vertex normals.
   * @param d Offset, mm; positive outward.
   */
  function offset(skin: HumanAnatomy.ISkin, normal: Float64Array, d: number): HumanAnatomy.ISkin {
    return { ...skin, P: Float64Array.from(skin.P, (c: number, k: number): number => c + d * normal[k]!) };
  }

  /**
   * A copy of a skin with a raised-cosine bump along the normals around one
   * vertex: height `h` at the centre, falling to zero at distance `radius`.
   *
   * @param skin The skin.
   * @param normal Its outward vertex normals.
   * @param v The centre vertex.
   * @param h Height, mm; negative for a dent.
   * @param radius Reach, mm.
   */
  function bump(skin: HumanAnatomy.ISkin, normal: Float64Array, v: number, h: number, radius: number): HumanAnatomy.ISkin {
    const c: HumanAnatomy.V3 = at(skin.P, v);
    const P: Float64Array = Float64Array.from(skin.P);

    for (let w: number = 0; w < P.length / 3; w++) {
      const r: number = distance(at(skin.P, w), c);

      if (r >= radius) continue;

      const lift: number = (h * (1 + Math.cos((Math.PI * r) / radius))) / 2;

      for (let a: number = 0; a < 3; a++) P[3 * w + a] += lift * normal[3 * w + a]!;
    }
    return { ...skin, P };
  }

  /**
   * A copy of a skin without the triangles whose three vertices all lie
   * within a radius of one vertex.
   *
   * @param skin The skin.
   * @param v The hole's centre vertex.
   * @param radius Hole radius, mm.
   */
  function hole(skin: HumanAnatomy.ISkin, v: number, radius: number): HumanAnatomy.ISkin {
    const c: HumanAnatomy.V3 = at(skin.P, v);
    const I: number[] = [];
    const tri: number[] = [];

    for (let t: number = 0; t < skin.I.length / 3; t++) {
      const inside: boolean = [0, 1, 2].every((k: number): boolean => distance(at(skin.P, skin.I[3 * t + k]!), c) < radius);

      if (inside) continue;
      I.push(skin.I[3 * t]!, skin.I[3 * t + 1]!, skin.I[3 * t + 2]!);
      tri.push(skin.tri[t]!);
    }
    return { ...skin, I: Uint32Array.from(I), tri: Int32Array.from(tri) };
  }

  /**
   * A copy of a skin with a closed axis-aligned cube added in front of a
   * point, wound outward: 6 faces of `size` squared, 8 vertices.
   *
   * @param skin The skin.
   * @param c The point the cube stands before.
   * @param ahead Distance from the point to the cube's centre along +X, mm.
   * @param size Edge, mm.
   */
  function cube(skin: HumanAnatomy.ISkin, c: HumanAnatomy.V3, ahead: number, size: number): HumanAnatomy.ISkin {
    const n: number = skin.P.length / 3;
    const h: number = size / 2;
    const corners: number[] = [];

    for (let k: number = 0; k < 8; k++)
      corners.push(c[0] + ahead + (k & 1 ? h : -h), c[1] + (k & 2 ? h : -h), c[2] + (k & 4 ? h : -h));

    // Two triangles per face, each wound counter-clockwise seen from outside.
    const faces: number[] = [0, 2, 3, 0, 3, 1, 4, 5, 7, 4, 7, 6, 0, 1, 5, 0, 5, 4, 2, 6, 7, 2, 7, 3, 0, 4, 6, 0, 6, 2, 1, 3, 7, 1, 7, 5];

    return {
      ...skin,
      P: Float64Array.from([...skin.P, ...corners]),
      I: Uint32Array.from([...skin.I, ...faces.map((k: number): number => n + k)]),
      tri: Int32Array.from([...skin.tri, ...new Array<number>(12).fill(skin.tri[0]!)]),
    };
  }

  /**
   * The median of the read (non-NaN) deviations.
   *
   * @param deviation Signed deviations, mm; NaN where unread.
   */
  function median(deviation: Float64Array): number {
    const read: number[] = Array.from(deviation)
      .filter((d: number): boolean => !Number.isNaN(d))
      .sort((a: number, b: number): number => a - b);

    return read[Math.floor(read.length / 2)]!;
  }

  /**
   * A vertex's position.
   *
   * @param P Flat positions, mm.
   * @param v Vertex index.
   */
  function at(P: Float64Array, v: number): HumanAnatomy.V3 {
    return [P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!];
  }

  /**
   * Euclidean distance.
   *
   * @param a A point, mm.
   * @param b A point, mm.
   */
  function distance(a: HumanAnatomy.V3, b: HumanAnatomy.V3): number {
    return Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  }
}
