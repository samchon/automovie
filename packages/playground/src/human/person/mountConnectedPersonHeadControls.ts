import { HUMAN_HEAD_MEASUREMENTS } from "@automovie/human/common/measure/HUMAN_HEAD_MEASUREMENTS";
import { HUMAN_PERSON_HEAD_SOLVE } from "@automovie/human/human/constants/HUMAN_PERSON_HEAD_SOLVE";

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
 * The note distinguishes earlier cranial-source faults from current-source
 * qualification. The solve may use any value in a channel's envelope; the
 * report shows every value so its source endpoints can be inspected.
 * The departure report is the independent-channel endpoint RMS objective, not a measured displacement of the composed skin. Refresh schedules one actual worker read, returning before settlement; its numeric latest-read guard has no explicit precision-exhaustion check.
 *
 * @evidence contracts/common.md#principled-implementation Registered primary/secondary head rules and metre targets flow through the numerical owner, then current whole-person intent authorizes complete-candidate transaction and truthful final-skin/proxy reporting.
 * @evidence contracts/common.md#clear-and-simple-design This section owns target text, millimetre conversion and rendered status while bounded numerical head solve, admission/history and source qualification stay with their actual owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Optional circumference pursuit is not guaranteed met, historical source faults do not certify current source health and endpoint-scale departure does not claim composed-skin readback or accepted history.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes primary/secondary targets, numerical/source qualification, visible channel values, proxy departure and asynchronous latest-read limits.
 * @evidence contracts/performance.md#efficient-algorithms Mount/target collection/reporting visit r configured head rules and c solved channels; solve/read delegate actual whole-person numerical evaluation, while edit clones the current document and refresh performs one worker read plus O(r) row painting.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One returned read record supplies all current rows and static owner rules are reused, but no solve/read result is cached across complete documents or target sets.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finite input/reading maps and a generation scalar live with the mounted panel; pending reads/solves have no section-local cap/cancellation and retain closures until actual transport settlement/close, with external mounted handles/elements caller-owned after parent DOM removal.
 *
 * @author Samchon
 */
export function mountConnectedPersonHeadControls(
  props: IConnectedPersonHeadControlsProps,
): { /** Schedule current head readback without awaiting numerical completion. */ refresh: () => void } {
  const mm: (metres: number) => string = (metres: number): string => (metres * 1000).toFixed(1) + " mm";
  const label: (name: string) => string = (name: string): string =>
    name.replace(/([a-z])([A-Z])/gu, "$1 $2").toLowerCase();
  const names: string[] = [
    ...HUMAN_PERSON_HEAD_SOLVE.measurements,
    ...HUMAN_PERSON_HEAD_SOLVE.secondary,
  ];
  const inputs: Map<string, HTMLInputElement> = new Map();
  const readings: Map<string, HTMLElement> = new Map();
  let generation: number = 0;
  for (const name of names) {
    const rule: (typeof HUMAN_HEAD_MEASUREMENTS)[string] = HUMAN_HEAD_MEASUREMENTS[name];
    const row: HTMLDivElement = props.dom.createElement("div");
    const caption: HTMLLabelElement = props.dom.createElement("label");
    const number: HTMLInputElement = props.dom.createElement("input");
    const reading: HTMLElement = props.dom.createElement("small");
    row.className = "row";
    const optional: boolean = HUMAN_PERSON_HEAD_SOLVE.secondary.includes(name);
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
  const apply: HTMLButtonElement = props.dom.createElement("button");
  apply.type = "button";
  apply.textContent = "Solve head";
  const note: HTMLElement = props.dom.createElement("small");
  note.textContent =
    "Solved on face channels " +
    HUMAN_PERSON_HEAD_SOLVE.channels.join(", ") +
    ", least departure from the standard head. Circumference and cranial shape need qualification on this source generation. " +
    "Earlier source observations found posterior depth and breadth faults; they do not establish this source's current result. " +
    "Every channel value the solve sets is reported.";
  props.container.append(apply, note);
  apply.onclick = async (): Promise<void> => {
    const ticket: number = props.reserve();
    const targets: Record<string, number> = {};
    for (const name of names) {
      const text: string = inputs.get(name)!.value.trim();
      if (text === "") continue;
      if (!Number.isFinite(Number(text))) {
        props.refuse(`A finite ${label(name)} in millimetres is required.`);
        return;
      }
      targets[name] = Number(text) / 1000;
    }
    props.busy("Solving the head…");
    try {
      const solved: Awaited<ReturnType<IConnectedPersonHeadControlsProps["solve"]>> = await props.solve(
        structuredClone(props.current()),
        targets,
      );
      if (!props.isCurrent(ticket)) return;
      const success: boolean = await props.change(solved.document, ticket);
      if (!success || !props.isCurrent(ticket)) return;
      const lines: string[] = names
        .filter((name: string): boolean => targets[name] !== undefined)
        .map(
          (name: string): string =>
            `${label(name)} ${mm(targets[name])} → ${mm(solved.readings[name])} (${((solved.readings[name] - targets[name]) * 1000).toFixed(2)} mm)`,
        );
      const channels: string = HUMAN_PERSON_HEAD_SOLVE.channels
        .map(
          (id: string): string => `${id} ${(solved.document.face.shape[id] ?? 0).toFixed(3)}`,
        )
        .join(", ");
      props.report(
        `Head solved: ${lines.join("; ")}. Channel departure proxy ${mm(solved.departureMetres)}. Channels: ${channels}.`,
      );
    } catch (error) {
      if (props.isCurrent(ticket)) props.refuse(error);
    }
  };
  return {
    refresh: (): void => {
      const current: number = ++generation;
      void (async (): Promise<void> => {
        let values: Record<string, number> | undefined;
        let failure: string = "";
        try {
          values = await props.read(structuredClone(props.current()));
        } catch (error) {
          failure = error instanceof Error ? error.message : String(error);
        }
        if (current !== generation) return;
        for (const [name, reading] of readings)
          reading.textContent =
            "Current: " + (values === undefined ? failure : mm(values[name]));
      })();
    },
  };
}
