import {
  type IAutoMovieCurve64 as C,
  type AutoMovieCurveParentContext as Context,
  AutoMovieCurveMath64 as M,
} from "@automovie/engine";

import type { IAutoMovieHumanMeasurements as H } from "../../../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton as Skeleton } from "../../../skeleton/IAutoMovieHumanSkeleton";
import { AutoMovieLegIdentityRules64 as Leg } from "../../legs/parameters/AutoMovieLegIdentityRules64";
import type { PelvisMeasurements as P } from "../family/PelvisMeasurements";
import { PelvisSectionRules as Section } from "../family/PelvisSectionRules";
import type { IAutoMoviePelvisIdentityBridge64 as B } from "./IAutoMoviePelvisIdentityBridge64";
import { PelvisIdentitySection64 as Observation } from "./PelvisIdentitySection64";

/** Resolve the current public measurements and actual 55-bone rest specimen into the external R6b family's named physical stations. Decode the actual torso waist in the hips chart, derive thigh axes from girth and aspect, then fit one squareness coefficient to sampled convex buttock tape. Unsupported station ordering, aspect clearance, fan breadth or tape ranges reject rather than clamp. The 48 bisections and final refined tape are numerical observations, not biological validation. No saved curve network or reference identity is read.
 *
 * @author Samchon
 */
