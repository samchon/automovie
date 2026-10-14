import type { IAutoMovieHumanBodyAnatomicalAssembly } from "@automovie/human/body/anatomy/assembly/IAutoMovieHumanBodyAnatomicalAssembly";
import type * as THREE from "three";

import type { HumanResidentPort } from "../common/HumanResidentPort.js";
import type { IHumanViewportHost } from "../common/IHumanViewportHost.js";
import type { ConnectedBodyRequest } from "@automovie/human/body/runtime/ConnectedBodyRequest";
import type { ConnectedBodyResult } from "@automovie/human/body/runtime/ConnectedBodyResult";

/**
 * Host services of `createConnectedBodyViewport`.
 *
 * The canvas, pixel ratio, orbit and resize observation are the shared human
 * viewport's; the renderer additionally exposes shadow-map control. `worker`
 * starts the resident body worker and `loadTexture` resolves material assets.
 *
 * @evidence contracts/common.md#principled-implementation The host extends the shared renderer/orbit/resize contract with typed body transport and texture acquisition. Its document serializer must match the worker grammar; the body fallback cannot serialize a person document correctly by generic type alone.
 * @evidence contracts/common.md#clear-and-simple-design Browser services stay at the host boundary, while the viewport owns listeners, prepared frames and the connection it requests from worker. The common base prevents duplicate host field definitions.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source authority is supplied for supported body auxiliary transactions without embedding private geometry in public documents. No host identity or fixture selects an alternate anatomy path.
 * @evidence contracts/common.md#meaningful-documentation Field comments distinguish transferred worker and texture acquisitions, the optional serializer default, and source-backed auxiliary operations; the inherited host documents borrowed renderer and controls.
 * @evidence contracts/performance.md#efficient-algorithms The interface itself adds no processing. Worker serialization, texture decoding and geometry upload costs are paid by the respective consuming owners.
 * @evidence contracts/performance.md#reuse-equivalent-work One viewport reuses its worker and texture cache while the supplied source and service scope stay fixed. Props are not a cross-viewport cache key.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The viewport retires its acquired connection and cached textures on close and removes its host callbacks. The browser factory owns renderer, controls and resize observer acquisition; this type does not bound asset bytes or pending requests.
 *
 * @author Samchon
 */
export interface IConnectedBodyViewportHost<Document> extends IHumanViewportHost {
  /**
   * Acquire the numerical connection that the viewport closes through its preview.
   *
   * @evidence contracts/common.md#principled-implementation The typed resident port carries ConnectedBodyRequest and ConnectedBodyResult with correlation envelopes; an implementation must supply that protocol rather than arbitrary Worker messages.
   * @evidence contracts/common.md#clear-and-simple-design Acquisition is a factory because the preview connects on its first request and can replace a failed transport.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts The caller supplies a real numerical port; this field contains no fixture transport or foreign-method override.
   * @evidence contracts/common.md#meaningful-documentation The comment identifies the viewport's preview as the termination owner of the acquired connection.
   * @evidence contracts/performance.md#efficient-algorithms Connection construction is host-dependent; normal successful edits reuse it instead of recreating a worker each time.
   * @evidence contracts/performance.md#reuse-equivalent-work Requests share the live connection and admitted numerical basis until failure or disposal, but each request remains independently correlated and effectful.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The resident coordinator retains at most one current connection. Viewport close invokes preview disposal; request count and worker memory are not bounded by this field.
   */
  worker: () => HumanResidentPort<ConnectedBodyRequest, ConnectedBodyResult>;

  /**
   * Load a material texture whose disposal transfers to the viewport texture cache.
   *
   * @evidence contracts/common.md#principled-implementation Material asset strings resolve to textures in one host asset scope; the loader must not return a shared borrowed texture that the cache cannot safely dispose.
   * @evidence contracts/common.md#clear-and-simple-design The callback separates browser asset access from renderer-owned cache and retirement bookkeeping.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Asset loading is explicit product input with no consumer-name exceptions or patched TextureLoader behavior.
   * @evidence contracts/common.md#meaningful-documentation The comment states texture transfer and cache ownership rather than leaving loadTexture as a name-only promise.
   * @evidence contracts/performance.md#efficient-algorithms Decoding and transfer scale with asset bytes; the renderer's cache deduplicates occurrences and in-flight requests by asset within this loader scope.
   * @evidence contracts/performance.md#reuse-equivalent-work Matching asset keys reuse the cache entry while its owning loader scope is alive. This declaration does not authorize sharing across devices or changed asset contents.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Cached resolved textures are retired by renderer closure, including late resolutions. Loader cancellation and a byte limit are absent from this function signature.
   */
  loadTexture: (asset: string) => Promise<THREE.Texture>;

  /**
   * Text of a document for the worker; a body document unless the stage draws people.
   *
   * @evidence contracts/common.md#principled-implementation The supplied serializer must encode Document in the worker's admitted grammar. When omitted, body basis serialization is used, so the person viewport supplies its serializer explicitly.
   * @evidence contracts/common.md#clear-and-simple-design A single optional callback keeps document syntax outside browser and GPU service ownership.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts Document family is explicit through serializer and transport, without consumer-name detection or a fixture fallback.
   * @evidence contracts/common.md#meaningful-documentation The comment explains the body-only default and why a person stage needs the callback.
   * @evidence contracts/performance.md#efficient-algorithms Serialization scales with document data and allocates its text on each request. A custom callback has no enforced complexity bound here.
   * @evidence contracts/performance.md#reuse-equivalent-work Each request invokes serialization because validation and caller effects need not be equivalent; the viewport does not memoize arbitrary callback output.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The preview retains this callback until closure, and request text until the transport has accepted it. Returned strings have no explicit release API and no byte cap in this type.
   */
  serialize?: (document: Document) => string;

  /** Loaded source authority for body-only auxiliary transactions; no private geometry enters a document. */
  source?: IAutoMovieHumanBodyAnatomicalAssembly;
}
