import type { IAutoMovieAimDriver, IAutoMovieCopyDriver, IAutoMovieIKDriver, IAutoMovieParentDriver, IAutoMovieSpringDriver } from "@automovie/interface";
import type { IAutoMovieLegacyDrivenDriver } from "./IAutoMovieLegacyDrivenDriver";

/**
 * A prop profile driver as the v1 record wrote it, tuple-free.
 *
 * @evidence contracts/common.md#principled-implementation The closed stored union preserves ordinary active driver variants and substitutes the named-range driven variant for tuple-free v1 persistence.
 * @evidence contracts/common.md#clear-and-simple-design LegacyPropProfile owns the driver array and toEnginePropSpec converts only the driven representation before engine use.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Ordinary copy, aim, IK, parent and spring drivers pass through their declared semantics; no unsupported driver kind is fabricated.
 * @evidence contracts/common.md#meaningful-documentation States supported stored variants, historical representation and the converter that lowers them.
 * @evidenceExclude contracts/performance.md#efficient-algorithms Selecting a union arm executes no joint solver; active evaluators and range lowering own processing.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The driver vocabulary holds no computed joint output across frames or changed target bindings.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Prop profiles own variant records and their target values while this union starts no solver task.
 * @author Samchon
 */
export type IAutoMovieLegacyPropDriver =
  | IAutoMovieCopyDriver
  | IAutoMovieAimDriver
  | IAutoMovieIKDriver
  | IAutoMovieParentDriver
  | IAutoMovieLegacyDrivenDriver
  | IAutoMovieSpringDriver;
