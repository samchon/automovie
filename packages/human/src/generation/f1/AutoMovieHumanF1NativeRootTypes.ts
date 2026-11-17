import type { AutoMovieHumanF1NativeRootLevel as Level } from "./AutoMovieHumanF1NativeRootLevel";
import type {
  AutoMovieLoftFrame,
  AutoMovieSolidVector,
  AutoMovieViewAxis,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
} from "@automovie/engine";
import type { IAutoMovieConstructionPointSeed, IAutoMovieConstructionPort } from "@automovie/interface";

/** Qualified root controls, source addresses and closed diagnostic outcomes in figure-world mm. */
export namespace AutoMovieHumanF1NativeRootTypes {
  /** A physical world point or direction; mm for positions. */
  export type V = AutoMovieSolidVector.Vec3;

  /** Complete paired original controls and the same changed wall controls. */
  export interface ITargets {
    /** Original parent controls in their original clock order. */
    parent: readonly V[];
    /** Original child controls under the declared original clock correspondence. */
    child: readonly V[];
    /** Changed complete wall evaluated at the original parent native addresses. */
    wall: readonly V[];
    /** Original child-caliper basis, expressed in the fixed figure frame. */
    basis: AutoMovieLoftFrame.IFrame;
    /** Independent positive depth and breadth ratios. */
    scale: readonly [number, number];
  }

  /** Paired target curves; these are not substitutes for actual source/transverse jets. */
  export interface ICurves {
    /** Target parent world controls. */
    parent: V[];
    /** Target child world controls. */
    child: V[];
  }

  /** Fixed original port definition; every point is read before lofting. */
  export interface IOriginal {
    /** Qualified root identity, used in diagnostics only. */
    name: string;
    /** Complete original parent/child native definitions in actual production scope. */
    parent: IAutoMovieViewPart;
    /** Original complete child world curve in the declared paired clock, mm. */
    child: IAutoMovieViewPart;
    /** Original radial parent controls in public metres/radians. */
    loop: IAutoMovieConstructionPort.ILoop;
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
    basis: AutoMovieLoftFrame.IFrame;
  }

  /** Borrowed immutable original source calibration, shared by one prepared invocation. */
  export interface ICalibration {
    /** Reused original elliptic-radius levels and available radial derivatives. */
    level: Level.IOriginal;
    /** Complete immutable original control and clock definition. */
    input: IOriginal;
    /** Original parent native station/phase addresses, mm/radians. */
    charts: [number, number][];
    /** Original complete parent world curve, in clock order, mm. */
    parent: V[];
    /** Original complete child world curve in the declared paired clock, mm. */
    child: V[];
    /** Original operator correspondence phases, unwrapped radians. */
    childPhases: number[];
    /** Original source-owned rail station at child phase, physical mm. */
    childRail: (phase: number) => number;
  }

  /** One recorded original-target clock and the actual radial/phase addresses that consume it. */
  export interface IRootRow {
    /** Actual parent-source level and branch observation; independent of old affine targets. */
    level: Level.IColumn;
    /** Emitted radial column clock, radians. */
    clock: number;
    /** Inverse address in the original target control parameter, radians. */
    sourceClock: number;
    /** Actual emitted parent station/phase address, mm/radians. */
    parentAddress: [number, number];
    /** Issued actual child rail station and operator-correspondence phase, mm/radians. */
    targetChildAddress: [number, number];
    /** Discarded affine-hypothesis parent target, world mm; never a new membership constraint. */
    targetParent: V;
    /** Discarded affine-hypothesis child target at the original clock, world mm. */
    targetChild: V;
    /** Actual complete parent point at the emitted address, world mm. */
    actualParent: V;
    /** Actual candidate child point on the emitted rail at the target phase, world mm. */
    actualChild: V;
    /** Actual parent minus discarded affine target, world mm. */
    eC: V;
    /** Actual child minus discarded affine target, world mm. */
    eQ: V;
    /** eQ minus eC at the same original target parameter, world mm. */
    pairedGap: V;
  }

  /** Actual generated port controls; residuals carry no unapproved geometric acceptance budget. */
  export interface IRootSpec {
    /** Local original boundary/source controls, not a whole-person identity selector. */
    unchanged: boolean;
    /** Generated radial parent controls in public metres/radians. */
    loop: IAutoMovieConstructionPort.ILoop;
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
    /** Re-read the actual final source; target jets are never substituted. */
    inspect: (part: IAutoMovieViewPart) => IInspection[];
    /** Original physical search controls for unchanged bindings; changed roots issue a separate named chart prior. */
    seed: (
      original: IAutoMovieViewPart,
      current: IAutoMovieViewPart,
      seed: ISeed,
    ) => ISeedTransport;
  }

  /** A fixed-phase search line and its material-window shares. */
  export interface ISeed {
    /** Original fixed cutter phase, radians on its declared branch. */
    phase: number;
    /** Original start share of the cutter native domain. */
    from: number;
    /** Original end share of the cutter native domain. */
    to: number;
  }

  /** Transported controls and the explicitly qualified fixed-phase approximation. */
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
      target: V;
      point: V;
      residual: V;
      sourceClock: number | null;
    }[];
    /** Explicit approximation and unavailable acceptance-budget statement. */
    qualification: string;
  }

  /** Range-independent candidate course, then one rail/address resolution. */
  export interface IPrepared {
    /** Range-independent complete candidate course with the original oriented section bases. */
    axis: AutoMovieViewAxis.IAxis;
    /** Same explicit affine candidate policy for dependent cutter courses. */
    cutterAxis: (axis: AutoMovieViewAxis.IAxis) => AutoMovieViewAxis.IAxis;
    /** Generate actual radial/phase controls once from the supplied complete candidate source. */
    resolve: (candidate: IAutoMovieViewPart) => IRootSpec;
  }

  /** The actual phase-clock derivative of a new periodic target-control curve. */
  export interface IClockJet {
    /** World position, mm. */
    p: V;
    /** First derivative in original target clock radians, mm/radian. */
    first: V;
    /** Second derivative in original target clock radians, mm/radian squared. */
    second: V;
  }

  /** Projection on an actual regular source normal, or its explicit absence. */
  export type IProjection =
    | { normal: number; tangent: V }
    | { unavailable: string };

  /** Available actual final/candidate source data at one original-target-addressed column. */
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
    candidateResidual: { eC: V; eQ: V; pairedGap: V };
    /** Target residuals of the actual final source, world mm. */
    finalResidual: { eC: V; eQ: V; pairedGap: V };
    /** Actual physical versus new-target/normalized-operator derivative conventions. */
    units: string;
  }

  /** A column whose actual physical2 could not be supplied. */
  export interface IUnavailable extends IRootRow {
    /** Missing physical source2 remains explicit. */
    kind: "unavailable";
    /** Original reader/admission failure, without a fabricated zero derivative. */
    unavailable: string;
  }

  /** Closed inspection outcome; presence of finite values is not geometric acceptance. */
  export type IInspection = IInspected | IUnavailable;
}
