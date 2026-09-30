import { portraitEyebrowProfile } from "../anatomy/brow/portraitEyebrowProfile";
import { createPortraitFacialFrame } from "../anatomy/cranium/createPortraitFacialFrame";
import { createPortraitMaterials } from "../anatomy/cranium/createPortraitMaterials";
import { portraitCranialChinHeight } from "../anatomy/cranium/portraitCranialChinHeight";
import { portraitNeckShape } from "../anatomy/cranium/portraitNeckShape";
import { resolvePortraitCraniumShape } from "../anatomy/cranium/resolvePortraitCraniumShape";
import { resolvePortraitFacialFrameShape } from "../anatomy/cranium/resolvePortraitFacialFrameShape";
import { portraitEarShape } from "../anatomy/ear/portraitEarShape";
import { portraitEarSampling } from "../anatomy/ear/portraitEarSampling";
import type { IPortraitHairShape } from "../anatomy/hair/IPortraitHairShape";
import { resolvePortraitSkinShape } from "../anatomy/skin/resolvePortraitSkinShape";
import type { IAutoMovieHumanFaceDocument } from "../structures/IAutoMovieHumanFaceDocument";
import type { IAutoMovieHumanFaceRecipe } from "../structures/IAutoMovieHumanFaceRecipe";
import { applyHumanFaceControls } from "./applyHumanFaceControls";
import { assertHumanFaceEditableDetail } from "./assertHumanFaceEditableDetail";
import { mergeHumanFaceSettings } from "./mergeHumanFaceSettings";
import { resolveHumanFaceExpression } from "./resolveHumanFaceExpression";

/**
 * Interpret identity independently of edit history: fixed defaults, basis,
 * intermediate traits, explicit detailed overrides, then independent sides.
 * Observed and current expressions remain separate resolved records. This
 * numerical stage does not fetch, fit a photo, tessellate or accept likeness.
 * Detail and side arrays cannot replace the basis's source geometry; this is
 * checked even when a caller bypasses JSON parsing and invokes replay directly.
 * An explicit empty-array switch of a final nasal alternative removes the
 * inherited payload; nonempty alternative geometry stays in the source basis.
 * Scalar fields within one alternative keep ordinary inheritance.
 */
