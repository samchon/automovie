import typia from "typia";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { humanBodyGpuRegion } from "../../body/basis/humanBodyGpuRegion";
import { assertHumanSkinBinding } from "../../common/basis/assertHumanSkinBinding";
import { humanBasisRegionCorners } from "../../common/basis/humanBasisRegionCorners";
import type { IAutoMovieHumanPersonChannelAlias } from "../structures/IAutoMovieHumanPersonChannelAlias";
import type { IAutoMovieHumanPersonCompiledGeneration } from "../structures/IAutoMovieHumanPersonCompiledGeneration";
import type { IAutoMovieHumanPersonEndpointDriver } from "../structures/IAutoMovieHumanPersonEndpointDriver";
import type { IAutoMovieHumanPersonGeneration } from "../structures/IAutoMovieHumanPersonGeneration";
import type { IAutoMovieHumanPersonGenerationBand } from "../structures/IAutoMovieHumanPersonGenerationBand";
import type { IAutoMovieHumanPersonHeadSkin } from "../structures/IAutoMovieHumanPersonHeadSkin";
import type { IAutoMovieHumanPersonSkinPlan } from "../structures/IAutoMovieHumanPersonSkinPlan";
import type { IAutoMovieHumanPersonSkinSurface } from "../structures/IAutoMovieHumanPersonSkinSurface";
import { createHumanPersonBandFaceView } from "./createHumanPersonBandFaceView";
import { createHumanPersonSourceNormals } from "./createHumanPersonSourceNormals";
import { findHumanPersonSkinSurface } from "./findHumanPersonSkinSurface";
import { humanPersonEyeCentre } from "./humanPersonEyeCentre";

/**
 * Compile what a one-skin generation fixes before any document.
 *
 * It admits the generation-level records the face and body builders do not (head weight map, band, aliases, drivers), checks that both partition views are registered on the generation and that the head weight map names the body's joints, compiles the one source normal field, maps the shared boundary samples, extends the face view over the band's body cells, and tables the body's rest rows at the shared and band vertices and the neutral eye-centre anchor. Each failure refuses by name.
 *
 * Geometry is head/body source metres. Generation records and unchanged source arrays are borrowed; compiled normal correspondence owns its admitted copies. Shared-sample aliases select the first body occurrence, preserving original lookup semantics. This compilation establishes correspondence and binding, not clinical head/body proportions or current rendered appearance.
 *
 * @evidence contracts/common.md#principled-implementation Same-generation complementary partitions and admitted head skin weights produce shared canonical-sample correspondence, optional band evaluation and compact native rest rows without coordinate welding.
 * @evidence contracts/common.md#clear-and-simple-design Generation admission and invariant tables compile once here; face/body builders, source normals and per-document skin formation retain their own geometry responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Missing generation registration, shared samples or driver endpoints refuse; first-occurrence maps preserve alias selection without inferred boundaries or clinical proportion certification.
 * @evidence contracts/common.md#meaningful-documentation Prose identifies metre source frames, borrowed versus compiled-owned records, first-body alias semantics and the limits of source correspondence.
 * @evidence contracts/performance.md#efficient-algorithms For F face, B body and S shared samples, correspondence uses O(F+B+S) map passes instead of repeated boundary searches; rest-row extraction visits sparse targets once, while source-normal compilation and optional band-view scans retain their topology-dependent costs.
 * @evidence contracts/performance.md#reuse-equivalent-work The returned tables, normal evaluator, band view and neutral anchor serve all documents for this unchanged generation; modified source/binding/channel records require recompilation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The caller owns the compiled maps and compact buffers plus borrowed generation references until dropped; populations follow actual source/shared/band/target counts, with no global task or handle.
 */
