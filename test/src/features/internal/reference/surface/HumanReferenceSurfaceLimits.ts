import type { HumanAnatomy } from "../../HumanAnatomy";
import { HumanReference } from "../bodies/HumanReference";
import { HumanReferenceRawOrder } from "../bodies/HumanReferenceRawOrder";
import type { HumanReferenceSurface } from "./HumanReferenceSurface";
import { HumanReferenceSurfaceAlign } from "./HumanReferenceSurfaceAlign";
import { HumanReferenceSurfaceFloor } from "./HumanReferenceSurfaceFloor";
import { HumanReferenceSurfaceMesh } from "./HumanReferenceSurfaceMesh";
import { HumanReferenceSurfaceNaming } from "./HumanReferenceSurfaceNaming";
import { HumanReferenceSurfacePopulation } from "./HumanReferenceSurfacePopulation";

/**
 * The gross-defect limit at every vertex of a reference: how far a generated
 * skin may stand from it before the deviation exceeds what real bodies differ
 * by there. Nothing here reads a generated position, so a limit is never a
 * target to fit.
 *
 * Every other population body is scaled by this person's stature over its
 * own, and each of its segments (a region as named by
 * `HumanReferenceSurfaceNaming`, both ears whole) is moved onto this person's
 * same segment by the least-squares rigid motion of Horn 1987. Where a limb
 * happens to sit, which arm lengths and shoulder breadths change by
 * centimetres at the hand, then leaves the shape alone. The spread is the
 * sample standard deviation of the moved bodies' offsets along this person's
 * normal; the limit is 2.576 times it, the two-sided 99 % normal quantile, but
 * never under the region's published floor.
 *
 * - Body: every population body but this person.
 * - Head: a vertex all of whose triangles belong to the head part reads the
 *   four fitted heads only, this person's included, since the newer people
 *   carry one unfitted preset head whose spread is no population's.
 */
export namespace HumanReferenceSurfaceLimits {
  /** What one population body contributes to the moments of one vertex group. */
  interface IContribution {
    /** This person's body. */
    self: HumanReferenceSurfacePopulation.IBody;

    /** The other body whose offsets are read. */
    other: HumanReferenceSurfacePopulation.IBody;

    /** Welded vertices of one segment. */
    list: number[];

    /** Raw vertex of every welded vertex. */
    raw: Int32Array;

    /** This person's welded reference mesh. */
    mesh: HumanReference.IMesh;

    /** This person's outward vertex normals. */
    normal: Float64Array;
  }

  /** Running sums over the people of one population, per vertex. */
  interface IMoments {
    /** Sum of offsets, for the body population then the head population. */
    sum: Float64Array[];

    /** Sum of squared offsets, in the same order. */
    square: Float64Array[];
  }

  /**
   * Computes a reference's limits from the population, for each call.
   *
   * @param id Reference alias; it must be in the population.
   * @throws Error when the reference is not in the population or the four fitted heads are not all present.
   */
  export function build(id: string): HumanReferenceSurface.ILimits {
    const population: HumanReferenceSurfacePopulation.IPopulation = HumanReferenceSurfacePopulation.load();
    const self: HumanReferenceSurfacePopulation.IBody | undefined = population.bodies.find(
      (b: HumanReferenceSurfacePopulation.IBody): boolean => b.id === id,
    );

    if (self === undefined) throw new Error(`${id} is not in the reference population`);

    const mesh: HumanReference.IMesh = HumanReference.mesh(id);
    const raw: Int32Array = HumanReferenceRawOrder.get(id);
    const normal: Float64Array = HumanReferenceSurfaceMesh.vertexNormals(mesh.P, mesh.I);
    const head: Uint8Array = HumanReferenceSurfacePopulation.headOnly(mesh);
    const n: number = mesh.P.length / 3;

    const labels: HumanAnatomy.ISkin = HumanReference.skin(id);
    const naming: HumanReferenceSurfaceNaming = new HumanReferenceSurfaceNaming(labels.joints);
    const region: Int32Array = naming.label(mesh.P, mesh.I, labels.tri, labels.chains);

    const bodies: HumanReferenceSurfacePopulation.IBody[] = population.bodies.filter(
      (b: HumanReferenceSurfacePopulation.IBody): boolean => b !== self,
    );
    const heads: HumanReferenceSurfacePopulation.IBody[] = population.bodies.filter(
      (b: HumanReferenceSurfacePopulation.IBody): boolean => HumanReference.IDS.includes(b.id),
    );
    if (heads.length !== HumanReference.IDS.length)
      throw new Error(`the head population holds ${heads.length} of the ${HumanReference.IDS.length} fitted heads`);

    const moments: IMoments = { sum: [new Float64Array(n), new Float64Array(n)], square: [new Float64Array(n), new Float64Array(n)] };
    for (const list of segments(naming, region).values())
      for (const [k, people] of [bodies, heads].entries())
        for (const other of people) accumulate({ self, other, list, raw, mesh, normal }, moments, k);

    const floors: Float64Array = regionFloors(naming, region, mesh);
    const sigma: Float64Array = new Float64Array(n);
    const spread: Float64Array = new Float64Array(n);
    const limit: Float64Array = new Float64Array(n);
    for (let v: number = 0; v < n; v++) {
      const k: number = head[v] === 1 ? 1 : 0;
      const m: number = k === 1 ? heads.length : bodies.length;

      // The sample standard deviation from the running sums.
      sigma[v] = Math.sqrt(Math.max(0, (moments.square[k]![v]! - moments.sum[k]![v]! ** 2 / m) / (m - 1)));
      spread[v] = Math.max(HumanReferenceSurfaceFloor.FLOOR, HumanReferenceSurfaceFloor.QUANTILE * sigma[v]!);
      limit[v] = Math.max(spread[v]!, floors[v]!);
    }

    return {
      limit,
      spread,
      floor: floors,
      sigma,
      head,
      bodies: bodies.map((b: HumanReferenceSurfacePopulation.IBody): string => b.id),
      heads: heads.map((b: HumanReferenceSurfacePopulation.IBody): string => b.id),
      stature: self.stature,
    };
  }

