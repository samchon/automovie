import {
  IAutoMovieCameraIntent,
  IAutoMovieVector3,
} from "@automovie/interface";

import { Vector3 } from "../math/Vector3";
import { roundToThousandths } from "../math/roundToThousandths";
import { IAutoMovieGrammarCameraObservation } from "./IAutoMovieGrammarCameraObservation";
import { IAutoMovieGrammarDiagnostic } from "./IAutoMovieGrammarDiagnostic";
import { IAutoMovieGrammarSubjectObservation } from "./IAutoMovieGrammarSubjectObservation";
import { IAutoMovieNormalizedGrammarShot } from "./IAutoMovieNormalizedGrammarShot";
import { GRAMMAR_EPSILON } from "./constants/GRAMMAR_EPSILON";
import { projectToNdc } from "./projectToNdc";

/** A shot's size at one boundary, or null when it cannot be measured. */
type Framing = IAutoMovieCameraIntent["framing"] | null;

/** A sign on one screen axis: toward negative, none, or toward positive. */
type Sign = -1 | 0 | 1;

/**
 * Appends every film-grammar finding of one cut to `diagnostics`, filed on the incoming shot, in this order: axis crossing, eyeline, jump cut, displacement re-establishing, screen direction, then entrant re-establishing.
 *
 * The axis finding needs both shots to state the same action axis, neither to cross it visibly, and the camera to stand on opposite sides at the two boundaries. The eyeline finding needs the incoming primary subject's gaze to reverse or continue the outgoing one, and reads the wrong screen relation. The jump-cut, displacement and screen-direction findings need both shots to share their primary subject: a same measured size with a camera-bearing change below the angle threshold, a subject displacement beyond the distance threshold into a shot that is not wide, or a reversed horizontal screen motion. The entrant finding names the first subject in id order that the outgoing shot did not observe, when the incoming shot is measured and not wide and no displacement finding was filed.
 *
 * @param diagnostics Finding list of the read, appended to in filing order.
 * @param previous Normalized outgoing shot of the cut.
 * @param incoming Normalized incoming shot of the cut.
 * @param sizeOf Measured size of a shot at a boundary; the read memoizes it.
 * @param thresholds Smallest non-jump bearing change in degrees and largest displacement in metres that needs no wide shot.
 *
 * @evidence contracts/common.md#principled-implementation Axis side uses a ground-plane cross-product sign, cut angle uses the arc cosine of a clamped normalized bearing dot product, and screen relations use projected-coordinate differences. Signs within GRAMMAR_EPSILON are neutral; a bearing length product at or below that threshold instead returns 180 degrees, suppressing an ordinary jump-cut threshold. Finite admitted observations do not by themselves guarantee finite derived cross products, norm products or projections.
 * @evidence contracts/common.md#clear-and-simple-design One entry per cut with one private inspector per finding family, so `readFilmGrammar` orders shots and applies suppression while every cut rule lives here; the displacement and entrant re-establishing checks share one flag because only one re-establishing finding is filed per cut.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No shot, subject or camera is special-cased and thresholds come from the caller. Screen relations are neutral when either depth is at or below GRAMMAR_EPSILON; other non-finite derived projections are not gated here, so that refusal is not a general projection-validity guarantee.
 * @evidence contracts/common.md#meaningful-documentation States the filing order, the condition of each finding family including the entrant rule, and the role and units of every parameter.
 * @evidence contracts/performance.md#efficient-algorithms Constant local work per cut over the prebuilt subject indexes, plus an `O(n)` entrant search over the incoming shot's `n` subjects; eyeline and screen-motion checks together use at most eight projections, and at most two sizeOf calls delegate memoized subject measurement to the caller. No earlier findings are scanned.
 * @evidence contracts/performance.md#reuse-equivalent-work Reads sizes through the caller's memo, so the incoming start size it shares with the shot-size check and the next cut's outgoing end size are measured once per read; subject lookups use the index `normalizeGrammarShot` built.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Appends at most six findings per call to the caller's list and retains nothing else; projected points and relation records are released on return.
 */
