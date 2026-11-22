import type { AutoMovieArchetype } from "../core";
import type { ArchetypeTowing } from "../core/ArchetypeTowing";
import { towingAxle } from "../core/towingAxle";
import type { createCart } from "./createCart";

/**
 * Read the producer's actual wheel/steering/drawbar support for generic towing.
 *
 * @param cart Actual createCart output in neutral steering/drawbar pose, with its producer-declared wheel roles.
 * @returns Independent neutral model-space metre points for single-axle body pitch, or level front/rear support with the actual pole hinge.
 * @throws {RangeError} For another producer, invalid wheel-axis data or a front steering pivot outside its actual axle.
 * @throws {AutoMovieArchetypeRefusal} If a required wheel/steering affordance is absent, including a pushed kind without these towing roles.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names actual source wheel/steering/pole roles, supported mechanical freedoms, neutral input and independent returned geometry.
 * @evidence contracts/development/implementation.md#principled-implementation The producer knows its own closed affordance roles: two-wheel centres supply the single axle; rear wheel centres plus the actual frontAxle frame and drawbarPitch hinge describe a grounded four-wheeler.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit producer identity, inspect the producer-declared steering role, then delegate actual wheel-axis admission and snapshot the declared geometry.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No dimensions table rebuilds different centres, no part-distance heuristic or per-kind height offset reaches the generic towing law.
 * @evidence contracts/development/implementation.md#efficient-algorithms O(A) work over A source contacts: one presence scan and a fixed number of linear affordance lookups, with constant auxiliary storage.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work towingAxle owns shared actual-wheel admission; generic towing owns all height/pitch equations.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns independent point/id records and retains no source model or mutable frame alias.
 */
export function cartTowing(
  cart: AutoMovieArchetype<createCart.Affordance, createCart.Dimension>,
): ArchetypeTowing.Support<createCart.Affordance> {
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
