/**
 * A motor-goal relationship between actual scene colliders. It names geometry,
 * not a prerecorded world coordinate or an asserted successful contact. The
 * runtime fits bounded joint goals toward the current receiver surface; only
 * the solver's subsequent positive contact impulse establishes a physical hit.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Gives the purpose (A motor-goal relationship between actual scene colliders) and documents 9 documented members as stated in this comment.
 * @evidence contracts/development/design.md#principled-representation Represents A motor-goal relationship between actual scene colliders: interface of 9 members (`id`, `kind`, `chain`, `source`, `target`, `weight`, ...); units and frames named in its text: world, local, metres, metre. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `IAutoMoviePhysicalContactBinding` in packages/interface/src/physics/IAutoMoviePhysicalContactBinding.ts; its surface is the 9 members listed and the text shows 7 other files naming it, mostly packages/engine (4), test (2), packages/interface (1), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export interface IAutoMoviePhysicalContactBinding {
  /** Stable authoring relationship identity within this target. */
  id: string;
  /** Contact approaches a surface; separate only removes penetrating intent. */
  kind: "contact" | "separate";
  /** Proximal-to-distal actuator chain ending at the source bone. */
  chain: string[];
  /** Source collider on this body. */
  source: { bone: string; shape: string };
  /** Receiver collider, read in its actual current world placement. */
  target: {
    body: string;
    bone: string;
    shape: string;
    /** Optional nonzero bone-local outward direction selecting a particular receiver surface. */ normal?: {
      x: number;
      y: number;
      z: number;
    };
  };
  /** Blend of the authored path toward this relationship, in [0,1]. */
  weight: number;
  /** Intended soft-layer penetration, metres, bounded by both materials' total compression allowance. Separate requires zero. */
  compression: number;
  /** Positive bounded updates in the simultaneous geometric solve, at most 32. */
  iterations: number;
  /** Positive metre residual early-out; unreachable requests remain residuals. */
  tolerance: number;
}
