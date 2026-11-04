import { HumanAnatomy } from "../../internal/HumanAnatomy";
import { HumanAnatomyAudit } from "../../internal/HumanAnatomyAudit";
import { HumanInputs } from "../../internal/HumanInputs";
import { HumanPeople } from "../../internal/HumanPeople";

type V3 = [number, number, number];

/**
 * Every limb stands outside the trunk at the anatomical neutral: no vertex of
 * an arm below its axilla, of its hand, fingers or thumb lies inside the
 * closed skin, so the arm and hand clear the trunk and the thigh.
 *
 * Scenarios:
 * 1. Red proof on f1: the left forearm and hand pushed 40 mm toward the body's midline read skin inside skin.
 * 2. Every person of `HumanPeople`, both sides, at the neutral: the deepest arm or hand vertex inside the closed skin is listed by person and side.
 *
 * @evidence contracts/testing.md#behavioral-verification Reads each person's neutral skin (`HumanAnatomyAudit.subject(name).neutral()`), keeps the triangles of the side's `arm`, `hand`, `finger` and `thumb` chains whose vertices lie further than 0.07 S from the shoulder joint (outside the axilla's own ball, where the arm and the trunk are one surface), and reads how deep any of their vertices lies inside the closed skin (`HumanAnatomy.penetration`, rays along the three axes). It catches an arm or a hand resting into the hip or the trunk at the neutral, which the neutral's least clearing abduction must never produce.
 * @evidence contracts/testing.md#independent-expectations Placement (the testing skill): every limb outside the trunk. The anatomical neutral (Neutral-0, `docs/sources/dguv-f4030-neutral-zero.md`) puts the arms at the sides, so a small abduction is no defect; contact through the skin is. The bound is zero depth; the axilla's ball follows `HumanAnatomyPose`'s 0.07 S. Proven red by scenario 1.
 * @evidence contracts/testing.md#distinguishing-cases Women whose arms rest nearly plumb against the hip and men whose arms stand off it; both sides. Red: the made forearm and hand pushed into the hip.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous CPU unit reached by `--include human_arm_clearance`, reading each person's neutral skin in process with no browser or GPU.
 */
export function test_human_arm_clearance(): void {
  const failures: string[] = [];

  // 1. The made forearm and hand pushed into the hip.
  const subject: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject("f1");
  const neutral: HumanAnatomy.ISkin = subject.neutral();
  const S: number = HumanInputs.stature(subject.params);
  const elbow: V3 = HumanAnatomy.joint(neutral, "leftLowerArm");
  const pushed: HumanAnatomy.ISkin = moved(neutral, /^(arm|hand|finger|thumb)\.left/, elbow[1], [0, 0, -PUSH]);
  const made: number = deepest(pushed, "left", S).depth;
  if (!(made > 0)) failures.push(`proof: f1's left forearm and hand pushed ${PUSH} mm into the hip read ${made.toFixed(2)} mm inside the skin, expected past 0`);

  // 2. Every person, both sides.
  for (const name of HumanPeople.names()) {
    try {
      const own: HumanAnatomyAudit.ISubject = HumanAnatomyAudit.subject(name);
      const skin: HumanAnatomy.ISkin = own.neutral();
      const stature: number = HumanInputs.stature(own.params);
      for (const side of ["left", "right"] as const) {
        const read: { depth: number; at: V3 | null } = deepest(skin, side, stature);
        const at: string = read.at === null ? "" : ` at ${read.at.map((v: number): string => v.toFixed(0)).join(" ")}`;
        if (read.depth > 0) failures.push(`${name.padEnd(14)} ${side} arm and hand at the neutral: ${read.depth.toFixed(2)} mm inside the skin${at}, expected none`);
      }
    } catch (error) {
      failures.push(`${name.padEnd(14)} could not be read: ${(error as Error).message}`);
    }
  }
  if (failures.length !== 0) throw new Error(`${failures.length} arm clearance findings:\n${failures.join("\n")}`);
}

/** How far the made forearm and hand are pushed toward the midline, mm: past any skin's thickness over the hip. */
const PUSH: number = 40;

/** The axilla's ball, a share of the stature, as `HumanAnatomyPose` reads it. */
const AXILLA: number = 0.07;

/**
 * The deepest vertex of a side's arm below its axilla, hand, fingers or thumb inside the closed skin.
 *
 * @param skin The skin.
 * @param side The side.
 * @param S Stature, mm.
 * @returns Depth, mm (0 when none lies inside), and the deepest vertex.
 */
function deepest(skin: HumanAnatomy.ISkin, side: "left" | "right", S: number): { depth: number; at: V3 | null } {
  const shoulder: V3 = HumanAnatomy.joint(skin, `${side}UpperArm`);
  const chains: RegExp = new RegExp(`^(arm|hand|finger|thumb)\\.${side}`);
  const kept: number[] = [];
  for (let t: number = 0; t < skin.I.length / 3; t++) {
    if (!chains.test(skin.chains[skin.tri[t]!]!)) continue;
    let clear: boolean = true;
    for (let k: number = 0; k < 3; k++) if (HumanAnatomy.dist(HumanAnatomy.point(skin, skin.I[3 * t + k]!), shoulder) <= AXILLA * S) clear = false;
    if (clear) kept.push(t);
  }
  const read: { count: number; deepest: number; at: V3 | null } = HumanAnatomy.penetration(skin, Uint32Array.from(kept));
  return { depth: read.deepest, at: read.at };
}

/**
 * A copy of a skin whose vertices of the matching chains below a height move by a shift.
 *
 * @param skin The skin.
 * @param chains The chains moved.
 * @param below The height under which their vertices move, mm.
 * @param shift The move, mm.
 * @returns The made skin.
 */
function moved(skin: HumanAnatomy.ISkin, chains: RegExp, below: number, shift: V3): HumanAnatomy.ISkin {
  const P: Float64Array = Float64Array.from(skin.P);
  const move: Uint8Array = new Uint8Array(skin.P.length / 3);
  for (let t: number = 0; t < skin.I.length / 3; t++) if (chains.test(skin.chains[skin.tri[t]!]!)) for (let k: number = 0; k < 3; k++) move[skin.I[3 * t + k]!] = 1;
  for (let v: number = 0; v < move.length; v++) {
    if (move[v] === 0 || !(skin.P[3 * v + 1]! < below)) continue;
    for (let k: number = 0; k < 3; k++) P[3 * v + k] += shift[k]!;
  }
  return { ...skin, P };
}
