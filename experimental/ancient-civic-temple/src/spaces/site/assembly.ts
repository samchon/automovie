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
 * @evidenceReview spaces/site.md #cf4222b # SiteIds는 unit과 space를 temple-site로, 단독 뿌리 element를 site.root로 지정한다.
 * @evidence spaces/site.md#site-extent 대지를 건물과 다른 소유 단위 temple-site로 주소화한다.
 * @evidenceReview spaces/site.md#site-extent #3dbc90a # building unit과 space ID가 temple-site라 건물 temple의 자식 방으로 대지를 넣지 않는다.
 * @evidence principles/core/source-units.md#source-scope-preservation ID 세 개만 가진다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 상수의 키가 unit·space·root 셋뿐이라 새 대지 구조체나 다른 층 ID를 포함하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion as const 값으로 대지 조립·connector·관찰이 같은 ID를 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # templeSiteIds의 unit·space·root를 조립 함수가 읽고 observations.ts와 circulation.ts가 같은 exported 값을 import한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-extent의 대지 단위 이름을 그대로 쓴다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 부모의 temple-site 별도 unit 이름을 유지하고 대지를 temple-ground 아래로 옮기지 않았다.
 */
export const templeSiteIds = { unit: "temple-site", space: "temple-site", root: "site.root" } as const;

/**
 * @evidence spaces/site.md 대지 조립 결과(unit·공간·model·element·support·보행 목록)의 타입이다.
 * @evidenceReview spaces/site.md #cf4222b # TempleSite에는 별도 unit·space, 세 model·element와 보행 support·walkable 목록의 여섯 필드가 있다.
 * @evidence principles/core/source-units.md#source-scope-preservation 대지 단위가 내는 항목만 담는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 타입은 대지 조립 산출만 담고 건물 방이나 후속 이웃 집 instance를 속성으로 소유하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion environment가 대지를 건물 옆 단위로 합칠 때 필요한 여섯 필드를 정한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # createTempleSite의 반환을 여섯 필드로 제한해 environment가 대지 단위와 표면·보행 입력을 빠짐없이 합칠 수 있다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md의 대지 산출 항목을 그대로 담는다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 별도 site unit의 기존 조립 항목만 타입화하며 대지를 건물 안 공간으로 바꾸지 않았다.
 */
