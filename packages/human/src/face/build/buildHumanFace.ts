import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieMaterial as IAutoMovieMaterialImported,
  IAutoMovieMesh as IAutoMovieMeshImported,
  IAutoMovieModel,
  IAutoMovieModelPart as IAutoMovieModelPartImported,
  IAutoMovieValidation as IAutoMovieValidationImported,
} from "@automovie/interface";

import type {
  IPortraitComponent as IPortraitComponentImported,
  IPortraitSurfaceLayer as IPortraitSurfaceLayerImported,
} from "../../index";
import { createPortraitCheekLayer } from "../anatomy/cheek/createPortraitCheekLayer";
import { buildPortraitEars } from "../anatomy/cranium/buildPortraitEars";
import { buildPortraitHead } from "../anatomy/cranium/buildPortraitHead";
import { createPortraitFacePerformanceComponent } from "../anatomy/cranium/createPortraitFacePerformanceComponent";
import { createPortraitDentalComponent } from "../anatomy/dental/createPortraitDentalComponent";
import { createPortraitMandibularDentition } from "../anatomy/dental/createPortraitMandibularDentition";
import { createPortraitEyeComponent } from "../anatomy/eye/createPortraitEyeComponent";
import { buildPortraitHairGroom } from "../anatomy/hair/buildPortraitHairGroom";
import { createPortraitJawContinuation } from "../anatomy/mouth/createPortraitJawContinuation";
import { createPortraitMouthComponent } from "../anatomy/mouth/createPortraitMouthComponent";
import { resolvePortraitOralContact } from "../anatomy/mouth/resolvePortraitOralContact";
import { createPortraitNoseComponent } from "../anatomy/nose/createPortraitNoseComponent";
import { createPortraitSkinColour } from "../anatomy/skin/createPortraitSkinColour";
import { createPortraitSkinLayer } from "../anatomy/skin/createPortraitSkinLayer";
import { createPortraitTongueComponent } from "../anatomy/tongue/createPortraitTongueComponent";
import { resolveHumanFaceDocument } from "../document/resolveHumanFaceDocument";
import { createMetricMeshPart } from "../mesh/createMetricMeshPart";
import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";

/**
 * Construct one resident anatomical face from a standalone numerical document.
 * No photograph, detector, named-subject preset or mesh cache is consulted.
 * Identity parts fit the same immutable host, tissue performance shares their
 * attachments, the upper dental arch stays maxillary, and final geometry uses
 * metres. Sampling rounds are independent of identity and range from zero
 * through four; the default two rounds is the editor's full-shape preview.
 *
 * Model validation proves construction admission, not visual quality or
 * likeness. Static glTF precision/material admission and direct multi-view
 * review remain separate gates after this function returns.
 *
 * @evidence contracts/common.md#principled-implementation Resolved host/bindings assemble authored components and shared performed skin before metric publication. Optional neutral reference geometry supplies pigment correspondence; validateModel admits structure/materials, not clinical anatomy, every cross-part intersection or GPU appearance.
 * @evidence contracts/common.md#clear-and-simple-design Resolution owns scalar inheritance/side constraints, components own fitted geometry, the head owns shared refinement and this orchestrator owns final parts/materials/admission.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Existing default two/range zero-through-four subdivision belongs to the head sampler. Missing source is not replaced by photographs/presets/mocks; model failure refuses and separate static-export/visual gates remain unproven here.
 * @evidence contracts/common.md#meaningful-documentation Prose describes numerical replay, shared attachments, upper/mandibular dentition, metre output, sampling control and separate model/export/visual boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Work includes full resolution, actual component populations, head refinement growing with rounds, hair/ears, colour samples and model admission. Reference components/ears rebuild only when skin colour requires neutral correspondence.
 * @evidence contracts/performance.md#reuse-equivalent-work One resolved face supplies bindings/expressions; one component factory shares observed/performed formulas. Distinct neutral reference geometry is required rather than reusing changed performed coordinates.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The model owns returned arrays/materials; intermediate/reference populations are local. Sampling depth is bounded but source populations determine bytes; no GPU/worker/file handle or mesh cache is retained.
 */
