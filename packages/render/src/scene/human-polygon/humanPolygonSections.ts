import * as THREE from "three";

import type { AutoMovieHumanPolygon } from "./AutoMovieHumanPolygon.js";
import type { buildHumanPolygonModule } from "./buildHumanPolygonModule.js";

/**
 * The original polygon builder's section dimensions and joint averages.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States original formulas and source joint/metric ownership.
 * @evidence contracts/development/design.md#principled-representation Represents The original polygon builder's section dimensions and joint averages: companion namespace of 3 members (`section`, `average`, `midpoint`); units and frames named in its text: local. It has no optional member, so no absent-value state combines with another.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owned by the module that declares `humanPolygonSections` in packages/render/src/scene/human-polygon/humanPolygonSections.ts; its surface is the 3 members listed and the text shows 2 other files naming it, mostly packages/render (2), so no member is declared for a presumed future need.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Scanning the declaration finds no `any`, no `unknown`, no index signature and no cast; it duplicates no type that another owner declares as far as a name search shows.
 */
export namespace humanPolygonSections {
  /**
   * Keep circle area pi*r*r when its lateral half-width becomes breadth.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Returns depth=r*r/breadth, the original area-preserving ellipse formula; the builder supplies positive metric dimensions.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One pure section constructor supplies all procedural body courses.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No new shape coefficient is introduced.
   * @evidence contracts/development/common.md#meaningful-documentation Gives the area invariant and positive-dimension premise.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant arithmetic and one section record.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Borrows the supplied centre vector unchanged.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Transfers the section record to the caller and retains nothing.
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
   * @evidence contracts/development/implementation.md#principled-implementation Adds supplied registered joint positions and divides by their count, preserving the original mean and empty refusal.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One helper serves palm, toe and bilateral centres.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No default endpoint or asymmetric anatomy is invented.
   * @evidence contracts/development/common.md#meaningful-documentation States arithmetic rest-space mean and empty-input refusal.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(N) vector additions for N supplied joints.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads the original rest positions rather than reconstructing them.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one vector and retains no source joint collection.
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
   * @evidence contracts/development/implementation.md#principled-implementation Delegates to the same arithmetic mean for exactly two supplied joints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reuses the joint mean instead of duplicating midpoint arithmetic.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No side-specific correction changes the midpoint.
   * @evidence contracts/development/common.md#meaningful-documentation States bilateral rest-space midpoint semantics.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work over two joints.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses the single average implementation.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The temporary two-reference array is call-local and only the result vector transfers.
   */
  export function midpoint(
    a: AutoMovieHumanPolygon.IBone,
    b: AutoMovieHumanPolygon.IBone,
  ): THREE.Vector3 {
    return average([a, b]);
  }
}
