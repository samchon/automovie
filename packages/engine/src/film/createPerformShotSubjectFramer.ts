import {
  IAutoMovieActionTarget,
  IAutoMovieCompiledFormation,
  type IAutoMovieCreatePerformShotSubjectFramer,
  type IAutoMovieEnginePerformShotGateContext,
  IAutoMovieFormationMotion,
  type IAutoMovieFramedBox,
  type IAutoMovieFramedSubject,
  IAutoMovieGroupTarget,
  IAutoMovieModel,
  IAutoMovieMotion,
  IAutoMovieQuaternion,
  type IAutoMovieSampledChannel,
  IAutoMovieSceneNode,
  IAutoMovieSkeleton,
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { sampleClipSequence } from "../resolve/sampleClipSequence";
import { animatedBaseAt } from "./animatedBaseAt";
import { bakedTransformFromChannels } from "./bakedTransformFromChannels";
import { computeModelRestExtent } from "./computeModelRestExtent";
import { computeRestHeight } from "./computeRestHeight";
import { DEFAULT_SUBJECT_HEIGHT } from "./constants/DEFAULT_SUBJECT_HEIGHT";
import { MIN_MEASURED_SUBJECT_HEIGHT } from "./constants/MIN_MEASURED_SUBJECT_HEIGHT";
import { formationMemberExtent } from "./formationMemberExtent";
import { formationSubjectBox } from "./formationSubjectBox";
import { framedBoxOf } from "./framedBoxOf";
import { nodeSubjectBox } from "./nodeSubjectBox";
import { nodeSubjectExtent } from "./nodeSubjectExtent";
import { resolvedPerformShotPoint } from "./resolvedPerformShotPoint";
import { unionSubjectBoxes } from "./unionSubjectBoxes";

/**
 * Build the function that turns a gated camera subject into the framed subject
 * the camera grammar solves from.
 *
 * Called once the performance, couplings and object clips are final, so a
 * `follow` can track a walking actor, a launched prop or a handoff. The hero's
 * frame moves and every coverage angle read subjects through the same function,
 * so an alternate camera frames the beat's subject exactly as the hero does.
 *
 * A group is measured as the union of its resolved members' portable part/proxy
 * boxes, with node placements from baked world transforms or actor translations
 * and formation footprints from their cues. Height and radius are fixed from
 * the union at the camera move's start. A moving group's follow or truck
 * updates the base while retaining that fit. Below MIN_MEASURED_SUBJECT_HEIGHT,
 * height takes DEFAULT_SUBJECT_HEIGHT.
 *
 * Any other subject resolves to one point, from the live resolver when it
 * answers and the staged placements otherwise, and is boxed through
 * {@link nodeSubjectBox} from the geometry its model draws, falling back to its
 * rig span and then the stand-in height. A baked node's framed base follows its
 * full world frame. An actor translation or live bone target moves with the
 * fixed offset of its staged subject box. A camera subject holds still.
 *
 * @param context The shot's staged tables.
 * @param props.models Compiler-owned models of the staged nodes, if any.
 * @param props.formationMotions The shot's compact formation cues.
 * @param props.motions The compiled actor clips by node id.
 * @param props.objectMotions Every object clip in producer order.
 * @param props.rotations Each staged node's world rotation, by id.
 * @returns A function from a gated subject and optional move start in
 *   shot-local seconds to its framed subject. The start defaults to zero.
 */
export function createPerformShotSubjectFramer(
  context: IAutoMovieEnginePerformShotGateContext,
  props: IAutoMovieCreatePerformShotSubjectFramer.IProps,
): (on: IAutoMovieActionTarget, start?: number) => IAutoMovieFramedSubject {
  const stagedNodes: Map<string, IAutoMovieSceneNode> = new Map(
    context.staged.scene.nodes.map(
      (entry: IAutoMovieSceneNode): [string, IAutoMovieSceneNode] => [
        entry.id,
        entry,
      ],
    ),
  );
  const extents: Map<string, IAutoMovieSubjectBox | null> = new Map();
  const memberExtents: Map<
    IAutoMovieCompiledFormation,
    { min: number; max: number }
  > = new Map();
  const drivenNodes: Set<string> = new Set();
  for (const clip of props.objectMotions)
    for (const track of clip.tracks)
      if (track.channel.kind === "node" && track.channel.path === "translation")
        drivenNodes.add(track.channel.node);
  let sample:
    | {
        seconds: number;
        channels: ReadonlyMap<string, IAutoMovieSampledChannel>;
      }
    | undefined;
  /**
   * Share the playback authority and sampled key values across subjects at the
   * current instant.
   */
  function bakedPlacement(
    node: string,
    seconds: number,
  ): IAutoMovieTransform | null {
    if (!drivenNodes.has(node)) return null;
    if (sample === undefined || sample.seconds !== seconds)
      sample = {
        seconds,
        channels: sampleClipSequence(props.objectMotions, seconds),
      };
    return bakedTransformFromChannels(sample.channels, node);
  }
  /** Reuse one immutable shot formation's portable member measurement. */
  function memberExtent(formation: IAutoMovieCompiledFormation): {
    min: number;
    max: number;
  } {
    let extent: { min: number; max: number } | undefined =
      memberExtents.get(formation);
    if (extent === undefined) {
      extent = formationMemberExtent(formation, props.models);
      memberExtents.set(formation, extent);
    }
    return extent;
  }
  /**
   * A node's model-space extent, reusing its model measurement and querying the
   * rig fallback when that measurement is absent.
   */
  function nodeExtent(node: string): IAutoMovieSubjectBox {
    let extent: IAutoMovieSubjectBox | null | undefined = extents.get(node);
    if (extent === undefined) {
      const staffed: IAutoMovieSceneNode | undefined = stagedNodes.get(node);
      const model: IAutoMovieModel | undefined =
        staffed === undefined
          ? undefined
          : (props.models ?? []).find(
              (entry: IAutoMovieModel): boolean => entry.id === staffed.model,
            );
      extent = model === undefined ? null : computeModelRestExtent(model);
      extents.set(node, extent);
    }
    const rig: IAutoMovieSkeleton | null =
      extent === null ? context.skeleton(node) : null;
    return nodeSubjectExtent(
      extent,
      rig === null ? null : computeRestHeight(rig),
    );
  }
  /** The staged rotation and scale of a node, at a supplied translation. */
  function placement(
    node: string | null,
    translation: IAutoMovieVector3,
  ): IAutoMovieTransform {
    const staffed: IAutoMovieSceneNode | undefined =
      node === null ? undefined : stagedNodes.get(node);
    return {
      translation,
      rotation: staffed?.transform.rotation ?? { x: 0, y: 0, z: 0, w: 1 },
      scale: staffed?.transform.scale ?? { x: 1, y: 1, z: 1 },
    };
  }
  /** One box per group member that resolves, at a shot-local instant. */
  function groupBoxes(
    on: IAutoMovieGroupTarget,
    seconds: number,
    movements: ReadonlyMap<string, (seconds: number) => IAutoMovieVector3>,
  ): IAutoMovieSubjectBox[] {
    return [
      ...on.nodes.flatMap((node: string): IAutoMovieSubjectBox[] => {
        const point: IAutoMovieVector3 | undefined =
          context.nodePositions.get(node);
        if (point === undefined) return [];
        const transform: IAutoMovieTransform =
          bakedPlacement(node, seconds) ??
          placement(node, movements.get(node)?.(seconds) ?? point);
        return [nodeSubjectBox(transform, nodeExtent(node))];
      }),
      ...(on.formations ?? []).flatMap((id: string): IAutoMovieSubjectBox[] => {
        const formation: IAutoMovieCompiledFormation | undefined =
          context.formationById.get(id);
        return formation === undefined
          ? []
          : [
              formationSubjectBox({
                formation,
                motions: props.formationMotions,
                member: memberExtent(formation),
                seconds,
              }),
            ];
      }),
    ];
  }

  return (
    on: IAutoMovieActionTarget,
    start: number = 0,
  ): IAutoMovieFramedSubject => {
    if (on.kind === "group") {
      const group: IAutoMovieGroupTarget = on;
      const movements: Map<string, (seconds: number) => IAutoMovieVector3> =
        new Map();
      for (const node of group.nodes) {
        const point: IAutoMovieVector3 | undefined =
          context.nodePositions.get(node);
        if (point === undefined) continue;
        const at: ((seconds: number) => IAutoMovieVector3) | null =
          actorMovementOf(props, node, point);
        if (at !== null) movements.set(node, at);
      }
      const opening: IAutoMovieSubjectBox | null = unionSubjectBoxes(
        groupBoxes(group, start, movements),
      );
      // Resolution depends on staged identities, which stay fixed across samples.
      if (opening !== null) {
        function framedAt(seconds: number): IAutoMovieFramedBox {
          return framedBoxOf(
            unionSubjectBoxes(groupBoxes(group, seconds, movements))!,
          );
        }
        const framed: IAutoMovieFramedBox = framedBoxOf(opening);
        const moving: boolean =
          movements.size > 0 ||
          group.nodes.some((node: string): boolean => drivenNodes.has(node)) ||
          (group.formations ?? []).some((id: string): boolean =>
            props.formationMotions.some(
              (cue: IAutoMovieFormationMotion): boolean => cue.formation === id,
            ),
          );
        return {
          base: framed.base,
          height:
            framed.height >= MIN_MEASURED_SUBJECT_HEIGHT
              ? framed.height
              : DEFAULT_SUBJECT_HEIGHT,
          radius: framed.radius,
          at: moving
            ? (seconds: number): IAutoMovieVector3 => framedAt(seconds).base
            : null,
        };
      }
    }
    const point: IAutoMovieVector3 = resolvedPerformShotPoint(context, on);
    const node: string | null = on.kind === "node" ? on.node : null;
    const extent: IAutoMovieSubjectBox =
      node === null ? nodeSubjectExtent(null, null) : nodeExtent(node);
    const actorAt: ((seconds: number) => IAutoMovieVector3) | null =
      node === null ? null : actorMovementOf(props, node, point);
    if (node !== null && drivenNodes.has(node)) {
      const frameAt = (seconds: number): IAutoMovieFramedBox =>
        framedBoxOf(
          nodeSubjectBox(
            bakedPlacement(node, seconds) ??
              placement(node, actorAt?.(seconds) ?? point),
            extent,
          ),
        );
      return {
        ...frameAt(start),
        at: (seconds: number): IAutoMovieVector3 => frameAt(seconds).base,
      };
    }
    const framed: IAutoMovieFramedBox = framedBoxOf(
      nodeSubjectBox(placement(node, point), extent),
    );
    const shift: IAutoMovieVector3 = {
      x: framed.base.x - point.x,
      y: framed.base.y - point.y,
      z: framed.base.z - point.z,
    };
    const targetAt: IAutoMovieEnginePerformShotGateContext["targetAt"] =
      context.targetAt;
    const animated: ((seconds: number) => IAutoMovieVector3) | null =
      on.kind === "bone" && targetAt !== undefined
        ? (seconds: number): IAutoMovieVector3 => targetAt(on, seconds) ?? point
        : actorAt;
    const at: ((seconds: number) => IAutoMovieVector3) | null =
      animated === null
        ? null
        : (seconds: number): IAutoMovieVector3 => {
            const value: IAutoMovieVector3 = animated(seconds);
            return {
              x: value.x + shift.x,
              y: value.y + shift.y,
              z: value.z + shift.z,
            };
          };
    return {
      base: at?.(start) ?? framed.base,
      height: framed.height,
      radius: framed.radius,
      at,
    };
  };
}

/**
 * Read the actor clip under the staged facing, or null when neither drives
 * actor translation.
 */
function actorMovementOf(
  props: {
    motions: Readonly<Record<string, IAutoMovieMotion>>;
    rotations: ReadonlyMap<string, IAutoMovieQuaternion>;
  },
  node: string,
  point: IAutoMovieVector3,
): ((seconds: number) => IAutoMovieVector3) | null {
  const motion: IAutoMovieMotion | undefined = props.motions[node];
  const facing: IAutoMovieQuaternion | undefined = props.rotations.get(node);
  return motion !== undefined && facing !== undefined
    ? animatedBaseAt(point, facing, motion)
    : null;
}
