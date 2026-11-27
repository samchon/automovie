import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanoidBone,
  IAutoMovieAffordance,
  IAutoMovieMotionEvent,
  IAutoMovieMotionHumanActionLaw,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanChain,
  IAutoMovieMotionHumanProp,
  IAutoMovieMotionHumanSegment,
  IAutoMovieQuaternion,
  IAutoMovieResolvedBone,
  IAutoMovieRigidTransform,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieMotionHumanDress,
  AutoMovieMotionHumanPerformance,
} from "@automovie/motions";
import { TestValidator } from "@nestia/e2e";

/**
 * Shared staging and frame readers for the wardrobe specifications: one
 * trained performer `actor` at the origin with the wardrobe law registered,
 * and readers of a prop's frame in a socket's or a bone's local frame.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the performer, the registered law and the frames the readers convert between.
 * @evidence contracts/development/design.md#principled-representation Positions are metres, times film seconds and frames the public rigid transforms the performance displays.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The staging and readers the jacket and footwear specifications share; motion types stay with their package owners.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reading comes from the public performance's displayed bones and props.
 */
export namespace wardrobeFilm {
  /**
   * Compile the installed wardrobe law on one authored actor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the performer and the registered law.
   * @evidence contracts/development/implementation.md#principled-implementation Builds the SDK's AutoMovieMotionHumanPerformance with one trained performer at the origin facing +Z.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Construction only; the callers read and assert.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The wardrobe law is widened to the registry's law type only where the performance input requires it; refusals propagate.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Delegates all planning to the performance.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds an independent performance.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The returned performance owns its caches until the caller drops it.
   */
  export function stage(
    body: IAutoMovieMotionHumanBody,
    props: IAutoMovieMotionHumanProp[],
    composition: IAutoMovieMotionHumanChain["node"],
  ): AutoMovieMotionHumanPerformance {
    return new AutoMovieMotionHumanPerformance({
      seed: "native-wardrobe",
      laws: [
        AutoMovieMotionHumanDress.wardrobe as IAutoMovieMotionHumanActionLaw,
      ],
      props,
      composition,
      performers: [
        {
          subject: "actor",
          body,
          at: Vector3.create(0, 0, 0),
          yaw: 0,
          proficiency: { level: "trained" },
        },
      ],
    });
  }

  /**
   * The world transform of an unrotated prop entering the scene without motion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the units and the identity rotation.
   * @evidence contracts/development/implementation.md#principled-implementation A position in metres with the identity quaternion.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One literal.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function placement(
    x: number,
    y: number,
    z: number,
  ): IAutoMovieRigidTransform {
    return {
      position: Vector3.create(x, y, z),
      rotation: { x: 0, y: 0, z: 0, w: 1 },
    };
  }

  /**
   * Project a world point into a prop socket's local frame, metres.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the source and target frames.
   * @evidence contracts/development/implementation.md#principled-implementation Applies the inverse prop transform, then the inverse socket transform.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two rigid inversions in order.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reads the displayed prop frame, not a stored target.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function localSite(
    prop: IAutoMovieRigidTransform,
    site: IAutoMovieAffordance,
    p: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Quaternion.rotateVector(
      Quaternion.inverse(site.frame.rotation),
      Vector3.subtract(
        Quaternion.rotateVector(
          Quaternion.inverse(prop.rotation),
          Vector3.subtract(p, prop.position),
        ),
        site.frame.translation,
      ),
    );
  }

  /**
   * A prop's frame in a displayed bone's frame at a film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the frames and the time base.
   * @evidence contracts/development/implementation.md#principled-implementation Composes the inverse bone world transform with the prop's world transform.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Reads both frames, then one rigid inversion.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Both frames are read independently from the displayed performance.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work after the performance's reads.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work The performance owns its frame caches.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function relative(
    film: AutoMovieMotionHumanPerformance,
    prop: string,
    bone: AutoMovieHumanoidBone,
    time: number,
  ): IAutoMovieRigidTransform {
    const frame: IAutoMovieResolvedBone = film.bones("actor", time).get(bone)!;
    const source: IAutoMovieRigidTransform = film.prop(prop, time);
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      frame.worldRotation,
    );
    return {
      position: Quaternion.rotateVector(
        inverse,
        Vector3.subtract(source.position, frame.worldPosition),
      ),
      rotation: Quaternion.multiply(inverse, source.rotation),
    };
  }

  /**
   * The first segment whose plan names an event.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the selection.
   * @evidence contracts/development/implementation.md#principled-implementation A linear search over the actor's segments and their events.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One search.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing segment fails the caller's read instead of returning a substitute.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the segments and their events.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function withEvent(
    segments: readonly IAutoMovieMotionHumanSegment[],
    name: string,
  ): IAutoMovieMotionHumanSegment {
    return segments.find((span: IAutoMovieMotionHumanSegment): boolean =>
      span.plan.events.some(
        (event: IAutoMovieMotionEvent): boolean => event.name === name,
      ),
    )!;
  }

  /**
   * A segment's named event as a film second.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the time base.
   * @evidence contracts/development/implementation.md#principled-implementation Start plus share times duration, the segment clock's definition.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One lookup and one product.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A missing event fails the read.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the segment's events.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function mark(
    span: IAutoMovieMotionHumanSegment,
    name: string,
  ): number {
    return (
      span.start +
      span.plan.events.find(
        (event: IAutoMovieMotionEvent): boolean => event.name === name,
      )!.share *
        span.plan.duration
    );
  }

  /**
   * Check that a released prop's final frame stays where it was released,
   * within 75 mm of its staged destination.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the two checks and their bounds.
   * @evidence contracts/development/implementation.md#principled-implementation Compares the displayed prop frame just after release with the final frame, and the final position with the destination.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two reads and one predicate.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The bounds are the specification's; nothing is widened here.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Two frame reads.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Nothing to share.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function setDown(
    film: AutoMovieMotionHumanPerformance,
    prop: string,
    destination: IAutoMovieVector3,
  ): void {
    const span: IAutoMovieMotionHumanSegment = withEvent(
      film.segments("actor"),
      "placed",
    );
    const released: IAutoMovieRigidTransform = film.prop(
      prop,
      mark(span, "release") + 0.005,
    );
    const final: IAutoMovieRigidTransform = film.prop(prop, film.duration);
    const miss: number = Vector3.distance(final.position, destination);
    TestValidator.predicate(
      prop +
        " stays at the staged release frame (placement error " +
        miss +
        " m)",
      miss < 0.075 &&
        Vector3.distance(final.position, released.position) < 0.001 &&
        Quaternion.angle(final.rotation, released.rotation) < 1e-4,
    );
  }
}
