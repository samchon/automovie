import type {
  AutoMovieVector2Tuple,
  AutoMovieVector3Tuple,
  IAutoMovieHumanF1,
  IAutoMovieHumanF1NativeLaw,
  IAutoMovieHumanNativeProjectionCourse,
  IAutoMovieHumanSegmentFrame,
  IAutoMovieLoftSectionFrame,
  IAutoMovieViewAxis,
  IAutoMovieViewAxisJet,
  IAutoMovieViewPart,
} from "@automovie/interface";

import { AutoMovieHumanNativeCalipers as Calipers } from "./AutoMovieHumanNativeCalipers";
import { AutoMovieHumanNativeProjectionCourse as Course } from "./AutoMovieHumanNativeProjectionCourse";
import { AutoMovieHumanNativeScaleProfile as Profile } from "./AutoMovieHumanNativeScaleProfile";
import { AutoMovieHumanSegmentFrame as F } from "./AutoMovieHumanSegmentFrame";
import "./AutoMovieHumanF1NativeSites";

import { AutoMovieHumanF1RootRails } from "./AutoMovieHumanF1RootRails";
import { AutoMovieHumanF1SegmentLengths as Lengths } from "./AutoMovieHumanF1SegmentLengths";
import { AutoMovieHumanF1NativeCalibrationData } from "./internal/AutoMovieHumanF1NativeCalibrationData";

/**
 * F1's native calibration: the calipers of her stored families at the
 * measurement sites, one endpoint projection metric and the directional
 * interpolation rules between sites. Every site station comes from the one site
 * owner (`AutoMovieHumanF1NativeSites`), which reads each by its published
 * definition; this module holds no station of its own.
 */
export namespace AutoMovieHumanF1NativeCalibration {
  /**
   * Fields and their one source-bound physical projection calibration for this
   * invocation.
   */
  export interface IReference {
    /**
     * Qualified source fields, with projection measured from the original
     * endpoint metric.
     */
    fields: IFields;
    /** Same immutable-original owner shared by every full/tape candidate. */
    projectionOwner: IAutoMovieHumanNativeProjectionCourse.IProjectionOwner;
  }

  /**
   * The trunk wall's caliper sites on the trunk course, mm, from the site owner
   * (`AutoMovieHumanF1NativeSites`): ISO 8559-1 5.3.13 hip level, ANSUR II
   * omphalion, ISO 8559-1 5.3.8 under bust and 5.3.4 bust point levels, and the
   * provisional neck (5.3.2, thyroid unreadable) and head sites. The field
   * names are the native inputs'
   * (`AutoMovieHumanF1NativeFieldTypes.IFields.wall`).
   */
  export const WALL: readonly [keyof IFields["wall"], number][] = [
    ["hipSkin", AutoMovieHumanF1NativeCalibrationData.SITES.wall.hip.station],
    ["omphalionWall", AutoMovieHumanF1NativeCalibrationData.SITES.wall.omphalion.station],
    ["underbustWall", AutoMovieHumanF1NativeCalibrationData.SITES.wall.underbust.station],
    ["bustWall", AutoMovieHumanF1NativeCalibrationData.SITES.wall.bust.station],
    ["neckSkin", AutoMovieHumanF1NativeCalibrationData.SITES.wall.neck.station],
    ["headSkin", AutoMovieHumanF1NativeCalibrationData.SITES.wall.head.station],
  ];

  /**
   * The arm's caliper sites on its course, mm, from the site owner: mid upper
   * arm, elbow, maximum forearm girth and wrist over stylion.
   */
  export const ARM: readonly [keyof IFields["arm"], number][] = [
    ["upperArm", AutoMovieHumanF1NativeCalibrationData.SITES.arm.upperArm.station],
    ["elbow", AutoMovieHumanF1NativeCalibrationData.SITES.arm.elbow.station],
    ["forearm", AutoMovieHumanF1NativeCalibrationData.SITES.arm.forearm.station],
    ["wrist", AutoMovieHumanF1NativeCalibrationData.SITES.arm.wrist.station],
  ];

  /**
   * The leg's caliper sites on its course, mm, from the site owner: knee joint
   * centre, widest calf and least ankle girth.
   */
  export const LEG: readonly [keyof IFields["leg"], number][] = [
    ["knee", AutoMovieHumanF1NativeCalibrationData.SITES.leg.knee.station],
    ["calf", AutoMovieHumanF1NativeCalibrationData.SITES.leg.calf.station],
    ["ankle", AutoMovieHumanF1NativeCalibrationData.SITES.leg.ankle.station],
  ];

  /**
   * Root caliper offsets past each child's first knot, mm: where its band
   * lands, from the rails' single owner.
   */
  export const RAIL: Record<keyof IFields["roots"], number> = {
    arm: AutoMovieHumanF1RootRails.landing.arm,
    leg: AutoMovieHumanF1RootRails.landing.leg,
    breast: AutoMovieHumanF1RootRails.landing.breast,
    nose: AutoMovieHumanF1RootRails.landing.nose,
  };

