import type {
  AutoMovieHumanoidBone,
  IAutoMovieBeatEndActorState,
  IAutoMovieBeatEndFootPlant,
  IAutoMovieFootPlant,
  IAutoMovieJointAxes,
  IAutoMovieMotion,
  IAutoMoviePerformedShot,
  IAutoMoviePlantPerformShotStanceFeet,
  IAutoMoviePlantedFeet,
  IAutoMovieQuaternion,
  IAutoMovieRestFrame,
  IAutoMovieSceneNode,
  IAutoMovieSkeleton,
  IAutoMovieStagedSet,
  IAutoMovieTimedGround,
  IAutoMovieVector3,
  IAutoMovieViolationAppendSink,
} from "@automovie/interface";

import { prepareSkeletonPoseResolution } from "../../kinematics/internal/prepareSkeletonPoseResolution";
import { Quaternion } from "../../math/Quaternion";
import { Vector3 } from "../../math/Vector3";
import { STATIC_SUPPORT_HEIGHT_EPSILON } from "../../motion/constants/STATIC_SUPPORT_HEIGHT_EPSILON";
import { AutoMovieEngineMotionPlanting } from "../../motion";
import { AutoMovieEngineMotionSampling } from "../../motion/AutoMovieEngineMotionSampling";
import { sampleStanceTimes } from "../../motion/internal/sampleStanceTimes";
import { spaceGround } from "../../space/internal/spaceGround";
import { AutoMovieEngineText } from "../../text/AutoMovieEngineText";
import type { IStageGround } from "../staging/IStageGround";
import { prepareStageSupport } from "../staging/internal/prepareStageSupport";

/*
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
 * Shot admission checks scoped actors' sampled root positions and opening pins
 * against their named surfaces. When a grounded window contains a full gait
 * cycle and resolves a foot over eligible support, a plant or the gait's
 * model-ground origin must meet that support. Window changes appear at exact
 * seconds on the sample clock. Empty windows hand grounding to the authored
 * carrier or airborne action and do not plant against the scene-wide surface.
 * Parameter props.staged: The validated stage result.
 * Parameter props.motions: The compiled clips by node id; planted clips replace
 * theirs.
 * Parameter props.previous: The prior beat's end state, or null.
 * Parameter props.skeleton: Rig lookup; null for a node with no skeleton.
 * Parameter props.jointAxes: Per-node joint axes the renderer uses, when supplied.
 * Parameter props.restFrames: Per-node rest frames the renderer uses, when
 * supplied.
 * Parameter admission: Shot duration in seconds and collector for explicit support.
 * Omission retains ordinary unscoped planting.
 * Returns: One entry per planted actor, plants in world metres.
 */
