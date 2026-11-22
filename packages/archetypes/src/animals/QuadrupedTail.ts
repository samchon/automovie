import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type Archetype, ArchetypeFrame } from "../core";
import { QuadrupedCarriage } from "./QuadrupedCarriage";
import type { QuadrupedBody } from "./QuadrupedBody";
import type { QuadrupedFooting } from "./QuadrupedFooting";
import { QuadrupedWorldPose } from "./QuadrupedWorldPose";
import type { createQuadruped } from "./createQuadruped";

/**
 * A quadruped's tail carried over the ground it meets: the tail is articulated at the dock by its coccygeal vertebrae, so where the posed body would sink its hanging tail into the footing beneath, the tail turns about the dock, in the body's sagittal plane, by the least angle that lays its far end on that footing, the hair resting on the ground rather than entering it, within `ROM` of its posed carriage.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the anatomy, the least turn, the plane it turns in and its limit.
 * @evidence contracts/development/design.md#principled-representation The tail's own bar, the footing beneath its end and one rotation about its joint.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `rideQuadruped` on routes whose techniques meet steep faces.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tail is turned, never shortened or let through the ground; a turn beyond `ROM` is not taken, and the footing's own check then refuses the pose.
 */
export namespace QuadrupedTail {
  /** The most the tail turns at the dock from its posed carriage, degrees: provisional, a tail raised from hanging to trailing level behind. */
  export const ROM: number = 90;

  /** The hair's rest on the footing, metres: the clearance the far end keeps, provisional, so resting is not read as entering. */
  export const REST: number = 0.001;

  /** Each source animal's prepared world pose. */
  const POSES: WeakMap<object, unknown> = new WeakMap();

  /**
   * Carry a posed model's tail over the footing beneath it.
   *
   * @param animal The source animal in its neutral pose.
   * @param species The animal's species, which names its carriers.
   * @param model The posed model.
   * @param placement Its world placement.
   * @param footing The prepared footing.
   * @returns The model, its tail turned when it would enter the footing, else unchanged.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and when the model is returned unchanged.
   * @evidence contracts/development/implementation.md#principled-implementation The far end's signed distance to the footing beneath it is a sinusoid of the turn about the lateral axis through the dock; its zero nearest the posed carriage is the least turn, applied as a parent-local rotation of the tail bone and emitted through the same rig.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Measure, solve one sinusoid, re-emit.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The turn is bounded by `ROM`; nothing is moved when the tail clears.
   * @evidence contracts/development/implementation.md#efficient-algorithms One landing query per sample; the read and emit run only when the tail would enter the footing.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work `QuadrupedWorldPose`'s read and emit, prepared once per animal.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Keeps one prepared pose per animal while it lives.
   */
  export function carry<Id extends string, D extends string>(
    animal: Archetype<Id, D>,
    species: createQuadruped.ISpecies,
    model: Archetype<Id, D>,
    placement: IAutoMovieTransform,
    footing: QuadrupedFooting.IPlan,
  ): Archetype<Id, D> {
    const bar: IAutoMovieModelPart | undefined = model.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === "tail",
    );
    const quarters: IAutoMovieModelPart | undefined = model.parts.find(
      (part: IAutoMovieModelPart): boolean => part.id === "hindquarters",
    );
    const geometry: IAutoMovieModelPart["geometry"] | undefined = bar?.geometry;
    if (
      bar?.transform === undefined ||
      bar.transform === null ||
      quarters?.transform === undefined ||
      quarters.transform === null ||
      geometry?.type !== "primitive" ||
      (geometry.shape.type !== "capsule" && geometry.shape.type !== "cylinder")
    )
      return model;
    const world: IAutoMovieTransform = ArchetypeFrame.compose(
      placement,
      bar.transform,
    );
    const half: IAutoMovieVector3 = Quaternion.rotateVector(world.rotation, {
      x: 0,
      y: geometry.shape.height / 2,
      z: 0,
    });
    const ends: readonly IAutoMovieVector3[] = [
      Vector3.add(world.translation, half),
      Vector3.subtract(world.translation, half),
    ];
    // The dock is the end nearer the hindquarters it hangs from.
    const hips: IAutoMovieVector3 = ArchetypeFrame.compose(
      placement,
      quarters.transform,
    ).translation;
    const dock: IAutoMovieVector3 =
      Vector3.distance(ends[0]!, hips) < Vector3.distance(ends[1]!, hips)
        ? ends[0]!
        : ends[1]!;
    const tip: IAutoMovieVector3 = dock === ends[0] ? ends[1]! : ends[0]!;
    const landing: QuadrupedFooting.ILanding = footing.landing(
      tip,
      placement.rotation,
    );
    const radius: number = geometry.shape.radius + REST;
    const gap = (point: IAutoMovieVector3): number =>
      Vector3.dot(landing.normal, Vector3.subtract(point, landing.point));
    if (gap(tip) >= radius) return model;

    // The far end turns about the body's lateral axis through the dock: its gap is A cos a + B sin a + gap(dock).
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(placement.rotation, {
      x: 1,
      y: 0,
      z: 0,
    });
    const along: IAutoMovieVector3 = Vector3.subtract(tip, dock);
    const across: IAutoMovieVector3 = Vector3.cross(axis, along);
    const a: number = Vector3.dot(landing.normal, along);
    const b: number = Vector3.dot(landing.normal, across);
    const c: number = radius - gap(dock);
    const reach: number = Math.hypot(a, b);
    const limit: number = (ROM * Math.PI) / 180;
    const phase: number = Math.atan2(b, a);
    const turn: number =
      c >= reach
        ? Math.sign(b || 1) * limit
        : [phase - Math.acos(c / reach), phase + Math.acos(c / reach)]
            .map((angle: number): number =>
              Math.atan2(Math.sin(angle), Math.cos(angle)),
            )
            .reduce((best: number, angle: number): number =>
              Math.abs(angle) < Math.abs(best) ? angle : best,
            );
    const bounded: number = Math.max(-limit, Math.min(limit, turn));

    // Applied as the tail bone's parent-local rotation, so the rig turns it about its own joint.
    let prepared: QuadrupedWorldPose.IPrepared<Id, D> | undefined = POSES.get(
      animal,
    ) as QuadrupedWorldPose.IPrepared<Id, D> | undefined;
    if (prepared === undefined) {
      prepared = QuadrupedWorldPose(animal, QuadrupedCarriage.of(animal, species));
      POSES.set(animal, prepared);
    }
    const pose: QuadrupedWorldPose.IPose = prepared.read(model, placement);
    const parent: IAutoMovieQuaternion = Quaternion.multiply(
      pose.root.rotation,
      pose.local.get("hindquarters")!,
    );
    const delta: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      axis,
      (bounded * 180) / Math.PI,
    );
    const local: Map<QuadrupedBody.Bone, IAutoMovieQuaternion> = new Map(
      pose.local,
    );
    local.set(
      "tail",
      Quaternion.multiply(
        Quaternion.multiply(
          Quaternion.multiply(Quaternion.inverse(parent), delta),
          parent,
        ),
        pose.local.get("tail")!,
      ),
    );
    return prepared.emit({ root: pose.root, local }, placement);
  }
}
