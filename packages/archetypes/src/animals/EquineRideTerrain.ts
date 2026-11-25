import type {
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetype, AutoMovieArchetypeCourse } from "../core";
import { AutoMovieArchetypeEquineBank } from "./AutoMovieArchetypeEquineBank";
import type { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedFooting } from "./AutoMovieArchetypeQuadrupedFooting";
import type { AutoMovieArchetypeQuadrupedGait } from "./AutoMovieArchetypeQuadrupedGait";
import type { AutoMovieArchetypeQuadrupedJoints } from "./AutoMovieArchetypeQuadrupedJoints";
import { EquineFootwork } from "./EquineFootwork";
import { QuadrupedCorner } from "./QuadrupedCorner";
import type { QuadrupedRidePose } from "./QuadrupedRidePose";
import { QuadrupedTail } from "./QuadrupedTail";
import type { createQuadruped } from "./createQuadruped";
import type { rideQuadruped } from "./rideQuadruped";

/**
 * A quadruped ride's techniques and terrain, prepared once for its route: the
 * admitted equine footwork, the authored footing, each hoof's foothold kept
 * clear of the footing's concave edges by its own pastern (`QuadrupedCorner`),
 * each hoof's goal under the techniques (`EquineFootwork.limbGoal`), and the
 * tail carried over the footing a bank technique meets (`QuadrupedTail`).
 */
export namespace EquineRideTerrain {
  /** The prepared techniques and terrain of one ride. */
  export interface ITerrain<Id extends string, D extends string> {
    /** The admitted equine footwork. */
    footwork: EquineFootwork.IPlan;
    /** The authored footing, absent on level ground. */
    ground: AutoMovieArchetypeQuadrupedFooting.IPlan | undefined;
    /**
     * Each hoof's foothold mover, clear of the footing's concave edges by its
     * pastern.
     */
    clear: Readonly<
      Record<
        AutoMovieArchetypeQuadrupedBody.Limb,
        (point: IAutoMovieVector3) => IAutoMovieVector3
      >
    >;
    /**
     * A hoof's goal at a film second under the techniques, from its gait's goal
     * in the body's placement.
     */
    goal: (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
      seconds: number,
      goal: QuadrupedRidePose.IGoal,
      placement: IAutoMovieTransform,
    ) => QuadrupedRidePose.IGoal;
    /**
     * A posed model with its tail carried over the footing, when a bank
     * technique meets a face.
     */
    tail: (
      model: AutoMovieArchetype<Id, D>,
      placement: IAutoMovieTransform,
    ) => AutoMovieArchetype<Id, D>;
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
   * @throws {AutoMovieArchetypeRefusal} As `EquineFootwork.prepare` and
   *   `AutoMovieArchetypeQuadrupedFooting.prepare` refuse.
   */
  export function prepare<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    species: createQuadruped.ISpecies,
    course: rideQuadruped.ICourse,
    plan: AutoMovieArchetypeCourse.IPlan,
    gait: AutoMovieArchetypeQuadrupedGait.Gait | undefined,
    rig: ReturnType<typeof AutoMovieArchetypeQuadrupedJoints.read>,
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
      AutoMovieArchetypeEquineBank.tail(animal.parts),
    );
    const ground: AutoMovieArchetypeQuadrupedFooting.IPlan | undefined =
      AutoMovieArchetypeQuadrupedFooting.prepare(
        species.archetype,
        course.footing,
        footwork.slide !== undefined,
      );
    const corner: QuadrupedCorner.Clear = QuadrupedCorner.of(course.footing);
    const mover = (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
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
        limb: AutoMovieArchetypeQuadrupedBody.Limb,
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
        model: AutoMovieArchetype<Id, D>,
        placement: IAutoMovieTransform,
      ): AutoMovieArchetype<Id, D> =>
        banked
          ? QuadrupedTail.carry(animal, species, model, placement, ground!)
          : model,
    };
  }
}
