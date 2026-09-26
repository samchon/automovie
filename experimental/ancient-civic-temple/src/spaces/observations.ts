/**
 * docs/spaces/observations.md#geometry-observations의 관찰 분모를 현재
 * built environment에서 유도한다. 공간마다 engine station(중심 네 방위,
 * 네 안쪽 모서리, 개구부 threshold)을 받고 눈높이를 실제 support 위 1.6m로
 * 다시 세운다. 주랑은 여섯 평면 영역 각각의 중심 네 방위를 더한다. 외부는
 * setting, census의 노출 입면·모서리, 네 방향 지붕, 처마 하부, 외부 개구부이고
 * 대지는 조감·두 접근·골목 경사·먼 능선 시점을 더한다. 주랑의 중정 쪽 안쪽 모서리와
 * 현관 몸체 모서리, 지붕 골·떠 있는 처마·파라펫 만남·외곽 모서리 석재 띠의 접합
 * 관찰, 뷰어의 정확한 연직 단면으로 보는 단면 질문, 다섯 reference 비교 질문을 더한다.
 * X/Z 평면으로 자를 수 없는 대각 골 단면만 pose 없는 unverified 항목으로 남긴다.
 * 반환 불가/충돌 station과 이전 결속의 무효 창 threshold는 지우지 않고 pose=null과 이유로 남긴다.
 * 이 목록은 관찰 위치이며 시각 판정 결과가 아니다.
 */
import { builtSpaceObservationStations } from "@automovie/engine";
import type { IAutoMovieBuiltEnvironment, IAutoMovieVector3 } from "@automovie/interface";
import { exteriorObservations, openingFacingObservations } from "./perimeter-observations";
import { roofStepClosures } from "../geometry/roof-solids";
import { templeExteriorSettingView, templeObservationEye as eye } from "../geometry/observation-datum";
import { templePlan as p } from "./building";
import { templeDoorPassages } from "./openings";
import { templeRoofEnvelope, templeRoofRules } from "./roofs/assembly";
import { templeColonnadeRegions } from "./rooms/colonnade";
import { templeSiteIds } from "./site/assembly";

/**
 * 관찰을 고를 때 뷰어가 함께 켜는 검사 보기. 연직 단면은 서버가 현재 source의
 * 실체를 그 평면으로 잘라 그린 정확한 조각을 정사영으로 보고, roof-off는
 * 지붕·천장을 숨긴 절개 조감이다.
 * @evidence spaces/observations.md 관찰을 고를 때 뷰어가 함께 켜는 검사 보기(roof-off 절개 조감, X/Z 연직 단면)의 타입이다.
 * @evidenceReview spaces/observations.md #909ee89 # TempleView는 지붕 숨김과 X/Z 절단을 section 값으로 나누고 나머지 네 값으로 절단 카메라를 재현할 수 있게 한다.
 * @evidence spaces/observations.md#viewer-path 뷰어가 관찰의 보기를 받아 검사 모드·단면 위치·정사영·반높이를 켜게 하는 전달 계약이다.
 * @evidenceReview spaces/observations.md#viewer-path #037f6c0 # section·offset·ortho·span·flip이 서버 절단축과 클라이언트 정사영 설정에 각각 전달되는 계약을 타입이 담는다.
 * @evidence principles/core/source-units.md#source-scope-preservation 보기 설정만 담고 건물 geometry를 새로 만들지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 인터페이스 필드는 보기의 좌표·투영 옵션뿐이고 지붕을 삭제한 별도 구조 형상을 소유하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion section·offset·ortho·span·flip 다섯 필드로 클라이언트가 추측 없이 보기를 재현한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 다섯 필드가 절단 종류·평면·투영·틀 크기·남길 방향을 각각 구분해 관찰 선택 시 보기를 완결한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work observations.md#viewer-path의 검사 모드·절개 규칙을 그대로 담는다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 부모가 정한 roof-off와 두 연직축만 section 합집합에 넣어 새로운 검사 모드의 설계 개정이 없다.
 */
