import {
  IAutoMovieActionTarget,
  IAutoMovieClip,
  IAutoMovieCompiledFormation,
  IAutoMovieFormationMotion,
  IAutoMovieGroupTarget,
  IAutoMovieModel,
  IAutoMovieMotion,
  IAutoMovieQuaternion,
  IAutoMovieSceneNode,
  IAutoMovieSkeleton,
  IAutoMovieSubjectBox,
  IAutoMovieTrack,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { IAutoMovieFramedBox } from "./IAutoMovieFramedBox";
import { IAutoMovieFramedSubject } from "./IAutoMovieFramedSubject";
import { IPerformShotGateContext } from "./IPerformShotGateContext";
import { animatedBaseAt } from "./animatedBaseAt";
import { bakedTransformFromClipsAt } from "./bakedTransformFromClipsAt";
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
 * A group naming at least one member that resolves is measured as the box its
 * members occupy, not as a point with a figure's height: each staged node
 * contributes the box its model draws at its staged placement, and each named
 * formation its whole footprint under the cue playing at the instant. The box's
 * height falls back to {@link DEFAULT_SUBJECT_HEIGHT} below
 * {@link MIN_MEASURED_SUBJECT_HEIGHT}. Only a group carrying a formation cue can
 * be followed; any other group holds still.
 *
 * Any other subject resolves to one point, from the live resolver when it
 * answers and the staged placements otherwise, and is boxed through
 * {@link nodeSubjectBox} from the geometry its model draws, falling back to its
 * rig span and then the stand-in height. Its framed base keeps a constant offset
 * from that point, so a moving subject stays framed on the same part of itself.
 * It moves with a live bone resolver for a bone target, with its compiled clip
 * under its staged facing for a performer, with its effective object clip for a
 * driven prop, and otherwise holds still. A camera subject has no staged facing
 * and holds still.
 *
 * @param context The shot's staged tables.
 * @param props.models Compiler-owned models of the staged nodes, if any.
 * @param props.formationMotions The shot's compact formation cues.
 * @param props.motions The compiled actor clips by node id.
 * @param props.objectMotions Every object clip in producer order.
 * @param props.rotations Each staged node's world rotation, by id.
 * @returns A function from a gated subject to its framed subject.
 *
 * @evidence contracts/common.md#principled-implementation A subject is measured as the axis-aligned box of what it draws, carried out through its own placement, and reduced by `framedBoxOf` to the base, height and radius the solve fits both ways; a group is the union of its members' boxes, which is the region the frame must hold, where a centroid would lose the mass's width.
 * @evidence contracts/common.md#clear-and-simple-design The framing measurement of `performShot` in one factory, reusing the subject-box helpers the shot-contract grade reads, so the camera is solved for the box it is graded against.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Every subject kind follows a stated measurement and fallback order; no actor, prop or formation is special-cased, and the live resolver is not asked for a group because one point cannot describe a mass.
 * @evidence contracts/common.md#meaningful-documentation States when it is built and why then, that hero and coverage share it, how a group and a point subject are measured with their fallbacks, which subjects move and by what, and the meaning of each parameter.
 * @evidence contracts/performance.md#efficient-algorithms A model's rest extent is measured at most once per staged node however many takes frame it; each framed instant then costs one box placement per member and, for a moving subject, one clip sample.
 * @evidence contracts/performance.md#reuse-equivalent-work Measured model extents are memoized by node id for the life of the returned function, which is valid because the models and staged nodes are fixed for the shot; the staged node index is built once and shared by every subject.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The returned function retains the extent memo, bounded by the staged node count, and the shot's clip tables until `performShot` drops it at the end of the call.
 */
export function createPerformShotSubjectFramer (
  context: IPerformShotGateContext,
  props: {
    models: readonly IAutoMovieModel[] | undefined;
    formationMotions: readonly IAutoMovieFormationMotion[];
    motions: Readonly<Record<string, IAutoMovieMotion>>;
    objectMotions: readonly IAutoMovieClip[];
    rotations: ReadonlyMap<string, IAutoMovieQuaternion>;
  },
): ((on: IAutoMovieActionTarget) => IAutoMovieFramedSubject) {
  const stagedNodes: Map<string, IAutoMovieSceneNode> = new Map(
    context.staged.scene.nodes.map(
      (entry: IAutoMovieSceneNode): [string, IAutoMovieSceneNode] => [
        entry.id,
        entry,
      ],
    ),
  );
  const extents: Map<string, IAutoMovieSubjectBox | null> = new Map();
  /** A staged node's framed extent in model space, measured once. */
  function nodeExtent (node: string): IAutoMovieSubjectBox {
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
    return nodeSubjectExtent(extent, rig === null ? null : computeRestHeight(rig));
  }
  /** The staged rotation and scale of a node, at a supplied translation. */
  function placement (
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
  function groupBoxes (
    on: IAutoMovieGroupTarget,
    seconds: number,
  ): IAutoMovieSubjectBox[] { return [
    ...on.nodes.flatMap((node: string): IAutoMovieSubjectBox[] => {
      const at: IAutoMovieVector3 | undefined = context.nodePositions.get(node);
      return at === undefined
        ? []
        : [nodeSubjectBox(placement(node, at), nodeExtent(node))];
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
              member: formationMemberExtent(formation, props.models),
              seconds,
            }),
          ];
    }),
  ]; }

  return (on: IAutoMovieActionTarget): IAutoMovieFramedSubject => {
    if (on.kind === "group") {
      const group: IAutoMovieGroupTarget = on;
      const opening: IAutoMovieSubjectBox | null = unionSubjectBoxes(
        groupBoxes(on, 0),
      );
      // Which members resolve depends on the shot's tables, not the instant,
      // so a group that measured something at 0 measures something always.
      if (opening !== null) {
        function framedAt (seconds: number): IAutoMovieFramedBox { return framedBoxOf(unionSubjectBoxes(groupBoxes(group, seconds))!); }
        const framed: IAutoMovieFramedBox = framedBoxOf(opening);
        const cued: boolean = (on.formations ?? []).some((id: string): boolean =>
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
          at: cued
            ? (seconds: number): IAutoMovieVector3 => framedAt(seconds).base
            : null,
        };
      }
    }
    const point: IAutoMovieVector3 = resolvedPerformShotPoint(context, on);
    const node: string | null = on.kind === "node" ? on.node : null;
    const framed: IAutoMovieFramedBox = framedBoxOf(
      nodeSubjectBox(
        placement(node, point),
        node === null ? nodeSubjectExtent(null, null) : nodeExtent(node),
      ),
    );
    const shift: IAutoMovieVector3 = {
      x: framed.base.x - point.x,
      y: framed.base.y - point.y,
      z: framed.base.z - point.z,
    };
    const animated: ((seconds: number) => IAutoMovieVector3) | null =
      movementOf(context, props, on, node, point);
    return {
      base: framed.base,
      height: framed.height,
      radius: framed.radius,
      at:
        animated === null
          ? null
          : (seconds: number): IAutoMovieVector3 => {
              const value: IAutoMovieVector3 = animated(seconds);
              return {
                x: value.x + shift.x,
                y: value.y + shift.y,
                z: value.z + shift.z,
              };
            },
    };
  };
}

