import {
  type AutoMovieCurveParentContext,
  type IAutoMovieCurve64 as C,
} from "@automovie/engine";

import type { IAutoMovieHumanMeasurements } from "../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton } from "../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieHumanCurveSupplement as S } from "../structures/IAutoMovieHumanCurveSupplement";
import type { IAutoMovieCurveRegion64 as R } from "./IAutoMovieCurveRegion64";
import { ArmIdentityCurveFactory } from "./arms/parameters/ArmIdentityCurveFactory";
import type { IFaceIndependentMeasurements as F } from "./face/parameters/IFaceIndependentMeasurements";
import { convertPublicIdentityToFace } from "./face/parameters/convertPublicIdentityToFace";
import type { IAutoMovieFootIdentityBridge64 as Foot } from "./feet/parameters/IAutoMovieFootIdentityBridge64";
import { createAutoMovieIdentityFootFactory64 } from "./feet/parameters/createAutoMovieIdentityFootFactory64";
import { HandIdentityCurveFactory } from "./hands/parameters/HandIdentityCurveFactory";
import { createAutoMovieLegIdentityFactory64 } from "./legs/parameters/createAutoMovieLegIdentityFactory64";
import { createAutoMoviePelvisPantsFactory64 } from "./pelvis/pants/createAutoMoviePelvisPantsFactory64";
import { createAutoMoviePelvisIdentityFactory64 } from "./pelvis/parameters/createAutoMoviePelvisIdentityFactory64";
import { resolveAutoMovieCurveParentFrames } from "./resolveAutoMovieCurveParentFrames";
import { convertPublicIdentityToTorso } from "./torso/parameters/convertPublicIdentityToTorso";

/** Lower named physical measurements through the real seven regional rules.
 * Resolved measurements and the existing skeleton are supplied by the Human
 * instance. This operation never rebuilds joints or reads a source catalogue.
 * Every factory consumes the installed generic parent context directly. This
 * epoch deliberately selects the external pelvis family; unsupported public
 * pelvis combinations produce design findings instead of invalidating a person.
 */
