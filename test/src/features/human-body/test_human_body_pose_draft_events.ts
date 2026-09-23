import type { IAutoMovieJointPose } from "@automovie/interface";
import { renderBodyPoseControls } from "@automovie/playground/src/human/bodyPoseControls";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

/**
 * A joint event composes with the latest draft while the preceding edit is
 * still building; controls drawn from an earlier snapshot remain usable.
 *
 * Scenarios:
 * 1. Flexion then twist, and the opposite order, retain both axes.
 * 2. A different bone already in the draft survives either event.
 * 3. Rest clears one axis while preserving the other, then removes an empty joint.
 * 4. Without a live draft provider a single event uses the rendered pose.
 */
export const test_human_body_pose_draft_events = (): void => {
  const { basis } = humanBodyBasisFixture();
  const dom = new JSDOM("<!doctype html><main id='app'></main>").window
    .document;
  const container = dom.querySelector<HTMLElement>("#app")!;
  let draft: IAutoMovieJointPose[] = [];
  const render = (live: boolean): void =>
    renderBodyPoseControls({
      dom,
      container,
      basis,
      bone: "spine",
      pose: [],
      ...(live ? { currentPose: () => draft } : {}),
      onChange: (pose) => {
        draft = pose;
      },
    });
  const number = (axis: string, value: string): void => {
    const input = dom.querySelector<HTMLInputElement>(`#pose-spine-${axis}`)!;
    input.value = value;
    input.dispatchEvent(new dom.defaultView!.Event("change"));
  };
  const rest = (axis: string): void => {
    const input = dom.querySelector<HTMLInputElement>(`#pose-spine-${axis}`)!;
    input.parentElement!.querySelector<HTMLButtonElement>("button")!.click();
  };
  const spine = (flexion: number | null, twist: number | null) => ({
    bone: "spine" as const,
    flexion,
    abduction: null,
    twist,
  });
  const hips: IAutoMovieJointPose = {
    bone: "hips",
    flexion: 5,
    abduction: null,
    twist: null,
  };

  render(true);
  number("flexion", "30");
  number("twist", "8");
  TestValidator.equals("flexion then twist composes", draft, [spine(30, 8)]);

  draft = [];
  render(true);
  number("twist", "8");
  number("flexion", "30");
  TestValidator.equals("twist then flexion composes", draft, [spine(30, 8)]);

  draft = [hips];
  render(true);
  number("flexion", "30");
  TestValidator.equals("another bone remains in the latest draft", draft, [
    hips,
    spine(30, null),
  ]);
  number("twist", "8");
  rest("flexion");
  TestValidator.equals("rest clears one axis only", draft, [
    hips,
    spine(null, 8),
  ]);
  rest("twist");
  TestValidator.equals("last rest removes only the edited bone", draft, [hips]);

  draft = [];
  render(false);
  number("flexion", "30");
  TestValidator.equals("rendered pose remains the fallback", draft, [
    spine(30, null),
  ]);
};
