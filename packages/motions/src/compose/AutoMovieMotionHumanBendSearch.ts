import {
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  decomposeJointRotation,
  getConstraint,
  hingedArmArticulation,
  jointRomOvershoot,
  swingTwist,
} from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieBone,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanArmClearance } from "../posture/HumanArmClearance";
import type { AutoMovieMotionHumanBend } from "./AutoMovieMotionHumanBend";
import { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";

/**
 * The elbow search of `AutoMovieMotionHumanBend`: the swivel sweep of a hand
 * goal's elbow over its circle, each place read for its joints' overshoot,
 * the forearm's clearance of the body and its strain, and the best place
 * under a ranking the caller gives. The rule of an allowed place and the
 * strain's terms are stated on `AutoMovieMotionHumanBend.solve`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is searched, what a place is read for, who ranks it and where the rules are stated.
 * @evidence contracts/development/design.md#principled-representation One search shared by the solver, its level variant and its strain reading, which differ only in the ranking they pass.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The candidate and score records, the side ranking and the search.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Ranges, axes and clearance are the rig's and the engine's; the hanging arm is read from the body.
 */
export namespace AutoMovieMotionHumanBendSearch {
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

  /**
   * Three clinical angles of a joint, degrees.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States that the members are the clinical flexion, abduction and twist in degrees.
   * @evidence contracts/development/design.md#principled-representation A ball joint's three clinical angles in degrees, the form the rig's range-of-motion tables and the hanging arm's reading use.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Three members, all read by `ICandidate` and by the hanging-arm cache; no member is added for another joint.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts All three members are required and named by axis, not a positional tuple.
   */
  export interface IAngles {
    /** Flexion. */
    flexion: number;

    /** Abduction. */
    abduction: number;

    /** Twist. */
    twist: number;
  }

  /**
   * One elbow place of a hand goal as the search reads it.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its frame and unit: the elbow in world metres, the shoulder's angles in degrees, the overshoot in degrees (0 when the place is allowed) and the strain unitless.
   * @evidence contracts/development/design.md#principled-representation A place on the swivel circle with the two readings the choice is made by: how far it is from being allowed (joints out of range plus the forearm inside its clearance, in degrees) and how strained the arm is.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Four members, all read by the rankings that `solve`, `level` and `strain` pass; the elbow is what the solver returns.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Allowed is the overshoot being 0, not a separate flag that could disagree with it.
   */
  export interface ICandidate {
    /** The elbow's place, world metres. */
    elbow: IAutoMovieVector3;

    /** The shoulder's clinical angles, degrees. */
    angles: IAngles;

    /** Degrees out of range plus the forearm's depth inside its clearance of the body as degrees of upper arm turn; 0 when allowed. */
    overshoot: number;

    /** The strain, unitless. */
    strain: number;
  }

  /**
   * What the engine's swivel sweep orders candidates by: `overshoot` first, compared exactly, then `deviation`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two keys, their order and that the first is compared exactly.
   * @evidence contracts/development/design.md#principled-representation A lexicographic key of two numbers, legality before preference, the form the engine's swivel sweep orders candidates by.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by the engine's sweep; each ranking the solver passes builds one.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The first key is compared exactly, so no tolerance lets a disallowed place outrank an allowed one.
   */
  export interface IScore {
    /** The first key. */
    overshoot: number;

    /** The second key. */
    deviation: number;
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the order it gives and why the allowed pose of a place comes first.
   * @evidence contracts/development/implementation.md#principled-implementation Within one degree of the side, the sweep's own step, a candidate keeps its overshoot and strain; every other ranks behind by its side.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One closure over one side reading.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A candidate off the side never ranks as allowed.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work per candidate.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to reuse.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The ranking closes over three points.
   */
  export function toward(
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
    chain: AutoMovieMotionHumanBendChain.IChain,
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
   * @param hang The `hang` preset's hint for an upright trunk at the origin.
   * @returns The angles, or null when the rig has no arm chain.
   */
  function neutralOf(
    body: IHumanBody,
    side: AutoMovieMotionHumanBend.Side,
    hang: (
      body: IHumanBody,
      side: AutoMovieMotionHumanBend.Side,
    ) => IAutoMovieVector3,
  ): IAngles | null {
    const known: IAngles | undefined = NEUTRAL.get(body)?.[side];
    if (known !== undefined) return known;
    const posture = { root: { x: 0, y: 0, z: 0 }, yaw: 0 };
    const chain: AutoMovieMotionHumanBendChain.IChain | null =
      AutoMovieMotionHumanBendChain.of(body, posture, side);
    if (chain === null) return null;
    const point: IAutoMovieVector3 = {
      x: chain.shoulder.x,
      y: chain.shoulder.y - 0.99 * chain.span,
      z: chain.shoulder.z,
    };
    const hint: IAutoMovieVector3 = hang(body, side);
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
   * @param hang The `hang` preset's hint for an upright trunk at the origin, from which the hanging arm's angles are read.
   * @returns The candidate, or the reason there is none.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the result and the reasons there is none.
   * @evidence contracts/development/implementation.md#principled-implementation The chain on the request's trunk, a wrist beyond the arm's span refused, then the engine's swivel sweep ranked by the caller.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Prepare, refuse, sweep.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A rig without the chain, an unreachable wrist and a degenerate chain each return their reason, never a guessed place.
   * @evidence contracts/development/implementation.md#efficient-algorithms One chain preparation and the engine's bounded sweep.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The hanging arm's angles are computed once per body and side.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only those angles, in a weak map keyed by the body.
   */
  export function search(
    props: AutoMovieMotionHumanBend.ISolve,
    rank: (
      chain: AutoMovieMotionHumanBendChain.IChain,
    ) => (candidate: ICandidate) => IScore,
    hang: (
      body: IHumanBody,
      side: AutoMovieMotionHumanBend.Side,
    ) => IAutoMovieVector3,
  ): ICandidate | string {
    const chain: AutoMovieMotionHumanBendChain.IChain | null =
      AutoMovieMotionHumanBendChain.of(props.body, props.posture, props.side);
    const neutral: IAngles | null = neutralOf(props.body, props.side, hang);
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
}
