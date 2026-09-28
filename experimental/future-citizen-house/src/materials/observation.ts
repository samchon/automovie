/** Texture measurement of the exact native models returned by buildHouse.
 * The engine owns the comparison; this census only reports the axes it can
 * inspect. No UV, material, geometry, or warning is rewritten here. Metres
 * belong to surface-metres bindings; normalized and source-uv retain their
 * own meanings. The build and viewer share this one result. */
import { validateTextureScale } from "@automovie/engine";
import type { IAutoMovieModel, IAutoMovieValidation } from "@automovie/interface";

const slots = ["baseColorTexture", "metallicRoughnessTexture", "normalTexture", "occlusionTexture", "emissiveTexture"] as const;
type Axis = { path: string; model: string; part: string; slot: typeof slots[number]; axis: "u" | "v"; status: "checked" | "clamped" | "unverified"; reason: string };
export type MaterialTextureScaleAudit = {
  validation: IAutoMovieValidation;
  models: number;
  parts: number;
  partsWithoutTexture: number;
  axes: Axis[];
};

/** Report native comparison coverage in model/part/slot/U,V order. */
export function auditMaterialTextureScale(input: { models: readonly IAutoMovieModel[] }): MaterialTextureScaleAudit {
  const validation = validateTextureScale(input);
  const axes: Axis[] = [];
  let parts = 0, partsWithoutTexture = 0;
  for (const [mi, model] of input.models.entries()) for (const [pi, part] of model.parts.entries()) {
    parts++;
    const material = model.materials.find(entry => entry.id === part.material);
    const bindings = slots.flatMap(slot => material?.[slot] ? [{ slot, binding: material[slot]! }] : []);
    if (!bindings.length) partsWithoutTexture++;
    for (const { slot, binding } of bindings) for (const [offset, axis] of [[0, "u"], [1, "v"]] as const) {
      let status: Axis["status"] = "unverified", reason = "primitive";
      if (part.geometry.type === "mesh") {
        const uv = part.geometry.mesh.uvs;
        reason = "missing-uv";
        if (uv?.length) {
          let min = Infinity, max = -Infinity;
          for (let i = offset; i < uv.length; i += 2) { min = Math.min(min, uv[i]!); max = Math.max(max, uv[i]!); }
          const span = max - min;
          reason = "invalid-or-degenerate-uv";
          if (uv.every(Number.isFinite) && Number.isFinite(span) && span > 0) {
            reason = "string-binding";
            if (typeof binding !== "string") {
              reason = "missing-coordinate-source";
              if (binding.coordinateSource === "source-uv") reason = "source-uv";
              else if (binding.coordinateSource === "normalized") { status = "checked"; reason = "normalized-span"; }
              else if (binding.coordinateSource === "surface-metres") {
                const scale = binding.transform?.scale?.[axis === "u" ? "x" : "y"];
                reason = "invalid-or-missing-scale";
                if (scale !== undefined && Number.isFinite(scale) && scale !== 0) {
                  const wrap = binding.sampler?.[axis === "u" ? "wrapS" : "wrapT"];
                  status = wrap === "clamp" ? "clamped" : "checked";
                  reason = wrap === "clamp" ? "clamp-fit" : "surface-metres-tile";
                }
              }
            }
          }
        }
      }
      axes.push({ path: `$input.models[${mi}].parts[${pi}].material.${slot}.${axis}`, model: model.id, part: part.id, slot, axis, status, reason });
    }
  }
  return { validation, models: input.models.length, parts, partsWithoutTexture, axes };
}
