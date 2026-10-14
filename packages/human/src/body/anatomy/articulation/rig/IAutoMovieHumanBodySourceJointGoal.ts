import type { AutoMovieHumanBodyBoneId } from "../../identity/AutoMovieHumanBodyBoneId";
import type { AutoMovieHumanBodySourceAxis } from "./AutoMovieHumanBodySourceAxis";

/**
 * A named anatomical articulation request consumed by the compiled source graph.
 *
 * @evidence contracts/common.md#principled-implementation A closed child-bone identity and named axis address one registered articulation using an absolute requested coordinate with an explicit unit.
 * @evidence contracts/common.md#clear-and-simple-design The goal stays separate from source axes, preserving caller requests while source data owns applicability and direction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Requested performance is not represented as observed clinical capacity or as arbitrary coordinates in a source mesh.
 * @evidence contracts/common.md#meaningful-documentation Members document child ownership, supported motion lookup, absolute request semantics and refusal of implicit unit conversion.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The goal schema declares a single request without selecting a source-graph resolution algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work An authored goal is not a shared completion record and defines no equivalence cache.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Goal values own no source asset, retained frame map or running solve.
 * @author Samchon
 */
export interface IAutoMovieHumanBodySourceJointGoal {
  /** Child bone whose source articulation owns this coordinate. */
  bone: AutoMovieHumanBodyBoneId;

  /** Named supported motion; the source determines applicability and direction. */
  axis: AutoMovieHumanBodySourceAxis;

  /** Absolute requested source coordinate, distinct from observed clinical capacity. */
  value: number;

  /** Explicit unit, matched to the source coordinate rather than silently converted. */
  unit: "degrees" | "metres";
}
