import type { IAutoMovieMeshDeformationField } from "@automovie/interface";

import type { IPortraitSurfaceLayer } from "../../surface/structures/IPortraitSurfaceLayer";
import { IPortraitReliefRegion } from "./structures/IPortraitReliefRegion";

/**
 * Bind anatomical support envelopes to one final skin, with copied settings.
 * The engine owns the compact displacement kernel; this adapter owns attachment
 * identity and millimetre conversion. Neighbouring supports add before common
 * normals are recomputed, and the surface assembler protects open eye/mouth rims.
 * These envelopes model visible tissue relief, not separate internal organs.
 *
 * @evidence contracts/common.md#principled-implementation Each region becomes one engine deformation field centred at the live anchor position plus its offset, with radii and displacement converted from millimetres to metres; the engine owns the compact kernel and its Jacobian checks, and a zero displacement produces no field.
 * @evidence contracts/common.md#clear-and-simple-design An adapter that owns attachment identity and the unit conversion; the kernel is not duplicated.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No special case; invalid names, anchors and radii refuse.
 * @evidence contracts/common.md#meaningful-documentation States who owns the kernel, what the adapter owns and that the envelopes are visible relief.
 * @evidence contracts/modeling.md#spatial-conventions Millimetres in, engine metres out at the single division by 1000 in the field construction.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping A layer is a displacement field set, not a part or a group of parts.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits fields, not primitives; the engine's deformer moves existing vertices.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It constructs no surface; the assembler protects open rims.
 * @evidenceExclude contracts/modeling.md#rendered-observation It owns no displayed part.
 * @evidenceExclude contracts/anatomy.md#anatomical-source It carries no measurement: each region's amounts belong to the caller's document.
 * @evidenceExclude contracts/anatomy.md#permitted-range It refuses non-finite or non-positive dimensions but bounds no anatomical quantity.
 */
export function createPortraitReliefLayer(
  id: string,
  input: readonly IPortraitReliefRegion[],
): IPortraitSurfaceLayer {
  const regions = structuredClone(input);
  if (
    id.trim().length === 0 ||
    new Set(regions.map((r) => r.name)).size !== regions.length ||
    regions.some(
      (r) =>
        r.name.trim().length === 0 ||
        !Number.isInteger(r.anchor) ||
        r.anchor < 0 ||
        [r.offset, r.radius, r.displacement].some(
          (v) => v.length !== 3 || !v.every(Number.isFinite),
        ) ||
        r.radius.some((v) => v <= 0),
    )
  )
    throw new Error(
      "Anatomical relief needs named bindings, finite XYZ dimensions and positive radii.",
    );
  return {
    id,
    fields: (host) =>
      regions.flatMap((region): IAutoMovieMeshDeformationField[] => {
        const p = host.positions[region.anchor];
        if (p === undefined || p.length !== 3 || !p.every(Number.isFinite))
          throw new Error(
            "Anatomical relief needs a resident finite skin attachment.",
          );
        if (region.displacement.every((v) => v === 0)) return [];
        const center = p.map((v, i) => (v + region.offset[i]) / 1000);
        if (!center.every(Number.isFinite))
          throw new Error(
            "Anatomical relief centre exceeds its representable range.",
          );
        return [
          {
            center: { x: center[0], y: center[1], z: center[2] },
            radius: {
              x: region.radius[0] / 1000,
              y: region.radius[1] / 1000,
              z: region.radius[2] / 1000,
            },
            displacement: {
              x: region.displacement[0] / 1000,
              y: region.displacement[1] / 1000,
              z: region.displacement[2] / 1000,
            },
            stretch: { x: 0, y: 0, z: 0 },
          },
        ];
      }),
  };
}
