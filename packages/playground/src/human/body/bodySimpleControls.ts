import {
  HUMAN_BODY_SIMPLE_SHAPE,
  type IAutoMovieHumanBodySimpleShape,
} from "@automovie/human";

import type { IBodySimpleControlsProps } from "./IBodySimpleControlsProps";
import type { IBodySimpleField } from "./IBodySimpleField";
import type { IBodySimpleBody } from "./IBodySimpleBody";
import type { IBodySimpleControlsHandle } from "./IBodySimpleControlsHandle";
import type { IBodySimpleMeasured } from "./IBodySimpleMeasured";
import type { IBodySimplePending } from "./IBodySimplePending";

/** The simple parameters as inputs: label, unit, display scale and step; the optional ones may be left blank. */
const FIELDS: IBodySimpleField[] = [
  {
    key: "sex",
    label: "Sex (feminine -1 … masculine +1)",
    unit: "",
    scale: 1,
    step: 0.05,
    optional: false,
    whole: false,
  },
  {
    key: "ageYears",
    label: "Age",
    unit: "years",
    scale: 1,
    step: 1,
    optional: false,
    whole: false,
  },
  {
    key: "statureMetres",
    label: "Stature",
    unit: "cm",
    scale: 100,
    step: 1,
    optional: false,
    whole: true,
  },
  {
    key: "massKilograms",
    label: "Mass",
    unit: "kg",
    scale: 1,
    step: 0.5,
    optional: false,
    whole: true,
  },
  {
    key: "muscle",
    label: "Muscle (-1 … +2)",
    unit: "",
    scale: 1,
    step: 0.05,
    optional: false,
    whole: false,
  },
  {
    key: "waistMetres",
    label: "Waist girth",
    unit: "cm",
    scale: 100,
    step: 0.5,
    optional: true,
    whole: false,
  },
  {
    key: "hipsMetres",
    label: "Hip girth",
    unit: "cm",
    scale: 100,
    step: 0.5,
    optional: true,
    whole: false,
  },
  {
    key: "bustMetres",
    label: "Bust girth",
    unit: "cm",
    scale: 100,
    step: 0.5,
    optional: true,
    whole: false,
  },
  {
    key: "shoulderMetres",
    label: "Shoulder breadth",
    unit: "cm",
    scale: 100,
    step: 0.5,
    optional: true,
    whole: false,
  },
  {
    key: "thighMetres",
    label: "Thigh girth",
    unit: "cm",
    scale: 100,
    step: 0.5,
    optional: true,
    whole: false,
  },
  {
    key: "upperArmMetres",
    label: "Upper arm girth",
    unit: "cm",
    scale: 100,
    step: 0.5,
    optional: true,
    whole: false,
  },
  {
    key: "calfMetres",
    label: "Calf girth",
    unit: "cm",
    scale: 100,
    step: 0.5,
    optional: true,
    whole: false,
  },
];

