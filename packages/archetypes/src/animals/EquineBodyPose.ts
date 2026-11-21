import {
  Quaternion,
  Vector3,
  prepareArticulatedRig,
  rotationBetween,
} from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieQuaternion,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { type Archetype, ArchetypeFrame } from "../core";
import { QuadrupedBody } from "./QuadrupedBody";
import { QuadrupedCarriage } from "./QuadrupedCarriage";
import { QuadrupedLimb } from "./QuadrupedLimb";
import { QuadrupedRestFloor } from "./QuadrupedRestFloor";
import { QuadrupedSkeleton } from "./QuadrupedSkeleton";
import { createQuadruped } from "./createQuadruped";

/**
 * A whole-body pose of an equid on its own hooves: its trunk moved as one rigid body, each limb either placed with its hoof at a point or folded off the floor, solved through the actual rig.
 *
 * The trunk with the hindquarters, neck, head and tail is one rigid body moved from the rest model by `trunk`. A placed limb keeps its terminal endpoint on an anchor with the terminal bar's base direction in the world, so a flat hoof stays flat, and its proximal bars are solved by the shared exact limb owner (`QuadrupedLimb`) with a declared relative fold; an anchor on the floor is a planted support. A folded limb turns its joints from a given chain by declared angles, forward kinematics in the trunk's own frame. Each bar is then turned from its rest direction onto its posed one and every part and contact rides its declared carrier (`QuadrupedSkeleton.apply`). A limb that cannot reach its anchor, or a pose that puts any part under the floor, is refused. The centre of mass is approximated by the rest model's carried rigidly with the trunk, neglecting what the limbs, neck and head shift: a stated coarse proxy for weight transfer, not a load distribution.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the rigid trunk, the placed and folded limb rules, the solve and emission owners, the refusals and the centre-of-mass proxy with its limitation.
 * @evidence contracts/development/design.md#principled-representation A trunk motion and four limb states in metres and degrees in the base model's space; the placed/folded union separates the two limb rules.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One solver shared by every standing behaviour of `EquineStance`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No stretched bar, moved attachment or clamped endpoint: an unreachable limb refuses.
 */
export namespace EquineBodyPose {
  /**
   * A limb whose hoof is placed at a point: on the floor it is a planted support.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The anchor is the terminal endpoint in the base model's space; fold is the relative carpus or hock fold in degrees.
   * @evidence contracts/development/design.md#principled-representation An anchor and a fold.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A `Limb` member.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPlaced {
    /** Discriminator. */
    kind: "placed";

    /** The terminal endpoint, base model space, metres. */
    anchor: IAutoMovieVector3;

