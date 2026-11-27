import { Quaternion, Vector3, AutoMovieEngineMath, AutoMovieEngineKinematics } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type AutoMovieArchetype, AutoMovieArchetypeFrame } from "../../core";
import { AutoMovieArchetypeQuadrupedBody } from "../AutoMovieArchetypeQuadrupedBody";
import { AutoMovieArchetypeQuadrupedLimb } from "../AutoMovieArchetypeQuadrupedLimb";
import { AutoMovieArchetypeQuadrupedSkeleton } from "../AutoMovieArchetypeQuadrupedSkeleton";
import { QuadrupedCarriage } from "../quadruped/QuadrupedCarriage";
import { QuadrupedRestFloor } from "../quadruped/QuadrupedRestFloor";
import { AutoMovieArchetypeQuadruped } from "../AutoMovieArchetypeQuadruped";

/**
 * A whole-body pose of an equid on its own hooves: its trunk moved as one rigid
 * body, each limb either placed with its hoof at a point or folded off the
 * floor, solved through the rig.
 *
 * The trunk with the hindquarters, neck, head and tail is one rigid body moved
 * from the rest model by `trunk`. A placed limb keeps its terminal endpoint on
 * an anchor with the terminal bar's base direction in the world, so a flat hoof
 * stays flat, and its proximal bars are solved by the shared exact limb owner
 * (`AutoMovieArchetypeQuadrupedLimb`) with a declared relative fold; an anchor
 * on the floor is a planted support. A folded limb turns its joints from a
 * given chain by declared angles, forward kinematics in the trunk's own frame.
 * Each bar is then turned from its rest direction onto its posed one and every
 * part and contact rides its declared carrier
 * (`AutoMovieArchetypeQuadrupedSkeleton.apply`). A limb that cannot reach its
 * anchor, or a pose that puts any part under the floor, is refused. The centre
 * of mass is approximated by the rest model's carried rigidly with the trunk,
 * neglecting what the limbs, neck and head shift: a stated coarse proxy for
 * weight transfer, not a load distribution.
 */
export namespace EquineBodyPose {
  /**
   * A limb whose hoof is placed at a point: on the floor it is a planted
   * support.
   */
  export interface IPlaced {
    /** Discriminator. */
    kind: "placed";

    /** The terminal endpoint, base model space, metres. */
    anchor: IAutoMovieVector3;

    /** Relative carpus or hock fold, degrees. */
    fold: number;

    /**
     * The terminal bar's direction in the base model's space, such as a hoof
     * tipped onto its toe; the base direction, a flat hoof, when absent.
     */
    direction?: IAutoMovieVector3;
  }

  /**
   * A limb folded off the floor: a chain in the trunk's frame with its joints
   * turned.
   */
  export interface IFolded {
    /** Discriminator. */
    kind: "folded";

    /** The five joints it folds from, rest model space. */
    chain: readonly IAutoMovieVector3[];

    /** The turn at each of the four joints, shoulder or hip first, degrees. */
    turns: readonly [number, number, number, number];
  }

  /** One limb's state. */
  export type Limb = IPlaced | IFolded;

  /** A whole-body pose. */
  export interface IGoal {
    /** The trunk's rigid motion. */
    trunk: AutoMovieArchetypeFrame.IMotion;

    /** Each limb's state. */
    limbs: Readonly<Record<AutoMovieArchetypeQuadrupedBody.Limb, Limb>>;

    /**
     * The tail's turn about the trunk's lateral axis at its dock, degrees,
     * positive raising a tail that hangs back; carried rigidly with the trunk
     * when absent.
     */
    tail?: number;
  }

  /** One equid's rest data and its solver. */
  export interface IPrepared<Id extends string, D extends string> {
    /**
     * Each limb's five rest joints, shoulder or hip to terminal endpoint, rest
     * model space.
     */
    chains: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, readonly IAutoMovieVector3[]>
    >;

    /** The rest model's centre of mass. */
    centre: IAutoMovieVector3;

    /** The trunk bar's rest frame. */
    trunk: IAutoMovieTransform;

    /** Each limb's five posed joints in the trunk's frame (rest model space). */
    chain(
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
      trunk: AutoMovieArchetypeFrame.IMotion,
      state: Limb,
    ): readonly IAutoMovieVector3[];

    /**
     * How far a limb's terminal part reaches below its endpoint when its bar
     * points along a direction.
     */
    sole(
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
      direction: IAutoMovieVector3,
    ): number;

    /** The posed equid in the base model's space. */
    solve(
      goal: IGoal,
      placement: IAutoMovieTransform,
    ): AutoMovieArchetype<Id, D>;
  }

