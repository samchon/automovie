import type { IAutoMovieConstructionPointSeed } from "../construction/IAutoMovieConstructionPointSeed";
import type { IAutoMovieConstructionPortLoop } from "../construction/IAutoMovieConstructionPortLoop";
import type { IAutoMovieLoftSectionFrame } from "../construction/IAutoMovieLoftSectionFrame";
import type { IAutoMovieSolidSurface } from "../construction/IAutoMovieSolidSurface";
import type { IAutoMovieViewAxis } from "../construction/IAutoMovieViewAxis";
import type { IAutoMovieViewPart } from "../construction/IAutoMovieViewPart";
import type { AutoMovieVector3Tuple } from "../geometry/AutoMovieVector3Tuple";

/** Native root controls, original-source calibration and inspection data. */
export namespace IAutoMovieHumanF1NativeRoot {
  /** Paired original and changed world controls for one root. */
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

  /** Parent and child target control curves on their declared root clock. */
  export interface ICurves {
    /** Target parent world controls. */
    parent: AutoMovieVector3Tuple[];
    /** Target child world controls. */
    child: AutoMovieVector3Tuple[];
  }

  /** The original native parent and child definition of one root. */
  export interface IOriginal {
    /** Qualified root identity, used in diagnostics only. */
    name: string;
    /**
     * Complete original parent/child native definitions in actual production
     * scope.
     */
    parent: IAutoMovieViewPart;
    /** Original complete child world curve in the declared paired clock, mm. */
    child: IAutoMovieViewPart;
    /** Original radial parent controls in public metres/radians. */
    loop: IAutoMovieConstructionPortLoop;
    /**
     * Absolute original rail stations at uniform child phases, physical mm; one
     * value means a junction.
     */
    rails: readonly number[];
    /** Existing operator column count and clock correspondence. */
    count: number;
    /** Existing angle or arclength pairing; no newly fitted port clock. */
    correspondence: "angle" | "length";
    /**
     * Explicit original bare caliper inputs and their native station; these are
     * qualified source inputs, not clinical observations.
     */
    metric: {
      /** Named original material station, mm; never inferred from the frame. */
      station: number;
      /** Bare source depth at that site, mm, positive. */
      depth: number;
      /** Bare source breadth at that site, mm, positive. */
      breadth: number;
    };
    /**
     * Original child-caliper frame, used as a construction clock and
     * directional basis, not a skin datum.
     */
    basis: IAutoMovieLoftSectionFrame;
  }

