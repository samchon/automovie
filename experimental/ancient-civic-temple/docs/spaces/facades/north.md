# 후면 외피의 단독 소유

## 제실 박공과 마당 벽 {#north-envelope}

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 봉헌실 뒤와 제실 박공, 마당 낮은 벽 및 상부 창을 후면에서 빠뜨리지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 지붕 하부까지의 실내 벽과 Y=2.55m 마당 벽을 구별해 일직선 후면의 높이를 정했다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb north 기준선과 합성 하부 단면을 소비하므로 교차부에 임의 수평 상단이 생기지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 상부 창 외에 후문을 추가하지 않고 마당 위는 열린 영역으로 유지한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 외측 벽은 north가 만들고 실내/마당 안쪽 표면과 창 void는 원래 owner에 남는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 북서/북동 모서리와 높은 창 양면을 보므로 뒤쪽을 보이지 않는 면으로 면제하지 않는다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모 제실/마당의 차이를 같은 후면에서 박공과 낮은 석재 벽으로 구체화했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 일직선 외곽 안의 높이 변화로 두 공간 조건이 양립하여 후면 증축이나 숨은 문이 필요하지 않았다.
@evidenceReview settings/30-interiors.md#service-yard #bc0ce16 마당 후면은 제실 높이를 복사하지 않는 낮은 석재 면으로 정해져 있다.
@evidenceReview settings/20-envelope.md#roof-form #e18ede4 제실과 봉헌실 벽을 실제 경사 하부까지 닫아 roof 아래 누광도 반증 대상으로 남겼다.
-->

<!--
@evidence principles/core/common.md#scope-preservation 후면의 봉헌실·높은 제실 박공·낮은 서비스 마당 벽과 제실 상부 창을 모두 후면 외피로 배정한다.
@evidence principles/core/common.md#substantive-completion 후면을 일직선으로 잇되 실내 위 벽은 roof 하부까지, 마당 벽은 Y=2.55m까지 닫는다.
@evidence principles/core/common.md#declared-basis 평면은 north 기준선, 실내 위 상단은 합성 roof, 기단/회벽은 외피 canon에서 가져온다.
@evidence principles/design/spaces.md#space-topology 후문이나 숨은 방 문을 더하지 않고 마당의 열린 위쪽과 제실의 닫힌 박공을 구별한다.
@evidence principles/design/spaces.md#space-boundary-authority 북측 외측 표면과 벽 실체는 north, 창 void는 openings, 방/마당 안쪽 면은 각 공간에 남긴다.
@evidence principles/design/spaces.md#space-verification-address 후면·북서/북동 모서리·창 양면·마당 벽 위 단면으로 보이지 않는 뒤쪽 누락을 검사한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 제실과 서비스 마당의 서로 다른 공간 조건을 같은 후면에서 높은 박공과 낮은 벽의 높이 변화로 구현한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work sanctuary의 박공과 service-yard의 낮은 석재 벽을 한 후면에 대조했다. 일직선 외곽을 유지하며 높이만 달리 닫을 수 있어 후면 증축이나 숨은 문을 추가하지 않았다.
@evidence settings/30-interiors.md#service-yard 마당 후면의 낮은 석재 면을 제실 박공 높이와 분리한다.
@evidence settings/20-envelope.md#roof-form 제실과 봉헌실 위 벽을 실제 경사 하부까지 닫아 박공 실루엣을 남긴다.
-->

[기준선](../building.md#plan-datums)의 north-outer~north-inner를 따라 서측 봉헌실, 중앙 제실, 우측 서비스 마당의 후면을 잇는다. 외곽은 일직선이며 제실 위의 박공과 마당의 낮은 벽이 높이를 구별한다. 봉헌실 쪽 벽은 서측 날개의 실제 하부면까지, 제실 박공은 [제실 지붕](../roofs/sanctuary.md#sanctuary-roof)의 실제 하부면까지 닫는다. 지붕 교차 영역도 합성된 하부 단면을 소비해 누광 틈을 남기지 않는다. 서비스 마당 벽 상단은 Y=2.55m다.

제실 상부 창만 [채광구](../openings.md#clerestories)에서 소비하며 임의 후문이나 닫힌 방 문을 추가하지 않는다. 황토 면과 기단은 외피 재료 canon을 따르되 마당 경계는 석재 면으로 읽힌다. source `src/spaces/facades/north.ts`가 이 후면의 완결 외측 표면과 외벽 실체를 소유한다. 제실/봉헌실/마당 안쪽은 각 방에 남는다.

양끝 벽 실체는 [모서리 접합](../junctions.md#wall-junctions)으로 맞대고, 높은 끝벽은 [박공 폐쇄](../junctions.md#gable-closures)를 소비한다. 후면 입면, 북서·북동 모서리, 높은 창의 바깥과 안쪽, 마당 벽 위 단면을 관찰한다. 뒤쪽을 보이지 않는 면으로 취급해 빈 벽이나 지붕 누락을 남기면 실패다.

제실·봉헌실·낮은 마당 외벽의 하단은 모두 [층의 지면 접합](../storey.md#wall-ground-contact)을 소비한다. 지면 아래의 벽 연장도 이 입면이 소유하며 마당 벽의 상단 높이와 내부 공간 바닥은 바꾸지 않는다.