/** How a point subject moves over shot time, or null when it holds still. */
function movementOf (
  context: IPerformShotGateContext,
  props: {
    motions: Readonly<Record<string, IAutoMovieMotion>>;
    objectMotions: readonly IAutoMovieClip[];
    rotations: ReadonlyMap<string, IAutoMovieQuaternion>;
  },
  on: IAutoMovieActionTarget,
  node: string | null,
  point: IAutoMovieVector3,
): ((seconds: number) => IAutoMovieVector3) | null {
  const targetAt: IPerformShotGateContext["targetAt"] = context.targetAt;
  if (on.kind === "bone" && targetAt !== undefined)
    return (seconds: number): IAutoMovieVector3 =>
      targetAt(on, seconds) ?? point;
  if (node === null) return null;
  const motion: IAutoMovieMotion | undefined = props.motions[node];
  const facing: IAutoMovieQuaternion | undefined = props.rotations.get(node);
  if (motion !== undefined && facing !== undefined)
    return animatedBaseAt(point, facing, motion);
  const driven: boolean = props.objectMotions.some(
    (clip: IAutoMovieClip): boolean =>
      clip.tracks.some(
        (track: IAutoMovieTrack): boolean =>
          track.channel.kind === "node" &&
          track.channel.node === node &&
          track.channel.path === "translation",
      ),
  );
  if (!driven) return null;
  // Read after coupling, so a camera follows a launch into a hand.
  return (seconds: number): IAutoMovieVector3 =>
    bakedTransformFromClipsAt(props.objectMotions, node, seconds)
      ?.translation ?? point;
}
