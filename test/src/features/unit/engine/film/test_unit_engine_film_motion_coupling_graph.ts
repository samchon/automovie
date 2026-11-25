import {
  HUMANOID_JOINT_AXES,
  HUMANOID_REST_FRAME,
  coupleObjects,
  sampleClip,
} from "@automovie/engine";
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

import { FILM_MOUNT_WALK } from "../../../internal/FILM_MOUNT_WALK";
import {
  IDENTITY_TRANSFORM,
  createSkeleton,
  joint,
  keyframe,
  makeMotion,
  makePose,
} from "../../../internal/fixtures";

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
  return sampleClip(clip, t).get(`node:${child}:translation`)!.value;
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
 * 1. Carry a marker three levels deep and exercise a parent that first follows its staged position and then a moving rig.
 * 2. Contrast persistent, overridden and absent mounts. Validate cycles, missing rigs and missing mount bones.
 * 3. Supply clinical rest frames to both an explicit and a persistent hand attachment.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Describes support chains, clocks, overrides and refusals.
 * @evidence contracts/development/testing.md#behavioral-verification Calls the public coupling owner and reads the actual follow tracks, events and refusals without a performed shot.
 * @evidence contracts/development/testing.md#independent-expectations Every neutral rig's hand offset is (0.75,1.4,0); adding three offsets and the carrier's 1 m/s displacement gives both endpoints. A late coupling initially inherits its staged parent.
 * @evidence contracts/development/testing.md#distinguishing-cases Contrasts one and three links, an inactive and active ancestor, mount override and cycles in persistent and active edges.
 * @evidence contracts/development/testing.md#execution-ownership Uses portable authored rig data and direct engine calls.
 */
export function test_unit_engine_film_motion_coupling_graph(): void {
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
  const chain: IAutoMovieCoupleObjects.IResult = coupleObjects({
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
  const delayed: IAutoMovieCoupleObjects.IResult = coupleObjects({
    ...base,
    attachments: [attach("marker", "middle"), attach("middle", "carrier", 1)],
  });
  assert.deepEqual(delayed.violations, []);
  point(marker(delayed.clips, "marker", 0), [10.75, 1.4, 0]);
  point(marker(delayed.clips, "marker", 2), [3.5, 2.8, 0]);
  const fixed: IAutoMovieStagedSet.IMount = mount("marker", "carrier");
  const mounted: IAutoMovieCoupleObjects.IResult = coupleObjects({
    ...base,
    mounts: [fixed],
  });
  assert.deepEqual(mounted.events, []);
  point(marker(mounted.clips, "marker", 2), [2.75, 1.4, 0]);
  const override: IAutoMovieCoupleObjects.IResult = coupleObjects({
    ...base,
    mounts: [fixed],
    attachments: [attach("marker", "middle")],
  });
  assert.deepEqual(override.violations, []);
  assert.equal(override.clips.length, 1);
  point(marker(override.clips, "marker", 2), [10.75, 1.4, 0]);
  assert.deepEqual(coupleObjects(base).clips, []);
  for (const cyclic of [
    { ...base, mounts: [mount("middle", "top"), mount("top", "middle")] },
    {
      ...base,
      attachments: [attach("middle", "top"), attach("top", "middle")],
    },
  ])
    assert.ok(
      coupleObjects(cyclic).violations.some(
        (v: IAutoMovieConstraintViolation): boolean =>
          v.expected.includes("cycle"),
      ),
    );
  const broken: IAutoMovieCoupleObjects.IResult = coupleObjects({
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
    coupleObjects({
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
    const clinical: IAutoMovieCoupleObjects.IResult = coupleObjects({
      ...base,
      ...binding,
      motions: { carrier: raised },
      jointAxes: () => HUMANOID_JOINT_AXES,
      restFrames: () => HUMANOID_REST_FRAME,
    });
    assert.deepEqual(clinical.violations, []);
    point(marker(clinical.clips, "marker", 0.5), [0.2, 1.95, 0]);
  }
}
