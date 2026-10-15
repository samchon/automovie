import {
  AutoMovieHumanActionUnit,
  IAutoMovieHumanExpression,
} from "@automovie/human";

/** Sides an activation can name, in document order. */
const SIDES: readonly IAutoMovieHumanExpression.IActivation["side"][] = [
  "both",
  "left",
  "right",
];

/**
 * Build the editor of an expression document: one row per activation with its unit, intensity and side, and a button that adds an activation.
 *
 * `units` is the closed set of action units, supplied by the caller from a record the compiler checks against `AutoMovieHumanActionUnit`. A change passes a fresh expression to `onChange` without admitting it, so a repeated unit or a one-sided jaw unit reaches the caller's admission and its error. An empty list is the neutral face.
 *
 * @param props Every action unit, current expression and change callback
 * @returns A detached element holding the editor
 *
 * @evidence contracts/common.md#principled-implementation Rows mirror the document's activations one to one and offer only the closed unit and side sets.
 * @evidence contracts/common.md#clear-and-simple-design The editor proposes candidates; admission and facial articulation stay with the page and the package.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts Combinations admission refuses are not filtered out here, so the refusal and its cause stay visible.
 * @evidence contracts/common.md#meaningful-documentation States the unit source, the admission boundary and the empty-list meaning.
 * @evidence contracts/performance.md#efficient-algorithms One row per activation, each with one option per unit; linear in their product, which is small and fixed.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work The editor is rebuilt from each accepted expression.
 * @evidence contracts/performance.md#bound-retention-and-release-resources Inputs and listeners belong to the returned element and are released with it.
 */
export function createHumanViewerExpressionEditor(props: {
  units: readonly AutoMovieHumanActionUnit[];
  expression: IAutoMovieHumanExpression;
  onChange: (candidate: IAutoMovieHumanExpression) => void;
}): HTMLElement {
  const root: HTMLDivElement = document.createElement("div");
  root.className = "expression-editor";
  const emit: (units: IAutoMovieHumanExpression.IActivation[]) => void = (
    units: IAutoMovieHumanExpression.IActivation[],
  ): void => props.onChange({ version: props.expression.version, units });
  const replace: (
    index: number,
    next: IAutoMovieHumanExpression.IActivation | null,
  ) => void = (
    index: number,
    next: IAutoMovieHumanExpression.IActivation | null,
  ): void =>
    emit(
      props.expression.units.flatMap(
        (
          a: IAutoMovieHumanExpression.IActivation,
          i: number,
        ): IAutoMovieHumanExpression.IActivation[] =>
          i !== index ? [a] : next === null ? [] : [next],
      ),
    );

  props.expression.units.forEach(
    (activation: IAutoMovieHumanExpression.IActivation, index: number): void => {
      const row: HTMLDivElement = document.createElement("div");
      row.className = "activation";
      const unit: HTMLSelectElement = document.createElement("select");
      for (const u of props.units) unit.add(new Option(u, u));
      unit.value = activation.unit;
      unit.addEventListener("change", (): void =>
        replace(index, {
          ...activation,
          unit: unit.value as AutoMovieHumanActionUnit,
        }),
      );
      const intensity: HTMLInputElement = document.createElement("input");
      intensity.type = "number";
      intensity.step = "0.05";
      intensity.value = String(activation.intensity);
      intensity.addEventListener("change", (): void =>
        replace(index, { ...activation, intensity: Number(intensity.value) }),
      );
      const side: HTMLSelectElement = document.createElement("select");
      for (const s of SIDES) side.add(new Option(s, s));
      side.value = activation.side;
      side.addEventListener("change", (): void =>
        replace(index, {
          ...activation,
          side: side.value as IAutoMovieHumanExpression.IActivation["side"],
        }),
      );
      const remove: HTMLButtonElement = document.createElement("button");
      remove.type = "button";
      remove.textContent = "x";
      remove.addEventListener("click", (): void => replace(index, null));
      row.append(unit, intensity, side, remove);
      root.appendChild(row);
    },
  );
  const add: HTMLButtonElement = document.createElement("button");
  add.type = "button";
  add.textContent = "+ action unit";
  add.addEventListener("click", (): void =>
    emit([
      ...props.expression.units,
      { unit: props.units[0]!, intensity: 0.5, side: "both" },
    ]),
  );
  root.appendChild(add);
  return root;
}
