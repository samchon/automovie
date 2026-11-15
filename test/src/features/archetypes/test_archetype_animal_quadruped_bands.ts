import { ArchetypeRefusal, createHorse, createQuadruped } from "@automovie/archetypes";
import type { IAutoMovieAffordance } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";
import { archetypeExtent } from "../internal/archetypeExtent";

/** The pony breeds' means in Brooks et al. 2010's published rows, as this campaign averaged them: withers height, heart girth and fore cannon, centimetres. */
const PONIES: Readonly<Record<string, readonly [number, number, number]>> = {
  shetland: [105.3, 135.8, 19.7],
  welshMountain: [121.6, 151.6, 24.5],
  welshPony: [130.7, 168.1, 27.1],
  dartmoor: [125.7, 150.7, 24.6],
  connemara: [146.0, 180.9, 28.2],
};

/** The Thoroughbreds of the same rows: withers height and fore cannon, centimetres. */
const THOROUGHBRED: readonly [number, number] = [161.4, 32.9];

/** Kubo et al. 1992's thoroughbred metacarpus over its 1.62 m withers height. */
const KUBO: number = 0.28 / 1.62;

/**
 * Every quadruped kind is one of its measured samples whole and stays inside its cited bands for every seed, measured on the produced animal, and wears its tack's contacts.
 *
 * Scenarios, over 200 seeds:
 * 1. A pony's withers stand at one pony breed's mean height of Brooks et al. 2010, its barrel's round is that same breed's mean heart girth, and its fore cannon over its height is Kubo's thoroughbred fraction scaled by that breed's cannon over its height against the Thoroughbred's in the same rows, each to a millimetre or a twentieth of a percent of the height; every breed appears.
 * 2. A pony's mass is the girth-squared-times-length law's on its breed's girth and height, anchored on Jensen et al. 2019's weighed warmbloods' means: 640 kg times the girth's ratio to 204 cm squared times the height's to 172 cm, to a millionth.
 * 3. Each kind under each of its tacks offers the contacts the horse offers under that tack, by id and kind.
 * 4. Fixing a pony's height at the withers, its breed's own figure, is refused at that dimension.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each kind for 200 seeds and measures the withers' top, the barrel's width, a bone's length and the body's mass, and lists the contacts; a pony blended between breeds, a size or a bone out of its breed's proportion, a mass outside its sample or a tack missing a contact is caught.
 * @evidence contracts/development/testing.md#independent-expectations The breeds' figures, the cannon's fraction and the mass are worked here from the source figures written above: Brooks et al.'s breed means as averaged from the published rows, Kubo's 0.280 m at 1.62 m and Jensen et al.'s means, by Carroll and Huntington's girth-squared-times-length form.
 * @evidence contracts/development/testing.md#distinguishing-cases Every breed, height, girth and mass, one derived bone, and both tacks.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_animal_quadruped_bands(): void {
  const findings: string[] = [];
  const seen: Set<string> = new Set();
  for (let seed: number = 0; seed < archetypeBandSweep.SEEDS; seed++) {
    const pony: ReturnType<typeof createQuadruped> = createQuadruped({ kind: "pony" }, seed);
    const withers: number = archetypeExtent(pony, "y", ["withers"]).high;
    const breed: string | undefined = Object.keys(PONIES).find(
      (b: string): boolean => Math.abs(withers - PONIES[b]![0] / 100) < 1e-3,
    );
    if (breed === undefined) {
      findings.push(`seed ${seed}: a pony's withers at ${withers} m are no breed's`);
      continue;
    }
    seen.add(breed);
    const [height, girth, cannon]: readonly [number, number, number] = PONIES[breed]!;
    const round: number = Math.PI * archetypeExtent(pony, "x", ["trunk"]).size;
    const fraction: number = archetypeExtent(pony, "y", ["rightForeCannon"]).size / withers;
    const expected: number = KUBO * (cannon / height / (THOROUGHBRED[1] / THOROUGHBRED[0]));
    if (Math.abs(round - girth / 100) > 1e-3)
      findings.push(`seed ${seed}: a ${breed}'s barrel is ${round} m round, not ${girth / 100}`);
    if (Math.abs(fraction - expected) > 0.0005)
      findings.push(`seed ${seed}: a ${breed}'s fore cannon is ${fraction} of its height, not ${expected}`);
    // The law's oracle on the weighed warmbloods' means, which the horse states once (`createHorse.JENSEN`, metres and kilograms).
    const anchor: typeof createHorse.JENSEN = createHorse.JENSEN;
    const weight: number = anchor.mass * (girth / 100 / anchor.girth) ** 2 * (height / 100 / anchor.withers);
    if (Math.abs(pony.body.mass - weight) > 1e-6 * weight)
      findings.push(`seed ${seed}: a ${breed} weighs ${pony.body.mass} kg, not the ${weight} kg its girth and height give`);
  }
  if (seen.size !== Object.keys(PONIES).length)
    findings.push(`only ${[...seen].join(", ")} appear over ${archetypeBandSweep.SEEDS} seeds`);

  // 3. The tack's contacts.
  const contacts = (affordances: readonly IAutoMovieAffordance[]): string =>
    affordances
      .map((a: IAutoMovieAffordance): string => `${a.id}:${a.kind}`)
      .sort((a: string, b: string): number => a.localeCompare(b))
      .join(",");
  for (const kind of createQuadruped.KINDS)
    for (const tack of createHorse.TACKS) {
      const made: string = contacts(createQuadruped({ kind, tack }, 3).affordances);
      const horse: string = contacts(createHorse({ tack }, 3).affordances);
      if (made !== horse) findings.push(`a ${kind} in its ${tack} offers ${made}, not ${horse}`);
    }
  // 4. A breed's own figure is refused when fixed.
  let refused: unknown = null;
  try {
    createQuadruped({ kind: "pony", withersHeight: 1.2 }, 3);
  } catch (error) {
    refused = error;
  }
  if (!(refused instanceof ArchetypeRefusal && refused.axis === "withersHeight"))
    findings.push("a fixed height at the withers, a pony breed's own figure, is not refused");
  TestValidator.equals("every quadruped kind stays in its bands", findings, []);
}
