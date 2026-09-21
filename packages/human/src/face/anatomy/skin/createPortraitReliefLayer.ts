import type { IAutoMovieMeshDeformationField } from "@automovie/interface";
import type { IPortraitSurfaceLayer } from "../../surface/structures/IPortraitSurfaceLayer";
import { IPortraitReliefRegion } from "./structures/IPortraitReliefRegion";

/**
 * Bind anatomical support envelopes to one final skin, with copied settings.
 * The engine owns the compact displacement kernel; this adapter owns attachment
 * identity and millimetre conversion. Neighbouring supports add before common
 * normals are recomputed, and the surface assembler protects open eye/mouth rims.
 * These envelopes model visible tissue relief, not separate internal organs.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-anatomical-components Adds explicitly authored tissue supports while leaving their connected skin and boundary masking with the assembler.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-components Copies named regions, resolves live anchors and converts nonzero compact displacement fields from millimetres to engine metres.
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
