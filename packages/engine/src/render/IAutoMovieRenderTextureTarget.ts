import type { IAutoMovieRenderTextureSource } from "./IAutoMovieRenderTextureSource";

/**
 * One host-owned framebuffer's attachment storage and native factory bound. Target
 * objects allocate independently of decoded Source sharing. Requested samples
 * conservatively bound hardware-clamped multisampling; resolved color mips and
 * single-sample depth remain separate from multisample attachments.
 *
 * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Carries actual framebuffer extent, attachment representation and sample population for resident storage bounds.
 * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Separates target attachment facts from decoded-image upload facts and preserves unsupported formats as unknown.
 * @author Samchon
 */
export interface IAutoMovieRenderTextureTarget {
  /**
   * Stable host target owner, unique among retained targets in one context.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Attributes each independently retained target once.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps target attribution independent of decoded source names.
   */
  owner: string;

  /**
   * Live shot owner whose transmission pass uses this target, when applicable.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Associates derived transmission storage with its actual live scope.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Detects missing target facts for a required transmissive material.
   */
  transmissionScope?: string;

  /**
   * Shadow attachment's stable scope, light and native map/filtering role.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Attributes shadow attachments to the light and scope whose required storage they bound.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Distinguishes required map and VSM blur storage from unrelated retained framebuffers.
   */
  shadow?: { scope: string; light: string; role: "map" | "blur" };

  /**
   * Color and depth face population: one for a 2D target, six for a cube.
   * Omission preserves the legacy 2D attachment profile.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Counts actual cube target faces independently of its Texture object count.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps point shadow cube storage distinct from a single two-dimensional image.
   */
  faces?: 1 | 6;

  /**
   * Physical target width in pixels, observed or conservatively factory-bound,
   * before face and multisample expansion.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies the framebuffer's physical pixel population.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Refuses invalid or unsafe target extents rather than assuming source-image dimensions.
   */
  width: number;

  /**
   * Actual framebuffer height in pixels.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Supplies the second framebuffer extent.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps framebuffer height within the host-owned bound.
   */
  height: number;

  /**
   * Upload representation of each resolved color attachment; unknown stays absent.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Counts every actual color attachment independently of its source sharing.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Preserves unsupported target storage as an unknown admission cost.
   */
  formats: readonly IAutoMovieRenderTextureSource["format"][];

  /**
   * Whether resolved color attachments retain their full integer mip chain.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes resolved target mip storage beside multisample base attachments.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Distinguishes source mips from target-owned resolved mips.
   */
  mipmapped: boolean;

  /**
   * Requested multisample count; zero means no separate multisample attachments.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Conservatively bounds hardware-clamped sample allocation.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Keeps sample expansion explicit rather than hiding it in color texel width.
   */
  samples: number;

  /**
   * Depth/stencil bytes per base pixel; zero means absent, null means unknown.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes depth storage and its multisample companion without treating it as another color texture.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Preserves unknown depth representation in target admission.
   */
  depthBytesPerTexel: number | null;

  /**
   * Whether resolved depth is a Texture allocation rather than a renderbuffer.
   * Omission retains the legacy renderbuffer profile; color and depth textures
   * both contribute to the renderer's allocation count.
   *
   * @evidence requirements/rendering/budgets.md#rendering-geometry-memory-budget Includes an actual depth Texture in allocation population independently of its byte storage.
   * @evidence specifications/editorial-render-and-delivery/render-budget-identity-and-recovery.md#spec-render-budget-preflight Distinguishes depth texture residency from a non-texture companion attachment.
   */
  depthTexture?: boolean;
}
