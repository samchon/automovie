import type * as THREE from "three";
import { releaseViewerRenderer as releaseViewerRendererImplementation } from "./internal/releaseViewerRenderer.js";
import { collectAutoMovieOwnedResources as collectOwnedResourcesImplementation } from "./internal/collectAutoMovieOwnedResources.js";
import { constructAutoMovieOwnedResources as constructOwnedResourcesImplementation } from "./internal/constructAutoMovieOwnedResources.js";
import { createAutoMovieResourceRetirement as createRetirementImplementation } from "./internal/createAutoMovieResourceRetirement.js";
import { reportAutoMovieResourceRetirement as reportRetirementImplementation } from "./internal/reportAutoMovieResourceRetirement.js";

/** Public operations for Auto Movie Scene Resource. */
export namespace AutoMovieSceneResource {
  /**
   * Release the renderer, preserving its failure rather than reporting successful
   * cleanup. The fade and dissolve compositors belong to their owner
   * (`AutoMovieTransitionDisplays`), which releases them in its own `dispose`.
   * Direct capture hosts retire their scene shadow targets before this call;
   * mounted hosts use releaseMountedViewer for that complete lifecycle.
   */
  export function releaseRenderer(renderer: THREE.WebGLRenderer): void {
    releaseViewerRendererImplementation(renderer);
  }

  /**
   * Collect the resources a subtree owner may retire, before any disposal event
   * can mutate that subtree. Geometry, standard materials, custom shadow
   * materials and skinned meshes' skeletons are distinct by object identity,
   * including sharing across meshes. A skeleton is collected because its disposal
   * releases the bone texture the renderer allocates on first draw; omitting it
   * left that texture to the GPU until context loss. Skeletons come last, after
   * every geometry, material and texture.
   *
   * Textures are included only for a decoded subtree that owns them. A group
   * backed by a texture cache leaves those wrappers to the cache's independent
   * retirement. This collection does not acquire ownership of borrowed objects:
   * the caller must own the supplied subtree and its declared resource roles.
   * Texture collection covers direct material texture slots, as used by the
   * decoded standard-material previews. Shader uniform textures have their own
   * producer lifetime and are not acquired by this subtree collector.
   */
  export function collectOwnedResources(
    group: THREE.Object3D,
    ownTextures?: boolean,
  ): readonly { dispose(): void }[] {
    return collectOwnedResourcesImplementation(group, ownTextures);
  }

  /**
   * Own resources from their first successful allocation until a synchronous
   * producer transfers its complete result. The producer registers each object
   * immediately, including objects not yet attached to its returned scene graph.
   * A refusal attempts every registered resource once by object identity and
   * reports the original construction cause before independent cleanup failures.
   *
   * Only resources created by this producer belong here. Texture resolvers and
   * shared shader producers retain their own wrappers and tables. Completion of a
   * public disposal call does not certify physical GPU retirement. Nested
   * constructors register a child's resources only after that child succeeds; the
   * child owns its own refusal, preventing duplicate retirement by its parent.
   */
  export function constructOwnedResources<Value>(
    construct: (
      own: <Resource extends { dispose(): void }>(resource: Resource) => Resource,
    ) => Value,
  ): Value {
    return constructOwnedResourcesImplementation(construct);
  }

  /**
   * One owned retirement with one completion, shared by repeated and reentrant
   * requests. Every operation starts independently, so a synchronous failure or a
   * pending asynchronous owner cannot prevent another owner from being asked to
   * retire. Completion waits for all attempts before reporting their results.
   *
   * The primary cause, when supplied, remains first. Original failure identities,
   * ordered nested aggregate causes and opaque empty aggregates follow the same
   * policy as render-state restoration. A fulfilled completion means all public
   * operations fulfilled; it is not proof that native allocations were freed. The
   * caller retains failed or indeterminate resource ownership until its supported
   * physical lifetime boundary ends.
   */
  export function createRetirement(
    operations: readonly ((() => void) | (() => Promise<void>))[],
    primary: { error: unknown },
  ): () => Promise<never>;

  /** Create an idempotent retirement operation without a primary failure. */
  export function createRetirement(
    operations: readonly ((() => void) | (() => Promise<void>))[],
  ): () => Promise<void>;

  /** Shared implementation for the retirement overloads. */
  export function createRetirement(
    operations: readonly ((() => void) | (() => Promise<void>))[],
    primary?: { error: unknown },
  ): () => Promise<void> {
    return createRetirementImplementation(operations, primary);
  }
  /**
   * Report completed retirement causes synchronously, without opening another
   * settlement window. The existing restoration policy owns cause order and
   * identity; this reporter supplies aggregate descriptions to callers whose
   * status transport displays Error.message. Opaque empty aggregates and a sole
   * primary cause retain their original object. Description expects an Error's
   * message to be a string: an invalid runtime message with throwing string
   * coercion can still replace the aggregate during the final join.
   */
  export function reportRetirement(
    reporting: readonly (() => void)[],
    primary?: { error: unknown },
  ): void {
    reportRetirementImplementation(reporting, primary);
  }
}
