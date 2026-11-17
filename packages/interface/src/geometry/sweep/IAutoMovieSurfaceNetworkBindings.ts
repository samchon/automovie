import type { AutoMovieHumanoidBone } from "../../skeleton/AutoMovieHumanoidBone";
import type { IAutoMovieSweepBinding } from "./IAutoMovieSweepBinding";

/**
 * Name-based bone assignments for posing or compiling a surface network.
 *
 * Omitted tables or entries leave geometry at rest. Sweep-attached nodes already
 * follow their sweep; free nodes, curve controls and ring pins use the separate
 * rigid assignments. poseAutoMovieSurfaceNetwork and rigAutoMovieSurfaceNetwork
 * reject unknown component names and missing required bones. Rig compilation
 * retains prepared bindings; keep source declarations stable for its lifetime.
 * These are bone names, not resolved buffer slots.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Defines assignment categories, omission, sweep ownership, lookup admission and lifetime.
 * @evidence contracts/development/design.md#principled-representation Network names map to canonical bone identities and sweep bindings, separately from resolved rig buffer indices.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Direct posing and retained cage rig compilation consume the same authored binding record.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Missing assignments do not infer a bone or add a second rigid transform to sweep-owned nodes.
 */
export interface IAutoMovieSurfaceNetworkBindings {
  /** Existing sweep names to spine/station bone assignments. */
  sweeps?: Record<string, IAutoMovieSweepBinding>;

  /** Existing free point-node names to rigid-motion bones. */
  nodes?: Record<string, AutoMovieHumanoidBone>;

  /** Existing curve names to bones carrying through points, normals and directions. */
  curves?: Record<string, AutoMovieHumanoidBone>;

  /** Existing ring names to bones carrying pinned positions. */
  rings?: Record<string, AutoMovieHumanoidBone>;
}
