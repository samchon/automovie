import type { IAutoMovieCurve64 as C } from "@automovie/engine";

import { FaceMath as F } from "./FaceMath";
import type { IAutoMovieFaceMeasurements as M } from "./IAutoMovieFaceMeasurements";

/** Private named physical-Y station used to index longitudinal support fields. */
type HeadStation = {
  /** Semantic section name used when the actual field is re-evaluated. */
  name: string;

  /** Native physical height of this support, mm. */
  y: number;
};

/** Continuous twelve-lane head fields and a quadratic four-span neck collar. Feature-owner sagittal courses override the anterior midline. Stored values are dimensioned rules; generated closed supports do not create skin or close eye, oral or nasal apertures. All methods operate in the native physical-Y chart.
 *
 * @author Samchon
 */
export class FaceHeadFamily {
  /** Angular knot order, from anterior through subject-left, posterior and subject-right, shared by section points and outgoing Bernstein handles. */
  public static readonly lanes: readonly M.Lane[] = [
    "centralFront",
    "frontWingLeft",
    "cheekLeft",
    "sideLeft",
    "posteriorQuarterLeft",
    "posteriorWingLeft",
    "centralBack",
    "posteriorWingRight",
    "posteriorQuarterRight",
    "sideRight",
    "cheekRight",
    "frontWingRight",
  ];

  /** Actual four-span closed neck.midTube at longitudinal h=0, native mm. */
  public readonly mid: F.Curve;

  /** Actual upper tube at the positive upperNeckOffset, native mm. */
  public readonly upper: F.Curve;

  /** Per-control first transverse derivative at mid-tube, d(native position)/d(longitudinal mm), in mm/mm; published as the shared fullJ field. */
  public readonly jet: F.S[];

  /** Per-control second transverse derivative of the quadratic neck field, in 1/mm. Retained for the collar; the public boundary currently publishes first derivatives only. */
  public readonly second: F.S[];
  private readonly collar: F.S[][];
  private readonly neckfront: F.Curve;
  private readonly philtrum: F.Curve;
  private readonly profile: F.Curve[];
  private readonly crown: F.V;
  private readonly chin: F.V;
  private readonly pointFields: F.Curve[] = [];
  private readonly tangentFields: F.Curve[] = [];
  private readonly stations: HeadStation[] = [];
  private readonly points: F.V[][] = [];
  private readonly header: F.Curve;
  private readonly jaw: F.Curve;
  private readonly jawSides: Record<M.Side, F.Curve>;
  private readonly jawAngles: Record<M.Side, F.V>;
  private readonly jawAngleY: number;

