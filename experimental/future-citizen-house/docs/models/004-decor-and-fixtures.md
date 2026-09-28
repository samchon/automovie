# 소품과 등기구 모델

[공통 주소와 중립 관찰](000-representation.md#model-address-and-scale)을 참조한다.

## 낮은·높은 실내 화분 {#potted-plant}

<!--
@evidence principles/core/common.md#scope-preservation 다섯 높이의 화분·흙·줄기·가지·잎만 내고 비하중 줄기–가지·가지–잎의 점 접촉을 명시한다.
@evidence principles/core/common.md#substantive-completion 각 H에서 닫힌 화분벽·흙과 가지 다섯·잎 열다섯을 전개하고 생산자가 실제 AABB 합집합을 재생성한다.
@evidence principles/core/common.md#declared-basis ref03의 작은 조리대 식물, ref04의 책장 식물, ref02의 바닥 화분을 받고 크기별 비례식과 방위는 이 모델 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation household-program의 생활 흔적과 surface-decomposition의 실내 식물 형상 소유에 다섯 높이의 pot·stem·잎 원형을 더한다.
@evidence principles/design/models.md#representation-contract 화분 내부를 비우고 흙을 넣으며 잎은 앞뒤 normal이 있는 얇은 닫힌 쐐기로 낸다.
@evidence principles/design/models.md#spatial-convention 바닥 중심 원점, 위 +Y, 관찰 앞 +Z로 두고 가지 방위는 +X에서 +Z로 0°·75°·150°·225°·300°다.
@evidence principles/design/models.md#reviewable-structure 45°와 상부에서 열린 화분, 흙, 가지 사이 공백과 점 접촉 잎을 확인하고 방 거리에서 높이별 실루엣을 본다.
@evidence principles/design/models.md#model-observable-style-basis ref03·04의 소형 화분과 ref02의 바닥 식물을 크기별 역할로 받되 식물 종이나 생장 성능은 정하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 다섯 heights 상태마다 pot·soil·stem·branch·leaf 점유의 축별 극값으로 envelope를 재며 15잎을 빠뜨리지 않는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work household-program의 생활 물품 범위와 surface-decomposition의 실내 화분·식물 모델 책임을 시험했다. 다섯 높이의 pot 바닥 접촉과 비하중 잎 상태는 실내 소품 원형에 닫히고 어느 방의 새 기능·지붕 접합도 요구하지 않는다.
@evidenceExclude spaces/003-surface-ownership.md#roof-face 지붕·PV canopy·배수 접합은 건축 roof owner가 만든다. 이 H2의 낮은·높은 화분은 실내에 놓는 pot·stem 원형이며 외부 수목이나 지붕 표면을 형성하지 않는다.
@evidence settings/002-household.md#household-program 방을 식별하는 생활 물품 범위 안에서 작은 실내 화분과 바닥 화분을 저작 선택으로 둔다.
@evidence settings/003-spatial-basis.md#surface-decomposition 실내 화분·식물의 재사용 pot·stem·leaf 형상과 face 주소를 models가 소유한다.
-->

화분의 바닥과 벽은 한 닫힌 원뿔대 껍질이다. 아래 기호는 같은 H2의 `@plant-spec` 필드를 뜻한다. 바닥 두께는 벽 두께 t=max(wallMinimum,wallFactor×H)와 같고, 흙은 y=t..soilSurface×H에서 그 내벽 반경을 채운다. 줄기 반경은 stemRadius×H, 가지 끝 반경은 branchRadius×H다. 가지 중심선은 줄기의 24각 단면 꼭짓점 방위에서 (stemRadius+branchRadius)H 떨어져 시작해 거기서 branchLength×H만큼 뻗는다. 가지 밑동과 끝에는 공통 관 끝 규칙의 반구를 붙인다. 밑동 반구의 줄기 쪽 극점 하나는 줄기 원통 외벽의 같은 높이·방위 한 점에 정확히 접하며, 이 줄기–가지 접선은 비하중 식물 접점 예외의 선언된 접점이다. 잎 세 장의 단일 시작점은 가지 끝 구의 바깥 방사면 (stemRadius+branchRadius+branchLength+branchRadius)H에 있다. 각 잎은 이 점을 꼭짓점으로 하고 끝면에서 최대 접선 폭 leafWidth×H, 길이 leafLength×H, 바깥 방사방향 두께 leafThickness×H를 갖는 닫힌 다섯 꼭짓점 쐐기다. 끝면 중심은 가지의 방사축을 유지하고 접선 방향으로 −leafFanDegrees°·0°·+leafFanDegrees°의 길이 성분만큼 벌어지며 Y 상승은 해당 각도의 코사인 성분이다. 잎 두께는 시작점에서 0이고 끝면에서 leafThickness×H이며 가지 구의 안쪽으로 대칭 확장하지 않는다. 세 잎은 가지 끝 구와 각각 정확한 시작점 하나에서 접하고 서로 그 점만 공유한다. 다섯 가지의 방위는 +X에서 +Z 방향으로 `branchAzimuthsDegrees`의 0°·75°·150°·225°·300°다. 다섯 방위 모두 줄기 24각의 꼭짓점이며 이웃 간격은 75°·75°·75°·75°·60°다. `model-plant-producer.cjs`는 이 식과 `heights`의 다섯 상태에서 표를 재생성하고 `plantProof`는 상태마다 생성 행을 읽고 줄기의 24각 변까지의 최단거리와 가지–잎 접점을 계산한다.

@plant-spec: {"heights":[180,280,600,800,1100],"potHeight":0.34,"potTopRadius":0.19,"potBottomRadius":0.15,"wallMinimum":0.006,"wallFactor":0.018,"soilSurface":0.34,"stemRadius":0.014,"stemTop":0.84,"crownDiameterLimit":0.60,"branchStart":0.48,"branchPitch":0.09,"branchLength":0.18,"branchRadius":0.006,"branchAzimuthsDegrees":[0,75,150,225,300],"leafLength":0.16,"leafWidth":0.055,"leafThickness":0.003,"leafFanDegrees":25}

선언 점유는 `@plant-spec.crownDiameterLimit`×H 수관 상한을 사방으로 남겨 둔 상자가 아니라, 고정된 다섯 방위에서 실제 pot·soil·stem·branch·leaf 부품 AABB의 축별 최솟값과 최댓값이다. 생산자는 이 합집합을 높이 변종마다 계산한다.

@cap-contact 180: soil, stem, Y, +
@cap-contact 280: soil, stem, Y, +
@cap-contact 600: soil, stem, Y, +
@cap-contact 800: soil, stem, Y, +
@cap-contact 1100: soil, stem, Y, +


<!-- @generated-plant-parts:start -->
@inventory 180: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
@plant-join 180: branch-0, 0.0036, 0.0864, 0, 0.036, 0.0864, 0, 0.00108
@plant-apex 180: leaf-0, 0.03708, 0.0864, 0
@plant-apex 180: leaf-1, 0.03708, 0.0864, 0
@plant-apex 180: leaf-2, 0.03708, 0.0864, 0
@plant-join 180: branch-1, 0.000932, 0.1026, 0.003477, 0.009317, 0.1026, 0.034773, 0.00108
@plant-apex 180: leaf-3, 0.009597, 0.1026, 0.035817
@plant-apex 180: leaf-4, 0.009597, 0.1026, 0.035817
@plant-apex 180: leaf-5, 0.009597, 0.1026, 0.035817
@plant-join 180: branch-2, -0.003118, 0.1188, 0.0018, -0.031177, 0.1188, 0.018, 0.00108
@plant-apex 180: leaf-6, -0.032112, 0.1188, 0.01854
@plant-apex 180: leaf-7, -0.032112, 0.1188, 0.01854
@plant-apex 180: leaf-8, -0.032112, 0.1188, 0.01854
@plant-join 180: branch-3, -0.002546, 0.135, -0.002546, -0.025456, 0.135, -0.025456, 0.00108
@plant-apex 180: leaf-9, -0.02622, 0.135, -0.02622
@plant-apex 180: leaf-10, -0.02622, 0.135, -0.02622
@plant-apex 180: leaf-11, -0.02622, 0.135, -0.02622
@plant-join 180: branch-4, 0.0018, 0.1512, -0.003118, 0.018, 0.1512, -0.031177, 0.00108
@plant-apex 180: leaf-12, 0.01854, 0.1512, -0.032112
@plant-apex 180: leaf-13, 0.01854, 0.1512, -0.032112
@plant-apex 180: leaf-14, 0.01854, 0.1512, -0.032112

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 180 | * | bounds | -0.041141..0.03762 | 0..0.18 | -0.041141..0.04077 | - |
| @part | 180 | pot | hollow | -0.0342..0.0342 | 0..0.0612 | -0.0342..0.0342 | ground,soil |
| @part | 180 | soil | curved | -0.0282..0.0282 | 0.006..0.0612 | -0.0282..0.0282 | pot,stem |
| @part | 180 | stem | cylinder | -0.00252..0.00252 | 0.0612..0.1512 | -0.00252..0.00252 | soil,branch-0,branch-1,branch-2,branch-3,branch-4 |
| @part | 180 | branch-0 | curved | 0.00252..0.03708 | 0.08532..0.08748 | -0.00108..0.00108 | stem,leaf-0,leaf-1,leaf-2 |
| @part | 180 | leaf-0 | curved | 0.03708..0.03762 | 0.0864..0.112502 | -0.017122..0 | branch-0 |
| @part | 180 | leaf-1 | curved | 0.03708..0.03762 | 0.0864..0.1152 | -0.00495..0.00495 | branch-0 |
| @part | 180 | leaf-2 | curved | 0.03708..0.03762 | 0.0864..0.112502 | 0..0.017122 | branch-0 |
| @part | 180 | branch-1 | curved | -0.000149..0.010398 | 0.10152..0.10368 | 0.002397..0.035854 | stem,leaf-3,leaf-4,leaf-5 |
| @part | 180 | leaf-3 | curved | 0.009597..0.026275 | 0.1026..0.128702 | 0.031385..0.035817 | branch-1 |
| @part | 180 | leaf-4 | curved | 0.004815..0.014519 | 0.1026..0.1314 | 0.034535..0.03762 | branch-1 |
| @part | 180 | leaf-5 | curved | -0.006941..0.009598 | 0.1026..0.128702 | 0.035816..0.04077 | branch-1 |
| @part | 180 | branch-2 | curved | -0.032257..-0.002037 | 0.11772..0.11988 | 0.00072..0.01908 | stem,leaf-6,leaf-7,leaf-8 |
| @part | 180 | leaf-6 | curved | -0.032113..-0.023551 | 0.1188..0.144902 | 0.01854..0.033638 | branch-2 |
| @part | 180 | leaf-7 | curved | -0.035055..-0.029637 | 0.1188..0.1476 | 0.014253..0.023097 | branch-2 |
| @part | 180 | leaf-8 | curved | -0.041141..-0.032112 | 0.1188..0.144902 | 0.003712..0.01854 | branch-2 |
| @part | 180 | branch-3 | curved | -0.026536..-0.001465 | 0.13392..0.13608 | -0.026536..-0.001465 | stem,leaf-9,leaf-10,leaf-11 |
| @part | 180 | leaf-9 | curved | -0.038709..-0.026219 | 0.135..0.161102 | -0.02622..-0.014112 | branch-3 |
| @part | 180 | leaf-10 | curved | -0.030102..-0.022719 | 0.135..0.1638 | -0.030102..-0.022719 | branch-3 |
| @part | 180 | leaf-11 | curved | -0.02622..-0.014112 | 0.135..0.161102 | -0.038709..-0.026219 | branch-3 |
| @part | 180 | branch-4 | curved | 0.00072..0.01908 | 0.15012..0.15228 | -0.032257..-0.002037 | stem,leaf-12,leaf-13,leaf-14 |
| @part | 180 | leaf-12 | curved | 0.003712..0.01854 | 0.1512..0.177302 | -0.041141..-0.032112 | branch-4 |
| @part | 180 | leaf-13 | curved | 0.014253..0.023097 | 0.1512..0.18 | -0.035055..-0.029637 | branch-4 |
| @part | 180 | leaf-14 | curved | 0.01854..0.033638 | 0.1512..0.177302 | -0.032113..-0.023551 | branch-4 |

@inventory 280: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
@plant-join 280: branch-0, 0.0056, 0.1344, 0, 0.056, 0.1344, 0, 0.00168
@plant-apex 280: leaf-0, 0.05768, 0.1344, 0
@plant-apex 280: leaf-1, 0.05768, 0.1344, 0
@plant-apex 280: leaf-2, 0.05768, 0.1344, 0
@plant-join 280: branch-1, 0.001449, 0.1596, 0.005409, 0.014494, 0.1596, 0.054092, 0.00168
@plant-apex 280: leaf-3, 0.014929, 0.1596, 0.055715
@plant-apex 280: leaf-4, 0.014929, 0.1596, 0.055715
@plant-apex 280: leaf-5, 0.014929, 0.1596, 0.055715
@plant-join 280: branch-2, -0.00485, 0.1848, 0.0028, -0.048497, 0.1848, 0.028, 0.00168
@plant-apex 280: leaf-6, -0.049952, 0.1848, 0.02884
@plant-apex 280: leaf-7, -0.049952, 0.1848, 0.02884
@plant-apex 280: leaf-8, -0.049952, 0.1848, 0.02884
@plant-join 280: branch-3, -0.00396, 0.21, -0.00396, -0.039598, 0.21, -0.039598, 0.00168
@plant-apex 280: leaf-9, -0.040786, 0.21, -0.040786
@plant-apex 280: leaf-10, -0.040786, 0.21, -0.040786
@plant-apex 280: leaf-11, -0.040786, 0.21, -0.040786
@plant-join 280: branch-4, 0.0028, 0.2352, -0.00485, 0.028, 0.2352, -0.048497, 0.00168
@plant-apex 280: leaf-12, 0.02884, 0.2352, -0.049952
@plant-apex 280: leaf-13, 0.02884, 0.2352, -0.049952
@plant-apex 280: leaf-14, 0.02884, 0.2352, -0.049952

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 280 | * | bounds | -0.063997..0.05852 | 0..0.28 | -0.063997..0.06342 | - |
| @part | 280 | pot | hollow | -0.0532..0.0532 | 0..0.0952 | -0.0532..0.0532 | ground,soil |
| @part | 280 | soil | curved | -0.0472..0.0472 | 0.006..0.0952 | -0.0472..0.0472 | pot,stem |
| @part | 280 | stem | cylinder | -0.00392..0.00392 | 0.0952..0.2352 | -0.00392..0.00392 | soil,branch-0,branch-1,branch-2,branch-3,branch-4 |
| @part | 280 | branch-0 | curved | 0.00392..0.05768 | 0.13272..0.13608 | -0.00168..0.00168 | stem,leaf-0,leaf-1,leaf-2 |
| @part | 280 | leaf-0 | curved | 0.05768..0.05852 | 0.1344..0.175003 | -0.026634..0 | branch-0 |
| @part | 280 | leaf-1 | curved | 0.05768..0.05852 | 0.1344..0.1792 | -0.0077..0.0077 | branch-0 |
| @part | 280 | leaf-2 | curved | 0.05768..0.05852 | 0.1344..0.175003 | 0..0.026634 | branch-0 |
| @part | 280 | branch-1 | curved | -0.000231..0.016174 | 0.15792..0.16128 | 0.003729..0.055772 | stem,leaf-3,leaf-4,leaf-5 |
| @part | 280 | leaf-3 | curved | 0.014928..0.040872 | 0.1596..0.200203 | 0.048821..0.055715 | branch-1 |
| @part | 280 | leaf-4 | curved | 0.007491..0.022584 | 0.1596..0.2044 | 0.053721..0.058519 | branch-1 |
| @part | 280 | leaf-5 | curved | -0.010798..0.014929 | 0.1596..0.200203 | 0.055714..0.06342 | branch-1 |
| @part | 280 | branch-2 | curved | -0.050178..-0.003169 | 0.18312..0.18648 | 0.00112..0.02968 | stem,leaf-6,leaf-7,leaf-8 |
| @part | 280 | leaf-6 | curved | -0.049953..-0.036635 | 0.1848..0.225403 | 0.02884..0.052326 | branch-2 |
| @part | 280 | leaf-7 | curved | -0.05453..-0.046102 | 0.1848..0.2296 | 0.022171..0.035929 | branch-2 |
| @part | 280 | leaf-8 | curved | -0.063997..-0.049952 | 0.1848..0.225403 | 0.005774..0.02884 | branch-2 |
| @part | 280 | branch-3 | curved | -0.041278..-0.002279 | 0.20832..0.21168 | -0.041278..-0.002279 | stem,leaf-9,leaf-10,leaf-11 |
| @part | 280 | leaf-9 | curved | -0.060213..-0.040785 | 0.21..0.250603 | -0.040786..-0.021953 | branch-3 |
| @part | 280 | leaf-10 | curved | -0.046825..-0.035341 | 0.21..0.2548 | -0.046825..-0.035341 | branch-3 |
| @part | 280 | leaf-11 | curved | -0.040786..-0.021953 | 0.21..0.250603 | -0.060213..-0.040785 | branch-3 |
| @part | 280 | branch-4 | curved | 0.00112..0.02968 | 0.23352..0.23688 | -0.050178..-0.003169 | stem,leaf-12,leaf-13,leaf-14 |
| @part | 280 | leaf-12 | curved | 0.005774..0.02884 | 0.2352..0.275803 | -0.063997..-0.049952 | branch-4 |
| @part | 280 | leaf-13 | curved | 0.022171..0.035929 | 0.2352..0.28 | -0.05453..-0.046102 | branch-4 |
| @part | 280 | leaf-14 | curved | 0.02884..0.052326 | 0.2352..0.275803 | -0.049953..-0.036635 | branch-4 |

@inventory 600: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
@plant-join 600: branch-0, 0.012, 0.288, 0, 0.12, 0.288, 0, 0.0036
@plant-apex 600: leaf-0, 0.1236, 0.288, 0
@plant-apex 600: leaf-1, 0.1236, 0.288, 0
@plant-apex 600: leaf-2, 0.1236, 0.288, 0
@plant-join 600: branch-1, 0.003106, 0.342, 0.011591, 0.031058, 0.342, 0.115911, 0.0036
@plant-apex 600: leaf-3, 0.03199, 0.342, 0.119388
@plant-apex 600: leaf-4, 0.03199, 0.342, 0.119388
@plant-apex 600: leaf-5, 0.03199, 0.342, 0.119388
@plant-join 600: branch-2, -0.010392, 0.396, 0.006, -0.103923, 0.396, 0.06, 0.0036
@plant-apex 600: leaf-6, -0.107041, 0.396, 0.0618
@plant-apex 600: leaf-7, -0.107041, 0.396, 0.0618
@plant-apex 600: leaf-8, -0.107041, 0.396, 0.0618
@plant-join 600: branch-3, -0.008485, 0.45, -0.008485, -0.084853, 0.45, -0.084853, 0.0036
@plant-apex 600: leaf-9, -0.087398, 0.45, -0.087398
@plant-apex 600: leaf-10, -0.087398, 0.45, -0.087398
@plant-apex 600: leaf-11, -0.087398, 0.45, -0.087398
@plant-join 600: branch-4, 0.006, 0.504, -0.010392, 0.06, 0.504, -0.103923, 0.0036
@plant-apex 600: leaf-12, 0.0618, 0.504, -0.107041
@plant-apex 600: leaf-13, 0.0618, 0.504, -0.107041
@plant-apex 600: leaf-14, 0.0618, 0.504, -0.107041

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 600 | * | bounds | -0.137136..0.1254 | 0..0.6 | -0.137136..0.135899 | - |
| @part | 600 | pot | hollow | -0.114..0.114 | 0..0.204 | -0.114..0.114 | ground,soil |
| @part | 600 | soil | curved | -0.1032..0.1032 | 0.0108..0.204 | -0.1032..0.1032 | pot,stem |
| @part | 600 | stem | cylinder | -0.0084..0.0084 | 0.204..0.504 | -0.0084..0.0084 | soil,branch-0,branch-1,branch-2,branch-3,branch-4 |
| @part | 600 | branch-0 | curved | 0.0084..0.1236 | 0.2844..0.2916 | -0.0036..0.0036 | stem,leaf-0,leaf-1,leaf-2 |
| @part | 600 | leaf-0 | curved | 0.1236..0.1254 | 0.288..0.375006 | -0.057072..0 | branch-0 |
| @part | 600 | leaf-1 | curved | 0.1236..0.1254 | 0.288..0.384 | -0.0165..0.0165 | branch-0 |
| @part | 600 | leaf-2 | curved | 0.1236..0.1254 | 0.288..0.375006 | 0..0.057072 | branch-0 |
| @part | 600 | branch-1 | curved | -0.000495..0.034659 | 0.3384..0.3456 | 0.007991..0.119512 | stem,leaf-3,leaf-4,leaf-5 |
| @part | 600 | leaf-3 | curved | 0.03199..0.087583 | 0.342..0.429006 | 0.104617..0.119389 | branch-1 |
| @part | 600 | leaf-4 | curved | 0.016052..0.048394 | 0.342..0.438 | 0.115117..0.125398 | branch-1 |
| @part | 600 | leaf-5 | curved | -0.023137..0.031991 | 0.342..0.429006 | 0.119388..0.135899 | branch-1 |
| @part | 600 | branch-2 | curved | -0.107524..-0.006792 | 0.3924..0.3996 | 0.0024..0.0636 | stem,leaf-6,leaf-7,leaf-8 |
| @part | 600 | leaf-6 | curved | -0.107041..-0.078505 | 0.396..0.483006 | 0.0618..0.112126 | branch-2 |
| @part | 600 | leaf-7 | curved | -0.11685..-0.09879 | 0.396..0.492 | 0.04751..0.07699 | branch-2 |
| @part | 600 | leaf-8 | curved | -0.137136..-0.10704 | 0.396..0.483006 | 0.012374..0.0618 | branch-2 |
| @part | 600 | branch-3 | curved | -0.088453..-0.004885 | 0.4464..0.4536 | -0.088453..-0.004885 | stem,leaf-9,leaf-10,leaf-11 |
| @part | 600 | leaf-9 | curved | -0.129027..-0.087398 | 0.45..0.537006 | -0.087399..-0.047042 | branch-3 |
| @part | 600 | leaf-10 | curved | -0.100339..-0.075731 | 0.45..0.546 | -0.100339..-0.075731 | branch-3 |
| @part | 600 | leaf-11 | curved | -0.087399..-0.047042 | 0.45..0.537006 | -0.129027..-0.087398 | branch-3 |
| @part | 600 | branch-4 | curved | 0.0024..0.0636 | 0.5004..0.5076 | -0.107524..-0.006792 | stem,leaf-12,leaf-13,leaf-14 |
| @part | 600 | leaf-12 | curved | 0.012374..0.0618 | 0.504..0.591006 | -0.137136..-0.10704 | branch-4 |
| @part | 600 | leaf-13 | curved | 0.04751..0.07699 | 0.504..0.6 | -0.11685..-0.09879 | branch-4 |
| @part | 600 | leaf-14 | curved | 0.0618..0.112126 | 0.504..0.591006 | -0.107041..-0.078505 | branch-4 |

@inventory 800: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
@plant-join 800: branch-0, 0.016, 0.384, 0, 0.16, 0.384, 0, 0.0048
@plant-apex 800: leaf-0, 0.1648, 0.384, 0
@plant-apex 800: leaf-1, 0.1648, 0.384, 0
@plant-apex 800: leaf-2, 0.1648, 0.384, 0
@plant-join 800: branch-1, 0.004141, 0.456, 0.015455, 0.041411, 0.456, 0.154548, 0.0048
@plant-apex 800: leaf-3, 0.042653, 0.456, 0.159185
@plant-apex 800: leaf-4, 0.042653, 0.456, 0.159185
@plant-apex 800: leaf-5, 0.042653, 0.456, 0.159185
@plant-join 800: branch-2, -0.013856, 0.528, 0.008, -0.138564, 0.528, 0.08, 0.0048
@plant-apex 800: leaf-6, -0.142721, 0.528, 0.0824
@plant-apex 800: leaf-7, -0.142721, 0.528, 0.0824
@plant-apex 800: leaf-8, -0.142721, 0.528, 0.0824
@plant-join 800: branch-3, -0.011314, 0.6, -0.011314, -0.113137, 0.6, -0.113137, 0.0048
@plant-apex 800: leaf-9, -0.116531, 0.6, -0.116531
@plant-apex 800: leaf-10, -0.116531, 0.6, -0.116531
@plant-apex 800: leaf-11, -0.116531, 0.6, -0.116531
@plant-join 800: branch-4, 0.008, 0.672, -0.013856, 0.08, 0.672, -0.138564, 0.0048
@plant-apex 800: leaf-12, 0.0824, 0.672, -0.142721
@plant-apex 800: leaf-13, 0.0824, 0.672, -0.142721
@plant-apex 800: leaf-14, 0.0824, 0.672, -0.142721

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 800 | * | bounds | -0.182848..0.1672 | 0..0.8 | -0.182848..0.181198 | - |
| @part | 800 | pot | hollow | -0.152..0.152 | 0..0.272 | -0.152..0.152 | ground,soil |
| @part | 800 | soil | curved | -0.1376..0.1376 | 0.0144..0.272 | -0.1376..0.1376 | pot,stem |
| @part | 800 | stem | cylinder | -0.0112..0.0112 | 0.272..0.672 | -0.0112..0.0112 | soil,branch-0,branch-1,branch-2,branch-3,branch-4 |
| @part | 800 | branch-0 | curved | 0.0112..0.1648 | 0.3792..0.3888 | -0.0048..0.0048 | stem,leaf-0,leaf-1,leaf-2 |
| @part | 800 | leaf-0 | curved | 0.1648..0.1672 | 0.384..0.500008 | -0.076096..0 | branch-0 |
| @part | 800 | leaf-1 | curved | 0.1648..0.1672 | 0.384..0.512 | -0.022..0.022 | branch-0 |
| @part | 800 | leaf-2 | curved | 0.1648..0.1672 | 0.384..0.500008 | 0..0.076096 | branch-0 |
| @part | 800 | branch-1 | curved | -0.000659..0.046212 | 0.4512..0.4608 | 0.010654..0.159349 | stem,leaf-3,leaf-4,leaf-5 |
| @part | 800 | leaf-3 | curved | 0.042653..0.116777 | 0.456..0.572008 | 0.139489..0.159185 | branch-1 |
| @part | 800 | leaf-4 | curved | 0.021403..0.064525 | 0.456..0.584 | 0.15349..0.167197 | branch-1 |
| @part | 800 | leaf-5 | curved | -0.030849..0.042654 | 0.456..0.572008 | 0.159184..0.181198 | branch-1 |
| @part | 800 | branch-2 | curved | -0.143365..-0.009056 | 0.5232..0.5328 | 0.0032..0.0848 | stem,leaf-6,leaf-7,leaf-8 |
| @part | 800 | leaf-6 | curved | -0.142721..-0.104673 | 0.528..0.644008 | 0.0824..0.149501 | branch-2 |
| @part | 800 | leaf-7 | curved | -0.1558..-0.13172 | 0.528..0.656 | 0.063347..0.102653 | branch-2 |
| @part | 800 | leaf-8 | curved | -0.182848..-0.14272 | 0.528..0.644008 | 0.016499..0.0824 | branch-2 |
| @part | 800 | branch-3 | curved | -0.117938..-0.006513 | 0.5952..0.6048 | -0.117938..-0.006513 | stem,leaf-9,leaf-10,leaf-11 |
| @part | 800 | leaf-9 | curved | -0.172036..-0.116531 | 0.6..0.716008 | -0.116532..-0.062723 | branch-3 |
| @part | 800 | leaf-10 | curved | -0.133785..-0.100974 | 0.6..0.728 | -0.133785..-0.100974 | branch-3 |
| @part | 800 | leaf-11 | curved | -0.116532..-0.062723 | 0.6..0.716008 | -0.172036..-0.116531 | branch-3 |
| @part | 800 | branch-4 | curved | 0.0032..0.0848 | 0.6672..0.6768 | -0.143365..-0.009056 | stem,leaf-12,leaf-13,leaf-14 |
| @part | 800 | leaf-12 | curved | 0.016499..0.0824 | 0.672..0.788008 | -0.182848..-0.14272 | branch-4 |
| @part | 800 | leaf-13 | curved | 0.063347..0.102653 | 0.672..0.8 | -0.1558..-0.13172 | branch-4 |
| @part | 800 | leaf-14 | curved | 0.0824..0.149501 | 0.672..0.788008 | -0.142721..-0.104673 | branch-4 |

@inventory 1100: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
@plant-join 1100: branch-0, 0.022, 0.528, 0, 0.22, 0.528, 0, 0.0066
@plant-apex 1100: leaf-0, 0.2266, 0.528, 0
@plant-apex 1100: leaf-1, 0.2266, 0.528, 0
@plant-apex 1100: leaf-2, 0.2266, 0.528, 0
@plant-join 1100: branch-1, 0.005694, 0.627, 0.02125, 0.05694, 0.627, 0.212504, 0.0066
@plant-apex 1100: leaf-3, 0.058648, 0.627, 0.218879
@plant-apex 1100: leaf-4, 0.058648, 0.627, 0.218879
@plant-apex 1100: leaf-5, 0.058648, 0.627, 0.218879
@plant-join 1100: branch-2, -0.019053, 0.726, 0.011, -0.190526, 0.726, 0.11, 0.0066
@plant-apex 1100: leaf-6, -0.196241, 0.726, 0.1133
@plant-apex 1100: leaf-7, -0.196241, 0.726, 0.1133
@plant-apex 1100: leaf-8, -0.196241, 0.726, 0.1133
@plant-join 1100: branch-3, -0.015556, 0.825, -0.015556, -0.155563, 0.825, -0.155563, 0.0066
@plant-apex 1100: leaf-9, -0.16023, 0.825, -0.16023
@plant-apex 1100: leaf-10, -0.16023, 0.825, -0.16023
@plant-apex 1100: leaf-11, -0.16023, 0.825, -0.16023
@plant-join 1100: branch-4, 0.011, 0.924, -0.019053, 0.11, 0.924, -0.190526, 0.0066
@plant-apex 1100: leaf-12, 0.1133, 0.924, -0.196241
@plant-apex 1100: leaf-13, 0.1133, 0.924, -0.196241
@plant-apex 1100: leaf-14, 0.1133, 0.924, -0.196241

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 1100 | * | bounds | -0.251415..0.2299 | 0..1.1 | -0.251415..0.249147 | - |
| @part | 1100 | pot | hollow | -0.209..0.209 | 0..0.374 | -0.209..0.209 | ground,soil |
| @part | 1100 | soil | curved | -0.1892..0.1892 | 0.0198..0.374 | -0.1892..0.1892 | pot,stem |
| @part | 1100 | stem | cylinder | -0.0154..0.0154 | 0.374..0.924 | -0.0154..0.0154 | soil,branch-0,branch-1,branch-2,branch-3,branch-4 |
| @part | 1100 | branch-0 | curved | 0.0154..0.2266 | 0.5214..0.5346 | -0.0066..0.0066 | stem,leaf-0,leaf-1,leaf-2 |
| @part | 1100 | leaf-0 | curved | 0.2266..0.2299 | 0.528..0.687511 | -0.104631..0 | branch-0 |
| @part | 1100 | leaf-1 | curved | 0.2266..0.2299 | 0.528..0.704 | -0.03025..0.03025 | branch-0 |
| @part | 1100 | leaf-2 | curved | 0.2266..0.2299 | 0.528..0.687511 | 0..0.104631 | branch-0 |
| @part | 1100 | branch-1 | curved | -0.000906..0.063541 | 0.6204..0.6336 | 0.01465..0.219104 | stem,leaf-3,leaf-4,leaf-5 |
| @part | 1100 | leaf-3 | curved | 0.058648..0.160569 | 0.627..0.786511 | 0.191798..0.218879 | branch-1 |
| @part | 1100 | leaf-4 | curved | 0.029429..0.088722 | 0.627..0.803 | 0.211049..0.229896 | branch-1 |
| @part | 1100 | leaf-5 | curved | -0.042418..0.058649 | 0.627..0.786511 | 0.218878..0.249147 | branch-1 |
| @part | 1100 | branch-2 | curved | -0.197126..-0.012452 | 0.7194..0.7326 | 0.0044..0.1166 | stem,leaf-6,leaf-7,leaf-8 |
| @part | 1100 | leaf-6 | curved | -0.196242..-0.143925 | 0.726..0.885511 | 0.1133..0.205563 | branch-2 |
| @part | 1100 | leaf-7 | curved | -0.214225..-0.181116 | 0.726..0.902 | 0.087102..0.141148 | branch-2 |
| @part | 1100 | leaf-8 | curved | -0.251415..-0.196241 | 0.726..0.885511 | 0.022687..0.1133 | branch-2 |
| @part | 1100 | branch-3 | curved | -0.162164..-0.008956 | 0.8184..0.8316 | -0.162164..-0.008956 | stem,leaf-9,leaf-10,leaf-11 |
| @part | 1100 | leaf-9 | curved | -0.23655..-0.16023 | 0.825..0.984511 | -0.160231..-0.086245 | branch-3 |
| @part | 1100 | leaf-10 | curved | -0.183954..-0.13884 | 0.825..1.001 | -0.183954..-0.13884 | branch-3 |
| @part | 1100 | leaf-11 | curved | -0.160231..-0.086245 | 0.825..0.984511 | -0.23655..-0.16023 | branch-3 |
| @part | 1100 | branch-4 | curved | 0.0044..0.1166 | 0.9174..0.9306 | -0.197126..-0.012452 | stem,leaf-12,leaf-13,leaf-14 |
| @part | 1100 | leaf-12 | curved | 0.022687..0.1133 | 0.924..1.083511 | -0.251415..-0.196241 | branch-4 |
| @part | 1100 | leaf-13 | curved | 0.087102..0.141148 | 0.924..1.1 | -0.214225..-0.181116 | branch-4 |
| @part | 1100 | leaf-14 | curved | 0.1133..0.205563 | 0.924..1.083511 | -0.196242..-0.143925 | branch-4 |
<!-- @generated-plant-parts:end -->

`potted-plant/<높이-mm>`의 허용 높이는 `@plant-spec.heights`의 mm 값을 m로 환산한 다섯 상태다. 화분 바닥 중심이 원점, +Y가 위, +Z는 관찰을 위한 앞이다. 각 H에서 화분 높이는 potHeight×H, 외경은 2potTopRadius×H, 흙 표면은 soilSurface×H, 줄기는 흙에서 stemTop×H까지, 수관의 외경 상한은 crownDiameterLimit×H다. pot 벽 두께는 max(wallMinimum,wallFactor×H)이고 열린 윗면의 inner wall과 바깥 wall은 둥근 rim에서 연결된다. 줄기 지름은 2stemRadius×H이고 가지 다섯은 y=(branchStart+branchPitch×i)H에서 시작해 방위 `branchAzimuthsDegrees`(0°·75°·150°·225°·300°), 길이 branchLength×H로 뻗는다(i=0..4). 각 끝에 길이 leafLength×H, 폭 leafWidth×H의 닫힌 잎 세 개를 위쪽 Y축에 대해 −leafFanDegrees°·0°·+leafFanDegrees°로 놓아 총 15개가 된다. 맨 위 가지(i=4)의 중앙 잎 끝은 y=H라 선언 높이와 실제 AABB가 같다. 같은 H에서 반복 순서와 변종 외형은 고정이다.

`pot/outer/inner/rim/sole`, `soil/upper/edge/underside`, `stem/outer/contact`, `branch-0..4/outer/contact`, `leaf-0..14/front/back/edge`가 안정 주소다. 잎은 앞·뒤가 각각 winding과 normal을 가진 닫힌 얇은 부피이고 UV가 각 면의 길이 축을 따른다. 45°·상부·방 거리 view에서 pot 개구, 연결된 가지와 잎 사이 빈 공간이 드러나야 한다. ref03 조리대 작은 화분, ref04 책장 식물은 180/280mm 변종으로 채택하고 ref02의 바닥 화분은 600..1100mm 변종으로 채택한다. ref01의 외부 수목·생울타리는 spaces의 대지 owner이므로 이 prototype으로 옮기지 않는다. ref05 창 밖 식물도 이 실내 화분의 배치 증거로 쓰지 않는다. 실제 종의 특정과 성장·바람 응답은 이 형상에서 `unverified`다.

<!-- @authored-address-state:start -->
@address-state 180: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
@address-state 280: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
@address-state 600: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
@address-state 800: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
@address-state 1100: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
<!-- @authored-address-state:end -->

## 개별 책 {#books}

<!--
@evidence principles/core/common.md#scope-preservation 책은 세 허용 H/T/D 조합만 내고 제목·인쇄와 개수·회전은 이 모델에서 정하지 않는다.
@evidence principles/core/common.md#substantive-completion 두 표지·종이 블록·책등을 닫힌 부피로 맞대고 모든 표면 주소와 세 상태 점유를 전개한다.
@evidence principles/core/common.md#declared-basis ref04의 책장과 ref02의 책상·선반의 책을 바탕으로 하고 세 치수 조합은 이 절이 선택한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation upper-program의 책상·선반과 surface-decomposition의 소품 범위에 서로 다른 세 책등 폭의 독립 책 원형을 더한다.
@evidence principles/design/models.md#representation-contract 표지 두 장과 pages 사이·책등 뒤쪽을 유한 면으로 접촉시키고 납작한 단일 판으로 대체하지 않는다.
@evidence principles/design/models.md#spatial-convention 선반 접촉 중심을 원점, 보이는 책등을 +Z로 놓고 ID의 높이·두께·깊이를 Y/X/Z에 대응시킨다.
@evidence principles/design/models.md#reviewable-structure 정면에서 서로 다른 책등 폭, 상부에서 표지와 pages 깊이, 45°에서 별도 spine과 모서리를 확인한다.
@evidence principles/design/models.md#model-observable-style-basis ref04의 벽 책장과 ref02의 작은 침실 책을 받고 장식 그릇이나 읽을 수 있는 표제를 만들지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 세 ID 각각에 표지 두께 0.004m와 책등 깊이 0.006m를 적용해 닫힌 H/T/D envelope를 만든다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work upper-program의 책상·shelf, household-program의 생활 흔적, surface-decomposition의 소품 형상을 시험했다. 세 크기의 책은 선택한 선반 내용물이며 밑면 지지와 놓일 위치는 배치가 정하므로 새 수납 기능·방 경계가 필요하지 않다.
@evidence settings/002-household.md#upper-program 침실의 desk 또는 shelf를 책 소품의 가능한 지지 가구로 받는다.
@evidence settings/002-household.md#household-program 생활 흔적의 물품 범위에서 책 원형을 저작 선택으로 둔다.
@evidence settings/003-spatial-basis.md#surface-decomposition 책의 표지·책등·바닥 형상과 face 주소를 models가 정한다.
-->

@prose-dim 표지 두 장은: cover-*
@prose-dim 책등은: spine

`book/<높이-mm>x<두께-mm>x<깊이-mm>`는 높이·두께(X)·깊이(Z)의 세 값을 모두 ID에 넣는다. 허용 조합은 `180x30x120`, `240x35x160`, `300x50x200` 세 가지다. 선반 접촉 중심이 원점, +Z가 책등이 보이는 앞이다. 책등은 Z 깊이 0.006m(S)의 판이고 표지 두 장은 X 두께 0.004m(C)로 각각 x=−T/2..−T/2+C와 x=T/2−C..T/2, y=0..H,z=−D/2..D/2−S이다. 종이 블록은 x=−T/2+C..T/2−C, y=C..H−C,z=−D/2..D/2−S이며 책등은 양 표지의 +Z 끝을 잇는 z=D/2−S..D/2의 별도 판이다. 책등의 앞 모서리 반경 C는 이 판의 폐합 범위 안에서 깎고 뒤쪽 접합면은 두 표지와 종이에 면 접촉한다. `cover-left/right/outer/inner/top/bottom/fore-edge/spine-edge`, `spine/outer/inner/top/bottom`, `pages/front/left/right/top/bottom/back`의 실제 면을 분리한다. 각각 닫힌 부피이며 표지 접합선은 책등의 안쪽에서 끝난다. 정면·상부·45°에서 책등과 개별 폭이 읽혀야 한다. ref04 벽 책장과 ref02 작은 침실 책상·선반의 개별 책을 채택하되 ref03의 장식 그릇을 책으로 바꾸지 않는다. ref01·05에는 책 치수 근거가 없다. 책의 수·회전은 instances가, 제목·인쇄는 미정 설정이 정하기 전까지 `unverified`다.

아래 세 상태의 `support`는 선반 상면 y=0이며, `H/T/D`를 위 ID의 mm 값에서 m로 변환해 식대로 전개했다. 연속 범위 안의 임의 네 번째 크기는 이 설계에 없으므로 새 prototype ID로 만들지 않는다.

@inventory 180x30x120: cover-left, cover-right, pages, spine
@inventory 240x35x160: cover-left, cover-right, pages, spine
@inventory 300x50x200: cover-left, cover-right, pages, spine

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 180x30x120 | * | bounds | -0.015..0.015 | 0..0.18 | -0.06..0.06 | - |
| @part | 180x30x120 | cover-left | box | -0.015..-0.011 | 0..0.18 | -0.06..0.054 | support,pages,spine |
| @part | 180x30x120 | cover-right | box | 0.011..0.015 | 0..0.18 | -0.06..0.054 | support,pages,spine |
| @part | 180x30x120 | pages | box | -0.011..0.011 | 0.004..0.176 | -0.06..0.054 | cover-left,cover-right,spine |
| @part | 180x30x120 | spine | box | -0.015..0.015 | 0..0.18 | 0.054..0.06 | support,cover-left,cover-right,pages |
| @envelope | 240x35x160 | * | bounds | -0.0175..0.0175 | 0..0.24 | -0.08..0.08 | - |
| @part | 240x35x160 | cover-left | box | -0.0175..-0.0135 | 0..0.24 | -0.08..0.074 | support,pages,spine |
| @part | 240x35x160 | cover-right | box | 0.0135..0.0175 | 0..0.24 | -0.08..0.074 | support,pages,spine |
| @part | 240x35x160 | pages | box | -0.0135..0.0135 | 0.004..0.236 | -0.08..0.074 | cover-left,cover-right,spine |
| @part | 240x35x160 | spine | box | -0.0175..0.0175 | 0..0.24 | 0.074..0.08 | support,cover-left,cover-right,pages |
| @envelope | 300x50x200 | * | bounds | -0.025..0.025 | 0..0.3 | -0.1..0.1 | - |
| @part | 300x50x200 | cover-left | box | -0.025..-0.021 | 0..0.3 | -0.1..0.094 | support,pages,spine |
| @part | 300x50x200 | cover-right | box | 0.021..0.025 | 0..0.3 | -0.1..0.094 | support,pages,spine |
| @part | 300x50x200 | pages | box | -0.021..0.021 | 0.004..0.296 | -0.1..0.094 | cover-left,cover-right,spine |
| @part | 300x50x200 | spine | box | -0.025..0.025 | 0..0.3 | 0.094..0.1 | support,cover-left,cover-right,pages |

<!-- @authored-address-state:start -->
@address-state 180x30x120: cover-left, cover-right, pages, spine
@address-state 240x35x160: cover-left, cover-right, pages, spine
@address-state 300x50x200: cover-left, cover-right, pages, spine
<!-- @authored-address-state:end -->

## 접힌 수건 {#folded-towels}

<!--
@evidence principles/core/common.md#scope-preservation 수건은 세 높이의 접힌 고정 상태만 내며 젖음과 섬유 유연성은 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion 세 겹과 뒤·앞의 두 fold를 유한 면으로 이어 음영 틈 두 개와 연속 접촉 그래프를 만든다.
@evidence principles/core/common.md#declared-basis ref02 욕실·linen 수납의 수건을 근거로 폭 0.38m·깊이 0.60m와 세 높이는 모델에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation upper-program의 towel storage·linen 수납에 세 높이의 접힌 수건과 그 Y 점유를 더한다.
@evidence principles/design/models.md#representation-contract 각 layer와 fold는 닫힌 부피이고 0.004m 틈은 한쪽 앞 모서리와 반대쪽 뒤 모서리의 연결을 제외하고 빈다.
@evidence principles/design/models.md#spatial-convention 선반 접촉 중심 원점, 접힌 앞 +Z, 아래에서 위로 layer-0..2로 번호를 정한다.
@evidence principles/design/models.md#reviewable-structure 정면과 측면에서 세 겹·두 음영 틈과 서로 반대 면의 접힘을 보고 45°에서 전체 묶음을 본다.
@evidence principles/design/models.md#model-observable-style-basis ref02의 수납장 속 접힌 수건을 표현하고 다른 참고 이미지에서 섬유 결이나 습기 효과를 추정하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 각 H에서 h=(H−2g)/3으로 세 layer와 두 fold의 Y 경계를 계산해 실제 전체 높이를 닫는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work upper-program의 욕실 towel storage와 upper-storage의 linen 목적지를 시험했다. 80·120·160mm 접힌 수건의 바닥 지지는 선반 위 소품 접촉이고 수량·놓일 칸은 배치가 정하므로 새 방이나 가변 상태가 필요하지 않다.
@evidence settings/002-household.md#upper-program 욕실 수건 수납과 상층 linen 수납을 접힌 수건의 두 목적지로 받는다.
@evidence spaces/002-spatial-graph.md#upper-bathroom 욕실의 수건 수납에 놓이는 소품 원형으로 받는다.
@evidence spaces/002-spatial-graph.md#upper-storage 복도 직결 linen 수납에 놓이는 소품 원형으로 받는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 수건의 접힌 형상·face 주소는 models가 정하고 수량은 instances에 남긴다.
-->

`folded-towel/<높이-mm>`의 허용 전체 높이는 0.08, 0.12, 0.16m이고 폭 0.38, 접힌 깊이 0.60m다. 선반 접촉 중심 원점, +Z가 접힌 앞이다. 세 겹의 부피는 각각 높이 h=(H−2g)/3이고 앞쪽 모서리 반경 0.02m다. 아래에서 위로 `layer-0`은 y=0..h, `layer-1`은 y=h+g..2h+g, `layer-2`는 y=2h+2g..H에 놓는다. 두 0.004m 음영 틈의 각각 폭을 g라 한다. 뒤쪽 z=−0.30..−0.27에는 `fold-0`이 y=h..h+g로, 앞쪽 z=+0.27..+0.30에는 `fold-1`이 y=2h+g..2h+2g로 놓여 아래·위 겹의 대면적 접촉면에 각각 닿는다. 각 fold의 X 폭은 0.38m이며 세 겹과 두 접힘은 한 연속 접촉 그래프를 만든다. `layer-0..2/upper/fold-front/fold-back/fold-side/underside`와 `fold-0..1/front/back/top/sole/side`가 각 부품의 전 표면을 덮고 layer 번호는 아래에서 위로 증가한다. 정면·측면·45°에서 겹수가 읽혀야 한다. ref02 욕실·linen 수납의 쌓인 수건을 채택한다. ref01·03·04·05에는 접힌 수건을 판독할 근거가 없다. 섬유 유연성과 실제 습기 응답은 `unverified`다.

다음 세 상태는 높이 토큰 80·120·160mm를 각각 전개한다. `h=(H−2g)/3`의 무한소수 경계는 표에서 0.0000001m 이내로 바깥 반올림했고, 실제 접촉면은 같은 원래 식을 공유한다.

@scalar-control fold-rounding-tolerance: 0.0000001
@prose-gap *: layer-1, layer-0, Y, 음영 틈
@scalar-control fold-corner-radius: 0.02

@inventory 80: layer-0, layer-1, layer-2, fold-0, fold-1
@inventory 120: layer-0, layer-1, layer-2, fold-0, fold-1
@inventory 160: layer-0, layer-1, layer-2, fold-0, fold-1

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 80 | * | bounds | -0.19..0.19 | 0..0.08 | -0.30..0.30 | - |
| @part | 80 | layer-0 | box | -0.19..0.19 | 0..0.024 | -0.30..0.30 | ground,fold-0 |
| @part | 80 | layer-1 | box | -0.19..0.19 | 0.028..0.052 | -0.30..0.30 | fold-0,fold-1 |
| @part | 80 | layer-2 | box | -0.19..0.19 | 0.056..0.08 | -0.30..0.30 | fold-1 |
| @part | 80 | fold-0 | box | -0.19..0.19 | 0.024..0.028 | -0.30..-0.27 | layer-0,layer-1 |
| @part | 80 | fold-1 | box | -0.19..0.19 | 0.052..0.056 | 0.27..0.30 | layer-1,layer-2 |
| @envelope | 120 | * | bounds | -0.19..0.19 | 0..0.12 | -0.30..0.30 | - |
| @part | 120 | layer-0 | box | -0.19..0.19 | 0..0.0373334 | -0.30..0.30 | ground,fold-0 |
| @part | 120 | layer-1 | box | -0.19..0.19 | 0.0413333..0.0786667 | -0.30..0.30 | fold-0,fold-1 |
| @part | 120 | layer-2 | box | -0.19..0.19 | 0.0826666..0.12 | -0.30..0.30 | fold-1 |
| @part | 120 | fold-0 | box | -0.19..0.19 | 0.0373333..0.0413334 | -0.30..-0.27 | layer-0,layer-1 |
| @part | 120 | fold-1 | box | -0.19..0.19 | 0.0786666..0.0826667 | 0.27..0.30 | layer-1,layer-2 |
| @envelope | 160 | * | bounds | -0.19..0.19 | 0..0.16 | -0.30..0.30 | - |
| @part | 160 | layer-0 | box | -0.19..0.19 | 0..0.0506667 | -0.30..0.30 | ground,fold-0 |
| @part | 160 | layer-1 | box | -0.19..0.19 | 0.0546666..0.1053334 | -0.30..0.30 | fold-0,fold-1 |
| @part | 160 | layer-2 | box | -0.19..0.19 | 0.1093333..0.16 | -0.30..0.30 | fold-1 |
| @part | 160 | fold-0 | box | -0.19..0.19 | 0.0506666..0.0546667 | -0.30..-0.27 | layer-0,layer-1 |
| @part | 160 | fold-1 | box | -0.19..0.19 | 0.1053333..0.1093334 | 0.27..0.30 | layer-1,layer-2 |

<!-- @authored-address-state:start -->
@address-state 80: layer-0, layer-1, layer-2, fold-0, fold-1
@address-state 120: layer-0, layer-1, layer-2, fold-0, fold-1
@address-state 160: layer-0, layer-1, layer-2, fold-0, fold-1
<!-- @authored-address-state:end -->

## 손잡이 있는 빈 바구니 {#storage-basket}

<!--
@evidence principles/core/common.md#scope-preservation 바구니는 빈 내부와 양쪽 손잡이만 납품하고 안의 물건·손잡이 하중은 이 모델에 두지 않는다.
@evidence principles/core/common.md#substantive-completion 바닥·네 벽·rim을 닫고 양 측벽을 뚫어 별도 띠 손잡이 두 개를 같은 외곽에 넣는다.
@evidence principles/core/common.md#declared-basis ref02의 1층 수납·상층 linen 바구니 역할을 받고 0.40×0.65×0.28m 치수는 이 절이 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 1층 수납과 upper-program의 linen 수납에 속할 선택 물체로 열린 내부·관통 손잡이의 바구니 원형을 더한다.
@evidence principles/design/models.md#representation-contract handle 외곽을 벽에서 먼저 빼고 별도 띠를 끼워 벽·손잡이의 중복 고체 없이 내부 구멍을 남긴다.
@evidence principles/design/models.md#spatial-convention 선반 접촉 중심 원점, 꺼내는 앞 +Z로 두고 두 손잡이를 ±X 측벽에 배치한다.
@evidence principles/design/models.md#reviewable-structure 상부에서 빈 내부, 정면·45°에서 측면 손잡이의 뚫린 중심과 rim 간격을 확인한다.
@evidence principles/design/models.md#model-observable-style-basis ref02의 수납·linen 바구니를 받되 ref04의 책을 자동으로 내부 내용물로 넣지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 0.012m 바닥·0.010m 벽·0.018m rim과 손잡이 절삭 경계를 표로 닫고 전체 폭을 늘리지 않는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 1층 storage, upper-program의 linen 수납, storage-1f의 공용실 직결 cell을 시험했다. 빈 바구니의 0.40×0.65×0.28m 외함과 손잡이는 선반 위 선택 소품이며 내용물·반복은 배치가 정하므로 새 storage cell이 필요하지 않다.
@evidence settings/002-household.md#ground-program 1층 수납실을 빈 바구니의 가능한 목적지로 받는다.
@evidence settings/002-household.md#upper-program linen 수납실을 같은 바구니 원형의 가능한 목적지로 받는다.
@evidence spaces/002-spatial-graph.md#storage-1f 공용실과 직접 연결된 1층 수납실을 바구니의 가능한 배치 장소로 받고 지지 선반의 칸 선택은 instances에 남긴다.
@evidence settings/003-spatial-basis.md#surface-decomposition 바구니 외벽·내벽·관통 손잡이의 형상과 face를 models가 정한다.
@evidenceExclude spaces/002-spatial-graph.md#corridor-storage 복도에서 상층 linen 수납으로 드는 문의 clear 폭과 회전은 spaces 소유다. 바구니는 선반 위 개별 내용물이다.
-->

@prose-part 각 손잡이의 외곽: handle-*

@axis-control default: wall, X, 0.195, handle recess center

`storage-basket`은 폭 0.40, 깊이 0.65, 높이 0.28m다. 선반 접촉 중심 원점, +Z가 꺼내는 앞이다. 바닥 두께 0.012m, 네 벽 두께 0.010m, 상단 rim 폭 0.018m이며 내부는 열린 빈 공간이다. 양쪽 손잡이는 각각 측벽의 `@void wall` 관통 구멍을 감싸는 별도 `@part handle-left/right` 띠다. 보강 띠는 벽에 매립되어 전체 폭을 늘리지 않고 위 rim과 `@scalar-control handle-rim-clearance`만큼 떨어진다. 구멍·띠의 외곽 치수는 아래 `@void`와 `@part` 행이 단독으로 정한다. `wall/outer/inner/edge`, `rim/upper/edge/underside`, `bottom/upper/edge/underside`, `handle-left/right/outer/inner/cut-edge/contact`가 안정 주소다. 상부·정면·45°에서 내부와 구멍 둘을 확인한다. ref02의 1층 수납과 상층 linen의 바구니 역할을 채택하고 ref04의 책을 바구니 안 내용물로 자동 생성하지 않는다. ref01·03·05는 바구니 형상 근거가 없다. 내용물·개수는 instances가 결정하고 손잡이 하중은 `unverified`다.

벽·rim의 닫힌 점유와 각각의 내부 개구는 아래 `@part`·`@void` 행이 정한다. 각 손잡이의 외곽을 벽에서 먼저 절삭하고 동일한 외곽의 별도 띠 부품을 넣는다. 띠 중앙은 각 `@void handle-left/right` 행대로 관통 절삭한다. 벽과 띠는 바깥 모서리를 공유하지만 부피를 복제하지 않는다.

@scalar-control wall-thickness: 0.010
@scalar-control handle-rim-clearance: 0.007

@inventory default: bottom, wall, rim, handle-left, handle-right
@void default: wall, -0.19..0.19, 0.012..0.262, -0.315..0.315
@void default: wall, -0.2..-0.188, 0.196..0.255, -0.072..0.072
@void default: wall, 0.188..0.2, 0.196..0.255, -0.072..0.072
@void default: rim, -0.182..0.182, 0.262..0.28, -0.307..0.307
@void default: handle-left, -0.2..-0.188, 0.208..0.243, -0.06..0.06
@void default: handle-right, 0.188..0.2, 0.208..0.243, -0.06..0.06

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.2..0.2 | 0..0.28 | -0.325..0.325 | - |
| @part | default | bottom | box | -0.2..0.2 | 0..0.012 | -0.325..0.325 | support,wall |
| @part | default | wall | hollow | -0.2..0.2 | 0.012..0.262 | -0.325..0.325 | bottom,rim,handle-left,handle-right |
| @part | default | rim | hollow | -0.2..0.2 | 0.262..0.28 | -0.325..0.325 | wall |
| @part | default | handle-left | hollow | -0.2..-0.188 | 0.196..0.255 | -0.072..0.072 | wall |
| @part | default | handle-right | hollow | 0.188..0.2 | 0.196..0.255 | -0.072..0.072 | wall |

<!-- @authored-address-state:start -->
@address-state default: bottom, wall, rim, handle-left, handle-right
<!-- @authored-address-state:end -->

## 현관 충전 물체 {#entry-charger}

<!--
@evidence principles/core/common.md#scope-preservation 현관 선반 위 얇은 충전 물체의 형상만 내고 전기 충전 과정은 systems 결정 전까지 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion 본체 윗면 interface 자리와 앞 단자 구멍을 실제로 절삭하고 별도 interface 판을 flush로 넣는다.
@evidence principles/core/common.md#declared-basis ref02의 현관 충전 기능과 평벽 선반을 받되 0.07×0.12×0.015m 외형은 이 절에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 우편·충전 선반에 올릴 선택 물체로 얇은 본체와 앞 단자 구멍을 가진 독립 장치를 더한다.
@evidence principles/design/models.md#representation-contract 단자 port는 빈 내벽 면 주소로 내고 윗면 절삭에 interface가 측·바닥으로 닿게 한다.
@evidence principles/design/models.md#spatial-convention 선반 접촉 아래면 중심 원점, 조작면 +Z로 두며 support y=0을 선반 상면에 맞춘다.
@evidence principles/design/models.md#reviewable-structure 상부에서 flush interface, 정면에서 빈 port, 측면과 현관 거리에서 얇은 0.015m 높이를 본다.
@evidence principles/design/models.md#model-observable-style-basis ref02 현관 기능을 채택하고 유리창이나 작업 장치를 충전기 모양 근거로 가져오지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 본체 외형·0.002m interface·0.012×0.006m port의 점유를 분리해 선반 위 접촉을 닫는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 평벽 우편·충전 선반과 entry의 현관 목적지를 시험했다. 0.07×0.12×0.015m 장치는 선반에 놓는 별도 물체로 전력 공급·벽 절삭·가변 상태를 약속하지 않아 부모 방을 고치지 않는다.
@evidence settings/002-household.md#ground-program 현관의 평벽 충전 선반을 작은 장치가 놓일 지지 가구로 받는다.
@evidence spaces/002-spatial-graph.md#entry 현관 방을 장치의 목적지로 받고 실제 선반 위 위치는 instances에 남긴다.
@evidence settings/003-spatial-basis.md#surface-decomposition 충전 장치의 본체·단자 face는 models가 정하고 실제 기능은 약속하지 않는다.
-->

`entry-charger`는 폭 0.07, 깊이 0.12, 높이 0.015m다. [벽걸이 선반](002-storage-and-sleep.md#entry-charging-shelf)에 닿는 아래면 중심이 원점, +Z가 조작면이다. 본체 위쪽 x=±0.026,z=±0.0375,y=0.013..0.015m를 절삭한다. interface는 X 폭 0.052m·Z 깊이 0.075m·Y 높이 0.002m로 만들고 절삭면에 flush로 끼운다. 앞쪽 edge z=+0.05..+0.06,x=±0.006,y=0.0045..0.0105m에는 폭 0.012·높이 0.006·깊이 0.010m 단자 구멍을 실제로 절삭한다. `body/front/back/top/edge/sole/port-inner/port-edge`, `interface/front/back/edge`가 안정 주소다. 정면·상부·측면과 현관 리뷰 거리 관찰에서 과장된 두꺼운 판으로 보이지 않는지 확인한다. ref02의 현관 충전 기능을 settings의 평벽 선반에 연결한다. ref01·03·04·05의 창·작업 기기를 충전기 형상으로 삼지 않는다. 실제 충전 과정은 systems 결정 전까지 `unverified`다.

`port`는 빈 구멍의 내면 주소이며 별도 고체 부품이 아니다. 아래 두 `@void`는 body의 정확한 직육면체 절삭 체적이다. 첫 절삭에 interface가 측면·바닥으로 접하고 두 번째는 빈 단자 구멍이다. 이 표의 `support`는 모델 원점 y=0에서 선반 상면과 닿는 접촉 평면이다.

@prose-part 본체 위쪽: body!void
@prose-dim interface는: interface
@prose-part 앞쪽 edge: body!void
@inventory default: body, interface
@void default: body, -0.026..0.026, 0.013..0.015, -0.0375..0.0375
@void default: body, -0.006..0.006, 0.0045..0.0105, 0.05..0.06

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.035..0.035 | 0..0.015 | -0.06..0.06 | - |
| @part | default | body | hollow | -0.035..0.035 | 0..0.015 | -0.06..0.06 | support,interface |
| @part | default | interface | box | -0.026..0.026 | 0.013..0.015 | -0.0375..0.0375 | body |

<!-- @authored-address-state:start -->
@address-state default: body, interface
<!-- @authored-address-state:end -->

## 거실·침실 러그 {#rugs}

<!--
@evidence principles/core/common.md#scope-preservation 거실 직사각·침실 직사각·작은 침실 원형의 세 러그만 내며 섬유별 pile과 미끄럼 성능은 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion 세 상태 모두 base·pile·bound-edge를 별도 닫힌 부피로 전개하고 둘레 띠 안쪽을 비운다.
@evidence principles/core/common.md#declared-basis ref02의 침실·거실 러그와 ref03의 소파 앞 직물 경계를 받아 세 평면 크기는 모델에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation household-program의 인물 없이 가구·설비·수납으로 방을 식별하는 설정 아래 surface-decomposition의 소품 형상 소유와 common-room·primary-bedroom의 바닥, upper-program의 작은 침실 목적지에 세 평면 크기의 독립 러그를 더한다.
@evidence principles/design/models.md#representation-contract 위 pile과 0.025m 둘레 띠는 바닥 base에 붙인 별도 주소이며 원형은 24분할 동심 띠다.
@evidence principles/design/models.md#spatial-convention 바닥 접촉 중심 원점, 직사각의 긴 방향 +Z로 정하고 원형의 +Z는 입구 쪽 관찰 방향이다.
@evidence principles/design/models.md#reviewable-structure 위에서 둘레, 낮은 측면에서 0.012·0.016m 높이, 실내 거리에서 가구 발과 만남을 점검한다.
@evidence principles/design/models.md#model-observable-style-basis ref02의 세 방 러그와 ref03 소파 앞 경계를 받되 문턱 재료를 직물로 바꾸지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 세 변종의 base·pile·bound-edge 점유를 모두 내고 pile 높이 0.003m를 각각의 전체 높이에 포함한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work household-program의 생활 물품, common-room의 거실 바닥과 upper-program의 침실 목적지를 시험했다. 세 러그는 바닥 위 얇은 고정 직물이고 문 호·침대와의 실제 간격은 배치가 재므로 새 방 외주나 상태가 필요하지 않다.
@evidence settings/002-household.md#household-program 방을 식별하는 생활 물품으로 러그를 저작 선택한다.
@evidence settings/002-household.md#upper-program 세 침실의 수면 목적지를 침실 러그의 방별 사용 근거로 받는다.
@evidence spaces/002-spatial-graph.md#common-room 거실 영역을 큰 러그의 목적지로 받되 최종 바닥 점유는 instances가 정한다.
@evidence spaces/002-spatial-graph.md#primary-bedroom 주침실의 직사각형 바닥을 침실 러그의 목적지로 받는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 러그의 얇은 직물 형상과 face 주소를 models가 정한다.
-->

@prose-part pile은: pile

@prose-dim base: base
@prose-envelope living-rug: living
@prose-envelope bedroom-rug/1600x2200: bedroom1600x2200

`living-rug`는 폭 2.80, 깊이 3.65, 높이 0.016m, `bedroom-rug/1600x2200`은 폭 1.60, 깊이 2.20, 높이 0.012m다. 바닥 접촉 중심이 원점, +Z가 긴 축이다. `living` base의 Y 높이 0.013m·`bedroom1600x2200` base의 Y 높이 0.009m, pile 높이는 두 변종 모두 0.003m다. 상면 pile 부피와 0.025m 폭의 직조 둘레 띠를 별도 주소 `pile/upper/edge/underside`, `bound-edge/upper/inner/outer/underside`, `base/upper/edge/contact`로 나누고 바닥판에 녹이지 않는다. 상면 UV는 장축 Z를 따른다. 위·낮은 측면·실내 거리 view에서 둘레와 소파 발 또는 침대 곁의 접촉이 보여야 한다. ref02 침실 러그와 거실 러그, ref03 소파 앞 직물 경계를 채택한다. ref01·04·05에는 러그 상세가 없어 문턱 재료를 직물로 치환하지 않는다. 실제 pile 섬유 개별 형상과 미끄럼은 `unverified`다.

`round-rug/1200`은 ref02의 작은 침실에서 보이는 원형 러그를 채택한 지름 1.20m·높이 0.012m 변종이다. 접지 중심이 원점이고 장식 회전은 둘레가 균등하므로 +Z가 방 입구를 향한다. y=0..0.009의 닫힌 원판 base와 pile은 y=0.009..0.012의 층이며, 바깥 반경 0.60m에서 안쪽으로 0.025m 폭의 bound-edge를 갖는다. 원형 둘레는 [공통 곡면 분할](000-representation.md#model-uv-and-topology)의 24구간을 사용하고 `pile/upper/edge/underside`, `bound-edge/upper/inner/outer/underside`, `base/upper/edge/contact`를 직사각 변종과 같이 낸다. 실제 작은 침실의 문 호와 침대 발 사이 통행을 침범하는지는 instances의 배치 검증 전까지 `unverified`다.

다음 표에서 직사각형 `bound-edge`의 `@void`는 전체 높이를 관통하는 안쪽 직사각형이며 그 자리에 `pile`이 정확히 맞닿는다. `round1200`의 `@radial`은 Y축 동심 원판·환형 띠의 실제 반지름 구간이다. `support`는 바닥과 만나는 y=0 평면이다. 세 상태 모두 base·pile·bound-edge를 빠짐없이 낸다.

@scalar-control woven-boundary-width: 0.025

@inventory living: base, pile, bound-edge
@inventory bedroom1600x2200: base, pile, bound-edge
@inventory round1200: base, pile, bound-edge
@void living: bound-edge, -1.375..1.375, 0.013..0.016, -1.8..1.8
@void bedroom1600x2200: bound-edge, -0.775..0.775, 0.009..0.012, -1.075..1.075
@radial round1200: base, 0, 0.6
@radial round1200: pile, 0, 0.575
@radial round1200: bound-edge, 0.575, 0.6

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | living | * | bounds | -1.4..1.4 | 0..0.016 | -1.825..1.825 | - |
| @part | living | base | box | -1.4..1.4 | 0..0.013 | -1.825..1.825 | support,pile,bound-edge |
| @part | living | pile | box | -1.375..1.375 | 0.013..0.016 | -1.8..1.8 | base,bound-edge |
| @part | living | bound-edge | hollow | -1.4..1.4 | 0.013..0.016 | -1.825..1.825 | base,pile |
| @envelope | bedroom1600x2200 | * | bounds | -0.8..0.8 | 0..0.012 | -1.1..1.1 | - |
| @part | bedroom1600x2200 | base | box | -0.8..0.8 | 0..0.009 | -1.1..1.1 | support,pile,bound-edge |
| @part | bedroom1600x2200 | pile | box | -0.775..0.775 | 0.009..0.012 | -1.075..1.075 | base,bound-edge |
| @part | bedroom1600x2200 | bound-edge | hollow | -0.8..0.8 | 0.009..0.012 | -1.1..1.1 | base,pile |
| @envelope | round1200 | * | bounds | -0.6..0.6 | 0..0.012 | -0.6..0.6 | - |
| @part | round1200 | base | cylinder | -0.6..0.6 | 0..0.009 | -0.6..0.6 | support,pile,bound-edge |
| @part | round1200 | pile | cylinder | -0.575..0.575 | 0.009..0.012 | -0.575..0.575 | base,bound-edge |
| @part | round1200 | bound-edge | hollow | -0.6..0.6 | 0.009..0.012 | -0.6..0.6 | base,pile |

<!-- @authored-address-state:start -->
@address-state living: base, pile, bound-edge
@address-state bedroom1600x2200: base, pile, bound-edge
@address-state round1200: base, pile, bound-edge
<!-- @authored-address-state:end -->

## 벽 액자 {#wall-art}

<!--
@evidence principles/core/common.md#scope-preservation 액자 외함·중립 이미지 면만 내고 특정 가족 사진·직업 단서나 인쇄 내용을 만들어 내지 않는다.
@evidence principles/core/common.md#substantive-completion 뒤판·mat·artwork·cover·frame을 깊이별 닫힌 판으로 만들고 공기층을 남긴다.
@evidence principles/core/common.md#declared-basis ref02 작은 침실의 벽 액자 한 점을 받고 0.60×0.42×0.035m 외형·내부 층은 이 모델 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation household-program의 생활 물품과 child-bedroom-1의 침실 벽 목적지에 두께 있는 frame·mat 개구의 액자 원형을 더한다.
@evidence principles/design/models.md#representation-contract frame·mat의 중앙을 실제로 뚫고 artwork와 투명 cover를 각각 접촉면에 두며 두 판 사이 0.010m 공기를 남긴다.
@evidence principles/design/models.md#spatial-convention 벽 접합 뒤면 중심 원점, 보는 앞 +Z로 선언하고 mount 깊이 안에 다섯 층을 둔다.
@evidence principles/design/models.md#reviewable-structure 정면에서 frame·mat, 측면에서 0.035m 깊이, 45°와 침실 거리에서 별도 cover를 본다.
@evidence principles/design/models.md#model-observable-style-basis ref02의 벽 액자만 역할 근거로 쓰고 창 너머 풍경을 그림 내용으로 복제하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 0.025m frame 띠와 각 @part 깊이를 닫으며 비어 있는 공기층에 감춘 판을 넣지 않는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work household-program의 방을 식별하는 생활 물품과 child-bedroom-1의 침실 벽을 시험했다. 0.60×0.42×0.035m 액자는 벽에 붙는 선택 소품이고 구멍·새 벽·운영 상태를 요구하지 않아 공간 owner를 고치지 않는다.
@evidence settings/002-household.md#household-program 침실을 식별하는 생활 물품 범위에서 벽 액자를 저작 선택한다.
@evidence spaces/002-spatial-graph.md#child-bedroom-1 작은 침실의 내측 벽을 액자의 가능한 부착 대상으로 받는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 액자 frame·mat의 형상·face 주소는 models가 소유한다.
-->

@prose-part 투명 cover는: cover

`wall-art/600x420`은 폭 0.60, 높이 0.42, 전체 깊이 0.035m다. 벽 접합 뒷면 중심이 원점, +Z가 보는 앞이다. 프레임 띠의 폭은 0.025m다. 뒤판·중앙 이미지 수신용 빈 종이 면·매트·전면 cover의 깊이 구간은 아래 `@part` 행이 단독으로 정한다. 매트와 cover 사이에는 0.010m 빈 공기층이 있고 프레임이 뒤판과 cover를 연결한다. `frame/front/edge/back`, `mat/front/back/edge`, `artwork/front/back/edge`, `cover/front/back/edge`, `back/outer/contact`가 안정 주소다. 실제 그림 내용·색은 model이 결정하지 않고 materials의 결합 전까지 중립 면이다. 정면·측면·45°와 침실 거리에서 사진 billboard가 아닌 실제 두께·frame이 보여야 한다. ref02 작은 침실 벽의 액자 한 점을 채택한다. ref01·03·04·05의 창 너머 장면을 액자 이미지로 붙이지 않는다. 특정 가족 사진·직업 단서는 설정에 없으므로 표현하지 않으며 실제 그림 내용은 `unverified`다.

프레임의 안쪽 경계와 매트의 중앙 개구는 각각 아래 `@void frame`·`@void mat` 행대로 관통 절삭한다. 종이 artwork는 매트의 중앙 개구를 채우고 뒤판에 붙으며, 투명 cover는 프레임 개구 전체를 채우고 프레임 안쪽 네 면에 닿는다. 그 점유는 각각의 `@part` 행이 정한다. 빈 공기층에는 감춘 지지대나 중복 평판이 없다.

@scalar-control frame-border-width: 0.025
@prose-gap default: cover, mat, Z, 빈 공기층

@inventory default: back, frame, mat, artwork, cover
@void default: frame, -0.275..0.275, -0.185..0.185, 0.012..0.035
@void default: mat, -0.23..0.23, -0.14..0.14, 0.013..0.021

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.3..0.3 | -0.21..0.21 | 0..0.035 | - |
| @part | default | back | box | -0.3..0.3 | -0.21..0.21 | 0..0.012 | wall,frame,artwork |
| @part | default | frame | hollow | -0.3..0.3 | -0.21..0.21 | 0.012..0.035 | back,mat,cover |
| @part | default | mat | hollow | -0.275..0.275 | -0.185..0.185 | 0.013..0.021 | frame |
| @part | default | artwork | box | -0.23..0.23 | -0.14..0.14 | 0.012..0.013 | back |
| @part | default | cover | box | -0.275..0.275 | -0.185..0.185 | 0.031..0.035 | frame |

<!-- @authored-address-state:start -->
@address-state default: back, frame, mat, artwork, cover
<!-- @authored-address-state:end -->

## 빈 그릇·쟁반·컵 {#tabletop-props}

<!--
@evidence principles/core/common.md#scope-preservation 빈 bowl·낮은 tray·컵 세 소품만 내고 음식·브랜드·개수와 실제 식품 접촉 성능은 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion bowl과 cup의 열린 속, tray의 타원 rim, 컵 고리·두 접합 pad를 각 닫힌 부품과 빈 공간으로 전개한다.
@evidence principles/core/common.md#declared-basis ref03 낮은 탁자의 그릇과 ref02 식탁 그릇을 받고 세 소품의 치수·손잡이 방식은 이 절에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 식탁·low table·주방 상판에 올릴 선택 소품으로 bowl·tray·cup의 다른 실루엣을 더한다.
@evidence principles/design/models.md#representation-contract bowl·cup의 bore를 위로 열고 cup pad는 24각 몸체의 +Z facet에 유한 면으로 닿게 해 내부까지 관통하지 않는다.
@evidence principles/design/models.md#spatial-convention 모두 놓이는 아래면 중심 원점, 손잡이 쪽 +Z이며 컵 pad 뒤면은 z=R−|x|tan7.5°에 맞춘다.
@evidence principles/design/models.md#reviewable-structure 상부에서 세 빈 중심, 측면에서 bowl·tray·cup 높이 차, 45°에서 손잡이 고리와 두 pad를 본다.
@evidence principles/design/models.md#model-observable-style-basis ref03의 거실·조리대 소품과 ref02의 식탁 그릇을 받고 참조에 없는 음식·문구를 더하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion bowl 외경 0.22m, tray 0.36×0.24m, cup 높이 0.095m와 handle 돌출을 각각의 @envelope·@bore에 닫는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 식탁·low table·island와 surface-decomposition의 소품 형상 소유를 시험했다. 빈 bowl·tray·cup은 기존 상판에 얹는 국소 물체이고 개수·접촉 위치는 배치가 정하므로 새 방 기능이나 상태가 필요하지 않다.
@evidence settings/002-household.md#ground-program 식탁·low table·island를 빈 상판 소품의 가능한 지지 가구로 받는다.
@evidence settings/002-household.md#household-program 일상 생활 물품 범위에서 빈 그릇·쟁반·컵을 저작 선택한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 세 소품의 rim·안쪽·밑면 형상과 face 주소를 models가 정한다.
-->

@axis-control cup: handle, Y, 0.050, handle ring center
@axis-control cup: handle, Y, 0.034, lower joining pad
@axis-control cup: handle, Y, 0.042, lower joining pad edge
@axis-control cup: handle, Y, 0.063, upper joining pad start
@axis-control cup: handle, Y, 0.069, upper joining pad edge

`decor-bowl`은 외경 0.22, 높이 0.07m, 벽 두께 0.008m이고 아래면 중심 원점, +Y 위다. 상단 개구 내경과 안쪽 바닥 위치는 아래 `@bore bowl/shell` 행이 단독으로 정하며 `shell/outer/inner/rim/sole`로 나눈다. `decor-tray`는 전체 폭 0.36·깊이 0.24·높이 0.032m이며 아래 `@part tray/base`의 타원형 바닥과 `@part tray/rim`의 높이 h_r·두께 t_r인 둘레 턱을 가진 낮은 판이고 `base/upper/underside/edge`, `rim/inner/outer/top/underside`이다. h_r은 `@part tray/rim`의 Y 전폭이다. t_r은 `@ellipse tray/rim`의 X 바깥 반축에서 안쪽 반축을 뺀 값이며 Z 방향의 같은 차와 일치한다. `decor-cup`은 몸체 외경 2R, 높이 0.095, 벽 두께 t인 빈 원통과 외경 0.04m 손잡이를 가진다. 손잡이는 YZ 평면의 외경 0.04m인 닫힌 고리로 튜브 지름 P, 중심 Y는 `@axis-control`의 ring center이고 중심 Z는 Cz=R+고리 외반지름으로 둔다. 여기서 R은 `@tangent cup`의 몸체 바깥 반지름이고 t는 R에서 `@bore cup/body`의 반지름을 뺀 벽 두께이며 고리 외반지름은 손잡이 외경의 절반이다. 고리 뒤쪽 끝은 z=R에서 몸체 외벽에 닿고 앞쪽 끝은 z=Cz+고리 외반지름이다. 한 handle 부품 안의 위·아래 접합 pad의 Y 경계는 `@axis-control`의 upper/lower joining pad start/edge이고, x=±P이며 뒷면은 컵 몸체의 24각 단면에서 +Z를 향한 두 평평한 facet을 따라 꺾인다. 두 pad는 몸체 외벽의 유한 다면체 면에 접하고 빈 내벽 반지름 0.0365m 안으로 들어가지 않는다. pad의 앞면은 고리 몸체에 연속 접합한다. 바닥 접촉 중심 기준 전체 AABB는 아래 `@envelope cup` 행이 단독으로 정한다. 주소는 `body/outer/inner/rim/sole`, `handle/outer/inner/contact`다. 세 물체는 모두 놓이는 아래면 중심이 원점이고 +Z는 손잡이가 향한 앞이다. 위·측면·45°와 식탁 거리에서 빈 내부와 서로 다른 높이가 읽혀야 한다. ref03 낮은 탁자의 그릇과 조리대의 작은 소품, ref02 식탁의 그릇을 채택한다. ref01·04·05의 식사 장면은 없으므로 음식·브랜드·문구는 만들지 않는다. 각 소품의 개수와 놓이는 상판은 instances가 맡고 식품 접촉 성능은 `unverified`다.

여기서 P는 `@tangent cup`의 halfWidth, Cy는 `@axis-control`의 ring center Y, r은 손잡이 외경의 절반, δ는 `@scalar-control cup-handle-insertion`의 길이다. 컵 pad 뒷면은 24각 몸체의 +Z 꼭짓점 양쪽 facet과 일치하는 `z_back(x)=R−|x|tan7.5°`이며 R은 `@tangent cup`의 radius이고 |x|≤P다. 앞면은 각 pad의 높이에서 `z_front(y)=Cz−sqrt(r²−(y−Cy)²)+δ`이며, 몸체 쪽 X 폭 2P를 고리 쪽 X 폭 P로 선형으로 좁힌 닫힌 입체다. 위·아래 pad는 각각 `@axis-control`의 upper/lower joining pad start/edge 사이를 채운다. 앞면의 δ는 같은 handle 고리 외벽 속으로 들어가는 결합 여유이므로 내부가 연속한다. 뒷면만 몸체 외면과 공유하고 pad 내부는 몸체 바깥쪽에 있다. 따라서 handle의 Z 최소값은 R−P tan7.5°를 바깥쪽으로 반올림한 `@part cup/handle`의 Z 하한이다. 두 부품의 AABB가 일부 겹치는 것은 고체 관통이 아니다. `@bore`는 Y축 원통 내부의 위쪽 열린 구멍, `@ellipse`는 타원형 rim의 안쪽·바깥쪽 반축을 적는다. `support`는 탁자 상면의 y=0 접촉이다.

@scalar-control bowl-wall-thickness: 0.008
@scalar-control cup-handle-diameter: 0.04
@prose-dim `decor-cup`은 몸체: body
@scalar-control cup-handle-insertion: 0.001

@flat-contact tray: base, support, -Y, 0, -0.10..0.10, -0.06..0.06

@inventory bowl: shell
@inventory tray: base, rim
@cap-contact tray: base, rim, Y, +
@inventory cup: body, handle
@bore bowl: shell, 0.102, 0.014..0.07
@ellipse tray: rim, 0.174, 0.114, 0.18, 0.12
@bore cup: body, 0.0365, 0.006..0.095
@tangent cup: body, handle, 0.0425, 0.006

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | bowl | * | bounds | -0.11..0.11 | 0..0.07 | -0.11..0.11 | - |
| @part | bowl | shell | hollow | -0.11..0.11 | 0..0.07 | -0.11..0.11 | support |
| @envelope | tray | * | bounds | -0.18..0.18 | 0..0.032 | -0.12..0.12 | - |
| @part | tray | base | curved | -0.18..0.18 | 0..0.018 | -0.12..0.12 | support,rim |
| @part | tray | rim | hollow | -0.18..0.18 | 0.018..0.032 | -0.12..0.12 | base |
| @envelope | cup | * | bounds | -0.0425..0.0425 | 0..0.095 | -0.0425..0.0825 | - |
| @part | cup | body | hollow | -0.0425..0.0425 | 0..0.095 | -0.0425..0.0425 | support,handle |
| @part | cup | handle | curved | -0.006..0.006 | 0.03..0.070 | 0.041710..0.0825 | body |

<!-- @authored-address-state:start -->
@address-state bowl: shell
@address-state tray: base, rim
@address-state cup: body, handle
<!-- @authored-address-state:end -->

## 거실 화면 {#living-display}

<!--
@evidence principles/core/common.md#scope-preservation 거실 화면의 꺼진 외형만 내고 영상 내용과 전력 상태는 이 모델에서 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion mount·housing·중앙이 뚫린 bezel·물린 screen을 분리해 벽 이격과 깊이를 만든다.
@evidence principles/core/common.md#declared-basis ref02·03의 거실 미디어 장치를 받아 폭 1.43m·높이 0.80m와 층별 깊이는 이 절에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 media/storage wall과 common-room의 거실 목적지에 얇은 bezel·screen·mount 형상을 더한다.
@evidence principles/design/models.md#representation-contract bezel 중앙을 절삭하고 screen edge와 그 내벽을 닿게 하며 housing·screen의 겹친 면을 복제하지 않는다.
@evidence principles/design/models.md#spatial-convention 벽 mount 접합 중심 원점, 시청자 앞 +Z로 두고 screen 전면 +0.042와 bezel 전면 +0.045로 0.003m 후퇴시킨다.
@evidence principles/design/models.md#reviewable-structure 정면에서 screen·bezel, 측면에서 벽 이격, 45°에서 0.045m 전체 깊이를 확인한다.
@evidence principles/design/models.md#model-observable-style-basis ref02·03의 거실 장치를 근거로 삼고 외피 커튼월을 화면으로 오인하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 1.43×0.80m 외함 안에 0.018m bezel 폭·0.003m screen 두께와 0.018m mount 깊이를 닫는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 media/storage wall과 common-room의 거실 벽을 시험했다. 1.43m 화면의 mount 접촉은 그 벽에 붙는 물체 형상이고 재생 기능·벽 개구·새 상태를 요구하지 않아 부모 방을 수정하지 않는다.
@evidence settings/002-household.md#ground-program 거실 media/storage wall을 화면 원형의 부착 기능으로 받는다.
@evidence spaces/002-spatial-graph.md#common-room 거실의 내측 벽을 화면의 가능한 설치 면으로 받되 위치는 instances가 정한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 화면 bezel·screen·mount의 형상과 face 주소를 models가 정한다.
-->

@prose-part screen 뒷면은: screen

`living-display`는 폭 1.43, 높이 0.80, Z 깊이 0.045m다. 벽 mount 접합면 중심이 원점, +Z가 시청자 쪽이다. mount는 폭 0.18·높이 0.12·깊이 0.018m로 z=0..0.018이다. 뒤판 housing은 폭 1.43·높이 0.80·깊이 0.021m로 `@part housing`의 Z 구간을 차지하고 bezel의 0.006m 깊이를 합치면 display 외함의 전체 깊이가 0.027m다. bezel은 바깥 가장자리에서 폭 0.018m를 차지하며 중앙 screen을 위한 전면 개구를 실제로 절삭한다. screen은 z=0.039..0.042m의 두께 0.003m 판이고 bezel 전면 z=0.045보다 0.003m 물린다. `screen/front/back/edge`, `bezel/front/back/edge`, `housing/front/back/edge`, `mount/outer/contact`가 안정 주소다. 정면·측면·45°에서 bezel와 벽 이격을 확인한다. ref02와 ref03 거실의 미디어 장치를 채택하며 ref01·04·05의 유리 벽을 화면으로 오인하지 않는다. 영상 내용과 전력 상태는 이 형상에서 `unverified`다.

bezel의 중앙 개구는 x=±0.697,y=±0.382,z=0.039..0.045를 관통하고 그 내벽이 screen의 절단 edge에 닿는다. housing 뒤판과 screen 뒷면은 z=0.039에서 맞닿으며 두 부품의 면은 복제하지 않는다.

@scalar-control housing-plus-bezel-depth: 0.027

@prose-part bezel의 중앙 개구는: bezel!void
@prose-part 뒤판 housing은: housing
@prose-part screen은: screen
@prose-part bezel 전면: bezel
@inventory default: mount, housing, bezel, screen
@void default: bezel, -0.697..0.697, -0.382..0.382, 0.039..0.045

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.715..0.715 | -0.4..0.4 | 0..0.045 | - |
| @part | default | mount | box | -0.09..0.09 | -0.06..0.06 | 0..0.018 | wall,housing |
| @part | default | housing | box | -0.715..0.715 | -0.4..0.4 | 0.018..0.039 | mount,bezel,screen |
| @part | default | bezel | hollow | -0.715..0.715 | -0.4..0.4 | 0.039..0.045 | housing,screen |
| @part | default | screen | box | -0.697..0.697 | -0.382..0.382 | 0.039..0.042 | housing,bezel |

<!-- @authored-address-state:start -->
@address-state default: mount, housing, bezel, screen
<!-- @authored-address-state:end -->

## 천장 표면 부착등 {#ceiling-surface-light}

<!--
@evidence principles/core/common.md#scope-preservation 천장 아래 표면 부착 형상만 내고 매립 구멍·광량은 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion housing-body·flange·core·trim·diffuser를 서로 맞대 발광 원판이 방 쪽에 드러나게 한다.
@evidence principles/core/common.md#declared-basis ref03·04·05의 작은 천장 점등과 ref02의 반복 위치를 받고 외경 0.12m·깊이 0.04m는 모델에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation production-visual-grammar의 켜진 실내등과 surface-decomposition의 등기구 형상 책임에 돌출 trim·housing·diffuser 원형을 더한다.
@evidence principles/design/models.md#representation-contract trim은 빈 고리, core는 그 안의 닫힌 원통이며 diffuser가 최하단에 있어 다른 부품이 발광면을 가리지 않는다.
@evidence principles/design/models.md#spatial-convention 천장 접합 중심 원점, 천장 안쪽 +Y, 방 쪽 -Y로 두고 모든 부품을 y≤0에 놓는다.
@evidence principles/design/models.md#reviewable-structure 방 아래에서 지름 0.095m diffuser 전체, 45°에서 0.04m 돌출과 trim 두께를 본다.
@evidence principles/design/models.md#model-observable-style-basis ref03·04·05의 점등을 형상 근거로 쓰고 ref01의 실내 빛점을 특정 fixture로 해석하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 외경 0.12m 고리부터 0.095m diffuser까지 동심 반지름·Y 접촉을 닫고 housing을 emitter로 표시하지 않는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work production-visual-grammar의 따뜻한 실내등과 surface-decomposition의 등기구·emitter 분리를 시험했다. 0.12m 표면 부착 원형은 천장 아래에 접촉하고 매립 구멍·새 조명 상태를 요구하지 않으며 광량은 systems가 정한다.
@evidence settings/001-production.md#production-visual-grammar 켜진 따뜻한 실내등의 보이는 기구 형상을 얕은 천장 부착 원형으로 제공한다.
@evidence settings/003-spatial-basis.md#surface-decomposition 등기구 trim·housing·diffuser 형상과 face는 models가, 발광 과정은 systems가 소유한다.
-->

`ceiling-surface-light`는 외경 0.12, 전체 깊이 0.04m다. 천장 접합면 중심이 원점이고 +Y가 천장 안쪽이므로 보이는 trim은 외경 0.12m·내경 0.095m의 닫힌 고리로 y=−0.025..0이고, 별도 천장 구멍을 요구하지 않는 얕은 housing-body는 외경 0.085m, y=−0.037..−0.028다. housing-flange는 별도 닫힌 원판으로 외경 0.10m,y=−0.028..−0.025이며 housing-body 상면과 trim 아래면의 반지름 0.0475..0.05m 환형 접촉면에 닿는다. housing-core는 반지름 0.0475m의 닫힌 원통으로 y=−0.025..0에서 trim 안쪽을 채우고 아래면은 flange 윗면에, 윗면은 천장에 유한 면으로 닿는다. 이는 천장면 아래에서 마감되는 0.04m 표면 부착 다운라이트이며 천장 안으로 매립된 부품이라고 주장하지 않는다. 확산면 지름 0.095m·두께 0.003m는 y=−0.040..−0.037에 놓여 housing-body의 아래면과 반지름 0..0.0425m의 원판 면으로 닿는다. 방 쪽 −Y에서 수직으로 보면 발광면의 지름 0.095m 전체가 앞을 향하고, 비발광 몸체·flange·trim은 그 면을 가리지 않는다. `housing-body/outer/sole/top`, `housing-flange/top/edge/underside`, `housing-core/top/edge/underside`, `trim/front/edge/contact`, `diffuser/front/back/edge`가 안정 주소다. diffuser의 발광 과정은 system emitter와 별도 대응하고 housing은 emissive가 아니다. 아래·45°와 실내 거리에서 trim 깊이를 확인한다. ref03·04·05의 작은 천장 점등을 채택하고 ref01의 실내 빛점을 특정 fixture의 형상 근거로 쓰지 않는다. ref02는 두 층 반복 위치의 검사 자료다. 실제 광량은 systems 소유이며 이 모델 H2의 결과로는 `unverified`다.

`@radial`은 동심 Y축 부품의 실제 내·외 반지름이며 `ceiling`은 y=0 접촉 평면이다. housing-flange가 몸체의 윗면과 맞대고 trim의 고리 아래면에서 유한 환형 접촉면을 만든다. diffuser의 −Y face가 다섯 부품 중 가장 방 쪽이며 그 원판의 투영은 다른 부품에 가려지지 않는다.

@prose-part trim: trim
@prose-part housing-body: housing-body
@prose-part housing-flange: housing-flange
@prose-part housing-core: housing-core
@prose-part 확산면: diffuser
@inventory default: housing-body, housing-flange, housing-core, trim, diffuser
@cap-contact default: housing-core, housing-flange, Y, -
@emitter-face default: diffuser, -Y
@radial default: housing-body, 0, 0.0425
@radial default: housing-flange, 0, 0.05
@radial default: housing-core, 0, 0.0475
@radial default: trim, 0.0475, 0.06
@radial default: diffuser, 0, 0.0475

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.06..0.06 | -0.04..0 | -0.06..0.06 | - |
| @part | default | housing-body | cylinder | -0.0425..0.0425 | -0.037..-0.028 | -0.0425..0.0425 | housing-flange,diffuser |
| @part | default | housing-flange | cylinder | -0.05..0.05 | -0.028..-0.025 | -0.05..0.05 | housing-body,trim,housing-core |
| @part | default | housing-core | cylinder | -0.0475..0.0475 | -0.025..0 | -0.0475..0.0475 | housing-flange,ceiling |
| @part | default | trim | hollow | -0.06..0.06 | -0.025..0 | -0.06..0.06 | ceiling,housing-flange |
| @part | default | diffuser | cylinder | -0.0475..0.0475 | -0.04..-0.037 | -0.0475..0.0475 | housing-body |

<!-- @authored-address-state:start -->
@address-state default: housing-body, housing-flange, housing-core, trim, diffuser
<!-- @authored-address-state:end -->

## 가는 원통 식탁 펜던트 {#dining-pendant}

<!--
@evidence principles/core/common.md#scope-preservation 식탁 위 가는 매달림 형상만 내고 광량·전기 작동은 systems 소유로 둔다.
@evidence principles/core/common.md#substantive-completion canopy 관통 구멍·cord·속 빈 shade-wall·cap·후퇴한 diffuser의 접촉을 전개한다.
@evidence principles/core/common.md#declared-basis ref03의 가는 세로 원통과 ref02의 식탁 위 위치를 받되 1.00m 길이·0.045m 외경은 모델 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 여섯 자리 식탁과 production-visual-grammar의 실내등에 긴 원통 shade·가는 cord의 매달린 기구 원형을 더한다.
@evidence principles/design/models.md#representation-contract canopy의 cord 구멍을 비우고 shade-wall 내부를 비워 cap·diffuser가 서로 다른 높이에서 벽과 맞대게 한다.
@evidence principles/design/models.md#spatial-convention 천장 cord 고정 중심 원점, 안쪽 +Y, 식탁 쪽 -Y로 두고 전체 하향 길이 1.00m를 닫는다.
@evidence principles/design/models.md#reviewable-structure 정면·측면·45°와 ref03 식탁 거리에서 가는 shade·cord의 실루엣과 안쪽 diffuser를 본다.
@evidence principles/design/models.md#model-observable-style-basis ref03의 원통 펜던트 형상을 채택하고 ref02는 식탁과의 매달린 관계에만 사용한다.
@evidence principles/design/models.md#model-scale-layer-completion cord y=−0.62..0, shade y=−1.00..−0.62와 0.08m canopy를 맞대고 0.038m diffuser를 안쪽에 둔다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 식탁, production-visual-grammar의 켜진 실내등, surface-decomposition의 등기구·발광 분리를 시험했다. 1.00m cord·shade는 천장 표면에 매달린 고정 형상이고 광량·정확한 위치는 후속 owner가 정하므로 새 방·상태가 필요하지 않다.
@evidence settings/002-household.md#ground-program 공용실 식탁을 펜던트의 가능한 아래쪽 사용 위치로 받는다.
@evidence settings/001-production.md#production-visual-grammar 켜진 실내등의 보이는 형상을 식탁 펜던트 원형으로 제공한다.
@evidence settings/003-spatial-basis.md#surface-decomposition cord·shade 형상과 face 주소를 models가, emitter와 광량을 systems가 소유한다.
-->

@prose-dim cord는: cord

`dining-pendant`는 천장 cord 고정점이 원점, +Y가 천장 안쪽, 아래가 식탁으로 향한다. 전체 하향 길이 1.00m 중 cord는 y=−0.62..0에 지름 0.006m, 가는 원통 shade는 y=−1.00..−0.62에 지름 0.045m, 하단 diffuser는 지름 0.038m·두께 0.003m로 y=−0.989..−0.986에 후퇴한다. 천장 canopy는 지름 0.08, 높이 0.018m로 천장면 아래 y=−0.018..0에 닿는다. cord가 지나는 중앙 지름 0.006m 구멍을 절삭하고 그 edge에서 cord에 접하므로 천장 안쪽으로 들어가지 않는다. shade는 안쪽 반지름 0.019m인 `shade-wall`(y=−1.00..−0.625)과 그 위의 닫힌 `shade-cap`(y=−0.625..−0.620) 두 부품으로 연결하고 cap 상면에 cord 단면을 맞댄다. `cord/outer/end`, `canopy/outer/contact`, `shade-wall/outer/inner/edge`, `shade-cap/top/underside/edge`, `diffuser/front/back/edge`가 안정 주소다. 원통 내부는 diffuser까지 열린 음영 공간이며 원판형 0.38m shade를 남기지 않는다. 정면·측면·45°와 ref03 식탁 거리에서 가는 세로선으로 보여야 한다. ref03의 원통 펜던트를 채택하고 ref02는 식탁 위 매달린 위치 관계만 채택한다. ref01·04·05에는 펜던트 형상 증거가 없다. 발광은 system emitter가 소유하고 모델 형상만으로 광량은 `unverified`다.

다음 `@radial`은 Y축 동심 부품의 실제 내·외반경이다. `ceiling`은 y=0의 천장 접합 평면이다. shade의 벽·cap은 서로 맞댐이고 diffuser 반지름 0.019m가 벽의 내반경에 면 접촉한다.

@scalar-control excluded-plate-shade-diameter: 0.38

@emitter-face default: diffuser, -Y

@prose-part cord: cord
@prose-part shade: shade-*
@prose-part diffuser: diffuser
@prose-part canopy: canopy
@inventory default: canopy, cord, shade-wall, shade-cap, diffuser
@radial default: canopy, 0.003, 0.04
@radial default: cord, 0, 0.003
@radial default: shade-wall, 0.019, 0.0225
@radial default: shade-cap, 0, 0.0225
@radial default: diffuser, 0, 0.019

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.04..0.04 | -1..0 | -0.04..0.04 | - |
| @part | default | canopy | hollow | -0.04..0.04 | -0.018..0 | -0.04..0.04 | ceiling,cord |
| @part | default | cord | cylinder | -0.003..0.003 | -0.62..0 | -0.003..0.003 | canopy,shade-cap |
| @part | default | shade-wall | hollow | -0.0225..0.0225 | -1..-0.625 | -0.0225..0.0225 | shade-cap,diffuser |
| @part | default | shade-cap | cylinder | -0.0225..0.0225 | -0.625..-0.62 | -0.0225..0.0225 | shade-wall,cord |
| @part | default | diffuser | cylinder | -0.019..0.019 | -0.989..-0.986 | -0.019..0.019 | shade-wall |

<!-- @authored-address-state:start -->
@address-state default: canopy, cord, shade-wall, shade-cap, diffuser
<!-- @authored-address-state:end -->

## 바닥 독서등·구형 협탁등·작업등 {#portable-lamps}

<!--
@evidence principles/core/common.md#scope-preservation reading·bedside-globe·desk-task 세 고정 형상만 내며 조도·전기 안전은 주장하지 않는다.
@evidence principles/core/common.md#substantive-completion 변종별 base·stem·shade 또는 globe·head·diffuser를 실제 부품과 빈 개구로 전개하고 없는 부품은 발행하지 않는다.
@evidence principles/core/common.md#declared-basis ref03의 독서등, ref04의 구형 협탁등·작업등과 ref02의 협탁 크기를 받아 세 비례는 이 절에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation ground-program의 reading light와 upper-program의 침실 가구에 바닥등·협탁등·작업등의 세 독립 원형을 더한다.
@evidence principles/design/models.md#representation-contract reading shade의 안쪽 bridge와 환형 diffuser, globe의 닫힌 목, desk-task의 열린 측벽·부착 diffuser를 변종별로 만든다.
@evidence principles/design/models.md#spatial-convention 세 변종 모두 받침 아래면 중심 원점, 빛이 향한 쪽 +Z로 두고 바닥 또는 상판 y=0에 접촉시킨다.
@evidence principles/design/models.md#reviewable-structure 정면·측면·45°에서 바닥형과 탁상형 크기, globe 구체, desk-task 두 구간과 헤드 아래 발광면을 구분한다.
@evidence principles/design/models.md#model-observable-style-basis ref03·04의 서로 다른 램프 실루엣을 따르고 ref01·05 외피 반사를 램프 부품 근거로 쓰지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 각 변종의 envelope와 shade·globe·head·diffuser 점유를 닫고 없는 주소를 빈 placeholder로 만들지 않는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work ground-program의 거실 reading light·작업실 desk와 upper-program의 bedside table을 시험했다. 바닥 독서등의 sole, 협탁 구체의 받침, 작업등의 책상 접촉은 각 고정 원형 안에 닫히며 광량·방별 위치는 후속 owner가 정하므로 공간 변경이 없다.
@evidence settings/002-household.md#ground-program 거실 reading light와 작업실 desk를 바닥등·작업등의 사용 근거로 받는다.
@evidence settings/002-household.md#upper-program 주침실 bedside table을 작은 협탁등의 가능한 지지 가구로 받는다.
@evidence settings/003-spatial-basis.md#surface-decomposition 세 등기구의 보이는 형상·face를 models가 소유하고 발광은 systems에 남긴다.
-->

@axis-control bedside-globe: globe, Y, 0.072, sphere cut and neck top

세 변종의 부품 표는 바닥 또는 놓인 상판을 y=0으로 삼는다. reading shade의 중앙 mounting bridge는 독립 `shade-bridge` 부품이고 안쪽 개구와 정확히 맞닿는다. desk-task head의 음각은 diffuser X 외곽까지 도달하므로 양쪽 측벽은 열리고, Y/Z 둘레 벽만 남는다. diffuser는 그 음각의 안쪽 면에 붙으며 체적을 공유하지 않는다.

@scalar-control reading-shade-wall: 0.005
@scalar-control reading-diffuser-stem-clearance: 0.001

@emitter-face reading: diffuser, -Y
@emitter-face desk-task: diffuser, -Y

@inventory reading: base, stem-lower, shade, shade-bridge, diffuser
@cap-contact bedside-globe: base, stem-short, Y, +
@cap-contact desk-task: base, stem-lower, Y, +
@cap-contact desk-task: stem-lower, stem-upper, Y, +
@radial reading: base, 0, 0.125
@radial reading: stem-lower, 0, 0.009
@radial reading: shade, 0.095, 0.1
@radial reading: shade-bridge, 0, 0.095
@radial reading: diffuser, 0.010, 0.095
@inventory bedside-globe: base, stem-short, globe
@flat-contact bedside-globe: globe, stem-short, -Y, 0.07, -0.006..0.006, -0.006..0.006
@inventory desk-task: base, stem-lower, stem-upper, task-head, diffuser
@void desk-task: task-head, -0.045..0.045, 0.36..0.364, 0.045..0.135
@cavity-contact desk-task: task-head, diffuser, Y

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | reading | * | bounds | -0.125..0.125 | 0..1.24 | -0.125..0.125 | - |
| @part | reading | base | cylinder | -0.125..0.125 | 0..0.025 | -0.125..0.125 | support,stem-lower |
| @part | reading | stem-lower | cylinder | -0.009..0.009 | 0.025..1.10 | -0.009..0.009 | base,shade-bridge |
| @part | reading | shade | hollow | -0.1..0.1 | 1.03..1.24 | -0.1..0.1 | shade-bridge,diffuser |
| @part | reading | shade-bridge | cylinder | -0.095..0.095 | 1.10..1.12 | -0.095..0.095 | stem-lower,shade |
| @part | reading | diffuser | cylinder | -0.095..0.095 | 1.03..1.034 | -0.095..0.095 | shade |
| @envelope | bedside-globe | * | bounds | -0.11..0.11 | 0..0.29 | -0.11..0.11 | - |
| @part | bedside-globe | base | cylinder | -0.06..0.06 | 0..0.015 | -0.06..0.06 | support,stem-short |
| @part | bedside-globe | stem-short | cylinder | -0.009..0.009 | 0.015..0.07 | -0.009..0.009 | base,globe |
| @part | bedside-globe | globe | curved | -0.11..0.11 | 0.07..0.29 | -0.11..0.11 | stem-short |
| @envelope | desk-task | * | bounds | -0.065..0.065 | 0..0.42 | -0.065..0.14 | - |
| @part | desk-task | base | cylinder | -0.065..0.065 | 0..0.02 | -0.065..0.065 | support,stem-lower |
| @part | desk-task | stem-lower | cylinder | -0.0075..0.0075 | 0.02..0.25 | -0.0075..0.0075 | base,stem-upper |
| @part | desk-task | stem-upper | cylinder | -0.0075..0.0075 | 0.25..0.36 | -0.0075..0.0075 | stem-lower,task-head |
| @part | desk-task | task-head | hollow | -0.045..0.045 | 0.36..0.42 | 0..0.14 | stem-upper,diffuser |
| @part | desk-task | diffuser | box | -0.045..0.045 | 0.36..0.364 | 0.045..0.135 | task-head |

`portable-lamp/reading`의 전체 점유는 폭·깊이 0.25, 높이 1.24m이고 바닥 받침 지름 0.25m로, 지름 0.018m stem이 `@part reading/stem-lower`의 Y 구간을 차지하고, 0.20m 지름의 원통 shade가 y=1.03..1.24다. `portable-lamp/bedside-globe`의 전체 점유는 폭·깊이 0.22, 높이 0.29m이며 상판 받침 지름 0.12·높이 0.015m, 짧은 stem 높이 0.055m, 구형 diffuser 지름 0.22m, 총 높이 0.29m다. `portable-lamp/desk-task`의 전체 점유는 `@envelope desk-task` 행대로이며 받침 지름 0.13m, 총 높이 0.42m다. 이 변종은 0.015m 지름의 고정 두 구간 stem이 아래 두 `@part desk-task/stem-*` 행의 Y 구간을 차지하고, 길이 0.14m 헤드가 +Z 방향으로 뻗어 아래쪽에는 X 폭과 Z 길이가 각각 0.09m인 평평한 직사각 diffuser가 드러난다. 세 변종 모두 받침 아래면 중심이 원점, +Z가 빛을 향하는 방향이다. `base/upper/edge/sole`은 공통 주소다. reading은 `@part reading/stem-lower` 구간의 `stem-lower/outer/top/contact`, `shade/outer/inner/edge`, `shade-bridge/upper/edge/underside`, 아래쪽 `@part reading/diffuser` 구간의 `diffuser/front/back/edge`를 낸다. shade의 외경은 0.20m, 벽 두께는 0.005m이고 독립 `shade-bridge` 부품은 y=1.10..1.12에서 stem 상면과 shade 내벽에 각각 유한 면으로 닿는다. diffuser는 외경 0.19m·중앙 통과 구멍 지름 0.020m인 얇은 환형 판으로 그 외곽이 shade 내벽에 닿는다. 지름 0.018m stem은 0.001m 반경 여유를 두고 diffuser 구멍을 통과하므로 발광판을 관통하지 않는다. bedside-globe는 `@part bedside-globe/stem-short` 구간의 `stem-short/outer/top/contact`와 구 중심을 `@part bedside-globe/globe`의 Y 최대와 구 반지름에서 유도하는 `globe/outer/inner/contact`를 낸다. 구는 반지름 0.11m로 `@axis-control bedside-globe`의 절단면에서 수평 절단해 닫고, 같은 globe 부품의 반지름 0.009m 원통형 목을 `@part bedside-globe/globe`의 하단 구간에 잇는다. 목의 하단에서 `@flat-contact bedside-globe`의 정사각형은 stem-short 상단 반지름 0.009m 원판 안에 들어가 유한 면으로 닿는다. 나머지 globe 외면은 확산면이다. desk-task는 `stem-lower/outer/top/contact`, `stem-upper/outer/top/contact`, `@part desk-task/task-head` 구간의 `task-head/outer/inner/edge`, 헤드 아래 `@void desk-task`와 같은 점유의 `diffuser/front/back/edge`를 낸다. 변종에 없는 stem·shade·globe·head·diffuser의 주소를 빈 부품으로 만들지 않는다. reading·desk-task의 diffuser와 bedside-globe의 globe 외면은 각각 별도 system emitter가 필요하다. 정면·측면·45°에서 바닥형/탁상형의 크기 차이, 구체와 두 구간 작업등을 판별한다. ref03의 거실 독서등, ref04의 구형 탁상등과 작업등을 각각 채택하고 ref02 협탁의 낮은 조명을 크기 관계로 받는다. ref01·05의 외피 빛 반사를 램프 형상으로 가져오지 않는다. 전기 안전·조도는 `unverified`다.

<!-- @authored-address-state:start -->
@address-state reading: base, stem-lower, shade, shade-bridge, diffuser
@address-state bedside-globe: base, stem-short, globe
@address-state desk-task: base, stem-lower, stem-upper, task-head, diffuser
<!-- @authored-address-state:end -->
