import {
  AutoMovieTextureCoordinateSource,
  IAutoMovieMaterial,
  IAutoMovieModel,
  IAutoMovieModelPart,
  IAutoMovieTextureReference,
  IAutoMovieValidation,
} from "@automovie/interface";

import { ViolationCollector } from "./ViolationCollector";
import { materialTextureSlots } from "./materialTextureSlots";

/** Absolute slack for normalized UV spans and relative multiplier slack for surface-metre tile comparisons. */
const SCALE_EPSILON: number = 1e-9;

/**
 * Measure mesh UV bounding spans, reject normalized spans over1+1e-9 and warn when repeating surface-metre tile size exceeds the span.
 *
 * @author Samchon
 * @evidence contracts/common.md#principled-implementation Measure mesh UV bounding spans, reject normalized spans over1+1e-9 and warn when repeating surface-metre tile size exceeds the span.
 * @evidence contracts/common.md#clear-and-simple-design materialTextureSlots enumerates bindings and surfaceSpan reads UVs; each model indexes material ids once.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Primitives, absent/degenerate UVs, legacy ids, omitted/source-uv coordinates and clamped axes are intentionally exempt.
 * @evidence contracts/common.md#meaningful-documentation Relative tile slack and normalized absolute1e-9 slack, error/warning distinction and slot paths are explicit.
 * @evidence contracts/performance.md#efficient-algorithms V UV values plus material/part/slot populations drive linear scans and map lookup, with per-part span computation.
 * @evidence contracts/performance.md#reuse-equivalent-work Each part's UV span serves all bindings and each model's id map serves all parts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only diagnostics escape; UVs/materials are borrowed and no world-space fit, UV rewrite or texture resource is acquired.
 */
export const validateTextureScale: (props: {
  models: readonly IAutoMovieModel[];
}) => IAutoMovieValidation = (props: {
  /** Borrowed current models whose resident mesh UVs and named material bindings supply scale meaning. */
  models: readonly IAutoMovieModel[];
}): IAutoMovieValidation => {
  const out: ViolationCollector = new ViolationCollector();
  props.models.forEach((model: IAutoMovieModel, modelIndex: number): void => {
    const materials: Map<string, IAutoMovieMaterial> = new Map(
      model.materials.map(
        (material: IAutoMovieMaterial): [string, IAutoMovieMaterial] => [
          material.id,
          material,
        ],
      ),
    );
    model.parts.forEach(
      (part: IAutoMovieModelPart, partIndex: number): void => {
        const span: { u: number; v: number } | null = surfaceSpan(part);
        if (span === null) return;
        if (part.material === null) return;
        const material: IAutoMovieMaterial | undefined = materials.get(
          part.material,
        );
        if (material === undefined) return;
        for (const { path: slot, binding } of materialTextureSlots(material)) {
          if (typeof binding === "string") continue;
          checkBinding({
            binding,
            slot: slot.slice(1),
            span,
            part,
            material,
            path: `$input.models[${modelIndex}].parts[${partIndex}]`,
            out,
          });
        }
      },
    );
  });
  return out.toValidation();
};

/**
 * Fold finite resident mesh UV pairs into positive U/V bounding spans.
 *
 * UV coordinates are measured directly rather than inferred from world dimensions.
 *
 * Primitive/missing/degenerate/nonfinite UVs return null, and trailing unmatched scalars are left to mesh admission.
 *
 * Output spans are coordinate units, not geometric metres by themselves.
 *
 * V UV scalars cost O(V) arithmetic and constant min/max state.
 *
 * The coordinator computes one span per part for all its bindings.
 *
 * Only two scalars return; UV buffers remain borrowed.
 */
