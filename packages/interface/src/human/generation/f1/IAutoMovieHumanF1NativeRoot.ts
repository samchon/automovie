import type { AutoMovieVector3Tuple } from "../../../geometry/AutoMovieVector3Tuple";
import type { IAutoMovieConstructionPointSeed } from "../../../construction/IAutoMovieConstructionPointSeed";
import type { IAutoMovieConstructionPortLoop } from "../../../construction/IAutoMovieConstructionPortLoop";
import type { IAutoMovieLoftSectionFrame } from "../../../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieSolidSurface } from "../../../construction/IAutoMovieSolidSurface";
import type { IAutoMovieViewAxis } from "../../../construction/IAutoMovieViewAxis";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";

/**
 * Native root controls, original-source calibration and inspection data.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Native root controls, original-source calibration and inspection data.
 * @evidence contracts/development/design.md#principled-representation Physical source positions use millimetres and chart angles use radians. Each observation has its own clock and derivative scope.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1NativeRootLaw and AutoMovieHumanF1NativeRootLevel produce and consume these contracts for Human assembly and inspection.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Observed values, discarded targets and unavailable reads remain distinct.
 */
export namespace IAutoMovieHumanF1NativeRoot {
  /**
   * Paired original and changed world controls for one root.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Paired original and changed world controls for one root.
   * @evidence contracts/development/design.md#principled-representation The three point sequences are in world millimetres and share the original clock order. The basis and scale identify the original child axes and their dimensionless caliper ratios.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The native root control and contact producers compare the same paired points.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Equal sequence lengths and correspondence ownership remain runtime premises.
   */
  export interface ITargets {
    /** Original parent controls in their original clock order. */
    parent: readonly AutoMovieVector3Tuple[];
    /** Original child controls under the declared original clock correspondence. */
    child: readonly AutoMovieVector3Tuple[];
    /** Changed complete wall evaluated at the original parent native addresses. */
    wall: readonly AutoMovieVector3Tuple[];
    /** Original child-caliper basis, expressed in the fixed figure frame. */
    basis: IAutoMovieLoftSectionFrame;
    /** Independent positive depth and breadth ratios. */
    scale: readonly [number, number];
  }

  /**
   * Parent and child target control curves on their declared root clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Parent and child target control curves on their declared root clock.
   * @evidence contracts/development/design.md#principled-representation Both control sequences carry world positions in millimetres and must share a control count.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Native root construction reports both target curves for its clock transport and residual observations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Targets retain their identity independently of the actual parent and child source jets.
   */
  export interface ICurves {
    /** Target parent world controls. */
    parent: AutoMovieVector3Tuple[];
    /** Target child world controls. */
    child: AutoMovieVector3Tuple[];
  }

  /**
   * The original native parent and child definition of one root.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The original native parent and child definition of one root.
   * @evidence contracts/development/design.md#principled-representation Part readers use physical millimetres. The radial loop uses metres/radians, and rail stations use millimetres. Clock correspondence is closed to angle or length.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The native root calibration consumes the immutable original boundary and source control record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Explicit target calipers and basis retain their construction scope without inferred clinical measures.
   */
  export interface IOriginal {
    /** Qualified root identity, used in diagnostics only. */
    name: string;
    /** Complete original parent/child native definitions in actual production scope. */
    parent: IAutoMovieViewPart;
    /** Original complete child world curve in the declared paired clock, mm. */
    child: IAutoMovieViewPart;
    /** Original radial parent controls in public metres/radians. */
    loop: IAutoMovieConstructionPortLoop;
    /** Absolute original rail stations at uniform child phases, physical mm; one value means a junction. */
    rails: readonly number[];
    /** Existing operator column count and clock correspondence. */
    count: number;
    /** Existing angle or arclength pairing; no newly fitted port clock. */
    correspondence: "angle" | "length";
    /** Explicit original bare caliper inputs and their native station; these are qualified source inputs, not clinical observations. */
    metric: {
      /** Named original material station, mm; never inferred from the frame. */
      station: number;
      /** Bare source depth at that site, mm, positive. */
      depth: number;
      /** Bare source breadth at that site, mm, positive. */
      breadth: number;
    };
    /** Original child-caliper frame, used as a construction clock and directional basis, not a skin datum. */
    basis: IAutoMovieLoftSectionFrame;
  }

