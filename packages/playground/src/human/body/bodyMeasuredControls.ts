import { HUMAN_BODY_ANSUR_II_REFERENCE } from "@automovie/human";

import type { IBodyMeasuredControlsProps } from "./IBodyMeasuredControlsProps";
import { bodyMeasuredChannel } from "./bodyMeasuredChannel";

/**
 * Edit only detailed controls with a defined body measurement in millimetres.
 *
 * A legacy channel whose only description is the RMS or peak of a vertex
 * displacement is an internal morph, not an anatomical parameter to ask a
 * person to sculpt. This panel offers exterior girth, breadth and height or
 * landmark distance when `HUMAN_BODY_MEASUREMENTS` supplies a rule and the
 * loaded basis can evaluate it (`bodyMeasuredChannel`); a one-sided channel
 * that only answers an anatomical target is the person editor's Anatomy
 * group's row, never a second row here. A basis envelope is the supported asset reach,
 * not a clinical normal range. Four comparable tapes also show the 1st–99th
 * percentiles of the ANSUR II 17–58-year-old soldier sample; the entry remains
 * editable outside that descriptive population band. The worker inverts the
 * actual measured body along that one bounded channel, with every other
 * shape value fixed. A missing section, reversal or unreachable request is
 * refused and the last committed body remains. The parent panel's intent
 * ticket discards an old
 * numerical reply after any newer document, pose or simple-tier edit.
 * The parent owns uncommitted text by channel ID so a pose or history redraw
 * cannot erase a measurement the user is still entering. Only a successful
 * solve changes the body document; this draft map is never serialized.
 */
export function renderBodyMeasuredControls(props: IBodyMeasuredControlsProps): void {
  const mm = (metres: number | null): string =>
    metres === null ? "n/a" : (metres * 1000).toFixed(1) + " mm";
  const interval = (band: readonly [number, number]): string =>
    `${band[0].toFixed(1)}–${band[1].toFixed(1)} mm`;
  for (const channel of props.basis.channels.filter(
    (one) =>
      one.group === props.kind &&
      one.id.toLowerCase().includes(props.query) &&
      bodyMeasuredChannel(one, props.scales.get(one.id)),
  )) {
    const measurement = props.scales.get(channel.id)!.measurement!;
    const row = props.dom.createElement("div");
    const label = props.dom.createElement("label");
    const entry = props.dom.createElement("div");
    const number = props.dom.createElement("input");
    const apply = props.dom.createElement("button");
    const note = props.dom.createElement("small");
    row.className = "row";
    label.textContent =
      channel.id.replace(/([a-z])([A-Z])/gu, "$1 $2") +
      ` (${measurement.kind}, mm)`;
    number.id = "body-control-" + channel.id;
    number.type = "number";
    number.step = "0.1";
    number.placeholder = "Target mm";
    number.value = props.drafts.get(channel.id) ?? "";
    number.oninput = () => props.drafts.set(channel.id, number.value);
    label.htmlFor = number.id;
    apply.type = "button";
    apply.textContent = "Set measurement";
    apply.onclick = async (): Promise<void> => {
      props.drafts.set(channel.id, number.value);
      const ticket = props.reserve();
      const requested = number.value.trim();
      if (requested === "" || !Number.isFinite(Number(requested))) {
        props.refuse("A finite measurement in millimetres is required.");
        return;
      }
      const current = structuredClone(props.current());
      props.busy("Solving " + channel.id + " on the current body…");
      try {
        const result = await props.solve(
          current.shape,
          channel.id,
          Number(requested) / 1000,
        );
        if (!props.isCurrent(ticket)) return;
        const success = await props.change(
          { ...current, shape: result.shape },
          ticket,
        );
        if (success && props.isCurrent(ticket))
          props.report(
            `${channel.id}: ${(result.actualMetres * 1000).toFixed(1)} mm measured on the committed body.`,
          );
      } catch (error) {
        if (props.isCurrent(ticket)) props.refuse(error);
      }
    };
    entry.append(number, apply);
    note.id = "body-scale-" + channel.id;
    const reference = HUMAN_BODY_ANSUR_II_REFERENCE.get(channel.id);
    const population =
      reference === undefined
        ? ""
        : ` ANSUR II soldiers age 17–58 (P1–P99): ` +
          `women ${interval(reference.femaleMillimetres)}; ` +
          `men ${interval(reference.maleMillimetres)}. ` +
          "Observed sample only; no clinical limit.";
    note.textContent =
      `Neutral ${mm(measurement.neutral)}; source endpoints ` +
      [measurement.negative, measurement.positive].map(mm).join(" to ") +
      ". The current body's reach may differ." +
      population;
    row.append(label, entry, note);
    props.container.append(row);
  }
}
