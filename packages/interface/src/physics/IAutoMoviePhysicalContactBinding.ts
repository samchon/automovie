/**
 * A motor-goal relationship between actual scene colliders. It names geometry,
 * not a prerecorded world coordinate or an asserted successful contact. The
 * runtime fits bounded joint goals toward the current receiver surface; only
 * the solver's subsequent positive contact impulse establishes a physical hit.
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