export function inspectGrammarCut(
  diagnostics: IAutoMovieGrammarDiagnostic[],
  previous: IAutoMovieNormalizedGrammarShot,
  incoming: IAutoMovieNormalizedGrammarShot,
  sizeOf: (
    shot: IAutoMovieNormalizedGrammarShot,
    boundary: "start" | "end",
  ) => Framing,
  thresholds: { minimumCutAngleDegrees: number; reestablishDistance: number },
): void {
  inspectAxis(diagnostics, previous, incoming);
  inspectEyeline(diagnostics, previous, incoming);
  const incomingSize: Framing = sizeOf(incoming, "start");
  // Each shot is the incoming side of exactly one cut, so a displacement
  // finding filed here is the only re-establishing finding it can carry.
  let reestablished: boolean = false;
  if (
    previous.primarySubject !== null &&
    previous.primarySubject === incoming.primarySubject
  ) {
    const subjectId: string = previous.primarySubject;
    const outgoing: IAutoMovieGrammarSubjectObservation =
      previous.subjectById.get(subjectId)!;
    const arriving: IAutoMovieGrammarSubjectObservation =
      incoming.subjectById.get(subjectId)!;
    const previousSize: Framing = sizeOf(previous, "end");
    const cutAngle: number = cameraBearingAngleDegrees(
      outgoing.end,
      arriving.start,
      previous.camera.end.position,
      incoming.camera.start.position,
    );
    if (
      previousSize !== null &&
      previousSize === incomingSize &&
      cutAngle < thresholds.minimumCutAngleDegrees
    )
      diagnostics.push({
        code: "grammar-jump-cut",
        severity: "warning",
        shot: incoming.id,
        previousShot: previous.id,
        fact: `cut "${previous.id}" -> "${incoming.id}" keeps ${subjectId} at ${incomingSize} size while camera bearing changes ${roundToThousandths(cutAngle)} degrees`,
        impact:
          "the small same-size spatial change can read as an accidental jump",
        recovery: `move camera "${incoming.id}" at least ${thresholds.minimumCutAngleDegrees} degrees around "${subjectId}", change shot size, insert a neutral cutaway, or mark jump-cut`,
      });
    const displacement: number = Vector3.length(
      Vector3.subtract(arriving.start, outgoing.end),
    );
    if (
      displacement > thresholds.reestablishDistance &&
      incomingSize !== null &&
      incomingSize !== "wide"
    ) {
      reestablished = true;
      diagnostics.push({
        code: "grammar-reestablish",
        severity: "warning",
        shot: incoming.id,
        previousShot: previous.id,
        fact: `"${subjectId}" moves ${roundToThousandths(displacement)}m across the cut into a ${incomingSize} shot`,
        impact:
          "the audience loses the subject's new spatial relation without a wide orientation view",
        recovery: `make "${incoming.id}" wide, insert a neutral establishing shot before it, or mark tight-reestablish`,
      });
    }
    inspectScreenDirection(diagnostics, previous, incoming, outgoing, arriving);
  }
  if (reestablished || incomingSize === null || incomingSize === "wide") return;
  const entrant: IAutoMovieGrammarSubjectObservation | undefined =
    incoming.subjects.find(
      (subject: IAutoMovieGrammarSubjectObservation): boolean =>
        previous.subjectById.has(subject.id) === false,
    );
  if (entrant === undefined) return;
  diagnostics.push({
    code: "grammar-reestablish",
    severity: "warning",
    shot: incoming.id,
    previousShot: previous.id,
    fact: `"${entrant.id}" first enters the edit in a ${incomingSize} shot`,
    impact:
      "the audience has no wide spatial introduction for the newly visible subject",
    recovery: `introduce "${entrant.id}" in a wide or neutral establishing shot before "${incoming.id}", or mark tight-reestablish`,
  });
}

/** Files an axis finding when an unseen cut puts the camera across the axis. */
function inspectAxis(
  diagnostics: IAutoMovieGrammarDiagnostic[],
  previous: IAutoMovieNormalizedGrammarShot,
  incoming: IAutoMovieNormalizedGrammarShot,
): void {
  if (
    previous.actionAxis === null ||
    incoming.actionAxis === null ||
    previous.actionAxis[0] !== incoming.actionAxis[0] ||
    previous.actionAxis[1] !== incoming.actionAxis[1] ||
    crossesActionAxisOnScreen(previous) ||
    crossesActionAxisOnScreen(incoming)
  )
    return;
  const previousSide: Sign = actionAxisSide(previous, "end");
  const incomingSide: Sign = actionAxisSide(incoming, "start");
  if (previousSide === 0 || incomingSide === 0 || previousSide === incomingSide)
    return;
  const halfPlane: string = previousSide > 0 ? "positive" : "negative";
  diagnostics.push({
    code: "grammar-axis-crossed",
    severity: "error",
    shot: incoming.id,
    previousShot: previous.id,
    fact: `cut "${previous.id}" -> "${incoming.id}" moves the camera from the ${halfPlane} to the ${halfPlane === "positive" ? "negative" : "positive"} half-plane of axis "${previous.actionAxis[0]}"-"${previous.actionAxis[1]}"`,
    impact:
      "the unseen axis crossing reverses established left-right geography",
    recovery: `keep camera "${incoming.id}" on the ${halfPlane} half-plane, show the crossing on screen, insert a neutral shot on the action axis, or mark axis-cross`,
  });
}

