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

/**
 * @evidence spaces/site.md 대지 unit·공간·뿌리 element의 안정 ID(temple-site, site.root)를 둔다.
 * @evidence spaces/site.md#site-extent 대지를 건물과 다른 소유 단위 temple-site로 주소화한다.
 * @evidence principles/core/source-units.md#source-scope-preservation ID 세 개만 가진다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 대지 조립·connector·관찰이 같은 ID를 쓴다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-extent의 대지 단위 이름을 그대로 쓴다.
 */
export const templeSiteIds = { unit: "temple-site", space: "temple-site", root: "site.root" } as const;

/**
 * @evidence spaces/site.md 대지 조립 결과(unit·공간·model·element·support·보행 목록)의 타입이다.
 * @evidence principles/core/source-units.md#source-scope-preservation 대지 단위가 내는 항목만 담는다.
 * @evidence principles/core/source-units.md#source-substantive-completion environment가 대지를 건물 옆 단위로 합칠 때 필요한 여섯 필드를 정한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md의 대지 산출 항목을 그대로 담는다.
 */
export interface TempleSite {
  /**
   * @evidence spaces/site.md TempleSite.unit는 대지 building unit(temple-site, 뿌리 element, 공간)이다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSite.unit는 대지 building unit 하나만 담고 건물 unit에 섞지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSite.unit는 IAutoMovieBuildingUnit으로 environment.buildings에 temple-site가 건물과 나란히 들어간다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSite.unit는 site.md#site-extent의 별도 대지 소유 단위를 그대로 담는다.
   */
  unit: IAutoMovieBuildingUnit;
  /**
   * @evidence spaces/site.md TempleSite.space는 네 볼록 cell을 가진 대지 공간이다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSite.space는 대지 공간 하나만 담고 건물 공간·층 아래에 넣지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSite.space는 IAutoMovieBuiltSpace로 건물 외곽을 뺀 네 cell이 environment.spaces에 들어간다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSite.space는 site.md#site-extent의 네 볼록 cell 분할을 그대로 담는다.
   */
  space: IAutoMovieBuiltSpace;
  /**
   * @evidence spaces/site.md TempleSite.models는 지면·경계석·먼 배경 세 model이다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSite.models는 지면·경계석·먼 배경 세 model만 담고 이웃·나무 model을 담지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSite.models는 IAutoMovieModel[]로 세 표면 owner가 environment.models에 들어간다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSite.models는 site.md#site-paving과 #distant-ridge의 표면 owner 셋을 그대로 담는다.
   */
  models: IAutoMovieModel[];
  /**
   * @evidence spaces/site.md TempleSite.elements는 뿌리와 세 model element다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSite.elements는 뿌리와 세 model element만 담는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSite.elements는 IAutoMovieBuiltElement[]로 model마다 element가 대지 뿌리 아래 놓인다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSite.elements는 site.md#site-extent의 대지 뿌리 element 규칙을 그대로 담는다.
   */
  elements: IAutoMovieBuiltElement[];
  /**
   * @evidence spaces/site.md TempleSite.supports는 흙띠·포장·이웃 바닥의 보행 support다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSite.supports는 흙띠·포장·이웃 바닥 support만 담고 경계석 윗면은 담지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSite.supports는 IAutoMovieBuiltSurface[]로 대지 관찰 눈높이와 connector 끝점이 지면 평면 높이를 읽는다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSite.supports는 site.md#site-grade의 plane 높이 support 규칙을 그대로 담는다.
   */
  supports: IAutoMovieBuiltSurface[];
  /**
   * @evidence spaces/site.md TempleSite.walkable는 이웃 바닥을 뺀 보행 가능 support ID 목록이다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSite.walkable는 보행 가능한 support ID만 담고 이웃 바닥을 뺀다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSite.walkable는 string[]로 environment.walkable이 흙띠·포장만 보행 범위로 받는다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSite.walkable는 site.md#site-paving의 보행 범위를 그대로 담는다.
   */
  walkable: string[];
}

/** 건물 외곽을 뺀 범위의 남·북·서·동 네 cell. */
const siteCells = () => [
  levelCell("temple-site.south", { west: e.west, east: e.east, north: p.southOuter, south: e.south }, v.floor, v.ceiling),
  levelCell("temple-site.north", { west: e.west, east: e.east, north: e.north, south: p.northOuter }, v.floor, v.ceiling),
  levelCell("temple-site.west", { west: e.west, east: p.westOuter, north: p.northOuter, south: p.southOuter }, v.floor, v.ceiling),
  levelCell("temple-site.east", { west: p.eastOuter, east: e.east, north: p.northOuter, south: p.southOuter }, v.floor, v.ceiling),
];

/**
 * @evidence spaces/site.md 대지 단위의 공간(건물 외곽을 뺀 네 cell)·model 셋·element·support·보행 목록을 조립한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 건물 공간·층 아래에 넣지 않고 이웃·나무 개체는 만들지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion TempleSite 하나를 돌려주며 지면·경계석·먼 배경 model은 surfaceModel로 결속한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-extent의 대지 단위·네 cell·세 표면 owner를 그대로 구현했다.
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
