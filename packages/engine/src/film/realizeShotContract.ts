import {
  IAutoMovieCamera,
  IAutoMovieCompiledContractRealization,
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledFormationHero,
  IAutoMovieCompiledPredicateResult,
  IAutoMovieDiagnostic,
  IAutoMovieFormationChunk,
  IAutoMovieFormationDesign,
  IAutoMovieSceneNode,
  IAutoMovieShotContract,
  IAutoMovieShotEventContract,
  IAutoMovieShotParticipant,
  IAutoMovieShotPredicate,
  IAutoMovieSubjectBox,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { productionRuntimeModelId } from "../productionRuntimeModelId";
import { IAutoMovieResolvedCamera } from "./IAutoMovieResolvedCamera";
import { IRealizeShotContractProps } from "./IRealizeShotContractProps";
import { IShotContractSubjectReader } from "./IShotContractSubjectReader";
import { createShotContractSubjectReader } from "./createShotContractSubjectReader";
import { evaluateAutoMovieCameraDepthPrecision } from "./evaluateAutoMovieCameraDepthPrecision";
import { evaluateShotPredicate } from "./evaluateShotPredicate";
import { intersectsPerspectiveFrustumBox } from "./intersectsPerspectiveFrustumBox";
import { projectToNdc } from "./projectToNdc";
import { resolveCameraAt } from "./resolveCameraAt";

/** One graded camera sample of the realization record. */
type ICameraOutcome = IAutoMovieCompiledContractRealization["camera"][number];

/** One graded opening or closing state of the realization record. */
type IStateOutcome = IAutoMovieCompiledContractRealization["opening"][number];

/** Vector-component and absolute quaternion-dot comparison tolerance; the metrics differ. */
const TRANSFORM_TOLERANCE: number = 1e-9;

/**
 * Grade a shot contract against the compiled artifacts that claim to realize it, measuring every outcome from the compiled scene, motions, camera and event samples rather than from the contract's own prose.
 *
 * Opening states are graded at second 0 and closing states at `durationSeconds`. Each event is graded at its source sample's time and passes only when every declared subject resolves, its sample exists and is finite inside its window, and its predicates pass; the sample list itself must name every contract event exactly once. The camera is sampled at 0, every review frame and `durationSeconds`, deduplicated and ascending, and a sample passes only when every required subject resolves, its box intersects the clipped view frustum of the cropped raster, and the box's depth range satisfies the camera's depth-precision constraint. A formation participant must materialize its designed count in contiguous chunks, and, once a production is supplied, every promoted hero node exactly; an actor participant must be a performed scene node; every builder-reported slot collision fails.
 *
 * A reference that cannot be resolved, such as an absent node, rig, bone, motion, landmark or formation, makes the predicate or camera subject that named it fail; nothing is substituted for it. Contract clocks must already be admitted. Camera resolution runs outside the per-subject catch, so an invalid review time or malformed moving-camera sample can throw here.
 *
 * @param props The contract, the compiled artifacts, and the design context.
 * @returns The realization record, and one `contract-realization-failed` diagnostic per slot collision, failing state, mismatched sample list, failing event, camera sample, formation and actor, in that order; an empty list means the contract is realized.
 *
 * @evidence contracts/common.md#principled-implementation Reads compiled artifacts through one subject reader and applies declared scalar predicates. Camera grading uses intersectsPerspectiveFrustumBox's geometric overlap test and projects eight box corners to derive depth range; it proves neither full enclosure, occlusion nor rendered pixels. Formation chunks use running starts, hero vector components compare within 1e-9, and rotations use |abs(dot)-1| within 1e-9 so q and -q agree. Unresolvable references become failing outcomes at their grading location.
 * @evidence contracts/common.md#clear-and-simple-design The function owns the grading decisions and the diagnostic wording; where subjects stand is delegated to `createShotContractSubjectReader` and each predicate's measurement to `evaluateShotPredicate`, which the state and event grades share; the camera and formation grades stay private because nothing else grades them.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts The failure message tells the author to correct the scene, motion, camera or sample because echoed ids and contract prose are never accepted as evidence; no shot, subject or fixture is special-cased, and the source-stage exemption from hero materialization is the documented `production: null` contract, because heroes are added by the builder after this pass.
 * @evidence contracts/common.md#meaningful-documentation States the instants each part is graded at, every condition a state, event, camera sample, formation and actor must meet, how unresolvable references grade, and the order and meaning of the returned diagnostics.
 * @evidence contracts/performance.md#efficient-algorithms Traverses predicates, events, camera samples times required subjects, chunks and heroes with delegated sampling and extent costs; sorting T deduplicated camera times adds O(T log T). The subject reader indexes identities and chunk starts use one running sum, while camera lookup still scans scene cameras per sample.
 * @evidence contracts/performance.md#reuse-equivalent-work Builds one subject reader per call and shares it across every predicate, event, camera sample and participant check, so object-motion sampling and subject extents computed for one grade are reused by the others; nothing is shared across calls, because each call grades different artifacts.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The reader and its caches are owned by this call and released on return; the returned record holds fresh outcome objects plus references to the contract's predicates and copies of resolved camera placements, sized by the contract.
 */
export function realizeShotContract(props: IRealizeShotContractProps): {
  realization: IAutoMovieCompiledContractRealization;
  diagnostics: IAutoMovieDiagnostic[];
} {
  const reader: IShotContractSubjectReader =
    createShotContractSubjectReader(props);
  const diagnostics: IAutoMovieDiagnostic[] = [];
  function fail(field: string, expectation: string): void {
    diagnostics.push({
      code: "contract-realization-failed",
      category: "error",
      phase: "compile",
      target: `shot:${props.contract.id}`,
      path: null,
      message: `${field} ${expectation}. Correct the actual scene, motion, camera, or source event sample; contract prose and echoed ids are not evidence.`,
    });
  }
  for (const node of props.collisions)
    fail(
      `formation slot "${node}"`,
      "collides with a coding-agent scene node; ordinary formation slots are builder-owned",
    );

  function gradeState(
    state: IAutoMovieShotContract["opening"][number],
    time: number,
    field: string,
    expectation: string,
  ): IStateOutcome {
    const predicates: IAutoMovieCompiledPredicateResult[] =
      state.predicates.map(
        (
          predicate: IAutoMovieShotPredicate,
        ): IAutoMovieCompiledPredicateResult =>
          evaluateShotPredicate(reader, predicate, time),
      );
    const passed: boolean = predicates.every(
      (predicate: IAutoMovieCompiledPredicateResult): boolean =>
        predicate.passed,
    );
    if (passed === false) fail(`${field} "${state.id}"`, expectation);
    return { id: state.id, predicates, passed };
  }
  const opening: IStateOutcome[] = props.contract.opening.map(
    (state: IAutoMovieShotContract["opening"][number]): IStateOutcome =>
      gradeState(
        state,
        0,
        "opening state",
        "must satisfy every typed predicate at time 0",
      ),
  );
  const closing: IStateOutcome[] = props.contract.closing.map(
    (state: IAutoMovieShotContract["closing"][number]): IStateOutcome =>
      gradeState(
        state,
        props.contract.durationSeconds,
        "closing state",
        `must satisfy every typed predicate at ${props.contract.durationSeconds}s`,
      ),
  );

  const samples: Map<string, { id: string; time: number }> = new Map(
    props.compiled.eventSamples.map(
      (sample: {
        id: string;
        time: number;
      }): [string, { id: string; time: number }] => [sample.id, sample],
    ),
  );
  if (
    samples.size !== props.compiled.eventSamples.length ||
    samples.size !== props.contract.events.length
  )
    fail("eventSamples", "must name every authoritative event exactly once");
  const events: IAutoMovieCompiledContractRealization["events"] =
    props.contract.events.map(
      (
        event: IAutoMovieShotEventContract,
      ): IAutoMovieCompiledContractRealization["events"][number] => {
        const sample: { id: string; time: number } | undefined = samples.get(
          event.id,
        );
        const time: number = sample?.time ?? event.window.from;
        const predicates: IAutoMovieCompiledPredicateResult[] =
          event.predicates.map(
            (
              predicate: IAutoMovieShotPredicate,
            ): IAutoMovieCompiledPredicateResult =>
              evaluateShotPredicate(reader, predicate, time),
          );
        const passed: boolean =
          sample !== undefined &&
          event.subjects.every(
            (subject: string): boolean =>
              reader.node(subject) !== undefined ||
              reader.formation(subject) !== undefined,
          ) &&
          Number.isFinite(time) &&
          time >= event.window.from &&
          time <= event.window.to &&
          predicates.every(
            (predicate: IAutoMovieCompiledPredicateResult): boolean =>
              predicate.passed,
          );
        if (passed === false)
          fail(
            `event "${event.id}"`,
            `must resolve every declared subject and have one finite source sample inside ${event.window.from}..${event.window.to}s whose typed predicates all pass`,
          );
        return { id: event.id, time, predicates, passed };
      },
    );

  const cameraTimes: number[] = [
    ...new Set<number>([
      0,
      ...props.contract.reviewFrames.map(
        (frame: IAutoMovieShotContract["reviewFrames"][number]): number =>
          frame.time,
      ),
      props.contract.durationSeconds,
    ]),
  ].sort((left: number, right: number): number => left - right);
  const camera: ICameraOutcome[] = cameraTimes.map(
    (time: number): ICameraOutcome => cameraOutcome(props, reader, time),
  );
  for (const outcome of camera)
    if (outcome.passed === false)
      fail(
        `camera at ${outcome.time}s`,
        "must resolve every required subject bound intersecting the current camera frustum and satisfying its clipping range and declared depth precision",
      );

  const formations: IAutoMovieCompiledContractRealization["formations"] =
    props.contract.participants.flatMap(
      (
        participant: IAutoMovieShotParticipant,
      ): IAutoMovieCompiledContractRealization["formations"] => {
        if (participant.kind !== "formation") return [];
        const design: IAutoMovieFormationDesign | undefined =
          props.formations.get(participant.id);
        const formation: IAutoMovieCompiledFormation | undefined =
          reader.formation(participant.id);
        const passed: boolean =
          design !== undefined &&
          formation !== undefined &&
          compactFormationPasses(design, formation) &&
          // The source pass runs before the builder adds or corrects promoted
          // hero nodes, then the builder grades again with the production;
          // requiring heroes here would make that materialization unreachable
          // for every formation with an override.
          (props.production === null ||
            heroesMaterialized(reader, design, formation));
        if (passed === false)
          fail(
            `formation "${participant.id}"`,
            `must materialize one compact ${design?.count ?? 0}-slot runtime with matching anonymous/hero count and contiguous chunks${props.production === null ? "" : ", plus exact promoted hero nodes"}`,
          );
        return [
          {
            id: participant.id,
            count: formation?.count ?? 0,
            min: formation?.bounds.min ?? { x: 0, y: 0, z: 0 },
            max: formation?.bounds.max ?? { x: 0, y: 0, z: 0 },
            passed,
          },
        ];
      },
    );

  for (const participant of props.contract.participants)
    if (
      participant.kind === "actor" &&
      (reader.node(participant.id) === undefined ||
        reader.performance(participant.id) === undefined)
    )
      fail(
        `actor "${participant.id}"`,
        "must be a current performed scene node",
      );

  return {
    realization: {
      version: 1,
      shot: props.contract.id,
      opening,
      closing,
      events,
      camera,
      formations,
    },
    diagnostics,
  };
}

/**
 * Whether a compiled formation is the one compact runtime its design asks for: the designed count, split between anonymous slots and heroes, and chunks indexed in order that tile `[0, count)` without gaps.
 */
function compactFormationPasses(
  design: IAutoMovieFormationDesign,
  formation: IAutoMovieCompiledFormation,
): boolean {
  if (
    formation.count !== design.count ||
    formation.anonymousCount + formation.heroes.length !== design.count
  )
    return false;
  let start: number = 0;
  for (let index: number = 0; index < formation.chunks.length; ++index) {
    const chunk: IAutoMovieFormationChunk = formation.chunks[index]!;
    if (
      chunk.index !== index ||
      chunk.start !== start ||
      !Number.isSafeInteger(chunk.count) ||
      chunk.count <= 0
    )
      return false;
    start += chunk.count;
  }
  return start === design.count;
}

/**
 * Whether every promoted hero has a scene node within the declared transform comparison tolerance, built from the design's model group.
 */
function heroesMaterialized(
  reader: IShotContractSubjectReader,
  design: IAutoMovieFormationDesign,
  formation: IAutoMovieCompiledFormation,
): boolean {
  return formation.heroes.every(
    (hero: IAutoMovieCompiledFormationHero): boolean => {
      const node: IAutoMovieSceneNode | undefined = reader.node(hero.actor);
      return (
        node !== undefined &&
        vectorClose(node.transform.translation, hero.transform.translation) &&
        quaternionClose(node.transform.rotation, hero.transform.rotation) &&
        vectorClose(node.transform.scale, hero.transform.scale) &&
        node.model === productionRuntimeModelId(design.model)
      );
    },
  );
}

/**
 * Grade the live camera at one shot-local second against the contract's required subjects. Without a live camera or a raster the sample fails with a not-a-number depth report.
 */
function cameraOutcome(
  props: IRealizeShotContractProps,
  reader: IShotContractSubjectReader,
  time: number,
): ICameraOutcome {
  const required: readonly string[] = props.contract.camera.requiredSubjects;
  const camera: IAutoMovieCamera | undefined =
    props.compiled.scene.cameras.find(
      (candidate: IAutoMovieCamera): boolean =>
        candidate.id === props.compiled.shot.camera,
    );
  const frameFormat: IRealizeShotContractProps["frameFormat"] =
    props.production?.frameFormat ?? props.frameFormat;
  if (camera === undefined || frameFormat === undefined)
    return {
      time,
      depthPrecision: evaluateAutoMovieCameraDepthPrecision({
        camera: props.compiled.shot.camera,
        time,
        near: Number.NaN,
        far: Number.NaN,
        requiredNear: Number.NaN,
        requiredFar: Number.NaN,
        constraint: {
          minimumDepthBits: Number.NaN,
          maximumStepMeters: Number.NaN,
        },
      }),
      requiredSubjects: required.length,
      resolvedSubjects: 0,
      readableSubjects: 0,
      passed: false,
    };
  const resolved: IAutoMovieResolvedCamera = resolveCameraAt(
    camera.transform,
    props.compiled.shot.cameraMotion,
    camera.id,
    time,
  );
  const halfY: number = Math.tan((camera.fovY * Math.PI) / 360);
  const aspect: number = frameFormat.width / frameFormat.height;
  let resolvedSubjects: number = 0;
  let readableSubjects: number = 0;
  let requiredNear: number = Number.POSITIVE_INFINITY;
  let requiredFar: number = Number.NEGATIVE_INFINITY;
  for (const subject of required)
    try {
      // A node subject is boxed through its orientation as well as its root,
      // because a yawed element fills a different world box than the same
      // geometry facing down an axis, and the solve framed it the same way.
      const placement: IAutoMovieTransform = reader.placementAt(subject, time);
      ++resolvedSubjects;
      const box: IAutoMovieSubjectBox = reader.subjectBox(
        subject,
        placement,
        time,
      );
      for (const x of [box.min.x, box.max.x])
        for (const y of [box.min.y, box.max.y])
          for (const z of [box.min.z, box.max.z]) {
            const depth: number = projectToNdc(
              resolved,
              { x, y, z },
              halfY,
              aspect,
              frameFormat.crop,
            ).depth;
            requiredNear = Math.min(requiredNear, depth);
            requiredFar = Math.max(requiredFar, depth);
          }
      if (
        intersectsPerspectiveFrustumBox({
          camera: resolved,
          min: box.min,
          max: box.max,
          near: camera.near,
          far: camera.far,
          halfY,
          aspect,
          crop: frameFormat.crop,
        })
      )
        ++readableSubjects;
    } catch {
      // Placement or boxing failure leaves this subject unreadable. A boxing
      // failure may occur after its placement incremented resolvedSubjects.
    }
  const depthPrecision: ICameraOutcome["depthPrecision"] =
    evaluateAutoMovieCameraDepthPrecision({
      camera: camera.id,
      time,
      near: camera.near,
      far: camera.far,
      requiredNear: resolvedSubjects === 0 ? Number.NaN : requiredNear,
      requiredFar: resolvedSubjects === 0 ? Number.NaN : requiredFar,
      constraint: camera.depthPrecision,
    });
  return {
    time,
    // A compiled move keeps the staged bearing but solves the distance from
    // the framing, so the staged transform no longer states the measured
    // camera; the sample then records the placement it measured, copied so
    // it never aliases the staged vectors. A shot with no move records none.
    ...(props.compiled.shot.cameraMotion === null
      ? {}
      : {
          placement: {
            position: { ...resolved.position },
            rotation: { ...resolved.rotation },
          },
        }),
    depthPrecision,
    requiredSubjects: required.length,
    resolvedSubjects,
    readableSubjects,
    passed:
      resolvedSubjects === required.length &&
      readableSubjects === required.length &&
      depthPrecision.passed,
  };
}

/** Whether two vectors agree on every component within the tolerance. */
function vectorClose(
  left: IAutoMovieVector3,
  right: IAutoMovieVector3,
): boolean {
  return (
    Math.abs(left.x - right.x) <= TRANSFORM_TOLERANCE &&
    Math.abs(left.y - right.y) <= TRANSFORM_TOLERANCE &&
    Math.abs(left.z - right.z) <= TRANSFORM_TOLERANCE
  );
}

/**
 * Whether two unit quaternions name the same rotation within the tolerance; `q` and `-q` are the same rotation, so the absolute dot product is compared with one.
 */
function quaternionClose(
  left: IAutoMovieTransform["rotation"],
  right: IAutoMovieTransform["rotation"],
): boolean {
  return (
    Math.abs(
      Math.abs(
        left.x * right.x +
          left.y * right.y +
          left.z * right.z +
          left.w * right.w,
      ) - 1,
    ) <= TRANSFORM_TOLERANCE
  );
}