  /**
   * Original source calibration shared by one native-root preparation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Original source calibration shared by one native-root preparation.
   * @evidence contracts/development/design.md#principled-representation The chart controls use millimetres and radians. World samples use millimetres and the unwrapped child phases use radians. The rail callback reads child phases and returns millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Native root resolution reuses the calibration established by its original source readers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The result is borrowed during the invocation. Array length and clock consistency are the calibrator's responsibility.
   */
  export interface ICalibration {
    /** Reused original elliptic-radius levels and available radial derivatives. */
    level: ILevelOriginal;
    /** Complete immutable original control and clock definition. */
    input: IOriginal;
    /** Original parent native station/phase addresses, mm/radians. */
    charts: [number, number][];
    /** Original complete parent world curve, in clock order, mm. */
    parent: AutoMovieVector3Tuple[];
    /** Original complete child world curve in the declared paired clock, mm. */
    child: AutoMovieVector3Tuple[];
    /** Original operator correspondence phases, unwrapped radians. */
    childPhases: number[];
    /**
     * Original source-owned rail station at child phase, physical mm.
     *
     * @evidence contracts/development/common.md#meaningful-documentation World-space child rail station for an unwrapped phase, in physical millimetres.
     */
    childRail: (phase: number) => number;
  }

  /**
   * Root clock correspondence and actual positions at one emitted column.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Root clock correspondence and actual positions at one emitted column.
   * @evidence contracts/development/design.md#principled-representation Addresses carry millimetres and radians, world points and residual vectors use millimetres, and the level observation is dimensionless.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The native root spec and its inspection consumers read the original target and actual evaluations together.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Actual data and discarded affine targets remain separately identified. The residuals carry no geometric acceptance threshold.
   */
  export interface IRootRow {
    /** Actual parent-source level and branch observation; independent of old affine targets. */
    level: ILevelColumn;
    /** Emitted radial column clock, radians. */
    clock: number;
    /** Inverse address in the original target control parameter, radians. */
    sourceClock: number;
    /** Actual emitted parent station/phase address, mm/radians. */
    parentAddress: [number, number];
    /** Issued actual child rail station and operator-correspondence phase, mm/radians. */
    targetChildAddress: [number, number];
    /** Discarded affine-hypothesis parent target, world mm; never a new membership constraint. */
    targetParent: AutoMovieVector3Tuple;
    /** Discarded affine-hypothesis child target at the original clock, world mm. */
    targetChild: AutoMovieVector3Tuple;
    /** Actual complete parent point at the emitted address, world mm. */
    actualParent: AutoMovieVector3Tuple;
    /** Actual candidate child point on the emitted rail at the target phase, world mm. */
    actualChild: AutoMovieVector3Tuple;
    /** Actual parent minus discarded affine target, world mm. */
    eC: AutoMovieVector3Tuple;
    /** Actual child minus discarded affine target, world mm. */
    eQ: AutoMovieVector3Tuple;
    /** eQ minus eC at the same original target parameter, world mm. */
    pairedGap: AutoMovieVector3Tuple;
  }

  /**
   * Native port and dependent cutter controls emitted by one original-source invocation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Native port and dependent cutter controls emitted by one original-source invocation.
   * @evidence contracts/development/design.md#principled-representation Port controls use metres and radians. Child rail stations and distances use millimetres. Inspect and seed operate on the actual named sources.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1 and its inspection tools consume the same port and seed transport controls.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The unchanged flag concerns the local source binding. The port operator owns geometric admission.
   */
  export interface IRootSpec {
    /** Local original boundary/source controls, not a whole-person identity selector. */
    unchanged: boolean;
    /** Generated radial parent controls in public metres/radians. */
    loop: IAutoMovieConstructionPortLoop;
    /** Generated absolute native child rail station controls, physical mm. */
    railStations: number[];
    /** The same stations relative to the actual child source bottom, physical mm. */
    railDistances: number[];
    /** Complete conservative range of the emitted periodic rail, physical mm. */
    range: readonly [number, number];
    /** Original-clock actual-source and discarded-target observations, with no geometric acceptance claim. */
    rows: IRootRow[];
    /** Explicit approximation and unavailable acceptance-budget statement. */
    qualification: string;
    /**
     * Re-read the actual final source; target jets are never substituted.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Reads actual source jets at addresses emitted by this root.
     */
    inspect: (part: IAutoMovieViewPart) => IInspection[];
    /**
     * Original physical search controls for unchanged bindings; changed roots issue a separate named chart prior.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Transports the original cutter search using the paired native source definitions.
     */
    seed: (
      original: IAutoMovieViewPart,
      current: IAutoMovieViewPart,
      seed: ISeed,
    ) => ISeedTransport;
  }

  /**
   * A cutter's fixed-phase search line in its original material interval.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A cutter's fixed-phase search line in its original material interval.
   * @evidence contracts/development/design.md#principled-representation The phase is in radians and both endpoints are dimensionless shares of the source interval. The producer checks their domain and order.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The native root seed transport copies the original binding or converts it to a changed chart address.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A fixed-phase line is a qualified source prior with its own two endpoints.
   */
  export interface ISeed {
    /** Original fixed cutter phase, radians on its declared branch. */
    phase: number;
    /** Original start share of the cutter native domain. */
    from: number;
    /** Original end share of the cutter native domain. */
    to: number;
  }

