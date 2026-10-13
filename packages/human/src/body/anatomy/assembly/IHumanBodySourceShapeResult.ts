import type { IAutoMovieMesh } from "@automovie/interface";

import type { IAutoMovieHumanBodySourcePart } from "./IAutoMovieHumanBodySourcePart";
import type { IHumanBodySourceQuantityReading } from "./IHumanBodySourceQuantityReading";

/**
 * Owned shape result on immutable source members, before the shared rig poses them.
 *
 * @evidence contracts/common.md#principled-implementation Changed meshes retain existing part/member keys while independent readings preserve target/acquisition qualification before shared-rig posing.
 * @evidence contracts/common.md#clear-and-simple-design One owned result separates geometry derivatives from reports without duplicating rig evaluation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The result introduces no tissue catalogue or personal vertices, and readings confer no clinical certification.
 * @evidence contracts/common.md#meaningful-documentation Members identify changed source geometry and actual metrics versus named observation availability.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This pre-pose result exposes completed meshes and readings without selecting their source shape algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Readonly result maps are outputs without a subsequent target-request reuse key.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Derivative meshes belong to their producing solve; this interface acquires no external assets or tasks.
 * @author Samchon
 */
export interface IHumanBodySourceShapeResult {
  /** Changed actual source meshes by existing part and member identities. */
  meshes: ReadonlyMap<
    IAutoMovieHumanBodySourcePart["id"],
    ReadonlyMap<string, IAutoMovieMesh>
  >;

  /** Actual metric or named observation availability, without clinical certification. */
  readings: readonly IHumanBodySourceQuantityReading[];
}
