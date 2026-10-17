import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import type { IAutoMovieHumanCurveSpecimen } from "../../IAutoMovieHumanCurveSpecimen";
import { FaceCurveFactory } from "../family/FaceCurveFactory";
import type { IAutoMovieFaceMeasurements as M } from "../family/IAutoMovieFaceMeasurements";
import type { IFaceIndependentMeasurements as I } from "./IFaceIndependentMeasurements";
import { convertFaceEars } from "./convertFaceEars";
import { convertFaceEyes } from "./convertFaceEyes";
import { convertFaceHead } from "./convertFaceHead";
import { convertFaceNoseMouth } from "./convertFaceNoseMouth";

/** Admit the explicit missing dimensions and prepare one face/upper-neck factory. The caller supplies one current specimen rather than a second calibrated skeleton. No saved gate controls, source origins or mesh enter this conversion. The supplement is cloned; numeric validation and physical-Y ordering errors throw before a factory is returned. Provenance labels describe the inputs, not clinical accuracy, viewer acceptance or final surface quality.
 *
 * @param specimen Current admitted public identity, measurements and actual 55-bone rest frames.
 * @param supplement Explicit independent physical inputs with a provenance label.
 * @returns Semantic dimensions, internal skeleton-derived registration, the source-free factory, original shared frames and quantity-level provenance.
 * @throws Error for nonfinite/nonnumeric supplementary leaves, unsupported qualification, invalid extents or an unsupported ordered rest chart.
 * @author Samchon
 */
export function convertPublicIdentityToFace(
  specimen: IAutoMovieHumanCurveSpecimen,
  supplement: I.Value,
): {
  /** Resolved semantic physical inputs; they contain no emitted control catalogue. */
  parameters: M.Identity;

  /** Actual skeleton-derived native-to-neck rest registration, internal to construction. */
  registration: M.Registration;

  /** Factory bound to the resolved dimensions and registration, not a generated mesh. */
  factory: FaceCurveFactory;

  /** Original shared actual bone frames; this conversion does not create another skeleton. */
  frames: readonly C.Frame[];

  /** Quantity-level input attribution; these records do not certify clinical validity. */
  provenance: readonly {
    /** Physical quantity or derived group covered by this attribution. */
    quantity: string;

    /** Provenance category, separate from numerical or visual acceptance. */
    grade: string;

    /** Actual producing operation or caller responsible for the supplied values. */
    source: string;

    /** Known interpretation or validation gap retained for downstream consumers. */
    limitation: string;
  }[];
} {
  const p: I.Value = structuredClone(supplement);
  const finite: (value: unknown) => void = (value: unknown): void => {
    if (value !== null && typeof value === "object")
      Object.values(value).forEach(finite);
    else if (typeof value !== "number" || !Number.isFinite(value))
      throw new Error("Finite numeric supplementary measurement required");
  };
  const { qualification, ...physical }: I.Value = p;
  finite(physical);
  if (
    !["caller-supplied-unverified", "conventional-demonstration-v1"].includes(
      qualification,
    )
  )
    throw new Error(
      "Explicit supplementary measurement qualification required",
    );
  if (
    p.neck.midPlaneFractionBelowChin <= 0 ||
    p.neck.midPlaneFractionBelowChin >= 1 ||
    p.neck.circumferenceAtMidTubeMm <= 0 ||
    p.neck.depthToBreadthRatio <= 0 ||
    p.neck.upperRadiusFractionChange <= -1
  )
    throw new Error("Positive dimensional neck chart required");
  for (const length of [
    p.jaw.submentalDropMm,
    p.jaw.chinBreadthMm,
    p.jaw.prominenceHeightMm,
    p.jaw.sublabialHeightMm,
    p.nasal.nostrilBreadthMm,
    p.nasal.nostrilHeightMm,
    p.oral.philtrumBreadthMm,
    ...p.globeRadiiMm,
  ])
    if (length <= 0) throw new Error("Positive supplementary extent required");
  for (const side of ["left", "right"] as const)
    for (const length of [
      p.ears[side].helixBreadthScaleMm,
      p.ears[side].conchaLengthMm,
      p.ears[side].conchaBreadthMm,
      p.ears[side].conchaDepthMm,
      p.ears[side].lobuleLengthMm,
    ])
      if (length <= 0)
        throw new Error("Positive supplementary auricular extent required");
  if (specimen.skeleton.joints.length !== 55)
    throw new Error("Actual current 55-bone specimen required");
  const neck: (typeof specimen.skeleton.joints)[number] | undefined =
    specimen.skeleton.joints.find(
      (j: (typeof specimen.skeleton.joints)[number]): boolean =>
        j.bone === "neck",
    );
  const head: typeof neck = specimen.skeleton.joints.find(
    (j: (typeof specimen.skeleton.joints)[number]): boolean =>
      j.bone === "head",
  );
  if (!neck || !head || head.parent !== "neck")
    throw new Error("Actual head child of neck required");
  const noseMouth: M.NoseMouth = convertFaceNoseMouth(specimen, p);
  const parameters: M.Identity = {
    gate: "public-identity",
    scale: 1,
    head: convertFaceHead(specimen, p, noseMouth.nasal),
    noseMouth,
    eyes: convertFaceEyes(specimen, p),
    ears: convertFaceEars(specimen, p),
  };
  const lowerBorderY: number =
    noseMouth.oral.origin[1] - noseMouth.oral.lowerBorderDrop;
  if (
    parameters.head.dimensions.chinHeight + p.jaw.sublabialHeightMm >=
      lowerBorderY ||
    p.jaw.prominenceHeightMm >= p.jaw.sublabialHeightMm
  )
    throw new Error(
      "Inferior chin, prominence, sublabial and lower lip must have an ordered physical-Y chart",
    );
  const registration: M.Registration = {
    neckBone: "neck",
    headBone: "head",
    sourceOriginMm: [neck.position.x, neck.position.y, neck.position.z],
    sourceOriginInNeckMm: [0, 0, 0],
    sourceAxesInNeck: [
      [1, 0, 0],
      [0, 1, 0],
      [0, 0, 1],
    ],
    headOriginNativeMm: [head.position.x, head.position.y, head.position.z],
  };
  return {
    parameters,
    registration,
    factory: new FaceCurveFactory(parameters, registration),
    frames: specimen.frames,
    provenance: [
      {
        quantity:
          "Public clinical head/feature lengths and derived head breadth",
        grade: "current-public-measurements",
        source: "Existing Human resolved measurements and skeleton",
        limitation:
          "Statistical identity values are not per-person observed anatomy; clinical chords remain distinct from projected extents.",
      },
      {
        quantity: "Head, neck, ocular joints and craniofacial named landmarks",
        grade: "actual-maintained-derived-rest-placement",
        source: "shared specimen generateAutoMovieHumanSkeleton, 55 bones",
        limitation:
          "Existing landmark-placement assumptions remain; this is not independent clinical validation or source-mesh retargeting.",
      },
      {
        quantity:
          "Missing regional projections, folds, cartilage supports and mid-neck dimensions",
        grade: p.qualification,
        source: "Explicit caller supplement",
        limitation:
          "The named conventional helper is an unvalidated demonstration choice, not an approved anatomical default.",
      },
      {
        quantity:
          "Skull angular depth lanes, cartilage branching and family rounding",
        grade: "geometric-convention",
        source:
          "Shared analytic bridge rules and original dimensionless Hermite rounding convention",
        limitation:
          "No hundreds-row source calibration is copied; resulting form still needs the author's complete actual enlarged viewer inspection and correction round.",
      },
    ],
  };
}