/**
 * Files an eyeline finding when a reverse or a continuation of the outgoing primary subject's gaze reads the wrong way on screen.
 */
function inspectEyeline(
  diagnostics: IAutoMovieGrammarDiagnostic[],
  previous: IAutoMovieNormalizedGrammarShot,
  incoming: IAutoMovieNormalizedGrammarShot,
): void {
  if (previous.primarySubject === null || incoming.primarySubject === null)
    return;
  const outgoing: IAutoMovieGrammarSubjectObservation =
    previous.subjectById.get(previous.primarySubject)!;
  if (outgoing.eyeline === null) return;
  const targetId: string = outgoing.eyeline.target;
  const incomingLooker: IAutoMovieGrammarSubjectObservation | undefined =
    incoming.subjectById.get(incoming.primarySubject);
  if (incomingLooker === undefined || incomingLooker.eyeline === null) return;
  const incomingTargetId: string = incomingLooker.eyeline.target;
  const reverse: boolean =
    incomingLooker.id === targetId && incomingTargetId === outgoing.id;
  const continuation: boolean =
    incomingLooker.id === outgoing.id && incomingTargetId === targetId;
  if (reverse === false && continuation === false) return;
  const outgoingSide: IScreenRelation = relativeScreenDirection(
    previous.camera.end,
    outgoing.end,
    outgoing.eyeline.end,
  );
  const incomingSide: IScreenRelation = relativeScreenDirection(
    incoming.camera.start,
    incomingLooker.start,
    incomingLooker.eyeline.start,
  );
  const expectedMultiplier: number = reverse ? -1 : 1;
  function matches(outgoingValue: Sign, incomingValue: Sign): boolean {
    return (
      outgoingValue === 0 ||
      incomingValue === 0 ||
      incomingValue === outgoingValue * expectedMultiplier
    );
  }
  if (
    matches(outgoingSide.horizontal, incomingSide.horizontal) &&
    matches(outgoingSide.vertical, incomingSide.vertical)
  )
    return;
  diagnostics.push({
    code: "grammar-eyeline",
    severity: "warning",
    shot: incoming.id,
    previousShot: previous.id,
    fact: `eyeline "${outgoing.id}" -> "${targetId}" reads ${screenRelation(outgoingSide)}, but incoming "${incomingLooker.id}" -> "${incomingTargetId}" reads ${screenRelation(incomingSide)} instead of the ${reverse ? "opposite" : "same"} screen relation`,
    impact:
      "the reverse relative screen position breaks the established eyeline match",
    recovery: `place camera "${incoming.id}" on the prior eyeline half-plane, insert a neutral look shot, or mark eyeline-break`,
  });
}

/** Files a finding when the shared subject's screen motion reverses at a cut. */
function inspectScreenDirection(
  diagnostics: IAutoMovieGrammarDiagnostic[],
  previous: IAutoMovieNormalizedGrammarShot,
  incoming: IAutoMovieNormalizedGrammarShot,
  outgoing: IAutoMovieGrammarSubjectObservation,
  arriving: IAutoMovieGrammarSubjectObservation,
): void {
  const outgoingDirection: Sign = screenMotionDirection(previous, outgoing);
  const incomingDirection: Sign = screenMotionDirection(incoming, arriving);
  if (
    outgoingDirection === 0 ||
    incomingDirection === 0 ||
    outgoingDirection === incomingDirection
  )
    return;
  diagnostics.push({
    code: "grammar-screen-direction",
    severity: "error",
    shot: incoming.id,
    previousShot: previous.id,
    fact: `"${outgoing.id}" moves screen-${outgoingDirection > 0 ? "right" : "left"} in "${previous.id}" then screen-${incomingDirection > 0 ? "right" : "left"} in "${incoming.id}"`,
    impact:
      "the reversal can read as the subject turning around or changing destination",
    recovery: `keep "${outgoing.id}" moving screen-${outgoingDirection > 0 ? "right" : "left"}, cross the camera visibly, or insert a neutral head-on shot`,
  });
}