export interface TempleView {
  /**
   * @evidence spaces/observations.md TempleView.section는 roof-off·cut-x·cut-z 중 하나로 절개 조감과 X/Z 연직 단면을 가른다.
   * @evidenceReview spaces/observations.md #909ee89 # section 합집합이 roof-off, cut-x, cut-z 세 검사 방식만 허용하는지 확인했다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleView.section는 절개 방식을 roof-off·cut-x·cut-z 세 값으로 닫아 대각 단면 같은 설계 밖 보기를 받지 않는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 대각 골의 임의 축 값은 이 합집합에 없으므로 X/Z 밖 절단을 암묵적으로 가능하다고 선언하지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleView.section는 문자열 합집합이라 뷰어가 모르는 모드를 받지 못하고 cut-x·cut-z가 서버 단면 축으로 그대로 간다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 서버에 전달되는 두 cut 축과 roof-off 토큰이 명시되어 viewer mode를 별도 문자열 추측으로 만들지 않는다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleView.section는 observations.md#viewer-path의 roof-off 절개와 X/Z 연직 단면 두 수단을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # viewer-path의 세 모드를 타입에서 그대로 제한하며 대각 골 단면을 추가하지 않아 부모 검사 수단을 수정하지 않았다.
   */
  section: "roof-off" | "cut-x" | "cut-z";
  /**
   * @evidence spaces/observations.md TempleView.offset는 연직 단면 평면의 world 좌표(m)다.
   * @evidenceReview spaces/observations.md #909ee89 # offset 숫자가 cut-x에는 세계 X, cut-z에는 세계 Z 절단 위치로 사용되는 단면 평면 좌표임을 확인했다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleView.offset는 단면 평면 위치 한 숫자만 담고 두께나 범위를 더하지 않는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # offset은 number 하나라 절단 slab 두께나 대각 축을 이 필드에 실어 보내지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleView.offset는 number 하나로 서버가 그 world 좌표 평면에서 현재 source 실체를 자른다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # section과 offset의 쌍이 현재 실체를 자를 정확한 연직 평면 하나를 지정한다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleView.offset는 observations.md#viewer-path의 정확한 평면 단면 규칙을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 숫자 위치만 받는 필드라 설계에 없는 두꺼운 절단 영역이나 새 단면 좌표계를 요구하지 않았다.
   */
  offset: number;
  /**
   * @evidence spaces/observations.md TempleView.ortho는 단면을 평면에 수직인 정사영으로 볼지 정한다.
   * @evidenceReview spaces/observations.md #909ee89 # ortho boolean이 단면 질문의 정사영 선택을 뷰어에 명시적으로 전달한다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleView.ortho는 원근과 정사영 중 하나를 고르는 값만 담는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 이 속성은 카메라 투영 여부만 표현하며 절단 평면 위치나 부재 geometry를 바꾸지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleView.ortho는 boolean으로 뷰어가 단면 평면에 수직인 정사영 카메라를 켤지 정한다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 단면 view의 true 값으로 orthographic 카메라를 선택하고 false는 reference 절개 조감의 원근을 허용한다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleView.ortho는 observations.md#viewer-path의 단면 정사영 판독 요구를 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # viewer-path가 요구하는 단면 정사영 선택만 실어 보내 상위 공간·지붕 치수를 수정하지 않았다.
   */
  ortho: boolean;
  /**
   * @evidence spaces/observations.md TempleView.span는 정사영 화면의 반높이(m)다.
   * @evidenceReview spaces/observations.md #909ee89 # span은 section cut 관찰에서 1.2~7m 등 m 단위 정사영 반높이로 지정된다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleView.span는 정사영 반높이만 담고 카메라 위치는 관찰 pose에서 받는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # span 자체는 number 한 값이고 camera position은 TempleObservation.position에 남아 역할이 뒤섞이지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleView.span는 number(m)로 정사영 틀 크기를 정해 같은 단면이 매번 같은 배율로 보인다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # sectionObservations가 각 cut에 span을 채워 클라이언트가 별도 자동 맞춤값 없이 동일한 틀 크기로 연다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleView.span는 observations.md#viewer-path의 단면 틀 규칙을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 단면 반높이의 전송 필드라 부모의 실제 건물 높이나 카메라 위치를 재설계하지 않았다.
   */
  span: number;
  /**
   * @evidence spaces/observations.md TempleView.flip는 단면 평면의 좌표가 큰 쪽과 작은 쪽 중 어느 쪽을 남길지 정한다.
   * @evidenceReview spaces/observations.md #909ee89 # flip은 cut 평면 어느 절반을 남길지 나타내는 값으로, 모든 section 질문에서 false가 명시된다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleView.flip는 남길 쪽을 고르는 값만 담는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # boolean 하나로 절단의 좌우만 고르고 새로운 mesh 복사나 두 번째 공간을 요구하지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleView.flip는 boolean으로 뷰어 절단 평면이 좌표가 큰 쪽과 작은 쪽 중 무엇을 남길지 정한다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # viewer의 cut-x/cut-z에 같은 flip 플래그를 줄 수 있어 어느 반공간을 제거할지 관찰 값에 결속된다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleView.flip는 observations.md#viewer-path의 단면 양쪽 판독 요구를 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 단면 양쪽 중 보존 쪽을 지정하는 설계 필드만 구현했고 새 건축 결정을 이 속성에 싣지 않았다.
   */
  flip: boolean;
}

/**
 * @evidence spaces/observations.md 관찰 하나(ID·묶음·공간·역할·라벨·pose·보기·note)의 타입이다.
 * @evidenceReview spaces/observations.md #909ee89 # TempleObservation은 id부터 view까지 관찰 운영에 필요한 값과 pose 불가 사유 note를 한 레코드로 선언한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 관찰 위치와 이유만 담고 시각 판정 결과를 담지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 인터페이스에는 합격·불합격이나 이미지 비교 결과 필드가 없고 위치·시선·검사 보기만 있다.
 * @evidence principles/core/source-units.md#source-substantive-completion pose가 없을 때 position·target이 null이고 note가 이유를 적는 규칙까지 타입이 정한다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # position과 target의 nullable 형식 및 note 필드가 관찰 실패를 목록에서 지우지 않고 표현할 자리를 마련한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work observations.md#geometry-observations의 관찰 항목 구성을 그대로 담는다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 부모의 관찰 항목 필드만 타입으로 옮기고 결과 판정 필드를 더하지 않아 관찰 설계의 범위를 바꾸지 않았다.
 */
