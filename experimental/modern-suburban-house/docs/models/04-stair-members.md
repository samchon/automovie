# 계단 난간살과 아래 부재

## 난간살의 단면과 반복 {#stair-balusters}

[계단 경계 높이 owner](../spaces/02-stair.md#stair-boundary-heights)가 모델에 남긴 것은 기둥·손잡이 사이를 채우는 검은 수직 철제 난간살의 부재와 반복이다. 기둥과 손잡이는 spaces source가 [양쪽 0.075 m 예약](../spaces/02-stair.md#stair-clearance) 안에 이미 만들므로 이 모델은 다시 만들지 않는다. 난간살은 [단일 꺾임계단 설정](../settings/10-house.md#stair)의 가는 철제 수직살을 위해 한 변 0.02 m의 정사각 단면으로 택하며, 0.075 m 예약의 가운데 선에 두어 통행 쪽 점유가 예약선을 넘지 않는다. 한 구간의 유효 길이 L(양 끝 기둥 안쪽 사이)에서 난간살 개수는 n = ceil((L - 0.10) / 0.12)로 산출하고 간격은 (L - 0.02n) / (n + 1)로 같게 나눠 owner의 빈 간격 0.10 m 이하를 지킨다.

국소 원점은 난간살 아래 끝 중심, 국소 +Y는 world +Y이며 모든 난간살은 rigid이고 관절 인터페이스가 없다. 위 끝은 손잡이 아래면까지, 아래 끝은 [아래 부재](#stair-bottom-member)의 윗면까지다. 표면 id는 [이름 규칙](00-model-frame.md#model-surface-partition-naming)에 `baluster`를 더해 쓴다. 소스 owner는 `src/models/stair-baluster.ts`이며 검사 주소는 02가 적은 현관에서 보이는 아래 flight, 중간참 두 방향, 상부 도착과 복도 가장자리다.

## 디딤과 복도 가장자리의 아래 부재 {#stair-bottom-member}

경사진 flight와 중간참에서는 별도 아래 가로대를 두지 않고 난간살을 각 디딤과 참 위에 직접 세운다. 경사 가로대는 디딤 뒤쪽에서 챌판 높이만큼 삼각형 틈을 만들어 [owner의 아래 빈 높이 0.10 m 이하](../spaces/02-stair.md#stair-boundary-heights)를 어길 수 있기 때문이다. 상층 복도의 평탄한 추락 경계에서는 upper-storey 바닥 위 0.05 m에 아랫면을 둔 높이 0.04 m, 폭 0.04 m의 검은 `bottom-rail`을 두고 그 위에 난간살을 세운다. 소스 owner는 `src/models/stair-baluster.ts`이며 디딤별 측면 단면과 복도 가장자리 단면으로 검사한다.

## 난간 부재의 표현 한계 {#stair-member-fidelity}

[표현 상한](00-model-frame.md#model-representation-ceiling) 안에서 용접부·고정 볼트·받침판은 만들지 않는다. 난간살 반복이 보호 성능이나 법규 적합을 증명하지 않는다. 검사 주소는 [모델 리뷰 뷰 목록](00-model-frame.md#model-review-set)이며 실제 렌더는 unverified다.
