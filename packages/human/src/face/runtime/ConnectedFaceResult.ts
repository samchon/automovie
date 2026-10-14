import type { measureAutoMovieModelCrossings } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanGltfExport } from "../../common/export/IAutoMovieHumanGltfExport";
import type { readHumanFacePartCensus } from "../basis/readHumanFacePartCensus";
import type { summarizeHumanFaceArticulation } from "../basis/summarizeHumanFaceArticulation";
import type { IAutoMovieHumanFaceConstruction } from "../structures/IAutoMovieHumanFaceConstruction";
import type { IAutoMovieHumanFaceContactSummary } from "../structures/IAutoMovieHumanFaceContactSummary";

/**
 * File bytes, admitted previews and separately qualified constructions are
 * distinct alternatives. The numerical owner supplies exact models, readings
 * and the complete construction admission rather than a viewer verdict.
 *
 * @evidence contracts/common.md#principled-implementation The operation discriminant preserves exported bytes, admitted preview geometry and potentially refused construction geometry as separate results, reusing the actual producer-owned admission, contact, mapping and census types.
 * @evidence contracts/common.md#clear-and-simple-design One explicit union describes the resident transport without circularly inferring its type from the runtime that consumes it.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts A construction's complete admission is not replaced by a viewer success flag or success-only contact observation; exported bytes carry no new anatomical verdict.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes publication states, and each alternative names its operation and the exact returned data owners.
 * @evidenceExclude contracts/performance.md#efficient-algorithms This transport type performs no build, crossing census or GLB serialization.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The union defines no resident compilation cache or request deduplication.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources Returned models and bytes belong to the transport caller; this declaration opens no worker or resource handle.
 *
 * @author Samchon
 */
export type ConnectedFaceResult =
  | {
      /** Binary static export of an admitted model. */
      operation: "export";

      /** Caller-owned binary glTF bytes. */
      glb: IAutoMovieHumanGltfExport["glb"];
    }
  | {
      /** Ordinary admission succeeded before publication. */
      operation: "preview";

      /** Admitted resident model. */
      model: IAutoMovieModel;

      /** Requested joint motion, independently of contact acceptance. */
      articulation: ReturnType<typeof summarizeHumanFaceArticulation>;

      /** Last successful builder observation, or null without contact. */
      contact: IAutoMovieHumanFaceContactSummary | null;

      /** Optional report-only surface crossing census. */
      crossings: ReturnType<typeof measureAutoMovieModelCrossings> | null;
    }
  | {
      /** Explicit inspection keeps complete geometry even when admission refuses. */
      operation: "construct";

      /** Every requested constructed part. */
      model: IAutoMovieModel;

      /** Owner's unchanged admission with an actual part census always supplied. */
      admission: IAutoMovieHumanFaceConstruction["admission"] & {
        /** Existing admission census or a read from the returned model. */
        parts: ReturnType<typeof readHumanFacePartCensus>;
      };

      /** Actual mapping observations, including absence of registered mappings. */
      periocularMappings: IAutoMovieHumanFaceConstruction["periocularMappings"];

      /** Requested joint motion, not a construction admission substitute. */
      articulation: ReturnType<typeof summarizeHumanFaceArticulation>;

      /** Construction never publishes the success-only observer. */
      contact: null;

      /** Optional report-only census on the complete constructed model. */
      crossings: ReturnType<typeof measureAutoMovieModelCrossings> | null;
    };
