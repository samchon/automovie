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
 * @author Samchon
 */
export type AutoMovieHumanBodyToeBone =
  | `${AutoMovieHumanBodySide}Hallux${"Proximal" | "Distal"}`
  | `${AutoMovieHumanBodySide}${"Second" | "Third" | "Fourth" | "Fifth"}Toe${"Proximal" | "Middle" | "Distal"}`;
