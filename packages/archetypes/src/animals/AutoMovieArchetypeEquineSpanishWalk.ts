import { Quaternion, Vector3, AutoMovieEngineMath } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieArchetypeFrame, type AutoMovieArchetypeRide } from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/**
 * The forelimb's peak forward swing about the shoulder at mid-swing, degrees:
 * authored.
 */
const RAISE: number = 60;

/** The fore limbs. */
const FORES: readonly Fore[] = ["leftFore", "rightFore"];

/**
 * A sole this far above the floor, metres, is in its swing; below it the hoof
 * bears on the floor.
 */
const OFF: number = 1e-6;

/**
 * The Spanish walk, a layer over an equid's walk: each forelimb, while it
 * swings, is carried straight up and forward from the shoulder and set down on
 * the footprint the walk gives it.
 *
 * The walk's own stride, footfalls and stance limbs are kept exactly. A fore
 * limb whose displayed sole is off the floor is in its swing; its progress
 * through the swing is the hoof's displayed forward travel in the world between
 * its previous and next footprints, read from the walk at the landings the ride
 * names (`leftForeOn`, `rightForeOn`). On the same half-sine share the cannon
 * and pastern turn about the carpus into the forearm's line, and the whole limb
 * turns forward about the shoulder joint by up to `RAISE`, so it rises extended
 * and comes back to the walk's own path at lift-off and landing. The peak swing
 * is authored.
 */
