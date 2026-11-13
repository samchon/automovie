import {
  ArchetypeRefusal,
  HorseGait,
  createBag,
  createBicycle,
  createDoor,
  createDrinkware,
  createLadder,
  createLoad,
  createSeat,
  createStairs,
  rideBicycle,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** Run an operation and return the refusal it raises, or null when it raises none or something else. */
function refusal(operation: () => unknown): ArchetypeRefusal | null {
  try {
    operation();
  } catch (error) {
    return error instanceof ArchetypeRefusal ? error : null;
  }
  return null;
}

/** A refusal's axis and feasible range as `axis: minimum..maximum unit`, or `none` when it is no refusal with a range. */
function ranged(refused: ArchetypeRefusal | null): string {
  return refused === null ||
    refused.kind !== "parameter" ||
    refused.feasible?.kind !== "range"
    ? "none"
    : `${refused.axis}: ${refused.feasible.minimum}..${refused.feasible.maximum} ${refused.feasible.unit}`.trim();
}

/**
 * A request an archetype cannot honour is refused with the axis at fault and what would have been accepted.
 *
 * Scenarios:
 * 1. An affordance id the variant does not declare (a glass has no handle) refuses with kind `affordance` and lists exactly the ids the glass declares.
 * 2. A dimension fixed outside its band (an office chair seat 0.70 m high) refuses with kind `parameter`, the axis `seatHeight` and a range in metres; the band's own ends are accepted and give a seat at that height to a nanometre.
 * 3. A kind passed as run-time text that the producer does not make refuses with the kinds it makes.
 * 4. A count the code limits (30 risers) refuses with the range.
 * 5. An articulation travel beyond its range (a door swung 120 degrees), and a travel on an id that is no articulation (the door's aperture), each refuse with kind `articulation`.
 * 6. A site coordinate outside 0 to 1 refuses with kind `site`.
 * 7. A valid request raises nothing.
 * 8. A fixed dimension the kind lacks (a stool's back height, a stool's seat depth) refuses with kind `parameter`, the dimension as the axis and, as alternatives, exactly the dimensions a produced stool reports.
 * 9. Counts and amounts: a dining chair with two places and a bench with five or two and a half; a ladder with one rung, and with one more than the most its refusal states, which itself is accepted; a suitcase loaded past 27 kg and a tote past 16 kg, each bound itself accepted; a crate's contents past 22.5 kg for every one of eight seeds, 22.5 kg accepted, and any contents in a sack; a vessel filled past 1 or below 0.
 * 10. A bicycle ride's gear with no teeth or a fractional count refuses at `gear.chainring` or `gear.sprocket`.
 * 11. A horse's timing refuses a tempo outside -1 to 1, a tempo that is not a number, and a height that is not positive.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the producers, accessors, a ride and the gait timing with requests outside the contract and reads the raised refusal's fields; a producer that clamps, defaults or throws a bare error is caught, as is one whose stated bound is not itself accepted.
 * @evidence contracts/development/testing.md#independent-expectations The refusal contract of #3368 and #3375: one axis, the given value, the feasible range or alternatives, and never a silent repair. The office chair's 0.38 to 0.56 m seat band is ANSI/HFES 100-2007's; one to four places is the seat's stated range; 27 kg is IATA's 32 kg piece less the heaviest 4.3 kg case, rounded down, and 16 kg HSE INDG143's close carry; 22.5 kg is the crate's stated contents bound; a fill is a fraction; a tooth count is a positive whole number; a tempo is at most one standard deviation. The ladder's most rungs is an uncited model bound, so only its honesty is asserted: the stated maximum is accepted and one more is refused.
 * @evidence contracts/development/testing.md#distinguishing-cases Each refusal class once, with the bound accepted beside the value refused just past it, a whole count beside a fractional one, and a seed sweep where the bound must not depend on the seed; that a seed never leaves a band belongs to the family band tests, and a course's and a turn's refusals to `test_archetype_ride_course`.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the eleven scenarios and what each pins.
 */
export function test_archetype_contract_refusal(): void {
  const glass: ReturnType<typeof createDrinkware> = createDrinkware({
    kind: "glass",
  });
  const missing: ArchetypeRefusal | null = refusal(() =>
    glass.affordance("handle"),
  );
  TestValidator.equals(
    "a missing affordance lists the ids that exist",
    [missing?.kind, missing?.feasible],
    ["affordance", { kind: "alternatives", values: ["body", "lip"] }],
  );

  const high: ArchetypeRefusal | null = refusal(() =>
    createSeat({ kind: "office", seatHeight: 0.7 }),
  );
  TestValidator.equals(
    "a dimension outside its band gives the band",
    [high?.kind, high?.axis, high?.feasible],
    [
      "parameter",
      "seatHeight",
      { kind: "range", minimum: 0.38, maximum: 0.56, unit: "m" },
    ],
  );
  TestValidator.equals(
    "the band's ends are accepted",
    [0.38, 0.56].map(
      (end: number): boolean =>
        Math.abs(
          createSeat({ kind: "office", seatHeight: end }).affordance("seat")
            .frame.translation.y - end,
        ) <= 1e-9,
    ),
    [true, true],
  );

  const unknown: ArchetypeRefusal | null = refusal(() =>
    createSeat({ kind: "throne" as createSeat.Kind }),
  );
  TestValidator.equals(
    "an unknown kind lists the kinds",
    [unknown?.axis, unknown?.feasible],
    ["kind", { kind: "alternatives", values: [...createSeat.KINDS] }],
  );

  const tall: ArchetypeRefusal | null = refusal(() =>
    createStairs({ steps: 30 }),
  );
  TestValidator.equals(
    "too many risers gives the range",
    [tall?.axis, tall?.feasible],
    ["steps", { kind: "range", minimum: 2, maximum: 20, unit: "" }],
  );

  const door: ReturnType<typeof createDoor> = createDoor();
  const wide: ArchetypeRefusal | null = refusal(() =>
    door.articulate({ hinge: 120 }),
  );
  const still: ArchetypeRefusal | null = refusal(() =>
    door.articulate({ aperture: 1 }),
  );
  TestValidator.equals(
    "a travel outside its range, and a travel on a fixed contact, are refused",
    [wide?.kind, wide?.axis, still?.kind],
    ["articulation", "hinge", "articulation"],
  );
  TestValidator.equals(
    "a site outside the extent is refused",
    refusal(() => door.site("aperture", 1.2))?.kind,
    "site",
  );
  TestValidator.equals(
    "a valid request raises nothing",
    refusal(() => door.articulate({ hinge: 45 }).site("aperture", 0.5, 1)),
    null,
  );

  // 8. A dimension only another kind has.
  const ordered = (names: readonly string[]): string[] =>
    [...names].sort((a: string, b: string): number =>
      a < b ? -1 : a > b ? 1 : 0,
    );
  const owned: string[] = ordered(
    Object.keys(createSeat({ kind: "stool" }).dimensions),
  );
  for (const [name, operation] of [
    ["backHeight", () => createSeat({ kind: "stool", backHeight: 0.4 })],
    ["seatDepth", () => createSeat({ kind: "stool", seatDepth: 0.4 })],
  ] as const) {
    const lacking: ArchetypeRefusal | null = refusal(operation);
    TestValidator.equals(
      `a stool refuses a fixed ${name} with its own dimensions`,
      [
        lacking?.kind,
        lacking?.axis,
        lacking?.feasible?.kind === "alternatives"
          ? ordered(lacking.feasible.values)
          : null,
        owned.includes(name),
      ],
      ["parameter", name, owned, false],
    );
  }

  // 9. Counts and amounts.
  TestValidator.equals(
    "places outside what the kind seats",
    [
      ranged(refusal(() => createSeat({ kind: "dining", places: 2 }))),
      ranged(refusal(() => createSeat({ kind: "bench", places: 5 }))),
      ranged(refusal(() => createSeat({ kind: "bench", places: 2.5 }))),
      ranged(refusal(() => createSeat({ kind: "bench", places: 4 }))),
      ranged(refusal(() => createSeat({ kind: "sofa", places: 1 }))),
    ],
    ["places: 1..1", "places: 1..4", "places: 1..4", "none", "none"],
  );
  const short: ArchetypeRefusal | null = refusal(() =>
    createLadder({ kind: "fixed", rungs: 1 }),
  );
  const most: number =
    short?.feasible?.kind === "range" ? (short.feasible.maximum ?? 0) : 0;
  TestValidator.equals(
    "a ladder's rungs: one refused, the stated most accepted, one more refused",
    [
      short?.kind,
      short?.axis,
      short?.feasible?.kind === "range" ? short.feasible.minimum : null,
      most > 2,
      refusal(() => createLadder({ kind: "fixed", rungs: most })),
      refusal(() => createLadder({ kind: "leaning", rungs: most + 1 }))?.axis,
      refusal(() => createLadder({ kind: "leaning", rungs: 2.5 }))?.axis,
    ],
    ["parameter", "rungs", 2, true, null, "rungs", "rungs"],
  );
  TestValidator.equals(
    "a bag's load past what it carries",
    [
      ranged(refusal(() => createBag({ kind: "suitcase", load: 27.5 }))),
      ranged(refusal(() => createBag({ kind: "suitcase", load: 27 }))),
      ranged(refusal(() => createBag({ kind: "tote", load: 16.5 }))),
      ranged(refusal(() => createBag({ kind: "backpack", load: 16 }))),
      ranged(refusal(() => createBag({ kind: "tote", load: -1 }))),
    ],
    ["load: 0..27 kg", "none", "load: 0..16 kg", "none", "load: 0..16 kg"],
  );
  const crates: string[] = [];
  for (let seed: number = 0; seed < 8; seed++)
    crates.push(
      [
        ranged(refusal(() => createLoad({ kind: "crate", load: 22.6 }, seed))),
        ranged(refusal(() => createLoad({ kind: "crate", load: 22.5 }, seed))),
      ].join(" | "),
    );
  TestValidator.equals(
    "a crate's contents are bounded the same for every seed",
    crates,
    crates.map((): string => "load: 0..22.5 kg | none"),
  );
  TestValidator.equals(
    "a sack takes no contents, and an empty one is accepted",
    [
      ranged(refusal(() => createLoad({ kind: "sack", load: 1 }))),
      ranged(refusal(() => createLoad({ kind: "sack", load: 0 }))),
    ],
    ["load: 0..0 kg", "none"],
  );
  TestValidator.equals(
    "a fill outside empty to full",
    [
      ranged(refusal(() => createDrinkware({ kind: "mug", fill: 1.2 }))),
      ranged(refusal(() => createDrinkware({ kind: "mug", fill: -0.1 }))),
      ranged(refusal(() => createDrinkware({ kind: "mug", fill: 1 }))),
    ],
    ["fill: 0..1", "fill: 0..1", "none"],
  );

  // 10. A gear's tooth counts.
  const bicycle: ReturnType<typeof createBicycle> = createBicycle();
  const course: Parameters<typeof rideBicycle>[1] = {
    start: { x: 0, z: 0, heading: 0 },
    legs: [{ kind: "straight", length: 20 }],
    cruise: 5,
    acceleration: 1,
    deceleration: 1,
  };
  TestValidator.equals(
    "a gear needs whole, positive tooth counts",
    [
      refusal(() =>
        rideBicycle(bicycle, course, { chainring: 0, sprocket: 17 }),
      )?.axis,
      refusal(() =>
        rideBicycle(bicycle, course, { chainring: 34, sprocket: 16.5 }),
      )?.axis,
      refusal(() =>
        rideBicycle(bicycle, course, { chainring: 34, sprocket: -17 }),
      )?.kind,
      refusal(() =>
        rideBicycle(bicycle, course, { chainring: 1, sprocket: 1 }),
      ),
    ],
    ["gear.chainring", "gear.sprocket", "parameter", null],
  );

  // 11. A horse's tempo and height.
  TestValidator.equals(
    "a tempo outside one standard deviation, and a height that is not positive",
    [
      ranged(refusal(() => HorseGait.timing("trot", 4, 1.5))),
      ranged(refusal(() => HorseGait.timing("trot", 4, -1.01))),
      ranged(refusal(() => HorseGait.timing("trot", 4, Number.NaN))),
      ranged(refusal(() => HorseGait.timing("trot", 4, 0, 0))),
      ranged(refusal(() => HorseGait.timing("trot", 4, 0, -1.5))),
      ranged(refusal(() => HorseGait.timing("trot", 4, 1))),
      ranged(refusal(() => HorseGait.timing("trot", 4, -1))),
    ],
    [
      "tempo: -1..1",
      "tempo: -1..1",
      "tempo: -1..1",
      "withers: 0..null m",
      "withers: 0..null m",
      "none",
      "none",
    ],
  );
}
