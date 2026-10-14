import type { IAutoMovieRenderTextureTarget } from "@automovie/engine";

/**
 * Compare allocation facts while leaving scope, phase and owner labels aside. An identical retained native product already bounds the upcoming factory; a changed representation, extent or attachment requires a separate planned row. No storage is measured and no caller-owned target is changed here.
 *
 * @evidence contracts/common.md#principled-implementation Compares the retained native target's allocation facts against an explicit planned profile, treating an omitted actual face count as one and preserving ordered format equality.
 * @evidence contracts/common.md#clear-and-simple-design Representation comparison stays separate from light scope labels, profile planning, byte estimates and actual texture allocation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Matching current facts do not measure physical native storage, and the supported planner supplies an explicit planned face count rather than relying on omitted planned metadata.
 * @evidence contracts/common.md#meaningful-documentation Documentation identifies allocation-only comparison, excluded owner labels and no target mutation or native measurement.
 * @evidence contracts/performance.md#efficient-algorithms Fixed scalar checks precede an F-format scan, giving O(F) time and no array copy or retained comparison state.
 * @evidence contracts/performance.md#reuse-equivalent-work Only matching representation, extent, attachments and formats permit the retained row to cover the planned factory; equal owner text alone is ignored.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Both metadata rows are borrowed and this read creates no target, attachment, texture or ownership record.
 */
export const matchesAutoMovieShadowTextureProfile: (actual: IAutoMovieRenderTextureTarget, planned: IAutoMovieRenderTextureTarget) => boolean = (
  actual: IAutoMovieRenderTextureTarget,
  planned: IAutoMovieRenderTextureTarget,
): boolean => actual.width === planned.width && actual.height === planned.height &&
  (actual.faces ?? 1) === planned.faces && actual.samples === planned.samples &&
  actual.mipmapped === planned.mipmapped && actual.depthBytesPerTexel === planned.depthBytesPerTexel &&
  actual.depthTexture === planned.depthTexture && actual.formats.length === planned.formats.length &&
  actual.formats.every((format: IAutoMovieRenderTextureTarget["formats"][number], index: number): boolean => format === planned.formats[index]);
