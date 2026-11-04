import type { IAutoMovieHumanParameters } from "../../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanPeople } from "../../internal/HumanPeople";
import { HumanReferenceSections } from "../../internal/HumanReferenceSections";
import { HumanSectionShape } from "../../internal/HumanSectionShape";

type V3 = HumanReferenceSections.V3;

/** Shares of each segment reported, from its distal end. */
const SHARES: readonly number[] = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1];

/** Stations each side of a station the axis' direction is read over. */
const REACH: number = 2;

/**
 * An estimate reading, not a check: the arm's sections normal to its own
 * axis, from the private reference curves, normalized and aggregated over the
 * four people, for the arm's view outlines.
 *
 * The pack cuts the A-posed arms horizontally, so each section is reprojected
 * onto the plane normal to the arm's local axis: the axis is the line of the
 * arm loops' centres, its direction at a station read over the stations two
 * either side, and every point of the station's loop is moved along the axis
 * into that plane (exact for a section of a straight tube, and within the
 * axis' bend over the cut's length elsewhere). In that plane the anterior
 * direction is the body's forward direction made square to the axis and the
 * lateral one points away from the trunk. Stations are read from the wrist up
 * by arc length along the centres' line: the forearm over the reference's own
 * forearm length (radiale-stylion), the upper arm from there to the arm's top
 * cut at the axilla. Each station prints, per its section's girth, the four
 * extents about the section's centre (anterior, lateral, posterior, medial)
 * and the front and back quarters' conic shoulders, the mean and SD over the
 * arms present (both of f1, f2, m1, m2), no person's value and no curve.
 *
 * Scenarios:
 * 1. For each share of the forearm (wrist 0, elbow 1) and the upper arm (elbow 0, axilla 1), prints the four extents per girth and the quarter shoulders.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the private pack (`HumanReferenceSections`) and the references' public arm lengths (`HumanPeople.params`), reprojects each station and prints the aggregate table; without the pack it prints that it did not run.
 * @evidence contracts/testing.md#independent-expectations No expectation: an estimate reading kept in its own removable file that no real test imports; the knot table it produces cites it and states its source as the private reference curves.
 * @evidence contracts/testing.md#distinguishing-cases Both arms of two women and two men; the spread shows how far one knot stands for the set; the elbow's place is the forearm length along the centres' line, so a station near it reads either segment.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_estimate_arm_sections`, reading local files on the CPU, part of no acceptance.
 */
export function test_human_estimate_arm_sections(): void {
  const ids: string[] = HumanReferenceSections.available();
  if (ids.length === 0) {
    console.log("test_human_estimate_arm_sections: no private curve pack in .references/curves; nothing read");
    return;
  }
  const keys: string[] = ["forearm", "upperArm"];
  const table: Record<string, number[][][]> = Object.fromEntries(keys.map((k: string): [string, number[][][]] => [k, SHARES.map((): number[][] => [[], [], [], [], [], []])]));
  for (const id of ids) {
    const params: IAutoMovieHumanParameters = HumanPeople.params(id);
    const forearm: number | undefined = params.body.anatomy.forearmLength;
    if (forearm === undefined) continue;
    for (const [region, side] of [
      ["arm_l", 1],
      ["arm_r", -1],
    ] as const) {
      const rows: { centre: V3; points: V3[] }[] = HumanReferenceSections.sections(id, region)
        .filter((s: HumanReferenceSections.ISection): boolean => s.loops.length !== 0)
        .map((s: HumanReferenceSections.ISection): { centre: V3; points: V3[] } => {
          const loop: HumanReferenceSections.ILoop = s.loops.reduce((a: HumanReferenceSections.ILoop, b: HumanReferenceSections.ILoop): HumanReferenceSections.ILoop =>
            HumanReferenceSections.extent(b).girth > HumanReferenceSections.extent(a).girth ? b : a,
          );
          return { centre: HumanReferenceSections.extent(loop).centre, points: loop.points };
        });
      if (rows.length < 2 * REACH + 2) continue;

      // Arc length along the centres' line from the wrist (the lowest arm cut).
      const arc: number[] = [0];
      for (let i: number = 1; i < rows.length; i++) arc.push(arc[i - 1]! + norm(sub(rows[i]!.centre, rows[i - 1]!.centre)));
      const total: number = arc[arc.length - 1]!;
      if (!(total > forearm)) continue;
      const station = (s: number): number => {
        let best: number = 0;
        for (let i: number = 0; i < arc.length; i++) if (Math.abs(arc[i]! - s) < Math.abs(arc[best]! - s)) best = i;
        return best;
      };
      for (const key of keys)
        SHARES.forEach((share: number, k: number): void => {
          const s: number = key === "forearm" ? share * forearm : forearm + share * (total - forearm);
          const i: number = station(s);
          const lo: number = Math.max(0, i - REACH);
          const hi: number = Math.min(rows.length - 1, i + REACH);
          const axis: V3 = unit(sub(rows[hi]!.centre, rows[lo]!.centre));
          const c: V3 = rows[i]!.centre;
          const anterior: V3 = unit(sub([1, 0, 0], scale(axis, axis[0])));
          let lateral: V3 = unit(cross(axis, anterior));
          if (lateral[2] * side < 0) lateral = scale(lateral, -1);
          const plane: V3[] = rows[i]!.points.map((p: V3): V3 => {
            const q: V3 = sub(p, c);
            const n: V3 = sub(q, scale(axis, dot(q, axis)));
            return [dot(n, anterior), 0, dot(n, lateral)];
          });
          const extent: HumanReferenceSections.IExtent = HumanReferenceSections.extent({ points: plane });
          const shape: HumanSectionShape.IShape | null = HumanSectionShape.of(plane);
          if (shape === null || !(extent.girth > 0)) return;
          const cells: number[][] = table[key]![k]!;
          cells[0]!.push(shape.front / extent.girth);
          cells[1]!.push(shape.left / extent.girth);
          cells[2]!.push(-shape.back / extent.girth);
          cells[3]!.push(-shape.right / extent.girth);
          cells[4]!.push(shape.shoulder.front);
          cells[5]!.push(shape.shoulder.back);
        });
    }
  }
  const S: typeof HumanSectionShape = HumanSectionShape;
  for (const key of keys)
    SHARES.forEach((share: number, k: number): void => {
      const c: number[][] = table[key]![k]!;
      console.log(
        `${key} share ${share.toFixed(1)}: per girth anterior ${S.stat(c[0]!, 4)}, lateral ${S.stat(c[1]!, 4)}, posterior ${S.stat(c[2]!, 4)}, medial ${S.stat(c[3]!, 4)}; shoulder front ${S.stat(c[4]!, 3)}, back ${S.stat(c[5]!, 3)}`,
      );
    });
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
