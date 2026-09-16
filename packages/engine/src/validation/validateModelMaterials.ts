/**
 * Material leaf checks called in validateModel's declared slot order.
 * Texture bindings may be absent, legacy asset IDs or explicit UV0 records;
 * the slot supplies its required colour space. Coordinates and sampler
 * declarations are checked before rendering, without fetching image bytes.
 * Texture rotations use degrees, scale must be nonzero, colour components
 * are normalized and optical scalar minima come from the owning caller.
 * Inputs remain unchanged; only the supplied diagnostic collector is appended.
 * Changing these predicates changes model and static face export admission.
 */
import type { IAutoMovieColor } from "@automovie/interface";

import { validateNonEmptyId } from "./validateModelMetadata";
import { ViolationCollector } from "./violation";

/**
 * Admits a material slot's UV0, colour-space, transform and sampler relations without fetching resources.
 * @evidence requirements/asset-authoring/materials-and-textures.md#asset-texture-coordinates-scale Checks the slot's required colour space, UV0 selection, finite transform and declared sampler modes before drawing.
 * @evidence specifications/asset-and-representation/model-geometry-and-surface-facts.md#asset-spec-material-texture-relations Checks the slot's required colour space, UV0 selection, finite transform and declared sampler modes before drawing.
 */
export const validateTextureBinding = (
  binding: unknown,
  path: string,
  expectedColorSpace: "srgb" | "linear",
  collector: ViolationCollector,
): void => {
  if (binding === undefined || binding === null) return;
  if (typeof binding === "string") {
    validateNonEmptyId(binding, path, "texture asset id", collector);
    return;
  }
  if (typeof binding !== "object" || Array.isArray(binding)) {
    collector.push(
      "type",
      path,
      "texture binding must be an asset id, texture reference object, or null",
      binding,
    );
    return;
  }
  const texture = binding as Record<string, unknown>;
  validateNonEmptyId(
    texture.asset,
    `${path}.asset`,
    "texture asset id",
    collector,
  );
  if (texture.texCoord !== 0)
    collector.push(
      "range",
      `${path}.texCoord`,
      "a surface carries one coordinate set; a packed atlas and a second set are a decided exclusion, so only UV set 0 exists to select",
      texture.texCoord,
    );
  if (texture.colorSpace !== expectedColorSpace)
    collector.push(
      "type",
      `${path}.colorSpace`,
      `this texture slot requires ${expectedColorSpace} color space`,
      texture.colorSpace,
    );
  const transform = texture.transform;
  if (transform !== undefined) {
    if (
      typeof transform !== "object" ||
      transform === null ||
      Array.isArray(transform)
    )
      collector.push(
        "type",
        `${path}.transform`,
        "texture transform must be an object",
        transform,
      );
    else {
      const record = transform as Record<string, unknown>;
      finiteVector2(
        record.offset,
        `${path}.transform.offset`,
        "texture offset",
        collector,
        false,
      );
      finiteVector2(
        record.scale,
        `${path}.transform.scale`,
        "texture scale",
        collector,
        true,
      );
      if (
        typeof record.rotationDeg !== "number" ||
        !Number.isFinite(record.rotationDeg)
      )
        collector.push(
          "range",
          `${path}.transform.rotationDeg`,
          "texture rotation must be finite degrees",
          record.rotationDeg,
        );
    }
  }
  const sampler = texture.sampler;
  if (sampler !== undefined) {
    if (
      typeof sampler !== "object" ||
      sampler === null ||
      Array.isArray(sampler)
    )
      collector.push(
        "type",
        `${path}.sampler`,
        "texture sampler must be an object",
        sampler,
      );
    else {
      const record = sampler as Record<string, unknown>;
      enumValue(
        record.wrapS,
        ["clamp", "repeat", "mirror"],
        `${path}.sampler.wrapS`,
        "wrapS",
        collector,
      );
      enumValue(
        record.wrapT,
        ["clamp", "repeat", "mirror"],
        `${path}.sampler.wrapT`,
        "wrapT",
        collector,
      );
      enumValue(
        record.minFilter,
        ["nearest", "linear", "nearestMipmapLinear", "linearMipmapLinear"],
        `${path}.sampler.minFilter`,
        "minFilter",
        collector,
      );
      enumValue(
        record.magFilter,
        ["nearest", "linear"],
        `${path}.sampler.magFilter`,
        "magFilter",
        collector,
      );
    }
  }
};

const finiteVector2 = (
  value: unknown,
  path: string,
  label: string,
  collector: ViolationCollector,
  nonZero: boolean,
): void => {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    collector.push("type", path, `${label} must be an object`, value);
    return;
  }
  const record = value as Record<string, unknown>;
  for (const axis of ["x", "y"] as const)
    if (
      typeof record[axis] !== "number" ||
      !Number.isFinite(record[axis]) ||
      (nonZero && record[axis] === 0)
    )
      collector.push(
        "range",
        `${path}.${axis}`,
        `${label} ${axis} must be finite${nonZero ? " and non-zero" : ""}`,
        record[axis],
      );
};

const enumValue = (
  value: unknown,
  allowed: readonly string[],
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (typeof value !== "string" || !allowed.includes(value))
    collector.push(
      "type",
      path,
      `${label} must be one of ${allowed.join(", ")}`,
      value,
    );
};

/**
 * Reports a nonfinite or below-minimum optical material scalar at the caller's exact path.
 * @evidence requirements/asset-authoring/validation.md#asset-surface-validation Admits finite optical material values against their caller-owned IOR or thickness lower bound.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-surface-visual Admits finite optical material values against their caller-owned IOR or thickness lower bound.
 */
export const finiteMinimum = (
  value: number,
  minimum: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isFinite(value) || value < minimum)
    collector.push(
      "range",
      path,
      `${label} must be finite and >= ${minimum}`,
      value,
    );
};

/**
 * Reports nonfinite material scalars without imposing an unrelated sign restriction.
 * @evidence requirements/asset-authoring/validation.md#asset-surface-validation Checks normal-map scale finiteness without disallowing the signed values the material contract permits.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-surface-visual Checks normal-map scale finiteness without disallowing the signed values the material contract permits.
 */
export const finiteNumber = (
  value: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isFinite(value))
    collector.push("range", path, `${label} must be finite`, value);
};

/**
 * Reports normalized colour-range and optional hexadecimal-label violations on model materials.
 * @evidence requirements/asset-authoring/validation.md#asset-surface-validation Checks bounded RGB/optional alpha and the independent optional hexadecimal colour label.
 * @evidence specifications/asset-and-representation/fidelity-and-validation.md#asset-spec-validation-surface-visual Checks bounded RGB/optional alpha and the independent optional hexadecimal colour label.
 */
export const validateColor = (
  color: IAutoMovieColor,
  path: string,
  collector: ViolationCollector,
): void => {
  for (const ch of ["r", "g", "b"] as const)
    collector.range(`${path}.${ch}`, color[ch], 0, 1, ch);
  if (color.a !== null) collector.range(`${path}.a`, color.a, 0, 1, "a");
  if (color.hex !== null && !HEX_COLOR_PATTERN.test(color.hex))
    collector.push(
      "type",
      `${path}.hex`,
      `hex must be null or a #RRGGBB color label, but was "${color.hex}"`,
      color.hex,
    );
};

const HEX_COLOR_PATTERN = /^#[0-9A-Fa-f]{6}$/;