export function compileHumanPersonGeneration(
  generation: IAutoMovieHumanPersonGeneration,
): IAutoMovieHumanPersonCompiledGeneration {
  // the generation-level records the face and body builders do not admit;
  // each partition view is admitted by its own builder below
  const headSkin: IAutoMovieHumanPersonHeadSkin = typia.assertEquals<IAutoMovieHumanPersonHeadSkin>(
    generation.headSkin,
  );
  if (generation.band !== undefined)
    typia.assertEquals<IAutoMovieHumanPersonGenerationBand>(generation.band);
  if (generation.aliases !== undefined)
    typia.assertEquals<IAutoMovieHumanPersonChannelAlias[]>(generation.aliases);
  if (generation.drivers !== undefined)
    typia.assertEquals<IAutoMovieHumanPersonEndpointDriver[]>(
      generation.drivers,
    );
  const { face: faceBasis, body: bodyBasis }: IAutoMovieHumanPersonGeneration = generation;
  const { surface: faceSkin }: IAutoMovieHumanPersonSkinSurface<IAutoMovieHumanPersonGeneration["face"]["surfaces"][number]> = findHumanPersonSkinSurface(faceBasis.surfaces);
  const { index: bodyIndex, surface: bodySkin }: IAutoMovieHumanPersonSkinSurface<IAutoMovieHumanPersonGeneration["body"]["surfaces"][number]> = findHumanPersonSkinSurface(
    bodyBasis.surfaces,
  );
  const faceSource: IAutoMovieHumanPersonCompiledGeneration["faceSource"] | undefined = faceSkin.sourcePartition;
  const bodySource: IAutoMovieHumanPersonCompiledGeneration["bodySource"] | undefined = bodySkin.sourcePartition;
  if (
    faceSource === undefined ||
    bodySource === undefined ||
    faceSource.generation !== generation.id ||
    bodySource.generation !== generation.id
  )
    throw new Error(
      "Both partition views must be registered on the generation " +
        generation.id +
        ".",
    );
  const faceCount: number = faceSkin.positions.length / 3;
  assertHumanSkinBinding({
    binding: headSkin,
    vertices: faceCount,
    declared: new Set(bodyBasis.joints.map((joint: IAutoMovieHumanPersonGeneration["body"]["joints"][number]): typeof joint.bone => joint.bone)),
    surface: faceSkin.id,
    description: "Head skin",
  });
  // Admits complementary coverage of the one source tree; a partial or
  // incompatible pair refuses here.
  const sourceNormals: ReturnType<typeof createHumanPersonSourceNormals> = createHumanPersonSourceNormals({
    face: faceSkin,
    body: bodySkin,
  });
  if (sourceNormals === undefined)
    throw new Error("A one-skin generation needs source-partitioned views.");

  // the shared boundary: samples both partitions own
  const faceOfSample: Map<number, number> = new Map<number, number>();
  faceSource.samples.forEach((sample: number, vertex: number): void => {
    if (!faceOfSample.has(sample)) faceOfSample.set(sample, vertex);
  });
  const sharedBody: number[] = [];
  const sharedFace: number[] = [];
  bodySource.samples.forEach((sample: number, vertex: number): void => {
    const face: number | undefined = faceOfSample.get(sample);
    if (face === undefined) return;
    sharedBody.push(vertex);
    sharedFace.push(face);
  });
  const firstSharedBody: Map<number, number> = new Map<number, number>();
  sharedFace.forEach((face: number, at: number): void => {
    const sample: number = faceSource.samples[face];
    if (!firstSharedBody.has(sample)) firstSharedBody.set(sample, sharedBody[at]);
  });
  const bodyOfFace: Map<number, number> = new Map<number, number>();
  faceSource.samples.forEach((sample: number, vertex: number): void => {
    const body: number | undefined = firstSharedBody.get(sample);
    if (body !== undefined) bodyOfFace.set(vertex, body);
  });
  if (sharedBody.length === 0)
    throw new Error("The partition views share no boundary sample.");

  // The band's face side is evaluated by the face producer on an extended
  // view; its body side keeps the body builder's posing plus the face delta.
  const band: IAutoMovieHumanPersonGenerationBand | undefined = generation.band;
  const bandView: ReturnType<typeof createHumanPersonBandFaceView> | undefined =
    band === undefined
      ? undefined
      : createHumanPersonBandFaceView(generation, bodyIndex);
  const bandSources: readonly number[] | undefined =
    bandView === undefined
      ? undefined
      : humanBasisRegionCorners(
          bandView.basis.surfaces.find(
            (surface: IAutoMovieHumanPersonGeneration["face"]["surfaces"][number]): boolean => surface.id === bandView.surface,
          )!.regions[0],
        ).sources;
  const faceRegions: Map<string, readonly number[]> = new Map(
    faceSkin.regions.map((region: IAutoMovieHumanPersonGeneration["face"]["surfaces"][number]["regions"][number]): [string, readonly number[]] => [
      region.id,
      humanBasisRegionCorners(region).sources,
    ]),
  );
  const bodyRegions: Map<string, readonly number[]> = new Map(
    bodySkin.regions.map((region: IAutoMovieHumanPersonGeneration["body"]["surfaces"][number]["regions"][number]): [string, readonly number[]] => [
      region.id,
      humanBasisRegionCorners(humanBodyGpuRegion(region)).sources,
    ]),
  );
  const neutralAnchor: IAutoMovieVector3 = humanPersonEyeCentre(
    Object.fromEntries(
      bodyBasis.landmarks.ids.map((id: string, at: number): [string, IAutoMovieVector3] => [
        id,
        {
          x: bodyBasis.landmarks.positions[at * 3],
          y: bodyBasis.landmarks.positions[at * 3 + 1],
          z: bodyBasis.landmarks.positions[at * 3 + 2],
        },
      ]),
    ),
  );
  const neutralBody: number[] = bodySkin.positions;
  // Aliased face channels are owned once by a body channel on the whole skin:
  // the face subtree states neither id and a linked population derives
  // nothing. Endpoint drivers carry the body's own gain of each body endpoint
  // whose rows the face view holds (head skin, parts, landmarks).
  const aliases: IAutoMovieHumanPersonChannelAlias[] = generation.aliases ?? [];
  const drivers: IAutoMovieHumanPersonEndpointDriver[] = generation.drivers ?? [];
  for (const driver of drivers)
    if (
      !faceBasis.channels.some(
        (channel: IAutoMovieHumanPersonGeneration["face"]["channels"][number]): boolean =>
          channel.id === driver.channel && channel.positive === driver.endpoint,
      )
    )
      throw new Error(
        "The face view needs the driver channel " +
          driver.channel +
          " of body endpoint " +
          driver.endpoint +
          ".",
      );
  // the band's own body vertices (shared samples belong to the face skin)
  const sharedSet: Set<number> = new Set(sharedBody);
  const bandBody: number[] = (bandView?.bodyVertices ?? []).filter(
    (vertex: number): boolean => !sharedSet.has(vertex),
  );
  // the body vertices whose rest the evaluator reads: shared samples, then
  // the band's body side, in one compact table of the body's own rows
  const restVertices: number[] = [...sharedBody, ...bandBody];
  const restRows: Map<number, number> = new Map(restVertices.map((vertex: number, at: number): [number, number] => [vertex, at]));
  const restTargets: Record<string, number[]> = {};
  for (const [name, rows] of Object.entries(bodySkin.targets)) {
    const kept: number[] = [];
    for (let i: number = 0; i < rows.length; i += 4) {
      const at: number | undefined = restRows.get(rows[i]);
      if (at !== undefined)
        kept.push(at, rows[i + 1], rows[i + 2], rows[i + 3]);
    }
    if (kept.length > 0) restTargets[name] = kept;
  }
  const restNeutral: number[] = restVertices.flatMap((vertex: number): number[] =>
    [0, 1, 2].map((axis: number): number => neutralBody[vertex * 3 + axis]),
  );
  const plan: IAutoMovieHumanPersonSkinPlan = {
    faceCount,
    faceNeutral: faceSkin.positions,
    faceRegions,
    bodyNeutral: neutralBody,
    sharedBody,
    sharedFace,
    bodyOfFace,
    restRows,
    headSkin,
    joints: bodyBasis.joints,
    band:
      bandView === undefined || bandSources === undefined
        ? undefined
        : {
            surface: bandView.surface,
            sources: bandSources,
            viewBodyVertices: bandView.bodyVertices,
            bodyVertices: bandBody,
            slots: new Map(bandBody.map((vertex: number, at: number): [number, number] => [vertex, at])),
            skin: {
              joints: bodySkin.skin.joints,
              boneIndices: bandBody.flatMap((vertex: number): number[] =>
                bodySkin.skin.boneIndices.slice(vertex * 4, vertex * 4 + 4),
              ),
              weights: bandBody.flatMap((vertex: number): number[] =>
                bodySkin.skin.weights.slice(vertex * 4, vertex * 4 + 4),
              ),
            },
          },
  };

  const faceProducer: IAutoMovieHumanPersonGeneration["face"] = bandView?.basis ?? faceBasis;
  return {
    generation,
    faceProducer,
    faceProducerSkin: faceProducer.surfaces.findIndex(
      (surface: IAutoMovieHumanPersonGeneration["face"]["surfaces"][number]): boolean => surface.id === faceSkin.id,
    ),
    faceProducerBand:
      bandView === undefined
        ? undefined
        : faceProducer.surfaces.findIndex(
            (surface: IAutoMovieHumanPersonGeneration["face"]["surfaces"][number]): boolean => surface.id === bandView.surface,
          ),
    bodyIndex,
    faceSource,
    bodySource,
    plan,
    restTargets,
    restNeutral,
    neutralAnchor,
    aliases,
    drivers,
    bodyRegions,
    sourceNormals,
  };
}
