import type { IAutoMovieRenderTextureTarget } from "@automovie/engine";

/**
 * Compare allocation facts while leaving scope, phase and owner labels aside.
 * An identical retained native product already bounds the upcoming factory;
 * a changed representation, extent or attachment requires a separate planned
 * row. No storage is measured and no caller-owned target is changed here.
 */
export const matchesAutoMovieShadowTextureProfile = (
  actual: IAutoMovieRenderTextureTarget,
  planned: IAutoMovieRenderTextureTarget,
): boolean => actual.width === planned.width && actual.height === planned.height &&
  (actual.faces ?? 1) === planned.faces && actual.samples === planned.samples &&
  actual.mipmapped === planned.mipmapped && actual.depthBytesPerTexel === planned.depthBytesPerTexel &&
  actual.depthTexture === planned.depthTexture && actual.formats.length === planned.formats.length &&
  actual.formats.every((format, index) => format === planned.formats[index]);
