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
import type { IAutoMoviePelvisIdentityBridge64 as B } from "../parameters/IAutoMoviePelvisIdentityBridge64";

/** Expand public physical anchors into the new pants family's named stations.
 * The actual 55-bone rest specimen owns placement. The upstream torso owns the
 * complete waist; only its local chart is decoded here. No reference identity,
 * generated controls, station table, normal table or own saved network is read.
 * Public hip breadth and buttock depth/tape need not be measured at one level;
 * their transfer onto this common support plane is an authoring convention.
 * The seven optional observations replace the stated neutral relations, rather
 * than claiming individual clinical accuracy for their default values. This
 * intermediate stage does not fit an obsolete eight-support section; the
 * consuming resolver fits only the actual sixteen-support family.
 *
 * @author Samchon
 */
export function resolvePublicPantsAnchors64(props: {
  /** Named physical input on ingress, or derived station measurements on egress; both retain millimetres. */
  measurements: H;

  /** The admitted 55-bone rest skeleton; no duplicate joint reconstruction occurs. */
  skeleton: Skeleton;

  /** Resolved parent context owning the actual construction placement. */
  context: Context;

  /** Complete actual torso waist operator required before pelvis generation. */
  upstream: ReadonlyMap<string, C.Boundary>;

  /** Optional named physical observations replacing disclosed neutral relations. */
  additional?: Partial<B.Independent>;
}): {
  /** Named physical input on ingress, or derived station measurements on egress; both retain millimetres. */
  measurements: P.Input;

  /** Resolved seven physical observation values, including explicitly disclosed conventional defaults. */
  independent: B.Independent;

  /** Internal bone-derived construction gauges; these are not public shape controls. */
  nativeBoneOriginsMm: {
    /** Actual hips origin in the native rest chart, millimetres. */
    construction: M.V;

    /** Actual left upper-leg origin in the native rest chart, millimetres. */
    left: M.V;

    /** Actual right upper-leg origin in the native rest chart, millimetres. */
    right: M.V;
  };

  /** Numerical convention and quantity observations, separate from source or form approval. */
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
    perinealCrownHeightMm: root[1] - 0.13 * meanUpper,
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
    independent.perinealCrownHeightMm >= floorY ||
    independent.iliacSkinBreadthMm < body.bicristalBreadth
  )
    throw new Error("Invalid independent pelvis observations");
  // Mirror the floor-to-crown physical drop for the lower roof chart. This
  // neutral relation is independent of where two extrapolated circles touch.
  const nearY: number = 2 * independent.perinealCrownHeightMm - floorY;
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
    p.pairedStations[side] = [station(0.5, "thighNative")];
    p.thighDerivativeContext[side] = station(0.625, "distalDerivativeContext");
  }
  const midLeft: P.PairedStation = p.pairedStations.left[0]!,
    midRight: P.PairedStation = p.pairedStations.right[0]!;
  const innerClearance: number =
    midLeft.centerLateralFromFrame_mm -
    midLeft.breadth_mm / 2 -
    midRight.centerLateralFromFrame_mm -
    midRight.breadth_mm / 2;
  if (
    !(innerClearance > 0) ||
    !(
      nearY >
      root[1] +
        Math.max(midLeft.heightFromFrame_mm, midRight.heightFromFrame_mm)
    )
  )
    throw new Error(
      "The midpoint tube ports and crown-owned lower chart have no positive separated height domain",
    );
  const fan: Section.Fan = Section.fan(
    p,
    localWaist.section.spans as M.Span[],
    localWaist.fullJ as M.Span[],
    (v: M.V): M.V => M.clone(v),
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
  // A body-floor envelope transfers the independent buttock dimensions toward
  // the actual midpoint tubes. Proximal girth does not define a closed circle
  // inside the merged thigh-root mass.
  const midY: number =
    root[1] + (midLeft.heightFromFrame_mm + midRight.heightFromFrame_mm) / 2;
  const floorFraction: number = (floorY - buttockY) / (midY - buttockY);
  if (!(floorFraction > 0 && floorFraction < 1))
    throw new Error(
      "The floor must lie between buttock maximum and midpoint tubes",
    );
  const midBreadth: number =
    Math.abs(left[0] - right[0]) +
    (midLeft.breadth_mm + midRight.breadth_mm) / 2;
  const floorBreadth: number =
    body.hipBreadth + floorFraction * (midBreadth - body.hipBreadth);
  const floorDepth: number =
    body.buttockDepth +
    floorFraction *
      ((midLeft.depth_mm + midRight.depth_mm) / 2 - body.buttockDepth);
  const points: {
    /** Semantic station identity used to match the generating family. */
    name: string;

    /** Physical station height in the upright construction chart, millimetres. */
    y: number;

    /** Adopted skin-envelope breadth at this station, millimetres. */
    breadth: number;

    /** Adopted AP skin-envelope depth at this station, millimetres. */
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
            /** Physical station height in the upright construction chart, millimetres. */
            y: number;
          },
          b: {
            /** Physical station height in the upright construction chart, millimetres. */
            y: number;
          },
        ): number => a.y - b.y,
      )
      .map(
        (s: {
          /** Semantic station identity used to match the generating family. */
          name: string;

          /** Physical station height in the upright construction chart, millimetres. */
          y: number;
        }): {
          /** Semantic station identity used to match the generating family. */
          name: string;

          /** Physical station height in the upright construction chart, millimetres. */
          y: number;

          /** Adopted skin-envelope breadth at this station, millimetres. */
          breadth: number;

          /** Adopted AP skin-envelope depth at this station, millimetres. */
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
  // Provisional front supports are replaced by the consuming resolver's
  // actual sixteen-support tape solve before any family is constructed.
  p.mergedStations = stationsAt(2);
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
      midpointInnerClearanceMm: innerClearance,
      independentButtockCircumferenceMm: body.buttockCircumference,
      stage:
        "Physical anchors only; actual sixteen-support tape fitting belongs to the consuming resolver.",
      convention:
        "Native-free public T specimen. The virtual furrow .15 upper transfers girth to the midpoint tube only. Proximal external arcs derive from the independent buttock envelope, median crown and actual midpoint operator. The lower roof chart mirrors floor-to-crown drop; it is not an extrapolated-circle contact or a measured critical event. Body floor .11 upper, default crown .13 upper and buttock maximum -.007 stature are conventions. Circular midpoint aspect is not a clinical inference. Fore-aft .45 and recess .06 are neutral conventions. No clipping, stance or flesh-gap correction.",
    },
  };
}
