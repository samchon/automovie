import { IAutoMovieAssetConsumer } from "./IAutoMovieAssetConsumer";

/**
 * One reasoned asset use by a live consumer in a production namespace. Shared assets repeat uses for each production that consumes them.
 *
 * @evidence contracts/common.md#principled-implementation Inventory requires nonblank production/id/reason text, then resolves graph-owned consumers for the selected production; foreign production uses are not joined against this graph. Audio, design-reference, texture and scene-environment cases defer existence/reverse binding to their compiled gates, so a locally accepted use is not proof every consumer already exists.
 * @evidence contracts/common.md#clear-and-simple-design The use owns namespace, consumer and purpose, leaving path and byte digest on the enclosing asset so shared productions do not duplicate asset provenance.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A prose reason alone cannot manufacture an asset consumer, and one production's use does not silently authorize another namespace.
 * @evidence contracts/common.md#meaningful-documentation States namespace ownership, repeated uses for shared assets, the typed address and the nonblank explanation justifying that production's bytes.
 * @author Samchon
 */
export interface IAutoMovieAssetUse {
  /** Exact production id; project-global assets repeat uses when shared. */
  production: string;

  /** Typed, addressable consumer inside that production. */
  consumer: IAutoMovieAssetConsumer;

  /** Why this production needs the asset. */
  reason: string;
}
