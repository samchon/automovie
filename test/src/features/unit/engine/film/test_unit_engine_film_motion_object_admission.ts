import { gateAuthoredObjectMotions } from "@automovie/engine";
import type {
  IAutoMovieClip,
  IAutoMovieConstraintViolation,
  IAutoMovieObjectMotionGate,
  IAutoMoviePropSpec,
  IAutoMovieSceneNode,
  IAutoMovieTrack,
} from "@automovie/interface";
import { strict as assert } from "node:assert";

import { createDoorPropSpec } from "../../../internal/createDoorPropSpec";
import { IDENTITY_TRANSFORM } from "../../../internal/fixtures";
import { swingClip } from "../../../internal/swingClip";
import { yQuat } from "../../../internal/yQuat";

function placement(id: string, model: string = id): IAutoMovieSceneNode {
  return { id, model, transform: IDENTITY_TRANSFORM, motion: null, pose: null };
}
interface IAdmission {
  props?: readonly IAutoMoviePropSpec[];
  nodes?: IAutoMovieSceneNode[];
}
function gate(
  clips: readonly IAutoMovieClip[],
  override: IAdmission = {},
): IAutoMovieConstraintViolation[] {
  const input: IAutoMovieObjectMotionGate = {
    scene: {
      id: "hall",
      name: null,
      nodes: [
        placement("keeper"),
        placement("tag"),
        ...(override.nodes ?? [
          placement("doorway", "door"),
          placement("panel"),
        ]),
      ],
      cameras: [],
      lights: [],
    },
    props: override.props ?? [createDoorPropSpec()],
    clips,
    baked: [swingClip("attach:tag", "tag", 0)],
    performed: new Set(["keeper"]),
    duration: 2,
    path: "$input.objectMotions",
  };
  return gateAuthoredObjectMotions(input);
}
function rejects(
  clips: readonly IAutoMovieClip[],
  expected: string,
  override: IAdmission = {},
): void {
  const violations: IAutoMovieConstraintViolation[] = gate(clips, override);
  assert.ok(
    violations.some(
      (v: IAutoMovieConstraintViolation): boolean =>
        v.severity === "error" &&
        v.path.startsWith("$input.objectMotions") &&
        v.expected.includes(expected),
    ),
    JSON.stringify(violations),
  );
}

/**
 * 1. Check stage and lowered joint addresses, duplicates, performed and baked
 *    authority against independent registrations.
 * 2. Check clock and artifact validity. Legal neighbouring channels remain
 *    admissible.
 * 3. Compare symmetric turns to their analytic quaternion midpoint, a held step,
 *    an inclusive boundary and a later authority.
 */
export function test_unit_engine_film_motion_object_admission(): void {
  const joint: string = "doorway/hinge";
  const open: IAutoMovieClip = swingClip("open", joint, 90);
  const panel: IAutoMovieClip = swingClip("panel-turn", "panel", 90);
  const absent: string =
    "neither a staged scene node nor a lowered prop articulation joint";
  assert.deepEqual(gate([open, panel]), []);
  for (const id of ["missing", "doorway/missing"])
    rejects([swingClip("open", id, 90)], absent);
  rejects([open], absent, { props: [] });
  assert.deepEqual(gate([panel], { props: [] }), []);
  const bad: IAutoMoviePropSpec = createDoorPropSpec();
  bad.model.id = "different";
  rejects([open], absent, { props: [bad] });
  assert.deepEqual(
    gate([open], { props: [createDoorPropSpec(), createDoorPropSpec()] }),
    [],
  );
  for (const id of ["constructor", "__proto__", "toString"]) {
    const prop: IAutoMoviePropSpec = createDoorPropSpec();
    prop.node = id;
    prop.model.id = id;
    assert.deepEqual(
      gate([open], { props: [prop], nodes: [placement("doorway", id)] }),
      [],
    );
  }
  rejects([open], "twice", {
    nodes: [placement("doorway", "door"), placement(joint)],
  });
  rejects(
    [swingClip("performer", "keeper", 90)],
    "driven by this shot's performance",
  );
  rejects(
    [{ ...panel, id: "attach:tag" }],
    "collides with a clip this shot baked",
  );
  rejects([swingClip("turn", "tag", 90)], "already driven");
  assert.deepEqual(
    gate([
      swingClip("resize", "tag", 0, {
        channel: { kind: "node", node: "tag", path: "scale" },
        values: [1, 1, 1],
      }),
    ]),
    [],
  );
  rejects(
    [open, { ...panel, id: open.id }],
    "duplicates $input.objectMotions[0].id",
  );
  rejects(
    [swingClip("late", joint, 0, { times: [open.duration + 1] })],
    "inside the shot's own clock",
  );
  rejects(
    [
      swingClip("spline", joint, 0, {
        interpolation: "cubicspline",
        values: [...yQuat(0), ...yQuat(0), ...yQuat(0)],
      }),
    ],
    "step or linear",
  );
  rejects(
    [
      swingClip("dim", joint, 0, {
        channel: {
          kind: "pointer",
          pointer: "/lights/fill/intensity",
          valueType: "scalar",
        },
        values: [1],
      }),
    ],
    'channel kind must be "node"',
  );
  for (const angle of [1, 90]) {
    const spec: IAutoMoviePropSpec = createDoorPropSpec();
    assert.ok(spec.articulation);
    const limit: number = (1 + Math.cos((angle * Math.PI) / 360)) / 2;
    spec.articulation.profile.drivers = [];
    spec.articulation.profile.limits = [
      {
        channel: { kind: "node", node: "pivot", path: "rotation" },
        min: null,
        max: [null, null, null, limit],
      },
    ];
    const continuous: IAutoMovieClip = swingClip("swing", joint, -angle, {
      times: [0, 2],
      values: [...yQuat(-angle), ...yQuat(angle)],
    });
    const profile: IAdmission = { props: [spec] };
    rejects([continuous], "past the travel profile", profile);
    const turn: IAutoMovieTrack = continuous.tracks[0]!;
    rejects(
      [
        {
          ...continuous,
          loop: true,
          duration: 0.001,
          tracks: [{ ...turn, times: [0, 0.001] }],
        },
      ],
      "past the travel profile",
      profile,
    );
    assert.deepEqual(
      gate(
        [{ ...continuous, tracks: [{ ...turn, interpolation: "step" }] }],
        profile,
      ),
      [],
    );
    assert.deepEqual(
      gate([continuous, swingClip("override", joint, -angle)], profile),
      [],
    );
    assert.deepEqual(gate([panel], profile), []);
    spec.articulation.profile.limits[0]!.max = [null, null, null, 1];
    assert.deepEqual(gate([continuous], profile), []);
  }
  const excess: IAutoMovieClip = swingClip("excess", joint, 150, {
    times: [0, 1],
    values: [...yQuat(150), ...yQuat(150)],
  });
  const breaches: IAutoMovieConstraintViolation[] = gate([excess]).filter(
    (v: IAutoMovieConstraintViolation): boolean =>
      v.expected.includes("door-profile"),
  );
  assert.equal(breaches.length, 1);
  assert.deepEqual(gate([swingClip("inside", joint, 109)]), []);
}