export function createAutoMovieHumanCurveFactories(props: {
  measurements: IAutoMovieHumanMeasurements;
  skeleton: IAutoMovieHumanSkeleton;
  detailed: S;
  pelvisRepresentation?: "external-r6b" | "pants-r6";
}): {
  frames: ReturnType<typeof resolveAutoMovieCurveParentFrames>;
  factories: R.Factory[];
} {
  if (
    props.pelvisRepresentation !== undefined &&
    props.pelvisRepresentation !== "external-r6b" &&
    props.pelvisRepresentation !== "pants-r6"
  )
    throw new Error("Unknown pelvis representation");
  const { measurements, skeleton, detailed }: typeof props = props;
  const frames: ReturnType<typeof resolveAutoMovieCurveParentFrames> =
    resolveAutoMovieCurveParentFrames(skeleton);
  const specimen: {
    measurements: IAutoMovieHumanMeasurements;
    skeleton: IAutoMovieHumanSkeleton;
    frames: typeof frames;
  } = { measurements, skeleton, frames };
  const neck: IAutoMovieHumanSkeleton.IJoint | undefined = skeleton.joints.find(
    (joint: IAutoMovieHumanSkeleton.IJoint): boolean => joint.bone === "neck",
  );
  if (!neck) throw new Error("Existing resolved skeleton lacks neck");
  const tubeLengthMm: number =
    skeleton.landmarks.menton.position.y -
    detailed.face.jaw.submentalDropMm -
    neck.position.y;
  if (!(tubeLengthMm > 0 && detailed.face.neck.circumferenceAtMidTubeMm > 0))
    throw new Error(
      "Measured mid-neck plane must lie inside the actual simple-tube domain",
    );
  const { eyeSupportAnteriorRadiusMm, ...faceFields }: S["face"] =
    detailed.face;
  const faceInput: F.Value = {
    qualification: "caller-supplied-unverified",
    ...faceFields,
    neck: {
      midPlaneFractionBelowChin: 0.5,
      circumferenceAtMidTubeMm: detailed.face.neck.circumferenceAtMidTubeMm,
      depthToBreadthRatio: detailed.face.neck.depthToBreadthRatio,
      upperRadiusFractionChange:
        detailed.face.neck.upperNeckCircumferenceMm /
          detailed.face.neck.circumferenceAtMidTubeMm -
        1,
    },
    // Only slot 2 generates this frozen family's eye-support anchor. Slots 0/1
    // are un-emitted ocular bookkeeping: repeat the active support dimension
    // solely to satisfy the immutable legacy tuple. No ocular shape is claimed.
    globeRadiiMm: [
      eyeSupportAnteriorRadiusMm,
      eyeSupportAnteriorRadiusMm,
      eyeSupportAnteriorRadiusMm,
    ],
  };
  const face: ReturnType<typeof convertPublicIdentityToFace> =
    convertPublicIdentityToFace(specimen, faceInput);
  const torso: R.Factory = {
    region: "chest-waist-shoulder",
    construct(
      context: AutoMovieCurveParentContext,
      upstream: ReadonlyMap<string, C.Boundary>,
    ): R.Result {
      const actualNeck: C.Boundary | undefined = upstream.get("neck.midTube");
      if (!actualNeck)
        throw new Error("Face-owned actual neck must be bound first");
      const lowering: ReturnType<typeof convertPublicIdentityToTorso> =
        convertPublicIdentityToTorso({
          specimen,
          context,
          neck: actualNeck,
          additional: {
            ...detailed.torso,
            pairedMassProjectionMm: [
              detailed.torso.pairedMassProjectionMm.left,
              detailed.torso.pairedMassProjectionMm.right,
            ],
            upperArmBreadthDepthRatio: [
              detailed.torso.upperArmBreadthDepthRatio.left,
              detailed.torso.upperArmBreadthDepthRatio.right,
            ],
            proximalUpperArmCircumferenceMm: [
              detailed.torso.proximalUpperArmCircumferenceMm.left,
              detailed.torso.proximalUpperArmCircumferenceMm.right,
            ],
          },
        });
      return lowering.factory.construct(context, upstream);
    },
  };
  const footInput: (value: S.Foot) => Foot.Independent = (
    value: S.Foot,
  ): Foot.Independent => {
    const { toes, ...scalars }: S.Foot = value;
    const digits: readonly S.Toe[] = [
      toes.hallux,
      toes.second,
      toes.third,
      toes.fourth,
      toes.fifth,
    ];
    const five: (key: keyof S.Toe) => Foot.Five = (
      key: keyof S.Toe,
    ): Foot.Five => [
      digits[0]![key],
      digits[1]![key],
      digits[2]![key],
      digits[3]![key],
      digits[4]![key],
    ];
    return {
      ...scalars,
      toeLengthMm: five("lengthMm"),
      toeBreadthMm: five("breadthMm"),
      toeThicknessMm: five("thicknessMm"),
      toeRootRetractionMm: five("rootRetractionMm"),
      toeSplayRad: five("splayRad"),
    };
  };
  const factories: R.Factory[] = [
    face.factory,
    new HandIdentityCurveFactory(measurements, skeleton, {
      palmThicknessMm: {
        left: detailed.hands.left.palmThicknessMm,
        right: detailed.hands.right.palmThicknessMm,
      },
    }),
    torso,
    props.pelvisRepresentation === "pants-r6"
      ? createAutoMoviePelvisPantsFactory64({
          measurements,
          skeleton,
          additional: detailed.pelvis,
        })
      : createAutoMoviePelvisIdentityFactory64({
          measurements,
          skeleton,
          additional: detailed.pelvis,
        }),
    createAutoMovieLegIdentityFactory64({
      measurements,
      skeleton,
      additional: detailed.legs,
    }),
    createAutoMovieIdentityFootFactory64({
      measurements,
      skeleton,
      additional: {
        left: footInput(detailed.feet.left),
        right: footInput(detailed.feet.right),
      },
    }),
    new ArmIdentityCurveFactory(specimen, detailed.arms),
  ];
  return { frames, factories };
}