export interface TempleSite {
  /**
   * @evidence spaces/site.md TempleSite.unit는 대지 building unit(temple-site, 뿌리 element, 공간)이다.
   * @evidenceReview spaces/site.md #cf4222b # unit 필드가 temple-site id·site.root element·temple-site space를 결합한 IAutoMovieBuildingUnit을 받는다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSite.unit는 대지 building unit 하나만 담고 건물 unit에 섞지 않는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 이 속성은 site unit 하나의 타입이며 본 건물 temple unit을 여기에 재등록하지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSite.unit는 IAutoMovieBuildingUnit으로 environment.buildings에 temple-site가 건물과 나란히 들어간다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # unit 값에 별도 ID와 root·space가 있어 environment.buildings에 본 건물과 나란히 넣을 수 있다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSite.unit는 site.md#site-extent의 별도 대지 소유 단위를 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 대지 unit ID가 부모의 temple-site 그대로라 새 소유 계층은 필요하지 않았다.
   */
  unit: IAutoMovieBuildingUnit;
  /**
   * @evidence spaces/site.md TempleSite.space는 네 볼록 cell을 가진 대지 공간이다.
   * @evidenceReview spaces/site.md #cf4222b # space 필드에 건물 직사각형 바깥 네 방향 levelCell을 가진 exact site 공간이 들어간다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSite.space는 대지 공간 하나만 담고 건물 공간·층 아래에 넣지 않는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # site 공간의 parent는 null이고 id는 temple-site라 지상층 room tree의 자식이 아니다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSite.space는 IAutoMovieBuiltSpace로 건물 외곽을 뺀 네 cell이 environment.spaces에 들어간다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # siteCells 남·북·서·동 네 구획이 공간 필드에 묶여 건물 외곽 안쪽을 대지 cell로 채우지 않는다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSite.space는 site.md#site-extent의 네 볼록 cell 분할을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # site extent에서 건물 footprint를 뺀 네 방향 cell만 받아 부모 대지 분해를 유지한다.
   */
  space: IAutoMovieBuiltSpace;
  /**
   * @evidence spaces/site.md TempleSite.models는 지면·경계석·먼 배경 세 model이다.
   * @evidenceReview spaces/site.md #cf4222b # models 배열은 site-ground·site-curbs·site-distant 세 surfaceModel의 결과다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSite.models는 지면·경계석·먼 배경 세 model만 담고 이웃·나무 model을 담지 않는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # site model 셋을 명시해 이웃 주택 원형이나 나무 수관을 대지 소스가 만들지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSite.models는 IAutoMovieModel[]로 세 표면 owner가 environment.models에 들어간다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 세 model의 독립 ID가 대지 지면·닫힌 경계석·열린 먼 배경 표면을 각각 environment에 제공한다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSite.models는 site.md#site-paving과 #distant-ridge의 표면 owner 셋을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # site-paving 두 owner와 distant-ridge 한 owner만 받았고 후속 배치용 이웃 model은 앞당기지 않았다.
   */
  models: IAutoMovieModel[];
  /**
   * @evidence spaces/site.md TempleSite.elements는 뿌리와 세 model element다.
   * @evidenceReview spaces/site.md #cf4222b # elements 배열에는 site.root 하나와 세 site model 각각을 가리키는 element가 있다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSite.elements는 뿌리와 세 model element만 담는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 한 root와 models.map 셋뿐이라 이웃 집이나 나무 instance element가 추가되지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSite.elements는 IAutoMovieBuiltElement[]로 model마다 element가 대지 뿌리 아래 놓인다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 세 model element의 parent가 ids.root이고 model 값이 각 m.id라 대지 표면이 한 root에서 보인다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSite.elements는 site.md#site-extent의 대지 뿌리 element 규칙을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # site.root 아래 표면 셋만 부모-자식으로 놓아 건물 element 트리를 건드리지 않았다.
   */
  elements: IAutoMovieBuiltElement[];
  /**
   * @evidence spaces/site.md TempleSite.supports는 흙띠·포장·이웃 바닥의 보행 support다.
   * @evidenceReview spaces/site.md #cf4222b # supports 필드는 SitePieces의 지면 구획에서 생긴 floor support 배열을 받으며 경계석 prism의 top은 별도다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSite.supports는 흙띠·포장·이웃 바닥 support만 담고 경계석 윗면은 담지 않는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # templeSiteSupports만 반환 필드로 쓰고 curb faces에서 support를 만들지 않아 경계석 위를 보행 면으로 세지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSite.supports는 IAutoMovieBuiltSurface[]로 대지 관찰 눈높이와 walkable 선택에 지면 평면 높이를 제공한다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # plane 높이의 built surface 목록이 site 관찰의 supportHeight 입력이 되고 walkable은 같은 목록의 흙·포장 ID를 고른다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSite.supports는 site.md#site-grade의 plane 높이 support 규칙을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 지면 경사에서 유도된 support만 사용해 부모의 세 구간 grade를 새로 선택하지 않았다.
   */
  supports: IAutoMovieBuiltSurface[];
  /**
   * @evidence spaces/site.md TempleSite.walkable는 이웃 바닥을 뺀 보행 가능 support ID 목록이다.
   * @evidenceReview spaces/site.md #cf4222b # walkable 필드는 templeSiteWalkable이 support에서 earth·paving ID만 뽑은 결과다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleSite.walkable는 보행 가능한 support ID만 담고 이웃 바닥을 뺀다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 이웃 ground.* support는 남아 있어도 walkable 목록에서는 제외돼 방문자가 이웃 필지로 걷지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleSite.walkable는 string[]로 environment.walkable이 흙띠·포장만 보행 범위로 받는다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # support ID 문자열 목록이 environment.walkable으로 합쳐져 대지 접근의 허용 바닥을 특정한다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleSite.walkable는 site.md#site-paving의 보행 범위를 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # earth와 paving만 보행 목록으로 고르고 neighbor ground를 빼 부모 대지 경계 밖 이동을 허용하지 않았다.
   */
  walkable: string[];
}

/** 건물 외곽을 뺀 범위의 남·북·서·동 네 cell. */
const siteCells = () => [
  levelCell(`${templeSiteIds.space}.south`, { west: e.west, east: e.east, north: p.southOuter, south: e.south }, v.floor, v.ceiling),
  levelCell(`${templeSiteIds.space}.north`, { west: e.west, east: e.east, north: e.north, south: p.northOuter }, v.floor, v.ceiling),
  levelCell(`${templeSiteIds.space}.west`, { west: e.west, east: p.westOuter, north: p.northOuter, south: p.southOuter }, v.floor, v.ceiling),
  levelCell(`${templeSiteIds.space}.east`, { west: p.eastOuter, east: e.east, north: p.northOuter, south: p.southOuter }, v.floor, v.ceiling),
];

/**
 * @evidence spaces/site.md 대지 단위의 공간(건물 외곽을 뺀 네 cell)·model 셋·element·support·보행 목록을 조립한다.
 * @evidenceReview spaces/site.md #cf4222b # createTempleSite가 별도 unit·네 cell space·세 surfaceModel·네 element·support 및 walkable ID를 한 결과에 조립한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 건물 공간·층 아래에 넣지 않고 이웃·나무 개체는 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # unit의 id와 space parent=null이 본 건물과 분리되고 models 배열도 지면·경계석·먼 배경으로 한정된다.
 * @evidence principles/core/source-units.md#source-substantive-completion TempleSite 하나를 돌려주며 지면·경계석·먼 배경 model은 surfaceModel로 결속한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # surfaceModel 셋, siteCells, siteSupports 및 해당 elements가 TempleSite 구조로 반환되어 environment 소비자가 추가 조립 결정을 하지 않는다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work site.md#site-extent의 대지 단위·네 cell·세 표면 owner를 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # temple-site 별도 unit과 네 방향 cell·세 owner를 판정된 site 설계대로 결합했으며 이웃 배치를 앞당기지 않았다.
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
