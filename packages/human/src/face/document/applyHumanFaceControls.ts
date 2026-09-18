import type { IAutoMovieHumanFaceControls } from "../structures/IAutoMovieHumanFaceControls";
import type { IAutoMovieHumanFaceRecipe } from "../structures/IAutoMovieHumanFaceRecipe";
import { portraitNeckShape } from "../anatomy/cranium/portraitNeckShape";
import { resolvePortraitCraniumShape } from "../anatomy/cranium/resolvePortraitCraniumShape";
import { portraitEarShape } from "../anatomy/ear/portraitEarShape";
import { resolvePortraitFacialFrameShape } from "../anatomy/cranium/resolvePortraitFacialFrameShape";
import { humanFaceControlDefinitions } from "../channels/humanFaceControlDefinitions";

/**
 * Apply intermediate offsets to a copied recipe before detailed overrides.
 * Unknown or out-of-envelope controls refuse rather than becoming inactive
 * sliders. Part builders subsequently validate the combined detailed result.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-controls-replacement Applies independent intermediate traits while preserving the original recipe.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-controls Enforces finite ranges and a fixed trait interpretation before detail replacement.
 */
export function applyHumanFaceControls(
  basis: IAutoMovieHumanFaceRecipe,
  chinY: number,
  controls: IAutoMovieHumanFaceControls = {},
): IAutoMovieHumanFaceRecipe {
  const recipe = structuredClone(basis);
  for (const [key, value] of Object.entries(controls)) {
    const definition = humanFaceControlDefinitions.find(
      (entry) => entry.id === key,
    );
    if (
      definition === undefined ||
      (value !== undefined &&
        (!Number.isFinite(value) ||
          value < definition.minimum ||
          value > definition.maximum))
    )
      throw new Error(`Invalid intermediate face control: ${key}.`);
  }
  recipe.eye.widthScale *= 1 + (controls.eyeWidth ?? 0);
  if (controls.faceWidth !== undefined || controls.faceLength !== undefined) {
    recipe.frame = resolvePortraitFacialFrameShape(recipe.frame);
    recipe.frame.widthScale! *= 1 + (controls.faceWidth ?? 0);
    recipe.frame.lengthScale! *= 1 + (controls.faceLength ?? 0);
  }
  recipe.eye.openingScale *= 1 + (controls.eyeHeight ?? 0);
  recipe.eye.outerCornerLift += controls.eyeTilt ?? 0;
  recipe.nose.widthScale *= 1 + (controls.noseWidth ?? 0);
  recipe.nose.tipProjection += controls.noseProjection ?? 0;
  recipe.mouth.widthScale *= 1 + (controls.mouthWidth ?? 0);
  recipe.mouth.upperLipProjection += controls.upperLipProjection ?? 0;
  recipe.mouth.lowerLipProjection += controls.lowerLipProjection ?? 0;
  if (
    controls.cheekProjection !== undefined &&
    controls.cheekProjection !== 0
  ) {
    if (recipe.cheek === undefined)
      throw new Error("Cheek projection requires a cheek profile.");
    recipe.cheek.malar.projection += controls.cheekProjection;
    recipe.cheek.medial.projection += controls.cheekProjection;
  }
  if (
    controls.craniumWidth !== undefined ||
    controls.craniumHeight !== undefined
  ) {
    const shape = resolvePortraitCraniumShape(chinY, recipe.cranium);
    recipe.cranium = {
      ...shape,
      stations: shape.stations.map((station) => ({
        ...station,
        width: station.width * (1 + (controls.craniumWidth ?? 0)),
        crown: station.crown + (controls.craniumHeight ?? 0),
      })),
    };
  }
  if (controls.earHeight !== undefined) {
    recipe.ear = structuredClone(recipe.ear ?? portraitEarShape);
    recipe.ear.heightScale *= 1 + controls.earHeight;
  }
  if (controls.neckWidth !== undefined) {
    recipe.neck = structuredClone(recipe.neck ?? portraitNeckShape);
    for (const section of [
      recipe.neck.upper,
      recipe.neck.lower,
      recipe.neck.crop,
    ])
      section.width *= 1 + controls.neckWidth;
  }
  return recipe;
}
