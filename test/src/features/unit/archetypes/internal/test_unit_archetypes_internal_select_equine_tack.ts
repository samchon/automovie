import { selectEquineTack } from "@automovie/archetypes/internal";
import { TestValidator } from "@nestia/e2e";

/**
 * Only the pack tack needs a croup clearance draw.
 *
 * Scenarios:
 *
 * 1. Saddle, harness and bare tack are ready without a croup clearance.
 * 2. The pack tack passes its drawn clearance to assembly. A missing value
 *    refuses before placing the croup piece.
 */
export function test_unit_archetypes_internal_select_equine_tack(): void {
  TestValidator.equals("saddle needs no pack clearance", selectEquineTack("saddle", undefined, "horse"), {kind: "saddle"});
  TestValidator.equals("harness needs no pack clearance", selectEquineTack("harness", undefined, "horse"), {kind: "harness"});
  TestValidator.equals("bare model needs no pack clearance", selectEquineTack("bare", undefined, "horse"), {kind: "bare"});
  TestValidator.equals("pack carries its own draw", selectEquineTack("pack", 1 / 16, "horse"), {kind: "pack", croupClearance: 1 / 16});
  TestValidator.error("pack requires the draw", (): unknown => selectEquineTack("pack", undefined, "horse"));
}
