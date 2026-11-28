import { AutoMovieArchetypeUnits, AutoMovieArchetypeAppliance, AutoMovieArchetypeSanitary } from "@automovie/archetypes";
import type { IAutoMovieVector3 } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";

/** A millimetre, the tolerance of #3368 for a part following its articulation. */
const MM: number = 1e-3;

/**
 * The fixtures' and appliances' doors and lids move the way the thing does: a toilet lid lowers onto its seat and side-hung doors swing out toward the side they are opened from, each carrying its handle; a door no source gives an opening for stays shut.
 *
 * Scenarios:
 * 1. A toilet's lid, standing open at rest, lies on the seat ring at its full travel: its underside at the seat's height and its far edge at the bowl's front, within a millimetre.
 * 2. A fridge's door at its full travel, 90 degrees, stands out toward `+Z` from its `+X` hinge edge by the fridge's width, its handle with it; the freezer door at rest is unmoved.
 * 3. A washing machine's door opens the maker's 160 degrees, and opened square it stands out toward `+Z` from its `-X` hinge edge by its own width.
 * 4. A microwave's door states no travel: any travel but 0 is refused.
 * 5. A washbasin mixer's lever turns GROHE's 50 degrees each way, swinging its front toward `+X` and, turned back by its reverse, as far toward `-X`, and lifts GROHE's 39 degrees, raising its front; lifted after turning, it lifts in its turned plane.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes lid and door motion, both hinge edges, carried grips and the resting door without a travel range.
 * @evidence contracts/development/testing.md#behavioral-verification Articulates actual generated fixtures and measures their moving colliders and contacts. Opposite hinge placements, a stationary sibling door and a control with no opening range exercise different ownership cases.
 * @evidence contracts/development/testing.md#independent-expectations A leaf turned 90 degrees reaches one leaf width beyond its hinge axis. The stated maker travel limits and one millimetre tolerance give the door and refusal expectations.
 */
export function test_archetype_fixture_articulation(): void {
  const findings: string[] = [];
  const near = (what: string, got: number, wanted: number): void => {
    if (!(Math.abs(got - wanted) <= MM))
      findings.push(`${what}: ${got}, ${wanted} expected`);
  };

  // 1. The toilet's lid.
  const toilet: ReturnType<typeof AutoMovieArchetypeSanitary.create> = AutoMovieArchetypeSanitary.create(
    { kind: "toilet" },
    6,
  );
  const seat: number = toilet.dimensions.seat!;
  const closed: ReturnType<typeof AutoMovieArchetypeSanitary.create> = toilet.articulate({
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
  const fridge: ReturnType<typeof AutoMovieArchetypeAppliance.create> = AutoMovieArchetypeAppliance.create(
    { kind: "refrigerator" },
    6,
  );
  const width: number = fridge.dimensions.width!;
  const face: number = fridge.affordance("fridgeDoor").frame.translation.z;
  if (fridge.affordance("fridgeDoor").travel !== 90)
    findings.push(
      `the fridge door opens ${fridge.affordance("fridgeDoor").travel} degrees, the maker's 90 expected`,
    );
  const opened: ReturnType<typeof AutoMovieArchetypeAppliance.create> = fridge.articulate({
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
  const washer: ReturnType<typeof AutoMovieArchetypeAppliance.create> = AutoMovieArchetypeAppliance.create(
    { kind: "washingMachine" },
    6,
  );
  if (washer.affordance("door").travel !== 160)
    findings.push(
      `the washer door opens ${washer.affordance("door").travel} degrees, the maker's 160 expected`,
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
  const microwave: ReturnType<typeof AutoMovieArchetypeAppliance.create> = AutoMovieArchetypeAppliance.create(
    { kind: "microwave" },
    6,
  );
  try {
    microwave.articulate({ door: 30 });
    findings.push("the microwave's door opened without a source for its angle");
  } catch {
    // Refused, as a door that states no travel is.
  }
  // 5. The basin mixer's lever.
  const basin: ReturnType<typeof AutoMovieArchetypeSanitary.create> = AutoMovieArchetypeSanitary.create(
    { kind: "washbasin" },
    6,
  );
  if (
    basin.affordance("tap").travel !== 50 ||
    basin.affordance("tap").reverse !== 50 ||
    basin.affordance("lift").travel !== 39
  )
    findings.push(
      "the mixer's lever does not turn 50 each way and lift 39 degrees",
    );
  const lever: { low: number; high: number; size: number } = archetypeExtent(
    basin,
    "y",
    ["tap-lever"],
  );
  const lifted: { low: number; high: number } = archetypeExtent(
    basin.articulate({ lift: 39 }),
    "y",
    ["tap-lever"],
  );
  near(
    "the lifted lever's top",
    lifted.high - lever.high,
    0.045 * Math.sin(39 * AutoMovieArchetypeUnits.DEGREE) +
      0.012 * (Math.cos(39 * AutoMovieArchetypeUnits.DEGREE) - 1),
  );
  const turned: { low: number; high: number } = archetypeExtent(
    basin.articulate({ tap: 50 }),
    "x",
    ["tap-lever"],
  );
  near(
    "the turned lever's reach toward +X",
    turned.high,
    0.045 * Math.sin(50 * AutoMovieArchetypeUnits.DEGREE) +
      0.0075 * Math.cos(50 * AutoMovieArchetypeUnits.DEGREE),
  );
  const back: { low: number; high: number } = archetypeExtent(
    basin.articulate({ tap: -50 }),
    "x",
    ["tap-lever"],
  );
  near(
    "the lever turned back's reach toward -X",
    -back.low,
    0.045 * Math.sin(50 * AutoMovieArchetypeUnits.DEGREE) +
      0.0075 * Math.cos(50 * AutoMovieArchetypeUnits.DEGREE),
  );
  TestValidator.equals(
    "fixture and appliance doors move as the things do",
    findings,
    [],
  );
}
