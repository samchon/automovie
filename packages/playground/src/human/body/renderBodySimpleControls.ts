import type { IAutoMovieHumanBodySimpleShape } from "@automovie/human";
import { HUMAN_BODY_SIMPLE_SHAPE } from "@automovie/human/body/constants/HUMAN_BODY_SIMPLE_SHAPE";

import type { IBodySimpleBody } from "./IBodySimpleBody";
import type { IBodySimpleControlsHandle } from "./IBodySimpleControlsHandle";
import type { IBodySimpleControlsProps } from "./IBodySimpleControlsProps";
import type { IBodySimpleField } from "./IBodySimpleField";
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
 * Mount simple-body inputs whose unrounded readings come from the supplied projection worker.
 *
 * Refresh identity includes channel weights, anatomical targets and the optional whole-person context key. A matching accepted or pending projection is reused; pose changes alone preserve typed text. Anatomy equality uses serialized object order, so equivalent reordered anatomy can trigger another read. Typed fields survive projection completion, and untouched required values use the exact accepted reading instead of rounded display text. Blank or untouched optional measurements are omitted from expansion.
 *
 * Apply reserves the parent's body intent and expands over the current detailed weights. A later body edit or input draft discards its success and refusal. Projection refusals report only while their generation, body, intent and draft remain current. The parent owns admission, history, status and worker disposal; these controls retain their input listeners and latest reading until their container is replaced.
 *
 * @evidence contracts/common.md#principled-implementation Projection reuse compares weights, anatomy and whole-person context, while expansion effects require the reserved body intent and unchanged input draft; untouched values preserve full projection precision.
 * @evidence contracts/common.md#clear-and-simple-design DOM conversion and reading state stay in this mount, numerical projection and expansion use supplied workers, and the parent owns document admission and history.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No measurements are fabricated while projection is pending, blank required entries refuse rather than becoming zero, and stale success or failure cannot overwrite a newer draft.
 * @evidence contracts/common.md#meaningful-documentation The comment identifies projection dependencies, serialized-anatomy ordering, exact versus displayed values, optional omission, asynchronous invalidation and the parent-owned lifetime.
 * @evidence contracts/performance.md#efficient-algorithms Mount and display scan the fixed f field list; each equality check traverses c channel entries and serializes a anatomy bytes in O(c+a) time with O(c+a) transient storage, while numerical work remains in the supplied worker.
 * @evidence contracts/performance.md#reuse-equivalent-work One accepted reading and one pending record are reused for an equal complete input; shape, anatomy or context changes invalidate them, while pose-only refresh preserves both the reading and typed draft.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The mount retains f inputs and listeners plus one accepted and pending snapshot; superseded worker requests are not cancelled here and remain the transport owner's responsibility until settlement or close.
 */
