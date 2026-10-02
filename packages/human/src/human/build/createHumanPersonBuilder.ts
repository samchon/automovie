import { validateModel } from "@automovie/engine";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import { humanBasisRegionCorners } from "../../common/basis/humanBasisRegionCorners";
import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import { createHumanBodyBasisBuilder } from "../../body/basis/createHumanBodyBasisBuilder";
import { humanBodyGpuRegion } from "../../body/basis/humanBodyGpuRegion";
import { skinHumanBodySurface } from "../../body/basis/skinHumanBodySurface";
import type { IAutoMovieHumanBodyBasis } from "../../body/structures/IAutoMovieHumanBodyBasis";
import { createHumanFaceBasisBuilder } from "../../face/basis/createHumanFaceBasisBuilder";
import type { IAutoMovieHumanFaceBasis } from "../../face/structures/IAutoMovieHumanFaceBasis";
import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import { deriveHumanPersonBody } from "../document/deriveHumanPersonBody";
import { deriveHumanPersonFace } from "../document/deriveHumanPersonFace";
import { conformHumanPersonCollar } from "../seam/conformHumanPersonCollar";
import { fairHumanSeamNormals } from "../seam/fairHumanSeamNormals";
import { createHumanPersonFaceSkin } from "../seam/createHumanPersonFaceSkin";
import { createHumanPersonSeam } from "../seam/createHumanPersonSeam";
import { clipHumanPersonMesh } from "../seam/clipHumanPersonMesh";
import { evaluateHumanPersonCut } from "../seam/evaluateHumanPersonCut";
import { dropHumanMeshTriangles } from "../seam/dropHumanMeshTriangles";
import type { IAutoMovieHumanPersonBuild } from "../structures/IAutoMovieHumanPersonBuild";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import { createHumanPersonHeadTransform } from "./createHumanPersonHeadTransform";
import { clearHumanPersonHair } from "./clearHumanPersonHair";
import { meshOfHumanPart } from "./meshOfHumanPart";
import { moveHumanMeshRigidly } from "./moveHumanMeshRigidly";
import { stitchHumanPersonBoundary } from "./stitchHumanPersonBoundary";
import { resolveHumanPersonFaceBones } from "./resolveHumanPersonFaceBones";

/** The one connected skin surface of a basis: the surface that draws the skin material. */
const skinSurfaceOf = <
  T extends { id: string; regions: { id: string; material: string }[] },
>(
  surfaces: T[],
): { index: number; surface: T } => {
  const index = surfaces.findIndex((surface) =>
    surface.regions.some(
      (region) => region.material === HUMAN_PERSON_SEAM.skinMaterial,
    ),
  );
  if (index < 0)
    throw new Error(
      "A basis needs a surface that draws the '" +
        HUMAN_PERSON_SEAM.skinMaterial +
        "' material.",
    );
  return { index, surface: surfaces[index] };
};

/**
 * Compile a face basis and a body basis into a builder of whole people.
 *
 * Both anatomies are evaluated by their own builders and then made one
 * person, in this order:
 *
 * 1. The body document takes its skin colour from the face
 *    (`deriveHumanPersonBody`) and both documents are evaluated.
 * 2. The face rides the body's head bone. Every face part except the skin is
 *    rigid with the bone (`createHumanPersonHeadTransform`); the face skin is
 *    skinned by weights read from the body's own collar (`createHumanPersonFaceSkin`)
 *    so its neck turns with the body's neck.
 * 3. Frozen source-edge stencils append the body's cut points after its own
 *    nonlinear posing. The collar follows the face's neck
 *    (`conformHumanPersonCollar`); the scalar cut retains lower portions of
 *    crossing triangles without exposing a staircase through original rows.
 * 4. Normals are computed over the joined clipped skin adjacency. Each
 *    render part reads its vertices through its region's corner table, then
 *    both boundaries are subdivided onto one union of their samples
 *    (`stitchHumanPersonBoundary`) with shared interpolated unit normals.
 * 5. Generated hair (the face parts no basis region draws) is kept off the
 *    posed body at the clearance the hair document asked of the head
 *    (`clearHumanPersonHair`).
 *
 * The seam's source loops are derived once from the neutral surfaces. Each
 * evaluation owns the posed Float32 boundary partition and may emit a
 * different subdivision; the result validates as a resident model. Parts and
 * materials carry a `face:` or `body:` prefix (the two bases each name their
 * skin `skin`). The joint is the two skins' shared polyline and emits no
 * zero-area ribbon part. Everything is metres in the shared Y-up, Z-forward
 * frame, posed.
 * The person builder owns no anatomy: it does not validate that the head is a
 * plausible size for the stature, that the face's neck matches the body's
 * measured neck girth; those are separate relations a person document does
 * not yet carry.
 *
 * @evidence contracts/common.md#principled-implementation The order follows data dependence: the colour must exist before the body is built, the skinned face before the collar can follow it, the conformed collar before the joined normals, and the normals before the parts are read back; each stage cites its owner for its own premises.
 * @evidence contracts/common.md#clear-and-simple-design An orchestrator that calls one named owner per stage and holds only the tables compiled once (the seam, the face weights, the region corner tables).
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Nothing is special-cased for a document or a basis revision; refusals name the actual causes, and the two anatomies' own builders admit their documents.
 * @evidence contracts/common.md#meaningful-documentation The comment gives the stage order, the naming rule, the frame and what the builder does not judge.
 * @evidence contracts/modeling.md#part-identity-and-grouping The person is a group of the two anatomies' parts; each keeps its owner's identity under a prefix, and the boundary subdivision does not introduce a third skin identity.
 * @evidence contracts/modeling.md#spatial-conventions One frame, metres, Y up, +Z forward, the frame both bases share; the conversion between the neutral frame and the shaped rest frame is the head transform's named shift.
 * @evidence contracts/modeling.md#shared-boundaries The face and body skin triangles use the same union of boundary samples and the same position and normal for each; the body's coarse chord is subdivided through the face's corners instead of joined by a degenerate ribbon.
 * @evidenceExclude contracts/modeling.md#parameter-channels The builder consumes no channel of its own; the two documents keep theirs.
 * @evidence contracts/modeling.md#emitted-geometry The person clips body triangles through frozen source-edge intersections and subdivides only triangles incident to the shared boundary; the boundary owner documents the centroid fan's population.
 * @evidenceExclude contracts/anatomy.md#anatomical-source The builder carries no anatomical value of its own.
 * @evidenceExclude contracts/anatomy.md#permitted-range The builder bounds no anatomical quantity; the two documents' ranges are their owners'.
 * @evidenceExclude contracts/anatomy.md#parametric-authority The builder consumes two documents of named inputs and adds none.
 */
