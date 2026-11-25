import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanToolWork,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  toolCaseContact,
  toolCaseHeld,
  toolCasePot,
} from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** The scenarios of `test_unit_motions_executable_tool_case_contact`. */
namespace ScenarioToolCaseContact {
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
}

/** The scenarios of `test_unit_motions_executable_tool_case_held`. */
namespace ScenarioToolCaseHeld {
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
}

/** The scenarios of `test_unit_motions_executable_tool_case_pot`. */
namespace ScenarioToolCasePot {
  /**
   * `toolCasePot` stands a vessel as `createVessel` does: its rim 0.2 m up and
   * 0.24 m across, its inside floor just above the base, both facing up.
   *
   * Scenario: a pot on a counter at 0.9 m stands unturned, its rim 0.2 m and its
   * floor 5 mm above the base, the floor 1 cm narrower than the rim, both
   * contacts' `+Y` up.
   */
  export function test_unit_motions_executable_tool_case_pot(): void {
    const pot: IAutoMovieMotionHumanProp = toolCasePot({
      x: 0,
      y: 0.9,
      z: 0.5,
    });
    const rim: IAutoMovieAffordance = pot.affordances!.find(
      (a: IAutoMovieAffordance): boolean => a.id === "rim",
    )!;
    const inside: IAutoMovieAffordance = pot.affordances!.find(
      (a: IAutoMovieAffordance): boolean => a.id === "inside",
    )!;
    TestValidator.predicate(
      "the pot",
      vclose(pot.frame.position, { x: 0, y: 0.9, z: 0.5 }, 0) &&
        vclose(rim.frame.translation, { x: 0, y: 0.2, z: 0 }, 0) &&
        vclose(inside.frame.translation, { x: 0, y: 0.005, z: 0 }, 0) &&
        rim.width === 0.24 &&
        inside.width === 0.23 &&
        vclose(
          Quaternion.rotateVector(rim.frame.rotation, { x: 0, y: 1, z: 0 }),
          { x: 0, y: 1, z: 0 },
          1e-12,
        ) &&
        vclose(
          Quaternion.rotateVector(inside.frame.rotation, { x: 0, y: 1, z: 0 }),
          { x: 0, y: 1, z: 0 },
          1e-12,
        ),
    );
  }
}

/**
 * The `tool_cases` family's own logic, one scenario group per namespace above:
 * each group's scenarios are documented on it.
 */
export function test_unit_motions_executable_tool_cases(): void {
  ScenarioToolCaseContact.test_unit_motions_executable_tool_case_contact();
  ScenarioToolCaseHeld.test_unit_motions_executable_tool_case_held();
  ScenarioToolCasePot.test_unit_motions_executable_tool_case_pot();
}
