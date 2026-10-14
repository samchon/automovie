import { IAutoMovieGrammarShotObservation, IAutoMovieGrammarSubjectObservation, computeModelRestExtent, computeRestHeight, foldRoot, framedBoxOf, nodeSubjectBox, nodeSubjectExtent, resolveCameraAt, sampleMotion, type IAutoMovieFramedBox } from "@automovie/engine";
import type { IAutoMovieCompiledShotSource, IAutoMovieSceneNode, IAutoMovieShotContract, IAutoMovieTransform, IAutoMovieCamera, IAutoMovieModel, IAutoMovieMotion, IAutoMovieShotPerformance, IAutoMovieSkeleton, IAutoMovieSubjectBox, IAutoMovieVector3 } from "@automovie/interface";
import type { filmGrammarSegment } from "./filmGrammarSegment";
import { filmGrammarDeclaredFraming } from "./filmGrammarDeclaredFraming";

/**
 * Observe one placed shot at its source-in frame and last displayed frame, returning null when its selected staged camera is absent. Required scene nodes use rest geometry and translated staged boxes; formation-only ids are skipped.
 *
 * @evidence contracts/common.md#principled-implementation Frame bounds divide by production fps, with exclusive source-out sampled one frame earlier. Shared model rest extent, rig-height fallback and subject-box reducers supply the box, while performance root sampling contributes translation with startOffset and camera sampling uses the engine resolver.
 * @evidence contracts/common.md#clear-and-simple-design Local exact-id indices connect compiled records once, boundary helpers read the same staged data, and the resulting observation is passed to the engine grammar analyzer rather than rendered.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Rest extent and staged rotation/scale are retained at both boundaries; joint deformation and sampled root rotation/scale do not reshape the box here. Missing models use the shared rig/stand-in fallback, eyeline remains null, and input clock/shape validity is an upstream premise.
 * @evidence contracts/common.md#meaningful-documentation States seconds/metres, exclusive last-frame sampling, borrowed compiled data, missing-camera/null result, unstaged-subject omission and the rest-box/translation-only limitations.
 * @evidence contracts/performance.md#efficient-algorithms Maps scan compiled motions, performances, models and nodes once. Each required subject measures its model vertices/rest rig, then samples motion at two instants and reduces two boxes; camera tracks are sampled twice. Repeated model use remeasures extent because this owner has no model memo.
 * @evidence contracts/performance.md#reuse-equivalent-work One extent per required subject serves its opening and closing boxes, and local maps serve all subjects. Opening/closing sample results are not shared with other placements or builds because trim, motion and source data can differ.
 * @evidence contracts/performance.md#bound-retention-and-release-resources All maps, tessellation and sampled channels are call-local; the returned camera/subject observation can borrow unchanged staged components under caller ownership. No render resource, file, task or retained observation cache is acquired.
 */
