/**
 * Structured identity of the host repaint implementation.
 *
 * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `IAutoMovieRepaintRuntimeIdentity` as the portable data boundary for the repaint reference roles requirement.
 * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `IAutoMovieRepaintRuntimeIdentity` for the asset spec repaint controls references system contract.
 */
export interface IAutoMovieRepaintRuntimeIdentity {
  /**
   * Identity protocol.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `protocolVersion` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `protocolVersion` for the asset spec repaint controls references system contract.
   */
  protocolVersion: "automovie.repaint-runtime.v1";
  /**
   * Adapter/provider family.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `provider` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `provider` for the asset spec repaint controls references system contract.
   */
  provider: string;
  /**
   * Exact model id.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `model` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `model` for the asset spec repaint controls references system contract.
   */
  model: string;
  /**
   * Exact model or deployment version.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `version` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `version` for the asset spec repaint controls references system contract.
   */
  version: string;
  /**
   * Local, API, or another explicit execution boundary.
   *
   * @evidence requirements/repaint/source-frames-and-reference-locking.md#repaint-reference-roles Exposes `execution` as the portable data boundary for the repaint reference roles requirement.
   * @evidence specifications/asset-and-representation/generated-assets-and-repaint-handoff.md#asset-spec-repaint-controls-references Types `execution` for the asset spec repaint controls references system contract.
   */
  execution: "local" | "api" | "other";
}
