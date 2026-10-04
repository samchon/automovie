import { validateModel } from "@automovie/engine";
import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import { createHumanBodyBasisBuilder } from "../../body/basis/createHumanBodyBasisBuilder";
import { applyHumanBodyShapeRows } from "../../body/basis/applyHumanBodyShapeRows";
import { humanBodyBasisWeights } from "../../body/basis/humanBodyBasisWeights";
import { humanBodyGpuRegion } from "../../body/basis/humanBodyGpuRegion";
import { resolveHumanBodyShapeShoulderRest } from "../../body/basis/resolveHumanBodyShapeShoulderRest";
import { skinHumanBodySurface } from "../../body/basis/skinHumanBodySurface";
import { humanBasisRegionCorners } from "../../common/basis/humanBasisRegionCorners";
import { humanPhysicalSourceDomain } from "../../common/basis/humanPhysicalSourceDomain";
import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import { deriveHumanPersonBody } from "../document/deriveHumanPersonBody";
import { deriveHumanPersonFace } from "../document/deriveHumanPersonFace";
import type { IAutoMovieHumanFaceBasisDocument } from "../../face/structures/IAutoMovieHumanFaceBasisDocument";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import type { IAutoMovieHumanPersonGenerationBuild } from "../structures/IAutoMovieHumanPersonGenerationBuild";
import type { IAutoMovieHumanPersonGenerationBuilderProps } from "../structures/IAutoMovieHumanPersonGenerationBuilderProps";
import { clearHumanPersonHair } from "./clearHumanPersonHair";
import { createHumanPersonBandFaceView } from "./createHumanPersonBandFaceView";
import { createHumanPersonFaceBuilder } from "./createHumanPersonFaceBuilder";
import { createHumanPersonHeadTransform } from "./createHumanPersonHeadTransform";
import { humanPersonEyeCentre } from "./humanPersonEyeCentre";
import { createHumanPersonSourceNormals } from "./createHumanPersonSourceNormals";
import { meshOfHumanPart } from "./meshOfHumanPart";
import { moveHumanMeshRigidly } from "./moveHumanMeshRigidly";
import { resolveHumanPersonFaceBones } from "./resolveHumanPersonFaceBones";

/**
 * Compile one source generation into an evaluator of whole people that reads
 * the face and the body as the head and body cells of one skin, with no seam
 * stage.
 *
 * The generation's two partition views share the registered neck boundary as
 * sample identities, and its one weight map covers both. Each evaluation:
 *
 * 1. Derives the body document's colour from the face and evaluates both
 *    partition views with their own builders (`deriveHumanPersonBody`,
 *    the face producer), so each partition's channels, correctives,
 *    expression, jaw and contact stay with their owner. With band rows the
 *    face view is extended over the band's body cells
 *    (`createHumanPersonBandFaceView`), so the face producer also evaluates
 *    its band rows, closure and attachments there. A face channel the
 *    generation defines once through a body channel (`aliases`) is refused in
 *    the face subtree. Body endpoints whose rows the face view holds (head
 *    skin, carried parts, face landmarks) reach the face producer through
 *    endpoint drivers (`drivers`) weighted by the body's own gain under its
 *    endpoint state (`humanBodyBasisWeights`), so they apply before the
 *    face's expression and articulation.
 * 2. Forms one rest skin. A head vertex is the face's evaluated position
 *    carried by the face frame's anchor (`createHumanPersonHeadTransform`'s
 *    rest shift: the body's eye-centre displacement). A body
 *    vertex is the body's own rest; on the band it also takes the face
 *    producer's displacement of that vertex. A shared boundary sample is the
 *    sum of both partitions' absolute fields there: the face position plus
 *    the body's own displacement of that sample, which already contains the
 *    carry, so both formulas meet at the cut.
 * 3. Poses the head cells with the generation's one weight map through the
 *    body's own dual quaternion skinning and the body's bones; the body cells
 *    keep the body builder's posing, which uses the same map and bones; a band
 *    vertex adds its face displacement through the same rigid skinning
 *    transform. Each shared sample takes the head-side result on both halves,
 *    one value.
 * 4. Evaluates one normal field over both halves through their shared source
 *    tree (`createHumanPersonSourceNormals`), whose guards refuse a performed
 *    cell opposing its source parent.
 * 5. Emits the face and body parts unclipped (the views are already the
 *    partition), keeps the face's hair off the posed body and validates the
 *    resident model.
 *
 * There is no cut evaluation, collar conform, boundary subdivision or normal
 * fairing. What a seam stage absorbed is not hidden: where the two
 * partitions' channel fields disagree at the boundary (a generation without
 * band rows), the step lands in the rings next to it, and `boundary` reports
 * its size. The body rest of the shared samples and the band is the body's
 * shaped surface for the document's own endpoint state, the one its builder
 * skinned. The evaluator owns no anatomy and does
 * not judge head-to-stature or neck-girth relations.
 *
 * @evidence contracts/common.md#principled-implementation The order follows data dependence: both partitions are evaluated before the rest skin can be formed, the rest skin before the one skinning, the posed halves before the one normal field, and the normals before the parts are read back; a shared sample is one value because both partitions' fields are summed once and then skinned once with one weight row.
 * @evidence contracts/common.md#clear-and-simple-design One orchestrator over the existing face, body, head-carry, skinning, normal and hair owners; the only tables compiled once are the shared-sample maps and the region corner tables.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is special-cased for a document, a vertex or a revision; incompatible views refuse by name, the source normal guards are used unchanged and the boundary disagreement is reported rather than corrected.
 * @evidence contracts/common.md#meaningful-documentation The comment gives the stage order, the boundary rule, what is absent compared with the seam path and the cost of a posed document.
 * @evidence contracts/modeling.md#part-identity-and-grouping The person is a group of the two partitions' parts under `face:` and `body:` prefixes; the boundary introduces no third skin identity.
 * @evidence contracts/modeling.md#spatial-conventions One metre, Y-up, +Z-forward frame; the neutral-to-shaped conversion of the head is the head transform's named shift.
 * @evidence contracts/modeling.md#shared-boundaries Every shared sample has one rest value and one skinning row, so both halves read the same position, and one source normal field gives both the same normal.
 * @evidence contracts/modeling.md#emitted-geometry Emits the partition views' own triangles; no triangle is clipped, subdivided or dropped.
 * @evidenceExclude contracts/modeling.md#parameter-channels The evaluator consumes the partitions' channels through their owners and defines none.
 * @evidenceExclude contracts/modeling.md#rendered-observation Rendering is observed by the consumers of the model.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The evaluator carries no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The partitions' owners admit their documents.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The evaluator consumes the person document and adds no input.
 */
