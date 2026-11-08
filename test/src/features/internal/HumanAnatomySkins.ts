import { AutoMovieHumanBodySurface } from "../../../../packages/human/src/generation/AutoMovieHumanBodySurface";
import type { IAutoMovieHumanConstructionPath } from "../../../../packages/human/src/generation/IAutoMovieHumanConstructionPath";
import type { AutoMovieHumanSkeleton } from "../../../../packages/human/src/skeleton/AutoMovieHumanSkeleton";
import type { IAutoMovieHumanPose } from "../../../../packages/human/src/structures/pose/IAutoMovieHumanPose";
import type { HumanAnatomy } from "./HumanAnatomy";
import { HumanAnatomyVector } from "./HumanAnatomyVector";
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
 * through the public rig's own binding and pose evaluator. A views object
 * retains its skins until the caller releases it; a returned skin may also be
 * held by its reader. Name-keyed reads build fresh views each call.
 * Reached through `HumanAnatomy`, which re-exports these functions.
 */
export namespace HumanAnatomySkins {
  /** Counts and typed-position bytes retained by one views object. */
  export interface IStatistics {
    /** Calls requesting a posed skin, successful or otherwise. */
    poseRequests: number;

    /** Requests served from the existing JSON-keyed pose map. */
    poseHits: number;

    /** Distinct posed skin objects retained by that map. */
    posedSkins: number;

    /** Bind and posed position-buffer bytes; shared topology is counted separately. */
    positionBytes: number;

    /** Shared bind index and triangle-chain buffer bytes, counted once. */
    topologyBytes: number;

    /** Number of binding indices and weights; JavaScript storage overhead is unknown. */
    bindingScalars: number;
  }

  /** One person's skin views, each made on its first read and kept on the object. */
  export interface IViews {
    /** The rigged person. */
    person: HumanPeople.IRigged;

    /** The bind skin. */
    bind: () => ISkin;

    /** The construction paths of the bind skin's surface (the webs' columns, the apertures' rims). */
    construction: () => IAutoMovieHumanConstructionPath[];

    /** The rig's binding of the bind skin. */
    binding: () => IBinding;

    /** The skin under a pose. */
    posed: (pose: IAutoMovieHumanPose) => ISkin;

    /** Existing retained populations; reading them generates and copies no geometry. */
    statistics: () => IStatistics;
  }

  /** The rig's four influences on every bind vertex. */
  export interface IBinding {
    /** Joint names, indexed by `boneIndices`. */
    joints: string[];

    /** Four joint indices per vertex. */
    boneIndices: number[];

    /** Four weights per vertex, summing to one. */
    weights: number[];
  }