export interface TempleObservation {
  /**
   * @evidence spaces/observations.md TempleObservation.id는 묶음과 공간·역할을 담은 안정 관찰 ID다.
   * @evidenceReview spaces/observations.md #909ee89 # 각 관찰 producer가 exterior.facade.<boundary> 또는 <space>.<station>처럼 group·소속·역할을 담은 id를 이 필드에 넣는다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleObservation.id는 관찰 ID 문자열만 담고 번호를 입력에서 복사하지 않는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # id의 형식은 string 한 개이고 하드코딩된 관찰 개수나 컴파일 순번을 이 속성에 담지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleObservation.id는 string으로 뷰어 목록 선택과 자가검사 보고가 같은 관찰을 가리킨다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 문자열 ID가 viewer 선택과 review 출력 양쪽에서 같은 질문을 식별할 수 있는 필수 필드다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleObservation.id는 observations.md#geometry-observations의 관찰 항목별 식별 요구를 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 개별 station을 구별할 식별자만 실어 관찰 분모나 공간 ID를 새로 정하지 않았다.
   */
  id: string;
  /**
   * @evidence spaces/observations.md TempleObservation.group는 space·exterior·site·junction·section·reference 여섯 묶음 중 하나다.
   * @evidenceReview spaces/observations.md #909ee89 # group 합집합 여섯 토큰을 세어 공간·외부·대지·접합·단면·레퍼런스 분류와 각각 대응한다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleObservation.group는 space·exterior·site·junction·section·reference 밖의 값을 받지 않는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 타입 밖의 일곱 번째 관찰 묶음은 허용하지 않아 질문 집합을 조용히 재분류할 수 없다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleObservation.group는 문자열 합집합으로 뷰어가 묶음별 목록을 나눈다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 각 observation의 group 필수값이 viewer의 목록 묶음을 안정적으로 지정한다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleObservation.group는 observations.md#geometry-observations의 여섯 관찰 묶음을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 여섯 그룹은 부모 관찰 설계의 분류를 그대로 타입화하므로 새 질문 계층을 만들지 않았다.
   */
  group: "exterior" | "space" | "site" | "junction" | "section" | "reference";
  /**
   * @evidence spaces/observations.md TempleObservation.space는 내부 관찰의 소속 공간 ID이고 외부·단면·reference는 null이다.
   * @evidenceReview spaces/observations.md #909ee89 # 내부 station에는 공간 ID가 들어가고 exterior·section·reference producer는 null을 써 질문 소속을 분리한다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleObservation.space는 내부 관찰에만 공간 ID를 두고 외부·단면 관찰에 공간을 지어내지 않는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # string|null 허용으로 외부 질문에 가짜 방 ID를 강제하지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleObservation.space는 string|null로 뷰어가 공간 선택 필터를 건다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # null과 실제 space ID를 구별해 viewer가 방 선택 시 외부 질문을 분리할 근거가 된다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleObservation.space는 observations.md#geometry-observations의 공간별 station 규칙을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 내부 관찰 소속을 전달할 뿐 새로운 방을 선언하지 않아 부모 공간 그래프가 유지된다.
   */
  space: string | null;
  /**
   * @evidence spaces/observations.md TempleObservation.role는 threshold·corner·center·facade 같은 관찰 역할이다.
   * @evidenceReview spaces/observations.md #909ee89 # role 필드가 engine station의 threshold·corner와 외부 census의 facade 등 각 producer 역할을 수용한다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleObservation.role는 역할 이름만 담고 판정 결과를 담지 않는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 이 string은 질문 종류이며 보임 비율이나 합격 상태를 싣는 필드가 아니다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleObservation.role는 string으로 engine station의 threshold·corner·center 역할과 census의 facade 역할을 그대로 옮긴다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # templeObservations와 exteriorObservations가 각 station 또는 census의 role을 넣어 필터 가능한 목록을 완성한다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleObservation.role는 observations.md#geometry-observations의 station 역할 구분을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 상위 station 역할 이름을 담기만 하고 새 관찰 형식의 검증 기준을 더하지 않았다.
   */
  role: string;
  /**
   * @evidence spaces/observations.md TempleObservation.label는 한국어 운영 라벨이다.
   * @evidenceReview spaces/observations.md #909ee89 # label에는 현관·제실 등 한국어 공간명과 입면·단면 질문의 한국어 설명이 결합된다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleObservation.label는 한국어 라벨만 담는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 이 필드는 UI용 이름표이며 관찰 결과를 라벨 문자열에 숨겨 넣지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleObservation.label는 string으로 뷰어 목록이 운영 언어로 관찰을 보인다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 필수 label 문자열이 viewer 목록에서 선택할 관찰을 운영 언어로 노출한다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleObservation.label는 observations.md#geometry-observations의 운영 언어 관찰 이름을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 라벨은 질문 표시용이어서 부모의 장소명이나 방 경계를 수정하지 않았다.
   */
  label: string;
  /**
   * @evidence spaces/observations.md TempleObservation.position는 카메라 위치이며 pose가 없으면 null이다.
   * @evidenceReview spaces/observations.md #909ee89 # position은 실제 관찰의 eye 좌표이고 불가능한 옛 창 threshold에는 null을 기록한다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleObservation.position는 카메라 위치만 담고 pose가 불가능하면 null로 비운다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # Vector3|null만 허용하고 카메라가 없는 항목에 임의 대체 점을 넣도록 강제하지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleObservation.position는 IAutoMovieVector3|null로 뷰어 카메라와 자가검사의 실체 안 pose 검사가 같은 점을 쓴다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # viewer 이동과 self-check의 내부 실체 탐침이 이 같은 좌표를 읽어 무효 station을 일관되게 구별한다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleObservation.position는 observations.md#geometry-observations의 바닥+1.6m 눈높이 재배치 규칙을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 유효 내부 pose는 supportHeight 뒤 floor+1.6m로 세우고 불가 시 null이어서 부모 눈높이 요구를 바꾸지 않았다.
   */
  position: IAutoMovieVector3 | null;
  /**
   * @evidence spaces/observations.md TempleObservation.target는 카메라가 보는 점이며 pose가 없으면 null이다.
   * @evidenceReview spaces/observations.md #909ee89 # target은 engine station이나 section cut의 실제 시선점이며 pose 없는 대각 골에는 null을 둔다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleObservation.target는 시선 점만 담고 pose가 불가능하면 null로 비운다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # Vector3|null 타입으로 카메라가 없는 검사를 가짜 target으로 메우지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleObservation.target는 IAutoMovieVector3|null로 뷰어 카메라 방향이 정해진다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # position과 별도 target이 있어 단면·입면 관찰의 카메라 시선 방향을 명시한다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleObservation.target는 observations.md#geometry-observations의 시선 방향 규칙을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 시선 좌표만 전달해 관찰 대상 건물 위치나 경계를 새로 결정하지 않았다.
   */
  target: IAutoMovieVector3 | null;
  /**
   * @evidence spaces/observations.md TempleObservation.note는 pose 없음·높이 이동·무효 같은 이유를 적는 문장이다.
   * @evidenceReview spaces/observations.md #909ee89 # note가 engine station 반환 불가, support 부재, 옛 창 threshold 무효의 이유를 실제 관찰 항목에 보존한다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleObservation.note는 이유 문장만 담고 시각 판정 결과를 적지 않는다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # note의 문자열은 pose 상태 설명이며 레퍼런스와 같은지에 대한 결과값을 미리 쓰지 않는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleObservation.note는 string|null로 pose 없음·높이 이동·무효 항목이 지워지지 않고 이유와 함께 남는다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # null 아닌 note와 null pose를 함께 허용해 측정 불가 질문이 전집합에서 빠지지 않는다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleObservation.note는 observations.md#geometry-observations의 반환 불가 항목 보존 규칙을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 옛 무효 질문도 note와 함께 남기는 상위 규칙을 구현하며 새 판정 사실을 추가하지 않았다.
   */
  note: string | null;
  /**
   * @evidence spaces/observations.md TempleObservation.view는 관찰이 함께 켤 검사 보기이며 없으면 생략한다.
   * @evidenceReview spaces/observations.md #909ee89 # view 선택 필드가 reference 02의 roof-off 및 각 section의 cut-x/cut-z 보기를 관찰 ID에 결속한다.
   * @evidence principles/core/source-units.md#source-scope-preservation TempleObservation.view는 관찰이 켤 보기만 담고 없으면 생략한다.
   * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 일반 공간 station에서는 view가 생략되어 기본 카메라를 쓰고 검사 보기만 별도 옵션을 받는다.
   * @evidence principles/core/source-units.md#source-substantive-completion TempleObservation.view는 선택 필드 TempleView로 뷰어가 관찰 선택과 함께 검사 보기를 켠다.
   * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 선택된 section 질문의 TempleView 다섯 값을 viewer에 함께 전달할 수 있는 타입 연결이 있다.
   * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work TempleObservation.view는 observations.md#viewer-path의 관찰별 검사 보기 전달을 그대로 담는다.
   * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # viewer-path의 검사 보기를 관찰별 옵션으로만 실어 상위 지붕이나 대지 모델을 변경하지 않았다.
   */
  view?: TempleView;
}

