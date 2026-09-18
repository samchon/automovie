import { IAutoMovieBoundaryFace, IAutoMovieBuiltConnector, IAutoMovieBuiltEnvironment, IAutoMovieBuiltOpening, IAutoMovieBuiltPopulation, IAutoMovieBuiltSpace, IAutoMovieConnectorCarriage, IAutoMovieConnectorSection, IAutoMovieConnectorState, IAutoMovieInstanceSetDesign, IAutoMovieMovablePanel, IAutoMovieOpeningProfile, IAutoMovieOperationState, IAutoMoviePlanarPoint, IAutoMovieQuaternion, IAutoMovieSpaceShell, IAutoMovieTravelMotion, IAutoMovieValidation, IAutoMovieVector3 } from "@automovie/interface";
import { Matrix4 } from "../math/Matrix4";
import { Quaternion } from "../math/Quaternion";
import { Vector3 } from "../math/Vector3";
import { validateModel } from "../validation/validateModel";
import { validateSpace } from "../validation/validateSpace";
import { validateTransformScalars } from "../validation/validateTransformScalars";
import { ViolationCollector } from "../validation/ViolationCollector";
import { PLANAR_EPSILON } from "./PLANAR_EPSILON";
import { outlineHull } from "./outlineHull";
import { polygonDoubleArea } from "./polygonDoubleArea";
import { polygonInside } from "./polygonInside";
import { polygonIsSimple } from "./polygonIsSimple";
import { polygonShortestEdge } from "./polygonShortestEdge";
import { polygonsOverlap } from "./polygonsOverlap";
import { builtEnvironmentContainsPoint } from "./builtEnvironmentContainsPoint";
import { builtSpaceShellVolume } from "./builtSpaceShellVolume";
import { builtSpaceStatesVolume } from "./builtSpaceStatesVolume";

const CONNECTOR_KINDS = [
  "passage",
  "stair",
  "ramp",
  "lift",
  "escalator",
  "moving-walk",
  "ladder",
  "bridge",
  "other",
] as const;

/** The three ways a powered run may stand: driven either way, or not at all. */
const CONNECTOR_DRIVES = ["forward", "reverse", "still"] as const;

const PLANE_NORMAL_EPSILON = 1e-12;

const MATRIX_ROUND_TRIP_EPSILON = 1e-8;

/** Largest deviation from unit norm a stated quaternion may carry. */
const UNIT_QUATERNION_EPSILON = 1e-6;

/** Shortest distance, in metres, two consecutive route stations may sit apart. */
const ROUTE_EPSILON = 1e-9;

/** Largest disagreement, in metres, between a stated step run and its route. */
const STEP_TOLERANCE = 1e-3;

/** Largest disagreement, in radians, between a stated slope and its route. */
const SLOPE_TOLERANCE = 1e-6;

/**
 * Slack, in radians, on the full turn a revolute panel may travel.
 *
 * Validation and the swept-envelope solver share this on purpose: the cap is
 * what bounds the solver's critical-angle walk, so a range the validator waved
 * through but the solver could not enumerate would be a hang rather than a
 * disagreement.
 */
const FULL_TURN_EPSILON = 1e-6;

/**
 * Validate the graph, geometry references, and spatial topology of a building.
 *
 * @evidence requirements/interior/scope-and-host-boundary.md#interior-current-product-scope `validateBuiltEnvironment` validates the graph, geometry references, and spatial topology of a building. This ensures authored building-interior state remains explicit and reviewable within its supported host boundary.
 * @evidence specifications/interior-space/scope-and-host.md#interior-space-building-interior-boundary `validateBuiltEnvironment` performs built environment validation when the engine resolves ownership, topology, and geometry inside one building-interior boundary.
 * @evidence requirements/interior/connections-and-circulation.md#interior-route-refusal `validateBuiltEnvironment` rejects missing or identical connector endpoints, short or non-finite routes, invalid section dimensions, slopes, landings, states, and operation travel instead of accepting a broken circulation path.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-connector-route-topology `validateBuiltEnvironment` enforces the connector endpoints, route, section, landing, and operation invariants that make one circulation topology usable.
 * @evidence requirements/interior/doors-windows-and-openings.md#interior-opening-validation `validateBuiltEnvironment` checks each opening's host and cut geometry, fill and panel containment, overlap, named states, travel, and panel fit before the opening can enter the built environment.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-host-opening-operation `validateBuiltEnvironment` enforces the host, aperture, fill, panel, state, and travel invariants of an operable opening.
 * @evidence requirements/interior/columns-beams-and-architectural-elements.md#interior-element-open-form `validateBuiltEnvironment` admits open element kinds and arbitrary referenced models while validating stable identity, ownership, hierarchy, and parent-local transforms.
 * @evidence specifications/interior-space/elements-furnishing-and-clearance.md#interior-space-element-host-support-form The validator implements the open-form, model-reference, owner, hierarchy, and transform subset without claiming structural support analysis.
 * @evidence requirements/interior/spatial-hierarchy-and-zones.md#interior-multilevel-spaces `validateBuiltEnvironment` preserves arbitrary convex cells and closed triangle shells in three dimensions instead of flattening logical spaces into one storey plane.
 * @evidence requirements/interior/spatial-hierarchy-and-zones.md#interior-space-boundaries `validateBuiltEnvironment` validates stable boundary identities whose faces relate one or two logical spaces.
 * @evidence requirements/interior/spatial-hierarchy-and-zones.md#interior-space-graph-validation `validateBuiltEnvironment` rejects unresolved parents, ownership collisions, cycles, malformed cells, and open or inconsistently wound shells.
 * @evidence specifications/interior-space/space-level-zone-topology.md#interior-space-hierarchy-zone-overlay The validator implements the three-dimensional space hierarchy, containment, boundary, and topology subset without claiming authored logical-zone overlays.
 * @evidence requirements/interior/validation-and-iteration.md#interior-addressable-diagnostics `validateBuiltEnvironment` reports each failed building identity, relation, transform, face, cell, shell, opening, and connector fact at its stable input path with observed and expected values.
 * @evidence requirements/interior/validation-and-iteration.md#interior-geometry-topology-validation `validateBuiltEnvironment` checks finite geometry, face outlines, cell planes, shell closure and winding, containment, ownership, and graph topology before lowering.
 * @evidence specifications/interior-space/deliverables-and-validation.md#interior-space-layered-validation-diagnostics The building validator contributes the addressable geometry-and-topology layer without claiming visual review, code compliance, or every diagnostic field.
 * @evidence requirements/interior/walls-partitions-and-linings.md#interior-wall-boundary-validation `validateBuiltEnvironment` rejects invalid boundary thickness, planar face geometry, ownership, shell closure, opening containment, and overlapping cuts.
 * @evidence requirements/interior/walls-partitions-and-linings.md#interior-wall-partial-freeform `validateBuiltEnvironment` accepts arbitrary simple planar face outlines and faceted closed shells rather than limiting walls to full-height rectangles.
 * @evidence requirements/interior/walls-partitions-and-linings.md#interior-wall-two-sided-ownership `validateBuiltEnvironment` preserves one boundary identity shared by at most two spaces instead of duplicating the construction for each side.
 * @evidence specifications/interior-space/boundaries-openings-and-circulation.md#interior-space-wall-partition-boundary The validator implements the boundary face, thickness, one-or-two-space ownership, cut, and topology subset without claiming finish-side policy.
 * @evidence requirements/building-exterior/balconies-terraces-and-courtyards.md#building-exterior-space-boundary `validateBuiltEnvironment` preserves each enclosing or open boundary face and its related space identities without claiming guard or drainage compliance.
 * @evidence requirements/building-exterior/balconies-terraces-and-courtyards.md#building-exterior-space-identity `validateBuiltEnvironment` validates stable building-owned space identity, three-dimensional extent, boundaries, surfaces, and connectors.
 * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-exterior-space-input-output The building-space graph implements the stable identity, extent, boundary, and access-relation subset without claiming weather exposure or resolved drainage.
 * @evidence specifications/building-envelope/exterior-spaces-circulation-and-optics.md#building-envelope-exterior-space-boundary-drainage-invariant The validator contributes the boundary-face and open-edge identity subset without claiming guards, thresholds, or water-path analysis.
 * @evidence requirements/building-exterior/coordinates-and-shared-boundaries.md#building-shared-boundary-identity `validateBuiltEnvironment` makes one boundary or opening identity own the shared face, cut, and related space references.
 * @evidence specifications/building-envelope/identity-scope-and-coordinates.md#building-envelope-coordinate-shared-boundary-identity The validator enforces single shared boundary and opening identities for its built-environment subset without claiming site control-point authority.
 * @evidence requirements/building-exterior/openings-and-fenestration.md#building-opening-interior-consistency `validateBuiltEnvironment` uses one host face, aperture profile, depth, fill, panel, and named state for an opening seen from either related space.
 * @evidence requirements/building-exterior/scope-and-building-identity.md#building-exterior-identity `validateBuiltEnvironment` binds stable building units to unique visible-element and logical-space roots and rejects unattributed or multiply owned members.
 * @evidence specifications/building-envelope/identity-scope-and-coordinates.md#building-envelope-scope-input-normalization The validator implements building-unit, root, element, space, unit, and ownership normalization without claiming phase or source-revision authority.
 * @evidence requirements/building-exterior/scope-and-building-identity.md#building-exterior-linked-interior `validateBuiltEnvironment` keeps exterior elements, logical interior spaces, shared boundaries, openings, and connectors under the same building-unit ownership graph.
 * @evidence specifications/building-envelope/linked-interior-coordination.md#building-envelope-linked-interior-input-output The unified building graph implements shared building, space, boundary, and opening identity without claiming revision, authority, or coordination receipts.
 * @evidence requirements/building-exterior/validation-and-interior-consistency.md#building-exterior-geometry-validation `validateBuiltEnvironment` reports addressable exterior element, boundary, opening, connector, cell, and shell geometry or topology failures.
 * @evidence specifications/building-envelope/phases-deliverables-and-validation.md#building-envelope-validation-finding-output The validator supplies stable paths, severity, observed values, and expected conditions for its geometry subset without claiming the specification's full finding schema.
 * @evidence requirements/building-exterior/validation-and-interior-consistency.md#building-exterior-interior-shared-validation `validateBuiltEnvironment` jointly validates the shared boundary, opening, coordinate hierarchy, containment, and ownership facts held in one built environment.
 * @evidence specifications/building-envelope/linked-interior-coordination.md#building-envelope-linked-interior-matrix-rules The validator implements the boundary, opening, coordinate, and containment rows of the coordination matrix without claiming area, storey, or stale-propagation coverage.
 * @evidence requirements/asset-authoring/identity-and-instances.md#asset-logical-group `validateBuiltEnvironment` requires each compact population to name one declared logical space, keeping spatial membership explicit and separate from logical grouping.
 * @evidence specifications/asset-and-representation/alternatives-instances-and-groups.md#asset-spec-group-individuality `validateBuiltEnvironment` refuses unresolved or duplicated compact population ownership and placement laws that a space query could not inspect.
 * @evidence requirements/asset-authoring/representations-bounds-and-lod.md#asset-declared-measured-bounds `validateBuiltEnvironment` requires a finite, ordered prototype-local bound before any population world bound can be derived.
 * @evidence specifications/asset-and-representation/bounds-proxies-and-lod.md#asset-spec-bounds-inputs `validateBuiltEnvironment` checks the declared model-local extent and every placement scalar consumed by the deterministic population bounds fold.
 */
