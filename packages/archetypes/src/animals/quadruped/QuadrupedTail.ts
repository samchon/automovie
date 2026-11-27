import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core";
import type { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import type { AutoMovieArchetypeQuadrupedFooting } from "../AutoMovieArchetypeQuadrupedFooting";
import { QuadrupedCarriage } from "./QuadrupedCarriage";
import { QuadrupedWorldPose } from "./QuadrupedWorldPose";
import type { AutoMovieArchetypeQuadruped } from "../AutoMovieArchetypeQuadruped";

/**
 * A quadruped's tail carried over the ground it meets: the tail is articulated
 * at the dock by its coccygeal vertebrae, so where the posed body would sink
 * its hanging tail into the footing beneath, the tail turns about the dock, in
 * the body's sagittal plane, by the least angle that lays its far end on that
 * footing, the hair resting on the ground rather than entering it, within `ROM`
 * of its posed carriage.
 */
export namespace QuadrupedTail {
  /**
   * The most the tail turns at the dock from its posed carriage, degrees:
   * provisional, a tail raised from hanging to trailing level behind.
   */
  export const ROM: number = 90;

  /**
   * The hair's rest on the footing, metres: the clearance the far end keeps,
   * provisional, so resting is not read as entering.
   */
  export const REST: number = 0.001;

  /**
   * Carry a posed model's tail over the footing beneath it.
   *
   * @param animal The source animal in its neutral pose.
   * @param species The animal's species, which names its carriers.
   * @param model The posed model.
   * @param placement Its world placement.
   * @param footing The prepared footing.
   * @returns The model, its tail turned when it would enter the footing, else
   *   unchanged.
   */
  export function carry<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
    species: AutoMovieArchetypeQuadruped.ISpecies,
    model: AutoMovieArchetype<Id, D>,
    placement: IAutoMovieTransform,
    footing: AutoMovieArchetypeQuadrupedFooting.IPlan,
  ): AutoMovieArchetype<Id, D> {
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
    const world: IAutoMovieTransform = AutoMovieArchetypeFrame.compose(
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
    const hips: IAutoMovieVector3 = AutoMovieArchetypeFrame.compose(
      placement,
      quarters.transform,
    ).translation;
    const dock: IAutoMovieVector3 =
      Vector3.distance(ends[0]!, hips) < Vector3.distance(ends[1]!, hips)
        ? ends[0]!
        : ends[1]!;
    const tip: IAutoMovieVector3 = dock === ends[0] ? ends[1]! : ends[0]!;
    const landing: AutoMovieArchetypeQuadrupedFooting.ILanding =
      footing.landing(tip, placement.rotation);
    const radius: number = geometry.shape.radius + REST;
    const gap = (point: IAutoMovieVector3): number =>
      Vector3.dot(landing.normal, Vector3.subtract(point, landing.point));
    if (gap(tip) >= radius) return model;

    // The far end turns about the body's lateral axis through the dock: its gap is A cos a + B sin a + gap(dock).
    const axis: IAutoMovieVector3 = Quaternion.rotateVector(
      placement.rotation,
      {
        x: 1,
        y: 0,
        z: 0,
      },
    );
    const along: IAutoMovieVector3 = Vector3.subtract(tip, dock);
    const across: IAutoMovieVector3 = Vector3.cross(axis, along);
    const a: number = Vector3.dot(landing.normal, along);
    const b: number = Vector3.dot(landing.normal, across);
    const c: number = radius - gap(dock);
    const reach: number = Math.hypot(a, b);
    const limit: number = (ROM * Math.PI) / 180;
    const phase: number = Math.atan2(b, a);
    // The tail trails: it turns the way that carries its end toward the body's rear, never forward under the body.
    const rear: number =
      Vector3.dot(
        across,
        Quaternion.rotateVector(placement.rotation, { x: 0, y: 0, z: -1 }),
      ) >= 0
        ? 1
        : -1;
    const turn: number =
      c >= reach
        ? rear * limit
        : Math.min(
            ...[phase - Math.acos(c / reach), phase + Math.acos(c / reach)].map(
              (angle: number): number => {
                const wrapped: number = rear * angle;
                return (
                  wrapped - 2 * Math.PI * Math.floor(wrapped / (2 * Math.PI))
                );
              },
            ),
          ) * rear;
    const bounded: number = Math.max(-limit, Math.min(limit, turn));

    // Applied as the tail bone's parent-local rotation, so the rig turns it about its own joint.
    const prepared: QuadrupedWorldPose.IPrepared<Id, D> = QuadrupedWorldPose(
      animal,
      QuadrupedCarriage.of(animal, species),
    );
    const pose: QuadrupedWorldPose.IPose = prepared.read(model, placement);
    const parent: IAutoMovieQuaternion = Quaternion.multiply(
      pose.root.rotation,
      pose.local.get("hindquarters")!,
    );
    const delta: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
      axis,
      (bounded * 180) / Math.PI,
    );
    const local: Map<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieQuaternion
    > = new Map(pose.local);
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
