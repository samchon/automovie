import { AutoMovieArchetypeRefusal, AutoMovieArchetypeSpacecraft } from "@automovie/archetypes";
import { AutoMovieEngineQuaternion, AutoMovieEngineValidation } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";

/** One millimetre of clearance or placement resolution on this metre-scale set. */
const MM: number = 0.001;

/**
 * A fictional spacecraft has a continuous deck from the exterior walkway
 * through the articulated opening, a tapered but hollow hull, and a visible
 * forward crew station beside the route. Fixed rails give a separate cabin
 * route two grip points that do not follow the hatch.
 *
 * Scenarios:
 *
 * 1. Replay a seeded model, compare a different seed, and reject a narrow hatch.
 * 2. Measure the hull, aperture, and flush boarding route on an authored set.
 * 3. Open the hatch 90 degrees and measure its leaf, grip, and stationary deck and
 *    rails.
 * 4. Check the physical seat and console contacts in a tight cabin.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States seeded replay, authored hull and aperture, hatch quarter-turn, clearance, fixed deck and rails and cabin contact checks.
 * @evidence contracts/development/testing.md#behavioral-verification Measures actual public hull and contact geometry, then articulates the hatch. The leaf and carried grip must move while the deck and rail supports keep their original poses. It checks the narrow-hatch refusal.
 * @evidence contracts/development/testing.md#independent-expectations The explicitly chosen hull and gate dimensions give the expected extents and lateral clearance. A quarter turn about the authored hinge supplies the opened leaf position.
 */
