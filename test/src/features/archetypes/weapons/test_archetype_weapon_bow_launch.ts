import { AutoMovieArchetypeRefusal, AutoMovieArchetypeUnits, AutoMovieArchetypeBow } from "@automovie/archetypes";
import { AutoMovieEngineGravity } from "@automovie/engine";
import { TestValidator } from "@nestia/e2e";

/**
 * A bow prototype obeys its declared stroke-energy law and launches faster as it is drawn. The Olympic speed band is an external plausibility check, not calibration or proof of native Kooi q reconstruction.
 *
 * Scenarios:
 * 1. A recurve at each end of its draw band, 49 and 54 lb, drawn full, launches Kooi's 0.02 kg arrow (`createBow.KOOI.arrow`, the issue's provisional arrow) inside the 54.7 to 62.2 m/s KSL recorded at the 2012 London Olympics.
 * 2. For every kind whose draw weight is read, the speed is 0 at brace and grows at each of 10 further travels to full draw.
 * 3. A crossbow, whose draw weight no source read gives, is refused at `draw`.
 * 4. Each hand-drawn kind drawn full launches a 0.02 kg arrow at the declared prototype energy balance worked here, `sqrt(2 q F X / (m + K))` with authored stroke factor `q` 0.407 for the longbow and 0.426 for recurve/horse bow, reinterpreted from native reference numbers without converting their full-draw normalization, and `K = m0 (1 - eta) / eta` from his 0.765 efficiency at 0.02 kg (Kooi 1983, pp. 46, 77, 117, 161), within 1e-12 of it; a 0.04 kg arrow leaves slower.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces bows and reads their launch speed across draws with finite-safe comparisons; a speed outside the recorded band, one that does not grow with the draw, or one at brace is caught.
 * @evidence contracts/development/testing.md#independent-expectations The band is KSL's measured speeds, read here as numbers, not from the producer; the energy balance and explicit prototype stroke factors are restated here independently of implementation. These factors reuse Kooi's reference numbers under a different, provisional normalization, so this unit does not validate measured stored energy.
 * @evidence contracts/development/testing.md#distinguishing-cases Both ends of the recurve's draw band, every kind, brace and full draw, two arrow masses.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_weapon_bow_launch(): void {
  const findings: string[] = [];
  // A pound-force in the order the band multiplies it, so a band end fixed here is the band's own float.
  const lbf: (pounds: number) => number = (pounds: number): number =>
    pounds * AutoMovieArchetypeUnits.POUND * AutoMovieEngineGravity.STANDARD;
  for (const pounds of [49, 54]) {
    const bow: ReturnType<typeof AutoMovieArchetypeBow.create> = AutoMovieArchetypeBow.create({
      kind: "recurve",
      draw: lbf(pounds),
    });
    const speed: number = AutoMovieArchetypeBow.launchSpeed(
      bow,
      AutoMovieArchetypeBow.KOOI.arrow,
      bow.affordance("string").travel!,
    );
    if (!(speed >= 54.7 && speed <= 62.2))
      findings.push(`a ${pounds} lb recurve launches at ${speed} m/s`);
  }
  // A crossbow's draw weight is unread, so its launch is refused at `draw`.
  let refused: string | null = null;
  try {
    AutoMovieArchetypeBow.launchSpeed(
      AutoMovieArchetypeBow.create({ kind: "crossbow" }),
      AutoMovieArchetypeBow.KOOI.arrow,
      0,
    );
  } catch (error) {
    refused =
      error instanceof AutoMovieArchetypeRefusal ? error.axis : String(error);
  }
  if (refused !== "draw")
    findings.push(
      `a crossbow's launch was refused at ${refused}, not at its unread draw`,
    );
  for (const kind of AutoMovieArchetypeBow.KINDS.filter(
    (k: AutoMovieArchetypeBow.Kind): boolean => k !== "crossbow",
  )) {
    const bow: ReturnType<typeof AutoMovieArchetypeBow.create> = AutoMovieArchetypeBow.create({ kind });
    const stroke: number = bow.affordance("string").travel!;
    let before: number = AutoMovieArchetypeBow.launchSpeed(bow, AutoMovieArchetypeBow.KOOI.arrow, 0);
    if (before !== 0)
      findings.push(`${kind} at brace launches at ${before} m/s`);
    for (let k: number = 1; k <= 10; ++k) {
      const now: number = AutoMovieArchetypeBow.launchSpeed(
        bow,
        AutoMovieArchetypeBow.KOOI.arrow,
        (k / 10) * stroke,
      );
      if (!(now > before))
        findings.push(
          `${kind}: the speed does not grow at ${k / 10} of the draw`,
        );
      before = now;
    }
  }
  // 4. The prototype law worked here: a full stroke stores q F X with the explicitly reinterpreted reference numbers, and the virtual mass is m0 (1 - eta) / eta; a heavier arrow leaves slower.
  const QUOTIENT: Readonly<Record<"longbow" | "recurve" | "horseBow", number>> =
    { longbow: 0.407, recurve: 0.426, horseBow: 0.426 };
  const virtual: number = (0.02 * (1 - 0.765)) / 0.765;
  for (const kind of ["longbow", "recurve", "horseBow"] as const) {
    const bow: ReturnType<typeof AutoMovieArchetypeBow.create> = AutoMovieArchetypeBow.create({ kind });
    const stroke: number = bow.affordance("string").travel!;
    const expected: number = Math.sqrt(
      (2 * QUOTIENT[kind] * bow.dimensions.draw! * stroke) / (0.02 + virtual),
    );
    const full: number = AutoMovieArchetypeBow.launchSpeed(bow, 0.02, stroke);
    if (!(Math.abs(full / expected - 1) <= 1e-12))
      findings.push(
        `${kind} drawn full launches at ${full} m/s, ${expected} m/s worked`,
      );
    if (!(AutoMovieArchetypeBow.launchSpeed(bow, 0.04, stroke) < full))
      findings.push(`${kind}: a heavier arrow does not leave slower`);
  }
  TestValidator.equals("a bow launches at its stored energy", findings, []);
}
