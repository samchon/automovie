import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieAffordance,
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import {
  type AutoMovieArchetype,
  AutoMovieArchetypeFrame,
  AutoMovieArchetypeRefusal,
  type AutoMovieArchetypeRide,
} from "../core";
import { AutoMovieArchetypeQuadrupedBody } from "./AutoMovieArchetypeQuadrupedBody";

/**
 * The places a handler touches when caring for an equid, read from its actual parts: each side of the barrel to brush, the poll a headstall crosses, the head's socket a halter is put on, the trunk's socket a saddle is laid on, and each hoof to hold up.
 *
 * Each care point is a contact on the surface of one actual part, its frame's +Y the outward normal and +X the direction a brush strokes along the coat (backward along the barrel) or the bar's axis for a held hoof. A point is carried by its part, so in any posed sample of the equid its frame is the rest frame moved by that part's own rigid change.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each care point, its frame convention and how it follows the posed equid.
 * @evidence contracts/development/design.md#principled-representation Affordance records in the rest model's space, each bound to one actual part.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by a scene that stages a handler: the points join the horse prop's contacts and their frames its contact reader.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every point is on an actual part's surface; none is placed by a fitted offset.
 */
export namespace AutoMovieArchetypeEquineCare {
  /**
   * The care points of one equid and their posed frames.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each member gives.
   * @evidence contracts/development/design.md#principled-representation The affordances and a frame reader.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Returned by `of`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPoints {
    /** The care points at rest, model space. */
    affordances: readonly IAutoMovieAffordance[];

