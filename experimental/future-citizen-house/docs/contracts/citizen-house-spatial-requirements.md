# 시민 주택 공간 보존 계약

**Status:** production decision, 사용자 저작 브리프의 고정 공간 그래프를 위한 local contract.

## 시민 주택 공간 보존 {#citizen-house-spatial-requirements}

하나의 11×12m 직사각형 본채가 두 storey를 가진다. 1층 entry는 하나의 중앙 꺾임계단과 후면의 연속 living·dining·kitchen, 전면의 직접 연결 flex workroom, 우측 opaque service core를 가진다. 2층은 계단참에서 출발한 짧은 일자 corridor가 primary bedroom, 두 작은 bedroom, bathroom, storage를 실제 문으로 직접 연결한다.

source는 모든 room을 storey에 귀속시키고, 모든 required room이 door·corridor·single stair로 연결되며, curtainwall bay가 floor line과 room boundary에 맞는 결과를 낸다. 외관 reference를 닮게 하려고 courtyard, annex, bridge, cantilever, void, second stair, branch corridor, disconnected room을 도입하는 결과는 이 계약에 실패한다.

프라이버시는 electrochromic·translucent glass와 외부 shading으로 표현하고, glass surface를 이미지 texture나 billboard로 대체하지 않는다. 이 계약은 실제 건물의 구조·에너지·무장애 성능을 인증하지 않으며, 해당 측정이 없는 항목은 `unverified`로 남긴다.

Review question: 컴파일된 environment의 공간·경계·개구부·연결이 이 고정 그래프와 curtainwall/privacy 관계를 동시에 보존하는가?

Sources: [공간 기준](../settings/003-spatial-basis.md#ground-graph), [상층 그래프](../settings/003-spatial-basis.md#upper-graph), [납품 범위](../settings/001-production.md#delivery-scope).

