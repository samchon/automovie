import { IAutoMovieGeneratedCollisionProxy, IAutoMovieGeneratedMeasurementProxy, IAutoMovieModel } from "@automovie/interface";

/**
 * Adopted external appearance, byte closure and explicit collision/measurement facts selected for one recipe.
 *
 * @evidence contracts/common.md#principled-implementation Asset inventory joins digest-matched profile/LOD/weighted-rig inspections and explicit finite-positive proxies before materialization and population radius selection consume this binding.
 * @evidence contracts/common.md#clear-and-simple-design Appearance/rig metadata, collision semantics and declared measurement envelope stay together without conflating the two proxy roles.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Measurement admission does not prove mesh agreement, root centering or humanoid depth. A binding is a selected subresult, not an error-free verdict over the entire ledger.
 * @evidence contracts/common.md#meaningful-documentation Members identify final asset/LOD/byte closure, ingest bone mapping, collision primitive and the separate population envelope consumer.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The interface erases; inspection, recipe joins, copying and radius computation remain their actual owners' costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The same build's binding feeds model materialization and population radius composition; later bytes or declarations require a new inventory.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The build retains scalar/LOD/closure/bone/proxy populations until its runtime models and radius table are released, with input-sized metadata and no resource manager in this type.
 *
 * @author Samchon
 */
export interface IAutoMovieExternalModelRuntimeBinding {
  /**
   * Manifest-owned final render asset.
   */
  asset: string;

  /**
   * Fixed normalization profile proved by ingest.
   */
  profile: NonNullable<IAutoMovieModel["imported"]>["profile"];

  /**
   * Exact model LOD identities retained for host selection.
   */
  lod: NonNullable<IAutoMovieModel["imported"]>["lod"];

  /**
   * Selected model, sidecar and proxy path/digest closure observed by this inventory; the entries are not cryptographic signatures or immutable records.
   */
  assets: NonNullable<IAutoMovieModel["imported"]>["assets"];

  /**
   * Ingest/VRM-owned normalized bone mapping.
   */
  humanoidBones: NonNullable<IAutoMovieModel["imported"]>["humanoidBones"];

  /**
   * Exact collision primitive used by engine geometry and mass queries.
   */
  collision: IAutoMovieGeneratedCollisionProxy;

  /**
   * Envelope used by productionProjectionRadii for population selection.
   */
  measurement: IAutoMovieGeneratedMeasurementProxy;
}
