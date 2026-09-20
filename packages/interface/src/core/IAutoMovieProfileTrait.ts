import { IAutoMovieDestructibleTrait } from "./IAutoMovieDestructibleTrait";
import { IAutoMovieMountableTrait } from "./IAutoMovieMountableTrait";

/**
 * Declarative profile capabilities; every variant is data, never code.
 *
 * @evidence requirements/agent-authoring/capability-discovery.md#agent-capability-gap-discovery Exposes `IAutoMovieProfileTrait` as the portable data boundary for the agent capability gap discovery requirement.
 * @evidence specifications/authoring-and-authority/capability-and-content-boundary.md#spec-authoring-capability-state Types `IAutoMovieProfileTrait` for the spec authoring capability state system contract.
 */
export type IAutoMovieProfileTrait =
  | IAutoMovieMountableTrait
  | IAutoMovieDestructibleTrait;
