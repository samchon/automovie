import {
  createCarriage,
  createCart,
  createChariot,
  createHorseCart,
  createLimber,
  createRickshaw,
  createShoppingTrolley,
  createWagon,
  createWheelbarrow,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * `createCart` builds each cart kind as that kind's named producer does.
 *
 * Scenarios, at seed 1038 with id "carrier":
 *
 * 1. Every `createCart.KINDS` entry equals its named producer's model.
 * 2. A trolley and a wheelbarrow declare their own handle patterns: handle,
 *    leftHandle, rightHandle, load; and leftHandle, rightHandle, load.
 */
export function test_unit_archetypes_vehicles_create_cart(): void {
  const id: string = "carrier";
  const seed: number = 1038;
  const named: Record<createCart.Kind, ReturnType<typeof createCart>> = {
    trolley: createShoppingTrolley({ id }, seed),
    wheelbarrow: createWheelbarrow({ id }, seed),
    cart: createHorseCart({ id }, seed),
    rickshaw: createRickshaw({ id }, seed),
    chariot: createChariot({ id }, seed),
    limber: createLimber({ id }, seed),
    wagon: createWagon({ id }, seed),
    carriage: createCarriage({ id }, seed),
  };
  for (const kind of createCart.KINDS)
    TestValidator.equals(
      `${kind} equals its named producer`,
      JSON.stringify(createCart({ id, kind }, seed)),
      JSON.stringify(named[kind]),
    );
  TestValidator.equals(
    "handle patterns",
    [
      named.trolley.affordances.map((contact): string => contact.id),
      named.wheelbarrow.affordances.map((contact): string => contact.id),
    ],
    [
      ["handle", "leftHandle", "rightHandle", "load"],
      ["leftHandle", "rightHandle", "load"],
    ],
  );
}
