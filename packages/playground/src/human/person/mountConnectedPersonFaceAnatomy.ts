import type {
  AutoMovieHumanFaceMeasurementReading,
  IAutoMovieHumanFaceAnatomicalRequest,
  IAutoMovieHumanFaceMeasurementMeasured,
} from "@automovie/human";
import { HUMAN_FACE_MEASUREMENTS } from "@automovie/human/face/anatomy/resolution/HUMAN_FACE_MEASUREMENTS";

import type { IConnectedPersonFaceAnatomyProps } from "./IConnectedPersonFaceAnatomyProps";

/**
 * Render the face anatomy panel of the person editor: every registered face
 * measurement grouped by its part, with its current reading on the person's
 * face and, where the measurement lists a channel, a target the worker solves.
 *
 * A reading shows its value and unit, or the named reason the face cannot
 * read it (a missing landmark, rule or registration). It keeps the registry's
 * source/protocol qualification beside the value and formats each declared
 * unit, including area, without guessing from the measurement's name.
 * A target is offered only
 * for a measurement whose registry entry lists a channel, and its input and
 * Solve stay disabled while the reading is unavailable, enabling again as soon
 * as the face can read it; applying it solves
 * that channel through the worker and commits the person with the solved
 * weight and the target recorded in `face.anatomical.targets`, so admission,
 * last-valid state, undo and save/reload are the editor's. The clinical
 * observations record (`face.anatomical.observations`) is edited as JSON and
 * applied through the same transaction; the face admission keeps or refuses
 * each field by name. A failed build preserves the previous display; a refused construction can be shown as a labelled draft. Only the panel's state identifies accepted history.
 *
 * @evidence contracts/common.md#principled-implementation Registered measurement rules determine grouping/units/target support, whole-person worker reads retain qualification/unavailability and current shared intent gates solved/observational candidate submission and reporting.
 * @evidence contracts/common.md#clear-and-simple-design This section owns form text and registry-driven presentation, while numerical inverses/readback and complete-person observation admission/history remain worker/panel responsibilities.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Unsupported measurements remain unavailable, clinical observation JSON stays separate from numerical styling targets and successful transaction publication may remain a labelled refused draft.
 * @evidence contracts/common.md#meaningful-documentation The comment specifies registry units/channels, qualified readback, observation-versus-target semantics and actual failed-build/draft/accepted-history outcomes.
 * @evidence contracts/performance.md#efficient-algorithms Mount visits r registered rules to build groups/rows; refresh clones no person data itself, schedules actual numerical reading, then indexes v readings and t stored targets before one O(r) row pass, avoiding repeated per-row linear reading searches while preserving first-reading match semantics.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work One refresh reading array serves all rows through a local index, but no result is cached across person documents or registry inputs; resident compiled-generation reuse stays with the worker.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Finite registry row/control maps and a numeric latest-refresh guard live with the mounted panel, with no local pending-read cap/cancellation or precision-exhaustion check. Old tasks retain their closures until transport settlement/close, and parent DOM removal plus released mounted handles ends normal row reachability.
 *
 * @author Samchon
 */
