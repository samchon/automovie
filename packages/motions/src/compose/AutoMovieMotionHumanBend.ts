import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";
import { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";

/**
 * Bend hints: the world point an elbow or a knee bends toward, from a named
 * preset on a posture.
 *
 * A limb goal places the wrist or the ankle and leaves one freedom, the turn
 * of the middle joint about the line from the limb's root to its end. The
 * hint fixes it. An elbow's hint is a point beside the shoulder, stated in
 * upper-arm lengths outward, upward and forward of the shoulder's rest place
 * and carried by the posture's root rotation, so it follows a turned and a
 * leaned trunk. A knee's hint is a point one metre ahead of the knee's rest
 * place along the foot's heading, so the knee bends over the foot (Perry and
 * Burnfield, Gait Analysis, 2nd ed.).
 *
 * A law takes a preset and passes its own point only where its action bends
 * the limb another way, with the reason in a comment. A hand goal that names
 * no preset takes the elbow place `solve` finds: the one of least joint
 * strain among the places the ranges of motion and the trunk allow. The
 * search over those places is `AutoMovieMotionHumanBendSearch`'s, on the
 * arm chain `AutoMovieMotionHumanBendChain` prepares.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a hint decides, the frame and unit of an elbow's and a knee's hint, when a law passes its own point and what a goal without a preset takes.
 * @evidence contracts/development/design.md#principled-representation A hint is the pole vector of two-bone inverse kinematics; an elbow's is stated in upper-arm lengths from the shoulder so one preset fits every body, a knee's follows the foot's heading as the knee does in gait.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One table of presets, three preset functions, the solver with its level variant and its strain reading, and the turn of a hint about an axis; the only owner of default bends, read by every law that builds a limb goal.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Presets are a closed union keyed into one table; shares are plain numbers of a stated unit, and no law name appears.
 */
export namespace AutoMovieMotionHumanBend {
  /**
   * A side of the body.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the two sides a limb is on.
   * @evidence contracts/development/design.md#principled-representation The body's bilateral symmetry as a closed union, the form the rig's bone names take.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, used by every function here.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A literal union, not a string.
   */
  export type Side = HumanHand.Side;

  /**
   * An elbow hint in upper-arm lengths from the shoulder's rest place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the origin and the unit; each member gives its direction and sign.
   * @evidence contracts/development/design.md#principled-representation Three shares along the trunk's own axes, scaled by the upper arm, so the hint keeps its place on a short and a long arm.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, the least that places a point; read by `arm` and held by `ARM`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All members required and named by direction, instead of a positional tuple.
   */
  export interface IShares {
    /** Away from the midline. */
    out: number;

    /** Upward; negative is below the shoulder. */
    up: number;

    /** Forward; negative is behind the shoulder. */
    forward: number;
  }

  /**
   * A named elbow hint; `ARM` states each one.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Says what the names are and where each is described.
   * @evidence contracts/development/design.md#principled-representation The distinct places an elbow takes about the trunk: hanging, close, behind, in front, across, ahead, wide low and wide high.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Eight names, each with a first user among the shipped laws; a law that needs another passes shares.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union that keys the table exhaustively; the names describe the elbow, not an action.
   */
  export type Arm = (typeof ARMS)[number];

  /** The arm holds of {@link Arm}, as data. */
  export const ARMS = [
    "hang",
    "tucked",
    "behind",
    "front",
    "folded",
    "forward",
    "akimbo",
    "raised",
  ] as const;

  /**
   * The elbow presets (provisional shares, each the value its first user was
   * captured with):
   *
   * - `hang`: down, a little out and behind, as an unloaded arm hangs; the
   *   default of every reach;
   * - `tucked`: down and close to the flank, a hand in a pocket or a fist
   *   drawn back;
   * - `behind`: down and back, the hands met behind the body;
   * - `front`: down and slightly forward, the hands met in front of the body;
   * - `folded`: down and forward, a forearm laid across the body;
   * - `forward`: ahead of the shoulder and down, a hand at the chin or a
   *   guard;
   * - `akimbo`: out wide at waist height, a hand on the hip;
   * - `raised`: out wide above the shoulder, a hand behind the head.
   */
  export const ARM: Readonly<Record<Arm, IShares>> = {
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
   * @param posture The root and the heading that carry the trunk; a pitch and a roll left out count as 0.
   * @param side The arm.
   * @param preset A named preset or the shares themselves.
   * @param out Extra outward share of the upper arm, for a wider elbow than the preset's; 0 by default.
   * @returns The world point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input's frame, the default preset, what `out` adds and the result's frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The shoulder's rest place plus the shares times the upper arm, mirrored by side, turned by the posture's root rotation and moved to its root: a rigid point of the trunk.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One table lookup and one rigid transform.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The preset values are named provisional in `ARM`; an absent pitch or roll is 0 by the stated rule, and nothing is clamped.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `resolveHumanPosture.heading`, the one owner of a posture's root rotation.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function arm(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw"> &
      Partial<Pick<IHumanPosture, "pitch" | "roll">>,
    side: Side,
    preset: Arm | IShares = "hang",
    out: number = 0,
  ): IAutoMovieVector3 {
    const shares: IShares = typeof preset === "string" ? ARM[preset] : preset;
    const shoulder: IAutoMovieVector3 = body.rest.get(`${side}UpperArm`)!;
    const sign: number = side === "left" ? 1 : -1;
    const length: number = body.measure.upperArm;
    return Vector3.add(
      posture.root,
      Quaternion.rotateVector(
        resolveHumanPosture.heading({
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which preset it is, what `out` adds and the result's frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The `hang` preset of `arm`, the hint every reach takes by default.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One call of `arm`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Adds no value of its own; the shares are `ARM.hang`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Delegates to `arm`, so the transform exists once.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function hang(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw"> &
      Partial<Pick<IHumanPosture, "pitch" | "roll">>,
    side: Side,
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
   * @param heading Where the foot points, degrees about +Y; the posture's heading when absent.
   * @param splay Degrees the knee opens away from the midline past that heading; 0 by default.
   * @returns The world point, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frames, the default heading, the sign of `splay` and the result's frame and unit.
   * @evidence contracts/development/implementation.md#principled-implementation The knee's rest place carried by the root and the heading, then a unit step along the foot's heading opened outward by the splay: the knee tracks over the foot (Perry and Burnfield).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two nested floor-frame transforms.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The one-metre step only sets a direction and is stated; a positive heading turns left, so the left knee opens by `+splay` and the right by `-splay`.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per call.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `HumanFrame.point`, the owner of the floor-frame transform.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function knee(
    body: IHumanBody,
    posture: Pick<IHumanPosture, "root" | "yaw">,
    side: Side,
    heading: number = posture.yaw,
    splay: number = 0,
  ): IAutoMovieVector3 {
    return HumanFrame.point(
      {
        origin: HumanFrame.point(
          { origin: posture.root, yaw: posture.yaw },
          body.rest.get(`${side}LowerLeg`)!,
        ),
        yaw: heading + (side === "left" ? splay : -splay),
      },
      { x: 0, y: 0, z: 1 },
    );
  }

  /**
   * A request for the elbow place of a hand goal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame, its unit and what its absence means.
   * @evidence contracts/development/design.md#principled-representation The inputs of the swivel choice of two-bone inverse kinematics: the trunk that carries the shoulder, the wrist's place and, when the hand is turned, its rotation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Six members read by `solve` and `strain`; the trunk is stated as `arm` states it, so one posture serves the preset and the solver.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A refusal is an error unless the caller names the preset to fall back on; nothing is defaulted silently.
   */
  export interface ISolve {
    /** The body. */
    body: IHumanBody;

    /** The root and the heading that carry the trunk; a pitch and a roll left out count as 0. */
    posture: Pick<IHumanPosture, "root" | "yaw"> &
      Partial<Pick<IHumanPosture, "pitch" | "roll">>;

    /** The arm. */
    side: Side;

    /** The wrist's place, world metres. */
    point: IAutoMovieVector3;

    /** The hand's world rotation from its rest; absent, the hand's turn adds no strain. */
    rotation?: IAutoMovieQuaternion;

    /** The preset or shares `solve` returns when no elbow place is allowed; absent, it throws. */
    fallback?: Arm | IShares;
  }

  /**
   * The elbow place of least joint strain for a hand goal.
   *
   * A wrist's place leaves the elbow free on a circle about the line from
   * the shoulder to the wrist. Every place on it is tried at one degree
   * steps and refined between steps. A place is allowed when the shoulder and
   * the elbow stay inside their ranges of motion and the forearm clears the
   * trunk, the neck and the head along its length
   * (`HumanArmClearance.overshoot`). Among the allowed places
   * the one of least strain is returned. Strain is the sum, over the
   * shoulder's flexion, abduction and twist, of the squared distance from the
   * angle an unloaded hanging arm has, each divided by half that axis's
   * range. A hand rotation adds the forearm's twist and the wrist's bend the
   * rotation needs, each squared and divided by half its range. The weights
   * are 1 and provisional. A place whose forearm twist, wrist flexion or
   * wrist deviation would come within `RESERVE` of the end of its range,
   * each read signed about its own axis, is one where the hand cannot make
   * the rotation with room to spare; it ranks behind every place that makes
   * it, by the degrees left unmade.
   *
   * @param props The request.
   * @returns The elbow's place, world metres, usable as a bend hint.
   * @throws When the wrist is farther from the shoulder than the arm is long, or no place on the circle is allowed, and no `fallback` is given.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the freedom solved, the rule of an allowed place, the strain's terms and units, the result's frame and each refusal.
   * @evidence contracts/development/implementation.md#principled-implementation The swivel parameterisation of Tolani, Goswami and Badler 2000 through the engine's `hingedArmArticulation`, with legality ranked before a joint-range-normalised discomfort, the form of Cruse 1986 and of Kee and Karwowski 2001.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One search and one refusal check; the search and the strain live in `AutoMovieMotionHumanBendSearch`, shared with `level` and `strain`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable wrist and a circle with no allowed place are refused with the reason; the fallback is taken only when the caller names it, and no candidate is clamped into range.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics of the rig and at most 720 candidates plus their refinements, each two decompositions and four shape distances.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's chain preparation, swivel sweep, clinical decomposition and range overshoot, and `HumanArmClearance`, the owner of a forearm's clearance.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the hanging arm's three angles per body and side, in a weak map keyed by the body.
   */
  export function solve(props: ISolve): IAutoMovieVector3 {
    const found: AutoMovieMotionHumanBendSearch.ICandidate | string =
      AutoMovieMotionHumanBendSearch.search(
        props,
        (): ((
          candidate: AutoMovieMotionHumanBendSearch.ICandidate,
        ) => AutoMovieMotionHumanBendSearch.IScore) =>
          (
            candidate: AutoMovieMotionHumanBendSearch.ICandidate,
          ): AutoMovieMotionHumanBendSearch.IScore => ({
            overshoot: candidate.overshoot,
            deviation: candidate.strain,
          }),
        hung,
      );
    if (typeof found !== "string" && found.overshoot === 0) return found.elbow;
    if (props.fallback !== undefined)
      return arm(props.body, props.posture, props.side, props.fallback);
    throw new HumanRefusal({
      kind: "reach",
      axis: "target",
      value: props.side,
      reason: `AutoMovieMotionHumanBend.solve found no elbow place for the ${props.side} hand: ${
        typeof found === "string"
          ? found
          : "every place leaves a joint out of range or the forearm inside the body"
      }`,
      fix: "move the target to where the arm can bend to it: nearer the shoulder's side and off the body",
    });
  }

  /**
   * The elbow place that holds the upper arm level for a hand goal: on the
   * circle the wrist's place leaves the elbow, the allowed place whose
   * height is nearest the shoulder's, as a salute, a toast and a shading
   * hand hold the arm. Where two places are as near, the one of less strain.
   *
   * @param props The request.
   * @returns The elbow's place, world metres, usable as a bend hint.
   * @throws {HumanRefusal} A `reach` refusal on `elbow` that offers the `natural` elbow, when the wrist is out of reach or no place on the circle is allowed, and no `fallback` is given.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which place is chosen, the tie rule, the result's frame and the refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The same swivel circle and legality as `solve`, ranked by the elbow's height from the shoulder's instead of by strain: a level upper arm is an elbow at the shoulder's height.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One search with another ranking, and `solve`'s refusal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An arm that cannot be level at this wrist takes the allowed place nearest to it, never a place out of range.
   * @evidence contracts/development/implementation.md#efficient-algorithms The same bounded sweep as `solve`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares `search` with `solve` and `strain`.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only what `solve` retains.
   */
  export function level(props: ISolve): IAutoMovieVector3 {
    const found: AutoMovieMotionHumanBendSearch.ICandidate | string =
      AutoMovieMotionHumanBendSearch.search(
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
        hung,
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
   * @returns The strain `solve` minimises, a unitless number; `Infinity` when the wrist is out of reach or that elbow place is not allowed.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States which elbow place is measured, the unit and the meaning of `Infinity`.
   * @evidence contracts/development/implementation.md#principled-implementation Takes the elbow places within one degree of the bend point's side of the shoulder-to-wrist line, the sweep's own step, and reads the same strain and the same legality `solve` ranks by. An elbow place has two arm poses, one per bend branch of the hinge, so an allowed pose ranks before the other.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One search ranked by side, then one read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A side with no allowed place within that degree reads as `Infinity`, never as the strain of a farther place that is allowed.
   * @evidence contracts/development/implementation.md#efficient-algorithms The same bounded sweep as `solve`.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares `search` with `solve`, so a preset and the solver are compared on one measure.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only what `solve` retains.
   */
  export function strain(props: ISolve, bend: IAutoMovieVector3): number {
    const found: AutoMovieMotionHumanBendSearch.ICandidate | string =
      AutoMovieMotionHumanBendSearch.search(
        props,
        (
          chain: AutoMovieMotionHumanBendChain.IChain,
        ): ((
          candidate: AutoMovieMotionHumanBendSearch.ICandidate,
        ) => AutoMovieMotionHumanBendSearch.IScore) =>
          AutoMovieMotionHumanBendSearch.toward(
            chain.shoulder,
            props.point,
            bend,
          ),
        hung,
      );
    return typeof found === "string" || found.overshoot !== 0
      ? Infinity
      : found.strain;
  }

  /**
   * An elbow place turned about the line from the shoulder to the wrist.
   *
   * @param props The request; its `fallback` is not read.
   * @param elbow The elbow's place, world metres.
   * @param degrees The turn, counter-clockwise seen from the wrist looking at the shoulder.
   * @returns The turned place, world metres, at the same distance from the line; the place itself when the rig has no such arm or the elbow lies on the line.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the axis, the turn's sense, the result's frame and the two cases with nothing to turn.
   * @evidence contracts/development/implementation.md#principled-implementation The swivel angle of Tolani, Goswami and Badler 2000: the elbow's one freedom once the wrist is placed is its turn about the shoulder-to-wrist line.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The foot of the elbow on the line and one rotation of the radial vector.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Legality is not judged here: a caller reads `strain` on the result.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the shoulder from the chain `solve` and `strain` prepare.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms One chain preparation and constant work.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function turn(
    props: ISolve,
    elbow: IAutoMovieVector3,
    degrees: number,
  ): IAutoMovieVector3 {
    const chain: AutoMovieMotionHumanBendChain.IChain | null =
      AutoMovieMotionHumanBendChain.of(props.body, props.posture, props.side);
    if (chain === null) return elbow;
    const axis: IAutoMovieVector3 = Vector3.subtract(
      props.point,
      chain.shoulder,
    );
    if (!(Vector3.length(axis) > 1e-9)) return elbow;
    const line: IAutoMovieVector3 = Vector3.normalize(axis);
    const foot: IAutoMovieVector3 = Vector3.add(
      chain.shoulder,
      Vector3.scale(
        line,
        Vector3.dot(Vector3.subtract(elbow, chain.shoulder), line),
      ),
    );
    const radial: IAutoMovieVector3 = Vector3.subtract(elbow, foot);
    if (!(Vector3.length(radial) > 1e-9)) return elbow;
    const angle: number = (degrees * Math.PI) / 180;
    return Vector3.add(
      foot,
      Vector3.add(
        Vector3.scale(radial, Math.cos(angle)),
        Vector3.scale(Vector3.cross(line, radial), Math.sin(angle)),
      ),
    );
  }

  /** The `hang` preset's hint for an upright trunk at the origin, from which the search reads the hanging arm. */
  const hung = (body: IHumanBody, side: Side): IAutoMovieVector3 =>
    arm(body, { root: { x: 0, y: 0, z: 0 }, yaw: 0 }, side, "hang");
}
