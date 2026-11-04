import { HumanInputs } from "../HumanInputs";
import { HumanAnatomy } from "../HumanAnatomy";
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
 * The proof raises a Gaussian ring round the region's axis at the middle of
 * its stations on a copy of f1's skin, as wide as the skin's row spacing there
 * (at least 2 mm) and as high as gives its sagitta over a 10 mm chord the
 * reader's allowance plus three crease sagittas, about 4 mm, so the copy's sharpest
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

  // The ring is as wide as the skin's own row spacing at its station (at
  // least 2 mm), and as high as keeps its sagitta over the reading's 10 mm
  // chord at 2.87 mm: a ring narrower than the rows reaches the cut outline
  // only at the nearest row, and read 0.84 to 1.44 mm on f1.
  const width: number = Math.max(2, rowSpacing(skin, region, f, station));
  const height: number = SAGITTA / (1 - Math.exp(-25 / (2 * width * width)));
  const made: HumanAnatomy.ISkin = HumanCurveKinks.ridge(skin, region, S, station, height, width);

  // Read both skins only within 8 mm of the ridge, so a defect the unedited skin has elsewhere cannot mask the proof.
  const near: HumanCurveKinks.IRegion = {
    ...region,
    frame: (s: HumanAnatomy.ISkin, stature: number): HumanCurveKinks.IFrame => ({ ...region.frame(s, stature), from: station - 8, to: station + 8 }),
  };
  const worst: (rows: IRow[]) => number = (rows: IRow[]): number => rows.reduce((m: number, r: IRow): number => Math.max(m, r.value), 0);
  const before: number = worst(HumanCurveKinks.rows(base, near, skin));
  const after: number = worst(HumanCurveKinks.rows(base, near, made));
  if (!(after > HumanAnatomyShared.CREASE && after >= before + 1.5)) {
    // A reading of nothing on both skins names the cut's own input: the
    // region's triangles near its axis between its stations.
    const lo: [number, number, number] = HumanAnatomy.add(f.origin, HumanAnatomy.scale(f.axis, station - 8));
    const hi: [number, number, number] = HumanAnatomy.add(f.origin, HumanAnatomy.scale(f.axis, station + 8));
    const near: number = HumanAnatomy.near(skin, lo, hi, f.reach).filter((t: number): boolean => region.chains.test(skin.chains[skin.tri[t]!]!)).length;
    failures.push(
      `made ridge on f1 (${region.rule}): sharpest reading ${after.toFixed(2)} mm against ${before.toFixed(2)} unedited; expected past the 1 mm bound and 1.5 mm above (ring ${width.toFixed(2)} mm wide, ${height.toFixed(2)} mm high; ${near} region triangles within the reach of the axis there)`,
    );
  }

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

/**
 * The made ring's sagitta over the reading's 10 mm chord, mm: the reader's own
 * allowance (the sagitta of a 12.5 mm radius, `HumanCurveKinks.SMOOTH`, which it
 * subtracts from every reading) plus three crease sagittas, so the made ring
 * reads three crease sagittas whatever the allowance. A design sagitta of
 * 2.87 mm read only 1.86 mm before sampling, under the proof's own margin.
 */
const SAGITTA: number = HumanCurveKinks.SMOOTH + 3 * HumanAnatomyShared.CREASE;

/**
 * The skin's row spacing along the region's axis at a station: the median gap
 * between the distinct axial places of the region's vertices within 10 mm of
 * it, places closer than 0.1 mm counted as one row.
 *
 * @param skin The skin.
 * @param region The region, whose chains are read.
 * @param f The region's frame on that skin.
 * @param station The station, mm along the axis.
 * @returns The spacing, mm; 0 when fewer than two rows lie there.
 */
function rowSpacing(skin: HumanAnatomy.ISkin, region: HumanCurveKinks.IRegion, f: HumanCurveKinks.IFrame, station: number): number {
  const keep: boolean[] = skin.chains.map((c: string): boolean => region.chains.test(c));
  const used: Uint8Array = new Uint8Array(skin.P.length / 3);
  for (let t: number = 0; t < skin.tri.length; t++) if (keep[skin.tri[t]!] === true) for (let k: number = 0; k < 3; k++) used[skin.I[3 * t + k]!] = 1;

  // One meridian band, the forward one, 3 mm either side: rows tilted to the
  // axis place their vertices at other stations at other azimuths.
  const forward: [number, number, number] = HumanAnatomy.unit(HumanAnatomy.reject(f.forward, f.axis));
  const side: [number, number, number] = HumanAnatomy.cross(f.axis, forward);
  const places: number[] = [];
  for (let v: number = 0; v < used.length; v++) {
    if (used[v] === 0) continue;
    const q: [number, number, number] = HumanAnatomy.sub(HumanAnatomy.point(skin, v), f.origin);
    const h: number = HumanAnatomy.dot(q, f.axis);
    if (Math.abs(h - station) <= 10 && HumanAnatomy.dot(q, forward) > 0 && Math.abs(HumanAnatomy.dot(q, side)) <= 3) places.push(h);
  }
  places.sort((a: number, b: number): number => a - b);
  const rows: number[] = places.filter((h: number, i: number): boolean => i === 0 || h - places[i - 1]! >= 0.1);
  const gaps: number[] = rows.slice(1).map((h: number, i: number): number => h - rows[i]!).sort((a: number, b: number): number => a - b);
  return gaps.length === 0 ? 0 : gaps[Math.floor(gaps.length / 2)]!;
}