/**
 * 운영 언어(한국어) 공간명.
 * @evidence spaces/observations.md 관찰 라벨에 쓰는 아홉 공간과 대지의 한국어 이름표다.
 * @evidenceReview spaces/observations.md #909ee89 # templeSpaceNames의 현관부터 서비스 마당까지 아홉 방과 temple-site를 각각 한국어 이름에 매핑한다.
 * @evidence principles/core/source-units.md#source-scope-preservation 공간 ID에 이름만 붙이고 공간을 더하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 이 객체는 ID→라벨 값뿐이라 실제 environment.spaces에 새 방을 등록하지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion ID→이름 레코드로 관찰과 뷰어가 같은 이름을 쓴다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # station label 조립이 이 레코드에서 name을 읽고 viewer도 같은 관찰 label을 받아 운영명 불일치를 피한다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work observations.md의 한국어 관찰 UI 요구를 그대로 담는다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 한국어 표시명만 부여하고 공간 topology를 바꾸지 않으므로 부모 관찰 규칙 개정이 없다.
 */
export const templeSpaceNames: Record<string, string> = {
  entrance: "현관", courtyard: "중정", colonnade: "주랑", sanctuary: "제실",
  offering: "봉헌실", administration: "관리실", records: "기록실", storage: "보관실",
  "service-yard": "서비스 마당", [templeSiteIds.space]: "대지",
};

const directionNames: Record<string, string> = {
  "center-x-minus": "중심→서", "center-x-plus": "중심→동",
  "center-z-minus": "중심→북", "center-z-plus": "중심→남",
  "corner-x-minus-z-minus": "북서 모서리", "corner-x-minus-z-plus": "남서 모서리",
  "corner-x-plus-z-minus": "북동 모서리", "corner-x-plus-z-plus": "남동 모서리",
};

/**
 * @evidence spaces/observations.md 현재 built environment에서 공간·외부·대지·접합·단면·reference 관찰 전집합을 유도한다.
 * @evidenceReview spaces/observations.md #909ee89 # 함수는 현재 environment의 공간 station부터 외부 census·site 및 독립 접합·단면·다섯 reference를 한 result에 결합한다.
 * @evidence spaces/observations.md#geometry-observations 공간 station을 바닥+1.6m로 다시 세우고 주랑 여섯 영역·추가 모서리, census 입면·모서리·지붕·처마 하부·외부 개구부, 접합 pose, 연직 단면 질문, reference 다섯을 만들며 반환 불가·무효 항목은 이유와 함께 pose 없이 남긴다.
 * @evidenceReview spaces/observations.md#geometry-observations #4155dcf # builtSpaceObservationStations 전체 순회와 supportHeight 재배치 뒤 여섯 주랑 영역, 단면·접합·reference, perimeter·site 함수를 합치며 null station을 삭제하지 않는다.
 * @evidence principles/core/source-units.md#source-scope-preservation environment를 읽기만 하고 건물 geometry를 만들지 않으며 관찰 수를 입력에서 복사하지 않는다.
 * @evidenceReview principles/core/source-units.md#source-scope-preservation #e4bc845 # 이 함수는 environment를 조회하고 TempleObservation 배열만 만들며 입면·방 수를 매개변수 숫자로 받지 않는다.
 * @evidence principles/core/source-units.md#source-substantive-completion 관찰 목록을 돌려주며 자가검사가 이 목록의 pose가 실체 안에 묻혔는지 센다.
 * @evidenceReview principles/core/source-units.md#source-substantive-completion #e9c974f # 공간·외부·대지 등 모든 질문을 하나의 result로 돌려 self-check가 실제 pose와 null 사유를 함께 검사할 수 있다.
 * @evidenceExclude upstream/design/space-sources.md#design-revision-from-space-source-work observations.md#geometry-observations의 전집합 규칙과 묶음을 그대로 구현했다.
 * @evidenceExcludeReview upstream/design/space-sources.md#design-revision-from-space-source-work #d9ad066 # 기존 관찰 분모의 여섯 묶음을 합성하고 무효 창 threshold를 note로 보존하므로 질문 수를 임의로 축소하는 상위 변경이 없다.
 */