  /** Resolve head supports and the collar from one dimensioned instance and the actual nasal/oral profile curves. Required feature names must exist and their sagittal Y derivatives must be nonzero where bridge slopes are divided.
   *
   * @param p Native head dimensions, descending sections and quadratic neck fields.
   * @param features Actual dorsum, columella and upper/lower sagittal lip courses.
   */
  public constructor(
    private readonly p: M.Head,
    features: readonly F.Curve[],
  ) {
    const origin: C.Vector = p.frame.localOrigin;
    const d: M.Head["dimensions"] = p.dimensions;
    const scale: C.Vector = [d.cranialBreadth, d.headHeight, d.headDepth];
    const pointOrigin: C.Vector = [origin[0], d.chinHeight, origin[2]];
    const relative: (v: C.Vector) => F.V = (v: C.Vector): F.V =>
      F.add(pointOrigin, [v[0] * scale[0], v[1] * scale[1], v[2] * scale[2]]);
    this.crown = relative(p.crownNormalized);
    this.chin = relative(p.inferiorChinNormalized);
    const jawPoints: Record<M.Side, F.V[]> = { left: [], right: [] };
    for (const side of ["left", "right"] as const) {
      const sign: number = side === "left" ? 1 : -1;
      const j: M.JawSide = p.jaw.sides[side];
      jawPoints[side] = (["parasymphysis", "body"] as const).map(
        (name: "parasymphysis" | "body"): F.V =>
          F.add(this.chin, [
            sign * j.angleHalfWidthMm * j[`${name}WidthRatio`],
            j.angleRiseMm * j[`${name}RiseRatio`],
            -j.angleRecessionMm * j[`${name}RecessionRatio`],
          ]),
      );
      jawPoints[side].push(
        F.add(this.chin, [
          sign * j.angleHalfWidthMm,
          j.angleRiseMm,
          -j.angleRecessionMm,
        ]),
        F.add(this.chin, [
          sign * j.angleHalfWidthMm * j.ramusWidthRatio,
          j.angleRiseMm + j.ramusRiseAboveAngleMm,
          -j.angleRecessionMm - j.ramusRecessionBeyondAngleMm,
        ]),
      );
    }
    this.jawAngles = { left: jawPoints.left[2]!, right: jawPoints.right[2]! };
    this.jawAngleY =
      d.chinHeight + p.sections.mandibleBand.heightRatio * d.headHeight;
    this.jaw = F.curve(
      "jaw.inferiorSkinSupport",
      [...jawPoints.right.slice().reverse(), this.chin, ...jawPoints.left],
      false,
      false,
      p.jaw.roundingRatio,
    );
    // The inferior chin is a transverse minimum of the common jaw course.
    // Both halves share the same horizontal handle there before sections use
    // their physical-Y intersections. This is a curve support, not a skin seam.
    const chinHandle: F.V = F.add(
      this.jaw.spans[3]![3],
      this.jaw.spans[3]![2],
      -1,
    );
    chinHandle[1] = 0;
    chinHandle[2] = 0;
    this.jaw.spans[3]![2] = F.add(this.chin, chinHandle, -1);
    this.jaw.spans[4]![1] = F.add(this.chin, chinHandle);
    this.jawSides = {
      left: { name: "jaw.left", closed: false, spans: this.jaw.spans.slice(4) },
      right: {
        name: "jaw.right",
        closed: false,
        spans: this.jaw.spans
          .slice(0, 4)
          .reverse()
          .map((s: F.S): F.S => s.slice().reverse() as F.S),
      },
    };
    this.mid = {
      name: "neck.midTube",
      closed: true,
      spans: this.neckControls(0),
    };
    this.upper = {
      name: "neck.upperTube",
      closed: true,
      spans: this.neckControls(d.upperNeckOffset),
    };
    this.jet = this.neckControls(0, true);
    const upperJet: F.S[] = this.neckControls(d.upperNeckOffset, true);
    this.second = this.neckControls(1, true).map(
      (s: F.S, i: number): F.S =>
        s.map(
          (v: F.V, k: number): F.V => F.add(v, this.jet[i]![k]!, -1),
        ) as F.S,
    );
    this.collar = this.mid.spans.map((s: F.S, i: number): F.S[] =>
      s.map(
        (v: F.V, k: number): F.S => [
          v,
          F.add(v, this.jet[i]![k]!, d.upperNeckOffset / 3),
          F.add(
            this.upper.spans[i]![k]!,
            upperJet[i]![k]!,
            -d.upperNeckOffset / 3,
          ),
          this.upper.spans[i]![k]!,
        ],
      ),
    );
    const by: Map<string, F.Curve> = new Map(
      features.map((c: F.Curve): [string, F.Curve] => [c.name, c]),
    );
    const dorsum: F.Curve = by.get("nose.dorsum")!;
    const columella: F.Curve = by.get("nose.columella")!;
    const lu: F.Curve = by.get("lips.sagittal.upper")!;
    const ll: F.Curve = by.get("lips.sagittal.lower")!;
    const root: F.V = dorsum.spans[0]![0];
    const base: F.V = columella.spans.at(-1)![3];
    const liptop: F.V = lu.spans[0]![0];
    const lipend: F.V = ll.spans.at(-1)![3];
    this.philtrum = F.station("philtrum.centralBridge", [base, liptop]);
    let ds: F.V = F.mul(F.add(lu.spans[0]![1], lu.spans[0]![0], -1), 3);
    this.philtrum.spans.at(-1)![2] = F.add(
      liptop,
      F.mul(ds, 1 / ds[1]),
      -(liptop[1] - base[1]) / 3,
    );
    ds = F.mul(F.add(ll.spans.at(-1)![3], ll.spans.at(-1)![2], -1), 3);
    this.neckfront = F.station(
      "neck.chinSagittalBridge",
      [
        this.upper.spans[0]![0],
        this.chin,
        relative(p.chinProminenceNormalized),
        relative(p.sublabialNormalized),
        lipend,
      ],
      upperJet[0]![0],
      F.mul(ds, 1 / ds[1]),
    );
    this.neckfront.spans.unshift(this.collar[0]![0]!);
    this.neckfront.lengthsMm!.unshift(d.upperNeckOffset);
    this.profile = [dorsum, columella, this.philtrum, lu, ll, this.neckfront];
    const native: F.Curve[] = [];
    for (const [name, s] of Object.entries(p.sections)) {
      const y: number = d.chinHeight + s.heightRatio * d.headHeight;
      const rx: number = (d.cranialBreadth * s.widthRatio) / 2;
      const cx: number = origin[0] + s.centerXRatio * d.cranialBreadth;
      const back: number = origin[2] + s.backDepthRatio * d.headDepth;
      const front: number = origin[2] + s.frontDepthRatio * d.headDepth;
      // 0.24 and 0.68 are common angular-lane shape conventions, not measured
      // cranial landmarks. Cardinal tangents are constrained by FaceMath.curve.
      const anterior: number = s.anteriorChordRatio ?? 0.68;
      if (!(anterior > 0.24 && anterior < 1))
        throw new Error(
          "Anterior frontal chord must lie inside the cranial side pole",
        );
      const xs: number[] = [
        cx,
        cx + 0.24 * rx,
        cx + anterior * rx,
        cx + rx,
        cx + 0.68 * rx,
        cx + 0.24 * rx,
        cx,
        cx - 0.24 * rx,
        cx - 0.68 * rx,
        cx - rx,
        cx - anterior * rx,
        cx - 0.24 * rx,
      ];
      const pts: F.V[] = FaceHeadFamily.lanes.map(
        (key: M.Lane, i: number): F.V => [
          xs[i]!,
          y,
          back + s.depthCoefficients[key] * (front - back),
        ],
      );
      const z: number | undefined = F.frontZ(this.profile, y);
      if (z !== undefined) pts[0] = [0, y, z];
      if (y <= this.jawAngleY) {
        // Reconcile the lower anterior supports at their actual jaw-course
        // intersections before interpolating longitudinal fields. The lower
        // face is an open front arc: no skull is extended behind the neck.
        for (const side of ["left", "right"] as const) {
          const edge: F.V | undefined = F.atY(this.jawSides[side], y);
          if (!edge)
            throw new Error(
              "Lower face station must intersect its jaw-floor course",
            );
          const lanes: number[] = side === "left" ? [1, 2, 3] : [11, 10, 9];
          [0.24, 0.68, 1].forEach((fraction: number, i: number): void => {
            pts[lanes[i]!] = [
              edge[0] * fraction,
              y,
              pts[0]![2] + (edge[2] - pts[0]![2]) * fraction * fraction,
            ];
          });
        }
      }
      native.push(F.curve("skull.section." + name, pts, true, true));
      this.stations.push({ name, y });
      this.points.push(pts);
    }
    const rootSlope: F.V = F.mul(
      F.add(dorsum.spans[0]![1], dorsum.spans[0]![0], -1),
      1 / (dorsum.spans[0]![1][1] - dorsum.spans[0]![0][1]),
    );
    this.header = F.longitudinal(
      "skull.longitudinal.centralFront",
      [
        this.crown,
        ...this.points
          .filter((pts: F.V[]): boolean => pts[0]![1] > root[1])
          .map((pts: F.V[]): F.V => pts[0]!),
        root,
      ],
      rootSlope,
    );
    for (let phase: number = 0; phase < 12; phase++) {
      const supports: F.Curve[] = native.filter(
        (_: F.Curve, i: number): boolean =>
          phase <= 3 || phase >= 9 || this.stations[i]!.y >= this.jawAngleY,
      );
      this.pointFields.push(
        F.longitudinal("skull.pointField." + phase, [
          this.crown,
          ...supports.map((c: F.Curve): F.V => c.spans[phase]![0]),
        ]),
      );
      const handles: F.V[] = supports.map(
        (c: F.Curve): F.V => F.add(c.spans[phase]![1], c.spans[phase]![0], -1),
      );
      this.tangentFields.push(
        F.longitudinal("skull.angularHandleField." + phase, [
          [0, this.crown[1], 0],
          ...handles.map(
            (h: F.V, i: number): F.V => [h[0], this.stations[i]!.y, h[2]],
          ),
        ]),
      );
    }
  }

