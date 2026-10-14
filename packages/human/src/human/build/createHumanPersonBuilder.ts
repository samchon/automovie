import { validateModel } from "@automovie/engine";
import { resolveAutoMovieMeshPhysicalVertices } from "@automovie/engine/math/resolveAutoMovieMeshPhysicalVertices";
import type {
  IAutoMovieMaterial,
  IAutoMovieMesh,
  IAutoMovieMeshPhysicalSource,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";

import { createHumanBodyBasisBuilder } from "../../body/basis/createHumanBodyBasisBuilder";
import { humanBodyGpuRegion } from "../../body/basis/humanBodyGpuRegion";
import { humanBasisRegionCorners } from "../../common/basis/humanBasisRegionCorners";
import { humanPhysicalSourceDomain } from "../../common/basis/humanPhysicalSourceDomain";
import { areaWeightedNormals } from "../../common/mesh/areaWeightedNormals";
import { placeHumanLocalModelPart } from "../../common/mesh/placeHumanLocalModelPart";
import { resolveHumanFaceAppearanceDocument } from "../../face/basis/resolveHumanFaceAppearanceDocument";
import { resolveHumanFaceHairLayers } from "../../face/basis/resolveHumanFaceHairLayers";
import { HUMAN_PERSON_SEAM } from "../constants/HUMAN_PERSON_SEAM";
import { deriveHumanPersonBody } from "../document/deriveHumanPersonBody";
import { deriveHumanPersonFace } from "../document/deriveHumanPersonFace";
import { createHumanPersonSeam } from "../seam/createHumanPersonSeam";
import { evaluateHumanPersonCut } from "../seam/evaluateHumanPersonCut";
import { fairHumanSeamNormals } from "../seam/fairHumanSeamNormals";
import { measureHumanBoundaryDisplacement } from "../seam/measureHumanBoundaryDisplacement";
import type { IAutoMovieHumanPersonBuild } from "../structures/IAutoMovieHumanPersonBuild";
import type { IAutoMovieHumanPersonBuilderProps } from "../structures/IAutoMovieHumanPersonBuilderProps";
import type { IAutoMovieHumanPersonDocument } from "../structures/IAutoMovieHumanPersonDocument";
import { clearHumanPersonHair } from "./clearHumanPersonHair";
import { composeHumanPersonUnderwearParts } from "./composeHumanPersonUnderwearParts";
import { createHumanPersonBodyRegionParts } from "./createHumanPersonBodyRegionParts";
import { createHumanPersonFaceBuilder } from "./createHumanPersonFaceBuilder";
import { createHumanPersonSourceNormals } from "./createHumanPersonSourceNormals";
import { createHumanPersonSourceSkin } from "./createHumanPersonSourceSkin";
import { dressHumanPersonBody } from "./dressHumanPersonBody";
import { findHumanPersonSkinSurface } from "./findHumanPersonSkinSurface";
import { humanPersonEyeCentre } from "./humanPersonEyeCentre";
import { meshOfHumanPart } from "./meshOfHumanPart";
import { moveHumanMeshRigidly } from "./moveHumanMeshRigidly";
import { placeHumanPersonMixedSourceMesh } from "./placeHumanPersonMixedSourceMesh";
import { prefixHumanPersonPart } from "./prefixHumanPersonPart";
import { resolveHumanPersonFaceBones } from "./resolveHumanPersonFaceBones";
import { stitchHumanPersonBoundary } from "./stitchHumanPersonBoundary";

/**
 * Compile a face basis and a body basis into a builder of whole people.
 *
 * Both anatomies are evaluated by their own builders and then made one person, in this order:
 *
 * 1. The body document takes its skin colour from the face (`deriveHumanPersonBody`) and both documents are evaluated.
 * 2. Rigid face points ride the body's head bone; registered generated skin/material seats subsequently read actual weighted skin coordinates. The face skin is skinned by weights read from the body's own collar (`createHumanPersonFaceSkin`) so its neck turns with the body's neck.
 * 3. Frozen source-edge stencils append the body's cut points after its own nonlinear posing. The collar follows the face's neck (`conformHumanPersonCollar`); the scalar cut retains lower portions of crossing triangles without exposing a staircase through original rows.
 * 4. Two source-partitioned skins evaluate one performed original-parent normal field through their canonical affine samples (`createHumanPersonSourceNormals`). A partial or incompatible source generation refuses; neither label alone nor neutral normals are reused. Fixed normalTransport cells instead transport the final mouthClose-zero ancestral field. That reference retains the same shape, other expression and body build and goes through the same final face skin/cut/collar owner. Legacy bases without either record retain joined-adjacency fairing. Each render part reads its vertices through its region's corner table, then both boundaries are subdivided onto one union of their samples (`stitchHumanPersonBoundary`) with shared interpolated unit normals. Actual registered skins rebind their admitted canonical IDs into one person-instance source domain. Partial correspondence and unregistered new physical cut/subdivision points refuse; metadata cannot disappear to recover a position-welded topology. Legacy absence stays absent.
 * 5. The current face producer's actual emitted hair parts are kept off the posed body at the clearance the hair document asked of the head (`clearHumanPersonHair`).
 *
 * The final person's garment reads the collar-conformed skin and common normals. Its source compiler and rest coverage are shared with the body's own garment, while the returned `body` keeps its independent before-collar result. Those two supported outputs are not one interchangeable skin.
 *
 * The seam's source loops are derived once from the neutral surfaces. Each evaluation owns the posed Float32 boundary partition and may emit a different subdivision; the result validates as a resident model. Parts and materials carry a `face:` or `body:` prefix (the two bases each name their skin `skin`). The joint is the two skins' shared polyline and emits no zero-area ribbon part. Everything is metres in the shared Y-up, Z-forward frame, posed.
 *
 * Source-bound cell populations may not be cut again without new lineage; their complete original-parent coverage is part of their compiled contract. The person builder owns no anatomy: it does not validate that the head is a plausible size for the stature, that the face's neck matches the body's measured neck girth; those are separate relations a person document does not yet carry. The compiled source dependencies must remain unchanged. Current GPU/pixel observation is separate from these static and geometric admission paths.
 *
 * @evidence contracts/common.md#principled-implementation Existing face/body producers feed one posed source cut/collar/normal field, then source-corner placement and common boundary subdivision retain declared lineage before body-hair contact and final garment composition.
 * @evidence contracts/common.md#clear-and-simple-design This legacy coordinator owns phase order and face/body namespacing; anatomy, source-skin evaluation, physical registration, seam subdivision and garment geometry stay with dedicated owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported registered skin layers/head fields and unowned strict seam points refuse; legacy normal fairing remains explicit, and static validity certifies neither clinical proportions nor observed rendering.
 * @evidence contracts/common.md#meaningful-documentation Prose specifies metre performed frame, source-generation alternatives, current/reference normal semantics, mixed-seat placement and distinct before-collar body output.
 * @evidence contracts/performance.md#efficient-algorithms Source maps/cut/seam compile once; each document pays actual anatomy builds, optional second reference face/skin, shared-normal work, region clipping/stitch searches, body-contact queries, garment clipping and full resident validation rather than only wrapper scans.
 * @evidence contracts/performance.md#reuse-equivalent-work Compiled source maps, neutral cut and body/face producers serve unchanged bases; current and mouthClose-zero geometry share the same skin owner but remain distinct evaluations, and final normals serve every region.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The builder retains compiled source/seam tables and owning anatomy closures until dropped; each result owns model/mesh outputs while temporary posed/reference/region buffers scale with that build and no coordinator task survives.
 */
export function createHumanPersonBuilder(
  props: IAutoMovieHumanPersonBuilderProps,
): (document: IAutoMovieHumanPersonDocument) => IAutoMovieHumanPersonBuild {
  const {
    face: faceBasis,
    body: bodyBasis,
  }: IAutoMovieHumanPersonBuilderProps = props;
  if (
    bodyBasis.surfaces.some(
      (
        surface: IAutoMovieHumanPersonBuilderProps["body"]["surfaces"][number],
      ): boolean => surface.layerThickness !== undefined,
    )
  )
    throw new Error(
      "Person skin layers require a shared source generation with actual final native incidence.",
    );
  const buildFace: ReturnType<typeof createHumanPersonFaceBuilder> =
    createHumanPersonFaceBuilder(faceBasis, props.occlusion);

  const faceSkin: {
    index: number;
    surface: IAutoMovieHumanPersonBuilderProps["face"]["surfaces"][number];
  } = findHumanPersonSkinSurface(faceBasis.surfaces);
  const bodySkin: {
    index: number;
    surface: IAutoMovieHumanPersonBuilderProps["body"]["surfaces"][number];
  } = findHumanPersonSkinSurface(bodyBasis.surfaces);
  const sourceNormals: ReturnType<typeof createHumanPersonSourceNormals> =
    createHumanPersonSourceNormals({
      face: faceSkin.surface,
      body: bodySkin.surface,
    });
  // The normal constructor has admitted the common geometric source packet.
  // Capture its identities now; physical incidence never reads normal islands.
  const physicalSource:
    | { generation: string; face: number[]; body: number[] }
    | undefined =
    sourceNormals === undefined
      ? undefined
      : {
          generation: faceSkin.surface.sourcePartition!.generation,
          face: faceSkin.surface.sourcePartition!.samples.slice(),
          body: bodySkin.surface.sourcePartition!.samples.slice(),
        };
  const buildBody: ReturnType<typeof createHumanBodyBasisBuilder> =
    createHumanBodyBasisBuilder(
      bodyBasis,
      physicalSource === undefined
        ? undefined
        : { physicalSource: "source-partition" },
    );
  // Source corner aliases separate shading incidence, not physical skin
  // topology. The seam reads one vertex per canonical sample; emitted parts
  // and the normal consumer retain every authored corner alias.
  const faceSamples: readonly number[] | undefined =
    faceSkin.surface.sourcePartition?.samples;
  const faceSampleVertices: Map<number, number> = new Map(
    faceSamples?.map((sample: number, vertex: number): [number, number] => [
      sample,
      vertex,
    ]),
  );
  const faceRepresentatives: Map<number, number> = new Map<number, number>();
  if (faceSamples !== undefined)
    for (const vertex of faceSkin.surface.indices) {
      const sample: number = faceSamples[vertex];
      if (!faceRepresentatives.has(sample))
        faceRepresentatives.set(sample, vertex);
    }
  const seam: ReturnType<typeof createHumanPersonSeam> = createHumanPersonSeam({
    face: {
      basis: faceBasis.id,
      surface:
        faceSamples === undefined
          ? faceSkin.surface
          : {
              ...faceSkin.surface,
              indices: faceSkin.surface.indices.map(
                (vertex: number): number =>
                  faceRepresentatives.get(faceSamples[vertex])!,
              ),
            },
    },
    body: { basis: bodyBasis.id, surface: bodySkin.surface },
  });
  // the skin the mandible carries, whose lowest vertex ends the face's neck
  const jawVertices: number[] = [];
  const jaw:
    | NonNullable<typeof faceSkin.surface.attachments>[number]
    | undefined = faceSkin.surface.attachments?.find(
    (one: NonNullable<typeof faceSkin.surface.attachments>[number]): boolean =>
      one.owner === "jaw",
  );
  for (let i: number = 0; jaw !== undefined && i < jaw.rows.length; i += 2)
    if (jaw.rows[i + 1] > HUMAN_PERSON_SEAM.jawShare)
      jawVertices.push(jaw.rows[i]);
  const faceCount: number = faceSkin.surface.positions.length / 3;
  const cut: NonNullable<typeof seam.cut> = seam.cut!;
  const bodyKept: number[] = cut.indices;
  const neutralBody: number[] = evaluateHumanPersonCut(
    bodySkin.surface.positions,
    cut,
  );
  const ribbonGlobal: number[] = seam.ribbon.map((local: number): number =>
    local < seam.faceLoop.length
      ? seam.faceLoop[local]
      : faceCount + seam.bodyLoop[local - seam.faceLoop.length],
  );
  const seamSeeds: number[] = [
    ...seam.faceLoop,
    ...seam.bodyLoop.map((vertex: number): number => vertex + faceCount),
  ];
  const joinedIndices: number[] = [
    ...faceSkin.surface.indices,
    ...bodyKept.map((vertex: number): number => vertex + faceCount),
    ...ribbonGlobal,
  ];
  const faceRegions: Map<string, readonly number[]> = new Map(
    faceSkin.surface.regions.map(
      (
        region: (typeof faceSkin.surface.regions)[number],
      ): [string, readonly number[]] => [
        region.id,
        humanBasisRegionCorners(region).sources,
      ],
    ),
  );
  const bodyRegions: Map<string, readonly number[]> = new Map(
    bodySkin.surface.regions.map(
      (
        region: (typeof bodySkin.surface.regions)[number],
      ): [string, readonly number[]] => [
        region.id,
        humanBasisRegionCorners(humanBodyGpuRegion(region)).sources,
      ],
    ),
  );
  const neutralAnchor: IAutoMovieVector3 = humanPersonEyeCentre(
    Object.fromEntries(
      bodyBasis.landmarks.ids.map(
        (id: string, at: number): [string, IAutoMovieVector3] => [
          id,
          {
            x: bodyBasis.landmarks.positions[at * 3],
            y: bodyBasis.landmarks.positions[at * 3 + 1],
            z: bodyBasis.landmarks.positions[at * 3 + 2],
          },
        ],
      ),
    ),
  );

  const evaluateSkin: ReturnType<typeof createHumanPersonSourceSkin> =
    createHumanPersonSourceSkin({
      faceCount,
      faceRegions,
      bodyBasis,
      bodySkin,
      seam,
      neutralBody,
      jawVertices,
      neutralAnchor,
    });

  return (
    document: IAutoMovieHumanPersonDocument,
  ): IAutoMovieHumanPersonBuild => {
    if (
      document.headShape !== undefined &&
      Object.keys(document.headShape).length !== 0
    )
      throw new Error(
        "Head numerical fields unavailable without shared source generation registration.",
      );
    const bodyDocument: ReturnType<typeof deriveHumanPersonBody> =
      deriveHumanPersonBody({
        document,
        faceMaterials: faceBasis.materials,
      });
    const preparedBody: ReturnType<typeof buildBody.prepare> =
      buildBody.prepare(bodyDocument);
    const body: ReturnType<typeof preparedBody.finish> = preparedBody.finish(
      undefined,
      undefined,
      "defer",
    );
    const faceDocument: ReturnType<typeof deriveHumanPersonFace> =
      deriveHumanPersonFace(document);
    const currentFace: ReturnType<typeof buildFace> = buildFace(faceDocument);
    const face: IAutoMovieModel = currentFace.model;
    const skin: ReturnType<typeof evaluateSkin> = evaluateSkin({ face, body });
    const {
      face: facePosed,
      body: bodyPosed,
      bodyBeforeCollar,
      head,
    }: ReturnType<typeof evaluateSkin> = skin;
    // Omission is zero at the face document owner. A source without this
    // expression channel must not receive an invented unsupported control.
    const referenceExpression: typeof faceDocument.expression = {
      ...faceDocument.expression,
    };
    delete referenceExpression.mouthClose;
    const reference: ReturnType<typeof evaluateSkin> | undefined =
      faceSkin.surface.sourcePartition?.normalTransport === undefined
        ? undefined
        : evaluateSkin({
            face: buildFace({
              ...faceDocument,
              expression: referenceExpression,
            }).model,
            body,
          });
    const normals: number[] =
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
            reference:
              reference === undefined
                ? undefined
                : {
                    generation: faceSkin.surface.sourcePartition!.generation,
                    face: reference.face,
                    body: reference.body,
                    bodyIndices: bodyKept,
                  },
          });

    const {
      body: dressedBody,
      garment,
    }: ReturnType<typeof dressHumanPersonBody> = dressHumanPersonBody({
      prepared: preparedBody,
      body,
    });
    const physicalDomain: string | undefined =
      physicalSource === undefined
        ? undefined
        : humanPhysicalSourceDomain(document.id, physicalSource.generation);
    const physicalBoundary: IAutoMovieMeshPhysicalSource[] | undefined =
      physicalSource === undefined
        ? undefined
        : seam.faceLoop.map(
            (source: number): IAutoMovieMeshPhysicalSource => ({
              domain: physicalDomain!,
              id: physicalSource.face[source],
            }),
          );

    const read: (
      mesh: IAutoMovieMesh,
      sources: readonly number[],
      positions: readonly number[],
      offset: number,
    ) => IAutoMovieMesh = (
      mesh: IAutoMovieMesh,
      sources: readonly number[],
      positions: readonly number[],
      offset: number,
    ): IAutoMovieMesh => {
      const out: IAutoMovieMesh & { normals: number[] } = {
        ...mesh,
        positions: mesh.positions.slice(),
        normals: [] as number[],
      };
      if (physicalSource === undefined) {
        if (mesh.physicalVertices !== undefined)
          throw new Error(
            "Person physical registration needs both compatible registered skin halves.",
          );
      } else {
        if (mesh.physicalVertices === undefined)
          throw new Error(
            "Person physical registration needs both actual registered skin halves.",
          );
        resolveAutoMovieMeshPhysicalVertices(mesh);
        const samples: number[] =
          offset === 0 ? physicalSource.face : physicalSource.body;
        const origin: string = humanPhysicalSourceDomain(
          offset === 0 ? faceDocument.id : bodyDocument.id,
          physicalSource.generation,
        );
        sources.forEach((source: number, vertex: number): void => {
          const reference: number | null =
            mesh.physicalVertices!.vertices[vertex];
          const actual: IAutoMovieMeshPhysicalSource | undefined =
            reference === null
              ? undefined
              : mesh.physicalVertices!.sources[reference];
          if (
            samples[source] === undefined ||
            actual === undefined ||
            actual.domain !== origin ||
            actual.id !== samples[source]
          )
            throw new Error(
              "Person physical registration needs the actual admitted canonical skin samples.",
            );
        });
        out.physicalVertices = {
          sources: mesh.physicalVertices.sources.map(
            (
              source: IAutoMovieMeshPhysicalSource,
            ): IAutoMovieMeshPhysicalSource => ({
              ...source,
              domain:
                source.domain === origin ? physicalDomain! : source.domain,
            }),
          ),
          vertices: mesh.physicalVertices.vertices.slice(),
        };
      }
      sources.forEach((source: number, vertex: number): void => {
        for (let axis: number = 0; axis < 3; axis++) {
          out.positions[vertex * 3 + axis] = positions[source * 3 + axis];
          out.normals[vertex * 3 + axis] =
            normals[(source + offset) * 3 + axis];
        }
      });
      return out;
    };

    const placed: IAutoMovieModel["parts"] = face.parts.map(
      (
        part: IAutoMovieModel["parts"][number],
      ): IAutoMovieModel["parts"][number] =>
        placeHumanLocalModelPart(
          part,
          (mesh: IAutoMovieMesh): IAutoMovieMesh => {
            const sources: readonly number[] | undefined = faceRegions.get(
              part.id,
            );
            return sources === undefined
              ? physicalSource === undefined
                ? moveHumanMeshRigidly(mesh, head)
                : placeHumanPersonMixedSourceMesh({
                    mesh,
                    head,
                    samples: faceSampleVertices,
                    positions: facePosed,
                    origin: humanPhysicalSourceDomain(
                      faceDocument.id,
                      physicalSource.generation,
                    ),
                    domain: physicalDomain!,
                    surface: faceSkin.surface.id,
                    materialAttachments: currentFace.materialAttachments,
                  })
              : stitchHumanPersonBoundary({
                  mesh: read(mesh, sources, facePosed, 0),
                  sources,
                  side: "face",
                  seam,
                  face: facePosed,
                  faceNormals: normals,
                  physicalBoundary,
                });
          },
        ),
    );
    // generated hair: kept off the shoulders once the body has been posed
    clearHumanPersonHair({
      parts: placed,
      isGenerated: (id: string): boolean => currentFace.hairPartIds.has(id),
      contactLayouts: currentFace.hairContactLayouts,
      layers: resolveHumanFaceHairLayers(
        faceBasis,
        resolveHumanFaceAppearanceDocument(faceBasis, faceDocument),
      ),
      positions: bodyPosed,
      indices: bodyKept,
    });
    const parts: IAutoMovieModel["parts"] = placed.map(
      (
        part: IAutoMovieModel["parts"][number],
      ): IAutoMovieModel["parts"][number] =>
        prefixHumanPersonPart("face", part, meshOfHumanPart(part)),
    );
    const bodyRegionParts: ReturnType<typeof createHumanPersonBodyRegionParts> =
      createHumanPersonBodyRegionParts({
        parts: dressedBody.model.parts,
        regions: bodyRegions,
        garment,
        surface: bodySkin.index,
        cut,
        place: (
          mesh: IAutoMovieMesh,
          sources: readonly number[],
        ): IAutoMovieMesh => read(mesh, sources, bodyPosed, faceCount),
        stitch: {
          seam,
          face: facePosed,
          faceNormals: normals,
          bodyBeforeCollar,
          physicalBoundary,
        },
      });
    parts.push(...bodyRegionParts.parts);

    // how far the two documents' necks disagreed: the most the body's own
    // collar had to move to lie on the face's
    const collarShift: number = measureHumanBoundaryDisplacement(
      seam.bodyLoop,
      bodyBeforeCollar,
      bodyPosed,
    );

    const renderedParts: IAutoMovieModel["parts"] =
      composeHumanPersonUnderwearParts({
        parts,
        garment,
        regions: bodyRegionParts.garmentFields,
      });
    const model: IAutoMovieModel = {
      id: document.id,
      name: document.name,
      origin: "imported",
      parts: renderedParts,
      materials: [
        ...face.materials.map(
          (material: IAutoMovieMaterial): IAutoMovieMaterial => ({
            ...material,
            id: "face:" + material.id,
          }),
        ),
        ...dressedBody.model.materials.map(
          (material: IAutoMovieMaterial): IAutoMovieMaterial => ({
            ...material,
            id: "body:" + material.id,
          }),
        ),
      ],
      skeleton: null,
      body: null,
      asset: null,
    };
    const validation: ReturnType<typeof validateModel> = validateModel({
      model,
    });
    if (!validation.success)
      throw new Error(
        "The evaluated person is not a valid resident model: " +
          JSON.stringify(validation),
      );
    return {
      model,
      body: preparedBody.wear(body),
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
