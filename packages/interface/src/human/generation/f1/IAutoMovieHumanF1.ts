import type { IAutoMovieConstructionPortLoop } from "../../../construction/IAutoMovieConstructionPortLoop";
import type { IAutoMovieConstructionSeed } from "../../../construction/IAutoMovieConstructionSeed";
import type { IAutoMovieHumanF1NativeRoot } from "./IAutoMovieHumanF1NativeRoot";
import type { IAutoMovieConstructionFill } from "../../../construction/IAutoMovieConstructionFill";
import type { IAutoMovieConstructionNode } from "../../../construction/IAutoMovieConstructionNode";
import type { IAutoMovieViewPart } from "../../../construction/IAutoMovieViewPart";
import type { IAutoMovieHumanConicLoft } from "../conic/IAutoMovieHumanConicLoft";
import type { IAutoMovieHumanF1Placement } from "./IAutoMovieHumanF1Placement";

/**
 * Reference-family assembly, cutters and digit connection seams in the figure's registered frame.
 *
 * The interface package owns these declarations; AutoMovieHumanF1 in Human supplies their runtime values.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Reference-family assembly, cutters and digit connection seams in the figure's registered frame. Member comments specify the individual units, frames and optional-value meanings.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The namespace groups only IPiece, IMember, IDigit, IAssembly, IConstruction, IBody, Cutters, IRailMm, ValleyJoints, ValleyResult, IFanSeamsResult declarations; it adds no runtime state, fixture dispatch or alternate implementation. Each member retains its own concrete data or callable representation.
 * @evidence contracts/development/design.md#principled-representation IPiece, IMember, IDigit, IAssembly, IConstruction, IBody, Cutters, IRailMm, ValleyJoints, ValleyResult, IFanSeamsResult separate the declared inputs, results and related quantities. Their numeric domains and geometric consistency remain the Human producers' and engine operators' runtime responsibility; the namespace introduces no additional frame or clock.
 * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1 exchanges the named IPiece, IMember, IDigit, IAssembly, IConstruction, IBody, Cutters, IRailMm, ValleyJoints, ValleyResult, IFanSeamsResult contracts with its Human callers. Interface owns these type declarations without importing that implementation.
 */
export namespace IAutoMovieHumanF1 {
  /** One generated surface piece.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One generated surface piece.
   * @evidence contracts/development/design.md#principled-representation `name`: `body` for the sewn skin, else a digit's chain name, with `.mirror` for the reflected twin. `positions`: Vertex positions, three per vertex, metres in the figure's frame (forward +X, up +Y, left +Z). `indices`: Triangle indices, counter-clockwise seen from outside.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanF1.create. Also types AutoMovieHumanF1.pieces.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `name`, `positions`, `indices`, `diagnostics`; callers supply the complete record.
   */
  export interface IPiece {
    /** `body` for the sewn skin, else a digit's chain name, with `.mirror` for the reflected twin. */
    name: string;

    /** Vertex positions, three per vertex, metres in the figure's frame (forward +X, up +Y, left +Z). */
    positions: number[];

    /** Triangle indices, counter-clockwise seen from outside. */
    indices: number[];

    /** What the engine refused, one line each; empty when the piece was admitted whole. */
    diagnostics: string[];
  }

  /** One authored family in the figure.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One authored family in the figure.
   * @evidence contracts/development/design.md#principled-representation `family`: The authored definition. `mirrored`: Present a second time as its twin across the median plane `z = 0`. `reach`: How far a loose family is carried before its first knot and past its last, mm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by markHumanCaptureCurves. Also types AutoMovieHumanF1.LOOSE, AutoMovieHumanF1.FAMILIES.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts `reach`: How far a loose family is carried before its first knot and past its last, mm.
   */
  export interface IMember {
    /** The authored definition. */
    family: IAutoMovieHumanConicLoft.IFamily;

    /** Present a second time as its twin across the median plane `z = 0`. */
    mirrored: boolean;

    /**
     * How far a loose family is carried before its first knot and past its last, mm. There its fields continue as the straight
     * end tangents of their natural cubics, so a digit reaches into the hand or the foot. The overlap is not a join. Absent, no reach.
     */
    reach?: [number, number];
  }

