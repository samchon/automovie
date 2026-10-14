/**
 * Assemble the `temple-site` ownership unit from docs/spaces/site.md#site-extent.
 * One input produces its root space and element, four convex cells, ground,
 * curb and distant-background models, and walking supports. It is independent
 * of building spaces and storeys; two circulation connectors link it to the
 * building. Neighboring buildings and tree instances are authored elsewhere.
 */
import type {
  IAutoMovieBuildingUnit, IAutoMovieBuiltElement, IAutoMovieBuiltSpace, IAutoMovieBuiltSurface, IAutoMovieModel,
} from "@automovie/interface";
import { identityTransform, surfaceModel } from "../../geometry/model-parts";
import { levelCell } from "../../geometry/spatial-cells";
import { templePlan as p } from "../building";
import { templeSiteExtent as e, templeSiteVolume as v } from "./extent";
import { templeSiteCurbFaces, templeSiteGroundFaces, templeSiteSupports, templeSiteWalkable } from "./ground";
import { templeFootholdFaces, templeRidgeFaces } from "./ridge";

/**
 * @evidence spaces/site.md Stable IDs identify the site unit, space and root element (temple-site, site.root).
 * @evidence spaces/site.md#site-extent Addresses the site as the separate temple-site ownership unit.
 * @evidence principles/core/source-units.md#source-scope-preservation Contains only three IDs.
 * @evidence principles/core/source-units.md#source-substantive-completion Constant values let assembly, connectors and observations share IDs.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Uses the unit name defined in site-extent.
 */
export const templeSiteIds = { unit: "temple-site", space: "temple-site", root: "site.root" } as const;

/**
 * @evidence spaces/site.md Types the assembled unit, space, models, elements, supports and walkable list.
 * @evidence principles/core/source-units.md#source-scope-preservation Contains only outputs owned by the site unit.
 * @evidence principles/core/source-units.md#source-substantive-completion Six fields let the environment compose the site alongside the building.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the site outputs defined in site.md.
 */
export interface TempleSite {
  /**
   * @evidence spaces/site.md Site building unit includes temple-site, its root element and space.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains one site unit independent of the building unit.
   * @evidence principles/core/source-units.md#source-substantive-completion IAutoMovieBuildingUnit places temple-site beside the building in environment.buildings.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the separate site-extent ownership unit.
   */
  unit: IAutoMovieBuildingUnit;
  /**
   * @evidence spaces/site.md Site space contains four convex cells.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains one site space outside the building space and storey hierarchy.
   * @evidence principles/core/source-units.md#source-substantive-completion IAutoMovieBuiltSpace adds four cells excluding the building footprint to environment.spaces.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the four-cell site-extent division.
   */
  space: IAutoMovieBuiltSpace;
  /**
   * @evidence spaces/site.md Contains three models: ground, curbs and distant background.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains only those three models, excluding neighbors and trees.
   * @evidence principles/core/source-units.md#source-substantive-completion IAutoMovieModel[] adds the three surface owners to environment.models.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the three owners in site-paving and distant-ridge.
   */
  models: IAutoMovieModel[];
  /**
   * @evidence spaces/site.md Contains the root and three model elements.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains only the root and those three model elements.
   * @evidence principles/core/source-units.md#source-substantive-completion IAutoMovieBuiltElement[] places one element per model below the site root.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the site-extent root element rule.
   */
  elements: IAutoMovieBuiltElement[];
  /**
   * @evidence spaces/site.md Supports cover soil strips, paving and neighboring ground.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains those supports without curb tops.
   * @evidence principles/core/source-units.md#source-substantive-completion IAutoMovieBuiltSurface[] provides ground plane heights for observation eyes and walkable selection.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the site-grade plane-height support rule.
   */
  supports: IAutoMovieBuiltSurface[];
  /**
   * @evidence spaces/site.md Lists walkable support IDs excluding neighboring ground.
   * @evidence principles/core/source-units.md#source-scope-preservation Contains only walkable IDs, omitting neighboring ground.
   * @evidence principles/core/source-units.md#source-substantive-completion The string array gives environment.walkable only soil strips and paving.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly represents the site-paving walking extent.
   */
  walkable: string[];
}

/** South, north, west and east cells excluding the building footprint. */
const siteCells = () => [
  levelCell(`${templeSiteIds.space}.south`, { west: e.west, east: e.east, north: p.southOuter, south: e.south }, v.floor, v.ceiling),
  levelCell(`${templeSiteIds.space}.north`, { west: e.west, east: e.east, north: e.north, south: p.northOuter }, v.floor, v.ceiling),
  levelCell(`${templeSiteIds.space}.west`, { west: e.west, east: p.westOuter, north: p.northOuter, south: p.southOuter }, v.floor, v.ceiling),
  levelCell(`${templeSiteIds.space}.east`, { west: p.eastOuter, east: e.east, north: p.northOuter, south: p.southOuter }, v.floor, v.ceiling),
];

/**
 * @evidence spaces/site.md Assembles four cells outside the building footprint, three models, elements, supports and walkable IDs.
 * @evidence principles/core/source-units.md#source-scope-preservation Remains outside building/storey hierarchies and creates no neighbor or tree instances.
 * @evidence principles/core/source-units.md#source-substantive-completion Returns TempleSite, binding ground, curb and distant models with surfaceModel.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work Directly implements the site unit, four cells and three surface owners in site-extent.
 */
export const createTempleSite = (): TempleSite => {
  const ids = templeSiteIds;
  const models = [
    surfaceModel("model.site-ground", "site-ground", templeSiteGroundFaces()),
    surfaceModel("model.site-curbs", "site-curbs", templeSiteCurbFaces()),
    surfaceModel("model.site-distant", "site-distant", [...templeFootholdFaces(), ...templeRidgeFaces()]),
  ];
  const supports = templeSiteSupports(ids.space);
  return {
    unit: { id: ids.unit, element: ids.root, space: ids.space },
    space: { id: ids.space, kind: "site", parent: null, fidelity: "exact", cells: siteCells() },
    models,
    elements: [
      { id: ids.root, kind: "site", parent: null, transform: identityTransform(), model: null, space: ids.space },
      ...models.map((m) => ({
        id: m.id.replace(/^model\./, "element."), kind: m.name === "site-curbs" ? "curb" : "ground",
        parent: ids.root, transform: identityTransform(), model: m.id, space: ids.space,
      })),
    ],
    supports,
    walkable: templeSiteWalkable(supports),
  };
};
