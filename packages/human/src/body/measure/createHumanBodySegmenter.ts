import type {
  AutoMovieHumanoidBone,
  IAutoMovieMesh,
  IAutoMovieModel,
} from "@automovie/interface";

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
 * The builder and this compiler share source-vertex/Float32-UV corner identity through humanBodyGpuRegion. Each output vertex selects its greatest of four skin weights with first-slot ties; each triangle chooses its majority corner bone, or first corner on a three-way tie. Compact indices, source ordinals and joint/region order depend on the admitted immutable basis and are reused across shape/pose evaluations.
 *
 * Evaluation checks the supplied build's original region population, incidence, positions and normals against that same build's connected posed skin before copying actual metre geometry into fresh contact parts. Garment-split rendering supplies sourceSkinModel as its matching pre-garment region authority; omission uses the original render model. Neither caller inputs nor posed geometry are cached or mutated.
 *
 * Segmentation names rig-weight contact witnesses, including self-crossings inside one region. It does not construct physical bone or tissue boundaries; the caller owns actual crossing queries and their interpretation. The returned model retains unchanged source-model metadata but replaces parts with the skin contact partition, so it is an instrument result rather than a second complete anatomical rendering.
 *
 * @evidence contracts/common.md#principled-implementation Shared source/Float32-UV identity and dominant/majority bone rules compile immutable contact plans, then exact source-region/posed-skin equality checks precede copying each build's current geometry.
 * @evidence contracts/common.md#clear-and-simple-design Basis-only corner/part planning is separated from per-build correspondence admission and output copying, with garment rendering retaining explicit pre-garment authority.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Mismatched source populations, incidence, positions or normals refuse; dominant rig weights cannot establish bone/tissue surfaces or crossing-free anatomical validity.
 * @evidence contracts/common.md#meaningful-documentation The prose defines Float32 UV identity, tie/majority rules, original source ordinals, immutable-basis reuse and contact-instrument output scope.
 * @evidence contracts/performance.md#efficient-algorithms Compilation scans region corners/triangles, builds compact maps and sorts P part plans in O(P log P); each evaluation checks and copies its actual skin/region population without rebuilding topology.
 * @evidence contracts/performance.md#reuse-equivalent-work One basis plan and shared GPU UV identity serve all admitted shapes/poses, while changed performed positions/normals are freshly checked rather than cached.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The closure retains basis/plan topology until released; per-build checks expire and returned meshes/source maps own copied arrays without retaining earlier posed builds or external tasks.
 */
