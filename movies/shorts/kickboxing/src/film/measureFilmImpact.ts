import {
  type IAutoMovieMeshCrossing,
  type IAutoMovieSignedMeshQueryHit,
  createAutoMovieMeshCrossingQuery,
  createAutoMovieSignedMeshQuery,
} from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";

import type { ContactTrace } from "../motion/interaction/ContactTrace";

/**
 * Classify the original first-witness point on the same two actual WORLD surfaces.
 * @evidence contracts/common.md#implementation-and-ownership Public Engine crossing and signed-nearest queries read unchanged input meshes. Exact producer stop/witness/reaction/sample clocks must agree before the original query point is measured on both surfaces. A mere touch needs no strict overlap; both original vertex populations still bound the penetration proxy. No point, pair, mesh or tolerance is rewritten.
 * @evidence contracts/common.md#authoring-interface The caller supplies the actual meshes identified by the trace pair. The existing0.25mm contact precision bounds the sum of point-to-surface distances and each vertex-depth proxy. Clear last-clear states, excessive depth, unsupported topology or inconsistent clocks refuse; this is not full CCD, force or injury proof.
 */
export function measureFilmImpact(
  strike: IAutoMovieMesh,
  head: IAutoMovieMesh,
  trace: ContactTrace.Result,
): measureFilmImpact.Receipt {
  const time: number | null = trace.receipt.witnessTime;
  if (
    trace.receipt.stopAt !== "first-witness" ||
    !trace.event ||
    trace.event.relation !== "head" ||
    !trace.receipt.pair ||
    time === null ||
    trace.event.time !== time ||
    trace.stopTime !== time ||
    trace.constrainedSample?.elapsed !== time ||
    trace.receipt.reactionTime !== time
  )
    throw new Error(
      "The finishing measurement requires one original first-witness pair and clock",
    );
  const crossings: IAutoMovieMeshCrossing[] =
    createAutoMovieMeshCrossingQuery(head)(strike);
  const headQuery: ReturnType<typeof createAutoMovieSignedMeshQuery> =
    createAutoMovieSignedMeshQuery(head);
  const strikeQuery: ReturnType<typeof createAutoMovieSignedMeshQuery> =
    createAutoMovieSignedMeshQuery(strike);
  const atHead: IAutoMovieSignedMeshQueryHit = headQuery(trace.event.point);
  const atStrike: IAutoMovieSignedMeshQueryHit = strikeQuery(trace.event.point);
  const receipt: measureFilmImpact.Receipt = {
    classification: crossings.length ? "bounded-overlap" : "touching",
    crossings,
    witnessToHeadMetres: atHead.distance,
    witnessToStrikeMetres: atStrike.distance,
    surfaceGapUpperBoundMetres: atHead.distance + atStrike.distance,
    maximumStrikerVertexPenetrationMetres: depth(strike, headQuery),
    maximumHeadVertexPenetrationMetres: depth(head, strikeQuery),
  };
  if (
    receipt.surfaceGapUpperBoundMetres > 0.00025 ||
    receipt.maximumStrikerVertexPenetrationMetres > 0.00025 ||
    receipt.maximumHeadVertexPenetrationMetres > 0.00025
  )
    throw new Error(
      "The displayed original pair is separated or exceeds bounded contact depth",
      { cause: receipt },
    );
  return receipt;
}

/**
 * Detached instantaneous contact measurements from the original native geometry.
 * @evidence contracts/common.md#implementation-and-ownership Shares one measured value type between actual actor inspection and pure boundary tests; no renderer, actor or mutable query closure escapes.
 * @evidence contracts/common.md#authoring-interface Distances are world metres. The classification is conditional on original pair/time and closed oriented surfaces, with finite vertex penetration rather than complete volume-overlap proof.
 */
export namespace measureFilmImpact {
  /**
   * Exact original-witness distances, strict intersections and finite depth proxies.
   * Keeps mere touching distinct from strict crossing while retaining each original vertex population's signed-depth maximum.
   * touching means no strict triangle crossing within the stated distance bound; bounded-overlap means strict crossings with both sampled depths inside the same contact precision. Neither term certifies force or continuous collision.
   */
  export interface Receipt {
    /** Native strict crossing presence, after distance/depth admission. */ classification:
      | "touching"
      | "bounded-overlap";
    /** Original triangle crossing witnesses, possibly empty at a touch. */ crossings: IAutoMovieMeshCrossing[];
    /** Original witness-to-head distance. */ witnessToHeadMetres: number;
    /** Original witness-to-striking-surface distance. */ witnessToStrikeMetres: number;
    /** Triangle-inequality upper bound through that unchanged original witness. */ surfaceGapUpperBoundMetres: number;
    /** Maximum signed depth among original striker vertices. */ maximumStrikerVertexPenetrationMetres: number;
    /** Maximum signed depth among original head vertices. */ maximumHeadVertexPenetrationMetres: number;
  }
}

/** Sample each original vertex against the unchanged opposite oriented surface. */
function depth(
  mesh: IAutoMovieMesh,
  query: ReturnType<typeof createAutoMovieSignedMeshQuery>,
): number {
  let maximum: number = 0;
  for (let index: number = 0; index < mesh.positions.length; index += 3)
    maximum = Math.max(
      maximum,
      -query([
        mesh.positions[index]!,
        mesh.positions[index + 1]!,
        mesh.positions[index + 2]!,
      ]).signedDistance,
    );
  return maximum;
}
