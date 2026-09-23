import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyShoulderPose } from "./IAutoMovieHumanBodyShoulderPose";

/**
 * Compact edits against a separately supplied immutable body basis.
 *
 * Zero is the source neutral; omitted channels are zero, omitted non-humeral
 * joints are at rest and omitted shoulders hold their measured A-pose goal.
 * Negative controls use their authored negative endpoint, never an
 * extrapolated positive one. The document contains no photo, mesh cache,
 * renderer or Blender dependency, and no schema version: the basis revision it
 * names decides what every field means, and a basis mismatch is refused rather
 * than migrated.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-document Separates basis revision, named channel weights, joint pose and material adjustments in one replayable record, with no per-person vertex rows.
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

  /** Persistent numeric shape edits against the basis's named, bounded channels. */
  shape: Record<string, number>;

  /**
   * Optional non-humeral joint articulation in clinical degrees, sparse and
   * unique per bone, validated against each joint's range before skinning.
   * Omission is the rest pose the basis was authored in.
   */
  pose?: IAutoMovieJointPose[];

  /**
   * Optional humerothoracic goals in tilt-and-torsion coordinates. An omitted
   * arm keeps the basis's measured A-pose total direction even when its
   * shoulder girdle is posed; the girdle still transports its joint centre.
   */
  shoulders?: IAutoMovieHumanBodyShoulderPose[];

  /** Optional linear RGB and roughness, each in [0,1], by existing material ID. */
  materials?: Record<
    string,
    { color?: { r: number; g: number; b: number }; roughness?: number }
  >;
}
