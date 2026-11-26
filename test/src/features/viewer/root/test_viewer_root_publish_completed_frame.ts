import {
  AutoMovieViewerDisplay,
  type IAutoMovieViewerCompletedFrame,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * Repeated explicit completed redraws emit meaningful events even when scene,
 * camera and clock facts are unchanged; ordinary producers retain their
 * classification. The public native-event port is observed without a renderer
 * or Human fixture. Scenarios:
 *
 * 1. Repeated explicit completion of the same frame emits meaningful signals.
 * 2. Ordinary idle, eager and changed completions preserve producer authority.
 * 3. Unsubscribed or unavailable event ports perform no delivery.
 */
export function test_viewer_root_publish_completed_frame(): void {
  const frame: IAutoMovieViewerCompletedFrame = {
    scene: new THREE.Scene(),
    camera: new THREE.PerspectiveCamera(),
    pass: "beauty",
    elapsedSeconds: 3.7,
    changed: false,
  };
  const delivered: IAutoMovieViewerCompletedFrame[] = [];
  const types: string[] = [];
  const canvas: AutoMovieViewerDisplay.IFrameCanvas = {
    getAttribute: (): string => "on",
    dispatchEvent: (
      event: CustomEvent<IAutoMovieViewerCompletedFrame>,
    ): boolean => {
      types.push(event.type);
      delivered.push(event.detail);
      return true;
    },
  };
  AutoMovieViewerDisplay.publishCompletedFrame({ canvas, frame, explicitDraw: true });
  AutoMovieViewerDisplay.publishCompletedFrame({ canvas, frame, explicitDraw: true });
  TestValidator.equals("the completed-frame event", types, [
    "automovie:completed-frame",
    "automovie:completed-frame",
  ]);
  TestValidator.equals(
    "every explicit original draw is meaningful",
    delivered.map(
      (value: IAutoMovieViewerCompletedFrame): boolean | undefined =>
        value.changed,
    ),
    [true, true],
  );
  TestValidator.predicate(
    "native scene and camera remain owned",
    delivered.every(
      (value: IAutoMovieViewerCompletedFrame): boolean =>
        value.scene === frame.scene && value.camera === frame.camera,
    ),
  );
  TestValidator.equals(
    "producer's idle classification is not mutated",
    frame.changed,
    false,
  );
  AutoMovieViewerDisplay.publishCompletedFrame({ canvas, frame });
  TestValidator.predicate(
    "ordinary idle frame preserves producer identity",
    delivered[2] === frame,
  );
  const eager: IAutoMovieViewerCompletedFrame = {
    ...frame,
    changed: undefined,
  };
  AutoMovieViewerDisplay.publishCompletedFrame({ canvas, frame: eager });
  TestValidator.predicate(
    "ordinary eager frame is retained",
    delivered[3] === eager,
  );
  const changed: IAutoMovieViewerCompletedFrame = { ...frame, changed: true };
  AutoMovieViewerDisplay.publishCompletedFrame({ canvas, frame: changed });
  TestValidator.predicate(
    "ordinary meaningful frame is retained",
    delivered[4] === changed,
  );
  AutoMovieViewerDisplay.publishCompletedFrame({
    canvas: { ...canvas, getAttribute: (): null => null },
    frame,
    explicitDraw: true,
  });
  AutoMovieViewerDisplay.publishCompletedFrame({
    canvas: {},
    frame,
    explicitDraw: true,
  });
  AutoMovieViewerDisplay.publishCompletedFrame({
    canvas: { getAttribute: (): string => "on" },
    frame,
    explicitDraw: true,
  });
  TestValidator.equals(
    "missing or unsubscribed ports do not deliver",
    delivered.length,
    5,
  );
}
