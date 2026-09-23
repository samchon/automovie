import type { IAutoMovieJointPose } from "@automovie/interface";
import { renderBodyPoseControls } from "@automovie/playground/src/human/bodyPoseControls";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyBasisFixture } from "../internal/humanBodyBasisFixture";

type Coupled = NonNullable<
  Parameters<typeof renderBodyPoseControls>[0]["coupled"]
>[number];

/**
 * The body editor prints a coupled addition beside the axis it drives and
 * leaves the slider on the document's own angle.
 *
 * Scenarios:
 * 1. With spine flexion 10 in the document and a coupled `+12.5` on that
 *    axis, the flexion row carries an output naming the coupling and the
 *    total 22.5, tied to the number input, while the input still reads 10
 *    and the abduction row carries no output.
 * 2. A negative addition on an axis the document leaves at rest prints its
 *    own sign and the rest-based total; with the joint resting at flexion
 *    20 the total counts from that rest.
 * 3. An addition on another bone does not appear on this bone's rows, and
 *    without the `coupled` property no row carries an output.
 */
export const test_human_body_pose_controls_coupled = (): void => {
  const { basis } = humanBodyBasisFixture();
  const dom = new JSDOM("<!doctype html><main id='app'></main>").window
    .document;
  const container = dom.querySelector<HTMLElement>("#app")!;
  const render = (
    pose: IAutoMovieJointPose[],
    coupled?: Coupled[],
    neutralFlexion = 0,
  ): void => {
    const joints = structuredClone(basis);
    joints.joints[1].neutral.flexion = neutralFlexion;
    renderBodyPoseControls({
      dom,
      container,
      basis: joints,
      bone: "spine",
      pose,
      ...(coupled === undefined ? {} : { coupled }),
      onChange: () => {},
    });
  };
  const output = (axis: string): HTMLOutputElement | null =>
    dom.querySelector<HTMLOutputElement>(`#pose-spine-${axis}-coupled`);
  const rhythm = (axis: Coupled["axis"], degrees: number): Coupled => ({
    coupling: "rhythm",
    bone: "spine",
    axis,
    degrees,
  });

  // 1. the addition beside the driven axis
  render(
    [{ bone: "spine", flexion: 10, abduction: null, twist: null }],
    [rhythm("flexion", 12.5)],
  );
  TestValidator.equals(
    "the flexion row states the addition, the coupling and the total",
    output("flexion")?.textContent,
    "coupled +12.5° by rhythm, total 22.5°",
  );
  TestValidator.equals(
    "the output is tied to the number input",
    output("flexion")?.getAttribute("for"),
    "pose-spine-flexion",
  );
  TestValidator.equals(
    "the input keeps the document's angle",
    dom.querySelector<HTMLInputElement>("#pose-spine-flexion")?.value,
    "10",
  );
  TestValidator.equals(
    "an undriven axis carries no output",
    output("abduction"),
    null,
  );

  // 2. a negative addition on a resting axis, and a rest offset
  render([], [rhythm("abduction", -6)]);
  TestValidator.equals(
    "a negative addition prints its sign from the rest",
    output("abduction")?.textContent,
    "coupled -6.0° by rhythm, total -6.0°",
  );
  render([], [rhythm("flexion", 12.5)], 20);
  TestValidator.equals(
    "the total counts from the rest angle",
    output("flexion")?.textContent,
    "coupled +12.5° by rhythm, total 32.5°",
  );

  // 3. another bone's addition, and no couplings at all
  render([], [{ ...rhythm("flexion", 12.5), bone: "hips" }]);
  TestValidator.equals(
    "another bone's addition stays off this bone's rows",
    output("flexion"),
    null,
  );
  render([{ bone: "spine", flexion: 10, abduction: null, twist: null }]);
  TestValidator.equals(
    "no coupled property, no output",
    dom.querySelectorAll("output").length,
    0,
  );
};
