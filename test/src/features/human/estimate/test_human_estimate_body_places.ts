import { HumanReferenceSections } from "../../internal/HumanReferenceSections";

type V3 = HumanReferenceSections.V3;

/**
 * Cervicale's share of stature by sex, ANSUR II (`docs/sources/ansur-ii-trunk-ratios.md`):
 * the height the back's skin point is read at, since the pack's neck cut is
 * a labelling cut, not cervicale.
 */
const CERVICALE: Readonly<Record<"f" | "m", number>> = { f: 0.857, m: 0.8639 };

/** Shares of the foot's length from the heel at which the dorsum's height is read. */
const DORSUM: readonly number[] = [0.3, 0.4, 0.5, 0.6, 0.7, 0.74, 0.8, 0.9];

/**
 * An estimate reading, not a check: the body's forward places and the foot's
 * shape, aggregated over the private reference set, for the laws no published
 * source was found for.
 *
 * Read on each reference's horizontal sections (frame x forward, z the body's
 * left), every place relative to the midpoint of the two ankle loops' centres
 * (the pack's ankle cuts) and divided by stature (the pack's highest skin
 * point):
 *
 * - cervicale's forward place: the back's skin at cervicale's height (stature
 *   times ANSUR II's share by sex), the most posterior sampled point within
 *   15 mm of the median plane over the head and trunk regions' loops and
 *   arcs;
 * - the perineum's forward place: the midpoint of the front and back of the
 *   lowest trunk section's loop within 15 mm of the median plane.
 *
 * And per foot, divided by its own length (heel's rearmost to toe's foremost
 * point, x):
 *
 * - the foot's yaw: the angle in the floor plane of the line from the heel's
 *   rearmost point to the toe's foremost point, positive with the toe turned
 *   out (away from the median plane);
 * - the ankle centre's place: the ankle loop's centre from the heel;
 * - the dorsum's height at shares of the length from the heel (the highest
 *   foot section whose loop spans that place along x).
 *
 * Only the means and SDs over the people (four) or feet (eight) are printed;
 * no person's value and no curve is printed or stored.
 *
 * Scenarios:
 * 1. Prints cervicale's and the perineum's forward places over stature, mean and SD over the references present.
 * 2. Prints the foot's yaw (degrees), the ankle centre's share of the foot length, and the dorsum's height over the foot length at each share, mean and SD over the feet present.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) when present, locates each place by the stated rule and prints the aggregates; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; each law it informs cites it by name and states that no published source was found.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men, both feet each; the spread shows how far one value stands for the set.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_body_places`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_body_places(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_body_places: no private curve pack in .references/curves; nothing read");
    return;
  }
  const cervicale: number[] = [];
  const perineum: number[] = [];
  const yaw: number[] = [];
  const ankle: number[] = [];
  const dorsum: number[][] = DORSUM.map((): number[] => []);
  for (const id of ids) {
    const marks: HumanReferenceSections.ILandmarks = HumanReferenceSections.landmarks(id);
    const stature: number = marks.statureMm;
    const centreAt = (region: string, y: number): V3 | null => {
      const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, region, [y - 6, y + 6]).filter((s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0);
      if (rows.length === 0) return null;
      const row: HumanReferenceSections.ISection = rows.reduce((a: HumanReferenceSections.ISection, b: HumanReferenceSections.ISection): HumanReferenceSections.ISection => (Math.abs(b.y - y) < Math.abs(a.y - y) ? b : a));
      const e: HumanReferenceSections.IExtent = row.loops.map(HumanReferenceSections.extent).reduce((a: HumanReferenceSections.IExtent, b: HumanReferenceSections.IExtent): HumanReferenceSections.IExtent => (b.girth > a.girth ? b : a));
      return e.centre;
    };
    const left: V3 | null = centreAt("leg_l", marks.ankle_lMm);
    const right: V3 | null = centreAt("leg_r", marks.ankle_rMm);
    if (left === null || right === null) continue;
    const origin: number = (left[0] + right[0]) / 2;

    // Cervicale: the most posterior skin near the median plane at its height.
    const y7: number = CERVICALE[id.startsWith("f") ? "f" : "m"] * stature;
    let back: number = Infinity;
    for (const region of ["head", "trunk"])
      for (const s of HumanReferenceSections.sections(id, region, [y7 - 6, y7 + 6]))
        if (Math.abs(s.y - y7) <= 6)
          for (const l of [...s.loops, ...s.arcs]) for (const p of l.points) if (Math.abs(p[2]) <= 15) back = Math.min(back, p[0]);
    if (Number.isFinite(back)) cervicale.push((back - origin) / stature);

    // Perineum: the lowest trunk section's median chord's midpoint.
    const trunk: HumanReferenceSections.ISection | undefined = HumanReferenceSections.sections(id, "trunk", [marks.crotchMm - 1, marks.crotchMm + 40]).find(
      (s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0,
    );
    if (trunk !== undefined) {
      const xs: number[] = trunk.loops.flatMap((l: HumanReferenceSections.ILoop): number[] => l.points.filter((p: V3): boolean => Math.abs(p[2]) <= 15).map((p: V3): number => p[0]));
      if (xs.length !== 0) perineum.push(((Math.min(...xs) + Math.max(...xs)) / 2 - origin) / stature);
    }

    // Each foot: length, yaw, ankle centre and dorsum heights.
    for (const [region, legRegion, ankleY, side] of [
      ["foot_l", "leg_l", marks.ankle_lMm, 1],
      ["foot_r", "leg_r", marks.ankle_rMm, -1],
    ] as const) {
      const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, region).filter((s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0);
      if (rows.length === 0) continue;
      const points: V3[] = rows.flatMap((s: HumanReferenceSections.ISection): V3[] => s.loops.flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points));
      const heel: V3 = points.reduce((a: V3, b: V3): V3 => (b[0] < a[0] ? b : a));
      const toe: V3 = points.reduce((a: V3, b: V3): V3 => (b[0] > a[0] ? b : a));
      const length: number = toe[0] - heel[0];
      yaw.push((Math.atan2(side * (toe[2] - heel[2]), length) * 180) / Math.PI);
      const centre: V3 | null = centreAt(legRegion, ankleY);
      if (centre !== null) ankle.push((centre[0] - heel[0]) / length);
      DORSUM.forEach((share: number, k: number): void => {
        const x: number = heel[0] + share * length;
        let top: number = -Infinity;
        for (const s of rows)
          for (const l of s.loops) {
            const e: HumanReferenceSections.IExtent = HumanReferenceSections.extent(l);
            if (e.x[0] <= x && x <= e.x[1]) top = Math.max(top, s.y);
          }
        if (Number.isFinite(top)) dorsum[k]!.push(top / length);
      });
    }
  }
  const stat = (v: number[], digits: number): string => {
    if (v.length === 0) return "none";
    const m: number = v.reduce((a: number, b: number): number => a + b, 0) / v.length;
    const sd: number = Math.sqrt(v.reduce((a: number, b: number): number => a + (b - m) ** 2, 0) / Math.max(1, v.length - 1));
    return `${m.toFixed(digits)} (${sd.toFixed(digits)}), n ${v.length}`;
  };
  console.log(`cervicale forward of the ankles' mid centre, over stature: ${stat(cervicale, 4)}`);
  console.log(`perineum forward of the ankles' mid centre, over stature: ${stat(perineum, 4)}`);
  console.log(`foot yaw, toe out, degrees: ${stat(yaw, 2)}`);
  console.log(`ankle centre from the heel, over foot length: ${stat(ankle, 4)}`);
  DORSUM.forEach((share: number, k: number): void => console.log(`dorsum height at ${share.toFixed(2)} of the foot from the heel, over foot length: ${stat(dorsum[k]!, 4)}`));
}
