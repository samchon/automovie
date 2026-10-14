import { HUMAN_PERSON_MEASUREMENTS } from "@automovie/human/human/constants/HUMAN_PERSON_MEASUREMENTS";

import type { IConnectedPersonMeasuredControlsProps } from "./IConnectedPersonMeasuredControlsProps";

/**
 * Render one row per person measurement (`HUMAN_PERSON_MEASUREMENTS`): a girth whose site crosses the head/body cut, or the stature of the closed skin, read on the whole person at rest and solved along its body channel in the measurement worker. Each row's label names its kind.
 *
 * Each row shows the displayed person's current reading, takes a target in millimetres, and submits the solved candidate through the panel's transaction under a fresh intent ticket; a newer intent discards the reply. The report line states the requested and the remeasured value and whether the target lies within the source sample; a target outside it is solved and marked, not refused. A refusal (outside the channel's reach, an unreadable skin, a generation that lacks the channel's head rows) keeps the committed person. `refresh` re-reads the current values after a commit; only the latest read is shown. The panel identifies accepted history versus labelled draft publication; cleanup refusal can follow an earlier display and does not imply rollback.
 *
 * Refresh schedules one worker read per registered row and returns before numerical settlement. Its numeric generation guard suppresses older paints but has no explicit precision-exhaustion check; the resident transport owns cancellation and resource close.
 *
 * @evidence contracts/common.md#principled-implementation Registered whole-person rest-skin instruments and metre targets flow through the shared intent-bound worker solve and panel transaction, with current-ticket reporting and latest-generation read presentation.
 * @evidence contracts/common.md#clear-and-simple-design This section owns row DOM, millimetre display/input conversion and status lines while numerical read/solve and accepted-versus-draft person publication remain existing owners.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Source-sample membership is reported rather than used to clamp targets, missing support/read failures preserve last-valid state and numerical completion is not alone accepted history.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies whole-person rest provenance, units, sample classification, asynchronous refresh and actual guard/cancellation boundaries.
 * @evidence contracts/performance.md#efficient-algorithms Mount creates O(r) rows for r registered instruments; an edit clones its full current document before numerical inversion, and refresh clones one document then schedules r actual worker measurements. Worker construction/read costs are retained in that path rather than claimed as constant UI reads.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One cloned refresh document is shared across that refresh's row reads, but no measurement result is cached across document/channel changes; the numerical owner may reuse its compiled generation.
 * @evidence contracts/performance.md#bound-retention-and-release-resources One row map and generation scalar remain with the mounted panel; pending refreshes have no local task cap/cancellation and may retain old closures until transport settlement/close. Parent DOM removal and released mounted handles end row reachability, with external handles caller-owned.
 *
 * @author Samchon
 */
export function mountConnectedPersonMeasuredControls(
  props: IConnectedPersonMeasuredControlsProps,
): { /** Schedule current readings without awaiting their numerical completion. */ refresh: () => void } {
  const mm: (metres: number) => string = (metres: number): string => (metres * 1000).toFixed(1) + " mm";
  const readings: Map<string, HTMLElement> = new Map();
  let generation: number = 0;
  for (const [channel, rule] of Object.entries(HUMAN_PERSON_MEASUREMENTS)) {
    const row: HTMLDivElement = props.dom.createElement("div");
    const label: HTMLLabelElement = props.dom.createElement("label");
    const entry: HTMLDivElement = props.dom.createElement("div");
    const number: HTMLInputElement = props.dom.createElement("input");
    const apply: HTMLButtonElement = props.dom.createElement("button");
    const reading: HTMLElement = props.dom.createElement("small");
    const note: HTMLElement = props.dom.createElement("small");
    row.className = "row";
    const site: string =
      rule.kind === "girth"
        ? "girth across the neck cut"
        : "stature, floor to the top of the head";
    label.textContent =
      channel.replace(/([a-z])([A-Z])/gu, "$1 $2") + " (" + site + ", mm)";
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
      const ticket: number = props.reserve();
      const requested: string = number.value.trim();
      if (requested === "" || !Number.isFinite(Number(requested))) {
        props.refuse("A finite measurement in millimetres is required.");
        return;
      }
      const targetMetres: number = Number(requested) / 1000;
      props.busy("Solving " + channel + " on the whole person…");
      try {
        const solved: Awaited<ReturnType<IConnectedPersonMeasuredControlsProps["solve"]>> = await props.solve(
          structuredClone(props.current()),
          channel,
          targetMetres,
        );
        if (!props.isCurrent(ticket)) return;
        const success: boolean = await props.change(solved.document, ticket);
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
      const current: number = ++generation;
      const document: ReturnType<IConnectedPersonMeasuredControlsProps["current"]> = structuredClone(props.current());
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