export function plantPerformShotStanceFeet(
  props: IAutoMoviePlantPerformShotStanceFeet.IProps,
  admission?: {
    duration: number;
    out: IAutoMovieViolationAppendSink;
  },
): IAutoMoviePerformedShot.ISuccess["plants"] {
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
  const worldGround: ((x: number, z: number) => number) | undefined =
    space === null ? undefined : spaceGround(space);
  const scopes: ReturnType<typeof prepareStageSupport> =
    admission === undefined ? new Map() : prepareStageSupport(props.staged);
  const actors: string[] = [
    ...new Set([...Object.keys(props.motions), ...scopes.keys()]),
  ].sort(AutoMovieEngineText.compareCodeUnits);
  for (const actor of actors) {
    const motion: IAutoMovieMotion | undefined = props.motions[actor];
    let prior: IAutoMovieBeatEndActorState["footPlants"] =
      previousByNode.get(actor)?.footPlants ?? null;
    const scope = scopes.get(actor);
    const gait: IAutoMovieMotion["gaitCycle"] = motion?.gaitCycle;
    const gaitBearing: boolean = gait !== null && gait !== undefined;
    const eligible: boolean =
      motion !== undefined && (prior !== null || gaitBearing);
    if (!eligible && scope === undefined) continue;
    const node: IAutoMovieSceneNode | undefined = props.staged.scene.nodes.find(
      (entry: IAutoMovieSceneNode): boolean => entry.id === actor,
    );
    if (node === undefined) continue;
    const translation: IAutoMovieVector3 = node.transform.translation;
    const rotation: IAutoMovieQuaternion = node.transform.rotation;
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(rotation);
    function toModel(point: IAutoMovieVector3): IAutoMovieVector3 {
      return Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, translation),
      );
    }
    function toWorld(point: IAutoMovieVector3): IAutoMovieVector3 {
      return Vector3.add(translation, Quaternion.rotateVector(rotation, point));
    }

    let support: IAutoMovieTimedGround | undefined;
    const path: string = `$compiled[${JSON.stringify(actor)}].support`;
    let groundEvidence: Map<number, IScopedGaitGround> | undefined;
    if (scope !== undefined && admission !== undefined) {
      const last: number = scope.windowStarts[scope.windowStarts.length - 1]!;
      if (last > admission.duration) {
        admission.out.push(
          "range",
          path,
          "last support window must begin within the shot duration",
          last,
        );
        continue;
      }
      if (scope.at(0, translation) === undefined) prior = null;
      for (const plant of prior ?? []) {
        const floor: number | null | undefined = scope.at(0, plant.position);
        if (
          floor === null ||
          (floor !== undefined &&
            Math.abs(floor - plant.position.y) > STATIC_SUPPORT_HEIGHT_EPSILON)
        )
          admission.out.push(
            "range",
            path,
            `opening plant for ${plant.foot} must still lie on its admitted support`,
            plant.position,
          );
      }

      let failed: boolean = false;
      support = {
        boundaries: scope.boundaries.filter(
          (time: number): boolean =>
            motion !== undefined && time <= motion.duration,
        ),
        at: (
          time: number,
          point: IAutoMovieVector3,
          kind: "root" | "foot",
        ): number | null => {
          const world: IAutoMovieVector3 = toWorld(point);
          const height: number | null | undefined = scope.at(time, world);
          if (height === null && kind === "root" && !failed) {
            admission.out.push(
              "range",
              path,
              "sampled actor trajectory must lie on an eligible support footprint",
              { time, position: world },
            );
            failed = true;
          }
          if (
            gaitBearing &&
            height !== null &&
            height !== undefined &&
            motion !== undefined &&
            time <= motion.duration
          ) {
            const window: number = scope.indexAt(time);
            groundEvidence ??= new Map();
            let evidence: IScopedGaitGround | undefined =
              groundEvidence.get(window);
            if (evidence === undefined) {
              evidence = { low: Infinity, high: -Infinity };
              groundEvidence.set(window, evidence);
            }
            if (kind === "root") {
              const offset: number = world.y - height;
              evidence.low = Math.min(evidence.low, offset);
              evidence.high = Math.max(evidence.high, offset);
            } else evidence.foot ??= { time, position: world, height };
          }
          return height === null || height === undefined
            ? null
            : height - translation.y;
        },
      };

      // The compiled clip may end before the shot. A later support boundary
      // still applies to the actor's held terminal position.
      let terminalRoot: IAutoMovieVector3 | undefined;
      for (const time of scope.boundaries) {
        if (time > admission.duration) break;
        if (motion !== undefined && time <= motion.duration) continue;
        terminalRoot ??=
          motion === undefined
            ? { x: 0, y: 0, z: 0 }
            : (AutoMovieEngineMotionSampling.sampleMotion(motion, motion.duration).pose.root?.translation ?? {
                x: 0,
                y: 0,
                z: 0,
              });
        support.at(time, terminalRoot, "root");
      }
    }

    const rig: IAutoMovieSkeleton | null = eligible
      ? props.skeleton(actor)
      : null;
    if (motion === undefined) continue;
    if (rig === null) {
      if (support !== undefined)
        for (const time of sampleStanceTimes(
          motion.duration,
          undefined,
          support.boundaries,
        ))
          support.at(
            time,
            AutoMovieEngineMotionSampling.sampleMotion(motion, time).pose.root?.translation ?? {
              x: 0,
              y: 0,
              z: 0,
            },
            "root",
          );
      continue;
    }
    let modelGround: ((x: number, z: number) => number) | undefined;
    if (scope === undefined && worldGround !== undefined) {
      const ground: (x: number, z: number) => number = worldGround;
      modelGround = (x: number, z: number): number => {
        const plan: IAutoMovieVector3 = toWorld({ x, y: 0, z });
        return toModel({ x: plan.x, y: ground(plan.x, plan.z), z: plan.z }).y;
      };
    }
    const jointAxes:
      | Partial<Record<AutoMovieHumanoidBone, IAutoMovieJointAxes>>
      | undefined = props.jointAxes?.(actor);
    const restFrames:
      | Partial<Record<AutoMovieHumanoidBone, IAutoMovieRestFrame>>
      | undefined = props.restFrames?.(actor);
    const planted: IAutoMoviePlantedFeet = AutoMovieEngineMotionPlanting.plantStanceFeet({
      skeleton: rig,
      motion,
      jointAxes,
      restFrames,
      poseResolution: prepareSkeletonPoseResolution.run(rig, jointAxes, restFrames),
      groundY: modelGround,
      support,
      openingPlants: (prior ?? []).map(
        (
          plant: IAutoMovieBeatEndFootPlant,
        ): Pick<IAutoMovieFootPlant, "foot" | "position"> => ({
          foot: plant.foot,
          position: toModel(plant.position),
        }),
      ),
    });
    if (
      admission !== undefined &&
      scope !== undefined &&
      gait !== null &&
      gait !== undefined &&
      groundEvidence !== undefined
    )
      checkScopedGaitContacts({
        scope,
        period: gait.period,
        duration: motion.duration,
        plants: planted.plants,
        groundEvidence,
        out: admission.out,
        path,
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
}

/*
 * One measured foot above the ground available to its window.
 */
interface IScopedFoot {
  time: number;
  position: IAutoMovieVector3;
  height: number;
}

/*
 * Model-ground origin offsets and an eligible foot probe within one window.
 */
interface IScopedGaitGround {
  low: number;
  high: number;
  foot?: IScopedFoot;
}

/*
 * Check full-cycle windows for contact or a ground-aligned locomotion path. The
 * rig supplies ankle pivots, so an unpinned ankle alone cannot diagnose an
 * unsupported sole. In the reference gait the root moves the model's ground
 * plane (local Y=0 before articulation) and may bob around that plane.
 */
function checkScopedGaitContacts(props: {
  scope: IStageGround;
  period: number;
  duration: number;
  plants: readonly IAutoMovieFootPlant[];
  groundEvidence: ReadonlyMap<number, IScopedGaitGround>;
  out: IAutoMovieViolationAppendSink;
  path: string;
}): void {
  if (props.period <= 0) return;
  const { indexAt, windowStarts } = props.scope;
  const contacted: Set<number> = new Set();
  for (const plant of props.plants)
    for (
      let window: number = indexAt(plant.start);
      windowStarts[window] !== undefined && windowStarts[window]! <= plant.end;
      ++window
    )
      contacted.add(window);
  for (const [window, { low, high, foot }] of props.groundEvidence) {
    const end: number = Math.min(
      windowStarts[window + 1] ?? props.duration,
      props.duration,
    );
    if (
      end - windowStarts[window]! >= props.period &&
      foot !== undefined &&
      !contacted.has(window) &&
      (low > STATIC_SUPPORT_HEIGHT_EPSILON ||
        high < -STATIC_SUPPORT_HEIGHT_EPSILON)
    )
      props.out.push(
        "range",
        props.path,
        "the authored floor of a full gait cycle must meet its eligible support",
        { ...foot, rootOffset: { low, high } },
      );
  }
}
