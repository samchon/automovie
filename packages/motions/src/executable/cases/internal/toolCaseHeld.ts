import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanToolWork,
  IAutoMovieVector3,
} from "@automovie/interface";

import { toolCaseContact } from "./toolCaseContact";

/**
 * A one-hand tool shaped as `createTool` shapes it, lying level on a bench with
 * its working end ahead: a 0.3 m handle along its `+Y`, its `grip` taken from
 * `-Z` near the butt and its `face` at the working end (a hammer's on the
 * head's `+Z` side, a saw's teeth along `+Z`, a screwdriver's tip and a spoon's
 * bowl).
 *
 * @param kind The work the tool serves.
 * @param at Where its butt lies, world metres.
 * @returns The tool.
 */
export function toolCaseHeld(
  kind: IAutoMovieMotionHumanToolWork.Kind,
  at: IAutoMovieVector3,
): IAutoMovieMotionHumanProp {
  const x: IAutoMovieVector3 = { x: 1, y: 0, z: 0 };
  const y: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
  const z: IAutoMovieVector3 = { x: 0, y: 0, z: 1 };
  const face: IAutoMovieAffordance =
    kind === "hammer"
      ? toolCaseContact("face", "surface", { x: 0, y: 0.285, z: 0.055 }, z, x)
      : kind === "saw"
        ? toolCaseContact("face", "ledge", { x: 0, y: 0.2, z: 0.05 }, z, y)
        : kind === "screwdriver"
          ? toolCaseContact("face", "surface", { x: 0, y: 0.3, z: 0 }, y, x)
          : toolCaseContact(
              "face",
              "surface",
              { x: 0, y: 0.27, z: 0.001 },
              z,
              x,
            );
  return {
    subject: "tool",
    frame: {
      position: at,
      rotation: Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, 90),
    },
    points: {},
    shapes: [
      {
        id: "handle",
        material: "wood",
        transform: {
          position: { x: 0, y: 0.15, z: 0 },
          rotation: Quaternion.identity(),
        },
        kind: "capsule",
        radius: 0.015,
        halfLength: 0.135,
      },
    ],
    affordances: [
      toolCaseContact(
        "grip",
        "handle",
        { x: 0, y: 0.06, z: 0 },
        { x: 0, y: 0, z: -1 },
        y,
        { grip: "power", aperture: 0.03, length: 0.1 },
      ),
      face,
    ],
  };
}
