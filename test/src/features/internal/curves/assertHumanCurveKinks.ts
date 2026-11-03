import { HumanInputs } from "../HumanInputs";
import type { HumanAnatomy } from "../HumanAnatomy";
import { HumanAnatomyAudit } from "../HumanAnatomyAudit";
import { HumanAnatomyShared } from "../HumanAnatomyShared";
import { HumanPeople } from "../HumanPeople";
import { HumanCurveKinks } from "./HumanCurveKinks";

type IRow = HumanAnatomyAudit.IRow;

/**
 * Read one kink region on every person and fail with every azimuth whose
 * sharpest turn passes the crease bound, by person, azimuth and place, after
 * proving the region's reading red on a made ridge.
 *
 * The proof raises a Gaussian ring 3 mm high and 2 mm wide round the region's
 * axis at the middle of its stations on a copy of f1's skin: its sagitta over
 * a 10 mm chord is `3 (1 - exp(-25 / 8))`, 2.87 mm, so the copy's sharpest
 * reading within 8 mm of the ring must pass the bound and stand at least
 * 1.5 mm above the unedited skin's there.
 *
 * @param region The region to read.
 * @throws {Error} Listing every failing row, or the proof that did not turn red.
 */
export function assertHumanCurveKinks(region: HumanCurveKinks.IRegion): void {
  const failures: string[] = [];

  // The made ridge on f1.
  const base: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject("f1");
  const S: number = HumanInputs.stature(base.params);
  const skin: HumanAnatomy.ISkin = base.bind();
  const f: HumanCurveKinks.IFrame = region.frame(skin, S);
  const station: number = (f.from + f.to) / 2;
  const made: HumanAnatomy.ISkin = HumanCurveKinks.ridge(skin, region, S, station, 3, 2);

  // Read both skins only within 8 mm of the ridge, so a defect the unedited skin has elsewhere cannot mask the proof.
  const near: HumanCurveKinks.IRegion = {
    ...region,
    frame: (s: HumanAnatomy.ISkin, stature: number): HumanCurveKinks.IFrame => ({ ...region.frame(s, stature), from: station - 8, to: station + 8 }),
  };
  const worst: (rows: IRow[]) => number = (rows: IRow[]): number => rows.reduce((m: number, r: IRow): number => Math.max(m, r.value), 0);
  const before: number = worst(HumanCurveKinks.rows(base, near, skin));
  const after: number = worst(HumanCurveKinks.rows(base, near, made));
  if (!(after > HumanAnatomyShared.CREASE && after >= before + 1.5))
    failures.push(`made ridge on f1 (${region.rule}): sharpest reading ${after.toFixed(2)} mm against ${before.toFixed(2)} unedited; expected past the 1 mm bound and 1.5 mm above`);

  // Every person, every azimuth.
  for (const name of HumanPeople.names()) {
    try {
      const subject: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject(name);
      if (region.applies !== undefined && !region.applies(subject)) continue;
      for (const r of HumanCurveKinks.rows(subject, region))
        if (!HumanAnatomyAudit.passes(r)) failures.push(`${r.person.padEnd(14)} ${r.site}: ${r.value.toFixed(2)} mm over ${r.high.toFixed(2)}`);
    } catch (error) {
      failures.push(`${name.padEnd(14)} ${region.name} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} ${region.rule} findings:\n${failures.join("\n")}`);
}
