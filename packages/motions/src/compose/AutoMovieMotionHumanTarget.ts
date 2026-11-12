import { Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  AutoMovieMotionTarget,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanTrunk } from "../everyday/HumanTrunk";
import { HumanRefusal } from "../law/HumanRefusal";
import type { IHumanActionContext } from "../law/IHumanActionContext";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import type { AutoMovieMotionHumanArm } from "./AutoMovieMotionHumanArm";
import { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";

/**
 * Where an action is directed: a target resolved to a place, and a place
 * turned into a hand's or a foot's goal.
 *
 * Every directed action works with no target. A place is a point with the
 * outward normal of whatever is there, and it says whether anything is
 * there: a person, a prop, the performer's own body and a point given with a
 * normal are solid; a bare point, the virtual opponent of `none` and the
 * default place are not. An action without a target (absent, or `none` with
 * neither a line nor a range) takes its own default place, stated in the
 * performer's proportions, and performs the same movement in the air: a punch
 * extends to it, a handshake offers the hand there, a pick up closes the
 * hand on nothing. A law reads `solid` to decide what only a real thing
 * allows (a contact window, a grip, the aimed movement time) and never
 * branches on the target's kind.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a place is, which targets are solid, what an action without a target does and what a law may read.
 * @evidence contracts/development/design.md#principled-representation A target of any kind reduces to a point, a facing and whether it is solid, the three facts a movement toward it needs; a default is stated in body proportions so one record fits every stature.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One place type, one default record with three named defaults, the resolver and two goal builders; the only caller of the context's aim outside the gaze.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the interface's target union and the hand and foot owners; a self region the trunk does not carry throws instead of reading a limb that is not solved yet.
 */
export namespace AutoMovieMotionHumanTarget {
  /**
   * A place an action is directed at, world frame.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member gives its frame, unit and meaning when absent.
   * @evidence contracts/development/design.md#principled-representation A point and the outward normal of the surface there, the frame a contact is made on, with whether a real thing is there.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members; `width` is optional because only some solid things state one, and the timing owner reads exactly this pair.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The target's kind is not carried, so no law can branch on it.
   */
  export interface IPlace {
    /** The point, world metres. */
    point: IAutoMovieVector3;

    /** The outward unit normal of the surface at the point. */
    normal: IAutoMovieVector3;

    /** Whether a real thing is at the point, so it can be touched, gripped or struck. */
    solid: boolean;

    /** The thing's width across a grip or a touch, metres; unknown when absent. */
    width?: number;
  }

  /**
   * A default place in the performer's proportions.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame; each member gives its unit, its sign and its value when absent.
   * @evidence contracts/development/design.md#principled-representation A height in statures, a distance in arm lengths and a sideways offset in half shoulder widths, so the same record puts a short and a tall performer's hand where they would each hold it.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, the least that places and faces a point ahead of a body; read by `fallback`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Shares of the body's measure, never metres; the facing is a closed union of the two cases the actions have.
   */
  export interface IDefault {
    /** Height above the floor, as a share of the stature. */
    height: number;

    /** Distance ahead of the root, as a share of the arm (upper arm and forearm). */
    range: number;

    /** Offset toward the performer's left, as a share of the half shoulder width; negative is right, 0 when absent. */
    lateral?: number;

    /** Which way the place faces: back at the performer, or up as a table top does. */
    facing: "performer" | "up";
  }

  /**
   * Default places (provisional shares):
   *
   * - `ahead`: at chest height most of an arm away, facing the performer; an
   *   offered hand, a push, a touch in the air;
   * - `desk`: at desk height (720 mm for a 1.7 m person) a forearm away,
   *   facing up; a keyboard, a table top;
   * - `floor`: on the floor a forearm ahead of the feet, facing up; a thing
   *   picked up or put down.
   */
  export const DEFAULTS: Readonly<
    Record<"ahead" | "desk" | "floor", IDefault>
  > = {
    ahead: { height: 0.72, range: 0.8, facing: "performer" },
    desk: { height: 0.42, range: 0.6, facing: "up" },
    floor: { height: 0, range: 0.6, facing: "up" },
  };

  /**
   * A height of the standing body, read from its measure: the floor, six
   * joints, the crown, and `overhead`, where a raised hand stands.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that each name is a height of the measure; `height` gives each one's value.
   * @evidence contracts/development/design.md#principled-representation A closed union of the landmarks a person places a hand by, so a law states a height the body supplies and types no number.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Ten names in rising order; `overhead` entered with its first users, the `raiseHand` and `cheer` gestures.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No name carries a number of its own apart from `OVERHEAD`; a height between two names is the between rung of `Place`.
   */
  export type Height =
    | "floor"
    | "knee"
    | "hip"
    | "waist"
    | "chest"
    | "shoulder"
    | "neck"
    | "eye"
    | "crown"
    | "overhead";

  /** Every height, lowest first: the order `nearest` breaks a tie by and a nudge names a neighbour from. */
  export const HEIGHTS: readonly Height[] = [
    "floor",
    "knee",
    "hip",
    "waist",
    "chest",
    "shoulder",
    "neck",
    "eye",
    "crown",
    "overhead",
  ];

  /**
   * How far above the shoulder a hand raised overhead stands, as a share of
   * the arm (provisional: the arm nearly straight, from the `raiseHand` and
   * `cheer` gestures, checked by their "hand above the head" verdicts).
   */
  export const OVERHEAD: number = 0.92;

  /**
   * How far to the acting hand's side of the midline.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the axis and that it mirrors by the acting side; `LATERALS` gives each share.
   * @evidence contracts/development/design.md#principled-representation A closed union over the half shoulder width, the measure a sideways hand place is read against.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four names, each with a shipped law that uses its share.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A side of the body is never named: the same name serves both hands and `place` mirrors it.
   */
  export type Lateral = "centre" | "inside" | "shoulder" | "outside";

  /**
   * The share of the half shoulder width each lateral name is, toward the
   * acting hand's side: `centre` on the midline (`DEFAULTS`), `inside` at 0.6
   * (`stopPalm`), `shoulder` above the joint (`raiseHand`), `outside` at 1.5
   * (`wave`; provisional, checked by the place verdict of the
   * `everyday-gesture-wave` captures across the body sweep).
   */
  export const LATERALS: Readonly<Record<Lateral, number>> = {
    centre: 0,
    inside: 0.6,
    shoulder: 1,
    outside: 1.5,
  };

  /**
   * How far ahead of the root's vertical axis.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the axis; `DISTANCES` gives each share.
   * @evidence contracts/development/design.md#principled-representation A closed union over the arm's length, the measure a reach is read against.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four names, each with a shipped law that uses its share.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No name lies past the arm's length, so a named place is always within reach of a standing body.
   */
  export type Distance = "close" | "near" | "mid" | "far";

  /**
   * The share of the arm (upper arm and forearm) each distance name is:
   * `close` at 0.1 (`raiseHand`), `near` at 0.25 (`wave`), `mid` at 0.6
   * (`DEFAULTS.desk`), `far` at 0.8 (`DEFAULTS.ahead`, `stopPalm`).
   */
  export const DISTANCES: Readonly<Record<Distance, number>> = {
    close: 0.1,
    near: 0.25,
    mid: 0.6,
    far: 0.8,
  };

  /**
   * A place of the air around the performer, by three names.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the record is; each member states its axis and the facing's value when absent.
   * @evidence contracts/development/design.md#principled-representation One name per axis of the performer's floor frame, so a reader sees where the hand is without working out a share.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three required names and the facing `IDefault` already has; read by `place` and returned by `nearest`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All three names are required, so no axis falls back to a hidden number.
   */
  export interface IGrid {
    /** How high. */
    height: Height;

    /** How far to the acting hand's side. */
    lateral: Lateral;

    /** How far ahead. */
    distance: Distance;

    /** Which way the place faces; back at the performer when absent. */
    facing?: "performer" | "up";
  }

  /**
   * A small displacement of a place in the performer's floor frame, each
   * component a share of the arm (upper arm and forearm) within `NUDGE`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frame, the unit and the bound; each member states its direction and its value when absent.
   * @evidence contracts/development/design.md#principled-representation One unit for all three components, so an author reads one number against one length; `out` mirrors by the acting side as the lateral names do.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three optional components; read by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Bounded, so a nudge cannot stand in for a raw place; the frame never follows the trunk's pitch or roll.
   */
  export interface INudge {
    /** Toward the acting hand's side; negative is toward the midline and across it; 0 when absent. */
    out?: number;

    /** Upward; 0 when absent. */
    up?: number;

    /** Forward; 0 when absent. */
    forward?: number;
  }

  /** The largest size of a nudge's component, as a share of the arm (provisional). */
  export const NUDGE: number = 0.25;

  /**
   * A named whole place: a key of `DEFAULTS`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what the names are.
   * @evidence contracts/development/design.md#principled-representation Derived from the table's keys, so a name without a record cannot be written.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One alias, read by `Place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Not a second list beside the table.
   */
  export type Name = keyof typeof DEFAULTS;

  /**
   * A named place with a nudge.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two members.
   * @evidence contracts/development/design.md#principled-representation The middle rung of a place: the name keeps the intent and the nudge states the correction.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; read by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The base is a name, never a share record, so a nudge is always read against a named place.
   */
  export interface INudged {
    /** The place nudged. */
    at: Name | IGrid;

    /** The nudge. */
    nudge: INudge;
  }

  /**
   * A place a share of the way from one named place to another.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the interpolation; each member states its range and its value when absent.
   * @evidence contracts/development/design.md#principled-representation The middle rung for a place no name states: both ends stay named and one share says how far between them.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two ends, a share and an optional nudge, which a stroke that moves about a place between two names needs; read by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ends are names, never share records, and must face the same way.
   */
  export interface IBetween {
    /** The two places. */
    between: readonly [Name | IGrid, Name | IGrid];

    /** How far from the first to the second, in [0, 1]. */
    share: number;

    /** A nudge of the place between; none when absent. */
    nudge?: INudge;
  }

  /**
   * A place stated as its share record, with where the shares come from.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the record and what a source is.
   * @evidence contracts/development/design.md#principled-representation The last rung of a place: the exact record the layer uses, for a place no name and no nudge states.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members; read by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The source is required by the type and refused when empty, so no unexplained number enters a law by this rung.
   */
  export interface IExplicit {
    /** The share record. */
    explicit: IDefault;

    /** A citation, or `provisional: <capture case name>`. */
    source: string;
  }

  /**
   * A place of the air on one of three rungs: a name (a whole place or three
   * grid names), a name with a nudge or a share between two names, or an
   * explicit share record with its source.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the three rungs.
   * @evidence contracts/development/design.md#principled-representation Intent first and geometry on demand: every rung resolves to one `IDefault`, so the primitives and the verdicts read the same record whichever rung a law writes.
   * @evidence contracts/development/design.md#minimal-and-owned-surface One union of five members; read by `place`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union and not a construction kit: the rungs do not nest.
   */
  export type Place = Name | IGrid | INudged | IBetween | IExplicit;

  /**
   * A height name as a share of the stature.
   *
   * @param body The body.
   * @param name The height.
   * @returns The share of the stature.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result's unit.
   * @evidence contracts/development/implementation.md#principled-implementation Each name is a joint height of the body's measure over its stature; the knee is the hip less the thigh, and `overhead` the shoulder plus `OVERHEAD` arms.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One exhaustive switch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No height is a typed share of the stature; the one number is the named `OVERHEAD`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse or cache.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function height(
    body: Pick<IHumanBody, "measure">,
    name: Height,
  ): number {
    const m = body.measure;
    switch (name) {
      case "floor":
        return 0;
      case "knee":
        return (m.hipHeight - m.thigh) / m.stature;
      case "hip":
        return m.hipHeight / m.stature;
      case "waist":
        return m.waistHeight / m.stature;
      case "chest":
        return m.chestHeight / m.stature;
      case "shoulder":
        return m.shoulderHeight / m.stature;
      case "neck":
        return m.neckHeight / m.stature;
      case "eye":
        return m.eyeHeight / m.stature;
      case "crown":
        return 1;
      case "overhead":
        return (
          (m.shoulderHeight + OVERHEAD * (m.upperArm + m.forearm)) / m.stature
        );
    }
  }

  /**
   * The share record a place resolves to on a body, for the acting side.
   *
   * @param body The body.
   * @param side The acting hand, which the lateral names and a nudge's `out` mirror by.
   * @param place The place, on any rung.
   * @returns The share record `fallback` and `resolve` take.
   * @throws {Error} When a nudge's component exceeds `NUDGE`, a between share lies outside [0, 1] or joins two facings, or an explicit place has an empty source.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the mirroring, the result's consumers and every refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Names read the body's measure and the share tables; a nudge in arm lengths is converted to each axis's own unit (statures up, half shoulder widths out); a between interpolates each numeric field linearly.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per rung over two private helpers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nothing is clamped: a nudge past its bound throws and names the neighbouring name, and a between of two facings throws, since a facing cannot be interpolated.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `height`, `LATERALS`, `DISTANCES` and `DEFAULTS`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function place(
    body: Pick<IHumanBody, "measure">,
    side: HumanHand.Side,
    place: Place,
  ): IDefault {
    if (typeof place === "string") return DEFAULTS[place];
    if ("explicit" in place) {
      if (place.source.trim() === "")
        throw new Error("An explicit place states its source");
      return place.explicit;
    }
    if ("at" in place)
      return nudged(
        body,
        side,
        named(body, side, place.at),
        place.nudge,
        place.at,
      );
    if ("between" in place) {
      if (!(place.share >= 0 && place.share <= 1))
        throw new Error("A between share lies in [0, 1]");
      const a: IDefault = named(body, side, place.between[0]);
      const b: IDefault = named(body, side, place.between[1]);
      if (a.facing !== b.facing)
        throw new Error("A place between two facings has no facing");
      const mix = (from: number, to: number): number =>
        from + (to - from) * place.share;
      const mixed: IDefault = {
        height: mix(a.height, b.height),
        range: mix(a.range, b.range),
        lateral: mix(a.lateral ?? 0, b.lateral ?? 0),
        facing: a.facing,
      };
      return place.nudge === undefined
        ? mixed
        : nudged(body, side, mixed, place.nudge, undefined);
    }
    return named(body, side, place);
  }

  /**
   * The names of the place a world point falls in, for the acting side: the
   * nearest `Height`, `Lateral` and `Distance` of the body as it stands in
   * the posture.
   *
   * @param body The body.
   * @param posture The root and the heading; the root's own height is not read.
   * @param side The acting hand, which the lateral names mirror by.
   * @param point The point, world metres.
   * @returns The three names; a tie goes to the name listed first in its union.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, that the root's height is not read, and the tie rule.
   * @evidence contracts/development/implementation.md#principled-implementation The inverse of `place` followed by `fallback`: the point is taken into the performer's floor frame and each axis takes the name whose resolved length is nearest, so a captured pose is checked against a law's names through a path that does not run the resolver forward.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One frame transform and one nearest-name search per axis.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A point far from every name still returns the nearest names; the caller reports the distance.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the eighteen names.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanFrame.local`, `height` and the share tables.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function nearest(
    body: Pick<IHumanBody, "measure">,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    side: HumanHand.Side,
    point: IAutoMovieVector3,
  ): Required<Pick<IGrid, "height" | "lateral" | "distance">> {
    const m = body.measure;
    const local: IAutoMovieVector3 = HumanFrame.local(
      {
        origin: { x: posture.root.x, y: 0, z: posture.root.z },
        yaw: posture.yaw,
      },
      point,
    );
    return {
      height: closest(
        HEIGHTS,
        (name: Height): number => height(body, name) * m.stature,
        local.y,
      ),
      lateral: closest(
        Object.keys(LATERALS) as Lateral[],
        (name: Lateral): number => LATERALS[name] * m.shoulderHalfWidth,
        (side === "left" ? 1 : -1) * local.x,
      ),
      distance: closest(
        Object.keys(DISTANCES) as Distance[],
        (name: Distance): number => DISTANCES[name] * (m.upperArm + m.forearm),
        local.z,
      ),
    };
  }

  /**
   * Options of a hand's goal on a place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and its default.
   * @evidence contracts/development/design.md#principled-representation What a place does not decide about a hand on it: the surface laid on it, the shape, where the fingers point and how the elbow bends.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all optional because each has a default every targetless action can take; read by `hand`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Reuses the hand's surface and shape unions and the bend presets.
   */
  export interface IHand {
    /** The surface laid on the place; the palm when absent. */
    surface?: HumanHand.Surface;

    /** The hand shape held there; relaxed when absent. */
    shape?: HumanHand.Shape;

    /** Where the surface's forward points, world; chosen by `hand` when absent. */
    forward?: IAutoMovieVector3;

    /** The elbow's preset or shares; absent with `out` absent too, the elbow place `AutoMovieMotionHumanBend.solve` finds, and `hang` where it refuses the goal. */
    bend?: AutoMovieMotionHumanBend.Arm | AutoMovieMotionHumanBend.IShares;

    /** Extra flexion of every finger joint over the shape, degrees; 0 when absent. */
    curl?: number;

    /** A share added to the bend's outward share, as a manner's `bend` is; 0 when absent. Stated without `bend`, it widens `hang`. */
    out?: number;
  }

  /**
   * A default place on a posture.
   *
   * @param body The body.
   * @param posture The root and the heading the place is ahead of.
   * @param place The default.
   * @returns The place; never solid.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and that the result is not solid.
   * @evidence contracts/development/implementation.md#principled-implementation The shares times the body's stature, arm and half shoulder width give a point of the performer's floor frame, whose origin is on the floor under the root; it faces back along the heading or up.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One floor-frame transform and one facing choice.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The floor is the world's `y = 0`, the plane every foot placement stands on, and not the root's own height, which a crouch lowers.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanFrame.point`, the owner of the floor-frame transform.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function fallback(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    place: IDefault,
  ): IPlace {
    const m = body.measure;
    const frame: HumanFrame.IFrame = {
      origin: { x: posture.root.x, y: 0, z: posture.root.z },
      yaw: posture.yaw,
    };
    return {
      point: HumanFrame.point(frame, {
        x: (place.lateral ?? 0) * m.shoulderHalfWidth,
        y: place.height * m.stature,
        z: place.range * (m.upperArm + m.forearm),
      }),
      normal:
        place.facing === "up"
          ? { x: 0, y: 1, z: 0 }
          : HumanFrame.point(
              { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
              { x: 0, y: 0, z: -1 },
            ),
      solid: false,
    };
  }

  /**
   * A target resolved to a place.
   *
   * @param context The action's body and aim.
   * @param target The target; absent for an action without one.
   * @param seconds Film seconds the target is read at.
   * @param posture The performer's posture then: a default place is ahead of it and a self region is read on it.
   * @param place The action's default place.
   * @returns The place.
   * @throws {Error} When a self region is on a limb, which a posture does not place before its limbs are solved.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input, which of them a targetless action uses and the refusal.
   * @evidence contracts/development/implementation.md#principled-implementation Each kind is read by its owner (the context's aim, the trunk's forward kinematics, the default) and marked solid when a real surface is there: a person, a prop, the performer's own body, a point given with its normal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per case of the target union.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A `none` that states a line or a range keeps the virtual opponent it asks for instead of the default; a limb's self region throws instead of reading an unsolved bone.
   * @evidence contracts/development/implementation.md#efficient-algorithms One aim or one forward-kinematics pass per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `IHumanActionContext.aim`, `HumanTrunk.region` and `fallback`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function resolve(
    context: Pick<IHumanActionContext, "aim" | "body">,
    target: AutoMovieMotionTarget | undefined,
    seconds: number,
    posture: IHumanPosture,
    place: IDefault,
  ): IPlace {
    if (target === undefined) return fallback(context.body, posture, place);
    switch (target.kind) {
      case "none":
        return target.line === undefined && target.range === undefined
          ? fallback(context.body, posture, place)
          : { ...context.aim(target, seconds), solid: false };
      case "self": {
        const bone: AutoMovieHumanoidBone =
          context.body.surfaces.regions[target.region].bone;
        if (!TRUNK.has(bone))
          throw new HumanRefusal({
            kind: "parameter",
            axis: "target",
            value: target.region,
            reason: `The region ${target.region} rides ${bone}, a limb bone a posture does not place; a self target is a region of the trunk or the head`,
            fix: "aim at a region of the trunk or the head",
          });
        return {
          ...HumanTrunk.region(context.body, posture, target.region),
          solid: true,
        };
      }
      case "point":
        return {
          ...context.aim(target, seconds),
          solid: target.normal !== undefined,
        };
      case "person":
      case "prop":
        return { ...context.aim(target, seconds), solid: true };
    }
  }

  /**
   * The horizontal unit direction from a place to a point of the body: the
   * way a body is pushed by what comes from the place, and the way it shrinks
   * from it.
   *
   * @param place The place the threat or the blow comes from.
   * @param point The point of the body, world metres.
   * @param yaw The body's heading, degrees about +Y.
   * @returns The direction, world; backward of the heading when the point is above or below the place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the direction's meaning, the inputs' frames and units and the fallback.
   * @evidence contracts/development/implementation.md#principled-implementation A standing body is displaced over the floor, so the push is the horizontal part of the line from the place to the body, normalised.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One difference and one conditional.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A source directly above or below has no horizontal direction, so the body goes backward of its own heading, the way a person recoils from a blow with no side; the threshold of a micrometre only guards the division.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `flinch`, `stagger` and `knockdown` read their direction here, on `Vector3` and `HumanFrame.point`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function away(
    place: Pick<IPlace, "point">,
    point: IAutoMovieVector3,
    yaw: number,
  ): IAutoMovieVector3 {
    const d: IAutoMovieVector3 = {
      x: point.x - place.point.x,
      y: 0,
      z: point.z - place.point.z,
    };
    return Vector3.length(d) > 1e-6
      ? Vector3.normalize(d)
      : HumanFrame.point(
          { origin: { x: 0, y: 0, z: 0 }, yaw },
          { x: 0, y: 0, z: -1 },
        );
  }

  /**
   * The arm target that lays a hand surface on a place: the surface's point
   * on the place's point and its normal against the place's normal.
   *
   * @param body The body.
   * @param posture The posture that carries the elbow's hint and the heading.
   * @param side The hand.
   * @param place The place.
   * @param options The surface, the shape, the forward, the bend and the curl.
   * @returns The target.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States how the surface meets the place and what the posture and the options decide.
   * @evidence contracts/development/implementation.md#principled-implementation A surface touches a place when their normals oppose, so the hand's rotation aligns the surface's normal with the place's reversed; the remaining turn about the normal takes the asked forward, or the heading, or up where the heading runs along the normal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One forward choice, one alignment and one bend: the solved elbow place when the options name neither a bend nor an outward share, the preset otherwise.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The default forward is never parallel to the normal: the heading is horizontal, so when it runs along the normal the vertical cannot. A goal the solver refuses takes the `hang` preset, the default before the solver, and the resolver's audits report the reach.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanHand.offset`, `HumanHand.align` and `HumanHand.place` for the rotation and the wrist, and `AutoMovieMotionHumanBend.solve` and `arm` for the hint.
   * @evidence contracts/development/implementation.md#efficient-algorithms The solver's bounded sweep runs only for a goal without a stated bend; a stated bend is one lookup.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function hand(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw"> &
      Partial<Pick<IHumanPosture, "pitch" | "roll">>,
    side: HumanHand.Side,
    place: Pick<IPlace, "point" | "normal">,
    options: IHand = {},
  ): AutoMovieMotionHumanArm.ITarget {
    const surface: HumanHand.Surface = options.surface ?? "palm";
    const shape: HumanHand.Shape = options.shape ?? "relaxed";
    const normal: IAutoMovieVector3 = Vector3.scale(
      Vector3.normalize(place.normal),
      -1,
    );
    const heading: IAutoMovieVector3 = HumanFrame.point(
      { origin: { x: 0, y: 0, z: 0 }, yaw: posture.yaw },
      { x: 0, y: 0, z: 1 },
    );
    const forward: IAutoMovieVector3 =
      options.forward ??
      (Math.abs(Vector3.dot(heading, normal)) < ALONG
        ? heading
        : { x: 0, y: 1, z: 0 });
    const rotation: IAutoMovieQuaternion = HumanHand.align(
      HumanHand.offset(body, side, surface, shape),
      { normal, forward },
    );
    return {
      surface,
      shape,
      point: place.point,
      rotation,
      bend:
        options.bend === undefined && options.out === undefined
          ? AutoMovieMotionHumanBend.solve({
              body,
              posture,
              side,
              point: HumanHand.place(
                body,
                side,
                surface,
                place.point,
                rotation,
                shape,
              ).point,
              rotation,
              fallback: "hang",
            })
          : AutoMovieMotionHumanBend.arm(
              body,
              posture,
              side,
              options.bend,
              options.out ?? 0,
            ),
      ...(options.curl === undefined ? {} : { curl: options.curl }),
    };
  }

  /**
   * The foot placement that puts a point of the sole on a place, the foot
   * flat and pointed along a heading.
   *
   * @param body The body.
   * @param side The foot.
   * @param place The place.
   * @param heading Where the foot points, degrees about +Y.
   * @param pivot The point of the sole put on the place; the ball when absent.
   * @returns The placement.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the foot's attitude and the default pivot.
   * @evidence contracts/development/implementation.md#principled-implementation The rigid relation of a sole point to the ankle under the foot's rotation, the one `HumanFoot.pivot` owns.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The place's normal is not read: a foot set down is flat on the floor, and a foot that strikes is turned by its striking law.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `HumanFoot.pivot`.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function foot(
    body: IHumanBody,
    side: "left" | "right",
    place: Pick<IPlace, "point">,
    heading: number,
    pivot: "heel" | "ball" | "toe" | "sole" = "ball",
  ): HumanFoot.IPlacement {
    return HumanFoot.pivot(body, side, pivot, place.point, heading, 0);
  }
}

/** The share record of a whole place name or of three grid names, the lateral mirrored by the side. */
function named(
  body: Pick<IHumanBody, "measure">,
  side: HumanHand.Side,
  base: AutoMovieMotionHumanTarget.Name | AutoMovieMotionHumanTarget.IGrid,
): AutoMovieMotionHumanTarget.IDefault {
  return typeof base === "string"
    ? AutoMovieMotionHumanTarget.DEFAULTS[base]
    : {
        height: AutoMovieMotionHumanTarget.height(body, base.height),
        range: AutoMovieMotionHumanTarget.DISTANCES[base.distance],
        lateral:
          (side === "left" ? 1 : -1) *
          AutoMovieMotionHumanTarget.LATERALS[base.lateral],
        facing: base.facing ?? "performer",
      };
}

/**
 * A share record moved by a nudge, each component converted from arm lengths
 * to its axis's unit; a component past the bound throws and names the
 * neighbouring name of `base`, when it has one.
 */
function nudged(
  body: Pick<IHumanBody, "measure">,
  side: HumanHand.Side,
  record: AutoMovieMotionHumanTarget.IDefault,
  nudge: AutoMovieMotionHumanTarget.INudge,
  base:
    | AutoMovieMotionHumanTarget.Name
    | AutoMovieMotionHumanTarget.IGrid
    | undefined,
): AutoMovieMotionHumanTarget.IDefault {
  const m = body.measure;
  const arm: number = m.upperArm + m.forearm;
  const component = (axis: "out" | "up" | "forward"): number => {
    const value: number = nudge[axis] ?? 0;
    if (!(Math.abs(value) <= AutoMovieMotionHumanTarget.NUDGE)) {
      const names: readonly string[] =
        axis === "up"
          ? AutoMovieMotionHumanTarget.HEIGHTS
          : Object.keys(
              axis === "out"
                ? AutoMovieMotionHumanTarget.LATERALS
                : AutoMovieMotionHumanTarget.DISTANCES,
            );
      const next: string | undefined =
        base === undefined || typeof base === "string"
          ? undefined
          : names[
              names.indexOf(
                axis === "up"
                  ? base.height
                  : axis === "out"
                    ? base.lateral
                    : base.distance,
              ) + (value > 0 ? 1 : -1)
            ];
      throw new Error(
        `A nudge of ${value} ${axis} exceeds ${AutoMovieMotionHumanTarget.NUDGE} arm lengths; ${
          next === undefined
            ? "state the place by nearer names"
            : `use the name ${next}`
        }`,
      );
    }
    return value;
  };
  return {
    height: record.height + (component("up") * arm) / m.stature,
    range: record.range + component("forward"),
    lateral:
      (record.lateral ?? 0) +
      ((side === "left" ? 1 : -1) * component("out") * arm) /
        m.shoulderHalfWidth,
    facing: record.facing,
  };
}

/** The name whose length is nearest to a value; the first listed wins a tie. */
function closest<T extends string>(
  names: readonly T[],
  length: (name: T) => number,
  value: number,
): T {
  let best: T = names[0]!;
  for (const name of names)
    if (Math.abs(length(name) - value) < Math.abs(length(best) - value))
      best = name;
  return best;
}

/** The cosine past which a heading counts as running along a normal. */
const ALONG: number = 0.9;

/** The bones a posture places without solving a limb (`HumanTrunk.resolve`). */
const TRUNK: ReadonlySet<AutoMovieHumanoidBone> =
  new Set<AutoMovieHumanoidBone>([
    "hips",
    "spine",
    "chest",
    "upperChest",
    "neck",
    "head",
    "leftEye",
    "rightEye",
    "jaw",
    "leftShoulder",
    "rightShoulder",
  ]);
