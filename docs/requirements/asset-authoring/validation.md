# 자산 검증

## 사용 전 자산 검증 {#asset-validation}

자산은 scene에 배치되기 전에 구조, scale, topology, material, rig, state, resource bound와 provenance가 선언된 용도에 맞는지 검증할 수 있어야 한다.

### 형상 검증 {#asset-geometry-validation}

명시한 physical source 대응의 정점 수·table 참조·domain·ID와 현재 alias 위치를 검증하고, 잘못된 대응을 좌표 welding으로 대체하지 않아야 한다. 서로 다른 source point의 접촉은 그 자체로 shared edge를 만들지 않으며, 실제로 같은 edge에 세 면이 붙거나 같은 방향으로 반복되는 위상은 계속 거부한다. 대응의 변경과 legacy 정점의 현재 좌표 partition 변경은 이전 위상 판정을 재사용할 근거를 무효화한다.

Degenerate surface, non-finite coordinate, inverted orientation, invalid solid, unintended self-intersection과 missing region을 탐지해야 한다.

### 동작 가능성 검증 {#asset-rig-validation}

Joint hierarchy, range, dependency, skin binding, morph target와 named state가 서로 일관되고 motion consumer가 요구하는 control을 제공하는지 확인해야 한다.

### 표면 검증 {#asset-surface-validation}

Material assignment, texture coordinate, channel, color space, pattern boundary와 physical thickness가 누락되거나 충돌하는지 확인해야 한다.

### 목적별 적합성 {#asset-purpose-validation}

같은 asset이라도 collision, close-up, crowd proxy, shadow, reflection, drawing과 repaint guide에 필요한 정보가 다를 수 있으므로 사용 목적별 충족 여부를 구분해야 한다.

### Representation과 bounds 검증 {#asset-representation-bounds-validation}

선택된 representation의 용도, bounds, LOD 전환 조건, material region, rig control과 state 지원 범위가 원본 계약과 일치하며 stale derivative나 지원되지 않는 차이가 없는지 확인해야 한다.

### 외부와 생성 자산 검증 {#asset-external-generated-validation}

외부 또는 생성 자산은 채택된 bytes, source와 derivation, license와 사용 조건, 좌표와 단위, resource closure, 지원 feature와 미확인 특성을 함께 검증해야 한다.

### 검증 gap의 보존 {#asset-validation-gap}

검증하지 못한 특성은 성공으로 간주하지 않고 unknown 또는 unsupported 상태로 남겨야 한다.
