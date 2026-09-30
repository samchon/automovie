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
 * @author Samchon
 */
export type AutoMovieHumanBodyBoneId =
  | "sacrum"
  | "coccyx"
  | "sternum"
  | AxialVertebraId
  | `${AutoMovieHumanBodySide}${
      | "CoxalBone"
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
