import {
  AutoMoviePchip64,
  type IAutoMovieCurve64 as C,
  type AutoMovieCurveParentContext as Context,
} from "@automovie/engine";

import type { IAutoMovieHumanMeasurements as H } from "../../../measure/IAutoMovieHumanMeasurements";
import type { IAutoMovieHumanSkeleton as S } from "../../../skeleton/IAutoMovieHumanSkeleton";
import type { IAutoMovieHumanIdentity as I } from "../../../structures/IAutoMovieHumanIdentity";
import type { IAutoMovieLegMeasurements as M } from "../family/IAutoMovieLegMeasurements";
import { AutoMovieLegIdentityRules64 as R } from "./AutoMovieLegIdentityRules64";
import { AutoMovieLegSupportProfile64 } from "./AutoMovieLegSupportProfile64";
import type { IAutoMovieLegIdentityBridge64 as B } from "./IAutoMovieLegIdentityBridge64";

/** Resolve public girths, lengths and optional dimensions into physical courses.
 * A single matching 55-bone specimen supplies joints and patella/tibiale offsets.
 * The actual pelvis cut owns placement and full J; its breadth/depth ratio is
 * inherited unless overridden. Positive dimensions and descending proxy planes
 * are checked, but these guards do not establish anatomical population validity.
 * Complete pole/handle jets preserve one generating family. Thigh dimensions
 * reuse the pelvis girth law, and patellar height never substitutes for width.
 * Calf contour staggering is an explicit authoring prior, not individual
 * muscle/fat relief or a resolved patellar/condylar cross-sectional model.
 *
 * @author Samchon
 */
export function resolveAutoMovieLegIdentity64(props: {
  /** Resolved public per-side girths and clinical lengths, in millimetres. */
  measurements: H;

  /** Same specimen's 55-bone rest skeleton and existing patella/tibiale landmarks. */
  skeleton: S;

  /** Proper parent placement for the actual straight upper-leg, shank and foot chain. */
  context: Context;

  /** Bound left/right.thigh.midTube operators, owned by pelvis. */
  upstream: ReadonlyMap<string, C.Boundary>;

  /** Independent per-side geometry; every supplied value must be finite and positive. */
  additional?: Partial<Record<"left" | "right", Partial<B.Independent>>>;
}): Record<
  "left" | "right",
  {
    /** Derived physical courses and current-bone registration consumed by the family. */
    detailed: M.Detailed;

    /** Effective physical values after public-derived defaults and caller overrides. */
    independent: B.Independent;

    /** Actual or explicitly conventional longitudinal levels relative to hip, mm. */
    physicalLevelsFromHipMm: Record<string, number>;
  }
