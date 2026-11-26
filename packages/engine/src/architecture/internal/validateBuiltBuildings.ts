import {
  IAutoMovieBuildingUnit,
  IAutoMovieBuiltEnvironment,
  type IAutoMovieViolationCollector,
} from "@automovie/interface";

import { collectDeclaredIds } from "../../validation/collectDeclaredIds";

/**
 * Validate a work's building units and that they own every element and space
 * exactly once.
 *
 * A work needs at least one unit, each with a unique id. A unit's root element
 * and root space must resolve and have no parent, and no two units may share a
 * root. Then every element and every space must reach, through its parents, a
 * topmost record that is some unit's root; one that does not is reported on its
 * own `parent` path, naming its topmost record. A walk that hits a dangling or
 * cyclic parent stops silently, because that defect is reported on its own
 * path. Findings are pushed under `<root>.buildings`, `<root>.elements` and
 * `<root>.spaces`.
 *
 * @param environment Building record whose units are checked.
 * @param root Violation path of the building record, `$input`.
 * @param collector Sink that receives the violations.
 */
export function validateBuiltBuildings(
  environment: IAutoMovieBuiltEnvironment,
  root: string,
  collector: IAutoMovieViolationCollector,
): void {
  const buildingIds: Set<string> = collectDeclaredIds(
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
  const elementParents: Map<string, string | null> = parentsOf(
    environment.elements,
  );
  const spaceParents: Map<string, string | null> = parentsOf(
    environment.spaces,
  );
  const elementRoots: Set<string> = new Set();
  const spaceRoots: Set<string> = new Set();
  environment.buildings.forEach(
    (building: IAutoMovieBuildingUnit, index: number): void => {
      const path: string = `${root}.buildings[${index}]`;
      if (buildingIds.has(building.id)) {
        checkRoot(
          elementParents,
          building.element,
          `${path}.element`,
          "building root element",
          collector,
        );
        checkRoot(
          spaceParents,
          building.space,
          `${path}.space`,
          "building root space",
          collector,
        );
      }
      if (elementRoots.has(building.element))
        collector.push(
          "type",
          `${path}.element`,
          `building root element "${building.element}" is already owned by another building unit`,
          building.element,
        );
      if (spaceRoots.has(building.space))
        collector.push(
          "type",
          `${path}.space`,
          `building root space "${building.space}" is already owned by another building unit`,
          building.space,
        );
      elementRoots.add(building.element);
      spaceRoots.add(building.space);
    },
  );
  appendOwnership(
    environment.elements,
    elementParents,
    elementRoots,
    `${root}.elements`,
    "building element",
    "root element",
    collector,
  );
  appendOwnership(
    environment.spaces,
    spaceParents,
    spaceRoots,
    `${root}.spaces`,
    "logical space",
    "root space",
    collector,
  );
}

/** Each record's parent by id; a repeated id keeps its first record. */
const parentsOf: (
  records: readonly { id: string; parent: string | null }[],
) => Map<string, string | null> = (
  records: readonly { id: string; parent: string | null }[],
): Map<string, string | null> => {
  const parents: Map<string, string | null> = new Map();
  for (const record of records)
    if (!parents.has(record.id)) parents.set(record.id, record.parent);
  return parents;
};

/** A unit root must be declared and must have no parent. */
const checkRoot: (
  parents: ReadonlyMap<string, string | null>,
  id: string,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  parents: ReadonlyMap<string, string | null>,
  id: string,
  path: string,
  label: string,
  collector: IAutoMovieViolationCollector,
): void => {
  if (!parents.has(id))
    collector.push("type", path, `${label} "${id}" does not resolve`, id);
  else if (parents.get(id) !== null)
    collector.push("type", path, `${label} "${id}" must have no parent`, id);
};

/** Report every record whose topmost ancestor is no unit's root. */
const appendOwnership: (
  records: readonly { id: string; parent: string | null }[],
  parents: ReadonlyMap<string, string | null>,
  roots: ReadonlySet<string>,
  path: string,
  label: string,
  rootLabel: string,
  collector: IAutoMovieViolationCollector,
) => void = (
  records: readonly { id: string; parent: string | null }[],
  parents: ReadonlyMap<string, string | null>,
  roots: ReadonlySet<string>,
  path: string,
  label: string,
  rootLabel: string,
  collector: IAutoMovieViolationCollector,
): void => {
  records.forEach(
    (record: { id: string; parent: string | null }, index: number): void => {
      const seen: Set<string> = new Set([record.id]);
      let current: string = record.id;
      let parent: string | null = record.parent;
      while (parent !== null) {
        // A dangling or cyclic parent is already reported on its own path, and
        // walking it further would only repeat that one defect as an ownership
        // gap the author cannot act on.
        if (!parents.has(parent) || seen.has(parent)) return;
        seen.add(parent);
        current = parent;
        parent = parents.get(parent)!;
      }
      if (!roots.has(current))
        collector.push(
          "type",
          `${path}[${index}].parent`,
          `${label} "${record.id}" belongs to no building unit; its topmost ${label} "${current}" must be declared as some building unit's ${rootLabel}`,
          record.parent,
        );
    },
  );
};
