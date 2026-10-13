import {
  IAutoMovieCamera,
  IAutoMovieInteractionEvent,
  IAutoMovieMotion,
  IAutoMovieReviewNote,
  IAutoMovieScene,
  IAutoMovieSceneNode,
  IAutoMovieShot,
  IAutoMovieShotPerformance,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { roundToThousandths } from "../math/roundToThousandths";
import { sampleMotion } from "../motion/sampleMotion";
import { sampleTimes } from "../motion/sampleTimes";
import { IAutoMovieGrammarDiagnostic } from "./IAutoMovieGrammarDiagnostic";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";
import { foldRoot } from "./foldRoot";
import { grammarDiagnosticsToReviewNotes } from "./grammarDiagnosticsToReviewNotes";
import { projectToNdc } from "./projectToNdc";
import { resolveCameraAt } from "./resolveCameraAt";

/** Assumed render aspect (width / height); the scene camera carries none. */
const DEFAULT_ASPECT: number = 16 / 9;

/** Default visual-read sampling rate, in samples per second. */
const DEFAULT_SAMPLE_RATE: number = 12;

/** Default body radius, in metres, a contact point must land within. */
const DEFAULT_CONTACT_RADIUS: number = 1.0;

/** Default silhouette half-width, in metres, a torso-sized radius. */
const DEFAULT_SILHOUETTE_RADIUS: number = 0.35;

/**
 * Engine-computed visual-read metrics for one compiled shot, filed as advisory
 * `tier: "visual"` review notes after any film-grammar findings passed in.
 * They never fail a gate; they give the review backlog measurable facts about
 * whether the action reads.
 *
 * Every metric reads a performer's world root: its performance's motion
 * sampled at `max(0, t - startOffset)` and folded through its staged node. A
 * performance whose node or motion is missing, or that plays no motion, is
 * skipped.
 *
 * - **Subject in frame**: sampled at `sampleRate` from 0 to the shot's end, a
 *   performer whose root leaves the live camera's frustum, behind the near
 *   plane, past the far plane, or outside the vertical field of view and the
 *   `aspect`-derived horizontal one, gets one note at the first such time.
 * - **Silhouette separation**: at the same times, two performers whose angular
 *   separation from the camera is smaller than the sum of their angular radii,
 *   `atan(silhouetteRadius / distance)` each, get one note at the first such
 *   time; a pair with either root nearer than the near plane at that time is
 *   left to the framing metric.
 * - **Contact connection**: a `hit` or `contact` event with a point and a
 *   target whose performer's root lies farther than `contactRadius` from the
 *   point at the event time gets one note.
 *
 * The first two metrics need a live camera with a finite field of view in
 * `(0, 180)` degrees and `far > near`; without one they are skipped. A root is
 * a point, so a subject whose body is in frame while its root is not is
 * reported; that approximation holds for all three metrics.
 *
 * @param props The shot, its scene and motions, the metric parameters, and
 *   the grammar findings to file first.
 * @returns The grammar notes followed by the visual-read notes.
 *
 * @evidence contracts/common.md#principled-implementation Measures with the engine's own sampling and projection, `sampleMotion` folded through `foldRoot` for roots, `resolveCameraAt` for the camera and `projectToNdc` for the frustum, on a fixed `sampleTimes` grid, so a note describes the frames the renderer draws; angular separation is the arccosine of the clamped normalized dot product, and the stated limitation is the root-point subject.
 * @evidence contracts/common.md#clear-and-simple-design One reader computes the camera and every performer root once per sample time and the three metrics read those tables; the grammar findings are filed by `grammarDiagnosticsToReviewNotes`, which owns their wording.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No actor, camera or event is special-cased; the thresholds are documented parameters with stated defaults, and a degenerate camera skips the camera metrics instead of producing notes from undefined projections.
 * @evidence contracts/common.md#meaningful-documentation States what each metric measures, when it fires and at which time, which performances are skipped, the camera precondition, the root-point limitation, the defaults and units, and the order of the returned notes.
 * @evidence contracts/performance.md#efficient-algorithms T = ceil(duration · rate) + 1 sample times; the camera is resolved T times and each of P performers sampled T times, O(P · T) motion samples, then the pair metric is O(P² · T) vector arithmetic over those tables; the contact metric is O(E) with constant-time lookups.
 * @evidence contracts/performance.md#reuse-equivalent-work The camera placement and every performer root at each sample time are computed once and shared by the frame and silhouette metrics, so a root is sampled once per time rather than once per pair that includes it; the contact metric samples at event times, which are not on the grid.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The camera and root tables, O(T + P · T) vectors, live for one call and are released on return; the returned notes are fresh records owned by the caller.
 */
export function reviewVisualRead (props: {
  /** Beat id the notes are filed against. */
  beat: string;

  /** Staged scene whose nodes and cameras the shot plays over. */
  scene: IAutoMovieScene;

  /** The compiled shot: camera, its motion, performances, events, duration. */
  shot: IAutoMovieShot;

  /** Motions the shot's performances reference. */
  motions: readonly IAutoMovieMotion[];

  /** Samples per second. Defaults to 12. */
  sampleRate?: number;

  /** Render aspect (width / height). Defaults to 16 / 9. */
  aspect?: number;

  /** Body radius in metres a contact point must land within. Defaults to 1. */
  contactRadius?: number;

  /** Silhouette half-width in metres for the merge check. Defaults to 0.35. */
  silhouetteRadius?: number;

  /**
   * Film-grammar findings for this shot or its incoming cut, computed by the
   * sequence analyzer and filed here before the visual-read notes.
   */
  grammarDiagnostics?: readonly IAutoMovieGrammarDiagnostic[];
}): IAutoMovieReviewNote[] {
  const motionById: Map<string, IAutoMovieMotion> = new Map(
    props.motions.map(
      (motion: IAutoMovieMotion): [string, IAutoMovieMotion] => [
        motion.id,
        motion,
      ],
    ),
  );
  const nodeById: Map<string, IAutoMovieSceneNode> = new Map(
    props.scene.nodes.map(
      (node: IAutoMovieSceneNode): [string, IAutoMovieSceneNode] => [
        node.id,
        node,
      ],
    ),
  );
  function performerOf (
    performance: IAutoMovieShotPerformance,
  ): IPerformer | null {
    const node: IAutoMovieSceneNode | undefined = nodeById.get(
      performance.node,
    );
    const motion: IAutoMovieMotion | undefined =
      performance.motion === null
        ? undefined
        : motionById.get(performance.motion);
    return node === undefined || motion === undefined
      ? null
      : {
          name: performance.node,
          node,
          motion,
          offset: performance.startOffset,
        };
  }
  const notes: IAutoMovieReviewNote[] = grammarDiagnosticsToReviewNotes({
    beat: props.beat,
    diagnostics: props.grammarDiagnostics ?? [],
  });

  const camera: IAutoMovieCamera | undefined = props.scene.cameras.find(
    (candidate: IAutoMovieCamera): boolean =>
      candidate.id === props.shot.camera,
  );
  if (
    camera !== undefined &&
    Number.isFinite(camera.fovY) &&
    camera.fovY > 0 &&
    camera.fovY < 180 &&
    camera.far > camera.near
  )
    notes.push(
      ...cameraNotes({
        beat: props.beat,
        shot: props.shot,
        camera,
        performers: props.shot.performances.flatMap(
          (performance: IAutoMovieShotPerformance): IPerformer[] => {
            const performer: IPerformer | null = performerOf(performance);
            return performer === null ? [] : [performer];
          },
        ),
        times: sampleTimes(
          props.shot.duration,
          props.sampleRate ?? DEFAULT_SAMPLE_RATE,
        ),
        aspect: props.aspect ?? DEFAULT_ASPECT,
        silhouetteRadius: props.silhouetteRadius ?? DEFAULT_SILHOUETTE_RADIUS,
      }),
    );

  const contactRadius: number = props.contactRadius ?? DEFAULT_CONTACT_RADIUS;
  const performanceByNode: Map<string, IAutoMovieShotPerformance> = new Map(
    props.shot.performances.map(
      (
        performance: IAutoMovieShotPerformance,
      ): [string, IAutoMovieShotPerformance] => [performance.node, performance],
    ),
  );
  for (const event of props.shot.events ?? []) {
    if (
      (event.kind !== "hit" && event.kind !== "contact") ||
      event.point === null ||
      event.target === null
    )
      continue;
    const performance: IAutoMovieShotPerformance | undefined =
      performanceByNode.get(event.target);
    const performer: IPerformer | null =
      performance === undefined ? null : performerOf(performance);
    if (performer === null) continue;
    const distance: number = Vector3.length(
      Vector3.subtract(worldRootAt(performer, event.time), event.point),
    );
    if (distance > contactRadius)
      notes.push(missNote(props.beat, event, distance, contactRadius));
  }
  return notes;
}

/** A performance whose node and motion both resolved. */
interface IPerformer {
  name: string;
  node: IAutoMovieSceneNode;
  motion: IAutoMovieMotion;
  offset: number;
}

/** The framing and silhouette notes, from one table of cameras and roots. */
function cameraNotes (props: {
  beat: string;
  shot: IAutoMovieShot;
  camera: IAutoMovieCamera;
  performers: readonly IPerformer[];
  times: readonly number[];
  aspect: number;
  silhouetteRadius: number;
}): IAutoMovieReviewNote[] {
  const notes: IAutoMovieReviewNote[] = [];
  const camera: IAutoMovieCamera = props.camera;
  const halfY: number = Math.tan((camera.fovY * Math.PI) / 360);
  const cameras: IAutoMovieResolvedCamera[] = props.times.map(
    (time: number): IAutoMovieResolvedCamera =>
      resolveCameraAt(
        camera.transform,
        props.shot.cameraMotion,
        camera.id,
        time,
      ),
  );
  const roots: IAutoMovieVector3[][] = props.performers.map(
    (performer: IPerformer): IAutoMovieVector3[] =>
      props.times.map(
        (time: number): IAutoMovieVector3 => worldRootAt(performer, time),
      ),
  );

  props.performers.forEach((actor: IPerformer, p: number): void => {
    const off: number = props.times.findIndex(
      (_time: number, t: number): boolean =>
        !inFrame(cameras[t]!, roots[p]![t]!, camera, halfY, props.aspect),
    );
    if (off >= 0)
      notes.push({
        beat: props.beat,
        tier: "visual",
        issue: `subject "${actor.name}" leaves the camera frame at t=${roundToThousandths(props.times[off]!)}s (drifts off-screen or behind the camera)`,
        suggestion: `keep "${actor.name}" in shot, widen or re-aim camera "${camera.id}", or restage the action within the frame`,
      });
  });

  for (let i: number = 0; i < props.performers.length; ++i)
    for (let j: number = i + 1; j < props.performers.length; ++j) {
      const merge: number = props.times.findIndex(
        (_time: number, t: number): boolean => {
          const lens: IAutoMovieVector3 = cameras[t]!.position;
          const va: IAutoMovieVector3 = Vector3.subtract(roots[i]![t]!, lens);
          const vb: IAutoMovieVector3 = Vector3.subtract(roots[j]![t]!, lens);
          const da: number = Vector3.length(va);
          const db: number = Vector3.length(vb);
          // Too close to the lens is the framing metric's concern and makes
          // the angular radius degenerate; do not report it twice.
          if (Math.min(da, db) < camera.near) return false;
          const cos: number = Math.min(
            1,
            Math.max(-1, Vector3.dot(va, vb) / (da * db)),
          );
          return (
            Math.acos(cos) <
            Math.atan(props.silhouetteRadius / da) +
              Math.atan(props.silhouetteRadius / db)
          );
        },
      );
      if (merge < 0) continue;
      const a: string = props.performers[i]!.name;
      const b: string = props.performers[j]!.name;
      notes.push({
        beat: props.beat,
        tier: "visual",
        issue: `subjects "${a}" and "${b}" merge in silhouette at t=${roundToThousandths(props.times[merge]!)}s (they overlap into one blob from this camera)`,
        suggestion: `separate "${a}" and "${b}" on screen, stagger their depth, re-block, or move the camera off the line that stacks them`,
      });
    }
  return notes;
}

/** The note for a contact event that lands outside its target's body radius. */
function missNote (
  beat: string,
  event: IAutoMovieInteractionEvent,
  distance: number,
  contactRadius: number,
): IAutoMovieReviewNote { return ({
  beat,
  tier: "visual",
  issue: `the ${event.kind} at t=${roundToThousandths(event.time)}s lands ${roundToThousandths(distance)}m from "${event.target}", past the ${contactRadius}m body radius, it reads as a miss`,
  suggestion: `align the ${event.kind} with "${event.target}"'s body, retime the reaction or reposition the actor so the contact point meets it`,
}); }

/**
 * A performer's world root at shot time `t`: its clip has advanced
 * `max(0, t - startOffset)`, the convention the beat snapshots use.
 */
function worldRootAt (performer: IPerformer, t: number): IAutoMovieVector3 { return foldRoot(
    performer.node.transform,
    sampleMotion(performer.motion, Math.max(0, t - performer.offset)).pose.root,
  ).translation; }

/** Whether `point` is inside the camera's frustum, near and far included. */
function inFrame (
  resolved: IAutoMovieResolvedCamera,
  point: IAutoMovieVector3,
  camera: IAutoMovieCamera,
  halfY: number,
  aspect: number,
): boolean {
  const projected: { ndcX: number; ndcY: number; depth: number } = projectToNdc(
    resolved,
    point,
    halfY,
    aspect,
  );
  if (projected.depth < camera.near || projected.depth > camera.far)
    return false;
  return Math.abs(projected.ndcX) <= 1 && Math.abs(projected.ndcY) <= 1;
}

