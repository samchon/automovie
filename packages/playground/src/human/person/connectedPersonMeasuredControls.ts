import { HUMAN_PERSON_MEASUREMENTS } from "@automovie/human";

import type { IConnectedPersonMeasuredControlsProps } from "./IConnectedPersonMeasuredControlsProps";

/**
 * Render one row per person measurement (`HUMAN_PERSON_MEASUREMENTS`): a
 * measurement whose site crosses the head/body cut, read on the whole
 * person's final skin at rest and solved along its body channel in the
 * measurement worker.
 *
 * Each row shows the committed person's current reading, takes a target in
 * millimetres, and commits the solved person through the panel's transaction
 * under a fresh intent ticket; a newer intent discards the reply. The report
 * line states the requested and the remeasured value and whether the target
 * lies within the source sample; a target outside it is solved and marked,
 * not refused. A refusal (outside the channel's reach, an unreadable skin, a
 * generation that lacks the channel's head rows) keeps the committed person.
 * `refresh` re-reads the current values after a commit; only the latest read
 * is shown.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-measurements Lets the user read and target measurements that cross the head/body cut in millimetres.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-measurements Reads each person measurement on the final skin at rest and solves it along its body channel.
 * @author Samchon
 */
export function mountConnectedPersonMeasuredControls(props: IConnectedPersonMeasuredControlsProps) {
  const mm = (metres: number): string => (metres * 1000).toFixed(1) + " mm";
  const readings = new Map<string, HTMLElement>();
  let generation = 0;
  for (const [channel, rule] of Object.entries(HUMAN_PERSON_MEASUREMENTS)) {
    const row = props.dom.createElement("div");
    const label = props.dom.createElement("label");
    const entry = props.dom.createElement("div");
    const number = props.dom.createElement("input");
    const apply = props.dom.createElement("button");
    const reading = props.dom.createElement("small");
    const note = props.dom.createElement("small");
    row.className = "row";
    label.textContent = channel.replace(/([a-z])([A-Z])/gu, "$1 $2") + " (girth across the neck cut, mm)";
    number.id = "person-control-" + channel;
    number.type = "number";
    number.step = "0.1";
    number.placeholder = "Target mm";
    label.htmlFor = number.id;
    apply.type = "button";
    apply.textContent = "Set measurement";
    reading.textContent = "Current: reading…";
    note.textContent =
      `Read on the whole person at rest. The source sample observed ${mm(rule.sampleMinimumMetres)} to ` +
      `${mm(rule.sampleMaximumMetres)}; a target outside it is solved and marked as outside the source sample.`;
    apply.onclick = async (): Promise<void> => {
      const ticket = props.reserve();
      const requested = number.value.trim();
      if (requested === "" || !Number.isFinite(Number(requested))) {
        props.refuse("A finite measurement in millimetres is required.");
        return;
      }
      const targetMetres = Number(requested) / 1000;
      props.busy("Solving " + channel + " on the whole person…");
      try {
        const solved = await props.solve(structuredClone(props.current()), channel, targetMetres);
        if (!props.isCurrent(ticket)) return;
        const success = await props.change(solved.document, ticket);
        if (success && props.isCurrent(ticket))
          props.report(
            `${channel}: requested ${mm(targetMetres)}, final Float32 skin ${mm(solved.actualMetres)} ` +
              `(${((solved.actualMetres - targetMetres) * 1000).toFixed(2)} mm), ${solved.population}.`,
          );
      } catch (error) {
        if (props.isCurrent(ticket)) props.refuse(error);
      }
    };
    entry.append(number, apply);
    row.append(label, entry, reading, note);
    props.container.append(row);
    readings.set(channel, reading);
  }
  return {
    refresh: (): void => {
      const current = ++generation;
      const document = structuredClone(props.current());
      for (const [channel, reading] of readings)
        void (async (): Promise<void> => {
          let text: string;
          try {
            text = mm(await props.read(document, channel));
          } catch (error) {
            text = error instanceof Error ? error.message : String(error);
          }
          if (current === generation) reading.textContent = "Current: " + text;
        })();
    },
  };
}
