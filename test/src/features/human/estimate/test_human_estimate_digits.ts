import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** Shares along a digit's centre line, root 0 to tip 1, at which its section is read. */
const SHARES: readonly number[] = [0.2, 0.35, 0.5, 0.65, 0.8];

/** Greatest distance between a loop's centre and its chain's last centre one section apart, mm. */
const STEP: number = 25;

/** One digit's chain of loops down the hand's sections. */
interface IChain {
  /** Each loop's centre and points, root first. */
  rows: { centre: V3; points: V3[] }[];
}

/**
 * An estimate reading, not a check: the digits' sections normal to their own
 * axes and their bend, from the private reference curves' horizontal hand
 * sections, per person, recording whether the reprojection holds.
 *
 * The hands hang in the captured pose, so each digit crosses the horizontal
 * sections obliquely. Down each hand's sections (the pack's hand region, the
 * wrist cut to the fingertips), every loop joins the chain whose last centre
 * lies nearest within 25 mm, or starts a chain: the palm's chain splits into
 * the digits' chains where the fingers part. Each chain's loops are moved
 * along its local axis (its centres' line over two loops either side) into
 * the plane normal to it, as for the arm (`test_human_estimate_arm_sections`),
 * and read for the section's two principal extents (the eigenvectors of the
 * points' spread): the lesser over the greater (a digit's depth over its
 * breadth) and the girth; the chain's bend is the angle between the axis
 * over its first and last thirds. A hand holds when four or five chains other
 * than the palm's run at least 25 mm; each person's hands print their chain
 * count, and the digits of the hands that hold aggregate the ratio, girth per
 * chain length and bend, mean and SD, no digit's value and no curve.
 *
 * Scenarios:
 * 1. For each reference and side, prints the digit chains found and whether the hand holds.
 * 2. Over the digits of the hands that hold, prints the depth over breadth and the girth per chain length at shares of the chain, and the bend.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`), chains, reprojects and prints the per-hand counts and the aggregates; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the per-hand count records where the method fails.
 * @evidence contracts/testing.md#distinguishing-cases Both hands of two women and two men; the digits are not told apart by name, so the aggregate is over all digits of the hands that hold.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_digits`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_digits(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_digits: no private curve pack in .references/curves; nothing read");
    return;
  }
  const ratio: number[][] = SHARES.map((): number[] => []);
  const girth: number[][] = SHARES.map((): number[] => []);
  const bend: number[] = [];
  for (const id of ids)
    for (const region of ["hand_l", "hand_r"]) {
      const rows: HumanReferenceSections.ISection[] = HumanReferenceSections.sections(id, region)
        .filter((s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0)
        .reverse();
      const chains: IChain[] = [];
      for (const s of rows)
        for (const l of s.loops) {
          const centre: V3 = HumanReferenceSections.extent(l).centre;
          let best: IChain | null = null;
          let gap: number = STEP;
          for (const c of chains) {
            const d: number = norm(sub(c.rows[c.rows.length - 1]!.centre, centre));
            if (d < gap && Math.abs(c.rows[c.rows.length - 1]!.centre[1] - centre[1]) > 0.5) {
              gap = d;
              best = c;
            }
          }
          if (best === null) chains.push({ rows: [{ centre, points: l.points }] });
          else best.rows.push({ centre, points: l.points });
        }
      const lengthOf = (c: IChain): number => c.rows.slice(1).reduce((a: number, r: { centre: V3 }, i: number): number => a + norm(sub(r.centre, c.rows[i]!.centre)), 0);
      const long: IChain[] = chains.filter((c: IChain): boolean => lengthOf(c) >= 25);
      const palm: IChain | undefined = long.reduce((a: IChain | undefined, b: IChain): IChain => (a === undefined || b.rows.length > a.rows.length ? b : a), undefined as IChain | undefined);
      const digits: IChain[] = long.filter((c: IChain): boolean => c !== palm);
      const holds: boolean = digits.length >= 4 && digits.length <= 5;
      console.log(`${id} ${region}: ${digits.length} digit chains, ${holds ? "holds" : "does not hold"}`);
      if (!holds) continue;
      for (const c of digits) {
        const n: number = c.rows.length;
        if (n < 5) continue;
        const third: number = Math.max(1, Math.floor(n / 3));
        const first: V3 = unit(sub(c.rows[third]!.centre, c.rows[0]!.centre));
        const lastAxis: V3 = unit(sub(c.rows[n - 1]!.centre, c.rows[n - 1 - third]!.centre));
        bend.push((Math.acos(Math.max(-1, Math.min(1, dot(first, lastAxis)))) * 180) / Math.PI);
        const length: number = lengthOf(c);
        SHARES.forEach((share: number, k: number): void => {
          const i: number = Math.min(n - 1, Math.round(share * (n - 1)));
          const axis: V3 = unit(sub(c.rows[Math.min(n - 1, i + 2)]!.centre, c.rows[Math.max(0, i - 2)]!.centre));
          const centre: V3 = c.rows[i]!.centre;
          const plane: [number, number][] = [];
          const e1: V3 = unit(Math.abs(axis[0]) < 0.9 ? sub([1, 0, 0], scale(axis, axis[0])) : sub([0, 0, 1], scale(axis, axis[2])));
          const e2: V3 = cross(axis, e1);
          for (const p of c.rows[i]!.points) {
            const q: V3 = sub(p, centre);
            const m: V3 = sub(q, scale(axis, dot(q, axis)));
            plane.push([dot(m, e1), dot(m, e2)]);
          }

          // The spread's principal extents: the eigenvalues of its 2x2 covariance.
          const mx: number = plane.reduce((a: number, p: [number, number]): number => a + p[0], 0) / plane.length;
          const my: number = plane.reduce((a: number, p: [number, number]): number => a + p[1], 0) / plane.length;
          let sxx: number = 0;
          let syy: number = 0;
          let sxy: number = 0;
          for (const p of plane) {
            sxx += (p[0] - mx) ** 2;
            syy += (p[1] - my) ** 2;
            sxy += (p[0] - mx) * (p[1] - my);
          }
          const tr: number = sxx + syy;
          const det: number = sxx * syy - sxy * sxy;
          const root: number = Math.sqrt(Math.max(0, (tr * tr) / 4 - det));
          const major: number = tr / 2 + root;
          const minor: number = tr / 2 - root;
          if (!(major > 0)) return;
          ratio[k]!.push(Math.sqrt(Math.max(0, minor) / major));
          girth[k]!.push(HumanReferenceSections.extent({ points: plane.map((p: [number, number]): V3 => [p[0], 0, p[1]]) }).girth / length);
        });
      }
    }
  const S: typeof HumanSectionShape = HumanSectionShape;
  console.log(`digit bend, first third to last third, degrees: ${S.stat(bend, 1)}`);
  SHARES.forEach((share: number, k: number): void => console.log(`digit share ${share.toFixed(2)}: depth over breadth ${S.stat(ratio[k]!, 3)}, girth per chain length ${S.stat(girth[k]!, 3)}`));
}

/** a - b. */
function sub(a: V3, b: V3): V3 {
  return [a[0] - b[0], a[1] - b[1], a[2] - b[2]];
}

/** a scaled. */
function scale(a: V3, s: number): V3 {
  return [a[0] * s, a[1] * s, a[2] * s];
}

/** a . b. */
function dot(a: V3, b: V3): number {
  return a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
}

/** a x b. */
function cross(a: V3, b: V3): V3 {
  return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
}

/** |a|. */
function norm(a: V3): number {
  return Math.sqrt(dot(a, a));
}

/** a / |a|. */
function unit(a: V3): V3 {
  return scale(a, 1 / norm(a));
}
