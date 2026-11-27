import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieMotionHumanBend,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanHand,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolvedJointAngles,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../../law/HumanRefusal";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";
import { AutoMovieMotionHumanBendPreparation } from "./AutoMovieMotionHumanBendPreparation";
import { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";
import { AutoMovieMotionHumanBendTurn } from "./AutoMovieMotionHumanBendTurn";
import { AutoMovieMotionHumanKneeBend } from "./AutoMovieMotionHumanKneeBend";

/** The alternatives of `LevelFound`'s site. */
type LevelFound = AutoMovieMotionHumanBendSearch.ICandidate | string;

/** The alternatives of `PrepareBothFixed`'s site. */
type PrepareBothFixed = "body" | "posture";

/** The alternatives of `PrepareFixed`'s site. */
type PrepareFixed = "body" | "posture" | "side";

/** The alternatives of `KneePosture`'s site. */
type KneePosture = "root" | "yaw";

/** The alternatives of `HangPostureItem`'s site. */
type HangPostureItem = "pitch" | "roll";

/** The alternatives of `HangPosture`'s site. */
type HangPosture = "root" | "yaw";

/** The alternatives of `ArmPreset`'s site. */
type ArmPreset =
  | IAutoMovieMotionHumanBend.Arm
  | IAutoMovieMotionHumanBend.IShares;

/** The alternatives of `ArmPostureItem`'s site. */
type ArmPostureItem = "pitch" | "roll";

/** The alternatives of `ArmPosture`'s site. */
type ArmPosture = "root" | "yaw";

/**
 * Bend hints: the world point an elbow or a knee bends toward, from a named
 * preset on a posture.
 *
 * A limb goal places the wrist or the ankle and leaves one freedom, the turn of
 * the middle joint about the line from the limb's root to its end. The hint
 * fixes it. An elbow's hint is a point beside the shoulder, stated in upper-arm
 * lengths outward, upward and forward of the shoulder's rest place and carried
 * by the posture's root rotation, so it follows a turned and a leaned trunk. A
 * knee's hint is a point one metre ahead of the knee's rest place along the
 * foot's heading, so the knee bends over the foot (Perry and Burnfield, Gait
 * Analysis, 2nd ed.).
 *
 * A law takes a preset and passes its own point only where its action bends the
 * limb another way, with the reason in a comment. A hand goal that names no
 * preset takes the elbow place `solve` finds: the one of least joint strain
 * among the places the ranges of motion and the trunk allow. The search over
 * those places is `AutoMovieMotionHumanBendSearch`'s, on the arm chain
 * `AutoMovieMotionHumanBendChain` prepares.
 */
export namespace AutoMovieMotionHumanBend {
  /** The arm holds of {@link IAutoMovieMotionHumanBend.Arm}, as data. */
  export const ARMS = [
    "hang",
    "tucked",
    "behind",
    "front",
    "folded",
    "forward",
    "akimbo",
    "raised",
  ] as const satisfies readonly NonNullable<IAutoMovieMotionHumanBend.Arm>[];

  /**
   * The elbow presets (provisional shares, each the value its first user was
   * captured with):
   *
   * - `hang`: down, a little out and behind, as an unloaded arm hangs; the
   *   default of every reach;
   * - `tucked`: down and close to the flank, a hand in a pocket or a fist drawn
   *   back;
   * - `behind`: down and back, the hands met behind the body;
   * - `front`: down and slightly forward, the hands met in front of the body;
   * - `folded`: down and forward, a forearm laid across the body;
   * - `forward`: ahead of the shoulder and down, a hand at the chin or a guard;
   * - `akimbo`: out wide at waist height, a hand on the hip;
   * - `raised`: out wide above the shoulder, a hand behind the head.
   */
  export const ARM: Readonly<
    Record<IAutoMovieMotionHumanBend.Arm, IAutoMovieMotionHumanBend.IShares>
  > = {
    hang: { out: 0.4, up: -1, forward: -0.5 },
    tucked: { out: 0.35, up: -1, forward: -0.3 },
    behind: { out: 0.35, up: -0.9, forward: -0.4 },
    front: { out: 0.3, up: -0.9, forward: 0.1 },
    folded: { out: 0.3, up: -0.9, forward: 0.3 },
    forward: { out: 0.1, up: -0.8, forward: 0.6 },
    akimbo: { out: 0.9, up: -0.4, forward: -0.1 },
    raised: { out: 0.9, up: 0.5, forward: 0.3 },
  };

  /**
   * An elbow's bend hint.
   *
   * @param body The body.
   * @param posture The root and the heading that carry the trunk; a pitch and a
   *   roll left out count as 0.
   * @param side The arm.
   * @param preset A named preset or the shares themselves.
   * @param out Extra outward share of the upper arm, for a wider elbow than the
   *   preset's; 0 by default.
   * @returns The world point, metres.
   */
  export function arm(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, ArmPosture> &
      Partial<Pick<IAutoMovieMotionHumanPosture, ArmPostureItem>>,
    side: AutoMovieHumanSide,
    preset: ArmPreset = "hang",
    out: number = 0,
  ): IAutoMovieVector3 {
    const shares: IAutoMovieMotionHumanBend.IShares =
      typeof preset === "string" ? ARM[preset] : preset;
    const shoulder: IAutoMovieVector3 = body.rest.get(`${side}UpperArm`)!;
    const sign: number = side === "left" ? 1 : -1;
    const length: number = body.measure.upperArm;
    return Vector3.add(
      posture.root,
      Quaternion.rotateVector(
        humanPostureHeading({
          yaw: posture.yaw,
          pitch: posture.pitch ?? 0,
          roll: posture.roll ?? 0,
        }),
        {
          x: shoulder.x + sign * (shares.out + out) * length,
          y: shoulder.y + shares.up * length,
          z: shoulder.z + shares.forward * length,
        },
      ),
    );
  }

  /**
   * The hint of an unloaded arm: the `hang` preset, widened by a share.
   *
   * @param body The body.
   * @param posture The root and the heading that carry the trunk.
   * @param side The arm.
   * @param out Extra outward share of the upper arm; 0 by default.
   * @returns The world point, metres.
   */
  export function hang(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, HangPosture> &
      Partial<Pick<IAutoMovieMotionHumanPosture, HangPostureItem>>,
    side: AutoMovieHumanSide,
    out: number = 0,
  ): IAutoMovieVector3 {
    return arm(body, posture, side, "hang", out);
  }

  /**
   * A knee's bend hint: one metre ahead of the knee's rest place along a
   * heading.
   *
   * @param body The body.
   * @param posture The root and the heading that carry the knee's rest place.
   * @param side The leg.
   * @param heading Where the foot points, degrees about +Y; the posture's
   *   heading when absent.
   * @param splay Degrees the knee opens away from the midline past that
   *   heading; 0 by default.
   * @returns The world point, metres.
   */
  export function knee(
    body: IAutoMovieMotionHumanBody,
    posture: Pick<IAutoMovieMotionHumanPosture, KneePosture>,
    side: AutoMovieHumanSide,
    heading: number = posture.yaw,
    splay: number = 0,
  ): IAutoMovieVector3 {
    return AutoMovieMotionHumanKneeBend.at(body, posture, side, heading, splay);
  }

  /**
   * Prepare the original knee hint for a fixed foot heading and moving body
   * frame.
   */
  export function prepareKnee(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    heading: number,
    splay: number = 0,
  ): ReturnType<typeof AutoMovieMotionHumanKneeBend.prepare> {
    return AutoMovieMotionHumanKneeBend.prepare(body, side, heading, splay);
  }

  /** Prepare a fixed body's trunk and side for actual solve/strain queries. */
  export function prepare(
    fixed: Pick<IAutoMovieMotionHumanBend.ISolve, PrepareFixed>,
  ): AutoMovieMotionHumanBendPreparation.IPrepared {
    return AutoMovieMotionHumanBendPreparation(fixed);
  }

  /**
   * Share genuine trunk geometry across actual sides within one person
   * evaluation.
   */
  export function prepareBoth(
    fixed: Pick<IAutoMovieMotionHumanBend.ISolve, PrepareBothFixed>,
    resolution?: Parameters<typeof AutoMovieMotionHumanBendPreparation.both>[1],
  ): ReturnType<typeof AutoMovieMotionHumanBendPreparation.both> {
    return AutoMovieMotionHumanBendPreparation.both(fixed, resolution);
  }
  /**
   * The elbow place of least joint strain for a hand goal.
   *
   * A wrist's place leaves the elbow free on a circle about the line from the
   * shoulder to the wrist. Every place on it is tried at one degree steps and
   * refined between steps. A place is allowed when the shoulder and the elbow
   * stay inside their ranges of motion and the forearm clears the trunk, the
   * neck and the head along its length (`HumanArmClearance.overshoot`). Among
   * the allowed places the one of least strain is returned. Strain is the sum,
   * over the shoulder's flexion, abduction and twist, of the squared distance
   * from the angle an unloaded hanging arm has, each divided by half that
   * axis's range. A hand rotation adds the forearm's twist and the wrist's bend
   * the rotation needs, each squared and divided by half its range. The weights
   * are 1 and provisional. A place whose forearm twist, wrist flexion or wrist
   * deviation would come within `RESERVE` of the end of its range, each read
   * signed as its joint's clinical angle (so the same motion reads the same on
   * either hand), is one where the hand cannot make the rotation with room to
   * spare; it ranks behind every place that makes it, by the degrees left
   * unmade.
   *
   * @param props The request.
   * @returns The elbow's place, world metres, usable as a bend hint.
   * @throws When the wrist is farther from the shoulder than the arm is long,
   *   or no place on the circle is allowed, and no `fallback` is given.
   */
  export function solve(
    props: IAutoMovieMotionHumanBend.ISolve,
  ): IAutoMovieVector3 {
    return prepare(props).solve(props);
  }

  /**
   * The elbow place that holds the upper arm level for a hand goal: on the
   * circle the wrist's place leaves the elbow, the allowed place whose height
   * is nearest the shoulder's, as a salute, a toast and a shading hand hold the
   * arm. Where two places are as near, the one of less strain.
   *
   * @param props The request.
   * @returns The elbow's place, world metres, usable as a bend hint.
   * @throws {HumanRefusal} A `reach` refusal on `elbow` that offers the
   *   `natural` elbow, when the wrist is out of reach or no place on the circle
   *   is allowed, and no `fallback` is given.
   */
  export function level(
    props: IAutoMovieMotionHumanBend.ISolve,
  ): IAutoMovieVector3 {
    const found: LevelFound = AutoMovieMotionHumanBendSearch.search(
      props,
      (
        chain: AutoMovieMotionHumanBendChain.IChain,
      ): ((
        candidate: AutoMovieMotionHumanBendSearch.ICandidate,
      ) => AutoMovieMotionHumanBendSearch.IScore) =>
        (
          candidate: AutoMovieMotionHumanBendSearch.ICandidate,
        ): AutoMovieMotionHumanBendSearch.IScore => ({
          overshoot: candidate.overshoot,

          // Metres from the shoulder's height; the strain only breaks a tie.
          deviation:
            Math.abs(candidate.elbow.y - chain.shoulder.y) +
            1e-4 * Math.min(candidate.strain, 10),
        }),
    );
    if (typeof found !== "string" && found.overshoot === 0) return found.elbow;
    if (props.fallback !== undefined)
      return arm(props.body, props.posture, props.side, props.fallback);
    throw new HumanRefusal({
      kind: "reach",
      axis: "elbow",
      value: "level",
      feasible: { kind: "alternatives", values: ["natural"] },
      reason: `no elbow place holds the ${props.side} upper arm for this hand goal: ${
        typeof found === "string"
          ? found
          : "every place leaves a joint out of range or the forearm inside the body"
      }`,
      fix: "leave the elbow natural, or move the target to where the arm can bend to it",
    });
  }

  /**
   * The strain of a hand goal with its elbow toward a given point.
   *
   * @param props The request; its `fallback` is not read.
   * @param bend The point the elbow bends toward, world metres.
   * @returns The strain `solve` minimises, a unitless number; `Infinity` when
   *   the wrist is out of reach or that elbow place is not allowed.
   */
  export function strain(
    props: IAutoMovieMotionHumanBend.ISolve,
    bend: IAutoMovieVector3,
  ): number {
    return prepare(props).strain(props, bend);
  }

  /**
   * An elbow place turned about the line from the shoulder to the wrist.
   *
   * @param props The request; its `fallback` is not read.
   * @param elbow The elbow's place, world metres.
   * @param degrees The turn, counter-clockwise seen from the wrist looking at
   *   the shoulder.
   * @returns The turned place, world metres, at the same distance from the
   *   line; the place itself when the rig has no such arm or the elbow lies on
   *   the line.
   */
  export function turn(
    props: IAutoMovieMotionHumanBend.ISolve,
    elbow: IAutoMovieVector3,
    degrees: number,
  ): IAutoMovieVector3 {
    return AutoMovieMotionHumanBendTurn(props, elbow, degrees);
  }

  /**
   * The strain `solve` ranks elbow places by, for a limb fit that takes its
   * elbow's hint from its own swivel sweep (`fitChainToTarget`'s `strain`): the
   * fit's legal candidate of least strain is the place `solve` would take, read
   * on the fit's own chain.
   *
   * @param props The body, the arm and the hand's world rotation, when its turn
   *   counts as strain.
   * @returns The strain of a candidate from its upper arm's bone-local rotation
   *   and its lower arm's world rotation, or null when the rig has no arm
   *   chain.
   */
  export function strainOf(
    props: IAutoMovieMotionHumanHand.IStrainOfProps,
  ):
    | ((
        upper: IAutoMovieQuaternion,
        lower: IAutoMovieQuaternion,
        lowerWorld: IAutoMovieQuaternion,
      ) => number)
    | null {
    return AutoMovieMotionHumanBendSearch.strainOf(
      props.body,
      props.side,
      props.rotation,
    );
  }

  /**
   * The shoulder angles of a body's unloaded hanging arm, the angles the strain
   * `solve` minimises is measured from: the wrist under the relaxed elbow, the
   * elbow on the `hang` preset's side of an upright trunk at the origin
   * (`AutoMovieMotionHumanBendSearch.hanging`). A body reads it once per side
   * (`IAutoMovieMotionHumanBody.hanging`).
   *
   * @param body The body.
   * @param side The arm.
   * @returns The clinical angles, degrees, or null when the rig has no arm
   *   chain.
   */
  export function hanging(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): IAutoMovieResolvedJointAngles | null {
    return AutoMovieMotionHumanBendSearch.hanging(
      body,
      side,
      arm(body, { root: { x: 0, y: 0, z: 0 }, yaw: 0 }, side, "hang"),
    );
  }
}