  /** One digit sewn to its limb.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation One digit sewn to its limb.
   * @evidence contracts/development/design.md#principled-representation `family`: The digit's authored definition. `limb`: The limb whose cap it leaves through. `knuckle`: The digit leaves its limb's end over a knuckle in the row of knuckles, as one of the children of the end's split (`FANS`).
   * @evidence contracts/development/design.md#minimal-and-owned-surface Also types AutoMovieHumanF1.DIGITS, AutoMovieHumanF1.digits.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `family`, `limb`, `knuckle`; callers supply the complete record.
   */
  export interface IDigit {
    /** The digit's authored definition. */
    family: IAutoMovieHumanConicLoft.IFamily;

    /** The limb whose cap it leaves through. */
    limb: "arm" | "leg";

    /**
     * The digit leaves its limb's end over a knuckle in the row of knuckles, as one of the children of the end's split (`FANS`). The thumb
     * leaves the hand's side, its first joint deep in the palm, and keeps the root closed `ROOT_MM` behind its first joint.
     */
    knuckle: boolean;
  }

  /** Every family of the figure placed at a pose (`assemble`).
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation Every family of the figure placed at a pose (`assemble`).
   * @evidence contracts/development/design.md#principled-representation `frames`: Every segment's frame at the pose, in the figure's frame. `body`: `BODY` at the pose. `digits`: `DIGITS` at the pose.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanF1.assemble. Read by AutoMovieHumanF1.trunkChart, AutoMovieHumanF1.armscye, AutoMovieHumanF1.nostril. Also types AutoMovieHumanF1.placed.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `frames`, `body`, `digits`, `helix`, `antihelix`, `axilla`, `concha`, `nostril`, `families`, `station`, `point`, `direction`; callers supply the complete record.
   */
  export interface IAssembly {
    /** Shared crotch seam knots and fairing controls in the chord plane. */
    crotchProfile: ICrotchProfile;

    /** Original radial port controls for the invocation, in their native parent charts. */
    roots: IRootControls;

    /** Invocation-owned port definitions, absent in an ordinary reference or posed assembly. */
    nativePorts?: ReadonlyMap<string, IAutoMovieHumanF1NativeRoot.IRootSpec>;

    /**
     * Transport the scoped cutter seed into this assembly's original or changed source chart.
     */
    nativeSeed?: (
      family: IAutoMovieHumanConicLoft.IFamily,
      seed: IAutoMovieHumanF1NativeRoot.ISeed,
      hostFace: string,
    ) => IAutoMovieConstructionSeed;

    /** Seed controls recorded by the native invocation, absent when no native owner is used. */
    nativeSeedControls?: ReadonlyMap<string, IAutoMovieHumanF1NativeRoot.ISeedTransport>;

    /**
     * Original family before placement, by logical name, for looking up a material station.
     */
    reference: (name: string) => IAutoMovieHumanConicLoft.IFamily;

    /** Every segment's frame at the pose, in the figure's frame. */
    frames: IAutoMovieHumanF1Placement.IFrames;

    /** `BODY` at the pose. */
    body: IBody;

    /** `DIGITS` at the pose. */
    digits: IDigit[];

    /** The helix's tube at the pose. */
    helix: IAutoMovieHumanConicLoft.IFamily;

    /** The antihelix's tube at the pose. */
    antihelix: IAutoMovieHumanConicLoft.IFamily;

    /** The armpit's slit cutter at the pose, as stored. */
    axilla: IAutoMovieHumanConicLoft.IFamily;

    /** The ear's bowl cutter at the pose, as stored. */
    concha: IAutoMovieHumanConicLoft.IFamily;

    /** The nostril's cutter at the pose, as stored, before `CUTTERS`' `cut`. */
    nostril: IAutoMovieHumanConicLoft.IFamily;

    /** Every family above, once: `FAMILIES`' and `CUTTERS`' families at the pose. */
    families: IAutoMovieHumanConicLoft.IFamily[];

    /**
     * A station of a stored family carried to the pose, mm (`AutoMovieHumanConicPose.map`): `from` when `length` is absent, else the
     * length at the pose of the stretch `length` mm long that starts at `from`. A station constant read along a posed family (where a
     * face ends, where a band lands) goes through it; at the reference pose both are the numbers given.
     */
    station: (family: string, from: number, length?: number) => number;

