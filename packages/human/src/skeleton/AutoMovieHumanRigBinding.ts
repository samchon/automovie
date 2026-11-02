import type { AutoMovieHumanoidBone, IAutoMovieMeshSkin } from "@automovie/interface";

import { AutoMovieHumanWeightField as F } from "./AutoMovieHumanWeightField";

/** Mesh representation of the same unrounded anatomical influence field. */
export namespace AutoMovieHumanRigBinding {
  /** An influence and its derivative per model metre. */
  export interface IInfluence {
    /** Semantic bone, independent of its current array slot. */
    bone: AutoMovieHumanoidBone;
    /** Full-field mass before export truncation. */
    weight: number;
    /** Spatial derivative in the registered model frame. */
    gradient: F.Vector;
  }

  /** Field observation; four-slot loss is explicit rather than hidden by rounding. */
  export interface IField {
    /** All positive influences before the four-slot representation. */
    influences: IInfluence[];
    /** Total mass omitted by selecting the four strongest influences. */
    discardedMass: number;
  }

  /** A caller-owned binder prepared once for one immutable body. */
  export interface IBinding {
    /** Bind model-metre positions; rigid parts name one declared bone. */
    bind(positions: readonly number[], bone?: AutoMovieHumanoidBone): IAutoMovieMeshSkin;
    /** Sample full weights and jets; an undefined capsule radial jet is refused. */
    field(point: F.Vector): IField;
    /** Isolated two-bone support capacities; overlapping joints still need pose audits. */
    jointSupports: readonly F.IJointSupport[];
  }

  /** Export without quantizing the continuous field, keeping truncation observable. */
  export function prepare(bones: AutoMovieHumanoidBone[], index: ReadonlyMap<AutoMovieHumanoidBone, number>, tree: F.ITree): IBinding {
    return {
      jointSupports: tree.jointSupports ?? [],
      bind(positions: readonly number[], bone?: AutoMovieHumanoidBone): IAutoMovieMeshSkin {
        if (positions.length % 3 !== 0 || !positions.every(Number.isFinite)) throw new Error("Skin positions must contain finite complete triples");
        const rigid: number | undefined = bone === undefined ? undefined : index.get(bone);
        if (bone !== undefined && rigid === undefined) throw new Error(`The rig has no ${bone} bone`);
        const count: number = positions.length / 3;
        const boneIndices: number[] = new Array<number>(4 * count).fill(0);
        const weights: number[] = new Array<number>(4 * count).fill(0);
        for (let v: number = 0; v < count; v++) {
          if (rigid !== undefined) {
            boneIndices[4 * v] = rigid;
            weights[4 * v] = 1;
            continue;
          }
          const point: F.Vector = [positions[3 * v]!, positions[3 * v + 1]!, positions[3 * v + 2]!];
          const strongest: F.IInfluence[] = ordered(F.evaluate(point, tree, false)).slice(0, 4);
          const total: number = strongest.reduce((sum: number, row: F.IInfluence): number => sum + row.weight, 0);
          if (!(total > 0)) throw new Error("A skin point has no finite positive influence");
          strongest.forEach((row: F.IInfluence, k: number): void => {
            boneIndices[4 * v + k] = row.slot;
            weights[4 * v + k] = row.weight / total;
          });
        }
        return { joints: bones, boneIndices, weights, method: "dual-quaternion" };
      },
      field(point: F.Vector): IField {
        const rows: F.IInfluence[] = ordered(F.evaluate(point, tree, true));
        return {
          influences: rows.map((row: F.IInfluence): IInfluence => ({ bone: bones[row.slot]!, weight: row.weight, gradient: row.gradient })),
          discardedMass: rows.slice(4).reduce((sum: number, row: F.IInfluence): number => sum + row.weight, 0),
        };
      },
    };
  }
}

/** Stable semantic slot order resolves equal-weight export ties. */
function ordered(rows: F.IInfluence[]): F.IInfluence[] {
  return rows.sort((a: F.IInfluence, b: F.IInfluence): number => b.weight - a.weight || a.slot - b.slot);
}