  /** Original source calibration shared by one native-root preparation. */
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
    /** Original source-owned rail station at child phase, physical mm. */
    childRail: (phase: number) => number;
  }

  /** Root clock correspondence and actual positions at one emitted column. */
  export interface IRootRow {
    /**
     * Actual parent-source level and branch observation; independent of old
     * affine targets.
     */
    level: ILevelColumn;
    /** Emitted radial column clock, radians. */
    clock: number;
    /** Inverse address in the original target control parameter, radians. */
    sourceClock: number;
    /** Actual emitted parent station/phase address, mm/radians. */
    parentAddress: [number, number];
    /**
     * Issued actual child rail station and operator-correspondence phase,
     * mm/radians.
     */
    targetChildAddress: [number, number];
    /**
     * Discarded affine-hypothesis parent target, world mm; never a new
     * membership constraint.
     */
    targetParent: AutoMovieVector3Tuple;
    /** Discarded affine-hypothesis child target at the original clock, world mm. */
    targetChild: AutoMovieVector3Tuple;
    /** Actual complete parent point at the emitted address, world mm. */
    actualParent: AutoMovieVector3Tuple;
    /**
     * Actual candidate child point on the emitted rail at the target phase,
     * world mm.
     */
    actualChild: AutoMovieVector3Tuple;
    /** Actual parent minus discarded affine target, world mm. */
    eC: AutoMovieVector3Tuple;
    /** Actual child minus discarded affine target, world mm. */
    eQ: AutoMovieVector3Tuple;
    /** EQ minus eC at the same original target parameter, world mm. */
    pairedGap: AutoMovieVector3Tuple;
  }

  /**
   * Native port and dependent cutter controls emitted by one original-source
   * invocation.
   */
  export interface IRootSpec {
    /**
     * Local original boundary/source controls, not a whole-person identity
     * selector.
     */
    unchanged: boolean;
    /** Generated radial parent controls in public metres/radians. */
    loop: IAutoMovieConstructionPortLoop;
    /** Generated absolute native child rail station controls, physical mm. */
    railStations: number[];
    /**
     * The same stations relative to the actual child source bottom, physical
     * mm.
     */
    railDistances: number[];
    /** Complete conservative range of the emitted periodic rail, physical mm. */
    range: readonly [number, number];
    /**
     * Original-clock actual-source and discarded-target observations, with no
     * geometric acceptance claim.
     */
    rows: IRootRow[];
    /** Explicit approximation and unavailable acceptance-budget statement. */
    qualification: string;
    /** Re-read the actual final source; target jets are never substituted. */
    inspect: (part: IAutoMovieViewPart) => IInspection[];
    /**
     * Original physical search controls for unchanged bindings; changed roots
     * issue a separate named chart prior.
     */
    seed: (
      original: IAutoMovieViewPart,
      current: IAutoMovieViewPart,
      seed: ISeed,
    ) => ISeedTransport;
  }

  /** A cutter's fixed-phase search line in its original material interval. */
  export interface ISeed {
    /** Original fixed cutter phase, radians on its declared branch. */
    phase: number;
    /** Original start share of the cutter native domain. */
    from: number;
    /** Original end share of the cutter native domain. */
    to: number;
  }

  /** Controls issued for one cutter search and their source-clock evidence. */
  export interface ISeedTransport {
    /** Primary named source-chart input for a changed dependent cutter. */
    pointSeed?: IAutoMovieConstructionPointSeed;
    /** Literal original root/cutter material binding survives. */
    unchanged: boolean;
    /** Transported fixed-phase search line and material-window shares. */
    seed: ISeed;
    /**
     * Original and transported endpoint/midpoint controls with world residuals
     * and original root clocks.
     */
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

  /** One root's candidate source axes and deferred resolution. */
  export interface IPrepared {
    /**
     * Range-independent complete candidate course with the original oriented
     * section bases.
     */
    axis: IAutoMovieViewAxis.IAxis;
    /** Same explicit affine candidate policy for dependent cutter courses. */
    cutterAxis: (axis: IAutoMovieViewAxis.IAxis) => IAutoMovieViewAxis.IAxis;
    /**
     * Generate actual radial/phase controls once from the supplied complete
     * candidate source.
     */
    resolve: (candidate: IAutoMovieViewPart) => IRootSpec;
  }

  /**
   * The value and first two derivatives of a target curve on the original root
   * clock.
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
   * A signed residual projected on a regular source normal and tangent plane,
   * or an explicit unavailable reason.
   */
  export type IProjection =
    | { normal: number; tangent: AutoMovieVector3Tuple }
    | { unavailable: string };

  /** A root inspection column with source jets and residuals available. */
  export interface IInspected extends IRootRow {
    /** The full source2 capabilities used by this row are available. */
    kind: "available";
    /** New target-curve clock2, distinct from physical source derivatives. */
    targetClock2: { parent: IClockJet; child: IClockJet };
    /** Emitted rail station minus the raw desired native station, mm. */
    railReclockStationResidualMm: number;
    /**
     * Residual normal/tangent parts at their own actual parent/candidate/final
     * source.
     */
    normalAndTangent: {
      parent: IProjection;
      candidate: IProjection;
      final: IProjection;
    };
    /** Actual complete parent physical2 in station-mm/phase-radian coordinates. */
    physicalParent2: IAutoMovieSolidSurface.IJet;
    /**
     * Actual complete provisional candidate physical2 in the same coordinate
     * units.
     */
    physicalCandidate2: IAutoMovieSolidSurface.IJet;
    /**
     * Actual complete final source physical2; unavailable orders are not
     * filled.
     */
    physicalFinal2: IAutoMovieSolidSurface.IJet;
    /** Final minus candidate, by physical derivative order and its own units. */
    protectedSourceSigned: IAutoMovieSolidSurface.IJet;
    /** Target residuals of the provisional candidate, world mm. */
    candidateResidual: {
      eC: AutoMovieVector3Tuple;
      eQ: AutoMovieVector3Tuple;
      pairedGap: AutoMovieVector3Tuple;
    };
    /** Target residuals of the actual final source, world mm. */
    finalResidual: {
      eC: AutoMovieVector3Tuple;
      eQ: AutoMovieVector3Tuple;
      pairedGap: AutoMovieVector3Tuple;
    };
    /**
     * Actual physical versus new-target/normalized-operator derivative
     * conventions.
     */
    units: string;
  }

  /** A root inspection column whose physical source derivatives are unavailable. */
  export interface IUnavailable extends IRootRow {
    /** Missing physical source2 remains explicit. */
    kind: "unavailable";
    /** Original reader/admission failure, without a fabricated zero derivative. */
    unavailable: string;
  }

  /** The closed outcome of reading one emitted root column. */
  export type IInspection = IInspected | IUnavailable;

  /**
   * Original elliptic-radius level controls for one root, with observed radial
   * derivatives.
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

  /** Source-domain evidence for one generated radial root control. */
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
    /**
     * Actual local radial derivative; null only for identical source-control
     * borrowing.
     */
    derivative: number | null;
    /** Original local radial derivative; null remains explicit. */
    originalDerivative: number | null;
    /**
     * The one source-domain bracket used, or null when the original control
     * already solves the level.
     */
    bracket: readonly [number, number] | null;
    /** Explicit method and unsupported-domain qualification. */
    method: string;
  }

  /** The generated parent-chart loop and its level observations. */
  export interface ILevelResult {
    /** The current radial chart controls, retaining their original clock. */
    loop: IAutoMovieConstructionPortLoop;
    /** One dimensionless observation at each emitted original clock. */
    columns: ILevelColumn[];
  }
}
