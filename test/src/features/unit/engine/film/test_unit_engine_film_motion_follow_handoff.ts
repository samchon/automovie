import { coupleObjects, resolveBeatSnapshot } from "@automovie/engine";
import type {
  IAutoMovieAttachJob,
  IAutoMovieBeatEndActorState,
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieCoupleObjects,
  IAutoMoviePerformedShot,
  IAutoMovieResolveBeatProps,
  IAutoMovieSceneNode,
  IAutoMovieSkeleton,
} from "@automovie/interface";
import { strict as assert } from "node:assert";

import { FILM_MOUNT_WALK } from "../../../internal/FILM_MOUNT_WALK";
import { IDENTITY_TRANSFORM, createSkeleton } from "../../../internal/fixtures";
import { performMarkerMotion } from "../../../internal/performMarkerMotion";

/**
 * 1. Hand off a marker from a stationary rig to a moving one; determine its final
 *    position and velocity from the later interval.
 * 2. Compare persistent binding and the active history of a rider just before,
 *    exactly at and just after its own start.
 * 3. Submit malformed attachment calls to the public action admission path.
 */
export function test_unit_engine_film_motion_follow_handoff(): void {
  const rig: IAutoMovieSkeleton = createSkeleton();
  const nodes: IAutoMovieSceneNode[] = [
    "station",
    "carrier",
    "marker",
    "spare",
  ].map(
    (id: string): IAutoMovieSceneNode => ({
      id,
      model: id,
      motion: null,
      pose: null,
      transform: {
        ...IDENTITY_TRANSFORM,
        translation: { x: id === "station" ? 10 : 0, y: 0, z: 0 },
      },
    }),
  );
  const base: IAutoMovieCoupleObjects.IProps = {
    scene: { id: "studio", name: null, nodes, cameras: [], lights: [] },
    mounts: [],
    attachments: [],
    motions: { carrier: FILM_MOUNT_WALK },
    skeleton: (): IAutoMovieSkeleton => rig,
    duration: 2,
  };
  const jobs: IAutoMovieAttachJob[] = ["station", "carrier"].map(
    (parent: string, index: number): IAutoMovieAttachJob => ({
      index,
      action: {
        verb: "attachTo",
        actor: "marker",
        parent,
        bone: "leftHand",
        start: index,
        duration: 1,
      },
    }),
  );
  const handoff: IAutoMovieCoupleObjects.IResult = coupleObjects({
    ...base,
    attachments: jobs,
  });
  assert.deepEqual(handoff.violations, []);
  assert.deepEqual(
    handoff.clips.map((c: IAutoMovieClip): string => c.id),
    ["attach:marker", "attach:marker:2"],
  );
  const boundary: IAutoMovieResolveBeatProps = {
    beat: "calibration",
    scene: base.scene,
    motions: [FILM_MOUNT_WALK],
    shot: {
      id: "take",
      name: null,
      scene: "studio",
      camera: "camera",
      cameraMotion: null,
      objectMotions: handoff.clips,
      performances: [],
      duration: 2,
    },
  };
  function actor(
    input: IAutoMovieResolveBeatProps,
    id: string,
  ): IAutoMovieBeatEndActorState {
    const state: IAutoMovieBeatEndActorState | undefined = resolveBeatSnapshot(
      input,
      2,
    ).actors.find((a: IAutoMovieBeatEndActorState): boolean => a.node === id);
    assert.ok(state);
    return state;
  }
  for (const clips of [
    handoff.clips,
    handoff.clips.map(
      (c: IAutoMovieClip, index: number): IAutoMovieClip => ({
        ...c,
        id: String(index),
      }),
    ),
  ]) {
    const end: IAutoMovieBeatEndActorState = actor(
      { ...boundary, shot: { ...boundary.shot, objectMotions: clips } },
      "marker",
    );
    assert.deepEqual(end.transform.translation, { x: 2.75, y: 1.4, z: 0 });
    assert.ok(end.rootVelocity && Math.abs(end.rootVelocity.x - 1) <= 1e-9);
    assert.equal(end.mount, null);
  }
  assert.deepEqual(actor(boundary, "spare").transform.translation, {
    x: 0,
    y: 0,
    z: 0,
  });
  const binding: IAutoMovieCoupleObjects.IProps["mounts"] = [
    { node: "marker", binding: { parent: "carrier", bone: "leftHand" } },
  ];
  const mounted: IAutoMovieCoupleObjects.IResult = coupleObjects({
    ...base,
    mounts: binding,
  });
  const offsets: ReadonlyArray<[number, number]> = [
    [2, 0],
    [3, 0],
    [1.995, 1],
  ];
  for (const [startOffset, velocity] of offsets) {
    const state: IAutoMovieBeatEndActorState = actor(
      {
        ...boundary,
        mounts: binding,
        shot: {
          ...boundary.shot,
          objectMotions: mounted.clips,
          performances: [
            { node: "marker", motion: FILM_MOUNT_WALK.id, startOffset },
          ],
        },
      },
      "marker",
    );
    assert.deepEqual(state.mount, binding[0]!.binding);
    assert.ok(
      state.rootVelocity &&
        Math.abs(state.rootVelocity.x - velocity) <= 1e-9 &&
        state.rootVelocity.y === 0 &&
        state.rootVelocity.z === 0,
    );
  }
  const valid: IAutoMovieAttachJob["action"] = {
    verb: "attachTo",
    actor: "tag",
    parent: "keeper",
    bone: "leftHand",
    start: 0,
    duration: "auto",
  };
  function rejects(
    change: Partial<IAutoMovieAttachJob["action"]>,
    field: string,
  ): void {
    const out: IAutoMoviePerformedShot = performMarkerMotion([], [], [], {
      ...valid,
      ...change,
    });
    assert.ok(
      !out.success &&
        out.violations.some((v: IAutoMovieConstraintViolation): boolean =>
          v.path.includes(field),
        ),
      JSON.stringify(out.success ? [] : out.violations),
    );
  }
  rejects({ parent: "absent" }, "parent");
  rejects({ actor: "keeper", parent: "tag" }, "parent");
  rejects({ bone: "rightHand" }, "bone");
  rejects({ actor: "keeper" }, "actor");
  rejects({ start: 2 }, "duration");
}