export function resolveAutoMoviePelvisIdentity64(props: {
  /** Named physical measurement input resolved before generation; no generated curve or reference control table is an input.
   */
  measurements: H;

  /** Actual 55-bone specimen in millimetres; its hips and upper-leg origins own placement.
   */
  skeleton: Skeleton;

  /** Current shared proper-parent context used to decode the upstream waist and place the resulting curves.
   */
  context: Context;

  /** Actual owner-published boundary operators indexed by ID; the resolver consumes the twelve-span waist and complete longitudinal jet.
   */
  upstream: ReadonlyMap<string, C.Boundary>;

  /** Optional independent physical observations; omitted fields use the resolver's explicit conventions and invalid supplied values reject.
   */
  additional?: Partial<B.Independent>;
}): {
  /** Named physical measurement input resolved before generation; no generated curve or reference control table is an input.
   */
  measurements: P.Input;

  /** Resolved independent supplemental observations, including the explicit convention for every omitted field.
   */
  independent: B.Independent;

  /** Construction and bilateral upper-leg origins in the same native millimetre chart as the generated family.
   */
  nativeBoneOriginsMm: {
    /** Native hips origin in millimetres, subtracted before placement by the construction parent.
     */
    construction: M.V;

    /** Native left upper-leg origin in millimetres, subtracted before placement by the left parent.
     */
    left: M.V;

    /** Native right upper-leg origin in millimetres, subtracted before placement by the right parent.
     */
    right: M.V;
  };

  /** Computed dimension/protocol observations for inspection; these reports are outputs, not hidden shape inputs or accuracy certificates.
   */
  diagnostics: object;
} {
  if (props.skeleton.joints.length !== 55)
    throw new Error("The actual 55-bone specimen is required");
  const body: H["identity"]["body"] = props.measurements.identity.body;
  const origin: (bone: string) => M.V = (bone: string): M.V => {
    const j: Skeleton.IJoint | undefined = props.skeleton.joints.find(
      (x: Skeleton.IJoint): boolean => x.bone === bone,
    );
    if (!j) throw new Error("Missing actual skeleton bone: " + bone);
    return [j.position.x, j.position.y, j.position.z];
  };
  const root: M.V = origin("hips"),
    left: M.V = origin("leftUpperLeg"),
    right: M.V = origin("rightUpperLeg");
  const waist: C.Boundary | undefined = props.upstream.get("waist.midTube");
  if (
    !waist ||
    waist.section.spans.length !== 12 ||
    waist.section.phaseUnit !== "turn"
  )
    throw new Error("Actual twelve-span torso waist required");
  const localPoint: (p: C.Vector) => M.V = (p: C.Vector): M.V =>
    M.add(root, props.context.inversePoint("hips", p));
  const localJ: (p: C.Vector) => M.V = (p: C.Vector): M.V =>
    M.clone(props.context.inverseDirection("hips", p));
  const localWaist: C.Boundary = {
    ...waist,
    section: {
      ...waist.section,
      spans: waist.section.spans.map(
        (s: C.Span): M.Span => s.map(localPoint) as M.Span,
      ),
    },
    fullJ: waist.fullJ.map((s: C.Span): M.Span => s.map(localJ) as M.Span),
    longitudinalAxis: localJ(waist.longitudinalAxis),
  };
  const upper: Record<P.Side, number> = {
    left: left[1] - origin("leftLowerLeg")[1],
    right: right[1] - origin("rightLowerLeg")[1],
  };
  const meanUpper: number = (upper.left + upper.right) / 2;
  const nearY: number = root[1] - 0.15 * meanUpper;
  const floorY: number = root[1] - 0.11 * meanUpper;
  const independent: B.Independent = {
    // Gordon et al., 2012 Anthropometric Survey of U.S. Army Personnel,
    // NATICK/TR-15/007 (2014), sex-specific standing landmark summaries:
    // buttock minus trochanterion is -11.7/-13.0 mm, about -.0072/-.0074
    // of the respective mean stature. No weighted pooled estimate is established.
    // -.007 is a common rounded authoring convention. Transferring clinical
    // trochanterion height to this mechanical hip-joint origin is unmeasured.
    buttockMaximumHeightMm: root[1] - 0.007 * body.stature,
    // Fore-aft partition and cleft are unmeasured in the public vocabulary.
    buttockAnteriorReachMm: 0.45 * body.buttockDepth,
    posteriorMedianRecessMm: 0.06 * body.buttockDepth,
    // The compressed bony width plus two measured flank-fat layers is a
    // minimal skin-envelope convention, not a measured crest skin breadth.
    iliacSkinBreadthMm:
      body.bicristalBreadth +
      2 * props.measurements.identity.composition.subcutaneousFat.flank,
    perinealCrownHeightMm: nearY - 0.02 * meanUpper,
    leftThighBreadthOverDepth: 1,
    rightThighBreadthOverDepth: 1,
    ...props.additional,
  };
  if (
    !Object.values(independent).every(Number.isFinite) ||
    independent.buttockAnteriorReachMm <= 0 ||
    independent.buttockAnteriorReachMm >= body.buttockDepth ||
    independent.posteriorMedianRecessMm < 0 ||
    independent.posteriorMedianRecessMm >= body.buttockDepth / 2 ||
    independent.perinealCrownHeightMm >= nearY ||
    independent.iliacSkinBreadthMm < body.bicristalBreadth
  )
    throw new Error("Invalid independent pelvis observations");
  const p: P.Input = {
    gate: "public-identity",
    frame: { origin_mm: root, medianLateralFromOrigin_mm: 0 },
    lanes: { posterior: [Math.SQRT1_2, Math.SQRT1_2] },
    mergedStations: [],
    pairedStations: { left: [], right: [] },
    thighDerivativeContext: {} as Record<P.Side, P.PairedStation>,
    pairedRounding: {
      left: new Array(4).fill(4 * (Math.sqrt(2) - 1)),
      right: new Array(4).fill(4 * (Math.sqrt(2) - 1)),
    },
    sectionRounding: new Array(5).fill(1),
  };
  for (const side of ["left", "right"] as const) {
    const hip: M.V = side === "left" ? left : right;
    const leg: H["identity"]["body"]["leftLeg"] =
      body[side === "left" ? "leftLeg" : "rightLeg"];
    const patellaY: number = props.skeleton.landmarks[side].patella.position.y;
    const aspect: number =
      independent[
        side === "left"
          ? "leftThighBreadthOverDepth"
          : "rightThighBreadthOverDepth"
      ];

    /** Build one merged XZ course at its physical height, deriving anterior X from the shared fan and handles from the angular chart. R6b applies optional arch recesses; V17 requires ordered inner/outer anterior supports and preserves their tangent slopes.
     */
    const station: (fraction: number, name: string) => P.PairedStation = (
      fraction: number,
      name: string,
    ): P.PairedStation => {
      const y: number = hip[1] - fraction * upper[side];
      const girth: number = Leg.resolveLegGirth64(
        leg,
        { hipY: hip[1], kneeY: hip[1] - upper[side], patellaY },
        y,
      );
      const axes: ReturnType<typeof Leg.cubicAxesFromCircumference> =
        Leg.cubicAxesFromCircumference(girth, aspect);
      return {
        name,
        sideSign: side === "left" ? 1 : -1,
        heightFromFrame_mm: y - root[1],
        centerLateralFromFrame_mm: hip[0] - root[0],
        centerFrontFromFrame_mm: hip[2] - root[2],
        breadth_mm: axes.breadthMm,
        depth_mm: axes.depthMm,
        outerDepthPhase: 0,
        innerDepthPhase: 0,
        frontLateralPhase: 0,
        backLateralPhase: 0,
      };
    };
    p.pairedStations[side] = [
      station(0.5, "thighNative"),
      station(0.325, "thighUpper"),
      station(0.15, "nearCrotch"),
    ];
    p.thighDerivativeContext[side] = station(0.625, "distalDerivativeContext");
  }
  const nearLeft: P.PairedStation = p.pairedStations.left.at(-1)!,
    nearRight: P.PairedStation = p.pairedStations.right.at(-1)!;
  const innerClearance: number =
    nearLeft.centerLateralFromFrame_mm -
    nearLeft.breadth_mm / 2 -
    nearRight.centerLateralFromFrame_mm -
    nearRight.breadth_mm / 2;
  if (
    nearLeft.heightFromFrame_mm === nearRight.heightFromFrame_mm &&
    innerClearance < 0
  )
    throw new Error(
      "Independent upper-thigh breadth/depth yields intersecting paired sections; supply admissible physical aspect measurements, not a flesh-gap clamp: " +
        innerClearance,
    );
  const widths: number[] = localWaist.section.phaseIntervals.map(
    (w: number): number => w * 12,
  );

  /** Derive anterior-lane cubic X fields from placed thigh supports, distal finite-difference dX/dY and the actual waist full jet. A nonpositive thigh-to-waist height interval rejects.
   */
  const fan: Section.Fan = Section.fan(
    p,
    localWaist.section.spans as M.Span[],
    localWaist.fullJ as M.Span[],
    (v: M.V): M.V => M.clone(v),
  );
  const expanded: ReturnType<typeof Section.expand> = Section.expand(
    localWaist.section.spans as M.Span[],
    widths,
    localWaist.fullJ as M.Span[],
    "external-r6b",
  );
  const buttockY: number = independent.buttockMaximumHeightMm;
  const crestY: number =
    (props.skeleton.landmarks.left.iliocristale.position.y +
      props.skeleton.landmarks.right.iliocristale.position.y) /
    2;
  const navelY: number = origin("spine")[1];
  const waistY: number = localWaist.section.spans[0]![0][1];
  if (
    !(
      floorY > nearY &&
      buttockY > floorY &&
      buttockY < Math.min(crestY, navelY) &&
      Math.max(crestY, navelY) < waistY
    )
  )
    throw new Error(
      "Public pelvis anchors do not form the supported ascending branch-free domain",
    );
  const floorBreadth: number =
    Math.abs(left[0] - right[0]) +
    (p.pairedStations.left.at(-1)!.breadth_mm +
      p.pairedStations.right.at(-1)!.breadth_mm) /
      2;
  const floorDepth: number =
    (p.pairedStations.left.at(-1)!.depth_mm +
      p.pairedStations.right.at(-1)!.depth_mm) /
    2;
  const points: {
    /** Semantic course identifier used in emitted curve names and inspection; it does not select a calibration identity.
     */
    name: string;

    /** Physical horizontal course height in native millimetres.
     */
    y: number;

    /** Actual lateral extent in millimetres, or the explicitly constructed course breadth in an anchor record; distinct from a control-hull extent.
     */
    breadth: number;

    /** Actual anterior/posterior extent in millimetres, or the explicitly constructed course depth in an anchor record.
     */
    depth: number;
  }[] = [
    {
      name: "crotchAbove",
      y: floorY,
      breadth: floorBreadth,
      depth: floorDepth,
    },
    {
      name: "buttockMaximum",
      y: buttockY,
      breadth: body.hipBreadth,
      depth: body.buttockDepth,
    },
    ...[
      { name: "navel", y: navelY },
      { name: "iliacCrest", y: crestY },
    ]
      .sort(
        (
          a: {
            /** Physical horizontal course height in native millimetres.
             */
            y: number;
          },
          b: {
            /** Physical horizontal course height in native millimetres.
             */
            y: number;
          },
        ): number => a.y - b.y,
      )
      .map(
        (s: {
          /** Semantic course identifier used in emitted curve names and inspection; it does not select a calibration identity.
           */
          name: string;

          /** Physical horizontal course height in native millimetres.
           */
          y: number;
        }): {
          /** Semantic course identifier used in emitted curve names and inspection; it does not select a calibration identity.
           */
          name: string;

          /** Physical horizontal course height in native millimetres.
           */
          y: number;

          /** Actual lateral extent in millimetres, or the explicitly constructed course breadth in an anchor record; distinct from a control-hull extent.
           */
          breadth: number;

          /** Actual anterior/posterior extent in millimetres, or the explicitly constructed course depth in an anchor record.
           */
          depth: number;
        } => {
          const t: number = (s.y - buttockY) / (waistY - buttockY);
          return {
            ...s,
            breadth:
              s.name === "iliacCrest"
                ? independent.iliacSkinBreadthMm
                : body.hipBreadth + t * (body.waistBreadth - body.hipBreadth),
            depth:
              body.buttockDepth + t * (body.waistDepth - body.buttockDepth),
          };
        },
      ),
    {
      name: "canonicalWaist",
      y: waistY,
      breadth: body.waistBreadth,
      depth: body.waistDepth,
    },
  ];
  const stationsAt: (power: number) => P.MergedStation[] = (
    power: number,
  ): P.MergedStation[] =>
    points.map((s: (typeof points)[number]): P.MergedStation => {
      const anteriorShare: number =
        independent.buttockAnteriorReachMm / body.buttockDepth;
      const front: number = s.depth * anteriorShare,
        back: number = front - s.depth;
      const center: number = (front + back) / 2;
      const leftRatio: number =
        Section.fanValue(fan, s.y, "left") / (s.breadth / 2);
      const rightRatio: number =
        -Section.fanValue(fan, s.y, "right") / (s.breadth / 2);
      if (!(leftRatio > 0 && leftRatio < 1 && rightRatio > 0 && rightRatio < 1))
        throw new Error(
          "Actual waist/thigh anterior fan leaves the independent pelvis breadth",
        );
      return {
        name: s.name,
        heightFromFrame_mm: s.y - root[1],
        centerLateralFromFrame_mm: 0,
        leftHalfBreadth_mm: s.breadth / 2,
        rightHalfBreadth_mm: s.breadth / 2,
        leftLateralFrontOffset_mm: center,
        rightLateralFrontOffset_mm: center,
        leftAnteriorFrontOffset_mm:
          center + (s.depth / 2) * (1 - leftRatio ** power) ** (1 / power),
        rightAnteriorFrontOffset_mm:
          center + (s.depth / 2) * (1 - rightRatio ** power) ** (1 / power),
        medianFrontOffset_mm: front,
        leftPosteriorFrontOffset_mm: back,
        rightPosteriorFrontOffset_mm: back,
        medianPosteriorFrontOffset_mm:
          back +
          independent.posteriorMedianRecessMm *
            (1 - (s.y - buttockY) / (waistY - buttockY)),
      };
    });
  // A single dimensionless squareness relation moves geometric supports.
  // PCHIP handles remain unamplified so scalar extrema cannot overshoot.
  // The posterior lateral supports own full depth; the cleft is a recess from
  // those supports. A tape bridges the cleft rather than following skin arc.
  const sectionAt: (power: number) => M.Span[] = (power: number): M.Span[] => {
    p.lanes.posterior = [2 ** (-1 / power), 2 ** (-1 / power)];
    p.mergedStations = stationsAt(power);
    return Section.station(
      p,
      p.mergedStations[1]!,
      expanded.widths,
      fan,
      "external-r6b",
    );
  };
  const girthAt: (power: number) => number = (power: number): number =>
    Observation.tapeMm(sectionAt(power), 256);
  let low: number = 1,
    high: number = 16;
  const lowerTape: number = girthAt(low),
    upperTape: number = girthAt(high);
  if (
    !(
      lowerTape <= body.buttockCircumference &&
      upperTape >= body.buttockCircumference
    )
  )
    throw new Error(
      "Independent hip breadth/depth/tape circumference is outside the declared squareness family: " +
        JSON.stringify({
          lowerTape,
          upperTape,
          actual: body.buttockCircumference,
        }),
    );
  for (let i: number = 0; i < 48; i++) {
    const mid: number = (low + high) / 2;
    if (girthAt(mid) < body.buttockCircumference) low = mid;
    else high = mid;
  }
  const power: number = (low + high) / 2;
  const finalSection: M.Span[] = sectionAt(power);
  const measuredGirth: number = Observation.tapeMm(finalSection, 256);
  const refinedTape: number = Observation.tapeMm(finalSection, 1024);
  const actualBounds: ReturnType<typeof Observation.boundsMm> =
    Observation.boundsMm(finalSection);
  p.roof = {
    sagDepthRatio: 0.5,
    sagDropFromBodyFloor_mm: floorY - independent.perinealCrownHeightMm,
    posteriorShoulderDropRatio: 0.5,
    anteriorShoulderDropRatio: 0.5,
    entryRounding: 1 / 3,
    medianRounding: 1 / 3,
    anteriorSweepFullness_mm: 0,
    anteriorArchLateralRise_mm: 0,
  };
  p.saddle = {
    offsetFromFrame_mm: [
      0,
      independent.perinealCrownHeightMm - root[1],
      independent.buttockAnteriorReachMm - body.buttockDepth / 2,
    ],
  };
  return {
    measurements: p,
    independent,
    nativeBoneOriginsMm: { construction: root, left, right },
    diagnostics: {
      levelsMm: { floorY, nearY, buttockY, crestY, navelY, waistY },
      nearInnerClearanceMm: innerClearance,
      independentButtockCircumferenceMm: body.buttockCircumference,
      actualButtockTape256Mm: measuredGirth,
      actualButtockTape1024Mm: refinedTape,
      tapeConvergenceDeltaMm: refinedTape - measuredGirth,
      actualButtockExtremaMm: actualBounds,
      commonSectionRounding: p.sectionRounding[0],
      dimensionlessSquarenessPower: power,
      supportedPowerInterval: [1, 16],
      convention:
        "Native-free public T specimen. Virtual furrow .15 upper and separate paired closed rings there are unqualified exterior topology. Body floor .11 upper and mean buttock height -.007 stature are conventions. Default circular thigh aspect is not a clinical inference; explicit 3:4 caller sensitivity is not reference-fitted or accepted. Fore-aft .45 and recess .06 are neutral authoring conventions. No clipping or flesh-gap correction.",
    },
  };
}
