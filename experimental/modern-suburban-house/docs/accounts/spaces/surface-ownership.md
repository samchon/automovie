# 공간 층의 완결 표면 소유

## 소스 저작 전에 닫힌 표면 배정 {#space-surface-ownership}
<!--
@evidence contracts/surface-ownership.md#whole-surface-owner 03의 외부 표면 배정과 방 내부 배정이 입면별·방별·층별 owner와 source 파일을 선언하고, 47개 문서 본문의 `src/spaces/...` 경로를 03과 대조한 결과 네 입면·여덟 지붕 경사면·열다섯 방 문서와 대지 포장·울타리 문서가 03과 같은 파일을 자기 owner로 적었으며 03 밖의 경로는 datum만 소유하는 `src/spaces/storeys.ts` 하나다. `building.ts`·`roof/junctions.ts`·`openings.ts`·`boundaries.ts`·`site.ts`는 표면을 소유하지 않고 실제 surface id·면 개수·census는 source 이후로 남는다.
-->

[원문 계약](../../contracts/surface-ownership.md#whole-surface-owner)은 1단계를 닫을 때 입면별·방별·층별 소유자와 저작 파일을 선언하고 한 표면을 쪼개지 않기를 요구한다. spaces에서는 [외부 표면 배정](../../spaces/03-surface-owners.md#exterior-surface-handoff)과 [방 내부 배정](../../spaces/03-surface-owners.md#interior-surface-handoff)이 이 선언을 맡는다.

이번 evidence 배치에서 47개 문서 본문에 나오는 `src/spaces/...` 경로를 모두 뽑아 03의 표와 대조했다. 네 입면 문서는 각각 `src/spaces/envelope/<면>.ts`, 여덟 지붕 경사면 문서는 `src/spaces/roof/<면>.ts`, 열다섯 방 문서는 `src/spaces/rooms/<방>.ts`, 대지 문서는 `src/spaces/site/<포장>.ts`와 `fence.ts`를 자기 owner로 적었고 모두 03의 배정과 같다. 03 밖에서 새로 나온 경로는 [층 datum](../../spaces/01-storeys.md#storey-datums)의 `src/spaces/storeys.ts` 하나이며 datum만 소유하고 표면은 없다.

공유 계산 파일은 표면을 소유하지 않는다. `building.ts`, `roof/junctions.ts`, `openings.ts`, `boundaries.ts`, `site.ts`는 좌표·교차·개구부 형식·접합 구역·외부 접속만 계산해 전달한다. 같은 벽의 외부 완결 면은 입면 owner, 방 안쪽 면은 방 owner가 갖지만 구조 기준은 [공유 벽 배정](../../spaces/07-boundary-assembly.md#interior-boundary-ownership)과 [외벽 접합](../../spaces/07-boundary-assembly.md#exterior-boundary-junctions)이 하나로 정한다.

표의 담당 저작자는 이 production의 단일 저작자다. 표면을 다른 저작자에게 넘길 때는 완결 면을 통째로 넘기며 부재·반복·마감을 따로 나누지 않는다. 표의 source 파일은 아직 없고 실제 surface id·면 개수·누락/중복 census는 source와 compiled 산출물이 생긴 뒤에만 확인할 수 있어 현재 unverified다.