  /**
   * The vertices of every segment that aligns as one piece. Small parts align
   * with their neighbours: an ear is one piece, not its helix alone.
   *
   * @param naming The names given to the reference's regions.
   * @param region The region index of every vertex.
   * @returns The vertices of each segment, by segment name.
   */
  function segments(naming: HumanReferenceSurfaceNaming, region: Int32Array): Map<string, number[]> {
    const pieces: Map<string, number[]> = new Map();

    for (let v: number = 0; v < region.length; v++) {
      const key: string = naming.names[region[v]!]!.replace(/^(left|right) ear .*$/, "$1 ear");
      const list: number[] | undefined = pieces.get(key);
      if (list === undefined) pieces.set(key, [v]);
      else list.push(v);
    }

    return pieces;
  }

  /**
   * Adds one other body's offsets along this person's normals over one
   * segment: the body is scaled to this stature and aligned to this segment
   * before it is read.
   *
   * @param input The body, the segment and this person's mesh.
   * @param moments The sums to add to.
   * @param k Which population the body is read for: 0 the bodies, 1 the heads.
   */
  function accumulate(input: IContribution, moments: IMoments, k: number): void {
    const { self, other, list, raw, mesh, normal }: IContribution = input;
    const s: number = self.stature / other.stature;
    const at: (v: number, a: number) => number = (v: number, a: number): number => s * other.P[3 * raw[v]! + a]!;
    const motion: [number[], number[]] = HumanReferenceSurfaceAlign.rigid(
      list,
      at,
      (v: number, a: number): number => mesh.P[3 * v + a]!,
    );
    const R: number[] = motion[0];
    const t: number[] = motion[1];

    for (const v of list) {
      let o: number = 0;
      for (let a: number = 0; a < 3; a++) {
        const moved: number = R[3 * a]! * at(v, 0) + R[3 * a + 1]! * at(v, 1) + R[3 * a + 2]! * at(v, 2) + t[a]!;
        o += normal[3 * v + a]! * (moved - mesh.P[3 * v + a]!);
      }
      moments.sum[k]![v] += o;
      moments.square[k]![v] += o * o;
    }
  }

  /**
   * The published floor of every vertex's region. A vertex no chain labels
   * takes the largest floor among its labelled neighbours, spread over the
   * mesh's edges, and the ISO floor where no neighbour is labelled.
   *
   * @param naming The names given to the reference's regions.
   * @param region The region index of every vertex.
   * @param mesh The welded reference mesh.
   */
  function regionFloors(
    naming: HumanReferenceSurfaceNaming,
    region: Int32Array,
    mesh: HumanReference.IMesh,
  ): Float64Array {
    const n: number = region.length;
    const byRegion: number[] = naming.names.map(
      (name: string): number => HumanReferenceSurfaceFloor.floor(name).value,
    );
    const unassigned: number = naming.names.indexOf("unassigned");
    const floors: Float64Array = new Float64Array(n);
    for (let v: number = 0; v < n; v++) floors[v] = region[v] === unassigned ? NaN : byRegion[region[v]!]!;

    for (let pass: number = 0; pass < 64 && floors.some((f: number): boolean => Number.isNaN(f)); pass++) {
      const next: Float64Array = Float64Array.from(floors);

      for (let t: number = 0; t < mesh.I.length; t += 3)
        for (let k: number = 0; k < 3; k++) {
          const a: number = mesh.I[t + k]!;
          const b: number = mesh.I[t + ((k + 1) % 3)]!;
          if (Number.isNaN(floors[a]!) && !Number.isNaN(floors[b]!))
            next[a] = Math.max(Number.isNaN(next[a]!) ? 0 : next[a]!, floors[b]!);
          if (Number.isNaN(floors[b]!) && !Number.isNaN(floors[a]!))
            next[b] = Math.max(Number.isNaN(next[b]!) ? 0 : next[b]!, floors[a]!);
        }
      floors.set(next);
    }

    for (let v: number = 0; v < n; v++) if (Number.isNaN(floors[v]!)) floors[v] = HumanReferenceSurfaceFloor.FLOOR;

    return floors;
  }
}
