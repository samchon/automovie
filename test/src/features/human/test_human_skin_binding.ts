import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import { AutoMovieHumanLoftMesh } from "../../../../packages/human/src/lofting/AutoMovieHumanLoftMesh";
import { AutoMovieHumanRig } from "../../../../packages/human/src/skeleton/AutoMovieHumanRig";
import { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { f1, m2 } from "../../../../packages/playground/src/human-parameters/index";

type V3 = [number, number, number];

/** Metres of an edge a pose may not stretch past this many times its rest length. */
const STRETCH: number = 4;

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

/**
 * Every skin vertex binds to the rig, and a pose moves the prepared skin.
 *
 * @evidence contracts/testing.md#behavioral-verification Binds the generated skin of two people, evaluates a bent elbow and knee through the public skeleton, and moves each vertex by the mesh's own weights. It catches a weight that does not sum to one, a seam whose copies disagree, a rest pose that moves anything, a limb that fails to follow its bone, and a side that pulls the other.
 * @evidence contracts/testing.md#independent-expectations The binding's contract and rigid-body kinematics supply every expectation: weights sum to one, equal places move equally, identity pose moves nothing, and a bent arm leaves the other leg still. The stretch bound is a coarse limit, so it catches a torn skin and says nothing of a joint's form.
 * @evidence contracts/testing.md#distinguishing-cases Contrasts rest against a bent left elbow and right knee, on a slender and a broad person. Skin on the bent limbs must move, and skin on the far limbs must not. Contact, collapse and joint volume belong to the joint-form work and are not read here.
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
        const bound: string = [...Array(4).keys()]
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
  }
  if (problems.length !== 0)
    throw new Error(`${problems.length} binding problems:\n${[...new Set(problems)].slice(0, 40).join("\n")}`);
};
