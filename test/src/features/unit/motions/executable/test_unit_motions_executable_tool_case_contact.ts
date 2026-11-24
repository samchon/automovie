import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { toolCaseContact } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/**
 * `toolCaseContact` makes a contact frame at a point whose `+Y` is `out` and
 * whose `+X` lies along `along`, `+Z` completing the right-handed basis.
 *
 * Scenarios:
 *
 * 1. A face at (0, 0.3, 0) facing +Z and running along +X has its +Y turned to +Z,
 *    its +X kept and its +Z turned to -Y.
 * 2. Extra fields are carried.
 */
export function test_unit_motions_executable_tool_case_contact(): void {
  const face: IAutoMovieAffordance = toolCaseContact(
    "face",
    "surface",
    { x: 0, y: 0.3, z: 0 },
    { x: 0, y: 0, z: 1 },
    { x: 1, y: 0, z: 0 },
    { width: 0.1 },
  );
  const axis = (v: IAutoMovieVector3): IAutoMovieVector3 =>
    Quaternion.rotateVector(face.frame.rotation, v);
  TestValidator.predicate(
    "the contact's basis",
    vclose(face.frame.translation, { x: 0, y: 0.3, z: 0 }, 1e-12) &&
      vclose(axis({ x: 0, y: 1, z: 0 }), { x: 0, y: 0, z: 1 }, 1e-12) &&
      vclose(axis({ x: 1, y: 0, z: 0 }), { x: 1, y: 0, z: 0 }, 1e-12) &&
      vclose(axis({ x: 0, y: 0, z: 1 }), { x: 0, y: -1, z: 0 }, 1e-12) &&
      face.width === 0.1 &&
      face.id === "face",
  );
}