export const validateBuiltEnvironment = (props: {
  environment: IAutoMovieBuiltEnvironment;
}): IAutoMovieValidation => {
  const { environment } = props;
  const collector = new ViolationCollector();
  const root = "$input";

  nonEmpty(environment.id, `${root}.id`, "building id", collector);
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

  const modelIds = collectIds(
    environment.models,
    `${root}.models`,
    "model",
    collector,
  );
  environment.models.forEach((model, index) => {
    appendValidation(
      collector,
      validateModel({ model }),
      `${root}.models[${index}]`,
    );
  });
  const referencedModelIds = new Set<string>();
  environment.modelReferences.forEach((id, index) => {
    nonEmpty(
      id,
      `${root}.modelReferences[${index}]`,
      "runtime model reference",
      collector,
    );
    if (modelIds.has(id))
      collector.push(
        "type",
        `${root}.modelReferences[${index}]`,
        `runtime model reference "${id}" duplicates an environment-owned model`,
        id,
      );
    if (referencedModelIds.has(id))
      collector.push(
        "type",
        `${root}.modelReferences[${index}]`,
        `runtime model reference "${id}" is duplicated`,
        id,
      );
    referencedModelIds.add(id);
  });

  const spaceIds = collectIds(
    environment.spaces,
    `${root}.spaces`,
    "logical space",
    collector,
  );
  environment.spaces.forEach((space, index) => {
    const path = `${root}.spaces[${index}]`;
    nonEmpty(space.kind, `${path}.kind`, "logical-space kind", collector);
    if (space.parent !== null && !spaceIds.has(space.parent))
      collector.push(
        "type",
        `${path}.parent`,
        `logical-space parent "${space.parent}" does not resolve`,
        space.parent,
      );
    if (space.cells.length !== 0 && space.shell !== undefined)
      collector.push(
        "type",
        `${path}.shell`,
        "a logical space states its volume once: carry either convex cells or a boundary shell, not both",
        space.shell,
      );
    if (space.fidelity !== undefined) {
      if (space.fidelity !== "exact" && space.fidelity !== "faceted")
        collector.push(
          "type",
          `${path}.fidelity`,
          `logical-space fidelity must be "exact" or "faceted", but was ${String(space.fidelity)}`,
          space.fidelity,
        );
      else if (space.cells.length === 0 && space.shell === undefined)
        collector.push(
          "type",
          `${path}.fidelity`,
          "a logical space that states no volume has nothing for a fidelity to describe",
          space.fidelity,
        );
    }
    if (space.shell !== undefined)
      validateSpaceShell(space.shell, `${path}.shell`, collector);
    const cellIds = new Set<string>();
    space.cells.forEach((cell, cellIndex) => {
      const cellPath = `${path}.cells[${cellIndex}]`;
      nonEmpty(cell.id, `${cellPath}.id`, "space-cell id", collector);
      if (cellIds.has(cell.id))
        collector.push(
          "type",
          `${cellPath}.id`,
          `space-cell id "${cell.id}" must be unique within logical space "${space.id}"`,
          cell.id,
        );
      cellIds.add(cell.id);
      if (cell.planes.length < 4)
        collector.push(
          "range",
          `${cellPath}.planes`,
          `a bounded convex cell needs at least 4 planes, but had ${cell.planes.length}`,
          cell.planes.length,
        );
      cell.planes.forEach((plane, planeIndex) => {
        const planePath = `${cellPath}.planes[${planeIndex}]`;
        finiteVector(
          plane.normal,
          `${planePath}.normal`,
          "plane normal",
          collector,
        );
        const length = Math.hypot(
          plane.normal.x,
          plane.normal.y,
          plane.normal.z,
        );
        if (Number.isFinite(length) && length <= PLANE_NORMAL_EPSILON)
          collector.push(
            "range",
            `${planePath}.normal`,
            "plane normal must be non-zero",
            plane.normal,
          );
        if (!Number.isFinite(plane.offset))
          collector.push(
            "range",
            `${planePath}.offset`,
            `plane offset must be finite, but was ${plane.offset}`,
            plane.offset,
          );
      });
    });
  });
  appendHierarchyCycles(
    environment.spaces,
    `${root}.spaces`,
    "logical space",
    collector,
  );

  const elementIds = collectIds(
    environment.elements,
    `${root}.elements`,
    "building element",
    collector,
  );
  environment.elements.forEach((element, index) => {
    const path = `${root}.elements[${index}]`;
    nonEmpty(element.kind, `${path}.kind`, "building-element kind", collector);
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
  });
  appendHierarchyCycles(
    environment.elements,
    `${root}.elements`,
    "building element",
    collector,
  );

  const populationIds = new Set<string>();
  (environment.populations ?? []).forEach((population, index) => {
    const path = `${root}.populations[${index}]`;
    nonEmpty(population.set.id, `${path}.set.id`, "population id", collector);
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
    validatePopulationPrototypeBounds(
      population.prototypeBounds,
      `${path}.prototypeBounds`,
      collector,
    );
    validatePopulationSet(population.set, `${path}.set`, collector);
  });

  const buildingIds = collectIds(
    environment.buildings,
    `${root}.buildings`,
    "building unit",
    collector,
  );
  if (environment.buildings.length === 0)
    collector.push(
      "range",
      `${root}.buildings`,
      "a built-environment work needs at least one building unit",
      environment.buildings,
    );
  const buildingElementRoots = new Set<string>();
  const buildingSpaceRoots = new Set<string>();
  environment.buildings.forEach((building, index) => {
    const path = `${root}.buildings[${index}]`;
    if (buildingIds.has(building.id)) {
      const element = environment.elements.find(
        (candidate) => candidate.id === building.element,
      );
      if (element === undefined)
        collector.push(
          "type",
          `${path}.element`,
          `building root element "${building.element}" does not resolve`,
          building.element,
        );
      else if (element.parent !== null)
        collector.push(
          "type",
          `${path}.element`,
          `building root element "${building.element}" must have no parent`,
          building.element,
        );
      const space = environment.spaces.find(
        (candidate) => candidate.id === building.space,
      );
      if (space === undefined)
        collector.push(
          "type",
          `${path}.space`,
          `building root space "${building.space}" does not resolve`,
          building.space,
        );
      else if (space.parent !== null)
        collector.push(
          "type",
          `${path}.space`,
          `building root space "${building.space}" must have no parent`,
          building.space,
        );
    }
    if (buildingElementRoots.has(building.element))
      collector.push(
        "type",
        `${path}.element`,
        `building root element "${building.element}" is already owned by another building unit`,
        building.element,
      );
    if (buildingSpaceRoots.has(building.space))
      collector.push(
        "type",
        `${path}.space`,
        `building root space "${building.space}" is already owned by another building unit`,
        building.space,
      );
    buildingElementRoots.add(building.element);
    buildingSpaceRoots.add(building.space);
  });
  appendOwnership(
    environment.elements,
    buildingElementRoots,
    `${root}.elements`,
    "building element",
    "root element",
    collector,
  );
  appendOwnership(
    environment.spaces,
    buildingSpaceRoots,
    `${root}.spaces`,
    "logical space",
    "root space",
    collector,
  );

  const boundaryIds = collectIds(
    environment.boundaries,
    `${root}.boundaries`,
    "boundary",
    collector,
  );
  const boundaryFaces = new Map<string, IAutoMovieBoundaryFace>();
  environment.boundaries.forEach((boundary, index) => {
    const path = `${root}.boundaries[${index}]`;
    nonEmpty(boundary.kind, `${path}.kind`, "boundary kind", collector);
    if (boundary.spaces.length < 1 || boundary.spaces.length > 2)
      collector.push(
        "range",
        `${path}.spaces`,
        `a boundary must enclose one space or separate two, but cited ${boundary.spaces.length}`,
        boundary.spaces,
      );
    validateReferences(
      boundary.spaces,
      spaceIds,
      `${path}.spaces`,
      "logical space",
      collector,
    );
    validateReferences(
      boundary.elements,
      elementIds,
      `${path}.elements`,
      "building element",
      collector,
    );
    if (
      boundary.face !== undefined &&
      faceIsUsable(boundary.face, path, collector)
    )
      boundaryFaces.set(boundary.id, boundary.face);
  });

  collectIds(environment.openings, `${root}.openings`, "opening", collector);
  const openingHulls = new Map<number, IAutoMoviePlanarPoint[]>();
  const drivenElements = new Map<string, string>();
  environment.openings.forEach((opening, index) => {
    const path = `${root}.openings[${index}]`;
    nonEmpty(opening.kind, `${path}.kind`, "opening kind", collector);
    if (!boundaryIds.has(opening.boundary))
      collector.push(
        "type",
        `${path}.boundary`,
        `opening boundary "${opening.boundary}" does not resolve`,
        opening.boundary,
      );
    if (opening.fill !== null && !elementIds.has(opening.fill))
      collector.push(
        "type",
        `${path}.fill`,
        `opening fill element "${opening.fill}" does not resolve`,
        opening.fill,
      );
    if (opening.profile !== undefined) {
      const profilePath = `${path}.profile`;
      const host = environment.boundaries.find(
        (candidate) => candidate.id === opening.boundary,
      );
      if (host !== undefined && host.face === undefined)
        collector.push(
          "type",
          profilePath,
          `opening "${opening.id}" states a void, but its host boundary "${opening.boundary}" declares no face to cut it in`,
          opening.boundary,
        );
      if (profileIsUsable(opening.profile, profilePath, collector)) {
        const hull = outlineHull(opening.profile);
        openingHulls.set(index, hull);
        const face = boundaryFaces.get(opening.boundary);
        // A missing or malformed host face is already reported on its own path,
        // and repeating it here would only hide the one defect worth acting on.
        if (face !== undefined && polygonInside(hull, face.outline) === false)
          collector.push(
            "range",
            `${profilePath}.outline`,
            `opening "${opening.id}" leaves the face of its host boundary "${opening.boundary}"`,
            opening.profile.outline,
          );
      }
    }
    validateOpeningOperation({
      opening,
      path,
      elements: elementIds,
      environment,
      driven: drivenElements,
      collector,
    });
  });
  environment.openings.forEach((opening, index) => {
    const hull = openingHulls.get(index);
    if (hull === undefined) return;
    // Hulls are keyed by position rather than by id, so a work that declares
    // one opening id twice reports that one defect on its own path instead of
    // also reporting the record as overlapping itself.
    environment.openings.slice(0, index).forEach((earlier, other) => {
      const against = openingHulls.get(other);
      if (
        against !== undefined &&
        earlier.boundary === opening.boundary &&
        polygonsOverlap(hull, against)
      )
        collector.push(
          "range",
          `${root}.openings[${index}].profile.outline`,
          `openings "${earlier.id}" and "${opening.id}" occupy the same part of boundary "${opening.boundary}"`,
          opening.profile!.outline,
        );
    });
  });

  collectIds(
    environment.connectors,
    `${root}.connectors`,
    "connector",
    collector,
  );
  environment.connectors.forEach((connector, index) => {
    const path = `${root}.connectors[${index}]`;
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
    connector.route.forEach((point, pointIndex) =>
      finiteVector(
        point,
        `${path}.route[${pointIndex}]`,
        "connector route point",
        collector,
      ),
    );
    validateConnectorShape(connector, path, collector);
    validateReferences(
      connector.elements,
      elementIds,
      `${path}.elements`,
      "building element",
      collector,
    );
    validateConnectorLandings(connector, path, spaceIds, collector);
    validateConnectorOperation({
      connector,
      path,
      elements: elementIds,
      environment,
      driven: drivenElements,
      collector,
    });
  });

  environment.surfaces.forEach((entry, index) => {
    if (!spaceIds.has(entry.space))
      collector.push(
        "type",
        `${root}.surfaces[${index}].space`,
        `surface logical space "${entry.space}" does not resolve`,
        entry.space,
      );
  });
  appendBuildingSpaceValidation(
    collector,
    validateSpace({
      space: {
        id: `${environment.id}-support`,
        surfaces: environment.surfaces.map((entry) => entry.surface),
        walkable: environment.walkable,
      },
    }),
  );

  if (!collector.items.some((item) => item.severity === "error")) {
    validatePanelFit(environment, root, boundaryFaces, openingHulls, collector);
    validateCarriageService(environment, root, collector);
    validateStagedConfigurations(environment, root, collector);
  }

  return collector.toValidation();
};

