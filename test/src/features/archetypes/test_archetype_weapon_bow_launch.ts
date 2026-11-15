import {
  ArchetypeCourse,
  ArchetypeRefusal,
  ArchetypeUnits,
  createBow,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/**
 * A bow launches its arrow at the speed its stored energy gives, inside what the Olympic archers' bows were measured at, faster the further it is drawn.
 *
 * Scenarios:
 * 1. A recurve at each end of its draw band, 49 and 54 lb, drawn full, launches Kooi's 0.02 kg arrow (`createBow.KOOI.arrow`, the issue's provisional arrow) inside the 54.7 to 62.2 m/s KSL recorded at the 2012 London Olympics.
 * 2. For every kind whose draw weight is read, the speed is 0 at brace and grows at each of 10 further travels to full draw.
 * 3. A crossbow, whose draw weight no source read gives, is refused at `draw`.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces bows and reads their launch speed across draws; a speed outside the recorded band, one that does not grow with the draw, or one at brace is caught.
 * @evidence contracts/development/testing.md#independent-expectations The band is KSL's measured speeds, read here as numbers, not from the producer.
 * @evidence contracts/development/testing.md#distinguishing-cases Both ends of the recurve's draw band, every kind, brace and full draw.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the two scenarios and what each pins.
 */
export function test_archetype_weapon_bow_launch(): void {
  const findings: string[] = [];
  const lbf: number = ArchetypeUnits.POUND * ArchetypeCourse.GRAVITY;
  for (const pounds of [49, 54]) {
    const bow: ReturnType<typeof createBow> = createBow({
      kind: "recurve",
      draw: pounds * lbf,
    });
    const speed: number = createBow.launchSpeed(
      bow,
      createBow.KOOI.arrow,
      bow.affordance("string").travel!,
    );
    if (!(speed >= 54.7 && speed <= 62.2))
      findings.push(`a ${pounds} lb recurve launches at ${speed} m/s`);
  }
  // A crossbow's draw weight is unread, so its launch is refused at `draw`.
  let refused: string | null = null;
  try {
    createBow.launchSpeed(createBow({ kind: "crossbow" }), createBow.KOOI.arrow, 0);
  } catch (error) {
    refused = error instanceof ArchetypeRefusal ? error.axis : String(error);
  }
  if (refused !== "draw")
    findings.push(`a crossbow's launch was refused at ${refused}, not at its unread draw`);
  for (const kind of createBow.KINDS.filter(
    (k: createBow.Kind): boolean => k !== "crossbow",
  )) {
    const bow: ReturnType<typeof createBow> = createBow({ kind });
    const stroke: number = bow.affordance("string").travel!;
    let before: number = createBow.launchSpeed(bow, createBow.KOOI.arrow, 0);
    if (before !== 0) findings.push(`${kind} at brace launches at ${before} m/s`);
    for (let k: number = 1; k <= 10; ++k) {
      const now: number = createBow.launchSpeed(
        bow,
        createBow.KOOI.arrow,
        (k / 10) * stroke,
      );
      if (!(now > before))
        findings.push(`${kind}: the speed does not grow at ${k / 10} of the draw`);
      before = now;
    }
  }
  TestValidator.equals("a bow launches at its stored energy", findings, []);
}
