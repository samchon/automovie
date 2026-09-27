import {
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodyShoulderPose,
  humanBodyShoulderElevationLimit,
} from "@automovie/human";

const AXES = ["plane", "elevation", "axialRotation"] as const;
type Shoulder = NonNullable<
  IAutoMovieHumanBodyBasis["joints"][number]["shoulder"]
>;

/**
 * Show a thorax-relative humeral goal as its plane, total elevation and axial
 * rotation. A render snapshot paints the inputs, while event handlers read the
 * latest draft so a second change made before the first build completes keeps
 * both values. An omitted arm retains the basis's measured A-pose goal.
 *
 * The plane is periodic and the 180° endpoint belongs to -180°; the numeric
 * input can be typed exactly, while its half-degree slider ends at 179.5°.
 * At the hanging and overhead poles the visible direction does not uniquely
 * identify all three numbers. The editor preserves what the author wrote and
 * explains that ambiguity instead of silently changing their document.
 *
 * The elevation note states the joint-sinus maximum of the painted plane
 * (`humanBodyShoulderElevationLimit`), so a goal the builder will refuse as
 * past the plane's reach is visible before it is written. The slider keeps
 * the whole total-elevation range: clamping it per plane would silently
 * rewrite an authored elevation whenever the plane moved.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Lets the author edit each humerus by a named thorax-relative plane, total elevation and axial rotation while retaining newer draft edits.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Displays the basis's shoulder rest, clinical ranges, the painted plane's joint-sinus reach, the plane period and the two pole ambiguities beside the controls.
 */
export function renderBodyShoulderControls(props: {
  dom: Document;
  container: HTMLElement;
  bone: IAutoMovieHumanBodyShoulderPose["bone"];
  shoulder: Shoulder;
  shoulders: readonly IAutoMovieHumanBodyShoulderPose[];
  currentShoulders: () => readonly IAutoMovieHumanBodyShoulderPose[];
  onChange: (shoulders: IAutoMovieHumanBodyShoulderPose[]) => void;
}): void {
  const { dom, container, shoulder, bone } = props;
  container.replaceChildren();
  const rendered = props.shoulders.find((one) => one.bone === bone);
  const plane = rendered?.plane ?? shoulder.neutral.plane;
  const write = (axis: (typeof AXES)[number], value: number): void => {
    const latest = props.currentShoulders();
    const current = latest.find((one) => one.bone === bone);
    const others = latest.filter((one) => one.bone !== bone);
    const next: IAutoMovieHumanBodyShoulderPose = {
      bone,
      ...shoulder.neutral,
      ...current,
      [axis]: value,
    };
    const moved = AXES.some((name) => next[name] !== shoulder.neutral[name]);
    props.onChange(moved ? [...others, next] : others);
  };
  for (const axis of AXES) {
    const range =
      axis === "plane" ? { min: -180, max: 180 } : shoulder.range[axis];
    const row = dom.createElement("div");
    const label = dom.createElement("label");
    const entry = dom.createElement("div");
    const slider = dom.createElement("input");
    const number = dom.createElement("input");
    const rest = dom.createElement("button");
    const note = dom.createElement("small");
    row.className = "row";
    label.textContent = `${bone} ${axis}`;
    number.id = `shoulder-${bone}-${axis}`;
    label.htmlFor = number.id;
    number.type = "number";
    number.step = "any";
    number.min = String(range.min);
    number.max = String(range.max);
    number.value = String(rendered?.[axis] ?? shoulder.neutral[axis]);
    slider.type = "range";
    slider.id = number.id + "-slider";
    slider.setAttribute("aria-label", label.textContent + " slider");
    slider.step = "0.5";
    slider.min = String(range.min);
    slider.max = String(axis === "plane" ? 179.5 : range.max);
    slider.value = number.value;
    slider.oninput = () => {
      number.value = slider.value;
    };
    slider.onchange = () => write(axis, Number(slider.value));
    number.onchange = () => {
      if (number.value.trim() !== "") write(axis, Number(number.value));
    };
    rest.type = "button";
    rest.textContent = "Rest";
    rest.onclick = () => write(axis, shoulder.neutral[axis]);
    note.textContent =
      axis === "plane"
        ? "thorax plane [-180°, 180°): 0° lateral, +90° anterior, -90° posterior"
        : axis === "elevation"
          ? `total humerothoracic elevation ${range.min}° to ${range.max}°, rest ${shoulder.neutral.elevation.toFixed(2)}°; reach in the ${plane}° plane ${humanBodyShoulderElevationLimit(shoulder.range, plane).toFixed(1)}° (overhead 180° is one direction for every plane)`
          : `external (+) / internal (-) axial rotation ${range.min}° to ${range.max}°, rest ${shoulder.neutral.axialRotation.toFixed(2)}°`;
    entry.append(slider, number, rest);
    row.append(label, entry, note);
    container.append(row);
  }
  const poles = dom.createElement("small");
  poles.textContent =
    "At 0° elevation the plane has no observable direction. At 180°, (plane + δ, axial rotation − 2δ) is equivalent; entered values are preserved.";
  container.append(poles);
}
