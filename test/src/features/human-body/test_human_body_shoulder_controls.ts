import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human";
import { renderBodyShoulderControls } from "@automovie/playground/src/human/body/bodyShoulderControls";
import { mountBodyJointControls } from "@automovie/playground/src/human/body/mountBodyJointControls";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

import { humanBodyShoulderFixture } from "../internal/humanBodyShoulderFixture";

/**
 * Thorax-relative shoulder inputs compose against the live document rather
 * than an old paint, state the 0/180 pole ambiguity, and omit exact rest.
 * The numerical builder independently judges ranges and equivalent angles.
 *
 * Scenarios:
 * 1. Number, slider and Rest events compose current authored goals, preserve
 *    the other side and state periodic plane and pole conventions.
 * 2. Every first axis edit and each Rest event reads the latest shaped rest
 *    after the painted shape has changed, retaining untouched coordinates.
 * 3. Extracted picker filtering and ordinary joint edits retain their binding,
 *    while a missing TT shoulder contract reaches the panel's refusal owner.
 */
export const test_human_body_shoulder_controls = (): void => {
  const dom = new JSDOM("<!doctype html><main id='app'></main>").window
    .document;
  const container = dom.querySelector<HTMLElement>("#app")!;
  const shoulder = {
    coordinates: "thorax-tt" as const,
    neutral: { plane: 0, elevation: 42, axialRotation: 0 },
    range: {
      elevation: { min: 0, max: 180 },
      axialRotation: { min: -90, max: 90 },
      envelope: [
        [-90, 60],
        [0, 180],
        [90, 180],
      ] as [number, number][],
    },
  };
  const other: IAutoMovieHumanBodyShoulderPose = {
    bone: "rightUpperArm",
    plane: 0,
    elevation: 90,
    axialRotation: 0,
  };
  let draft: IAutoMovieHumanBodyShoulderPose[] = [other];
  const render = (): void =>
    renderBodyShoulderControls({
      dom,
      container,
      bone: "leftUpperArm",
      shoulder,
      rest: { bone: "leftUpperArm", ...shoulder.neutral },
      currentRest: () => ({ bone: "leftUpperArm", ...shoulder.neutral }),
      shoulders: [other],
      currentShoulders: () => draft,
      onChange: (next) => {
        draft = next;
      },
    });
  const input = (axis: string): HTMLInputElement =>
    dom.querySelector<HTMLInputElement>(`#shoulder-leftUpperArm-${axis}`)!;
  const write = (axis: string, value: string): void => {
    const number = input(axis);
    number.value = value;
    number.dispatchEvent(new dom.defaultView!.Event("change"));
  };
  const rest = (axis: string): void => {
    input(axis)
      .parentElement!.querySelector<HTMLButtonElement>("button")!
      .click();
  };
  render();
  TestValidator.equals(
    "neutral elevation is displayed",
    input("elevation").value,
    "42",
  );
  TestValidator.predicate(
    "plane and pole conventions are visible",
    container.textContent!.includes("+90° anterior") &&
      container.textContent!.includes("At 0° elevation") &&
      container.textContent!.includes("At 180°"),
  );
  TestValidator.predicate(
    "the rest plane's joint-sinus reach is stated",
    container.textContent!.includes("reach in the 0° plane 180.0°"),
  );
  TestValidator.equals(
    "plane slider has periodic upper endpoint",
    dom.querySelector<HTMLInputElement>("#shoulder-leftUpperArm-plane-slider")!
      .max,
    "179.5",
  );
  write("plane", "90");
  write("elevation", "120");
  write("axialRotation", "15");
  const painted = dom.createElement("div");
  for (const [plane, reach] of [
    [-45, "120.0"],
    [135, "150.0"],
    [-135, "90.0"],
  ] as const) {
    renderBodyShoulderControls({
      dom,
      container: painted,
      bone: "leftUpperArm",
      shoulder,
      rest: { bone: "leftUpperArm", ...shoulder.neutral },
      currentRest: () => ({ bone: "leftUpperArm", ...shoulder.neutral }),
      shoulders: [{ ...other, bone: "leftUpperArm", plane }],
      currentShoulders: () => draft,
      onChange: () => undefined,
    });
    // (-90, 60) to (0, 180) at -45 is 120; the seam joins (90, 180) to
    // (-90 + 360, 60), which is 180 - 120 * 45 / 180 = 150 at 135 and
    // 180 - 120 * 135 / 180 = 90 at -135 (225 on that turn)
    TestValidator.predicate(
      `a painted ${plane}° plane states its own reach`,
      painted.textContent!.includes(`reach in the ${plane}° plane ${reach}°`),
    );
  }
  write("plane", "");
  TestValidator.equals("empty numeric input does not edit", draft.length, 2);
  rest("plane");
  rest("elevation");
  TestValidator.equals("remaining axial rotation stays authored", draft[1], {
    bone: "leftUpperArm",
    plane: 0,
    elevation: 42,
    axialRotation: 15,
  });
  rest("axialRotation");
  TestValidator.equals("exact rest omits only the edited arm", draft, [other]);
  const slider = dom.querySelector<HTMLInputElement>(
    "#shoulder-leftUpperArm-elevation-slider",
  )!;
  slider.value = "180";
  slider.dispatchEvent(new dom.defaultView!.Event("input"));
  TestValidator.equals(
    "slider paints its numeric twin",
    input("elevation").value,
    "180",
  );
  slider.dispatchEvent(new dom.defaultView!.Event("change"));
  TestValidator.equals(
    "overhead is an authored total goal",
    draft[1].elevation,
    180,
  );
  let shaped: IAutoMovieHumanBodyShoulderPose = {
    bone: "leftUpperArm", plane: 15, elevation: 60, axialRotation: 0,
  };
  draft = [other];
  renderBodyShoulderControls({
    dom, container, bone: "leftUpperArm", shoulder,
    rest: shaped, currentRest: () => shaped,
    shoulders: draft, currentShoulders: () => draft,
    onChange: (next) => { draft = next; },
  });
  TestValidator.equals("shaped rest paints omitted coordinates", [input("plane").value, input("elevation").value], ["15", "60"]);
  shaped = { ...shaped, plane: -20, elevation: 65 };
  write("axialRotation", "5");
  TestValidator.equals("first edit reads newer shape rather than painted rest", draft[1], { ...shaped, axialRotation: 5 });
  write("plane", "30");
  write("elevation", "100");
  rest("plane");
  rest("elevation");
  TestValidator.equals("Rest reads latest shape and retains authored axial", draft[1], { ...shaped, axialRotation: 5 });
  rest("axialRotation");
  TestValidator.equals("shaped exact rest omits only the selected side", draft, [other]);
  for (const axis of ["plane", "elevation", "axialRotation"] as const) {
    draft = [other];
    write(axis, axis === "elevation" ? "100" : "10");
    TestValidator.equals("each first axis edit retains the other shaped coordinates", draft[1], { ...shaped, [axis]: axis === "elevation" ? 100 : 10 });
  }
  const fixture = humanBodyShoulderFixture();
  let selected = "leftUpperArm";
  let changeCount = 0;
  let refused = "";
  const mount = (query: string): void => {
    container.replaceChildren();
    mountBodyJointControls({
      dom, container, basis: fixture.basis, bone: "leftUpperArm", query,
      current: () => fixture.document,
      select: (bone) => { selected = bone; }, redraw: () => {},
      change: (document) => { fixture.document = document; changeCount++; },
      refuse: (error) => { refused = String(error); },
    });
  };
  mount("lowerarm");
  TestValidator.equals("filtered picker selects an available joint", selected, "leftLowerArm");
  const flexion = container.querySelector<HTMLInputElement>("#pose-leftLowerArm-flexion")!;
  flexion.value = "10";
  flexion.dispatchEvent(new dom.defaultView!.Event("change"));
  TestValidator.equals("ordinary joint edit retains the extracted change binding", changeCount, 1);
  mount("no-joint-matches");
  TestValidator.equals("empty search has no picker option", container.querySelector<HTMLSelectElement>("#pose-bone")!.options.length, 0);
  delete fixture.basis.joints.find((joint) => joint.bone === "leftUpperArm")!.shoulder;
  mount("");
  TestValidator.predicate("missing TT contract uses the panel refusal", refused.includes("thorax-relative shoulder coordinates"));
};
