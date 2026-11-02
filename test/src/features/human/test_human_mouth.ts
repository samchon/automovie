import { AutoMovieHumanMouthDeformation } from "../../../../packages/human/src/expression/AutoMovieHumanMouthDeformation";
import { AutoMovieHumanMouthExpression } from "../../../../packages/human/src/expression/AutoMovieHumanMouthExpression";
import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
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
 * Every person's mouth opens along the lips, holds its interior inside the
 * head, and speaks every viseme without tearing or leaving the face.
 *
 * @evidence contracts/testing.md#behavioral-verification Generates the skin of all nine people, finds the rim the mouth's aperture cuts, builds the lining, teeth, gums and tongue from it, binds the rim to the rig and opens the jaw, and evaluates every viseme's field over the skin and the tongue. It catches a rim that is not one loop, interior parts that leave the head, a rim that the jaw and the head share, lips that stay sealed or tear when the jaw opens, and a viseme whose field is not finite, not local or does not move the lips at all.
 * @evidence contracts/testing.md#independent-expectations Topology (one closed rim), containment (a point inside a closed skin is crossed an odd number of times by a ray), rigid kinematics of a hinge (an opening of 20 mm at the incisors parts lips that ride the head and the jaw) and the field's own locality supply every expectation; no coordinate of a person enters. The stretch and displacement bounds are coarse limits for a torn or flying skin.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts the four references with stature, girth and masculine ends; reads the upper and lower rims apart, every interior part, the closed mouth against a 20 mm opening, and all fifteen visemes, with protrusion of the tongue for th allowed past the teeth.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_mouth`, reading the people `HumanPeople` generates once per run and lofting their skin in process, with no renderer, browser or GPU.
 */
