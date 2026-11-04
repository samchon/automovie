import { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanAnatomyAudit } from "../../../internal/HumanAnatomyAudit";
import { HumanAnatomyShared } from "../../../internal/HumanAnatomyShared";
import { HumanInputs } from "../../../internal/HumanInputs";
import { HumanPeople } from "../../../internal/HumanPeople";
import { HumanReferenceCurves } from "../../../internal/reference/curves/HumanReferenceCurves";

type V3 = HumanAnatomy.V3;

/**
 * Compares each reference person's generated skin with its own recovered
 * horizontal sections, region by region and height by height, to catch gross
 * defects and to place every sharp turn: the front, back and side extents,
 * the girth and the sharpest turn of each section, generated against
 * measured, over the trunk and head, the left leg, arm, hand and foot.
 *
 * Scenarios:
 * 1. Every reference person whose private curve pack is present: at every reference section of each region, the generated section holding the reference loop's centre, listed side by side; every extent departing past the bound is a finding by person, region, height and extent.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates each reference person's bind skin from its public inputs and cuts it level at each reference section's height, taking the component that holds the reference loop's centroid (`HumanAnatomySection.cut`); reads the reference's closed loops of the region from the private pack (`HumanReferenceCurves.sections`, every curve whatever its audit, since most loops are audited suspect for their fit and a gross bound tolerates that) and takes the region's longest loop, the midline's for the trunk and head. It reads the front (largest x), back (smallest x), half width (largest distance from the loop's centre in z), the taut girth and the sharpest turn: over a 10 mm chord at 1 mm resampling, the sagitta past the 1.04 mm a 12.5 mm radius gives, signed outward for a rim. It catches a cone, plate or fin standing out of the outline, a missing breast or buttock, a neck or chin at the wrong height, and places every rim and groove by region and height for the inspection table.
 * @evidence contracts/testing.md#independent-expectations A gross-defect bound only, never a closeness to the reference: an extent departs past 0.03 S, the 1st-to-99th percentile spread of an adult's chest depth over stature (ANSUR II chest depth SD near 21 mm at a 1630 mm stature, 2.326 SD), so a person may differ from its reference by a body's whole natural range and still pass. The turns are printed, not bound: the crease rules belong to the curve tests. The file is a reference comparison that no real test imports (`packages/human/docs/testing/reference-layer.md`). Oracle limits: the pack's sections are level, so a slanted feature such as a limb's section is read obliquely; a section the generated skin does not reach is listed as missing.
 * @evidence contracts/testing.md#distinguishing-cases The four reference people where their packs are present; without the private pack the test prints that it did not run and returns.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_reference_sections`, generating each person on the CPU with no renderer, browser or GPU.
 */
