import type { IAutoMovieMaterial as IAutoMovieMaterialImported } from "@automovie/interface";

import type {
  IAutoMovieHumanFaceBindings as IAutoMovieHumanFaceBindingsImported,
  IPortraitCheekShape as IPortraitCheekShapeImported,
  IPortraitComponentHost as IPortraitComponentHostImported,
  IPortraitEarShape as IPortraitEarShapeImported,
  IPortraitEyeShape as IPortraitEyeShapeImported,
  IPortraitFacialFrameShape as IPortraitFacialFrameShapeImported,
  IPortraitHairLayer as IPortraitHairLayerImported,
} from "../../index";
import { portraitEyebrowProfile } from "../anatomy/brow/portraitEyebrowProfile";
import { createPortraitFacialFrame } from "../anatomy/cranium/createPortraitFacialFrame";
import { createPortraitMaterials } from "../anatomy/cranium/createPortraitMaterials";
import { portraitCranialChinHeight } from "../anatomy/cranium/portraitCranialChinHeight";
import { portraitFacialFrameWidthLimit } from "../anatomy/cranium/portraitFacialFrameWidthLimit";
import { resolvePortraitCraniumShape } from "../anatomy/cranium/resolvePortraitCraniumShape";
import { resolvePortraitFacialFrameShape } from "../anatomy/cranium/resolvePortraitFacialFrameShape";
import { resolvePortraitNeckShape } from "../anatomy/cranium/resolvePortraitNeckShape";
import { portraitEarSampling } from "../anatomy/ear/portraitEarSampling";
import { portraitEarShape } from "../anatomy/ear/portraitEarShape";
import type { IPortraitHairShape } from "../anatomy/hair/IPortraitHairShape";
import { resolvePortraitSkinShape } from "../anatomy/skin/resolvePortraitSkinShape";
import { assertPortraitTongueWithinArch } from "../anatomy/tongue/assertPortraitTongueWithinArch";
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
 *
 * @evidence contracts/common.md#principled-implementation An owned document resolves fixed defaults, source recipe, registered intermediate controls, detailed overrides and independent sides in order. Current source topology/view-ray and paired bindings are admitted before shared frame/profile owners apply geometry-dependent constraints; identity resolution remains distinct from component tessellation/model admission.
 * @evidence contracts/common.md#clear-and-simple-design Immutable-detail admission, setting composition, frame/profile defaults and expression resolution have separate owners; one final record supplies the standalone builder and editor readers with the same interpreted state.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts mediapipe-478/1 and 468 facial index support are the supported source topology; the 1e-5 ray-unit residual and observed blink 0.95 ceiling remain explicit capture conventions. Missing tongue/jaw/cheek/dental support refuses, with no asset/photo fitting or guessed hidden-eye neutral.
 * @evidence contracts/common.md#meaningful-documentation Prose gives precedence, immutable geometry arrays, observed/current distinction, empty nasal alternative removal and ownership; scalar resolution supplies no likeness or complete model validation.
 * @evidence contracts/performance.md#efficient-algorithms Deep document/recipe clones and recursively repeated inherited subtree copies dominate authored populations; frame fitting and eye-fit limits inspect actual source geometry, and tongue support pays its own finite sampled check. Editor profile reads therefore can resolve far more than one scalar path.
 * @evidence contracts/performance.md#reuse-equivalent-work One resolution supplies shared host/bindings/recipe and two side records; observed/current expressions use one rule. Mutable edited documents are resolved anew rather than cached by basis identity alone.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Returned document/host/bindings/profiles/materials are owned clones or owned resolver outputs; temporary frame/merge data are local and no renderer, file or worker resource is retained.
 */
