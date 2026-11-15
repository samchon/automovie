import {
  type Archetype,
  type IArchetypeBand,
  createCannon,
} from "@automovie/archetypes";
import { TestValidator } from "@nestia/e2e";

import { archetypeBandSweep } from "../internal/archetypeBandSweep";

/** The contacts every kind of cannon offers: a muzzle and a vent, both sockets. */
const SOCKETS: readonly createCannon.Affordance[] = ["muzzle", "vent"];

/**
 * Every kind of cannon stays inside its bands for every seed, marks its unread bands provisional, and offers its muzzle and vent as sockets.
 *
 * Scenarios, over 200 seeds of each kind:
 * 1. Every drawn dimension lies inside the band the archetype records it was drawn in, and the values of a band with both ends apart span at least `archetypeBandSweep.COVERAGE` of it, #3368's acceptance floor.
 * 2. Every band a kind declares whose source says it is borrowed or an estimate is marked provisional.
 * 3. Each kind's `muzzle` and `vent` are sockets.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Produces each kind for 200 seeds and reads its dimensions against its recorded bands and its contacts; a value outside its band, an unreached band end, an unmarked borrowed band or a muzzle of another kind is caught.
 * @evidence contracts/development/testing.md#independent-expectations The bands are read from the archetype's own provenance, so the check is that the draw honours what it records; the provisional rule is read from each band's own source text.
 * @evidence contracts/development/testing.md#distinguishing-cases The four kinds, each across its bands' ends.
 * @evidence contracts/development/testing.md#execution-ownership A unit test over in-memory models, discovered by its exported name; it starts no host.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the three scenarios and what each pins.
 */
export function test_archetype_cannon_bands(): void {
  const findings: string[] = [];
  for (const kind of createCannon.KINDS) {
    const reached: Map<string, { low: number; high: number }> = new Map();
    for (let seed: number = 0; seed < archetypeBandSweep.SEEDS; seed++) {
      const gun: Archetype<createCannon.Affordance, createCannon.Dimension> =
        createCannon({ kind }, seed);
      for (const [name, band] of Object.entries(gun.provenance.bands) as [
        createCannon.Dimension,
        IArchetypeBand,
      ][]) {
        const value: number = gun.dimensions[name]!;
        if (!(value >= band.minimum - 1e-12 && value <= band.maximum + 1e-12))
          findings.push(
            `${kind}@${seed}: ${name} ${value} outside ${band.minimum} to ${band.maximum}`,
          );
        const seen: { low: number; high: number } = reached.get(name) ?? {
          low: Infinity,
          high: -Infinity,
        };
        reached.set(name, {
          low: Math.min(seen.low, value),
          high: Math.max(seen.high, value),
        });
      }
      for (const id of SOCKETS)
        if (gun.affordance(id).kind !== "socket")
          findings.push(`${kind}@${seed}: ${id} is not a socket`);
    }
    for (const [name, band] of Object.entries(createCannon.BANDS[kind]) as [
      string,
      IArchetypeBand,
    ][]) {
      if (/borrowed|estimate/.test(band.source) && band.provisional !== true)
        findings.push(
          `${kind}: ${name} is borrowed or estimated but not provisional`,
        );
      const seen: { low: number; high: number } | undefined = reached.get(name);
      const span: number = band.maximum - band.minimum;
      if (
        seen !== undefined &&
        span > 0 &&
        !(seen.high - seen.low >= archetypeBandSweep.COVERAGE * span)
      )
        findings.push(
          `${kind}: ${name} reached only ${seen.low} to ${seen.high}`,
        );
    }
  }
  TestValidator.equals("every cannon stays in its bands", findings, []);
}
