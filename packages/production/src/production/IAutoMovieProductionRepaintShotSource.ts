import { IAutoMovieRenderBundleManifest } from "@automovie/interface";

/**
 * Groups a verified render manifest address, bundle identity, manifest and selected structural/beauty frame metadata for the exact current shot source.
 *
 * @evidence contracts/common.md#principled-implementation Groups a verified render manifest address, bundle identity, manifest and selected structural/beauty frame metadata for the exact current shot source.
 * @evidence contracts/common.md#clear-and-simple-design The selected source metadata has one discovery/currentness/provider boundary; resident byte reads remain with project readers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts This structural shape introduces no runtime branch, provider substitution or fixture-specific behavior; runtime facts are admitted by its stated producer/consumer boundaries.
 * @evidence contracts/common.md#meaningful-documentation Only frame metadata escapes discovery; actual source bytes are read later at provider dispatch and retained by that call.
 * @evidence contracts/performance.md#efficient-algorithms This structural type erases at runtime; productionRepaintServiceCurrentShotSource checks the current compile/runtime/frame metadata contract and excludes incomplete control grids; this type does not decode images.
 * @evidence contracts/performance.md#reuse-equivalent-work This erased shape shares the same admitted facts across its stated consumers; it creates no result cache or runtime equivalence/invalidation shortcut.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Only frame metadata escapes discovery; actual source bytes are read later at provider dispatch and retained by that call.
 */
export interface IAutoMovieProductionRepaintShotSource {
  /** Addresses the verified resident render manifest used for currentness rechecks. */
  manifestPath: string;

  /** Names the portable deterministic render bundle containing selected source frames. */
  bundle: string;

  /** Carries the verified manifest metadata retained for source identity and provider controls. */
  manifest: IAutoMovieRenderBundleManifest;

  /** Carries selected beauty/control frame metadata; source bytes are read separately at dispatch. */
  frames: IAutoMovieRenderBundleManifest["frames"];
}
