import type { IAutoMovieMesh, IAutoMovieVector3 } from "@automovie/interface";

import { interpolateAutoMovieTrianglePoint } from "../math/interpolateAutoMovieTrianglePoint";
import { boundAutoMovieConvexSeparation } from "./boundAutoMovieConvexSeparation";
import { boundAutoMovieProjectionSeparation } from "./boundAutoMovieProjectionSeparation";
import { boundAutoMovieTriangleAttachmentContact } from "./boundAutoMovieTriangleAttachmentContact";
import type { IAutoMovieMeshAttachmentCap } from "./IAutoMovieMeshAttachmentCap";
import type { IAutoMovieMeshSeparationOptions } from "./IAutoMovieMeshSeparationOptions";
import type { IAutoMovieMeshSeparationResult } from "./IAutoMovieMeshSeparationResult";
import { buildAutoMovieMeshQueryHierarchy } from "./buildAutoMovieMeshQueryHierarchy";
import { triangleIndicesOf } from "./triangleIndicesOf";

interface Triangle {
  id: number;
  vertices: IAutoMovieVector3[];
  reference: IAutoMovieVector3[];
  low: number[];
  high: number[];
  centre: number[];
}
type Node = ReturnType<typeof buildAutoMovieMeshQueryHierarchy<Triangle>>;

/**
 * Compile an owned resident surface for conservative whole-feature separation.
 * Open sheets, disconnected components and degenerate filled triangles are
 * admitted: unsigned separation needs no winding, cap, or volume assertion.
 * Source topology and original triangle ordinals survive the owned BVH sort.
 * Changing source positions or indices requires recompiling this snapshot.
 * Scalar attachmentCaps report possible root-registration contact regions and
 * do not label another part of the fan as an accepted crossing.
 * An attachment result reports lowerBound zero: certification is the combined
 * bounded-contact/strict-other-face proof, not positive global separation.
 *
 * A query supplies a nonempty finite XYZ vertex run in the same metre frame,
 * a nonnegative requested clearance and a mutable shared work budget. At zero,
 * strict positive separation is required: touching is never accepted by zero.
 * Its convex hull is measured against every resident filled triangle. A box
 * is skipped only when a conservatively enclosed support projection already
 * proves the requested separation. Remaining triangles use the same support
 * owner and edge-pair kernel. This is not ray sampling or a nearest-corner test.
 *
 * At positive clearance lowerBound is capped at clearance. certified means the complete feature has
 * at least that separation; false means unproved, including touches, crossings
 * and rounding at an exact limit. It does not diagnose penetration or select
 * a closest point. triangle is the original limiting triangle ordinal, or -1
 * when no individual triangle lowered the returned target-capped proof bound
 * (including proofs that tested leaf triangles). Tie ordinals are stable.
 * At zero clearance MIN_VALUE is the weak first-positive proof bound, not an
 * estimate of nearest distance; finding a stronger scalar is unnecessary.
 * Without attachment metadata a root-touching fan remains unproved. At zero
 * clearance an explicit canonical barycentric attachment may instead prove its
 * complete fan contact on original incident supports through a bounded contact
 * cap. Every other resident triangle still requires strict positive separation.
 * A single zero-distance witness never exempts the rest of a fan.
 *
 * representation chooses source binary64 or its exact Float32 buffer preimage;
 * both snapshots retain the same original binary64 reference for canonical seat
 * validation. Float32 attachment roots must equal the rounded original seat,
 * not a newly interpolated or corrected point on the rounded support.
 *
 * Each visited box, including its up-to-three coordinate bounds, spends one
 * unit. Each tested triangle, normal triple, feature projection axis and edge
 * pair spends another unit before its work. Exhaustion and malformed counts
 * refuse by name; the caller owns the
 * already spent count and must not reset it during refinement. A failed query
 * has no accepted geometry or hidden retry. Input and result vectors never
 * expose the compiled snapshot. Whole-row and free-span fitting can consume
 * this operation in the same current collider frame.
 *
 * @evidence requirements/asset-authoring/geometry.md#asset-composable-geometry-operations Supplies budgeted conservative whole-feature separation for composable resident geometry without a catalogue or sampled-corner substitute.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-geometry-operations-topology Snapshots original triangle identity and represented coordinates and qualifies complete-feature clearance without inventing a volume for open sheets.
 * @author Samchon
 */