    /**
     * A datum of `AutoMovieHumanF1Placing.POINTS` at the pose, mm in the figure's frame.
     */
    point: (name: string) => [number, number, number];

    /**
     * A direction of `AutoMovieHumanF1Placing.DIRECTIONS` at the pose, in the figure's frame.
     */
    direction: (name: string) => [number, number, number];
  }

  /** The sewn body's declaration: its construction tree and the view parts its source leaves name.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The sewn body's declaration: its construction tree and the view parts its source leaves name.
   * @evidence contracts/development/design.md#principled-representation `root`: The tree: both arm ports over the crotch split over the trunk. `sources`: The complete source part of each named leaf, borrowed immutably for its readers' lifetime. `fills`: The skin's discs faired once it is drawn (`IAutoMovieConstruction.fills`), metres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by AutoMovieHumanF1.construction. Also types AutoMovieHumanF1.declared.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `root`, `sources`, `fills`; callers supply the complete record.
   */
  export interface IConstruction {
    /** The tree: both arm ports over the crotch split over the trunk. */
    root: IAutoMovieConstructionNode;

    /** The view part of every source leaf, by its name. */
    sources: ReadonlyMap<string, IAutoMovieViewPart>;

    /** The skin's discs faired once it is drawn (`IAutoMovieConstruction.fills`), metres. */
    fills: IAutoMovieConstructionFill[];
  }

  /** The families the sewn body is built from.
   *
   *
   * @evidence contracts/development/common.md#meaningful-documentation The families the sewn body is built from.
   * @evidence contracts/development/design.md#principled-representation `trunk`: Original conic family for the trunk, in the registered reference frame and calibration millimetres. `arm`: Original conic family for the arm, in the registered reference frame and calibration millimetres. `hand`: Original conic family for the hand, in the registered reference frame and calibration millimetres.
   * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanF1.IBody is the canonical exchange used by AutoMovieHumanF1.BODY.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `trunk`, `arm`, `hand`, `leg`, `ear`, `nose`, `breast`; callers supply the complete record.
   */
  export type IBody = {
    /** Original conic family for the trunk, in the registered reference frame and calibration millimetres. */
    trunk: IAutoMovieHumanConicLoft.IFamily;
    /** Original conic family for the arm, in the registered reference frame and calibration millimetres. */
    arm: IAutoMovieHumanConicLoft.IFamily;
    /** Original conic family for the hand, in the registered reference frame and calibration millimetres. */
    hand: IAutoMovieHumanConicLoft.IFamily;
    /** Original conic family for the leg, in the registered reference frame and calibration millimetres. */
    leg: IAutoMovieHumanConicLoft.IFamily;
    /** Original conic family for the ear, in the registered reference frame and calibration millimetres. */
    ear: IAutoMovieHumanConicLoft.IFamily;
    /** Original conic family for the nose, in the registered reference frame and calibration millimetres. */
    nose: IAutoMovieHumanConicLoft.IFamily;
    /** Original conic family for the breast, in the registered reference frame and calibration millimetres. */
    breast: IAutoMovieHumanConicLoft.IFamily;
  };

  /** Every stored cutter of the figure: the armpit's slit, each ear's bowl and each nostril are lofts cut out of the skin (`construction`),
  so `FAMILIES` does not hold them. Each is listed as stored, with `cut`, the family the figure lofts from it: the nostril is drawn in by
  its rim and spread past its mouth (`drawnIn`, `spreadOut`), the others are cut as stored. A reader that changes a cutter's stored
  fields reads through `cut` the wall the figure would cut with them.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Every stored cutter of the figure: the armpit's slit, each ear's bowl and each nostril are lofts cut out of the skin (`construction`), so `FAMILIES` does not hold them.
 * @evidence contracts/development/design.md#principled-representation Every stored cutter of the figure: the armpit's slit, each ear's bowl and each nostril are lofts cut out of the skin (`construction`), so `FAMILIES` does not hold them. The outer tuple/array is readonly; nested element types determine whether their contents can change.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanF1.Cutters is the canonical exchange used by AutoMovieHumanF1.CUTTERS.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanF1.CUTTERS for every stored cutter of the figure: the armpit's slit, each ear's bowl and each nostril are lofts cut out of the skin (`construction`), so `FAMILIES` does not hold them.
 */
  export type Cutters = readonly {
    /** Original conic family for the cutter, in the registered reference frame and calibration millimetres. */
    family: IAutoMovieHumanConicLoft.IFamily;
    /** Whether this cutter is reflected across the registered median plane z = 0. */
    mirrored: boolean;
    /** Apply this geometric cut to the supplied family and return its resulting family. */
    cut: (
      family: IAutoMovieHumanConicLoft.IFamily,
    ) => IAutoMovieHumanConicLoft.IFamily;
  }[];

