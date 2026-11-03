import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import type { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyVector } from "./HumanAnatomyVector";
import { HumanOnce } from "./HumanOnce";
import { HumanPeople } from "./HumanPeople";

type V3 = HumanAnatomyVector.V3;
type ISkin = HumanAnatomy.ISkin;
type IEvaluated = AutoMovieHumanSkeleton.IOutput;
type IPlacement = AutoMovieHumanSkeleton.IPlacement;
type IMeshGroup = AutoMovieHumanBodySurface.IOutput["mesh"]["groups"][number];
const V: typeof HumanAnatomyVector = HumanAnatomyVector;

/**
 * A generated person's skin as the anatomy observers read it: the closed
 * triangle mesh the surface emits at the bind, and the same skin under a pose
 * through the public rig's own binding and pose evaluator. Each skin is
 * produced once per process (`HumanOnce`) and shared by every observer.
 * Reached through `HumanAnatomy`, which re-exports these functions.
 */
export namespace HumanAnatomySkins {
  /** The rig's four influences on every bind vertex. */
  export interface IBinding {
    /** Joint names, indexed by `boneIndices`. */
    joints: string[];

    /** Four joint indices per vertex. */
    boneIndices: number[];

    /** Four weights per vertex, summing to one. */
    weights: number[];
  }

  /** The skin at the bind, generated once per person. */
  export function bind(name: string): ISkin {
    return binds.read(name, (): ISkin => {
      const person: HumanPeople.IRigged = HumanPeople.rigged(name);
      const surface: AutoMovieHumanBodySurface.IOutput = AutoMovieHumanBodySurface.generate(person.body, []);
      const chains: string[] = [];
      const index: Map<string, number> = new Map();
      const I: Uint32Array = Uint32Array.from(surface.mesh.indices);
      const tri: Int32Array = new Int32Array(I.length / 3).fill(-1);
      const groups: IMeshGroup[] = surface.mesh.groups;

      // Each group names its chain before the first slash; triangles run from its start to the next group's.
      groups.forEach((g: IMeshGroup, k: number): void => {
        const chain: string = g.name.split("/")[0]!;
        if (!index.has(chain)) {
          index.set(chain, chains.length);
          chains.push(chain);
        }
        const end: number = k + 1 < groups.length ? groups[k + 1]!.start : I.length;
        for (let t: number = g.start / 3; t < end / 3; t++) tri[t] = index.get(chain)!;
      });
      return { name, P: Float64Array.from(surface.mesh.positions), I, tri, chains, joints: joints(person, person.evaluate({}), false) };
    });
  }

