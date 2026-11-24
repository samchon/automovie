import { wardrobeHands } from "@automovie/motions/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * `wardrobeHands.contact` declares a hand's grip on a wearable over shares of
 * the action: a custody grip that carries the prop by default, or one that only
 * steadies it.
 *
 * Scenarios: the left hand's grip on `coat` over 0.2 to 0.6 carries it; the
 * right hand's over 0 to 1, not carrying, steadies it.
 */
export function test_unit_motions_dressing_wardrobe_hands_contact(): void {
  TestValidator.equals(
    "the grips",
    [
      wardrobeHands.contact("coat", "left", 0.2, 0.6),
      wardrobeHands.contact("coat", "right", 0, 1, false),
    ],
    [
      {
        part: "leftHand",
        kind: "grip",
        support: { kind: "prop", subject: "coat", carries: true },
        from: 0.2,
        to: 0.6,
      },
      {
        part: "rightHand",
        kind: "grip",
        support: { kind: "prop", subject: "coat", carries: false },
        from: 0,
        to: 1,
      },
    ],
  );
}