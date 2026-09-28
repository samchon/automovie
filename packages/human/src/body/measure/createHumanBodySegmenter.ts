import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";

type RegionPlan = {
  index: number;
  vertices: number;
  corners: number[];
};

type PartPlan = {
  bone: number;
  region: number;
  id: string;
  outputs: number[];
  indices: number[];
  sources: number[];
};

/**
 * Compile the immutable body's contact partition once per basis revision.
 *
 * The builder projects each material region into vertices indexed by its
 * distinct (source vertex, corner UV) pairs. This stage follows that same
 * order, gives every output vertex its greatest skin-weight bone, and gives
 * each triangle the majority bone of its three corners (first corner on a
 * three-way tie). The resulting compact part indices, output correspondence,
 * original source ordinals and joint order depend only on the admitted basis.
 * They are reused across poses and shape edits; the returned evaluator checks
 * the builder's corner order, then copies the current metre positions and
 * normals into fresh parts. It never caches posed geometry or mutates input.
 *
 * This segmentation names contact witnesses, including self-contact inside
 * one dominant-bone region. A dominant skin weight is a rig attachment,
 * not a physical bone surface or a tissue boundary. The caller still runs
 * exact triangle crossing checks on each newly posed result.
 */
export function createHumanBodySegmenter(
  basis: IAutoMovieHumanBodyBasis,
): (built: IAutoMovieHumanBodyBuild) => {
  model: IAutoMovieModel;
  sources: Map<string, number[]>;
} {
  const regionCount = basis.surfaces.reduce(
    (count, surface) => count + surface.regions.length,
    0,
  );
  const jointOrder = new Map(basis.joints.map((joint, i) => [joint.bone, i]));
  const regions: RegionPlan[] = [];
  const plans: PartPlan[] = [];
  let sourceOffset = 0;
  for (const surface of basis.surfaces) {
    for (const region of surface.regions) {
      const outputByKey = new Map<string, number>();
      const order: number[] = [];
      const corners = region.indices.map((source, corner) => {
        const uv = region.uvs?.slice(corner * 2, corner * 2 + 2);
        const key = `${source}/${uv?.join(",") ?? ""}`;
        let output = outputByKey.get(key);
        if (output === undefined) {
          output = order.length;
          outputByKey.set(key, output);
          order.push(source);
        }
        return output;
      });
      const regionIndex = regions.length;
      regions.push({ index: regionIndex, vertices: order.length, corners });
      const dominant = order.map((source) => {
        let best = 0;
        for (let k = 1; k < 4; k++)
          if (
            surface.skin.weights[source * 4 + k] >
            surface.skin.weights[source * 4 + best]
          )
            best = k;
        return surface.skin.boneIndices[source * 4 + best];
      });
      const buckets = new Map<number, number[]>();
      for (let t = 0; t < corners.length; t += 3) {
        const bones = [corners[t], corners[t + 1], corners[t + 2]].map(
          (output) => dominant[output],
        );
        const owner =
          bones[1] === bones[2] && bones[0] !== bones[1] ? bones[1] : bones[0];
        const list = buckets.get(owner);
        if (list === undefined)
          buckets.set(owner, [corners[t], corners[t + 1], corners[t + 2]]);
        else list.push(corners[t], corners[t + 1], corners[t + 2]);
      }
      for (const [owner, triangles] of buckets) {
        const compact = new Map<number, number>();
        const outputs: number[] = [];
        const indices = triangles.map((output) => {
          let index = compact.get(output);
          if (index === undefined) {
            index = outputs.length;
            compact.set(output, index);
            outputs.push(output);
          }
          return index;
        });
        const bone = surface.skin.joints[owner];
        plans.push({
          bone: jointOrder.get(bone)!,
          region: regionIndex,
          id:
            regionCount === 1 ? bone : `${bone}/${surface.id}/${region.id}`,
          outputs,
          indices,
          sources: outputs.map((output) => sourceOffset + order[output]),
        });
      }
    }
    sourceOffset += surface.positions.length / 3;
  }
  plans.sort((a, b) => a.bone - b.bone || a.region - b.region);
  return (built) => {
    if (built.model.parts.length < regionCount)
      throw new Error("The segment partition needs every built surface region.");
    const meshes = regions.map((region) => {
      const part = built.model.parts[region.index];
      const geometry = part.geometry;
      if (geometry.type !== "mesh")
        throw new Error("A built body part must be a resident mesh.");
      const mesh = geometry.mesh;
      if (
        region.vertices * 3 !== mesh.positions.length ||
        mesh.indices?.length !== region.corners.length ||
        mesh.indices.some((value, at) => value !== region.corners[at])
      )
        throw new Error(
          "The segment partition does not match the built vertex population and corner order.",
        );
      return { part, mesh };
    });
    const sources = new Map<string, number[]>();
    const parts: IAutoMovieModel["parts"] = plans.map((plan) => {
      const { part, mesh } = meshes[plan.region];
      const positions: number[] = [];
      const normals: number[] = [];
      for (const output of plan.outputs) {
        positions.push(...mesh.positions.slice(output * 3, output * 3 + 3));
        normals.push(...mesh.normals!.slice(output * 3, output * 3 + 3));
      }
      const compact: IAutoMovieMesh = {
        positions,
        normals,
        indices: plan.indices.slice(),
        uvs: null,
        skin: null,
      };
      sources.set(plan.id, plan.sources.slice());
      return {
        id: plan.id,
        name: plan.id,
        material: part.material,
        geometry: { type: "mesh", mesh: compact },
        attachedBone: null,
        transform: null,
      };
    });
    return { model: { ...built.model, parts }, sources };
  };
}
