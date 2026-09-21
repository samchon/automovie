# 비워 둔 차고 내부

## 머드룸 연결과 비어 있는 바닥 {#garage-interior-plan}

`garage`는 ground-storey의 부속 공간이다. 외곽·공유 벽·안쪽 면은 [차고 외곽 owner](../00-building.md#attached-garage-extent), 바닥/천장 높이는 [문턱 datum](../01-storeys.md#ground-threshold-datums)을 소비한다. 독립적으로 두 번째 차고 상자나 외벽을 만들지 않는다. [머드룸 문](laundry.md#laundry-plan)은 이 방 서쪽 경계에 실제 개구부로 바인딩되고 실내 진입 뒤의 평탄 대기도 같은 결정을 받는다.

정면에는 닫힌 두 대 폭 패널문 하나를 두며 정확한 정면 void·레일·수납 배치는 아직 미완료다. 문이 닫혀도 머드룸을 통해 내부 관찰에 도달한다. 초기 가구/차량 점유를 비우되, [설정이 요구하는 선반·공구와 차고 구조](../../settings/10-house.md#garage)를 면제하지 않는다. 자동차·주차용 가짜 실루엣·차량의 일부는 추가하지 않는다.

`src/spaces/rooms/garage-interior.ts`가 완결 내부를 소유한다. 앞문·문 레일·천장·저장 가구를 넣은 뒤의 경계와 머드룸 접근, 각 코너의 실내 pose, 콘크리트 바닥과 문 구조의 읽힘을 검사한다. 실제 room/storey binding·동선·부재·GPU 관찰은 unverified다.
