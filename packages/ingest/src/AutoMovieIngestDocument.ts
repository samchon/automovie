import type {
  IAutoMovieIngestResult,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import type { Document } from "@gltf-transform/core";

import { humanoidSkeleton as buildHumanoidSkeleton } from "./humanoidSkeleton";
import { ingestDocument as mapDocument } from "./ingestDocument";

/**
 * Converts a parsed glTF document and its humanoid skins into AutoMovie's
 * document and skeleton contracts.
 */
export class AutoMovieIngestDocument {
  /**
   * Map a parsed glTF document to AutoMovie nodes and animation clips.
   * @param doc Parsed document; it is only read.
   * @returns New node and clip records.
   */
  public static ingestDocument(
    doc: Document,
  ): IAutoMovieIngestResult {
    return mapDocument(doc);
  }

  /**
   * Map parsed glTF skin joints to the normalized humanoid skeleton.
   * @param doc Parsed document; it is only read.
   * @param skeletonId Id copied to the returned skeleton.
   * @returns The skeleton, or `null` when no skin joint maps to hips.
   */
  public static humanoidSkeleton(
    doc: Document,
    skeletonId: string = "skeleton",
  ): IAutoMovieSkeleton | null {
    return buildHumanoidSkeleton(doc, skeletonId);
  }
}