export function test_archetype_spacecraft(): void {
  const params: AutoMovieArchetypeSpacecraft.IParams = {
    id: "civilian-transport",
    length: 8,
    width: 4,
    cabinHeight: 2.75,
    hatchWidth: 1.4,
    hatchHeight: 2.1,
    walkwayLength: 3,
  };
  const set: ReturnType<typeof AutoMovieArchetypeSpacecraft.create> = AutoMovieArchetypeSpacecraft.create(params, 18);
  const failures: string[] = [];

  /** Record a discrepancy in metres against the staging tolerance. */
  const near = (label: string, actual: number, expected: number): void => {
    if (!(Math.abs(actual - expected) <= MM))
      failures.push(`${label}: measured ${actual}, expected ${expected}`);
  };

  /** Record a failed staging relation. */
  const expect = (label: string, condition: boolean): void => {
    if (!condition) failures.push(label);
  };

  const first: ReturnType<typeof AutoMovieArchetypeSpacecraft.create> = AutoMovieArchetypeSpacecraft.create({}, 1010);
  const replay: ReturnType<typeof AutoMovieArchetypeSpacecraft.create> = AutoMovieArchetypeSpacecraft.create(
    {},
    1010,
  );
  const variant: ReturnType<typeof AutoMovieArchetypeSpacecraft.create> = AutoMovieArchetypeSpacecraft.create(
    {},
    1011,
  );
  TestValidator.equals(
    "seeded spacecraft dimensions",
    first.dimensions,
    replay.dimensions,
  );
  TestValidator.equals("seeded spacecraft geometry", first.parts, replay.parts);
  TestValidator.equals(
    "seeded spacecraft contacts",
    first.affordances,
    replay.affordances,
  );
  expect(
    "distinct seeds vary at least one set dimension",
    first.dimensions.length !== variant.dimensions.length ||
      first.dimensions.width !== variant.dimensions.width,
  );

  expect("fixed set is admitted", AutoMovieEngineValidation.validateModel({ model: set }).success);
  expect("set keeps its authored id", set.id === "civilian-transport");
  try {
    AutoMovieArchetypeSpacecraft.create({ hatchWidth: 0.4 }, 19);
    failures.push(
      "accepted a non-walkable hatch width below the authored band",
    );
  } catch (error) {
    expect(
      "hatch-width refusal names its field",
      error instanceof AutoMovieArchetypeRefusal && error.axis === "hatchWidth",
    );
  }

  const aperture: IAutoMovieAffordance = set.affordance("boardingOpening");
  const walkway: IAutoMovieAffordance = set.affordance("boardingWalkway");
  const floor: IAutoMovieAffordance = set.affordance("cabinFloor");
  const pivot: IAutoMovieVector3 =
    set.affordance("boardingHatch").frame.translation;
  expect(
    "boarding uses an aperture and two supporting surfaces",
    aperture.kind === "aperture" &&
      walkway.kind === "surface" &&
      floor.kind === "surface",
  );
  near(
    "hatch is at the rear end of the hull",
    aperture.frame.translation.z,
    -4,
  );
  near("aperture width", aperture.width!, 1.4);
  near("aperture height", aperture.height!, 2.1);
  near(
    "rear port jamb inner edge",
    archetypeExtent(set, "x", ["rear-port"]).low,
    0.7,
  );
  near(
    "rear starboard jamb inner edge",
    archetypeExtent(set, "x", ["rear-starboard"]).high,
    -0.7,
  );
  near(
    "lintel clears an upright performer",
    archetypeExtent(set, "y", ["rear-lintel"]).low,
    2.1,
  );
  const walkwaySpan: ReturnType<typeof archetypeExtent> = archetypeExtent(
    set,
    "z",
    ["walkway"],
  );
  near("walkway ends at the aperture plane", walkwaySpan.high, -4);
  near("walkway spans the authored run", walkwaySpan.size, 3);
  near(
    "interior deck starts at the aperture plane",
    archetypeExtent(set, "z", ["cabin-deck"]).low,
    -4,
  );
  near(
    "walkway contact matches walkway top",
    walkway.frame.translation.y,
    archetypeExtent(set, "y", ["walkway"]).high,
  );
  near(
    "deck contact matches deck top",
    floor.frame.translation.y,
    archetypeExtent(set, "y", ["cabin-deck"]).high,
  );
  near(
    "walkway and deck meet flush",
    walkway.frame.translation.y,
    floor.frame.translation.y,
  );
  near(
    "threshold meets deck at floor height",
    aperture.frame.translation.y,
    floor.frame.translation.y,
  );

  const cabinWall: number = archetypeExtent(set, "x", ["cabin-starboard"]).high;
  const portWall: ReturnType<typeof archetypeExtent> = archetypeExtent(
    set,
    "x",
    ["cabin-port"],
  );
  const frontFace: number = archetypeExtent(set, "x", ["windscreen"]).high;
  near("cabin reaches half the authored width", portWall.high, 2);
  expect(
    "forward windscreen is narrower than the cabin",
    frontFace < portWall.high - 0.5,
  );
  near(
    "nose ends half the authored length ahead",
    archetypeExtent(set, "z", ["windscreen"]).high,
    4,
  );
  near(
    "roof preserves the authored headroom",
    archetypeExtent(set, "y", ["cabin-roof"]).low,
    2.75,
  );
  expect(
    "side wall leaves room at the cabin center",
    portWall.low > 1.7 && -1.7 > cabinWall,
  );

  const closedHandle: IAutoMovieVector3 =
    set.affordance("boardingHandle").frame.translation;
  const open: ReturnType<typeof AutoMovieArchetypeSpacecraft.create> = set.articulate({
    boardingHatch: 90,
  });
  const openHandle: IAutoMovieVector3 =
    open.affordance("boardingHandle").frame.translation;
  near(
    "shut leaf spans the aperture",
    archetypeExtent(set, "x", ["hatch-leaf"]).size,
    1.4,
  );
  near(
    "open leaf stays outside the clear width",
    archetypeExtent(open, "x", ["hatch-leaf"]).high,
    -0.7,
  );
  near(
    "open leaf swings outward by the opening width",
    archetypeExtent(open, "z", ["hatch-leaf"]).low,
    -5.4,
  );
  near(
    "right-angle grip X",
    openHandle.x,
    pivot.x - (pivot.z - closedHandle.z),
  );
  near("right-angle grip Y", openHandle.y, closedHandle.y);
  near(
    "right-angle grip Z",
    openHandle.z,
    pivot.z - (closedHandle.x - pivot.x),
  );
  const gripSpan: ReturnType<typeof archetypeExtent> = archetypeExtent(
    open,
    "x",
    ["hatch-grip"],
  );
  near(
    "open handle remains on its rod",
    openHandle.x,
    (gripSpan.low + gripSpan.high) / 2,
  );
  near(
    "hatch articulation leaves the deck fixed",
    archetypeExtent(open, "z", ["walkway"]).high,
    -4,
  );

  for (const [id, station] of [
    ["aftHandrail", -2.8],
    ["forwardHandrail", -0.4],
  ] as const) {
    const rail: IAutoMovieAffordance = set.affordance(id);
    const grip: IAutoMovieVector3 = rail.frame.translation;
    const { x, y, z }: IAutoMovieVector3 =
      open.affordance(id).frame.translation;
    expect(
      `${id} is a fixed power grip`,
      rail.kind === "bar" && rail.grip === "power" && rail.rides === undefined,
    );
    near(`${id} grip station`, grip.z, station);
    near(`${id} grip above the cabin deck`, grip.y, 1.63);
    near(
      `${id} grip stays fixed as the hatch opens`,
      Math.hypot(x - grip.x, y - grip.y, z - grip.z),
      0,
    );
    near(`${id} grip diameter`, rail.aperture!, 0.032);
    near(
      `${id} declared length spans the solid bar`,
      rail.length!,
      archetypeExtent(set, "z", [id]).size,
    );
    const normal: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      rail.frame.rotation,
      { x: 0, y: 1, z: 0 },
    );
    const along: IAutoMovieVector3 = AutoMovieEngineQuaternion.rotateVector(
      rail.frame.rotation,
      { x: 1, y: 0, z: 0 },
    );
    near(`${id} faces into the cabin`, normal.x, 1);
    near(`${id} runs along the cabin`, along.z, 1);
    expect(
      `${id} leaves grip clearance from the cabin wall`,
      archetypeExtent(set, "x", [id]).low - cabinWall > 0.08,
    );
    near(
      `${id} brackets start at the cabin wall`,
      archetypeExtent(set, "x", [`${id}-aft-bracket`, `${id}-forward-bracket`])
        .low,
      cabinWall,
    );
  }

  const tight: ReturnType<typeof AutoMovieArchetypeSpacecraft.create> = AutoMovieArchetypeSpacecraft.create(
    {
      width: 3.4,
      length: 6,
      cabinHeight: 2.45,
      hatchWidth: 1.6,
      hatchHeight: 2.2,
    },
    20,
  );
  const seat: IAutoMovieAffordance = tight.affordance("crewSeat");
  const consoleTop: IAutoMovieAffordance = tight.affordance("controlConsole");
  expect("tight cabin is admitted", AutoMovieEngineValidation.validateModel({ model: tight }).success);
  expect(
    "crew station is a seat facing its console surface",
    seat.kind === "seat" &&
      consoleTop.kind === "surface" &&
      seat.frame.translation.z < consoleTop.frame.translation.z,
  );
  near(
    "seat contact is on the front edge of the pan",
    seat.frame.translation.z,
    archetypeExtent(tight, "z", ["seat-pan"]).high,
  );
  near(
    "seat stands on its pan",
    seat.frame.translation.y,
    archetypeExtent(tight, "y", ["seat-pan"]).high,
  );
  near(
    "console contact is on the console top",
    consoleTop.frame.translation.y,
    archetypeExtent(tight, "y", ["console-top"]).high,
  );
  expect(
    "seat does not narrow the boarding lane",
    archetypeExtent(tight, "x", ["seat-pan"]).low > 0.8,
  );

  TestValidator.equals("spacecraft staging discrepancies", failures, []);
}
