import { getConstraint } from "@automovie/engine";
import type { IAutoMovieJointPose } from "@automovie/interface";

import type { IBodyPoseControlsProps } from "./IBodyPoseControlsProps";

const AXES = ["flexion", "abduction", "twist"] as const;

/**
 * Render the joint controls of the body editor: one bone at a time, its
 * three clinical axes as sliders bounded by the engine's effective override
 * or default ranges, the rest
 * angle marked, an absent angle meaning the rest.
 *
 * The values are clinical degrees, which is what the document stores and
 * what the package validates; a slider left at the rest angle writes no
 * entry rather than a redundant number, so a saved document lists only the
 * joints the author moved. An axis the constraint holds is shown disabled at
 * zero so the reader sees the joint's freedom rather than guessing it.
 *
 * A basis's declared couplings add to a joint the author did not move (an
 * elevated arm lifting its girdle), and the requirement that no hidden
 * corrective changes a pose means that addition is printed rather than
 * folded into the slider: `coupled` is the package's own evaluation of the
 * draft (`resolveHumanBodyCouplings(basis, pose).contributions`), so each
 * driven axis states its declared coordination increment and the coupling.
 * The separate clinical reading states all three coordinates of the current
 * draft's actual source-rig frames; a pelvis turn can change more than its
 * flexion. A scalar increment is not that combined clinical total.
 * The slider keeps the document's angle and
 * its range, and a total past the range is refused by the build as the
 * status line reports, never clamped here.
 * `pose` paints the current rows, while `currentPose` reads the latest draft
 * when an event fires. The editor may still be building the previous edit;
 * composing against the render snapshot would discard that pending axis or
 * another bone's edit.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-editor Binds each joint's clinical flexion, abduction and twist to bounded inputs that state the rest angle and refuse nothing the range admits.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-editor-view Reads effective override/default ranges through the engine's constraint owner and neutral angles from the admitted basis, writes only moved joints into the sparse pose, and displays declared coordination separately from the current draft's resolved source-rig coordinates.
 */
export const renderBodyPoseControls = (props: IBodyPoseControlsProps): void => {
  const { dom, container, basis } = props;
  container.replaceChildren();
  const joint = basis.joints.find((one) => one.bone === props.bone);
  if (joint === undefined) return;
  const constraint = getConstraint(joint.bone, joint.constraint);
  const current = props.pose.find((one) => one.bone === props.bone);
  const write = (axis: (typeof AXES)[number], value: number | null): void => {
    const pose = props.currentPose?.() ?? props.pose;
    const current = pose.find((one) => one.bone === props.bone);
    const rest = pose.filter((one) => one.bone !== props.bone);
    const next: IAutoMovieJointPose = {
      bone: props.bone,
      flexion: current?.flexion ?? null,
      abduction: current?.abduction ?? null,
      twist: current?.twist ?? null,
      [axis]: value,
    };
    const moved = AXES.some(
      (name) => next[name] !== null && next[name] !== joint.neutral[name],
    );
    props.onChange(moved ? [...rest, next] : rest);
  };
  for (const axis of AXES) {
    const range = constraint?.[axis] ?? null;
    const row = dom.createElement("div"),
      label = dom.createElement("label"),
      entry = dom.createElement("div"),
      slider = dom.createElement("input"),
      number = dom.createElement("input"),
      note = dom.createElement("small");
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
    const held = constraint !== null && range === null;
    const value = current?.[axis] ?? joint.neutral[axis];
    if (held) {
      number.min = "0";
      slider.min = number.min;
      number.max = "0";
      slider.max = number.max;
      number.disabled = true;
      slider.disabled = number.disabled;
      note.textContent = "held: this joint does not move on this axis";
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
          : "");
    } else {
      number.min = "-180";
      slider.min = number.min;
      number.max = "180";
      slider.max = number.max;
      note.textContent = joint.parent === null ? "the root turns freely" : "this joint has no source-rig range";
    }
    number.value = String(value);
    slider.value = number.value;
    const editValue = (text: string): void => {
      if (text.trim() === "") return;
      write(axis, Number(text));
    };
    slider.oninput = () => {
      number.value = slider.value;
    };
    slider.onchange = () => editValue(slider.value);
    number.onchange = () => editValue(number.value);
    const rest = dom.createElement("button");
    rest.type = "button";
    rest.textContent = "Rest";
    rest.onclick = () => write(axis, null);
    entry.append(slider, number, rest);
    row.append(label, entry, note);
    const addition = (props.coupled ?? []).find(
      (one) => one.bone === props.bone && one.axis === axis,
    );
    if (addition !== undefined) {
      const coupled = dom.createElement("output");
      coupled.id = number.id + "-coupled";
      coupled.setAttribute("for", number.id);
      coupled.textContent =
        `coupled ${addition.degrees < 0 ? "" : "+"}${addition.degrees.toFixed(1)}° by ${addition.coupling}`;
      coupled.style.display = "block";
      row.append(coupled);
    }
    const actual = props.clinical?.find((one) => one.bone === props.bone);
    if (actual !== undefined) {
      const reading = dom.createElement("output");
      reading.id = number.id + "-clinical";
      reading.setAttribute("for", number.id);
      reading.textContent = actual[axis] === null
        ? `resolved source-rig ${axis} unavailable`
        : `resolved source-rig ${axis} ${actual[axis].toFixed(6)}°`;
      reading.style.display = "block";
      row.append(reading);
    }
    container.append(row);
  }
};
