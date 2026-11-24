import { AutoMovieHumanConicLoft as H } from "../conic/AutoMovieHumanConicLoft";
import { AutoMovieHumanCourseRuns as Runs } from "../conic/AutoMovieHumanCourseRuns";
import {
  AutoMovieHumanMaterialCourse as Material,
} from "../conic/AutoMovieHumanMaterialCourse";
import type {
  IAutoMovieHumanConicLoft,
  IAutoMovieHumanF1SegmentLengths,
  IAutoMovieViewAxis,
  IAutoMovieHumanF1NativeCourse,
} from "@automovie/interface";

/**
 * How a person's segment lengths enter the native path's families: through each family's course, never through its stations.
 *
 * The person's chain moves the joint centres (`AutoMovieHumanF1SegmentLengths.chain`) and the assembly places every course's centres on
 * it. A family then keeps the reference's knots, tips, relief windows, rails, sites and scale profiles as stations of one material
 * coordinate, and its course is the placed course read through the material map of its runs (`AutoMovieHumanMaterialCourse`): the run
 * between two joint centres stretches with its bone and the next run translates. At f1's own lengths every map is the shared identity
 * and every course is the placed course object itself.
 */
export namespace AutoMovieHumanF1NativeCourse {
  /** The axis and the physical arclength conversion from the same preparation. */
  export type IPrepared = IAutoMovieHumanF1NativeCourse.IPrepared;

  /**
   * A family's course at the person in the reference's material stations.
   *
   * @param prior The reference family, whose course defines the material stations.
   * @param placed The same family placed on the person's chain: its centres at the person, its turns' half lengths keeping their set-backs.
   * @param hold The root its host owns (`AutoMovieHumanMaterialCourse.IHold`); absent, the first run stretches from its first centre.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The placed course composed with the twice differentiable material map of its runs; a length changes the course alone.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One map and one composition.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No knot, window or site is mapped; refusals of the map and the course are passed on.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two course preparations and one small tridiagonal solve per family.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Unchanged runs borrow the placed course itself.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned course retains the placed course and its map.
   * @evidence contracts/development/common.md#meaningful-documentation Names both families' roles and the identity case.
   */
  export function create(prior: IAutoMovieHumanConicLoft.IFamily, placed: IAutoMovieHumanConicLoft.IFamily, hold?: Material.IHold): IAutoMovieViewAxis.IAxis {
    return prepare(prior, placed, hold).axis;
  }

  /**
   * Prepare the native material course with its original forward arclength map.
   *
   * @evidence contracts/development/common.md#meaningful-documentation A reference material station in mm maps to placed course arclength in mm, from the same origin.
   * @evidence contracts/development/implementation.md#principled-implementation The exact callable used to compose the native axis is available to consumers of physical arclength. Native outline, rail and relief stations retain their material coordinates.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work One map governs both capabilities, including the shared identity at unchanged lengths.
   */
  export function prepare(
    prior: IAutoMovieHumanConicLoft.IFamily,
    placed: IAutoMovieHumanConicLoft.IFamily,
    hold?: Material.IHold,
  ): IPrepared {
    const physicalStation = Material.map(prior, placed, hold);
    return { axis: Material.create(H.axis(placed), physicalStation), physicalStation };
  }

  /**
   * Whether a family's runs at the person are the reference's, number for number: its course is then the placed course itself.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The material map of equal runs is the one shared identity object.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One identity comparison.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No tolerance: a run that differs in its last bit is a changed run.
   * @evidence contracts/development/implementation.md#efficient-algorithms Two course preparations, no course object is built.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure predicate coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   * @evidence contracts/development/common.md#meaningful-documentation States what unchanged means.
   */
  export function unchanged(prior: IAutoMovieHumanConicLoft.IFamily, placed: IAutoMovieHumanConicLoft.IFamily): boolean {
    return Material.map(prior, placed) === Runs.identity;
  }

  /**
   * Refuse a trunk length other than f1's, naming it.
   *
   * A trunk length is unresolved. The trunk, the neck and the head are one family on one straight two-centre course of level sections:
   * it has no joint station a run could stretch about; the datums stored in the thorax's and the head's frames (the arm's root, the
   * breast, the nose, the ears) are stations of that same course and would have to follow it; and a level section cannot stretch the
   * neck, which runs obliquely from suprasternale in front (station 636 mm on f1) and cervicale behind (about 705 mm) up to the jaw (about
   * 703 mm) and the occiput (about 783 mm), without stretching the lower face with it.
   *
   * @evidence contracts/development/implementation.md#principled-implementation An unresolved constraint is exposed as unresolved (the Human skill, Generate From Parameters), with the requested and the generated value.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two comparisons.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No partial law stretches the torso or the neck in place of the missing one.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure admission coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   * @evidence contracts/development/common.md#meaningful-documentation States the three measured reasons the law is missing.
   */
  export function admit(lengths: IAutoMovieHumanF1SegmentLengths.IFields, zero: IAutoMovieHumanF1SegmentLengths.IFields): void {
    for (const key of ["pelvisToThorax", "thoraxToHead"] as const)
      if (lengths[key] !== zero[key])
        throw new Error(
          "trunk length change is unresolved: the trunk's course carries no joint and its neck no course of its own; only F1's own " +
            key + " " + zero[key] + " mm is generated, requested " + lengths[key],
        );
  }
}
