import {
  IAutoMovieBoundaryFace,
  IAutoMovieBuiltConnector,
  IAutoMovieBuiltElement,
  IAutoMovieBuiltEnvironment,
  IAutoMovieBuiltPopulation,
  IAutoMovieBuiltSurface,
  IAutoMovieConstraintViolation,
  IAutoMovieModel,
  IAutoMoviePlanarPoint,
  IAutoMovieValidation,
  IAutoMovieVector3,
} from "@automovie/interface";

import { ViolationCollector } from "../validation/ViolationCollector";
import { appendGraphCycles } from "../validation/appendGraphCycles";
import { collectDeclaredIds } from "../validation/collectDeclaredIds";
import { validateDeclaredReferences } from "../validation/validateDeclaredReferences";
import { validateModel } from "../validation/validateModel";
import { validateSpace } from "../validation/validateSpace";
import { validateTransformScalars } from "../validation/validateTransformScalars";
import { validateBuiltBoundaries } from "./validateBuiltBoundaries";
import { validateBuiltBuildings } from "./validateBuiltBuildings";
import { validateBuiltCarriageService } from "./validateBuiltCarriageService";
import { validateBuiltConnectorLandings } from "./validateBuiltConnectorLandings";
import { validateBuiltConnectorOperation } from "./validateBuiltConnectorOperation";
import { validateBuiltConnectorShape } from "./validateBuiltConnectorShape";
import { validateBuiltOpenings } from "./validateBuiltOpenings";
import { validateBuiltPanelFit } from "./validateBuiltPanelFit";
import { validateBuiltPopulation } from "./validateBuiltPopulation";
import { validateBuiltSpaces } from "./validateBuiltSpaces";
import { validateBuiltStagedConfigurations } from "./validateBuiltStagedConfigurations";

const CONNECTOR_KINDS: readonly IAutoMovieBuiltConnector["kind"][] = [
  "passage",
  "stair",
  "ramp",
  "lift",
  "escalator",
  "moving-walk",
  "ladder",
  "bridge",
  "other",
];

/**
 * Validate the graph, geometry references, and spatial topology of a building.
 *
 * Checks, in order: schema version 1 and metre units; owned models through
 * `validateModel` and runtime model references; logical spaces with their
 * cells or closed shells; the element and space hierarchies for dangling
 * parents, cycles, and ownership by exactly one building unit; populations;
 * boundaries and their faces; openings, their voids inside the host face, their
 * operations, and void overlap on one boundary; connectors, their route shape,
 * landings and operations; and the support surfaces through `validateSpace`.
 * Only when none of that produced an error does it run the staged checks:
 * every closed panel fits its void, every carriage stands inside the bounded
 * space its state serves, and no operating state composes shear into the
 * element hierarchy.
 *
 * Every finding is returned with a `$input` path, warnings included; nothing
 * throws. Lowering, drawing, scheduling and quantity take-off refuse a record
 * this rejects.
 *
 * @param props.environment Building record to validate.
 * @returns Success with any warnings, or every violation found.
 *
 * @evidence contracts/common.md#principled-implementation Validates the record as a graph of declared ids, resolving every reference through id sets, then judges staged geometry only once the graph is sound, because the staged checks place elements through their parents and would answer arbitrarily over a dangling or cyclic hierarchy; nested model and surface validation is re-rooted onto this record's paths.
 * @evidence contracts/common.md#clear-and-simple-design The orchestrator of building validation: each section with rules of its own lives in its own `validateBuilt*` function, and the shared id, reference, cycle, outline and region rules come from their owners, so this file states the order, the cross-section references, the opening voids and the staging gate.
 * @evidence contracts/common.md#prohibited-implementation-shortcuts No building, kind or id is special-cased; a defect already reported is not compounded, so an opening on an unusable face is not also reported as leaving it, and staged checks wait for an error-free record instead of guarding each unusable input.
 * @evidence contracts/common.md#meaningful-documentation The documentation lists every section in order, the staging gate and what it runs, the path root and warnings, that nothing throws, and which consumers refuse a rejected record.
 * @evidence contracts/performance.md#efficient-algorithms Id indexes make reference checks linear in declarations and references; opening overlap is pairwise, planar containment resolves vertex contacts, and simplicity scans edge pairs. Staged validation checks individual states and Cartesian named-state assignments only among operations affecting the same element, with exponential worst-case cost in interacting operations.
 * @evidenceExclude contracts/performance.md#reuse-equivalent-work A validation of one record per call; lowering and every query validate the record they are handed, and nothing is cached because the record is the caller's mutable value.
 * @evidence contracts/performance.md#bound-retention-and-release-resources The id sets, face and hull maps and the work-wide driven-element table are local and released on return, each bounded by its record count; the returned validation holds the findings.
 */
