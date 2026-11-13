import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  decomposeJointRotation,
  getConstraint,
  hingedArmArticulation,
  jointRomOvershoot,
  prepareChainPlant,
  resolveBoneMap,
  skeletonJointAxes,
  swingTwist,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMoviePose,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanRefusal } from "../law/HumanRefusal";
import { HumanArmClearance } from "../posture/HumanArmClearance";
import type { HumanColliders } from "../posture/HumanColliders";
import { HumanFrame } from "../posture/HumanFrame";
import type { HumanHand } from "../posture/HumanHand";
import type { IHumanPosture } from "../posture/IHumanPosture";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";

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
 * strain among the places the ranges of motion and the trunk allow.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what a hint decides, the frame and unit of an elbow's and a knee's hint, when a law passes its own point and what a goal without a preset takes.
 * @evidence contracts/development/design.md#principled-representation A hint is the pole vector of two-bone inverse kinematics; an elbow's is stated in upper-arm lengths from the shoulder so one preset fits every body, a knee's follows the foot's heading as the knee does in gait.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One table of presets, three preset functions and the solver with its strain reading; the only owner of default bends, read by every law that builds a limb goal.
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
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One search and one refusal check; the search and the strain live in private helpers shared with `strain`.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unreachable wrist and a circle with no allowed place are refused with the reason; the fallback is taken only when the caller names it, and no candidate is clamped into range.
   * @evidence contracts/development/implementation.md#efficient-algorithms One forward kinematics of the rig and at most 720 candidates plus their refinements, each two decompositions and four shape distances.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the engine's chain preparation, swivel sweep, clinical decomposition and range overshoot, and `HumanArmClearance`, the owner of a forearm's clearance.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only the hanging arm's three angles per body and side, in a weak map keyed by the body.
   */
  export function solve(props: ISolve): IAutoMovieVector3 {
    const found: ICandidate | string = search(
      props,
      (): ((candidate: ICandidate) => IScore) =>
        (candidate: ICandidate): IScore => ({
          overshoot: candidate.overshoot,
          deviation: candidate.strain,
        }),
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
   * @throws When the wrist is out of reach or no place on the circle is allowed, and no `fallback` is given.
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
    const found: ICandidate | string = search(
      props,
      (chain: IChain): ((candidate: ICandidate) => IScore) =>
        (candidate: ICandidate): IScore => ({
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
    const found: ICandidate | string = search(
      props,
      (chain: IChain): ((candidate: ICandidate) => IScore) =>
        toward(chain.shoulder, props.point, bend),
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
    const chain: IChain | null = chainOf(props.body, props.posture, props.side);
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
}

/** The strain from which a place counts as leaving the hand's turn unmade; every made place strains less. */
const UNMADE: number = 1e6;

/**
 * The share of a range kept free at each end when a hand's turn is judged
 * (provisional): the place is solved once while the region then moves with
 * the head, so a turn that ends on a limit is lost a moment later.
 */
const RESERVE: number = 0.1;

/** The hanging arm's shoulder angles by body and side, clinical degrees. */
const NEUTRAL: WeakMap<
  IHumanBody,
  Partial<Record<AutoMovieMotionHumanBend.Side, IAngles>>
> = new WeakMap();

/** Three clinical angles of a joint, degrees. */
interface IAngles {
  /** Flexion. */
  flexion: number;

  /** Abduction. */
  abduction: number;

  /** Twist. */
  twist: number;
}

/** One elbow place of a hand goal as the search reads it. */
interface ICandidate {
  /** The elbow's place, world metres. */
  elbow: IAutoMovieVector3;

  /** The shoulder's clinical angles, degrees. */
  angles: IAngles;

  /** Degrees out of range plus the forearm's depth inside its clearance of the body as degrees of upper arm turn; 0 when allowed. */
  overshoot: number;

  /** The strain, unitless. */
  strain: number;
}

/** An arm chain prepared on a posture's trunk. */
interface IChain {
  /** The engine's preparation of the chain. */
  prepared: NonNullable<ReturnType<typeof prepareChainPlant>>;

  /** The shoulder joint, world metres. */
  shoulder: IAutoMovieVector3;

  /** The arm's length from the shoulder to the wrist, metres. */
  span: number;

  /** The rig's clinical axes by bone. */
  axes: ReturnType<typeof skeletonJointAxes>;

  /** The trunk's placed colliders, world metres. */
  shapes: HumanColliders.IPlaced[];
}

/**
 * An arm chain on a posture's trunk, or null when the rig has no such chain.
 *
 * @param body The body.
 * @param posture The root and the heading; an absent pitch or roll is 0.
 * @param side The arm.
 * @returns The chain with the trunk's shapes posed.
 */
function chainOf(
  body: IHumanBody,
  posture: AutoMovieMotionHumanBend.ISolve["posture"],
  side: AutoMovieMotionHumanBend.Side,
): IChain | null {
  const axes: ReturnType<typeof skeletonJointAxes> = skeletonJointAxes(
    body.skeleton,
    HUMANOID_JOINT_AXES,
  );
  const pose: IAutoMoviePose = {
    skeleton: body.skeleton.id,
    root: {
      translation: posture.root,
      rotation: resolveHumanPosture.heading({
        yaw: posture.yaw,
        pitch: posture.pitch ?? 0,
        roll: posture.roll ?? 0,
      }),
      scale: { x: 1, y: 1, z: 1 },
    },
    joints: [],
  };
  const prepared: ReturnType<typeof prepareChainPlant> = prepareChainPlant({
    skeleton: body.skeleton,
    pose,
    chain: {
      upper: `${side}UpperArm`,
      lower: `${side}LowerArm`,
      effector: `${side}Hand`,
    },
    topology: body.topology,
    jointAxes: axes,
    restFrames: HUMANOID_REST_FRAME,
  });
  if (prepared === null) return null;
  return {
    prepared,
    shoulder: prepared.upper.worldPosition,
    span:
      Vector3.length(prepared.lowerOffset) +
      Vector3.length(prepared.effectorOffset),
    axes,
    shapes: HumanArmClearance.trunk(
      body,
      resolveBoneMap(
        body.skeleton,
        pose,
        body.topology,
        axes,
        HUMANOID_REST_FRAME,
      ),
    ),
  };
}

/**
 * How far an elbow lies from a point's side of the shoulder-to-wrist line:
 * 1 less the cosine of the angle between the two, each taken across the
 * line, so 0 is the same side and 2 the opposite one. A point on the line has
 * no side and reads 0.
 *
 * @param shoulder The shoulder, world metres.
 * @param wrist The wrist, world metres.
 * @param elbow The elbow, world metres.
 * @param toward The point, world metres.
 * @returns A number from 0 to 2.
 */
function away(
  shoulder: IAutoMovieVector3,
  wrist: IAutoMovieVector3,
  elbow: IAutoMovieVector3,
  toward: IAutoMovieVector3,
): number {
  const axis: IAutoMovieVector3 = Vector3.normalize(
    Vector3.subtract(wrist, shoulder),
  );
  const across = (p: IAutoMovieVector3): IAutoMovieVector3 => {
    const v: IAutoMovieVector3 = Vector3.subtract(p, shoulder);
    return Vector3.subtract(v, Vector3.scale(axis, Vector3.dot(v, axis)));
  };
  const a: IAutoMovieVector3 = across(elbow);
  const b: IAutoMovieVector3 = across(toward);
  return Vector3.length(a) < 1e-9 || Vector3.length(b) < 1e-9
    ? 0
    : 1 - Vector3.dot(Vector3.normalize(a), Vector3.normalize(b));
}

/** What the engine's swivel sweep orders candidates by: `overshoot` first, compared exactly, then `deviation`. */
interface IScore {
  /** The first key. */
  overshoot: number;

  /** The second key. */
  deviation: number;
}

/** `away` at one degree, the step of the engine's swivel sweep, so a side always holds a swept candidate. */
const SIDE: number = 1 - Math.cos(Math.PI / 180);

/**
 * The ranking that takes the elbow place on a point's side of the
 * shoulder-to-wrist line. Candidates within one degree of that side come
 * first, ordered by their overshoot and then by their strain plus `away`,
 * which is under 0.0002 there. An elbow place has two arm poses, one per
 * bend branch, and this order takes the allowed one. Every other candidate
 * follows, nearer sides first.
 *
 * @param shoulder The shoulder, world metres.
 * @param wrist The wrist, world metres.
 * @param bend The point whose side is taken, world metres.
 * @returns The ranking.
 */
function toward(
  shoulder: IAutoMovieVector3,
  wrist: IAutoMovieVector3,
  bend: IAutoMovieVector3,
): (candidate: ICandidate) => IScore {
  return (candidate: ICandidate): IScore => {
    const side: number = away(shoulder, wrist, candidate.elbow, bend);
    return side <= SIDE
      ? { overshoot: candidate.overshoot, deviation: candidate.strain + side }
      : { overshoot: 1e9 * (1 + side), deviation: 0 };
  };
}

/**
 * Half the width of a range, degrees, or null for an axis that does not move.
 *
 * @param range The axis's range.
 * @returns Half its width, or null.
 */
function half(range: { min: number; max: number } | null): number | null {
  return range === null || range.max <= range.min
    ? null
    : (range.max - range.min) / 2;
}

/**
 * The best elbow place of a chain for a wrist's place under a ranking.
 *
 * @param chain The prepared chain.
 * @param body The body, for the hand's range.
 * @param side The arm.
 * @param point The wrist, world metres.
 * @param rotation The hand's world rotation, when its turn counts as strain.
 * @param neutral The hanging arm's shoulder angles; null leaves the shoulder's strain at 0.
 * @param score The ranking of a candidate.
 * @returns The chosen candidate with its true overshoot, or null for a degenerate chain.
 */
function best(
  chain: IChain,
  body: IHumanBody,
  side: AutoMovieMotionHumanBend.Side,
  point: IAutoMovieVector3,
  rotation: IAutoMovieQuaternion | undefined,
  neutral: IAngles | null,
  score: (candidate: ICandidate) => IScore,
): ICandidate | null {
  const { prepared } = chain;
  const upperBone: AutoMovieHumanoidBone = prepared.chain.upper;
  const lowerBone: AutoMovieHumanoidBone = prepared.chain.lower;
  const lowerAxes: IAutoMovieJointAxes | undefined = chain.axes[lowerBone];
  if (lowerAxes === undefined) return null;
  const upperRange: IAutoMovieJointConstraint | null =
    prepared.upperDomain.constraint;
  const halves: [number | null, number | null, number | null] = [
    half(upperRange?.flexion ?? null),
    half(upperRange?.abduction ?? null),
    half(upperRange?.twist ?? null),
  ];
  const forearm: number | null = half(
    prepared.lowerDomain.constraint?.twist ?? null,
  );
  const hand: IAutoMovieJointConstraint | null = getConstraint(
    `${side}Hand`,
    body.skeleton.bones.find(
      (b: IAutoMovieBone): boolean => b.bone === `${side}Hand`,
    )?.constraint ?? null,
  );
  const wrist: number | null = half(hand?.flexion ?? null);
  const handAxes: IAutoMovieJointAxes | undefined = chain.axes[`${side}Hand`];
  const share = (value: number, of: number | null): number =>
    of === null ? 0 : (value / of) ** 2;
  const read = (
    upper: IAutoMovieQuaternion,
    lower: IAutoMovieQuaternion,
  ): ICandidate => {
    const u: IAngles = decomposeJointRotation(
      upper,
      chain.axes[upperBone],
      HUMANOID_REST_FRAME[upperBone],
      prepared.upperDomain,
    );
    const l: IAngles = decomposeJointRotation(
      lower,
      lowerAxes,
      HUMANOID_REST_FRAME[lowerBone],
      prepared.lowerDomain,
    );
    const turned: IAutoMovieQuaternion = Quaternion.multiply(
      prepared.upper.worldRotation,
      upper,
    );
    const elbow: IAutoMovieVector3 = Vector3.add(
      chain.shoulder,
      Quaternion.rotateVector(turned, prepared.lowerOffset),
    );
    let strain: number =
      neutral === null
        ? 0
        : share(u.flexion - neutral.flexion, halves[0]) +
          share(u.abduction - neutral.abduction, halves[1]) +
          share(u.twist - neutral.twist, halves[2]);
    if (rotation !== undefined) {
      // The canonical rig rests unrotated, so the hand's rotation in the
      // forearm's frame is the turn the forearm and the wrist share.
      const needed: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(
          Quaternion.inverse(
            Quaternion.multiply(
              Quaternion.multiply(turned, prepared.lowerRotation),
              lower,
            ),
          ),
          rotation,
        ),
      );
      const split = swingTwist(needed, lowerAxes.twist);
      const degrees = (q: IAutoMovieQuaternion): number =>
        (Quaternion.angle(Quaternion.normalize(q), Quaternion.identity()) *
          180) /
        Math.PI;
      strain +=
        share(degrees(split.twist), forearm) +
        share(degrees(split.swing), wrist);
      // A turn the forearm and the wrist cannot make leaves the hand off its
      // rotation, so such a place ranks behind every place that makes it.
      // Each turn is read signed about its own axis, since a wrist's range
      // is not symmetric about its rest.
      const about = (
        q: IAutoMovieQuaternion,
        axis: IAutoMovieVector3 | undefined,
      ): number => {
        const n: IAutoMovieQuaternion = Quaternion.normalize(q);
        const sign: number = n.w < 0 ? -1 : 1;
        const sine: number = Math.hypot(n.x, n.y, n.z);
        return axis === undefined || sine < 1e-9
          ? 0
          : ((Vector3.dot({ x: n.x, y: n.y, z: n.z }, axis) * sign) / sine) *
              ((2 * Math.atan2(sine, Math.abs(n.w)) * 180) / Math.PI);
      };
      const past = (
        value: number,
        range: { min: number; max: number } | null | undefined,
      ): number =>
        range === null || range === undefined
          ? 0
          : Math.max(
              0,
              range.min + RESERVE * (range.max - range.min) - value,
              value - range.max + RESERVE * (range.max - range.min),
            );
      const unmade: number =
        past(
          about(split.twist, lowerAxes.twist),
          prepared.lowerDomain.constraint?.twist,
        ) +
        past(about(split.swing, handAxes?.flexion), hand?.flexion) +
        past(about(split.swing, handAxes?.abduction), hand?.abduction);
      if (unmade > 0) strain = UNMADE + unmade;
    }
    return {
      elbow,
      angles: u,
      overshoot:
        jointRomOvershoot({ bone: upperBone, ...u }, upperRange) +
        jointRomOvershoot(
          { bone: lowerBone, ...l },
          prepared.lowerDomain.constraint,
        ) +
        HumanArmClearance.overshoot(body, chain.shapes, elbow, point, side),
      strain,
    };
  };
  const solved: ReturnType<typeof hingedArmArticulation> =
    hingedArmArticulation({
      upper: prepared.upper,
      midOffset: prepared.lowerOffset,
      midRest: prepared.lowerRotation,
      endOffset: prepared.effectorOffset,
      hinge: lowerAxes.flexion,
      target: point,
      score: (
        upper: IAutoMovieQuaternion,
        lower: IAutoMovieQuaternion,
      ): IScore => score(read(upper, lower)),
    });
  return solved === null ? null : read(solved.upper, solved.lower);
}

/**
 * The shoulder angles of an unloaded hanging arm: the wrist 0.99 arm lengths
 * straight below the shoulder of an upright trunk, the elbow on the `hang`
 * preset's side. Computed once per body and side.
 *
 * @param body The body.
 * @param side The arm.
 * @returns The angles, or null when the rig has no arm chain.
 */
function neutralOf(
  body: IHumanBody,
  side: AutoMovieMotionHumanBend.Side,
): IAngles | null {
  const known: IAngles | undefined = NEUTRAL.get(body)?.[side];
  if (known !== undefined) return known;
  const posture = { root: { x: 0, y: 0, z: 0 }, yaw: 0 };
  const chain: IChain | null = chainOf(body, posture, side);
  if (chain === null) return null;
  const point: IAutoMovieVector3 = {
    x: chain.shoulder.x,
    y: chain.shoulder.y - 0.99 * chain.span,
    z: chain.shoulder.z,
  };
  const hint: IAutoMovieVector3 = AutoMovieMotionHumanBend.arm(
    body,
    posture,
    side,
    "hang",
  );
  const hanging: ICandidate | null = best(
    chain,
    body,
    side,
    point,
    undefined,
    null,
    toward(chain.shoulder, point, hint),
  );
  if (hanging === null) return null;
  NEUTRAL.set(body, { ...NEUTRAL.get(body), [side]: hanging.angles });
  return hanging.angles;
}

/**
 * The search `solve` and `strain` share: prepares the chain, refuses a wrist
 * out of reach and returns the best candidate under a ranking.
 *
 * @param props The request.
 * @param rank The ranking of a candidate, given the prepared chain.
 * @returns The candidate, or the reason there is none.
 */
function search(
  props: AutoMovieMotionHumanBend.ISolve,
  rank: (chain: IChain) => (candidate: ICandidate) => IScore,
): ICandidate | string {
  const chain: IChain | null = chainOf(props.body, props.posture, props.side);
  const neutral: IAngles | null = neutralOf(props.body, props.side);
  if (chain === null || neutral === null) return "the rig has no arm chain";
  const distance: number = Vector3.length(
    Vector3.subtract(props.point, chain.shoulder),
  );
  if (distance > chain.span)
    return `the wrist is ${distance.toFixed(3)} m from the shoulder and the arm is ${chain.span.toFixed(3)} m long`;
  return (
    best(
      chain,
      props.body,
      props.side,
      props.point,
      props.rotation,
      neutral,
      rank(chain),
    ) ?? "the arm chain is degenerate"
  );
}
