import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanToolWork,
  IAutoMovieVector3,
} from "@automovie/interface";
import { toolCaseHeld } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** The working face of a tool of the kind. */
const face = (kind: IAutoMovieMotionHumanToolWork.Kind): IAutoMovieVector3 =>
  toolCaseHeld(kind, { x: 0, y: 0, z: 0 }).affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "face",
  )!.frame.translation;

/**
 * `toolCaseHeld` shapes a one-hand tool as `createTool` does, lying level with
 * its 0.3 m handle along its own `+Y`, turned a quarter about `+X` so that axis
 * points ahead (world `+Z`); its grip near the butt and its face at the working
 * end.
 *
 * Scenarios:
 *
 * 1. The handle's axis lies along world `+Z`, the butt where it is placed, the
 *    power grip 6 cm up the handle, 3 cm across.
 * 2. A hammer's face is on the head 0.285 m up and 5.5 cm aside, a screwdriver's
 *    tip at the 0.3 m end, a saw's teeth 0.2 m up.
 */
export function test_unit_motions_executable_tool_case_held(): void {
  const tool: IAutoMovieMotionHumanProp = toolCaseHeld("hammer", {
    x: 0.3,
    y: 0.9,
    z: 0.4,
  });
  const grip: IAutoMovieAffordance = tool.affordances!.find(
    (a: IAutoMovieAffordance): boolean => a.id === "grip",
  )!;
  TestValidator.predicate(
    "the handle ahead",
    vclose(tool.frame.position, { x: 0.3, y: 0.9, z: 0.4 }, 0) &&
      vclose(
        Quaternion.rotateVector(tool.frame.rotation, { x: 0, y: 1, z: 0 }),
        { x: 0, y: 0, z: 1 },
        1e-12,
      ) &&
      vclose(grip.frame.translation, { x: 0, y: 0.06, z: 0 }, 0) &&
      grip.grip === "power" &&
      grip.aperture === 0.03,
  );
  TestValidator.predicate(
    "the working faces",
    vclose(face("hammer"), { x: 0, y: 0.285, z: 0.055 }, 0) &&
      vclose(face("screwdriver"), { x: 0, y: 0.3, z: 0 }, 0) &&
      vclose(face("saw"), { x: 0, y: 0.2, z: 0.05 }, 0),
  );
}
