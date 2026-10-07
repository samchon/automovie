import typia from "typia";

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
import { createHumanPersonBandFaceView } from "./createHumanPersonBandFaceView";
import { createHumanPersonSourceNormals } from "./createHumanPersonSourceNormals";
import { findHumanPersonSkinSurface } from "./findHumanPersonSkinSurface";
import { humanPersonEyeCentre } from "./humanPersonEyeCentre";

/**
 * Compile what a one-skin generation fixes before any document.
 *
 * It admits the generation-level records the face and body builders do not
 * (head weight map, band, aliases, drivers), checks that both partition views
 * are registered on the generation and that the head weight map names the
 * body's joints, compiles the one source normal field, maps the shared
 * boundary samples, extends the face view over the band's body cells, and
 * tables the body's rest rows at the shared and band vertices and the neutral
 * eye-centre anchor. Each failure refuses by name.
 *
 * @evidence contracts/common.md#principled-implementation Everything that depends on the generation alone is compiled once, so the evaluator and the rest reader cannot diverge.
 * @evidence contracts/common.md#clear-and-simple-design Admission, then the tables, in data order.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Incompatible views refuse by name; nothing is matched by position.
 * @evidence contracts/common.md#meaningful-documentation States every table and refusal.
 * @evidence contracts/modeling.md#shared-boundaries Maps every shared sample to its head and body vertex once.
 * @evidence contracts/modeling.md#spatial-conventions Neutral positions and the anchor are metres of the generation's frame.
 * @evidenceExclude contracts/modeling.md#part-identity-and-grouping The function defines no part.
 * @evidenceExclude contracts/modeling.md#parameter-channels The views own their channels.
 * @evidenceExclude contracts/modeling.md#emitted-geometry The function emits no geometry.
 * @evidenceExclude contracts/modeling.md#rendered-observation The function displays nothing.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The function carries no anatomical value.
 * @evidenceExclude contracts/anatomy.md#permitted-range The function admits no document.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The function converts no input.
 */
