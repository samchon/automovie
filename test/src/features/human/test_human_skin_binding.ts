import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanLoftChain } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftChain";
import { AutoMovieHumanLoftMesh } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanRig } from "../../../../packages/human/src/skeleton/AutoMovieHumanRig";
import { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { f1, m2 } from "../../../../packages/playground/src/human-parameters/index";
import { HUMAN_STICKMAN_POSES } from "../../../../packages/playground/src/human-stickman/HUMAN_STICKMAN_POSES";

type V3 = [number, number, number];

/** Metres of an edge a pose may not stretch past this many times its rest length. */
const STRETCH: number = 4;

/** Share of its rest area a limb's ring may fall to under a pose. */
const THIN: number = 0.6;

/** World transform of each rig bone from its local transforms. */
function worlds(
  rig: AutoMovieHumanRig.IRig,
  output: AutoMovieHumanSkeleton.IOutput,
): Map<string, { from: V3; to: V3; q: number[] }> {
  const rest = new Map<string, V3>();
  for (const bone of rig.skeleton.bones) {
    const base: V3 = bone.parent === null ? [0, 0, 0] : rest.get(bone.parent)!;
    const t = bone.rest.translation;
    rest.set(bone.bone, [base[0] + t.x, base[1] + t.y, base[2] + t.z]);
  }
  const local = AutoMovieHumanRig.locals(rig.skeleton, output);
  const out = new Map<string, { from: V3; to: V3; q: number[] }>();
  for (const bone of rig.skeleton.bones) {
    const own = local.get(bone.bone)!;
    const parent = bone.parent === null ? null : out.get(bone.parent)!;
    const q: number[] = parent === null ? own.rotation : multiply(parent.q, own.rotation);
    const to: V3 = parent === null ? own.translation : add(parent.to, rotate(parent.q, own.translation));
    out.set(bone.bone, { from: rest.get(bone.bone)!, to, q });
  }
  return out;
}

function add(a: V3, b: V3): V3 {
  return [a[0] + b[0], a[1] + b[1], a[2] + b[2]];
}

function multiply(p: number[], q: number[]): number[] {
  return [
    p[3]! * q[0]! + p[0]! * q[3]! + p[1]! * q[2]! - p[2]! * q[1]!,
    p[3]! * q[1]! - p[0]! * q[2]! + p[1]! * q[3]! + p[2]! * q[0]!,
    p[3]! * q[2]! + p[0]! * q[1]! - p[1]! * q[0]! + p[2]! * q[3]!,
    p[3]! * q[3]! - p[0]! * q[0]! - p[1]! * q[1]! - p[2]! * q[2]!,
  ];
}

function rotate(q: number[], v: V3): V3 {
  const r: number[] = multiply(multiply(q, [v[0], v[1], v[2], 0]), [-q[0]!, -q[1]!, -q[2]!, q[3]!]);
  return [r[0]!, r[1]!, r[2]!];
}

/** A vertex under linear blend skinning. */
function posed(
  p: V3,
  skin: { joints: string[]; boneIndices: number[]; weights: number[] },
  v: number,
  world: ReadonlyMap<string, { from: V3; to: V3; q: number[] }>,
): V3 {
  let out: V3 = [0, 0, 0];
  for (let i: number = 0; i < 4; i++) {
    const w: number = skin.weights[4 * v + i]!;
    if (w === 0) continue;
    const b = world.get(skin.joints[skin.boneIndices[4 * v + i]!]!)!;
    const moved: V3 = add(b.to, rotate(b.q, [p[0] - b.from[0], p[1] - b.from[1], p[2] - b.from[2]]));
    out = add(out, [moved[0] * w, moved[1] * w, moved[2] * w]);
  }
  return out;
}

/** A vertex under dual-quaternion blending, as the model draws it. */
function blended(
  p: V3,
  skin: { joints: string[]; boneIndices: number[]; weights: number[] },
  v: number,
  world: ReadonlyMap<string, { from: V3; to: V3; q: number[] }>,
): V3 {
  const real: number[] = [0, 0, 0, 0];
  const dual: number[] = [0, 0, 0, 0];
  let first: number[] | null = null;
  for (let i: number = 0; i < 4; i++) {
    const w: number = skin.weights[4 * v + i]!;
    if (w === 0) continue;
    const b = world.get(skin.joints[skin.boneIndices[4 * v + i]!]!)!;
    const turned: V3 = rotate(b.q, b.from);
    const t: V3 = [b.to[0] - turned[0], b.to[1] - turned[1], b.to[2] - turned[2]];
    first ??= b.q;
    const dot: number = b.q.reduce((s: number, c: number, k: number): number => s + c * first![k]!, 0);
    const s: number = dot < 0 ? -w : w;
    const d: number[] = multiply([t[0], t[1], t[2], 0], b.q).map((c: number): number => c / 2);
    for (let k: number = 0; k < 4; k++) {
      real[k]! += s * b.q[k]!;
      dual[k]! += s * d[k]!;
    }
  }
  const length: number = Math.hypot(...real);
  const q: number[] = real.map((c: number): number => c / length);
  const e: number[] = dual.map((c: number): number => c / length);
  const t: number[] = multiply(e, [-q[0]!, -q[1]!, -q[2]!, q[3]!]);
  return add(rotate(q, p), [2 * t[0]!, 2 * t[1]!, 2 * t[2]!]);
}

/**
 * Area a closed ring spans, the length of its area vector. A limb flattened to
 * a ribbon keeps its perimeter and loses this.
 */
function spanned(ring: readonly V3[]): number {
  const n: V3 = [0, 0, 0];
  ring.forEach((p: V3, i: number): void => {
    const q: V3 = ring[(i + 1) % ring.length]!;
    n[0] += p[1] * q[2] - p[2] * q[1];
    n[1] += p[2] * q[0] - p[0] * q[2];
    n[2] += p[0] * q[1] - p[1] * q[0];
  });
  return Math.hypot(...n) / 2;
}

/** Every limb ring keeps its girth under a pose, listing those that do not. */
function auditGirths(
  name: string,
  body: IAutoMovieHumanBodyCalibration,
  scale: number,
  rig: AutoMovieHumanRig.IRig,
  world: ReadonlyMap<string, { from: V3; to: V3; q: number[] }>,
  label: string,
): string[] {
  const out: string[] = [];
  const phases: number[] = Array.from(
    { length: 64 },
    (_: unknown, i: number): number => (2 * Math.PI * i) / 64,
  );
  for (const chain of body.chains) {
    if (!/^(arm|leg)\./.test(chain.name)) continue;
    let worst: number = Infinity;
    let at: number = 0;
    // The end layers are the hand's and the trunk's rings, not a limb's.
    for (const layer of chain.layers.slice(1, -1)) {
      const rest: V3[] = AutoMovieHumanLoftChain.ring(chain, layer.y, phases).map(
        (p: V3): V3 => [p[0] * scale, p[1] * scale, p[2] * scale],
      );
      const flat: number[] = rest.flat();
      const skin = rig.bind(flat);
      const moved: V3[] = rest.map(
        (p: V3, v: number): V3 => blended(p, skin, v, world),
      );
      const ratio: number = spanned(moved) / spanned(rest);
      if (ratio < worst) {
        worst = ratio;
        at = layer.y;
      }
    }
    if (worst < THIN)
      out.push(`${name} ${label} ${chain.name} thins to ${worst.toFixed(2)} at ${at.toFixed(0)}`);
  }
  return out;
}

/**
 * Every skin vertex binds to the rig, and a pose moves the prepared skin.
 *
 * @evidence contracts/testing.md#behavioral-verification Binds the generated skin of two people, evaluates a bent elbow and knee through the public skeleton, and moves each vertex by the mesh's own weights. It catches a weight that does not sum to one, a seam whose copies disagree, a rest pose that moves anything, a limb that fails to follow its bone, and a side that pulls the other.
 * @evidence contracts/testing.md#independent-expectations The binding's contract and rigid-body kinematics supply every expectation: weights sum to one, equal places move equally, identity pose moves nothing, and a bent arm leaves the other leg still. The stretch bound is a coarse limit, so it catches a torn skin and says nothing of a joint's form.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts rest against a bent left elbow and right knee, on a slender and a broad person, and reads every limb ring's girth under the step-and-reach pose and the range-limit pose by the blend the model draws. Skin on the bent limbs must move, skin on the far limbs must not, and a limb must not thin. Contact, penetration and the folds at the joints themselves are not read here.
 * @evidence contracts/testing.md#execution-ownership A discoverable synchronous unit reached by `--include human_skin_binding`, generating two bodies in process with no renderer, browser or GPU.
 */
export const test_human_skin_binding = (): void => {
  const problems: string[] = [];
  for (const [name, params] of [["f1", f1], ["m2", m2]] as [string, IAutoMovieHumanParameters][]) {
    const body = AutoMovieHumanBodyLaw.calibrate(params).body;
    const scale: number = 0.001 * (params.body.controls.height.value! / body.stature);
    const surface = AutoMovieHumanBodySurface.generate(body, []);
    const pieces = AutoMovieHumanLoftMesh.split(surface.mesh, surface.normals);
    const rig: AutoMovieHumanRig.IRig = AutoMovieHumanRig.prepare(body, scale);
    const evaluate = AutoMovieHumanSkeleton.prepare(params);
    const rest = worlds(rig, evaluate({}));
    const bent: IAutoMovieHumanPose = {
      arms: { left: { elbow: { flexion: 90 } } },
      legs: { right: { knee: { flexion: 90 } } },
    } as IAutoMovieHumanPose;
    const moved = worlds(rig, evaluate(bent));
    const copies = new Map<string, string>();
    let idle: number = 0;
    let hand: number = 0;
    let farLeg: number = 0;
    let torn: number = 0;
    for (const piece of pieces) {
      const metres: number[] = piece.positions.map((v: number): number => v * scale);
      const skin = rig.bind(metres);
      const count: number = metres.length / 3;
      const out: V3[] = [];
      for (let v: number = 0; v < count; v++) {
        const total: number =
          skin.weights[4 * v]! + skin.weights[4 * v + 1]! + skin.weights[4 * v + 2]! + skin.weights[4 * v + 3]!;
        if (!(Math.abs(total - 1) < 1e-6)) problems.push(`${name} ${piece.name} weights sum to ${total}`);
        const p: V3 = [metres[3 * v]!, metres[3 * v + 1]!, metres[3 * v + 2]!];
        const key: string = p.map((c: number): string => c.toFixed(7)).join();
        const bound: string = [0, 1, 2, 3]
          .map((i: number): string => `${skin.joints[skin.boneIndices[4 * v + i]!]}:${skin.weights[4 * v + i]!.toFixed(6)}`)
          .join();
        const seen: string | undefined = copies.get(key);
        if (seen !== undefined && seen !== bound) problems.push(`${name} seam copies differ at ${key}`);
        copies.set(key, bound);
        const still: V3 = posed(p, skin, v, rest);
        idle = Math.max(idle, Math.hypot(still[0] - p[0], still[1] - p[1], still[2] - p[2]));
        const q: V3 = posed(p, skin, v, moved);
        out.push(q);
        const by: number = Math.hypot(q[0] - p[0], q[1] - p[1], q[2] - p[2]);
        if (/^(hand|finger|thumb)\.left/.test(piece.name)) hand = Math.max(hand, by);
        if (/^(foot|toe|forefoot)\.left/.test(piece.name)) farLeg = Math.max(farLeg, by);
      }
      for (let i: number = 0; i + 1 < piece.indices.length; i += 3)
        for (const [a, b] of [[piece.indices[i]!, piece.indices[i + 1]!]] as [number, number][]) {
          const was: number = Math.hypot(metres[3 * a]! - metres[3 * b]!, metres[3 * a + 1]! - metres[3 * b + 1]!, metres[3 * a + 2]! - metres[3 * b + 2]!);
          const now: number = Math.hypot(out[a]![0] - out[b]![0], out[a]![1] - out[b]![1], out[a]![2] - out[b]![2]);
          if (was > 1e-4 && now / was > STRETCH) torn++;
        }
    }
    if (idle > 1e-6) problems.push(`${name} rest pose moves the skin by ${idle} m`);
    if (hand < 0.1) problems.push(`${name} the bent arm's hand moved only ${hand} m`);
    if (farLeg > 1e-3) problems.push(`${name} the other leg's foot moved ${farLeg} m`);
    if (torn > 0) problems.push(`${name} ${torn} edges stretched past ${STRETCH} times`);
    for (const label of ["demo", "limit"])
      problems.push(
        ...auditGirths(
          name,
          body,
          scale,
          rig,
          worlds(rig, evaluate(HUMAN_STICKMAN_POSES[label]!)),
          label,
        ),
      );
  }
  if (problems.length !== 0)
    throw new Error(`${problems.length} binding problems:\n${[...new Set(problems)].slice(0, 40).join("\n")}`);
};
