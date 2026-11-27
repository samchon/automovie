import {
  CarBody
} from "../../../../../packages/archetypes/src/vehicles/internal/CarBody";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";

/** Allows the few station additions and subtractions in this layout. */
const LAYOUT_ROUNDING: number = 64 * Number.EPSILON;

/** Van loading and pickup bed dimensions place different parts of the cabin. */
export function test_archetypes_vehicles_car_body_layout(): void {
  const common = {
    wheelbase: 3.5,
    frontOverhang: 1.2,
    length: 6,
    width: 2.2,
    height: 2.6,
    seatHeight: 0.4,
  };
  const van = CarBody.layout("van", 1, {
    ...common,
    sideStep: 0.42,
    loadLength: 3.1,
  });
  TestValidator.predicate(
    "van loading length starts inside the rear panel and ends at the cab",
    nclose(van.front, 2.95, LAYOUT_ROUNDING) &&
      nclose(van.rear, -3.05, LAYOUT_ROUNDING) &&
      nclose(van.back, -3.01, LAYOUT_ROUNDING) &&
      nclose(van.pillar, 0.09, LAYOUT_ROUNDING) &&
      nclose(van.reference.y, 0.82, LAYOUT_ROUNDING),
  );
  const pickup = CarBody.layout("pickup", -1, {
    ...common,
    bedLength: 1.8,
    bedFloor: 0.75,
    bedDepth: 0.5,
  });
  TestValidator.predicate(
    "pickup storage starts behind the cabin and its rail tops the bed sides",
    nclose(pickup.back, -1.25, LAYOUT_ROUNDING) &&
      nclose(pickup.belt, 1.25, LAYOUT_ROUNDING) &&
      van.reference.x > 0 &&
      pickup.reference.x === -van.reference.x,
  );
}
