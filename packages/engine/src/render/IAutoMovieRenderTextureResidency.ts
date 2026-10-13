import type { IAutoMovieRenderTextureResident } from "./IAutoMovieRenderTextureResident";
import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";
import type { IAutoMovieRenderTextureTarget } from "./IAutoMovieRenderTextureTarget";
import type { AutoMovieBuiltinTexturePurpose } from "./AutoMovieBuiltinTexturePurpose";

/**
 * Capture-host residency beyond the current shot. Live scopes retain their own
 * cache identities. Shared runtime scratch survives source disposal, so the
 * host records it separately and drops it only after actual context release.
 * Omission describes a fresh context containing only the assessed shot.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes live shots and renderer-retained texture storage in one context-level bound.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Separates retained context resources from current source declarations and caller-authored byte guesses.
 * @author Samchon
 */
export interface IAutoMovieRenderTextureResidency {
  /**
   * Stable owner of the current shot, distinct from other live residents.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Associates current source usage with one deterministic live scope.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Prevents the current shot from being counted again among retained scopes.
   */
  owner: string;

  /**
   * Other live scopes retained by this same renderer, excluding disposed ones.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Closes simultaneous shot residency without pricing disposed resources.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps actual cross-scene source sharing measurable.
   */
  residents: readonly IAutoMovieRenderTextureResident[];

  /**
   * Facts from the current shot's actual resolved environment texture clone.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Counts the current environment object's retained derivatives.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Prevents an original cache texture from substituting for an environment clone.
   */
  environmentTexture?: IAutoMovieRenderTextureSource;

  /**
   * Whether an earlier PBR draw's shared lookup is still resident.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Retains context-wide lookup storage after source disposal.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Separates historical context storage from the current material population.
   */
  dfgRetained: boolean;

  /**
   * Actual retained PMREM scratch extent, or null when none exists. These are
   * decoded render-target dimensions, not an author-provided byte estimate.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Bounds the renderer's surviving half-float scratch from its actual pixel extent.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps absent scratch distinct from unknown or invalid extents.
   */
  pmremRetained: { width: number; height: number } | null;

  /**
   * Active film display compositors observed by the host. Each retains two
   * source display copies and one last-completed display, all RGBA8 without
   * mip levels. Disposal removes its row rather than keeping a lifetime count.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes all three copies held by each active film compositor.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Accounts active display storage independently of source image caches.
   */
  displayCompositors?: readonly { owner: string; width: number; height: number }[];

  /**
   * Actual retained renderer data textures, such as formation cycle tables.
   * Stable owners identify their generating runtime; the source facts come
   * from its real Texture objects rather than invented asset or byte records.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes renderer data-table storage in the same source/state allocation closure as decoded images.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Carries actual runtime table extents and sharing without naming them as project assets.
   */
  runtimeTextures?: readonly {
    owner: string;
    texture: Omit<IAutoMovieRenderTextureSource, "asset">;
    /** Implicit lookup role supplied by the actual material/light producer. */
    purpose?: AutoMovieBuiltinTexturePurpose;
    /** Current live scopes actually using this lookup; retained-only rows omit them. */
    residents?: readonly string[];
  }[];

  /**
   * Retained framebuffer attachment profiles, including required transmission
   * targets. Removing a material does not dispose a native scene/camera cache.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes independently allocated targets and their resolved and multisampled attachments.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Requires factual target profiles for supported transmission consumers instead of reporting zero derived storage.
   */
  renderTargets?: readonly IAutoMovieRenderTextureTarget[];
}
