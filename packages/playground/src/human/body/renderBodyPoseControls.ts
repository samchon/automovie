import { getConstraint } from "@automovie/engine";
import { HUMAN_BODY_MOTION_GAPS } from "@automovie/human/body/constants/HUMAN_BODY_MOTION_GAPS";
import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IBodyPoseControlsProps } from "./IBodyPoseControlsProps";

const AXES: readonly ["flexion", "abduction", "twist"] = ["flexion", "abduction", "twist"];

/**
 * Render one source-rig joint's three degree-valued authored coordinates against its effective engine constraint. Held axes are disabled at zero; Rest removes the coordinate, and a wholly neutral joint needs no sparse row.
 *
 * Coupling increments and resolved clinical coordinates are separate readouts and never overwrite the authored sliders. These source-rig ranges do not establish personal clinical capacity; the build owns admission of combined motion and reports refusals without clamping authored values here.
 *
 * Events compose against `currentPose` when supplied, otherwise the painted rows. Latest-draft access retains pending changes to another axis or bone while a preceding body build is unfinished.
 *
 * @evidence contracts/common.md#principled-implementation Effective constraints bound authored degree coordinates, sparse rest omission preserves document meaning, and event-time draft composition retains unrelated pending joint edits.
 * @evidence contracts/common.md#clear-and-simple-design One renderer paints a selected joint and emits replacement sparse rows; constraint evaluation remains in the engine and body admission remains in the panel transaction.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Coupling and clinical readbacks remain observational rather than hidden slider corrections, and unsupported combined totals are refused by the builder instead of clamped here.
 * @evidence contracts/common.md#meaningful-documentation The comment explains degree conventions, held axes, sparse rest meaning, readback separation, source-rig limits and latest-draft event composition.
 * @evidence contracts/performance.md#efficient-algorithms Rendering scans j basis joints, p pose rows and c coupling contributions for three fixed axes, using O(1) DOM rows; each edit scans p latest rows to preserve unrelated coordinates.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This mount paints supplied snapshots and coordinates no repeated numerical solve or cross-render result cache.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The supplied container owns three control rows and their listeners until replacement or panel retirement; closures retain the supplied input and getters without acquiring GPU or worker handles.
 */
