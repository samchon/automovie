# 주랑의 남북 덮개

## 북쪽 연결 지붕 {#north-canopy}

<!--
@evidence principles/core/common.md#scope-preservation 제실 남벽과 중정 사이 북쪽 주랑 전체를 한 외쪽 경사로 덮고 북동 구간과 마당 쪽 끝, 두 모서리 골을 남긴다.
@evidence principles/core/common.md#substantive-completion court-back 지지선 Y=3.20m에서 북쪽으로 12도 올라가는 평면과 west-ring~east-room+돌출, north-ring~court-back+돌출의 후보 영역을 정한다.
@evidence principles/core/common.md#declared-basis 경사·두께·날개 합성은 assembly를 소비하며 제실 남벽 앞 상면 약 3.65m는 입력 산술로만 적는다.
@evidence principles/design/spaces.md#space-topology 마당 자체의 하늘은 열어 두고 마당에 닿는 북동 주랑 구간 위는 같은 외쪽 지붕으로 계속 덮는다.
@evidence principles/design/spaces.md#space-boundary-authority 모든 조각은 같은 colonnade roof surface에 남고 기둥 위 보/서까래의 내부 하부는 주랑 공간에 귀속한다.
@evidence principles/design/spaces.md#space-verification-address 제실 문 위 만남, 북서·북동 골, 마당 쪽 끝, 제실 남처마 아래 틈, 중정 처마를 보며 창 가림과 모서리 구멍을 실패로 삼는다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 연속 주랑 덮개를 제실 남벽에서 끝나는 외쪽 경사와 제실 처마 아래로 이어지는 영역으로 결정한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work colonnade의 연속 지붕과 service-yard의 열린 하늘을 외쪽 경사에 대조했다. 수리된 roof-form의 외쪽 범위로 제실 남벽 앞 높이를 창대 아래에 둘 수 있어 이 단위가 부모에 추가 결함을 드러내지 않았다.
@evidence settings/20-envelope.md#colonnade 북동 모서리까지 덮임을 이어 같은 주랑이 중간에서 무지붕 구간으로 끊기지 않게 한다.
@evidence settings/20-envelope.md#roof-form 중정 쪽으로 기우는 12도 외쪽 경사와 제실 박공 아래로 들어가는 높은 끝을 정한다.
-->

<!--
-->

