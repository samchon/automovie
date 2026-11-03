import { AutoMovieHumanBodyLaw } from "../../../../packages/human/src/generation/AutoMovieHumanBodyLaw";
import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanBodyCalibration } from "../../../../packages/human/src/generation/IAutoMovieHumanBodyCalibration";
import { AutoMovieHumanRig } from "../../../../packages/human/src/skeleton/AutoMovieHumanRig";
import { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanParameters } from "../../../../packages/human/src/structures/IAutoMovieHumanParameters";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import { HumanAnatomy } from "./HumanAnatomy";
import { HumanOnce } from "./HumanOnce";
import type { HumanPoseMirror } from "./HumanPoseMirror";
import { HumanPeople } from "./HumanPeople";

/**
 * The bodies a pose mirror compares: a generated person, the person's mirror
 * image rebuilt from its own inputs, and either one posed through the rig's
 * own binding and dual-quaternion blend.
 */
export namespace HumanPoseMirrorSubject {
  /** A pose evaluated on a body: the skin and every bone's posed centre and rotation. */
  export interface IPosed {
    /** Posed vertex positions, mm. */
    P: Float64Array;

    /** Posed centre (mm) and rotation (`[x, y, z, w]`) of every bone. */
    bones: Map<string, { position: HumanAnatomy.V3; rotation: number[] }>;
  }

  /** Each mirror image is generated once per run. */
  const mirrors: HumanOnce<HumanPoseMirror.ISubject> = new HumanOnce();

  /** A generated person as a subject. */
  export function original(name: string): HumanPoseMirror.ISubject {
    const person: HumanPeople.IRigged = HumanPeople.rigged(name);

    return {
      name,
      scale: person.scale,
      rig: person.rig,
      evaluate: person.evaluate,
      skin: HumanAnatomy.bind(name),
      binding: HumanAnatomy.binding(name),
    };
  }

  /**
   * Inputs with every left-right pair swapped: the person's mirror image. A
   * pair is an object with both a `left` and a `right`; nothing else changes.
   */
  export function swap<T>(value: T): T {
    if (value === null || typeof value !== "object") return value;

    if (Array.isArray(value)) return value.map((v: unknown): unknown => swap(v)) as T;

    // Exchange the keys of a pair, and recurse into every value.
    const record: Record<string, unknown> = value as Record<string, unknown>;
    const pair: boolean = "left" in record && "right" in record;
    const out: Record<string, unknown> = {};

    for (const [k, v] of Object.entries(record)) {
      const key: string = pair && k === "left" ? "right" : pair && k === "right" ? "left" : k;

      out[key] = swap(v);
    }

    return out as T;
  }

  /**
   * The person's mirror image, built once from its own inputs with every
   * left-right pair swapped; the person itself when swapping changes nothing.
   */
  export function mirrored(name: string): HumanPoseMirror.ISubject {
    return mirrors.read(name, (): HumanPoseMirror.ISubject => {
      const params: IAutoMovieHumanParameters = HumanPeople.person(name).params;
      const swapped: IAutoMovieHumanParameters = swap(params);

      // A person whose pairs are equal is its own mirror image.
      if (JSON.stringify(swapped) === JSON.stringify(params)) return original(name);

      // The mirror image built the way the person is: calibrated body, rig, evaluator and skin.
      const body: IAutoMovieHumanBodyCalibration = AutoMovieHumanBodyLaw.calibrate(swapped).body;
      const scale: number = 0.001 * (swapped.body.controls.height.value! / body.stature);
      const rig: AutoMovieHumanRig.IRig = AutoMovieHumanRig.prepare(body, scale);
      const evaluate: AutoMovieHumanSkeleton.PoseEvaluator = AutoMovieHumanSkeleton.prepare(swapped, { calibration: body });
      const surface: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(body, []);
      const skin: HumanAnatomy.ISkin = skinOf(`${name} mirrored`, surface);
      const made: ReturnType<AutoMovieHumanRig.IRig["bind"]> = rig.bind(
        Array.from(skin.P, (c: number): number => c * scale),
      );

      return {
        name: `${name} mirrored`,
        scale,
        rig,
        evaluate,
        skin,
        binding: {
          joints: made.joints as string[],
          boneIndices: made.boneIndices as number[],
          weights: made.weights as number[],
        },
      };
    });
  }

