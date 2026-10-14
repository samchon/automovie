import type { IPortraitEyebrowProfile } from "../brow/IPortraitEyebrowProfile";



import type { IPortraitOcularTissueBoundary } from "./structures/IPortraitOcularTissueBoundary";
import type { IPortraitOcularTissueMeshes } from "./structures/IPortraitOcularTissueMeshes";
import type { IPortraitLowerLidSection } from "./structures/IPortraitLowerLidSection";
import type { IPortraitUpperLidSection } from "./structures/IPortraitUpperLidSection";

/**
 * Admit and detach numerical inputs before createPortraitEyeComponent fits a
 * host. Dimensions use construction millimetres, sampling values are counts,
 * and performance uses bounded closure fractions and degrees. Optical modes
 * are checked together before copying profiles and creating tissue samplers.
 * The returned shape/socket/performance belong to this component instance;
 * later caller edits cannot change its fit. Host topology and combined surface
 * feasibility belong to the fit/attachment consumers, after this local gate.
 */
import { assertPortraitEyebrowProfile } from "../brow/assertPortraitEyebrowProfile";
import { portraitEyebrowProfile } from "../brow/portraitEyebrowProfile";
import { assertPortraitEyelashProfile } from "../lash/assertPortraitEyelashProfile";
import { assertPortraitUpperLashCount } from "../lash/assertPortraitUpperLashCount";
import { assertPortraitEyePerformance } from "./assertPortraitEyePerformance";
import { createPortraitLowerLidProfile } from "./createPortraitLowerLidProfile";
import { createPortraitOcularTissues } from "./createPortraitOcularTissues";
import { createPortraitUpperLidProfile } from "./createPortraitUpperLidProfile";
import { type IPortraitEyePerformance } from "./structures/IPortraitEyePerformance";
import type { IPortraitEyeShape } from "./structures/IPortraitEyeShape";
import type { IPortraitEyeSocket } from "./structures/IPortraitEyeSocket";

/**
 * Own and validate one eye's numerical inputs before any host is fitted.
 * Optional profile samplers retain their own copied station populations.
 *
 * @evidence contracts/common.md#principled-implementation Compatible optical/attachment modes and finite dimensions admit one detached component input population before host fitting.
 * @evidence contracts/common.md#clear-and-simple-design Socket/shape/performance copies and canonical profile/fibre/tissue samplers expose each responsibility without duplicating their validation.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Local scalar admission does not establish host topology or combined surface feasibility; raw profile fields can remain borrowed while their consumed samplers own copies.
 * @evidence contracts/common.md#meaningful-documentation The prose states millimetres/counts/degrees, component-owned consumed inputs and downstream host/contact obligations.
 * @evidence contracts/performance.md#efficient-algorithms Copies and canonical profile admission scale with socket rows, witness counts and nested authoring records; all delegated validation is included.
 * @evidence contracts/performance.md#reuse-equivalent-work One admitted component population and compiled section/tissue samplers serve subsequent fit/attach/finish phases.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned component records and sampler closures own consumed snapshots until caller release; unconsumed optional raw profile fields retain their original references and no handle/task is acquired.
 */