    /** Relative carpus or hock fold, degrees. */
    fold: number;
  }

  /**
   * A limb folded off the floor: a chain in the trunk's frame with its joints turned.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The chain's five joints are in the rest model's space, which moves with the trunk; each angle turns the bar below its joint and everything under it about the limb's lateral axis, degrees, positive swinging the distal end backward.
   * @evidence contracts/development/design.md#principled-representation A source chain and four joint angles.
   * @evidence contracts/development/design.md#minimal-and-owned-surface A `Limb` member.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IFolded {
    /** Discriminator. */
    kind: "folded";

    /** The five joints it folds from, rest model space. */
    chain: readonly IAutoMovieVector3[];

    /** The turn at each of the four joints, shoulder or hip first, degrees. */
    turns: readonly [number, number, number, number];
  }

  /**
   * One limb's state.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Placed or folded.
   * @evidence contracts/development/design.md#principled-representation A discriminated union.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The limbs of `IGoal`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export type Limb = IPlaced | IFolded;

  /**
   * A whole-body pose.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The trunk's rigid motion from the rest model into the base model's space, and every limb's state.
   * @evidence contracts/development/design.md#principled-representation One rigid motion and four limbs.
   * @evidence contracts/development/design.md#minimal-and-owned-surface What `IPrepared.solve` takes.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IGoal {
    /** The trunk's rigid motion. */
    trunk: ArchetypeFrame.IMotion;

    /** Each limb's state. */
    limbs: Readonly<Record<QuadrupedBody.Limb, Limb>>;
  }

  /**
   * One equid's rest data and its solver.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what each member gives and its frame.
   * @evidence contracts/development/design.md#principled-representation The rest chains and centre of mass in the rest model's space, and the solver.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read by the stance planner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IPrepared<Id extends string, D extends string> {
    /** Each limb's five rest joints, shoulder or hip to terminal endpoint, rest model space. */
    chains: Readonly<Record<QuadrupedBody.Limb, readonly IAutoMovieVector3[]>>;

    /** The rest model's centre of mass. */
    centre: IAutoMovieVector3;

    /** The trunk bar's rest frame. */
    trunk: IAutoMovieTransform;

    /**
     * Each limb's five posed joints in the trunk's frame (rest model space).
     *
     * @evidence contracts/development/common.md#meaningful-documentation Returns the solved or folded chain; refuses an unreachable anchor.
     * @evidence contracts/development/implementation.md#principled-implementation A placed limb is the exact oriented limb solve toward its anchor carried into the trunk's frame with the base terminal direction; a folded limb turns its chain joint by joint about the lateral axis.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per limb state.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reach is refused by the limb owner, never clamped.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per limb.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Prepared limb solvers serve every call.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh points and retains nothing.
     */
    chain(
      limb: QuadrupedBody.Limb,
      trunk: ArchetypeFrame.IMotion,
      state: Limb,
    ): readonly IAutoMovieVector3[];

    /**
     * The posed equid in the base model's space.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Returns the model; refuses an unreachable limb or a part under the floor at the given placement.
     * @evidence contracts/development/implementation.md#principled-implementation Move the axial bones rigidly, pose each limb with `chain`, turn each bar onto its posed direction and emit through the actual carriers; then measure every part's lowest point under the placement.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Trunk, four limbs, emission, floor check.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Reach and floor are refused, never clamped.
     * @evidence contracts/development/implementation.md#efficient-algorithms Four constant-size limb poses, O(B) frames and O(P+A) emission and floor work.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Prepared chains, solvers and carriers serve every sample.
     * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Returns a fresh model and retains nothing.
     */
    solve(goal: IGoal, placement: IAutoMovieTransform): Archetype<Id, D>;
  }

  /**
   * Prepare an equid's rest data.
   *
   * @param animal The equid at rest, as its producer built it.
   * @returns The prepared solver.
   * @throws {RangeError} For a model missing a rig bar.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and output.
   * @evidence contracts/development/implementation.md#principled-implementation Read the rest FK frames, each limb's five joints from its four bars, the rest centre of mass and the declared carriers.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One rig read, one chain read per limb, one carrier read.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Chains come from the actual bars, never from a species table.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(B+P) once.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Everything prepared serves every pose.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains the rest frames, chains, carriers and the source model for as long as the caller keeps the solver.
   */
  export function prepare<Id extends string, D extends string>(
    animal: Archetype<Id, D>,
  ): IPrepared<Id, D> {
    const rest: ReadonlyMap<QuadrupedBody.Bone, IAutoMovieTransform> =
      prepareArticulatedRig(QuadrupedSkeleton.of(animal)).read();
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
    const read = (limb: QuadrupedBody.Limb): readonly IAutoMovieVector3[] => {
      const bones: readonly QuadrupedBody.Bone[] = QuadrupedBody.BONES[limb];
      const last: IAutoMovieTransform = rest.get(bones[3]!)!;
      return [
        ...bones.map(
          (bone: QuadrupedBody.Bone): IAutoMovieVector3 =>
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
      Record<QuadrupedBody.Limb, readonly IAutoMovieVector3[]>
    > = {
      leftFore: read("leftFore"),
      rightFore: read("rightFore"),
      leftHind: read("leftHind"),
      rightHind: read("rightHind"),
    };
    const solvers: Readonly<
      Record<QuadrupedBody.Limb, QuadrupedLimb.IPrepared>
    > = {
      leftFore: QuadrupedLimb.prepare(chains.leftFore, true),
      rightFore: QuadrupedLimb.prepare(chains.rightFore, true),
      leftHind: QuadrupedLimb.prepare(chains.leftHind, false),
      rightHind: QuadrupedLimb.prepare(chains.rightHind, false),
    };
    const carriers: ReturnType<typeof QuadrupedCarriage.of> =
      QuadrupedCarriage.of(animal, createQuadruped.species(animal));

    const chain = (
      limb: QuadrupedBody.Limb,
      trunk: ArchetypeFrame.IMotion,
      state: Limb,
    ): readonly IAutoMovieVector3[] => {
      const source: readonly IAutoMovieVector3[] = chains[limb];
      if (state.kind === "folded") return fold(state.chain, state.turns);
      const inverse: IAutoMovieQuaternion = Quaternion.inverse(trunk.rotation);
      return solvers[limb]
        .oriented(
          Quaternion.rotateVector(
            inverse,
            Vector3.subtract(source[4]!, source[3]!),
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
    return {
      chains,
      centre: animal.properties.centerOfMass,
      trunk: rest.get("trunk")!,
      chain,
      solve: (
        goal: IGoal,
        placement: IAutoMovieTransform,
      ): Archetype<Id, D> => {
        const posed: Map<QuadrupedBody.Bone, IAutoMovieTransform> = new Map();
        for (const [bone, frame] of rest)
          posed.set(bone, ArchetypeFrame.move(goal.trunk, frame));
        for (const limb of QuadrupedBody.LIMBS) {
          const source: readonly IAutoMovieVector3[] = chains[limb];
          const solved: readonly IAutoMovieVector3[] = chain(
            limb,
            goal.trunk,
            goal.limbs[limb],
          );
          QuadrupedBody.BONES[limb].forEach(
            (bone: QuadrupedBody.Bone, k: number): void => {
              const frame: IAutoMovieTransform = rest.get(bone)!;
              const turn: IAutoMovieQuaternion = rotationBetween(
                Vector3.subtract(source[k + 1]!, source[k]!),
                Vector3.subtract(solved[k + 1]!, solved[k]!),
              );
              posed.set(
                bone,
                ArchetypeFrame.move(goal.trunk, {
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
        const model: Archetype<Id, D> = QuadrupedSkeleton.apply(
          animal,
          rest,
          posed,
          carriers.parts,
          carriers.contacts,
        );
        for (const part of model.parts) {
          if (part.transform === null || part.transform === undefined) continue;
          const lowest: number = QuadrupedRestFloor({
            ...part,
            transform: ArchetypeFrame.compose(placement, part.transform),
          });
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
   * @param pitch Degrees about +X through the pivot: positive raises a forward point.
   * @param roll Degrees about +Z through the pivot: positive raises the left (+X) side.
   * @param pivot The point both turns are about, metres.
   * @param shift The translation after the turns, metres.
   * @returns The motion.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States each argument's unit, axis and sign.
   * @evidence contracts/development/implementation.md#principled-implementation A turn about X by minus the pitch raises +Z, a turn about Z by minus the roll raises +X, composed about the pivot and followed by the shift.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Two axis-angle turns and one translation.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by every stance row.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function turn(
    pitch: number,
    roll: number,
    pivot: IAutoMovieVector3,
    shift: IAutoMovieVector3,
  ): ArchetypeFrame.IMotion {
    const rotation: IAutoMovieQuaternion = Quaternion.normalize(
      Quaternion.multiply(
        Quaternion.fromAxisAngle({ x: 0, y: 0, z: 1 }, -roll),
        Quaternion.fromAxisAngle({ x: 1, y: 0, z: 0 }, -pitch),
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
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the result.
   * @evidence contracts/development/implementation.md#principled-implementation Rotation then translation.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One expression.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts None.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Shared by the stance planner's centre-of-mass and pivot reads.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function point(
    motion: ArchetypeFrame.IMotion,
    point: IAutoMovieVector3,
  ): IAutoMovieVector3 {
    return Vector3.add(
      Quaternion.rotateVector(motion.rotation, point),
      motion.translation,
    );
  }

  /** Turn each joint of a chain about the lateral axis, carrying everything below it. */
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
