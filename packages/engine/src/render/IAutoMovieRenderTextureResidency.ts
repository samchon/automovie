import type { AutoMovieBuiltinTexturePurpose } from "./AutoMovieBuiltinTexturePurpose";
import type { IAutoMovieRenderTextureResident } from "./IAutoMovieRenderTextureResident";
import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";
import type { IAutoMovieRenderTextureTarget } from "./IAutoMovieRenderTextureTarget";

/**
 * Capture-host residency beyond the current shot. Live scopes retain their own
 * cache identities. Shared runtime scratch survives source disposal, so the
 * host records it separately and drops it only after actual context release.
 * Omission describes a fresh context containing only the assessed shot.
 *
 *
 * @evidence contracts/development/design.md#principled-representation Describe actual live scopes and renderer-retained lookup, PMREM, display and framebuffer allocations so closure includes storage that survives source disposal; omitted residency means a fresh context only.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One host fact record distinguishes live source owners from context-owned scratch and target storage rather than folding all resources into asset counts.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Opaque actual object facts and host-observed dimensions are required; author-entered byte estimates or lifetime allocation counters cannot certify current residency.
 * @evidence contracts/development/common.md#meaningful-documentation Members document owner uniqueness, disposed-scope removal, environment clones, retained lookups, compositor copies and context-release boundaries.
 */
export interface IAutoMovieRenderTextureResidency {
  /** Stable owner of the current shot, distinct from other live residents. */
  owner: string;

  /**
   * Other live scopes retained by this same renderer, excluding disposed ones.
   */
  residents: readonly IAutoMovieRenderTextureResident[];

  /**
   * Facts from the current shot's actual resolved environment texture clone.
   */
  environmentTexture?: IAutoMovieRenderTextureSource;

  /** Whether an earlier PBR draw's shared lookup is still resident. */
  dfgRetained: boolean;

  /**
   * Actual retained PMREM scratch extent, or null when none exists. These are
   * decoded render-target dimensions, not an author-provided byte estimate.
   */
  pmremRetained: { width: number; height: number } | null;

  /**
   * Active film display compositors observed by the host. Each retains two
   * source display copies and one last-completed display, all RGBA8 without
   * mip levels. Disposal removes its row rather than keeping a lifetime count.
   */
  displayCompositors?: readonly {
    owner: string;
    width: number;
    height: number;
  }[];

  /**
   * Actual retained renderer data textures, such as formation cycle tables.
   * Stable owners identify their generating runtime; the source facts come
   * from its real Texture objects rather than invented asset or byte records.
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
   */
  renderTargets?: readonly IAutoMovieRenderTextureTarget[];
}
