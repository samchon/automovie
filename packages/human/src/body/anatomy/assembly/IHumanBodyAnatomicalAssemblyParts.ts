import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodySourceRigResult } from "../articulation/rig/IAutoMovieHumanBodySourceRigResult";
import type { IHumanBodySourceQuantityReading } from "./IHumanBodySourceQuantityReading";

/**
 * Actual posed anatomical boundary parts and their separate inspection finishes.
 *
 * @evidence contracts/common.md#principled-implementation One evaluated graph accompanies posed boundary parts, independent diagnostic materials and quantity readings from the same frame.
 * @evidence contracts/common.md#clear-and-simple-design The result separates geometry, appearance and measurement reports while preserving their common rig authority for assembly consumers.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Inspection finishes do not imply biological color, and coarse boundary reports remain distinct from raw acquisition comparison availability.
 * @evidence contracts/common.md#meaningful-documentation Members specify anatomical/subdivision identities, common graph frame, diagnostic finish qualification and Float64/Float32 reading stages.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This assembly result shape exposes completed arrays without selecting a posing or rendering algorithm.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Consumer sharing uses the same completed graph, but the type does not coordinate equivalent body evaluations.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned arrays belong to the producing construction; the declaration starts no retained render task or resource lease.
 * @author Samchon
 */
export interface IHumanBodyAnatomicalAssemblyParts {
  /** Graph in the same evaluated frame as these source parts and quantity fields. */
  rig: IAutoMovieHumanBodySourceRigResult;

  /** Actual posed source members, with separate anatomical owner and subdivision IDs. */
  parts: IAutoMovieModel["parts"];

  /** Diagnostic tissue finishes referenced by those members; no biological color is inferred. */
  materials: IAutoMovieModel["materials"];

  /** Source-rest Float64/Float32 readings and emitted posed Float32 readings, with raw acquisition comparison availability preserved. */
  quantities: readonly IHumanBodySourceQuantityReading[];
}
