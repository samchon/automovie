/**
 * Legacy project record boundary preserving historical identities and units.
 */
import type { IAutoMovieChannelLimit } from "@automovie/interface";
import type { IAutoMovieLegacyPropControl } from "./IAutoMovieLegacyPropControl";
import type { IAutoMovieLegacyPropDriver } from "./IAutoMovieLegacyPropDriver";

/**
 * Historical prop profile containing controls, limits and tuple-free drivers, with no gait field. toEnginePropSpec retains id/name/limits and lowers drivers, omitting control metadata rather than applying defaults or bindings. This representation supplies no active perform-tool consumer.
 *
 * @evidence contracts/common.md#principled-implementation The v1 profile keeps named driver ranges and historical controls in its persisted shape; conversion lowers active drivers and limits into the engine contract and omits unread controls.
 * @evidence contracts/common.md#clear-and-simple-design Legacy storage owns compatibility data while the active profile owns supported runtime semantics.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Conversion preserves the historical absence of control execution instead of inventing defaults or channel bindings.
 * @evidence contracts/common.md#meaningful-documentation States stored control behavior, tuple-free driver representation and joint-limit ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This interface declares stored fields; conversion owns driver traversal and range lowering.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A stored profile starts no computation or result-sharing policy.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The enclosing legacy record owns the metadata lists; this declaration acquires no resources.
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
   * Historical named-control metadata, omitted from the active engine profile.
   */
  controls: IAutoMovieLegacyPropControl[];

  /**
   * Drivers coupling the prop's joints, tuple-free.
   */
  drivers: IAutoMovieLegacyPropDriver[];

  /**
   * Value constraints over prop joint channels, with angular values in degrees.
   */
  limits: IAutoMovieChannelLimit[];
}
