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
 * @evidence contracts/common.md#principled-implementation Template-literal unions enumerate side and phalanx identity, with two hallux segments and three for each lesser toe.
 * @evidence contracts/common.md#clear-and-simple-design Toe-ray identities extend the internal body rig without adding invented VRM humanoid slots.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The existing source rig's segment counts are explicit; metatarsals retain foot ownership.
 * @evidence contracts/common.md#meaningful-documentation The prose explains the humanoid boundary, segment counts and metatarsal ownership.
 * @evidenceExclude contracts/performance.md#efficient-algorithms The toe phalanx identity union declares data and signatures without implementing runtime algorithms.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The toe phalanx identity union declaration shares no computations across consumers.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The toe phalanx identity union type has no runtime acquisition, retention or release operation.
 *
 * @author Samchon
 */
export type AutoMovieHumanBodyToeBone =
  | `${AutoMovieHumanBodySide}Hallux${"Proximal" | "Distal"}`
  | `${AutoMovieHumanBodySide}${"Second" | "Third" | "Fourth" | "Fifth"}Toe${"Proximal" | "Middle" | "Distal"}`;