북쪽 덮개는 [주랑 북쪽 cell](../rooms/colonnade.md#ring-volume)을 덮는 외쪽 지붕이다. 지지선은 court-back이며 그 위치의 상면이 [공통 지지 높이](assembly.md#roof-junctions)의 주랑 처마 값이고, 상면은 북쪽으로 12도 올라가 [제실 남벽](../openings.md#boundary-ownership)의 주랑 쪽 면 north-ring에서 끝난다. 그 위치의 상면은 입력 산술상 약 3.65m로 제실 박공 채광구의 창대보다 낮다. 이전의 N(Z)·G(X) 최소 높이 제한은 제실이 날개보다 높아져 필요 없어 폐기했다.

후보 영역은 X로 west-ring부터 마당 쪽 east-room에 공통 돌출을 더한 선까지, Z로 north-ring부터 court-back에 공통 돌출을 더한 중정 쪽 처마까지다. 서쪽 west-ring~west-court 구간은 [서측 지붕](west.md#west-roof)과, 동쪽 east-court~east-ring 구간은 [동측 박공](east.md#east-roof)과 날개 합성해 두 모서리 골이 된다. 마당과 맞닿는 동쪽 끝은 east-room에서 0.35m 돌출한 박공 끝이며 서비스 마당 자체의 하늘은 열려 있다. 제실 남쪽 처마는 이 덮개 위에 떠 있고 이 덮개를 지우지 않는다.

source `src/spaces/roofs/colonnade.ts`가 북쪽 덮개의 상면과 외부 끝 두께를 소유한다. 기둥 위 보·서까래 하부는 주랑의 완결 내부 표면에 결속한다. 마당 쪽 북동 주랑 cell도 덮여 있어야 한다. 관찰은 제실 문 위 만남, 북서·북동 골의 양쪽, 마당 쪽 끝, 제실 남처마와 덮개 사이, 중정 쪽 처마 하부다. 창을 덮거나 모서리에 구멍이 나면 실패다. 덮임과 합성은 설계이며 실제 부재 지지·시각 결과는 source와 GPU 관찰에서 확인한다.

## 남쪽의 낮은 지붕 {#south-canopy}

<!--
@evidence principles/core/common.md#scope-preservation 중정 남쪽 주랑과 양쪽 꼬리 구간의 덮임, 현관 몸체를 비운 경계, 남서·남동 골과 남측 파라펫 앞 끝을 함께 보존한다.
@evidence principles/core/common.md#substantive-completion court-front 지지선 Y=3.20m에서 남쪽으로 12도 올라가는 평면과 현관 후퇴벽·반환벽을 비운 세 후보 영역을 정한다.
@evidence principles/core/common.md#declared-basis 경사·두께·날개 합성은 assembly, 현관 몸체의 경계는 기준선과 현관 소유에서 받고 남측 파라펫 앞 상면 약 3.95m는 산술로 적는다.
@evidence principles/design/spaces.md#space-topology 현관 몸체만 비우고 양쪽 꼬리와 남쪽 주랑은 같은 외쪽 지붕으로 덮어 포치 하나가 뒤쪽 주랑까지 덮었다고 간주하지 않는다.
@evidence principles/design/spaces.md#space-boundary-authority 남북 덮개는 같은 roof owner이며 주랑 안쪽 보/천장은 공간 owner에 남기고 후퇴벽·반환벽의 외면은 남측 입면이 맡는다.
@evidence principles/design/spaces.md#space-verification-address 후퇴벽 뒤 만남, 반환벽 바깥 면과의 접합, 남서·남동 골, 중정 남처마 하부로 누락과 누광을 확인한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 낮은 주랑 덮개를 파라펫 뒤 외쪽 경사와 현관 몸체를 비운 영역으로 구체화한다.
@evidenceExclude upstream/design/spaces.md#settings-and-map-revision-from-space-work entrance-porch의 물린 작은 박공과 colonnade의 연속 덮임을 외쪽 경사에 대조했다. 현관 몸체를 비우고 반환벽을 파라펫으로 올리면 둘 다 유지되어 이 단위가 부모 결함을 드러내지 않았다.
@evidence settings/20-envelope.md#entrance-porch 현관 몸체를 덮개 후보에서 비워 파라펫 사이의 작은 정면 박공이 가려지지 않게 한다.
@evidence settings/20-envelope.md#colonnade 남쪽 주랑과 두 꼬리의 덮임을 포치와 별도로 남겨 한 고리의 지붕 관계를 유지한다.
-->

<!--
-->

남쪽 덮개는 외쪽 지붕이다. 지지선은 court-front이며 그 위치의 상면이 [공통 지지 높이](assembly.md#roof-junctions)의 주랑 처마 값이고, 상면은 남쪽으로 12도 올라가 [남측 파라펫](../facades/south.md#south-envelope)의 안쪽 면 south-inner에서 끝난다. 그 위치의 상면은 입력 산술상 약 3.95m다. 이전의 X 방향 용마루 박공과 포치 처마 폭 notch는 파라펫 뒤 외쪽 경사로 대체해 폐기했다.

후보 영역은 세 개다. court-front에 공통 돌출을 뺀 중정 쪽 처마선부터 entrance-back까지는 west-inner~east-ring 전 폭이고, entrance-back~south-inner는 west-inner~west-porch-outer와 east-porch-outer~east-ring의 두 꼬리다. 현관 후퇴벽과 두 반환벽, [포치](porch.md#porch-roof)가 차지하는 현관 몸체는 비운다. 서쪽으로 west-inner까지 이어지는 부분은 [서측 지붕](west.md#west-roof)과, 동쪽 east-court~east-ring은 [동측 박공](east.md#east-roof)과 날개 합성해 남서·남동 골이 된다. 두 꼬리는 반환벽의 주랑 쪽 면에서 끝나며 반환벽은 파라펫 높이로 올라 이 덮개 위로 솟는다.

source는 북쪽과 같은 주랑 지붕 owner다. 이는 한 완결 주랑 덮개의 남북 구성이지 서로 다른 사람이 같은 면을 반씩 만드는 분담이 아니다. 주랑 내부의 보·천장 노출면은 주랑 공간 owner에 남긴다. 후퇴벽 뒤 만남, 반환벽 바깥 면과의 접합, 남서·남동 골, 중정 남쪽 처마 하부를 관찰하고 포치만으로 뒤쪽 주랑까지 덮였다고 세지 않는다.