export function resolveHumanFaceDocument(input: IAutoMovieHumanFaceDocument) {
  assertHumanFaceEditableDetail(input);
  const document = structuredClone(input);
  if (document.basis.topology !== "mediapipe-478/1")
    throw new Error("Only the mediapipe-478/1 landmark topology is supported.");
  if (
    [document.id, document.name, document.basis.id].some(
      (value) => value.trim().length === 0,
    )
  )
    throw new Error("Face and basis identities must be nonempty.");
  const { host: observationHost, bindings: originalBindings } = document.basis;
  let host = observationHost;
  const bindings = structuredClone(originalBindings);
  // The captured rotation may have Float32 estimation error. Admit a 1e-5
  // unit-length residual without silently rewriting the recorded camera ray.
  if (
    host.positions.length !== 478 ||
    host.positions.some(
      (point) => point.length !== 3 || !point.every(Number.isFinite),
    ) ||
    host.indices.length === 0 ||
    host.indices.length % 3 !== 0 ||
    host.indices.some((id) => !Number.isInteger(id) || id < 0 || id >= 468) ||
    host.viewRay.length !== 3 ||
    !host.viewRay.every(Number.isFinite) ||
    Math.abs(Math.hypot(...host.viewRay) - 1) > 1e-5
  )
    throw new Error(
      "The facial basis needs 478 finite XYZ samples, facial triangles and a unit viewing ray.",
    );
  if (
    bindings.eyes.right.name !== "right" ||
    bindings.eyes.left.name !== "left" ||
    (bindings.cheeks !== undefined &&
      (bindings.cheeks.right.side !== "right" ||
        bindings.cheeks.left.side !== "left"))
  )
    throw new Error(
      "Anatomical side bindings must agree with their explicit right/left owner.",
    );
  const frameBasis = resolvePortraitFacialFrameShape(
    document.basis.recipe.frame,
  );
  const frame = resolvePortraitFacialFrameShape(
    mergeHumanFaceSettings(
      {
        ...frameBasis,
        widthScale:
          frameBasis.widthScale * (1 + (document.controls?.faceWidth ?? 0)),
        lengthScale:
          frameBasis.lengthScale * (1 + (document.controls?.faceLength ?? 0)),
      },
      document.detail?.frame,
    ),
  );
  const framed = createPortraitFacialFrame(host, frame, [
    bindings.eyes.right,
    bindings.eyes.left,
  ]);
  host = framed.host;
  if (bindings.jawHinge !== undefined) {
    const { x, y, z } = bindings.jawHinge;
    const mapped = framed.transform([x, y, z]);
    bindings.jawHinge = { x: mapped[0], y: mapped[1], z: mapped[2] };
  }
  const chinY = portraitCranialChinHeight(host.positions);
  const baseline: IAutoMovieHumanFaceRecipe = {
    ...document.basis.recipe,
    frame: frameBasis,
    mouth: {
      ...document.basis.recipe.mouth,
      seamProjection:
        document.basis.recipe.mouth.seamProjection === undefined
          ? 0
          : document.basis.recipe.mouth.seamProjection,
    },
    eye: {
      ...document.basis.recipe.eye,
      globeLift:
        document.basis.recipe.eye.globeLift === undefined
          ? 0
          : document.basis.recipe.eye.globeLift,
      browProfile:
        document.basis.recipe.eye.browProfile ?? portraitEyebrowProfile,
    },
    neck: document.basis.recipe.neck ?? portraitNeckShape,
    ear: {
      ...(document.basis.recipe.ear ?? portraitEarShape),
      sampling: document.basis.recipe.ear?.sampling ?? {
        ...portraitEarSampling,
      },
    },
    cranium: resolvePortraitCraniumShape(chinY, document.basis.recipe.cranium),
  };
  const recipe = mergeHumanFaceSettings<IAutoMovieHumanFaceRecipe>(
    applyHumanFaceControls(baseline, chinY, document.controls),
    document.detail,
  );
  const nasalOverride = document.detail?.nose?.body?.shape;
  const nasalBasis = baseline.nose.body?.shape;
  if (nasalOverride !== undefined && nasalBasis !== undefined) {
    // A new alternative replaces the old shape's complete payload. Within the
    // same alternative, ordinary detailed-field inheritance still applies.
    // Ambiguous inputs remain ambiguous for geometry admission to refuse.
    const keys = ["stations", "section", "lobules"] as const;
    const incoming = keys.filter((key) => key in nasalOverride);
    const inherited = keys.filter((key) => key in nasalBasis);
    if (
      incoming.length === 1 &&
      inherited.length === 1 &&
      incoming[0] !== inherited[0]
    )
      recipe.nose.body!.shape = structuredClone(nasalOverride) as NonNullable<
        IAutoMovieHumanFaceRecipe["nose"]["body"]
      >["shape"];
  }
  recipe.skin = resolvePortraitSkinShape(recipe.skin);
  if (recipe.hair !== undefined) recipe.hair = resolveHair(recipe.hair);
  if (recipe.hairLayers !== undefined)
    recipe.hairLayers = recipe.hairLayers.map((layer) => ({
      ...layer,
      profile: resolveHair(layer.profile),
    }));
  const side = (name: "right" | "left") => ({
    eye: mergeHumanFaceSettings(recipe.eye, document.asymmetry?.[name]?.eye),
    ear: mergeHumanFaceSettings(recipe.ear!, document.asymmetry?.[name]?.ear),
    cheek: mergeHumanFaceSettings(
      recipe.cheek,
      document.asymmetry?.[name]?.cheek,
    ),
  });
  const right = side("right"),
    left = side("left");
  if (
    (right.cheek !== undefined || left.cheek !== undefined) &&
    bindings.cheeks === undefined
  )
    throw new Error(
      "Cheek profiles require explicit paired cheek attachments.",
    );
  if (
    recipe.dentition !== undefined &&
    (bindings.dentition === undefined || recipe.mouth.crowns.length !== 0)
  )
    throw new Error(
      "Separate dentition requires a maxillary binding and an empty lip-attached crown population.",
    );
  const observation = resolveHumanFaceExpression(document.basis.expression);
  if (recipe.lowerDentition !== undefined && bindings.jawHinge === undefined)
    throw new Error("Mandibular dentition requires an explicit jaw hinge.");
  const expression = resolveHumanFaceExpression(document.expression);
  if (recipe.tongue !== undefined && bindings.jawHinge === undefined)
    throw new Error("A tongue profile requires an explicit jaw hinge.");
  if (
    recipe.tongue === undefined &&
    [
      observation.tongueRaise,
      observation.tongueAdvance,
      expression.tongueRaise,
      expression.tongueAdvance,
    ].some((v) => v !== 0)
  )
    throw new Error("Tongue performance requires an explicit tongue profile.");
  if (observation.blink.right > 0.95 || observation.blink.left > 0.95)
    throw new Error(
      "A fully hidden observed eye cannot determine its neutral aperture.",
    );
  return {
    document,
    host,
    bindings,
    recipe,
    right,
    left,
    observation,
    expression,
    materials: structuredClone(
      document.appearance ?? createPortraitMaterials(),
    ),
  };
}

/** Defaults belong to each applied profile, never to an aliased authored object. */
function resolveHair(shape: IPortraitHairShape): IPortraitHairShape {
  return {
    ...shape,
    fibreNormalScale:
      shape.fibreNormalScale === undefined ? 0 : shape.fibreNormalScale,
    taperStart: shape.taperStart === undefined ? 0 : shape.taperStart,
    fibreShadeStrength:
      shape.fibreShadeStrength === undefined ? 1 : shape.fibreShadeStrength,
  };
}
