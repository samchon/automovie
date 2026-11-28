import {
  FamilyConicBodyCaseResolve as Resolve,
} from "../../../reference-conics/FamilyConicBodyCaseResolve";
import {
  FamilyConicBodyCases as Cases,
} from "../../../reference-conics/FamilyConicBodyCases";
import type { IAutoMovieHumanF1NativeLaw } from "@automovie/interface";

/**
 * The body round's case table resolves into native fields for the rows the fields can state, and says why for the rest.
 *
 * The made base is a set of native fields whose every caliper is 100 mm deep and 80 broad and whose every length is 200 mm, bones 30.
 *
 * Scenarios:
 * 1. The table holds 109 rows with distinct identifiers: f1, 84 site rows (14 sites, three measures, two percentiles), 2 bust rows,
 *    2 tissue rows and 20 length rows.
 * 2. Each breadth and depth row of a site with a caliper changes that one number by the row's ratio and nothing else of the calipers;
 *    the base is not edited.
 * 3. A tissue row scales every caliper's depth and breadth and no length; a length row scales its one length (or the four long bones,
 *    or every phalanx) and no caliper.
 * 4. Every girth row, both bust rows and the thigh's breadth and depth rows are returned unresolved with a reason; no other row is.
 *    So `109 - 28 - 2 - 4 = 75` rows resolve today: f1, 26 breadth, 26 depth, 2 tissue and 20 length rows.
 * 5. A resolved record carries the row's identifier, the hip support of the base, no girth residual and the mirror's qualification.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the resolver on every row of the production table against made fields and reads the fields it returns.
 * @evidence contracts/development/testing.md#independent-expectations Each expected number is the made base's value times the row's own ratio; the counts are the table's structure (sites by measures by percentiles).
 * @evidence contracts/development/common.md#meaningful-documentation The synthetic fields exercise all 109 declared rows. Field and length edits, baseline identity, row-specific refusal and fresh result ownership have distinct expectations.
 */