const collectIds = <T extends { id: string }>(
  records: readonly T[],
  path: string,
  label: string,
  collector: ViolationCollector,
): Set<string> => {
  const ids = new Set<string>();
  records.forEach((record, index) => {
    nonEmpty(record.id, `${path}[${index}].id`, `${label} id`, collector);
    if (ids.has(record.id))
      collector.push(
        "type",
        `${path}[${index}].id`,
        `${label} id "${record.id}" must be unique`,
        record.id,
      );
    ids.add(record.id);
  });
  return ids;
};

const appendHierarchyCycles = <T extends { id: string; parent: string | null }>(
  records: readonly T[],
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  const byId = new Map(records.map((record) => [record.id, record]));
  const indexById = new Map(records.map((record, index) => [record.id, index]));
  const states = new Map<string, "visiting" | "visited">();
  const visit = (record: T): void => {
    const state = states.get(record.id);
    if (state === "visited") return;
    if (state === "visiting") {
      collector.push(
        "type",
        `${path}[${indexById.get(record.id)!}].parent`,
        `${label} hierarchy must be acyclic`,
        record.parent,
      );
      return;
    }
    states.set(record.id, "visiting");
    const parent = record.parent === null ? undefined : byId.get(record.parent);
    if (parent !== undefined) visit(parent);
    states.set(record.id, "visited");
  };
  records.forEach(visit);
};

const appendOwnership = <T extends { id: string; parent: string | null }>(
  records: readonly T[],
  roots: ReadonlySet<string>,
  path: string,
  label: string,
  rootLabel: string,
  collector: ViolationCollector,
): void => {
  const byId = new Map(records.map((record) => [record.id, record]));
  records.forEach((record, index) => {
    const seen = new Set<string>([record.id]);
    let current: T = record;
    while (current.parent !== null) {
      const parent = byId.get(current.parent);
      // A dangling or cyclic parent is already reported on its own path, and
      // walking it further would only repeat that one defect as an ownership
      // gap the author cannot act on.
      if (parent === undefined || seen.has(parent.id)) return;
      seen.add(parent.id);
      current = parent;
    }
    if (!roots.has(current.id))
      collector.push(
        "type",
        `${path}[${index}].parent`,
        `${label} "${record.id}" belongs to no building unit; its topmost ${label} "${current.id}" must be declared as some building unit's ${rootLabel}`,
        record.parent,
      );
  });
};

const validateReferences = (
  references: readonly string[],
  targets: ReadonlySet<string>,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  const seen = new Set<string>();
  references.forEach((reference, index) => {
    if (!targets.has(reference))
      collector.push(
        "type",
        `${path}[${index}]`,
        `${label} "${reference}" does not resolve`,
        reference,
      );
    if (seen.has(reference))
      collector.push(
        "type",
        `${path}[${index}]`,
        `${label} "${reference}" is duplicated`,
        reference,
      );
    seen.add(reference);
  });
};

const appendValidation = (
  collector: ViolationCollector,
  validation: IAutoMovieValidation,
  path: string,
  nestedRoot = "",
): void => {
  const items =
    validation.success === false
      ? validation.violations
      : (validation.warnings ?? []);
  for (const item of items)
    collector.items.push({
      ...item,
      path: item.path.replace("$input", `${path}${nestedRoot}`),
    });
};

const appendBuildingSpaceValidation = (
  collector: ViolationCollector,
  validation: IAutoMovieValidation,
): void => {
  const items =
    validation.success === false
      ? validation.violations
      : (validation.warnings ?? []);
  for (const item of items)
    collector.items.push({
      ...item,
      path: item.path
        .replace(/^\$input\.surfaces\[(\d+)\]/, "$input.surfaces[$1].surface")
        .replace(/^\$input\.walkable/, "$input.walkable"),
    });
};

