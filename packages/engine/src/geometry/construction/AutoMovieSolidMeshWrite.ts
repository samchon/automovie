import type { AutoMovieSolidMesh } from "./AutoMovieSolidMesh";
import { AutoMovieSolidVector } from "./AutoMovieSolidVector";
import type { IAutoMovieSolidSurface } from "./IAutoMovieSolidSurface";

/** World-space millimetre vector. */
type Vec3 = AutoMovieSolidVector.Vec3;

/** Existing vector arithmetic, with its original evaluation order. */
const { cross, dot, norm, sub }: typeof AutoMovieSolidVector =
  AutoMovieSolidVector;

/**
 * Final mesh buffer writes and analytic orientation readings.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States ownership, registration by name and the difference between known chart orientation and a sampled whole-population reference.
 * @evidence contracts/development/design.md#principled-representation Represents Final mesh buffer writes and analytic orientation readings: companion namespace of 6 members (`owner`, `vertex`, `emit`, `normal`, `facing`, `outward`); units and frames named in its text: world, local, frame. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `AutoMovieSolidMeshWrite` in packages/engine/src/geometry/construction/AutoMovieSolidMeshWrite.ts; its surface is the 6 members listed and the text shows 4 other files naming it, mostly packages/engine (3), packages/human (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace AutoMovieSolidMeshWrite {
  /**
   * Register the first surface with this unique name, retaining its evaluator.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Preserves the unique-name owner index and reads the surface's actual Point0 when supplied, otherwise its existing jet point; a true tip need not pretend to carry physical2.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and conditional append own registration.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Equal names are an input ownership premise; this function does not prove two same-named surfaces are equivalent or freeze their callbacks.
   * @evidence contracts/development/common.md#meaningful-documentation Names the retained surface closure and unique-name premise; optional Point0 is authoritative, and its errors propagate without a jet fallback.
   * @evidence contracts/development/implementation.md#efficient-algorithms Scans R existing owners in O(R), appending one fixed record only when absent.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Later vertices use the existing owner index for that name.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The mesh owns the new closure and transitively retains its surface until the mesh is released.
   */
  export function owner(
    mesh: AutoMovieSolidMesh.IMesh,
    surface: IAutoMovieSolidSurface,
  ): number {
    const known: number = mesh.owners.findIndex(
      (o: AutoMovieSolidMesh.IOwner): boolean => o.name === surface.name,
    );
    if (known >= 0) return known;
    mesh.owners.push({
      name: surface.name,
      point: (a: number, b: number): Vec3 => {
        const read: IAutoMovieSolidSurface["point"] = surface.point;
        return read === undefined
          ? surface.jet(a, b).p
          : read.call(surface, a, b);
      },
    });
    return mesh.owners.length - 1;
  }

  /**
   * Append one already evaluated point and its declared owner coordinates.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Copies three world components and an owner/u/v triple into parallel flat buffers without a positional search.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One append returns the next mesh index.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Caller admission owns finiteness and matching chart semantics; this low-level writer neither normalizes coordinates nor welds an existing index.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes evaluated world-mm data from owner-local chart coordinates.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant amortized append work per vertex.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Appends the provided point once, with no surface reevaluation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The mesh owns six appended numbers; the borrowed point vector is not retained.
   */
  export function vertex(
    mesh: AutoMovieSolidMesh.IMesh,
    p: Readonly<Vec3>,
    owner: number,
    a: number,
    b: number,
  ): number {
    mesh.positions.push(p[0], p[1], p[2]);
    mesh.coordinates.push(owner, a, b);
    return mesh.positions.length / 3 - 1;
  }

  /**
   * Append a consistently oriented population with one declared turning decision.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Uses a known chart sign directly, or the largest triangle's normal against its own requested reference normal, to turn the whole population together.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One decision precedes a linear index append; no triangle-specific normal repair is performed.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Consistent population winding and a meaningful reference remain caller premises. known requires a numeric sign; zero-area geometry is not repaired into an outward surface.
   * @evidence contracts/development/common.md#meaningful-documentation States the two sign modes and the whole-population orientation premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms Known sign uses O(T) emission; reference mode first scans T triangles for the largest normal and rereads that triangle for its final comparison.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One flip applies to every emitted triangle; supplied point buffers are reused without source evaluation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Only appended indices persist in mesh; normal vectors and the reference callback are call-local.
   */
  export function emit(
    mesh: AutoMovieSolidMesh.IMesh,
    triangles: readonly [number, number, number][],
    sign: number | ((t: number) => Vec3),
    known: boolean = false,
  ): void {
    let flip: boolean;
    if (known || typeof sign === "number") flip = (sign as number) < 0;
    else {
      let best: number = -1;
      let size: number = 0;
      triangles.forEach(
        (triangle: readonly [number, number, number], index: number): void => {
          const n: number = norm(normal(mesh, triangle));
          if (n > size) {
            size = n;
            best = index;
          }
        },
      );
      flip = best >= 0 && dot(normal(mesh, triangles[best]!), sign(best)) < 0;
    }
    for (const triangle of triangles) {
      const [a, b, c]: [number, number, number] = triangle;
      mesh.indices.push(...(flip ? [a, c, b] : [a, b, c]));
    }
  }

  /**
   * Read one unnormalised chord-triangle normal from positions only.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Crosses two edges from the same first vertex with the existing vector arithmetic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A single position-only reading supports reference orientation and the Human bridge's buffer view.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Does not require owner/chart arrays or claim a chord normal is the generating surface's analytic normal.
   * @evidence contracts/development/common.md#meaningful-documentation States the unnormalised result and position-only input use.
   * @evidence contracts/development/implementation.md#efficient-algorithms Fixed-size position reads, differences and cross product.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work This pure constant-size reading retains no source evaluation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector and retains no mesh reference.
   */
  export function normal(
    mesh: Pick<AutoMovieSolidMesh.IMesh, "positions">,
    triangle: readonly [number, number, number],
  ): Vec3 {
    const point: (index: number) => Vec3 = (index: number): Vec3 => [
      mesh.positions[3 * index]!,
      mesh.positions[3 * index + 1]!,
      mesh.positions[3 * index + 2]!,
    ];
    return cross(
      sub(point(triangle[1]), point(triangle[0])),
      sub(point(triangle[2]), point(triangle[0])),
    );
  }

  /**
   * Sum unit outward normals at corners already expressed on this same face.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Reads analytic surface normals at each supplied corner's u/v and sums their nonzero unit directions, preserving the existing pole-zero contribution rule.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reference reading serves closure populations whose corner coordinates belong to the requested face.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Coordinates must belong to this surface; a foreign-owner seam index is not proof of that premise. Native face triangulation uses its explicit ILoop.chart and chart orientation instead.
   * @evidence contracts/development/common.md#meaningful-documentation Names the same-face coordinate premise and zero-normal behavior.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three surface jets and fixed-size vector work per triangle.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Uses existing chart coordinates rather than solving a closest point or inferring a frame from emitted triangles.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one fresh vector and retains no mesh, surface or callback after the call.
   */
  export function facing(
    mesh: AutoMovieSolidMesh.IMesh,
    surface: IAutoMovieSolidSurface,
    triangle: readonly [number, number, number],
  ): Vec3 {
    const result: Vec3 = [0, 0, 0];
    for (const vertex of triangle) {
      const out: Vec3 = outward(
        surface,
        mesh.coordinates[3 * vertex + 1]!,
        mesh.coordinates[3 * vertex + 2]!,
      );
      const length: number = norm(out);
      if (length > 0)
        for (let k: number = 0; k < 3; k++)
          result[k] = result[k]! + out[k]! / length;
    }
    return result;
  }

  /**
   * Read the surface's declared outward analytic normal at its own chart point.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Multiplies the chart tangent cross product by the surface's explicit orientation sign.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One jet and one sign determine the unnormalised outward vector.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Makes no tube-axis or storage-origin inference and does not repair a singular/nonfinite chart jet.
   * @evidence contracts/development/common.md#meaningful-documentation Distinguishes analytic normal from the chord-triangle reference and leaves source regularity with its producer.
   * @evidence contracts/development/implementation.md#efficient-algorithms One surface jet plus constant vector arithmetic.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work One pure chart query has no cross-request work to share here.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh vector; no surface callback is retained by this reading.
   */
  export function outward(
    surface: IAutoMovieSolidSurface,
    u: number,
    v: number,
  ): Vec3 {
    const jet: IAutoMovieSolidSurface.IJet = surface.jet(u, v);
    const value: Vec3 = cross(jet.u, jet.v);
    return [
      value[0] * surface.orientation,
      value[1] * surface.orientation,
      value[2] * surface.orientation,
    ];
  }
}
