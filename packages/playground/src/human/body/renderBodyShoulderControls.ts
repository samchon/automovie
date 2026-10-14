import type { IAutoMovieHumanBodyShoulderPose } from "@automovie/human";
import { humanBodyShoulderElevationLimit } from "@automovie/human/body/basis/humanBodyShoulderElevationLimit";

import type { IBodyShoulderControlsProps } from "./IBodyShoulderControlsProps";

const AXES: readonly ["plane", "elevation", "axialRotation"] = [
  "plane",
  "elevation",
  "axialRotation",
];

/**
 * Show a thorax-relative humeral goal as plane, total elevation and axial rotation. Painted inputs use the render snapshot; events read the latest draft and shape-specific rest so pending edits compose. An omitted arm retains that rest, which establishes no anatomical bone frame or clinical capacity.
 *
 * Plane is periodic on [-180°, 180°); exact numeric entry remains available while the half-degree slider ends at 179.5°. At hanging and overhead poles, visible direction does not uniquely identify all coordinates, so entered values remain unchanged and the ambiguity is explained.
 *
 * The elevation note gives the painted plane's maximum from `humanBodyShoulderElevationLimit`. The slider keeps the full elevation range because per-plane clamping would silently rewrite an authored elevation when the plane changes; the body builder owns reach refusal.
 *
 * @evidence contracts/common.md#principled-implementation Thorax-relative goals remain authored degree coordinates; event-time source rest and latest shoulders preserve pending changes, while periodic plane bounds and pole ambiguity follow the numerical shoulder representation.
 * @evidence contracts/common.md#clear-and-simple-design One selected humerus receives three input pairs and emits replacement shoulder rows; the Human rest resolver and panel transaction remain their numerical and admission owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unavailable rest withdraws an edit, and changing plane never clamps elevation or rewrites equivalent pole coordinates behind the author.
 * @evidence contracts/common.md#meaningful-documentation The comment states thorax-relative conventions, pending-edit preservation, shape-specific rest, periodic plane endpoint and the limitations of source-rig versus clinical interpretation.
 * @evidence contracts/performance.md#efficient-algorithms Three fixed coordinate rows scan s shoulder goals and preserve unrelated rows on each edit; row storage is constant and latest-rest resolution cost belongs to the supplied shape evaluator.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This renderer coordinates no repeated numerical requests or retained cross-render result cache; latest-state getters are consulted when edits occur.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The supplied container retains three row pairs and their listeners until replacement or panel retirement; this operation acquires no renderer, worker or timer.
 */
export function renderBodyShoulderControls(
  props: IBodyShoulderControlsProps,
): void {
  const {
    dom,
    container,
    shoulder,
    bone,
    rest: neutral,
  }: IBodyShoulderControlsProps = props;
  container.replaceChildren();
  const rendered: IAutoMovieHumanBodyShoulderPose | undefined =
    props.shoulders.find(
      (one: IAutoMovieHumanBodyShoulderPose): boolean => one.bone === bone,
    );
  const plane: number = rendered?.plane ?? neutral.plane;
  const write: (axis: (typeof AXES)[number], value?: number) => void = (
    axis: (typeof AXES)[number],
    value?: number,
  ): void => {
    const rest: IAutoMovieHumanBodyShoulderPose | undefined =
      props.currentRest();
    if (rest === undefined) return;
    const latest: readonly IAutoMovieHumanBodyShoulderPose[] =
      props.currentShoulders();
    const current: IAutoMovieHumanBodyShoulderPose | undefined = latest.find(
      (one: IAutoMovieHumanBodyShoulderPose): boolean => one.bone === bone,
    );
    const others: IAutoMovieHumanBodyShoulderPose[] = latest.filter(
      (one: IAutoMovieHumanBodyShoulderPose): boolean => one.bone !== bone,
    );
    const next: IAutoMovieHumanBodyShoulderPose = {
      ...rest,
      ...current,
      bone,
      [axis]: value ?? rest[axis],
    };
    const moved: boolean = AXES.some(
      (name: (typeof AXES)[number]): boolean => next[name] !== rest[name],
    );
    props.onChange(moved ? [...others, next] : others);
  };
  for (const axis of AXES) {
    const range: { min: number; max: number } =
      axis === "plane" ? { min: -180, max: 180 } : shoulder.range[axis];
    const row: HTMLDivElement = dom.createElement("div");
    const label: HTMLLabelElement = dom.createElement("label");
    const entry: HTMLDivElement = dom.createElement("div");
    const slider: HTMLInputElement = dom.createElement("input");
    const number: HTMLInputElement = dom.createElement("input");
    const rest: HTMLButtonElement = dom.createElement("button");
    const note: HTMLElement = dom.createElement("small");
    row.className = "row";
    label.textContent = `${bone} ${axis}`;
    number.id = `shoulder-${bone}-${axis}`;
    label.htmlFor = number.id;
    number.type = "number";
    number.step = "any";
    number.min = String(range.min);
    number.max = String(range.max);
    number.value = String(rendered?.[axis] ?? neutral[axis]);
    slider.type = "range";
    slider.id = number.id + "-slider";
    slider.setAttribute("aria-label", label.textContent + " slider");
    slider.step = "0.5";
    slider.min = String(range.min);
    slider.max = String(axis === "plane" ? 179.5 : range.max);
    slider.value = number.value;
    slider.oninput = (): void => {
      number.value = slider.value;
    };
    slider.onchange = (): void => write(axis, Number(slider.value));
    number.onchange = (): void => {
      if (number.value.trim() !== "") write(axis, Number(number.value));
    };
    rest.type = "button";
    rest.textContent = "Rest";
    rest.onclick = (): void => write(axis);
    note.textContent =
      axis === "plane"
        ? "thorax plane [-180°, 180°): 0° lateral, +90° anterior, -90° posterior"
        : axis === "elevation"
          ? `total humerothoracic elevation ${range.min}° to ${range.max}°, rest ${neutral.elevation.toFixed(2)}°; reach in the ${plane}° plane ${humanBodyShoulderElevationLimit(shoulder.range, plane).toFixed(1)}° (overhead 180° is one direction for every plane)`
          : `external (+) / internal (-) axial rotation ${range.min}° to ${range.max}°, rest ${neutral.axialRotation.toFixed(2)}°`;
    entry.append(slider, number, rest);
    row.append(label, entry, note);
    container.append(row);
  }
  const poles: HTMLElement = dom.createElement("small");
  poles.textContent =
    "At 0° elevation the plane has no observable direction. At 180°, (plane + δ, axial rotation − 2δ) is equivalent; entered values are preserved.";
  container.append(poles);
}
