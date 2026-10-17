import {
  type IAutoMovieCurve64 as C,
  type AutoMovieCurveParentContext as Context,
  AutoMovieCurveMath64 as M,
} from "@automovie/engine";

import type { IAutoMovieHumanMeasurements as H } from "../../../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton as Skeleton } from "../../../skeleton/IAutoMovieHumanSkeleton";
import type { PelvisMeasurements as P } from "../family/PelvisMeasurements";
import { PelvisSectionRules as S } from "../family/PelvisSectionRules";
import type { IAutoMoviePelvisIdentityBridge64 as Extra } from "../parameters/IAutoMoviePelvisIdentityBridge64";
import { PelvisIdentitySection64 as Observation } from "../parameters/PelvisIdentitySection64";
import { resolveProximalPantsStations64 } from "./resolveProximalPantsStations64";
import { resolvePublicPantsAnchors64 } from "./resolvePublicPantsAnchors64";

/** Economy ingress for a new public pants-curve epoch using V17 ownership.
 * Its cross-course dimensions are derived from public anchors and a common
 * neutral relation. The 3:4 aspect remains an explicit caller experiment.
 *
 * @author Samchon
 */
export function resolveAutoMoviePelvisPants64(props: {
  /** Previously resolved public physical Human measurements. */
  measurements: H;

  /** The same admitted rest skeleton used by the upstream torso. */
  skeleton: Skeleton;

  /** Actual resolved parent context used for waist decoding and port placement. */
  context: Context;

  /** Actual torso-owned waist position, phase and complete physical derivative operator. */
  upstream: ReadonlyMap<string, C.Boundary>;

  /** Optional named physical observations; explicit malformed scalar values reject. */
  additional?: Partial<Extra.Independent>;
}): ReturnType<typeof resolvePublicPantsAnchors64> & {
  /** Actual waist transformed into the native construction chart without refitting. */
  nativeWaist: C.Boundary;

  /** Limits of the adopted pants-domain convention, distinct from skin topology. */
  branchQualification: string;
} {
  const hasCrown: boolean = Object.prototype.hasOwnProperty.call(
    props.additional ?? {},
    "perinealCrownHeightMm",
  );
  const suppliedCrown: number | undefined =
    props.additional?.perinealCrownHeightMm;
  if (
    hasCrown &&
    (typeof suppliedCrown !== "number" || !Number.isFinite(suppliedCrown))
  )
    throw new Error(
      "A supplied perineal crown must be a finite number; omit the property for the default. Explicit undefined and null are not physical measurements.",
    );
  const additional: Partial<Extra.Independent> = { ...props.additional };
  const prior: ReturnType<typeof resolvePublicPantsAnchors64> =
    resolvePublicPantsAnchors64({ ...props, additional });
  const p: P.Input = structuredClone(prior.measurements),
    root: M.V = p.frame.origin_mm;
  const waist: C.Boundary = props.upstream.get("waist.midTube")!;
  const point: (v: C.Vector) => M.V = (v: C.Vector): M.V =>
    M.add(root, props.context.inversePoint("hips", v));
  const vector: (v: C.Vector) => M.V = (v: C.Vector): M.V =>
    M.clone(props.context.inverseDirection("hips", v));
  const nativeWaist: C.Boundary = {
    ...waist,
    section: {
      ...waist.section,
      spans: waist.section.spans.map(
        (s: C.Span): M.Span => s.map(point) as M.Span,
      ),
    },
    fullJ: waist.fullJ.map((s: C.Span): M.Span => s.map(vector) as M.Span),
    longitudinalAxis: vector(waist.longitudinalAxis),
  };
  p.mergedStations = p.mergedStations.filter(
    (s: P.MergedStation): boolean => s.name !== "canonicalWaist",
  );
  const buttock: P.MergedStation = p.mergedStations.find(
    (s: P.MergedStation): boolean => s.name === "buttockMaximum",
  )!;
  const crest: P.MergedStation = p.mergedStations.find(
    (s: P.MergedStation): boolean => s.name === "iliacCrest",
  )!;
  const navel: P.MergedStation = p.mergedStations.find(
    (s: P.MergedStation): boolean => s.name === "navel",
  )!;
  const yb: number = buttock.heightFromFrame_mm,
    yc: number = crest.heightFromFrame_mm,
    yw: number = nativeWaist.section.spans[0]![0][1] - root[1],
    yn: number = navel.heightFromFrame_mm;
  // The crest is a real bony-envelope anchor. Reconcile the inferred navel
  // width against it before interpolation instead of inserting a narrow notch.
  const navelBreadth: number =
    yn <= yc
      ? 2 * buttock.leftHalfBreadth_mm +
        ((yn - yb) / (yc - yb)) *
          (2 * crest.leftHalfBreadth_mm - 2 * buttock.leftHalfBreadth_mm)
      : 2 * crest.leftHalfBreadth_mm +
        ((yn - yc) / (yw - yc)) *
          (props.measurements.identity.body.waistBreadth -
            2 * crest.leftHalfBreadth_mm);
  const navelHalfBreadthMm: number = navelBreadth / 2;
  navel.rightHalfBreadth_mm = navelHalfBreadthMm;
  navel.leftHalfBreadth_mm = navelHalfBreadthMm;
  const floor: number = root[1] + p.mergedStations[0]!.heightFromFrame_mm;
  const upperLength: number =
    (props.skeleton.joints.find(
      (j: Skeleton.IJoint): boolean => j.bone === "leftUpperLeg",
    )!.position.y -
      props.skeleton.joints.find(
        (j: Skeleton.IJoint): boolean => j.bone === "leftLowerLeg",
      )!.position.y +
      (props.skeleton.joints.find(
        (j: Skeleton.IJoint): boolean => j.bone === "rightUpperLeg",
      )!.position.y -
        props.skeleton.joints.find(
          (j: Skeleton.IJoint): boolean => j.bone === "rightLowerLeg",
        )!.position.y)) /
    2;
  // The neutral crown convention is anchored to the actual skeleton, never
  // moved by a later choice of lower disjoint construction-chart domain.
  const crown: number = hasCrown
    ? suppliedCrown!
    : root[1] - 0.13 * upperLength;
  const near: number = 2 * crown - floor;
  if (!(crown > near && crown < floor))
    throw new Error(
      "The pants chart requires its median crown inside the actual near-to-floor height band",
    );
  prior.independent.perinealCrownHeightMm = crown;
  p.roof = {
    ...p.roof,
    sagDropFromBodyFloor_mm: floor - crown,
    medianEndHeightScale_mm: 2 * (floor - crown),
    entryTangentialRoundingRatio: 0.5,
    // This gives K=-2*(crown-near). At the low course its Y law is the
    // monotone quadratic crown-(crown-near)*lambda^2, not a forced skin event.
    lowRoofQuarterHeightAboveMedian_mm: -(crown - near) / 4,
  };
  delete p.roof.anteriorSweepEntryFrontFromFrame_mm;
  delete p.roof.anteriorSweepQuarterHeightFromFrame_mm;
  const fan: S.Fan = S.fan(
    p,
    nativeWaist.section.spans as M.Span[],
    nativeWaist.fullJ as M.Span[],
    (v: M.V): M.V => M.clone(v),
  );
  const expanded: ReturnType<typeof S.expand> = S.expand(
    nativeWaist.section.spans as M.Span[],
    nativeWaist.section.phaseIntervals.map((v: number): number => v * 12),
    nativeWaist.fullJ as M.Span[],
    "interior-v17",
  );
  const apply: (power: number) => M.Span[] = (power: number): M.Span[] => {
    p.lanes.posterior = [2 ** (-1 / power), 2 ** (-1 / power)];
    for (const station of p.mergedStations) {
      station.innerAnteriorSupport = {} as NonNullable<
        P.MergedStation["innerAnteriorSupport"]
      >;
      station.outerAnteriorTransition = {} as NonNullable<
        P.MergedStation["outerAnteriorTransition"]
      >;
      for (const side of ["left", "right"] as const) {
        const y: number = root[1] + station.heightFromFrame_mm;
        const rx: number = station.leftHalfBreadth_mm,
          center: number = station.leftLateralFrontOffset_mm,
          rz: number = station.medianFrontOffset_mm - center;
        const lane: number = Math.abs(S.fanValue(fan, y, side) - root[0]);
        const depth: (x: number) => number = (x: number): number =>
          center + rz * (1 - (x / rx) ** power) ** (1 / power);
        const slope: (x: number) => number = (x: number): number =>
          ((-(side === "left" ? 1 : -1) * rz) / rx) *
          (x / rx) ** (power - 1) *
          (1 - (x / rx) ** power) ** (1 / power - 1);
        station[
          side === "left"
            ? "leftAnteriorFrontOffset_mm"
            : "rightAnteriorFrontOffset_mm"
        ] = depth(lane);
        station.innerAnteriorSupport[side] = {
          lateralFractionMedianToAnteriorLane: 0.5,
          frontOffsetFromFrame_mm: depth(lane / 2),
          depthSlope_dZ_dX: slope(lane / 2),
        };
        station.outerAnteriorTransition[side] = {
          lateralFractionInnerToAnteriorLane: 0.5,
          depthSlope_dZ_dX: slope(lane * 0.75),
        };
      }
    }
    return S.station(
      p,
      p.mergedStations[1]!,
      expanded.widths,
      fan,
      "interior-v17",
    );
  };
  const target: number = props.measurements.identity.body.buttockCircumference;
  let lo: number = 1,
    hi: number = 16;
  const low: number = Observation.tapeMm(apply(lo)),
    high: number = Observation.tapeMm(apply(hi));
  if (!(low <= target && target <= high))
    throw new Error(
      "Independent buttock anchors leave the actual sixteen-span pants rounding family",
    );
  for (let i: number = 0; i < 48; i++) {
    const mid: number = (lo + hi) / 2;
    if (Observation.tapeMm(apply(mid)) < target) lo = mid;
    else hi = mid;
  }
  const power: number = (lo + hi) / 2,
    section: M.Span[] = apply(power);
  const domain: ReturnType<typeof resolveProximalPantsStations64> =
    resolveProximalPantsStations64(
      p,
      S.station(p, p.mergedStations[0]!, expanded.widths, fan, "interior-v17"),
      crown,
    );
  const diagnostics: object = {
    inputProtocol: prior.diagnostics,
    branchDomain: domain,
    pantsSquarenessPower: power,
    actualButtockExtremaMm: Observation.boundsMm(section),
    actualTape256Mm: Observation.tapeMm(section),
    actualTape1024Mm: Observation.tapeMm(section, 1024),
    nearY: near,
    floorY: floor,
    medianCrownY: crown,
    exteriorPolicy:
      "Single merged levels above floor. Proximal open-arc supports derive from the common crown, body-floor envelope and unchanged midpoint tube. Upper paired sections are construction for exact trim, never independently emitted closed exterior rings. The midpoint thigh is the sole downstream tube port.",
  };
  return {
    ...prior,
    measurements: p,
    diagnostics,
    nativeWaist,
    branchQualification:
      "New public base-form pants operator from the actual V17 ownership equations. Native-source V17 form acceptance, complete critical connectivity, injectivity and final visual approval do not transfer.",
  };
}