export function createHumanBodySegmenter(basis: IAutoMovieHumanBodyBasis): (
  built: IAutoMovieHumanBodyBuild,
) => {
  model: IAutoMovieModel;
  sources: Map<string, number[]>;
} {
  const regionCount: number = basis.surfaces.reduce(
    (
      count: number,
      surface: IAutoMovieHumanBodyBasis["surfaces"][number],
    ): number => count + surface.regions.length,
    0,
  );
  const jointOrder: Map<AutoMovieHumanoidBone, number> = new Map(
    basis.joints.map(
      (
        joint: IAutoMovieHumanBodyBasis["joints"][number],
        i: number,
      ): [AutoMovieHumanoidBone, number] => [joint.bone, i],
    ),
  );
  const regions: RegionPlan[] = [];
  const plans: PartPlan[] = [];
  let sourceOffset: number = 0;
  for (const [surfaceIndex, surface] of basis.surfaces.entries()) {
    for (const original of surface.regions) {
      const region: ReturnType<typeof humanBodyGpuRegion> =
        humanBodyGpuRegion(original);
      const outputByKey: Map<string, number> = new Map<string, number>();
      const order: number[] = [];
      const corners: number[] = region.indices.map(
        (source: number, corner: number): number => {
          const uv: number[] | undefined = region.uvs?.slice(
            corner * 2,
            corner * 2 + 2,
          );
          const key: string = `${source}/${uv?.join(",") ?? ""}`;
          let output: number | undefined = outputByKey.get(key);
          if (output === undefined) {
            output = order.length;
            outputByKey.set(key, output);
            order.push(source);
          }
          return output;
        },
      );
      const regionIndex: number = regions.length;
      regions.push({
        index: regionIndex,
        vertices: order.length,
        corners,
        surface: surfaceIndex,
        order,
      });
      const dominant: number[] = order.map((source: number): number => {
        let best: number = 0;
        for (let k: number = 1; k < 4; k++)
          if (
            surface.skin.weights[source * 4 + k] >
            surface.skin.weights[source * 4 + best]
          )
            best = k;
        return surface.skin.boneIndices[source * 4 + best];
      });
      const buckets: Map<number, number[]> = new Map<number, number[]>();
      for (let t: number = 0; t < corners.length; t += 3) {
        const bones: number[] = [
          corners[t],
          corners[t + 1],
          corners[t + 2],
        ].map((output: number): number => dominant[output]);
        const owner: number =
          bones[1] === bones[2] && bones[0] !== bones[1] ? bones[1] : bones[0];
        const list: number[] | undefined = buckets.get(owner);
        if (list === undefined)
          buckets.set(owner, [corners[t], corners[t + 1], corners[t + 2]]);
        else list.push(corners[t], corners[t + 1], corners[t + 2]);
      }
      for (const [owner, triangles] of buckets) {
        const compact: Map<number, number> = new Map<number, number>();
        const outputs: number[] = [];
        const indices: number[] = triangles.map((output: number): number => {
          let index: number | undefined = compact.get(output);
          if (index === undefined) {
            index = outputs.length;
            compact.set(output, index);
            outputs.push(output);
          }
          return index;
        });
        const bone: AutoMovieHumanoidBone = surface.skin.joints[owner];
        plans.push({
          bone: jointOrder.get(bone)!,
          region: regionIndex,
          surface: surfaceIndex,
          sourceOffset,
          id: regionCount === 1 ? bone : `${bone}/${surface.id}/${region.id}`,
          outputs,
          indices,
          sources: outputs.map(
            (output: number): number => sourceOffset + order[output],
          ),
        });
      }
    }
    sourceOffset += surface.positions.length / 3;
  }
  plans.sort(
    (a: PartPlan, b: PartPlan): number =>
      a.bone - b.bone || a.region - b.region,
  );
  return (
    built: IAutoMovieHumanBodyBuild,
  ): { model: IAutoMovieModel; sources: Map<string, number[]> } => {
    const sourceModel: IAutoMovieModel = built.sourceSkinModel ?? built.model;
    if (sourceModel.parts.length < regionCount)
      throw new Error(
        "The segment partition needs every built surface region.",
      );
    const meshes: { part: IAutoMovieModel["parts"][number] }[] = regions.map(
      (region: RegionPlan): { part: IAutoMovieModel["parts"][number] } => {
        const posed:
          | IAutoMovieHumanBodyBuild["posedSurfaces"][number]
          | undefined = built.posedSurfaces[region.surface];
        const source: IAutoMovieHumanBodyBasis["surfaces"][number] =
          basis.surfaces[region.surface];
        if (
          posed === undefined ||
          posed.positions.length !== source.positions.length ||
          posed.normals.length !== source.positions.length
        )
          throw new Error(
            "The segment partition needs every connected posed skin surface.",
          );
        const part: IAutoMovieModel["parts"][number] =
          sourceModel.parts[region.index];
        const geometry: typeof part.geometry = part.geometry;
        if (geometry.type !== "mesh")
          throw new Error("A built body part must be a resident mesh.");
        const mesh: IAutoMovieMesh = geometry.mesh;
        if (
          region.vertices * 3 !== mesh.positions.length ||
          mesh.indices?.length !== region.corners.length ||
          mesh.indices.some(
            (value: number, at: number): boolean =>
              value !== region.corners[at],
          )
        )
          throw new Error(
            "The segment partition does not match the built vertex population and corner order.",
          );
        for (let output: number = 0; output < region.order.length; output++)
          for (let axis: number = 0; axis < 3; axis++) {
            const split: number = output * 3 + axis;
            const shared: number = region.order[output] * 3 + axis;
            if (
              mesh.positions[split] !== posed.positions[shared] ||
              mesh.normals?.[split] !== posed.normals[shared]
            )
              throw new Error(
                "A render region must agree with its connected posed skin.",
              );
          }
        return { part };
      },
    );
    const sources: Map<string, number[]> = new Map<string, number[]>();
    const parts: IAutoMovieModel["parts"] = plans.map(
      (plan: PartPlan): IAutoMovieModel["parts"][number] => {
        const { part }: (typeof meshes)[number] = meshes[plan.region];
        const posed: IAutoMovieHumanBodyBuild["posedSurfaces"][number] =
          built.posedSurfaces[plan.surface];
        const positions: number[] = [];
        const normals: number[] = [];
        for (const source of plan.sources) {
          const local: number = source - plan.sourceOffset;
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
      },
    );
    return { model: { ...sourceModel, parts }, sources };
  };
}
