import {
  IAutoMovieBuiltElement,
  IAutoMovieBuiltOpening,
  IAutoMovieMovablePanel,
  IAutoMovieOpeningHardware,
  IAutoMovieOperationState,
  IAutoMoviePanelValue,
  type IAutoMovieValidateBuiltOpeningOperation,
  type IAutoMovieViolationAppendPositiveTextSink,
} from "@automovie/interface";

import { collectDeclaredIds } from "../../validation/internal/collectDeclaredIds";
import { builtElementSubtree } from "./builtElementSubtree";
import { validateBuiltTravelMotion } from "./validateBuiltTravelMotion";

/*
 * Validate the movable panels, named states, and hardware of one opening.
 *
 * An operated opening must name the element it fills, and declare at least one
 * panel and one state. Each panel needs a unique id, an element that resolves
 * and is the filling element or below it, a positive width and height, and a
 * valid travel by validateBuiltTravelMotion. No element may be driven by
 * two members of the whole work, because one element carries one displacement:
 * `driven` records which member already drives each element across every
 * opening and connector, and is updated here. Each state needs a unique id and
 * gives every panel exactly one value inside its travel, and the current state
 * must resolve. Hardware needs unique ids, a non-blank kind, and an element
 * that resolves when it names one. Findings are pushed under `path`; an opening
 * with no operation is skipped.
 * Parameter props.opening: Opening whose operation is checked.
 * Parameter props.path: Violation path of the opening.
 * Parameter props.elements: Every element of the work.
 * Parameter props.elementIds: Declared element ids.
 * Parameter props.driven: Which member already drives each element, updated.
 * Parameter props.collector: Sink that receives the violations.
 */
export function validateBuiltOpeningOperation(
  props: IAutoMovieValidateBuiltOpeningOperation.IProps,
): void {
  const {
    opening,
    path,
    collector,
  }: [
    {
      opening: IAutoMovieBuiltOpening;
      path: string;
      elements: readonly IAutoMovieBuiltElement[];
      elementIds: ReadonlySet<string>;
      driven: Map<string, string>;
    collector: IAutoMovieViolationAppendPositiveTextSink;
    },
  ][0] = props;
  const operation: IAutoMovieBuiltOpening["operation"] = opening.operation;
  if (operation === undefined) return;
  const base: string = `${path}.operation`;
  if (opening.fill === null)
    collector.push(
      "type",
      `${path}.fill`,
      `opening "${opening.id}" declares movable panels, so it must name the element they belong to`,
      null,
    );
  if (operation.panels.length === 0)
    collector.push(
      "range",
      `${base}.panels`,
      `opening "${opening.id}" declares an operation with no movable panel`,
      operation.panels.length,
    );
  collectDeclaredIds(operation.panels, `${base}.panels`, "panel", collector);
  const panels: Map<string, IAutoMovieMovablePanel> = new Map();
  for (const panel of operation.panels)
    if (!panels.has(panel.id)) panels.set(panel.id, panel);
  const owned: Set<string> = builtElementSubtree(
    props.elements,
    opening.fill === null ? [] : [opening.fill],
  );
  operation.panels.forEach(
    (panel: IAutoMovieMovablePanel, index: number): void => {
      const panelPath: string = `${base}.panels[${index}]`;
      if (!props.elementIds.has(panel.element))
        collector.push(
          "type",
          `${panelPath}.element`,
          `panel element "${panel.element}" does not resolve`,
          panel.element,
        );
      else if (opening.fill !== null && !owned.has(panel.element))
        collector.push(
          "type",
          `${panelPath}.element`,
          `panel element "${panel.element}" must be the filling element "${opening.fill}" of opening "${opening.id}" or descend from it`,
          panel.element,
        );
      // One element carries one displacement, so a second panel claiming it
      // would not add a degree of freedom: it would silently lose whichever
      // travel was written first.
      const already: string | undefined = props.driven.get(panel.element);
      if (already !== undefined)
        collector.push(
          "type",
          `${panelPath}.element`,
          `panel element "${panel.element}" is already driven by ${already}`,
          panel.element,
        );
      else
        props.driven.set(
          panel.element,
          `panel "${panel.id}" of opening "${opening.id}"`,
        );
      collector.positive(`${panelPath}.width`, panel.width, "panel width");
      collector.positive(`${panelPath}.height`, panel.height, "panel height");
      validateBuiltTravelMotion(
        panel.motion,
        `${panelPath}.motion`,
        "panel",
        collector,
      );
    },
  );
  if (operation.states.length === 0)
    collector.push(
      "range",
      `${base}.states`,
      `opening "${opening.id}" declares an operation with no named state`,
      operation.states.length,
    );
  collectDeclaredIds(
    operation.states,
    `${base}.states`,
    "operating state",
    collector,
  );
  operation.states.forEach(
    (state: IAutoMovieOperationState, index: number): void => {
      const statePath: string = `${base}.states[${index}]`;
      const seen: Set<string> = new Set();
      state.panels.forEach(
        (entry: IAutoMoviePanelValue, valueIndex: number): void => {
          const valuePath: string = `${statePath}.panels[${valueIndex}]`;
          const panel: IAutoMovieMovablePanel | undefined = panels.get(
            entry.panel,
          );
          if (panel === undefined)
            collector.push(
              "type",
              `${valuePath}.panel`,
              `operating state "${state.id}" drives unknown panel "${entry.panel}"`,
              entry.panel,
            );
          if (seen.has(entry.panel))
            collector.push(
              "type",
              `${valuePath}.panel`,
              `operating state "${state.id}" drives panel "${entry.panel}" twice`,
              entry.panel,
            );
          seen.add(entry.panel);
          if (panel === undefined) return;
          if (entry.value < panel.motion.min || entry.value > panel.motion.max)
            collector.push(
              "range",
              `${valuePath}.value`,
              `operating state "${state.id}" drives panel "${panel.id}" to ${entry.value}, outside its travel [${panel.motion.min}, ${panel.motion.max}]`,
              entry.value,
            );
        },
      );
      for (const panel of operation.panels)
        if (!seen.has(panel.id))
          collector.push(
            "type",
            `${statePath}.panels`,
            `operating state "${state.id}" gives panel "${panel.id}" no value`,
            panel.id,
          );
    },
  );
  if (
    !operation.states.some(
      (state: IAutoMovieOperationState): boolean =>
        state.id === operation.state,
    )
  )
    collector.push(
      "type",
      `${base}.state`,
      `current operating state "${operation.state}" does not resolve`,
      operation.state,
    );
  collectDeclaredIds(
    operation.hardware,
    `${base}.hardware`,
    "hardware",
    collector,
  );
  operation.hardware.forEach(
    (piece: IAutoMovieOpeningHardware, index: number): void => {
      const piecePath: string = `${base}.hardware[${index}]`;
      collector.nonEmpty(`${piecePath}.kind`, piece.kind, "hardware kind");
      if (piece.element !== null && !props.elementIds.has(piece.element))
        collector.push(
          "type",
          `${piecePath}.element`,
          `hardware element "${piece.element}" does not resolve`,
          piece.element,
        );
    },
  );
}
