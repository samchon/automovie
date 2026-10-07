import type { AutoMovieHumanBodySide } from "../../anatomy/identity/AutoMovieHumanBodySide";

/**
 * A phalanx bone of one toe ray, beyond the humanoid bone set.
 *
 * The humanoid bones mirror the VRM 1.0 humanoid, which has one `toes` bone
 * per foot and no per-ray bones, so the rays live only inside the human body
 * basis. The hallux has a proximal and a distal phalanx; each lesser toe has
 * a proximal, a middle and a distal phalanx, following the source rig's joint
 * count. The metatarsals stay with the foot bone.
 *
 * @evidence contracts/common.md#principled-implementation The humanoid retarget contract stays intact; ray bones exist only where the body basis consumes them.
 * @evidence contracts/common.md#clear-and-simple-design One template union per side and ray.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No phalanx is invented beyond the source rig's joints.
 * @evidence contracts/common.md#meaningful-documentation States why the rays are outside the humanoid set and which phalanges exist.
 * @evidence contracts/modeling.md#part-identity-and-grouping Each phalanx of each ray has its own closed identity.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines no channel.
 * @evidenceExclude contracts/modeling.md#emitted-geometry It emits no geometry.
 * @evidenceExclude contracts/modeling.md#spatial-conventions An identity carries no spatial value.
 * @evidenceExclude contracts/modeling.md#shared-boundaries It builds no boundary.
 * @evidenceExclude contracts/modeling.md#rendered-observation The body builder's consumer renders the result.
 * @evidence contracts/anatomy.md#anatomical-source Two hallux phalanges and three per lesser toe follow the source rig; biphalangeal lesser-toe variants are not represented.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits no value.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is a bone identity, not an input value.
 * @author Samchon
 */
export type AutoMovieHumanBodyToeBone =
  | `${AutoMovieHumanBodySide}Hallux${"Proximal" | "Distal"}`
  | `${AutoMovieHumanBodySide}${"Second" | "Third" | "Fourth" | "Fifth"}Toe${"Proximal" | "Middle" | "Distal"}`;
