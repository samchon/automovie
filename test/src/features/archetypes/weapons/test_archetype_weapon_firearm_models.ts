import {
  type AutoMovieArchetype,
  AutoMovieArchetypeRefusal,
  createHandgun,
  createLongGun,
} from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

import { archetypeExtent } from "../../internal/archetypeExtent";
import { archetypeModelSweep } from "../../internal/archetypeModelSweep";

/** An inch, metres. */
const IN: number = 0.0254;

/** A pound, kilograms. */
const LB: number = 0.45359237;

/** An ounce, kilograms. */
const OZ: number = LB / 16;

/** A foot per second, metres per second. */
const FPS: number = 12 * IN;

/**
 * Each period and repeating firearm is one read model whole, at its cited figures, and its actions move by their declared travels.
 *
 * Scenarios:
 * 1. Over 200 seeds (`archetypeModelSweep`) a bolt-action rifle is the M1903 (43.46 in, 8.69 lb, 2,647 ft/s, TM 9-1270) or the Kar 98k (43.5 in, 23.4 in barrel, 9 lb, 2,800 ft/s), a revolver the Single Action Army 7.5 in (13.0 in, 40.8 oz, Gun Tests) or the Vaquero 5104 (11.12 in, 5.5 in barrel, 41 oz, Ruger), a flintlock pistol the Light Dragoon (39.7 cm, 9 in barrel) or the Sea Service (500 mm, 12 in barrel); each appears.
 * 2. A musket is the Short Land's 147.3 cm with its 106.8 cm barrel; a lever action Marlin's 38.625 in, 20.25 in barrel, 13.38 in pull and 7.5 lb.
 * 3. A bolt lifted by its whole travel then drawn by its slider's moves the bolt back by that slide; the lever's whole swing brings the hammer to its whole fall, half the swing to half, by `follows`.
 * 4. Fixing a figure a model gives, a musket's length or a revolver's length, is refused at that dimension.
 * 5. Every pose at an articulation's end is an admitted model.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each kind for 200 seeds and compares its figures with every read model's, articulates each action to its ends, and fixes model figures; a blended gun, a missing model, an action that does not move or follow, or an unrefused figure is caught.
 * @evidence contracts/development/testing.md#independent-expectations Every figure is written here from its source's page, in its stated unit.
 * @evidence contracts/development/testing.md#distinguishing-cases Five kinds, every model, each action's ends and two refusals.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the five scenarios and what each pins.
 */