  /**
   * Controls issued for one cutter search and their source-clock evidence.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Controls issued for one cutter search and their source-clock evidence.
   * @evidence contracts/development/design.md#principled-representation Chart addresses use station millimetres and phase radians. Target, actual and residual points use world millimetres. Null denotes an unavailable source clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The root builder and capture diagnostics share the transported line, optional chart seed and its observations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The result describes the original and current controls without asserting a geometric acceptance condition.
   */
  export interface ISeedTransport {
    /** Primary named source-chart input for a changed dependent cutter. */
    pointSeed?: IAutoMovieConstructionPointSeed;
    /** Literal original root/cutter material binding survives. */
    unchanged: boolean;
    /** Transported fixed-phase search line and material-window shares. */
    seed: ISeed;
    /** Original and transported endpoint/midpoint controls with world residuals and original root clocks. */
    controls: {
      original: [number, number];
      actual: [number, number];
      target: AutoMovieVector3Tuple;
      point: AutoMovieVector3Tuple;
      residual: AutoMovieVector3Tuple;
      sourceClock: number | null;
    }[];
    /** Explicit approximation and unavailable acceptance-budget statement. */
    qualification: string;
  }

  /**
   * One root's candidate source axes and deferred resolution.
   *
   * @evidence contracts/development/common.md#meaningful-documentation One root's candidate source axes and deferred resolution.
   * @evidence contracts/development/design.md#principled-representation Each axis retains its existing material station in millimetres. The resolver consumes the actual candidate view source.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The native root builder prepares axes once and resolves one named root when the source is available.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Preparation remains independent of the later rail or operator result.
   */
  export interface IPrepared {
    /** Range-independent complete candidate course with the original oriented section bases. */
    axis: IAutoMovieViewAxis.IAxis;
    /**
     * Same explicit affine candidate policy for dependent cutter courses.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Applies the candidate's affine axis policy to the cutter axis.
     */
    cutterAxis: (axis: IAutoMovieViewAxis.IAxis) => IAutoMovieViewAxis.IAxis;
    /**
     * Generate actual radial/phase controls once from the supplied complete candidate source.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Resolves radial and phase controls from one admitted native candidate.
     */
    resolve: (candidate: IAutoMovieViewPart) => IRootSpec;
  }

  /**
   * The value and first two derivatives of a target curve on the original root clock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The value and first two derivatives of a target curve on the original root clock.
   * @evidence contracts/development/design.md#principled-representation The value is in world millimetres and derivatives are per radian and per radian squared.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Native root diagnostics read the paired target-curve jets to describe the original target.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Actual physical source derivatives use their own type and coordinates.
   */
  export interface IClockJet {
    /** World position, mm. */
    p: AutoMovieVector3Tuple;
    /** First derivative in original target clock radians, mm/radian. */
    first: AutoMovieVector3Tuple;
    /** Second derivative in original target clock radians, mm/radian squared. */
    second: AutoMovieVector3Tuple;
  }

  /**
   * A signed residual projected on a regular source normal and tangent plane, or an explicit unavailable reason.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A signed residual projected on a regular source normal and tangent plane, or an explicit unavailable reason.
   * @evidence contracts/development/design.md#principled-representation The signed normal magnitude and tangent vector use world millimetres. The union separates a projection from an unavailable reading.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Native root inspection reports projection at the parent, candidate and final sources.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts An unavailable source cannot be replaced by a zero residual.
   */
  export type IProjection =
    | { normal: number; tangent: AutoMovieVector3Tuple }
    | { unavailable: string };

