import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanRig } from "../../../../packages/human/src/skeleton/AutoMovieHumanRig";
import { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import { HumanAnatomy } from "./HumanAnatomy";
import type { HumanAnatomyAudit } from "./HumanAnatomyAudit";

type V3 = HumanAnatomy.V3;
const A: typeof HumanAnatomy = HumanAnatomy;

/**
 * A person no named person holds, generated from public inputs by the path
 * `HumanPeople` and `HumanAnatomy.bind` use (body law, surface, rig and pose
 * evaluator), as an anatomy subject the observers read. Everything is kept in
 * memory: the inputs are never written to a source file.
 */
export namespace HumanInputResponseMade {
  /**
   * A subject for inputs no named person holds. The person is generated on
   * first use of its skin, and its neutral, skinned by the rig's dual
   * quaternion blend as `HumanAnatomy.posed` skins it, on first use of that.
   *
   * @param name Name in findings.
   * @param params The person's public inputs, an in-memory copy.
   */
  export function subject(name: string, params: IAutoMovieHumanParameters): HumanAnatomyAudit.ISubject {
    let own: IMade | null = null;
    const get: () => IMade = (): IMade => (own ??= generate(name, params));

    return {
      name,
      params,
      bind: (): HumanAnatomy.ISkin => get().bind,
      neutral: (): HumanAnatomy.ISkin => get().neutral(),
      mouth: false,
      construction: true,
      straightened: true,
    };
  }
}

/** A generated person: its bind skin and a lazily skinned neutral. */
interface IMade {
  /** The skin at the bind. */
  bind: HumanAnatomy.ISkin;

  /** The skin at the anatomical neutral, posed by the rig's dual-quaternion blend. */
  neutral: () => HumanAnatomy.ISkin;
}

/**
 * Generate a person from its inputs: body law, rig, pose evaluator and
 * surface. The skin's chains are the surface's triangle groups, named by the
 * part before the first slash, as `HumanAnatomy.bind` names them.
 */
function generate(name: string, params: IAutoMovieHumanParameters): IMade {
  const body: IAutoMovieHumanBodyCalibration = AutoMovieHumanBodyLaw.calibrate(params).body;
  const scale: number = 0.001 * (params.body.controls.height.value! / body.stature);
  const rig: AutoMovieHumanRig.IRig = AutoMovieHumanRig.prepare(body, scale);
  const evaluate: AutoMovieHumanSkeleton.PoseEvaluator = AutoMovieHumanSkeleton.prepare(params, { calibration: body });
  const surface: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(body, []);

  // Triangle groups to chain labels: each group's name up to its first slash,
  // labelling every triangle from the group's start to the next group's.
  const chains: string[] = [];
  const index: Map<string, number> = new Map();
  const I: Uint32Array = Uint32Array.from(surface.mesh.indices);
  const tri: Int32Array = new Int32Array(I.length / 3).fill(-1);
  const groups: typeof surface.mesh.groups = surface.mesh.groups;
  groups.forEach((g: (typeof groups)[number], k: number): void => {
    const chain: string = g.name.split("/")[0]!;
    if (!index.has(chain)) {
      index.set(chain, chains.length);
      chains.push(chain);
    }

    const end: number = k + 1 < groups.length ? groups[k + 1]!.start : I.length;
    for (let t: number = g.start / 3; t < end / 3; t++) tri[t] = index.get(chain)!;
  });

  // Joint centres of the rest pose, converted from the rig's metres back to
  // the skin's millimetres by the inverse of the rig's scale.
  const mm: number = 1 / scale;
  const rest: ReturnType<AutoMovieHumanSkeleton.PoseEvaluator> = evaluate({});
  const bind: HumanAnatomy.ISkin = {
    name,
    P: Float64Array.from(surface.mesh.positions),
    I,
    tri,
    chains,
    joints: new Map(rest.bones.map((b: (typeof rest.bones)[number]): [string, V3] => [b.bone, A.scale(b.position, mm)])),
  };

  let neutral: HumanAnatomy.ISkin | null = null;
  return {
    bind,
    neutral: (): HumanAnatomy.ISkin => (neutral ??= pose(bind, rig, rest, scale)),
  };
}

/**
 * The skin under an evaluated pose, blended as dual quaternions: the same
 * arithmetic as `HumanAnatomy.posed`, for people it cannot name.
 *
 * Each bone's world transform is a unit dual quaternion (r, d) with
 * d = 0.5 (t, 0) r for the translation t, in mm. A vertex blends its (up to
 * four) bones' dual quaternions by weight, with signs flipped into one
 * hemisphere so opposite-sign duplicates of a rotation do not cancel, then
 * normalises by the real part's length and applies the result: rotation, and
 * the translation 2 (d conj(r)).xyz.
 */
function pose(
  skin: HumanAnatomy.ISkin,
  rig: AutoMovieHumanRig.IRig,
  output: ReturnType<AutoMovieHumanSkeleton.PoseEvaluator>,
  scale: number,
): HumanAnatomy.ISkin {
  const binding: ReturnType<AutoMovieHumanRig.IRig["bind"]> = rig.bind(Array.from(skin.P, (c: number): number => c * scale));
  const mm: number = 1 / scale;

  // World positions of the rest bones, accumulated down the hierarchy.
  const restAt: Map<string, V3> = new Map();
  for (const bone of rig.skeleton.bones) {
    const base: V3 = bone.parent === null ? [0, 0, 0] : restAt.get(bone.parent)!;
    const t: { x: number; y: number; z: number } = bone.rest.translation;
    restAt.set(bone.bone, [base[0] + t.x, base[1] + t.y, base[2] + t.z]);
  }

  // Each bone's dual quaternion: rotation r (x, y, z, w) and d from the
  // translation that carries its rest position to its posed one.
  const placed: Map<string, (typeof output.posed)[number]> = new Map(output.posed.map((p: (typeof output.posed)[number]): [string, (typeof output.posed)[number]] => [p.bone, p]));
  const world: Map<string, { r: number[]; d: number[] }> = new Map();
  for (const bone of rig.skeleton.bones) {
    const own: (typeof output.posed)[number] = placed.get(bone.bone === "leftToes" || bone.bone === "rightToes" ? bone.bone.replace("Toes", "HalluxProximal") : bone.bone)!;
    const r: number[] = [...own.rotation];
    const from: V3 = A.scale(restAt.get(bone.bone)!, mm);
    const t: V3 = A.sub(A.scale(own.position, mm), rotate(r, from));
    world.set(bone.bone, {
      r,
      d: [
        0.5 * (t[0] * r[3]! + (t[1] * r[2]! - t[2] * r[1]!)),
        0.5 * (t[1] * r[3]! + (t[2] * r[0]! - t[0] * r[2]!)),
        0.5 * (t[2] * r[3]! + (t[0] * r[1]! - t[1] * r[0]!)),
        -0.5 * (t[0] * r[0]! + t[1] * r[1]! + t[2] * r[2]!),
      ],
    });
  }

  const P: Float64Array = new Float64Array(skin.P.length);
  for (let v: number = 0; v < skin.P.length / 3; v++) {
    const r: number[] = [0, 0, 0, 0];
    const d: number[] = [0, 0, 0, 0];
    let first: number[] | null = null;

    for (let k: number = 0; k < 4; k++) {
      const w: number = binding.weights[4 * v + k]!;
      if (w === 0) continue;

      // Flip into the first bone's hemisphere before blending.
      const b: { r: number[]; d: number[] } = world.get(binding.joints[binding.boneIndices[4 * v + k]!]! as string)!;
      first ??= b.r;
      const s: number = b.r[0]! * first[0]! + b.r[1]! * first[1]! + b.r[2]! * first[2]! + b.r[3]! * first[3]! < 0 ? -w : w;
      for (let c: number = 0; c < 4; c++) {
        r[c] += s * b.r[c]!;
        d[c] += s * b.d[c]!;
      }
    }

    const len: number = Math.hypot(r[0]!, r[1]!, r[2]!, r[3]!);
    for (let c: number = 0; c < 4; c++) {
      r[c] /= len;
      d[c] /= len;
    }

    // Rotate, then translate by 2 (d conj(r)).xyz.
    const q: V3 = rotate(r, [skin.P[3 * v]!, skin.P[3 * v + 1]!, skin.P[3 * v + 2]!]);
    P[3 * v] = q[0] + 2 * (r[3]! * d[0]! - d[3]! * r[0]! + (r[1]! * d[2]! - r[2]! * d[1]!));
    P[3 * v + 1] = q[1] + 2 * (r[3]! * d[1]! - d[3]! * r[1]! + (r[2]! * d[0]! - r[0]! * d[2]!));
    P[3 * v + 2] = q[2] + 2 * (r[3]! * d[2]! - d[3]! * r[2]! + (r[0]! * d[1]! - r[1]! * d[0]!));
  }
  return { ...skin, P, joints: new Map(output.posed.map((b: (typeof output.posed)[number]): [string, V3] => [b.bone, A.scale(b.position, mm)])) };
}

/** Rotate a vector by a unit quaternion `[x, y, z, w]`. */
function rotate(q: number[], v: V3): V3 {
  const [x, y, z, w]: [number, number, number, number] = q as [number, number, number, number];
  const t: V3 = [2 * (y * v[2] - z * v[1]), 2 * (z * v[0] - x * v[2]), 2 * (x * v[1] - y * v[0])];
  return [v[0] + w * t[0] + (y * t[2] - z * t[1]), v[1] + w * t[1] + (z * t[0] - x * t[2]), v[2] + w * t[2] + (x * t[1] - y * t[0])];
}
