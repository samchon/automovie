import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import { dressCaseWearable } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

import { vclose } from "../../../internal/vclose";

/** An affordance of the item by its id. */
const contact = (
  item: IAutoMovieMotionHumanProp,
  id: string,
): IAutoMovieAffordance =>
  item.affordances!.find((a: IAutoMovieAffordance): boolean => a.id === id)!;

/**
 * `dressCaseWearable` shapes an item to put on as `createWearable` does: a hat
 * lying as it is worn, held at its brim's right side, or spectacles turned to
 * face the body, held at the bridge, each with its `wear` socket.
 *
 * Scenarios:
 *
 * 1. The hat lies at the given place unturned, its 0.3 m by 0.12 m box, its hold
 *    at the brim 0.13 m to its right taken in a precision grip, and its wear
 *    socket 0.11 m up with its `+X` along the hat's `+Z` and `+Y` down.
 * 2. The spectacles are turned half about the vertical, their `+X` to world `-X`,
 *    held 2 cm up at the bridge, worn 16 mm up.
 */
export function test_unit_motions_executable_dress_case_wearable(): void {
  const hat: IAutoMovieMotionHumanProp = dressCaseWearable("hat", {
    x: 1,
    y: 0.8,
    z: 2,
  });
  const wear: IAutoMovieAffordance = contact(hat, "wear");
  TestValidator.predicate(
    "the hat",
    vclose(hat.frame.position, { x: 1, y: 0.8, z: 2 }, 0) &&
      vclose(
        Quaternion.rotateVector(hat.frame.rotation, { x: 1, y: 0, z: 0 }),
        { x: 1, y: 0, z: 0 },
        1e-12,
      ) &&
      vclose(
        contact(hat, "hold").frame.translation,
        { x: -0.13, y: 0.002, z: 0 },
        0,
      ) &&
      contact(hat, "hold").grip === "precision" &&
      vclose(wear.frame.translation, { x: 0, y: 0.11, z: 0 }, 0) &&
      vclose(
        Quaternion.rotateVector(wear.frame.rotation, { x: 1, y: 0, z: 0 }),
        { x: 0, y: 0, z: 1 },
        1e-12,
      ) &&
      vclose(
        Quaternion.rotateVector(wear.frame.rotation, { x: 0, y: 1, z: 0 }),
        { x: 0, y: -1, z: 0 },
        1e-12,
      ),
  );
  const glasses: IAutoMovieMotionHumanProp = dressCaseWearable("glasses", {
    x: 0,
    y: 0,
    z: 0,
  });
  TestValidator.predicate(
    "the spectacles",
    vclose(
      Quaternion.rotateVector(glasses.frame.rotation, { x: 1, y: 0, z: 0 }),
      { x: -1, y: 0, z: 0 },
      1e-12,
    ) &&
      vclose(
        contact(glasses, "hold").frame.translation,
        { x: 0, y: 0.02, z: 0 },
        0,
      ) &&
      vclose(
        contact(glasses, "wear").frame.translation,
        { x: 0, y: 0.016, z: -0.002 },
        0,
      ),
  );
}