  /** Where each limb's band lands on it, mm from the limb's first station: the limb keeps its stations beyond. The arm's first station is 2 mm
  past the armscye's plane and its course is nearly square to that plane for its first 25 mm, so its ring 10 mm on lies beside the plane. The nose's band lands on a curve (`NOSE_RAILS_MM`).
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Where each limb's band lands on it, mm from the limb's first station: the limb keeps its stations beyond.
 * @evidence contracts/development/design.md#principled-representation `arm`: Physical connection-band rail reach for the arm, millimetres. `leg`: Physical connection-band rail reach for the leg, millimetres. `breast`: Physical connection-band rail reach for the breast, millimetres.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanF1.IRailMm is the canonical exchange used by AutoMovieHumanF1.RAIL_MM.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `arm`, `leg`, `breast`; callers supply the complete record.
 */
  export type IRailMm = {
    /** Physical connection-band rail reach for the arm, millimetres. */
    arm: number;
    /** Physical connection-band rail reach for the leg, millimetres. */
    leg: number;
    /** Physical connection-band rail reach for the breast, millimetres. */
    breast: number;
  };

  /** The joints argument of AutoMovieHumanF1.valley. Where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the
  plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`.
  @param family The limb's family, its end open.
  @param station The end's station, mm.
  @param joints The two digits' first and second joints: `[[first, second], [first, second]]`.
  @param up The palm's or the sole's normal, or any direction the plane must hold.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`.
 * @evidence contracts/development/design.md#principled-representation Where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanF1.ValleyJoints is the canonical exchange used by AutoMovieHumanF1.valley.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanF1.valley for where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`.
 */
  export type ValleyJoints = [[number[], number[]], [number[], number[]]];

  /** Result of AutoMovieHumanF1.valley. Where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the
  plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`.
  @param family The limb's family, its end open.
  @param station The end's station, mm.
  @param joints The two digits' first and second joints: `[[first, second], [first, second]]`.
  @param up The palm's or the sole's normal, or any direction the plane must hold.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation Where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`.
 * @evidence contracts/development/design.md#principled-representation Where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`. Ordered tuple slots are 0, 1; fixed arity preserves their correspondence.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanF1.ValleyResult is the canonical exchange used by AutoMovieHumanF1.valley.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The representation is used by AutoMovieHumanF1.valley for where the plane between two neighbouring digits crosses a limb's open end: the two host phases at which the end's ring crosses the plane through the midpoints of the two digits' first joints and of their second joints that holds `up`, increasing in `[0, 2 pi)`.
 */
  export type ValleyResult = [number, number];

