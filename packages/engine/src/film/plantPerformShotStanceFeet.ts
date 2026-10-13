import {
  AutoMovieHumanoidBone,
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndState,
  IAutoMovieBeatEndFootPlant,
  IAutoMovieMotion,
  IAutoMovieQuaternion,
  IAutoMovieSceneNode,
  IAutoMovieSkeleton,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieJointAxes } from "../kinematics/IAutoMovieJointAxes";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { IAutoMovieFootPlant } from "../motion/IAutoMovieFootPlant";
import { IAutoMoviePlantedFeet } from "../motion/IAutoMoviePlantedFeet";
import { plantStanceFeet } from "../motion/plantStanceFeet";
import { IAutoMovieRestFrame } from "../rom/IAutoMovieRestFrame";
import { spaceGround } from "../space/spaceGround";
import { compareCodeUnits } from "../text/compareCodeUnits";
import { IAutoMoviePerformedShot } from "./IAutoMoviePerformedShot";
import { IAutoMovieStagedSet } from "./IAutoMovieStagedSet";

/**
 * Pin the stance feet of every gait-bearing or resumed actor clip, replacing
 * the clip in `motions` and returning the world-space plants a later beat can
 * resume.
 *
 * An actor is planted when its clip carries a gait cycle or the previous beat
 * left it opening plants, and it has a rig and a staged node; a static gesture
 * or hold clip keeps its authored key grid. Opening plants are converted from
 * scene world space into the actor's model frame for the solve, and the new
 * plants back into world space, exactly once. With a scene space, its world
 * ground height is carried into the model frame for contact; otherwise the
 * model-space `y = 0` plane is the ground. The conversion assumes the
 * unit-scale, yaw-only actor transform `stageScene` emits. A rig with no
 * recognized foot plants nothing, and its clip is left untouched so a host's
 * own plant measurements are not shadowed. Actors are processed in code-unit
 * order of their ids, which is the order of the returned entries.
 *
 * @param props.staged The validated stage result.
 * @param props.motions The compiled clips by node id; planted clips replace theirs.
 * @param props.previous The prior beat's end state, or null.
 * @param props.skeleton Rig lookup; null for a node with no skeleton.
 * @param props.jointAxes Per-node joint axes the renderer uses, when supplied.
 * @param props.restFrames Per-node rest frames the renderer uses, when supplied.
 * @returns One entry per planted actor, plants in world metres.
 *
 * @evidence contracts/common.md#principled-implementation Ground contact is solved in the actor's model frame by `plantStanceFeet`, and positions cross between frames by the inverse and forward rigid transform of the staged node, which is exact for the unit-scale yaw-only transform staging emits; ground height is sampled in world space and carried into the model frame point by point.
 * @evidence contracts/common.md#clear-and-simple-design The stance stage of `performShot` in one place; the solve is `plantStanceFeet` and the world ground is `spaceGround`, so this function owns only the frame conversions and the choice of which actors to plant.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every actor meeting the stated conditions is planted the same way; a rig without recognized feet is left as authored rather than given invented contacts.
 * @evidence contracts/common.md#meaningful-documentation States which actors are planted and which are left alone, the frame conversions and their premise, the ground source, the effect on `motions`, the footless-rig rule and why, and the order of the result.
 * @evidence contracts/performance.md#efficient-algorithms One plant solve per qualifying actor, each linear in its clip's samples; the node lookup is a linear scan of the staged nodes per planted actor, which a beat's handful of actors keeps small.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Each actor's clip is planted once per call; the prior plants are indexed once by node.
 * @evidenceExclude contracts/performance.md#bound-retention-and-release-resources The prior-plant index is dropped on return; planted clips are stored into the caller's `motions`, and the caller owns the returned entries.
 */
export const plantPerformShotStanceFeet = (props: {
  staged: IAutoMovieStagedSet.ISuccess;
  motions: Record<string, IAutoMovieMotion>;
  previous: IAutoMovieBeatEndState | null | undefined;
  skeleton: (node: string) => IAutoMovieSkeleton | null;
  jointAxes:
    | ((
        node: string,
      ) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>> | undefined)
    | undefined;
  restFrames:
    | ((
        node: string,
      ) => Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>> | undefined)
    | undefined;
}): IAutoMoviePerformedShot.ISuccess["plants"] => {
  const plants: IAutoMoviePerformedShot.ISuccess["plants"] = [];
  const previousByNode: Map<string, IAutoMovieBeatEndActorState> = new Map(
    (props.previous?.actors ?? []).map(
      (
        actor: IAutoMovieBeatEndActorState,
      ): [string, IAutoMovieBeatEndActorState] => [actor.node, actor],
    ),
  );
  const space: IAutoMovieStagedSet.ISuccess["scene"]["space"] | null =
    props.staged.scene.space ?? null;
  const worldGround: ((x: number, z: number) => number) | null =
    space === null ? null : spaceGround(space);
  for (const [actor, motion] of Object.entries(props.motions).sort(
    ([x]: [string, IAutoMovieMotion], [y]: [string, IAutoMovieMotion]): number =>
      compareCodeUnits(x, y),
  )) {
    const prior: IAutoMovieBeatEndActorState["footPlants"] =
      previousByNode.get(actor)?.footPlants ?? null;
    if (prior === null && (motion.gaitCycle ?? null) === null) continue;
    const rig: IAutoMovieSkeleton | null = props.skeleton(actor);
    const node: IAutoMovieSceneNode | undefined = props.staged.scene.nodes.find(
      (entry: IAutoMovieSceneNode): boolean => entry.id === actor,
    );
    if (rig === null || node === undefined) continue;
    const rotation: IAutoMovieQuaternion = node.transform.rotation;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(rotation);
    const toModel = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, node.transform.translation),
      );
    const toWorld = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Vector3.add(
        node.transform.translation,
        Quaternion.rotateVector(rotation, point),
      );
    const modelGround: ((x: number, z: number) => number) | null =
      worldGround === null
        ? null
        : (x: number, z: number): number => {
            const plan: IAutoMovieVector3 = toWorld({ x, y: 0, z });
            return toModel({
              x: plan.x,
              y: worldGround(plan.x, plan.z),
              z: plan.z,
            }).y;
          };
    const planted: IAutoMoviePlantedFeet = plantStanceFeet({
      skeleton: rig,
      motion,
      jointAxes: props.jointAxes?.(actor),
      restFrames: props.restFrames?.(actor),
      ...(modelGround === null ? {} : { groundY: modelGround }),
      openingPlants: (prior ?? []).map(
        (
          plant: IAutoMovieBeatEndFootPlant,
        ): Pick<IAutoMovieFootPlant, "foot" | "position"> => ({
          foot: plant.foot,
          position: toModel(plant.position),
        }),
      ),
    });
    if (planted.plants.length === 0) continue;
    props.motions[actor] = planted.motion;
    plants.push({
      node: actor,
      plants: planted.plants.map(
        (plant: IAutoMovieFootPlant): IAutoMovieBeatEndFootPlant => ({
          ...plant,
          position: toWorld(plant.position),
        }),
      ),
    });
  }
  return plants;
};