export function createHumanPersonBuilder(props: {
  face: IAutoMovieHumanFaceBasis;
  body: IAutoMovieHumanBodyBasis;
  occlusion?: { rays: number; size: number };
}): (document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonBuild {
  const { face: faceBasis, body: bodyBasis } = props;
  const buildFace = createHumanFaceBasisBuilder(faceBasis, {
    occlusion: props.occlusion,
  });
  const buildBody = createHumanBodyBasisBuilder(bodyBasis);

  const faceSkin = skinSurfaceOf(faceBasis.surfaces);
  const bodySkin = skinSurfaceOf(bodyBasis.surfaces);
  const seam = createHumanPersonSeam({
    face: { basis: faceBasis.id, surface: faceSkin.surface },
    body: { basis: bodyBasis.id, surface: bodySkin.surface },
  });
  // the skin the mandible carries, whose lowest vertex ends the face's neck
  const jawVertices: number[] = [];
  const jaw = faceSkin.surface.attachments?.find((one) => one.owner === "jaw");
  for (let i = 0; jaw !== undefined && i < jaw.rows.length; i += 2)
    if (jaw.rows[i + 1] > HUMAN_PERSON_SEAM.jawShare) jawVertices.push(jaw.rows[i]);
  const faceCount = faceSkin.surface.positions.length / 3;
  const cut = seam.cut!;
  const bodyKept = cut.indices;
  const neutralBody = evaluateHumanPersonCut(bodySkin.surface.positions, cut);
  const ribbonGlobal = seam.ribbon.map((local) =>
    local < seam.faceLoop.length
      ? seam.faceLoop[local]
      : faceCount + seam.bodyLoop[local - seam.faceLoop.length],
  );
  const seamSeeds = [
    ...seam.faceLoop,
    ...seam.bodyLoop.map((vertex) => vertex + faceCount),
  ];
  const joinedIndices = [
    ...faceSkin.surface.indices,
    ...bodyKept.map((vertex) => vertex + faceCount),
    ...ribbonGlobal,
  ];
  const faceRegionIds = new Set(
    faceBasis.surfaces.flatMap((surface) =>
      surface.regions.map((region) => region.id),
    ),
  );
  const faceRegions = new Map(
    faceSkin.surface.regions.map((region) => [
      region.id,
      humanBasisRegionCorners(region).sources,
    ]),
  );
  const bodyRegions = new Map(
    bodySkin.surface.regions.map((region) => [
      region.id,
      humanBasisRegionCorners(humanBodyGpuRegion(region)).sources,
    ]),
  );
  const headLandmark = bodyBasis.landmarks.ids.indexOf("joint-head");
  const neutralHead = {
    x: bodyBasis.landmarks.positions[headLandmark * 3],
    y: bodyBasis.landmarks.positions[headLandmark * 3 + 1],
    z: bodyBasis.landmarks.positions[headLandmark * 3 + 2],
  };

  return (document) => {
    const body = buildBody(
      deriveHumanPersonBody({ document, faceMaterials: faceBasis.materials }),
    );
    const faceDocument = deriveHumanPersonFace(document);
    const face = buildFace(faceDocument);
    const bones = new Map(body.bones.map((one) => [one.bone, one]));
    const head = createHumanPersonHeadTransform({
      neutral: neutralHead,
      rest: bones.get("head")!.rest,
      posed: bones.get("head")!.posed,
    });

    // the face skin's shared vertices, read back from its render parts
    const raw = new Array<number>(faceCount * 3).fill(0);
    for (const part of face.parts) {
      const sources = faceRegions.get(part.id);
      if (sources === undefined) continue;
      const { positions } = meshOfHumanPart(part);
      sources.forEach((source, vertex) => {
        for (let axis = 0; axis < 3; axis++)
          raw[source * 3 + axis] = positions[vertex * 3 + axis];
      });
    }
    const faceWeights = createHumanPersonFaceSkin({
      seam,
      face: raw,
      body: neutralBody,
      bodySkin: bodySkin.surface.skin,
      jawVertices,
    });
    const facePosed = skinHumanBodySurface(
      raw.map((value, at) => value + [head.shift.x, head.shift.y, head.shift.z][at % 3]),
      faceWeights,
      bodyBasis.joints,
      bones,
    );
    const bodyBeforeCollar = evaluateHumanPersonCut(body.posedSurfaces[bodySkin.index].positions, cut);
    const bodyPosed = conformHumanPersonCollar({
      seam,
      face: facePosed,
      body: bodyBeforeCollar,
    });
    const normals = fairHumanSeamNormals({
      indices: joinedIndices,
      normals: areaWeightedNormals(
        [...facePosed, ...bodyPosed],
        joinedIndices,
      ),
      seeds: seamSeeds,
      rings: HUMAN_PERSON_SEAM.fairRings,
    });

    const read = (
      mesh: IAutoMovieMesh,
      sources: readonly number[],
      positions: readonly number[],
      offset: number,
    ): IAutoMovieMesh => {
      const out = { ...mesh, positions: mesh.positions.slice(), normals: [] as number[] };
      sources.forEach((source, vertex) => {
        for (let axis = 0; axis < 3; axis++) {
          out.positions[vertex * 3 + axis] = positions[source * 3 + axis];
          out.normals[vertex * 3 + axis] = normals[(source + offset) * 3 + axis];
        }
      });
      return out;
    };

    const placed = face.parts.map((part) => {
      const mesh = meshOfHumanPart(part);
      const sources = faceRegions.get(part.id);
      return {
        ...part,
        geometry: {
          type: "mesh" as const,
          mesh:
            sources === undefined
              ? moveHumanMeshRigidly(mesh, head)
              : stitchHumanPersonBoundary({
                  mesh: read(mesh, sources, facePosed, 0),
                  sources,
                  side: "face",
                  seam,
                  face: facePosed,
                  faceNormals: normals,
                }),
        },
      };
    });
    // generated hair: kept off the shoulders once the body has been posed
    clearHumanPersonHair({
      parts: placed,
      isGenerated: (id) => !faceRegionIds.has(id),
      layers: faceDocument.hair?.layers ?? [],
      positions: bodyPosed,
      indices: bodyKept,
    });
    const parts: IAutoMovieModel["parts"] = placed.map((part) =>
      prefixed("face", part, meshOfHumanPart(part)),
    );
    for (const part of body.model.parts) {
      const mesh = meshOfHumanPart(part);
      const sources = bodyRegions.get(part.id);
      if (sources === undefined) {
        parts.push(prefixed("body", part, mesh));
        continue;
      }
      const clipped = clipHumanPersonMesh(mesh, sources, cut);
      const retained = read(clipped.mesh, clipped.sources, bodyPosed, faceCount);
      parts.push(
        prefixed(
          "body",
          part,
          dropHumanMeshTriangles(
            stitchHumanPersonBoundary({
              mesh: retained,
              sources: clipped.sources,
              side: "body",
              seam,
              face: facePosed,
              faceNormals: normals,
              bodyBeforeCollar,
            }),
            () => false,
          ),
        ),
      );
    }

    // how far the two documents' necks disagreed: the most the body's own
    // collar had to move to lie on the face's
    let collarShift = 0;
    for (const vertex of seam.bodyLoop) {
      const own = bodyBeforeCollar;
      collarShift = Math.max(
        collarShift,
        Math.hypot(
          bodyPosed[vertex * 3] - own[vertex * 3],
          bodyPosed[vertex * 3 + 1] - own[vertex * 3 + 1],
          bodyPosed[vertex * 3 + 2] - own[vertex * 3 + 2],
        ),
      );
    }

    const model: IAutoMovieModel = {
      id: document.id,
      name: document.name,
      origin: "imported",
      parts,
      materials: [
        ...face.materials.map((material) => ({
          ...material,
          id: "face:" + material.id,
        })),
        ...body.model.materials.map((material) => ({
          ...material,
          id: "body:" + material.id,
        })),
      ],
      skeleton: null,
      body: null,
      asset: null,
    };
    const validation = validateModel({ model });
    if (!validation.success)
      throw new Error(
        "The evaluated person is not a valid resident model: " +
          JSON.stringify(validation),
      );
    return {
      model,
      body,
      bones: [
        ...body.bones,
        ...resolveHumanPersonFaceBones({
          basis: faceBasis,
          document: faceDocument,
          head,
        }),
      ],
      seam: {
        ribbonTriangles: 0,
        collarShiftMetres: collarShift,
      },
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
