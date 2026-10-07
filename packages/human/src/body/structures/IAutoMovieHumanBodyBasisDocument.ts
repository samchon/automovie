import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IAutoMovieHumanBodySourceJointGoal } from "../anatomy/articulation/rig/IAutoMovieHumanBodySourceJointGoal";
import type { AutoMovieHumanBodyBoneId } from "../anatomy/identity/AutoMovieHumanBodyBoneId";
import type { IAutoMovieHumanBodyAnatomicalMeasurements } from "../anatomy/measurements/IAutoMovieHumanBodyAnatomicalMeasurements";
import type { IAutoMovieHumanBodyHumeralHeadRadii } from "./IAutoMovieHumanBodyHumeralHeadRadii";
import type { IAutoMovieHumanBodyMaterialOverride } from "./IAutoMovieHumanBodyMaterialOverride";
import type { IAutoMovieHumanBodyShoulderPose } from "./IAutoMovieHumanBodyShoulderPose";
import type { IAutoMovieHumanBodySkinColour } from "./IAutoMovieHumanBodySkinColour";
import type { IAutoMovieHumanBodySkinLayerStrength } from "./IAutoMovieHumanBodySkinLayerStrength";
import type { IAutoMovieHumanBodyThighGoal } from "./IAutoMovieHumanBodyThighGoal";
import type { IAutoMovieHumanBodyToePose } from "./IAutoMovieHumanBodyToePose";
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
   * Optional named anatomical measurements, the only saved place of each
   * anatomical value. Before shaping, the builder solves every path that
   * `HUMAN_BODY_EXTERIOR_TARGETS` binds along its channel over `shape`
   * (`resolveHumanBodyAnatomy`), so the measurement holds however the other
   * weights change. Admission (`admitHumanBodyDocumentAnatomy`) refuses an
   * unregistered observed value, an exterior target's bound channel also
   * authored in `shape`, a gap path and a path with no consumer. Observed
   * volumes registered by the exact loaded source are retained as raw
   * acquisition records; `dataSourceShapes` reports unavailable acquisition
   * comparison without changing geometry.
   */
  anatomy?: IAutoMovieHumanBodyAnatomicalMeasurements;

  /**
   * Explicit reference-atlas bone inspection, never a request for personal
   * tissue inference. Each selected ID needs a source resource registered to
   * the exact solved shape; unsupported shape or missing source refuses by
   * part. Omission displays no atlas bones. The selected static meshes also
   * enter person export with separate material identities.
   */
  anatomicalInspection?: AutoMovieHumanBodyBoneId[];

  /**
   * Named anatomical joint coordinates of the registered source assembly.
   * Each coordinate must be supported by the owning source joint/profile;
   * absent assembly or conflicting public pose authority refuses. These are
   * performance requests, not source frames or clinical range observations.
   */
  anatomicalMotion?: IAutoMovieHumanBodySourceJointGoal[];

  /**
   * Optional measured spherical humeral-head radii in millimetres. These
   * named articular dimensions override the adult CT population prior on
   * their respective sides. Omission permits that prior only within its
   * observed age and stature domain; a radius is not a shaft contour or a
   * request for the user to place vertices in 3D.
   */
  humeralHeads?: IAutoMovieHumanBodyHumeralHeadRadii;

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
   * Explicit source-reference thigh orientations, only in an exact basis
   * revision that declares their reference-rest-euler convention. These do
   * not reinterpret legacy pose rows; a thigh cannot have both authorities.
   * Explicit zero retains the reference-relative rest relationship and is
   * distinct from omitting the goal. Individual clinical registration and
   * ground/contact support are not supplied by these source-rig goals.
   */
  thighGoals?: IAutoMovieHumanBodyThighGoal[];

  /**
   * Optional toe ray phalanx poses relative to the bone each hangs from,
   * applied on top of the humanoid toes bone's pose; only on a basis that
   * declares `toeRays`. Ranges are `HUMAN_BODY_TOE_RANGE` (a convention).
   */
  toes?: IAutoMovieHumanBodyToePose[];

  /**
   * Optional vertical placement of the lowest performed foot on the fixed
   * source ground plane. Every part and posed bone receives one translation;
   * joint angles remain authored and a higher foot remains airborne. This is
   * geometric placement, not balance, foot orientation or bilateral IK.
   * Omission preserves the source-root pose, including intentional flight.
   */
  groundPlacement?: "lowest-foot";

  /**
   * Optional skin colour by anatomical site: the cheek albedo the face wears,
   * linear RGB, each channel in (0,1]. The skin material's regions are then
   * coloured by site from it (`HUMAN_BODY_SKIN_SITES`), meeting the face in
   * that colour at the neck; omission keeps the one material colour. A colour
   * override of that material in `materials` is refused beside it.
   */
  skinColour?: IAutoMovieHumanBodySkinColour;

  /**
   * Optional micro-relief of the skin: the skin material takes a tiled
   * normal map of its primary lines and pores (`HUMAN_BODY_SKIN_DETAIL`) at
   * `strength` in [0,1], deepening with the document's age; omission keeps
   * the skin smooth.
   */
  skinDetail?: IAutoMovieHumanBodySkinLayerStrength;

  /**
   * Optional uneven tone of the skin: the skin material takes a tiled
   * base-colour map of its two chromophores, melanin and haemoglobin,
   * varying about the site colour (`HUMAN_BODY_SKIN_TONE`) at `strength` in
   * [0,1], less even with the document's age; the base colour is compensated
   * so the skin's mean colour stays the site albedo. Omission keeps the tone
   * even.
   */
  skinTone?: IAutoMovieHumanBodySkinLayerStrength;

  /**
   * Optional superficial veins of the skin, where the basis draws them:
   * they show at `strength` in [0,1] over the lean body independently of
   * skin micro-relief. Tissue the document's body carries over its lean self
   * hides them further, as a vein deeper under the skin takes less light.
   * A request without any declared vein layer is refused. Omission shows none.
   */
  skinVeins?: IAutoMovieHumanBodySkinLayerStrength;

  /**
   * Optional plain default underwear: boxer briefs, or a sports bra and
   * briefs, cut from the posed skin by landmark rules and lifted a few
   * millimetres off it as a part of its own material, in the table's colour
   * or `color` (`HUMAN_BODY_UNDERWEAR`). Omission wears none.
   */
  underwear?: IAutoMovieHumanBodyUnderwear;

  /** Optional linear RGB and roughness, each in [0,1], by existing material ID. */
  materials?: Record<string, IAutoMovieHumanBodyMaterialOverride>;
}