export function renderBodyPoseControls(props: IBodyPoseControlsProps): void {
  const { dom, container, basis }: IBodyPoseControlsProps = props;
  container.replaceChildren();
  const joint: IBodyPoseControlsProps["basis"]["joints"][number] | undefined = basis.joints.find((one: IBodyPoseControlsProps["basis"]["joints"][number]): boolean => one.bone === props.bone);
  if (joint === undefined) return;
  const constraint: ReturnType<typeof getConstraint> = getConstraint(joint.bone, joint.constraint);
  const current: IAutoMovieJointPose | undefined = props.pose.find((one: IAutoMovieJointPose): boolean => one.bone === props.bone);
  const write: (axis: (typeof AXES)[number], value: number | null) => void = (axis: (typeof AXES)[number], value: number | null): void => {
    const pose: readonly IAutoMovieJointPose[] = props.currentPose?.() ?? props.pose;
    const current: IAutoMovieJointPose | undefined = pose.find((one: IAutoMovieJointPose): boolean => one.bone === props.bone);
    const rest: IAutoMovieJointPose[] = pose.filter((one: IAutoMovieJointPose): boolean => one.bone !== props.bone);
    const next: IAutoMovieJointPose = {
      bone: props.bone,
      flexion: current?.flexion ?? null,
      abduction: current?.abduction ?? null,
      twist: current?.twist ?? null,
      [axis]: value,
    };
    const moved: boolean = AXES.some(
      (name: (typeof AXES)[number]): boolean => next[name] !== null && next[name] !== joint.neutral[name],
    );
    props.onChange(moved ? [...rest, next] : rest);
  };
  for (const axis of AXES) {
    const range: NonNullable<ReturnType<typeof getConstraint>>[typeof axis] | null = constraint?.[axis] ?? null;
    const row: HTMLDivElement = dom.createElement("div"),
      label: HTMLLabelElement = dom.createElement("label"),
      entry: HTMLDivElement = dom.createElement("div"),
      slider: HTMLInputElement = dom.createElement("input"),
      number: HTMLInputElement = dom.createElement("input"),
      note: HTMLElement = dom.createElement("small");
    row.className = "row";
    label.textContent = `${props.bone} ${axis}`;
    slider.type = "range";
    number.type = "number";
    slider.step = "0.5";
    number.step = "any";
    number.id = `pose-${props.bone}-${axis}`;
    slider.id = number.id + "-slider";
    label.htmlFor = number.id;
    slider.setAttribute("aria-label", label.textContent + " slider");
    const held: boolean = constraint !== null && range === null;
    const value: number = current?.[axis] ?? joint.neutral[axis];
    if (held) {
      number.min = "0";
      slider.min = number.min;
      number.max = "0";
      slider.max = number.max;
      number.disabled = true;
      slider.disabled = number.disabled;
      note.textContent =
        "held: this joint does not move on this axis" +
        motionGap(props.bone, axis);
    } else if (range !== null) {
      number.min = String(range.min);
      slider.min = number.min;
      number.max = String(range.max);
      slider.max = number.max;
      note.textContent =
        `clinical range ${range.min}° to ${range.max}°, rest ${joint.neutral[axis].toFixed(2)}°` +
        (constraint?.swingDeg !== undefined &&
        constraint?.swingDeg !== null &&
        axis !== "twist"
          ? `, combined swing within ${constraint.swingDeg}°`
          : "") +
        motionGap(props.bone, axis);
    } else {
      number.min = "-180";
      slider.min = number.min;
      number.max = "180";
      slider.max = number.max;
      note.textContent =
        joint.parent === null
          ? "the root turns freely"
          : "this joint has no source-rig range";
    }
    number.value = String(value);
    slider.value = number.value;
    const editValue: (text: string) => void = (text: string): void => {
      if (text.trim() === "") return;
      write(axis, Number(text));
    };
    slider.oninput = (): void => {
      number.value = slider.value;
    };
    slider.onchange = (): void => editValue(slider.value);
    number.onchange = (): void => editValue(number.value);
    const rest: HTMLButtonElement = dom.createElement("button");
    rest.type = "button";
    rest.textContent = "Rest";
    rest.onclick = (): void => write(axis, null);
    entry.append(slider, number, rest);
    row.append(label, entry, note);
    const addition: NonNullable<IBodyPoseControlsProps["coupled"]>[number] | undefined = (props.coupled ?? []).find(
      (one: NonNullable<IBodyPoseControlsProps["coupled"]>[number]): boolean => one.bone === props.bone && one.axis === axis,
    );
    if (addition !== undefined) {
      const coupled: HTMLOutputElement = dom.createElement("output");
      coupled.id = number.id + "-coupled";
      coupled.setAttribute("for", number.id);
      coupled.textContent = `coupled ${addition.degrees < 0 ? "" : "+"}${addition.degrees.toFixed(1)}° by ${addition.coupling}`;
      coupled.style.display = "block";
      row.append(coupled);
    }
    const actual: IAutoMovieJointPose | undefined = props.clinical?.find((one: IAutoMovieJointPose): boolean => one.bone === props.bone);
    if (actual !== undefined) {
      const reading: HTMLOutputElement = dom.createElement("output");
      reading.id = number.id + "-clinical";
      reading.setAttribute("for", number.id);
      reading.textContent =
        actual[axis] === null
          ? `resolved source-rig ${axis} unavailable`
          : `resolved source-rig ${axis} ${actual[axis].toFixed(6)}°`;
      reading.style.display = "block";
      row.append(reading);
    }
    container.append(row);
  }
}

/** The named anatomical gap of a lower-limb axis, as a sentence suffix, or empty. */
const motionGap: (bone: string, axis: string) => string = (bone: string, axis: string): string => {
  const gap: string | undefined =
    HUMAN_BODY_MOTION_GAPS[`${bone.replace(/^(left|right)/u, "")}.${axis}`];
  return gap === undefined ? "" : ". " + gap;
};
