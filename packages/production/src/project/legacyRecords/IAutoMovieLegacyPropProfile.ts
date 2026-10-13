/**
 * Legacy project record boundary. The stored format preserves its existing
 * identities and units; runtime consumers use the same declared fields.
 */
import type { IAutoMovieChannelLimit, IAutoMovieProfileControl } from "@automovie/interface";
import type { IAutoMovieLegacyPropDriver } from "./IAutoMovieLegacyPropDriver";

/**
 * A prop's profile as the v1 record wrote it: the declared controls,
 * limits, and (tuple-free) drivers. Gaits are omitted, a prop does not locomote
 * (`IAutoMovieProfile.gaits` is for bodies); the humanoid gait path rides the
 * `perform` tool's actor contexts instead.
 *
 * @author Samchon
 */
export interface IAutoMovieLegacyPropProfile {
  /**
   * Stable profile id.
   */
  id: string;

  /**
   * Profile name (e.g. `"hinge"`).
   */
  name: string;

  /**
   * The named controls this profile exposes.
   */
  controls: IAutoMovieProfileControl[];

  /**
   * Drivers coupling the prop's joints, tuple-free.
   */
  drivers: IAutoMovieLegacyPropDriver[];

  /**
   * Value constraints over the prop's joints (the hinge's 0..110°).
   */
  limits: IAutoMovieChannelLimit[];
}
