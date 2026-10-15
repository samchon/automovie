import type {
  IAutoMovieBuildingUnit, IAutoMovieBuiltElement, IAutoMovieBuiltSpace, IAutoMovieBuiltSurface, IAutoMovieModel,
} from "@automovie/interface";
import { surfaceModel } from "../../geometry/surfaceModel";
import { identityTransform } from "../../geometry/identityTransform";
import { levelCell } from "../../geometry/levelCell";
import { templePlan as p } from "../templePlan";
import { templeSiteExtent as e } from "./templeSiteExtent";
import { templeSiteVolume as v } from "./templeSiteVolume";
import { templeSiteGroundFaces } from "./templeSiteGroundFaces";
import { templeSiteWalkable } from "./templeSiteWalkable";
import { templeSiteSupports } from "./templeSiteSupports";
import { templeSiteCurbFaces } from "./templeSiteCurbFaces";
import { templeRidgeFaces } from "./templeRidgeFaces";
import { templeFootholdFaces } from "./templeFootholdFaces";
import { templeSiteIds } from "./templeSiteIds";
interface TempleSite {
  unit: IAutoMovieBuildingUnit;
  space: IAutoMovieBuiltSpace;
  models: IAutoMovieModel[];
  elements: IAutoMovieBuiltElement[];
  supports: IAutoMovieBuiltSurface[];
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
 * Assemble the `temple-site` ownership unit
 * One input produces its root space and element, four convex cells, ground,
 * curb and distant-background models, and walking supports. It is independent
 * of building spaces and storeys; two circulation connectors link it to the
 * building. Neighboring buildings and tree instances are authored elsewhere.
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