/**
 * World matrices for every element, optionally displaced by panel travel.
 *
 * A joint displacement is applied after the element's own local transform and
 * therefore rides down the hierarchy, which is what makes a folding leaf work
 * without a second parenting notion: parent its element to the leaf it folds
 * against and the outer leaf's travel carries it.
 */
const worldMatricesOf = (
  environment: IAutoMovieBuiltEnvironment,
  joints: ReadonlyMap<string, number[]> = new Map(),
): Map<string, number[]> => {
  const byId = new Map(
    environment.elements.map((element) => [element.id, element]),
  );
  const matrices = new Map<string, number[]>();
  const read = (id: string): number[] => {
    const cached = matrices.get(id);
    if (cached !== undefined) return cached;
    const element = byId.get(id)!;
    const rest = Matrix4.compose(
      element.transform.translation,
      element.transform.rotation,
      element.transform.scale,
    );
    const joint = joints.get(id);
    const local = joint === undefined ? rest : Matrix4.multiply(rest, joint);
    const world =
      element.parent === null
        ? local
        : Matrix4.multiply(read(element.parent), local);
    matrices.set(id, world);
    return world;
  };
  environment.elements.forEach((element) => read(element.id));
  return matrices;
};

/** The element-local displacement one moving member carries at one value. */
const travelDelta = (
  motion: IAutoMovieTravelMotion,
  value: number,
): number[] => {
  const axis = Vector3.normalize(motion.axis);
  if (motion.kind === "prismatic")
    return Matrix4.compose(
      Vector3.scale(axis, value),
      { x: 0, y: 0, z: 0, w: 1 },
      { x: 1, y: 1, z: 1 },
    );
  const half = value / 2;
  const sine = Math.sin(half);
  const rotation: IAutoMovieQuaternion = {
    x: axis.x * sine,
    y: axis.y * sine,
    z: axis.z * sine,
    w: Math.cos(half),
  };
  // Turning about a pivot is a turn about the origin plus the offset that puts
  // the pivot back where it was.
  return Matrix4.compose(
    Vector3.subtract(
      motion.pivot,
      Quaternion.rotateVector(rotation, motion.pivot),
    ),
    rotation,
    { x: 1, y: 1, z: 1 },
  );
};

/**
 * The element-local displacement every moving member carries in a named state.
 *
 * The default is the environment's own current state; a caller asking for
 * another state gets that one instead, which is how a shot stages the same
 * building with its doors open without editing the record. An opening or run
 * that has no such state simply does not move, so asking for `open` swings the
 * doors that can open and leaves every other opening, and every lift, exactly
 * where it was.
 *
 * Openings and runs share one table because they share one rule: an element
 * carries one displacement. Validation refuses a work where two members claim
 * the same element, so the table is a merge of disjoint keys rather than a
 * race, and whichever member owns the element owns it everywhere.
 *
 * A state that names no value for a member leaves that member at rest.
 * `validateBuiltEnvironment` refuses such a record by name, and answering at
 * rest is what keeps a query over an unvalidated one from failing on a value it
 * was never given.
 */
const operationDeltas = (
  environment: IAutoMovieBuiltEnvironment,
  stateId?: string,
): Map<string, number[]> => {
  const deltas = new Map<string, number[]>();
  for (const opening of environment.openings) {
    const operation = opening.operation;
    if (operation === undefined) continue;
    const wanted = stateId ?? operation.state;
    const state = operation.states.find((candidate) => candidate.id === wanted);
    if (state === undefined) continue;
    applyPanelState(operation.panels, state, deltas);
  }
  for (const connector of environment.connectors) {
    const operation = connector.operation;
    if (operation === undefined) continue;
    const wanted = stateId ?? operation.state;
    const state = operation.states.find((candidate) => candidate.id === wanted);
    if (state === undefined) continue;
    applyCarriageState(operation.carriages, state, deltas);
  }
  return deltas;
};

/** Place every panel of one opening at the travel a named state gives it. */
const applyPanelState = (
  panels: readonly IAutoMovieMovablePanel[],
  state: IAutoMovieOperationState,
  deltas: Map<string, number[]>,
): void => {
  for (const panel of panels) {
    const entry = state.panels.find((value) => value.panel === panel.id);
    if (entry === undefined) continue;
    deltas.set(panel.element, travelDelta(panel.motion, entry.value));
  }
};

/** Place every carriage of one run at the travel a named state gives it. */
const applyCarriageState = (
  carriages: readonly IAutoMovieConnectorCarriage[],
  state: IAutoMovieConnectorState,
  deltas: Map<string, number[]>,
): void => {
  for (const carriage of carriages) {
    const entry = state.carriages.find(
      (value) => value.carriage === carriage.id,
    );
    if (entry === undefined) continue;
    deltas.set(carriage.element, travelDelta(carriage.motion, entry.value));
  }
};

const descendantSpaces = (
  spaces: readonly IAutoMovieBuiltSpace[],
  root: string,
): Set<string> => {
  const included = new Set([root]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const space of spaces)
      if (
        space.parent !== null &&
        included.has(space.parent) &&
        !included.has(space.id)
      ) {
        included.add(space.id);
        changed = true;
      }
  }
  return included;
};

/**
 * Check exactly what a building owns about a population it stages.
 *
 * The whole instance-set design is the production builder's to validate, and
 * it validates it again when the lowered set reaches the world. What is checked
 * here is the subset this record answers for on its own: the slot count and the
 * placement law {@link builtInstanceSetPlacementBounds} has to be total over,
 * because a space query that cannot bound a population it was handed would have
 * to return either a lie or nothing at all.
 */
const validatePopulationPrototypeBounds = (
  bounds: IAutoMovieBuiltPopulation["prototypeBounds"],
  path: string,
  collector: ViolationCollector,
): void => {
  finiteVector(
    bounds.min,
    `${path}.min`,
    "population prototype minimum",
    collector,
  );
  finiteVector(
    bounds.max,
    `${path}.max`,
    "population prototype maximum",
    collector,
  );
  for (const axis of ["x", "y", "z"] as const)
    if (
      Number.isFinite(bounds.min[axis]) &&
      Number.isFinite(bounds.max[axis]) &&
      bounds.min[axis] > bounds.max[axis]
    )
      collector.push(
        "range",
        `${path}.${axis}`,
        `population prototype ${axis} bounds must be ordered, but ${bounds.min[axis]} is above ${bounds.max[axis]}`,
        { min: bounds.min[axis], max: bounds.max[axis] },
      );
};

