# 연속 주랑

## 구멍 있는 하나의 주랑 공간 {#ring-volume}

공간 ID `colonnade`는 [지상층](../storey.md#ground-storey)의 내부/반외부 연결 공간이다. 평면은 [공유 기준선](../building.md#plan-datums)의 west-ring~east-ring, north-ring~south-inner 사각 영역에서 중정과 현관 후퇴부를 뺀 하나의 연결 영역이다. 중정 구멍을 포함하는 외접 상자 전체를 실내로 선언하지 않는다.

겹치지 않는 cell 분해는 북쪽(west-ring~east-ring, north-ring~court-back), 서쪽(west-ring~west-court, court-back~court-front), 동쪽(east-court~east-ring, court-back~court-front), 남쪽(west-ring~east-ring, court-front~entrance-back), 남서 꼬리(west-ring~west-porch-outer, entrance-back~south-inner), 남동 꼬리(east-porch-outer~east-ring, entrance-back~south-inner)다. 반환벽 두께는 cell 밖에 남기고 현관 쪽 빈 공간에도 포함하지 않는다. cell은 공간 내부를 설명하는 도구이며 새 방이나 독립 복도가 아니다. 인접 cell의 접면은 막힌 벽 없이 맞닿는다.

[주랑 정체성](../../settings/20-envelope.md#colonnade)의 기둥 열은 중정 경계 쪽에 두고 주랑에 돌출하는 기단/주두 평면 폭은 경계에서 최대 0.35m다. 북·동·서쪽 명목 폭에서 이를 뺀 여유는 1.75m이고 남쪽 현관 후퇴벽 앞은 1.60m다. 이는 배치 전 예산이며 [사용 포락](../../settings/10-building.md#use-profile)의 유효폭 검사는 문짝·기둥·집기 배치 후 다시 한다. 문 앞을 기둥이 막는 반복 규칙은 채택할 수 없다.

source `src/spaces/rooms/colonnade.ts`가 한 공간과 내부 벽 마감·바닥·천장 노출면 전체를 소유한다. 기둥 prototype 자체는 models의 한 소유이고 여기서 원주의 표면을 쪼개지 않는다. 관찰은 여섯 cell의 중심 네 방위, 외측·중정측·현관 후퇴부 모서리, 모든 직접 문과 바닥 이어짐이다. 외접 상자 중앙이 중정에 있다는 이유로 주랑 중심 관찰을 방 밖에서 답하지 않는다.
