import {
  selectEquineTack
} from "../../../../../packages/archetypes/src/animals/fittings/selectEquineTack";
import { TestValidator } from "@nestia/e2e";

/**
 * Only the pack tack needs a croup clearance draw.
 *
 * Scenarios:
 *
 * 1. Saddle, harness and bare tack are ready without a croup clearance.
 * 2. The pack tack passes its drawn clearance to assembly. A missing value refuses
 *    before placing the croup piece.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes ordinary tack routes and the pack's required croup clearance.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual selection function on authored saddle, harness, bare and pack values. Verifies preservation of the pack draw and refusal when missing.
 * @evidence contracts/development/testing.md#independent-expectations The fixture selects ordinary variants without a clearance and sets a literal clearance for the pack. That authored value must be forwarded unchanged.
 */
export function test_archetypes_internal_select_equine_tack(): void {
  TestValidator.equals(
    "saddle needs no pack clearance",
    selectEquineTack("saddle", undefined, "horse"),
    { kind: "saddle" },
  );
  TestValidator.equals(
    "harness needs no pack clearance",
    selectEquineTack("harness", undefined, "horse"),
    { kind: "harness" },
  );
  TestValidator.equals(
    "bare model needs no pack clearance",
    selectEquineTack("bare", undefined, "horse"),
    { kind: "bare" },
  );
  TestValidator.equals(
    "pack carries its own draw",
    selectEquineTack("pack", 1 / 16, "horse"),
    { kind: "pack", croupClearance: 1 / 16 },
  );
  TestValidator.error("pack requires the draw", (): unknown =>
    selectEquineTack("pack", undefined, "horse"),
  );
}