  /**
   * A subject's skin under a pose: the rig's own influences blended as dual
   * quaternions, the blend the rig declares, and every bone's posed centre
   * and rotation.
   */
  export function pose(subject: HumanPoseMirror.ISubject, value: IAutoMovieHumanPose): IPosed {
    const output: ReturnType<AutoMovieHumanSkeleton.PoseEvaluator> = subject.evaluate(value);
    const world: Map<string, { r: number[]; d: number[] }> = transforms(subject, output);
    const rest: Float64Array = subject.skin.P;
    const P: Float64Array = new Float64Array(rest.length);
    const binding: HumanPoseMirror.ISubject["binding"] = subject.binding;

    for (let v: number = 0; v < rest.length / 3; v++) {
      // Blend the vertex's bones' dual quaternions, each sign-matched to the first so they average.
      const r: number[] = [0, 0, 0, 0];
      const d: number[] = [0, 0, 0, 0];
      let first: number[] | null = null;

      for (let k: number = 0; k < 4; k++) {
        const w: number = binding.weights[4 * v + k]!;

        if (w === 0) continue;

        const bone: { r: number[]; d: number[] } = world.get(binding.joints[binding.boneIndices[4 * v + k]!]!)!;

        first ??= bone.r;

        const agree: number = bone.r[0]! * first[0]! + bone.r[1]! * first[1]! + bone.r[2]! * first[2]! + bone.r[3]! * first[3]!;
        const s: number = agree < 0 ? -w : w;

        for (let c: number = 0; c < 4; c++) {
          r[c] = r[c]! + s * bone.r[c]!;
          d[c] = d[c]! + s * bone.d[c]!;
        }
      }

      // Normalise the blend, rotate the bind position and add the translation 2 (d conj(r)).xyz.
      const length: number = Math.hypot(r[0]!, r[1]!, r[2]!, r[3]!);

      for (let c: number = 0; c < 4; c++) {
        r[c] = r[c]! / length;
        d[c] = d[c]! / length;
      }

      const q: HumanAnatomy.V3 = rotate(r, [rest[3 * v]!, rest[3 * v + 1]!, rest[3 * v + 2]!]);

      P[3 * v] = q[0] + 2 * (r[3]! * d[0]! - d[3]! * r[0]! + (r[1]! * d[2]! - r[2]! * d[1]!));
      P[3 * v + 1] = q[1] + 2 * (r[3]! * d[1]! - d[3]! * r[1]! + (r[2]! * d[0]! - r[0]! * d[2]!));
      P[3 * v + 2] = q[2] + 2 * (r[3]! * d[2]! - d[3]! * r[2]! + (r[0]! * d[1]! - r[1]! * d[0]!));
    }

    // The bones' posed centres in millimetres, beside the skin.
    const mm: number = 1 / subject.scale;
    const bones: Map<string, { position: HumanAnatomy.V3; rotation: number[] }> = new Map();

    for (const p of output.posed)
      bones.set(p.bone, { position: [p.position[0] * mm, p.position[1] * mm, p.position[2] * mm], rotation: [...p.rotation] });

    return { P, bones };
  }

