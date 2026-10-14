import { TestValidator } from "@nestia/e2e";
import { publishViewerCompletedFrame, type IAutoMovieViewerCompletedFrame } from "@automovie/viewer";
import * as THREE from "three";

/**
 * Explicit completed redraws emit a fresh meaningful event even when scene, camera and clock facts are unchanged; ordinary producers retain their classification. The public native-event port is observed without a renderer or Human fixture.
 * Scenarios:
 * 1. Repeated explicit completion of the same frame emits meaningful signals.
 * 2. Ordinary idle, eager and changed completions preserve producer authority.
 * 3. Unsubscribed or unavailable event ports perform no delivery.
 *
 * @evidence contracts/testing.md#behavioral-verification Calls the public completed-frame publisher and observes dispatched native events. Explicit completions must emit fresh meaningful records without mutating the producer's frame, while ordinary completion retains its identity and classification.
 * @evidence contracts/testing.md#independent-expectations Authored frame identity and opt-in attribute values define delivery expectations; the listener inspects actual event detail rather than using publisher output to construct an oracle. Scene/camera references are ownership checks, not visual rendering evidence.
 * @evidence contracts/testing.md#distinguishing-cases Exercises repeated explicit completion, ordinary idle/undefined/changed classifications, and absent subscription or dispatch capability. The five admitted events contrast with three non-delivering port shapes; completed bitmap production belongs to renderer consumers.
 * @evidence contracts/testing.md#execution-ownership The named portable unit uses the runtime EventTarget and CustomEvent APIs plus a minimal supplied canvas port. It starts no browser or GPU and owns all listener assertions locally without dynamic test registration.
 */
export function test_viewer_completed_frame_signal(): void {
  const frame: IAutoMovieViewerCompletedFrame = {
    scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(),
    pass: "beauty", elapsedSeconds: 3.7, changed: false,
  };
  const delivered: IAutoMovieViewerCompletedFrame[] = [];
  const events: EventTarget = new EventTarget();
  const NativeFrameEvent: typeof CustomEvent<IAutoMovieViewerCompletedFrame> = CustomEvent<IAutoMovieViewerCompletedFrame>;
  events.addEventListener("automovie:completed-frame", (event: Event): void => {
    TestValidator.predicate("standard completed-frame event", event instanceof NativeFrameEvent);
    if (event instanceof NativeFrameEvent) delivered.push(event.detail);
  });
  const canvas: Parameters<typeof publishViewerCompletedFrame>[0] = {
    getAttribute: (): string => "on",
    dispatchEvent: (event: Event): boolean => events.dispatchEvent(event),
  };
  publishViewerCompletedFrame(canvas, frame, true);
  publishViewerCompletedFrame(canvas, frame, true);
  TestValidator.equals("every explicit original draw is meaningful", delivered.map((value: IAutoMovieViewerCompletedFrame): boolean | undefined => value.changed), [true, true]);
  TestValidator.predicate("native scene and camera remain owned", delivered.every((value: IAutoMovieViewerCompletedFrame): boolean => value.scene === frame.scene && value.camera === frame.camera));
  TestValidator.equals("producer's idle classification is not mutated", frame.changed, false);
  publishViewerCompletedFrame(canvas, frame);
  TestValidator.predicate("ordinary idle frame preserves producer identity", delivered[2] === frame);
  const eager: IAutoMovieViewerCompletedFrame = { ...frame, changed: undefined };
  publishViewerCompletedFrame(canvas, eager);
  TestValidator.predicate("ordinary eager frame is retained", delivered[3] === eager);
  const changed: IAutoMovieViewerCompletedFrame = { ...frame, changed: true };
  publishViewerCompletedFrame(canvas, changed, false);
  TestValidator.predicate("ordinary meaningful frame is retained", delivered[4] === changed);
  publishViewerCompletedFrame({ ...canvas, getAttribute: (): null => null }, frame, true);
  publishViewerCompletedFrame({}, frame, true);
  publishViewerCompletedFrame({ getAttribute: (): string => "on" }, frame, true);
  TestValidator.equals("missing or unsubscribed ports do not deliver", delivered.length, 5);
}
