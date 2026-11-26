import {
  IAutoMovieCompiledContractRealization,
  IAutoMovieCompiledFormation,
  IAutoMovieCompiledFormationHero,
  IAutoMovieCompiledPredicateResult,
  IAutoMovieDiagnostic,
  IAutoMovieFormationChunk,
  IAutoMovieFormationDesign,
  type IAutoMovieRealizeShotContract,
  type IAutoMovieRealizeShotContractProps,
  IAutoMovieSceneNode,
  IAutoMovieShotContract,
  type IAutoMovieShotContractSubjectReader,
  IAutoMovieShotEventContract,
  IAutoMovieShotParticipant,
  IAutoMovieShotPredicate,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import { productionRuntimeModelId } from "../../model/internal/productionRuntimeModelId";
import { createShotContractSubjectReader } from "./createShotContractSubjectReader";
import { evaluateShotPredicate } from "./evaluateShotPredicate";
import { realizeShotCameraOutcome } from "../realizeShotCameraOutcome";

/** One graded camera sample of the realization record. */
type ICameraOutcome = IAutoMovieCompiledContractRealization["camera"][number];

/** One graded opening or closing state of the realization record. */
type IStateOutcome = IAutoMovieCompiledContractRealization["opening"][number];

/**
 * Vector-component and absolute quaternion-dot comparison tolerance; the
 * metrics differ.
 */
const TRANSFORM_TOLERANCE: number = 1e-9;

/**
 * Grade a shot contract against the compiled artifacts that claim to realize
 * it, measuring every outcome from the compiled scene, motions, camera and
 * event samples rather than from the contract's own prose.
 *
 * Opening states are graded at second 0 and closing states at
 * `durationSeconds`. Each event is graded at its source sample's time and
 * passes only when every declared subject resolves, its sample exists and is
 * finite inside its window, and its predicates pass; the sample list itself
 * must name every contract event exactly once. The camera is sampled at 0,
 * every review frame and `durationSeconds`, deduplicated and ascending, and a
 * sample passes only when every required subject resolves, its box intersects
 * the clipped view frustum of the cropped raster, and the box's depth range
 * satisfies the camera's depth-precision constraint. A formation participant
 * must materialize its designed count in contiguous chunks, and, once a
 * production is supplied, every promoted hero node exactly; an actor
 * participant must be a performed scene node; every builder-reported slot
 * collision fails.
 *
 * A reference that cannot be resolved, such as an absent node, rig, bone,
 * motion, landmark or formation, makes the predicate or camera subject that
 * named it fail; nothing is substituted for it. Contract clocks must already be
 * admitted. Camera resolution runs outside the per-subject catch, so an invalid
 * review time or malformed moving-camera sample can throw here.
 *
 * @param props The contract, the compiled artifacts, and the design context.
 * @returns The realization record, and one `contract-realization-failed`
 *   diagnostic per slot collision, failing state, mismatched sample list,
 *   failing event, camera sample, formation and actor, in that order; an empty
 *   list means the contract is realized.
 */
export function realizeShotContract(
  props: IAutoMovieRealizeShotContractProps,
): IAutoMovieRealizeShotContract.IResult {
  const reader: IAutoMovieShotContractSubjectReader =
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
  const cameraInput: realizeShotCameraOutcome.IInput = {
    requiredSubjects: props.contract.camera.requiredSubjects,
    cameras: props.compiled.scene.cameras,
    camera: props.compiled.shot.camera,
    cameraMotion: props.compiled.shot.cameraMotion,
    frameFormat: props.production?.frameFormat ?? props.frameFormat,
  };
  const camera: ICameraOutcome[] = cameraTimes.map(
    (time: number): ICameraOutcome =>
      realizeShotCameraOutcome(cameraInput, reader, time),
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
 * Whether a compiled formation is the one compact runtime its design asks for:
 * the designed count, split between anonymous slots and heroes, and chunks
 * indexed in order that tile `[0, count)` without gaps.
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
    if (chunk.index !== index || chunk.start !== start || chunk.count <= 0)
      return false;
    start += chunk.count;
  }
  return start === design.count;
}

/**
 * Whether every promoted hero has a scene node within the declared transform
 * comparison tolerance, built from the design's model group.
 */
function heroesMaterialized(
  reader: IAutoMovieShotContractSubjectReader,
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
 * Whether two unit quaternions name the same rotation within the tolerance; `q`
 * and `-q` are the same rotation, so the absolute dot product is compared with
 * one.
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
