import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** The largest step of the outer skin between neighbouring sections the profile still follows, mm. */
const JUMP: number = 30;

/** The measures one side of one person gives, per stature. */
interface IFootprint {
  amplitude: number;
  up: number;
  down: number;
  lateral: number;
  medial: number;
  halfWidth: number;
  medialMet: boolean;
}

/**
 * An estimate reading, not a check: the breasts' and the gluteal masses'
 * footprints on the trunk wall, from the private reference curves,
 * normalized and aggregated by sex, for the masses' footprints and
 * amplitudes.
 *
 * On each reference's trunk sections, the mass's point as
 * `test_human_estimate_masses` takes it: the bust point the trunk's most
 * anterior skin between 0.66 and 0.76 of stature at |z| of 30 mm or more, the
 * buttock point the most posterior skin between the crotch and 0.6 of
 * stature. The outer skin at a place is the most anterior (breast) or most
 * posterior (gluteal) skin point within 3 mm of it across the body.
 *
 * - The vertical profile, in the point's sagittal plane: the lower edge is
 *   the profile's deepest point below the point (the inframammary fold within
 *   0.08 of stature under the bust point; the gluteal fold down to 0.06 of
 *   stature under the crotch, read on the trunk's and the same side leg's
 *   sections, the outer of the two where both cut a level). Both edges are
 *   sought along the skin from the point's row, the walk stopping where the
 *   outer skin steps more than {@link JUMP} between neighbouring sections, the
 *   profile leaving the surface (at the point's z the neck's base or the
 *   thigh's medial side stands far behind). The wall's line runs from the
 *   lower edge to the upper edge, the profile's point above the mass whose
 *   line from the lower edge lies behind every point between (the back
 *   hull's first vertex),
 *   sought up to 0.82 of stature (suprasternale's band) for the breast and
 *   0.62 (iliocristale's band) for the gluteal mass. The amplitude is the
 *   point's projection over that line.
 * - The horizontal contour, in the point's own section: the lateral edge is
 *   the first place outward, in 2 mm steps, where the skin's setback behind the
 *   point reaches the amplitude; the medial edge the same inward, or, where
 *   the setback never reaches it before the median plane, the contour's
 *   deepest place between (the sternum's groove or the cleft), recorded as not
 *   meeting the wall.
 *
 * Each measure prints per stature and per the point's distance from the
 * median plane (half the points' width), as mean and SD over the sides, with
 * the count of people the sides come from; no person's value and no curve.
 *
 * Scenarios:
 * 1. For each sex and mass, prints the amplitude and the four edges per stature and per half point width, the people read, and the sides whose medial edge met the wall.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and prints the aggregate table; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the footprint tables it produces cite it and state their source as the private reference curves.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men read apart, each with both sides; the medial edge records whether it met the wall or stopped at the median groove.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_mass_footprints`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_mass_footprints(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_mass_footprints: no private curve pack in .references/curves; nothing read");
    return;
  }
  const table: Record<string, { rows: IFootprint[]; people: Set<string> }> = {};
  for (const id of ids) {
    const sex: string = id.startsWith("f") ? "female" : "male";
    const marks: HumanReferenceSections.ILandmarks = HumanReferenceSections.landmarks(id);
    const stature: number = marks.statureMm;
    const trunk: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, "trunk");
    const skin = (s: HumanReferenceSections.ISection): V3[] => [...s.loops, ...s.arcs].flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points);
    for (const [mass, lo, hi, sign, below, above] of [
      ["breast", 0.66 * stature, 0.76 * stature, 1, -0.08 * stature, 0.82 * stature],
      ["gluteal", marks.crotchMm, 0.6 * stature, -1, marks.crotchMm - 0.06 * stature, 0.62 * stature],
    ] as const)
      for (const side of [1, -1] as const) {
        // The mass's point.
        let point: V3 | null = null;
        for (const s of trunk)
          if (s.y >= lo && s.y <= hi)
            for (const p of skin(s)) if (side * p[2] >= 30 && (point === null || sign * p[0] > sign * point[0])) point = p;
        if (point === null) continue;
        const p0: V3 = point;
        // Outer skin, as a forward-positive depth (the gluteal's back read as positive).
        const outer = (points: V3[]): number =>
          points.reduce((a: number, p: V3): number => Math.max(a, sign * p[0]), -Infinity);
        const front: number = sign * p0[0];

        // The vertical profile at the point's z.
        const rows: HumanReferenceSections.ISection[] = mass === "gluteal" ? [...trunk, ...HumanReferenceSections.sections(id, side === 1 ? "leg_l" : "leg_r")] : trunk;
        const profile: { y: number; d: number }[] = rows
          .map((s: HumanReferenceSections.ISection): { y: number; d: number } => ({
            y: s.y,
            d: outer(skin(s).filter((p: V3): boolean => Math.abs(p[2] - p0[2]) <= 3)),
          }))
          .filter((r: { y: number; d: number }): boolean => Number.isFinite(r.d))
          .sort((a: { y: number }, b: { y: number }): number => a.y - b.y)
          .filter((r: { y: number; d: number }, k: number, all: { y: number; d: number }[]): boolean =>
            all.every((o: { y: number; d: number }, j: number): boolean => j === k || o.y !== r.y || o.d < r.d || (o.d === r.d && j > k)),
          );
        // Walk from the point's row along the skin, stopping where the
        // profile leaves the surface (a jump of more than JUMP between rows).
        const start: number = profile.reduce((a: number, r: { y: number }, k: number): number => (Math.abs(r.y - p0[1]) < Math.abs(profile[a]!.y - p0[1]) ? k : a), 0);
        const walk = (step: 1 | -1, limit: number): { y: number; d: number }[] => {
          const out: { y: number; d: number }[] = [];
          for (let k: number = start + step; k >= 0 && k < profile.length; k += step) {
            const r: { y: number; d: number } = profile[k]!;
            if (step * (r.y - limit) > 0 || Math.abs(r.d - profile[k - step]!.d) > JUMP) break;
            out.push(r);
          }
          return out;
        };
        const floor: number = mass === "breast" ? p0[1] + below : below;
        const lower: { y: number; d: number }[] = walk(-1, floor);
        if (lower.length === 0) continue;
        const fold: { y: number; d: number } = lower.reduce((a: { y: number; d: number }, b: { y: number; d: number }): { y: number; d: number } => (b.d < a.d ? b : a));
        const upper: { y: number; d: number }[] = walk(1, above);
        if (upper.length === 0) continue;
        const top: { y: number; d: number } = upper.reduce((a: { y: number; d: number }, b: { y: number; d: number }): { y: number; d: number } =>
          (b.d - fold.d) / (b.y - fold.y) < (a.d - fold.d) / (a.y - fold.y) ? b : a,
        );
        const wall: number = fold.d + ((p0[1] - fold.y) / (top.y - fold.y)) * (top.d - fold.d);
        const amplitude: number = front - wall;
        if (!(amplitude > 0)) continue;

        // The horizontal contour in the point's own section.
        const own: HumanReferenceSections.ISection | undefined = trunk.reduce(
          (a: HumanReferenceSections.ISection | undefined, b: HumanReferenceSections.ISection): HumanReferenceSections.ISection =>
            a === undefined || Math.abs(b.y - p0[1]) < Math.abs(a.y - p0[1]) ? b : a,
          undefined as HumanReferenceSections.ISection | undefined,
        );
        if (own === undefined) continue;
        const points: V3[] = skin(own);
        const reach: number = points.reduce((a: number, p: V3): number => Math.max(a, side * p[2]), -Infinity);
        const setback = (z: number): number => front - outer(points.filter((p: V3): boolean => Math.abs(p[2] - z) <= 2));
        let lateral: number = NaN;
        for (let z: number = side * p0[2]; z <= reach; z += 2) {
          const s: number = setback(side * z);
          if (Number.isFinite(s) && s >= amplitude) {
            lateral = z - side * p0[2];
            break;
          }
        }
        let medial: number = NaN;
        let medialMet: boolean = false;
        let deepest: { z: number; s: number } | null = null;
        for (let z: number = side * p0[2]; z >= 0; z -= 2) {
          const s: number = setback(side * z);
          if (!Number.isFinite(s)) continue;
          if (s >= amplitude) {
            medial = side * p0[2] - z;
            medialMet = true;
            break;
          }
          if (deepest === null || s > deepest.s) deepest = { z, s };
        }
        if (!medialMet && deepest !== null) medial = side * p0[2] - deepest.z;
        const key: string = `${sex} ${mass}`;
        table[key] ??= { rows: [], people: new Set<string>() };
        table[key]!.people.add(id);
        table[key]!.rows.push({
          amplitude: amplitude / stature,
          up: (top.y - p0[1]) / stature,
          down: (p0[1] - fold.y) / stature,
          lateral: lateral / stature,
          medial: medial / stature,
          halfWidth: (side * p0[2]) / stature,
          medialMet,
        });
      }
  }
  const S: typeof HumanSectionShape = HumanSectionShape;
  for (const [key, t] of Object.entries(table)) {
    const of = (f: (r: IFootprint) => number): number[] => t.rows.map(f);
    const perWidth = (f: (r: IFootprint) => number): number[] => t.rows.map((r: IFootprint): number => f(r) / r.halfWidth);
    const fields: [string, (r: IFootprint) => number][] = [
      ["amplitude", (r: IFootprint): number => r.amplitude],
      ["up", (r: IFootprint): number => r.up],
      ["down", (r: IFootprint): number => r.down],
      ["lateral", (r: IFootprint): number => r.lateral],
      ["medial", (r: IFootprint): number => r.medial],
    ];
    console.log(`${key} footprint per stature: ${fields.map(([n, f]: [string, (r: IFootprint) => number]): string => `${n} ${S.stat(of(f), 4)}`).join(", ")}; half point width ${S.stat(of((r: IFootprint): number => r.halfWidth), 4)}`);
    console.log(`${key} footprint per half point width: ${fields.map(([n, f]: [string, (r: IFootprint) => number]): string => `${n} ${S.stat(perWidth(f), 3)}`).join(", ")}`);
    console.log(`${key} footprint read on ${t.people.size} people (${[...t.people].sort((a: string, b: string): number => a.localeCompare(b)).join(", ")}), ${t.rows.length} sides; medial edge met the wall on ${t.rows.filter((r: IFootprint): boolean => r.medialMet).length}`);
  }
}
