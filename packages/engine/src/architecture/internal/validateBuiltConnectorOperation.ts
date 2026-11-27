import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltElement,
  IAutoMovieCarriageValue,
  IAutoMovieConnectorCarriage,
  IAutoMovieConnectorState,
  type IAutoMovieValidateBuiltConnectorOperation,
  type IAutoMovieViolationAppendSink,
} from "@automovie/interface";

import { collectDeclaredIds } from "../../validation/internal/collectDeclaredIds";
import { builtConnectorStops } from "./builtConnectorStops";
import { builtElementSubtree } from "./builtElementSubtree";
import { validateBuiltTravelMotion } from "./validateBuiltTravelMotion";

/** The three ways a powered run may stand: driven either way, or not at all. */
const CONNECTOR_DRIVES: readonly IAutoMovieConnectorState["drive"][] = [
  "forward",
  "reverse",
  "still",
];

/**
 * Validate the travelling carriages, named states, and stops of one run.
 *
 * An operated connector must name the elements it is built from, and declare at
 * least one carriage and one state. Each carriage needs a unique id, an element
 * that resolves and is one of the run's elements or below one, and a valid
 * travel by {@link validateBuiltTravelMotion}; no element may be driven by two
 * members of the whole work, which `driven` records across every opening and
 * connector and is updated here. Each state needs a unique id and a known
 * drive, may drive in `reverse` only on a bidirectional run, and gives every
 * carriage exactly one value inside its travel; a carriage's `serves` must be
 * one of the run's stops, its endpoints or landings. The current state must
 * resolve. Findings are pushed under `path`; a run with no operation is
 * skipped.
 *
 * @param props.connector Run whose operation is checked.
 * @param props.path Violation path of the connector.
 * @param props.elements Every element of the work.
 * @param props.elementIds Declared element ids.
 * @param props.driven Which member already drives each element, updated.
 * @param props.collector Sink that receives the violations.
 */
export function validateBuiltConnectorOperation(
  props: IAutoMovieValidateBuiltConnectorOperation.IProps,
): void {
  const {
    connector,
    path,
    collector,
  }: [
    {
      connector: IAutoMovieBuiltConnector;
      path: string;
      elements: readonly IAutoMovieBuiltElement[];
      elementIds: ReadonlySet<string>;
      driven: Map<string, string>;
    collector: IAutoMovieViolationAppendSink;
    },
  ][0] = props;
  const operation: IAutoMovieBuiltConnector["operation"] = connector.operation;
  if (operation === undefined) return;
  const base: string = `${path}.operation`;
  if (connector.elements.length === 0)
    collector.push(
      "type",
      `${path}.elements`,
      `connector "${connector.id}" drives a carriage, so it must name the elements it is built from`,
      connector.elements,
    );
  if (operation.carriages.length === 0)
    collector.push(
      "range",
      `${base}.carriages`,
      `connector "${connector.id}" declares an operation with no carriage`,
      operation.carriages.length,
    );
  collectDeclaredIds(
    operation.carriages,
    `${base}.carriages`,
    "carriage",
    collector,
  );
  const carriages: Map<string, IAutoMovieConnectorCarriage> = new Map();
  for (const carriage of operation.carriages)
    if (!carriages.has(carriage.id)) carriages.set(carriage.id, carriage);
  const owned: Set<string> = builtElementSubtree(
    props.elements,
    connector.elements,
  );
  operation.carriages.forEach(
    (carriage: IAutoMovieConnectorCarriage, index: number): void => {
      const carriagePath: string = `${base}.carriages[${index}]`;
      if (!props.elementIds.has(carriage.element))
        collector.push(
          "type",
          `${carriagePath}.element`,
          `carriage element "${carriage.element}" does not resolve`,
          carriage.element,
        );
      else if (connector.elements.length !== 0 && !owned.has(carriage.element))
        collector.push(
          "type",
          `${carriagePath}.element`,
          `carriage element "${carriage.element}" must be one of the elements connector "${connector.id}" is built from, or descend from one`,
          carriage.element,
        );
      // Doors and runs draw from one displacement table, so a leaf that is
      // also a lift car would lose whichever travel was written first.
      const already: string | undefined = props.driven.get(carriage.element);
      if (already !== undefined)
        collector.push(
          "type",
          `${carriagePath}.element`,
          `carriage element "${carriage.element}" is already driven by ${already}`,
          carriage.element,
        );
      else
        props.driven.set(
          carriage.element,
          `carriage "${carriage.id}" of connector "${connector.id}"`,
        );
      validateBuiltTravelMotion(
        carriage.motion,
        `${carriagePath}.motion`,
        "carriage",
        collector,
      );
    },
  );
  const stops: Set<string> = new Set(builtConnectorStops(connector));
  if (operation.states.length === 0)
    collector.push(
      "range",
      `${base}.states`,
      `connector "${connector.id}" declares an operation with no named state`,
      operation.states.length,
    );
  collectDeclaredIds(
    operation.states,
    `${base}.states`,
    "operating state",
    collector,
  );
  operation.states.forEach(
    (state: IAutoMovieConnectorState, index: number): void => {
      const statePath: string = `${base}.states[${index}]`;
      if (!CONNECTOR_DRIVES.includes(state.drive))
        collector.push(
          "type",
          `${statePath}.drive`,
          `unknown connector drive "${String(state.drive)}"`,
          state.drive,
        );
      else if (state.drive === "reverse" && connector.bidirectional === false)
        collector.push(
          "type",
          `${statePath}.drive`,
          `operating state "${state.id}" drives connector "${connector.id}" in reverse, but the run is one-way`,
          state.drive,
        );
      const seen: Set<string> = new Set();
      state.carriages.forEach(
        (entry: IAutoMovieCarriageValue, valueIndex: number): void => {
          const valuePath: string = `${statePath}.carriages[${valueIndex}]`;
          const carriage: IAutoMovieConnectorCarriage | undefined =
            carriages.get(entry.carriage);
          if (carriage === undefined)
            collector.push(
              "type",
              `${valuePath}.carriage`,
              `operating state "${state.id}" drives unknown carriage "${entry.carriage}"`,
              entry.carriage,
            );
          if (seen.has(entry.carriage))
            collector.push(
              "type",
              `${valuePath}.carriage`,
              `operating state "${state.id}" drives carriage "${entry.carriage}" twice`,
              entry.carriage,
            );
          seen.add(entry.carriage);
          if (entry.serves !== null && !stops.has(entry.serves))
            collector.push(
              "type",
              `${valuePath}.serves`,
              `operating state "${state.id}" has carriage "${entry.carriage}" serve "${entry.serves}", which is neither an endpoint nor a landing of connector "${connector.id}"`,
              entry.serves,
            );
          if (carriage === undefined) return;
          if (
            entry.value < carriage.motion.min ||
            entry.value > carriage.motion.max
          )
            collector.push(
              "range",
              `${valuePath}.value`,
              `operating state "${state.id}" drives carriage "${carriage.id}" to ${entry.value}, outside its travel [${carriage.motion.min}, ${carriage.motion.max}]`,
              entry.value,
            );
        },
      );
      for (const carriage of operation.carriages)
        if (!seen.has(carriage.id))
          collector.push(
            "type",
            `${statePath}.carriages`,
            `operating state "${state.id}" gives carriage "${carriage.id}" no value`,
            carriage.id,
          );
    },
  );
  if (
    !operation.states.some(
      (state: IAutoMovieConnectorState): boolean =>
        state.id === operation.state,
    )
  )
    collector.push(
      "type",
      `${base}.state`,
      `current operating state "${operation.state}" does not resolve`,
      operation.state,
    );
}