const validatePopulationSet = (
  set: IAutoMovieInstanceSetDesign,
  path: string,
  collector: ViolationCollector,
): void => {
  positiveInteger(
    set.count,
    `${path}.count`,
    "population slot count",
    collector,
  );
  finiteVector(set.anchor, `${path}.anchor`, "population anchor", collector);
  if (!Number.isFinite(set.facingDeg))
    collector.push(
      "range",
      `${path}.facingDeg`,
      `population heading must be finite, but was ${set.facingDeg}`,
      set.facingDeg,
    );
  positive(
    set.variation.scale.min,
    `${path}.variation.scale.min`,
    "population minimum scale",
    collector,
  );
  positive(
    set.variation.scale.max,
    `${path}.variation.scale.max`,
    "population maximum scale",
    collector,
  );
  if (
    Number.isFinite(set.variation.scale.min) &&
    Number.isFinite(set.variation.scale.max) &&
    set.variation.scale.min > set.variation.scale.max
  )
    collector.push(
      "range",
      `${path}.variation.scale`,
      `population scale range must be ordered, but ${set.variation.scale.min} is above ${set.variation.scale.max}`,
      set.variation.scale,
    );
  if (set.variation.scale3 !== undefined)
    for (const axis of ["x", "y", "z"] as const) {
      const range = {
        min: set.variation.scale3.min[axis],
        max: set.variation.scale3.max[axis],
      };
      positive(
        range.min,
        `${path}.variation.scale3.min.${axis}`,
        `population minimum ${axis} scale`,
        collector,
      );
      positive(
        range.max,
        `${path}.variation.scale3.max.${axis}`,
        `population maximum ${axis} scale`,
        collector,
      );
      if (
        Number.isFinite(range.min) &&
        Number.isFinite(range.max) &&
        range.min > range.max
      )
        collector.push(
          "range",
          `${path}.variation.scale3.${axis}`,
          `population ${axis} scale range must be ordered, but ${range.min} is above ${range.max}`,
          range,
        );
    }
  if (set.variation.rotationDeg !== undefined)
    for (const axis of ["x", "y", "z"] as const) {
      const range = set.variation.rotationDeg[axis];
      if (!Number.isFinite(range.min))
        collector.push(
          "range",
          `${path}.variation.rotationDeg.${axis}.min`,
          `population minimum ${axis} rotation must be finite, but was ${range.min}`,
          range.min,
        );
      if (!Number.isFinite(range.max))
        collector.push(
          "range",
          `${path}.variation.rotationDeg.${axis}.max`,
          `population maximum ${axis} rotation must be finite, but was ${range.max}`,
          range.max,
        );
      if (
        Number.isFinite(range.min) &&
        Number.isFinite(range.max) &&
        range.min > range.max
      )
        collector.push(
          "range",
          `${path}.variation.rotationDeg.${axis}`,
          `population ${axis} rotation range must be ordered, but ${range.min} is above ${range.max}`,
          range,
        );
    }
  const layout = set.layout;
  if (layout.kind === "along-route") {
    collector.push(
      "type",
      `${path}.layout.kind`,
      'a building population may not use the "along-route" layout: a route is a production-world fact this record carries no field for, so such a population belongs to the world rather than to a building space',
      layout.kind,
    );
    return;
  }
  if (layout.kind === "scatter") {
    positive(
      layout.radius,
      `${path}.layout.radius`,
      "population scatter radius",
      collector,
    );
    return;
  }
  if (layout.kind === "explicit") {
    if (layout.transforms.length < set.count)
      collector.push(
        "range",
        `${path}.layout.transforms`,
        `an explicit population needs one transform per slot, but ${layout.transforms.length} were stated for ${set.count} slots`,
        layout.transforms.length,
      );
    layout.transforms.forEach((transform, index) => {
      finiteVector(
        transform.translation,
        `${path}.layout.transforms[${index}].translation`,
        "population slot translation",
        collector,
      );
      unitQuaternion(
        transform.rotation,
        `${path}.layout.transforms[${index}].rotation`,
        "population slot rotation",
        collector,
      );
      for (const axis of ["x", "y", "z"] as const)
        positive(
          transform.scale[axis],
          `${path}.layout.transforms[${index}].scale.${axis}`,
          `population slot ${axis} scale`,
          collector,
        );
    });
    return;
  }
  positiveInteger(
    layout.rows,
    `${path}.layout.rows`,
    "population layout rows",
    collector,
  );
  positiveInteger(
    layout.columns,
    `${path}.layout.columns`,
    "population layout columns",
    collector,
  );
  positive(
    layout.spacing.x,
    `${path}.layout.spacing.x`,
    "population layout x spacing",
    collector,
  );
  positive(
    layout.spacing.z,
    `${path}.layout.spacing.z`,
    "population layout z spacing",
    collector,
  );
  if (layout.kind === "lattice") {
    positiveInteger(
      layout.layers,
      `${path}.layout.layers`,
      "population layout layers",
      collector,
    );
    positive(
      layout.spacing.y,
      `${path}.layout.spacing.y`,
      "population layout y spacing",
      collector,
    );
  }
  const capacity =
    layout.kind === "lattice"
      ? layout.rows * layout.columns * layout.layers
      : layout.rows * layout.columns;
  if (Number.isSafeInteger(capacity) && capacity < set.count)
    collector.push(
      "range",
      `${path}.layout`,
      `a ${layout.kind} population's own lattice holds ${capacity} slots, which cannot carry its ${set.count}`,
      capacity,
    );
};

const positiveInteger = (
  value: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (!Number.isSafeInteger(value) || value <= 0)
    collector.push(
      "range",
      path,
      `${label} must be an integer > 0, but was ${value}`,
      value,
    );
};

const nonEmpty = (
  value: string,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value.trim().length === 0)
    collector.push("type", path, `${label} must be non-empty`, value);
};

const finiteVector = (
  value: IAutoMovieVector3,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  for (const axis of ["x", "y", "z"] as const)
    if (!Number.isFinite(value[axis]))
      collector.push(
        "range",
        `${path}.${axis}`,
        `${label} ${axis} must be finite, but was ${value[axis]}`,
        value[axis],
      );
};

const positive = (
  value: number | undefined,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (value === undefined || !Number.isFinite(value) || value <= 0)
    collector.push(
      "range",
      path,
      `${label} must be a finite number > 0, but was ${value}`,
      value ?? null,
    );
};

const unitQuaternion = (
  value: IAutoMovieQuaternion,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  const norm = Math.hypot(value.x, value.y, value.z, value.w);
  if (!Number.isFinite(norm) || Math.abs(norm - 1) > UNIT_QUATERNION_EPSILON)
    collector.push(
      "range",
      path,
      `${label} must be a unit quaternion, but its norm was ${norm}`,
      value,
    );
};

/**
 * Whether a closed planar outline names distinct, finite corners.
 *
 * The minimum corner count differs by what the outline may carry: a straight
 * face needs three, while an outline whose edges may bulge needs only two,
 * because a full circle is two half-turn arcs and demanding a third corner
 * would outlaw a round oculus for no geometric reason.
 */
const closedOutline = (
  outline: readonly IAutoMoviePlanarPoint[],
  least: number,
  path: string,
  label: string,
  collector: ViolationCollector,
): boolean => {
  if (outline.length < least) {
    collector.push(
      "range",
      path,
      `${label} needs at least ${least} points, but had ${outline.length}`,
      outline.length,
    );
    return false;
  }
  let finite = true;
  outline.forEach((point, index) => {
    for (const axis of ["x", "y"] as const)
      if (!Number.isFinite(point[axis])) {
        finite = false;
        collector.push(
          "range",
          `${path}[${index}].${axis}`,
          `${label} ${axis} must be finite, but was ${point[axis]}`,
          point[axis],
        );
      }
  });
  if (!finite) return false;
  if (polygonShortestEdge(outline) <= PLANAR_EPSILON) {
    collector.push(
      "range",
      path,
      `${label} must not repeat a point at consecutive corners`,
      outline,
    );
    return false;
  }
  return true;
};

/**
 * Whether a closed region is one an inside test can be run against.
 *
 * Real area and no self-crossing are not stylistic demands: without them
 * "inside this region" has no answer, and every later containment or separation
 * result would be arbitrary rather than merely wrong.
 */
const closedRegion = (
  region: readonly IAutoMoviePlanarPoint[],
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  if (Math.abs(polygonDoubleArea(region)) <= PLANAR_EPSILON)
    collector.push("range", path, `${label} encloses no area`, region);
  else if (polygonIsSimple(region) === false)
    collector.push("type", path, `${label} must not cross itself`, region);
};

/** Whether a boundary's face is complete enough to place an opening on. */
const faceIsUsable = (
  face: IAutoMovieBoundaryFace,
  path: string,
  collector: ViolationCollector,
): boolean => {
  const before = collector.items.length;
  finiteVector(
    face.origin,
    `${path}.face.origin`,
    "boundary face origin",
    collector,
  );
  unitQuaternion(
    face.rotation,
    `${path}.face.rotation`,
    "boundary face rotation",
    collector,
  );
  positive(
    face.thickness,
    `${path}.face.thickness`,
    "boundary thickness",
    collector,
  );
  if (
    closedOutline(
      face.outline,
      3,
      `${path}.face.outline`,
      "boundary face outline",
      collector,
    )
  )
    closedRegion(
      face.outline,
      `${path}.face.outline`,
      "boundary face outline",
      collector,
    );
  return collector.items.length === before;
};

/** Whether an opening's void is complete enough to be located and bounded. */
const profileIsUsable = (
  profile: IAutoMovieOpeningProfile,
  path: string,
  collector: ViolationCollector,
): boolean => {
  const before = collector.items.length;
  closedOutline(
    profile.outline,
    2,
    `${path}.outline`,
    "opening outline",
    collector,
  );
  if (profile.bulges !== undefined) {
    if (profile.bulges.length !== profile.outline.length)
      collector.push(
        "type",
        `${path}.bulges`,
        `an opening states ${profile.bulges.length} bulges for ${profile.outline.length} edges`,
        profile.bulges.length,
      );
    profile.bulges.forEach((bulge, index) => {
      if (!Number.isFinite(bulge) || Math.abs(bulge) > 1)
        collector.push(
          "range",
          `${path}.bulges[${index}]`,
          `an edge bulge must be a finite number within [-1, 1], because an arc longer than a half turn is authored as two edges, but was ${bulge}`,
          bulge,
        );
    });
  }
  // The region an arc encloses is the hull's, not the corner polygon's: two
  // corners and two half turns are a circle, which the corners alone call flat.
  if (collector.items.length === before)
    closedRegion(
      outlineHull(profile),
      `${path}.outline`,
      "opening outline",
      collector,
    );
  return collector.items.length === before;
};

