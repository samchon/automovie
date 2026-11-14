import { createAppliance, createSanitary } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a part following its articulation. */
const MM: number = 1e-3;

/**
 * The fixtures' and appliances' doors and lids move the way the thing does: a toilet lid lowers onto its seat and side-hung doors swing out toward the side they are opened from, each carrying its handle; a door no source gives an opening for stays shut.
 *
 * Scenarios:
 * 1. A toilet's lid, standing open at rest, lies on the seat ring at its full travel: its underside at the seat's height and its far edge at the bowl's front, within a millimetre.
 * 2. A fridge's door at its full travel, 90 degrees, stands out toward `+Z` from its `+X` hinge edge by the fridge's width, its handle with it; the freezer door at rest is unmoved.
 * 3. A washing machine's door at its full travel, 90 degrees, stands out toward `+Z` from its `-X` hinge edge by its own width.
 * 4. A microwave's door states no travel: any travel but 0 is refused.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Poses produced archetypes and measures the moved colliders; a lid that lifts instead of lowering, a door that swings into the cabinet or about the wrong edge, a handle left behind, or a door opened past what its source gives is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations Expected places come from each thing's own drawn dimensions and the geometry of a quarter turn about the door's edge (a leaf of width `w` turned square reaches `w` out), not from the articulation code; the 90 degrees are the makers' and the millimetre is #3368's tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases A lid lowered from open, side-hung doors on both edges, a moved and an unmoved door on one model, and a door that does not open; the shared articulation rules belong to `test_archetype_contract_articulation`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_fixture_articulation(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The toilet's lid.
  const toilet: ReturnType<typeof createSanitary> = createSanitary(
    { kind: "toilet" },
    6,
  );
  const seat: number = toilet.dimensions.seat!;
  const closed: ReturnType<typeof createSanitary> = toilet.articulate({
    lid: toilet.affordance("lid").travel!,
  });
  near(
    "the lowered lid's underside",
    archetypeExtent(closed, "y", ["lid"]).low,
    seat,
  );
  near(
    "the lowered lid's far edge",
    archetypeExtent(closed, "z", ["lid"]).high,
    toilet.dimensions.length!,
  );
  if (!(archetypeExtent(toilet, "y", ["lid"]).high > seat + 0.3))
    findings.push("the lid does not stand open at rest");

  // 2. The fridge's doors.
  const fridge: ReturnType<typeof createAppliance> = createAppliance(
    { kind: "refrigerator" },
    6,
  );
  const width: number = fridge.dimensions.width!;
  const face: number = fridge.affordance("fridgeDoor").frame.translation.z;
  if (fridge.affordance("fridgeDoor").travel !== 90)
    findings.push(
      `the fridge door opens ${fridge.affordance("fridgeDoor").travel} degrees, the maker's 90 expected`,
    );
  const opened: ReturnType<typeof createAppliance> = fridge.articulate({
    fridgeDoor: 90,
  });
  near(
    "the open fridge door's reach",
    archetypeExtent(opened, "z", ["fridgeDoor-leaf"]).high,
    face + width,
  );
  near(
    "the open fridge door's hinge edge",
    archetypeExtent(opened, "x", ["fridgeDoor-leaf"]).high,
    width / 2,
  );
  if (
    !(
      opened.affordance("fridgeHandle").frame.translation.z >
      face + 0.5 * width
    )
  )
    findings.push("the fridge handle stays behind its open door");
  near(
    "the freezer door at rest",
    archetypeExtent(opened, "z", ["freezerDoor-leaf"]).high,
    face,
  );

  // 3. The washer's door.
  const washer: ReturnType<typeof createAppliance> = createAppliance(
    { kind: "washingMachine" },
    6,
  );
  const at: IAutoMovieVector3 = washer.affordance("door").frame.translation;
  const shut: { low: number; high: number; size: number } = archetypeExtent(
    washer,
    "x",
    ["door-ring"],
  );
  near("the washer's hinge edge", shut.low, at.x);
  near(
    "the open washer door's reach",
    archetypeExtent(washer.articulate({ door: 90 }), "z", ["door-ring"]).high,
    at.z + shut.size,
  );

  // 4. The microwave's door does not open.
  const microwave: ReturnType<typeof createAppliance> = createAppliance(
    { kind: "microwave" },
    6,
  );
  try {
    microwave.articulate({ door: 30 });
    findings.push("the microwave's door opened without a source for its angle");
  } catch {
    // Refused, as a door that states no travel is.
  }
  TestValidator.equals(
    "fixture and appliance doors move as the things do",
    findings,
    [],
  );
}