/**
 * Render the simple tier of the body editor: the identity-card values and
 * optional tape measurements, projected off the current body and applied
 * back through the package into the detailed channel weights.
 *
 * The inputs show what the current detailed shape measures (`refresh`
 * projects it), so a user reads the body's own stature, mass and girths
 * before changing one. Projection and expansion are the package's measured
 * inversions and take seconds, so both are asked of a worker (`expand`,
 * `project`). A projection depends on the detailed shape alone. One pending
 * request serves repeated refreshes of that shape; a new shape retires it,
 * while a contact read or pose edit of unchanged shape leaves it valid.
 * Text typed during the read stays in its own field and the other inputs
 * receive the projection. A projection failure is reported only while its
 * shape, body intent and input draft are still current. The panel reserves
 * a body intent before an expansion begins. A later edit of any body field,
 * including pose with unchanged shape, or a later typed input retires that
 * expansion's success or failure. When typing retires the current expansion,
 * the panel returns to a ready draft status rather than leaving "Solving".
 * Apply cannot silently reuse an exact reading from a different shape while
 * the current shape is still being projected. A user may enter every required
 * value directly; an untouched required field waits for this body's reading.
 * Applying expands the values over the current shape, which keeps every
 * detailed edit the simple tier does not name and changes only what the
 * edited values drive; a tape measurement is solved only when the user
 * changed it since it was read, so a blank or untouched one leaves its
 * channel as it was, and an untouched required value is the exact projection
 * rather than its rounded display, so applying unchanged values leaves the
 * body unchanged. The simple values never enter the document, because the
 * detailed tier is its canonical form; the panel is handed them with the
 * shape, to stand the body in the posture its age implies. A refused expansion (a stature, mass
 * or girth the basis cannot reach) is reported through the editor's status,
 * and the document keeps its last valid state.
 * A pose-only commit leaves the rest shape unchanged, so `refresh` reuses
 * the last accepted reading and preserves any unfinished input text. A shape
 * change invalidates that reading and requests the worker again.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Lets a user author a body from sex, age, stature, mass, muscle and tape measurements, read back off the current body and expanded into the stored channel weights.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Bounds each input by the specified envelope, applies the expansion over the current shape and leaves blank measurements unsolved.
 */
