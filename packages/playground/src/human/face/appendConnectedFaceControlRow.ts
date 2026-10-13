import type { IAppendConnectedFaceControlRowProps } from "./IAppendConnectedFaceControlRowProps";
import type { IConnectedFaceControlEntry } from "./IConnectedFaceControlEntry";

/**
 * Append one control row (label, slider, number and endpoint note) when the control's id, label or component path matches the search query. An entered value becomes the control's candidate document and goes through the panel's transaction; an empty or refused value is reported and the controls are redrawn from the parent's current draft. Finite values, supported ranges and document admission belong to the candidate owner and panel, rather than the DOM input bounds.
 *
 * @evidence contracts/common.md#principled-implementation Case/space-normalized search selects rows, empty entry refuses before numeric conversion, and candidate assembly plus the shared transaction own final finite and range admission.
 * @evidence contracts/common.md#clear-and-simple-design Row DOM and slider/number coordination stay here while control-specific canonical lowering and panel history remain injected owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Empty input does not become zero, HTML number bounds do not certify numerical validity, and refused values redraw through the current-state owner rather than a remembered fixture.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies matched fields, candidate submission, row-level refusal redraw and the later finite/range admission boundary.
 * @evidence contracts/performance.md#efficient-algorithms Search scans l id, label and group characters, then constructs constant DOM and handlers per matched row; candidate copying and projection lowering remain included through the supplied edit operation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A mounted row coordinates presentation fields without sharing numerical requests or cached admission across authored changes.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The target owns constant row DOM and listeners until redraw or parent close; pending transaction completion belongs to the panel and this helper acquires no worker or GPU handle.
 */
export function appendConnectedFaceControlRow(
  control: IConnectedFaceControlEntry,
  props: IAppendConnectedFaceControlRowProps,
): void {
  if (
    !(control.id + control.label + (control.group ?? ""))
      .toLowerCase()
      .replace(/\s/g, "")
      .includes(props.query)
  )
    return;
  const dom: Document = props.target.ownerDocument;
  const row: HTMLDivElement = dom.createElement("div");
  const label: HTMLLabelElement = dom.createElement("label");
  const entry: HTMLDivElement = dom.createElement("div");
  row.className = "row";
  label.textContent = control.label;
  const slider: HTMLInputElement = dom.createElement("input");
  const number: HTMLInputElement = dom.createElement("input");
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
  const edit: (value: string) => Promise<void> = async (value: string): Promise<void> => {
    try {
      if (value.trim() === "") throw new Error("A numeric value is required.");
      await props.change(control.edit(Number(value)));
    } catch (error) {
      props.refuse(error);
      props.render();
    }
  };
  slider.oninput = (): void => {
    number.value = slider.value;
  };
  slider.onchange = (): Promise<void> => edit(slider.value);
  number.onchange = (): Promise<void> => edit(number.value);
  entry.append(slider, number);
  const note: HTMLElement = dom.createElement("small");
  note.id =
    (props.simple ? "face-simple-description-" : "face-scale-") + control.id;
  note.textContent = control.description;
  row.append(label, entry, note);
  props.target.append(row);
}
