import { HUMAN_BODY_ANSUR_II_REFERENCE } from "@automovie/human/body/constants/HUMAN_BODY_ANSUR_II_REFERENCE";
import type { IAutoMovieHumanBodyBasisDocument, IAutoMovieHumanBodyChannelScale } from "@automovie/human";

import type { IBodyMeasuredControlsProps } from "./IBodyMeasuredControlsProps";
import { bodyMeasuredChannel } from "./bodyMeasuredChannel";

/**
 * Edit only detailed controls with a defined body measurement in millimetres.
 *
 * Only an own measurement rule with evaluable endpoints receives a row; vertex-displacement statistics and target-only bindings do not. Anatomical-target-only channels remain in the person editor's Anatomy group rather than gaining a second control for the same weight.
 *
 * Source endpoints describe supported reach, while displayed population bands are descriptive and never clamp entry. The worker inverts one bounded channel with the other weights held; missing sections, reversal or unreachable targets refuse and preserve the committed body.
 *
 * The parent retains typed targets by channel across redraws without serializing them. Shared intent tickets discard replies after any newer body edit, and the solver's achieved length is reported only after a still-current successful commit. That shape-only solver reading is not a second measurement of the final committed body: authored anatomy can be reapplied during admission.
 *
 * @evidence contracts/common.md#principled-implementation Only channels admitted by the shared own-measurement predicate receive targets, millimetre text is converted to metres at the solver boundary, and shared intent tickets gate numerical result and status effects.
 * @evidence contracts/common.md#clear-and-simple-design The renderer owns measured rows and input conversion while the Human inverse owns shape evaluation and the panel owns draft persistence, document admission and history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Population bands remain descriptive instead of input clamps, missing measurements receive no fabricated controls, and a still-current successful commit reports the solver reading without falsely claiming a final-body measurement after anatomy reapplication.
 * @evidence contracts/common.md#meaningful-documentation The comment distinguishes physical measurements from displacement statistics, supported reach from clinical limits, parent-owned text drafts and stale-result or numerical refusal behavior.
 * @evidence contracts/performance.md#efficient-algorithms One scan of c channels creates a rows with constant metadata and map lookups per row, using O(a) DOM and listener storage without an intermediate filtered array; inverse evaluation cost remains with the off-thread solver.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work This mount coordinates no repeated numerical result cache; parent-owned text drafts survive redraw while each actual Apply reserves a distinct intent.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The supplied container owns a row and listeners per eligible channel until replacement or panel close; the parent owns text-map lifetime and the solver transport owns asynchronous request retirement.
 */
export function renderBodyMeasuredControls(
  props: IBodyMeasuredControlsProps,
): void {
  const mm: (metres: number | null) => string = (metres: number | null): string =>
    metres === null ? "n/a" : (metres * 1000).toFixed(1) + " mm";
  const interval: (band: readonly [number, number]) => string = (band: readonly [number, number]): string =>
    `${band[0].toFixed(1)}–${band[1].toFixed(1)} mm`;
  for (const channel of props.basis.channels) {
    if (channel.group !== props.kind ||
        !channel.id.toLowerCase().includes(props.query) ||
        !bodyMeasuredChannel(channel, props.scales.get(channel.id))) continue;
    const measurement: NonNullable<IAutoMovieHumanBodyChannelScale["measurement"]> = props.scales.get(channel.id)!.measurement!;
    const row: HTMLDivElement = props.dom.createElement("div");
    const label: HTMLLabelElement = props.dom.createElement("label");
    const entry: HTMLDivElement = props.dom.createElement("div");
    const number: HTMLInputElement = props.dom.createElement("input");
    const apply: HTMLButtonElement = props.dom.createElement("button");
    const note: HTMLElement = props.dom.createElement("small");
    row.className = "row";
    label.textContent =
      channel.id.replace(/([a-z])([A-Z])/gu, "$1 $2") +
      ` (${measurement.kind}, mm)`;
    number.id = "body-control-" + channel.id;
    number.type = "number";
    number.step = "0.1";
    number.placeholder = "Target mm";
    number.value = props.drafts.get(channel.id) ?? "";
    number.oninput = (): void => { props.drafts.set(channel.id, number.value); };
    label.htmlFor = number.id;
    apply.type = "button";
    apply.textContent = "Set measurement";
    apply.onclick = async (): Promise<void> => {
      props.drafts.set(channel.id, number.value);
      const ticket: number = props.reserve();
      const requested: string = number.value.trim();
      if (requested === "" || !Number.isFinite(Number(requested))) {
        props.refuse("A finite measurement in millimetres is required.");
        return;
      }
      const current: IAutoMovieHumanBodyBasisDocument = structuredClone(props.current());
      props.busy("Solving " + channel.id + " on the current body…");
      try {
        const result: Awaited<ReturnType<IBodyMeasuredControlsProps["solve"]>> = await props.solve(
          current.shape,
          channel.id,
          Number(requested) / 1000,
        );
        if (!props.isCurrent(ticket)) return;
        const success: boolean = await props.change(
          { ...current, shape: result.shape },
          ticket,
        );
        if (success && props.isCurrent(ticket))
          props.report(
            `${channel.id}: solver read ${(result.actualMetres * 1000).toFixed(1)} mm; document committed.`,
          );
      } catch (error) {
        if (props.isCurrent(ticket)) props.refuse(error);
      }
    };
    entry.append(number, apply);
    note.id = "body-scale-" + channel.id;
    const reference: ReturnType<typeof HUMAN_BODY_ANSUR_II_REFERENCE.get> = HUMAN_BODY_ANSUR_II_REFERENCE.get(channel.id);
    const population: string =
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
