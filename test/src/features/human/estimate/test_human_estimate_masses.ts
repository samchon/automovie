import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** Shares of the profile's span either side of the mass's point, -1 to 1. */
const SPAN: readonly number[] = [-1, -0.75, -0.5, -0.25, 0, 0.25, 0.5, 0.75, 1];

/**
 * An estimate reading, not a check: the breasts' and the gluteal masses'
 * profiles about their points, from the private reference curves, normalized
 * and aggregated by sex over the four people, for the masses' footprints and
 * profiles.
 *
 * On each reference's trunk sections: the bust point is the trunk's most
 * anterior skin between 0.66 and 0.76 of stature (ANSUR II's chest height
 * band, 0.687 to 0.760, `docs/sources/ansur-ii-trunk-ratios.md`, widened) at
 * z away from the midline (|z| of 30 mm or more); the buttock point the most
 * posterior skin between the crotch and 0.6 of stature. About each point, at
 * shares of 0.1 of stature up and down (the vertical profile, in the
 * point's sagittal plane: the most anterior or posterior skin within 3 mm of
 * its z) and at shares of a quarter of the section's breadth medially and
 * laterally (the horizontal contour, in the point's own section), the skin's
 * setback behind the point's front (or ahead of the buttock's back), per
 * stature. Each cell prints its mean and SD over the sides and people of the
 * sex, no person's value and no curve.
 *
 * Scenarios:
 * 1. For each sex and mass, prints the vertical profile's setback (down to up) and the horizontal contour's setback (medial to lateral) at each share of the span, per stature.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and prints the aggregate table; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the knot table it produces cites it and states its source as the private reference curves.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men read apart, each with both sides; the medial and lateral halves of the horizontal contour are reported apart.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_masses`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_masses(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_masses: no private curve pack in .references/curves; nothing read");
    return;
  }
  const table: Record<string, { vertical: number[][]; horizontal: number[][] }> = {};
  for (const id of ids) {
    const sex: string = id.startsWith("f") ? "female" : "male";
    const marks: HumanReferenceSections.ILandmarks = HumanReferenceSections.landmarks(id);
    const stature: number = marks.statureMm;
    const trunk: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, "trunk");
    const skin = (s: HumanReferenceSections.ISection): V3[] => [...s.loops, ...s.arcs].flatMap((l: HumanReferenceSections.ILoop): V3[] => l.points);
    for (const [mass, lo, hi, sign] of [
      ["breast", 0.66 * stature, 0.76 * stature, 1],
      ["gluteal", marks.crotchMm, 0.6 * stature, -1],
    ] as const)
      for (const side of [1, -1] as const) {
        const band: HumanReferenceSections.ISection[] = trunk.filter((s: HumanReferenceSections.ISection): boolean => s.y >= lo && s.y <= hi);
        let point: V3 | null = null;
        for (const s of band)
          for (const p of skin(s)) if (side * p[2] >= 30 && (point === null || sign * p[0] > sign * point[0])) point = p;
        if (point === null) continue;
        const key: string = `${sex} ${mass}`;
        table[key] ??= { vertical: SPAN.map((): number[] => []), horizontal: SPAN.map((): number[] => []) };
        const outer = (points: V3[]): number => (points.length === 0 ? NaN : sign * Math.max(...points.map((p: V3): number => sign * p[0])));
        const rowAt = (y: number): HumanReferenceSections.ISection | undefined =>
          trunk.reduce((a: HumanReferenceSections.ISection | undefined, b: HumanReferenceSections.ISection): HumanReferenceSections.ISection =>
            a === undefined || Math.abs(b.y - y) < Math.abs(a.y - y) ? b : a,
          undefined as HumanReferenceSections.ISection | undefined);
        const own: HumanReferenceSections.ISection | undefined = rowAt(point[1]);
        if (own === undefined) continue;
        const breadth: number = Math.max(...skin(own).map((p: V3): number => p[2])) - Math.min(...skin(own).map((p: V3): number => p[2]));
        const p0: V3 = point;
        SPAN.forEach((share: number, k: number): void => {
          const row: HumanReferenceSections.ISection | undefined = rowAt(p0[1] + share * 0.1 * stature);
          if (row !== undefined) {
            const v: number = outer(skin(row).filter((p: V3): boolean => Math.abs(p[2] - p0[2]) <= 3));
            if (Number.isFinite(v)) table[key]!.vertical[k]!.push((sign * (p0[0] - v)) / stature);
          }
          const z: number = p0[2] + side * share * 0.25 * breadth;
          const h: number = outer(skin(own).filter((p: V3): boolean => Math.abs(p[2] - z) <= 3));
          if (Number.isFinite(h)) table[key]!.horizontal[k]!.push((sign * (p0[0] - h)) / stature);
        });
      }
  }
  const S: typeof HumanSectionShape = HumanSectionShape;
  for (const [key, t] of Object.entries(table)) {
    console.log(`${key} vertical setback per stature, down to up: ${SPAN.map((s: number, k: number): string => `${s}: ${S.stat(t.vertical[k]!, 4)}`).join("; ")}`);
    console.log(`${key} horizontal setback per stature, medial to lateral: ${SPAN.map((s: number, k: number): string => `${s}: ${S.stat(t.horizontal[k]!, 4)}`).join("; ")}`);
  }
}
