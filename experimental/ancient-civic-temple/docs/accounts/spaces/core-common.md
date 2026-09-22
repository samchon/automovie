# 공간 설계 population의 공통 의무

## 파일 역할과 공간 납품 {#file-roles}

<!--
@evidenceReview obligations/core/common.md#purpose-fit #7b32c66 26파일을 기준/경계/동선/입면/방/roof/소유/관찰의 서로 다른 결과에 대조했다. 기준선만으로는 접합이 닫히지 않고 방 목록만으로는 실제 관찰이 정해지지 않는 등 각 파일을 뺄 때의 후속 결손이 본문에 구체적으로 설명돼 있다.
-->

<!--
@evidence obligations/core/common.md#purpose-fit 26개 파일을 기준 평면/높이·경계/접합·동선·입면·방·roof·표면 소유·관찰 역할로 대조했다. 방 목록만 남기면 물리 접합과 외관이 비고, 외피만 남기면 각 방의 직접 문과 이용 영역이 비는 서로 다른 후속 결정을 아래 지도에 기록한다.
-->

이 population은 한 단층 신전의 건물 내부와 외피를 함께 설계한다. [building](../../spaces/building.md)은 외곽·공유 기준선·부모 위계·외부 접점을, [storey](../../spaces/storey.md)는 높이·문턱 지지·외벽 하단을 소유한다. 둘 중 하나가 없으면 방의 평면만 맞아도 도로·문턱·지면을 같은 건물로 연결할 수 없다. [openings](../../spaces/openings.md)는 경계 identity와 실제 void/문/창 위치를, [junctions](../../spaces/junctions.md)는 벽 끝/박공의 폐쇄를 정한다. 후자는 개구부 표만으로는 막을 수 없는 모서리 중첩·roof 아래 누광을 다룬다. [circulation](../../spaces/circulation.md)은 공용/서비스의 서로 다른 시작과 주랑 경유 순서를 정한다.

[남측](../../spaces/facades/south.md)·[북측](../../spaces/facades/north.md)·[서측](../../spaces/facades/west.md)·[동측](../../spaces/facades/east.md)은 각각 후퇴 현관, 높은 박공/낮은 마당 벽, 긴 무창 봉헌실 벽, 외부 서비스 출입의 완결 외면을 소유한다. 서로를 대체하면 후면과 옆면의 실제 닫힘이 사라진다. rooms의 [현관](../../spaces/rooms/entrance.md)·[중정](../../spaces/rooms/courtyard.md)·[주랑](../../spaces/rooms/colonnade.md)·[제실](../../spaces/rooms/sanctuary.md)·[봉헌실](../../spaces/rooms/offering.md)·[관리실](../../spaces/rooms/administration.md)·[기록실](../../spaces/rooms/records.md)·[보관실](../../spaces/rooms/storage.md)·[서비스 마당](../../spaces/rooms/service-yard.md)은 각각 자기 volume·접근·내부 표면과 용도별 예약을 가져 공간명만 나열한 방을 남기지 않는다.

roofs의 [assembly](../../spaces/roofs/assembly.md)는 높이·두께·돌출·겹침 선택을, [sanctuary](../../spaces/roofs/sanctuary.md)·[west](../../spaces/roofs/west.md)·[east](../../spaces/roofs/east.md)·[porch](../../spaces/roofs/porch.md)·[colonnade](../../spaces/roofs/colonnade.md)는 각 지지 영역·끝선·관찰을 담당한다. 공통 계산만으로 각 roof의 끝을 고를 수 없고, 개별 roof만으로는 교차부의 중복을 해소할 수 없다. [ownership](../../spaces/ownership.md)은 이 소유를 완결 표면 단위로 잇는다. [observations](../../spaces/observations.md)는 전체 질문을 현재 산출물에서 유도하고 그 값을 그릴 viewer 경로를 정해 대표 외관 하나만으로 실내 누락이 가려지는 것을 막는다.

## 공간과 다른 제작 분기의 경계 {#layer-routing}

<!--
@evidenceReview obligations/core/common.md#layer-boundary #5271f94 전체 방/입면/roof의 수치는 공간 경계와 예약에 쓰이며 물체 곡면·기와 반복·roughness·조명값을 결정한 단위는 없다. 외부 지면과 조립 전달도 maps와 viewer에 배정해 spaces의 결정과 소비 입력을 구별했다.
-->

<!--
@evidence obligations/core/common.md#layer-boundary building부터 각 방/roof까지는 경계·부피·연결·접합·접근 예약을 정한다. 기둥/수반/집기 실체, 마감 수치, 반복 population, 외부 지면과 조명은 해당 후속 분기에 남으며 viewer 전달도 공간 geometry를 재작성하지 않는다고 명시돼 있다.
-->

26개 파일은 spaces의 topology·외피·치수·표면 배정·관찰 설계다. room 문서의 책상/제단/수반 언급은 방이 수용할 중심·접근·관계의 입력이며 prototype의 곡면·보 단면·기와 mesh를 만드는 설계가 아니다. roof 문서의 경사 매스와 닫힘은 건물 외피가 소유하고 기와/서까래 반복 상세는 후속 모델/반복 분기가 소비한다. 입면의 회벽·기단은 그 재료가 덮을 표면 경계이며 roughness·UV·색 수치는 materials가 소유한다.

building의 두 접점과 storey의 외벽 하단은 maps가 줄 외부 지면을 소비하는 인터페이스다. maps가 아직 없다는 이유로 후보 지형을 확정하거나 world→site 접근을 완료했다고 쓰지 않았다. observations의 CJS 경로는 같은 source를 계측/화면에 넘기는 관찰 설계이며 engine을 바꾸거나 브라우저에 다른 건물을 저작할 권한이 아니다. 실제 조명과 물줄기 상태는 systems, 독립 물체와 반복은 models/instances, 모든 실행 소스는 src에 남아 있다.

