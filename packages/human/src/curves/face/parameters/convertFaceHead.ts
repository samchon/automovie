import type { IAutoMovieHumanCurveSpecimen } from "../../IAutoMovieHumanCurveSpecimen";
import { FaceMath as F } from "../family/FaceMath";
import type { IAutoMovieFaceMeasurements as M } from "../family/IAutoMovieFaceMeasurements";
import type { IFaceIndependentMeasurements as I } from "./IFaceIndependentMeasurements";

/** Resolve named head stations, jaw supports and a simple mid-neck tube. Current public lengths and actual skeleton proxies determine the physical chart; missing profile/depth allocation remains an explicit geometric convention. Clinical 3D endpoint distances do not certify intermediate support sections: https://www.facebase.org/resources/human/facial_norms/notes/. The supplied neck circumference refers to the generated mid-tube station, not implicitly to a clinical tape level. No skin limit or head circumference is fitted.
 *
 * @param s Current public identity, resolved head breadth and actual 55-bone rest skeleton.
 * @param e Independent jaw/neck dimensions; all lengths are mm and ratios dimensionless.
 * @param nasal Resolved nasal chart used to place the upper-mouth station.
 * @returns Semantic native head field and quadratic upper-neck Taylor coefficients.
 * @throws Error for missing neck/head relation, no positive collar interval, unordered stations or invalid jaw/profile extents.
 * @author Samchon
 */