export namespace AutoMovieArchetypeEquineSpanishWalk {
  /**
   * Layer the Spanish walk over a walk.
   *
   * @param ride The equid's walking ride.
   * @returns The layered ride.
   */
  export function layer<Id extends string, D extends string>(
    ride: AutoMovieArchetypeRide.IRide<Id, D>,
  ): AutoMovieArchetypeRide.IRide<Id, D> {
    const landings = (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
    ): readonly number[] =>
      ride.instants
        .filter((instant: Instant): boolean => instant.label === `${limb}On`)
        .map((instant: Instant): number => instant.seconds);
    const fore: Readonly<Record<Fore, readonly number[]>> = {
      leftFore: landings("leftFore"),
      rightFore: landings("rightFore"),
    };
    const at = (seconds: number): AutoMovieArchetypeRide.ISample<Id, D> => {
      const base: AutoMovieArchetypeRide.ISample<Id, D> = ride.at(seconds);
      let parts: IAutoMovieModelPart[] | undefined;
      for (const limb of FORES) {
        const bones: readonly AutoMovieArchetypeQuadrupedBody.Bone[] =
          AutoMovieArchetypeQuadrupedBody.BONES[limb];
        const terminal: IAutoMovieModelPart = part(base, bones[3]!);
        if (!(sole(terminal, base.placement) > OFF)) continue;
        const next: number | undefined = fore[limb].find(
          (time: number): boolean => time > seconds,
        );
        const previous: number | undefined = [...fore[limb]]
          .reverse()
          .find((time: number): boolean => time <= seconds);
        if (next === undefined || previous === undefined) continue;
        const from: number = forward(ride.at(previous), bones[3]!);
        const to: number = forward(ride.at(next), bones[3]!);
        const now: number = forward(base, bones[3]!);
        const progress: number =
          to === from
            ? 0
            : Math.max(0, Math.min(1, (now - from) / (to - from)));
        const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
          { x: 1, y: 0, z: 0 },
          -RAISE * Math.sin(Math.PI * progress),
        );
        const shoulder: IAutoMovieVector3 = start(part(base, bones[0]!));
        parts ??= base.archetype.parts.map(
          (each: IAutoMovieModelPart): IAutoMovieModelPart => ({ ...each }),
        );

        // The carpus straightens on the same share: the cannon and pastern turn about the carpus toward the forearm's line.
        const forearm: IAutoMovieModelPart = part(base, bones[1]!);
        const cannon: IAutoMovieModelPart = part(base, bones[2]!);
        const carpus: IAutoMovieVector3 = start(cannon);
        const straighten: IAutoMovieQuaternion = Quaternion.slerp(
          { x: 0, y: 0, z: 0, w: 1 },
          AutoMovieEngineMath.rotationBetween(
            Vector3.subtract(end(cannon), carpus),
            Vector3.subtract(end(forearm), start(forearm)),
          ),
          Math.sin(Math.PI * progress),
        );
        for (const bone of bones.slice(2)) {
          const index: number = parts.findIndex(
            (each: IAutoMovieModelPart): boolean => each.id === bone,
          );
          parts[index] = {
            ...parts[index]!,
            transform: AutoMovieArchetypeFrame.move(
              {
                rotation: straighten,
                translation: Vector3.subtract(
                  carpus,
                  Quaternion.rotateVector(straighten, carpus),
                ),
              },
              parts[index]!.transform!,
            ),
          };
        }
        for (const bone of bones) {
          const index: number = parts.findIndex(
            (each: IAutoMovieModelPart): boolean => each.id === bone,
          );
          const frame: IAutoMovieTransform = parts[index]!.transform!;
          parts[index] = {
            ...parts[index]!,
            transform: AutoMovieArchetypeFrame.move(
              {
                rotation: turn,
                translation: Vector3.subtract(
                  shoulder,
                  Quaternion.rotateVector(turn, shoulder),
                ),
              },
              frame,
            ),
          };
        }
      }
      if (parts === undefined) return base;
      return {
        ...base,
        archetype: base.archetype.reposed(
          parts,
          new Map(
            base.archetype.affordances.map(
              (
                contact: IAutoMovieAffordance,
              ): [string, IAutoMovieTransform] => [contact.id, contact.frame],
            ),
          ),
        ),
      };
    };
    return {
      plan: ride.plan,
      duration: ride.duration,
      instants: ride.instants,
      at,
      frame: (id: Id, seconds: number): IAutoMovieTransform => {
        const sample: AutoMovieArchetypeRide.ISample<Id, D> = at(seconds);
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          sample.archetype.affordance(id).frame,
        );
      },
    };
  }

  /** A part of a sample by id. */
  function part(
    sample: AutoMovieArchetypeRide.IPose<string, string>,
    id: string,
  ): IAutoMovieModelPart {
    return sample.archetype.parts.find(
      (each: IAutoMovieModelPart): boolean => each.id === id,
    )!;
  }

  /**
   * The world forward coordinate of a sample's terminal bar end, metres: the
   * footprint a swing is measured between, since the body moves a stride
   * between two landings.
   */
  function forward(
    sample: AutoMovieArchetypeRide.ISample<string, string>,
    bone: string,
  ): number {
    return AutoMovieArchetypeFrame.point(
      sample.placement,
      end(part(sample, bone)),
    ).z;
  }

  /** A bar's half length along its local +Y. */
  function half(part: IAutoMovieModelPart): IAutoMovieVector3 {
    const height: number =
      part.geometry.type === "primitive" &&
      (part.geometry.shape.type === "cylinder" ||
        part.geometry.shape.type === "capsule")
        ? part.geometry.shape.height
        : 0;
    return Quaternion.rotateVector(part.transform!.rotation, {
      x: 0,
      y: height / 2,
      z: 0,
    });
  }

  /** A bar's start, model space. */
  function start(part: IAutoMovieModelPart): IAutoMovieVector3 {
    return Vector3.subtract(part.transform!.translation, half(part));
  }

  /** A bar's end, model space. */
  function end(part: IAutoMovieModelPart): IAutoMovieVector3 {
    return Vector3.add(part.transform!.translation, half(part));
  }

  /**
   * A terminal cylinder's lowest point above the floor under a placement,
   * metres.
   */
  function sole(
    part: IAutoMovieModelPart,
    placement: IAutoMovieTransform,
  ): number {
    const top: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(
      placement,
      start(part),
    );
    const bottom: IAutoMovieVector3 = AutoMovieArchetypeFrame.point(
      placement,
      end(part),
    );
    const axis: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(bottom, top),
    );
    const radius: number =
      part.geometry.type === "primitive" &&
      (part.geometry.shape.type === "cylinder" ||
        part.geometry.shape.type === "capsule")
        ? part.geometry.shape.radius
        : 0;
    return Math.min(top.y, bottom.y) - radius * Math.hypot(axis.x, axis.z);
  }
}

/** A fore limb. */
type Fore = Extract<AutoMovieArchetypeQuadrupedBody.Limb, `${string}Fore`>;

/** A named instant of a ride. */
type Instant = AutoMovieArchetypeRide.IRide<string, string>["instants"][number];
