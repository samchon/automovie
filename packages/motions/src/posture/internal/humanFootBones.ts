import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieMotionHumanBody,
} from "@automovie/interface";

import { HumanFoot } from "./HumanFoot";

/*
 * Collect the actual bones used by displayed foot sockets and sole outlines.
 * Parameter body: The canonical body whose actual surface and outline frames are
 * read.
 * Parameter sides: The feet an observation consumes; both when absent.
 * Returns: A fresh read-only bone-name union for genuine FK preparation;
 * ancestors remain the FK owner's responsibility.
 */
export function humanFootBones(
  body: IAutoMovieMotionHumanBody,
  sides: readonly AutoMovieHumanSide[] = ["left", "right"],
): ReadonlySet<AutoMovieHumanoidBone> {
  const bones: Set<AutoMovieHumanoidBone> = new Set<AutoMovieHumanoidBone>();
  for (const side of sides) {
    for (const socket of HumanFoot.SOCKETS)
      bones.add(
        body.surfaces.sockets[`${socket}${side === "left" ? "Left" : "Right"}`]
          .bone,
      );
    for (const frame of HumanFoot.outline(body, side)) bones.add(frame.bone);
  }
  return bones;
}
