import type { IAutoMovieRenderTextureTarget } from "@automovie/engine";

/**
 * Compare allocation facts while leaving scope, phase and owner labels aside.
 * An identical retained native product already bounds the upcoming factory;
 * a changed representation, extent or attachment requires a separate planned
 * row. No storage is measured and no caller-owned target is changed here.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Avoids charging the same retained shadow product twice when its native factory facts are unchanged.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps changed factory products distinct from current retained attachment facts.
 */
export const matchesAutoMovieShadowTextureProfile = (
  actual: IAutoMovieRenderTextureTarget,
  planned: IAutoMovieRenderTextureTarget,
): boolean => actual.width === planned.width && actual.height === planned.height &&
  (actual.faces ?? 1) === planned.faces && actual.samples === planned.samples &&
  actual.mipmapped === planned.mipmapped && actual.depthBytesPerTexel === planned.depthBytesPerTexel &&
  actual.depthTexture === planned.depthTexture && actual.formats.length === planned.formats.length &&
  actual.formats.every((format, index) => format === planned.formats[index]);