export function test_archetype_weapon_firearm_models(): void {
  const findings: string[] = [];
  const close = (a: number, b: number): boolean =>
    Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(b));
  const long =
    (
      kind: createLongGun.Kind,
      names: readonly createLongGun.Dimension[],
    ): ((seed: number) => number[]) =>
    (seed: number): number[] =>
      names.map(
        (n: createLongGun.Dimension): number =>
          createLongGun({ kind }, seed).dimensions[n]!,
      );
  const hand =
    (
      frame: createHandgun.Frame,
      names: readonly createHandgun.Dimension[],
    ): ((seed: number) => number[]) =>
    (seed: number): number[] =>
      names.map(
        (n: createHandgun.Dimension): number =>
          createHandgun({ frame }, seed).dimensions[n]!,
      );
  findings.push(
    ...archetypeModelSweep([
      {
        name: "rifle",
        measure: long("rifle", ["length", "mass", "muzzleVelocity"]),
        models: [
          [43.46 * IN, 8.69 * LB, 2647 * FPS],
          [43.5 * IN, 9 * LB, 2800 * FPS],
        ],
        source: "TM 9-1270 and German Infantry Weapons (1943)",
      },
      {
        name: "revolver",
        measure: hand("revolver", ["length", "barrel", "mass"]),
        models: [
          [13 * IN, 7.5 * IN, 40.8 * OZ],
          [11.12 * IN, 5.5 * IN, 41 * OZ],
        ],
        source: "Gun Tests and Ruger's 5104 sheet",
      },
      {
        name: "flintlock",
        measure: hand("flintlock", ["length", "barrel"]),
        models: [
          [0.397, 9 * IN],
          [0.5, 12 * IN],
        ],
        source: "Museums Victoria ST 21852 and Royal Museums Greenwich AAA2441",
      },
    ]),
  );
  const musket: AutoMovieArchetype<
    createLongGun.Affordance,
    createLongGun.Dimension
  > = createLongGun({ kind: "musket" }, 3);
  if (
    !close(musket.dimensions.length!, 1.473) ||
    !close(musket.dimensions.barrel!, 1.068)
  )
    findings.push("the musket is not the Short Land");
  const lever: AutoMovieArchetype<
    createLongGun.Affordance,
    createLongGun.Dimension
  > = createLongGun({ kind: "leverAction" }, 3);
  for (const [name, expected] of [
    ["length", 38.625 * IN],
    ["barrel", 20.25 * IN],
    ["lengthOfPull", 13.38 * IN],
    ["mass", 7.5 * LB],
  ] as const)
    if (!close(lever.dimensions[name]!, expected))
      findings.push(
        `the lever action's ${name} is ${lever.dimensions[name]}, not ${expected}`,
      );
  const kar98k: number = createLongGun({ kind: "rifle", model: "kar98k" }, 3)
    .dimensions.barrel!;
  if (!close(kar98k, 23.4 * IN))
    findings.push(`the Kar 98k's barrel is ${kar98k}`);

  const rifle: AutoMovieArchetype<
    createLongGun.Affordance,
    createLongGun.Dimension
  > = createLongGun({ kind: "rifle" }, 3);
  const lift: number = rifle.affordance("bolt").travel!;
  const stroke: number = rifle.affordance("boltSlide").travel!;
  const drawn: AutoMovieArchetype<
    createLongGun.Affordance,
    createLongGun.Dimension
  > = rifle.articulate({ bolt: lift, boltSlide: stroke });
  const back: number =
    archetypeExtent(rifle, "z", ["bolt"]).low -
    archetypeExtent(drawn, "z", ["bolt"]).low;
  if (!(Math.abs(back - stroke) < 1e-6))
    findings.push(
      `the drawn bolt moves back ${back} m, not its stroke ${stroke}`,
    );
  for (const state of [{ bolt: lift }, { bolt: lift, boltSlide: stroke }])
    if (!validateModel({ model: rifle.articulate(state) }).success)
      findings.push(`the bolt pose ${JSON.stringify(state)} is refused`);

  const swing: number = lever.affordance("lever").travel!;
  const fall: number = lever.affordance("hammer").travel!;
  for (const share of [0.5, 1]) {
    const posed: AutoMovieArchetype<
      createLongGun.Affordance,
      createLongGun.Dimension
    > = lever.articulate({ lever: swing * share });
    if (!(Math.abs(posed.travel("hammer") - fall * share) < 1e-9))
      findings.push(
        `at ${share} of the swing the hammer is at ${posed.travel("hammer")}`,
      );
    if (!validateModel({ model: posed }).success)
      findings.push(`the lever at ${share} is refused`);
  }

  for (const [label, call, axis] of [
    [
      "musket length",
      (): unknown => createLongGun({ kind: "musket", length: 1.4 }, 1),
      "length",
    ],
    [
      "revolver length",
      (): unknown =>
        createHandgun({ frame: "revolver", model: "saa75", length: 0.3 }, 1),
      "length",
    ],
  ] as const) {
    let refused: unknown = null;
    try {
      call();
    } catch (error) {
      refused = error;
    }
    if (
      !(refused instanceof AutoMovieArchetypeRefusal && refused.axis === axis)
    )
      findings.push(`a fixed ${label} is not refused`);
  }
  TestValidator.equals("each firearm is one read model whole", findings, []);
}