export const templeObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  const result: TempleObservation[] = [];
  for (const space of environment.spaces.filter((s) => s.cells.length > 0)) {
    const name = templeSpaceNames[space.id] ?? space.id;
    for (const station of builtSpaceObservationStations(environment, space.id)) {
      const label = station.role === "threshold"
        ? `${name} · threshold(${station.opening ?? "?"})`
        : `${name} · ${directionNames[station.id] ?? station.id}`;
      if (station.pose === null) {
        result.push({ id: `${space.id}.${station.id}`, group: "space", space: space.id, role: station.role,
          label, position: null, target: null, note: "engine station이 공간 안 pose를 반환하지 않음(unverified)" });
        continue;
      }
      const floor = supportHeight(environment, space.id, station.pose.position);
      const raised = floor === null ? station.pose.position : { ...station.pose.position, y: floor + eye };
      const lift = raised.y - station.pose.position.y;
      result.push({
        id: `${space.id}.${station.id}`, group: "space", space: space.id, role: station.role, label,
        position: raised,
        target: { ...station.pose.target, y: station.role === "corner" ? station.pose.target.y + lift : raised.y },
        note: station.role === "threshold" && station.opening?.startsWith("window-")
          ? "엔진 threshold는 실내 도착 방향을 향해 창 판독에 쓰지 않음; 같은 ID의 opening-facing 관찰을 사용"
          : floor === null ? "support 없음: engine 높이 유지(눈높이 unverified)"
          : Math.abs(lift) > 1e-6 ? `engine y=${station.pose.position.y.toFixed(3)} → 바닥+1.6m` : null,
      });
    }
  }
  // 창을 봉헌실/제실, 제실/주랑 경계에 두었던 이전 결속이 봉헌실·주랑 안에 만든 창 threshold.
  // 그 위치는 창을 보여 주지 않아 무효였고 창은 외부 향 위쪽 경계로 옮겼다. 질문은
  // 지우지 않고 pose=null로 남기며 창 판독은 exterior.opening과 section.clerestory가 맡는다.
  for (const [space, window] of [
    ["offering", "window-sanctuary-west-north"], ["offering", "window-sanctuary-west-south"],
    ["colonnade", "window-sanctuary-south-west"], ["colonnade", "window-sanctuary-south-east"],
  ] as const) {
    result.push({
      id: `${space}.threshold-${window}`, group: "space", space, role: "threshold",
      label: `${templeSpaceNames[space]} · threshold(${window}) 무효`, position: null, target: null,
      note: "무효 threshold: 창이 이 방의 지붕 위 외부로 열려 방 안에서 보이지 않음(unverified)",
    });
  }
  for (const region of templeColonnadeRegions) {
    const center = { x: (region.west + region.east) / 2, y: eye, z: (region.north + region.south) / 2 };
    for (const [id, dx, dz, text] of [
      ["x-minus", -1, 0, "서"], ["x-plus", 1, 0, "동"], ["z-minus", 0, -1, "북"], ["z-plus", 0, 1, "남"],
    ] as const) {
      result.push({
        id: `colonnade.region-${region.id}.${id}`, group: "space", space: "colonnade", role: "region-center",
        label: `주랑 ${region.id} 영역 · 중심→${text}`, position: center,
        target: { x: center.x + dx * 6, y: eye, z: center.z + dz * 6 }, note: null,
      });
    }
  }
  result.push(...colonnadeCornerObservations(), ...junctionObservations(), ...sectionObservations(), ...referenceObservations());
  result.push(...exteriorObservations(environment), ...openingFacingObservations(environment), ...siteObservations(environment));
  return result;
};

/**
 * docs/spaces/observations.md#geometry-observations의 주랑 추가 모서리. 엔진 station의
 * 네 모서리는 외접 상자 근처라 중정 쪽 안쪽 모서리 네 곳과 현관 몸체의 두 바깥
 * 모서리를 따로 세운다. 각 위치는 주랑 영역 안쪽 1.05m에서 그 모서리를 본다.
 */
const colonnadeCornerObservations = (): TempleObservation[] => {
  const inner: Array<[string, number, number, number, number, string]> = [
    ["inner-northwest", p.westCourt, p.courtBack, -1, -1, "중정 북서 안쪽 모서리"],
    ["inner-northeast", p.eastCourt, p.courtBack, 1, -1, "중정 북동 안쪽 모서리"],
    ["inner-southwest", p.westCourt, p.courtFront, -1, 1, "중정 남서 안쪽 모서리"],
    ["inner-southeast", p.eastCourt, p.courtFront, 1, 1, "중정 남동 안쪽 모서리"],
    ["entrance-body-west", p.westPorchOuter, p.entranceBack, -1, -1, "현관 몸체 서쪽 모서리"],
    ["entrance-body-east", p.eastPorchOuter, p.entranceBack, 1, -1, "현관 몸체 동쪽 모서리"],
  ];
  return inner.map(([id, x, z, dx, dz, label]) => ({
    id: `colonnade.corner-${id}`, group: "space", space: "colonnade", role: "corner", label: `주랑 · ${label}`,
    position: { x: x + dx * 1.05, y: eye, z: z + dz * 1.05 }, target: { x, y: 1.0, z }, note: null,
  }));
};

/**
 * 접합 관찰: 네 골, 제실 처마 아래 틈과 봉헌실 파라펫 위 통과, 파라펫과 지붕의 만남,
 * 동측 박공 남쪽 끝의 코핑 아래, 네 외곽 모서리의 코핑·기단. 연직 단면 질문은
 * sectionObservations가 맡고, X/Z 평면으로 자를 수 없는 대각 골 단면만 pose=null의
 * unverified로 남긴다. 체적 겹침은 외피 겹침 전수 스캔(npm run self-check)이 잰다.
 */
