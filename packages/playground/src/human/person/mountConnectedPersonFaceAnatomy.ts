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
 * each field by name. A refusal keeps the displayed person and shows the
 * reason; only the panel's state identifies an accepted history commit.
 *
 * @evidence requirements/actors/facial-authoring/contract.md#actor-face-editor Displays grouped anatomical readouts and supported numeric targets through the person's committed editor state.
 * @evidence specifications/asset-and-representation/facial-authoring/contract.md#face-spec-editor-view Displays registry units and source qualifications without changing document values, and submits observations and solvable targets through the supplied person transaction.
 * @author Samchon
 */
export function mountConnectedPersonFaceAnatomy(
  props: IConnectedPersonFaceAnatomyProps,
) {
  const groups = new Map<string, (typeof HUMAN_FACE_MEASUREMENTS)[number][]>();
  for (const measurement of HUMAN_FACE_MEASUREMENTS) {
    const group = measurement.id.split(".")[0];
    if (!groups.has(group)) groups.set(group, []);
    groups.get(group)!.push(measurement);
  }
  const readings = new Map<string, HTMLElement>();
  const controls = new Map<string, (HTMLInputElement | HTMLButtonElement)[]>();
  const units: Record<IAutoMovieHumanFaceMeasurementMeasured["unit"], string> =
    {
      millimetres: "mm",
      "square-millimetres": "mm²",
      degrees: "°",
      "cubic-centimetres": "cm³",
      count: "count",
    };
  const unit = (name: IAutoMovieHumanFaceMeasurementMeasured["unit"]): string =>
    units[name];
  const commit = async (
    text: string,
    next: () => Promise<
      Parameters<IConnectedPersonFaceAnatomyProps["change"]>[0]
    >,
  ): Promise<void> => {
    const ticket = props.reserve();
    props.busy(text);
    try {
      const document = await next();
      if (!props.isCurrent(ticket)) return;
      const success = await props.change(document, ticket);
      if (success && props.isCurrent(ticket))
        props.report(text.replace(/…$/u, "") + " applied.");
    } catch (error) {
      if (props.isCurrent(ticket)) props.refuse(error);
    }
  };
  for (const [group, measurements] of groups) {
    const details = props.dom.createElement("details");
    const summary = props.dom.createElement("summary");
    summary.textContent = `${group} (${measurements.length})`;
    details.append(summary);
    for (const measurement of measurements) {
      const row = props.dom.createElement("div");
      const caption = props.dom.createElement("label");
      const reading = props.dom.createElement("small");
      row.className = "row";
      caption.textContent = `${measurement.id} (${unit(measurement.unit)})`;
      reading.textContent = "Current: reading…";
      row.append(caption);
      if (measurement.channels.length > 0) {
        const number = props.dom.createElement("input");
        const apply = props.dom.createElement("button");
        number.id = "face-anatomy-" + measurement.id;
        number.type = "number";
        number.step = "0.1";
        number.placeholder = `Target ${unit(measurement.unit)} (${measurement.channels.join(", ")})`;
        caption.htmlFor = number.id;
        apply.type = "button";
        apply.textContent = "Solve";
        apply.onclick = () => {
          const target = Number(number.value.trim());
          if (number.value.trim() === "" || !Number.isFinite(target)) {
            props.refuse(
              new Error(`A finite ${measurement.id} target is required.`),
            );
            return;
          }
          void commit(
            `Solving ${measurement.id}…`,
            async () =>
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
  const observations = props.dom.createElement("textarea");
  const applyObservations = props.dom.createElement("button");
  observations.id = "face-anatomy-observations";
  observations.rows = 6;
  observations.placeholder =
    'Clinical observations JSON, e.g. {"referencePose":"eyes-open-forward-gaze-lips-apposed","jawReference":"maximum-intercuspation","dentition":{"stage":"permanent","overjetMm":2.5}}';
  applyObservations.type = "button";
  applyObservations.textContent = "Apply observations";
  applyObservations.onclick = () => {
    const text = observations.value.trim();
    void commit("Applying face observations…", async () => {
      const document = structuredClone(props.current());
      const anatomical: IAutoMovieHumanFaceAnatomicalRequest = {
        ...document.face.anatomical,
      };
      if (text === "") delete anatomical.observations;
      else anatomical.observations = JSON.parse(text);
      const face = { ...document.face };
      if (
        anatomical.targets === undefined &&
        anatomical.observations === undefined
      )
        delete face.anatomical;
      else face.anatomical = anatomical;
      return { ...document, face };
    });
  };
  const observationMeaning = props.dom.createElement("small");
  observationMeaning.textContent =
    "Observation JSON stores measured records with their original protocol. It is separate from the numerical styling targets above and supplies no missing anatomical support.";
  props.container.append(observationMeaning, observations, applyObservations);
  let generation = 0;
  return {
    refresh: (): void => {
      const current = ++generation;
      const person = props.current();
      const recorded = person.face.anatomical?.observations;
      if (props.dom.activeElement !== observations)
        observations.value =
          recorded === undefined ? "" : JSON.stringify(recorded);
      void (async (): Promise<void> => {
        let values: AutoMovieHumanFaceMeasurementReading[] | undefined;
        let failure = "";
        try {
          values = await props.read(person);
        } catch (error) {
          failure = error instanceof Error ? error.message : String(error);
        }
        if (current !== generation) return;
        const targets = new Map(
          (person.face.anatomical?.targets ?? []).map((target) => [
            target.measurement,
            target.value,
          ]),
        );
        for (const [id, element] of readings) {
          const value = values?.find((entry) => entry.measurement === id);
          const target = targets.has(id) ? `; target ${targets.get(id)}` : "";
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
