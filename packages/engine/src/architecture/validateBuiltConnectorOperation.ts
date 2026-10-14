import {
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltElement,
  IAutoMovieCarriageValue,
  IAutoMovieConnectorCarriage,
  IAutoMovieConnectorState,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { collectDeclaredIds } from "../validation/collectDeclaredIds";
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
 * An operated connector must name the elements it is built from, and declare
 * at least one carriage and one state. Each carriage needs a unique non-blank
 * id, an element that resolves and is one of the run's elements or below one,
 * and a valid travel by {@link validateBuiltTravelMotion}; no element may be
 * driven by two members of the whole work, which `driven` records across every
 * opening and connector and is updated here. Each state needs a unique
 * non-blank id and a known drive, may drive in `reverse` only on a
 * bidirectional run, and gives every carriage exactly one value inside its
 * travel; a carriage's `serves` must be one of the run's stops, its endpoints
 * or landings. The current state must resolve. Findings are pushed under
 * `path`; a run with no operation is skipped.
 *
 * @param props.connector Run whose operation is checked.
 * @param props.path Violation path of the connector.
 * @param props.elements Every element of the work.
 * @param props.elementIds Declared element ids.
 * @param props.driven Which member already drives each element, updated.
 * @param props.collector Sink that receives the violations.
 *
 * @evidence contracts/common.md#principled-implementation A state is a total assignment of one in-range value to every carriage, checked with a seen set per state and a carriage index, ownership is membership in the subtree of the run's elements, and a served stop must be one of the stops `builtConnectorStops` lists, the same list every stop query reads.
 * @evidence contracts/common.md#clear-and-simple-design The connector half of operation validation, separated from `validateBuiltEnvironment`; it mirrors the opening operation and shares its travel rule and the work-wide `driven` table.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No connector kind or state name is special-cased; reverse drive is refused only for a one-way run, as the contract states, and a second driver of an element is refused rather than overriding the first.
 * @evidence contracts/common.md#meaningful-documentation The documentation states every carriage, state, drive, stop and current-state rule, the one-driver rule and how `driven` is used and changed, the path, and the skip for an unoperated run.
 * @evidence contracts/performance.md#efficient-algorithms Builds element subtree, stop set and carriage index once, then checks state values by map lookup. Every state also scans all C carriages for missing assignments, so the cost includes O(S·C + V) for S states and V supplied values, even on sparse invalid states, plus elements, roots, stops and carriage validation.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work Called once per operated run; the work-wide `driven` table is the state shared across calls, by design.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The subtree, stop set, carriage index and per-state sets are released on return; `driven` grows by at most one entry per carriage and is owned by the caller.
 */
export const validateBuiltConnectorOperation: (props: {
  connector: IAutoMovieBuiltConnector;
  path: string;
  elements: readonly IAutoMovieBuiltElement[];
  elementIds: ReadonlySet<string>;
  driven: Map<string, string>;
  collector: ViolationCollector;
}) => void = (props: {
  connector: IAutoMovieBuiltConnector;
  path: string;
  elements: readonly IAutoMovieBuiltElement[];
  elementIds: ReadonlySet<string>;
  driven: Map<string, string>;
  collector: ViolationCollector;
}): void => {
  const {
    connector,
    path,
    collector,
  }: Parameters<typeof validateBuiltConnectorOperation>[0] = props;
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
            !Number.isFinite(entry.value) ||
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
};