export const renderBodySimpleControls = (props: IBodySimpleControlsProps): IBodySimpleControlsHandle => {
  const { dom, container } = props;
  container.replaceChildren();
  // Projection and user input have different invalidation keys: a projection
  // belongs to one rest shape, while Apply belongs to one input draft.
  let generation = 0;
  let editGeneration = 0;
  let expanding: number | null = null;
  // a tape measurement is solved only when the user changed it: the value
  // shown is the body's own reading, and re-solving it after a change of
  // sex or mass would pin a girth the new body no longer has
  const edited = new Set<keyof IAutoMovieHumanBodySimpleShape>();
  // the last projection, unrounded and paired with its exact rest shape
  let measured: IBodySimpleMeasured | null = null;
  let requestedShape: IBodySimpleBody | null = null;
  let pending: IBodySimplePending | null = null;
  const inputs = new Map<
    keyof IAutoMovieHumanBodySimpleShape,
    HTMLInputElement
  >();
  for (const field of FIELDS) {
    const [low, high] = HUMAN_BODY_SIMPLE_SHAPE.limits[field.key].map(
      // in display units, without the binary residue of the scaling (2.2 m
      // times 100 is 220.00000000000003 cm)
      (limit) => Math.round(limit * field.scale * 1e6) / 1e6,
    );
    const row = dom.createElement("div"),
      label = dom.createElement("label"),
      entry = dom.createElement("div"),
      number = dom.createElement("input"),
      note = dom.createElement("small");
    row.className = "row";
    label.textContent = field.label;
    number.id = "simple-" + field.key;
    number.type = "number";
    number.min = String(low);
    number.max = String(high);
    number.step = String(field.step);
    number.placeholder = field.optional ? "blank keeps the body's own" : "";
    label.htmlFor = number.id;
    const touch = (): void => {
      editGeneration++;
      edited.add(field.key);
      if (expanding !== null) {
        const ticket = expanding;
        expanding = null;
        if (props.isCurrentIntent(ticket)) props.onDraftChanged();
      }
    };
    number.addEventListener("input", touch);
    number.addEventListener("change", touch);
    note.textContent =
      `${low} to ${high}${field.unit === "" ? "" : " " + field.unit}` +
      (field.optional ? " · optional, measured on the current body" : "") +
      (field.whole ? " · " + props.wholeSource : "");
    entry.append(number);
    row.append(label, entry, note);
    container.append(row);
    inputs.set(field.key, number);
  }
  const display = (values: IAutoMovieHumanBodySimpleShape): void => {
    for (const field of FIELDS) {
      if (edited.has(field.key)) continue;
      const value = values[field.key];
      inputs.get(field.key)!.value =
        value === undefined
          ? ""
          : String(Math.round(value * field.scale * 100) / 100);
    }
  };
  const read = (): IAutoMovieHumanBodySimpleShape => {
    const simple: Record<string, number> = {};
    const projected =
      measured !== null && sameShape(measured.shape, props.current())
        ? measured.values
        : null;
    for (const field of FIELDS) {
      const text = inputs.get(field.key)!.value.trim();
      if (field.optional && (text === "" || !edited.has(field.key))) continue;
      if (projected !== null && !edited.has(field.key)) {
        simple[field.key] = projected[field.key]!;
        continue;
      }
      if (!edited.has(field.key))
        throw new Error(
          `${field.label} has not been read from the current body yet.`,
        );
      // an empty required value is not zero; it has not been read yet
      if (text === "")
        throw new Error(
          `${field.label} is empty; the body's own values have not been read yet.`,
        );
      simple[field.key] = Number(text) / field.scale;
    }
    return simple as unknown as IAutoMovieHumanBodySimpleShape;
  };
  const apply = dom.createElement("button");
  apply.id = "simple-apply";
  apply.textContent = "Apply simple body";
  // The panel's ticket spans all body actions, including pose and history;
  // shape equality alone cannot identify a newer edit of another field.
  apply.onclick = async () => {
    const ticket = props.reserveIntent();
    expanding = ticket;
    const over = props.current();
    const draft = editGeneration;
    props.onBusy("Solving the simple body against the basis…");
    try {
      const simple = read();
      const shape = await props.expand(simple, over.shape);
      if (
        props.isCurrentIntent(ticket) &&
        sameShape(props.current(), over) &&
        draft === editGeneration
      )
        props.onApply(shape, ticket, simple);
    } catch (error) {
      if (
        props.isCurrentIntent(ticket) &&
        sameShape(props.current(), over) &&
        draft === editGeneration
      )
        props.onRefuse(error);
    } finally {
      if (expanding === ticket) expanding = null;
    }
  };
  const note = dom.createElement("small");
  note.textContent =
    "Read off the current body; applying expands through the package's table and measured inversions into the detailed channels below, keeping the detailed edits it does not name.";
  container.append(apply, note);
  return {
    refresh: (shape: IBodySimpleBody) => {
      const changed =
        requestedShape !== null && !sameShape(requestedShape, shape);
      if (changed) edited.clear();
      requestedShape = structuredClone(shape);
      if (measured !== null && sameShape(measured.shape, shape)) {
        if (changed) {
          ++generation;
          pending = null;
          display(measured.values);
        }
        return Promise.resolve();
      }
      if (pending !== null && sameShape(pending.shape, shape))
        return pending.result;
      const target = structuredClone(shape);
      const ticket = ++generation;
      const intent = props.currentIntent();
      const draft = editGeneration;
      // the first projection waits for the whole-person reader to load
      const first = measured === null;
      if (first) props.onPreparing(true);
      const result = (async (): Promise<void> => {
        let projected: IAutoMovieHumanBodySimpleShape;
        try {
          projected = await props.project(target);
        } catch (error) {
          if (first) props.onPreparing(false);
          if (
            ticket === generation &&
            sameShape(props.current(), target) &&
            props.isCurrentIntent(intent) &&
            draft === editGeneration
          )
            props.onRefuse(error);
          return;
        }
        if (ticket !== generation || !sameShape(props.current(), target))
          return;
        if (first) props.onPreparing(false);
        measured = { shape: target, values: projected };
        display(projected);
      })();
      pending = { shape: target, result };
      void result.then(() => {
        if (pending?.result === result) pending = null;
      });
      return result;
    },
  };
};

/** Whether two bodies name the same channels at the same weights and the same anatomy. */
const sameShape = (a: IBodySimpleBody, b: IBodySimpleBody): boolean =>
  Object.keys(a.shape).length === Object.keys(b.shape).length &&
  Object.entries(a.shape).every(([channel, weight]) => b.shape[channel] === weight) &&
  JSON.stringify(a.anatomy ?? null) === JSON.stringify(b.anatomy ?? null);