  /**
   * The skin under a pose, skinned by the rig's own binding and blended as
   * dual quaternions, the blend the rig declares for its skin (Kavan 2008).
   * Each pose of each person is skinned once per process; a posed skin of
   * the core set is about 7.5 MB, so the audited poses of ten people hold
   * under 0.5 GB.
   */
  export function posed(name: string, pose: IAutoMovieHumanPose): ISkin {
    return poses.read(name + JSON.stringify(pose), (): ISkin => {
      const rest: ISkin = bind(name);
      const person: HumanPeople.IRigged = HumanPeople.rigged(name);
      const skin: IBinding = binding(name);
      const output: IEvaluated = person.evaluate(pose);
      const world: Map<string, { r: number[]; d: number[] }> = transforms(person, output);
      const P: Float64Array = new Float64Array(rest.P.length);
      const n: number = rest.P.length / 3;
      for (let v: number = 0; v < n; v++) {
        const r: number[] = [0, 0, 0, 0];
        const d: number[] = [0, 0, 0, 0];
        let first: number[] | null = null;
        for (let k: number = 0; k < 4; k++) {
          const w: number = skin.weights[4 * v + k]!;
          if (w === 0) continue;
          const b: { r: number[]; d: number[] } = world.get(skin.joints[skin.boneIndices[4 * v + k]!]!)!;
          first ??= b.r;

          // Blend in the first influence's hemisphere, so antipodal quaternions add.
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
        const p: V3 = [rest.P[3 * v]!, rest.P[3 * v + 1]!, rest.P[3 * v + 2]!];
        const q: V3 = V.rotate(r, p);

        // Translation of a unit dual quaternion: 2 (d conj(r)).xyz.
        const t: V3 = [
          2 * (r[3]! * d[0]! - d[3]! * r[0]! + (r[1]! * d[2]! - r[2]! * d[1]!)),
          2 * (r[3]! * d[1]! - d[3]! * r[1]! + (r[2]! * d[0]! - r[0]! * d[2]!)),
          2 * (r[3]! * d[2]! - d[3]! * r[2]! + (r[0]! * d[1]! - r[1]! * d[0]!)),
        ];
        P[3 * v] = q[0] + t[0];
        P[3 * v + 1] = q[1] + t[1];
        P[3 * v + 2] = q[2] + t[2];
      }
      return { ...rest, P, joints: joints(person, output, true) };
    });
  }

  /** The rig's four influences on every bind vertex, prepared once per person. */
  export function binding(name: string): IBinding {
    return bindings.read(name, (): IBinding => {
      const person: HumanPeople.IRigged = HumanPeople.rigged(name);
      const rest: ISkin = bind(name);
      const made: ReturnType<HumanPeople.IRigged["rig"]["bind"]> = person.rig.bind(Array.from(rest.P, (c: number): number => c * person.scale));
      return { joints: made.joints as string[], boneIndices: made.boneIndices as number[], weights: made.weights as number[] };
    });
  }

  /** World rigid transform of every rig bone under an evaluated pose, as dual quaternions in mm. */
  function transforms(person: HumanPeople.IRigged, output: IEvaluated): Map<string, { r: number[]; d: number[] }> {
    const rest: Map<string, V3> = new Map();
    for (const bone of person.rig.skeleton.bones) {
      const base: V3 = bone.parent === null ? [0, 0, 0] : rest.get(bone.parent)!;
      const t: { x: number; y: number; z: number } = bone.rest.translation;
      rest.set(bone.bone, [base[0] + t.x, base[1] + t.y, base[2] + t.z]);
    }
    const placed: Map<string, IPlacement> = new Map(output.posed.map((p: IPlacement): [string, IPlacement] => [p.bone, p]));
    const out: Map<string, { r: number[]; d: number[] }> = new Map();
    const mm: number = 1 / person.scale;
    for (const bone of person.rig.skeleton.bones) {
      // The rig's toes ride the hallux's proximal phalanx, the pose's own bone.
      const own: IPlacement = placed.get(bone.bone === "leftToes" || bone.bone === "rightToes" ? bone.bone.replace("Toes", "HalluxProximal") : bone.bone)!;
      const r: number[] = [...own.rotation];
      const from: V3 = V.scale(rest.get(bone.bone)!, mm);
      const to: V3 = V.scale(own.position, mm);
      const t: V3 = V.sub(to, V.rotate(r, from));

      // d = 0.5 (t, 0) r
      const d: number[] = [
        0.5 * (t[0] * r[3]! + (t[1] * r[2]! - t[2] * r[1]!)),
        0.5 * (t[1] * r[3]! + (t[2] * r[0]! - t[0] * r[2]!)),
        0.5 * (t[2] * r[3]! + (t[0] * r[1]! - t[1] * r[0]!)),
        -0.5 * (t[0] * r[0]! + t[1] * r[1]! + t[2] * r[2]!),
      ];
      out.set(bone.bone, { r, d });
    }
    return out;
  }

  /** Joint centres of an evaluated pose, mm. */
  function joints(person: HumanPeople.IRigged, output: IEvaluated, isPosed: boolean): Map<string, V3> {
    const mm: number = 1 / person.scale;
    const list: { bone: string; position: V3 }[] = isPosed ? output.posed : output.bones;
    return new Map(list.map((b: { bone: string; position: V3 }): [string, V3] => [b.bone, V.scale(b.position, mm)]));
  }
}

/** Bind skins by person; a failed production is kept, as a success is, for every later observer. */
const binds: HumanOnce<ISkin> = new HumanOnce();

/** Posed skins by person and pose. */
const poses: HumanOnce<ISkin> = new HumanOnce();

/** The rig's binding of each person's bind skin. */
const bindings: HumanOnce<HumanAnatomySkins.IBinding> = new HumanOnce();