export function resolveHumanFaceDocument(input: IAutoMovieHumanFaceDocument): {
  document: IAutoMovieHumanFaceDocument;
  host: IPortraitComponentHostImported;
  bindings: IAutoMovieHumanFaceBindingsImported;
  recipe: IAutoMovieHumanFaceRecipe;
  right: {
    eye: IPortraitEyeShapeImported;
    ear: IPortraitEarShapeImported;
    cheek: IPortraitCheekShapeImported | undefined;
  };
  left: {
    eye: IPortraitEyeShapeImported;
    ear: IPortraitEarShapeImported;
    cheek: IPortraitCheekShapeImported | undefined;
  };
  observation: Required<{
    blink?: { right: number; left: number } | undefined;
    browRaise?: { right: number; left: number } | undefined;
    smile?: { right: number; left: number } | undefined;
    jawOpen?: number | undefined;
    lipPart?: number | undefined;
    pucker?: number | undefined;
    tongueRaise?: number | undefined;
    tongueAdvance?: number | undefined;
    gazePitch?: { right: number; left: number } | undefined;
    gazeYaw?: { right: number; left: number } | undefined;
  }>;
  expression: Required<{
    blink?: { right: number; left: number } | undefined;
    browRaise?: { right: number; left: number } | undefined;
    smile?: { right: number; left: number } | undefined;
    jawOpen?: number | undefined;
    lipPart?: number | undefined;
    pucker?: number | undefined;
    tongueRaise?: number | undefined;
    tongueAdvance?: number | undefined;
    gazePitch?: { right: number; left: number } | undefined;
    gazeYaw?: { right: number; left: number } | undefined;
  }>;
  materials: readonly IAutoMovieMaterialImported[];
} {
  assertHumanFaceEditableDetail(input);
  const document: IAutoMovieHumanFaceDocument = structuredClone(input);
  if (document.basis.topology !== "mediapipe-478/1")
    throw new Error("Only the mediapipe-478/1 landmark topology is supported.");
  if (
    [document.id, document.name, document.basis.id].some(
      (value: string): boolean => value.trim().length === 0,
    )
  )
    throw new Error("Face and basis identities must be nonempty.");
  const {
    host: observationHost,
    bindings: originalBindings,
  }: IAutoMovieHumanFaceDocument["basis"] = document.basis;
  let host: IPortraitComponentHostImported = observationHost;
  const bindings: IAutoMovieHumanFaceBindingsImported =
    structuredClone(originalBindings);
  // The captured rotation may have Float32 estimation error. Admit a 1e-5
  // unit-length residual without silently rewriting the recorded camera ray.
  if (
    host.positions.length !== 478 ||
    host.positions.some(
      (point: number[]): boolean =>
        point.length !== 3 || !point.every(Number.isFinite),
    ) ||
    host.indices.length === 0 ||
    host.indices.length % 3 !== 0 ||
    host.indices.some(
      (id: number): boolean => !Number.isInteger(id) || id < 0 || id >= 468,
    ) ||
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
  const frameBasis: Required<IPortraitFacialFrameShapeImported> =
    resolvePortraitFacialFrameShape(document.basis.recipe.frame);
  const frame: Required<IPortraitFacialFrameShapeImported> =
    resolvePortraitFacialFrameShape(
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
  const framed: ReturnType<typeof createPortraitFacialFrame> =
    createPortraitFacialFrame(host, frame, [
      bindings.eyes.right,
      bindings.eyes.left,
    ]);
  host = framed.host;
  if (bindings.jawHinge !== undefined) {
    const {
      x,
      y,
      z,
    }: NonNullable<
      IAutoMovieHumanFaceDocument["basis"]["bindings"]["jawHinge"]
    > = bindings.jawHinge;
    const mapped: number[] = framed.transform([x, y, z]);
    bindings.jawHinge = { x: mapped[0], y: mapped[1], z: mapped[2] };
  }
  const chinY: number = portraitCranialChinHeight(host.positions);
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
    neck: resolvePortraitNeckShape(chinY, document.basis.recipe.neck),
    ear: {
      ...(document.basis.recipe.ear ?? portraitEarShape),
      sampling: document.basis.recipe.ear?.sampling ?? {
        ...portraitEarSampling,
      },
    },
    cranium: resolvePortraitCraniumShape(chinY, document.basis.recipe.cranium),
  };
  const recipe: IAutoMovieHumanFaceRecipe =
    mergeHumanFaceSettings<IAutoMovieHumanFaceRecipe>(
      applyHumanFaceControls(baseline, chinY, document.controls),
      document.detail,
    );
  recipe.skin = resolvePortraitSkinShape(recipe.skin);
  if (recipe.hair !== undefined) recipe.hair = resolveHair(recipe.hair);
  if (recipe.hairLayers !== undefined)
    recipe.hairLayers = recipe.hairLayers.map(
      (
        layer: IPortraitHairLayerImported,
      ): { profile: IPortraitHairShape; id: string } => ({
        ...layer,
        profile: resolveHair(layer.profile),
      }),
    );
  const side: (name: "right" | "left") => {
    eye: IPortraitEyeShapeImported;
    ear: IPortraitEarShapeImported;
    cheek: IPortraitCheekShapeImported | undefined;
  } = (
    name: "right" | "left",
  ): {
    eye: IPortraitEyeShapeImported;
    ear: IPortraitEarShapeImported;
    cheek: IPortraitCheekShapeImported | undefined;
  } => ({
    eye: mergeHumanFaceSettings(recipe.eye, document.asymmetry?.[name]?.eye),
    ear: mergeHumanFaceSettings(recipe.ear!, document.asymmetry?.[name]?.ear),
    cheek: mergeHumanFaceSettings(
      recipe.cheek,
      document.asymmetry?.[name]?.cheek,
    ),
  });
  const right: {
      eye: IPortraitEyeShapeImported;
      ear: IPortraitEarShapeImported;
      cheek: IPortraitCheekShapeImported | undefined;
    } = side("right"),
    left: {
      eye: IPortraitEyeShapeImported;
      ear: IPortraitEarShapeImported;
      cheek: IPortraitCheekShapeImported | undefined;
    } = side("left");
  const widthLimit: number = portraitFacialFrameWidthLimit(
    observationHost,
    frame,
    [
      { socket: bindings.eyes.right, shape: right.eye },
      { socket: bindings.eyes.left, shape: left.eye },
    ],
  );
  if (frame.widthScale > widthLimit)
    throw new Error(
      `Facial-frame widthScale ${frame.widthScale} exceeds ${widthLimit.toFixed(3)}, the widest at which both eyes fit their sockets.`,
    );
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
  const observation: ReturnType<typeof resolveHumanFaceExpression> =
    resolveHumanFaceExpression(document.basis.expression);
  if (recipe.lowerDentition !== undefined && bindings.jawHinge === undefined)
    throw new Error("Mandibular dentition requires an explicit jaw hinge.");
  const expression: ReturnType<typeof resolveHumanFaceExpression> =
    resolveHumanFaceExpression(document.expression);
  if (recipe.tongue !== undefined && bindings.jawHinge === undefined)
    throw new Error("A tongue profile requires an explicit jaw hinge.");
  if (recipe.tongue !== undefined && recipe.lowerDentition !== undefined)
    assertPortraitTongueWithinArch(
      recipe.tongue,
      recipe.lowerDentition.row,
      recipe.lowerDentition.placement.recess,
    );
  if (
    recipe.tongue === undefined &&
    [
      observation.tongueRaise,
      observation.tongueAdvance,
      expression.tongueRaise,
      expression.tongueAdvance,
    ].some((v: number): boolean => v !== 0)
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
