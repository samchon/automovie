import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";
import type { ArchetypeSpan } from "./ArchetypeSpan";

/**
 * Bind a model-space construction point to the actual part already built.
 *
 * @param archetype Producer identity used by a missing-part refusal.
 * @param parts Actual current builder parts, with unit-scale rigid transforms.
 * @param id The real part carrying the anchor.
 * @param point Construction point in model metres.
 * @returns A part-local span endpoint derived from that actual part frame.
 * @throws {ArchetypeRefusal} For a missing carrier, nonfinite point or non-rigid frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines construction versus part-local metres, actual builder ownership, rigid-frame premise and actionable refusal.
 * @evidence contracts/development/implementation.md#principled-implementation Invert the actual carrier's rigid transform once to store the point in its local coordinates; later span poses apply that same part's current transform.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Locate the actual part, admit its rigid data and invert its quaternion/translation on the supplied point.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No species proportions or independently reconstructed mesh frame supplies an attachment, and no missing part becomes a world-fixed endpoint.
 * @evidence contracts/development/implementation.md#efficient-algorithms One O(P) builder-part lookup and constant scalar/quaternion work return one point with O(1) extra storage.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the generating part frame and engine quaternion/vector operations instead of duplicating the producer's bar-frame formula.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns a new local point and retains no builder, part list, query cache or external resource.
 */
export function archetypeSpanAnchor(
  archetype: string,
  parts: readonly IAutoMovieModelPart[],
  id: string,
  point: IAutoMovieVector3,
): ArchetypeSpan.End {
  const part: IAutoMovieModelPart | undefined = parts.find(
    (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
  );
  if (part === undefined)
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "span.anchor",
      value: id,
      feasible: {
        kind: "alternatives",
        values: parts.map(
          (candidate: IAutoMovieModelPart): string => candidate.id,
        ),
      },
      reason: "the span's rigid carrier has not been built",
      fix: "name an existing carrier or build it before declaring the attachment",
    });
  const frame: IAutoMovieModelPart["transform"] =
    part.transform ?? ArchetypeFrame.upright({ x: 0, y: 0, z: 0 });
  const norm: number = Math.hypot(
    frame.rotation.x,
    frame.rotation.y,
    frame.rotation.z,
    frame.rotation.w,
  );
  if (
    ![
      point.x,
      point.y,
      point.z,
      frame.translation.x,
      frame.translation.y,
      frame.translation.z,
    ].every(Number.isFinite) ||
    ![frame.scale.x, frame.scale.y, frame.scale.z].every(
      (scale: number): boolean => scale === 1,
    ) ||
    !(Number.isFinite(norm) && Math.abs(norm - 1) <= 64 * Number.EPSILON)
  )
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "span.anchor",
      value: id,
      feasible: null,
      reason:
        "a span anchor requires an existing rigid part and a finite model-space point",
      fix: "build the actual carrier first and supply its model-space attachment point",
    });
  const local: IAutoMovieVector3 = Quaternion.rotateVector(
    Quaternion.inverse(frame.rotation),
    Vector3.subtract(point, frame.translation),
  );
  if (![local.x, local.y, local.z].every(Number.isFinite))
    throw new ArchetypeRefusal({
      kind: "parameter",
      archetype,
      axis: "span.anchor",
      value: point,
      feasible: null,
      reason: "the part-local span anchor is not finitely representable",
      fix: "supply a representable attachment point relative to its actual carrier",
    });
  return { part: id, at: local };
}