  /**
   * The hand's and the foot's caliper sites, mm on the hand and leg courses,
   * from the site owner: the metacarpal heads' level (ISO 7250-1 6.3.3, ANSUR
   * hand circumference at metacarpale) and the ball of the foot (ANSUR II ball
   * of foot circumference).
   */
  export const EXTREMITIES: Record<"hand" | "foot", number> = {
    hand: AutoMovieHumanF1NativeCalibrationData.SITES.extremities.hand.station,
    foot: AutoMovieHumanF1NativeCalibrationData.SITES.extremities.foot.station,
  };

  /**
   * Endpoint-flat quintic blend on normalized position, held at zero/one
   * outside its interval.
   */
  export const smooth: (t: number) => number = (t: number): number =>
    t <= 0 ? 0 : t >= 1 ? 1 : t * t * t * (10 + t * (-15 + 6 * t));

  /**
   * Independent dimensionless depth/breadth ratios; the caller owns positive
   * input admission.
   */
  export const ratio: (a: ISize, b: ISize) => AutoMovieVector2Tuple = (
    a: ISize,
    b: ISize,
  ): AutoMovieVector2Tuple => [a.depth / b.depth, a.breadth / b.breadth];

  /**
   * Exact zero-edit identity, preserving the native law's unchanged-control
   * branch.
   */
  export const same: (a: ISize, b: ISize) => boolean = (
    a: ISize,
    b: ISize,
  ): boolean => a.depth === b.depth && a.breadth === b.breadth;

  /**
   * Endpoint-flat directional interpolation between sites, held beyond the
   * first and last: the scale profile's one law
   * (`AutoMovieHumanNativeScaleProfile.create`), whose value is this module's
   * former arithmetic term for term and which also carries the station 2-jet a
   * native source needs between knots. Anchors must increase strictly with
   * positive finite ratios; the profile refuses others.
   */
  export function profile(
    anchors: readonly (readonly [number, AutoMovieVector2Tuple])[],
  ): Profile.IScale {
    return Profile.create(anchors);
  }

  /**
   * A fixed translation of an original datum-defined course; directions and
   * total2 are retained.
   */
  export function translated(
    axis: IAutoMovieViewAxis.IAxis,
    delta: AutoMovieVector3Tuple,
  ): IAutoMovieViewAxis.IAxis {
    if (delta.every((value: number): boolean => value === 0)) return axis;

    /*
     * Translate only frame origins; the original differential vectors remain
     * untouched.
     */
    function frame(f: IAutoMovieLoftSectionFrame): IAutoMovieLoftSectionFrame {
      return { ...f, origin: F.add(f.origin, delta) };
    }
    return {
      at: (s: number): IAutoMovieLoftSectionFrame => frame(axis.at(s)),
      jet: (
        s: number,
        p: Parameters<NonNullable<IAutoMovieViewAxis.IAxis["jet"]>>[1],
      ): IAutoMovieViewAxisJet.IJet | null => {
        const jet: IAutoMovieViewAxisJet.IJet | null = axis.jet?.(s, p) ?? null;
        return jet === null ? null : { ...jet, value: frame(jet.value) };
      },
    };
  }

  /**
   * F1's qualified input calibration from the accepted generating controls.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Current complete conic calipers are read at the site owner's stations, each by its published definition; supplied synthetic support separation is read from the resolved femur/pelvis frames, without a clinical regression.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One calibration supplies the same field records used by the forward law and its diagnostic perturbations.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts These are P calibration fields and are explicitly not a reference observation, survey target or verified HJC measurement.
   * @evidence contracts/development/common.md#meaningful-documentation Names the site owner and held skeletal inputs of IFields.
   * @evidence contracts/development/implementation.md#efficient-algorithms Bounded named-site reads prepare the actual current scalar prior and control calipers; no loft or skin is built.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Callers retain one calibration with their original-control invocation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Owns only the bounded scalar field records returned to its caller.
   */
  export function reference(
    figure: IAutoMovieHumanF1.IAssembly,
    originals: ReadonlyMap<string, IAutoMovieViewPart>,
  ): IFields {
    return readReference(figure, originals).fields;
  }