const junctionObservations = (): TempleObservation[] => {
  const pose = (id: string, label: string, position: IAutoMovieVector3, target: IAutoMovieVector3): TempleObservation => ({
    id: `junction.${id}`, group: "junction", space: null, role: id.split(".")[0]!, label, position, target, note: null,
  });
  const section = (id: string, label: string): TempleObservation => ({
    id: `junction.${id}`, group: "junction", space: null, role: "section", label, position: null, target: null,
    note: "대각 단면 수단 없음: 체적 겹침만 외피 겹침 스캔으로 수치 검사, 골 전 길이 단면 판독은 unverified",
  });
  return [
    ...([["northwest", -1, -1], ["northeast", 1, -1], ["southwest", -1, 1], ["southeast", 1, 1]] as const).map(([id, sx, sz]) =>
      pose(`valley.${id}`, `지붕 골 · ${id}`, { x: sx * 1.2, y: 6.2, z: sz > 0 ? 3.6 : 0.8 },
        { x: sx * p.eastCourt, y: 3.4, z: sz > 0 ? p.courtFront : p.courtBack })),
    pose("eave.sanctuary-west", "제실 서쪽 처마 아래 틈", { x: -8.4, y: 4.9, z: -7.0 }, { x: -6.0, y: 4.8, z: -7.0 }),
    pose("eave.sanctuary-east", "제실 동쪽 처마와 마당", { x: 8.2, y: 2.2, z: -6.0 }, { x: 6.0, y: 4.6, z: -6.0 }),
    pose("eave.sanctuary-south", "제실 남쪽 처마 아래 틈", { x: -2.0, y: 4.6, z: -1.2 }, { x: -2.0, y: 4.9, z: -3.9 }),
    pose("eave.sanctuary-northwest-parapet", "제실 서쪽 처마의 봉헌실 파라펫 위 통과", { x: -6.1, y: 5.0, z: -13.2 }, { x: -6.1, y: 4.9, z: -10.25 }),
    pose("parapet.west", "서측 파라펫과 외쪽 지붕", { x: -7.6, y: 5.4, z: 0 }, { x: p.westInner, y: 4.6, z: 0 }),
    pose("parapet.north-offering", "봉헌실 북측 파라펫과 외쪽 지붕", { x: -8.0, y: 5.4, z: -7.6 }, { x: -8.0, y: 4.6, z: p.northInner }),
    pose("parapet.south", "남측 파라펫과 주랑 외쪽 지붕", { x: -4.0, y: 5.4, z: 7.6 }, { x: -4.0, y: 4.2, z: p.southInner }),
    pose("parapet.east-gable-ridge", "동측 박공 남쪽 용마루와 남측 코핑", { x: 7.36, y: 5.6, z: 6.6 }, { x: 7.36, y: 4.6, z: p.southInner }),
    ...([["northwest", p.westOuter, p.northOuter], ["northeast", p.eastOuter, p.northOuter],
      ["southwest", p.westOuter, p.southOuter], ["southeast", p.eastOuter, p.southOuter]] as const).map(([id, x, z]) =>
      pose(`trim.${id}`, `외곽 모서리 코핑·기단 · ${id}`, { x: x + Math.sign(x) * 3.2, y: 2.4, z: z + Math.sign(z) * 3.2 }, { x, y: eye, z })),
    section("section.valleys", "지붕 골 전 길이의 양쪽 단면(네 골은 대각선이라 X/Z 연직 단면으로 따라 자를 수 없다)"),
  ];
};

/**
 * docs/spaces/observations.md#geometry-observations의 연직 단면 질문. 각 항목은 뷰어가
 * 그 평면으로 자른 정확한 단면을 정사영으로 보는 관찰이다: 문과 용마루를 지나는
 * 종횡 단면, 문마다 문턱 종단면, 박공 끝 하부, 채광구, 날개 지붕의 높이 차이 끝면,
 * 처마 돌출, 외곽 모서리와 T 접합, 네 입면의 외벽 하단, 현관의 평행 단면.
 */