export function renderBodySimpleControls(
  props: IBodySimpleControlsProps,
): IBodySimpleControlsHandle {
  const dom: Document = props.dom;
  const container: HTMLElement = props.container;
  container.replaceChildren();
  // Projection and user input have different invalidation keys: a projection
  // belongs to one rest shape, while Apply belongs to one input draft.
  let generation: number = 0;
  let editGeneration: number = 0;
  let expanding: number | null = null;
  // a tape measurement is solved only when the user changed it: the value
  // shown is the body's own reading, and re-solving it after a change of
  // sex or mass would pin a girth the new body no longer has
  const edited: Set<keyof IAutoMovieHumanBodySimpleShape> = new Set();
  // the last projection, unrounded and paired with its exact rest shape
  let measured: IBodySimpleMeasured | null = null;
  let requestedShape: IBodySimpleBody | null = null;
  let pending: IBodySimplePending | null = null;
  const inputs: Map<
    keyof IAutoMovieHumanBodySimpleShape,
    HTMLInputElement
  > = new Map();
  for (const field of FIELDS) {
    const [low, high]: number[] = HUMAN_BODY_SIMPLE_SHAPE.limits[field.key].map(
      // in display units, without the binary residue of the scaling (2.2 m
      // times 100 is 220.00000000000003 cm)
      (limit: number): number => Math.round(limit * field.scale * 1e6) / 1e6,
    );
    const row: HTMLDivElement = dom.createElement("div");
    const label: HTMLLabelElement = dom.createElement("label");
    const entry: HTMLDivElement = dom.createElement("div");
    const number: HTMLInputElement = dom.createElement("input");
    const note: HTMLElement = dom.createElement("small");
    row.className = "row";
    label.textContent = field.label;
    number.id = "simple-" + field.key;
    number.type = "number";
    number.min = String(low);
    number.max = String(high);
    number.step = String(field.step);
    number.placeholder = field.optional ? "blank keeps the body's own" : "";
    label.htmlFor = number.id;
    const touch: () => void = (): void => {
      editGeneration++;
      edited.add(field.key);
      if (expanding !== null) {
        const ticket: number = expanding;
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
  const display: (values: IAutoMovieHumanBodySimpleShape) => void = (values: IAutoMovieHumanBodySimpleShape): void => {
    for (const field of FIELDS) {
      if (edited.has(field.key)) continue;
      const value: number | undefined = values[field.key];
      inputs.get(field.key)!.value =
        value === undefined
          ? ""
          : String(Math.round(value * field.scale * 100) / 100);
    }
  };
  const read: () => IAutoMovieHumanBodySimpleShape = (): IAutoMovieHumanBodySimpleShape => {
    const simple: Record<string, number> = {};
    const projected: IAutoMovieHumanBodySimpleShape | null =
      measured !== null && sameShape(measured.shape, props.current())
        ? measured.values
        : null;
    for (const field of FIELDS) {
      const text: string = inputs.get(field.key)!.value.trim();
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
  const apply: HTMLButtonElement = dom.createElement("button");
  apply.id = "simple-apply";
  apply.textContent = "Apply simple body";
  // The panel's ticket spans all body actions, including pose and history;
  // shape equality alone cannot identify a newer edit of another field.
  apply.onclick = async (): Promise<void> => {
    const ticket: number = props.reserveIntent();
    expanding = ticket;
    const over: IBodySimpleBody = props.current();
    const draft: number = editGeneration;
    props.onBusy("Solving the simple body against the basis…");
    try {
      const simple: IAutoMovieHumanBodySimpleShape = read();
      const shape: Record<string, number> = await props.expand(simple, over.shape);
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
  const note: HTMLElement = dom.createElement("small");
  note.textContent =
    "Read off the current body; applying expands through the package's table and measured inversions into the detailed channels below, keeping the detailed edits it does not name.";
  container.append(apply, note);
  return {
    refresh: (shape: IBodySimpleBody): Promise<void> => {
      const changed: boolean =
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
      const target: IBodySimpleBody = structuredClone(shape);
      const ticket: number = ++generation;
      const intent: number = props.currentIntent();
      const draft: number = editGeneration;
      // the first projection waits for the whole-person reader to load
      const first: boolean = measured === null;
      if (first) props.onPreparing(true);
      const result: Promise<void> = (async (): Promise<void> => {
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
      void result.then((): void => {
        if (pending?.result === result) pending = null;
      });
      return result;
    },
  };
}

/** Whether two bodies name the same channels at the same weights and the same anatomy. */
const sameShape: (a: IBodySimpleBody, b: IBodySimpleBody) => boolean = (a: IBodySimpleBody, b: IBodySimpleBody): boolean =>
  a.contextKey === b.contextKey &&
  Object.keys(a.shape).length === Object.keys(b.shape).length &&
  Object.entries(a.shape).every(
    ([channel, weight]: [string, number]): boolean => b.shape[channel] === weight,
  ) &&
  JSON.stringify(a.anatomy ?? null) === JSON.stringify(b.anatomy ?? null);
