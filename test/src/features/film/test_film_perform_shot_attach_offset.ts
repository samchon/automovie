import {
  performShot,
  sampleClip,
  sampleClipSequence,
  stageScene,
} from "@automovie/engine";
import type {
  IAutoMovieActionCall,
  IAutoMovieAttachAction,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMoviePerformedShot,
  IAutoMovieQuaternion,
  IAutoMovieSkeleton,
  IAutoMovieStage,
  IAutoMovieStageActor,
  IAutoMovieStagedSet,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { createFilmAttachScript } from "../internal/createFilmAttachScript";
import { createFilmAttachStage } from "../internal/createFilmAttachStage";
import { makePerformanceWrite } from "../internal/filmFixtures";
import { createSkeleton } from "../internal/fixtures";
import { qclose, vclose } from "../internal/predicates";

/**
 * Bone-local offsets make a prop's authored handoff continuous across a parent change.
 *
 * Scenarios:
 * 1. An omitted offset places the child at the first parent's posed bone.
 * 2. Oppositely facing parents with matching local offsets agree in world position and rotation at the handoff.
 * 3. A different receiving offset takes effect at the switch.
 * 4. A nonunit quaternion returns an offset finding.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Names the legacy, continuous and discontinuous handoffs and invalid input cases.
 * @evidence contracts/development/testing.md#behavioral-verification Authors through performShot, compares both baked boundary keys and sequence playback, changes the receiving offset and checks validation output for malformed offsets.
 * @evidence contracts/development/testing.md#independent-expectations Fixture hips are at (0,1,0). The parent's half-turn around Y changes local -X to world +X; its product with the second offset's quaternion yields the first offset's quarter-turn about X. Expected coordinates and quaternion components are specified by hand without FK or transform helpers.
 * @evidence contracts/development/testing.md#distinguishing-cases The legacy pose, rotated translation, noncommuting orientation factors, shared endpoint, authored change in world pose and both structural and numeric violations distinguish omission, misordered composition and unchecked offsets.
 * @evidence contracts/development/testing.md#execution-ownership A synchronous test uses stage and shot entry points and their pure clip readers without hosts.
 */
export function test_film_perform_shot_attach_offset(): void {
  const stage: IAutoMovieStage = createFilmAttachStage();
  const staged: IAutoMovieStagedSet = stageScene(createFilmAttachScript(), {
    ...stage,
    actors: stage.actors.map(
      (actor: IAutoMovieStageActor): IAutoMovieStageActor =>
        actor.node === "shield"
          ? { ...actor, position: { x: 0, y: 0, z: 0 }, facingDeg: 180 }
          : actor,
    ),
  });
  if (staged.success !== true) throw new Error("staging must succeed");

  const perform = (draft: IAutoMovieActionCall[]): IAutoMoviePerformedShot =>
    performShot({
      script: createFilmAttachScript(),
      staged,
      performance: makePerformanceWrite({
        beat: "beat-1",
        draft,
        revise: {
          review: "Check the prop's frame as the support changes.",
          final: null,
        },
        duration: 2,
      }),
      synthesize: (): null => null,
      skeleton: (node: string): IAutoMovieSkeleton | null =>
        node === "sword" ? null : createSkeleton(),
    });

  const first: IAutoMovieAttachAction = {
    verb: "attachTo",
    actor: "sword",
    parent: "knight",
    bone: "hips",
    start: 0,
    duration: 1,
  };
  /** Compare both channels against the independently authored world frame. */
  const keyMatches = (
    values: ReturnType<typeof sampleClip>,
    position: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): boolean => {
    const p: number[] | undefined = values.get("node:sword:translation")?.value;
    const q: number[] | undefined = values.get("node:sword:rotation")?.value;
    return (
      p !== undefined &&
      q !== undefined &&
      vclose({ x: p[0]!, y: p[1]!, z: p[2]! }, position, 1e-9) &&
      qclose({ x: q[0]!, y: q[1]!, z: q[2]!, w: q[3]! }, rotation, 1e-9)
    );
  };

  const legacy: IAutoMoviePerformedShot = perform([first]);
  if (legacy.success !== true)
    throw new Error("legacy attachment must perform");
  TestValidator.predicate(
    "an omitted offset uses the posed bone frame",
    keyMatches(
      sampleClipSequence(legacy.shot.objectMotions, 0.5),
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 0, w: 1 },
    ),
  );

  const half: number = Math.SQRT1_2;
  const expectedPosition: IAutoMovieVector3 = { x: 1, y: 1, z: 0 };
  const expectedRotation: IAutoMovieQuaternion = {
    x: half,
    y: 0,
    z: 0,
    w: half,
  };
  const outgoing: IAutoMovieAttachAction = {
    ...first,
    offset: { position: { x: 1, y: 0, z: 0 }, rotation: expectedRotation },
  };
  const incoming: IAutoMovieAttachAction = {
    ...first,
    parent: "shield",
    start: 1,
    offset: {
      position: { x: -1, y: 0, z: 0 },
      rotation: { x: 0, y: -half, z: half, w: 0 },
    },
  };
  const transfer: IAutoMoviePerformedShot = perform([outgoing, incoming]);
  if (transfer.success !== true) throw new Error("the handoff must perform");
  const clips: IAutoMovieClip[] = transfer.shot.objectMotions;
  TestValidator.equals("both attachment clips are present", clips.length, 2);
  for (const clip of clips)
    TestValidator.predicate(
      `${clip.id} lands at the same authored world frame at the handoff`,
      keyMatches(sampleClip(clip, 1), expectedPosition, expectedRotation),
    );
  for (const seconds of [0.99, 1.01])
    TestValidator.predicate(
      `playback preserves the authored world frame at ${seconds} seconds`,
      keyMatches(
        sampleClipSequence(clips, seconds),
        expectedPosition,
        expectedRotation,
      ),
    );

  const changed: IAutoMoviePerformedShot = perform([
    outgoing,
    {
      ...incoming,
      offset: {
        position: { x: -2, y: 0, z: 0 },
        rotation: incoming.offset!.rotation,
      },
    },
  ]);
  if (changed.success !== true)
    throw new Error("the changed offset must perform");
  TestValidator.predicate(
    "the receiving offset determines the world frame at the first key",
    keyMatches(
      sampleClipSequence(changed.shot.objectMotions, 1),
      { x: 2, y: 1, z: 0 },
      expectedRotation,
    ),
  );

  const rejected: IAutoMoviePerformedShot = perform([
    {
      ...first,
      offset: {
        position: { x: 0, y: 0, z: 0 },
        rotation: { x: 0, y: 0, z: 0, w: 2 },
      },
    },
  ]);
  if (rejected.success !== false) throw new Error("invalid offsets must fail");
  TestValidator.predicate(
    "a violation identifies [0].offset.rotation",
    rejected.violations.some((issue: IAutoMovieConstraintViolation): boolean =>
      issue.path.endsWith("[0].offset.rotation"),
    ),
  );
}