## 작업 언어와 식별 표기 {#working-language}

<!--
@evidenceReview obligations/core/common.md#production-language #3ef4142 작성·건조 보관·반입의 차이는 한국어 본문으로 설명되고 영어는 source/API 주소와 좌표 표기에 한정된다. 행렬/반공간도 단위와 부호가 설명돼 파일명 추측으로 방 용도를 알아내야 하는 부분이 없다.
-->

<!--
@evidence obligations/core/common.md#production-language 방의 역할·기준선·단차·실패 조건은 한국어로 읽히고 영어는 temple/colonnade 같은 identity, cells/profile 같은 API 필드와 예정 source 주소에 쓰인다. 아래 비교에서 문서 용도와 실행 식별자를 구분했다.
-->

[언어 설정](../../settings/00-delivery.md#working-language)에 따라 설계의 결정·이유·관찰은 한국어 기술 서술이다. 관리실의 작성, 기록실의 건조 보관/열람, 보관실의 봉헌물 반입이 한국어로 구별되어 영어 파일명을 추측할 필요가 없다. west/east와 north/south 기준선은 building의 X/Z 표에, cell의 반공간은 colonnade의 부등식에 뜻이 있고 단위 m와 경사 도수는 생산 좌표 규약을 따른다. source 각도 변환과 API의 정확한 철자는 구현 시에도 유지한다.

viewer-path의 한국어 설명과 키보드 조작은 설계 요구이며 이미 UI가 구현됐다는 주장이 아니다. unverified는 실제 계측·렌더가 없는 항목의 상태로 일관되게 쓰고 입력 산술과 실행 결과를 섞지 않는다. 현재 납품에 없는 고대 언어 비문·영화 자막·인물 대사를 spaces 문서가 만들어 내지 않는다.

## 규모와 전개 분량의 비교 {#proportion}

<!--
@evidenceReview obligations/core/common.md#proportionate-development #78feb28 전체26파일/37 H2를 역할별 문자 분포와 읽었다. 관찰·개구부·기준선은 다수 접합/실패를 다뤄 길고 짧은 east roof도 끝선·공유벽·하부 소유를 결정한다. a4c1d468 대비 매스/동선 본문 축소가 없고 observations의 접근 UI 보완만 늘어난 비교는 주석 증가를 생산량으로 세지 않는다.
-->

<!--
@evidence obligations/core/common.md#proportionate-development 현재 26파일/37 H2를 전체로 읽고 본문 분량을 역할별로 비교했다. 관찰·개구부·기준선은 다수 경계/실패 경우를 다루어 길고 단일 날개/방은 상위 공유 결정을 소비해 짧다. v-077 제출본과 파일/단위 수 및 본문을 비교해 매스·동선 축소가 없음을 기록한다.
-->

비교 기준은 21×20.5m 단층, 같은 층의 아홉 공간, 네 외측 입면, 하나의 주랑, 여섯 roof 문서가 다루는 외피다. 이 숫자는 authored 설계의 분포이며 compiled census가 아니다. 현재는 26파일/37 H2다. 아래 문자 수는 해당 Markdown에서 HTML 주석·제목 줄·공백 문자를 제거한 본문 길이다. 링크/표 표기 문자는 남겼으므로 독자용 어절 수나 geometry 양으로 읽지 않는다. evidence 문장이 길어져 생긴 분량은 이 비교에 포함하지 않았다.

| 역할 | 파일/H2 | 파일별 본문 문자 수 |
| --- | --- | --- |
| building·storey | 2/7 | 3493·2755 |
| openings·junctions·circulation | 3/7 | 3635·1956·1803 |
| 남·북·서·동 입면 | 4/4 | 903·691·594·682 |
| 현관·중정·주랑 | 3/3 | 1610·976·1693 |
| 제실·봉헌실 | 2/2 | 733·646 |
| 관리실·기록실·보관실·마당 | 4/4 | 624·580·577·958 |
| assembly·sanctuary·west·east·porch·colonnade roof | 6/7 | 1164·675·625·535·704·1583 |
| ownership·observations | 2/3 | 2489·5910 |

주랑과 현관이 다른 방보다 긴 이유는 각각 구멍 있는 합집합과 구간별 계단 바닥을 따로 결정하기 때문이다. 가장 짧은 east roof도 지지선·마당 앞 끝·네 돌출 참조면·북쪽 합성·서로 다른 하부 소유·검사 위치를 갖는다. 반대로 observations는 topology 전집합, 반환 pose의 한계, 실제 문턱/접합/지면, 전송 경계를 모두 책임져 단일 대표 view 설명으로 줄일 수 없다. 동일한 골격의 일반 방보다 이 인터페이스들에 상세가 집중된 것은 납품 효과에 맞는다.

부모 settings는 허용 범위와 방/부재 정체성을 정하고 spaces는 실제 기준선·벽 두께·문 중심·roof 지지선·순환 및 소유를 더했다. 같은 settings 문장을 방 이름만 바꿔 늘린 분포가 아니다. v-077 판정 제출본 a4c1d46870fb186cbf29c5b112a5476a2bfeb0e4와 비교해 26파일/37 H2와 모든 매스·치수·동선 본문을 유지했다. observations 본문만 키보드/텍스트/색 외 상태 조건 보완 및 낡은 단계 문장 정리로 5778에서 5910으로 늘었다. 다른 25개 본문 분량은 그대로다. 새 account와 주석은 공간 수를 늘린 것으로 세지 않는다. 이 분포 비교는 실제 구현 깊이·통과·시각 품질의 완료 판정이 아니며 모두 후속 소스/프레임에서 별도로 검토해야 한다.