  /** Evaluate the quadratic neck section or its longitudinal derivative. Cardinal knots and quarter-ellipse handle offsets are affine in the Taylor fields, so differentiating the fields differentiates every actual Bernstein control.
   *
   * @param offset Longitudinal displacement from mid-tube, mm.
   * @param derivative Return d(control)/d(offset), mm/mm, instead of positions.
   * @returns Four native Bernstein spans in front/left/back/right order.
   */
  public neckControls(offset: number, derivative: boolean = false): F.S[] {
    const coeff: M.Neck["coefficients"] = this.p.neckFamily.coefficients;
    const scalar: (c: M.Polynomial<number>) => number = (
      c: M.Polynomial<number>,
    ): number =>
      derivative
        ? c.slope + c.curvature * offset
        : c.value + c.slope * offset + (c.curvature * offset * offset) / 2;
    const array: (c: M.Polynomial<readonly number[]>) => number[] = (
      c: M.Polynomial<readonly number[]>,
    ): number[] =>
      c.value.map((v: number, i: number): number =>
        derivative
          ? c.slope[i]! + c.curvature[i]! * offset
          : v + c.slope[i]! * offset + (c.curvature[i]! * offset * offset) / 2,
      );
    const center: F.V = F.vec(array(coeff.center));
    const rx: number = scalar(coeff.halfWidth);
    const rz: number = scalar(coeff.halfDepth);
    const q: number[] = array(coeff.cardinalOffset);
    const points: F.V[] = [
      F.add(center, [q[0]!, 0, rz]),
      F.add(center, [rx, 0, q[1]!]),
      F.add(center, [q[2]!, 0, -rz]),
      F.add(center, [-rx, 0, q[3]!]),
    ];
    return F.hermite(
      "neck",
      points,
      [
        [F.K * rx, 0, 0],
        [0, 0, -F.K * rz],
        [-F.K * rx, 0, 0],
        [0, 0, F.K * rz],
      ],
      true,
      1,
    ).spans;
  }