  /**
   * Prepare calipers and their source-bound projection owner; its endpoint
   * Point0/axis2 counts stay separate from caliper attempts.
   */
  export function readReference(
    figure: IAutoMovieHumanF1.IAssembly,
    originals: ReadonlyMap<string, IAutoMovieViewPart>,
    onRead?: () => void,
  ): IReference {
    /*
     * Count attempts immediately before the same actual complete-source caliper
     * reader.
     */
    function size(name: string, station: number): ISize {
      const part: IAutoMovieViewPart | undefined = originals.get(name);
      if (part === undefined)
        throw new Error("actual native calibration source absent: " + name);
      onRead?.();
      return Calipers.read(part, station);
    }

    /*
     * Nominal material site is fixed on the original family, independent of
     * current rail phase.
     */
    function root(name: keyof IFields["roots"]): ISize {
      return size(
        figure.body[name].name,
        figure.body[name].knots[0]! + RAIL[name],
      );
    }
    const femur: IAutoMovieHumanSegmentFrame | undefined =
      figure.frames.get("femur");
    const pelvis: IAutoMovieHumanSegmentFrame | undefined =
      figure.frames.get("pelvis");
    if (femur === undefined || pelvis === undefined)
      throw new Error("F1 support calibration needs pelvis/femur frames");
    const finger: IAutoMovieHumanF1.IDigit | undefined = figure.digits.find(
      (digit: IAutoMovieHumanF1.IDigit): boolean =>
        digit.limb === "arm" && digit.knuckle,
    );
    const toe: IAutoMovieHumanF1.IDigit | undefined = figure.digits.find(
      (digit: IAutoMovieHumanF1.IDigit): boolean =>
        digit.limb === "leg" && digit.knuckle,
    );
    if (finger === undefined || toe === undefined)
      throw new Error(
        "F1 authored-root calibration needs retained digit families",
      );

    // A digit's caliper stands at its site by definition (the site owner's `digits`), on the digit the site was read on. A first knot
    // is where a digit's fitted skin begins, which is no joint and moves with every refit of its root.
    const digitSite = (
      kind: "finger" | "toe",
      family: IAutoMovieHumanF1.IDigit["family"],
    ): number => {
      const site: import("./AutoMovieHumanF1NativeSites").AutoMovieHumanF1NativeSites.IDigitSite = AutoMovieHumanF1NativeCalibrationData.SITES.digits[kind];
      if (site.family !== family.name)
        throw new Error(
          "the " +
            kind +
            "'s caliper site was read on " +
            site.family +
            ", not on " +
            family.name,
        );
      if (
        !(
          site.station >= family.knots[0]! &&
          site.station <= family.knots.at(-1)!
        )
      )
        throw new Error(
          "the " +
            kind +
            "'s caliper site at " +
            site.station +
            " mm lies outside " +
            family.name +
            "'s fitted stations",
        );
      return site.station;
    };

    // One immutable-original world metric is shared with every generated projection candidate.
    const breastRail: number = figure.body.breast.knots[0]! + RAIL.breast;
    const breastSource: IAutoMovieViewPart | undefined = originals.get(
      figure.body.breast.name,
    );
    if (breastSource === undefined)
      throw new Error("original breast projection source absent");
    const projectionOwner: IAutoMovieHumanNativeProjectionCourse.IProjectionOwner =
      Course.prepare(breastSource, breastRail);
    const fields: IFields = {
      hipJointCentreBreadth: 2 * F.toLocal(pelvis, femur.origin)[2],
      wall: Object.fromEntries(
        WALL.map(
          ([name, station]: [keyof IFields["wall"], number]): [
            keyof IFields["wall"],
            ISize,
          ] => [name, size(figure.body.trunk.name, station)],
        ),
      ) as IFields["wall"],
      roots: {
        arm: root("arm"),
        leg: root("leg"),
        breast: root("breast"),
        nose: root("nose"),
      },
      breastProjection: projectionOwner.projection,
      arm: Object.fromEntries(
        ARM.map(
          ([name, station]: [keyof IFields["arm"], number]): [
            keyof IFields["arm"],
            ISize,
          ] => [
            name,
            size(
              name === "wrist" ? figure.body.hand.name : figure.body.arm.name,
              station,
            ),
          ],
        ),
      ) as IFields["arm"],
      leg: Object.fromEntries(
        LEG.map(
          ([name, station]: [keyof IFields["leg"], number]): [
            keyof IFields["leg"],
            ISize,
          ] => [name, size(figure.body.leg.name, station)],
        ),
      ) as IFields["leg"],
      extremities: {
        hand: size(figure.body.hand.name, EXTREMITIES.hand),
        foot: size(figure.body.leg.name, EXTREMITIES.foot),
        finger: size(finger.family.name, digitSite("finger", finger.family)),
        toe: size(toe.family.name, digitSite("toe", toe.family)),
      },

      // f1's own joint-centre lengths, read from her stored chain: the reference every length ratio is taken against.
      lengths: Lengths.F1,
    };
    return { fields, projectionOwner };
  }
}

/** Complete directional calipers in the declared material plane, mm. */
type ISize = IAutoMovieHumanF1NativeLaw.ISize;

/** Existing qualified native inputs; no alternative geometry state is added. */
type IFields = IAutoMovieHumanF1NativeLaw.IFields;
