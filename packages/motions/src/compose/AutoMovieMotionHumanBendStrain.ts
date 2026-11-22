import {
  HUMANOID_REST_FRAME,
  Quaternion,
  Vector3,
  decomposeJointRotation,
  getConstraint,
  swingTwist,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../body/readHumanBone";
import type { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";
import type { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";

/**
 * The strain of an elbow place that `AutoMovieMotionHumanBendSearch` ranks
 * places by, the terms `AutoMovieMotionHumanBend.solve` states: the
 * shoulder's angles from the hanging arm's, each over half its range,
 * squared, and with a hand rotation the forearm's and the wrist's shares of
 * the turn the hand asks, a place whose turn they cannot make ranking behind
 * every place that makes it.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the strain's terms, where they are stated and who reads them.
 * @evidence contracts/development/design.md#principled-representation The strain of a place as a function of the shoulder's clinical angles and the lower arm's world rotation, the two readings every sweep of the arm gives.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One function, read by the search's own reading and by a fit that takes its hint from its own sweep.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Ranges and axes are the rig's; no arm or body is named.
 */
export namespace AutoMovieMotionHumanBendStrain {
  /**
   * The strain of an elbow place on a prepared chain.
   *
   * @param chain The prepared chain.
   * @param body The body, for the hand's range.
   * @param side The arm.
   * @param rotation The hand's world rotation, when its turn counts as strain.
   * @param neutral The hanging arm's shoulder angles; null leaves the shoulder's strain at 0.
   * @param lowerAxes The lower arm's axes.
   * @returns The strain of the shoulder's clinical angles and the lower arm's world rotation, read only with a hand rotation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each input and what the returned function reads.
   * @evidence contracts/development/implementation.md#principled-implementation A joint-range-normalised discomfort (Cruse 1986; Kee and Karwowski 2001): each angle's distance from the hanging arm's over half its range, squared, with the turn the hand asks split between the forearm's twist and the wrist's swing (the engine's `swingTwist`).
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The ranges once, then one function of the two readings.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A turn the forearm and the wrist cannot make ranks behind every turn they make (`UNMADE`), never as a smaller strain.
   * @evidence contracts/development/implementation.md#efficient-algorithms Ranges and the hand constraint are read once per scoring factory; each actual place retains its original squares, split and decomposition. Pure angle/range readers are module functions rather than three closures allocated per candidate; runtime improvement is unmeasured.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The engine owns decomposition, split and constraint lookup. All candidates use the same pure scalar readers with their actual current quaternions/ranges; no angle, strain or legality answer is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned function retains the chain's ranges and the hanging arm's angles.
   */
  export function of(
    chain: AutoMovieMotionHumanBendChain.IChain,
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    rotation: IAutoMovieQuaternion | undefined,
    neutral: AutoMovieMotionHumanBendSearch.IAngles | null,
    lowerAxes: IAutoMovieJointAxes,
    clinical?: (
      hand: IAutoMovieJointConstraint | null,
      axes: IAutoMovieJointAxes | undefined,
    ) => void,
  ): (
    u: AutoMovieMotionHumanBendSearch.IAngles,
    lowerWorld: () => IAutoMovieQuaternion,
  ) => number {
    const prepared: AutoMovieMotionHumanBendChain.IChain["prepared"] =
      chain.prepared;
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
      readHumanBone(body, `${side}Hand`)?.constraint ?? null,
    );
    const wrist: number | null = half(hand?.flexion ?? null);
    const handAxes: IAutoMovieJointAxes | undefined = chain.axes[`${side}Hand`];
    clinical?.(hand, handAxes);
    return (
      u: AutoMovieMotionHumanBendSearch.IAngles,
      lowerWorld: () => IAutoMovieQuaternion,
    ): number => {
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
          Quaternion.multiply(Quaternion.inverse(lowerWorld()), rotation),
        );
        const split: ReturnType<typeof swingTwist> = swingTwist(
          needed,
          lowerAxes.twist,
        );
        strain +=
          share(degrees(split.twist), forearm) +
          share(degrees(split.swing), wrist);
        // A turn the forearm and the wrist cannot make leaves the hand off its
        // rotation, so such a place ranks behind every place that makes it.
        // Each turn is read signed, since a wrist's range is not symmetric
        // about its rest: the forearm's about its own axis, the wrist's as
        // the clinical angles of its joint (the engine's decomposition on the
        // hand's own chart), whose signs name the same motion on either hand,
        // where a sign read about a rig axis is the other hand's opposite.
        const bent: AutoMovieMotionHumanBendSearch.IAngles | null =
          handAxes === undefined
            ? null
            : decomposeJointRotation(
                Quaternion.normalize(split.swing),
                handAxes,
                HUMANOID_REST_FRAME[`${side}Hand`],
                { bone: `${side}Hand`, constraint: hand },
              );
        const unmade: number =
          past(
            about(split.twist, lowerAxes.twist),
            prepared.lowerDomain.constraint?.twist,
          ) +
          (bent === null
            ? 0
            : past(bent.flexion, hand?.flexion) +
              past(bent.abduction, hand?.abduction));
        if (unmade > 0) strain = UNMADE + unmade;
      }
      return strain;
    };
  }

  /**
   * A certified lower bound of the strain `of` reads, from the shoulder's
   * angles alone, for a search that reads the hand's costly share only where
   * the bound cannot decide a comparison (`hingedSwivelAhead`'s deferred
   * deviation).
   *
   * @param chain The prepared chain.
   * @param rotation The hand's world rotation; absent, the strain is the shoulder's share alone and nothing is deferred.
   * @param neutral The hanging arm's shoulder angles; null leaves the shoulder's strain at 0.
   * @returns The bound of a place from its shoulder angles, or null where the hand's turn adds no strain.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is bounded, from what, and the null case.
   * @evidence contracts/development/implementation.md#principled-implementation The strain is the shoulder's share plus the hand's non-negative shares, or `UNMADE` plus a positive excess; the shoulder's share, computed with the same terms in the same order, is at most the first (adding non-negative doubles never lowers a sum under rounding to nearest), and its minimum with `UNMADE` is at most the second, so it bounds both from below.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The ranges once, then the shoulder's three squares and one minimum.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bound is never ranked as the strain: the comparator reads the exact strain wherever the bound leaves a comparison open.
   * @evidence contracts/development/implementation.md#efficient-algorithms Three squares per place, against the hand's split and decomposition it defers.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares `share` and the ranges' halves with `of`, so the shoulder's share is the same number in both.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned function retains the ranges' halves and the hanging arm's angles.
   */
  export function least(
    chain: AutoMovieMotionHumanBendChain.IChain,
    rotation: IAutoMovieQuaternion | undefined,
    neutral: AutoMovieMotionHumanBendSearch.IAngles | null,
  ): ((u: AutoMovieMotionHumanBendSearch.IAngles) => number) | null {
    if (rotation === undefined) return null;
    const upperRange: IAutoMovieJointConstraint | null =
      chain.prepared.upperDomain.constraint;
    const halves: [number | null, number | null, number | null] = [
      half(upperRange?.flexion ?? null),
      half(upperRange?.abduction ?? null),
      half(upperRange?.twist ?? null),
    ];
    return (u: AutoMovieMotionHumanBendSearch.IAngles): number =>
      Math.min(
        neutral === null
          ? 0
          : share(u.flexion - neutral.flexion, halves[0]) +
              share(u.abduction - neutral.abduction, halves[1]) +
              share(u.twist - neutral.twist, halves[2]),
        UNMADE,
      );
  }

  /** The strain from which a place counts as leaving the hand's turn unmade; every made place strains less. */
  const UNMADE: number = 1e6;

  /**
   * The share of a range kept free at each end when a hand's turn is judged
   * (provisional): the place is solved once while the region then moves with
   * the head, so a turn that ends on a limit is lost a moment later.
   */
  const RESERVE: number = 0.1;

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

  /** Original squared share of a clinical range; a fixed axis contributes nothing. */
  function share(value: number, of: number | null): number {
    return of === null ? 0 : (value / of) ** 2;
  }

  /** Original shortest normalized quaternion angle from rest, in degrees. */
  function degrees(q: IAutoMovieQuaternion): number {
    return (
      (Quaternion.angle(Quaternion.normalize(q), Quaternion.identity()) * 180) /
      Math.PI
    );
  }

  /** Original signed turn about the rig axis, preserving the near-zero branch. */
  function about(
    q: IAutoMovieQuaternion,
    axis: IAutoMovieVector3 | undefined,
  ): number {
    const n: IAutoMovieQuaternion = Quaternion.normalize(q);
    const sign: number = n.w < 0 ? -1 : 1;
    const sine: number = Math.hypot(n.x, n.y, n.z);
    return axis === undefined || sine < 1e-9
      ? 0
      : ((Vector3.dot({ x: n.x, y: n.y, z: n.z }, axis) * sign) / sine) *
          ((2 * Math.atan2(sine, Math.abs(n.w)) * 180) / Math.PI);
  }

  /** Original degree excess beyond the clinical range's reserved interior. */
  function past(
    value: number,
    range: { min: number; max: number } | null | undefined,
  ): number {
    return range === null || range === undefined
      ? 0
      : Math.max(
          0,
          range.min + RESERVE * (range.max - range.min) - value,
          value - range.max + RESERVE * (range.max - range.min),
        );
  }
}