const sectionObservations = (): TempleObservation[] => {
  const cut = (id: string, label: string, axis: "x" | "z", offset: number, at: { u: number; y: number }, span: number): TempleObservation => {
    const target = axis === "x" ? { x: offset, y: at.y, z: at.u } : { x: at.u, y: at.y, z: offset };
    return {
      id: `section.${id}`, group: "section", space: null, role: "section", label: `단면 · ${label}`,
      // 정사영 단면 카메라는 target에서 유도한다. 원근으로 열 때의 위치는 건물 밖(평면 법선 40m)에 둔다.
      position: axis === "x" ? { ...target, x: offset + 40 } : { ...target, z: offset + 40 }, target, note: null,
      view: { section: axis === "x" ? "cut-x" : "cut-z", offset, ortho: true, span, flip: false },
    };
  };
  const mid = (a: number, b: number) => (a + b) / 2;
  const doors = templeDoorPassages.map((door) => cut(
    `threshold.${door.id}`, `${door.id} 문턱 종단면`, door.axis === "x" ? "x" : "z", door.center,
    { u: mid(door.wallLow, door.wallHigh), y: 1.2 }, 1.8,
  ));
  const steps = roofStepClosures(templeRoofEnvelope()).map((face, i) => {
    const xs = face.corners.map((c) => c.x);
    const zs = face.corners.map((c) => c.z);
    const ys = face.corners.map((c) => c.y);
    const alongX = Math.max(...xs) - Math.min(...xs) > Math.max(...zs) - Math.min(...zs);
    const cx = mid(Math.min(...xs), Math.max(...xs));
    const cz = mid(Math.min(...zs), Math.max(...zs));
    return cut(`roof-step.${i}`, `날개 지붕 높이 차이 끝면 ${i}`, alongX ? "x" : "z", alongX ? cx : cz,
      { u: alongX ? cz : cx, y: mid(Math.min(...ys), Math.max(...ys)) }, 1.2);
  });
  const eave = templeRoofRules.courtEave;
  return [
    cut("longitudinal-axis", "종단면 X=0(정문·현관·중정·제실 문·제실 용마루·포치)", "x", 0, { u: 0, y: 3.2 }, 7),
    cut("transverse-sanctuary", "횡단면 Z=-6.9(제실 용마루·양 spine·봉헌실 지붕·마당)", "z", -6.9, { u: 0, y: 3.5 }, 7),
    cut("transverse-east-wing", "횡단면 Z=3.7(동측 박공·동측 처마·주랑·중정·서측 날개)", "z", 3.7, { u: 0, y: 3 }, 7),
    cut("longitudinal-east-ridge", "종단면 X=7.36(동측 용마루·마당 쪽 끝·남측 코핑 아래 끝)", "x", 7.36, { u: 3.5, y: 3.5 }, 6),
    ...doors,
    cut("gable.sanctuary-north", "제실 북쪽 박공 끝 하부", "z", p.northInner + 0.2, { u: 0, y: 5.6 }, 3.5),
    cut("gable.sanctuary-south", "제실 남쪽 박공 끝 하부", "z", p.sanctuaryFront - 0.2, { u: 0, y: 5.6 }, 3.5),
    cut("gable.east-north", "동측 박공 마당 쪽 끝 하부", "z", p.yardFront + 0.2, { u: 7.36, y: 3.5 }, 2.5),
    cut("gable.east-south", "동측 박공 남측 파라펫 쪽 끝 하부", "z", p.southInner - 0.2, { u: 7.36, y: 4 }, 2.5),
    cut("gable.porch-front", "포치 박공 앞(삼각 막음)", "z", p.southOuter - 0.1, { u: 0, y: 4 }, 2),
    cut("gable.porch-back", "포치 박공 뒤(후퇴벽 위)", "z", p.entranceBack + 0.15, { u: 0, y: 3.8 }, 2),
    ...[-1, 1].flatMap((x) => [
      cut(`clerestory.north-${x < 0 ? "west" : "east"}`, `북측 박공 채광구 X=${x}`, "x", x, { u: mid(p.northOuter, p.northInner), y: 4.8 }, 1.5),
      cut(`clerestory.south-${x < 0 ? "west" : "east"}`, `남측 박공 채광구 X=${x}`, "x", x, { u: mid(p.sanctuaryFront, p.northRing), y: 4.8 }, 1.5),
    ]),
    ...[-8, -5.8].flatMap((z) => [
      cut(`clerestory.west-${z < -7 ? "north" : "south"}`, `서측 spine 채광구 Z=${z}`, "z", z, { u: mid(p.westRoom, p.westRing), y: 4.2 }, 1.5),
      cut(`clerestory.east-${z < -7 ? "north" : "south"}`, `동측 spine 채광구 Z=${z}`, "z", z, { u: mid(p.eastRing, p.eastRoom), y: 4.2 }, 1.5),
    ]),
    ...steps,
    cut("eave.court-north", "중정 북쪽 처마 돌출", "x", 0, { u: p.courtBack, y: eave }, 1.2),
    cut("eave.court-south", "중정 남쪽 처마 돌출", "x", 0, { u: p.courtFront, y: eave }, 1.2),
    cut("eave.court-west", "중정 서쪽 처마 돌출", "z", 2.2, { u: p.westCourt, y: eave }, 1.2),
    cut("eave.court-east", "중정 동쪽 처마 돌출", "z", 2.2, { u: p.eastCourt, y: eave }, 1.2),
    cut("eave.east-wall", "동측 외벽 처마 돌출", "z", 3.7, { u: p.eastOuter, y: 3.4 }, 1.2),
    cut("eave.east-gable-yard", "동측 박공 마당 쪽 끝 돌출", "x", 8, { u: p.yardFront, y: 3.6 }, 1.2),
    cut("eave.north-canopy-yard", "북쪽 주랑 지붕 마당 쪽 끝 돌출", "z", -2.6, { u: p.eastRoom, y: 3.5 }, 1.2),
    cut("eave.sanctuary-north", "제실 북쪽 끝 돌출", "x", 0, { u: p.northOuter, y: 7.2 }, 1.2),
    cut("eave.sanctuary-south", "제실 남쪽 끝 돌출", "x", 0, { u: p.northRing, y: 7.2 }, 1.2),
    cut("eave.sanctuary-west", "제실 서쪽 처마 돌출", "z", -6.9, { u: p.westRoom, y: 5 }, 1.2),
    cut("eave.sanctuary-east", "제실 동쪽 처마 돌출", "z", -6.9, { u: p.eastRoom, y: 5 }, 1.2),
    cut("eave.porch-front", "포치 앞끝 돌출", "x", 0, { u: p.southOuter, y: 4.4 }, 1.2),
    ...([["northwest", -1, -1], ["northeast", 1, -1], ["southwest", -1, 1], ["southeast", 1, 1]] as const).map(([id, sx, sz]) =>
      cut(`corner.${id}`, `외곽 모서리 L 접합 ${id}`, "x", sx * 10.2, { u: sz * 10.0, y: eye }, 2)),
    ...([[-1, "west"], [1, "east"]] as const).flatMap(([sx, side]) => [
      cut(`tee.${side}-spine-north`, `${side} spine과 북측 외벽 T 접합`, "x", sx * 5.75, { u: p.northInner, y: 2 }, 2),
      cut(`tee.${side}-spine-south`, `${side} spine과 남측 외벽 T 접합`, "x", sx * 5.75, { u: p.southInner, y: 2 }, 2),
      cut(`tee.sanctuary-south-${side}`, `제실 남벽과 ${side} spine T 접합`, "z", mid(p.sanctuaryFront, p.northRing), { u: sx * 5.75, y: 2 }, 2),
    ]),
    ...([["yard-storage", mid(p.yardFront, p.storageBack)], ["storage-records", mid(p.storageFront, p.recordsBack)],
      ["records-office", mid(p.recordsFront, p.officeBack)]] as const).flatMap(([id, z]) => [
      cut(`tee.${id}-east-wall`, `${id} 가로벽과 동측 외벽 T 접합`, "z", z, { u: p.eastInner, y: 1.8 }, 2),
      cut(`tee.${id}-east-spine`, `${id} 가로벽과 동측 spine T 접합`, "z", z, { u: p.eastRoom, y: 1.8 }, 2),
    ]),
    cut("tee.entry-back-returns", "현관 후퇴벽과 두 반환벽", "z", mid(p.entranceBack, p.entranceFront), { u: 0, y: 2 }, 2.5),
    cut("wall-bottom.west", "서측 외벽 하단과 지면", "z", 0, { u: p.westOuter, y: 0.2 }, 1.2),
    cut("wall-bottom.east", "동측 외벽 하단과 지면", "z", 0, { u: p.eastOuter, y: 0.2 }, 1.2),
    cut("wall-bottom.north", "북측 외벽 하단과 지면", "x", 0, { u: p.northOuter, y: 0.2 }, 1.2),
    cut("wall-bottom.south", "남측 외벽 하단과 지면", "x", -6, { u: p.southOuter, y: 0.1 }, 1.2),
    ...[-1.35, -0.9, 0.9, 1.35].map((x) => cut(`entrance.x${x}`, `현관 평행 단면 X=${x}(${Math.abs(x) > 1 ? "기둥 받침" : "계단 끝"})`,
      "x", x, { u: mid(p.entranceFront, p.southOuter), y: 0.8 }, 1.5)),
  ];
};

