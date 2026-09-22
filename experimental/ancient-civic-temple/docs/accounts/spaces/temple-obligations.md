# 신전의 추가 공간 의무 결산

## 완결 표면 배정의 범위 {#surface-population}

<!--
@evidence contracts/obligations-spaces.md#surface-ownership ownership 표의 입면·방·층·roof 주소를 각 공간/입면/roof의 실제 소유 문장과 대조했다. 공유벽의 한 실체와 양면 마감, 문턱, 박공, 처마 하부를 아래와 같이 구별하며 compiled binding은 아직 없음을 남긴다.
-->

[ownership](../../spaces/ownership.md#surface-map)은 남북서동 외측 면을 각 입면에, 아홉 공간의 내측 면/바닥/천장을 각 room에, 기준과 구조체 공유 접합을 storey에, roof 상부/외부 처마 하부를 roof owner에 배정한다. 각 행의 source 주소는 후속 단독 owner 지정이며 현재 존재하는 TypeScript라는 주장이 아니다. 모든 room과 입면/roof 문서를 읽었고 물리벽은 입면 또는 boundaries 하나가 만들고 서로 마주 보는 두 마감은 각 공간에 남기는 관계가 일치했다.

[threshold-support](../../spaces/storey.md#threshold-support)는 문턱 전체를 주랑이 아닌 방에 주며 실제 벽 두께 안 예약과 cell 연장을 함께 다룬다. [junctions](../../spaces/junctions.md)는 맞댐과 박공 연장의 계산을 맡고 새 완결 표면 소유자가 아니다. [roof assembly](../../spaces/roofs/assembly.md#roof-junctions)의 면 분할도 원래 surface ID에 남으며 외부 처마와 내부 천장 하부를 구별한다. 독립 기둥·문·수반·집기는 prototype 전체 표면을 별도 model 한 소유가 만들고 방 파일은 그 배치/접촉을 소비한다.

이것으로 지불한 것은 최초 설계의 소유 분해다. 현재 source/compiled 면이 없으므로 실제 모든 면의 누락·중복 binding은 unverified다. 해당 역검사를 통과하지 않은 상태로 사용자 매스·공간 단계의 시각 완료를 선언하지 않는다. 외부 setting은 maps/models 소유이며 건물 표면에 합쳐 저작하지 않는다.

## 관찰 전집합과 미해결의 보존 {#observation-population}

<!--
@evidence contracts/obligations-spaces.md#compiled-observations observations의 전집합 유도와 각 room/입면/roof의 지역 질문을 함께 읽었다. 고리 주랑의 추가 영역·모서리와 마당 두 threshold, 원 pose 실패 보존 및 다섯 reference 추가를 배정하고 실제 목록/프레임의 부재를 별도로 기록한다.
-->

[geometry-observations](../../spaces/observations.md#geometry-observations)는 같은 generation의 built environment와 lowering에서 setting·모든 노출 입면/모서리/roof/하부/출입/개구부를 유도한다. 공간마다 자기 내부 threshold·네 모서리·중심 네 방위가 있고 주랑은 외접 상자 중앙으로 대신하지 않으며 여섯 평면 영역과 구멍/notch 경계를 추가한다. 서비스 마당은 두 문턱, 긴 봉헌실은 장축 양끝, 현관은 중앙/양끝/기둥 받침 단면으로 해당 지역의 실패를 더 묻는다. 계산 cell 접면은 새 방 모서리나 표면 소유가 아니다.

관찰 함수가 다른 눈높이 또는 문에서 먼 내부 점을 반환하면 원 결과를 보존하고 설정의 요구 위치와 따로 비교한다. 충돌/null을 목록에서 빼지 않고 unverified 및 같은 공간의 보조 위치로 남긴다. 문틀·문짝·철물의 실체 sweep은 두께 없는 panel 상자와 다르며, 실제 수단이 없으면 유사 수치로 통과시키지 않는다. 북동 canopy 전체 덮임, 외벽 최저 접지, 문턱 전 폭/깊이도 한 점 검사로 대체하지 않는다.

다섯 reference의 외관·절개 검사·중정·제실·기록/서비스 질문은 위 전집합에 더해진다. 절개는 검사 수단이고 전달 프레임이 아니다. [viewer-path](../../spaces/observations.md#viewer-path)는 현재 source 실체와 ID·변환·재료·관찰 generation을 함께 전달하며 기본 화면에 라벨이나 semantic support를 덮지 않는다. 실제 census·관찰 수·pose binding·GPU RENDERER·방별 프레임은 아직 없으므로 unverified다. 이 account는 계획된 전집합의 책임 배정이며 실제 관찰자 목록이 비었다는 보고가 아니다.