export const validateBuiltEnvironment: (props: { /** Building record to validate. */ environment : IAutoMovieBuiltEnvironment ; }) => IAutoMovieValidation = (props: {
  /** Building record to validate. */
  environment: IAutoMovieBuiltEnvironment;
}): IAutoMovieValidation => {
  const environment: IAutoMovieBuiltEnvironment = props.environment;
  const collector: ViolationCollector = new ViolationCollector();
  const root: string = "$input";

  collector.nonEmpty(`${root}.id`, environment.id, "building id");
  if (environment.version !== 1)
    collector.push(
      "type",
      `${root}.version`,
      `building schema version must be 1, but was ${environment.version}`,
      environment.version,
    );
  if (environment.units !== "meter")
    collector.push(
      "type",
      `${root}.units`,
      `building units must be "meter", but was ${String(environment.units)}`,
      environment.units,
    );

  const modelIds: Set<string> = collectDeclaredIds(
    environment.models,
    `${root}.models`,
    "model",
    collector,
  );
  environment.models.forEach((model: IAutoMovieModel, index: number): void =>
    appendNested(
      collector,
      validateModel({ model }),
      (path: string): string =>
        path.replace("$input", `${root}.models[${index}]`),
    ),
  );
  const referencedModelIds: Set<string> = new Set();
  environment.modelReferences.forEach((id: string, index: number): void => {
    const path: string = `${root}.modelReferences[${index}]`;
    collector.nonEmpty(path, id, "runtime model reference");
    if (modelIds.has(id))
      collector.push(
        "type",
        path,
        `runtime model reference "${id}" duplicates an environment-owned model`,
        id,
      );
    if (referencedModelIds.has(id))
      collector.push(
        "type",
        path,
        `runtime model reference "${id}" is duplicated`,
        id,
      );
    referencedModelIds.add(id);
  });

  const spaceIds: Set<string> = validateBuiltSpaces(
    environment,
    root,
    collector,
  );

  const elementIds: Set<string> = collectDeclaredIds(
    environment.elements,
    `${root}.elements`,
    "building element",
    collector,
  );
  environment.elements.forEach(
    (element: IAutoMovieBuiltElement, index: number): void => {
      const path: string = `${root}.elements[${index}]`;
      collector.nonEmpty(`${path}.kind`, element.kind, "building-element kind");
      if (element.parent !== null && !elementIds.has(element.parent))
        collector.push(
          "type",
          `${path}.parent`,
          `building-element parent "${element.parent}" does not resolve`,
          element.parent,
        );
      if (
        element.model !== null &&
        !modelIds.has(element.model) &&
        !referencedModelIds.has(element.model)
      )
        collector.push(
          "type",
          `${path}.model`,
          `building-element model "${element.model}" does not resolve`,
          element.model,
        );
      if (element.space !== null && !spaceIds.has(element.space))
        collector.push(
          "type",
          `${path}.space`,
          `building-element space "${element.space}" does not resolve`,
          element.space,
        );
      validateTransformScalars({
        transform: element.transform,
        path: `${path}.transform`,
        label: "building-element transform",
        collector,
      });
    },
  );
  appendGraphCycles(
    environment.elements.map(
      (
        element: IAutoMovieBuiltElement,
        index: number,
      ): { id: string; links: string[]; path: string; value: unknown } => ({
        id: element.id,
        links: element.parent === null ? [] : [element.parent],
        path: `${root}.elements[${index}].parent`,
        value: element.parent,
      }),
    ),
    "building element hierarchy must be acyclic",
    collector,
  );

  const populationIds: Set<string> = new Set();
  (environment.populations ?? []).forEach(
    (population: IAutoMovieBuiltPopulation, index: number): void => {
      const path: string = `${root}.populations[${index}]`;
      collector.nonEmpty(`${path}.set.id`, population.set.id, "population id");
      if (populationIds.has(population.set.id))
        collector.push(
          "type",
          `${path}.set.id`,
          `population id "${population.set.id}" is duplicated`,
          population.set.id,
        );
      populationIds.add(population.set.id);
      if (!spaceIds.has(population.space))
        collector.push(
          "type",
          `${path}.space`,
          `population space "${population.space}" does not resolve`,
          population.space,
        );
      validateBuiltPopulation(population, path, collector);
    },
  );

  validateBuiltBuildings(environment, root, collector);

  const boundaries: {
    ids: Set<string>;
    faces: Map<string, IAutoMovieBoundaryFace>;
  } = validateBuiltBoundaries(
    environment,
    root,
    spaceIds,
    elementIds,
    collector,
  );
  // Which member already drives each element, across doors and runs alike.
  const driven: Map<string, string> = new Map();
  const hulls: Map<number, IAutoMoviePlanarPoint[]> = validateBuiltOpenings(
    environment,
    root,
    boundaries,
    elementIds,
    driven,
    collector,
  );

  collectDeclaredIds(
    environment.connectors,
    `${root}.connectors`,
    "connector",
    collector,
  );
  const firstConnectors: Map<string, IAutoMovieBuiltConnector> = new Map();
  for (const connector of environment.connectors)
    if (!firstConnectors.has(connector.id))
      firstConnectors.set(connector.id, connector);
  environment.connectors.forEach(
    (connector: IAutoMovieBuiltConnector, index: number): void => {
      const path: string = `${root}.connectors[${index}]`;
      if (!CONNECTOR_KINDS.includes(connector.kind))
        collector.push(
          "type",
          `${path}.kind`,
          `unknown connector kind "${String(connector.kind)}"`,
          connector.kind,
        );
      for (const endpoint of ["from", "to"] as const)
        if (!spaceIds.has(connector[endpoint]))
          collector.push(
            "type",
            `${path}.${endpoint}`,
            `connector ${endpoint} space "${connector[endpoint]}" does not resolve`,
            connector[endpoint],
          );
      if (connector.from === connector.to)
        collector.push(
          "type",
          `${path}.to`,
          "connector endpoints must be different logical spaces",
          connector.to,
        );
      if (connector.route.length < 2)
        collector.push(
          "range",
          `${path}.route`,
          `connector route needs at least 2 points, but had ${connector.route.length}`,
          connector.route.length,
        );
      connector.route.forEach(
        (point: IAutoMovieVector3, pointIndex: number): void =>
          collector.finiteVector(
            `${path}.route[${pointIndex}]`,
            point,
            "connector route point",
          ),
      );
      validateBuiltConnectorShape(
        environment,
        connector,
        path,
        firstConnectors.get(connector.id) === connector,
        collector,
      );
      validateDeclaredReferences(
        connector.elements,
        elementIds,
        `${path}.elements`,
        "building element",
        collector,
      );
      validateBuiltConnectorLandings(connector, path, spaceIds, collector);
      validateBuiltConnectorOperation({
        connector,
        path,
        elements: environment.elements,
        elementIds,
        driven,
        collector,
      });
    },
  );

  environment.surfaces.forEach(
    (entry: IAutoMovieBuiltSurface, index: number): void => {
      if (!spaceIds.has(entry.space))
        collector.push(
          "type",
          `${root}.surfaces[${index}].space`,
          `surface logical space "${entry.space}" does not resolve`,
          entry.space,
        );
    },
  );
  // The support space numbers its surfaces as a plain list; each one is the
  // `surface` field of the building's surface entry at the same index.
  appendNested(
    collector,
    validateSpace({
      space: {
        id: `${environment.id}-support`,
        surfaces: environment.surfaces.map(
          (entry: IAutoMovieBuiltSurface): IAutoMovieBuiltSurface["surface"] =>
            entry.surface,
        ),
        walkable: environment.walkable,
      },
    }),
    (path: string): string =>
      path.replace(/^\$input\.surfaces\[(\d+)\]/, "$input.surfaces[$1].surface"),
  );

  if (
    !collector.items.some(
      (item: IAutoMovieConstraintViolation): boolean =>
        item.severity === "error",
    )
  ) {
    validateBuiltPanelFit(environment, root, boundaries.faces, hulls, collector);
    validateBuiltCarriageService(environment, root, collector);
    validateBuiltStagedConfigurations(environment, root, collector);
  }

  return collector.toValidation();
};

/**
 * Append a nested validation's findings, warnings included, re-rooting each
 * `$input` path onto this record.
 */
const appendNested: (collector: ViolationCollector, validation: IAutoMovieValidation, reroot: ( path : string ) => string) => void = (
  collector: ViolationCollector,
  validation: IAutoMovieValidation,
  reroot: (path: string) => string,
): void => {
  const items: readonly IAutoMovieConstraintViolation[] =
    validation.success === false
      ? validation.violations
      : (validation.warnings ?? []);
  for (const item of items)
    collector.items.push({ ...item, path: reroot(item.path) });
};