export function mountConnectedPersonFaceAnatomy(
  props: IConnectedPersonFaceAnatomyProps,
): { /** Repaint observation text and schedule registered face readings without awaiting them. */ refresh: () => void } {
  const groups: Map<string, (typeof HUMAN_FACE_MEASUREMENTS)[number][]> = new Map();
  for (const measurement of HUMAN_FACE_MEASUREMENTS) {
    const group: string = measurement.id.split(".")[0];
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(measurement);
  }
  const readings: Map<string, HTMLElement> = new Map();
  const controls: Map<string, (HTMLInputElement | HTMLButtonElement)[]> = new Map();
  const units: Record<IAutoMovieHumanFaceMeasurementMeasured["unit"], string> =
    {
      millimetres: "mm",
      "square-millimetres": "mm²",
      degrees: "°",
      "cubic-centimetres": "cm³",
      count: "count",
    };
  const unit: (name: IAutoMovieHumanFaceMeasurementMeasured["unit"]) => string = (name: IAutoMovieHumanFaceMeasurementMeasured["unit"]): string =>
    units[name];
  const commit: (text: string, next: () => Promise<Parameters<IConnectedPersonFaceAnatomyProps["change"]>[0]>) => Promise<void> = async (
    text: string,
    next: () => Promise<
      Parameters<IConnectedPersonFaceAnatomyProps["change"]>[0]
    >,
  ): Promise<void> => {
    const ticket: number = props.reserve();
    props.busy(text);
    try {
      const document: Parameters<IConnectedPersonFaceAnatomyProps["change"]>[0] = await next();
      if (!props.isCurrent(ticket)) return;
      const success: boolean = await props.change(document, ticket);
      if (success && props.isCurrent(ticket))
        props.report(text.replace(/…$/u, "") + " applied.");
    } catch (error) {
      if (props.isCurrent(ticket)) props.refuse(error);
    }
  };
  for (const [group, measurements] of groups) {
    const details: HTMLDetailsElement = props.dom.createElement("details");
    const summary: HTMLElement = props.dom.createElement("summary");
    summary.textContent = `${group} (${measurements.length})`;
    details.append(summary);
    for (const measurement of measurements) {
      const row: HTMLDivElement = props.dom.createElement("div");
      const caption: HTMLLabelElement = props.dom.createElement("label");
      const reading: HTMLElement = props.dom.createElement("small");
      row.className = "row";
      caption.textContent = `${measurement.id} (${unit(measurement.unit)})`;
      reading.textContent = "Current: reading…";
      row.append(caption);
      if (measurement.channels.length > 0) {
        const number: HTMLInputElement = props.dom.createElement("input");
        const apply: HTMLButtonElement = props.dom.createElement("button");
        number.id = "face-anatomy-" + measurement.id;
        number.type = "number";
        number.step = "0.1";
        number.placeholder = `Target ${unit(measurement.unit)} (${measurement.channels.join(", ")})`;
        caption.htmlFor = number.id;
        apply.type = "button";
        apply.textContent = "Solve";
        apply.onclick = (): void => {
          const target: number = Number(number.value.trim());
          if (number.value.trim() === "" || !Number.isFinite(target)) {
            props.refuse(
              new Error(`A finite ${measurement.id} target is required.`),
            );
            return;
          }
          void commit(
            `Solving ${measurement.id}…`,
            async (): Promise<Parameters<IConnectedPersonFaceAnatomyProps["change"]>[0]> =>
              (await props.solve(props.current(), measurement.id, target))
                .document,
          );
        };
        number.disabled = true;
        apply.disabled = true;
        controls.set(measurement.id, [number, apply]);
        row.append(number, apply);
      }
      row.append(reading);
      details.append(row);
      readings.set(measurement.id, reading);
    }
    props.container.append(details);
  }
  const observations: HTMLTextAreaElement = props.dom.createElement("textarea");
  const applyObservations: HTMLButtonElement = props.dom.createElement("button");
  observations.id = "face-anatomy-observations";
  observations.rows = 6;
  observations.placeholder =
    'Clinical observations JSON, e.g. {"referencePose":"eyes-open-forward-gaze-lips-apposed","jawReference":"maximum-intercuspation","dentition":{"stage":"permanent","overjetMm":2.5}}';
  applyObservations.type = "button";
  applyObservations.textContent = "Apply observations";
  applyObservations.onclick = (): void => {
    const text: string = observations.value.trim();
    void commit("Applying face observations…", async (): Promise<Parameters<IConnectedPersonFaceAnatomyProps["change"]>[0]> => {
      const document: Parameters<IConnectedPersonFaceAnatomyProps["change"]>[0] = structuredClone(props.current());
      const anatomical: IAutoMovieHumanFaceAnatomicalRequest = {
        ...document.face.anatomical,
      };
      if (text === "") delete anatomical.observations;
      else anatomical.observations = JSON.parse(text);
      const face: Parameters<IConnectedPersonFaceAnatomyProps["change"]>[0]["face"] = { ...document.face };
      if (
        anatomical.targets === undefined &&
        anatomical.observations === undefined
      )
        delete face.anatomical;
      else face.anatomical = anatomical;
      return { ...document, face };
    });
  };
  const observationMeaning: HTMLElement = props.dom.createElement("small");
  observationMeaning.textContent =
    "Observation JSON stores measured records with their original protocol. It is separate from the numerical styling targets above and supplies no missing anatomical support.";
  props.container.append(observationMeaning, observations, applyObservations);
  let generation: number = 0;
  return {
    refresh: (): void => {
      const current: number = ++generation;
      const person: ReturnType<IConnectedPersonFaceAnatomyProps["current"]> = props.current();
      const recorded: IAutoMovieHumanFaceAnatomicalRequest["observations"] = person.face.anatomical?.observations;
      if (props.dom.activeElement !== observations)
        observations.value =
          recorded === undefined ? "" : JSON.stringify(recorded);
      void (async (): Promise<void> => {
        let values: AutoMovieHumanFaceMeasurementReading[] | undefined;
        let failure: string = "";
        try {
          values = await props.read(person);
        } catch (error) {
          failure = error instanceof Error ? error.message : String(error);
        }
        if (current !== generation) return;
        const targets: Map<string, number> = new Map(
          (person.face.anatomical?.targets ?? []).map((target: NonNullable<IAutoMovieHumanFaceAnatomicalRequest["targets"]>[number]): [string, number] => [
            target.measurement,
            target.value,
          ]),
        );
        const measured: Map<string, AutoMovieHumanFaceMeasurementReading> = new Map();
        for (const value of values ?? [])
          if (!measured.has(value.measurement)) measured.set(value.measurement, value);
        for (const [id, element] of readings) {
          const value: AutoMovieHumanFaceMeasurementReading | undefined = measured.get(id);
          const target: string = targets.has(id) ? `; target ${targets.get(id)}` : "";
          // a target is offered only while the face can read the measurement
          for (const control of controls.get(id) ?? [])
            control.disabled =
              value === undefined || value.status !== "measured";
          element.textContent =
            value === undefined
              ? "Current: unreadable — " + failure
              : value.status === "measured"
                ? `Current: ${value.measured.toFixed(2)} ${unit(value.unit)}${target}${value.qualification === undefined ? "" : `; ${value.qualification}`}`
                : `Unavailable: ${value.reason}${target}`;
        }
      })();
    },
  };
}
