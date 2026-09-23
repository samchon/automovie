# 공간 층의 관찰 분모

## 공간 산출물에서 닫힐 질문과 완료 경계 {#space-observation-denominator}
<!--
@evidence contracts/observation-denominator.md#compiled-denominator 04가 외부와 방별 고정 질문을 산출물에서 파생하는 규칙을 두고, 방·입면·대지 H2는 각자 문 조작·사용 상태·단면 관찰을 더하며, 청회색 침실의 두 가려진 코너와 L형 현관·복도·서비스 통로의 꺾임은 추가 질문으로 적었다. 어느 H2도 관찰 수를 상수로 선언하거나 방을 합쳐 질문을 줄이지 않는다.
@evidence contracts/observation-denominator.md#dual-completion 04의 참조 비교는 관찰자 목록을 미수령으로 기록하고 다섯 비교를 unverified로 두며, 방과 입면 H2는 모두 실제 프레임·RENDERER·compiled topology가 없음을 밝힌다. 이 evidence 배치를 두 목록의 해소나 시각 승인으로 쓰지 않는다.
-->

[원문 분모](../../contracts/observation-denominator.md#compiled-denominator)는 외부 setting, 모든 노출 입면과 모서리, 지붕과 하부, 모든 개구부와 출입구, 그리고 방마다 threshold 하나·네 안쪽 모서리·중심 네 방향을 요구한다. spaces에서는 [관찰 파생](../../spaces/04-observations.md#spatial-observation-derivation)이 이 규칙을 공간 산출물에 연결한다. 관찰 수를 문서에서 선언하지 않고 실제 공간·boundary·opening·roof 레코드에서 파생한다.

각 owner는 자기 추가 질문을 더한다. 방 파일은 문을 조작하는 순간과 통과하는 순간, 기기나 서랍을 연 작업 상태를 구별한 관찰을 적는다. 입면과 지붕 파일은 모서리·처마 아래·교차부 단면을 적는다. 대지 파일은 외부 구역에도 threshold·코너·중심 방향 질문을 적는다. 비직사각 공간의 가려진 부분도 질문을 더한다. [청회색 침실](../../spaces/rooms/bedroom-three.md#bedroom-three-plan)의 린넨장 옆 두 코너, L형 [현관](../../spaces/rooms/entry.md#entry-plan), [상층 복도](../../spaces/rooms/upper-hall.md#upper-hall-plan), [서비스 통로](../../spaces/rooms/service.md#service-access-plan)의 꺾임이 그 예다. 사람이 들어가는 [옷방](../../spaces/rooms/wardrobe.md#primary-wardrobe-plan)은 수납이라는 이름을 이유로 관찰에서 빠지지 않는다.

[다섯 참조 비교](../../spaces/04-observations.md#reference-spatial-comparisons)는 이 분모에 추가되며 대체하지 않는다. 02 절개는 검사 모드의 비교일 뿐이고 온전한 외피의 내부 관찰을 대신하지 않는다.

[완료 경계](../../contracts/observation-denominator.md#dual-completion)는 저작자와 관찰자의 두 목록이 모두 비고 독립 리뷰어가 실제 그림을 판정해야 닫힌다. 관찰자 목록은 아직 받지 않았고, 집의 compiled topology와 그 GPU 프레임·RENDERER도 없다. 따라서 spaces의 evidence 지불은 문서 관계의 완성일 뿐이며 어떤 방이나 입면의 시각 완료도 뜻하지 않는다.