> {
  const result: Partial<ReturnType<typeof resolveAutoMovieLegIdentity64>> = {};
  if (props.skeleton.joints.length !== 55)
    throw new Error("The actual complete 55-bone rest skeleton is required");
  for (const side of ["left", "right"] as const) {
    const leg: I.ILeg =
      side === "left"
        ? props.measurements.identity.body.leftLeg
        : props.measurements.identity.body.rightLeg;
    if (
      ![
        leg.thighLength,
        leg.shankLength,
        leg.footLength,
        leg.thighCircumference,
        leg.lowerThighCircumference,
        leg.calfCircumference,
        leg.ankleCircumference,
      ].every((v: number): boolean => Number.isFinite(v) && v > 0) ||
      !(
        leg.thighCircumference > leg.lowerThighCircumference &&
        leg.calfCircumference > leg.ankleCircumference
      )
    )
      throw new Error(
        "Positive public limb dimensions and distal girth taper required",
      );
    const bone: string = side + "UpperLeg";
    const knee: C.Vector = props.context.inversePoint(
      bone,
      props.context.point(side + "LowerLeg", [0, 0, 0]),
    );
    const ankle: C.Vector = props.context.inversePoint(
      bone,
      props.context.point(side + "Foot", [0, 0, 0]),
    );
    const upper: number = -knee[1];
    const lower: number = knee[1] - ankle[1];
    const joint: S.IJoint = props.skeleton.joints.find(
      (j: S.IJoint): boolean => j.bone === bone,
    )!;
    const marks: S["landmarks"]["left"] = props.skeleton.landmarks[side];
    const patellaY: number = marks.patella.position.y - joint.position.y;
    const tibialeY: number = marks.tibiale.position.y - joint.position.y;
    const patellaZ: number = marks.patella.position.z - joint.position.z;
    const proximal: C.Boundary | undefined = props.upstream.get(
      side + ".thigh.midTube",
    );
    if (!proximal || proximal.section.spans.length !== 4)
      throw new Error("Actual pelvis-owned four-pole thigh required");
    const poles: C.Vector[] = proximal.section.spans.map(
      (s: C.Span): C.Vector => props.context.inversePoint(bone, s[0]),
    );
    const center: C.Vector = [
      (poles[0]![0] + poles[2]![0]) / 2,
      poles[0]![1],
      (poles[1]![2] + poles[3]![2]) / 2,
    ];
    const ownerJets: C.Vector[] = proximal.fullJ.map(
      (s: C.Span): C.Vector => props.context.inverseDirection(bone, s[0]),
    );
    const ownerCenterJ: number = (ownerJets[1]![2] + ownerJets[3]![2]) / 2;
    const ownerAspect: number =
      Math.abs(poles[0]![0] - poles[2]![0]) /
      Math.abs(poles[1]![2] - poles[3]![2]);
    const input: B.Independent = {
      // The actual canonical owner owns the unresolved thigh shape prior.
      // Consume its physical ratio instead of duplicating a regional constant.
      thighBreadthOverDepth: ownerAspect,
      calfBreadthOverDepth: 1,
      // Equal-sex mean of older-adolescent minimum breadth/girth estimates
      // (.266390 male, .256611 female). Adult transfer and a coincident minimum
      // plane are assumptions: Snyder 1977 measures these minima separately.
      // https://math.nist.gov/~SRessler/anthrokids/data1977/descrip.htm
      ankleBreadthMm: 0.2615005 * leg.ankleCircumference,
      // These proxy and tissue-distribution coefficients are authoring
      // conventions, not observed clinical ratios or fitted per-gate values.
      patellaHeightMm: 0.1 * leg.thighLength,
      kneeCircumferenceMm: leg.lowerThighCircumference,
      // This default uses public suprapatellar girth, not a knee override.
      belowKneeCircumferenceMm:
        0.95 * Math.min(leg.lowerThighCircumference, leg.calfCircumference),
      // .74 extends an older-adolescent calf-level/stature estimate to adults;
      // Snyder 1977's maximum-calf height protocol does not establish this adult
      // joint-relative ratio. The caller can supply the measured height instead.
      calfMaximumHeightAboveAnkleMm: 0.74 * leg.shankLength,
      // Simple tube cut above a distinct virtual minimum; heights conventional.
      ankleMinimumHeightAboveJointMm: 0.04 * leg.footLength,
      ankleCutHeightAboveJointMm: 0.12 * leg.footLength,
      calfAnteriorReachMm:
        0.2 * R.cubicAxesFromCircumference(leg.calfCircumference).depthMm,
      ankleAnteriorReachMm:
        0.4 *
        R.cubicDepthFromGirthBreadth(
          leg.ankleCircumference,
          0.2615005 * leg.ankleCircumference,
        ),
      ...props.additional?.[side],
    };
    if (
      !Object.values(input).every(
        (v: number): boolean => Number.isFinite(v) && v > 0,
      ) ||
      upper <= 0 ||
      lower <= 0
    )
      throw new Error("Positive finite named leg dimensions required");
    const supra: number = patellaY + input.patellaHeightMm / 2;
    const minimum: number = ankle[1] + input.ankleMinimumHeightAboveJointMm;
    const cut: number = ankle[1] + input.ankleCutHeightAboveJointMm;
    const calf: number = ankle[1] + input.calfMaximumHeightAboveAnkleMm;
    const below: number = tibialeY - 0.06 * leg.shankLength;
    const furrow: number = -0.15 * upper;
    // Six percent below tibiale and fifteen percent below hip are conventional
    // proxy planes. The Native suffixes below retain ABI labels, not observations.
    const names: readonly M.StationName[] = [
      "vastusLateralisProxy",
      "thighLower",
      "vastusMedialisProxy",
      "aboveKnee",
      "kneeNative",
      "patellaInferior",
      "belowKnee",
      "calfLateralProxy",
      "calfNative",
      "calfMedialProxy",
      "lowerCalf",
      "ankleAbove",
    ];
    const lowerCalf: number = (calf + cut) / 2;
    const lowerThigh: number = (center[1] + supra) / 2;
    const levels: number[] = [
      (center[1] + lowerThigh) / 2,
      lowerThigh,
      (lowerThigh + supra) / 2,
      supra,
      patellaY,
      patellaY - input.patellaHeightMm / 2,
      below,
      calf + input.patellaHeightMm / 2,
      calf,
      calf - input.patellaHeightMm / 2,
      lowerCalf,
      cut,
    ];
    if (
      !(
        furrow > center[1] &&
        center[1] > levels[0]! &&
        levels.every(
          (y: number, i: number): boolean => i === 0 || y < levels[i - 1]!,
        ) &&
        cut > minimum &&
        minimum > ankle[1]
      )
    )
      throw new Error(
        "Proxy planes must descend from actual thigh cut to a separate above-minimum ankle cut",
      );
    const thighAxes: ReturnType<typeof R.cubicAxesFromCircumference> =
      R.cubicAxesFromCircumference(
        leg.thighCircumference,
        input.thighBreadthOverDepth,
      );
    const cutAxes: ReturnType<typeof R.cubicAxesFromCircumference> =
      R.cubicAxesFromCircumference(
        R.resolveLegGirth64(
          leg,
          { hipY: 0, kneeY: knee[1], patellaY },
          center[1],
          input.patellaHeightMm,
        ),
        input.thighBreadthOverDepth,
      );
    const supraAxes: ReturnType<typeof R.cubicAxesFromCircumference> =
      R.cubicAxesFromCircumference(
        leg.lowerThighCircumference,
        input.thighBreadthOverDepth,
      );
    const kneeAxes: ReturnType<typeof R.cubicAxesFromCircumference> =
      R.cubicAxesFromCircumference(
        input.kneeCircumferenceMm,
        input.thighBreadthOverDepth,
      );
    const calfAxes: ReturnType<typeof R.cubicAxesFromCircumference> =
      R.cubicAxesFromCircumference(
        leg.calfCircumference,
        input.calfBreadthOverDepth,
      );
    const belowAxes: ReturnType<typeof R.cubicAxesFromCircumference> =
      R.cubicAxesFromCircumference(
        input.belowKneeCircumferenceMm,
        input.calfBreadthOverDepth,
      );
    const ankleDepth: number = R.cubicDepthFromGirthBreadth(
      leg.ankleCircumference,
      input.ankleBreadthMm,
    );
    if (
      !(
        input.calfAnteriorReachMm < calfAxes.depthMm &&
        input.ankleAnteriorReachMm < ankleDepth &&
        patellaZ > 0 &&
        patellaZ <
          Math.min(kneeAxes.depthMm, supraAxes.depthMm, belowAxes.depthMm)
      )
    )
      throw new Error(
        "Bone axis and patellar projection must lie inside the declared base sections",
      );
    const anchors: { y: number; w: number; d: number; z: number }[] = [
      {
        y: minimum,
        w: input.ankleBreadthMm,
        d: ankleDepth,
        z: input.ankleAnteriorReachMm - ankleDepth / 2,
      },
      {
        y: calf,
        w: calfAxes.breadthMm,
        d: calfAxes.depthMm,
        z: input.calfAnteriorReachMm - calfAxes.depthMm / 2,
      },
      {
        y: below,
        w: belowAxes.breadthMm,
        d: belowAxes.depthMm,
        z: patellaZ - belowAxes.depthMm / 2,
      },
      {
        y: patellaY,
        w: kneeAxes.breadthMm,
        d: kneeAxes.depthMm,
        z: patellaZ - kneeAxes.depthMm / 2,
      },
      {
        y: supra,
        w: supraAxes.breadthMm,
        d: supraAxes.depthMm,
        z: patellaZ - supraAxes.depthMm / 2,
      },
      { y: center[1], w: cutAxes.breadthMm, d: cutAxes.depthMm, z: center[2] },
      { y: furrow, w: thighAxes.breadthMm, d: thighAxes.depthMm, z: 0 },
    ];
    const ys: number[] = anchors.map(
      (a: (typeof anchors)[number]): number => a.y,
    );
    // Reuse the pelvis girth law above supra. At fixed aspect its breadth and
    // depth are linear too; a separate PCHIP must not flatten this transition
    // into a long tube next to an owner constructed from the linear law.
    const dimension: (key: "w" | "d") => AutoMoviePchip64 = (
      key: "w" | "d",
    ): AutoMoviePchip64 => {
      const values: number[] = anchors.map(
        (a: (typeof anchors)[number]): number => a[key],
      );
      const jets: number[] = AutoMoviePchip64.slopes(ys, values);
      const slope: number = (values.at(-1)! - values[4]!) / (furrow - supra);
      for (let i: number = 4; i < jets.length; i++) jets[i] = slope;
      return new AutoMoviePchip64(ys, values, jets);
    };
    const w: AutoMoviePchip64 = dimension("w");
    const d: AutoMoviePchip64 = dimension("d");
    const z: AutoMoviePchip64 = new AutoMoviePchip64(
      ys,
      anchors.map((a: (typeof anchors)[number]): number => a.z),
    );
    const profile: AutoMovieLegSupportProfile64 =
      new AutoMovieLegSupportProfile64({
        breadth: w,
        depth: d,
        center: z,
        heights: levels,
        proximal: center[1],
        proximalCenter: center[2],
        proximalCenterJ: ownerCenterJ,
        calf,
        patella: patellaY,
        supra,
        furrow,
        below,
        patellaHeight: input.patellaHeightMm,
        patellaReach: patellaZ,
      });
    const kappa: number = (4 * (Math.sqrt(2) - 1)) / 3;
    // The previous simple ankle law is the owned connection contract. Resolve
    // its endpoint jet from the same three physical dimension courses, rather
    // than allowing newly inserted proximal feature courses to reseed it.
    const distalYs: number[] = [cut, lowerCalf, calf];
    const distalSlope: (value: (y: number) => number) => number = (
      value: (y: number) => number,
    ): number => AutoMoviePchip64.slopes(distalYs, distalYs.map(value))[0]!;
    const distalWidth: number = distalSlope((y: number): number => w.at(y)) / 2;
    const distalCenter: number = distalSlope((y: number): number => z.at(y));
    const distalAnterior: number = distalSlope(
      (y: number): number => z.at(y) + d.at(y) / 2,
    );
    const distalPosterior: number = distalSlope(
      (y: number): number => z.at(y) - d.at(y) / 2,
    );
    const distalHandleDepth: number = distalSlope(
      (y: number): number =>
        kappa *
        Math.min(
          z.at(y) + d.at(y) / 2 - z.at(y),
          z.at(y) - (z.at(y) - d.at(y) / 2),
        ),
    );
    const distalHandleWidth: number = distalSlope(
      (y: number): number => (kappa * w.at(y)) / 2,
    );
    const stations: M.Station[] = levels.map(
      (y: number, i: number): M.Station => {
        const support: ReturnType<AutoMovieLegSupportProfile64["at"]> =
          profile.at(y);
        const jet: ReturnType<AutoMovieLegSupportProfile64["at"]> = profile.at(
          y,
          true,
        );
        // Patella height supplies a longitudinal extent, not an unmeasured
        // transverse kneecap width. Keep the resolved girth oval instead of
        // narrowing an anterior handle and scaling the entire knee to repay it.
        const breadth: number = w.at(y);
        const breadthJ: number = w.at(y, true);
        const widthJ: number = breadthJ / 2;
        const handles: M.Four = [
          (kappa * support.depth) / 2,
          (kappa * breadth) / 2,
          (kappa * support.depth) / 2,
          (kappa * breadth) / 2,
        ];
        const handleJ: M.Four = [
          (kappa * jet.depth) / 2,
          (kappa * breadthJ) / 2,
          (kappa * jet.depth) / 2,
          (kappa * breadthJ) / 2,
        ];
        const terminal: boolean = i === levels.length - 1;
        const poles: readonly [C.Vector, C.Vector, C.Vector, C.Vector] =
          terminal
            ? [
                [distalWidth, 1, distalCenter],
                [0, 1, distalAnterior],
                [-distalWidth, 1, distalCenter],
                [0, 1, distalPosterior],
              ]
            : [
                [jet.centerX + widthJ, 1, jet.centerZ],
                [jet.centerX, 1, jet.centerZ + jet.depth / 2],
                [jet.centerX - widthJ, 1, jet.centerZ],
                [jet.centerX, 1, jet.centerZ - jet.depth / 2],
              ];
        return {
          name: names[i]!,
          sourceFractionProximalToDistal: (center[1] - y) / (center[1] - cut),
          breadthMm: breadth,
          depthMm: support.depth,
          centerSourceFrameTransverseMm: [support.centerX, support.centerZ],
          outerSagittalPhase: 0,
          anteriorLateralPhase: 0,
          innerSagittalPhase: 0,
          posteriorLateralPhase: 0,
          roundingHandleMm: handles,
          physicalSupportDerivatives: [
            poles[0][0],
            poles[1][2],
            poles[2][0],
            poles[3][2],
          ],
          physicalPoleDerivatives: poles,
          physicalHandleDerivatives: terminal
            ? [
                distalHandleDepth,
                distalHandleWidth,
                distalHandleDepth,
                distalHandleWidth,
              ]
            : handleJ,
        };
      },
    );
    // These legacy-named calibration fields now describe the actual straight
    // bone chart; no native mesh origin or former gate calibration is copied.
    result[side] = {
      detailed: {
        calibration: {
          sourceHipToKneeMm: [0, -upper, 0],
          sourceHipToAnkleMm: [0, -upper - lower, 0],
          sourceBoneArcLengthsMm: {
            left: [upper, lower],
            right: [upper, lower],
          },
          sourceFrameOriginFromHipMm: [0, 0, 0],
          sourceFrameBasisColumns: [
            [1, 0, 0],
            [0, 1, 0],
            [0, 0, 1],
          ],
          sourceOriginRelativeToProximalCutMm: [
            -(side === "left" ? 1 : -1) * center[0],
            -center[1],
            -center[2],
          ],
          sourceRangeYFromHipMm: [cut, center[1]],
        },
        stations,
      },
      independent: input,
      physicalLevelsFromHipMm: {
        proximal: center[1],
        supraProxy: supra,
        patella: patellaY,
        tibiale: tibialeY,
        calfMaximumProxy: calf,
        ankleCut: cut,
        ankleMinimumProxy: minimum,
        furrowProxy: furrow,
      },
    };
  }
  return result as ReturnType<typeof resolveAutoMovieLegIdentity64>;
}
