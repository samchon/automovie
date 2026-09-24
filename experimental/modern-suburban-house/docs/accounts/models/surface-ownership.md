# 모델 층의 완결 표면 소유

## 부재가 완결 표면을 쪼개지 않는 모델 배정 {#model-surface-ownership}
<!--
@evidence contracts/surface-ownership.md#whole-surface-owner models 00–05의 표면 H2 다섯 개와 00의 이름 규칙을 spaces/03-surface-owners.md의 입면·방 표면 배정과 대조했다. 모델 id는 창·문·난간·수납 부재 자체의 면(frame·sash·glass·leaf·jamb·casing·baluster·rod·shelf 등)에만 붙고 입면·방 벽·바닥·천장 면을 다시 소유하지 않으며, 기둥과 손잡이 표면은 spaces/02-stair.md 소유로 남겨 한 표면에 두 소유자가 생기지 않는다.
-->

[원문 계약](../../contracts/surface-ownership.md#whole-surface-owner)은 한 완결 표면에 한 소유자를 두고 후속 부재·모듈·마감 저작이 그 표면을 쪼개지 않기를 요구한다. models에서는 [표면 이름 규칙](../../models/00-model-frame.md#model-surface-partition-naming)이 부재 역할별 id만 정하고 색·광학값은 materials에 남긴다.

대조 방법은 표면 H2 다섯 개를 한 줄씩 읽어 각 id가 부재 자체의 면인지, spaces가 이미 소유한 입면·방·층 면인지를 가르는 것이다. [창](../../models/01-windows.md#window-surface-partitions)은 8개 id가 모두 창 부재 면이고 벽의 reveal은 spaces 방 owner 소유로 남는다. [외부 문](../../models/02-exterior-doors.md#exterior-door-surfaces)은 문짝·문설주·문턱·레일 면만 소유하고 포치·차도 바닥은 spaces site owner 소유다. [실내 문](../../models/03-interior-doors.md#interior-door-surfaces)은 문설주와 casing을 벽면별 -a/-b로 나누되 벽 마감 면 자체는 방 owner 소유다. [난간](../../models/04-stair-members.md#stair-member-surfaces)은 baluster·bottom-rail만 소유하고 기둥·손잡이는 spaces/02-stair.md 소유다. [수납](../../models/05-closet-fittings.md#closet-fitting-surfaces)은 문짝·레일·봉·선반만 소유하고 장 내부 벽은 entry·upper-hall owner 소유다. 결과는 5개 H2 모두 중복 소유 0건, 분할된 spaces 표면 0건이다. 10–15 가구 H2의 id는 가구 부재 면이며 가구 에이전트의 대조 범위다. 실제 source 표면과 바인딩은 unverified다.
