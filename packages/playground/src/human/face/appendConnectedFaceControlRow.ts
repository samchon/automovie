import type { IAppendConnectedFaceControlRowProps } from "./IAppendConnectedFaceControlRowProps";
import type { IConnectedFaceControlEntry } from "./IConnectedFaceControlEntry";

/**
 * Append one control row (label, slider, number and endpoint note) when the
 * control's id, label or component path matches the search query. An entered
 * value becomes the control's candidate document and goes through the panel's
 * transaction; an empty or refused value is reported and the controls are
 * redrawn with the committed values.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Exposes each editable control with its current value and limits.
 */
export function appendConnectedFaceControlRow(
  control: IConnectedFaceControlEntry,
  props: IAppendConnectedFaceControlRowProps,
): void {
  if (!(control.id + control.label + (control.group ?? "")).toLowerCase().replace(/\s/g, "").includes(props.query))
    return;
  const dom = props.target.ownerDocument;
  const row = dom.createElement("div"), label = dom.createElement("label"), entry = dom.createElement("div");
  row.className = "row";
  label.textContent = control.label;
  const slider = dom.createElement("input"), number = dom.createElement("input");
  slider.type = "range";
  number.type = "number";
  for (const input of [slider, number]) {
    input.min = String(control.minimum);
    input.max = String(control.maximum);
    input.step = "any";
    input.value = String(control.value);
  }
  number.id = (props.simple ? "face-simple-" : "face-control-") + control.id;
  slider.id = number.id + "-slider";
  label.htmlFor = number.id;
  slider.setAttribute("aria-label", control.label + " slider");
  const edit = async (value: string): Promise<void> => {
    try {
      if (value.trim() === "") throw new Error("A numeric value is required.");
      await props.change(control.edit(Number(value)));
    } catch (error) {
      props.refuse(error);
      props.render();
    }
  };
  slider.oninput = () => { number.value = slider.value; };
  slider.onchange = () => edit(slider.value);
  number.onchange = () => edit(number.value);
  entry.append(slider, number);
  const note = dom.createElement("small");
  note.id = (props.simple ? "face-simple-description-" : "face-scale-") + control.id;
  note.textContent = control.description;
  row.append(label, entry, note);
  props.target.append(row);
}
