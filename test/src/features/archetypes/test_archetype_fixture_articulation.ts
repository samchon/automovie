import { createAppliance, createSanitary } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a part following its articulation. */
const MM: number = 1e-3;

/**
 * The fixtures' and appliances' doors and lids move the way the thing does: a toilet lid lowers onto its seat, an oven door drops forward to level, and side-hung doors swing out toward the side they are opened from, each carrying its handle.
 *
 * Scenarios:
 * 1. A toilet's lid, standing open at rest, lies on the seat ring at its full travel: its underside at the seat's height and its far edge at the bowl's front, within a millimetre; the trip lever pressed its full travel goes down by that travel.
 * 2. A cooker's oven door at a quarter turn lies level, its underside at its hinge's height, reaching out from the front by the door's height, and its handle is carried forward and down with it.
 * 3. A fridge's door at 90 degrees stands out toward `+Z` from its `+X` hinge edge by the fridge's width, its handle with it; the freezer door at rest is unmoved.
 * 4. A microwave's and a washing machine's doors at 90 degrees stand out toward `+Z` from their `-X` hinge edge by their own width.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Poses produced archetypes and measures the moved colliders; a lid that lifts instead of lowering, an oven door that swings up or sideways, a door that swings into the cabinet or about the wrong edge, or a handle left behind is caught with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations Expected places come from each thing's own drawn dimensions and the geometry of a quarter turn about the door's edge (a leaf of width `w` turned square reaches `w` out), not from the articulation code; the millimetre is #3368's tolerance.
 * @evidence contracts/development/testing.md#distinguishing-cases A lid lowered from open, a bottom-hinged door, side-hung doors on both edges, a moved and an unmoved door on one model, and a pressed lever; the shared articulation rules belong to `test_archetype_contract_articulation`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_fixture_articulation(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The toilet's lid and lever.
  const toilet: ReturnType<typeof createSanitary> = createSanitary(
    { kind: "toilet" },
    6,
  );
  const seat: number = toilet.dimensions.seat!;
  const closed: ReturnType<typeof createSanitary> = toilet.articulate({
    lid: toilet.affordance("lid").travel!,
  });
  near("the lowered lid's underside", archetypeExtent(closed, "y", ["lid"]).low, seat);
  near(
    "the lowered lid's far edge",
    archetypeExtent(closed, "z", ["lid"]).high,
    toilet.dimensions.length!,
  );
  if (!(archetypeExtent(toilet, "y", ["lid"]).high > seat + 0.3))
    findings.push("the lid does not stand open at rest");
  const press: number = toilet.affordance("flush").travel!;
  near(
    "the pressed lever",
    archetypeExtent(toilet, "y", ["lever"]).low -
      archetypeExtent(toilet.articulate({ flush: press }), "y", ["lever"]).low,
    press,
  );

  // 2. The oven door.
  const cooker: ReturnType<typeof createAppliance> = createAppliance(
    { kind: "cooker" },
    6,
  );
  const hinge: IAutoMovieVector3 =
    cooker.affordance("ovenDoor").frame.translation;
  const door: { low: number; high: number; size: number } = archetypeExtent(
    cooker,
    "y",
    ["oven-door"],
  );
  const dropped: ReturnType<typeof createAppliance> = cooker.articulate({
    ovenDoor: 90,
  });
  near(
    "the dropped door's underside",
    archetypeExtent(dropped, "y", ["oven-door"]).low,
    hinge.y,
  );
  near(
    "the dropped door's reach",
    archetypeExtent(dropped, "z", ["oven-door"]).high,
    hinge.z + door.size,
  );
  const handle: IAutoMovieVector3 =
    dropped.affordance("ovenHandle").frame.translation;
  if (!(handle.z > hinge.z + 0.5 * door.size && handle.y < hinge.y))
    findings.push(
      `the oven handle is left at (${handle.y}, ${handle.z}) with the door dropped`,
    );

  // 3. The fridge's doors.
  const fridge: ReturnType<typeof createAppliance> = createAppliance(
    { kind: "refrigerator" },
    6,
  );
  const width: number = fridge.dimensions.width!;
  const face: number = fridge.affordance("fridgeDoor").frame.translation.z;
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
  if (!(opened.affordance("fridgeHandle").frame.translation.z > face + 0.5 * width))
    findings.push("the fridge handle stays behind its open door");
  near(
    "the freezer door at rest",
    archetypeExtent(opened, "z", ["freezerDoor-leaf"]).high,
    face,
  );

  // 4. The microwave's and the washer's doors.
  for (const kind of ["microwave", "washingMachine"] as const) {
    const appliance: ReturnType<typeof createAppliance> = createAppliance(
      { kind },
      6,
    );
    const at: IAutoMovieVector3 = appliance.affordance("door").frame.translation;
    const leaf: string = kind === "microwave" ? "door-leaf" : "door-ring";
    const shut: { low: number; high: number; size: number } = archetypeExtent(
      appliance,
      "x",
      [leaf],
    );
    near(`the ${kind}'s hinge edge`, shut.low, at.x);
    const swung: ReturnType<typeof createAppliance> = appliance.articulate({
      door: 90,
    });
    near(
      `the open ${kind} door's reach`,
      archetypeExtent(swung, "z", [leaf]).high,
      at.z + shut.size,
    );
  }
  TestValidator.equals(
    "fixture and appliance doors move as the things do",
    findings,
    [],
  );
}