/** Validate the movable panels, named states, and hardware of one opening. */
const validateOpeningOperation = (props: {
  opening: IAutoMovieBuiltOpening;
  path: string;
  elements: ReadonlySet<string>;
  environment: IAutoMovieBuiltEnvironment;
  /** Which panel already drives an element, across the whole work. */
  driven: Map<string, string>;
  collector: ViolationCollector;
}): void => {
  const { opening, path, collector } = props;
  const operation = opening.operation;
  if (operation === undefined) return;
  const base = `${path}.operation`;
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
  const panelIds = collectIds(
    operation.panels,
    `${base}.panels`,
    "panel",
    collector,
  );
  const owned = descendantElements(
    props.environment,
    opening.fill === null ? [] : [opening.fill],
  );
  operation.panels.forEach((panel, index) => {
    const panelPath = `${base}.panels[${index}]`;
    if (!props.elements.has(panel.element))
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
    // travel was written first, and the record would say a thing the render
    // never does.
    const already = props.driven.get(panel.element);
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
    positive(panel.width, `${panelPath}.width`, "panel width", collector);
    positive(panel.height, `${panelPath}.height`, "panel height", collector);
    validateTravelMotion(
      panel.motion,
      `${panelPath}.motion`,
      "panel",
      collector,
    );
  });
  if (operation.states.length === 0)
    collector.push(
      "range",
      `${base}.states`,
      `opening "${opening.id}" declares an operation with no named state`,
      operation.states.length,
    );
  collectIds(operation.states, `${base}.states`, "operating state", collector);
  operation.states.forEach((state, index) => {
    const statePath = `${base}.states[${index}]`;
    const seen = new Set<string>();
    state.panels.forEach((entry, valueIndex) => {
      const valuePath = `${statePath}.panels[${valueIndex}]`;
      if (!panelIds.has(entry.panel))
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
      const panel = operation.panels.find(
        (candidate) => candidate.id === entry.panel,
      );
      if (panel === undefined) return;
      if (
        !Number.isFinite(entry.value) ||
        entry.value < panel.motion.min ||
        entry.value > panel.motion.max
      )
        collector.push(
          "range",
          `${valuePath}.value`,
          `operating state "${state.id}" drives panel "${panel.id}" to ${entry.value}, outside its travel [${panel.motion.min}, ${panel.motion.max}]`,
          entry.value,
        );
    });
    for (const panel of operation.panels)
      if (!seen.has(panel.id))
        collector.push(
          "type",
          `${statePath}.panels`,
          `operating state "${state.id}" gives panel "${panel.id}" no value`,
          panel.id,
        );
  });
  if (!operation.states.some((state) => state.id === operation.state))
    collector.push(
      "type",
      `${base}.state`,
      `current operating state "${operation.state}" does not resolve`,
      operation.state,
    );
  collectIds(operation.hardware, `${base}.hardware`, "hardware", collector);
  operation.hardware.forEach((piece, index) => {
    const piecePath = `${base}.hardware[${index}]`;
    nonEmpty(piece.kind, `${piecePath}.kind`, "hardware kind", collector);
    if (piece.element !== null && !props.elements.has(piece.element))
      collector.push(
        "type",
        `${piecePath}.element`,
        `hardware element "${piece.element}" does not resolve`,
        piece.element,
      );
  });
};

/**
 * Validate the one degree of freedom a moving member travels on.
 *
 * The label names what is moving so the refusal reads as the author wrote it: a
 * door leaf and a lift car share this arithmetic, and a message that called a
 * car a panel would send its author looking through the openings for it.
 */
const validateTravelMotion = (
  motion: IAutoMovieTravelMotion,
  path: string,
  label: string,
  collector: ViolationCollector,
): void => {
  finiteVector(motion.axis, `${path}.axis`, `${label} travel axis`, collector);
  if (Vector3.length(motion.axis) <= PLANE_NORMAL_EPSILON)
    collector.push(
      "range",
      `${path}.axis`,
      `${label} travel axis must be non-zero`,
      motion.axis,
    );
  if (motion.kind === "revolute")
    finiteVector(motion.pivot, `${path}.pivot`, `${label} pivot`, collector);
  if (!Number.isFinite(motion.min) || motion.min > 0)
    collector.push(
      "range",
      `${path}.min`,
      `${label} travel is measured from its rest pose, so the lowest value must be a finite number <= 0, but was ${motion.min}`,
      motion.min,
    );
  if (!Number.isFinite(motion.max) || motion.max < 0)
    collector.push(
      "range",
      `${path}.max`,
      `${label} travel is measured from its rest pose, so the highest value must be a finite number >= 0, but was ${motion.max}`,
      motion.max,
    );
  else if (motion.max <= motion.min)
    collector.push(
      "range",
      `${path}.max`,
      `a movable ${label} needs travel, but its range was [${motion.min}, ${motion.max}]`,
      motion.max,
    );
  else if (
    motion.kind === "revolute" &&
    motion.max - motion.min > 2 * Math.PI + FULL_TURN_EPSILON
  )
    collector.push(
      "range",
      `${path}.max`,
      `a turning ${label} may travel at most a full turn, but its range spanned ${motion.max - motion.min} radians`,
      motion.max,
    );
};

/**
 * Validate the further spaces a run serves along its own route.
 *
 * A landing is a stop, and a stop stated twice, stated at an end the run
 * already names, or stated out of order is a stop later work cannot place. The
 * fraction is strictly inside `(0, 1)` because both ends are already served by
 * the run's own `from` and `to`.
 */
const validateConnectorLandings = (
  connector: IAutoMovieBuiltConnector,
  path: string,
  spaces: ReadonlySet<string>,
  collector: ViolationCollector,
): void => {
  const landings = connector.landings;
  if (landings === undefined) return;
  const seen = new Set<string>();
  landings.forEach((landing, index) => {
    const landingPath = `${path}.landings[${index}]`;
    if (!spaces.has(landing.space))
      collector.push(
        "type",
        `${landingPath}.space`,
        `connector landing space "${landing.space}" does not resolve`,
        landing.space,
      );
    if (landing.space === connector.from || landing.space === connector.to)
      collector.push(
        "type",
        `${landingPath}.space`,
        `connector landing "${landing.space}" restates an endpoint of connector "${connector.id}"`,
        landing.space,
      );
    if (seen.has(landing.space))
      collector.push(
        "type",
        `${landingPath}.space`,
        `connector landing "${landing.space}" is stated twice`,
        landing.space,
      );
    seen.add(landing.space);
    if (!Number.isFinite(landing.at) || landing.at <= 0 || landing.at >= 1)
      collector.push(
        "range",
        `${landingPath}.at`,
        `a connector landing stops between the run's own ends, so its arc-length fraction must be within (0, 1), but was ${landing.at}`,
        landing.at,
      );
    else if (index > 0 && !(landing.at > landings[index - 1]!.at))
      collector.push(
        "range",
        `${landingPath}.at`,
        `connector landings must strictly increase along the route, but ${landing.at} followed ${landings[index - 1]!.at}`,
        landing.at,
      );
  });
};

/** Validate the travelling carriages, named states, and stops of one run. */
const validateConnectorOperation = (props: {
  connector: IAutoMovieBuiltConnector;
  path: string;
  elements: ReadonlySet<string>;
  environment: IAutoMovieBuiltEnvironment;
  /** Which member already drives an element, across the whole work. */
  driven: Map<string, string>;
  collector: ViolationCollector;
}): void => {
  const { connector, path, collector } = props;
  const operation = connector.operation;
  if (operation === undefined) return;
  const base = `${path}.operation`;
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
  const carriageIds = collectIds(
    operation.carriages,
    `${base}.carriages`,
    "carriage",
    collector,
  );
  const owned = descendantElements(props.environment, connector.elements);
  operation.carriages.forEach((carriage, index) => {
    const carriagePath = `${base}.carriages[${index}]`;
    if (!props.elements.has(carriage.element))
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
    // One element carries one displacement, and doors and runs draw from the
    // same table, so a leaf that is also a lift car would lose whichever travel
    // was written first rather than gaining a second degree of freedom.
    const already = props.driven.get(carriage.element);
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
    validateTravelMotion(
      carriage.motion,
      `${carriagePath}.motion`,
      "carriage",
      collector,
    );
  });
  const stops = new Set(connectorStops(connector));
  if (operation.states.length === 0)
    collector.push(
      "range",
      `${base}.states`,
      `connector "${connector.id}" declares an operation with no named state`,
      operation.states.length,
    );
  collectIds(operation.states, `${base}.states`, "operating state", collector);
  operation.states.forEach((state, index) => {
    const statePath = `${base}.states[${index}]`;
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
    const seen = new Set<string>();
    state.carriages.forEach((entry, valueIndex) => {
      const valuePath = `${statePath}.carriages[${valueIndex}]`;
      if (!carriageIds.has(entry.carriage))
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
      const carriage = operation.carriages.find(
        (candidate) => candidate.id === entry.carriage,
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
    });
    for (const carriage of operation.carriages)
      if (!seen.has(carriage.id))
        collector.push(
          "type",
          `${statePath}.carriages`,
          `operating state "${state.id}" gives carriage "${carriage.id}" no value`,
          carriage.id,
        );
  });
  if (!operation.states.some((state) => state.id === operation.state))
    collector.push(
      "type",
      `${base}.state`,
      `current operating state "${operation.state}" does not resolve`,
      operation.state,
    );
};

/**
 * Refuse a carriage that does not stand in the space its state says it serves.
 *
 * A named stop is a claim about geometry, so it is settled against geometry:
 * the state is applied, the element the carriage drives is placed, and its own
 * origin has to land inside the space. A space that bounds nothing is skipped
 * rather than failed, because a purely semantic container has no inside for the
 * car to be in and refusing it would outlaw a run through an unbounded region.
 *
 * Every other member stands where the environment's current state puts it, the
 * same rule the swept envelope follows, so a state is measured as the one
 * change it makes rather than against a configuration nothing declared.
 */
const validateCarriageService = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: ViolationCollector,
): void => {
  const staged = operationDeltas(environment);
  environment.connectors.forEach((connector, index) => {
    const operation = connector.operation;
    if (operation === undefined) return;
    operation.states.forEach((state, stateIndex) => {
      const claims: Array<{ space: string; carriage: string; at: number }> = [];
      state.carriages.forEach((entry, valueIndex) => {
        if (
          entry.serves === null ||
          !spaceSubtreeIsBounded(environment, entry.serves)
        )
          return;
        claims.push({
          space: entry.serves,
          carriage: entry.carriage,
          at: valueIndex,
        });
      });
      // Placing every element of the work is the expensive half, so a state
      // that claims no bounded space never pays for it.
      if (claims.length === 0) return;
      const deltas = new Map(staged);
      applyCarriageState(operation.carriages, state, deltas);
      const matrices = worldMatricesOf(environment, deltas);
      for (const claim of claims) {
        const carriage = operation.carriages.find(
          (candidate) => candidate.id === claim.carriage,
        )!;
        const world = matrices.get(carriage.element)!;
        const point: IAutoMovieVector3 = {
          x: world[12]!,
          y: world[13]!,
          z: world[14]!,
        };
        if (
          builtEnvironmentContainsPoint(environment, claim.space, point) ===
          false
        )
          collector.push(
            "range",
            `${root}.connectors[${index}].operation.states[${stateIndex}].carriages[${claim.at}].serves`,
            `operating state "${state.id}" stands carriage "${carriage.id}" at (${point.x}, ${point.y}, ${point.z}), which is outside the space "${claim.space}" it serves`,
            claim.space,
          );
      }
    });
  });
};

