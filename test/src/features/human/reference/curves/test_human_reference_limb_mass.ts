import { HumanAnatomy } from "../../../internal/HumanAnatomy";
import { HumanReferenceCurves } from "../../../internal/reference/curves/HumanReferenceCurves";
import { HumanReferenceRig } from "../../../internal/reference/bodies/HumanReferenceRig";

type V3 = HumanAnatomy.V3;

/**
 * Reads, on every reference body with its private section pack and its own
 * rig, where the leg's soft mass stands about its bones: at each level
 * section of the left thigh and shank, the section's front and back measured
 * from the bone's line at that height, as shares of the section's own depth,
 * by the station's share along its segment. A shape prior for the leg's
 * sections is fitted from these readings without one person and checked on
 * that person.
 *
 * Scenarios:
 * 1. Every reference with a pack and a rig: the rig is mapped into the pack's body frame (its axes identified from its own joints, centimetres to millimetres, sharing the source's origin), every thigh and shank section is read, and the mapped bone must stand inside its section at every station.
 * 2. For each person held out, the front share fitted on the others by station bins is compared with that person's, and both are listed.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads the pack's `leg_l` closed loops (`HumanReferenceCurves.sections`, every audit status) and the rig's `thigh_l`, `calf_l` and `foot_l` joints (`HumanReferenceRig.get`); identifies the rig's up axis as the one carrying the head over the foot, its left axis as the one carrying the left thigh over the right, its forward axis as the one carrying the ball of the foot ahead of the ankle; and reads, at each section, the bone's forward place interpolated between the segment's two joints at the section's height. It catches a bone that the mapping puts outside its own leg, which would void every share.
 * @evidence contracts/testing.md#independent-expectations The bone stands inside its limb's skin (anatomy); the shares are readings for a prior, not limits on the figure. Direction from cross-sectional anatomy (Gray 1918): the gastrocnemius and soleus stand behind the tibia whose anterior border is subcutaneous, so the shank's mass lies behind its bone; the quadriceps stand ahead of the femur and the hamstrings behind it. The file is a reference reading that no real test imports. Oracle limits: level sections of a near-vertical leg; a station within the knee's or the ankle's joint is left out.
 * @evidence contracts/testing.md#distinguishing-cases The four references, two women and two men; without the private pack or the rig the test prints that it did not run.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_reference_limb_mass`, reading files only, with no generation, renderer, browser or GPU.
 */