  /**
   * One person's skin views, held by the caller that builds them: the bind
   * skin and its construction paths from one surface generation, the rig's
   * binding and the skin under each pose, each made on its first read and
   * retained by this object. Returned skins may outlive it when a reader keeps
   * them. Read-only statistics observe counts without changing that lifetime.
   *
   * @param who A person's name, or the rigged person the caller holds.
   *
   * @evidence contracts/common.md#principled-implementation Lazily generates the bind surface and binding, and memoizes pose output by JSON value; the rigged person and returned skins are immutable inputs to the observers. Read-only counters do not change that key or any query.
   * @evidence contracts/common.md#clear-and-simple-design One caller-owned closure owns surface, binding and pose map; its statistics expose counts and typed-buffer bytes without publishing mutable caches.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts There is no person-specific cache path, fixture or dropped pose. JSON key order can distinguish equivalent differently ordered records, as before; no stronger canonicalization is claimed.
   * @evidence contracts/common.md#meaningful-documentation Describes lazy acquisition, immutable outputs, reader ownership and the limit of the byte accounting.
   * @evidence contracts/performance.md#efficient-algorithms A cached pose read costs JSON serialization and a map lookup; a miss skins V vertices with four influences each. Statistics visits K retained poses with scalar scratch and copies no geometry.
   * @evidence contracts/performance.md#reuse-equivalent-work A views object fixes person, generated topology and binding. Matching serialized poses reuse the same immutable skin; a new views object generates independent state. Counters neither generate nor invalidate it.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns one bind surface and binding plus one position buffer per distinct serialized pose, with no bound on the number of poses. Releasing the views object releases its map; independently held skins remain live. Statistics report position/topology bytes and binding scalar count, excluding unknown JavaScript/container overhead.
   */
  export function views(who: string | HumanPeople.IRigged): IViews {
    const person: HumanPeople.IRigged = typeof who === "string" ? HumanPeople.rigged(who) : who;
    let surface: { skin: ISkin; construction: IAutoMovieHumanConstructionPath[] } | undefined;
    let bound: IBinding | undefined;
    const posedBy: Map<string, ISkin> = new Map();
    let poseRequests: number = 0;
    let poseHits: number = 0;
    const self: IViews = {
      person,
      bind: (): ISkin => (surface ??= generate(person)).skin,
      construction: (): IAutoMovieHumanConstructionPath[] => (surface ??= generate(person)).construction,
      binding: (): IBinding => (bound ??= bindingOf(person, self.bind())),
      posed: (pose: IAutoMovieHumanPose): ISkin => {
        poseRequests++;
        const key: string = JSON.stringify(pose);
        let found: ISkin | undefined = posedBy.get(key);
        if (found === undefined) {
          found = posedOf(person, self.bind(), self.binding(), pose);
          posedBy.set(key, found);
        } else poseHits++;
        return found;
      },
      statistics: (): IStatistics => {
        let positionBytes: number = surface?.skin.P.byteLength ?? 0;
        for (const skin of posedBy.values()) positionBytes += skin.P.byteLength;
        return {
          poseRequests,
          poseHits,
          posedSkins: posedBy.size,
          positionBytes,
          topologyBytes: surface === undefined ? 0 : surface.skin.I.byteLength + surface.skin.tri.byteLength,
          bindingScalars: bound === undefined ? 0 : bound.boneIndices.length + bound.weights.length,
        };
      },
    };
    return self;
  }

  /** The skin at the bind, generated by this call. */
  export function bind(name: string): ISkin {
    return views(name).bind();
  }

  /** The bind skin and its construction paths from one surface generation. */
  function generate(person: HumanPeople.IRigged): { skin: ISkin; construction: IAutoMovieHumanConstructionPath[] } {
    const name: string = person.name;
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
    return { skin: { name, P: Float64Array.from(surface.mesh.positions), I, tri, chains, joints: joints(person, person.evaluate({}), false) }, construction: surface.construction };
  }

  /**
   * The skin under a pose, skinned by the rig's own binding and blended as
   * dual quaternions, the blend the rig declares for its skin (Kavan 2008).
   * Generated by this call; a caller that reads several poses of one person
   * keeps that person's {@link views}.
   */
  export function posed(name: string, pose: IAutoMovieHumanPose): ISkin {
    return views(name).posed(pose);
  }

  /** A rest skin under a pose by the rig's binding. */
  function posedOf(person: HumanPeople.IRigged, rest: ISkin, skin: IBinding, pose: IAutoMovieHumanPose): ISkin {
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
  }

  /** The rig's four influences on every bind vertex, prepared by this call. */
  export function binding(name: string): IBinding {
    return views(name).binding();
  }

  /** The rig's four influences on every vertex of a rest skin. */
  function bindingOf(person: HumanPeople.IRigged, rest: ISkin): IBinding {
    const made: ReturnType<HumanPeople.IRigged["rig"]["bind"]> = person.rig.bind(Array.from(rest.P, (c: number): number => c * person.scale));
    return { joints: made.joints as string[], boneIndices: made.boneIndices as number[], weights: made.weights as number[] };
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