  /** Result of AutoMovieHumanF1.fanSeams. The seams a limb's open end is split along between its knuckled digits (`IAutoMovieConstructionSplit.outer`), from the little
  finger's or the little toe's valley inward, each a pair of host phases on the end's ring enclosing the one before; each seam's heading,
  toward the middle of the gap between the two digits' facing skins (`IAutoMovieConstructionSplit.IProfile.heading`); and the end's station, outward normal and palm or
  sole normal. The split of a fanned limb's end (`FANS`) and `FamilyConicScan.ts webs` read it.
  The joints are the datums at the pose. The palm's normal is the vector product of the wrist's lines to the index and the pinky
  finger's first joints; the sole's is the foot's stored direction `leg.fan.up`, the floor's normal reversed in the reference pose.
  @param which The limb.
  @param placed The figure's families at a pose; absent, the reference pose.
   *
 *
 * @evidence contracts/development/common.md#meaningful-documentation The seams a limb's open end is split along between its knuckled digits (`IAutoMovieConstructionSplit.outer`), from the little finger's or the little toe's valley inward, each a pair of host phases on the end's ring enclosing the one before; each seam's heading, toward the middle of the gap between the two digits' facing skins (`IAutoMovieConstructionSplit.IProfile.heading`); and the end's station, outward normal and palm or sole normal.
 * @evidence contracts/development/design.md#principled-representation `station`: Physical station along this part's declared source axis, millimetres. `seams`: Pairs of host section phases in radians, enclosing each preceding seam from the outermost digit valley inward. `headings`: Unit headings from each host seam toward the gap between its neighbouring digit skins, in the registered frame.
 * @evidence contracts/development/design.md#minimal-and-owned-surface IAutoMovieHumanF1.IFanSeamsResult is the canonical exchange used by AutoMovieHumanF1.fanSeams.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Required fields are `station`, `seams`, `headings`, `normal`, `up`; callers supply the complete record.
 */
  export type IFanSeamsResult = {
    /** Physical station along this part's declared source axis, millimetres. */
    station: number;
    /** Pairs of host section phases in radians, enclosing each preceding seam from the outermost digit valley inward. */
    seams: [number, number][];
    /** Unit headings from each host seam toward the gap between its neighbouring digit skins, in the registered frame. */
    headings: [number, number, number][];
    /** Dimensionless direction in the containing record's registered source frame; geometric consumers apply the documented normalization rule. */
    normal: number[];
    /** Dimensionless direction in the containing record's registered source frame; geometric consumers apply the documented normalization rule. */
    up: number[];
  };

  /**
   * The crotch seam's shared chord-plane and fairing controls.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The crotch seam's shared chord-plane and fairing controls.
   * @evidence contracts/development/design.md#principled-representation Each knot is a pair of chord distance and depth in metres. The corner is in radians, and each fairing share belongs to one side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1 reads the same profile when deriving the posed seam.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The profile is authored in one chord plane. The construction operator admits its knot ordering and geometry.
   */
  export interface ICrotchProfile {
    /** Chord distance and depth, in metres, at each knot. */
    knots: [number, number][];

    /** Corner angle, radians. */
    corner: number;

    /** Fairing share at each end of the chord. */
    fair: [number, number];
  }

  /**
   * The assembly's original parent-chart radial controls.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The assembly's original parent-chart radial controls.
   * @evidence contracts/development/design.md#principled-representation Arms and breasts have a loop per side, and the nose has one loop. Each loop uses its host-chart metres and radians.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1 and native root preparation read these controls before constructing ports.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The two loops distinguish anatomical sides without assigning another clock to either.
   */
  export interface IRootControls {
    /** Arm loops in left, then right order. */
    arm: [IAutoMovieConstructionPortLoop, IAutoMovieConstructionPortLoop];

    /** Breast loops in left, then right order. */
    breast: [IAutoMovieConstructionPortLoop, IAutoMovieConstructionPortLoop];

    /** Nose loop on the face. */
    nose: IAutoMovieConstructionPortLoop;
  }

  /**
   * A child conic family's skin cut on its parent's last section plane.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A child conic family's skin cut on its parent's last section plane.
   * @evidence contracts/development/design.md#principled-representation Plane vectors use figure coordinates with a millimetre origin. The child's centre and sampled closed contour use millimetres in the plane chart.
   * @evidence contracts/development/design.md#minimal-and-owned-surface AutoMovieHumanF1.rootSection returns this section for fitter and join diagnostics.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts This records the sampled skin intersection and its plane. The operator owns admission of the continuous joint.
   */
  export interface IRootSection {
    /** The plane: the parent's course frame at its last knot, mm, with its normal along the course. */
    plane: {
      origin: [number, number, number];
      u: [number, number, number];
      v: [number, number, number];
      normal: [number, number, number];
    };

    /** Where the child's course pierces the plane, in the plane's `(u, v)` chart, mm. */
    centre: [number, number];

    /** The child's skin cut by the plane, one point per child phase from 0, in the plane's `(u, v)` chart, mm. */
    loop: [number, number][];
  }
}
