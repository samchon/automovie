import { validateModel } from "@automovie/engine";
import type { IAutoMovieModel } from "@automovie/interface";

import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import { createPortraitCheekLayer } from "../anatomy/cheek/createPortraitCheekLayer";
import { createPortraitDentalComponent } from "../anatomy/dental/createPortraitDentalComponent";
import { buildPortraitEars } from "../anatomy/cranium/buildPortraitEars";
import { createPortraitEyeComponent } from "../anatomy/eye/createPortraitEyeComponent";
import { createPortraitFacePerformanceComponent } from "../anatomy/cranium/createPortraitFacePerformanceComponent";
import { buildPortraitHairGroom } from "../anatomy/hair/buildPortraitHairGroom";
import { buildPortraitHead } from "../anatomy/cranium/buildPortraitHead";
import { createPortraitJawContinuation } from "../anatomy/mouth/createPortraitJawContinuation";
import { createPortraitMandibularDentition } from "../anatomy/dental/createPortraitMandibularDentition";
import { createPortraitMouthComponent } from "../anatomy/mouth/createPortraitMouthComponent";
import { createPortraitNoseComponent } from "../anatomy/nose/createPortraitNoseComponent";
import { createPortraitOrbitalSupport } from "../anatomy/eye/createPortraitOrbitalSupport";
import { createPortraitSkinLayer } from "../anatomy/skin/createPortraitSkinLayer";
import { createPortraitSkinColour } from "../anatomy/skin/createPortraitSkinColour";
import { createPortraitTongueComponent } from "../anatomy/tongue/createPortraitTongueComponent";
import { createMetricMeshPart } from "../mesh/createMetricMeshPart";
import { createPortraitReliefCurveLayer } from "../anatomy/skin/createPortraitReliefCurveLayer";
import { createPortraitReliefLayer } from "../anatomy/skin/createPortraitReliefLayer";
import { resolveHumanFaceDocument } from "../document/resolveHumanFaceDocument";

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
 */
export function buildHumanFace(
  document: IAutoMovieHumanFaceDocument,
  subdivisionRounds = 2,
): IAutoMovieModel {
  const face = resolveHumanFaceDocument(document);
  const { host, bindings, recipe, expression, observation } = face;
  const { parts: hair, materials } = buildPortraitHairGroom({
    hair: recipe.hair,
    layers: recipe.hairLayers,
    materials: face.materials,
  });
  const makeComponents = (expression: typeof face.expression) => [
    ...(["right", "left"] as const).map((side) =>
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
  const components = makeComponents(expression);
  const colour =
    recipe.skinColour === undefined || recipe.skinColour.length === 0
      ? undefined
      : createPortraitSkinColour(host, recipe.skinColour);
  const layers = [
    createPortraitSkinLayer(bindings, recipe.skin!, expression),
    ...(["right", "left"] as const).flatMap((side) =>
      face[side].cheek === undefined
        ? []
        : [createPortraitCheekLayer(bindings.cheeks![side], face[side].cheek!)],
    ),
    ...(recipe.orbits === undefined
      ? []
      : (["right", "left"] as const).map((side) =>
          createPortraitOrbitalSupport(side, recipe.orbits![side]),
        )),
    ...(recipe.relief ?? []).map((layer) =>
      createPortraitReliefLayer(layer.id, layer.regions),
    ),
    ...(recipe.curves ?? []).map((layer) =>
      createPortraitReliefCurveLayer(layer.id, layer.curves),
    ),
  ];
  const head = buildPortraitHead(host, components, subdivisionRounds, layers, {
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
  });
  const skin = createMetricMeshPart(
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
  const referenceSkin =
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
  const ears = (["right", "left"] as const).flatMap((side) => {
    const parts = buildPortraitEars(skin, face[side].ear, side);
    if (referenceSkin !== undefined) {
      const originals = buildPortraitEars(referenceSkin, face[side].ear, side);
      parts.forEach((part, index) => {
        const positions = originals[index].geometry.mesh.positions;
        part.geometry.mesh.colors = [];
        for (let i = 0; i < positions.length; i += 3)
          part.geometry.mesh.colors.push(
            ...colour!(positions.slice(i, i + 3).map((v) => v * 1000)),
          );
      });
    }
    return parts;
  });
  const model: IAutoMovieModel = {
    id: face.document.id,
    name: face.document.name,
    origin: "generated",
    parts: [...head.parts, ...hair, ...ears],
    materials: [
      ...materials,
      ...components.flatMap((component) => component.materials ?? []),
    ],
    skeleton: null,
    body: null,
    asset: null,
  };
  const validation = validateModel({ model });
  if (!validation.success)
    throw new Error(
      `The constructed face is not a valid resident model: ${JSON.stringify(validation)}.`,
    );
  return model;
}
