import type {
  IAutoMovieIngestResult,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import type { Document } from "@gltf-transform/core";

import { humanoidSkeleton as buildHumanoidSkeleton } from "./internal/humanoidSkeleton";
import { ingestDocument as mapDocument } from "./internal/ingestDocument";

/** Maps parsed glTF documents to AutoMovie nodes, clips and humanoid bones. */
export namespace AutoMovieIngestDocument {
  /**
   * Maps a parsed glTF document to new node and animation records.
   *
   * Nodes retain their parent and local translation, rotation and scale. Tracks
   * retain the source interpolation and key times in seconds. The mapper
   * decodes normalized accessor values. Supply a valid parsed document with
   * internally consistent node and resource references.
   *
   * @param doc Parsed document, borrowed for the mapping.
   * @returns Owned graph and clip records.
   * @throws On an unsupported or malformed animation channel or sampler.
   */
  export function ingestDocument(doc: Document): IAutoMovieIngestResult {
    return mapDocument(doc);
  }

  /**
   * Maps named skin joints onto the humanoid skeleton slots.
   *
   * The first joint claiming a slot in document order wins. Each bone's rest is
   * relative to its nearest mapped ancestor, including any intervening helper
   * transforms. A root retains its own local transform. Supply finite input
   * transforms with unit quaternions. The result uses TRS and drops shear
   * caused by noncommuting scales and rotations.
   *
   * @param doc Parsed document, borrowed for the mapping.
   * @param skeletonId Returned skeleton id, defaults to `"skeleton"`.
   * @returns The mapped skeleton or `null` when no joint maps to hips.
   * @throws On a cycle encountered while searching mapped ancestors.
   */
  export function humanoidSkeleton(
    doc: Document,
    skeletonId: string = "skeleton",
  ): IAutoMovieSkeleton | null {
    return buildHumanoidSkeleton(doc, skeletonId);
  }
}