  /**
   * Prepare an equid's rest data.
   *
   * @param animal The equid at rest, as its producer built it.
   * @returns The prepared solver.
   * @throws {RangeError} For a model missing a rig bar.
   */
  export function prepare<Id extends string, D extends string>(
    animal: AutoMovieArchetype<Id, D>,
  ): IPrepared<Id, D> {
    const rest: ReadonlyMap<
      AutoMovieArchetypeQuadrupedBody.Bone,
      IAutoMovieTransform
    > = AutoMovieEngineKinematics.prepareArticulatedRig(
      AutoMovieArchetypeQuadrupedSkeleton.of(animal),
    ).read();
    const lengths: Map<string, number> = new Map(
      animal.parts.map((part: IAutoMovieModelPart): [string, number] => [
        part.id,
        part.geometry.type === "primitive" &&
        (part.geometry.shape.type === "capsule" ||
          part.geometry.shape.type === "cylinder")
          ? part.geometry.shape.height
          : NaN,
      ]),
    );
    const read = (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
    ): readonly IAutoMovieVector3[] => {
      const bones: readonly AutoMovieArchetypeQuadrupedBody.Bone[] =
        AutoMovieArchetypeQuadrupedBody.BONES[limb];
      const last: IAutoMovieTransform = rest.get(bones[3]!)!;
      return [
        ...bones.map(
          (bone: AutoMovieArchetypeQuadrupedBody.Bone): IAutoMovieVector3 =>
            rest.get(bone)!.translation,
        ),
        Vector3.add(
          last.translation,
          Quaternion.rotateVector(last.rotation, {
            x: 0,
            y: lengths.get(bones[3]!)!,
            z: 0,
          }),
        ),
      ];
    };
    const chains: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, readonly IAutoMovieVector3[]>
    > = {
      leftFore: read("leftFore"),
      rightFore: read("rightFore"),
      leftHind: read("leftHind"),
      rightHind: read("rightHind"),
    };
    const solvers: Readonly<
      Record<
        AutoMovieArchetypeQuadrupedBody.Limb,
        AutoMovieArchetypeQuadrupedLimb.IPrepared
      >
    > = {
      leftFore: AutoMovieArchetypeQuadrupedLimb.prepare(chains.leftFore, true),
      rightFore: AutoMovieArchetypeQuadrupedLimb.prepare(
        chains.rightFore,
        true,
      ),
      leftHind: AutoMovieArchetypeQuadrupedLimb.prepare(chains.leftHind, false),
      rightHind: AutoMovieArchetypeQuadrupedLimb.prepare(
        chains.rightHind,
        false,
      ),
    };
    const carriers: ReturnType<typeof QuadrupedCarriage.of> =
      QuadrupedCarriage.of(animal, AutoMovieArchetypeQuadruped.species(animal));

    const chain = (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
      trunk: AutoMovieArchetypeFrame.IMotion,
      state: Limb,
    ): readonly IAutoMovieVector3[] => {
      const source: readonly IAutoMovieVector3[] = chains[limb];
      if (state.kind === "folded") return fold(state.chain, state.turns);
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(trunk.rotation);
      return solvers[limb]
        .oriented(
          Quaternion.rotateVector(
            inverse,
            state.direction ?? Vector3.subtract(source[4]!, source[3]!),
          ),
          true,
        )
        .solve(
          source[0]!,
          Quaternion.rotateVector(
            inverse,
            Vector3.subtract(state.anchor, trunk.translation),
          ),
          state.fold,
        );
    };
    const terminal = (
      limb: AutoMovieArchetypeQuadrupedBody.Limb,
    ): IAutoMovieModelPart =>
      animal.parts.find(
        (part: IAutoMovieModelPart): boolean =>
          part.id === AutoMovieArchetypeQuadrupedBody.BONES[limb][3],
      )!;
    const soles: Readonly<
      Record<AutoMovieArchetypeQuadrupedBody.Limb, IAutoMovieModelPart>
    > = {
      leftFore: terminal("leftFore"),
      rightFore: terminal("rightFore"),
      leftHind: terminal("leftHind"),
      rightHind: terminal("rightHind"),
    };
    return {
      chains,
      centre: animal.properties.centerOfMass,
      trunk: rest.get("trunk")!,
      chain,
      sole: (
        limb: AutoMovieArchetypeQuadrupedBody.Limb,
        direction: IAutoMovieVector3,
      ): number => {
        const geometry: IAutoMovieModelPart["geometry"] = soles[limb].geometry;
        if (
          geometry.type !== "primitive" ||
          (geometry.shape.type !== "capsule" &&
            geometry.shape.type !== "cylinder")
        )
          throw new RangeError(`The ${limb}'s terminal part is not a bar`);
        const unit: IAutoMovieVector3 = Vector3.normalize(direction);
        return geometry.shape.type === "capsule"
          ? geometry.shape.radius
          : geometry.shape.radius * Math.hypot(unit.x, unit.z);
      },
      solve: (
        goal: IGoal,
        placement: IAutoMovieTransform,
      ): AutoMovieArchetype<Id, D> => {
        const posed: Map<
          AutoMovieArchetypeQuadrupedBody.Bone,
          IAutoMovieTransform
        > = new Map();
        for (const [bone, frame] of rest)
          posed.set(bone, AutoMovieArchetypeFrame.move(goal.trunk, frame));

        // The tail turns about its dock on the trunk's lateral axis.
        if (goal.tail !== undefined && goal.tail !== 0) {
          const tail: IAutoMovieTransform = posed.get("tail")!;
          const turn: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
            Quaternion.rotateVector(goal.trunk.rotation, { x: 1, y: 0, z: 0 }),
            goal.tail,
          );
          posed.set(
            "tail",
            AutoMovieArchetypeFrame.move(
              {
                rotation: turn,
                translation: Vector3.subtract(
                  tail.translation,
                  Quaternion.rotateVector(turn, tail.translation),
                ),
              },
              tail,
            ),
          );
        }
        for (const limb of AutoMovieArchetypeQuadrupedBody.LIMBS) {
          const source: readonly IAutoMovieVector3[] = chains[limb];
          const solved: readonly IAutoMovieVector3[] = chain(
            limb,
            goal.trunk,
            goal.limbs[limb],
          );
          AutoMovieArchetypeQuadrupedBody.BONES[limb].forEach(
            (bone: AutoMovieArchetypeQuadrupedBody.Bone, k: number): void => {
              const frame: IAutoMovieTransform = rest.get(bone)!;
              const turn: IAutoMovieQuaternion = AutoMovieEngineMath.rotationBetween(
                Vector3.subtract(source[k + 1]!, source[k]!),
                Vector3.subtract(solved[k + 1]!, solved[k]!),
              );
              posed.set(
                bone,
                AutoMovieArchetypeFrame.move(goal.trunk, {
                  ...frame,
                  translation: { ...solved[k]! },
                  rotation: Quaternion.normalize(
                    Quaternion.multiply(turn, frame.rotation),
                  ),
                }),
              );
            },
          );
        }
        const model: AutoMovieArchetype<Id, D> =
          AutoMovieArchetypeQuadrupedSkeleton.apply(
            animal,
            rest,
            posed,
            carriers.parts,
            carriers.contacts,
          );
        const cells: AutoMovieArchetype["convexCells"] = model.convexCells;
        for (const part of model.parts) {
          if (part.transform === null || part.transform === undefined) continue;
          const lowest: number = QuadrupedRestFloor(
            {
              ...part,
              transform: AutoMovieArchetypeFrame.compose(placement, part.transform),
            },
            cells,
          );
          if (!(lowest >= -1e-9))
            throw new RangeError(
              `The ${part.id} reaches ${-lowest} m under the floor in this pose`,
            );
        }
        return model;
      },
    };
  }

  /**
   * A rigid motion: a pitch and a roll about a pivot, then a shift.
   *
   * @param pitch Degrees about the heading's +X through the pivot: positive
   *   raises a forward point.
   * @param roll Degrees about the heading's +Z through the pivot: positive
   *   raises the left (+X) side.
   * @param pivot The point both turns are about, metres.
   * @param shift The translation after the turns, metres.
   * @param heading The frame whose X and Z the turns are about, such as a
   *   stance's yaw after a spin; the base model's own axes when absent.
   * @returns The motion.
   */
  export function turn(
    pitch: number,
    roll: number,
    pivot: IAutoMovieVector3,
    shift: IAutoMovieVector3,
    heading?: IAutoMovieQuaternion,
  ): AutoMovieArchetypeFrame.IMotion {
    const local: IAutoMovieQuaternion = Quaternion.multiply(
      Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, roll),
      Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -pitch),
    );
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      heading === undefined
        ? local
        : Quaternion.multiply(
            Quaternion.multiply(heading, local),
            Quaternion.inverse(heading),
          ),
    );
    return {
      rotation,
      translation: Vector3.add(
        Vector3.subtract(pivot, Quaternion.rotateVector(rotation, pivot)),
        shift,
      ),
    };
  }

  /**
   * A rigid motion applied to a point.
   *
   * @param motion The motion.
   * @param point The point.
   * @returns The moved point.
   */
  export function point(
    motion: AutoMovieArchetypeFrame.IMotion,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.add(
      Quaternion.rotateVector(motion.rotation, point),
      motion.translation,
    );
  }

  /**
   * Turn each joint of a chain about the lateral axis, carrying everything
   * below it.
   */
  function fold(
    chain: readonly IAutoMovieVector3[],
    turns: readonly [number, number, number, number],
  ): readonly IAutoMovieVector3[] {
    const points: IAutoMovieVector3[] = chain.map(
      (p: IAutoMovieVector3): IAutoMovieVector3 => ({ ...p }),
    );
    turns.forEach((degrees: number, k: number): void => {
      if (degrees === 0) return;
      const rotation: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 1, y: 0, z: 0 },
        degrees,
      );
      const joint: IAutoMovieVector3 = points[k]!;
      for (let j: number = k + 1; j < points.length; j++)
        points[j] = Vector3.add(
          joint,
          Quaternion.rotateVector(
            rotation,
            Vector3.subtract(points[j]!, joint),
          ),
        );
    });
    return points;
  }
}