  /** Evaluate the head supports at physical Y. Above the jaw angle the twelve angular lanes close around the cranium. Below it only the anterior six-span arc is delivered, ending on the longitudinal supports reconciled to the jaw course at named stations. No posterior lower-skull closure is invented. The crown can collapse a section; closure alone proves no regularity or skin topology.
   *
   * @param y Native height, mm, within the lowest support and crown.
   * @param name Semantic identifier assigned to the returned course.
   * @returns Closed cranial or open lower-face native course with Bernstein handles.
   * @throws Error when Y lies outside the chart by more than 1e-8 mm.
   */
  public section(y: number, name: string = "skull.section.evaluated"): F.Curve {
    if (y < this.stations.at(-1)!.y - 1e-8 || y > this.crown[1] + 1e-8)
      throw new Error("Outside skull chart");
    if (y < this.jawAngleY) {
      const lanes: number[] = [9, 10, 11, 0, 1, 2, 3];
      const front: number | undefined = F.frontZ(this.profile, y);
      const points: F.V[] = lanes.map(
        (i: number): F.V => F.atY(this.pointFields[i]!, y)!,
      );
      const handles: F.V[] = lanes.map(
        (i: number): F.V => F.atY(this.tangentFields[i]!, y)!,
      );
      handles.forEach((h: F.V): void => {
        h[1] = 0;
      });
      if (front !== undefined) points[3] = [0, y, front];
      // Restrict the same angular field instead of refitting open-arc handles:
      // the anterior controls then approach the jaw-angle section unchanged.
      const result: F.Curve = F.hermite(name, points, handles, false, 1);
      result.normalizedWidths = result.spans.map(
        (): number => 1 / result.spans.length,
      );
      return result;
    }
    const points: F.V[] = this.pointFields.map(
      (c: F.Curve): F.V => F.atY(c, y)!,
    );
    const handles: F.V[] = this.tangentFields.map(
      (c: F.Curve): F.V => F.atY(c, y)!,
    );
    handles.forEach((h: F.V): void => {
      h[1] = 0;
    });
    const z: number | undefined = F.frontZ(this.profile, y);
    const point: F.V | undefined =
      z === undefined ? F.atY(this.header, y) : [0, y, z];
    if (point) points[0] = point;
    points.forEach((q: F.V): void => {
      q[1] = y;
    });
    return F.hermite(name, points, handles, true, 1);
  }

