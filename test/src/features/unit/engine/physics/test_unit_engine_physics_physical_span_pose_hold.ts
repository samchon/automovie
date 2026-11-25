import {
  type IAutoMoviePhysicalBinding,
  physicalSpanPose,
} from "@automovie/engine";
import type { IAutoMoviePhysicalRecoveryState } from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * A disturbance response is prepared once and held by its owner
 * (`physicalSpanPose.play`):
 *
 * 1. Over a span's substeps the binding holds one prepared response, the same
 *    object at every substep, as the recovery state's recorded inputs keep
 *    their identity.
 * 2. A restore, which clones the state, prepares it once again: a new response on
 *    the first substep after, then that one held, sampling the same values.
 * 3. Before the push and after the response settles, nothing plays.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the hold, the restore and the play window.
 * @evidence contracts/development/testing.md#behavioral-verification Calls `physicalSpanPose.play` and reads the binding and the samples.
 * @evidence contracts/development/testing.md#independent-expectations Identity and equality of the held response; the window from the recorded push and the response's own settling time.
 * @evidence contracts/development/testing.md#distinguishing-cases Separates holding from preparing again, and a restore from a continuing run.
 * @evidence contracts/development/testing.md#execution-ownership Pure functions in memory; no world or simulation run.
 */
export function test_unit_engine_physics_physical_span_pose_hold(): void {
  const failures: string[] = [];
  const sole = (x: number) => ({
    origin: { x, z: 0 },
    forward: { x: 0, z: 1 },
  });
  const polygon = [
    { x: -0.12, y: -0.05 },
    { x: 0.12, y: -0.05 },
    { x: 0.12, y: 0.05 },
    { x: -0.12, y: 0.05 },
  ];
  const state: IAutoMoviePhysicalRecoveryState = {
    last: "supported",
    steps: [],
    offsets: {},
    span: {
      seconds: 1,
      center: { x: 0, y: 0.9, z: 0 },
      velocity: { x: 0, y: 0, z: 0.3 },
      omega: Math.sqrt(9.81 / 0.9),
      mass: 70,
      gravity: 9.81,
      feet: [
        { bone: "left", side: "left", frame: sole(0.1), polygon },
        { bone: "right", side: "right", frame: sole(-0.1), polygon },
      ],
      authored: { position: { x: 0, z: 0 }, velocity: { x: 0, z: 0 } },
      maximumStep: 0.6,
      floor: 0,
    },
  };
  // A binding without actual poses: the response is handable at once.
  const bound: Pick<IAutoMoviePhysicalBinding, "spans" | "segments"> = {
    spans: new Map(),
    segments: new Map(),
  };
  const body: Parameters<typeof physicalSpanPose.play>[1] = {
    id: "body",
    profile: { joints: [] },
  };
  const dt: number = 1 / 3840;

  // 1. One prepared response held over the substeps.
  TestValidator.equals(
    "before the push",
    physicalSpanPose.play(bound, body, state, 1),
    undefined,
  );
  physicalSpanPose.play(bound, body, state, 1 + dt);
  const first = bound.spans.get("body");
  for (let i: number = 2; i < 64; ++i) {
    physicalSpanPose.play(bound, body, { ...state }, 1 + i * dt);
    if (bound.spans.get("body") !== first)
      failures.push(`prepared again at substep ${i}`);
  }

  // 2. A restore prepares it once again, then holds that one.
  const restored: IAutoMoviePhysicalRecoveryState = structuredClone(state);
  const before = physicalSpanPose.play(bound, body, state, 1 + 64 * dt);
  const after = physicalSpanPose.play(bound, body, restored, 1 + 64 * dt);
  const second = bound.spans.get("body");
  if (second === first) failures.push("a restore was not prepared again");
  physicalSpanPose.play(bound, body, restored, 1 + 65 * dt);
  if (bound.spans.get("body") !== second)
    failures.push("the restored response was prepared again");
  TestValidator.equals("restored sample", after, before);

  // 3. Nothing plays once the response has settled.
  const until: number = second!.span.until;
  if (physicalSpanPose.play(bound, body, restored, until + dt) !== undefined)
    failures.push("a settled response still plays");
  TestValidator.equals("span hold", failures, []);
}
