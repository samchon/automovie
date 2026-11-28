import { AutoMovieEngineHumanoidJointAxes, AutoMovieEngineHumanoidRestFrame, AutoMovieEngineSequence, AutoMovieEngineFilm } from "@automovie/engine";
import type {
  IAutoMovieAttachJob,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieCoupleObjects,
  IAutoMovieInteractionEvent,
  IAutoMovieMotion,
  IAutoMoviePose,
  IAutoMovieSceneNode,
  IAutoMovieSkeleton,
  IAutoMovieStagedSet,
} from "@automovie/interface";
import { strict as assert } from "node:assert";

import { FILM_MOUNT_WALK } from "../../internal/FILM_MOUNT_WALK";
import {
  IDENTITY_TRANSFORM,
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../../internal/fixtures";

function attach(
  child: string,
  parent: string,
  start: number = 0,
): IAutoMovieAttachJob {
  return {
    index: 1,
    action: {
      verb: "attachTo",
      actor: child,
      parent,
      bone: "leftHand",
      start,
      duration: "auto",
    },
  };
}
function mount(child: string, parent: string): IAutoMovieStagedSet.IMount {
  return { node: child, binding: { parent, bone: "leftHand" } };
}
function marker(
  clips: readonly IAutoMovieClip[],
  child: string,
  t: number,
): number[] {
  const clip: IAutoMovieClip | undefined = clips.find(
    (c: IAutoMovieClip): boolean =>
      c.tracks.some(
        (tr: IAutoMovieClip["tracks"][number]): boolean =>
          tr.channel.kind === "node" && tr.channel.node === child,
      ),
  );
  assert.ok(clip);
  return AutoMovieEngineSequence.sampleClip(clip, t).get(`node:${child}:translation`)!.value;
}
function point(actual: readonly number[], expected: readonly number[]): void {
  assert.equal(actual.length, expected.length);
  assert.ok(
    actual.every(
      (v: number, i: number): boolean => Math.abs(v - expected[i]!) <= 1e-9,
    ),
    JSON.stringify({ actual, expected }),
  );
}
/**
 * Coupled attachments resolve nested, persistent and explicit motion in order.
 *
 * Scenarios:
 *
 * 1. Carry a marker three levels deep and exercise a parent that first follows its
 *    staged position and then a moving rig.
 * 2. Contrast persistent, overridden and absent mounts. Validate cycles, missing
 *    rigs and missing mount bones.
 * 3. Supply clinical rest frames to both an explicit and a persistent hand
 *    attachment.
 *
 * @evidence contracts/development/common.md#meaningful-documentation The numbered cases describe nested followers, delayed parent authority, distinct mount branches and admission of clinical frame inputs.
 * @evidence contracts/development/testing.md#behavioral-verification The test couples prepared motion objects, samples resulting clips and reads reported violations. It varies staged and moving parents, persistent and explicit mounts, cycles and missing geometry.
 * @evidence contracts/development/testing.md#independent-expectations The authored chain and attachment offsets establish the three-level marker position. Staged placement holds until its motion starts. The declared absent rig or mount bone cannot supply a valid attachment target, and the fixture's explicit versus persistent hand options choose their own resting frames.
 */
export function test_engine_film_motion_coupling_graph(): void {
  const rig: IAutoMovieSkeleton = createSkeleton();
  const nodes: IAutoMovieSceneNode[] = [
    "carrier",
    "middle",
    "top",
    "marker",
  ].map(
    (id: string, index: number): IAutoMovieSceneNode => ({
      id,
      model: id,
      motion: null,
      pose: null,
      transform: {
        ...IDENTITY_TRANSFORM,
        translation: { x: index * 10, y: 0, z: 0 },
      },
    }),
  );
  const base: IAutoMovieCoupleObjects.IProps = {
    scene: { id: "studio", name: null, nodes, cameras: [], lights: [] },
    duration: 2,
    attachments: [],
    mounts: [],
    motions: { carrier: FILM_MOUNT_WALK },
    skeleton: (): IAutoMovieSkeleton => rig,
  };
  const chain: IAutoMovieCoupleObjects.IResult = AutoMovieEngineFilm.coupleObjects({
    ...base,
    mounts: [mount("top", "middle"), mount("middle", "carrier")],
    attachments: [attach("marker", "top")],
  });
  assert.deepEqual(chain.violations, []);
  assert.equal(chain.clips.length, 3);
  point(marker(chain.clips, "marker", 0), [3 * 0.75, 3 * 1.4, 0]);
  point(marker(chain.clips, "marker", 2), [2 + 3 * 0.75, 3 * 1.4, 0]);
  assert.deepEqual(
    chain.events.map((e: IAutoMovieInteractionEvent): readonly unknown[] => [
      e.kind,
      e.time,
      e.actionIndex,
    ]),
    [
      ["grab", 0, 1],
      ["attach", 0, 1],
      ["detach", 2, 1],
      ["release", 2, 1],
    ],
  );
  const delayed: IAutoMovieCoupleObjects.IResult = AutoMovieEngineFilm.coupleObjects({
    ...base,
    attachments: [attach("marker", "middle"), attach("middle", "carrier", 1)],
  });
  assert.deepEqual(delayed.violations, []);
  point(marker(delayed.clips, "marker", 0), [10.75, 1.4, 0]);
  point(marker(delayed.clips, "marker", 2), [3.5, 2.8, 0]);
  const fixed: IAutoMovieStagedSet.IMount = mount("marker", "carrier");
  const mounted: IAutoMovieCoupleObjects.IResult = AutoMovieEngineFilm.coupleObjects({
    ...base,
    mounts: [fixed],
  });
  assert.deepEqual(mounted.events, []);
  point(marker(mounted.clips, "marker", 2), [2.75, 1.4, 0]);
  const override: IAutoMovieCoupleObjects.IResult = AutoMovieEngineFilm.coupleObjects({
    ...base,
    mounts: [fixed],
    attachments: [attach("marker", "middle")],
  });
  assert.deepEqual(override.violations, []);
  assert.equal(override.clips.length, 1);
  point(marker(override.clips, "marker", 2), [10.75, 1.4, 0]);
  assert.deepEqual(AutoMovieEngineFilm.coupleObjects(base).clips, []);
  for (const cyclic of [
    { ...base, mounts: [mount("middle", "top"), mount("top", "middle")] },
    {
      ...base,
      attachments: [attach("middle", "top"), attach("top", "middle")],
    },
  ])
    assert.ok(
      AutoMovieEngineFilm.coupleObjects(cyclic).violations.some(
        (v: IAutoMovieConstraintViolation): boolean =>
          v.expected.includes("cycle"),
      ),
    );
  const broken: IAutoMovieCoupleObjects.IResult = AutoMovieEngineFilm.coupleObjects({
    ...base,
    mounts: [fixed],
    skeleton: (): null => null,
  });
  assert.ok(
    broken.violations.some((v: IAutoMovieConstraintViolation): boolean =>
      v.expected.includes("rigged"),
    ),
  );
  assert.ok(
    AutoMovieEngineFilm.coupleObjects({
      ...base,
      mounts: [
        { node: "marker", binding: { parent: "carrier", bone: "rightHand" } },
      ],
    }).violations.some((v: IAutoMovieConstraintViolation): boolean =>
      v.expected.includes("rightHand"),
    ),
  );
  const pose: IAutoMoviePose = makePose([
    joint("leftUpperArm", { abduction: 180 }),
  ]);
  const raised: IAutoMovieMotion = makeMotion(
    [keyframe(0, pose), keyframe(1, pose)],
    1,
  );
  for (const binding of [
    { mounts: [fixed], attachments: [] },
    { mounts: [], attachments: [attach("marker", "carrier")] },
  ]) {
    const clinical: IAutoMovieCoupleObjects.IResult = AutoMovieEngineFilm.coupleObjects({
      ...base,
      ...binding,
      motions: { carrier: raised },
      jointAxes: () => AutoMovieEngineHumanoidJointAxes,
      restFrames: () => AutoMovieEngineHumanoidRestFrame,
    });
    assert.deepEqual(clinical.violations, []);
    point(marker(clinical.clips, "marker", 0.5), [0.2, 1.95, 0]);
  }
}
