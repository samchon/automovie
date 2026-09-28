import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodyShoulderPose } from "./IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieHumanBodyUnderwear } from "./IAutoMovieHumanBodyUnderwear";

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
 * @author Samchon
 */
export interface IAutoMovieHumanBodyBasisDocument {
  /** Stable identity of this authored body. */
  id: string;

  /** Display name, independent of basis selection. */
  name: string;

  /** Must equal the supplied basis identity; no implicit migration occurs. */
  basis: string;

  /**
   * Canonical basis weights for replay, including legacy authored morphs.
   * These are internal document coordinates, not a request for the user to
   * sculpt vertices. The editor derives supported values from anthropometric
   * inputs or from a named metric rule solved on the current shaped body;
   * unmeasured source morphs remain readable for existing documents but do
   * not become detailed anatomical input controls.
   */
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

  /**
   * Optional skin colour by anatomical site: the cheek albedo the face wears,
   * linear RGB, each channel in (0,1]. The skin material's regions are then
   * coloured by site from it (`HUMAN_BODY_SKIN_SITES`), meeting the face in
   * that colour at the neck; omission keeps the one material colour. A colour
   * override of that material in `materials` is refused beside it.
   */
  skinColour?: { cheek: { r: number; g: number; b: number } };

  /**
   * Optional micro-relief of the skin: the skin material takes a tiled
   * normal map of its primary lines and pores (`HUMAN_BODY_SKIN_DETAIL`) at
   * `strength` in [0,1], deepening with the document's age; omission keeps
   * the skin smooth.
   */
  skinDetail?: { strength: number };

  /**
   * Optional uneven tone of the skin: the skin material takes a tiled
   * base-colour map of its two chromophores, melanin and haemoglobin,
   * varying about the site colour (`HUMAN_BODY_SKIN_TONE`) at `strength` in
   * [0,1], less even with the document's age; the base colour is compensated
   * so the skin's mean colour stays the site albedo. Omission keeps the tone
   * even.
   */
  skinTone?: { strength: number };

  /**
   * Optional superficial veins of the skin, where the basis draws them:
   * they show at `strength` in [0,1] over the lean body independently of
   * skin micro-relief. Tissue the document's body carries over its lean self
   * hides them further, as a vein deeper under the skin takes less light.
   * A request without any declared vein layer is refused. Omission shows none.
   */
  skinVeins?: { strength: number };

  /**
   * Optional plain default underwear: boxer briefs, or a sports bra and
   * briefs, cut from the posed skin by landmark rules and lifted a few
   * millimetres off it as a part of its own material, in the table's colour
   * or `color` (`HUMAN_BODY_UNDERWEAR`). Omission wears none.
   */
  underwear?: IAutoMovieHumanBodyUnderwear;

  /** Optional linear RGB and roughness, each in [0,1], by existing material ID. */
  materials?: Record<
    string,
    { color?: { r: number; g: number; b: number }; roughness?: number }
  >;
}