export const filmGrammarObserveSegment: (props: {
    /** Current frame-normalized placement with exclusive source-out. */
    segment: filmGrammarSegment;

    /** Required subject order and declared style intents for this shot. */
    contract: IAutoMovieShotContract;

    /** Borrowed compiled scene, rest models and performed motion samples. */
    compiled: IAutoMovieCompiledShotSource;

    /** Finite positive production frames per second, admitted upstream. */
    fps: number;

    /** Positive delivery width divided by height, admitted upstream. */
    aspect: number;
}) => IAutoMovieGrammarShotObservation | null = (props: {
  /** Current frame-normalized placement with exclusive source-out. */
  segment: filmGrammarSegment;

  /** Required subject order and declared style intents for this shot. */
  contract: IAutoMovieShotContract;

  /** Borrowed compiled scene, rest models and performed motion samples. */
  compiled: IAutoMovieCompiledShotSource;

  /** Finite positive production frames per second, admitted upstream. */
  fps: number;

  /** Positive delivery width divided by height, admitted upstream. */
  aspect: number;
}): IAutoMovieGrammarShotObservation | null => {
  const { compiled, segment }: typeof props = props;
  const camera: IAutoMovieCamera | undefined = compiled.scene.cameras.find(
    (candidate: IAutoMovieCamera) : boolean => candidate.id === compiled.shot.camera,
  );
  if (camera === undefined) return null;
  const start: number = segment.sourceInFrame / props.fps;
  // The last frame the edit SHOWS. `sourceOutFrame` is exclusive, so sampling
  // it would measure the closing boundary from a frame the trim removed.
  const end: number = (segment.sourceOutFrame - 1) / props.fps;
  const duration: number = (segment.sourceOutFrame - segment.sourceInFrame) / props.fps;
  const motionById: Map<string, IAutoMovieMotion> = new Map(compiled.motions.map((clip: IAutoMovieMotion) : [string, IAutoMovieMotion] => [clip.id, clip]));
  const performanceByNode: Map<string, IAutoMovieShotPerformance> = new Map(
    compiled.shot.performances.map((performance: IAutoMovieShotPerformance) : [string, IAutoMovieShotPerformance] => [
      performance.node,
      performance,
    ]),
  );
  const modelById: Map<string, IAutoMovieModel> = new Map(compiled.models.map((model: IAutoMovieModel) : [string, IAutoMovieModel] => [model.id, model]));
  const nodeById: Map<string, IAutoMovieSceneNode> = new Map(compiled.scene.nodes.map((node: IAutoMovieSceneNode) : [string, IAutoMovieSceneNode] => [node.id, node]));
  // Where a staged node stands at one shot-local second: the engine's own
  // answer to "where in the world is this subject", startOffset-aware exactly
  // as the visual-read pass is, carrying the node's own rotation and scale
  // because the box measured below is carried out through this placement — the
  // same pair `performShot` frames a node subject from.
  const placementAt: (node: IAutoMovieSceneNode, seconds: number) => IAutoMovieTransform = (
    node: IAutoMovieSceneNode,
    seconds: number,
  ): IAutoMovieTransform => {
    const performance: IAutoMovieShotPerformance | undefined = performanceByNode.get(node.id);
    const clip: IAutoMovieMotion | undefined = motionById.get(performance?.motion ?? "");
    return {
      ...node.transform,
      translation:
        clip === undefined
          ? node.transform.translation
          : foldRoot(
              node.transform,
              sampleMotion(
                clip,
                Math.max(0, seconds - performance!.startOffset),
              ).pose.root,
            ).translation,
    };
  };
  const subjects: IAutoMovieGrammarSubjectObservation[] = props.contract.camera.requiredSubjects.flatMap(
    (id: string): IAutoMovieGrammarSubjectObservation[] => {
      const node: IAutoMovieSceneNode | undefined = nodeById.get(id);
      // A required subject naming a formation or an unstaged id is not a scene
      // node with a placement and a box, so it contributes no geometry here.
      if (node === undefined) return [];
      const model: IAutoMovieModel | undefined = modelById.get(node.model);
      const drawn: { min: IAutoMovieVector3; max: IAutoMovieVector3; } | null = model === undefined ? null : computeModelRestExtent(model);
      // The one definition the framing solve and the contract grade already
      // share: the drawn box when the model draws something, the rig span as
      // its documented fallback, and the stand-in height when neither measures
      // anything. Reading it here is what keeps the edit's account of a subject
      // the same as the account the camera was solved against — a canopy deck
      // authored 8 m above its element origin is observed 8 m up rather than on
      // the ground, and a 60 m facade authored outward from that origin is
      // observed about its own middle rather than at one end.
      const rig: IAutoMovieSkeleton | null = drawn === null ? (model?.skeleton ?? null) : null;
      const extent: IAutoMovieSubjectBox = nodeSubjectExtent(
        drawn,
        rig === null ? null : computeRestHeight(rig),
      );
      // A node's placement changes over the shot, its box does not: the model
      // is measured at rest and the rotation and scale it is carried through
      // are the staged ones, so the span and the radius are read once and only
      // the standing point moves.
      const at: (seconds: number) => IAutoMovieFramedBox = (seconds: number) : IAutoMovieFramedBox =>
        framedBoxOf(nodeSubjectBox(placementAt(node, seconds), extent));
      const opening: IAutoMovieFramedBox = at(start);
      return [
        {
          id,
          start: opening.base,
          end: at(end).base,
          height: opening.height,
          radius: opening.radius,
          eyeline: null,
        },
      ];
    },
  );
  const cameraAt: (seconds: number) => IAutoMovieGrammarShotObservation["camera"]["start"] = (
    seconds: number,
  ): IAutoMovieGrammarShotObservation["camera"]["start"] => ({
    ...resolveCameraAt(
      camera.transform,
      compiled.shot.cameraMotion,
      camera.id,
      seconds,
    ),
    fovY: camera.fovY,
    aspect: props.aspect,
  });
  // The line of action is the first two subjects the contract requires
  // readable, in the order it requires them: a shot states which subjects its
  // camera must hold, and the pair among them the audience reads a left-right
  // geography from is the pair it named first. The analyzer normalizes the
  // endpoints by id, so two shots naming the same pair in either order share
  // one axis.
  const actionAxis: readonly [string, string] | null =
    subjects.length < 2 ? null : [subjects[0]!.id, subjects[1]!.id];
  return {
    id: segment.shot,
    duration,
    camera: { start: cameraAt(start), end: cameraAt(end) },
    subjects,
    primarySubject: subjects.length === 0 ? null : subjects[0]!.id,
    declaredShotSize: filmGrammarDeclaredFraming(
      compiled.shot.cameraIntent ?? [],
      start,
      end,
    ),
    actionAxis,
    styleIntent: props.contract.styleIntent,
  };
};
