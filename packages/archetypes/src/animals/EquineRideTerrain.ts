import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { Archetype, ArchetypeCourse } from "../core";
import { EquineBank } from "./EquineBank";
import { EquineFootwork } from "./EquineFootwork";
import type { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedCorner } from "./QuadrupedCorner";
import { QuadrupedFooting } from "./QuadrupedFooting";
import type { QuadrupedGait } from "./QuadrupedGait";
import type { QuadrupedJoints } from "./QuadrupedJoints";
import type { QuadrupedRidePose } from "./QuadrupedRidePose";
import { QuadrupedTail } from "./QuadrupedTail";
import type { createQuadruped } from "./createQuadruped";
import type { rideQuadruped } from "./rideQuadruped";

/**
 * A quadruped ride's techniques and terrain, prepared once for its route: the admitted equine footwork, the authored footing, each hoof's foothold kept clear of the footing's concave edges by its own pastern (`QuadrupedCorner`), each hoof's goal under the techniques (`EquineFootwork.limbGoal`), and the tail carried over the footing a bank technique meets (`QuadrupedTail`).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is prepared and who reads each part.
 * @evidence contracts/development/design.md#principled-representation One record of the route's technique plan, footing and the three per-sample readers over them.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `rideQuadruped`, which keeps its body, gait and pose solving.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reader leaves the ride unchanged where no technique or footing asks otherwise.
 */
export namespace EquineRideTerrain {
  /**
   * The prepared techniques and terrain of one ride.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each member.
   * @evidence contracts/development/design.md#principled-representation The plan, the footing and three readers.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Built by `prepare`, read by `rideQuadruped`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface ITerrain<Id extends string, D extends string> {
    /** The admitted equine footwork. */
    footwork: EquineFootwork.IPlan;
    /** The authored footing, absent on level ground. */
    ground: QuadrupedFooting.IPlan | undefined;
    /** Each hoof's foothold mover, clear of the footing's concave edges by its pastern. */
    clear: Readonly<
      Record<
        QuadrupedBody.Limb,
        (point: IAutoMovieVector3) => IAutoMovieVector3
      >
    >;
    /** A hoof's goal at a film second under the techniques, from its gait's goal in the body's placement. */
    goal: (
      limb: QuadrupedBody.Limb,
      seconds: number,
      goal: QuadrupedRidePose.IGoal,
      placement: IAutoMovieTransform,
    ) => QuadrupedRidePose.IGoal;
    /** A posed model with its tail carried over the footing, when a bank technique meets a face. */
    tail: (
      model: Archetype<Id, D>,
      placement: IAutoMovieTransform,
    ) => Archetype<Id, D>;
  }

  /**
   * Prepare a ride's techniques and terrain.
   *
   * @param animal The source animal in its neutral pose.
   * @param species The animal's species.
   * @param course The ride's course.
   * @param plan The course plan.
   * @param gait The ride's fixed gait, if any.
   * @param rig The animal's admitted joints.
   * @returns The terrain.
   * @throws {ArchetypeRefusal} As `EquineFootwork.prepare` and `QuadrupedFooting.prepare` refuse.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, result and refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The footwork reads the rig's neutral hooves, their stance centres under each attachment, the fore's reach and the tail; the footing is the course's own; the readers compose the techniques' and the footing's owners.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Footwork, footing, then the three readers.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Prepared once per ride; each reader is constant work outside a technique's window or an edge's reach.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `EquineFootwork`, `QuadrupedFooting`, `QuadrupedCorner` and `QuadrupedTail`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains the plan and footing for the ride's lifetime.
   */
  export function prepare<Id extends string, D extends string>(
    animal: Archetype<Id, D>,
    species: createQuadruped.ISpecies,
    course: rideQuadruped.ICourse,
    plan: ArchetypeCourse.IPlan,
    gait: QuadrupedGait.Gait | undefined,
    rig: ReturnType<typeof QuadrupedJoints.read>,
  ): ITerrain<Id, D> {
    const footwork: EquineFootwork.IPlan = EquineFootwork.prepare(
      species.archetype,
      course,
      plan,
      gait,
      {
        leftFore: rig.limbs.leftFore[4]!,
        rightFore: rig.limbs.rightFore[4]!,
        leftHind: rig.limbs.leftHind[4]!,
        rightHind: rig.limbs.rightHind[4]!,
      },
      {
        leftFore: { ...rig.limbs.leftFore[4]!, z: rig.limbs.leftFore[0]!.z },
        rightFore: { ...rig.limbs.rightFore[4]!, z: rig.limbs.rightFore[0]!.z },
        leftHind: { ...rig.limbs.leftHind[4]!, z: rig.limbs.leftHind[0]!.z },
        rightHind: { ...rig.limbs.rightHind[4]!, z: rig.limbs.rightHind[0]!.z },
      },
      rig.limbs.leftFore[0]!.y - rig.limbs.leftFore[4]!.y,
      EquineBank.tail(animal.parts),
    );
    const ground: QuadrupedFooting.IPlan | undefined = QuadrupedFooting.prepare(
      species.archetype,
      course.footing,
      footwork.slide !== undefined,
    );
    const corner: QuadrupedCorner.Clear = QuadrupedCorner.of(course.footing);
    const mover = (
      limb: QuadrupedBody.Limb,
    ): ((point: IAutoMovieVector3) => IAutoMovieVector3) => {
      const chain: readonly IAutoMovieVector3[] = rig.limbs[limb];
      const pastern: number = Math.hypot(
        chain[4]!.x - chain[3]!.x,
        chain[4]!.y - chain[3]!.y,
        chain[4]!.z - chain[3]!.z,
      );
      return (point: IAutoMovieVector3): IAutoMovieVector3 =>
        corner(point, pastern);
    };
    const banked: boolean =
      ground !== undefined &&
      footwork.bank.length + footwork.scramble.length > 0;
    return {
      footwork,
      ground,
      clear: {
        leftFore: mover("leftFore"),
        rightFore: mover("rightFore"),
        leftHind: mover("leftHind"),
        rightHind: mover("rightHind"),
      },
      goal: (
        limb: QuadrupedBody.Limb,
        seconds: number,
        goal: QuadrupedRidePose.IGoal,
        placement: IAutoMovieTransform,
      ): QuadrupedRidePose.IGoal =>
        EquineFootwork.limbGoal(
          footwork,
          seconds,
          limb.endsWith("Fore"),
          rig.limbs[limb][4]!,
          rig.limbs[limb][0]!,
          goal,
          placement,
          ground,
        ),
      tail: (
        model: Archetype<Id, D>,
        placement: IAutoMovieTransform,
      ): Archetype<Id, D> =>
        banked
          ? QuadrupedTail.carry(animal, species, model, placement, ground!)
          : model,
    };
  }
}
