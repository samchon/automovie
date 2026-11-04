import * as THREE from "three";

import type { AutoMovieHumanPolygon } from "./AutoMovieHumanPolygon.js";
import type { buildHumanPolygonModule } from "./buildHumanPolygonModule.js";

/**
 * The original polygon builder's section dimensions and joint averages.
 *
 * @evidence contracts/common.md#principled-implementation Preserves circular area under elliptical widening and arithmetic joint centres exactly as the original drawing.
 * @evidence contracts/common.md#clear-and-simple-design Separates unchanged small geometric helpers from module selection.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Introduces no fitted coordinates, anatomical coefficients or shape correction.
 * @evidence contracts/common.md#meaningful-documentation States original formulas and source joint/metric ownership.
 * @evidence contracts/performance.md#efficient-algorithms Section creation is constant; averages scan only their supplied joint list.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads existing joint coordinates and creates no alternate rest graph.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Temporary vectors transfer to the caller's selected sections; no retained cache or native resource is acquired.
 */
export namespace humanPolygonSections {
  /**
   * Keep circle area pi*r*r when its lateral half-width becomes breadth.
   *
   * @evidence contracts/common.md#principled-implementation Returns depth=r*r/breadth, the original area-preserving ellipse formula; the builder supplies positive metric dimensions.
   * @evidence contracts/common.md#clear-and-simple-design One pure section constructor supplies all procedural body courses.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No new shape coefficient is introduced.
   * @evidence contracts/common.md#meaningful-documentation Gives the area invariant and positive-dimension premise.
   * @evidence contracts/performance.md#efficient-algorithms Constant arithmetic and one section record.
   * @evidence contracts/performance.md#reuse-equivalent-work Borrows the supplied centre vector unchanged.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Transfers the section record to the caller and retains nothing.
   */
  export function section(
    centre: THREE.Vector3,
    radius: number,
    breadth: number,
  ): buildHumanPolygonModule.ISection {
    return { centre, depth: (radius * radius) / breadth, breadth };
  }

  /**
   * Arithmetic rest-joint mean, refusing an empty set as before promotion.
   *
   * @evidence contracts/common.md#principled-implementation Adds supplied registered joint positions and divides by their count, preserving the original mean and empty refusal.
   * @evidence contracts/common.md#clear-and-simple-design One helper serves palm, toe and bilateral centres.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No default endpoint or asymmetric anatomy is invented.
   * @evidence contracts/common.md#meaningful-documentation States arithmetic rest-space mean and empty-input refusal.
   * @evidence contracts/performance.md#efficient-algorithms O(N) vector additions for N supplied joints.
   * @evidence contracts/performance.md#reuse-equivalent-work Reads the original rest positions rather than reconstructing them.
   * @evidence contracts/performance.md#bound-retention-and-release-resources Returns one vector and retains no source joint collection.
   */
  export function average(bones: AutoMovieHumanPolygon.IBone[]): THREE.Vector3 {
    if (bones.length === 0)
      throw new Error("Polygon module requires joint endpoints");
    const centre: THREE.Vector3 = new THREE.Vector3();
    for (const bone of bones) centre.add(new THREE.Vector3(...bone.position));
    return centre.multiplyScalar(1 / bones.length);
  }

  /**
   * The original bilateral joint midpoint in registered rest coordinates.
   *
   * @evidence contracts/common.md#principled-implementation Delegates to the same arithmetic mean for exactly two supplied joints.
   * @evidence contracts/common.md#clear-and-simple-design Reuses the joint mean instead of duplicating midpoint arithmetic.
   * @evidence contracts/common.md#prohibited-implementation-shortcuts No side-specific correction changes the midpoint.
   * @evidence contracts/common.md#meaningful-documentation States bilateral rest-space midpoint semantics.
   * @evidence contracts/performance.md#efficient-algorithms Constant work over two joints.
   * @evidence contracts/performance.md#reuse-equivalent-work Reuses the single average implementation.
   * @evidence contracts/performance.md#bound-retention-and-release-resources The temporary two-reference array is call-local and only the result vector transfers.
   */
  export function midpoint(
    a: AutoMovieHumanPolygon.IBone,
    b: AutoMovieHumanPolygon.IBone,
  ): THREE.Vector3 {
    return average([a, b]);
  }
}
