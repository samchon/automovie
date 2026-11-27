import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame } from "../AutoMovieArchetypeFrame";
import { AutoMovieArchetypeRefusal } from "../AutoMovieArchetypeRefusal";
import type { AutoMovieArchetypeSpan } from "../AutoMovieArchetypeSpan";

/**
 * Bind a model-space construction point to the part already built.
 *
 * @param archetype Producer identity used by a missing-part refusal.
 * @param parts Current builder parts, with unit-scale rigid transforms.
 * @param id The real part carrying the anchor.
 * @param point Construction point in model metres.
 * @returns A part-local span endpoint derived from that part frame.
 * @throws {AutoMovieArchetypeRefusal} For a missing carrier, nonfinite point or
 *   non-rigid frame.
 */
export function archetypeSpanAnchor(
  archetype: string,
  parts: readonly IAutoMovieModelPart[],
  id: string,
  point: IAutoMovieVector3,
): AutoMovieArchetypeSpan.End {
  const part: IAutoMovieModelPart | undefined = parts.find(
    (candidate: IAutoMovieModelPart): boolean => candidate.id === id,
  );
  if (part === undefined)
    throw new AutoMovieArchetypeRefusal({
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
    part.transform ?? AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 });
  const norm: number = Math.hypot(
    frame.rotation.x,
    frame.rotation.y,
    frame.rotation.z,
    frame.rotation.w,
  );
  if (
    ![frame.scale.x, frame.scale.y, frame.scale.z].every(
      (scale: number): boolean => scale === 1,
    ) ||
    !(Math.abs(norm - 1) <= 64 * Number.EPSILON)
  )
    throw new AutoMovieArchetypeRefusal({
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
  return { part: id, at: local };
}