export const test_human_mouth = (): void => {
  const problems: string[] = [];
  for (const name of HumanPeople.names()) {
    const { body, rig, evaluate, params, scale } = HumanPeople.rigged(name);
    const mouth: AutoMovieHumanMouth.IMouth | undefined = body.mouth;
    const aperture = body.apertures.find((a): boolean => a.name === "mouth");
    if (mouth === undefined || aperture === undefined) {
      problems.push(`${name} has no mouth`);
      continue;
    }
    // The skin as the generator lofts it, refined in a box 3 mm about the
    // lips' colour boundary: the rim depends on that refinement.
    const ends: number[][] = AutoMovieHumanBodyLaw.calibrate(params).vermilion.spans.flatMap(
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
    const skin: Skin = index(surface.mesh.positions, surface.mesh.indices, mouth);
    const interior = AutoMovieHumanOralCavity.generate(surface.mesh, mouth, aperture, 1);
    for (const part of interior.parts) {
      if (part.geometry.type !== "mesh" || part.id === "human.mouth.lining") continue;
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
    const world = worlds(rig, evaluate({ head: { jaw: { opening: OPEN } } }));
    const posed = (p: V3, i: number, skinOf: typeof bound): V3 => blend(p.map((c: number): number => c * scale) as V3, skinOf, i, world);
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
    const gap: number = (posed(rim[top]!, top, bound)[1] - posed(rim[bottom]!, bottom, bound)[1]) / scale;
    if (gap < PARTED * OPEN) problems.push(`${name} a ${OPEN} mm opening parts the lips by ${gap.toFixed(1)} mm`);
    const near: number[] = [];
    const P: number[] = surface.mesh.positions;
    for (let v: number = 0; v < P.length / 3; v++)
      if (Math.hypot(P[3 * v]! - mouth.front, P[3 * v + 1]! - mouth.stomion, P[3 * v + 2]!) < 2 * mouth.width) near.push(v);
    const local = new Map<number, number>(near.map((v: number, i: number): [number, number] => [v, i]));
    const nearBound = rig.bind(near.flatMap((v: number): number[] => [P[3 * v]! * scale, P[3 * v + 1]! * scale, P[3 * v + 2]! * scale]));
    const moved: V3[] = near.map((v: number, i: number): V3 => posed([P[3 * v]!, P[3 * v + 1]!, P[3 * v + 2]!], i, nearBound));
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
    const context = AutoMovieHumanMouthDeformation.context(body)!;
    const tongue = interior.parts.find((p): boolean => p.id === "human.mouth.tongue")!;
    const tp: number[] = tongue.geometry.type === "mesh" ? tongue.geometry.mesh.positions : [];
    // The lining rides its place-based binding and the tongue the jaw, so
    // both are read at the jaw's opening for each viseme.
    const liningPart = interior.parts.find((p): boolean => p.id === "human.mouth.lining")!;
    const LP: number[] = liningPart.geometry.type === "mesh" ? liningPart.geometry.mesh.positions : [];
    const LI: number[] = liningPart.geometry.type === "mesh" ? (liningPart.geometry.mesh.indices ?? []) : [];
    const liningBound = rig.bind(LP.map((c: number): number => c * scale));
    const tongueBound = rig.bind(tp.map((c: number): number => c * scale), "jaw");
    const at = (bound: typeof liningBound, world: ReturnType<typeof worlds>, p: V3, i: number): V3 =>
      blend(p.map((c: number): number => c * scale) as V3, bound, i, world).map((c: number): number => c / scale) as V3;
    for (const viseme of AutoMovieHumanMouthExpression.VISEMES) {
      const weights: IAutoMovieHumanVisemeWeights = { [viseme]: 1 };
      const resolved = AutoMovieHumanMouthExpression.resolve({ units: [], mouth: { visemes: weights } }, params.head.mouthOpening);
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
      const opened = worlds(rig, evaluate({ head: { jaw: { opening: resolved.opening } } }));
      const posedLining: number[] = [];
      for (let v: number = 0; v < LP.length; v += 3)
        posedLining.push(...at(liningBound, opened, [LP[v]!, LP[v + 1]!, LP[v + 2]!], v / 3));
      const cavity: Skin = index(posedLining, LI, mouth);
      let left: number = 0;
      for (let v: number = 0; v < tp.length; v += 3) {
        const p: V3 = [tp[v]!, tp[v + 1]!, tp[v + 2]!];
        const d: V3 = field(p, true);
        if (under(cavity, at(tongueBound, opened, [p[0] + d[0], p[1] + d[1], p[2] + d[2]], v / 3)) < 0) left++;
      }
      if (left > 0 && viseme !== "TH") problems.push(`${name} ${viseme} carries ${left} tongue points out of the mouth's lining`);
    }
  }
  if (problems.length === 0) return;
  throw new Error(`${problems.length} mouth problems:\n${problems.join("\n")}`);
};

/** The skin about the mouth, bucketed for rays along each axis. */
interface Skin {
  P: number[];
  I: number[];
  cells: Map<string, number[]>[];
}

/** Bucket the skin's triangles near the mouth in millimetre cells across each axis. */
function index(P: number[], I: number[], mouth: AutoMovieHumanMouth.IMouth): Skin {
  const cells: Map<string, number[]>[] = [new Map(), new Map(), new Map()];
  for (let t: number = 0; t < I.length; t += 3) {
    const c: V3[] = [0, 1, 2].map((k: number): V3 => [P[3 * I[t + k]!]!, P[3 * I[t + k]! + 1]!, P[3 * I[t + k]! + 2]!]);
    if (Math.max(...c.map((p: V3): number => p[1])) < mouth.menton - 30) continue;
    if (Math.min(...c.map((p: V3): number => p[1])) > mouth.subnasale + 60) continue;
    for (let axis: number = 0; axis < 3; axis++) {
      const [a, b] = [0, 1, 2].filter((k: number): boolean => k !== axis) as [number, number];
      for (let i: number = Math.floor(Math.min(...c.map((p: V3): number => p[a]))); i <= Math.floor(Math.max(...c.map((p: V3): number => p[a]))); i++)
        for (let j: number = Math.floor(Math.min(...c.map((p: V3): number => p[b]))); j <= Math.floor(Math.max(...c.map((p: V3): number => p[b]))); j++) {
          const key: string = i + ":" + j;
          const list: number[] = cells[axis]!.get(key) ?? [];
          list.push(t);
          cells[axis]!.set(key, list);
        }
    }
  }
  return { P, I, cells };
}

/**
 * Depth of a point under the skin: the least distance to the skin along the
 * rays it is inside by, negative when no axis ray finds it inside. A ray
 * along one axis may leave through the mouth's opening, so a point is inside
 * when any of the three rays crosses the skin an odd number of times.
 */
function under(skin: Skin, p: V3): number {
  let depth: number = -1;
  for (let axis: number = 0; axis < 3; axis++) {
    const [a, b] = [0, 1, 2].filter((k: number): boolean => k !== axis) as [number, number];
    const list: number[] = skin.cells[axis]!.get(Math.floor(p[a]) + ":" + Math.floor(p[b])) ?? [];
    let crossings: number = 0;
    let nearest: number = Infinity;
    for (const t of list) {
      const c: V3[] = [0, 1, 2].map((k: number): V3 => [skin.P[3 * skin.I[t + k]!]!, skin.P[3 * skin.I[t + k]! + 1]!, skin.P[3 * skin.I[t + k]! + 2]!]);
      const d: number = (c[1]![a] - c[0]![a]) * (c[2]![b] - c[0]![b]) - (c[1]![b] - c[0]![b]) * (c[2]![a] - c[0]![a]);
      if (Math.abs(d) < 1e-12) continue;
      const l1: number = ((c[1]![a] - p[a]) * (c[2]![b] - p[b]) - (c[1]![b] - p[b]) * (c[2]![a] - p[a])) / d;
      const l2: number = ((c[2]![a] - p[a]) * (c[0]![b] - p[b]) - (c[2]![b] - p[b]) * (c[0]![a] - p[a])) / d;
      const l3: number = 1 - l1 - l2;
      if (l1 < 0 || l2 < 0 || l3 < 0) continue;
      const at: number = l1 * c[0]![axis] + l2 * c[1]![axis] + l3 * c[2]![axis];
      if (at > p[axis]) {
        crossings++;
        nearest = Math.min(nearest, at - p[axis]);
      }
    }
    if (crossings % 2 === 1) depth = Math.max(depth, nearest);
  }
  return depth;
}

/** World transform of each rig bone under an evaluated pose. */
function worlds(
  rig: HumanPeople.IRigged["rig"],
  output: ReturnType<HumanPeople.IRigged["evaluate"]>,
): Map<string, { from: V3; to: V3; q: number[] }> {
  const rest = new Map<string, V3>();
  for (const bone of rig.skeleton.bones) {
    const base: V3 = bone.parent === null ? [0, 0, 0] : rest.get(bone.parent)!;
    const t = bone.rest.translation;
    rest.set(bone.bone, [base[0] + t.x, base[1] + t.y, base[2] + t.z]);
  }
  const placed = new Map(output.posed.map((p): [string, (typeof output.posed)[number]] => [p.bone, p]));
  const out = new Map<string, { from: V3; to: V3; q: number[] }>();
  for (const bone of rig.skeleton.bones) {
    const own = placed.get(bone.bone === "leftToes" || bone.bone === "rightToes" ? bone.bone.replace("Toes", "HalluxProximal") : bone.bone)!;
    out.set(bone.bone, { from: rest.get(bone.bone)!, to: own.position, q: own.rotation });
  }
  return out;
}

/** A vertex under linear blend skinning. */
function blend(
  p: V3,
  skin: { joints: string[]; boneIndices: number[]; weights: number[] },
  v: number,
  world: ReadonlyMap<string, { from: V3; to: V3; q: number[] }>,
): V3 {
  const out: V3 = [0, 0, 0];
  for (let i: number = 0; i < 4; i++) {
    const w: number = skin.weights[4 * v + i]!;
    if (w === 0) continue;
    const b = world.get(skin.joints[skin.boneIndices[4 * v + i]!]!)!;
    const r: V3 = rotate(b.q, [p[0] - b.from[0], p[1] - b.from[1], p[2] - b.from[2]]);
    for (let k: number = 0; k < 3; k++) out[k] += w * (b.to[k]! + r[k]!);
  }
  return out;
}

function rotate(q: number[], v: V3): V3 {
  const [x, y, z, w] = q as [number, number, number, number];
  const t: V3 = [2 * (y * v[2] - z * v[1]), 2 * (z * v[0] - x * v[2]), 2 * (x * v[1] - y * v[0])];
  return [
    v[0] + w * t[0] + (y * t[2] - z * t[1]),
    v[1] + w * t[1] + (z * t[0] - x * t[2]),
    v[2] + w * t[2] + (x * t[1] - y * t[0]),
  ];
}
