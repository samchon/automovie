# 동측 외피의 단독 소유

## 서비스 출입이 있는 업무 날개 {#east-envelope}

<!--
@evidence principles/core/common.md#scope-preservation 세 업무방과 서비스 마당의 바깥면, 서비스 문, 동측 박공 처마를 받는 벽과 낮은 벽으로 바뀌는 끝, 남동 모서리 칸을 동측 입면에 포함한다.
@evidence principles/core/common.md#substantive-completion 업무방 구간은 동측 박공 하부까지, 마당 구간은 낮은 벽, 남동 모서리 칸은 코핑 4.85m로 상단 소유를 구별하고 서비스 문턱 슬래브가 들어갈 벽 부피를 비운다.
@evidence principles/core/common.md#declared-basis east 기준선, 남측 코핑·북측 마당 벽 높이, 동측 박공 하부를 소비하고 문 void는 기존 문 owner에서 받는다.
@evidence principles/design/spaces.md#space-topology 서비스 외부 문만 열고 업무방마다 바깥 문을 추가하지 않으며 마당의 하늘과 보관실 끝벽을 구별한다.
@evidence principles/design/spaces.md#space-boundary-authority 동측 벽 실체/외피와 남동 모서리 코핑은 east, 방 내면은 각 방, 외부 지면은 maps로 남겨 Y=0 지면을 임의 복제하지 않는다.
@evidence principles/design/spaces.md#space-verification-address 입면 두 끝과 남동 모서리 칸, 서비스 문 양면, 처마 벽→낮은 벽의 높이 변화 단면으로 부유한 문과 없는 방을 암시하는 폐쇄를 찾는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 서비스 마당 외부 출입을 업무 날개 북쪽의 높이 변화와 실제 외벽 문턱 접점, 남측 파라펫과의 모서리 칸에 배정한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work service-yard의 외부 반입과 openings의 깊은 문설주/인방을 동측 외벽에 대조했다. 업무방에 추가 문을 만들지 않고도 마당으로 접근하므로 고정 방 그래프를 고치지 않았다.
@evidence settings/30-interiors.md#service-yard 동쪽 외부 문과 낮은 마당 외벽이 실제 마당으로 이어지고 하늘은 열려 있도록 한다.
@evidence settings/20-envelope.md#openings 서비스 문에서도 깊은 문설주·인방·목재 문짝이 같은 실제 void를 소비한다.
-->

<!--
@evidenceReview principles/core/common.md#scope-preservation 업무방 전 길이와 마당 서비스 문, 낮아지는 북쪽 벽, 남동 모서리 칸까지 한 동측 외피로 다룬다.
@evidenceReview principles/core/common.md#substantive-completion 처마 벽·낮은 벽·코핑 모서리 칸의 세 상단과 서비스 문턱 슬래브 부피를 비우는 규칙이 있어 문만 그린 막힘을 피한다.
@evidenceReview principles/core/common.md#declared-basis 남측 코핑·북측 마당 벽·동측 박공 하부와 openings의 void를 소비해 높이와 문 크기를 중복 결정하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology 방마다 바깥 문을 더하지 않고 마당 문만 외부로 열어 우측 직접 출입 관계를 지킨다.
@evidenceReview principles/design/spaces.md#space-boundary-authority 방 안쪽 표면과 외부 지면은 각각 room/maps에 남고 모서리 칸의 코핑은 동측 입면에 남아 범위가 분명하다.
@evidenceReview principles/design/spaces.md#space-verification-address 문 안/밖과 처마 벽→낮은 벽, 남동 모서리의 파라펫 만남을 함께 보아 부유한 서비스 문과 모서리 틈을 찾는다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation 외부 반입 요구를 북쪽 마당의 실제 외벽 문턱과 업무 날개 끝, 남동 모서리 칸에 결속했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work 깊은 문설주와 외부 반입을 마당 외벽에 배정할 수 있어 업무방의 새 외부 문이 필요하지 않았다.
@evidenceReview settings/30-interiors.md#service-yard 업무 roof를 마당 위에 연장하지 않는 문장이 서비스 마당의 열린 하늘을 지킨다.
@evidenceReview settings/20-envelope.md#openings 깊은 문설주·인방·목재 문짝이 동일 void를 소비하도록 해 외벽 구멍만 남기지 않는다.
-->

[기준선](../building.md#plan-datums)의 east-inner~east-outer가 동측 외벽이다. 남쪽부터 관리실·기록실·보관실, 북쪽은 서비스 마당의 바깥면이다. 업무방 구간의 벽은 [동측 박공](../roofs/east.md#east-roof)의 동측 처마를 받는 벽이고 상단은 그 하부까지 닫는다. 남측 파라펫과 맞대는 남동 모서리 칸(south-inner~south-outer)은 [남측](south.md#south-envelope)의 코핑 높이로 올라 파라펫을 끝맺는다. 낮은 마당 벽은 [북측](north.md#north-envelope)의 높이를 소비한다. 외부 서비스 문의 실제 void는 [문 owner](../openings.md#doors)에서 받고 방마다 바깥 출입문을 추가하지 않는다.

source `src/spaces/facades/east.ts`가 동측 완결 외피와 벽 실체, 남동 모서리 칸의 코핑을 소유하고 내측은 각 방에 남긴다. 양끝은 [모서리 접합](../junctions.md#wall-junctions)을 소비한다. 업무 날개 지붕은 마당 경계에서 끝나 하늘을 열어 두며 그 북쪽 박공은 [기존 공유 벽](../junctions.md#gable-closures)이 닫는다. 서비스 문에는 깊은 문설주·인방·목재 문짝이 읽혀야 하며 Y=0의 실제 외부 접점이 문턱에 닿는다.

동측 전면과 두 모서리, 남동 모서리 칸과 파라펫의 만남, 서비스 출입 안/밖, 처마 벽에서 낮은 벽으로 바뀌는 단면을 관찰한다. 외부 문만 떠 있거나 벽 높이 변화 뒤에 없는 방을 암시하면 이 입면과 마당 owner를 함께 수리한다.

외벽 하단은 [층의 지면 접합](../storey.md#wall-ground-contact)을 소비하고, 서비스 문 안의 벽 두께 구간은 마당 소유 문턱 슬래브가 들어갈 부피를 비운다. 지면 아래 벽이 슬래브 아랫면에 닿는 것과 통과 영역을 막는 것을 구별하며, 외부 지면을 Y=0으로 일괄 복사하지 않는다.
