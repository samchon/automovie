import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import { humanBodyGpuRegion } from "../basis/humanBodyGpuRegion";
import type { IAutoMovieHumanBodyBasis } from "../structures/IAutoMovieHumanBodyBasis";
import type { IAutoMovieHumanBodyBuild } from "../structures/IAutoMovieHumanBodyBuild";

type RegionPlan = {
  index: number;
  vertices: number;
  corners: number[];
  surface: number;
  order: number[];
};

type PartPlan = {
  bone: number;
  region: number;
  surface: number;
  sourceOffset: number;
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
 * the builder's corner order and each render vertex against the same build's
 * connected posed skin, then copies that skin's metre positions and normals
 * into fresh parts. It never caches posed geometry or mutates input.
 * Both this plan and the render region use `humanBodyGpuRegion` for the
 * Float32 UV identity, so numerically different source corners that upload
 * as the same UV never create a false extra seam here.
 *
 * This segmentation names contact witnesses, including self-contact inside
 * one dominant-bone region. A dominant skin weight is a rig attachment,
 * not a physical bone surface or a tissue boundary. The caller still runs
 * exact triangle crossing checks on each newly posed result.
 *
 * @evidence contracts/common.md#principled-implementation Each output vertex takes its greatest skin-weight joint, and each triangle takes the majority joint of its three corners, the first corner's on a three-way tie, so every triangle lands in exactly one part. The plan depends only on the admitted basis and is compiled once, while the returned evaluator refuses a build whose corner order, vertex population or render positions and normals differ from the connected posed skin it copies. The dominant weight is a rig attachment and not a physical bone surface, so the parts name contact witnesses and not tissue boundaries.
 * @evidence contracts/common.md#clear-and-simple-design A compile step (basis-only topology) is separated from a per-build evaluator that copies posed values, so a worker keeps the compiled function across documents; the Float32 UV identity comes from the one shared region helper.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No joint, region or expected contact is named, and a mismatched build is refused instead of being patched to fit the plan.
 * @evidence contracts/common.md#meaningful-documentation States what is compiled, the dominant-weight and tie rules, what the evaluator checks and copies, that nothing posed is cached and that the parts are contact witnesses and not bone surfaces.
 * @evidence contracts/modeling.md#part-identity-and-grouping A part is one region's triangles owned by one dominant joint, named `joint/surface/region` (the joint alone when the basis has one region), and the partition is the group of those parts in joint-then-region order. It copies the posed positions and normals but owns no shape of its own.
 * @evidenceExclude contracts/modeling.md#parameter-channels It defines and consumes no morph channel.
 * @evidence contracts/modeling.md#emitted-geometry Every triangle of a region is emitted once, in one part, and every part vertex is a distinct (source vertex, corner UV) pair of the builder's own region, so the counts follow the basis's regions and not any authored feature.
 * @evidence contracts/modeling.md#spatial-conventions Positions and normals are the builder's posed metres in the builder's output frame, copied without conversion; vertex ordinals are source ordinals offset per surface.
 * @evidence contracts/modeling.md#shared-boundaries Neighbouring parts are cut along triangle edges whose endpoints copy identical posed values from the same skin, so the cut neither gaps nor overlaps. The partition is a measurement witness, not a render surface, and promises no normal continuity beyond the source skin's.
 * @evidenceExclude contracts/anatomy.md#anatomical-source A dominant skin weight is a rig attachment and carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range It admits or bounds no anatomical quantity.
 * @evidenceExclude contracts/anatomy.md#parametric-authority It is not an input through which a caller shapes a body.
 */
export function createHumanBodySegmenter(basis: IAutoMovieHumanBodyBasis): (
  built: IAutoMovieHumanBodyBuild,
) => {
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
  for (const [surfaceIndex, surface] of basis.surfaces.entries()) {
    for (const original of surface.regions) {
      const region = humanBodyGpuRegion(original);
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
      regions.push({
        index: regionIndex,
        vertices: order.length,
        corners,
        surface: surfaceIndex,
        order,
      });
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
          surface: surfaceIndex,
          sourceOffset,
          id: regionCount === 1 ? bone : `${bone}/${surface.id}/${region.id}`,
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
      throw new Error(
        "The segment partition needs every built surface region.",
      );
    const meshes = regions.map((region) => {
      const posed = built.posedSurfaces[region.surface];
      const source = basis.surfaces[region.surface];
      if (
        posed === undefined ||
        posed.positions.length !== source.positions.length ||
        posed.normals.length !== source.positions.length
      )
        throw new Error(
          "The segment partition needs every connected posed skin surface.",
        );
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
      for (let output = 0; output < region.order.length; output++)
        for (let axis = 0; axis < 3; axis++) {
          const split = output * 3 + axis;
          const shared = region.order[output] * 3 + axis;
          if (
            mesh.positions[split] !== posed.positions[shared] ||
            mesh.normals?.[split] !== posed.normals[shared]
          )
            throw new Error(
              "A render region must agree with its connected posed skin.",
            );
        }
      return { part };
    });
    const sources = new Map<string, number[]>();
    const parts: IAutoMovieModel["parts"] = plans.map((plan) => {
      const { part } = meshes[plan.region];
      const posed = built.posedSurfaces[plan.surface];
      const positions: number[] = [];
      const normals: number[] = [];
      for (const source of plan.sources) {
        const local = source - plan.sourceOffset;
        positions.push(...posed.positions.slice(local * 3, local * 3 + 3));
        normals.push(...posed.normals.slice(local * 3, local * 3 + 3));
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