/** Which ground-plane side of the action axis the camera stands on. */
function actionAxisSide(
  shot: IAutoMovieNormalizedGrammarShot,
  boundary: "start" | "end",
): Sign {
  const first: IAutoMovieGrammarSubjectObservation = shot.subjectById.get(
    shot.actionAxis![0],
  )!;
  const second: IAutoMovieGrammarSubjectObservation = shot.subjectById.get(
    shot.actionAxis![1],
  )!;
  const axis: IAutoMovieVector3 = Vector3.subtract(
    second[boundary],
    first[boundary],
  );
  const camera: IAutoMovieVector3 = Vector3.subtract(
    shot.camera[boundary].position,
    first[boundary],
  );
  return sign(axis.x * camera.z - axis.z * camera.x);
}

/** Whether the camera visibly crosses the shot's own axis between boundaries. */
function crossesActionAxisOnScreen(
  shot: IAutoMovieNormalizedGrammarShot,
): boolean {
  if (shot.actionAxis === null) return false;
  const start: Sign = actionAxisSide(shot, "start");
  const end: Sign = actionAxisSide(shot, "end");
  return start !== 0 && end !== 0 && start !== end;
}

/**
 * Signed screen offset of a target from a subject, per axis.
 */
interface IScreenRelation {
  /** Positive when the target is screen-right of the subject. */
  horizontal: Sign;

  /** Positive when the target is above the subject on screen. */
  vertical: Sign;
}

/** Target offset from the subject; neutral when either depth is at or below GRAMMAR_EPSILON. */
function relativeScreenDirection(
  camera: IAutoMovieGrammarCameraObservation,
  subject: IAutoMovieVector3,
  target: IAutoMovieVector3,
): IScreenRelation {
  const halfY: number = Math.tan((camera.fovY * Math.PI) / 360);
  const from: ReturnType<typeof projectToNdc> = projectToNdc(
    camera,
    subject,
    halfY,
    camera.aspect,
  );
  const to: ReturnType<typeof projectToNdc> = projectToNdc(
    camera,
    target,
    halfY,
    camera.aspect,
  );
  if (from.depth <= GRAMMAR_EPSILON || to.depth <= GRAMMAR_EPSILON)
    return { horizontal: 0, vertical: 0 };
  return {
    horizontal: sign(to.ndcX - from.ndcX),
    vertical: sign(to.ndcY - from.ndcY),
  };
}

/** Horizontal screen motion of a subject from its first to its last frame. */
function screenMotionDirection(
  shot: IAutoMovieNormalizedGrammarShot,
  subject: IAutoMovieGrammarSubjectObservation,
): Sign {
  const startHalfY: number = Math.tan((shot.camera.start.fovY * Math.PI) / 360);
  const endHalfY: number = Math.tan((shot.camera.end.fovY * Math.PI) / 360);
  const start: ReturnType<typeof projectToNdc> = projectToNdc(
    shot.camera.start,
    subject.start,
    startHalfY,
    shot.camera.start.aspect,
  );
  const end: ReturnType<typeof projectToNdc> = projectToNdc(
    shot.camera.end,
    subject.end,
    endHalfY,
    shot.camera.end.aspect,
  );
  if (start.depth <= GRAMMAR_EPSILON || end.depth <= GRAMMAR_EPSILON) return 0;
  return sign(end.ndcX - start.ndcX);
}

/**
 * Degrees between camera bearings across a cut; 180 when their length product is at or below GRAMMAR_EPSILON.
 */
function cameraBearingAngleDegrees(
  previousSubject: IAutoMovieVector3,
  incomingSubject: IAutoMovieVector3,
  previousCamera: IAutoMovieVector3,
  incomingCamera: IAutoMovieVector3,
): number {
  const previous: IAutoMovieVector3 = Vector3.subtract(
    previousCamera,
    previousSubject,
  );
  const incoming: IAutoMovieVector3 = Vector3.subtract(
    incomingCamera,
    incomingSubject,
  );
  const lengths: number = Vector3.length(previous) * Vector3.length(incoming);
  if (lengths <= GRAMMAR_EPSILON) return 180;
  const cosine: number = Math.max(
    -1,
    Math.min(1, Vector3.dot(previous, incoming) / lengths),
  );
  return (Math.acos(cosine) * 180) / Math.PI;
}

/** The sign of `value`, zero inside the `GRAMMAR_EPSILON` dead band. */
function sign(value: number): Sign {
  return Math.abs(value) <= GRAMMAR_EPSILON ? 0 : value > 0 ? 1 : -1;
}

/** A screen relation in finding prose, such as `screen-left/above`. */
function screenRelation(direction: IScreenRelation): string {
  return [
    direction.horizontal === 0
      ? "screen-center"
      : `screen-${direction.horizontal > 0 ? "right" : "left"}`,
    direction.vertical === 0
      ? "level"
      : direction.vertical > 0
        ? "above"
        : "below",
  ].join("/");
}
