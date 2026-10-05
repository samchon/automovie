import { validateModel } from "@automovie/engine";
import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";

import { createHumanBodyBasisBuilder } from "../../body/basis/createHumanBodyBasisBuilder";
import { humanBodyGpuRegion } from "../../body/basis/humanBodyGpuRegion";
import { humanBasisRegionCorners } from "../../common/basis/humanBasisRegionCorners";
import { humanPhysicalSourceDomain } from "../../common/basis/humanPhysicalSourceDomain";
import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import type { IAutoMovieHumanPersonBuilderProps } from "../structures/IAutoMovieHumanPersonBuilderProps";
import { createHumanPersonFaceBuilder } from "./createHumanPersonFaceBuilder";
import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import { deriveHumanPersonBody } from "../document/deriveHumanPersonBody";
import { deriveHumanPersonFace } from "../document/deriveHumanPersonFace";
import { clipHumanPersonMesh } from "../seam/clipHumanPersonMesh";
import { createHumanPersonSeam } from "../seam/createHumanPersonSeam";
import { dropHumanMeshTriangles } from "../seam/dropHumanMeshTriangles";
import { evaluateHumanPersonCut } from "../seam/evaluateHumanPersonCut";
import { fairHumanSeamNormals } from "../seam/fairHumanSeamNormals";
import type { IAutoMovieHumanPersonBuild } from "../structures/IAutoMovieHumanPersonBuild";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import { clearHumanPersonHair } from "./clearHumanPersonHair";
import { createHumanPersonSourceNormals } from "./createHumanPersonSourceNormals";
import { createHumanPersonSourceSkin } from "./createHumanPersonSourceSkin";
import { findHumanPersonSkinSurface } from "./findHumanPersonSkinSurface";
import { humanPersonEyeCentre } from "./humanPersonEyeCentre";
import { meshOfHumanPart } from "./meshOfHumanPart";
import { moveHumanMeshRigidly } from "./moveHumanMeshRigidly";
import { prefixHumanPersonPart } from "./prefixHumanPersonPart";
import { resolveHumanPersonFaceBones } from "./resolveHumanPersonFaceBones";
import { stitchHumanPersonBoundary } from "./stitchHumanPersonBoundary";

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
 * 4. Two source-partitioned skins evaluate one performed original-parent
 *    normal field through their canonical affine samples
 *    (`createHumanPersonSourceNormals`). A partial or incompatible source
 *    generation refuses; neither label alone nor neutral normals are reused.
 *    Fixed normalTransport cells instead transport the final mouthClose-zero
 *    ancestral field. That reference retains the same shape, other expression
 *    and body build and goes through the same final face skin/cut/collar owner.
 *    Legacy bases without either record retain joined-adjacency fairing.
 *    Each render part reads its vertices through its region's corner table, then
 *    both boundaries are subdivided onto one union of their samples
 *    (`stitchHumanPersonBoundary`) with shared interpolated unit normals.
 *    Actual registered skins rebind their admitted canonical IDs into one
 *    person-instance source domain. Partial correspondence and unregistered
 *    new physical cut/subdivision points refuse; metadata cannot disappear
 *    to recover a position-welded topology. Legacy absence stays absent.
 * 5. The current face producer's actual emitted hair parts are kept off the
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
 * Source-bound cell populations may not be cut again without new lineage;
 * their complete original-parent coverage is part of their compiled contract.
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
export function createHumanPersonBuilder(
  props: IAutoMovieHumanPersonBuilderProps,
): (document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonBuild {
  const { face: faceBasis, body: bodyBasis } = props;
  const buildFace = createHumanPersonFaceBuilder(faceBasis, props.occlusion);

  const faceSkin = findHumanPersonSkinSurface(faceBasis.surfaces);
  const bodySkin = findHumanPersonSkinSurface(bodyBasis.surfaces);
  const sourceNormals = createHumanPersonSourceNormals({
    face: faceSkin.surface,
    body: bodySkin.surface,
  });
  // The normal constructor has admitted the common geometric source packet.
  // Capture its identities now; physical incidence never reads normal islands.
  const physicalSource = sourceNormals === undefined ? undefined : {
    generation: faceSkin.surface.sourcePartition!.generation,
    face: faceSkin.surface.sourcePartition!.samples.slice(),
    body: bodySkin.surface.sourcePartition!.samples.slice(),
  };
  const buildBody = createHumanBodyBasisBuilder(bodyBasis,
    physicalSource === undefined ? undefined : { physicalSource: "source-partition" });
  // Source corner aliases separate shading incidence, not physical skin
  // topology. The seam reads one vertex per canonical sample; emitted parts
  // and the normal consumer retain every authored corner alias.
  const faceSamples = faceSkin.surface.sourcePartition?.samples;
  const faceRepresentatives = new Map<number, number>();
  if (faceSamples !== undefined)
    for (const vertex of faceSkin.surface.indices) {
      const sample = faceSamples[vertex];
      if (!faceRepresentatives.has(sample)) faceRepresentatives.set(sample, vertex);
    }
  const seam = createHumanPersonSeam({
    face: { basis: faceBasis.id, surface: faceSamples === undefined ? faceSkin.surface : {
      ...faceSkin.surface,
      indices: faceSkin.surface.indices.map((vertex) => faceRepresentatives.get(faceSamples[vertex])!),
    } },
    body: { basis: bodyBasis.id, surface: bodySkin.surface },
  });
  // the skin the mandible carries, whose lowest vertex ends the face's neck
  const jawVertices: number[] = [];
  const jaw = faceSkin.surface.attachments?.find((one) => one.owner === "jaw");
  for (let i = 0; jaw !== undefined && i < jaw.rows.length; i += 2)
    if (jaw.rows[i + 1] > HUMAN_PERSON_SEAM.jawShare)
      jawVertices.push(jaw.rows[i]);
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
  const neutralAnchor = humanPersonEyeCentre(
    Object.fromEntries(bodyBasis.landmarks.ids.map((id, at) => [id, {
      x: bodyBasis.landmarks.positions[at * 3],
      y: bodyBasis.landmarks.positions[at * 3 + 1],
      z: bodyBasis.landmarks.positions[at * 3 + 2],
    }])),
  );

  const evaluateSkin = createHumanPersonSourceSkin({
    faceCount,
    faceRegions,
    bodyBasis,
    bodySkin,
    seam,
    neutralBody,
    jawVertices,
    neutralAnchor,
  });

  return (document) => {
    const bodyDocument = deriveHumanPersonBody({ document, faceMaterials: faceBasis.materials });
    const body = buildBody(bodyDocument);
    const faceDocument = deriveHumanPersonFace(document);
    const currentFace = buildFace(faceDocument);
    const face = currentFace.model;
    const skin = evaluateSkin({ face, body });
    const { face: facePosed, body: bodyPosed, bodyBeforeCollar, head } = skin;
    // Omission is zero at the face document owner. A source without this
    // expression channel must not receive an invented unsupported control.
    const referenceExpression = { ...faceDocument.expression };
    delete referenceExpression.mouthClose;
    const reference = faceSkin.surface.sourcePartition?.normalTransport === undefined
      ? undefined
      : evaluateSkin({
          face: buildFace({
            ...faceDocument,
            expression: referenceExpression,
          }).model,
          body,
        });
    const normals =
      sourceNormals === undefined
        ? fairHumanSeamNormals({
            indices: joinedIndices,
            normals: areaWeightedNormals(
              [...facePosed, ...bodyPosed],
              joinedIndices,
            ),
            seeds: seamSeeds,
            rings: HUMAN_PERSON_SEAM.fairRings,
          })
        : sourceNormals({
            face: facePosed,
            body: bodyPosed,
            bodyIndices: bodyKept,
            reference: reference === undefined ? undefined : {
              generation: faceSkin.surface.sourcePartition!.generation,
              face: reference.face,
              body: reference.body,
              bodyIndices: bodyKept,
            },
          });

    const physicalDomain = physicalSource === undefined ? undefined :
      humanPhysicalSourceDomain(document.id, physicalSource.generation);
    const physicalBoundary = physicalSource === undefined ? undefined :
      seam.faceLoop.map((source) => ({ domain: physicalDomain!, id: physicalSource.face[source] }));

    const read = (
      mesh: IAutoMovieMesh,
      sources: readonly number[],
      positions: readonly number[],
      offset: number,
    ): IAutoMovieMesh => {
      const out = {
        ...mesh,
        positions: mesh.positions.slice(),
        normals: [] as number[],
      };
      if (physicalSource === undefined) {
        if (mesh.physicalVertices !== undefined)
          throw new Error("Person physical registration needs both compatible registered skin halves.");
      } else {
        if (mesh.physicalVertices === undefined)
          throw new Error("Person physical registration needs both actual registered skin halves.");
        resolveAutoMovieMeshPhysicalVertices(mesh);
        const samples = offset === 0 ? physicalSource.face : physicalSource.body;
        const origin = humanPhysicalSourceDomain(
          offset === 0 ? faceDocument.id : bodyDocument.id,
          physicalSource.generation,
        );
        sources.forEach((source, vertex) => {
          const reference = mesh.physicalVertices!.vertices[vertex];
          const actual = reference === null ? undefined : mesh.physicalVertices!.sources[reference];
          if (samples[source] === undefined || actual === undefined ||
              actual.domain !== origin || actual.id !== samples[source])
            throw new Error("Person physical registration needs the actual admitted canonical skin samples.");
        });
        out.physicalVertices = {
          sources: mesh.physicalVertices.sources.map((source) => ({
            ...source,
            domain: source.domain === origin ? physicalDomain! : source.domain,
          })),
          vertices: mesh.physicalVertices.vertices.slice(),
        };
      }
      sources.forEach((source, vertex) => {
        for (let axis = 0; axis < 3; axis++) {
          out.positions[vertex * 3 + axis] = positions[source * 3 + axis];
          out.normals[vertex * 3 + axis] =
            normals[(source + offset) * 3 + axis];
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
                  physicalBoundary,
                }),
        },
      };
    });
    // generated hair: kept off the shoulders once the body has been posed
    clearHumanPersonHair({
      parts: placed,
      isGenerated: (id) => currentFace.hairPartIds.has(id),
      layers: faceDocument.hair?.layers ?? [],
      positions: bodyPosed,
      indices: bodyKept,
    });
    const parts: IAutoMovieModel["parts"] = placed.map((part) =>
      prefixHumanPersonPart("face", part, meshOfHumanPart(part)),
    );
    for (const part of body.model.parts) {
      const mesh = meshOfHumanPart(part);
      const sources = bodyRegions.get(part.id);
      if (sources === undefined) {
        parts.push(prefixHumanPersonPart("body", part, mesh));
        continue;
      }
      const clipped = clipHumanPersonMesh(mesh, sources, cut);
      const retained = read(
        clipped.mesh,
        clipped.sources,
        bodyPosed,
        faceCount,
      );
      parts.push(
        prefixHumanPersonPart(
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
              physicalBoundary,
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
