import type { IAutoMovieRenderBundleManifest } from "./IAutoMovieRenderBundleManifest";

/**
 * One discovered renderer-owned evidence bundle.
 *
 * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Exposes `IAutoMovieProductionRenderStatus` as the portable data boundary for the rendering lowering ownership requirement.
 * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `IAutoMovieProductionRenderStatus` for the spec render state isolation system contract.
 */
export interface IAutoMovieProductionRenderStatus {
  /**
   * Project-relative bundle manifest.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Exposes `path` as the portable data boundary for the rendering lowering ownership requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `path` for the spec render state isolation system contract.
   */
  path: string;

  /**
   * Whether the bundle matches current target-local inputs.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Exposes `current` as the portable data boundary for the rendering lowering ownership requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `current` for the spec render state isolation system contract.
   */
  current: boolean;

  /**
   * What this bundle was rendered for, verbatim from its own manifest, or
   * `null` when that manifest cannot be read.
   *
   * The path already spells the target, and spelling is not addressing: a
   * consumer had to parse a shot id out of a directory name and diff it against
   * the compile manifest by hand. Handing back the manifest's own target makes
   * the same question one comparison.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Exposes `target` as the portable data boundary for the rendering lowering ownership requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `target` for the spec render state isolation system contract.
   */
  target: IAutoMovieRenderBundleManifest["target"] | null;

  /**
   * Whether the design still carries the target this bundle was rendered for.
   *
   * `current` alone conflates two states a reader must separate. Measured on one
   * production, 42 render entries held 39 `current: false` — 38 of them
   * superseded renders of shots that still exist, which is the ordinary debris
   * of iteration, and **one** the render of a shot the design no longer carries,
   * which is the only row anybody should act on. Nothing on the entry told them
   * apart.
   *
   * False is a claim, so it is made only where ownership was actually resolved:
   * a target whose manifest could not be read, or whose kind this cannot
   * resolve, reports `true` rather than accusing a bundle of being unowned on a
   * failure to look. Deletion stays the reader's decision either way; this
   * surface says what is there, and never removes it.
   *
   * @evidence requirements/rendering/scene-lowering-and-runtime-state.md#rendering-lowering-ownership Exposes `owned` as the portable data boundary for the rendering lowering ownership requirement.
   * @evidence specifications/editorial-render-and-delivery/render-schedule-state-and-headless.md#spec-render-state-isolation Types `owned` for the spec render state isolation system contract.
   */
  owned: boolean;
}