  /** Evaluate dimensionless t in one indexed span of the actual section at native y (mm). The caller supplies a valid span index and normally t in [0,1]; no arc-length reparameterization occurs. */
  public phase(y: number, span: number, t: number): F.V {
    return F.bezier(this.section(y).spans[span]!, t);
  }

  /** Emit named support sections, twelve longitudinal courses, jaw-floor and upper-neck transition courses from this same family. Collar-phase samples use the cubic midpoint weights [1,3,3,1]/8; they are diagnostic courses rather than new boundary authorities. Returned arrays are mutable generated controls.
   *
   * @returns Native Bernstein courses with their actual longitudinal durations.
   */
  public curves(): F.Curve[] {
    const curves: F.Curve[] = [
      ...this.stations.map(
        (s: HeadStation): F.Curve =>
          this.section(s.y, "skull.section." + s.name),
      ),
      this.mid,
      this.upper,
      this.neckfront,
      this.philtrum,
    ];
    FaceHeadFamily.lanes.forEach((name: M.Lane, i: number): void => {
      curves.push(
        i === 0
          ? this.header
          : { ...this.pointFields[i]!, name: "skull.longitudinal." + name },
      );
    });
    const offset: number = this.p.dimensions.upperNeckOffset;
    const upperJet: F.S[] = this.neckControls(offset, true);
    ["left", "back", "right"].forEach((name: string, i: number): void => {
      const phase: number = i + 1;
      // Lateral upper-neck courses meet the same jaw-angle supports as the
      // inferior jaw course, not the narrow chin ring. The posterior course
      // reaches the back of the mandibular-height section: a nape support,
      // not an independently observed cervical landmark. The shared collar
      // and its complete transverse jet remain unchanged.
      const target: F.V =
        name === "back"
          ? this.section(
              this.stations.find(
                (s: HeadStation): boolean => s.name === "mandibleBand",
              )!.y,
            ).spans[6]![0]
          : this.jawAngles[name === "left" ? "left" : "right"];
      const c: F.Curve = F.station(
        "neck.jawTransition." + name,
        [this.upper.spans[phase]![0], target],
        upperJet[phase]![0],
      );
      c.spans.unshift(this.collar[phase]![0]!);
      c.lengthsMm!.unshift(offset);
      curves.push(c);
    });
    for (let phase: number = 0; phase < 4; phase++) {
      const weights: readonly number[] = [0.125, 0.375, 0.375, 0.125];
      const span: F.S = [0, 1, 2, 3].map(
        (i: number): F.V =>
          [0, 1, 2].map((k: number): number =>
            weights.reduce(
              (sum: number, w: number, j: number): number =>
                sum + w * this.collar[phase]![j]![i]![k]!,
              0,
            ),
          ) as F.V,
      ) as F.S;
      curves.push({
        name: "neck.collarPhase." + phase,
        closed: false,
        spans: [span],
        lengthsMm: [offset],
      });
    }
    for (const side of ["left", "right"] as const) {
      const i: number = side === "left" ? 2 : 10;
      const start: number =
        1 +
        this.stations.findIndex(
          (s: HeadStation): boolean => s.name === "temple",
        );
      curves.push({
        ...this.pointFields[i]!,
        name: "cheek.frontTransition." + side,
        spans: this.pointFields[i]!.spans.slice(start),
        lengthsMm: this.pointFields[i]!.lengthsMm!.slice(start),
      });
    }
    curves.push(this.jaw);
    return curves;
  }
}
