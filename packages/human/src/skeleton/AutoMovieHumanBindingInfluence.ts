import type { IAutoMovieHumanBindingLimb } from "./IAutoMovieHumanBindingLimb";
import type { IAutoMovieHumanBindingPlane } from "./IAutoMovieHumanBindingPlane";
import type { IAutoMovieHumanBindingTree } from "./IAutoMovieHumanBindingTree";
import { AutoMovieHumanBindingQuantize } from "./AutoMovieHumanBindingQuantize";
import { AutoMovieHumanGroinBinding } from "./AutoMovieHumanGroinBinding";
import { AutoMovieHumanJointTransition } from "./AutoMovieHumanJointTransition";
import { AutoMovieHumanLimbCapsule } from "./AutoMovieHumanLimbCapsule";
import { AutoMovieHumanLipBinding } from "./AutoMovieHumanLipBinding";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";
import { AutoMovieHumanSkinStep } from "./AutoMovieHumanSkinStep";

/**
 * The influence of the binding tree on one point: how much of its skin each
 * bone holds.
 *
 * Skin passes down the tree as a tree of cuts. A joint holds a plane, and a
 * point's share in the child rises over that plane; capsules decide what lies
 * beside what (an arm against the trunk, a digit against its neighbour, the
 * head against the neck). A leg's share falls to nothing at the midline, so
 * the two sides meet without a cut. A vertex's weights are a function of its
 * place alone, so every copy of a seam point moves together.
 */
export namespace AutoMovieHumanBindingInfluence {
  /**
   * The strongest four influences on a point, normalized.
   *
   * @param p The point, metres.
   * @param tree The binding tree.
   * @param count Rig bones, the length of the pull table.
   * @returns Four `[rig slot, weight]` pairs, strongest first.
   */
  export function influences(
    p: Math3D.Vector,
    tree: IAutoMovieHumanBindingTree,
    count: number,
  ): [number, number][] {
    return AutoMovieHumanBindingQuantize.strongest(pull(p, tree, count));
  }

  /**
   * Every bone's pull on a point, before the strongest four are taken: the
   * quantity a binding read on a grid blends between its nodes.
   *
   * @param p The point, metres.
   * @param tree The binding tree.
   * @param count Rig bones, the length of the pull table.
   * @returns Each bone's pull by rig slot, summing to one.
   */
  export function pull(
    p: Math3D.Vector,
    tree: IAutoMovieHumanBindingTree,
    count: number,
  ): Float64Array {
    const pulls: Float64Array = new Float64Array(count);

    // An arm takes what lies nearer its own capsules than the trunk's. Behind
    // its first cut that skin rests on the chest.
    let trunk: number = 1;
    for (const arm of tree.arms) {
      const mine: number = AutoMovieHumanLimbCapsule.nearest(p, arm.own);
      const theirs: number = AutoMovieHumanLimbCapsule.nearest(
        p,
        arm.limb.rivals,
      );
      const taken: number = AutoMovieHumanSkinStep.slide(
        (theirs - mine) / arm.contest,
      );
      if (taken <= 0) continue;
      trunk -= taken;
      const onward: number = taken * cutShare(arm.limb, p);
      pulls[tree.chest]! += taken - onward;
      if (onward > 0) spread(arm.limb, onward, p, pulls);
    }
    if (trunk > 0) spread(tree.root, trunk, p, pulls);
    return pulls;
  }

  /** Hand a limb's mass down its tree. */
  function spread(
    limb: IAutoMovieHumanBindingLimb,
    mass: number,
    p: Math3D.Vector,
    pulls: Float64Array,
  ): void {
    const shares: number[] = limb.kids.map(
      (k: IAutoMovieHumanBindingLimb): number => share(k, p),
    );
    const total: number = shares.reduce(
      (a: number, b: number): number => a + b,
      0,
    );
    const each: number = mass / Math.max(1, total);
    let left: number = mass;
    limb.kids.forEach((kid: IAutoMovieHumanBindingLimb, i: number): void => {
      const given: number = each * shares[i]!;
      if (given <= 0) return;
      left -= given;
      spread(kid, given, p, pulls);
    });
    pulls[limb.slot]! += left;
  }

  /** A limb's share of what its parent holds at a point. */
  function share(limb: IAutoMovieHumanBindingLimb, p: Math3D.Vector): number {
    let out: number = cutShare(limb, p);
    if (out > 0 && limb.midline > 0) {
      // Below the crotch the two legs are apart and the far side has no skin.
      if (limb.side * p[2] <= 0) return 0;
      const inside: number = AutoMovieHumanGroinBinding.inside(
        limb.side * p[2],
        limb.midline,
      );
      const clear: IAutoMovieHumanBindingPlane = limb.clear!;
      const past: number = clear.step(
        ((p[0] - clear.at[0]) * clear.normal[0] +
          (p[1] - clear.at[1]) * clear.normal[1] +
          (p[2] - clear.at[2]) * clear.normal[2]) /
          clear.half,
      );
      out *= 1 - inside * (1 - past);
    }
    if (out > 0 && limb.rivals.length !== 0)
      out *= (
        limb.bone === "head"
          ? AutoMovieHumanSkinStep.ramp
          : AutoMovieHumanSkinStep.slide
      )(
        (AutoMovieHumanLimbCapsule.nearest(p, limb.rivals) -
          AutoMovieHumanLimbCapsule.nearest(p, limb.own)) /
          limb.contest,
      );
    return out;
  }

  /** A limb's share over its own planes alone, and the jaw's under the lips. */
  function cutShare(
    limb: IAutoMovieHumanBindingLimb,
    p: Math3D.Vector,
  ): number {
    let out: number = 1;
    for (const plane of limb.planes) {
      const r: Math3D.Vector = Math3D.sub(p, plane.at);
      out *= plane.step(
        (r[0] * plane.normal[0] + r[1] * plane.normal[1] + r[2] * plane.normal[2]) /
          halfAt(plane, r),
      );
    }
    if (limb.lips !== null && out > 0)
      out *= AutoMovieHumanLipBinding.below(limb.lips, p);
    return out;
  }

  /** A plane's half width toward a point, given from the plane's point. */
  function halfAt(
    plane: IAutoMovieHumanBindingPlane,
    r: Math3D.Vector,
  ): number {
    return plane.sectors === undefined
      ? plane.half
      : AutoMovieHumanJointTransition.half(plane.sectors, r);
  }
}
