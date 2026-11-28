import {
  ArchetypeFractureEnergy
} from "../../../../../packages/archetypes/src/core/internal/ArchetypeFractureEnergy";
import { TestValidator } from "@nestia/e2e";

/**
 * `ArchetypeFractureEnergy` decides exactly whether an energy suffices for a
 * momentum p on a mass m, that is whether |p|^2 <= 2 m E, and gives the least
 * sufficient binary64 energy otherwise.
 *
 * Scenarios:
 *
 * 1. Momentum (3, 4, 0) on mass 2 needs E = 25 / 4 = 6.25, so 6.25 suffices.
 * 2. Energy 6 does not, and the least sufficient energy is exactly 6.25.
 * 3. No momentum always suffices.
 * 4. A nonpositive mass is refused.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States exact energy admission, the insufficient case, zero momentum and invalid mass.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the real comparison on the exact threshold and below it, then checks reported minimum energy, a zero-momentum case and refusal of zero mass.
 * @evidence contracts/development/testing.md#independent-expectations The authored momentum (3, 4, 0) has squared magnitude 25. With mass 2, kinetic energy is exactly 6.25.
 */
export function test_archetypes_internal_fracture_energy(): void {
  const momentum = { x: 3, y: 4, z: 0 };
  TestValidator.equals(
    "just enough",
    ArchetypeFractureEnergy(6.25, 2, momentum),
    { sufficient: true },
  );
  TestValidator.equals(
    "too little",
    ArchetypeFractureEnergy(6, 2, momentum),
    { sufficient: false, minimum: 6.25 },
  );
  TestValidator.equals(
    "no momentum",
    ArchetypeFractureEnergy(0, 2, { x: 0, y: 0, z: 0 }),
    { sufficient: true },
  );
  TestValidator.error("a zero mass", (): unknown =>
    ArchetypeFractureEnergy(1, 0, momentum),
  );
}
