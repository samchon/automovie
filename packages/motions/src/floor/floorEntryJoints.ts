import type { AutoMovieHumanoidBone } from "@automovie/interface";

import type { IHumanPosture } from "../posture/IHumanPosture";

/**
 * Raw and explicitly fixed floor-joint interpolation share one scalar owner.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes live per-bone raw observation from an explicit fixed-endpoint reader while keeping ordered union, missing-zero and fresh clinical tuples.
 * @evidence contracts/development/design.md#principled-representation Each clinical joint is its original three degree-valued scalars; fixed preparation retains only endpoint pairs and bone order.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Raw serves public blended and prepare serves explicit jointBlend; one tuple/scalar owner prevents formula drift.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No raw immutability requirement, result cache, angle wrapping, endpoint shortcut or omitted zero joint is introduced.
 */
export namespace floorEntryJoints {
  /**
   * Blend current maps in their original per-bone observation order.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States current raw maps, clinical-degree output, ordered union and fresh output ownership.
   * @evidence contracts/development/implementation.md#principled-implementation Forms the original from-then-to key union, then reads from[bone], to[bone], and completes that bone's three scalar interpolations before reading the next bone's endpoints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One ordered union loop delegates each current pair to the shared tuple/scalar owner without preparing other bones first.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Missing endpoints retain clinical zero; every raw endpoint/component getter, throw and per-bone computation occurs at its original position, including nonfinite arithmetic.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(J) union and fresh output work for J bones; no all-endpoint snapshot or unproved raw result reuse is performed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares only the scalar interpolation formula with prepare; current raw maps are never assumed fixed or pure.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources The union and current pair end with this call; only the fresh output map/tuples return and no input/history is retained.
   */
  export function raw(
    from: IHumanPosture["joints"],
    to: IHumanPosture["joints"],
    weight: number,
  ): IHumanPosture["joints"] {
    const joints: IHumanPosture["joints"] = {};
    for (const bone of new Set([...Object.keys(from), ...Object.keys(to)]) as Set<AutoMovieHumanoidBone>) {
      const a: readonly [number, number, number] = from[bone] ?? [0, 0, 0];
      const b: readonly [number, number, number] = to[bone] ?? [0, 0, 0];
      joints[bone] = tuple(a, b, weight);
    }
    return joints;
  }

  /**
   * Prepare the ordered endpoint pairs of two explicitly unchanged maps.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Defines the explicit fixed-map/tuple premise, ordered missing-zero endpoints and fresh per-weight output.
   * @evidence contracts/development/implementation.md#principled-implementation Prepares the same union and endpoint pair for each bone, then the shared scalar owner evaluates every requested weight with the original degree-valued arithmetic.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pair preparation precedes one ordered fresh-map writer; generic raw calls use raw's separate live observation loop.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The fixed-input contract is explicit only here; raw APIs do not opt in automatically. No endpoint/zero shortcut, changed order, altered angle or sampled value changes the output.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(J) setup removes repeated union/endpoint lookup from Q fixed-pair reads; each read retains O(J) current interpolation and fresh tuples.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Only caller-owned unchanged endpoint tuples and bone order share; each current weight is independently evaluated and no result is retained.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The caller owns J bounded endpoint-pair records until its fixed transition ends; no current weight, output, callback, FK source or history is retained.
   */
  export function prepare(
    from: IHumanPosture["joints"],
    to: IHumanPosture["joints"],
  ): (weight: number) => IHumanPosture["joints"] {
    const pairs: [AutoMovieHumanoidBone, readonly [number, number, number], readonly [number, number, number]][] = [];
    for (const bone of new Set([...Object.keys(from), ...Object.keys(to)]) as Set<AutoMovieHumanoidBone>)
      pairs.push([bone, from[bone] ?? [0, 0, 0], to[bone] ?? [0, 0, 0]]);
    return (weight: number): IHumanPosture["joints"] => {
      const joints: IHumanPosture["joints"] = {};
      for (const [bone, a, b] of pairs) joints[bone] = tuple(a, b, weight);
      return joints;
    };
  }
}

/** Read each component pair once before its original scalar interpolation. */
function tuple(
  a: readonly [number, number, number],
  b: readonly [number, number, number],
  weight: number,
): [number, number, number] {
  return [linear(a[0], b[0], weight), linear(a[1], b[1], weight), linear(a[2], b[2], weight)];
}

/** The original subtraction, multiplication and addition association. */
function linear(a: number, b: number, weight: number): number {
  return a + (b - a) * weight;
}