  /** The skin of a generated surface: positions, triangles and the chain each triangle belongs to. */
  function skinOf(name: string, surface: AutoMovieHumanBodySurface.IOutput): HumanAnatomy.ISkin {
    const chains: string[] = [];
    const index: Map<string, number> = new Map();
    const I: Uint32Array = Uint32Array.from(surface.mesh.indices);
    const tri: Int32Array = new Int32Array(I.length / 3).fill(-1);
    const groups: typeof surface.mesh.groups = surface.mesh.groups;

    // A group's name up to the first slash is its chain; its triangles run to the next group's start.
    groups.forEach((g: (typeof groups)[number], k: number): void => {
      const chain: string = g.name.split("/")[0]!;

      if (!index.has(chain)) {
        index.set(chain, chains.length);
        chains.push(chain);
      }

      const end: number = k + 1 < groups.length ? groups[k + 1]!.start : I.length;

      for (let t: number = g.start / 3; t < end / 3; t++) tri[t] = index.get(chain)!;
    });

    return { name, P: Float64Array.from(surface.mesh.positions), I, tri, chains, joints: new Map() };
  }

  /** World rigid transform of every rig bone under an evaluated pose, as dual quaternions in mm. */
  function transforms(
    subject: HumanPoseMirror.ISubject,
    output: ReturnType<AutoMovieHumanSkeleton.PoseEvaluator>,
  ): Map<string, { r: number[]; d: number[] }> {
    // Each bone's rest centre, accumulated from the root.
    const rest: Map<string, HumanAnatomy.V3> = new Map();

    for (const bone of subject.rig.skeleton.bones) {
      const base: HumanAnatomy.V3 = bone.parent === null ? [0, 0, 0] : rest.get(bone.parent)!;
      const t: { x: number; y: number; z: number } = bone.rest.translation;

      rest.set(bone.bone, [base[0] + t.x, base[1] + t.y, base[2] + t.z]);
    }

    const placed: Map<string, (typeof output.posed)[number]> = new Map(
      output.posed.map((p: (typeof output.posed)[number]): [string, (typeof output.posed)[number]] => [p.bone, p]),
    );
    const out: Map<string, { r: number[]; d: number[] }> = new Map();
    const mm: number = 1 / subject.scale;

    for (const bone of subject.rig.skeleton.bones) {
      // The evaluator places a toe bone under the hallux bone it drives.
      const own: (typeof output.posed)[number] = placed.get(
        bone.bone === "leftToes" || bone.bone === "rightToes" ? bone.bone.replace("Toes", "HalluxProximal") : bone.bone,
      )!;
      const r: number[] = [...own.rotation];
      const base: HumanAnatomy.V3 = rest.get(bone.bone)!;
      const from: HumanAnatomy.V3 = [base[0] * mm, base[1] * mm, base[2] * mm];
      const to: HumanAnatomy.V3 = [own.position[0] * mm, own.position[1] * mm, own.position[2] * mm];
      const rotated: HumanAnatomy.V3 = rotate(r, from);
      const t: HumanAnatomy.V3 = [to[0] - rotated[0], to[1] - rotated[1], to[2] - rotated[2]];

      // The dual part of the transform, 0.5 (t, 0) r.
      out.set(bone.bone, {
        r,
        d: [
          0.5 * (t[0] * r[3]! + (t[1] * r[2]! - t[2] * r[1]!)),
          0.5 * (t[1] * r[3]! + (t[2] * r[0]! - t[0] * r[2]!)),
          0.5 * (t[2] * r[3]! + (t[0] * r[1]! - t[1] * r[0]!)),
          -0.5 * (t[0] * r[0]! + t[1] * r[1]! + t[2] * r[2]!),
        ],
      });
    }

    return out;
  }

  /** Rotate a vector by a unit quaternion `[x, y, z, w]`. */
  function rotate(q: number[], v: HumanAnatomy.V3): HumanAnatomy.V3 {
    const x: number = q[0]!;
    const y: number = q[1]!;
    const z: number = q[2]!;
    const w: number = q[3]!;
    const t: HumanAnatomy.V3 = [2 * (y * v[2] - z * v[1]), 2 * (z * v[0] - x * v[2]), 2 * (x * v[1] - y * v[0])];

    return [
      v[0] + w * t[0] + (y * t[2] - z * t[1]),
      v[1] + w * t[1] + (z * t[0] - x * t[2]),
      v[2] + w * t[2] + (x * t[1] - y * t[0]),
    ];
  }
}
