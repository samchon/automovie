import { IAutoMovieBoundaryFace, IAutoMovieBuiltEnvironment, IAutoMoviePlanarPoint, IAutoMovieValidation } from "@automovie/interface";
import { validateModel } from "../validation/validateModel";
import { validateSpace } from "../validation/validateSpace";
import { validateTransformScalars } from "../validation/validateTransformScalars";
import { ViolationCollector } from "../validation/ViolationCollector";
import { outlineHull } from "./outlineHull";
import { polygonInside } from "./polygonInside";
import { polygonsOverlap } from "./polygonsOverlap";
import { finiteVector } from "../geometry/finiteVector";
import { appendValidation } from "../validation/appendValidation";

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

const CONNECTOR_KINDS = [
