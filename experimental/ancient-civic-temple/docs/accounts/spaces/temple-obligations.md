# 신전의 추가 공간 의무 결산

## 완결 표면 배정의 범위 {#surface-population}

<!--
@evidence contracts/obligations-spaces.md#surface-ownership ownership 표의 입면·방·층·roof·대지·내부 경계벽 주소를 각 owner의 실제 소유 문장과 대조하고, 방출된 surface ID를 owner별로 열거한 역검사로 표 밖 owner가 없음을 확인했다.
-->

<!--
@evidenceReview contracts/obligations-spaces.md#surface-ownership #1a50ebe 역검사가 21개 방출 owner를 열거했고 owner 행이 없던 boundaries reveal을 표에 더해 닫았다고 본문이 밝혀, 계약의 최초 분해가 실제 면에 대해 지급됐다.
-->

[ownership](../../spaces/ownership.md#surface-map)은 남북서동 외측 면을 각 입면에, 아홉 공간의 내측 면/바닥/천장을 각 room에, 기준과 구조체 공유 접합을 storey에, roof 상부/외부 처마 하부를 roof owner에, 대지 흙띠·경계석·포장·먼 능선을 [대지](../../spaces/site.md) owner에 배정한다. 각 행의 source 주소는 후속 단독 owner 지정이며 현재 존재하는 TypeScript라는 주장이 아니다. 모든 room과 입면/roof 문서를 읽었고 물리벽은 입면 또는 boundaries 하나가 만들고 서로 마주 보는 두 마감은 각 공간에 남기는 관계가 일치했다.

[threshold-support](../../spaces/storey.md#threshold-support)는 문턱 전체를 주랑이 아닌 방에 주며 실제 벽 두께 안 예약과 cell 연장을 함께 다룬다. [junctions](../../spaces/junctions.md)는 맞댐과 박공 연장, 외벽 기단·코핑 단면의 계산을 맡고 새 완결 표면 소유자가 아니다. 코핑과 기단 표면은 각 입면의 coping·plinth ID이고 마당 벽 위 코핑은 서비스 마당의 wall-top이며 모서리 칸도 한 표면만 받는다. [실내 하부 띠](../../spaces/ownership.md#interior-dado)는 주랑·제실 벽 마감을 0.60m에서 나눈 두 dado 표면이며 여전히 각 방 owner의 표면이다. [roof assembly](../../spaces/roofs/assembly.md#roof-junctions)의 면 분할도 원래 surface ID에 남으며 외부 처마와 내부 천장 하부를 구별한다. 독립 기둥·문·수반·집기는 prototype 전체 표면을 별도 model 한 소유가 만들고 방 파일은 그 배치/접촉을 소비한다.

이것으로 지불한 것은 최초 설계의 소유 분해와 그 역검사다. `npm run self-check`로 방출된 surface ID를 owner별로 열거하면 21개 owner(네 입면, 아홉 공간 중 현관·중정·주랑·제실·봉헌실·관리실·기록실·보관실·서비스 마당, 다섯 지붕, boundaries, site, site-distant)가 나온다. 그중 boundaries의 reveal(내부 경계벽 문·창의 문설주·인방 안쪽 면)만 표에 owner 행이 없었고 ownership 표에 경계와 개구부 행을 더해 닫았다. 층(storey)은 공유 접합만 소유해 방출 표면이 없다. 한 면에 두 owner가 붙는지는 part ID가 surface ID 하나라서 구조적으로 생기지 않으며, 공유 접합만 가진 층을 빼면 표에 있지만 방출되지 않는 owner는 없다. 해당 역검사를 통과하지 않은 상태로 사용자 매스·공간 단계의 시각 완료를 선언하지 않는다. 대지 표면은 건물과 다른 소유 단위이고 이웃·식생 개체는 models/instances 소유이며 건물 표면에 합쳐 저작하지 않는다.

## 관찰 전집합과 미해결의 보존 {#observation-population}

<!--
@evidence contracts/obligations-spaces.md#compiled-observations observations의 전집합 유도와 각 room/입면/roof/대지의 지역 질문, 주랑의 안쪽·현관 몸체 모서리와 접합 관찰, 단면 네 항목의 unverified 기록을 함께 읽고 방별 프레임 판정의 부재를 따로 기록한다.
-->

<!--
@evidenceReview contracts/obligations-spaces.md#compiled-observations #09b52ea 주랑 추가 모서리 여섯과 junction pose·단면 unverified 항목이 목록에 들어가 계약의 추가 내부 경계 모서리 조건을 채우고, null·충돌 원 질문도 지우지 않는다.
-->

[geometry-observations](../../spaces/observations.md#geometry-observations)는 같은 generation의 built environment와 lowering에서 setting·모든 노출 입면/모서리/roof/하부/출입/개구부를 유도한다. 공간마다 자기 내부 threshold·네 모서리·중심 네 방위가 있고 주랑은 외접 상자 중앙으로 대신하지 않으며 여섯 평면 영역과 구멍/notch 경계를 추가한다. 서비스 마당은 두 문턱, 긴 봉헌실은 장축 양끝, 현관은 중앙/양끝/기둥 받침 단면, 대지는 구획 조감·두 접근·골목 경사·먼 능선 시점으로 해당 지역의 실패를 더 묻는다. 주랑은 엔진의 외측 모서리 넷에 더해 중정 쪽 안쪽 모서리 넷과 현관 몸체 모서리 둘을 source pose로 가지며, 접합 관찰은 네 골·제실 처마 아래와 파라펫 위·세 파라펫 만남·동측 박공 남쪽 끝·외곽 네 모서리 석재 띠를 pose로, 단면 네 질문을 pose 없는 unverified 항목으로 목록에 둔다. 계산 cell 접면은 새 방 모서리나 표면 소유가 아니다.

관찰 함수가 다른 눈높이 또는 문에서 먼 내부 점을 반환하면 원 결과를 보존하고 설정의 요구 위치와 따로 비교한다. 충돌/null을 목록에서 빼지 않고 unverified 및 같은 공간의 보조 위치로 남긴다. 문틀·문짝·철물의 실체 sweep은 두께 없는 panel 상자와 다르며, 실제 수단이 없으면 유사 수치로 통과시키지 않는다. 북동 canopy 전체 덮임, 외벽 최저 접지, 문턱 전 폭/깊이도 한 점 검사로 대체하지 않는다.

다섯 reference의 외관·절개 검사·중정·제실·기록/서비스 질문은 위 전집합에 더해진다. 절개는 검사 수단이고 전달 프레임이 아니다. [viewer-path](../../spaces/observations.md#viewer-path)는 현재 source 실체와 ID·변환·재료·관찰 generation을 함께 전달하며 기본 화면에 라벨이나 semantic support를 덮지 않는다. census·관찰 수·GPU RENDERER는 viewer payload와 화면이 매번 유도하지만 방별 프레임의 시각 판정과 pose binding의 전수 대조는 아직 없으므로 unverified다. 이 account는 계획된 전집합의 책임 배정이며 실제 관찰자 목록이 비었다는 보고가 아니다.
