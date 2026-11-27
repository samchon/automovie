import { AutoMovieArchetypeQuadrupedBody as Body, AutoMovieArchetypeQuadrupedGait as Gait, type AutoMovieArchetypeEquine, AutoMovieArchetypeMule, AutoMovieArchetypePony, AutoMovieArchetypeDonkey, AutoMovieArchetypeHorse, AutoMovieArchetypeQuadruped } from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { nclose } from "../../internal/nclose";
import { observeQuadrupedAttachment } from "./observeQuadrupedAttachment";

/** Equids share this output contract across four supported tack assemblies. */
type Tack = Extract<AutoMovieArchetypeEquine.Tack, "saddle" | "harness" | "both" | "pack">;

/** One independently identified equid input and its expected withers height. */
interface ICase {
  name: string;
  height: number;
  model(tack: Tack): ReturnType<typeof AutoMovieArchetypeHorse.create>;
}

/** Closed-form equine timing comparisons involve at most two conversions and a ratio. */
const CLOCK_ROUNDOFF: number = 32 * Number.EPSILON;

/**
 * The equid clock and solved-pose projection preserve their own contracts.
 *
 * Scenarios:
 * 1. Four equid profiles use Robilliard (2007) timing and hoof order, with the
 *    declared square-root height scaling and both lead conventions.
 * 2. Saddle, harness, both and pack expose their distinct actual contacts.
 *    Ground and lifted goals check exact solid clearance, connected bars,
 *    unchanged carrier-local geometry, and reins running from trunk to head.
 * 3. The carrier-only projection agrees with the complete posed contact.
 *    Reading a second pose and editing its returned frames cannot change the
 *    source or a repeated grounded pose.
 */
export function test_archetypes_animals_equid_attachment_clock(): void {
  const cases: readonly ICase[] = [
    { name: "horse", height: 1.615, model: (tack: Tack): ReturnType<typeof AutoMovieArchetypeHorse.create> =>
      AutoMovieArchetypeHorse.create({ withersHeight: 1.615, tack, tempo: 0, stirrupDrop: 0.575 }, 43) },
    { name: "donkey", height: 1.1262, model: (tack: Tack): ReturnType<typeof AutoMovieArchetypeHorse.create> =>
      AutoMovieArchetypeDonkey.create({ withersHeight: 1.1262, tack, tempo: 0, stirrupDrop: 0.575 }, 43) },
    { name: "Connemara pony", height: 1.46, model: (tack: Tack): ReturnType<typeof AutoMovieArchetypeHorse.create> =>
      AutoMovieArchetypePony.create({ breed: "connemara", tack, tempo: 0, stirrupDrop: 0.575 }, 43) },
    { name: "female mule", height: 1.304, model: (tack: Tack): ReturnType<typeof AutoMovieArchetypeHorse.create> =>
      AutoMovieArchetypeMule.create({ sex: "female", tack, tempo: 0, stirrupDrop: 0.575 }, 43) },
  ];
  const saddle: readonly string[] = ["seat", "pommel", "cantle", "leftStirrup", "rightStirrup",
    "leftRein", "rightRein", "lead", "mane"];
  const expected: Readonly<Record<Tack, readonly string[]>> = {
    saddle,
    harness: ["hitch"],
    both: [...saddle, "hitch"],
    pack: ["lead", "leftLoad", "rightLoad", "tie"],
  };
  const findings: string[] = [];
  for (const fixture of cases)
    for (const tack of ["saddle", "harness", "both", "pack"] as const) {
      const label: string = `${fixture.name}/${tack}`;
      try {
        const animal: ReturnType<ICase["model"]> = fixture.model(tack);
        const species: AutoMovieArchetypeQuadruped.ISpecies = AutoMovieArchetypeQuadruped.species(animal);
        TestValidator.predicate(
          `${label} retains its reference height`,
          nclose(animal.dimensions.withersHeight!, fixture.height, CLOCK_ROUNDOFF),
        );
        TestValidator.equals(
          `${label} contact identities`,
          animal.affordances
            .map((item): string => item.id)
            .sort((left: string, right: string): number => left.localeCompare(right)),
          [...expected[tack]].sort((left: string, right: string): number => left.localeCompare(right)),
        );
        if (tack === "saddle") checkClock(species, fixture.height);
        observeQuadrupedAttachment(animal, species, label, findings, fixture.height, 2, [
          "leftRein", "rightRein", "lead",
        ]);
      } catch (error) {
        findings.push(`${label}: ${String(error)}`);
      }
    }
  TestValidator.equals("equid timing and solved attachment contracts", findings, []);
}

/** Compare finite published timing rows and independently mirrored phases. */
function checkClock(species: Gait.ClockSource, height: number): void {
  const scale: number = Math.sqrt(height / 1.38);
  // Robilliard, Pfau and Wilson (2007), Tables 2 and 3. The ordered phase
  // vectors use that paper's lead convention and the declared four-beat ideal.
  for (const [gait, speed, period, stance, left, right] of [
    ["walk", 1.5, 0.904, 0.54, [0, 0.5, 0.75, 0.25], [0, 0.5, 0.75, 0.25]],
    ["trot", 3, 0.637, 0.327, [0, 0.5, 0.5, 0], [0, 0.5, 0.5, 0]],
    ["canter", 5, 0.496, 0.172, [0, 0.73, 0.73, 0.41], [0, 0.27, 0.68, 0]],
    ["gallop", 5, 0.472, 0.176, [0, 0.78, 0.71, 0.42], [0, 0.22, 0.64, 0.93]],
  ] as const) {
    const timing: Gait.ITiming = Gait.timing(species, gait, speed * scale, 0, height);
    TestValidator.predicate(
      `${species.archetype}/${gait} stride and support`,
      nclose(timing.stride, period * scale, CLOCK_ROUNDOFF) &&
        nclose(timing.stride * timing.duty, stance * scale, CLOCK_ROUNDOFF) &&
        nclose(timing.stride * (timing.hindDuty ?? timing.duty), stance * scale, CLOCK_ROUNDOFF),
    );
    for (const [lead, phases] of [["left", left], ["right", right]] as const)
      Body.LIMBS.forEach((limb, index): void => {
        TestValidator.predicate(
          `${species.archetype}/${gait}/${lead}/${limb} landing`,
          nclose(Gait.phase(species, { gait, lead }, limb), phases[index]!, CLOCK_ROUNDOFF),
        );
      });
  }
}
