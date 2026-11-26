import type {
  AutoMovieTextureBinding,
  IAutoMovieViolationCollector,
} from "@automovie/interface";

/**
 * Admit a structured texture binding's coordinate set, color space and
 * transform scale against the slot's expected decoding. A legacy asset id
 * string carries none of those and is left alone.
 */
export function validateTextureBinding(
  binding: AutoMovieTextureBinding | null | undefined,
  path: string,
  expectedColorSpace: "srgb" | "linear",
  collector: IAutoMovieViolationCollector,
): void {
  if (binding === undefined || binding === null || typeof binding === "string")
    return;
  if (binding.texCoord !== 0)
    collector.push(
      "range",
      `${path}.texCoord`,
      "a surface carries one coordinate set; a packed atlas and a second set are a decided exclusion, so only UV set 0 exists to select",
      binding.texCoord,
    );
  if (binding.colorSpace !== expectedColorSpace)
    collector.push(
      "type",
      `${path}.colorSpace`,
      `this texture slot requires ${expectedColorSpace} color space`,
      binding.colorSpace,
    );
  if (binding.transform !== undefined)
    for (const axis of ["x", "y"] as const)
      if (binding.transform.scale[axis] === 0)
        collector.push(
          "range",
          `${path}.transform.scale.${axis}`,
          `texture scale ${axis} must be non-zero`,
          binding.transform.scale[axis],
        );
}
