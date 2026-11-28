import type {
  IAutoMovieMesh,
  IAutoMovieMeshAttachmentCap,
  IAutoMovieMeshQueryHierarchy,
  IAutoMovieMeshSeparationAttachment,
  IAutoMovieMeshSeparationOptions,
  IAutoMovieMeshSeparationQuery,
  IAutoMovieMeshSeparationResult,
  IAutoMovieMeshSeparationVerdict,
  IAutoMovieTriangleAttachmentContactBound,
  IAutoMovieVector3,
} from "@automovie/interface";

import { interpolateTrianglePoint } from "../../math/internal/interpolateTrianglePoint";
import { boundConvexSeparation } from "./boundConvexSeparation";
import { boundProjectionSeparation } from "./boundProjectionSeparation";
import { boundTriangleAttachmentContact } from "./boundTriangleAttachmentContact";
import { buildMeshQueryHierarchy } from "./buildMeshQueryHierarchy";
import { triangleIndicesOf } from "./triangleIndicesOf";

/*
 * Compile a resident surface into a conservative whole-feature separation
 * query.
 *
 * The mesh is snapshotted, so changing its positions or indices later needs a
 * new query. Open sheets, disconnected components and degenerate triangles are
 * admitted, since unsigned separation needs no winding, closure or volume.
 * `representation` chooses whether the snapshot measures the source binary64
 * coordinates or their Float32 roundings, the buffer an exporter will write;
 * both keep the binary64 coordinates as the reference for attachment seats.
 * Original triangle ordinals survive the hierarchy's reordering.
 *
 * A call takes a feature, a nonempty finite XYZ vertex run in the same metre
 * frame measured as its convex hull, a nonnegative requested clearance and a
 * caller-owned work budget. It bounds the feature's separation from every
 * resident triangle: a hierarchy box is skipped only when an enclosed axis
 * projection already proves the requested clearance, and every remaining
 * triangle is bounded by `boundConvexSeparation`. This is neither ray
 * sampling nor a nearest-corner test. `certified` means the complete feature is
 * at least the clearance away, and at zero clearance strictly positive; false
 * means unproved, including touches, crossings and rounding at an exact limit,
 * and neither diagnoses penetration nor selects a closest point. `lowerBound`
 * is capped at the clearance, or is the smallest positive double at zero
 * clearance, which is a proof threshold rather than a distance estimate;
 * `triangle` is the original ordinal of the triangle that lowered it below that
 * cap, the lowest on ties, or -1 when none did.
 *
 * At zero clearance, a three-vertex fan may carry attachment metadata: its
 * root's canonical barycentric seat on a source triangle and the original
 * triangles incident to that seat. The root must equal that seat exactly, in
 * the snapshot's representation, and each support must contain the seat's
 * supporting corners. Each support must then bound the whole fan's contact
 * through `boundTriangleAttachmentContact`, reported as an
 * `attachmentCaps` entry, and every other triangle still needs strict positive
 * separation. Such a result reports `lowerBound` zero, because certification is
 * that combined proof and not positive separation. Without metadata a fan
 * touching its root is simply unproved.
 *
 * Compilation throws for a malformed or empty index buffer, a nonfinite
 * position or an unrepresentable Float32 coordinate. Every
 * visited box, with its up to three axis projections, spends one budget unit,
 * and every tested support, triangle, normal triple, projection axis and edge
 * pair spends one more before its work. Exhaustion and malformed input throw by
 * name; the caller owns the spent count and must not reset it during
 * refinement. A failed call accepts no geometry and retries nothing. The
 * returned query's `separated` runs the same walk and stops at the first
 * triangle whose bound falls below the target; since the running bound only
 * falls, its decision equals the full measurement's and it never spends more.
 * Parameter mesh: Resident surface, snapshotted.
 * Parameter representation: Coordinates the snapshot measures.
 * Returns: The compiled query.
 */