export function createHumanPersonGenerationBuilder(
  props: IAutoMovieHumanPersonGenerationBuilderProps,
): (document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonGenerationBuild {
  const { face: faceBasis, body: bodyBasis, headSkin } = props.generation;
  const faceIndex = faceBasis.surfaces.findIndex((surface) =>
    surface.regions.some((region) => region.material === HUMAN_PERSON_SEAM.skinMaterial));
  const bodyIndex = bodyBasis.surfaces.findIndex((surface) =>
    surface.regions.some((region) => region.material === HUMAN_PERSON_SEAM.skinMaterial));
  if (faceIndex < 0 || bodyIndex < 0)
    throw new Error("A one-skin generation needs a skin surface in both partition views.");
  const faceSkin = faceBasis.surfaces[faceIndex];
  const bodySkin = bodyBasis.surfaces[bodyIndex];
  const faceSource = faceSkin.sourcePartition;
  const bodySource = bodySkin.sourcePartition;
  if (
    faceSource === undefined ||
    bodySource === undefined ||
    faceSource.generation !== props.generation.id ||
    bodySource.generation !== props.generation.id
  )
    throw new Error("Both partition views must be registered on the generation " + props.generation.id + ".");
  const faceCount = faceSkin.positions.length / 3;
  if (headSkin.boneIndices.length !== faceCount * 4 || headSkin.weights.length !== faceCount * 4)
    throw new Error("The head weight map needs four influences per head skin vertex.");
  for (const bone of headSkin.joints)
    if (!bodyBasis.joints.some((joint) => joint.bone === bone))
      throw new Error("The head weight map names a joint the body does not declare: " + bone);
  // Admits complementary coverage of the one source tree; a partial or
  // incompatible pair refuses here.
  const sourceNormals = createHumanPersonSourceNormals({ face: faceSkin, body: bodySkin });
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
    const at = sharedFace.findIndex((face) => faceSource.samples[face] === sample);
    if (at >= 0) bodyOfFace.set(vertex, sharedBody[at]);
  });
  if (sharedBody.length === 0)
    throw new Error("The partition views share no boundary sample.");

  // The band's face side is evaluated by the face producer on an extended
  // view; its body side keeps the body builder's posing plus the face delta.
  const band = props.generation.band;
  const bandView = band === undefined ? undefined : createHumanPersonBandFaceView(props.generation, bodyIndex);
  const bandSources = bandView === undefined
    ? undefined
    : humanBasisRegionCorners(
        bandView.basis.surfaces.find((surface) => surface.id === bandView.surface)!.regions[0],
      ).sources;
  const buildFace = createHumanPersonFaceBuilder(bandView?.basis ?? faceBasis, props.occlusion);
  const buildBody = createHumanBodyBasisBuilder(bodyBasis, { physicalSource: "source-partition" });
  const faceRegions = new Map(
    faceSkin.regions.map((region) => [region.id, humanBasisRegionCorners(region).sources]),
  );
  const bodyRegions = new Map(
    bodySkin.regions.map((region) => [region.id, humanBasisRegionCorners(humanBodyGpuRegion(region)).sources]),
  );
  const neutralAnchor = humanPersonEyeCentre(
    Object.fromEntries(bodyBasis.landmarks.ids.map((id, at) => [id, {
      x: bodyBasis.landmarks.positions[at * 3],
      y: bodyBasis.landmarks.positions[at * 3 + 1],
      z: bodyBasis.landmarks.positions[at * 3 + 2],
    }])),
  );
  const neutralBody = bodySkin.positions;
  // Aliased face channels are owned once by a body channel on the whole skin:
  // the face subtree states neither id and a linked population derives
  // nothing. Endpoint drivers carry the body's own gain of each body endpoint
  // whose rows the face view holds (head skin, parts, landmarks).
  const aliases = props.generation.aliases ?? [];
  const drivers = props.generation.drivers ?? [];
  for (const driver of drivers)
    if (!faceBasis.channels.some((channel) => channel.id === driver.channel && channel.positive === driver.endpoint))
      throw new Error("The face view needs the driver channel " + driver.channel + " of body endpoint " + driver.endpoint + ".");
  const faceDocumentOf = (
    document: IAutoMovieHumanPersonDocument,
    gains: ReadonlyMap<string, number>,
  ): IAutoMovieHumanFaceBasisDocument => {
    if (aliases.length === 0 && drivers.length === 0) return deriveHumanPersonFace(document);
    const shape = { ...document.face.shape };
    for (const alias of aliases)
      if (Object.hasOwn(document.face.shape, alias.face) || Object.hasOwn(document.face.shape, alias.body))
        throw new Error("The generation defines " + alias.face + " once through the body channel " + alias.body + "; the face document must not state either.");
    for (const driver of drivers) {
      if (Object.hasOwn(document.face.shape, driver.channel))
        throw new Error("The face document must not state the body endpoint driver " + driver.channel + ".");
      shape[driver.channel] = gains.get(driver.endpoint) ?? 0;
    }
    return { ...document.face, shape };
  };
  // the band's own body vertices (shared samples belong to the face skin)
  const sharedSet = new Set(sharedBody);
  const bandBody = (bandView?.bodyVertices ?? []).filter((vertex) => !sharedSet.has(vertex));
  const bandSlot = new Map(bandBody.map((vertex, at) => [vertex, at]));
  // the body vertices whose rest the evaluator reads: shared samples, then
  // the band's body side, in one compact table of the body's own rows
  const restVertices = [...sharedBody, ...bandBody];
  const compact = new Map(restVertices.map((vertex, at) => [vertex, at]));
  const restTargets: Record<string, number[]> = {};
  for (const [name, rows] of Object.entries(bodySkin.targets)) {
    const kept: number[] = [];
    for (let i = 0; i < rows.length; i += 4) {
      const at = compact.get(rows[i]);
      if (at !== undefined) kept.push(at, rows[i + 1], rows[i + 2], rows[i + 3]);
    }
    if (kept.length > 0) restTargets[name] = kept;
  }
  const restNeutral = restVertices.flatMap((vertex) => [0, 1, 2].map((axis) => neutralBody[vertex * 3 + axis]));
  const bandSkin = {
    joints: bodySkin.skin.joints,
    boneIndices: bandBody.flatMap((vertex) => bodySkin.skin.boneIndices.slice(vertex * 4, vertex * 4 + 4)),
    weights: bandBody.flatMap((vertex) => bodySkin.skin.weights.slice(vertex * 4, vertex * 4 + 4)),
  };

  return (document) => {
    const bodyDocument = deriveHumanPersonBody({ document, faceMaterials: faceBasis.materials });
    const body = buildBody(bodyDocument);
    // the body's own endpoint state, the one its builder skinned the shaped
    // surface with (pose correctives included)
    const state = humanBodyBasisWeights(
      bodyBasis,
      bodyDocument,
      resolveHumanBodyShapeShoulderRest(bodyBasis, bodyDocument.shape),
    );
    const bodyRest = restNeutral.slice();
    applyHumanBodyShapeRows(bodyBasis, state, bodyRest, restTargets);
    // each body endpoint's gain under that state: a channel side's weight or a
    // corrective's activation, the factors the body applies its rows with
    const gains = new Map<string, number>();
    for (const channel of bodyBasis.channels) {
      const weight = state.weights.get(channel.id) ?? 0;
      if (weight !== 0) gains.set(weight < 0 ? channel.negative! : channel.positive, Math.abs(weight));
    }
    for (const one of state.activations)
      if (one.activation > 0) gains.set(one.target, (gains.get(one.target) ?? 0) + one.activation);
    const faceDocument = faceDocumentOf(document, gains);
    const bones = new Map(body.bones.map((one) => [one.bone, one]));
    const head = createHumanPersonHeadTransform({
      anchor: { neutral: neutralAnchor, shaped: humanPersonEyeCentre(body.landmarks) },
      rest: bones.get("head")!.rest,
      posed: bones.get("head")!.posed,
    });
    const shift = [head.shift.x, head.shift.y, head.shift.z];

    const evaluate = (face: IAutoMovieModel) => {
      // the face skin's shared vertices, read back from its render parts
      const raw = new Array<number>(faceCount * 3).fill(0);
      for (const part of face.parts) {
        const sources = faceRegions.get(part.id);
        if (sources === undefined) continue;
        const { positions } = meshOfHumanPart(part);
        sources.forEach((source, vertex) => {
          for (let axis = 0; axis < 3; axis++) raw[source * 3 + axis] = positions[vertex * 3 + axis];
        });
      }
      let faceField = 0;
      let bodyField = 0;
      const rest = raw.map((value, at) => value + shift[at % 3]);
      for (const [vertex, own] of bodyOfFace) {
        const at = compact.get(own)!;
        const faceStep = [0, 1, 2].map((axis) => raw[vertex * 3 + axis] - faceSkin.positions[vertex * 3 + axis]);
        const bodyStep = [0, 1, 2].map((axis) => bodyRest[at * 3 + axis] - neutralBody[own * 3 + axis]);
        faceField = Math.max(faceField, Math.hypot(...faceStep));
        bodyField = Math.max(bodyField, Math.hypot(...bodyStep.map((step, axis) => step - shift[axis])));
        for (let axis = 0; axis < 3; axis++) rest[vertex * 3 + axis] = raw[vertex * 3 + axis] + bodyStep[axis];
      }
      const facePosed = skinHumanBodySurface(rest, headSkin, bodyBasis.joints, bones);
      const bodyPosed = body.posedSurfaces[bodyIndex].positions.slice();
      sharedBody.forEach((vertex, at) => {
        for (let axis = 0; axis < 3; axis++)
          bodyPosed[vertex * 3 + axis] = facePosed[sharedFace[at] * 3 + axis];
      });
      if (bandSources !== undefined && bandBody.length > 0) {
        // the band's body side: the face producer's displacement of each
        // appended vertex, added in the rest frame and carried by the same
        // rigid skinning transform the body builder gave that vertex
        const banded = new Array<number>(bandBody.length * 3).fill(0);
        const part = face.parts.find((one) => one.id === bandView!.surface)!;
        const { positions } = meshOfHumanPart(part);
        bandSources.forEach((source, vertex) => {
          const slot = bandSlot.get(bandView!.bodyVertices[source]);
          if (slot === undefined) return;
          for (let axis = 0; axis < 3; axis++)
            banded[slot * 3 + axis] = positions[vertex * 3 + axis];
        });
        const before = bodyRest.slice(sharedBody.length * 3);
        const after = before.map((value, at) =>
          value + banded[at] - neutralBody[bandBody[Math.floor(at / 3)] * 3 + (at % 3)]);
        const from = skinHumanBodySurface(before, bandSkin, bodyBasis.joints, bones);
        const to = skinHumanBodySurface(after, bandSkin, bodyBasis.joints, bones);
        bandBody.forEach((vertex, at) => {
          for (let axis = 0; axis < 3; axis++)
            bodyPosed[vertex * 3 + axis] += to[at * 3 + axis] - from[at * 3 + axis];
        });
      }
      return { facePosed, bodyPosed, faceField, bodyField };
    };

    const currentFace = buildFace(faceDocument);
    const face = currentFace.model;
    const skin = evaluate(face);
    const { facePosed, bodyPosed } = skin;
    // A fixed normal transport reads the mouthClose-zero reference of the same
    // shape, other expression and body; omission is zero at the face owner.
    const referenceExpression = { ...faceDocument.expression };
    delete referenceExpression.mouthClose;
    const reference = faceSource.normalTransport === undefined
      ? undefined
      : evaluate(buildFace({ ...faceDocument, expression: referenceExpression }).model);
    const normals = sourceNormals({
      face: facePosed,
      body: bodyPosed,
      bodyIndices: bodySkin.indices,
      reference: reference === undefined ? undefined : {
        generation: props.generation.id,
        face: reference.facePosed,
        body: reference.bodyPosed,
        bodyIndices: bodySkin.indices,
      },
    });

    const physicalDomain = humanPhysicalSourceDomain(document.id, props.generation.id);
    const read = (
      mesh: IAutoMovieMesh,
      sources: readonly number[],
      positions: readonly number[],
      offset: number,
    ): IAutoMovieMesh => {
      if (mesh.physicalVertices === undefined)
        throw new Error("Person physical registration needs both actual registered skin halves.");
      resolveAutoMovieMeshPhysicalVertices(mesh);
      const samples = offset === 0 ? faceSource.samples : bodySource.samples;
      const origin = humanPhysicalSourceDomain(
        offset === 0 ? faceDocument.id : bodyDocument.id,
        props.generation.id,
      );
      sources.forEach((source, vertex) => {
        const reference = mesh.physicalVertices!.vertices[vertex];
        const actual = reference === null ? undefined : mesh.physicalVertices!.sources[reference];
        if (samples[source] === undefined || actual === undefined ||
            actual.domain !== origin || actual.id !== samples[source])
          throw new Error("Person physical registration needs the actual admitted canonical skin samples.");
      });
      const out: IAutoMovieMesh = {
        ...mesh,
        positions: mesh.positions.slice(),
        normals: [],
        physicalVertices: {
          sources: mesh.physicalVertices.sources.map((source) => ({
            ...source,
            domain: source.domain === origin ? physicalDomain : source.domain,
          })),
          vertices: mesh.physicalVertices.vertices.slice(),
        },
      };
      sources.forEach((source, vertex) => {
        for (let axis = 0; axis < 3; axis++) {
          out.positions[vertex * 3 + axis] = positions[source * 3 + axis];
          out.normals![vertex * 3 + axis] = normals[(source + offset) * 3 + axis];
        }
      });
      return out;
    };

    const placed = face.parts.filter((part) => part.id !== bandView?.surface).map((part) => {
      const mesh = meshOfHumanPart(part);
      const sources = faceRegions.get(part.id);
      return {
        ...part,
        geometry: {
          type: "mesh" as const,
          mesh: sources === undefined ? moveHumanMeshRigidly(mesh, head) : read(mesh, sources, facePosed, 0),
        },
      };
    });
    clearHumanPersonHair({
      parts: placed,
      isGenerated: (id) => currentFace.hairPartIds.has(id),
      layers: faceDocument.hair?.layers ?? [],
      positions: bodyPosed,
      indices: bodySkin.indices,
    });
    const parts: IAutoMovieModel["parts"] = placed.map((part) =>
      prefixed("face", part, meshOfHumanPart(part)),
    );
    for (const part of body.model.parts) {
      const mesh = meshOfHumanPart(part);
      const sources = bodyRegions.get(part.id);
      parts.push(prefixed("body", part, sources === undefined ? mesh : read(mesh, sources, bodyPosed, faceCount)));
    }
    const model: IAutoMovieModel = {
      id: document.id,
      name: document.name,
      origin: "imported",
      parts,
      materials: [
        ...face.materials.map((material) => ({ ...material, id: "face:" + material.id })),
        ...body.model.materials.map((material) => ({ ...material, id: "body:" + material.id })),
      ],
      skeleton: null,
      body: null,
      asset: null,
    };
    const validation = validateModel({ model });
    if (!validation.success)
      throw new Error("The evaluated person is not a valid resident model: " + JSON.stringify(validation));
    return {
      model,
      body,
      bones: [
        ...body.bones,
        ...resolveHumanPersonFaceBones({ basis: faceBasis, document: faceDocument, head }),
      ],
      boundary: { faceFieldMetres: skin.faceField, bodyFieldMetres: skin.bodyField },
    };
  };
}

/** A part under its owner's prefix, on its own material's prefixed id. */
function prefixed(
  owner: "face" | "body",
  part: IAutoMovieModel["parts"][number],
  mesh: IAutoMovieMesh,
): IAutoMovieModel["parts"][number] {
  return {
    ...part,
    id: owner + ":" + part.id,
    name: owner + ":" + part.name,
    material: owner + ":" + part.material,
    geometry: { type: "mesh", mesh },
  };
}