/**
 * Refuse a configuration the scene could not stage, in any state the record
 * names.
 *
 * A staged node is world TRS, so a composed hierarchy carrying shear cannot be
 * lowered without silently dropping it. Checking only the state the record
 * currently stands in would let a door pass shut and lie open: the same
 * revolute leaf below a non-uniformly scaled ancestor is a clean rigid frame at
 * rest and a sheared one a quarter turn later, and both the staged set and the
 * placement queries would answer with a decomposition that never existed.
 *
 * Only the subtree a state actually moves is re-checked. A delta rides down
 * from the element it drives, so nothing above or beside it can change, and
 * measuring the untouched remainder once per state would be the same answer
 * paid for again.
 */
const validateStagedConfigurations = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: ViolationCollector,
): void => {
  const staged = operationDeltas(environment);
  const base = worldMatricesOf(environment, staged);
  environment.elements.forEach((element, index) => {
    if (isSheared(base.get(element.id)!))
      collector.push(
        "type",
        `${root}.elements[${index}].transform`,
        "the composed hierarchy contains shear, which cannot be lowered to the scene's world TRS; keep rotated descendants below uniformly scaled ancestors",
        element.transform,
      );
  });

  /** Report the elements one alternative configuration would shear. */
  const alternative = (props: {
    path: string;
    state: string;
    moved: readonly string[];
    deltas: Map<string, number[]>;
  }): void => {
    const touched = descendantElements(environment, props.moved);
    const matrices = worldMatricesOf(environment, props.deltas);
    for (const id of touched)
      if (isSheared(matrices.get(id)!)) {
        collector.push(
          "type",
          props.path,
          `operating state "${props.state}" composes shear into element "${id}", which cannot be lowered to the scene's world TRS; keep rotated descendants below uniformly scaled ancestors`,
          props.state,
        );
        return;
      }
  };
  environment.openings.forEach((opening, index) => {
    const operation = opening.operation;
    if (operation === undefined) return;
    operation.states.forEach((state, stateIndex) => {
      if (state.id === operation.state) return;
      const deltas = new Map(staged);
      applyPanelState(operation.panels, state, deltas);
      alternative({
        path: `${root}.openings[${index}].operation.states[${stateIndex}]`,
        state: state.id,
        moved: operation.panels.map((panel) => panel.element),
        deltas,
      });
    });
  });
  environment.connectors.forEach((connector, index) => {
    const operation = connector.operation;
    if (operation === undefined) return;
    operation.states.forEach((state, stateIndex) => {
      if (state.id === operation.state) return;
      const deltas = new Map(staged);
      applyCarriageState(operation.carriages, state, deltas);
      alternative({
        path: `${root}.connectors[${index}].operation.states[${stateIndex}]`,
        state: state.id,
        moved: operation.carriages.map((carriage) => carriage.element),
        deltas,
      });
    });
  });
};

/** Whether a world matrix carries more than a position, rotation, and scale. */
const isSheared = (world: number[]): boolean => {
  const decomposed = Matrix4.decompose(world);
  const recomposed = Matrix4.compose(
    decomposed.position,
    Quaternion.normalize(decomposed.rotation),
    decomposed.scale,
  );
  const magnitude = Math.max(1, ...world.map((value) => Math.abs(value)));
  const difference = Math.max(
    ...world.map((value, index) => Math.abs(value - recomposed[index]!)),
  );
  return difference > magnitude * MATRIX_ROUND_TRIP_EPSILON;
};

/** Whether a logical space or any space under it bounds a volume at all. */
const spaceSubtreeIsBounded = (
  environment: IAutoMovieBuiltEnvironment,
  spaceId: string,
): boolean => {
  const included = descendantSpaces(environment.spaces, spaceId);
  return environment.spaces.some(
    (space) => included.has(space.id) && builtSpaceStatesVolume(space),
  );
};

/**
 * A closed boundary, held to exactly what makes its inside a fact.
 *
 * Three things are checked and nothing is repaired. Every index must name a
 * vertex the shell carries, and every face must have area, because a face
 * nobody can look up or that is a line contributes a solid angle of nothing to
 * a query that would then answer confidently. The surface must be **closed**:
 * each directed edge appears exactly once and its own reverse exactly once, so
 * a missing facet is a hole through which inside leaks into outside, and a
 * duplicated one is a facet counted twice. And the enclosed volume must be
 * positive, which is how "wound counter-clockwise seen from outside" is
 * actually checked: a shell turned inside out passes every local test and
 * answers the exact opposite of the truth for every point in the building.
 */
const validateSpaceShell = (
  shell: IAutoMovieSpaceShell,
  path: string,
  collector: ViolationCollector,
): void => {
  shell.vertices.forEach((vertex, index) => {
    finiteVector(
      vertex,
      `${path}.vertices[${index}]`,
      "shell vertex",
      collector,
    );
  });
  if (shell.vertices.length < 4)
    collector.push(
      "range",
      `${path}.vertices`,
      `a closed shell needs at least 4 vertices, but had ${shell.vertices.length}`,
      shell.vertices.length,
    );
  if (shell.triangles.length < 12 || shell.triangles.length % 3 !== 0) {
    collector.push(
      "range",
      `${path}.triangles`,
      `a closed shell needs at least 4 triangles as whole index triples, but had ${shell.triangles.length} indices`,
      shell.triangles.length,
    );
    return;
  }
  const bad = shell.triangles.findIndex(
    (index) =>
      Number.isSafeInteger(index) === false ||
      index < 0 ||
      index >= shell.vertices.length,
  );
  if (bad !== -1) {
    collector.push(
      "range",
      `${path}.triangles[${bad}]`,
      `shell triangle index must name one of the ${shell.vertices.length} vertices, but was ${shell.triangles[bad]}`,
      shell.triangles[bad],
    );
    return;
  }
  const edges = new Map<string, number>();
  for (let face = 0; face < shell.triangles.length; face += 3) {
    const corners = [
      shell.triangles[face]!,
      shell.triangles[face + 1]!,
      shell.triangles[face + 2]!,
    ];
    const a = shell.vertices[corners[0]!]!;
    const b = shell.vertices[corners[1]!]!;
    const c = shell.vertices[corners[2]!]!;
    if (
      Vector3.length(
        Vector3.cross(Vector3.subtract(b, a), Vector3.subtract(c, a)),
      ) <= PLANE_NORMAL_EPSILON
    ) {
      collector.push(
        "range",
        `${path}.triangles[${face}]`,
        `shell triangle ${face / 3} encloses no area, so it bounds nothing`,
        corners,
      );
      return;
    }
    for (let corner = 0; corner < 3; ++corner) {
      const key = `${corners[corner]}>${corners[(corner + 1) % 3]}`;
      edges.set(key, (edges.get(key) ?? 0) + 1);
    }
  }
  const open = [...edges.entries()].find(
    ([key, count]) =>
      count !== 1 || edges.get(key.split(">").reverse().join(">")) !== 1,
  );
  if (open !== undefined) {
    collector.push(
      "type",
      `${path}.triangles`,
      `shell is not closed: directed edge ${open[0]} is not matched by exactly one facet and one opposite facet`,
      open[0],
    );
    return;
  }
  const volume = builtSpaceShellVolume(shell);
  if (volume <= 0)
    collector.push(
      "range",
      `${path}.triangles`,
      "shell encloses no positive volume: wind its facets counter-clockwise seen from outside the solid",
      volume,
    );
};

/** The spaces one run serves, in the order its own route reaches them. */
const connectorStops = (connector: IAutoMovieBuiltConnector): string[] => [
  connector.from,
  ...(connector.landings ?? []).map((landing) => landing.space),
  connector.to,
];