export function buildHumanFace(
  document: IAutoMovieHumanFaceDocument,
  subdivisionRounds: number = 2,
): IAutoMovieModel {
  const face: ReturnType<typeof resolveHumanFaceDocument> =
    resolveHumanFaceDocument(document);
  const {
    host,
    bindings,
    recipe,
    expression,
    observation,
  }: ReturnType<typeof resolveHumanFaceDocument> = face;
  const { parts: hair, materials }: ReturnType<typeof buildPortraitHairGroom> =
    buildPortraitHairGroom({
      hair: recipe.hair,
      layers: recipe.hairLayers,
      materials: face.materials,
    });
  const makeComponents: (
    expression: typeof face.expression,
  ) => IPortraitComponentImported[] = (
    expression: typeof face.expression,
  ): IPortraitComponentImported[] => [
    ...(["right", "left"] as const).map(
      (side: "left" | "right"): IPortraitComponentImported =>
        createPortraitEyeComponent(bindings.eyes[side], face[side].eye, {
          blink: expression.blink[side],
          observedBlink: observation.blink[side],
          yaw: expression.gazeYaw[side] - observation.gazeYaw[side],
          pitch: expression.gazePitch[side] - observation.gazePitch[side],
        }),
    ),
    createPortraitNoseComponent(bindings.nose, recipe.nose),
    createPortraitMouthComponent(bindings.mouth, recipe.mouth, {
      lipPart: expression.lipPart,
      observedLipPart: observation.lipPart,
      jaw:
        bindings.jawHinge === undefined
          ? undefined
          : {
              hinge: bindings.jawHinge,
              observed: observation.jawOpen,
              current: expression.jawOpen,
            },
      smile: {
        right: expression.smile.right - observation.smile.right,
        left: expression.smile.left - observation.smile.left,
      },
      pucker: { current: expression.pucker, observed: observation.pucker },
    }),
    createPortraitFacePerformanceComponent(bindings, observation, expression),
    ...(recipe.tongue === undefined
      ? []
      : [
          createPortraitTongueComponent(
            {
              rightCorner: bindings.mouth.lower[0],
              leftCorner: bindings.mouth.lower[bindings.mouth.lower.length - 1],
              lowerLipMiddle:
                bindings.mouth.lower[
                  Math.floor(bindings.mouth.lower.length / 2)
                ],
            },
            recipe.tongue,
            bindings.jawHinge!,
            observation,
            expression,
          ),
        ]),
    ...(recipe.dentition === undefined
      ? []
      : [
          createPortraitDentalComponent(
            bindings.dentition!,
            recipe.dentition.row,
            recipe.dentition.placement,
            "observed-maxilla",
          ),
        ]),
    ...(recipe.lowerDentition === undefined
      ? []
      : [
          createPortraitMandibularDentition(
            {
              rightCorner: bindings.mouth.lower[0],
              leftCorner: bindings.mouth.lower[bindings.mouth.lower.length - 1],
              lowerLipMiddle:
                bindings.mouth.lower[
                  Math.floor(bindings.mouth.lower.length / 2)
                ],
            },
            recipe.lowerDentition.row,
            recipe.lowerDentition.placement,
            {
              hinge: bindings.jawHinge!,
              observed: observation.jawOpen,
              current: expression.jawOpen,
            },
          ),
        ]),
  ];
  const components: IPortraitComponentImported[] = makeComponents(expression);
  const colour: ((reference: readonly number[]) => number[]) | undefined =
    recipe.skinColour === undefined || recipe.skinColour.length === 0
      ? undefined
      : createPortraitSkinColour(host, recipe.skinColour);
  const layers: IPortraitSurfaceLayerImported[] = [
    createPortraitSkinLayer(bindings, recipe.skin!, expression),
    ...(["right", "left"] as const).flatMap(
      (side: "left" | "right"): IPortraitSurfaceLayerImported[] =>
        face[side].cheek === undefined
          ? []
          : [
              createPortraitCheekLayer(
                bindings.cheeks![side],
                face[side].cheek!,
              ),
            ],
    ),
  ];
  const head: ReturnType<typeof buildPortraitHead> = buildPortraitHead(
    host,
    components,
    subdivisionRounds,
    layers,
    {
      cranium: recipe.cranium,
      neck: recipe.neck,
      performance: createPortraitJawContinuation(
        host,
        bindings,
        observation,
        expression,
        recipe.neck!,
      ),
      appearance:
        colour === undefined
          ? undefined
          : {
              host,
              components: makeComponents(observation),
              performance: createPortraitJawContinuation(
                host,
                bindings,
                observation,
                observation,
                recipe.neck!,
              ),
              sample: colour,
            },
    },
  );
  const skin: IAutoMovieMeshImported = createMetricMeshPart(
    "temporal-attachment",
    {
      positions: head.refined.positions.flat(),
      indices: head.refined.indices,
      normals: null,
      uvs: null,
      skin: null,
    },
    "skin",
  ).geometry.mesh;
  const referenceSkin: IAutoMovieMeshImported | undefined =
    colour === undefined
      ? undefined
      : createMetricMeshPart(
          "reference-temporal-attachment",
          {
            positions: head.refined.reference!.flat(),
            indices: head.refined.indices,
            normals: null,
            uvs: null,
            skin: null,
          },
          "skin",
        ).geometry.mesh;
  const ears: (IAutoMovieModelPartImported & {
    geometry: { type: "mesh"; mesh: IAutoMovieMeshImported };
  })[] = (["right", "left"] as const).flatMap(
    (
      side: "left" | "right",
    ): (IAutoMovieModelPartImported & {
      geometry: { type: "mesh"; mesh: IAutoMovieMeshImported };
    })[] => {
      const parts: (IAutoMovieModelPartImported & {
        geometry: { type: "mesh"; mesh: IAutoMovieMeshImported };
      })[] = buildPortraitEars(skin, face[side].ear, side);
      if (referenceSkin !== undefined) {
        const originals: (IAutoMovieModelPartImported & {
          geometry: { type: "mesh"; mesh: IAutoMovieMeshImported };
        })[] = buildPortraitEars(referenceSkin, face[side].ear, side);
        parts.forEach(
          (
            part: IAutoMovieModelPartImported & {
              geometry: { type: "mesh"; mesh: IAutoMovieMeshImported };
            },
            index: number,
          ): void => {
            const positions: number[] =
              originals[index].geometry.mesh.positions;
            part.geometry.mesh.colors = [];
            for (let i: number = 0; i < positions.length; i += 3)
              part.geometry.mesh.colors.push(
                ...colour!(
                  positions
                    .slice(i, i + 3)
                    .map((v: number): number => v * 1000),
                ),
              );
          },
        );
      }
      return parts;
    },
  );
  const model: IAutoMovieModel = {
    id: face.document.id,
    name: face.document.name,
    origin: "generated",
    parts: [...resolvePortraitOralContact(head.parts), ...hair, ...ears],
    materials: [
      ...materials,
      ...components.flatMap(
        (component: IPortraitComponentImported): IAutoMovieMaterialImported[] =>
          component.materials ?? [],
      ),
    ],
    skeleton: null,
    body: null,
    asset: null,
  };
  const validation: IAutoMovieValidationImported = validateModel({ model });
  if (!validation.success)
    throw new Error(
      `The constructed face is not a valid resident model: ${JSON.stringify(validation)}.`,
    );
  return model;
}
