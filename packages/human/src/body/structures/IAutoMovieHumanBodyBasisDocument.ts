import type { IAutoMovieJointPose } from "@automovie/interface";

/**
 * Compact edits against a separately supplied immutable body basis.
 *
 * Zero is the source neutral; omitted channels are zero and omitted joints are
 * at rest. Negative controls use their authored negative endpoint, never an
 * extrapolated positive one. The document contains no photo, mesh cache,
 * renderer or Blender dependency, and no schema version: the basis revision it
 * names decides what every field means, and a basis mismatch is refused rather
 * than migrated.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Separates basis revision, channel weights, per-vertex identity, joint pose and material adjustments in one replayable record.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-document Fixes the document's fields and the neutral meaning of every omission the save boundary and the builder share.
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisDocument {
  /** Stable identity of this authored body. */
  id: string;

  /** Display name, independent of basis selection. */
  name: string;

  /** Must equal the supplied basis identity; no implicit migration occurs. */
  basis: string;

  /** Persistent shape edits against the basis's named channels. */
  shape: Record<string, number>;

  /**
   * Optional per-vertex identity, by surface, moving the neutral this document
   * is edited from. Rows are sparse `[vertex, dx, dy, dz]` in metres, exactly
   * as an endpoint's rows are, and are applied before any channel so a channel
   * moves this body from its own neutral. Landmarks are not moved by identity;
   * a joint that must follow an identity edit is authored through a channel.
   * Omission is the shared neutral.
   */
  identity?: Record<string, number[]>;

  /**
   * Optional joint articulation in clinical degrees, sparse and unique per
   * bone, validated against each joint's range before anything is skinned.
   * Omission is the rest pose the basis was authored in.
   */
  pose?: IAutoMovieJointPose[];

  /** Optional linear RGB and roughness, each in [0,1], by existing material ID. */
  materials?: Record<
    string,
    { color?: { r: number; g: number; b: number }; roughness?: number }
  >;
}
