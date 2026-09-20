/**
 * Stable, serializable diffusion controls stored in the receipt.
 *
 * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `IAutoMovieRepaintParameters` as the portable data boundary for the repaint reference roles requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `IAutoMovieRepaintParameters` for the asset spec repaint controls references system contract.
 */
export interface IAutoMovieRepaintParameters {
  /**
   * Non-blank positive prompt.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `prompt` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `prompt` for the asset spec repaint controls references system contract.
   */
  prompt: string;

  /**
   * Optional negative prompt.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `negativePrompt` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `negativePrompt` for the asset spec repaint controls references system contract.
   */
  negativePrompt?: string;

  /**
   * Explicit deterministic request seed.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `seed` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `seed` for the asset spec repaint controls references system contract.
   */
  seed: number;

  /**
   * Finite structural-preservation strength in [0, 1].
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `strength` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `strength` for the asset spec repaint controls references system contract.
   */
  strength: number;

  /**
   * Additional adapter-defined scalar controls.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `controls` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `controls` for the asset spec repaint controls references system contract.
   */
  controls?: Record<string, string | number | boolean>;
}
