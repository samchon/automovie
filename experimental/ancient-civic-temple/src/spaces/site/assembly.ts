/**
 * docs/spaces/site.md#site-extent의 대지 소유 단위 `temple-site`를 조립한다.
 * 뿌리 공간·뿌리 element·네 볼록 cell, 지면·경계석·먼 배경 model, 보행
 * support를 한 입력에서 낸다. 건물 공간·층 아래에 넣지 않으며 건물과의
 * 연결은 circulation의 두 connector만 맡는다. 이웃·나무 개체는 만들지 않는다.
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

export const templeSiteIds = { unit: "temple-site", space: "temple-site", root: "site.root" } as const;

export interface TempleSite {
  unit: IAutoMovieBuildingUnit;
  space: IAutoMovieBuiltSpace;
  models: IAutoMovieModel[];
  elements: IAutoMovieBuiltElement[];
  supports: IAutoMovieBuiltSurface[];
  walkable: string[];
}

/** 건물 외곽을 뺀 범위의 남·북·서·동 네 cell. */
const siteCells = () => [
  levelCell("temple-site.south", { west: e.west, east: e.east, north: p.southOuter, south: e.south }, v.floor, v.ceiling),
  levelCell("temple-site.north", { west: e.west, east: e.east, north: e.north, south: p.northOuter }, v.floor, v.ceiling),
  levelCell("temple-site.west", { west: e.west, east: p.westOuter, north: p.northOuter, south: p.southOuter }, v.floor, v.ceiling),
  levelCell("temple-site.east", { west: p.eastOuter, east: e.east, north: p.northOuter, south: p.southOuter }, v.floor, v.ceiling),
];

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