export function test_human_reference_limb_mass(): void {
  const people: string[] = ["f1", "f2", "m1", "m2"].filter((id: string): boolean => HumanReferenceCurves.available().includes(id) && HumanReferenceRig.exists(id));
  if (people.length === 0) {
    console.log("  no private pack or rig: the reading did not run");
    return;
  }
  const failures: string[] = [];
  const readings: Map<string, IReading[]> = new Map<string, IReading[]>();
  for (const id of people) {
    const rig: HumanReferenceRig.IRig = HumanReferenceRig.get(id);
    const map: (p: readonly number[]) => V3 = frame(rig);
    const hip: V3 = map(joint(rig, "thigh_l"));
    const knee: V3 = map(joint(rig, "calf_l"));
    const ankle: V3 = map(joint(rig, "foot_l"));
    const sections: HumanReferenceCurves.ISection[] = HumanReferenceCurves.sections(id, { region: "leg_l", kind: "closed", quality: "all" });
    console.log(`  ${id}: mapped hip ${hip.map((v: number): string => v.toFixed(0)).join(" ")}, knee ${knee.map((v: number): string => v.toFixed(0)).join(" ")}, ankle ${ankle.map((v: number): string => v.toFixed(0)).join(" ")}; leg sections ${sections.length > 0 ? sections[0]!.coordinateMm.toFixed(0) : "none"} to ${sections.length > 0 ? sections[sections.length - 1]!.coordinateMm.toFixed(0) : "none"}`);

    // The rig and the meshes come from one source and share its origin, so
    // the map translates nothing; the bone standing inside every section
    // checks that.
    const own: IReading[] = [];
    for (const section of sections) {
      const y: number = section.coordinateMm;
      const segment: "thigh" | "shank" | null = y < hip[1] && y > knee[1] ? "thigh" : y < knee[1] && y > ankle[1] ? "shank" : null;
      if (segment === null) continue;
      const [a, b]: [V3, V3] = segment === "thigh" ? [hip, knee] : [knee, ankle];
      const share: number = (a[1] - y) / (a[1] - b[1]);
      if (share < 0.1 || share > 0.9) continue;
      const bone: V3 = lerp(a, b, share);
      const x: number = bone[0];
      const loop: V3[] = longest(section);
      const front: number = Math.max(...loop.map((p: V3): number => p[0]));
      const back: number = Math.min(...loop.map((p: V3): number => p[0]));
      if (!(x < front && x > back)) failures.push(`${id} ${segment} at ${y.toFixed(0)}: the mapped bone (${x.toFixed(1)}) stands outside its section (${back.toFixed(1)} to ${front.toFixed(1)})`);
      own.push({ segment, share, front: (front - x) / (front - back) });
    }
    readings.set(id, own);
  }

  // A prior by station bins, fitted without each person and read on it.
  for (const segment of ["thigh", "shank"] as const) {
    console.log(`  ${segment}: share | front share of the depth by person | fitted without the person`);
    for (let bin: number = 1; bin <= 8; bin++) {
      const lo: number = bin / 10;
      const pick: (id: string) => number[] = (id: string): number[] =>
        (readings.get(id) ?? []).filter((r: IReading): boolean => r.segment === segment && r.share >= lo && r.share < lo + 0.1).map((r: IReading): number => r.front);
      const own: string[] = people.map((id: string): string => mean(pick(id)).toFixed(3));
      const held: string[] = people.map((id: string): string => mean(people.filter((o: string): boolean => o !== id).flatMap(pick)).toFixed(3));
      console.log(`  ${lo.toFixed(1)} | ${own.join(" ")} | ${held.join(" ")}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} limb mass reading findings:\n${failures.join("\n")}`);
}

/** One section's reading. */
interface IReading {
  /** The segment. */
  segment: "thigh" | "shank";

  /** Share of the way from the proximal joint to the distal one. */
  share: number;

  /** The section's front over its depth, measured from the bone. */
  front: number;
}

/**
 * The rig's map into the body frame: the source's axes identified from its
 * own joints and centimetres turned to millimetres.
 *
 * @param rig The rig.
 * @returns The map of a source point.
 */
function frame(rig: HumanReferenceRig.IRig): (p: readonly number[]) => V3 {
  const pick: (from: string, to: string) => [number, number] = (from: string, to: string): [number, number] => {
    const a: readonly number[] = joint(rig, from);
    const b: readonly number[] = joint(rig, to);
    const d: number[] = [0, 1, 2].map((k: number): number => b[k]! - a[k]!);
    const k: number = [0, 1, 2].reduce((best: number, i: number): number => (Math.abs(d[i]!) > Math.abs(d[best]!) ? i : best), 0);
    return [k, Math.sign(d[k]!)];
  };
  const [up, us]: [number, number] = pick("foot_l", "head");
  const [left, ls]: [number, number] = pick("thigh_r", "thigh_l");
  const [fwd, fs]: [number, number] = pick("foot_l", "ball_l");
  return (p: readonly number[]): V3 => [10 * fs * p[fwd]!, 10 * us * p[up]!, 10 * ls * p[left]!];
}

/**
 * A joint's origin.
 *
 * @param rig The rig.
 * @param name The joint's name.
 * @returns Its origin in the source frame.
 */
function joint(rig: HumanReferenceRig.IRig, name: string): readonly number[] {
  const j: HumanReferenceRig.IJoint | undefined = rig.get(name);
  if (j === undefined) throw new Error(`The rig holds no ${name}`);
  return j.origin;
}

/**
 * A section's longest loop as points.
 *
 * @param section The section.
 * @returns The loop's points.
 */
function longest(section: HumanReferenceCurves.ISection): V3[] {
  let best: V3[] = [];
  let length: number = -1;
  for (const loop of section.loops) {
    const l: number = HumanReferenceCurves.length(loop.curve);
    if (l > length) {
      length = l;
      best = HumanReferenceCurves.polyline(loop.curve, 8);
    }
  }
  return best;
}

/**
 * A point between two.
 *
 * @param a The first.
 * @param b The second.
 * @param t The share from the first.
 * @returns The point.
 */
function lerp(a: V3, b: V3, t: number): V3 {
  return [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1]), a[2] + t * (b[2] - a[2])];
}

/**
 * The mean of numbers.
 *
 * @param v The numbers.
 * @returns Their mean, NaN for none.
 */
function mean(v: readonly number[]): number {
  return v.reduce((s: number, x: number): number => s + x, 0) / v.length;
}
