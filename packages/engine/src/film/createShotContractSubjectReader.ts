import {
  IAutoMovieCompiledFormation,
  IAutoMovieModel,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieSceneNode,
  IAutoMovieShotPerformance,
  IAutoMovieShotSpatialSelector,
  IAutoMovieSkeleton,
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
  IAutoMovieVector3,
  IAutoMovieWorldLandmark,
} from "@automovie/interface";

import { sampleMotion } from "../motion/sampleMotion";
import { IAutoMovieSampledChannel } from "../resolve/IAutoMovieSampledChannel";
import { channelKey } from "../resolve/channelKey";
import { sampleClipSequence } from "../resolve/sampleClipSequence";
import { sampleFormationMotion } from "../sampleFormationMotion";
import { transformFormationPoint } from "../transformFormationPoint";
import { IRealizeShotContractProps } from "./IRealizeShotContractProps";
import { IShotContractSubjectReader } from "./IShotContractSubjectReader";
import { computeModelRestExtent } from "./computeModelRestExtent";
import { computeRestHeight } from "./computeRestHeight";
import { foldRoot } from "./foldRoot";
import { formationMemberExtent } from "./formationMemberExtent";
import { formationSubjectBox } from "./formationSubjectBox";
import { nodeSubjectBox } from "./nodeSubjectBox";
import { nodeSubjectExtent } from "./nodeSubjectExtent";

/** Rotation of a placement whose orientation is never read. */
const IDENTITY_ROTATION: IAutoMovieTransform["rotation"] = {
  x: 0,
  y: 0,
  z: 0,
  w: 1,
};

/** Scale of a placement whose size is never read, and of a pose root. */
const IDENTITY_SCALE: IAutoMovieVector3 = { x: 1, y: 1, z: 1 };

/**
 * Build the subject reader one {@link realizeShotContract} call grades
 * through.
 *
 * The compiled scene nodes, models, formations, shot performances, motions and
 * world landmarks are each indexed once by id, keeping the first record of a
 * repeated id. Three results are cached for the life of the reader because the
 * grade asks for them repeatedly with identical inputs: the object-motion
 * channels sampled at one shot-local second, shared by every node placed at
 * that second; a node subject's model-space extent, which walks its model's
 * rest geometry; and a formation's member extent.
 *
 * @param props The grading inputs; read, never mutated.
 * @returns A reader over `props` that holds its indexes and caches until the
 *   caller drops it.
 *
 * @evidence contracts/common.md#principled-implementation Placement composes the staged transform with the object-motion authority `sampleClipSequence` selects per channel, read by `channelKey` so the key cannot drift from the sampler's, and folds a rigged node's pose root through `foldRoot`, the matrix composition every other beat and review reader uses, with the root's scale held at identity as engine kinematics and the viewer treat it; a node's box is `nodeSubjectBox` over `nodeSubjectExtent`, the read `performShot` framed from, so the grade tests the subject the camera was solved for. The caches are sound because every cached value is a pure function of the cache key and of `props`, which the reader never mutates.
 * @evidence contracts/common.md#clear-and-simple-design One factory owns the indexes, the caches and the placement rules, so the graders in `realizeShotContract` and `evaluateShotPredicate` receive one reader and hold no lookups of their own.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No node, model, formation or landmark is special-cased; first-record indexing answers what a first-match `find` would, and an unresolvable reference throws for the grade to fail rather than being replaced by a default placement.
 * @evidence contracts/common.md#meaningful-documentation States what is indexed and the duplicate rule, what is cached and why each cache is valid, the ownership of `props`, and the reader's lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Building the indexes is linear in nodes, models, formations, performances, motions and landmarks; afterwards every id lookup is a constant-time map read instead of a scan per predicate, subject and instant. The dominant per-query cost is sampling: one `sampleClipSequence` over every object-motion track per distinct instant, one `sampleMotion` per pose read, and one rest-geometry walk per distinct node subject.
 * @evidence contracts/performance.md#reuse-equivalent-work Shares the object-motion sample across every node placed at the same shot-local second, keyed by that exact second, and the node and member extents across every camera sample, keyed by subject or formation id; each cached value depends only on its key and on the immutable `props`, so no invalidation is needed within the reader's single call.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The reader owns six index maps, sized by the compiled artifacts, and three caches grown by distinct grading instants, distinct required node subjects and distinct formation subjects, all named by the contract; nothing else is retained, and everything is released when `realizeShotContract` returns and drops the reader.
 */