export function convertFaceHead(
  s: IAutoMovieHumanCurveSpecimen,
  e: I.Value,
  nasal: M.Nasal,
): M.Head {
  const h: typeof s.measurements.identity.head = s.measurements.identity.head;
  const marks: typeof s.skeleton.landmarks = s.skeleton.landmarks;
  const neck: (typeof s.skeleton.joints)[number] | undefined =
    s.skeleton.joints.find(
      (j: (typeof s.skeleton.joints)[number]): boolean => j.bone === "neck",
    );
  const head: typeof neck = s.skeleton.joints.find(
    (j: (typeof s.skeleton.joints)[number]): boolean => j.bone === "head",
  );
  if (!neck || !head || head.parent !== "neck")
    throw new Error("Actual neck and head child required");
  const chinY: number = marks.menton.position.y;
  const upperY: number = chinY - e.jaw.submentalDropMm;
  if (neck.position.y >= upperY)
    throw new Error(
      "Current rest neck root must leave a positive simple tube below the submental transition",
    );
  // The station fraction is an explicit geometric placement. It does not
  // identify a clinical thyroid tape level or reconstruct a neck surface.
  const midY: number =
    upperY - e.neck.midPlaneFractionBelowChin * (upperY - neck.position.y);
  const offset: number = upperY - midY;
  const forwardSlope: number =
    (head.position.z - neck.position.z) / (head.position.y - neck.position.y);
  const midZ: number =
    neck.position.z + forwardSlope * (midY - neck.position.y);
  const ratio: number = e.neck.depthToBreadthRatio;
  const unit: F.Curve = F.hermite(
    "girth",
    [
      [0, 0, ratio],
      [1, 0, 0],
      [0, 0, -ratio],
      [-1, 0, 0],
    ],
    [
      [F.K, 0, 0],
      [0, 0, -F.K * ratio],
      [-F.K, 0, 0],
      [0, 0, F.K * ratio],
    ],
    true,
    1,
  );
  // Composite Simpson integrates the actual cubic speed. The dimensionless
  // integral scales exactly with the unknown common radius; no source fit.
  let perimeter: number = 0;
  const intervals: number = 1024;
  for (const span of unit.spans)
    for (let i: number = 0; i <= intervals; i++) {
      const t: number = i / intervals;
      const v: F.V = [0, 1, 2].map(
        (k: number): number =>
          3 *
          ((1 - t) ** 2 * (span[1][k]! - span[0][k]!) +
            2 * (1 - t) * t * (span[2][k]! - span[1][k]!) +
            t * t * (span[3][k]! - span[2][k]!)),
      ) as F.V;
      perimeter +=
        ((i === 0 || i === intervals ? 1 : i % 2 ? 4 : 2) * F.norm(v)) /
        (3 * intervals);
    }
  const rx: number = e.neck.circumferenceAtMidTubeMm / perimeter;
  const rz: number = rx * ratio;
  const origin: F.V = [head.position.x, head.position.y, head.position.z];
  const breadth: number = s.measurements.headBreadth;
  const depth: number = h.headLength;
  const normalized: (x: number, y: number, z: number) => F.V = (
    x: number,
    y: number,
    z: number,
  ): F.V => [
    (x - origin[0]) / breadth,
    (y - chinY) / h.headHeight,
    (z - origin[2]) / depth,
  ];
  const crownY: number = marks.vertex.position.y;
  const widestY: number = marks.left.eurion.position.y;
  const vaultWidth: (y: number) => number = (y: number): number =>
    breadth *
    Math.sqrt(Math.max(0, 1 - ((y - widestY) / (crownY - widestY)) ** 2));
  // Fractions 0.8 and 0.4 select common sampling stations of the analytic
  // crown cap. They are engineering rules, not cranial landmark estimates.
  const upperCrown: number = widestY + (crownY - widestY) * 0.8;
  const upperVault: number = widestY + (crownY - widestY) * 0.4;
  const temple: number = marks.left.frontotemporale.position.y;
  const cheek: number = marks.left.zygion.position.y;
  const upperMouth: number = (nasal.origin[1] + marks.stomion.position.y) / 2;
  const mandible: number = marks.left.gonion.position.y;
  const chinProm: number = chinY + e.jaw.prominenceHeightMm;
  // Frontotemporale measures the anterior temporal crests, not the whole
  // cranial side pole. Interpolate that pole between eurion and zygion while
  // retaining the independently supplied frontal chord at its actual X/Z.
  // The side-pole interpolation is a geometric convention, not another survey.
  const templePoleWidth: number =
    h.faceWidth +
    ((breadth - h.faceWidth) * (temple - cheek)) / (widestY - cheek);
  const rows: [M.Station, number, number][] = [
    ["upperCrown", upperCrown, vaultWidth(upperCrown)],
    ["upperVault", upperVault, vaultWidth(upperVault)],
    ["cranialBreadth", widestY, breadth],
    ["temple", temple, templePoleWidth],
    ["zygomaticBand", cheek, h.faceWidth],
    ["upperMouthBand", upperMouth, (h.faceWidth + h.mandibularWidth) / 2],
    ["mandibleBand", mandible, h.mandibularWidth],
    ["chinProminence", chinProm, e.jaw.chinBreadthMm],
  ];
  if (
    !rows.every(
      (r: (typeof rows)[number], i: number): boolean =>
        i === 0 || r[1] < rows[i - 1]![1],
    )
  )
    throw new Error("Named actual head stations must remain strictly ordered");
  const sections: Partial<Record<M.Station, M.Section>> = {};
  for (const [name, y, width] of rows) {
    const high: number = Math.max(0, (y - widestY) / (crownY - widestY));
    const dome: number = Math.sqrt(Math.max(0, 1 - high * high));
    // The posterior head ends at the nape support above the simple neck.
    // Its lower extent consumes the already resolved upper-neck back, rather
    // than retaining half a cranial depth down to the chin. Below the jaw
    // angle only the open anterior section is emitted by FaceHeadFamily.
    // This smooth height blend is a shared support convention, not a fit.
    const lower: number = Math.min(
      1,
      Math.max(0, (y - chinY) / (cheek - chinY)),
    );
    const posteriorBlend: number = Math.min(
      1,
      Math.max(0, (y - mandible) / (cheek - mandible)),
    );
    const smoothPosteriorBlend: number =
      posteriorBlend * posteriorBlend * (3 - 2 * posteriorBlend);
    const napeZ: number =
      midZ +
      forwardSlope * offset -
      rz * (1 + e.neck.upperRadiusFractionChange);
    const back: number =
      y >= widestY
        ? origin[2] + (marks.opisthocranion.position.z - origin[2]) * dome
        : napeZ +
          (marks.opisthocranion.position.z - napeZ) * smoothPosteriorBlend;
    const front: number =
      y >= widestY
        ? origin[2] + (marks.glabella.position.z - origin[2]) * dome
        : y >= nasal.origin[1]
          ? marks.nasion.position.z
          : marks.menton.position.z +
            (nasal.origin[2] - marks.menton.position.z) * lower;
    const span: number = front - back;
    if (span <= 0)
      throw new Error("Positive anterior/posterior head extent required");
    const sideZ: number = origin[2];
    const wingZ: number = front - e.jaw.cheekRecessionMm * 0.24 ** 2;
    const cheekZ: number =
      name === "temple"
        ? marks.left.frontotemporale.position.z
        : front - e.jaw.cheekRecessionMm * 0.68 ** 2;
    const rearQuarter: number = back + (sideZ - back) * 0.68 ** 2;
    const rearWing: number = back + (sideZ - back) * 0.24 ** 2;
    const coeff: (z: number) => number = (z: number): number =>
      (z - back) / span;
    sections[name] = {
      heightRatio: (y - chinY) / h.headHeight,
      widthRatio: width / breadth,
      ...(name === "temple"
        ? { anteriorChordRatio: h.minimumFrontalWidth / width }
        : {}),
      centerXRatio: 0,
      frontDepthRatio: (front - origin[2]) / depth,
      backDepthRatio: (back - origin[2]) / depth,
      depthCoefficients: {
        centralFront: 1,
        frontWingLeft: coeff(wingZ),
        cheekLeft: coeff(cheekZ),
        sideLeft: coeff(sideZ),
        posteriorQuarterLeft: coeff(rearQuarter),
        posteriorWingLeft: coeff(rearWing),
        centralBack: 0,
        posteriorWingRight: coeff(rearWing),
        posteriorQuarterRight: coeff(rearQuarter),
        sideRight: coeff(sideZ),
        cheekRight: coeff(cheekZ),
        frontWingRight: coeff(wingZ),
      },
    };
  }
  const jawSide: (side: "left" | "right") => M.JawSide = (
    side: "left" | "right",
  ): M.JawSide => {
    const gonion: typeof marks.left.gonion.position =
      marks[side].gonion.position;
    const rise: number = gonion.y - chinY;
    const recession: number = marks.menton.position.z - gonion.z;
    if (rise <= 0 || recession <= 0)
      throw new Error("Actual gonion proxy must lie above and behind menton");
    // Parasymphysis/body fractions (1/8,1/5 and 0.85/0.6/0.65) locate
    // common jaw supports relative to measured scales. Their anatomy has not
    // been independently validated; 1/6 below is a cubic rounding convention.
    // The parasymphysis ratio divides full chin breadth by full mandibular
    // width: multiplying by angle half-width recovers chin half-width once.
    return {
      angleHalfWidthMm: h.mandibularWidth / 2,
      angleRiseMm: rise,
      angleRecessionMm: recession,
      parasymphysisWidthRatio: e.jaw.chinBreadthMm / h.mandibularWidth,
      parasymphysisRiseRatio: 1 / 8,
      parasymphysisRecessionRatio: 1 / 5,
      bodyWidthRatio: 0.85,
      bodyRiseRatio: 0.6,
      bodyRecessionRatio: 0.65,
      ramusWidthRatio: 1,
      ramusRiseAboveAngleMm: (temple - gonion.y) / 2,
      ramusRecessionBeyondAngleMm: 0,
    };
  };
  return {
    frame: { localOrigin: origin },
    dimensions: {
      headHeight: h.headHeight,
      cranialBreadth: breadth,
      headDepth: depth,
      chinHeight: chinY,
      upperNeckOffset: offset,
    },
    crownNormalized: normalized(
      marks.vertex.position.x,
      crownY,
      marks.vertex.position.z,
    ),
    inferiorChinNormalized: normalized(
      marks.menton.position.x,
      chinY,
      marks.menton.position.z,
    ),
    chinProminenceNormalized: normalized(
      0,
      chinProm,
      marks.menton.position.z + e.jaw.prominenceForwardMm,
    ),
    sublabialNormalized: normalized(
      0,
      chinY + e.jaw.sublabialHeightMm,
      marks.menton.position.z - e.jaw.sublabialRecessionMm,
    ),
    sections: sections as Record<M.Station, M.Section>,
    jaw: {
      sides: { left: jawSide("left"), right: jawSide("right") },
      roundingRatio: 1 / 6,
    },
    neckFamily: {
      coefficients: {
        center: {
          value: [0, midY, midZ],
          slope: [0, 1, forwardSlope],
          curvature: [0, 0, 0],
        },
        halfWidth: {
          value: rx,
          slope: (rx * e.neck.upperRadiusFractionChange) / offset,
          curvature: 0,
        },
        halfDepth: {
          value: rz,
          slope: (rz * e.neck.upperRadiusFractionChange) / offset,
          curvature: 0,
        },
        cardinalOffset: {
          value: [0, 0, 0, 0],
          slope: [0, 0, 0, 0],
          curvature: [0, 0, 0, 0],
        },
      },
    },
  };
}