export function resolvePortraitEyeInputs(
  inputSocket: IPortraitEyeSocket,
  inputShape: IPortraitEyeShape,
  inputPerformance?: IPortraitEyePerformance,
): { performance: IPortraitEyePerformance | undefined; socket: IPortraitEyeSocket; shape: IPortraitEyeShape & { browProfile: IPortraitEyebrowProfile }; tissues: ReturnType<typeof createPortraitOcularTissues> | undefined; lowerProfile: ReturnType<typeof createPortraitLowerLidProfile> | undefined; upperProfile: ReturnType<typeof createPortraitUpperLidProfile> | undefined; }  {
  const performance: IPortraitEyePerformance | undefined =
    inputPerformance === undefined ? undefined : { ...inputPerformance };
  if (
    (inputShape.opticalFrame !== undefined &&
      inputShape.opticalFrame !== "head-plane" &&
      inputShape.opticalFrame !== "radial") ||
    (inputShape.opticalFrame === "radial" &&
      (inputShape.cornealBoundary !== "limbus" ||
        inputShape.lidContact !== "cornea"))
  )
    throw new Error(
      "Radial optics require full limbus and corneal contact; the frame must be head-plane or radial.",
    );
  if (performance !== undefined) {
    assertPortraitEyePerformance(performance);
    if (
      inputShape.cornealBoundary !== "limbus" ||
      inputShape.lidContact !== "cornea"
    )
      throw new Error(
        "Eye performance requires a resident full-limbus optical surface and corneal contact.",
      );
  }
  if (
    inputShape.canthalSupport !== undefined &&
    (inputShape.canthalSupport !== "tangent" ||
      inputShape.sphereFit !== "observation-ray" ||
      inputShape.opticalFrame !== "radial")
  )
    throw new Error(
      "Tangent canthal support requires observation-ray fitting and radial optics.",
    );
  // A fitted component owns its inputs. Editing a preset for another instance
  // must not silently mutate an already constructed eye.
  const socket: IPortraitEyeSocket = {
    ...inputSocket,
    top: [...inputSocket.top],
    bottom: [...inputSocket.bottom],
    browTop: [...inputSocket.browTop],
    browBottom: [...inputSocket.browBottom],
  };
  const shape: IPortraitEyeShape & { browProfile: IPortraitEyebrowProfile } = {
    ...inputShape,
    sampling: { ...inputShape.sampling },
    upperLashProfile:
      inputShape.upperLashProfile === undefined
        ? undefined
        : { ...inputShape.upperLashProfile },
    browProfile: structuredClone(
      inputShape.browProfile ?? portraitEyebrowProfile,
    ),
    aegyoSal:
      inputShape.aegyoSal === undefined
        ? undefined
        : {
            ...inputShape.aegyoSal,
            weights:
              inputShape.aegyoSal.weights === undefined
                ? undefined
                : [...inputShape.aegyoSal.weights],
          },
    tissues:
      inputShape.tissues === undefined ? undefined : { ...inputShape.tissues },
  };
  // Build/validate once and retain the copied dimensions through fitting. Both
  // visible tissue surfaces will consume this eye's final refined boundary.
  const tissues: ((boundary: IPortraitOcularTissueBoundary) => IPortraitOcularTissueMeshes) | undefined =
    shape.tissues === undefined
      ? undefined
      : createPortraitOcularTissues(shape.tissues);
  const lowerProfile: ((at: number) => IPortraitLowerLidSection) | undefined =
    inputShape.lowerLidProfile === undefined
      ? undefined
      : createPortraitLowerLidProfile(inputShape.lowerLidProfile);
  const upperProfile: ((at: number) => IPortraitUpperLidSection) | undefined =
    inputShape.upperLidProfile === undefined
      ? undefined
      : createPortraitUpperLidProfile(inputShape.upperLidProfile, performance);
  assertPortraitEyebrowProfile(shape.browProfile, shape.browFibres);
  if (shape.upperLashProfile !== undefined)
    assertPortraitEyelashProfile(shape.upperLashProfile);
  if (
    shape.aegyoSal !== undefined &&
    (![
      shape.aegyoSal.offset,
      shape.aegyoSal.projection,
      shape.aegyoSal.width,
      shape.aegyoSal.height,
      shape.aegyoSal.reach,
    ].every(Number.isFinite) ||
      shape.aegyoSal.offset <= 0 ||
      shape.aegyoSal.projection < 0 ||
      shape.aegyoSal.width <= 0 ||
      shape.aegyoSal.height <= 0 ||
      shape.aegyoSal.reach <= 0 ||
      (shape.aegyoSal.weights !== undefined &&
        (shape.aegyoSal.weights.length !== 7 ||
          shape.aegyoSal.weights.some(
            (weight: number): boolean  => !Number.isFinite(weight) || weight < 0 || weight > 1,
          ))))
  )
    throw new Error(
      "Aegyo-sal needs finite positive dimensions and seven bounded weights.",
    );
  if (shape.skinAttachment !== undefined && shape.skinAttachment !== "reserve")
    throw new Error("Eye skin attachment must be reserve or omitted.");
  if (
    shape.skinBridge !== undefined &&
    (shape.skinBridge !== "sampled" || shape.skinAttachment !== "reserve")
  )
    throw new Error("Sampled eye bridges require reserved skin attachment.");
  if (
    shape.lidContactReach !== undefined &&
    (!Number.isFinite(shape.lidContactReach) || shape.lidContactReach < 0)
  )
    throw new Error("Lid contact reach must be finite and nonnegative.");
  if (
    (shape.lidContact !== undefined &&
      shape.lidContact !== "globe" &&
      shape.lidContact !== "cornea") ||
    (shape.lidContact === "cornea" && shape.cornealBoundary !== "limbus")
  )
    throw new Error(
      "Corneal lid contact requires a full limbus; other contact modes must be globe or omitted.",
    );
  if (
    shape.cornealBoundary !== undefined &&
    shape.cornealBoundary !== "aperture" &&
    shape.cornealBoundary !== "limbus"
  )
    throw new Error(
      "Corneal boundary must be aperture or limbus when supplied.",
    );
  assertPortraitUpperLashCount(shape.upperLashes);
  const positive: number[] = [
    shape.widthScale,
    shape.openingScale,
    shape.irisRadius,
    shape.pupilRadius,
    shape.surfaceRadius,
    shape.cornealRadius,
    shape.cornealThickness,
    shape.cornealRimLift,
  ];
  const nonnegative: number[] = [
    shape.blendReach,
    shape.foldWidth,
    shape.foldDepth,
    shape.upperLidVolume,
    shape.lowerLidWidth,
    shape.lowerLidVolume,
    shape.lidThickness,
  ];
  const counts: number[] = Object.values(shape.sampling);
  if (
    positive.some((v: number): boolean  => !Number.isFinite(v) || v <= 0) ||
    nonnegative.some((v: number): boolean  => !Number.isFinite(v) || v < 0) ||
    counts.some((v: number): boolean  => !Number.isInteger(v) || v < 1) ||
    !Number.isFinite(shape.socketLift) ||
    (shape.globeLift !== undefined && !Number.isFinite(shape.globeLift)) ||
    (shape.sphereFit !== undefined &&
      shape.sphereFit !== "aperture-plane" &&
      shape.sphereFit !== "observation-ray") ||
    !Number.isFinite(shape.outerCornerLift) ||
    shape.pupilRadius >= shape.irisRadius ||
    shape.cornealRadius <= shape.irisRadius ||
    shape.cornealRadius > shape.surfaceRadius ||
    shape.cornealRimLift <= shape.cornealThickness + 0.055 ||
    shape.sampling.eyeColumns < 2 ||
    shape.sampling.irisColumns < 3
  )
    throw new Error(
      "Eye dimensions must be finite, with a positive aperture and pupil inside the iris.",
    );
  return { performance, socket, shape, tissues, lowerProfile, upperProfile };
}
