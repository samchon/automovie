import { HUMANOID_REST_FRAME, Quaternion, Vector3, AutoMovieEngineMath, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  IAutoMovieJointAxes,
  IAutoMovieJointConstraint,
  IAutoMovieMotionHumanBody,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { readHumanBone } from "../body/internal/readHumanBone";
import type { AutoMovieMotionHumanBendChain } from "./AutoMovieMotionHumanBendChain";
import type { AutoMovieMotionHumanBendSearch } from "./AutoMovieMotionHumanBendSearch";

/** The record of `IPastRange`'s site. */
type IPastRange = { min: number; max: number };

/** The record of `IHalfRange`'s site. */
type IHalfRange = { min: number; max: number };

/**
 * Half the width of a range, degrees, or null for an axis that does not move.
 *
 * @param range The axis's range.
 * @returns Half its width, or null.
 */
function half(range: IHalfRange | null): number | null {
  return range === null || range.max <= range.min
    ? null
    : (range.max - range.min) / 2;
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
function past(value: number, range: IPastRange | null | undefined): number {
  return range === null || range === undefined
    ? 0
    : Math.max(
        0,
        range.min +
          AutoMovieMotionHumanBendStrain.RESERVE * (range.max - range.min) -
          value,
        value -
          range.max +
          AutoMovieMotionHumanBendStrain.RESERVE * (range.max - range.min),
      );
}

/**
 * The strain of an elbow place on a prepared chain.
 *
 * @param chain The prepared chain.
 * @param body The body, for the hand's range.
 * @param side The arm.
 * @param rotation The hand's world rotation, when its turn counts as strain.
 * @param neutral The hanging arm's shoulder angles; null leaves the shoulder's
 *   strain at 0.
 * @param lowerAxes The lower arm's axes.
 * @returns The strain of the shoulder's clinical angles and the lower arm's
 *   world rotation, read only with a hand rotation.
 */
export function AutoMovieMotionHumanBendStrain(
  chain: AutoMovieMotionHumanBendChain.IChain,
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  rotation: IAutoMovieQuaternion | undefined,
  neutral: AutoMovieMotionHumanBendSearch.IAngles | null,
  lowerAxes: IAutoMovieJointAxes,
): (
  u: AutoMovieMotionHumanBendSearch.IAngles,
  lowerWorld: () => IAutoMovieQuaternion,
) => number {
  const prepared: AutoMovieMotionHumanBendChain.IChain["prepared"] =
    chain.prepared;
  const halves: AutoMovieMotionHumanBendStrain.IHalves =
    AutoMovieMotionHumanBendStrain.halvesOf(prepared.upperDomain.constraint);
  const forearm: number | null = half(
    prepared.lowerDomain.constraint?.twist ?? null,
  );
  const wristOf: AutoMovieMotionHumanBendStrain.IHand =
    AutoMovieMotionHumanBendStrain.handOf(chain, body, side);
  const hand: IAutoMovieJointConstraint | null = wristOf.range;
  const wrist: number | null = half(hand?.flexion ?? null);
  const handAxes: IAutoMovieJointAxes | undefined = wristOf.axes;
  return (
    u: AutoMovieMotionHumanBendSearch.IAngles,
    lowerWorld: () => IAutoMovieQuaternion,
  ): number => {
    let strain: number =
      neutral === null
        ? 0
        : AutoMovieMotionHumanBendStrain.share(
            u.flexion - neutral.flexion,
            halves[0],
          ) +
          AutoMovieMotionHumanBendStrain.share(
            u.abduction - neutral.abduction,
            halves[1],
          ) +
          AutoMovieMotionHumanBendStrain.share(
            u.twist - neutral.twist,
            halves[2],
          );
    if (rotation !== undefined) {
      // The canonical rig rests unrotated, so the hand's rotation in the
      // forearm's frame is the turn the forearm and the wrist share.
      const needed: IAutoMovieQuaternion = Quaternion.normalize(
        Quaternion.multiply(Quaternion.inverse(lowerWorld()), rotation),
      );
      const split: ReturnType<typeof AutoMovieEngineMath.decomposeSwingTwist> = AutoMovieEngineMath.decomposeSwingTwist(
        needed,
        lowerAxes.twist,
      );
      strain +=
        AutoMovieMotionHumanBendStrain.share(degrees(split.twist), forearm) +
        AutoMovieMotionHumanBendStrain.share(degrees(split.swing), wrist);
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
          : AutoMovieEngineKinematics.decomposeJointRotation(
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
      if (unmade > 0) strain = AutoMovieMotionHumanBendStrain.UNMADE + unmade;
    }
    return strain;
  };
}

/**
 * The strain of an elbow place that `AutoMovieMotionHumanBendSearch` ranks
 * places by, the terms `AutoMovieMotionHumanBend.solve` states: the shoulder's
 * angles from the hanging arm's, each over half its range, squared, and with a
 * hand rotation the forearm's and the wrist's shares of the turn the hand asks,
 * a place whose turn they cannot make ranking behind every place that makes
 * it.
 */
export namespace AutoMovieMotionHumanBendStrain {
  /**
   * A certified lower bound of the strain `of` reads, from the shoulder's
   * angles alone, for a search that reads the hand's costly share only where
   * the bound cannot decide a comparison (`hingedSwivelAhead`'s deferred
   * deviation).
   *
   * @param chain The prepared chain.
   * @param rotation The hand's world rotation; absent, the strain is the
   *   shoulder's share alone and nothing is deferred.
   * @param neutral The hanging arm's shoulder angles; null leaves the
   *   shoulder's strain at 0.
   * @returns The bound of a place from its shoulder angles, or null where the
   *   hand's turn adds no strain.
   */
  export function least(
    chain: AutoMovieMotionHumanBendChain.IChain,
    rotation: IAutoMovieQuaternion | undefined,
    neutral: AutoMovieMotionHumanBendSearch.IAngles | null,
  ): ((u: AutoMovieMotionHumanBendSearch.IAngles) => number) | null {
    if (rotation === undefined) return null;
    const halves: IHalves = halvesOf(chain.prepared.upperDomain.constraint);
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

  /**
   * The strain from which a place counts as leaving the hand's turn unmade;
   * every made place strains less.
   */
  export const UNMADE: number = 1e6;

  /**
   * The hand's range and clinical axes the strain decomposes the wrist's swing
   * on.
   */
  export interface IHand {
    /** The hand's range of motion, or null where the rig gives none. */
    range: IAutoMovieJointConstraint | null;

    /** The hand's clinical axes, or undefined where the rig gives none. */
    axes: IAutoMovieJointAxes | undefined;
  }

  /**
   * The hand's range and axes, as the strain reads them.
   *
   * @param chain The prepared chain.
   * @param body The body.
   * @param side The arm.
   * @returns The range and the axes.
   */
  export function handOf(
    chain: AutoMovieMotionHumanBendChain.IChain,
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
  ): IHand {
    return {
      range: AutoMovieEngineKinematics.getConstraint(
        `${side}Hand`,
        readHumanBone(body, `${side}Hand`)?.constraint ?? null,
      ),
      axes: chain.axes[`${side}Hand`],
    };
  }

  /**
   * Half the width of each shoulder axis's range, degrees, in the order
   * flexion, abduction, twist; null for an axis that does not move.
   */
  export type IHalves = readonly [number | null, number | null, number | null];

  /**
   * The shoulder's half ranges the strain divides by.
   *
   * @param range The upper arm's range of motion, or null.
   * @returns Each axis's half width, degrees, or null.
   */
  export function halvesOf(range: IAutoMovieJointConstraint | null): IHalves {
    return [
      half(range?.flexion ?? null),
      half(range?.abduction ?? null),
      half(range?.twist ?? null),
    ];
  }

  /**
   * The share of a range kept free at each end when a hand's turn is judged
   * (provisional): the place is solved once while the region then moves with
   * the head, so a turn that ends on a limit is lost a moment later.
   */
  export const RESERVE: number = 0.1;

  /**
   * The squared share of a clinical range a departure takes, the term the
   * strain sums; a fixed axis contributes nothing.
   *
   * @param value The departure from the hanging arm's angle, degrees.
   * @param of The axis's half range, degrees, or null for a fixed axis.
   * @returns The unitless square.
   */
  export function share(value: number, of: number | null): number {
    return of === null ? 0 : (value / of) ** 2;
  }
}
