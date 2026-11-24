import { Quaternion } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieMotionHumanProp,
} from "@automovie/interface";
import { HumanRefusal, wardrobeHands } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `wardrobeHands.site` finds a wearable's declared contact by id, and by kind
 * when one is asked, refusing on `opening` a contact it does not declare.
 *
 * Scenarios, a jacket declaring a `collar` handle and a `sleeve` aperture:
 *
 * 1. `collar` is found, and so is `sleeve` asked as an aperture.
 * 2. `collar` asked as an aperture, and an undeclared `hood`, are refused.
 */
export function test_unit_motions_dressing_wardrobe_hands_site(): void {
  const point = (
    id: string,
    kind: IAutoMovieAffordance["kind"],
  ): IAutoMovieAffordance => ({
    id,
    kind,
    frame: {
      translation: { x: 0, y: 0, z: 0 },
      rotation: Quaternion.identity(),
      scale: { x: 1, y: 1, z: 1 },
    },
    extent: null,
  });
  const jacket: IAutoMovieMotionHumanProp = {
    subject: "jacket",
    frame: { position: { x: 0, y: 1, z: 0 }, rotation: Quaternion.identity() },
    points: {},
    affordances: [point("collar", "handle"), point("sleeve", "aperture")],
  };
  TestValidator.equals(
    "found",
    [
      wardrobeHands.site(jacket, "collar").id,
      wardrobeHands.site(jacket, "sleeve", "aperture").kind,
    ],
    ["collar", "aperture"],
  );
  const refused = (
    id: string,
    kind?: IAutoMovieAffordance["kind"],
  ): boolean => {
    try {
      wardrobeHands.site(jacket, id, kind);
      return false;
    } catch (error: unknown) {
      return error instanceof HumanRefusal && error.axis === "opening";
    }
  };
  TestValidator.predicate(
    "refused",
    refused("collar", "aperture") && refused("hood"),
  );
}
