import type { IAutoMovieHumanCurveSpecimen } from "../../IAutoMovieHumanCurveSpecimen";
import type { IAutoMovieFaceMeasurements as M } from "../family/IAutoMovieFaceMeasurements";
import type { IFaceIndependentMeasurements as I } from "./IFaceIndependentMeasurements";

/** Derive auricular chart scales and sparse cartilage supports from physical dimensions. Actual tragion proxies anchor both sides. Concha and cartilage proportions are explicit geometric conventions, not population fits. The posterior helix scale must not be called the clinical ear breadth: the endpoint protocol is different in https://doi.org/10.3346/jkms.2025.40.e107. This conversion establishes neither scalp clearance nor an ear cavity.
 *
 * @param s Current public bilateral ear lengths/protrusions and actual tragion positions.
 * @param e Explicit auricular scale, concha/lobule dimensions and yaw in mm/degrees.
 * @returns Native semantic auricular charts for the existing bow/phase-depth generator.
 * @author Samchon
 */
export function convertFaceEars(
  s: IAutoMovieHumanCurveSpecimen,
  e: I.Value,
): M.Ears {
  const ears: Partial<Record<M.Side, M.Ear>> = {};
  for (const side of ["left", "right"] as const) {
    const d: typeof s.measurements.identity.head.leftEar =
      s.measurements.identity.head[side === "left" ? "leftEar" : "rightEar"];
    const p: I.Ear = e.ears[side];
    const t: typeof s.skeleton.landmarks.left.tragion.position =
      s.skeleton.landmarks[side].tragion.position;
    // Half the supplied lobule length is reserved below the helix scale.
    // This and the sparse cartilage fractions below are shared geometric
    // proportions, not clinical ear-height or cartilage measurements.
    const h: number = d.earLength - p.lobuleLengthMm / 2;
    const w: number = p.helixBreadthScaleMm;
    const z: number = d.earProtrusion;
    const ratio: (u: number, v: number, n: number) => M.EarRatio = (
      u: number,
      v: number,
      n: number,
    ): M.EarRatio => ({
      posteriorRatio: u / w,
      heightRatio: v / h,
      depthRatio: n / z,
    });
    // Shared concha dimensions produce these named cartilage supports. Their
    // arrangement follows the anatomical branching, not a clinical landmark fit.
    const stemBase: M.EarRatio = ratio(0, -p.conchaLengthMm / 2, 0);
    const stemWaist: M.EarRatio = ratio(p.conchaBreadthMm / 3, 0, z / 4);
    const branch: M.EarRatio = ratio(
      p.conchaBreadthMm / 3,
      p.conchaLengthMm / 3,
      z / 4,
    );
    const superior: M.EarRatio = ratio(p.conchaBreadthMm / 2, h / 3, z / 3);
    const inferior: M.EarRatio = ratio(
      -p.conchaBreadthMm / 3,
      p.conchaLengthMm / 4,
      0,
    );
    const tragus: M.EarRatio = ratio(-p.conchaBreadthMm / 2, 0, 0);
    const notch: M.EarRatio = ratio(
      -p.conchaBreadthMm / 3,
      -p.conchaLengthMm / 2,
      -p.conchaDepthMm / 2,
    );
    const antitragus: M.EarRatio = ratio(
      p.conchaBreadthMm / 6,
      -p.conchaLengthMm / 2,
      z / 10,
    );
    const arc: (
      start: M.EarRatio,
      end: M.EarRatio,
      bow?: M.EarRatio,
    ) => M.EarArc = (
      start: M.EarRatio,
      end: M.EarRatio,
      bow: M.EarRatio = ratio(0, 0, z / 12),
    ): M.EarArc => ({ start, end, bow });
    const features: M.Ear["features"] = {
      "antihelix.stem": {
        arcs: [arc(stemBase, stemWaist), arc(stemWaist, branch)],
      },
      "antihelix.superiorCrus": { arcs: [arc(branch, superior)] },
      "antihelix.inferiorCrus": { arcs: [arc(branch, inferior)] },
      "concha.floorCourse": {
        arcs: [
          arc(
            ratio(0, -p.conchaLengthMm / 4, -p.conchaDepthMm / 2),
            ratio(p.conchaBreadthMm / 3, 0, -p.conchaDepthMm / 2),
            ratio(0, 0, -p.conchaDepthMm / 6),
          ),
        ],
      },
      "concha.divider": {
        arcs: [
          arc(
            ratio(-p.conchaBreadthMm / 4, p.conchaLengthMm / 4, 0),
            ratio(p.conchaBreadthMm / 4, 0, 0),
          ),
        ],
      },
      "tragus.visibleFold": { arcs: [arc(tragus, notch)] },
      "notch.visibleValley": {
        arcs: [
          arc(
            notch,
            antitragus,
            ratio(0, -p.conchaLengthMm / 12, -p.conchaDepthMm / 6),
          ),
        ],
      },
      "antitragus.crest": { arcs: [arc(antitragus, stemBase)] },
      "attachment.visiblePosteriorBlend": {
        arcs: [
          arc(ratio(0, h / 3, 0), ratio(0, h / 8, 0)),
          arc(ratio(0, h / 8, 0), ratio(0, -h / 8, 0)),
          arc(ratio(0, -h / 8, 0), ratio(0, -h / 3, 0)),
        ],
      },
    };
    // Conchal source arcs are normalized by their own dimensions. Convert those
    // named physical supports from the general auricle ratio chart once.
    for (const name of ["concha.floorCourse", "concha.divider"] as const)
      for (const a of features[name].arcs)
        for (const q of [a.start, a.end, a.bow]) {
          q.posteriorRatio *= w / p.conchaBreadthMm;
          q.heightRatio *= h / p.conchaLengthMm;
          q.depthRatio *= z / p.conchaDepthMm;
        }
    // Helix taper 0.15, lean 0.05, phases 2.4/-1 rad, the open concha
    // sweep -1.5*pi, lobular breadth/depth and insertion proportions are authored
    // family conventions. No source gate or primary survey supplies them.
    ears[side] = {
      originLocalMm: [t.x, t.y, t.z],
      rotationDeg: p.rotationDegrees,
      helixHeightMm: h,
      breadthMm: w,
      protrusionMm: z,
      inferiorTaperRatio: 0.15,
      crownLeanRatio: 0.05,
      helixStartPhase: 2.4,
      helixTailPhase: -1,
      helixDepthRatios: {
        anterior: 0.2,
        superior: 0.5,
        posterior: 0.2,
        tail: 0.1,
      },
      features,
      concha: {
        breadthMm: p.conchaBreadthMm,
        lengthMm: p.conchaLengthMm,
        centerPosteriorRatio: 0,
        centerHeightRatio: 0,
        inclinationDeg: 0,
        startPhase: 0,
        endPhase: -1.5 * Math.PI,
        depthRatios: {
          superior: -0.25,
          posterior: -0.5,
          inferior: -0.5,
          anterior: -0.25,
        },
        depthMm: p.conchaDepthMm,
      },
      lobule: {
        breadthMm: w * 0.6,
        lengthMm: p.lobuleLengthMm,
        depthRatio: 0.1,
      },
      earLengthMm: d.earLength,
      insertionLengthMm: d.earLength * 0.75,
      insertionBreadthMm: w / 3,
      insertionCenterLocalMm: [t.x, t.y, t.z],
    };
  }
  return {
    parentFrame: { originMm: [0, 0, 0] },
    ears: ears as Record<M.Side, M.Ear>,
  };
}
