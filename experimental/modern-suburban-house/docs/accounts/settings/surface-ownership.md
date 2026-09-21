# 표면 소유 인계의 설정 배분

## 공간 경계에서 부재와 마감까지 {#surface-handoff}
<!--
@evidence contracts/surface-ownership.md#whole-surface-owner surface-allocation은 입면·방 내부·층 바닥과 천장·계단 구멍·접합의 owner와 파일을 1단계에 배정하고 build-allocation은 부재·반복·마감 branch의 역할을 나눈다. 같은 완결 면은 branch가 달라도 한 저작자가 동일 기준으로 통합하며 실제 census는 spaces의 인계 산출물로 남는다.
-->

[surface-allocation](../../settings/20-verification.md#surface-allocation)은 [완결 표면 원문](../../contracts/surface-ownership.md#whole-surface-owner)을 1단계 폐쇄 조건으로 삼는다. [lifecycle-boundary](../../settings/20-verification.md#lifecycle-boundary)는 매스·공간 그래프와 이 선언을 함께 닫은 뒤 외피와 반복 모듈로 가도록 정하므로 큰 소스 파일로 외피부터 만들고 뒤늦게 나누는 순서를 허용하지 않는다. 한 명이 전부 구현하는 경우도 표면 및 파일 경계의 누락 사유가 되지 않는다.

[build-allocation](../../settings/00-production.md#build-allocation)의 spaces·models·materials·instances는 독립된 작업 종류이며 같은 벽을 서로 다른 좌표와 반복 기준으로 다시 소유하는 권한이 아니다. 입면 외부와 방 안쪽은 다른 완결 면이지만 공유 벽체의 기준은 원문에 따라 하나여야 한다. 개구부 둘레와 계단 구멍·층판 접합도 배정 범위이고, openings와 stair의 실제 두께 및 통행 개구부 요구를 면 배정에서 빠뜨릴 수 없다.

이 account는 settings 전체가 부담하는 인계 책임을 연결한다. 실제 surface id·경계·담당 저작자·소스 파일별 목록은 topology가 생기는 1단계의 산출물이다. 아직 그 목록을 작성하거나 누락·중복 검사를 마쳤다는 주장은 없으며 면별 배정의 실제 충족은 unverified다. 표면을 공유하는 branch 사이의 역할 배분만으로 실제 census를 대신하지 않는다.
