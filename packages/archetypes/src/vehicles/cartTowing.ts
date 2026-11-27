import type { AutoMovieArchetype } from "../core";
import type { ArchetypeTowing } from "../core/ArchetypeTowing";
import { towingAxle } from "../core/towingAxle";
import type { AutoMovieArchetypeCart } from "./AutoMovieArchetypeCart";

/**
 * Read the producer's wheel/steering/drawbar support for generic towing.
 *
 * @param cart CreateCart output in neutral steering/drawbar pose, with its
 *   producer-declared wheel roles.
 * @returns Independent neutral model-space metre points for single-axle body
 *   pitch, or level front/rear support with the pole hinge.
 * @throws {RangeError} For another producer, invalid wheel-axis data or a front
 *   steering pivot outside its axle.
 * @throws {AutoMovieArchetypeRefusal} If a required wheel/steering affordance
 *   is absent, including a pushed kind without these towing roles.
 */
export function cartTowing(
  cart: AutoMovieArchetype<AutoMovieArchetypeCart.Affordance, AutoMovieArchetypeCart.Dimension>,
): ArchetypeTowing.Support<AutoMovieArchetypeCart.Affordance> {
  if (cart.archetype !== "cart")
    throw new RangeError(
      "Cart towing geometry requires the actual cart producer",
    );
  const steered: boolean = cart.affordances.some(
    (contact: { id: string }): boolean => contact.id === "frontAxle",
  );
  if (!steered)
    return {
      kind: "singleAxle",
      axle: towingAxle(
        cart.affordance("leftSpin"),
        cart.affordance("rightSpin"),
      ),
    };
  const front: ReturnType<typeof towingAxle> = towingAxle(
    cart.affordance("frontLeftSpin"),
    cart.affordance("frontRightSpin"),
  );
  const pivot: typeof front = cart.affordance("frontAxle").frame.translation;
  if (front.x !== pivot.x || front.y !== pivot.y || front.z !== pivot.z)
    throw new RangeError(
      "The actual front steering pivot must lie on the declared wheel axle",
    );
  return {
    kind: "fixedGround",
    axle: towingAxle(
      cart.affordance("rearLeftSpin"),
      cart.affordance("rearRightSpin"),
    ),
    front: { pivot: { ...pivot }, turn: "frontAxle" },
    pitch: "drawbarPitch",
  };
}