const surfaceSpan: (
  part: IAutoMovieModelPart,
) => { u: number; v: number } | null = (
  part: IAutoMovieModelPart,
): { u: number; v: number } | null => {
  if (part.geometry.type !== "mesh") return null;
  const uvs: number[] | null = part.geometry.mesh.uvs;
  if (uvs === null || uvs.length < 2) return null;
  let minU: number = Infinity;
  let maxU: number = -Infinity;
  let minV: number = Infinity;
  let maxV: number = -Infinity;
  for (let i: number = 0; i + 1 < uvs.length; i += 2) {
    const u: number = uvs[i]!;
    const v: number = uvs[i + 1]!;
    if (!Number.isFinite(u) || !Number.isFinite(v)) return null;
    minU = Math.min(minU, u);
    maxU = Math.max(maxU, u);
    minV = Math.min(minV, v);
    maxV = Math.max(maxV, v);
  }
  const u: number = maxU - minU;
  const v: number = maxV - minV;
  return u > 0 && v > 0 ? { u, v } : null;
};

/**
 * Reject excessive normalized spans or warn when1/abs(scale) exceeds a surface-metre span unless clamped.
 *
 * Two fixed axes carry their own scale/wrap and exact slot path.
 *
 * Omitted/source-uv coordinates are exempt; invalid scale admission belongs to validateTextureBinding.
 *
 * Normalized1e-9 slack, relative tile slack and warning/error distinction are stated.
 *
 * Two axes use constant arithmetic and diagnostic text work.
 *
 * Both axes share the measured part span and existing material/slot identity.
 *
 * Only caller-owned diagnostics remain; no UV rewrite or texture resource is acquired.
 */
const checkBinding: (props: {
  binding: IAutoMovieTextureReference;
  slot: string;
  span: { u: number; v: number };
  part: IAutoMovieModelPart;
  material: IAutoMovieMaterial;
  path: string;
  out: ViolationCollector;
}) => void = (props: {
  binding: IAutoMovieTextureReference;

  /** The slot's path under the material, such as `overlays[0].baseColorTexture`. */
  slot: string;
  span: { u: number; v: number };
  part: IAutoMovieModelPart;
  material: IAutoMovieMaterial;
  path: string;
  out: ViolationCollector;
}): void => {
  const source: AutoMovieTextureCoordinateSource | undefined =
    props.binding.coordinateSource;
  if (source === undefined || source === "source-uv") return;
  const axes: (
    | {
        name: "u";
        span: number;
        scale: number | undefined;
        wrap: "clamp" | "repeat" | "mirror" | undefined;
      }
    | {
        name: "v";
        span: number;
        scale: number | undefined;
        wrap: "clamp" | "repeat" | "mirror" | undefined;
      }
  )[] = [
    {
      name: "u" as const,
      span: props.span.u,
      scale: props.binding.transform?.scale.x,
      wrap: props.binding.sampler?.wrapS,
    },
    {
      name: "v" as const,
      span: props.span.v,
      scale: props.binding.transform?.scale.y,
      wrap: props.binding.sampler?.wrapT,
    },
  ];
  for (const axis of axes) {
    const path: string = `${props.path}.material.${props.slot}.${axis.name}`;
    if (source === "normalized") {
      // A declared normalized set covers its surface exactly once, so a span
      // past one is the declaration disagreeing with the geometry rather than a
      // scale anyone chose. Reported without the transform, because the
      // contradiction is in the set itself.
      if (axis.span > 1 + SCALE_EPSILON)
        props.out.push(
          "type",
          path,
          `part "${props.part.id}" spans ${axis.span} in ${axis.name} but material "${props.material.id}" declares "normalized" texture coordinates on ${props.slot}; a normalized set covers its surface exactly once, so declare "surface-metres" or normalize the set`,
          axis.span,
          axis.span - 1,
        );
      continue;
    }
    // "surface-metres": the span is the surface's own extent and 1 / scale is
    // the tile the finish claims, so the two are directly comparable metres.
    if (axis.scale === undefined) continue;
    if (!Number.isFinite(axis.scale) || axis.scale === 0) continue;
    if (axis.wrap === "clamp") continue;
    const tile: number = 1 / Math.abs(axis.scale);
    if (tile <= axis.span * (1 + SCALE_EPSILON)) continue;
    props.out.warn(
      "range",
      path,
      `part "${props.part.id}" spans ${axis.span} m in ${axis.name} but material "${props.material.id}" implies a tile of ${tile} m on ${props.slot}; the surface cannot show one whole turn of a repeating image, so state the tile the surface can carry or clamp the axis to declare a deliberate fit`,
      tile,
      tile - axis.span,
    );
  }
};