export function createMeshSeparationQuery(
  mesh: IAutoMovieMesh,
  representation: "source" | "float32" = "source",
): IAutoMovieMeshSeparationQuery {
  const indices: number[] = triangleIndicesOf(mesh, "Mesh separation");
  if (indices.length === 0)
    throw new Error(
      "Mesh separation requires a nonempty finite resident surface.",
    );
  for (const value of mesh.positions)
    if (!Number.isFinite(value))
      throw new Error(
        "Mesh separation needs finite represented resident vertices.",
      );
  const represent = (p: IAutoMovieVector3): IAutoMovieVector3 =>
    representation === "float32"
      ? { x: Math.fround(p.x), y: Math.fround(p.y), z: Math.fround(p.z) }
      : { ...p };
  const triangles: IResidentTriangle[] = [];
  for (let at: number = 0; at < indices.length; at += 3) {
    // A loop, not a callback, so the query's closure never captures `mesh`.
    const reference: IAutoMovieVector3[] = [];
    for (const id of indices.slice(at, at + 3))
      reference.push({
        x: mesh.positions[3 * id]!,
        y: mesh.positions[3 * id + 1]!,
        z: mesh.positions[3 * id + 2]!,
      });
    const vertices: IAutoMovieVector3[] = reference.map(represent);
    // Float32 rounding of a finite binary64 coordinate can overflow.
    if (representation === "float32" && !vertices.every(finiteVertex))
      throw new Error(
        "Mesh separation needs finite represented resident vertices.",
      );
    const low: number[] = AXES.map((axis: "x" | "y" | "z"): number =>
      Math.min(vertices[0]![axis], vertices[1]![axis], vertices[2]![axis]),
    );
    const high: number[] = AXES.map((axis: "x" | "y" | "z"): number =>
      Math.max(vertices[0]![axis], vertices[1]![axis], vertices[2]![axis]),
    );
    triangles.push({
      id: at / 3,
      vertices,
      reference,
      low,
      high,
      centre: low.map(
        (value: number, axis: number): number => value / 2 + high[axis]! / 2,
      ),
    });
  }
  const byId: Map<number, IResidentTriangle> = new Map(
    triangles.map((t: IResidentTriangle): [number, IResidentTriangle] => [
      t.id,
      t,
    ]),
  );
  const root: IAutoMovieMeshQueryHierarchy<IResidentTriangle> =
    buildMeshQueryHierarchy(triangles);
  // One walk serves both operations; `refute` only ends it once the decision
  // is settled, so the two never compute certification differently.
  const walk = (
    vertices: readonly IAutoMovieVector3[],
    options: IAutoMovieMeshSeparationOptions,
    refute: boolean,
  ): IAutoMovieMeshSeparationResult => {
    let finiteRun: boolean = vertices.length >= 1;
    for (let index: number = 0; finiteRun && index < vertices.length; index++)
      finiteRun = finiteVertex(vertices[index]);
    if (!finiteRun)
      throw new Error(
        "Mesh separation needs a nonempty finite query vertex run.",
      );
    const clearance: number | undefined = options?.clearance;
    if (
      options === undefined ||
      options === null ||
      clearance === undefined ||
      !Number.isFinite(clearance) ||
      clearance < 0
    )
      throw new Error(
        "Mesh separation needs a nonnegative finite requested clearance.",
      );
    if (
      options.budget === undefined ||
      options.budget === null ||
      !Number.isSafeInteger(options.budget.remaining) ||
      options.budget.remaining < 0
    )
      throw new Error(
        "Mesh separation needs a nonnegative safe-integer shared budget.",
      );
    // Any positive represented lower bound suffices for strict-zero admission.
    // MIN_VALUE is the first such value, not a spatial tolerance or gap reduction.
    const sufficient: number = clearance === 0 ? Number.MIN_VALUE : clearance;
    let lowerBound: number = sufficient;
    let triangle: number = -1;
    let examined: number = 0;
    const spend = (): void => {
      if (options.budget.remaining === 0)
        throw new Error(
          "Mesh separation exhausted its shared geometry budget.",
        );
      options.budget.remaining--;
      examined++;
    };
    const allowed: Set<number> = new Set();
    const attachmentCaps: IAutoMovieMeshAttachmentCap[] = [];
    if (options.attachment !== undefined) {
      const metadata: IAutoMovieMeshSeparationAttachment = options.attachment;
      if (
        clearance !== 0 ||
        vertices.length !== 3 ||
        metadata.supports.length === 0 ||
        !metadata.supports.includes(metadata.triangle)
      )
        throw new Error(
          "Mesh attachment requires canonical source triangle, weights and complete support metadata at zero clearance.",
        );
      const primary: IResidentTriangle | undefined = byId.get(
        metadata.triangle,
      );
      if (primary === undefined)
        throw new Error("Mesh attachment source triangle is not resident.");
      spend();
      const expected: IAutoMovieVector3 = represent(
        interpolateTrianglePoint(primary.reference, metadata.weights),
      );
      const root: IAutoMovieVector3 = vertices[0]!;
      if (
        root.x !== expected.x ||
        root.y !== expected.y ||
        root.z !== expected.z
      )
        throw new Error(
          "Mesh attachment root differs from its canonical source seat representation.",
        );
      const support: IAutoMovieVector3[] = primary.reference.filter(
        (_corner: IAutoMovieVector3, at: number): boolean =>
          metadata.weights[at]! > 0,
      );
      for (const id of metadata.supports) {
        const host: IResidentTriangle | undefined = byId.get(id);
        if (
          host === undefined ||
          !support.every((p: IAutoMovieVector3): boolean =>
            host.reference.some(
              (v: IAutoMovieVector3): boolean =>
                p.x === v.x && p.y === v.y && p.z === v.z,
            ),
          )
        )
          throw new Error(
            "Mesh attachment support is not incident on its original sampler feature.",
          );
        spend();
        const proof: IAutoMovieTriangleAttachmentContactBound =
          boundTriangleAttachmentContact(vertices, host.vertices);
        if (!proof.proved)
          return {
            certified: false,
            lowerBound: 0,
            triangle: id,
            examined,
            attachmentCaps,
          };
        allowed.add(id);
        attachmentCaps.push({ triangle: id, cap: proof.cap });
      }
    }
    const visit = (
      node: IAutoMovieMeshQueryHierarchy<IResidentTriangle>,
    ): void => {
      if (refute && lowerBound < sufficient) return;
      spend();
      // Along a coordinate axis the two opposite corners give the complete
      // box's extrema; no diagonal segment is substituted for the box.
      const corners: IAutoMovieVector3[] = [node.low, node.high].map(
        (p: number[]): IAutoMovieVector3 => ({ x: p[0]!, y: p[1]!, z: p[2]! }),
      );
      for (const direction of UNIT_AXES) {
        const gap: number = boundProjectionSeparation(
          vertices,
          corners,
          direction,
        );
        // lowerBound starts at the target and only decreases. A box that
        // already proves the captured target cannot lower that global minimum.
        if (gap > 0 && gap >= clearance) return;
      }
      if ("triangles" in node) {
        for (const t of node.triangles) {
          if (allowed.has(t.id)) continue;
          spend();
          const bound: number = boundConvexSeparation(
            vertices,
            t.vertices,
            sufficient,
            spend,
          );
          if (
            bound < lowerBound ||
            (bound === lowerBound && triangle !== -1 && t.id < triangle)
          ) {
            lowerBound = bound;
            triangle = t.id;
            if (refute && lowerBound < sufficient) return;
          }
        }
      } else {
        visit(node.left);
        visit(node.right);
      }
    };
    visit(root);
    return {
      certified: lowerBound > 0 && lowerBound >= clearance,
      lowerBound: options.attachment === undefined ? lowerBound : 0,
      triangle,
      examined,
      attachmentCaps,
    };
  };
  return Object.assign(
    (
      vertices: readonly IAutoMovieVector3[],
      options: IAutoMovieMeshSeparationOptions,
    ): IAutoMovieMeshSeparationResult => walk(vertices, options, false),
    {
      separated: (
        vertices: readonly IAutoMovieVector3[],
        options: IAutoMovieMeshSeparationOptions,
      ): IAutoMovieMeshSeparationVerdict => {
        const result: IAutoMovieMeshSeparationResult = walk(
          vertices,
          options,
          true,
        );
        return {
          certified: result.certified,
          witness: result.certified ? -1 : result.triangle,
        };
      },
    },
  );
}

/*
 * One resident triangle in the snapshot.
 */
interface IResidentTriangle extends IAutoMovieMeshQueryHierarchy.IEntry {
  /*
   * Original triangle ordinal.
   */
  id: number;

  /*
   * Corners in the measured representation.
   */
  vertices: IAutoMovieVector3[];

  /*
   * Corners as binary64 source coordinates, for attachment seats.
   */
  reference: IAutoMovieVector3[];
}

/*
 * The three coordinate names in XYZ order.
 */
const AXES: readonly ("x" | "y" | "z")[] = ["x", "y", "z"];

/*
 * The three unit coordinate directions box pruning projects along.
 */
const UNIT_AXES: readonly IAutoMovieVector3[] = [
  { x: 1, y: 0, z: 0 },
  { x: 0, y: 1, z: 0 },
  { x: 0, y: 0, z: 1 },
];

/*
 * Whether a run slot holds a vector with three finite coordinates.
 */
const finiteVertex = (p: IAutoMovieVector3 | undefined | null): boolean =>
  p !== undefined &&
  p !== null &&
  Number.isFinite(p.x) &&
  Number.isFinite(p.y) &&
  Number.isFinite(p.z);
