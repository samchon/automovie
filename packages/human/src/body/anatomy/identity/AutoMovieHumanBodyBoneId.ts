import type { AutoMovieHumanBodySide } from "./AutoMovieHumanBodySide";

type AxialVertebraId =
  | `c${1 | 2 | 3 | 4 | 5 | 6 | 7}`
  | `t${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`
  | `l${1 | 2 | 3 | 4 | 5}`;

type FingerBoneId<Side extends AutoMovieHumanBodySide> =
  | `${Side}Thumb${"FirstMetacarpal" | "ProximalPhalanx" | "DistalPhalanx"}`
  | `${Side}${"IndexFinger" | "MiddleFinger" | "RingFinger" | "LittleFinger"}${"Metacarpal" | "ProximalPhalanx" | "MiddlePhalanx" | "DistalPhalanx"}`;

type ToeBoneId<Side extends AutoMovieHumanBodySide> =
  | `${Side}Hallux${"FirstMetatarsal" | "ProximalPhalanx" | "DistalPhalanx"}`
  | `${Side}${"SecondToe" | "ThirdToe" | "FourthToe" | "FifthToe"}${"Metatarsal" | "ProximalPhalanx" | "MiddlePhalanx" | "DistalPhalanx"}`;

/**
 * Closed skeletal identity for a generated body bone, never a vertex label.
 *
 * Midline bones occur once, paired bones carry the person's anatomical side,
 * and thumb/hallux IDs cannot name a nonexistent middle phalanx. Repeated
 * digits can share generator code while owning separate generated solids.
 * The cranial skeleton retains its constituent bones instead of one skull
 * owner; the mandible and hyoid remain separate from that fixed assembly.
 *
 * @evidence contracts/common.md#principled-implementation Midline, paired and digit-specific identities distinguish independently generated bones without allowing a thumb or hallux middle phalanx.
 * @evidence contracts/common.md#clear-and-simple-design One closed vocabulary is shared by generated parts, source bindings and the anatomical rig.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Cranial constituents remain separate identities rather than a single skull label hiding several bones.
 * @evidence contracts/common.md#meaningful-documentation States the anatomical side and digit distinctions and the separate mandible and hyoid owners.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each named bone has one identity; the skull's constituent identities retain separate source and rest owners.
 * @evidenceExclude contracts/modeling.md#parameter-channels This vocabulary defines no anatomical control or offset.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The generated and source part owners emit geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions An identity carries no coordinate or unit.
 * @evidenceExclude contracts/modeling.md#shared-boundaries The rig and surface owners define attachments.
 * @evidenceExclude contracts/modeling.md#rendered-observation The identity vocabulary displays no geometry; its part consumers own observation.
 * @evidenceExclude contracts/anatomy.md#anatomical-source Identities carry no measurement, proportion or tissue behavior.
 * @evidenceExclude contracts/anatomy.md#permitted-range An identity admits no numerical or physiological state.
 * @evidenceExclude contracts/anatomy.md#parametric-authority These are generated-part names, not shape measurements or personal vertices.
 *
 * @author Samchon
 */
export type AutoMovieHumanBodyBoneId =
  | "frontalBone"
  | "occipitalBone"
  | "sphenoidBone"
  | "ethmoid"
  | "vomer"
  | "mandible"
  | "hyoid"
  | "sacrum"
  | "coccyx"
  | "sternum"
  | AxialVertebraId
  | `${AutoMovieHumanBodySide}${
      | "CoxalBone"
      | "TemporalBone"
      | "ParietalBone"
      | "Maxilla"
      | "LacrimalBone"
      | "NasalBone"
      | "PalatineBone"
      | "ZygomaticBone"
      | "InferiorNasalConcha"
      | "Clavicle"
      | "Scapula"
      | "Humerus"
      | "Radius"
      | "Ulna"
      | "Femur"
      | "Patella"
      | "Tibia"
      | "Fibula"
      | "Talus"
      | "Calcaneus"
      | "Scaphoid"
      | "Lunate"
      | "Triquetrum"
      | "Pisiform"
      | "Trapezium"
      | "Trapezoid"
      | "Capitate"
      | "Hamate"
      | "Navicular"
      | "Cuboid"
      | "MedialCuneiform"
      | "IntermediateCuneiform"
      | "LateralCuneiform"}`
  | `${AutoMovieHumanBodySide}Rib${1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12}`
  | FingerBoneId<AutoMovieHumanBodySide>
  | ToeBoneId<AutoMovieHumanBodySide>;