export function test_human_body_case_resolve(): void {
  const failures: string[] = [];
  const size = (): { depth: number; breadth: number } => ({ depth: 100, breadth: 80 });
  const made = (): IAutoMovieHumanF1NativeLaw.IFields => ({
    hipJointCentreBreadth: 190,
    wall: { hipSkin: size(), omphalionWall: size(), underbustWall: size(), bustWall: size(), neckSkin: size(), headSkin: size() },
    roots: { arm: size(), leg: size(), breast: size(), nose: size() },
    breastProjection: 30,
    arm: { upperArm: size(), elbow: size(), forearm: size(), wrist: size() },
    leg: { knee: size(), calf: size(), ankle: size() },
    extremities: { hand: size(), foot: size(), finger: size(), toe: size() },
    lengths: { upperArm: 200, forearm: 200, thigh: 200, shank: 200, pelvisToThorax: 200, thoraxToHead: 200, handLength: 200, handBreadth: 200, footLength: 200, footBreadth: 200, phalanges: { index: [30, 30, 30], thumb: [30, 30, 30] } },
  });
  const calipers = (fields: IAutoMovieHumanF1NativeLaw.IFields): number[] => [fields.wall, fields.roots, fields.arm, fields.leg, fields.extremities].flatMap((group: object): number[] => Object.values(group as Record<string, { depth: number; breadth: number }>).flatMap((s: { depth: number; breadth: number }): number[] => [s.depth, s.breadth]));
  const lengths = (fields: IAutoMovieHumanF1NativeLaw.IFields): number[] => [...Object.entries(fields.lengths).flatMap(([key, value]: [string, unknown]): number[] => (key === "phalanges" ? [] : [value as number])), ...Object.values(fields.lengths.phalanges).flat()];
  const changed = (now: readonly number[], before: readonly number[]): number[] => now.map((x: number, k: number): number => x / before[k]!).filter((r: number): boolean => r !== 1);

  // 1. The table.
  if (Cases.CASES.length !== 109 || new Set(Cases.CASES.map((row: Cases.ICase): string => row.id)).size !== 109) failures.push("the table holds " + Cases.CASES.length + " rows, not 109 distinct ones");
  const count = (kind: Cases.Kind): number => Cases.CASES.filter((row: Cases.ICase): boolean => row.kind === kind).length;
  if (count("girth") !== 28 || count("breadth") !== 28 || count("depth") !== 28 || count("bust") !== 2 || count("tissue") !== 2 || count("length") !== 20 || count("f1") !== 1) failures.push("the table's kinds are not 28, 28, 28, 2, 2, 20 and 1");

  const base: IAutoMovieHumanF1NativeLaw.IFields = made();
  const [baseCalipers, baseLengths]: [number[], number[]] = [calipers(base), lengths(base)];
  let resolved: number = 0;
  for (const row of Cases.CASES) {
    const outcome: Resolve.IOutcome = Resolve.resolve(row, base);
    const unresolvable: boolean = row.kind === "girth" || row.kind === "bust" || ((row.kind === "breadth" || row.kind === "depth") && row.site === "thigh");

    // 4. Which rows resolve.
    if ("unresolved" in outcome) {
      if (!unresolvable) failures.push(row.id + " was not resolved: " + outcome.unresolved);
      if (outcome.unresolved.length === 0 || outcome.id !== row.id) failures.push(row.id + " is unresolved without its reason or its identifier");
      continue;
    }
    if (unresolvable) failures.push(row.id + " was resolved, though the native fields cannot state it");
    ++resolved;
    const fields: IAutoMovieHumanF1NativeLaw.IFields = outcome.resolved.fields;
    const [sizes, bones]: [number[], number[]] = [changed(calipers(fields), baseCalipers), changed(lengths(fields), baseLengths)];
    const all = (list: readonly number[], n: number): boolean => list.length === n && list.every((r: number): boolean => Math.abs(r - row.ratio) < 1e-12);

    // 2 and 3. What each kind moves.
    if ((row.kind === "breadth" || row.kind === "depth") && !(all(sizes, 1) && bones.length === 0)) failures.push(row.id + " moved " + sizes.length + " calipers and " + bones.length + " lengths");
    if (row.kind === "tissue" && !(all(sizes, baseCalipers.length) && bones.length === 0)) failures.push(row.id + " moved " + sizes.length + " of " + baseCalipers.length + " calipers and " + bones.length + " lengths");
    if (row.kind === "length") {
      const field: string = row.id.split("-")[1]!;
      const expected: number = field === "limbs" ? 4 : field === "phalanges" ? 6 : 1;
      if (!(all(bones, expected) && sizes.length === 0)) failures.push(row.id + " moved " + bones.length + " lengths, not " + expected + ", and " + sizes.length + " calipers");
    }
    if (row.kind === "f1" && (sizes.length !== 0 || bones.length !== 0)) failures.push("f1's row moved a field");

    // 5. The record.
    if (outcome.resolved.id !== row.id || outcome.resolved.rawDrivers.hipJointCentreBreadth !== 190 || outcome.resolved.girthResiduals !== null || !outcome.resolved.qualification.some((q: string): boolean => q.includes("mirror"))) failures.push(row.id + "'s record is not the table row's");
  }
  if (calipers(base).some((x: number, k: number): boolean => x !== baseCalipers[k]) || lengths(base).some((x: number, k: number): boolean => x !== baseLengths[k])) failures.push("resolving edited the base fields");

  // The rows that resolve today: every row but the girths, the bust's two and the thigh's breadth and depth.
  const expected: number = 109 - 28 - 2 - 4;
  if (resolved !== expected) failures.push(resolved + " rows resolved, not " + expected);
  if (failures.length !== 0) throw new Error(failures.slice(0, 15).join("\n"));
}