    /**
     * A care point's world frame in a posed sample.
     *
     * @evidence contracts/development/common.md#meaningful-documentation World frame; refuses an unknown id.
     * @evidence contracts/development/implementation.md#principled-implementation The rest frame moved by its part's change from rest to the sample, then placed.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One part lookup, two compositions.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown id refuses.
     * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the sample's parts.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Rest frames are prepared once.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
     */
    frame(
      sample: AutoMovieArchetypeRide.IPose<string, string>,
      id: string,
    ): IAutoMovieTransform;
  }

  /**
   * Read an equid's care points.
   *
   * @param animal The equid at rest.
   * @returns Its care points.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and output.
   * @evidence contracts/development/implementation.md#principled-implementation Each point is on its actual part's surface: the trunk capsule's side at the middle of its axis, the head capsule's dorsal surface at the poll, and each pastern bar's axis at its middle, a round handle of the bar's diameter facing out.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One record per point, built from the part it lies on.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the parts, once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The rest part frames serve every posed read.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the care records and rest part frames.
   */
  export function of(animal: Pick<AutoMovieArchetype, "parts">): IPoints {
    const parts: Map<string, IAutoMovieModelPart> = new Map(
      animal.parts.map(
        (part: IAutoMovieModelPart): [string, IAutoMovieModelPart] => [
          part.id,
          part,
        ],
      ),
    );
    const bound: Map<string, string> = new Map();
    const affordances: IAutoMovieAffordance[] = [];
    const add = (
      id: string,
      part: string,
      point: IAutoMovieVector3,
      normal: IAutoMovieVector3,
      along: IAutoMovieVector3,
      held: number | null,
    ): void => {
      bound.set(id, part);
      affordances.push({
        id,
        kind: held === null ? "surface" : "handle",
        frame: AutoMovieArchetypeFrame.facing(point, normal, along),
        extent: null,
        ...(held === null
          ? {}
          : { grip: "power", aperture: 2 * held, symmetry: "round" }),
      });
    };

    // The barrel's sides at the middle of the trunk capsule, stroked backward.
    const trunk: IBar = bar(parts.get("trunk")!);
    const middle: IAutoMovieVector3 = Vector3.lerp(trunk.from, trunk.to, 0.5);
    const back: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(trunk.from, trunk.to),
    );
    for (const [id, sign] of [
      ["groomLeft", 1],
      ["groomRight", -1],
    ] as const)
      add(
        id,
        "trunk",
        Vector3.addScaled(middle, { x: sign, y: 0, z: 0 }, trunk.radius),
        { x: sign, y: 0, z: 0 },
        back,
        null,
      );

    // The poll's crown, dorsal to the head capsule's axis.
    const head: IBar = bar(parts.get("head")!);
    const along: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(head.to, head.from),
    );
    const up: IAutoMovieVector3 = Vector3.normalize(
      Vector3.addScaled({ x: 0, y: 1, z: 0 }, along, -along.y),
    );
    add(
      "poll",
      "head",
      Vector3.addScaled(head.from, up, head.radius),
      up,
      { x: 1, y: 0, z: 0 },
      null,
    );

    // The headgear socket is the head's own frame at the poll, +Y along the head and +X to the left: a fitted halter's `seat` (`createHalter`) is laid on it.
    bound.set("headgear", "head");
    affordances.push({
      id: "headgear",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.facing(head.from, along, {
        x: 1,
        y: 0,
        z: 0,
      }),
      extent: null,
    });

    // The saddle socket is the model's own frame carried by the trunk: a saddle prop made in that frame (`AutoMovieArchetypeEquineSaddleProp`) is laid on it.
    bound.set("saddle", "trunk");
    affordances.push({
      id: "saddle",
      kind: "socket",
      frame: AutoMovieArchetypeFrame.upright({ x: 0, y: 0, z: 0 }),
      extent: null,
    });

    // Each hoof held round the middle of its pastern bar, a handle whose frame lies on the bar's axis with its outer side as the normal, as a handler beside the limb takes it.
    for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
      const id: AutoMovieArchetypeQuadrupedBody.Bone =
        AutoMovieArchetypeQuadrupedBody.BONES[limb][3];
      const pastern: IBar = bar(parts.get(id)!);
      const axis: IAutoMovieVector3 = Vector3.normalize(
        Vector3.subtract(pastern.to, pastern.from),
      );
      const sign: number = limb.startsWith("left") ? 1 : -1;
      const outside: IAutoMovieVector3 = Vector3.normalize(
        Vector3.addScaled({ x: sign, y: 0, z: 0 }, axis, -sign * axis.x),
      );
      add(
        `${limb}Hoof`,
        id,
        Vector3.lerp(pastern.from, pastern.to, 0.5),
        outside,
        axis,
        pastern.radius,
      );
    }
    const rest: Map<string, IAutoMovieTransform> = new Map(
      [...new Set(bound.values())].map(
        (id: string): [string, IAutoMovieTransform] => [
          id,
          parts.get(id)!.transform!,
        ],
      ),
    );
    return {
      affordances,
      frame: (
        sample: AutoMovieArchetypeRide.IPose<string, string>,
        id: string,
      ): IAutoMovieTransform => {
        const part: string | undefined = bound.get(id);
        const record: IAutoMovieAffordance | undefined = affordances.find(
          (affordance: IAutoMovieAffordance): boolean => affordance.id === id,
        );
        if (part === undefined || record === undefined)
          throw new AutoMovieArchetypeRefusal({
            kind: "parameter",
            archetype: "equid",
            axis: "point",
            value: id,
            feasible: { kind: "alternatives", values: [...bound.keys()] },
            reason: `no care point ${id}`,
            fix: "name one of the equid's care points",
          });
        const now: IAutoMovieTransform = sample.archetype.parts.find(
          (candidate: IAutoMovieModelPart): boolean => candidate.id === part,
        )!.transform!;
        const was: IAutoMovieTransform = rest.get(part)!;
        const turn: IAutoMovieQuaternion = Quaternion.multiply(
          now.rotation,
          Quaternion.inverse(was.rotation),
        );
        return AutoMovieArchetypeFrame.compose(
          sample.placement,
          AutoMovieArchetypeFrame.move(
            {
              rotation: turn,
              translation: Vector3.subtract(
                now.translation,
                Quaternion.rotateVector(turn, was.translation),
              ),
            },
            record.frame,
          ),
        );
      },
    };
  }

  /** A bar part's axis and radius, model space. */
  interface IBar {
    /** Its start. */
    from: IAutoMovieVector3;

    /** Its end. */
    to: IAutoMovieVector3;

    /** Its radius, metres. */
    radius: number;
  }

  /** Read a bar part's axis. */
  function bar(part: IAutoMovieModelPart): IBar {
    const geometry: IAutoMovieModelPart["geometry"] = part.geometry;
    if (
      geometry.type !== "primitive" ||
      (geometry.shape.type !== "capsule" && geometry.shape.type !== "cylinder")
    )
      throw new RangeError(`The ${part.id} is not a bar`);
    const half: IAutoMovieVector3 = Quaternion.rotateVector(
      part.transform!.rotation,
      { x: 0, y: geometry.shape.height / 2, z: 0 },
    );
    return {
      from: Vector3.subtract(part.transform!.translation, half),
      to: Vector3.add(part.transform!.translation, half),
      radius: geometry.shape.radius,
    };
  }
}