  /**
   * A root inspection column with source jets and residuals available.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A root inspection column with source jets and residuals available.
   * @evidence contracts/development/design.md#principled-representation The available discriminant accompanies actual physical derivatives, target-clock derivatives and the respective residuals in their documented units.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Native root resolution publishes this variant for consumers that report protected source and target observations.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record distinguishes target, candidate and final original-source reads.
   */
  export interface IInspected extends IRootRow {
    /** The full source2 capabilities used by this row are available. */
    kind: "available";
    /** New target-curve clock2, distinct from physical source derivatives. */
    targetClock2: { parent: IClockJet; child: IClockJet };
    /** Emitted rail station minus the raw desired native station, mm. */
    railReclockStationResidualMm: number;
    /** Residual normal/tangent parts at their own actual parent/candidate/final source. */
    normalAndTangent: {
      parent: IProjection;
      candidate: IProjection;
      final: IProjection;
    };
    /** Actual complete parent physical2 in station-mm/phase-radian coordinates. */
    physicalParent2: IAutoMovieSolidSurface.IJet;
    /** Actual complete provisional candidate physical2 in the same coordinate units. */
    physicalCandidate2: IAutoMovieSolidSurface.IJet;
    /** Actual complete final source physical2; unavailable orders are not filled. */
    physicalFinal2: IAutoMovieSolidSurface.IJet;
    /** Final minus candidate, by physical derivative order and its own units. */
    protectedSourceSigned: IAutoMovieSolidSurface.IJet;
    /** Target residuals of the provisional candidate, world mm. */
    candidateResidual: { eC: AutoMovieVector3Tuple; eQ: AutoMovieVector3Tuple; pairedGap: AutoMovieVector3Tuple };
    /** Target residuals of the actual final source, world mm. */
    finalResidual: { eC: AutoMovieVector3Tuple; eQ: AutoMovieVector3Tuple; pairedGap: AutoMovieVector3Tuple };
    /** Actual physical versus new-target/normalized-operator derivative conventions. */
    units: string;
  }

  /**
   * A root inspection column whose physical source derivatives are unavailable.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A root inspection column whose physical source derivatives are unavailable.
   * @evidence contracts/development/design.md#principled-representation The unavailable discriminant carries the original row and the reason for the missing source reading.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Native root inspection consumers can retain the source clock while displaying its unavailable outcome.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record supplies no fabricated physical derivatives.
   */
  export interface IUnavailable extends IRootRow {
    /** Missing physical source2 remains explicit. */
    kind: "unavailable";
    /** Original reader/admission failure, without a fabricated zero derivative. */
    unavailable: string;
  }

  /**
   * The closed outcome of reading one emitted root column.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The closed outcome of reading one emitted root column.
   * @evidence contracts/development/design.md#principled-representation The discriminant separates available physical source observations from a diagnostic-only column with the same root address.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Native root inspection exposes this union to capture and source-check consumers.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Numerical availability and geometric admission are separate observations.
   */
  export type IInspection = IInspected | IUnavailable;

  /**
   * Original elliptic-radius level controls for one root, with observed radial derivatives.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Original elliptic-radius level controls for one root, with observed radial derivatives.
   * @evidence contracts/development/design.md#principled-representation The metric uses millimetres and the levels are dimensionless. Missing derivatives carry explicit reasons per source control.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1NativeRootLevel publishes the original controls to the root calibration that reuses them.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The underlying physical caliper metric shares the root input representation. Missing derivatives keep a null slot.
   */
  export interface ILevelOriginal {
    /** Source metric, mm, with no clinical interpretation added. */
    metric: IOriginal["metric"];
    /** Original dimensionless radius level at every original parent control. */
    levels: number[];
    /** Actual derivative in original radial chart share, or null if unavailable. */
    derivatives: (number | null)[];
    /** Exact source failure for an unavailable derivative, otherwise null. */
    unavailable: (string | null)[];
  }

  /**
   * Source-domain evidence for one generated radial root control.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Source-domain evidence for one generated radial root control.
   * @evidence contracts/development/design.md#principled-representation Radial shares, reference levels and residuals are dimensionless. The bracket is ordered on the original chart ray or null when direct reuse applies.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The level solver produces a row per clock so the root result can trace its source membership.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The row records a solved branch and residual. Geometric acceptance remains a separate operator decision.
   */
  export interface ILevelColumn {
    /** Original radial share and the newly solved share. */
    originalShare: number;
    /** Generated radial share on the same declared chart ray. */
    share: number;
    /** Original level, actual level and their signed dimensionless residual. */
    reference: number;
    /** Actual current-source level at the emitted control. */
    actual: number;
    /** Actual minus original, dimensionless. */
    signed: number;
    /** Actual local radial derivative; null only for identical source-control borrowing. */
    derivative: number | null;
    /** Original local radial derivative; null remains explicit. */
    originalDerivative: number | null;
    /** The one source-domain bracket used, or null when the original control already solves the level. */
    bracket: readonly [number, number] | null;
    /** Explicit method and unsupported-domain qualification. */
    method: string;
  }

  /**
   * The generated parent-chart loop and its level observations.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The generated parent-chart loop and its level observations.
   * @evidence contracts/development/design.md#principled-representation The loop uses metres and radians in the parent chart. One dimensionless column reading corresponds to each emitted clock.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1NativeRootLevel hands this result to the native root operator and inspection path.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The record pairs each loop with the observations that produced it.
   */
  export interface ILevelResult {
    /** The current radial chart controls, retaining their original clock. */
    loop: IAutoMovieConstructionPortLoop;
    /** One dimensionless observation at each emitted original clock. */
    columns: ILevelColumn[];
  }
}
