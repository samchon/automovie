# 전면 박공의 오른쪽 경사면

## 계단 창 쪽으로 내려가는 박공 {#front-gable-right-roof}

`roof.front-gable.right`는 [박공 중심](00-junctions.md#roof-mass-allocation)보다 +X 쪽의 면이며 `src/spaces/roof/front-gable-right.ts`가 소유한다. [F의 오른쪽 기울기와 아래면](00-junctions.md#roof-profile-datums), [동일 골짜기](00-junctions.md#roof-shared-edges)를 받는다. 왼쪽은 박공 용마루, 앞은 전면 사선 모서리, 뒤쪽은 주 지붕 앞 면과 만나는 골짜기다.

이 면이 계단 창 앞까지 내려와 창을 덮는지 [전면 경계](../envelope/front.md#front-roof-closures)와 함께 검사한다. 박공 트림·아래면·주 지붕 합류를 별도 장식 판으로 겹치지 않는다. 검사 주소는 오른쪽 골짜기 끝과 계단 창 위 처마의 정면/측면 단면, 박공 정면의 사선이다. 실제 창 치수와 source가 없어 개구부 간섭·윤곽·그림자 판정은 unverified다.