export function createAutoMovieMeshSeparationQuery(
  mesh: IAutoMovieMesh,
  representation: "source" | "float32" = "source",
): (
  vertices: readonly IAutoMovieVector3[],
  options: IAutoMovieMeshSeparationOptions,
) => IAutoMovieMeshSeparationResult {
  if (representation !== "source" && representation !== "float32")
    throw new Error("Mesh separation needs source or float32 representation.");
  const indices = triangleIndicesOf(mesh, "Mesh separation");
  if (
    indices.length === 0 ||
    !Array.from(mesh.positions).every(Number.isFinite)
  )
    throw new Error(
      "Mesh separation requires a nonempty finite resident surface.",
    );
  const triangles: Triangle[] = [];
  for (let at = 0; at < indices.length; at += 3) {
    const reference = indices.slice(at, at + 3).map((id) => ({
      x: mesh.positions[3 * id],
      y: mesh.positions[3 * id + 1],
      z: mesh.positions[3 * id + 2],
    }));
    const vertices = reference.map((p) =>
      representation === "float32"
        ? { x: Math.fround(p.x), y: Math.fround(p.y), z: Math.fround(p.z) }
        : { ...p },
    );
    if (
      !Array.from(vertices).every(
        (p) =>
          p !== undefined &&
          p !== null &&
          [p.x, p.y, p.z].every(Number.isFinite),
      )
    )
      throw new Error(
        "Mesh separation needs finite represented resident vertices.",
      );
    const low = ["x", "y", "z"].map((axis) =>
      Math.min(...vertices.map((p) => p[axis as "x" | "y" | "z"])),
    );
    const high = ["x", "y", "z"].map((axis) =>
      Math.max(...vertices.map((p) => p[axis as "x" | "y" | "z"])),
    );
    triangles.push({
      id: at / 3,
      vertices,
      reference,
      low,
      high,
      centre: low.map((v, axis) => v / 2 + high[axis] / 2),
    });
  }
  const byId = new Map(triangles.map((t) => [t.id, t]));
  const root = buildAutoMovieMeshQueryHierarchy(triangles);
  return (vertices, options) => {
    if (
      vertices.length < 1 ||
      !Array.from(vertices).every(
        (p) =>
          p !== undefined &&
          p !== null &&
          [p.x, p.y, p.z].every(Number.isFinite),
      )
    )
      throw new Error(
        "Mesh separation needs a nonempty finite query vertex run.",
      );
    const clearance = options?.clearance;
    if (
      options === undefined ||
      options === null ||
      !(clearance >= 0) ||
      !Number.isFinite(clearance)
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
    const sufficient =
      clearance === 0 ? Number.MIN_VALUE : clearance;
    let lowerBound = sufficient,
      triangle = -1,
      examined = 0;
    const spend = (): void => {
      if (options.budget.remaining === 0)
        throw new Error(
          "Mesh separation exhausted its shared geometry budget.",
        );
      options.budget.remaining--;
      examined++;
    };
    const allowed = new Set<number>();
    const attachmentCaps: IAutoMovieMeshAttachmentCap[] = [];
    if (options.attachment !== undefined) {
      const metadata = options.attachment;
      if (
        metadata === null ||
        clearance !== 0 ||
        vertices.length !== 3 ||
        !Number.isSafeInteger(metadata.triangle) ||
        !Array.isArray(metadata.weights) ||
        !Array.isArray(metadata.supports) ||
        metadata.supports.length === 0 ||
        !metadata.supports.includes(metadata.triangle)
      )
        throw new Error(
          "Mesh attachment requires canonical source triangle, weights and complete support metadata at zero clearance.",
        );
      const primary = byId.get(metadata.triangle);
      if (primary === undefined)
        throw new Error("Mesh attachment source triangle is not resident.");
      spend();
      const seated = interpolateAutoMovieTrianglePoint(
        primary.reference,
        metadata.weights,
      );
      const expected =
        representation === "float32"
          ? {
              x: Math.fround(seated.x),
              y: Math.fround(seated.y),
              z: Math.fround(seated.z),
            }
          : seated;
      if (
        !["x", "y", "z"].every(
          (axis) =>
            vertices[0][axis as "x" | "y" | "z"] ===
            expected[axis as "x" | "y" | "z"],
        )
      )
        throw new Error(
          "Mesh attachment root differs from its canonical source seat representation.",
        );
      const support = primary.reference.filter(
        (_, at) => metadata.weights[at] > 0,
      );
      for (const id of metadata.supports) {
        const host = byId.get(id);
        if (
          !Number.isSafeInteger(id) ||
          host === undefined ||
          !support.every((p) =>
            host.reference.some(
              (v) => p.x === v.x && p.y === v.y && p.z === v.z,
            ),
          )
        )
          throw new Error(
            "Mesh attachment support is not incident on its original sampler feature.",
          );
        spend();
        const proof = boundAutoMovieTriangleAttachmentContact(
          vertices,
          host.vertices,
        );
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
    const visit = (node: Node): void => {
      spend();
      const corners = [node.low, node.high].map((p) => ({
        x: p[0],
        y: p[1],
        z: p[2],
      }));
      for (const axis of ["x", "y", "z"] as const) {
        const direction = { x: 0, y: 0, z: 0 };
        direction[axis] = 1;
        // Along a coordinate axis the two opposite corners give the complete
        // box's extrema; no diagonal segment is substituted for the box.
        const gap = boundAutoMovieProjectionSeparation(
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
          const bound = boundAutoMovieConvexSeparation(
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
}
