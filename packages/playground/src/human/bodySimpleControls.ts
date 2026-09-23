import {
  HUMAN_BODY_SIMPLE_SHAPE,
  type IAutoMovieHumanBodySimpleShape,
} from "@automovie/human";

/** The simple parameters as inputs: label, unit, display scale and step; the optional ones may be left blank. */
const FIELDS: {
  key: keyof IAutoMovieHumanBodySimpleShape;
  label: string;
  unit: string;
  /** Display units per metre or per unit of the parameter (cm shown for metres). */
  scale: number;
  step: number;
  optional: boolean;
}[] = [
  {
    key: "sex",
    label: "Sex (feminine -1 … masculine +1)",
    unit: "",
    scale: 1,
    step: 0.05,
    optional: false,
  },
  {
    key: "ageYears",
    label: "Age",
    unit: "years",
    scale: 1,
    step: 1,
    optional: false,
  },
  {
    key: "statureMetres",
    label: "Stature",
    unit: "cm",
    scale: 100,
    step: 1,
    optional: false,
  },
  {
    key: "massKilograms",
    label: "Mass",
    unit: "kg",
    scale: 1,
    step: 0.5,
    optional: false,
  },
  {
    key: "muscle",
    label: "Muscle (-1 … +1)",
    unit: "",
    scale: 1,
    step: 0.05,
    optional: false,
  },
  {
    key: "waistMetres",
    label: "Waist girth",
    unit: "cm",
    scale: 100,
    step: 0.5,
    optional: true,
  },
  {
    key: "hipsMetres",
    label: "Hip girth",
    unit: "cm",
    scale: 100,
    step: 0.5,
    optional: true,
  },
  {
    key: "bustMetres",
    label: "Bust girth",
    unit: "cm",
    scale: 100,
    step: 0.5,
    optional: true,
  },
  {
    key: "shoulderMetres",
    label: "Shoulder breadth",
    unit: "cm",
    scale: 100,
    step: 0.5,
    optional: true,
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
 * `project`); a projection that lands after a newer one, or after the user
 * typed, is dropped, and one that fails is reported. The panel reserves a
 * body intent before an expansion begins. A later edit of any body field,
 * including pose with unchanged shape, retires that expansion's success or
 * failure. Projection observes the same intent generation so stale readings
 * cannot rewrite inputs or status while a later edit builds.
 * Applying expands the values over the current shape, which keeps every
 * detailed edit the simple tier does not name and changes only what the
 * edited values drive; a tape measurement is solved only when the user
 * changed it since it was read, so a blank or untouched one leaves its
 * channel as it was, and an untouched required value is the exact projection
 * rather than its rounded display, so applying unchanged values leaves the
 * body unchanged. The simple values never enter the document, because the
 * detailed tier is its canonical form. A refused expansion (a stature, mass
 * or girth the basis cannot reach) is reported through the editor's status,
 * and the document keeps its last valid state.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Lets a user author a body from sex, age, stature, mass, muscle and tape measurements, read back off the current body and expanded into the stored channel weights.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Bounds each input by the specified envelope, applies the expansion over the current shape and leaves blank measurements unsolved.
 */
export const renderBodySimpleControls = (props: {
  dom: Document;
  container: HTMLElement;
  /** The expansion over the current shape, solved off the page's thread. */
  expand: (
    simple: IAutoMovieHumanBodySimpleShape,
    over: Record<string, number>,
  ) => Promise<Record<string, number>>;
  /** The projection of a detailed shape, solved off the page's thread. */
  project: (
    shape: Record<string, number>,
  ) => Promise<IAutoMovieHumanBodySimpleShape>;
  /** The current detailed shape the expansion applies over. */
  current: () => Record<string, number>;
  /** Reserve the panel's intent generation synchronously at Apply click. */
  reserveIntent: () => number;
  /** Read or check the panel generation when asynchronous work settles. */
  currentIntent: () => number;
  isCurrentIntent: (ticket: number) => boolean;
  onApply: (shape: Record<string, number>, ticket: number) => void;
  onRefuse: (error: unknown) => void;
  onBusy: (text: string) => void;
}): { refresh: (shape: Record<string, number>) => Promise<void> } => {
  const { dom, container } = props;
  container.replaceChildren();
  // a projection still in flight when the user types must not overwrite
  // what was typed: an edit retires every pending projection
  let generation = 0;
  // a tape measurement is solved only when the user changed it: the value
  // shown is the body's own reading, and re-solving it after a change of
  // sex or mass would pin a girth the new body no longer has
  const edited = new Set<keyof IAutoMovieHumanBodySimpleShape>();
  // the last projection, unrounded; the inputs show it to two decimals
  let exact: IAutoMovieHumanBodySimpleShape | null = null;
  const inputs = new Map<
    keyof IAutoMovieHumanBodySimpleShape,
    HTMLInputElement
  >();
  for (const field of FIELDS) {
    const [low, high] = HUMAN_BODY_SIMPLE_SHAPE.limits[field.key];
    const row = dom.createElement("div"),
      label = dom.createElement("label"),
      entry = dom.createElement("div"),
      number = dom.createElement("input"),
      note = dom.createElement("small");
    row.className = "row";
    label.textContent = field.label;
    number.id = "simple-" + field.key;
    number.type = "number";
    number.min = String(low * field.scale);
    number.max = String(high * field.scale);
    number.step = String(field.step);
    number.placeholder = field.optional ? "blank keeps the body's own" : "";
    label.htmlFor = number.id;
    const touch = (): void => {
      generation++;
      edited.add(field.key);
    };
    number.addEventListener("input", touch);
    number.addEventListener("change", touch);
    note.textContent =
      `${low * field.scale} to ${high * field.scale}${field.unit === "" ? "" : " " + field.unit}` +
      (field.optional ? " · optional, measured on the current body" : "");
    entry.append(number);
    row.append(label, entry, note);
    container.append(row);
    inputs.set(field.key, number);
  }
  const read = (): IAutoMovieHumanBodySimpleShape => {
    const simple: Record<string, number> = {};
    for (const field of FIELDS) {
      const text = inputs.get(field.key)!.value.trim();
      if (field.optional && (text === "" || !edited.has(field.key))) continue;
      if (exact !== null && !edited.has(field.key)) {
        simple[field.key] = exact[field.key]!;
        continue;
      }
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
    const over = props.current();
    props.onBusy("Solving the simple body against the basis…");
    try {
      const shape = await props.expand(read(), over);
      if (props.isCurrentIntent(ticket) && sameShape(props.current(), over))
        props.onApply(shape, ticket);
    } catch (error) {
      if (props.isCurrentIntent(ticket) && sameShape(props.current(), over))
        props.onRefuse(error);
    }
  };
  const note = dom.createElement("small");
  note.textContent =
    "Read off the current body; applying expands through the package's table and measured inversions into the detailed channels below, keeping the detailed edits it does not name.";
  container.append(apply, note);
  return {
    refresh: async (shape) => {
      const ticket = ++generation;
      const intent = props.currentIntent();
      let projected: IAutoMovieHumanBodySimpleShape;
      try {
        projected = await props.project(shape);
      } catch (error) {
        // a projection that fails is reported, never left as blank inputs
        if (ticket === generation && props.isCurrentIntent(intent))
          props.onRefuse(error);
        return;
      }
      if (ticket !== generation || !props.isCurrentIntent(intent)) return;
      edited.clear();
      exact = projected;
      for (const field of FIELDS) {
        const value = projected[field.key];
        inputs.get(field.key)!.value =
          value === undefined
            ? ""
            : String(Math.round(value * field.scale * 100) / 100);
      }
    },
  };
};

/** Whether two detailed shapes name the same channels at the same weights. */
const sameShape = (
  a: Record<string, number>,
  b: Record<string, number>,
): boolean =>
  Object.keys(a).length === Object.keys(b).length &&
  Object.entries(a).every(([channel, weight]) => b[channel] === weight);
