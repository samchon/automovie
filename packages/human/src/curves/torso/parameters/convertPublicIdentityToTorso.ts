import {
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieHumanCurveSpecimen } from "../../IAutoMovieHumanCurveSpecimen";
import type { ITorsoMeasurements as T } from "../family/ITorsoMeasurements";
import { TorsoCurveFactory } from "../family/TorsoCurveFactory";
import type { IAutoMovieTorsoIdentity64 as I } from "./IAutoMovieTorsoIdentity64";
import { fitAutoMovieTorsoGirth64 } from "./fitAutoMovieTorsoGirth64";
import { generateAutoMovieTorsoSections64 } from "./generateAutoMovieTorsoSections64";
import { generateAutoMovieTorsoUpper64 } from "./generateAutoMovieTorsoUpper64";
import { resolveAutoMovieTorsoIndependent64 } from "./resolveAutoMovieTorsoIndependent64";

/** Convert one public specimen and explicit physical supplements into the common dimensional torso factory. The existing skeleton supplies gauges; the real face-owned world neck operator supplies the sole upstream boundary. This function performs finite girth lowering but does not construct world curves until the returned factory runs. New convention-derived bodies require separate appearance verification. Throws on unsupported dimensions, lowering failure or a mismatched neck namespace. */
export function convertPublicIdentityToTorso(props: {
  /** Already resolved public measurements, actual 55-bone skeleton and shared parent frames. */
  specimen: IAutoMovieHumanCurveSpecimen;

  /** Actual parent context used for world-to-spine conversion of the supplied neck. */
  context: Pick<
    AutoMovieCurveParentContext,
    "point" | "direction" | "inversePoint" | "inverseDirection"
  >;

  /** Actual face-owned world neck section and full longitudinal derivative; no inferred boundary substitute is accepted. */
  neck: C.Boundary;

  /** Optional named physical supplement overrides; omitted quantities receive disclosed engineering defaults. */
  additional?: Partial<I.Independent>;

  /** Optional canonical identity prefix, including any separator; the neck identity must match it exactly. */
  namespace?: string;
}): {
  /** Resolved internal physical/ratio input to the actual torso factory, without sampled source geometry. */
  parameters: T.Value;

  /** Physical supplement values, actual skeleton origin and explicit convention provenance. */
  resolved: I.Resolved;

  /** Actual torso constructor retaining these resolved dimensions and requiring the same real neck upstream. */
  factory: TorsoCurveFactory;

  /** Final-family sampled convex-tape observations, separate from continuous-curve approximation error. */
  girthFits: ReturnType<typeof fitAutoMovieTorsoGirth64>["observations"];
} {
  const resolved: I.Resolved = resolveAutoMovieTorsoIndependent64(
    props.specimen.measurements,
    props.specimen.skeleton,
    props.additional,
  );
  const profile: ReturnType<typeof generateAutoMovieTorsoSections64> =
    generateAutoMovieTorsoSections64(
      props.specimen.measurements,
      props.specimen.skeleton,
      resolved,
    );
  const upper: ReturnType<typeof generateAutoMovieTorsoUpper64> =
    generateAutoMovieTorsoUpper64({
      skeleton: props.specimen.skeleton,
      context: props.context,
      neck: props.neck,
      profile,
      resolved,
      suprasternaleHeightMm:
        props.specimen.measurements.identity.body.suprasternaleHeight,
    });
  const prefix: string = props.namespace ?? "";
  if (props.neck.id !== prefix + "neck.midTube")
    throw new Error("Actual current canonical mid-neck identity required");
  const {
    targetGirthMm,
    ...profileParameters
  }: ReturnType<typeof generateAutoMovieTorsoSections64> = profile;
  const parameters: T.Value = {
    ...profileParameters,
    ...upper,
    bones: { root: "spine", left: "leftUpperArm", right: "rightUpperArm" },
    boundaryIds: {
      neck: props.neck.id,
      waist: prefix + "waist.midTube",
      left: prefix + "left.upperArm.midTube",
      right: prefix + "right.upperArm.midTube",
    },
  };
  const rebuild: (powers: Readonly<Record<string, number>>) => T.Value = (
    powers: Readonly<Record<string, number>>,
  ): T.Value => {
    const {
      targetGirthMm: unused,
      ...shape
    }: ReturnType<typeof generateAutoMovieTorsoSections64> =
      generateAutoMovieTorsoSections64(
        props.specimen.measurements,
        props.specimen.skeleton,
        resolved,
        powers,
      );
    return { ...parameters, ...shape };
  };
  const fitted: ReturnType<typeof fitAutoMovieTorsoGirth64> =
    fitAutoMovieTorsoGirth64(rebuild, targetGirthMm);
  return {
    parameters: fitted.parameters,
    resolved,
    factory: new TorsoCurveFactory(fitted.parameters),
    girthFits: fitted.observations,
  };
}
