import {
  HUMAN_BODY_SIMPLE_SHAPE,
  type IAutoMovieHumanBodyBasis,
  type IAutoMovieHumanBodySimpleShape,
  expandHumanBodySimpleShape,
  projectHumanBodySimpleShape,
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
 * before changing one. Applying expands the values over the current shape,
 * which keeps every detailed edit the simple tier does not name and changes
 * only what the edited values drive; a tape measurement left blank is not
 * solved and its channel stays as it was. The simple values never enter the
 * document, because the detailed tier is its canonical form. A refused
 * expansion (a stature, mass or girth the basis cannot reach) is reported
 * through the editor's status, and the document keeps its last valid state.
 *
 * @evidence requirements/actors/body-authoring/contract.md#actor-body-simple-shape Lets a user author a body from sex, age, stature, mass, muscle and tape measurements, read back off the current body and expanded into the stored channel weights.
 * @evidence specifications/asset-and-representation/body-authoring/contract.md#body-spec-simple-shape Bounds each input by the specified envelope, applies the expansion over the current shape and leaves blank measurements unsolved.
 */
export const renderBodySimpleControls = (props: {
  dom: Document;
  container: HTMLElement;
  basis: IAutoMovieHumanBodyBasis;
  onApply: (
    expand: (shape: Record<string, number>) => Record<string, number>,
  ) => void;
  onRefuse: (error: unknown) => void;
}): { refresh: (shape: Record<string, number>) => void } => {
  const { dom, container } = props;
  container.replaceChildren();
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
      if (text === "" && field.optional) continue;
      simple[field.key] = Number(text) / field.scale;
    }
    return simple as unknown as IAutoMovieHumanBodySimpleShape;
  };
  const apply = dom.createElement("button");
  apply.id = "simple-apply";
  apply.textContent = "Apply simple body";
  apply.onclick = () => {
    try {
      const simple = read();
      props.onApply((shape) =>
        expandHumanBodySimpleShape(props.basis, simple, shape),
      );
    } catch (error) {
      props.onRefuse(error);
    }
  };
  const note = dom.createElement("small");
  note.textContent =
    "Read off the current body; applying expands through the package's table and measured inversions into the detailed channels below, keeping the detailed edits it does not name.";
  container.append(apply, note);
  return {
    refresh: (shape) => {
      const projected = projectHumanBodySimpleShape(props.basis, shape);
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
