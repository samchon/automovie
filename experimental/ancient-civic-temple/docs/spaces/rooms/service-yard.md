# 후면 우측 서비스 마당

## 주랑에 직접 닿는 열린 마당 {#yard-volume}

공간 ID `service-yard`의 본체는 [기준선](../building.md#plan-datums) east-room~east-inner, north-inner~yard-front다. 서쪽은 제실과 북쪽 주랑, 남쪽은 보관실, 북·동쪽은 낮은 외벽이다. 주랑과 만나는 서쪽 경계 구간은 north-ring~yard-front이며 그 안에 직접 문을 놓는다. 이 접면 밖 제실 쪽에 문을 내어 제실을 서비스 통로로 쓰지 않는다.

서쪽 `door-yard`와 동쪽 `door-service-exterior`의 문턱 바닥·통과 부피는 모두 [층의 배정](../storey.md#threshold-support)에 따라 이 마당이 소유한다. 서쪽은 주랑 쪽 벽면까지, 동쪽은 외벽 바깥면까지 연장하며 외부 지면의 소유를 가져오지 않는다.

동쪽 외부 서비스 문과 서쪽 주랑 문을 잇는 바닥은 [층 기준](../storey.md#ground-storey)의 Y=0이고 문턱은 0.02m 이하로 제한한다. 외부 문 너머도 실제 지면과 연결한다. 하늘은 열려 있고 마당 위에 동측 날개 지붕을 연장하지 않는다. 소수 운반 용기·바구니는 북동 모서리에 두어 두 문 사이 통행을 비운다.

source `src/spaces/rooms/service-yard.ts`는 마당의 내측 둘레 면과 포장·벽 상부 단면의 완결 표면을 맡는다. 외부 면은 북·동 입면이 각각 소유하되 같은 벽체를 중복 생성하지 않는다. 두 threshold, 네 안쪽 모서리, 중심 네 방향 및 외부→주랑 경로를 관찰한다. 마당을 두 번째 중앙 중정이나 별도 순환 고리로 읽히게 하는 문/복도는 허용하지 않는다.