export function test_human_reference_sections(): void {
  const available: string[] = HumanReferenceCurves.available();
  const people: string[] = HumanPeople.names().filter((n: string): boolean => available.includes(n));
  if (people.length === 0) {
    console.log("  no private curve pack: the comparison did not run");
    return;
  }
  const failures: string[] = [];
  for (const name of people) {
    const subject: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject(name);
    const S: number = HumanInputs.stature(subject.params);
    const skin: HumanAnatomy.ISkin = subject.bind();
    const bound: number = 0.03 * S;
    for (const [label, regions, midline] of REGIONS) {
      const sections: HumanReferenceCurves.ISection[] = HumanReferenceCurves.sections(name, { region: regions, kind: "closed", quality: "all" });
      console.log(`  ${name} ${label}: height | reference front back side girth turn | generated front back side girth turn`);
      for (const section of sections) {
        const y: number = section.coordinateMm;
        const loop: V3[] | null = pickLoop(section, midline);
        if (loop === null) continue;
        const reference: IExtent = extent(loop);
        const c: V3 = centroid(loop);
        const cut: HumanAnatomy.ICut | null = HumanAnatomy.cut(skin, [0, y, 0], [0, 1, 0], c);
        const generated: IExtent | null = cut === null || cut.points.length < 8 ? null : extent(cut.points);
        console.log(`  ${y.toFixed(0).padStart(5)} | ${show(reference)} | ${show(generated)}`);
        if (generated === null) continue;
        for (const key of ["front", "back", "side"] as const) {
          const d: number = generated[key] - reference[key];
          if (Math.abs(d) > bound) failures.push(`${name.padEnd(4)} ${label} y ${y.toFixed(0)} ${key}: generated ${generated[key].toFixed(1)} against ${reference[key].toFixed(1)} (${d.toFixed(1)} mm, bound ${bound.toFixed(1)})`);
        }
      }
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} gross section departures:\n${failures.join("\n")}`);
}

/** The regions read: a label, the pack's region names and whether the loop is the one crossing the midline. */
const REGIONS: ReadonlyArray<readonly [string, readonly string[], boolean]> = [
  ["trunk and head", ["trunk", "head"], true],
  ["left leg", ["leg_l"], false],
  ["left foot", ["foot_l"], false],
  ["left arm", ["arm_l"], false],
  ["left hand", ["hand_l"], false],
];

/** A section's extents, mm. */
interface IExtent {
  /** Largest x. */
  front: number;

  /** Smallest x. */
  back: number;

  /** Largest distance from the centre in z. */
  side: number;

  /** Taut girth. */
  girth: number;

  /** Sharpest turn past the crease sagitta, mm; positive a rim, negative a groove. */
  turn: number;
}

/**
 * The extents of a closed loop's points, in order round the loop.
 *
 * @param points The loop.
 * @returns The extents.
 */
function extent(points: readonly V3[]): IExtent {
  const c: V3 = centroid(points);
  let girth: number = 0;
  for (let k: number = 0; k < points.length; k++) girth += HumanAnatomy.dist(points[k]!, points[(k + 1) % points.length]!);
  return {
    front: Math.max(...points.map((p: V3): number => p[0])),
    back: Math.min(...points.map((p: V3): number => p[0])),
    side: Math.max(...points.map((p: V3): number => Math.abs(p[2] - c[2]))),
    girth,
    turn: turn(points, c),
  };
}

/**
 * The sharpest turn round a closed loop: at each point of the loop resampled
 * at 1 mm, the sagitta of the point over the chord of the points 5 mm either
 * side, less the 1.04 mm a 12.5 mm radius gives over that chord, signed
 * positive when the point stands farther from the centre than the chord.
 *
 * @param points The loop.
 * @param c Its centre.
 * @returns The turn of largest size, signed.
 */
function turn(points: readonly V3[], c: V3): number {
  const line: V3[] = HumanAnatomyShared.resample([...points, points[0]!], 1);
  const n: number = line.length - 1;
  let sharpest: number = 0;
  for (let i: number = 0; i < n; i++) {
    const a: V3 = line[(i - 5 + n) % n]!;
    const b: V3 = line[(i + 5) % n]!;
    const m: V3 = line[i]!;
    const chord: V3 = HumanAnatomy.lerp(a, b, 0.5);
    const outward: number = HumanAnatomy.dist(m, c) >= HumanAnatomy.dist(chord, c) ? 1 : -1;
    const sag: number = HumanAnatomy.dist(m, chord) - 1.04;
    if (sag > Math.abs(sharpest)) sharpest = outward * sag;
  }
  return sharpest;
}

/**
 * The loop of a section to read: the one crossing the midline, or the longest.
 *
 * @param section The reference section.
 * @param midline Whether the loop must cross the midline.
 * @returns The loop's points, or null.
 */
function pickLoop(section: HumanReferenceCurves.ISection, midline: boolean): V3[] | null {
  let best: V3[] | null = null;
  let length: number = 0;
  for (const loop of section.loops) {
    const points: V3[] = HumanReferenceCurves.polyline(loop.curve, 8);
    const zs: number[] = points.map((p: V3): number => p[2]);
    if (midline && !(Math.min(...zs) < 0 && Math.max(...zs) > 0)) continue;
    const l: number = HumanReferenceCurves.length(loop.curve);
    if (l > length) {
      best = points;
      length = l;
    }
  }
  return best;
}

/**
 * The mean of points.
 *
 * @param points The points.
 * @returns Their centroid.
 */
function centroid(points: readonly V3[]): V3 {
  const s: V3 = [0, 0, 0];
  for (const p of points) for (let k: number = 0; k < 3; k++) s[k] += p[k]! / points.length;
  return s;
}

/**
 * One side's columns.
 *
 * @param e The extents, or null.
 * @returns The text.
 */
function show(e: IExtent | null): string {
  if (e === null) return "missing".padEnd(34);
  return [e.front, e.back, e.side, e.girth, e.turn].map((v: number, k: number): string => v.toFixed(k === 4 ? 1 : 0).padStart(6)).join(" ");
}