/**
 * 다섯 reference 비교 질문. 각 이미지의 구도에 가까운 pose로 같은 건물·방으로
 * 읽히는지를 묻는다. 02는 지붕·천장을 숨긴 절개 조감으로 본다. 절개는 검사 수단이고
 * 전달 프레임이 아니다. 시각 판정 결과는 이 목록이 아니라 판정에서 나온다.
 */
const referenceObservations = (): TempleObservation[] => {
  const ref = (id: string, label: string, position: IAutoMovieVector3, target: IAutoMovieVector3, view?: TempleView): TempleObservation => ({
    id: `reference.${id}`, group: "reference", space: null, role: "reference", label: `reference 비교 · ${label}`,
    position, target, note: "같은 건물·방으로 읽히는지의 시각 비교 질문(판정 전 unverified)", ...(view === undefined ? {} : { view }),
  });
  return [
    ref("01-exterior", "01 외관(정면 좌측 조감)", templeExteriorSettingView.position, templeExteriorSettingView.target),
    ref("02-section-axonometric", "02 절개 조감(지붕·천장 숨김)", { x: -17, y: 24, z: 24 }, { x: 0, y: 0, z: 0 },
      { section: "roof-off", offset: 0, ortho: false, span: 4, flip: false }),
    ref("03-courtyard-fountain", "03 중정과 분수(남쪽 주랑 기둥 옆에서 북쪽)", { x: -0.35, y: 1.8, z: 7.8 }, { x: 0, y: 0.6, z: -1.0 }),
    ref("04-worship-hall", "04 제실(북쪽에서 제실 문 쪽)", { x: 0, y: eye, z: -9.2 }, { x: 0, y: 1.4, z: -2.0 }),
    ref("05-records-service-wing", "05 업무 날개(동쪽 주랑 남쪽 끝에서 북쪽, 오른쪽 세 방 문)", { x: 4.3, y: eye, z: 8.6 }, { x: 5.2, y: 1.4, z: 1.0 }),
  ];
};

/**
 * docs/spaces/site.md의 대지 관찰. 조감은 구획·경계석 고리·배치 구역을, 두 접근은
 * 경계석 끊김과 접점 높이를, 서측 골목은 지면 경사를, 정면 거리 시점은 먼 능선이
 * 신전 뒤에 낮게 놓이는지를 본다. 눈높이는 대지 support 위 1.6m다.
 */
const siteObservations = (environment: IAutoMovieBuiltEnvironment): TempleObservation[] => {
  const standing = (x: number, z: number): IAutoMovieVector3 => {
    const floor = supportHeight(environment, templeSiteIds.space, { x, y: 0, z });
    if (floor === null) throw new Error(`temple/observations: 대지 관찰 위치 (${x}, ${z})에 support가 없습니다.`);
    return { x, y: floor + eye, z };
  };
  const entries: [string, string, IAutoMovieVector3, IAutoMovieVector3][] = [
    ["site.aerial", "대지 · 구획 조감", { x: 0, y: 62, z: 16 }, { x: 0, y: 0, z: 1 }],
    ["site.approach-entry", "대지 · 정문 진입 포장과 경계석 끊김", standing(4.5, 17.5), { x: 0, y: 0, z: 11.5 }],
    ["site.approach-service", "대지 · 동측 골목에서 서비스 문", standing(13.3, 0.5), { x: 10.5, y: 1.0, z: -6.4 }],
    ["site.lane-west", "대지 · 서측 골목 경사", standing(-13.3, 12.5), { x: -12.5, y: 0.6, z: -12 }],
    ["site.ridge-front", "대지 · 정면 거리 서쪽에서 먼 능선", standing(-26, 18), { x: -4, y: 4, z: -80 }],
  ];
  return entries.map(([id, label, position, target]) => ({
    id, group: "site", space: templeSiteIds.space, role: id.split(".")[1]!, label, position, target, note: null,
  }));
};

/** 그 공간의 수평 support 중 점을 포함하는 가장 높은 면의 높이. */
const supportHeight = (
  environment: IAutoMovieBuiltEnvironment, space: string, at: IAutoMovieVector3,
): number | null => {
  const heights = environment.surfaces.filter((entry) => entry.space === space).flatMap((entry) => {
    const surface = entry.surface;
    const inside = (ring: readonly IAutoMovieVector3[]) => ring.reduce((odd, a, i) => {
      const b = ring[(i + 1) % ring.length]!;
      return (a.z > at.z) !== (b.z > at.z) && at.x < (b.x - a.x) * (at.z - a.z) / (b.z - a.z) + a.x ? !odd : odd;
    }, false);
    if (!inside(surface.polygon) || (surface.holes ?? []).some(inside)) return [];
    const rule = surface.height;
    if (rule?.kind === "constant") return [rule.value];
    if (rule?.kind === "plane") return [rule.originHeight + rule.slopeX * at.x + rule.slopeZ * at.z];
    return [];
  });
  return heights.length === 0 ? null : Math.max(...heights);
};
