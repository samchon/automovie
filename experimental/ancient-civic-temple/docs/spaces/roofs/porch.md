# 정면 포치의 작은 박공

## 두 기둥 위의 입구 지붕 {#porch-roof}

[현관](../rooms/entrance.md#entrance-volume) 양옆의 west-porch/east-porch를 지지선으로 하고 Z는 entrance-front~south-outer다. 포치 지지선 위치의 지붕 상면은 Y=3.38m이며 경사·돌출·법선 두께와 하부면 유도는 [공통 지붕 입력](assembly.md#roof-junctions)을 쓴다. 기둥 위 보는 상면 수치가 아니라 실제 하부면에 접촉한다. 용마루는 X=0을 따라 정면을 향하고 작은 삼각 박공이 넓은 회벽 중앙에 놓인다. 포치 바닥·기둥은 직사각 외곽 안이고 처마 돌출만 바깥으로 나올 수 있다.

source `src/spaces/roofs/porch.ts`가 포치 전체 상면·박공 트림 결속면·외부 처마 하부를 소유한다. 두 원주→수평 보→박공의 지지 관계를 실제 부재에서 보존하고 지붕이 공중에 떠 있지 않게 한다. 남쪽 주랑 지붕과 만나는 뒤끝은 assembly 규칙으로 닫는다. 정면·양사선·문턱에서 올려다본 하부, 접합 단면을 관찰한다. 원주·트림의 상세 geometry와 마감은 아직 만들어지지 않았다.
