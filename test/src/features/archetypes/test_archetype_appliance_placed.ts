import { createAppliance } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypePlaced } from "../internal/archetypePlaced";

/**
 * The appliances are placed where they were put, declare their doors, handles, knobs and shelves with the kinds an act reads, and their sizes stay inside the makers' sheets and the ADA clauses for every seed, measured on the produced thing.
 *
 * Scenarios:
 * 1. A fridge-freezer, a cooker and a washing machine on the floor and a microwave on a 0.9 m counter's height, placed on a line through the public chain, each turned a different way: each rests at its placement on its support within a millimetre, and every contact is a named point of the prop.
 * 2. Each kind declares exactly its contacts with their kinds: a fridge's two hinges, the two handles riding them and four shelf stack-tops; a cooker's top and four zone stack-tops, its oven door's hinge with the handle riding it and four knobs; a microwave's door hinge, its `open` button and its floor and top stack-tops; a washer's door hinge with the handle riding it, its dial knob and its top.
 * 3. Over 200 seeds: the fridge 1.86 to 2.03 m high and 0.66 m deep with its handles (Bosch KGN36, KGN39), every freezer part below 1.37 m (ADA 804.6.6 asks half the freezer below 54 in); the cooker's top 0.85 to 0.92 m (Bosch's cookers); the microwave's outside 442 x 260 x 345 mm and its cavity 280 mm wide between the side wall and the panel (Bosch FFL020MS2B); the washer 845 to 848 mm high and 598 mm wide.
 * 4. The washer with its door opened square is 1049 mm deep, the maker's depth with the door open at 90 degrees, within a millimetre.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places every kind through the public chain and reads the displayed prop frames, measures colliders on the produced appliances, and poses the washer's door; a floating appliance, a missing handle, a shelf left out, a size off its sheet or a door hung off its true width fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The bands are the sheets' and the clauses' numbers written here; the open-door depth is the maker's own measurement, which the model reaches only if its door is as wide and hinged where the sheet's depths imply.
 * @evidence contracts/development/testing.md#distinguishing-cases Every kind for placement and contacts, one raised; each door's swing sense belongs to `test_archetype_fixture_articulation`.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man for the placing performance and in-memory models; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the four scenarios and what each pins.
 */
export function test_archetype_appliance_placed(): void {
  // 1. Placed.
  const findings: string[] = archetypePlaced(
    createAppliance.KINDS.map(
      (kind: createAppliance.Kind, index: number): archetypePlaced.IRow => ({
        name: `appliance-${kind}`,
        archetype: createAppliance({ kind }),
        yaw: 90 * index,
        ...(kind === "microwave" ? { on: 0.9 } : {}),
      }),
    ),
  );

  // 2. The contacts and their kinds, with what each handle rides.
  const expected: Readonly<
    Record<createAppliance.Kind, Readonly<Record<string, string>>>
  > = {
    refrigerator: {
      fridgeDoor: "hinge",
      freezerDoor: "hinge",
      fridgeHandle: "handle>fridgeDoor",
      freezerHandle: "handle>freezerDoor",
      shelf1: "stack-top",
      shelf2: "stack-top",
      shelf3: "stack-top",
      shelf4: "stack-top",
    },
    cooker: {
      top: "stack-top",
      zone1: "stack-top",
      zone2: "stack-top",
      zone3: "stack-top",
      zone4: "stack-top",
      ovenDoor: "hinge",
      ovenHandle: "handle>ovenDoor",
      knob1: "knob",
      knob2: "knob",
      knob3: "knob",
      knob4: "knob",
    },
    microwave: {
      door: "hinge",
      open: "button",
      floor: "stack-top",
      top: "stack-top",
    },
    washingMachine: {
      door: "hinge",
      doorHandle: "handle>door",
      dial: "knob",
      top: "stack-top",
    },
  };
  for (const kind of createAppliance.KINDS) {
    const declared: string = createAppliance({ kind })
      .affordances.map(
        (a: IAutoMovieAffordance): string =>
          `${a.id}:${a.kind}${a.rides === undefined ? "" : `>${a.rides}`}`,
      )
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
      .join(",");
    const wanted: string = Object.entries(expected[kind])
      .map(([id, k]: [string, string]): string => `${id}:${k}`)
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0))
      .join(",");
    if (declared !== wanted)
      findings.push(`${kind} declares ${declared}, ${wanted} expected`);
  }

  // 3. The bands.
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
    limit?: boolean,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-9,
    ...(limit === true ? { limit } : {}),
  });
  const make = (
    kind: createAppliance.Kind,
    seed: number,
  ): ReturnType<typeof createAppliance> => createAppliance({ kind }, seed);
  findings.push(
    ...archetypeBandSweep([
      row(
        "fridge height",
        1.86,
        2.03,
        "Bosch KGN36 and KGN39",
        (s: number): number =>
          archetypeExtent(make("refrigerator", s), "y").high,
      ),
      row(
        "fridge depth with handles",
        0.66,
        0.66,
        "Bosch KGN36NL30M",
        (s: number): number =>
          archetypeExtent(make("refrigerator", s), "z").size,
      ),
      row(
        "freezer top",
        0,
        1.37,
        "ADA 804.6.6",
        (s: number): number =>
          archetypeExtent(make("refrigerator", s), "y", [
            "freezer",
            "freezerDoor-leaf",
          ]).high,
        true,
      ),
      row(
        "cooker top",
        0.85,
        0.92,
        "Bosch freestanding cookers",
        (s: number): number => make("cooker", s).affordance("top").frame.translation.y,
      ),
      row(
        "microwave width",
        0.442,
        0.442,
        "Bosch FFL020MS2B",
        (s: number): number => archetypeExtent(make("microwave", s), "x").size,
      ),
      row(
        "microwave height",
        0.26,
        0.26,
        "Bosch FFL020MS2B",
        (s: number): number => archetypeExtent(make("microwave", s), "y").size,
      ),
      row(
        "microwave cavity width",
        0.28,
        0.28,
        "Bosch FFL020MS2B",
        (s: number): number => {
          const oven: ReturnType<typeof createAppliance> = make("microwave", s);
          return (
            archetypeExtent(oven, "x", ["panel"]).low -
            archetypeExtent(oven, "x", ["side"]).high
          );
        },
      ),
      row(
        "washer height",
        0.845,
        0.848,
        "Bosch WAN28255GB and WAN28108GB",
        (s: number): number =>
          archetypeExtent(make("washingMachine", s), "y").size,
      ),
      row(
        "washer width",
        0.598,
        0.598,
        "Bosch WAN28255GB",
        (s: number): number =>
          archetypeExtent(make("washingMachine", s), "x").size,
      ),
    ]),
  );

  // 4. The washer's depth with its door open square.
  const washer: ReturnType<typeof createAppliance> = createAppliance(
    { kind: "washingMachine" },
    5,
  );
  const open: number = archetypeExtent(washer.articulate({ door: 90 }), "z", [
    "body",
    "door-ring",
  ]).high;
  if (Math.abs(open - 1.049) > 1e-3)
    findings.push(
      `the washer with its door open square reaches ${open} m deep, 1.049 m expected`,
    );
  TestValidator.equals("appliances are placed and sized", findings, []);
}
