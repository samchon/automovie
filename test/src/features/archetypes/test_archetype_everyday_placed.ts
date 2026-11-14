import {
  type Archetype,
  createCareItem,
  createCleaning,
  createKeyboard,
  createPram,
  createScabbard,
  createTool,
  createTorch,
  createTray,
  createVessel,
  createWeaponLoop,
  createWeaponRack,
  createWearable,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";
import { archetypePlaced } from "../internal/archetypePlaced";

/**
 * The everyday additions and the weapons' carriers and rack are placed in a scene where they were put, and their act-read sizes stay inside their sources for every seed, measured on the produced thing.
 *
 * Scenarios:
 * 1. The razor and the lipstick, the fork, every vessel, wearable, keyboard, cleaning thing and carrier, the torch, the pram, both scabbards, both weapon carriers and the weapon rack, placed on a line through the public chain, each turned a different way: each rests at its placement on the floor, its lowest point on the floor within a millimetre, and every contact it declares is a named point of the prop at its own place.
 * 2. Over 200 seeds: the razor 0.13 to 0.15 m long; the keyboard's home row two and a half key pitches (47.6 mm) behind its key field's front, the third row's middle; the sword's scabbard 0.80 to 1.08 m long; the pram's handle 0.95 to 1.1 m high (all provisional sources the producers name).
 *
 * @evidence contracts/development/testing.md#behavioral-verification Places every archetype of the family through the public chain and reads the displayed prop frames, and measures colliders and contacts on the produced things; one that floats, sinks, drops a contact or leaves its source's band fails with the numbers.
 * @evidence contracts/development/testing.md#independent-expectations The bands are written here from the sources each producer cites; the home row's place is the standard key pitch's arithmetic.
 * @evidence contracts/development/testing.md#distinguishing-cases Every new producer and kind for placement; one act-read size per producer for the bands.
 * @evidence contracts/development/testing.md#execution-ownership Prepares one polygon man for the placing performance and in-memory models; it runs locally and wherever CI runs the archetype tests.
 * @evidence contracts/development/common.md#meaningful-documentation States the two scenarios and what each pins.
 */
export function test_archetype_everyday_placed(): void {
  const kinds = <Kind extends string>(
    name: string,
    all: readonly Kind[],
    make: (kind: Kind) => Archetype,
    yaw: number,
  ): archetypePlaced.IRow[] =>
    all.map(
      (kind: Kind): archetypePlaced.IRow => ({
        name: `${name}-${kind}`,
        archetype: make(kind),
        yaw,
      }),
    );
  const findings: string[] = archetypePlaced([
    {
      name: "careItem-razor",
      archetype: createCareItem({ kind: "razor" }),
      yaw: 0,
    },
    {
      name: "careItem-lipstick",
      archetype: createCareItem({ kind: "lipstick" }),
      yaw: 20,
    },
    { name: "tool-fork", archetype: createTool({ kind: "fork" }), yaw: 40 },
    ...kinds(
      "vessel",
      createVessel.KINDS,
      (kind: createVessel.Kind): Archetype => createVessel({ kind }),
      60,
    ),
    ...kinds(
      "wearable",
      createWearable.KINDS,
      (kind: createWearable.Kind): Archetype => createWearable({ kind }),
      80,
    ),
    ...kinds(
      "keyboard",
      createKeyboard.KINDS,
      (kind: createKeyboard.Kind): Archetype => createKeyboard({ kind }),
      100,
    ),
    ...kinds(
      "cleaning",
      createCleaning.KINDS,
      (kind: createCleaning.Kind): Archetype => createCleaning({ kind }),
      120,
    ),
    ...kinds(
      "tray",
      createTray.KINDS,
      (kind: createTray.Kind): Archetype => createTray({ kind }),
      140,
    ),
    { name: "torch", archetype: createTorch(), yaw: 160 },
    { name: "pram", archetype: createPram(), yaw: 180 },
    ...kinds(
      "scabbard",
      createScabbard.KINDS,
      (kind: createScabbard.Kind): Archetype => createScabbard({ kind }),
      200,
    ),
    ...kinds(
      "weaponLoop",
      createWeaponLoop.KINDS,
      (kind: createWeaponLoop.Kind): Archetype => createWeaponLoop({ kind }),
      220,
    ),
    { name: "weaponRack", archetype: createWeaponRack(), yaw: 240 },
  ]);
  const row = (
    name: string,
    minimum: number,
    maximum: number,
    source: string,
    measure: (seed: number) => number,
  ): archetypeBandSweep.IRow => ({
    name,
    minimum,
    maximum,
    source,
    measure,
    tolerance: 1e-9,
  });
  const pitch: number = 0.01905;
  findings.push(
    ...archetypeBandSweep([
      row(
        "razor length",
        0.13,
        0.15,
        "makers' cartridge razors",
        (seed: number): number =>
          archetypeExtent(createCareItem({ kind: "razor" }, seed), "z").size,
      ),
      row(
        "home row behind the key field's front",
        2.5 * pitch,
        2.5 * pitch,
        "a 19.05 mm key pitch, the home row the third row",
        (seed: number): number => {
          const keyboard: ReturnType<typeof createKeyboard> = createKeyboard(
            { kind: "keyboard" },
            seed,
          );
          const keys: ReturnType<typeof keyboard.affordance> =
            keyboard.affordance("keys");
          const front: number = keys.frame.translation.z + keys.depth! / 2;
          return front - keyboard.affordance("homeRow").frame.translation.z;
        },
      ),
      row(
        "sword scabbard length",
        0.8,
        1.08,
        "createSword's blades with room",
        (seed: number): number =>
          archetypeExtent(createScabbard({ kind: "sword" }, seed), "y").size,
      ),
      row(
        "pram handle height",
        0.95,
        1.1,
        "makers' prams",
        (seed: number): number =>
          createPram({}, seed).affordance("handle").frame.translation.y,
      ),
    ]),
  );
  TestValidator.equals(
    "the everyday additions and the weapons' carriers are placed and sized",
    findings,
    [],
  );
}
