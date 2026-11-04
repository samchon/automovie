import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPeople } from "../../internal/HumanPeople";
import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** The shoulder centre's depth under the acromion per biacromial breadth (Rab, Petuskey and Bagley 2002). */
const RAB: number = 0.17;

/** Shares of the upper arm's arc, from the elbow, whose loop centres fit its line. */
const FIT: readonly [number, number] = [0.2, 0.8];

/**
 * An estimate reading, not a check: the shoulder centre's breadth across the
 * body, from the private reference curves, for the shoulder centre's medial
 * placement where the published regression is silent (Rab, Petuskey and
 * Bagley 2002 give its depth under the acromion only).
 *
 * The humerus' centre line is the upper arm's: the line through the arm
 * loops' centres between {@link FIT} of the upper arm's arc from the elbow
 * (the elbow at the reference's own forearm length along the centres' line
 * from the wrist, as `test_human_estimate_arm_sections`), fitted by the
 * centres' mean and their principal direction. Each arm's line is read at
 * the shoulder centre's height, the acromial height less {@link RAB} of the
 * biacromial breadth; the two arms' points give the centres' half span,
 * independent of where the pack's frame puts the median plane. Printed per
 * biacromial breadth: the half span (the acromion stands at one half), and
 * the forward offset of each centre from the two centres' mean, the mean
 * and SD over the people (f1, f2, m1, m2), no person's value and no curve.
 *
 * Scenarios:
 * 1. Prints the shoulder centres' half span and forward offset per biacromial breadth.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and the references' public inputs (`HumanPeople.params`: forearm length, acromial height, biacromial breadth), fits each upper arm's centre line and prints the aggregate; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the law it feeds cites it and states its source as the private reference curves.
 * @evidence contracts/testing.md#distinguishing-cases Two women and two men, both arms each; a person missing an input or an arm is left out, and the spread shows how far one value stands for the set.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_shoulder_centre`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_shoulder_centre(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_shoulder_centre: no private curve pack in .references/curves; nothing read");
    return;
  }
  const spans: number[] = [];
  const forwards: number[] = [];
  for (const id of ids) {
    const params: IAutoMovieHumanParameters = HumanPeople.params(id);
    const forearm: number | undefined = params.body.anatomy.forearmLength;
    const acromial: number | undefined = params.body.anatomy.acromialHeight;
    const biacromial: number | undefined = params.body.anatomy.biacromialBreadth;
    if (forearm === undefined || acromial === undefined || biacromial === undefined) {
      console.log(`${id}: forearm ${forearm}, acromial height ${acromial}, biacromial ${biacromial}; left out`);
      continue;
    }
    const height: number = acromial - RAB * biacromial;
    const points: (V3 | null)[] = (["arm_l", "arm_r"] as const).map((region: "arm_l" | "arm_r"): V3 | null => line(id, region, forearm, height));
    const [left, right] = points;
    if (left === null || right === null || left === undefined || right === undefined) {
      console.log(`${id}: an upper arm reads no centre line (left ${left === null ? "none" : "read"}, right ${right === null ? "none" : "read"}); left out`);
      continue;
    }
    spans.push(Math.abs(left[2] - right[2]) / 2 / biacromial);
    const mean: number = (left[0] + right[0]) / 2;
    forwards.push((left[0] - mean) / biacromial, (right[0] - mean) / biacromial);
  }
  console.log(
    `shoulder centre at ${RAB} biacromial under the acromion: half span per biacromial ${HumanSectionShape.stat(spans, 4)} (the acromion at 0.5); forward offset per biacromial ${HumanSectionShape.stat(forwards, 4)}`,
  );
}

/**
 * One upper arm's centre line read at a height.
 *
 * @param id The reference person.
 * @param region The arm's region.
 * @param forearm The person's forearm length, mm.
 * @param height The height to read the line at, mm.
 * @returns The line's point there, or null where the arm reads too few loops.
 */
function line(id: string, region: "arm_l" | "arm_r", forearm: number, height: number): V3 | null {
  const centres: V3[] = HumanReferenceSections.sections(id, region)
    .filter((s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0)
    .map((s: HumanReferenceSections.ISection): V3 => {
      const loop: HumanReferenceSections.ILoop = s.loops.reduce((a: HumanReferenceSections.ILoop, b: HumanReferenceSections.ILoop): HumanReferenceSections.ILoop =>
        HumanReferenceSections.extent(b).girth > HumanReferenceSections.extent(a).girth ? b : a,
      );
      return HumanReferenceSections.extent(loop).centre;
    });
  if (centres.length < 4) return null;

  // Arc length from the wrist (the lowest cut); the upper arm from the
  // elbow at the forearm's length to the top cut.
  const arc: number[] = [0];
  for (let i: number = 1; i < centres.length; i++) arc.push(arc[i - 1]! + norm(sub(centres[i]!, centres[i - 1]!)));
  const total: number = arc[arc.length - 1]!;
  if (!(total > forearm)) return null;
  const chosen: V3[] = centres.filter((_: V3, i: number): boolean => {
    const share: number = (arc[i]! - forearm) / (total - forearm);
    return share >= FIT[0] && share <= FIT[1];
  });
  if (chosen.length < 2) return null;

  // The line: the centres' mean and their principal direction (power
  // iteration on the scatter matrix).
  const mean: V3 = scale(chosen.reduce((a: V3, c: V3): V3 => add(a, c), [0, 0, 0]), 1 / chosen.length);
  let d: V3 = unit(sub(chosen[chosen.length - 1]!, chosen[0]!));
  for (let k: number = 0; k < 32; k++) d = unit(chosen.reduce((a: V3, c: V3): V3 => add(a, scale(sub(c, mean), dot(sub(c, mean), d))), [0, 0, 0]));
  if (!(Math.abs(d[1]) > 1e-9)) return null;
  return add(mean, scale(d, (height - mean[1]) / d[1]));
}

/** a + b. */
function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

/** a - b. */
function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** s a. */
function scale(a: V3, s: number): V3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

/** a . b. */
function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** |a|. */
function norm(a: V3): number {
  return Math.hypot(a[0], a[1], a[2]);
}

/** a / |a|. */
function unit(a: V3): V3 {
  const n: number = norm(a);
  return n > 0 ? scale(a, 1 / n) : [0, 0, 0];
}
