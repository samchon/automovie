import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import { FaceMath as F } from "./FaceMath";
import type { IAutoMovieFaceMeasurements as M } from "./IAutoMovieFaceMeasurements";

/** Emit independent oral/nasal Hermite courses and two analytic nostril ovals. Signed native coordinates are subject-left/up/front in mm. Upper and lower neutral contact courses coincide geometrically but retain their distinct names; vermilion borders and roll crests are separate. Unit nostril axes are built from the declared two-angle frame, not by radial displacement of the center. An analytic rim describes a curve and creates no nasal opening topology.
 *
 * @param spec Dimensioned oral/nasal charts and shared dimensionless rounding factors.
 * @returns Native cubic courses and analytic ovals with turn phase; no mesh or visibility certificate.
 * @author Samchon
 */
export function generateFaceNoseMouth(spec: M.NoseMouth): {
  /** Native-mm cubic oral, nasal and philtral courses with distinct semantic names. */
  curves: F.Curve[];

  /** Two analytic nostril rims in native mm with proper local axes and turn phase. */
  ovals: C.Oval[];
} {
  const p: M.Oral = spec.oral;
  const n: M.Nasal = spec.nasal;
  const r: M.NoseMouth["rounding"] = spec.rounding;
  const curves: F.Curve[] = [];
  const ovals: C.Oval[] = [];
  const q: (x: number, y: number, z: number) => F.V = (
    x: number,
    y: number,
    z: number,
  ): F.V => F.add(p.origin, [x, y, z]);
  const qn: (x: number, y: number, z: number) => F.V = (
    x: number,
    y: number,
    z: number,
  ): F.V => F.add(n.origin, [x, y, z]);
  const bez: (name: string, pts: C.Vector[], tan: C.Vector[]) => void = (
    name: string,
    pts: C.Vector[],
    tan: C.Vector[],
  ): void => {
    curves.push(F.hermite(name, pts, tan));
  };
  // All tangent vectors below are derivatives over a unit local span;
  // FaceMath.hermite divides by 3 to obtain Bernstein handle offsets. Shared
  // vectors at adjoining knots preserve that local derivative convention.
  const w: number = p.width / 2;
  const c: number = p.cupidWidth / 2;
  const corners: F.V[] = [
    q(-w, p.cornerRise, p.cornerDepth),
    q(w, p.cornerRise, p.cornerDepth),
  ];
  const x: number = p.rollShoulderX;
  const edgeDx: number = (w - x) * r.cornerTangentShare;
  const shoulderDx: number = Math.min(x, w - x) * r.shoulderTangentShare;
  const upper: C.Vector[] = [
    corners[0]!,
    q(-x, p.upperLateralRise, p.upperLateralDepth),
    q(-c, p.upperBorderRise + p.cupidRise, p.cupidDepth),
    q(0, p.upperBorderRise, p.upperBorderDepth),
    q(c, p.upperBorderRise + p.cupidRise, p.cupidDepth),
    q(x, p.upperLateralRise, p.upperLateralDepth),
    corners[1]!,
  ];
  const slope: number =
    (p.upperLateralRise - p.cornerRise) * r.lateralBorderSlopeShare;
  const depthSlope: number =
    (p.upperLateralDepth - p.cornerDepth) * r.lateralBorderSlopeShare;
  bez("lips.vermilion.upper", upper, [
    [edgeDx, slope, -p.cornerDepth],
    [shoulderDx, slope, depthSlope],
    [c * r.cupidTangentShare, 0, 0],
    [c * r.cupidTangentShare, 0, 0],
    [c * r.cupidTangentShare, 0, 0],
    [shoulderDx, -slope, -depthSlope],
    [edgeDx, -slope, p.cornerDepth],
  ]);
  const lower: F.V = q(0, -p.lowerBorderDrop, p.lowerBorderDepth);
  bez(
    "lips.vermilion.lower",
    [corners[1]!, lower, corners[0]!],
    [
      [-w * r.cornerTangentShare, -p.lowerBorderDrop, -p.cornerDepth],
      [-w * r.lowerMidTangentShare, 0, 0],
      [-w * r.cornerTangentShare, p.lowerBorderDrop, p.cornerDepth],
    ],
  );
  for (const name of ["upper", "lower"] as const) {
    const sign: number = name === "upper" ? 1 : -1;
    const rise: number = p[`${name}RollRise`];
    const depth: number = p[`${name}RollDepth`];
    const sd: number = p[`${name}RollShoulderDepth`];
    const pts: C.Vector[] = [
      corners[0]!,
      q(-x, rise + p[`${name}RollShoulderRise`], sd),
      q(0, rise, depth),
      q(x, rise + p[`${name}RollShoulderRise`], sd),
      corners[1]!,
    ];
    bez("lips.roll." + name, pts, [
      [edgeDx, sign * Math.abs(rise) * r.cornerRiseShare, -p.cornerDepth],
      [shoulderDx, 0, (depth - sd) * r.shoulderDepthShare],
      [x * r.shoulderTangentShare, 0, 0],
      [shoulderDx, 0, -(depth - sd) * r.shoulderDepthShare],
      [edgeDx, -sign * Math.abs(rise) * r.cornerRiseShare, p.cornerDepth],
    ]);
    const bt: number = name === "upper" ? p.upperBorderRise : p.lowerBorderDrop;
    const a: C.Vector = [
      0,
      -bt * r.profileBorderTangentShare,
      (depth - (name === "upper" ? p.upperBorderDepth : p.lowerBorderDepth)) *
        r.profileDepthShare,
    ];
    const b: C.Vector = [0, -Math.abs(rise) * r.profileRollTangentShare, 0];
    const c0: C.Vector = [
      0,
      -Math.abs(rise) * r.profileContactTangentShare,
      sign * -depth * r.profileDepthShare,
    ];
    bez(
      "lips.sagittal." + name,
      name === "upper"
        ? [upper[3]!, pts[2]!, p.origin]
        : [p.origin, pts[2]!, lower],
      name === "upper"
        ? [a, b, c0]
        : [
            c0,
            b,
            [
              0,
              -bt * r.profileBorderTangentShare,
              -depth * r.profileDepthShare,
            ],
          ],
    );
  }
  for (const name of ["upper", "lower"])
    bez(
      "mouth.contact." + name,
      [corners[0]!, p.origin, corners[1]!],
      [
        [w, 0, -p.cornerDepth],
        [w, 0, 0],
        [w, 0, p.cornerDepth],
      ],
    );
  const root: F.V = qn(0, n.rootRise, n.rootDepth);
  const tip: F.V = qn(0, n.tipRise, n.tipDepth);
  const d: number = n.rootRise - n.tipRise;
  const depth: number = n.tipDepth - n.rootDepth;
  const tipT: C.Vector = [0, -d * r.nasalTipTangentShare, 0];
  const mid: F.V = qn(
    0,
    n.tipRise + d * r.dorsumShoulderHeight,
    n.rootDepth + depth * r.dorsumShoulderDepth,
  );
  bez(
    "nose.dorsum",
    [root, mid, tip],
    [
      [0, -d * r.dorsumRootTangent, 0],
      [0, -d * r.dorsumMidTangent, depth * r.dorsumDepthTangent],
      tipT,
    ],
  );
  bez(
    "nose.columella",
    [tip, n.origin],
    [tipT, [0, 0, -n.tipDepth * r.columellaTangent]],
  );
  for (const side of ["left", "right"] as const) {
    const s: number = side === "left" ? 1 : -1;
    const a: F.V = qn((s * n.width) / 2, n.tipRise - n.alarDrop, n.alarDepth);
    const ma: F.V = qn(
      s * n.width * r.alarShoulderWidth,
      n.tipRise + n.alarShoulderRise,
      n.alarShoulderDepth,
    );
    const tm: C.Vector = [
      -s * n.width * r.alarShoulderTangent,
      n.width * r.alarShoulderTangent,
      n.width * r.alarMedialDepthTangent,
    ];
    bez(
      "nose.alar.arch." + side,
      [n.origin, a, ma],
      [
        [s * n.width * r.alarBaseTangent, -n.width * r.alarBaseDrop, 0],
        [0, n.width * r.alarVerticalTangent, n.width * r.alarDepthTangent],
        tm,
      ],
    );
    bez(
      "nose.sidewall." + side,
      [
        qn(s * n.rootHalfWidth, n.rootRise, n.rootDepth - n.rootEdgeRecession),
        ma,
      ],
      [
        [
          s * n.width * r.wallLateralTangent,
          -d * r.wallVerticalTangent,
          -n.rootEdgeRecession,
        ],
        F.mul(tm, -1),
      ],
    );
    const start: F.V = qn((s * p.cupidWidth * r.philtralNasalSpan) / 2, 0, 0);
    const end: C.Vector = upper[s === 1 ? 4 : 2]!;
    const tangent: F.V = F.mul(F.add(end, start, -1), r.philtralTangent);
    bez("philtrum.column." + side, [start, end], [tangent, tangent]);
    // These mirrored axes have unit length and zero dot product by the
    // sine/cosine identities; center placement is independent of rotation.
    const u: C.Vector = [
      s * Math.cos(n.nostrilRecessionAngle),
      0,
      -Math.sin(n.nostrilRecessionAngle),
    ];
    const v: C.Vector = [
      -s * Math.sin(n.nostrilRecessionAngle) * Math.cos(n.nostrilPlaneAngle),
      -Math.sin(n.nostrilPlaneAngle),
      -Math.cos(n.nostrilRecessionAngle) * Math.cos(n.nostrilPlaneAngle),
    ];
    ovals.push({
      type: "analyticOval",
      name: "nose.nostril.rim." + side,
      center: qn((s * n.nostrilSpacing) / 2, n.nostrilRise, n.nostrilDepth),
      u,
      v,
      radiusU: n.nostrilRadiusU,
      radiusV: n.nostrilRadiusV,
      unit: "mm",
      phaseUnit: "turn",
      closed: true,
    });
  }
  return { curves, ovals };
}
