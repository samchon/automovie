import type { AutoMovieHumanoidBone } from "../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieSweepBinding } from "./IAutoMovieSweepBinding";

/**
 * Name-based bone assignments for posing or compiling a surface network.
 *
 * Omitted tables or entries leave geometry at rest. Sweep-attached nodes
 * already follow their sweep; free nodes, curve controls and ring pins use the
 * separate rigid assignments. poseAutoMovieSurfaceNetwork and
 * rigAutoMovieSurfaceNetwork reject unknown component names and missing
 * required bones. Rig compilation retains prepared bindings; keep source
 * declarations stable for its lifetime. These are bone names, not resolved
 * buffer slots.
 */
export interface IAutoMovieSurfaceNetworkBindings {
  /** Existing sweep names to spine/station bone assignments. */
  sweeps?: Record<string, IAutoMovieSweepBinding>;

  /** Existing free point-node names to rigid-motion bones. */
  nodes?: Record<string, AutoMovieHumanoidBone>;

  /**
   * Existing curve names to bones carrying through points, normals and
   * directions.
   */
  curves?: Record<string, AutoMovieHumanoidBone>;

  /** Existing ring names to bones carrying pinned positions. */
  rings?: Record<string, AutoMovieHumanoidBone>;
}