export const createShotContractSubjectReader = (
  props: IRealizeShotContractProps,
): IShotContractSubjectReader => {
  const compiled: IRealizeShotContractProps["compiled"] = props.compiled;
  const nodes: ReadonlyMap<string, IAutoMovieSceneNode> = indexFirst(
    compiled.scene.nodes,
    (node: IAutoMovieSceneNode): string => node.id,
  );
  const models: ReadonlyMap<string, IAutoMovieModel> = indexFirst(
    compiled.models ?? [],
    (model: IAutoMovieModel): string => model.id,
  );
  const formations: ReadonlyMap<string, IAutoMovieCompiledFormation> =
    indexFirst(
      compiled.formations ?? [],
      (formation: IAutoMovieCompiledFormation): string => formation.id,
    );
  const performances: ReadonlyMap<string, IAutoMovieShotPerformance> =
    indexFirst(
      compiled.shot.performances,
      (performance: IAutoMovieShotPerformance): string => performance.node,
    );
  const motions: ReadonlyMap<string, IAutoMovieMotion> = indexFirst(
    compiled.motions,
    (motion: IAutoMovieMotion): string => motion.id,
  );
  const landmarks: ReadonlyMap<string, IAutoMovieWorldLandmark> = indexFirst(
    props.world?.landmarks ?? [],
    (landmark: IAutoMovieWorldLandmark): string => landmark.id,
  );

  const objectChannels: Map<
    number,
    Map<string, IAutoMovieSampledChannel>
  > = new Map();
  const objectChannelsAt = (
    time: number,
  ): Map<string, IAutoMovieSampledChannel> => {
    const cached: Map<string, IAutoMovieSampledChannel> | undefined =
      objectChannels.get(time);
    if (cached !== undefined) return cached;
    const sampled: Map<string, IAutoMovieSampledChannel> = sampleClipSequence(
      compiled.shot.objectMotions,
      time,
    );
    objectChannels.set(time, sampled);
    return sampled;
  };

  const skeleton = (node: IAutoMovieSceneNode): IAutoMovieSkeleton | null => {
    const model: IAutoMovieModel | undefined = models.get(node.model);
    return model === undefined
      ? (props.skeleton?.(node.id) ?? null)
      : model.skeleton;
  };

  const poseAt = (node: IAutoMovieSceneNode, time: number): IAutoMoviePose => {
    const performance: IAutoMovieShotPerformance | undefined =
      performances.get(node.id);
    const rig: IAutoMovieSkeleton | null = skeleton(node);
    if (rig === null) throw new Error(`node "${node.id}" has no skeleton`);
    const motionId: string | null =
      performance === undefined ? node.motion : performance.motion;
    if (motionId === null)
      return node.pose ?? { skeleton: rig.id, root: null, joints: [] };
    const motion: IAutoMovieMotion | undefined = motions.get(motionId);
    if (motion === undefined) throw new Error(`motion "${motionId}" is absent`);
    return sampleMotion(
      motion,
      performance === undefined
        ? time
        : Math.max(0, time - performance.startOffset),
    ).pose;
  };

  const transformAt = (actor: string, time: number): IAutoMovieTransform => {
    const node: IAutoMovieSceneNode | undefined = nodes.get(actor);
    if (node === undefined) throw new Error(`node "${actor}" is absent`);
    const pose: IAutoMoviePose | null =
      skeleton(node) === null ? null : poseAt(node, time);
    const sampled: Map<string, IAutoMovieSampledChannel> =
      objectChannelsAt(time);
    const channel = (
      path: "translation" | "rotation" | "scale",
    ): number[] | undefined =>
      sampled.get(channelKey({ kind: "node", node: actor, path }))?.value;
    const translation: number[] | undefined = channel("translation");
    const rotation: number[] | undefined = channel("rotation");
    const scale: number[] | undefined = channel("scale");
    const placed: IAutoMovieTransform = {
      translation:
        translation === undefined
          ? node.transform.translation
          : { x: translation[0]!, y: translation[1]!, z: translation[2]! },
      rotation:
        rotation === undefined
          ? node.transform.rotation
          : {
              x: rotation[0]!,
              y: rotation[1]!,
              z: rotation[2]!,
              w: rotation[3]!,
            },
      scale:
        scale === undefined
          ? node.transform.scale
          : { x: scale[0]!, y: scale[1]!, z: scale[2]! },
    };
    return pose === null || pose.root === null
      ? placed
      : foldRoot(placed, { ...pose.root, scale: IDENTITY_SCALE });
  };

  const spatialAt = (
    selector: IAutoMovieShotSpatialSelector,
    time: number,
  ): IAutoMovieVector3 => {
    if (selector.kind === "point") return selector.position;
    if (selector.kind === "landmark") {
      const landmark: IAutoMovieWorldLandmark | undefined = landmarks.get(
        selector.id,
      );
      if (landmark === undefined)
        throw new Error(`landmark "${selector.id}" is absent`);
      return landmark.position;
    }
    if (selector.kind === "node") return transformAt(selector.id, time).translation;
    const formation: IAutoMovieCompiledFormation | undefined = formations.get(
      selector.id,
    );
    if (formation === undefined)
      throw new Error(`formation "${selector.id}" has no slots`);
    return transformFormationPoint(
      formation.centroid,
      formation.anchor,
      sampleFormationMotion(
        compiled.formationMotions ?? [],
        formation.id,
        time,
      ),
      formation.facingDeg,
    );
  };

  const nodeExtents: Map<string, IAutoMovieSubjectBox> = new Map();
  const nodeExtent = (subject: string): IAutoMovieSubjectBox => {
    const cached: IAutoMovieSubjectBox | undefined = nodeExtents.get(subject);
    if (cached !== undefined) return cached;
    const node: IAutoMovieSceneNode | undefined = nodes.get(subject);
    const model: IAutoMovieModel | undefined =
      node === undefined ? undefined : models.get(node.model);
    const rig: IAutoMovieSkeleton | null =
      node === undefined ? null : skeleton(node);
    // A rig span and the stand-in height are both measured from the
    // placement itself: neither states a floor or a width, so neither may
    // invent one.
    const extent: IAutoMovieSubjectBox = nodeSubjectExtent(
      model === undefined ? null : computeModelRestExtent(model),
      rig === null ? null : computeRestHeight(rig),
    );
    nodeExtents.set(subject, extent);
    return extent;
  };

  const memberExtents: Map<string, { min: number; max: number }> = new Map();
  const memberExtent = (
    formation: IAutoMovieCompiledFormation,
  ): { min: number; max: number } => {
    const cached: { min: number; max: number } | undefined = memberExtents.get(
      formation.id,
    );
    if (cached !== undefined) return cached;
    const extent: { min: number; max: number } = formationMemberExtent(
      formation,
      compiled.models,
    );
    memberExtents.set(formation.id, extent);
    return extent;
  };

  return {
    node: (id: string): IAutoMovieSceneNode | undefined => nodes.get(id),
    formation: (id: string): IAutoMovieCompiledFormation | undefined =>
      formations.get(id),
    performance: (node: string): IAutoMovieShotPerformance | undefined =>
      performances.get(node),
    skeleton,
    poseAt,
    spatialAt,
    placementAt: (subject: string, time: number): IAutoMovieTransform =>
      props.formations.has(subject)
        ? {
            translation: spatialAt({ kind: "formation", id: subject }, time),
            rotation: IDENTITY_ROTATION,
            scale: IDENTITY_SCALE,
          }
        : transformAt(subject, time),
    subjectBox: (
      subject: string,
      placement: IAutoMovieTransform,
      time: number,
    ): IAutoMovieSubjectBox => {
      const formation: IAutoMovieCompiledFormation | undefined =
        props.formations.has(subject) ? formations.get(subject) : undefined;
      return formation === undefined
        ? nodeSubjectBox(placement, nodeExtent(subject))
        : formationSubjectBox({
            formation,
            motions: compiled.formationMotions ?? [],
            member: memberExtent(formation),
            seconds: time,
          });
    },
  };
};

/** Index records by key, keeping the first record of a repeated key. */
const indexFirst = <T>(
  records: readonly T[],
  key: (record: T) => string,
): Map<string, T> => {
  const index: Map<string, T> = new Map();
  for (const record of records) {
    const id: string = key(record);
    if (index.has(id) === false) index.set(id, record);
  }
  return index;
};
