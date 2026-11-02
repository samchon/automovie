import { AutoMovieHumanInstance } from "../../../../packages/human/src/instance/AutoMovieHumanInstance";
import { HumanMouthSkin } from "../internal/HumanMouthSkin";
import { HumanMouthVolume } from "../internal/HumanMouthVolume";
import { AutoMovieHumanMouthDeformation } from "../../../../packages/human/src/expression/AutoMovieHumanMouthDeformation";
import { AutoMovieHumanMouthExpression } from "../../../../packages/human/src/expression/AutoMovieHumanMouthExpression";
import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { AutoMovieHumanMouth } from "../../../../packages/human/src/generation/AutoMovieHumanMouth";
import { AutoMovieHumanOralCavity } from "../../../../packages/human/src/generation/AutoMovieHumanOralCavity";
import type { IAutoMovieHumanVisemeWeights } from "../../../../packages/human/src/structures/expression/IAutoMovieHumanVisemeWeights";
import { HumanPeople } from "../internal/HumanPeople";

type V3 = [number, number, number];

/** Least depth of a tooth, gum or tongue point under the skin, mm. */
const UNDER: number = 1;

/** Largest jaw share the upper lip's rim may keep, and least the lower's may. */
const SEALED: number = 1e-3;

/** Opening the parted lips are read under, mm at the incisors. */
const OPEN: number = 20;

/** Share of that opening the lips must part by at the midline. */
const PARTED: number = 0.7;

/** Times its rest length a skin edge about the mouth may stretch under that opening. */
const STRETCH: number = 3;

/** Largest displacement of any skin point under one viseme, mm. */
const LARGEST: number = 25;

/**
 * All nine mouths keep their rim, tissue clearance and posed tongue containment.
 *
 * Scenarios:
 * 1. Each generated aperture has one rim and real interior parts lie at least one millimetre under actual skin.
 * 2. Upper and lower rims bind separately and a 20 mm jaw opening parts them without exceeding the existing threefold edge-strain bound.
 * 3. Every viseme uses the public instance's actual field and evaluated jaw, then the engine's declared DQ skinning for both tongue and lining.
 * 4. All viseme fields remain finite and local within the existing 25 mm displacement bound; the tongue-containment assertion still skips TH under its existing exemption.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates all nine skins and interiors, binds their actual rim and lining, evaluates public instance speech plans, displaces original bind buffers and calls the engine's declared skinning. It reports absent mouths, invalid explicit aperture closures, shallow or exterior tissue, mixed rim attachments, unparted or strained lips, nonlocal fields and tongue escape for each checked viseme.
 * @evidence contracts/testing.md#independent-expectations Closed-volume ray parity with explicit mouth-rim caps defines inside; actual triangle closest-point distance defines tissue clearance and excludes synthetic caps. Independent hinge kinematics, topology, finite locality and the unchanged 1 mm, threefold and 25 mm bounds supply expectations. Pure fixtures independently reject LBS, omitted lining fields, shared-edge parity errors and axis-depth overestimates.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts all four references and the other five supported people, both rim attachments, neutral versus 20 mm opening and all fifteen visemes. TH retains its existing containment exemption; this test does not claim to qualify its protrusion envelope.
 * @evidence contracts/testing.md#execution-ownership A synchronous CPU unit selected by human_mouth using HumanPeople's per-run cache; no host, renderer or GPU. Real consumer and rendered appearance are separate checks.
 */
