import { HUMAN_HEAD_MEASUREMENTS, HUMAN_PERSON_HEAD_SOLVE } from "@automovie/human";

import type { IConnectedPersonHeadControlsProps } from "./IConnectedPersonHeadControlsProps";

/**
 * Render the head measurement controls: one row per measurement of
 * `HUMAN_PERSON_HEAD_SOLVE`, each with the committed person's current reading
 * and a target in millimetres, and one action that solves the head.
 *
 * The met measurements need a target; head circumference is optional and is
 * pursued only within the freedom they leave. The solve runs in the
 * measurement worker and commits the solved person through the panel's
 * transaction under a fresh intent ticket, the same path as the girth and
 * stature rows; a newer intent discards the reply. The report states, per
 * measurement, the target and what the final skin measures, the circumference
 * miss when a target was given, the departure from the standard head and
 * every channel value the solve set. A refusal (a target beyond the channels'
 * reach together, a missing target, an unreadable skin) keeps the committed
 * person and shows the worker's text, which names the closest readings and the
 * channels at their limits.
 *
 * The note under the rows names the head's open gaps: circumference at a given
 * length and breadth falls short for fuller heads, and two channels show shape
 * faults near their far ends (`posteriorHeadDepth` at 1, `cranialBreadth` near
 * its maximum). The solve may use any value in a channel's envelope; the report
 * shows every value so a far end is visible.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Lets the user target the head's ANSUR II measurements in millimetres and see what the solved head measures.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Reads and solves the head measurements through the measurement worker and the person's transaction.
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor-state Keeps the committed person when the solve is refused or superseded.
 * @author Samchon
 */
export function mountConnectedPersonHeadControls(props: IConnectedPersonHeadControlsProps) {
  const mm = (metres: number): string => (metres * 1000).toFixed(1) + " mm";
  const label = (name: string): string => name.replace(/([a-z])([A-Z])/gu, "$1 $2").toLowerCase();
  const names = [...HUMAN_PERSON_HEAD_SOLVE.measurements, ...HUMAN_PERSON_HEAD_SOLVE.secondary];
  const inputs = new Map<string, HTMLInputElement>();
  const readings = new Map<string, HTMLElement>();
  let generation = 0;
  for (const name of names) {
    const rule = HUMAN_HEAD_MEASUREMENTS[name];
    const row = props.dom.createElement("div");
    const caption = props.dom.createElement("label");
    const number = props.dom.createElement("input");
    const reading = props.dom.createElement("small");
    row.className = "row";
    const optional = HUMAN_PERSON_HEAD_SOLVE.secondary.includes(name);
    caption.textContent = `${label(name)} (mm${optional ? ", optional, pursued second" : ""}; ANSUR II ${mm(rule.sampleMinimumMetres)}–${mm(rule.sampleMaximumMetres)})`;
    number.id = "head-control-" + name;
    number.type = "number";
    number.step = "0.1";
    number.placeholder = "Target mm";
    caption.htmlFor = number.id;
    reading.textContent = "Current: reading…";
    row.append(caption, number, reading);
    props.container.append(row);
    inputs.set(name, number);
    readings.set(name, reading);
  }
  const apply = props.dom.createElement("button");
  apply.type = "button";
  apply.textContent = "Solve head";
  const note = props.dom.createElement("small");
  note.textContent =
    "Solved on face channels " + HUMAN_PERSON_HEAD_SOLVE.channels.join(", ") +
    ", least departure from the standard head. Open gaps: circumference falls short for fuller heads (no cranial fullness channel; " +
    "the hair ANSUR's tape compresses is not separable); posteriorHeadDepth at 1 balloons the back of the head over the neck and " +
    "cranialBreadth near its maximum raises bosses over the temples. Every channel value the solve sets is reported.";
  props.container.append(apply, note);
  apply.onclick = async (): Promise<void> => {
    const ticket = props.reserve();
    const targets: Record<string, number> = {};
    for (const name of names) {
      const text = inputs.get(name)!.value.trim();
      if (text === "") continue;
      if (!Number.isFinite(Number(text))) {
        props.refuse(`A finite ${label(name)} in millimetres is required.`);
        return;
      }
      targets[name] = Number(text) / 1000;
    }
    props.busy("Solving the head…");
    try {
      const solved = await props.solve(structuredClone(props.current()), targets);
      if (!props.isCurrent(ticket)) return;
      const success = await props.change(solved.document, ticket);
      if (!success || !props.isCurrent(ticket)) return;
      const lines = names
        .filter((name) => targets[name] !== undefined)
        .map((name) => `${label(name)} ${mm(targets[name])} → ${mm(solved.readings[name])} (${((solved.readings[name] - targets[name]) * 1000).toFixed(2)} mm)`);
      const channels = HUMAN_PERSON_HEAD_SOLVE.channels
        .map((id) => `${id} ${(solved.document.face.shape[id] ?? 0).toFixed(3)}`)
        .join(", ");
      props.report(`Head solved: ${lines.join("; ")}. Departure ${mm(solved.departureMetres)}. Channels: ${channels}.`);
    } catch (error) {
      if (props.isCurrent(ticket)) props.refuse(error);
    }
  };
  return {
    refresh: (): void => {
      const current = ++generation;
      void (async (): Promise<void> => {
        let values: Record<string, number> | undefined;
        let failure = "";
        try {
          values = await props.read(structuredClone(props.current()));
        } catch (error) {
          failure = error instanceof Error ? error.message : String(error);
        }
        if (current !== generation) return;
        for (const [name, reading] of readings)
          reading.textContent = "Current: " + (values === undefined ? failure : mm(values[name]));
      })();
    },
  };
}
