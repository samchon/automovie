import { TestValidator } from "@nestia/e2e";
import { publishViewerCompletedFrame, type IAutoMovieViewerCompletedFrame } from "@automovie/viewer";
import * as THREE from "three";

/**
 * Explicit completed redraws require a fresh snapshot even with unchanged
 * scene/camera/clock facts. Ordinary idle producers keep their classification.
 * This tests the public native-event output port, without a renderer or Human.
 * Scenarios:
 * 1. Repeated explicit completion of the same frame emits meaningful signals.
 * 2. Ordinary idle, eager and changed completions preserve producer authority.
 * 3. Unsubscribed or unavailable event ports perform no delivery.
 */
export const test_viewer_completed_frame_signal = (): void => {
  const frame: IAutoMovieViewerCompletedFrame = {
    scene: new THREE.Scene(), camera: new THREE.PerspectiveCamera(),
    pass: "beauty", elapsedSeconds: 3.7, changed: false,
  };
  const delivered: IAutoMovieViewerCompletedFrame[] = [];
  const events = new EventTarget();
  const NativeFrameEvent = CustomEvent<IAutoMovieViewerCompletedFrame>;
  events.addEventListener("automovie:completed-frame", (event) => {
    TestValidator.predicate("standard completed-frame event", event instanceof NativeFrameEvent);
    if (event instanceof NativeFrameEvent) delivered.push(event.detail);
  });
  const canvas: Parameters<typeof publishViewerCompletedFrame>[0] = {
    getAttribute: () => "on",
    dispatchEvent: (event): boolean => events.dispatchEvent(event),
  };
  publishViewerCompletedFrame(canvas, frame, true);
  publishViewerCompletedFrame(canvas, frame, true);
  TestValidator.equals("every explicit original draw is meaningful", delivered.map((value) => value.changed), [true, true]);
  TestValidator.predicate("native scene and camera remain owned", delivered.every((value) => value.scene === frame.scene && value.camera === frame.camera));
  TestValidator.equals("producer's idle classification is not mutated", frame.changed, false);
  publishViewerCompletedFrame(canvas, frame);
  TestValidator.predicate("ordinary idle frame preserves producer identity", delivered[2] === frame);
  const eager = { ...frame, changed: undefined };
  publishViewerCompletedFrame(canvas, eager);
  TestValidator.predicate("ordinary eager frame is retained", delivered[3] === eager);
  const changed = { ...frame, changed: true };
  publishViewerCompletedFrame(canvas, changed, false);
  TestValidator.predicate("ordinary meaningful frame is retained", delivered[4] === changed);
  publishViewerCompletedFrame({ ...canvas, getAttribute: () => null }, frame, true);
  publishViewerCompletedFrame({}, frame, true);
  publishViewerCompletedFrame({ getAttribute: () => "on" }, frame, true);
  TestValidator.equals("missing or unsubscribed ports do not deliver", delivered.length, 5);
};