export function test_human_mouth(aliases: readonly string[] = HumanPeople.names()): void {
  const problems: string[] = [];
  for (const name of aliases) {
    const { body, rig, evaluate, params, scale, vermilion } = HumanPeople.rigged(name);
    const mouth: AutoMovieHumanMouth.IMouth | undefined = body.mouth;
    const aperture = body.apertures.find((a): boolean => a.name === "mouth");
    if (mouth === undefined || aperture === undefined) {
      problems.push(`${name} has no mouth`);
      continue;
    }
    const context: AutoMovieHumanMouthDeformation.IContext = AutoMovieHumanMouthDeformation.context(body)!;
    const instance: AutoMovieHumanInstance = new AutoMovieHumanInstance({
      skeleton: rig.skeleton,
      evaluate,
      mouth: { context, scale, maximal: params.head.mouthOpening },
    });

    // The skin as the generator lofts it, refined in a box 3 mm about the
    // lips' colour boundary: the rim depends on that refinement.
    const ends: number[][] = vermilion.spans.flatMap(
      (s): number[][] => [s.start, s.end],
    );
    const box: [[number, number, number], [number, number, number]] = [
      [0, 1, 2].map((k: number): number => Math.min(...ends.map((p: number[]): number => p[k]!)) - 3) as [number, number, number],
      [0, 1, 2].map((k: number): number => Math.max(...ends.map((p: number[]): number => p[k]!)) + 3) as [number, number, number],
    ];
    const surface = AutoMovieHumanBodySurface.generate(body, [box]);
    let loop: number[];
    try {
      loop = AutoMovieHumanOralCavity.rim(surface.mesh, aperture);
    } catch (error) {
      problems.push(`${name} ${(error as Error).message}`);
      continue;
    }
    let skin: HumanMouthVolume.Reader | null = null;
    try {
      skin = new HumanMouthVolume.Reader(surface.mesh.positions, surface.mesh.indices, [loop]);
    } catch (error) {
      problems.push(name + " skin volume: " + (error as Error).message);
    }
    const interior = AutoMovieHumanOralCavity.generate(surface.mesh, mouth, aperture, 1);
    for (const part of interior.parts) {
      if (skin === null || part.geometry.type !== "mesh" || part.id === "human.mouth.lining") continue;
      const p: number[] = part.geometry.mesh.positions;
      let outside: number = 0;
      let shallow: number = 0;
      for (let v: number = 0; v < p.length; v += 3) {
        const depth: number = under(skin, [p[v]!, p[v + 1]!, p[v + 2]!]);
        if (depth < 0) outside++;
        else if (depth < UNDER) shallow++;
      }
      if (outside > 0) problems.push(`${name} ${part.id} has ${outside} points outside the skin`);
      if (shallow > 0) problems.push(`${name} ${part.id} has ${shallow} points within ${UNDER} mm of the skin`);
    }

    // The rim: the upper lip rides the head, the lower the jaw, over the
    // middle half of the mouth; toward the corners the opening narrows.
    const rim: V3[] = loop.map((v: number): V3 => [
      surface.mesh.positions[3 * v]!,
      surface.mesh.positions[3 * v + 1]!,
      surface.mesh.positions[3 * v + 2]!,
    ]);
    const bound = rig.bind(rim.flatMap((p: V3): number[] => p.map((c: number): number => c * scale)));
    const jawShare = (i: number): number => {
      let s: number = 0;
      for (let k: number = 0; k < 4; k++)
        if (bound.joints[bound.boneIndices[4 * i + k]!] === "jaw") s += bound.weights[4 * i + k]!;
      return s;
    };
    let upper: number = 0;
    let lower: number = 1;
    rim.forEach((p: V3, i: number): void => {
      if (Math.abs(p[2]) > 0.5 * mouth.width) return;
      if (AutoMovieHumanOralCavity.angle(mouth, p) > 0) upper = Math.max(upper, jawShare(i));
      else lower = Math.min(lower, jawShare(i));
    });
    if (upper > SEALED) problems.push(`${name} the upper lip's rim keeps ${upper.toFixed(3)} on the jaw`);
    if (lower < 1 - SEALED) problems.push(`${name} the lower lip's rim keeps only ${lower.toFixed(3)} on the jaw`);

    // Opening the jaw parts the lips at the midline without tearing the skin
    // about the mouth.
    const opened: AutoMovieHumanInstance.IPlan = instance.plan({ kind: "snapshot", pose: { head: { jaw: { opening: OPEN } } } });
    const world: HumanMouthSkin.IFrames = HumanMouthSkin.frames(rig.skeleton, opened.output ?? instance.output);
    const rimMoved: number[] = HumanMouthSkin.pose(rim.flat(), bound, world, scale);
    const mid = (sign: 1 | -1): number => {
      let best: number = -1;
      rim.forEach((p: V3, i: number): void => {
        if (Math.sign(AutoMovieHumanOralCavity.angle(mouth, p)) !== sign) return;
        if (best < 0 || Math.abs(p[2]) < Math.abs(rim[best]![2])) best = i;
      });
      return best;
    };
    const top: number = mid(1);
    const bottom: number = mid(-1);
    const gap: number = rimMoved[3 * top + 1]! - rimMoved[3 * bottom + 1]!;
    if (gap < PARTED * OPEN) problems.push(`${name} a ${OPEN} mm opening parts the lips by ${gap.toFixed(1)} mm`);
    const near: number[] = [];
    const P: number[] = surface.mesh.positions;
    for (let v: number = 0; v < P.length / 3; v++)
      if (Math.hypot(P[3 * v]! - mouth.front, P[3 * v + 1]! - mouth.stomion, P[3 * v + 2]!) < 2 * mouth.width) near.push(v);
    const local = new Map<number, number>(near.map((v: number, i: number): [number, number] => [v, i]));
    const nearBound = rig.bind(near.flatMap((v: number): number[] => [P[3 * v]! * scale, P[3 * v + 1]! * scale, P[3 * v + 2]! * scale]));
    const nearMoved: number[] = HumanMouthSkin.pose(near.flatMap((v: number): number[] => [P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!]), nearBound, world, scale);
    const moved: V3[] = near.map((_: number, i: number): V3 => [nearMoved[3 * i]! * scale, nearMoved[3 * i + 1]! * scale, nearMoved[3 * i + 2]! * scale]);
    let torn: number = 0;
    const I: number[] = surface.mesh.indices;
    for (let t: number = 0; t < I.length; t += 3)
      for (let e: number = 0; e < 3; e++) {
        const a: number | undefined = local.get(I[t + e]!);
        const b: number | undefined = local.get(I[t + ((e + 1) % 3)]!);
        if (a === undefined || b === undefined) continue;
        const was: number = Math.hypot(P[3 * near[a]!]! - P[3 * near[b]!]!, P[3 * near[a]! + 1]! - P[3 * near[b]! + 1]!, P[3 * near[a]! + 2]! - P[3 * near[b]! + 2]!) * scale;
        const now: number = Math.hypot(moved[a]![0] - moved[b]![0], moved[a]![1] - moved[b]![1], moved[a]![2] - moved[b]![2]);
        if (was > 1e-5 && now / was > STRETCH) torn++;
      }
    if (torn > 0) problems.push(`${name} a ${OPEN} mm opening stretches ${torn} skin edges about the mouth past ${STRETCH} times`);

    // Every viseme: finite, local, moving the lips, and the tongue held
    // inside the head except where th puts it between the teeth.
    const tongue = interior.parts.find((p): boolean => p.id === "human.mouth.tongue")!;
    const tp: number[] = tongue.geometry.type === "mesh" ? tongue.geometry.mesh.positions : [];
    // Read the same bind displacement and declared skinning as the consumer,
    // including the lining field and the posterior attachment to the tongue base.
    const liningPart = interior.parts.find((p): boolean => p.id === "human.mouth.lining")!;
    const LP: number[] = liningPart.geometry.type === "mesh" ? liningPart.geometry.mesh.positions : [];
    const LI: number[] = liningPart.geometry.type === "mesh" ? (liningPart.geometry.mesh.indices ?? []) : [];
    const liningBound = rig.bindMouthLining(LP.map((c: number): number => c * scale));
    const tongueBound = rig.bind(tp.map((c: number): number => c * scale), "jaw");
    for (const viseme of AutoMovieHumanMouthExpression.VISEMES) {
      const weights: IAutoMovieHumanVisemeWeights = { [viseme]: 1 };
      const plan: AutoMovieHumanInstance.IPlan = instance.plan({ kind: "snapshot", expression: { units: [], mouth: { visemes: weights } } });
      const resolved: AutoMovieHumanMouthExpression.IResolved = instance.mouthOf(plan);
      const field = AutoMovieHumanMouthDeformation.field(context, resolved, resolved.opening);
      const reach: number = AutoMovieHumanMouthDeformation.reach(mouth);
      let largest: number = 0;
      let strange: number = 0;
      let lips: number = 0;
      for (let v: number = 0; v < P.length; v += 3) {
        const p: V3 = [P[v]!, P[v + 1]!, P[v + 2]!];
        const d: V3 = field(p, false);
        const size: number = Math.hypot(...d);
        if (!Number.isFinite(size)) strange++;
        else largest = Math.max(largest, size);
        const far: number = Math.hypot(p[0] - mouth.front, p[1] - mouth.stomion, p[2]);
        if (far > reach && size > 0) strange++;
        if (Math.abs(p[2]) < mouth.width && Math.abs(p[1] - mouth.stomion) < mouth.upper) lips = Math.max(lips, size);
      }
      if (strange > 0) problems.push(`${name} ${viseme} moves ${strange} skin points by a non-finite or far displacement`);
      if (largest > LARGEST) problems.push(`${name} ${viseme} moves the skin by ${largest.toFixed(1)} mm`);
      if (viseme !== "sil" && lips === 0 && resolved.opening === 0) problems.push(`${name} ${viseme} moves neither the lips nor the jaw`);
      const frames: HumanMouthSkin.IFrames = HumanMouthSkin.frames(rig.skeleton, plan.output ?? instance.output);
      const liningMoved: number[] = displace(instance, "human.mouth.lining", LP, scale, plan);
      const tongueMoved: number[] = displace(instance, "human.mouth.tongue", tp, scale, plan);
      const posedLining: number[] = HumanMouthSkin.pose(liningMoved, liningBound, frames, scale);
      const posedTongue: number[] = HumanMouthSkin.pose(tongueMoved, tongueBound, frames, scale);
      let cavity: HumanMouthVolume.Reader;
      try {
        const rows: number = (LP.length / 3 - 1) / loop.length;
        if (!Number.isInteger(rows) || rows < 1) throw new Error("The lining has no complete rim meridians");
        cavity = new HumanMouthVolume.Reader(posedLining, LI, [loop.map((_: number, index: number): number => index * rows)]);
      } catch (error) {
        problems.push(name + " " + viseme + " lining volume: " + (error as Error).message);
        continue;
      }
      let left: number = 0;
      for (let v: number = 0; v < posedTongue.length; v += 3)
        if (under(cavity, [posedTongue[v]!, posedTongue[v + 1]!, posedTongue[v + 2]!]) < 0) left++;
      if (left > 0 && viseme !== "TH") problems.push(`${name} ${viseme} carries ${left} tongue points out of the mouth's lining`);
    }
    instance.dispose();
  }
  if (problems.length === 0) return;
  throw new Error(`${problems.length} mouth problems:\n${problems.join("\n")}`);
}

/** Signed tissue clearance after closed-volume classification, in millimetres. */
function under(skin: HumanMouthVolume.Reader, p: V3): number {
  return skin.contains(p) ? skin.distance(p) : -1;
}

/** Move the immutable bind by the instance's own field, returning calibration mm. */
function displace(instance: AutoMovieHumanInstance, id: string, positions: number[], scale: number, plan: AutoMovieHumanInstance.IPlan): number[] {
  const moved: ReturnType<AutoMovieHumanInstance["deformMouth"]> = instance.deformMouth(id, positions.map((value: number): number => value * scale), null, plan);
  return moved === null ? positions : moved.positions.map((value: number): number => value / scale);
}
