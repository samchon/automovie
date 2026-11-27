import type { AutoMovieHumanoidBone, AutoMovieHumanSide } from "@automovie/interface";

export namespace HumanFitVariablesData {
  /*
   * The joint angles of the whole body a fit moves: the trunk, the neck, the
   * head and the four limbs, each a bone and its axis (flexion, abduction,
   * twist). The trunk is the spine and the chest: the polygon man's rig carries
   * spine, chest and neck and no `upperChest`, which the range table lists for
   * rigs that have one, so it is not a variable here.
   */
  export const ANGLES: readonly (readonly [AutoMovieHumanoidBone, ANGLESItem])[] = [
    ["spine", 0],
    ["spine", 1],
    ["spine", 2],
    ["chest", 0],
    ["chest", 1],
    ["neck", 0],
    ["neck", 1],
    ["head", 0],
    ...(["left", "right"] as const).flatMap(
      (
        side: AutoMovieHumanSide,
      ): (readonly [AutoMovieHumanoidBone, ANGLESItemResult])[] => [
        [`${side}UpperLeg`, 0],
        [`${side}UpperLeg`, 1],
        [`${side}UpperLeg`, 2],
        [`${side}LowerLeg`, 0],
        [`${side}Foot`, 0],
        [`${side}Foot`, 1],
        [`${side}Toes`, 0],
        [`${side}UpperArm`, 0],
        [`${side}UpperArm`, 1],
        [`${side}UpperArm`, 2],
        [`${side}LowerArm`, 0],
        [`${side}Hand`, 0],
        [`${side}Hand`, 1],
      ],
    ),
  ];

  /*
   * The alternatives of `ANGLESItemResult`'s site.
   */
  export type ANGLESItemResult = 0 | 1 | 2;

  /*
   * The alternatives of `ANGLESItem`'s site.
   */
  export type ANGLESItem = 0 | 1 | 2;
}