export function compileHumanPersonGeneration(
  generation: IAutoMovieHumanPersonGeneration,
): IAutoMovieHumanPersonCompiledGeneration {
  // the generation-level records the face and body builders do not admit;
  // each partition view is admitted by its own builder below
  const headSkin = typia.assertEquals<IAutoMovieHumanPersonHeadSkin>(
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
  const { face: faceBasis, body: bodyBasis } = generation;
  const { surface: faceSkin } = findHumanPersonSkinSurface(faceBasis.surfaces);
  const { index: bodyIndex, surface: bodySkin } = findHumanPersonSkinSurface(
    bodyBasis.surfaces,
  );
  const faceSource = faceSkin.sourcePartition;
  const bodySource = bodySkin.sourcePartition;
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
  const faceCount = faceSkin.positions.length / 3;
  assertHumanSkinBinding({
    binding: headSkin,
    vertices: faceCount,
    declared: new Set(bodyBasis.joints.map((joint) => joint.bone)),
    surface: faceSkin.id,
    description: "Head skin",
  });
  // Admits complementary coverage of the one source tree; a partial or
  // incompatible pair refuses here.
  const sourceNormals = createHumanPersonSourceNormals({
    face: faceSkin,
    body: bodySkin,
  });
  if (sourceNormals === undefined)
    throw new Error("A one-skin generation needs source-partitioned views.");

  // the shared boundary: samples both partitions own
  const faceOfSample = new Map<number, number>();
  faceSource.samples.forEach((sample, vertex) => {
    if (!faceOfSample.has(sample)) faceOfSample.set(sample, vertex);
  });
  const sharedBody: number[] = [];
  const sharedFace: number[] = [];
  bodySource.samples.forEach((sample, vertex) => {
    const face = faceOfSample.get(sample);
    if (face === undefined) return;
    sharedBody.push(vertex);
    sharedFace.push(face);
  });
  const bodyOfFace = new Map<number, number>();
  faceSource.samples.forEach((sample, vertex) => {
    const at = sharedFace.findIndex(
      (face) => faceSource.samples[face] === sample,
    );
    if (at >= 0) bodyOfFace.set(vertex, sharedBody[at]);
  });
  if (sharedBody.length === 0)
    throw new Error("The partition views share no boundary sample.");

  // The band's face side is evaluated by the face producer on an extended
  // view; its body side keeps the body builder's posing plus the face delta.
  const band = generation.band;
  const bandView =
    band === undefined
      ? undefined
      : createHumanPersonBandFaceView(generation, bodyIndex);
  const bandSources =
    bandView === undefined
      ? undefined
      : humanBasisRegionCorners(
          bandView.basis.surfaces.find(
            (surface) => surface.id === bandView.surface,
          )!.regions[0],
        ).sources;
  const faceRegions = new Map(
    faceSkin.regions.map((region) => [
      region.id,
      humanBasisRegionCorners(region).sources,
    ]),
  );
  const bodyRegions = new Map(
    bodySkin.regions.map((region) => [
      region.id,
      humanBasisRegionCorners(humanBodyGpuRegion(region)).sources,
    ]),
  );
  const neutralAnchor = humanPersonEyeCentre(
    Object.fromEntries(
      bodyBasis.landmarks.ids.map((id, at) => [
        id,
        {
          x: bodyBasis.landmarks.positions[at * 3],
          y: bodyBasis.landmarks.positions[at * 3 + 1],
          z: bodyBasis.landmarks.positions[at * 3 + 2],
        },
      ]),
    ),
  );
  const neutralBody = bodySkin.positions;
  // Aliased face channels are owned once by a body channel on the whole skin:
  // the face subtree states neither id and a linked population derives
  // nothing. Endpoint drivers carry the body's own gain of each body endpoint
  // whose rows the face view holds (head skin, parts, landmarks).
  const aliases = generation.aliases ?? [];
  const drivers = generation.drivers ?? [];
  for (const driver of drivers)
    if (
      !faceBasis.channels.some(
        (channel) =>
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
  const sharedSet = new Set(sharedBody);
  const bandBody = (bandView?.bodyVertices ?? []).filter(
    (vertex) => !sharedSet.has(vertex),
  );
  // the body vertices whose rest the evaluator reads: shared samples, then
  // the band's body side, in one compact table of the body's own rows
  const restVertices = [...sharedBody, ...bandBody];
  const restRows = new Map(restVertices.map((vertex, at) => [vertex, at]));
  const restTargets: Record<string, number[]> = {};
  for (const [name, rows] of Object.entries(bodySkin.targets)) {
    const kept: number[] = [];
    for (let i = 0; i < rows.length; i += 4) {
      const at = restRows.get(rows[i]);
      if (at !== undefined)
        kept.push(at, rows[i + 1], rows[i + 2], rows[i + 3]);
    }
    if (kept.length > 0) restTargets[name] = kept;
  }
  const restNeutral = restVertices.flatMap((vertex) =>
    [0, 1, 2].map((axis) => neutralBody[vertex * 3 + axis]),
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
            slots: new Map(bandBody.map((vertex, at) => [vertex, at])),
            skin: {
              joints: bodySkin.skin.joints,
              boneIndices: bandBody.flatMap((vertex) =>
                bodySkin.skin.boneIndices.slice(vertex * 4, vertex * 4 + 4),
              ),
              weights: bandBody.flatMap((vertex) =>
                bodySkin.skin.weights.slice(vertex * 4, vertex * 4 + 4),
              ),
            },
          },
  };

  const faceProducer = bandView?.basis ?? faceBasis;
  return {
    generation,
    faceProducer,
    faceProducerSkin: faceProducer.surfaces.findIndex(
      (surface) => surface.id === faceSkin.id,
    ),
    faceProducerBand:
      bandView === undefined
        ? undefined
        : faceProducer.surfaces.findIndex(
            (surface) => surface.id === bandView.surface,
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
