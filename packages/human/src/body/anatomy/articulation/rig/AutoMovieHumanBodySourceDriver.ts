import type { IAutoMovieHumanBodySourceAnatomicalDriver } from "./IAutoMovieHumanBodySourceAnatomicalDriver";
import type { IAutoMovieHumanBodySourcePoseDriver } from "./IAutoMovieHumanBodySourcePoseDriver";
import type { IAutoMovieHumanBodySourceShoulderDriver } from "./IAutoMovieHumanBodySourceShoulderDriver";
import type { IAutoMovieHumanBodySourceToeDriver } from "./IAutoMovieHumanBodySourceToeDriver";

/**
 * Supported numerical goal owners; source vertices and matrices are not authoring coordinates.
 *
 * @evidence contracts/common.md#principled-implementation A union of discriminated public-pose, shoulder, toe and anatomical records identifies the sole numerical authority that a source axis reads.
 * @evidence contracts/common.md#clear-and-simple-design Imported driver variants keep each goal convention with its owning record while exposing one closed source-driver surface.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source vertices and matrices are excluded from authoring; only supported named numerical goal owners enter this driver union.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies numerical goal ownership and the concrete imported variants carry their units and neutral semantics.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The driver union delegates coordinate evaluation to runtime readers and chooses no lookup algorithm itself.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A driver-type alternative does not memoize goal values across authored documents.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Imported driver records declare no running evaluator, buffer lease or lifecycle hook.
 * @author Samchon
 */
export type AutoMovieHumanBodySourceDriver =
  | IAutoMovieHumanBodySourcePoseDriver
  | IAutoMovieHumanBodySourceShoulderDriver
  | IAutoMovieHumanBodySourceToeDriver
  | IAutoMovieHumanBodySourceAnatomicalDriver;
