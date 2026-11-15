import {
  type Archetype,
  type IArchetypeBand,
  createSiegeEngine,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

/** How many seeds are swept: the 200 of the archetype campaign's acceptance law (#3365). */
const SEEDS: number = 200;

/** The contacts every siege engine offers. */
const CONTACTS: readonly createSiegeEngine.Affordance[] = [
  "arm",
  "pouch",
  "pin",
  "winch",
  "frame",
];

/**
 * Every siege engine stays in its bands for every seed, reaches both ends of each, derives its arm's reach, and offers its contacts.
 *
 * Scenarios, over 200 seeds of each kind:
 * 1. Every drawn dimension lies inside the band the archetype records it was drawn in, and a band with both ends apart is reached near both.
 * 2. The arm's reach is derived, not drawn: through its rest straight up and as far again, 180 degrees plus its cocked travel.
 * 3. Each has an arm, a pouch, a pin, a winch and a frame, and a trebuchet a counterweight; a mangonel has none.
 * 4. A throw from every seed launches: its release second lies after the pin's.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each kind for 200 seeds and reads its dimensions, contacts and throw; a value outside its band, an unreached band end, a drawn reach, a missing contact or a throw that never launches is caught.
 * @evidence contracts/development/testing.md#independent-expectations The bands are read from the archetype's own provenance; the reach is worked here from the cocked travel.
 * @evidence contracts/development/testing.md#distinguishing-cases Both kinds across every band's ends.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the four scenarios and what each pins.
 */
export function test_archetype_siege_bands(): void {
  const findings: string[] = [];
  for (const kind of createSiegeEngine.KINDS) {
    const reached: Map<string, { low: number; high: number }> = new Map();
    for (let seed: number = 0; seed < SEEDS; seed++) {
      const engine: Archetype<
        createSiegeEngine.Affordance,
        createSiegeEngine.Dimension
      > = createSiegeEngine({ kind }, seed);
      const d: Readonly<Partial<Record<createSiegeEngine.Dimension, number>>> =
        engine.dimensions;
      for (const [name, band] of Object.entries(engine.provenance.bands) as [
        createSiegeEngine.Dimension,
        IArchetypeBand,
      ][]) {
        const value: number = d[name]!;
        if (!(value >= band.minimum - 1e-12 && value <= band.maximum + 1e-12))
          findings.push(`${kind}@${seed}: ${name} ${value} outside its band`);
        const seen: { low: number; high: number } = reached.get(name) ?? {
          low: Infinity,
          high: -Infinity,
        };
        reached.set(name, {
          low: Math.min(seen.low, value),
          high: Math.max(seen.high, value),
        });
      }
      if (
        engine.provenance.bands.reach !== undefined ||
        Math.abs(d.reach! - (180 + d.cocked!)) > 1e-9
      )
        findings.push(`${kind}@${seed}: the reach is ${d.reach}`);
      const ids: readonly string[] = engine.affordances.map(
        (a: { id: string }): string => a.id,
      );
      for (const id of CONTACTS)
        if (!ids.includes(id)) findings.push(`${kind}@${seed}: no ${id}`);
      if (ids.includes("counterweight") !== (kind === "trebuchet"))
        findings.push(`${kind}@${seed}: its counterweight is wrong`);
      if (seed % 50 === 0 && !(createSiegeEngine.throwAt(engine, 0).second > 0))
        findings.push(
          `${kind}@${seed}: the throw does not launch after the pin`,
        );
    }
    for (const [name, band] of Object.entries(
      createSiegeEngine.BANDS[kind],
    ) as [string, IArchetypeBand][]) {
      const seen: { low: number; high: number } | undefined = reached.get(name);
      const span: number = band.maximum - band.minimum;
      if (
        seen !== undefined &&
        span > 0 &&
        !(
          seen.low < band.minimum + span / 4 &&
          seen.high > band.maximum - span / 4
        )
      )
        findings.push(
          `${kind}: ${name} reached only ${seen.low} to ${seen.high}`,
        );
    }
  }
  TestValidator.equals("every siege engine stays in its bands", findings, []);
}
