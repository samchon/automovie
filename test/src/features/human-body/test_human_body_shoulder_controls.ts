import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human";
import { renderBodyShoulderControls } from "@automovie/playground/src/human/bodyShoulderControls";
import { TestValidator } from "@nestia/e2e";
import { JSDOM } from "jsdom";

/**
 * Thorax-relative shoulder inputs compose against the live document rather
 * than an old paint, state the 0/180 pole ambiguity, and omit exact rest.
 * The numerical builder independently judges ranges and equivalent angles.
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
  TestValidator.equals(
    "plane slider has periodic upper endpoint",
    dom.querySelector<HTMLInputElement>("#shoulder-leftUpperArm-plane-slider")!
      .max,
    "179.5",
  );
  write("plane", "90");
  write("elevation", "120");
  write("axialRotation", "15");
  TestValidator.equals(
    "rapid controls preserve every axis and other arm",
    draft,
    [
      other,
      {
        bone: "leftUpperArm",
        plane: 90,
        elevation: 120,
        axialRotation: 15,
      },
    ],
  );
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
};
