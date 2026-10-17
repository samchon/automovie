import type { IAutoMovieHumanCurveSpecimen } from "../../IAutoMovieHumanCurveSpecimen";
import type { IAutoMovieFaceMeasurements as M } from "../family/IAutoMovieFaceMeasurements";
import type { IFaceIndependentMeasurements as I } from "./IFaceIndependentMeasurements";

/** Build independent nasal and oral charts from current public clinical chords. Each orthogonal extent is sqrt(chord^2-projection^2); the actual nasion and stomion proxies anchor the charts. The 3D distance protocol follows https://www.facebase.org/resources/human/facial_norms/notes/. Profile/roll allocation and shared Hermite rounding values are authored family conventions, not additional observations or population constants.
 *
 * @param s Current resolved public features and actual named rest landmarks.
 * @param e Explicit nasal/oral projections, nostril dimensions and rotations.
 * @returns Native-mm semantic charts and dimensionless rounding coefficients.
 * @throws Error when a supplied projection leaves no positive orthogonal chord extent.
 * @author Samchon
 */
export function convertFaceNoseMouth(
  s: IAutoMovieHumanCurveSpecimen,
  e: I.Value,
): M.NoseMouth {
  const f: typeof s.measurements.identity.head.features =
    s.measurements.identity.head.features;
  const nasion: typeof s.skeleton.landmarks.nasion.position =
    s.skeleton.landmarks.nasion.position;
  const sto: typeof s.skeleton.landmarks.stomion.position =
    s.skeleton.landmarks.stomion.position;
  const project: (chord: number, depth: number, quantity: string) => number = (
    chord: number,
    depth: number,
    quantity: string,
  ): number => {
    if (Math.abs(depth) >= chord)
      throw new Error(
        quantity + " projection must leave a positive orthogonal extent",
      );
    return Math.sqrt(chord * chord - depth * depth);
  };
  const upper: number = project(
    f.upperVermilionHeight,
    e.oral.upperBorderProjectionMm,
    "Upper vermilion",
  );
  const lower: number = project(
    f.lowerVermilionHeight,
    e.oral.lowerBorderProjectionMm,
    "Lower vermilion",
  );
  const nasalHeight: number = project(
    f.noseHeight,
    e.nasal.rootRecessionMm,
    "Nasal height",
  );
  const tipDepth: number = project(
    f.noseProtrusion,
    e.nasal.tipRiseMm,
    "Nasal protrusion",
  );
  // Roll heights/depths (0.7,0.6,1.3), shoulder fractions, root half-width
  // 1/8 and nostril spacing 0.55 are common support recipes. They preserve
  // the explicit border chords but do not certify lip volume or nasal form.
  // Every rounding entry below multiplies a named physical span/difference;
  // values are shared family coefficients, not individual anatomical norms.
  return {
    oral: {
      origin: [sto.x, sto.y, sto.z],
      width: f.mouthWidth,
      cupidWidth: e.oral.philtrumBreadthMm,
      cornerRise: 0,
      cornerDepth: -e.oral.cornerRecessionMm,
      upperBorderRise: upper,
      upperBorderDepth: e.oral.upperBorderProjectionMm,
      cupidRise: upper / 8,
      cupidDepth: e.oral.upperBorderProjectionMm,
      lowerBorderDrop: lower,
      lowerBorderDepth: e.oral.lowerBorderProjectionMm,
      upperRollRise: upper * 0.7,
      upperRollDepth: e.oral.upperBorderProjectionMm * 1.3,
      lowerRollRise: -lower * 0.6,
      lowerRollDepth: e.oral.lowerBorderProjectionMm * 1.3,
      rollShoulderX: f.mouthWidth / 3,
      upperRollShoulderRise: -upper / 4,
      lowerRollShoulderRise: lower / 8,
      upperRollShoulderDepth: 0,
      lowerRollShoulderDepth: 0,
      upperLateralRise: upper / 2,
      upperLateralDepth: 0,
    },
    nasal: {
      origin: [
        nasion.x,
        nasion.y - nasalHeight,
        nasion.z + e.nasal.rootRecessionMm,
      ],
      rootRise: nasalHeight,
      rootDepth: -e.nasal.rootRecessionMm,
      tipRise: e.nasal.tipRiseMm,
      tipDepth,
      width: f.noseWidth,
      alarDrop: e.nasal.tipRiseMm / 2,
      alarDepth: 0,
      alarShoulderRise: e.nasal.tipRiseMm / 3,
      alarShoulderDepth: tipDepth / 3,
      rootHalfWidth: f.noseWidth / 8,
      rootEdgeRecession: e.nasal.rootRecessionMm / 4,
      nostrilSpacing: f.noseWidth * 0.55,
      nostrilRise: e.nasal.tipRiseMm / 4,
      nostrilDepth: tipDepth / 4,
      nostrilRadiusU: e.nasal.nostrilBreadthMm / 2,
      nostrilRadiusV: e.nasal.nostrilHeightMm / 2,
      nostrilRecessionAngle: (e.nasal.nostrilRecessionDegrees * Math.PI) / 180,
      nostrilPlaneAngle: (e.nasal.nostrilPlaneDegrees * Math.PI) / 180,
    },
    rounding: {
      cornerTangentShare: 0.8,
      cornerRiseShare: 0.65,
      cupidTangentShare: 1.2,
      lowerMidTangentShare: 1.3,
      shoulderTangentShare: 1.25,
      shoulderDepthShare: 1,
      profileBorderTangentShare: 0.25,
      profileDepthShare: 0.9,
      profileRollTangentShare: 0.65,
      profileContactTangentShare: 0.1,
      nasalTipTangentShare: 0.28,
      dorsumShoulderHeight: 0.38,
      dorsumShoulderDepth: 0.65,
      dorsumRootTangent: 0.6,
      dorsumMidTangent: 0.65,
      dorsumDepthTangent: 0.8,
      columellaTangent: 1.2,
      alarShoulderWidth: 0.35,
      alarVerticalTangent: 0.29,
      alarDepthTangent: 0.225,
      alarShoulderTangent: 0.225,
      alarMedialDepthTangent: 0.129,
      alarBaseTangent: 0.323,
      alarBaseDrop: 0.0323,
      wallLateralTangent: 0.0645,
      wallVerticalTangent: 0.5,
      philtralNasalSpan: 0.6,
      philtralTangent: 0.65,
      lateralBorderSlopeShare: 0.7,
    },
  };
}
