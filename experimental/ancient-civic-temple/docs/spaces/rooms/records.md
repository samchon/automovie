# 동측 기록실

## 건조 문서 보관과 열람 {#records-volume}

<!--
@evidenceReview principles/core/common.md#scope-preservation #24155e1 두루마리·궤·열람 역할을 건조 방에 남기고 옆방을 통과하는 문을 만들지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 북쪽 선반 앞 0.9m 이상을 비우고 동쪽 열람/궤를 배정해 접근을 수치로 제한한다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb records 기준선과 층의 문턱을 소비하므로 건조 상태가 임의의 높은 바닥을 뜻하지 않는다.
@evidenceReview principles/design/spaces.md#space-topology #3f8d925 남북 공유벽과 동쪽 외벽이 닫혀 있고 서쪽 주랑 문만 접근한다.
@evidenceReview principles/design/spaces.md#space-boundary-authority #d114e35 두루마리 수량은 instances에 남아 기록실 공간 owner가 population을 발명하지 않는다.
@evidenceReview principles/design/spaces.md#space-verification-address #a143ab1 선반 전면과 궤 앞을 추가 관찰해 닫힌 궤 표시 뒤의 접근 누락도 찾도록 했다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 부모의 문서 보관 용도에서 선반의 북벽 방향과 전면 깊이를 새로 결정했다.
@evidenceExcludeReview upstream/design/spaces.md#settings-and-map-revision-from-space-work #46f1b62 건조 보관과 궤의 사용을 같은 높이 바닥에서 예약했으며 물길이나 추가 방으로 해결하지 않았다.
@evidenceReview settings/30-interiors.md#records #9a95707 분수 물길을 연결하지 않는 본문이 기록실의 건조 조건과 일치한다.
@evidenceReview settings/35-objects.md#scrolls #eba3a8f 두루마리 칸 선반은 북벽에 실제 역할이 있고 수량만 후속 결정으로 남는다.
@evidenceReview settings/35-objects.md#chests #7077398 궤가 닫힌 표시 상태여도 앞의 여백 검사는 면제되지 않는다고 명시했다.
-->

<!--
@evidence principles/core/common.md#scope-preservation 건조 두루마리 보관·궤·열람대와 서쪽 직접 문을 남기고 관리실 또는 보관실을 통한 접근을 만들지 않는다.
@evidence principles/core/common.md#substantive-completion 북벽 칸 선반·동쪽 궤/열람대와 선반 앞 0.9m 이상 접근을 배정한다.
@evidence principles/core/common.md#declared-basis 방 전후 경계는 기준선, 건조 보관 역할은 기록실 설정, 문턱은 층의 배정을 따른다.
@evidence principles/design/spaces.md#space-topology 남북 공유 벽과 동쪽 외벽은 추가 구멍 없이 닫고 서쪽 문만 주랑에 연결한다.
@evidence principles/design/spaces.md#space-boundary-authority 내벽·바닥·낮은 천장은 records가 소유하되 두루마리 수량은 instances에 남긴다.
@evidence principles/design/spaces.md#space-verification-address 선반 전면·궤 앞과 서쪽 threshold를 내부 기본 관찰에 더해 열람 접근과 작성실 혼동을 확인한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 문서 보관 정체성에 북쪽 선반·동쪽 열람과 수치화한 전면 접근 깊이를 더한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work records의 건조 상태와 scrolls/chests의 보관 방식을 검토했다. 같은 층의 문턱과 빈 선반 전면으로 접근을 예약할 수 있어 물길이나 별도 보관실을 부모에 추가하지 않았다.
@evidence settings/30-interiors.md#records 선반·궤·열람대가 있는 건조 방으로 배정하고 분수 물길을 연결하지 않는다.
@evidence settings/35-objects.md#scrolls 북쪽 칸 선반의 두루마리 보관 역할을 유지하며 수량은 후속 배치에 맡긴다.
@evidence settings/35-objects.md#chests 동쪽 낮은 궤 앞 여백은 닫힌 표시 상태에서도 관찰 대상으로 남긴다.
-->

공간 ID `records`의 본체 경계는 [기준선](../building.md#plan-datums) east-room~east-inner, records-back~records-front다. 남쪽 관리실·북쪽 보관실과 공유 벽을 가지며 각 공유 벽은 개구부 없이 닫혀 있다. 서쪽 주랑으로 직접 문을 내고 동쪽 외벽에는 창을 추가하지 않는다.

동측 spine 안 `door-records`의 문턱 바닥과 통과 부피는 [층의 배정](../storey.md#threshold-support)에 따라 기록실이 소유한다. 방 본체의 건조 바닥이 이 구간을 지나 주랑 쪽 벽면까지 이어진다.

[기록실 정체성](../../settings/30-interiors.md#records)을 따라 북쪽 벽에 두루마리 칸 선반, 동쪽에 낮은 궤와 열람대를 배정한다. 선반 전면의 접근 깊이는 0.9m 이상을 예약하고 문 앞과 스툴 인출 영역은 비운다. 바닥은 주랑과 같은 높이의 건조한 상태다. 분수에서 이 방으로 이어지는 물길이나 배관 노출을 추가하지 않는다.

source `src/spaces/rooms/records.ts`가 내벽·바닥·낮은 천장을 모두 소유하며 두루마리 수량은 instances의 후속 결정이다. 서쪽 threshold와 네 모서리·네 방위 외에 선반 전면과 궤 앞을 관찰해 단순 작성실과 구별되는지 본다. 닫힌 궤 표시가 접근 여백의 검사를 면제하지 않는다.