/** The named elements and every element below them. */
const descendantElements = (
  environment: IAutoMovieBuiltEnvironment,
  roots: readonly string[],
): Set<string> => {
  const owned = new Set<string>(roots);
  if (owned.size === 0) return owned;
  let changed = true;
  while (changed) {
    changed = false;
    for (const element of environment.elements)
      if (
        element.parent !== null &&
        owned.has(element.parent) &&
        !owned.has(element.id)
      ) {
        owned.add(element.id);
        changed = true;
      }
  }
  return owned;
};

/** Validate a connector's stations, section spelling, slope, and steps. */
const validateConnectorShape = (
  connector: IAutoMovieBuiltConnector,
  path: string,
  collector: ViolationCollector,
): void => {
  const measurable =
    connector.route.length >= 2 &&
    connector.route.every((point) =>
      [point.x, point.y, point.z].every(Number.isFinite),
    );
  if (measurable)
    for (let index = 0; index + 1 < connector.route.length; ++index)
      if (
        Vector3.length(
          Vector3.subtract(
            connector.route[index + 1]!,
            connector.route[index]!,
          ),
        ) <= ROUTE_EPSILON
      )
        collector.push(
          "range",
          `${path}.route[${index + 1}]`,
          "consecutive connector route stations must be distinct",
          connector.route[index + 1],
        );
  if (connector.orientations !== undefined) {
    if (connector.orientations.length !== connector.route.length)
      collector.push(
        "type",
        `${path}.orientations`,
        `a connector states ${connector.orientations.length} station facings for ${connector.route.length} route points`,
        connector.orientations.length,
      );
    connector.orientations.forEach((rotation, index) =>
      unitQuaternion(
        rotation,
        `${path}.orientations[${index}]`,
        "connector station facing",
        collector,
      ),
    );
  }

  const scalar =
    connector.width !== undefined || connector.clearHeight !== undefined;
  if (connector.sections !== undefined && scalar)
    collector.push(
      "type",
      `${path}.sections`,
      "a connector states a constant width and clear height or a varying section, never both",
      connector.sections.length,
    );
  else if (connector.sections === undefined && !scalar)
    collector.push(
      "range",
      `${path}.width`,
      "a connector must state a constant width and clear height, or a varying section",
      null,
    );
  else if (scalar) {
    positive(connector.width, `${path}.width`, "connector width", collector);
    positive(
      connector.clearHeight,
      `${path}.clearHeight`,
      "connector clear height",
      collector,
    );
  } else
    validateConnectorSections(
      connector.sections!,
      `${path}.sections`,
      collector,
    );

  const metrics = measurable ? routeMetrics(connector.route) : null;
  if (connector.slope !== undefined) {
    if (
      !Number.isFinite(connector.slope) ||
      connector.slope < 0 ||
      connector.slope > Math.PI / 2
    )
      collector.push(
        "range",
        `${path}.slope`,
        `connector slope must be a finite number within [0, PI / 2], but was ${connector.slope}`,
        connector.slope,
      );
    else if (
      metrics !== null &&
      Math.abs(connector.slope - metrics.slope) > SLOPE_TOLERANCE
    )
      collector.push(
        "range",
        `${path}.slope`,
        `connector states a slope of ${connector.slope} radians, but its own route rises at ${metrics.slope}`,
        connector.slope,
      );
  }
  if (connector.steps !== undefined) {
    const steps = connector.steps;
    const before = collector.items.length;
    if (!Number.isSafeInteger(steps.count) || steps.count < 1)
      collector.push(
        "range",
        `${path}.steps.count`,
        `a stepped connector needs a safe integer step count >= 1, but had ${steps.count}`,
        steps.count,
      );
    positive(steps.rise, `${path}.steps.rise`, "step rise", collector);
    positive(steps.run, `${path}.steps.run`, "step run", collector);
    if (collector.items.length === before && metrics !== null) {
      if (
        Math.abs(steps.count * steps.rise - Math.abs(metrics.rise)) >
        STEP_TOLERANCE
      )
        collector.push(
          "range",
          `${path}.steps.rise`,
          `${steps.count} steps of ${steps.rise} m climb ${steps.count * steps.rise} m, but the route climbs ${Math.abs(metrics.rise)} m`,
          steps.rise,
        );
      if (Math.abs(steps.count * steps.run - metrics.run) > STEP_TOLERANCE)
        collector.push(
          "range",
          `${path}.steps.run`,
          `${steps.count} steps of ${steps.run} m run ${steps.count * steps.run} m, but the route runs ${metrics.run} m`,
          steps.run,
        );
    }
  }
};

/** Validate a connector's varying section stations. */
const validateConnectorSections = (
  sections: readonly IAutoMovieConnectorSection[],
  path: string,
  collector: ViolationCollector,
): void => {
  if (sections.length < 2) {
    collector.push(
      "range",
      path,
      `a varying connector section needs at least 2 stations, but had ${sections.length}`,
      sections.length,
    );
    return;
  }
  if (sections[0]!.at !== 0)
    collector.push(
      "range",
      `${path}[0].at`,
      `a varying connector section must begin at 0, but began at ${sections[0]!.at}`,
      sections[0]!.at,
    );
  const last = sections.length - 1;
  if (sections[last]!.at !== 1)
    collector.push(
      "range",
      `${path}[${last}].at`,
      `a varying connector section must end at 1, but ended at ${sections[last]!.at}`,
      sections[last]!.at,
    );
  sections.forEach((section, index) => {
    if (index > 0 && !(section.at > sections[index - 1]!.at))
      collector.push(
        "range",
        `${path}[${index}].at`,
        `connector section stations must strictly increase, but ${section.at} followed ${sections[index - 1]!.at}`,
        section.at,
      );
    positive(
      section.width,
      `${path}[${index}].width`,
      "section width",
      collector,
    );
    positive(
      section.clearHeight,
      `${path}[${index}].clearHeight`,
      "section clear height",
      collector,
    );
  });
};

/** Climb, horizontal run, 3D length, and slope of one route polyline. */
const routeMetrics = (
  route: readonly IAutoMovieVector3[],
): { rise: number; run: number; length: number; slope: number } => {
  let run = 0;
  let length = 0;
  for (let index = 0; index + 1 < route.length; ++index) {
    const delta = Vector3.subtract(route[index + 1]!, route[index]!);
    run += Math.hypot(delta.x, delta.z);
    length += Vector3.length(delta);
  }
  const rise = route[route.length - 1]!.y - route[0]!.y;
  return { rise, run, length, slope: Math.atan2(Math.abs(rise), run) };
};

/**
 * Refuse a closed leaf that does not fit the void it fills.
 *
 * The leaf is measured where it actually rests, projected into the host
 * boundary's own frame, so a leaf and a void authored in unrelated coordinates
 * disagree here instead of at render time. Nothing is said about a leaf smaller
 * than its void: two leaves sharing one opening, or a sash inside a frame, are
 * ordinary designs, while a leaf larger than its own hole is not a design at
 * all.
 *
 * Only the two in-plane coordinates are compared. How far the leaf sits in
 * front of or behind the face is a design freedom, not an error: a leaf in a
 * rebate, a storm sash outside the frame, and a surface-mounted sliding leaf
 * all rest off the face's own plane on purpose.
 *
 * Containment is the same test a void gets against its face, so a leaf that
 * spans the notch of a concave void is refused even though each of its corners
 * is inside.
 */
const validatePanelFit = (
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  faces: ReadonlyMap<string, IAutoMovieBoundaryFace>,
  hulls: ReadonlyMap<number, IAutoMoviePlanarPoint[]>,
  collector: ViolationCollector,
): void => {
  const matrices = worldMatricesOf(environment);
  environment.openings.forEach((opening, index) => {
    const operation = opening.operation;
    const hull = hulls.get(index);
    const face = faces.get(opening.boundary);
    if (operation === undefined || hull === undefined || face === undefined)
      return;
    const inverse = Quaternion.inverse(face.rotation);
    operation.panels.forEach((panel, panelIndex) => {
      const world = matrices.get(panel.element)!;
      const corners: IAutoMovieVector3[] = [
        { x: 0, y: 0, z: 0 },
        { x: panel.width, y: 0, z: 0 },
        { x: panel.width, y: panel.height, z: 0 },
        { x: 0, y: panel.height, z: 0 },
      ];
      const planar = corners.map((corner) => {
        const local = Quaternion.rotateVector(
          inverse,
          Vector3.subtract(applyMatrix(world, corner), face.origin),
        );
        return { x: local.x, y: local.y };
      });
      if (polygonInside(planar, hull) === false)
        collector.push(
          "range",
          `${root}.openings[${index}].operation.panels[${panelIndex}]`,
          `panel "${panel.id}" does not fit inside the void of opening "${opening.id}" when it rests closed`,
          { width: panel.width, height: panel.height },
        );
    });
  });
};

/** Apply a column-major matrix to a point. */
const applyMatrix = (
  matrix: readonly number[],
  point: IAutoMovieVector3,
): IAutoMovieVector3 => ({
  x:
    matrix[0]! * point.x +
    matrix[4]! * point.y +
    matrix[8]! * point.z +
    matrix[12]!,
  y:
    matrix[1]! * point.x +
    matrix[5]! * point.y +
    matrix[9]! * point.z +
    matrix[13]!,
  z:
    matrix[2]! * point.x +
    matrix[6]! * point.y +
    matrix[10]! * point.z +
    matrix[14]!,
});
