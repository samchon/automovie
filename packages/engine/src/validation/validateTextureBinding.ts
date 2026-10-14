import { ViolationCollector } from "./ViolationCollector";
import { collectNonEmptyId } from "./collectNonEmptyId";

/**
 * Admit legacy nonblank asset ids or structured texCoord/color-space/transform/sampler bindings against the slot's expected decoding.
 *
 * @evidence contracts/common.md#principled-implementation Admit legacy nonblank asset ids or structured texCoord/color-space/transform/sampler bindings against the slot's expected decoding.
 * @evidence contracts/common.md#clear-and-simple-design One binding owner supplies consistent rules to every enumerated material slot.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts OnlyUV0 is supported; finite nonzero scale and closed sampler menus are explicit policies rather than loader guesses.
 * @evidence contracts/common.md#meaningful-documentation Unknown/null record shapes and precise transform/sampler fault paths are documented.
 * @evidence contracts/performance.md#efficient-algorithms Fixed structured fields and two vector axes take bounded work apart from asset/string diagnostics.
 * @evidence contracts/performance.md#reuse-equivalent-work finiteVector2 and enumValue share field admission, without caching mutable binding objects.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only caller-owned faults remain, with no image load, sampler handle or GPU texture acquired.
 */
export const validateTextureBinding: (
  binding: unknown,
  path: string,
  expectedColorSpace: "srgb" | "linear",
  collector: ViolationCollector,
) => void = (
  binding: unknown,
  path: string,
  expectedColorSpace: "srgb" | "linear",
  collector: ViolationCollector,
): void => {
  if (binding === undefined || binding === null) return;
  if (typeof binding === "string") {
    collectNonEmptyId(binding, path, "texture asset id", collector);
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
  const texture: Record<string, unknown> = binding as Record<string, unknown>;
  collectNonEmptyId(
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
  // An unknown source would otherwise pass as no claim at all, because
  // `validateTextureScale` measures only the two sources it can decide.
  if (texture.coordinateSource !== undefined)
    enumValue(
      texture.coordinateSource,
      ["surface-metres", "normalized", "source-uv"],
      `${path}.coordinateSource`,
      "coordinateSource",
      collector,
    );
  const transform: unknown = texture.transform;
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
      const record: Record<string, unknown> = transform as Record<
        string,
        unknown
      >;
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
  const sampler: unknown = texture.sampler;
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
      const record: Record<string, unknown> = sampler as Record<
        string,
        unknown
      >;
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

/**
 * Admit non-array object shape and finite x/y, optionally excluding zero scale components.
 *
 * One two-axis owner serves UV offset and scale.
 *
 * nonZero is the scale policy; finite signed offsets/scales otherwise remain authored.
 *
 * Object/axis paths and exact nonzero semantics are stated.
 *
 * Two numeric tests require bounded work plus diagnostics.
 *
 * Offset and scale reuse the same shape/finite logic.
 *
 * Only collector rows remain and no transform or sampler handle is retained.
 */
const finiteVector2: (
  value: unknown,
  path: string,
  label: string,
  collector: ViolationCollector,
  nonZero: boolean,
) => void = (
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
  const record: Record<string, unknown> = value as Record<string, unknown>;
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

/**
 * Require a string in the caller's fixed allowed coordinate/sampler menu.
 *
 * Field-specific vocabulary stays with the binding owner.
 *
 * Unknown values are reported rather than mapped to a default sampler.
 *
 * The diagnostic lists accepted names and preserves the actual value.
 *
 * A menu scan costs O(A) string comparisons; current menus have at most four choices.
 *
 * All closed sampler/coordinate fields reuse this predicate.
 *
 * Only collector faults remain; no loader/sampler resource is acquired.
 */
const enumValue: (
  value: unknown,
  allowed: readonly string[],
  path: string,
  label: string,
  collector: ViolationCollector,
) => void = (
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
