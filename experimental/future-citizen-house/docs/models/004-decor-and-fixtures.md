# 소품과 등기구 모델

[공통 주소와 중립 관찰](000-representation.md#model-address-and-scale)을 참조한다.

## 낮은·높은 실내 화분 {#potted-plant}

화분의 바닥과 벽은 한 닫힌 원뿔대 껍질이다. 바닥 두께는 벽 두께 t=max(0.006,0.018H)와 같고, 흙은 y=t..0.34H에서 그 내벽 반경을 채운다. 줄기 반경은 0.014H, 가지 끝 반경은 0.006H다. 가지 중심선은 줄기 축에서 0.020H 떨어져 시작해 0.200H에서 끝나므로 길이가 0.18H다. 잎 세 장의 단일 시작점은 가지 끝 구의 바깥 방사면 0.206H에 있다. 각 잎은 이 점을 꼭짓점으로 하고 길이 0.16H의 끝면에서 최대 접선 폭 0.055H, 바깥 방사방향 두께 0.003H를 갖는 닫힌 다섯 꼭짓점 쐐기다. 끝면 중심은 가지의 방사축 0.206H를 유지하고 접선 방향으로 −25°·0°·+25°의 길이 성분만큼 벌어지며 Y 상승은 해당 각도의 코사인 성분이다. 잎 두께는 시작점에서 0이고 끝면에서 0.003H이며 가지 구의 안쪽으로 대칭 확장하지 않는다. 그러므로 세 잎은 가지 끝 구와 각각 정확한 시작점 하나에서 접하고 서로 그 점만 공유한다. 다섯 가지는 72° 간격이다. `model-plant-producer.cjs`는 이 식과 다섯 높이에서 표를 재생성하고 `plantProof`는 상태마다 가지 끝 구와 잎 시작점 거리를 계산한다.

@plant-spec: {"heights":[180,280,600,800,1100],"potHeight":0.34,"potTopRadius":0.19,"potBottomRadius":0.15,"wallMinimum":0.006,"wallFactor":0.018,"soilSurface":0.34,"stemRadius":0.014,"stemTop":0.84,"crownDiameterLimit":0.60,"branchStart":0.48,"branchPitch":0.09,"branchLength":0.18,"branchRadius":0.006,"leafLength":0.16,"leafWidth":0.055,"leafThickness":0.003,"leafFanDegrees":25}

선언 점유는 0.60H 수관 상한을 사방으로 남겨 둔 상자가 아니라, 고정된 다섯 방위에서 실제 pot·soil·stem·branch·leaf 부품 AABB의 축별 최솟값과 최댓값이다. 생산자는 이 합집합을 높이 변종마다 계산한다.

@cap-contact 180: soil, stem, Y, +
@cap-contact 280: soil, stem, Y, +
@cap-contact 600: soil, stem, Y, +
@cap-contact 800: soil, stem, Y, +
@cap-contact 1100: soil, stem, Y, +

@scalar-control branch-base-radius: 0.020
@scalar-control leaf-base-radius: 0.206
@scalar-control pot-diameter-ratio: 0.38
@scalar-control stem-diameter-ratio: 0.028

<!-- @generated-plant-parts:start -->
@inventory 180: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 180 | * | bounds | -0.040499..0.03762 | 0..0.18 | -0.04107..0.04107 | - |
| @part | 180 | pot | hollow | -0.0342..0.0342 | 0..0.0612 | -0.0342..0.0342 | ground,soil |
| @part | 180 | soil | curved | -0.0282..0.0282 | 0.006..0.0612 | -0.0282..0.0282 | pot,stem |
| @part | 180 | stem | cylinder | -0.00252..0.00252 | 0.0612..0.1512 | -0.00252..0.00252 | soil,branch-0,branch-1,branch-2,branch-3,branch-4 |
| @part | 180 | branch-0 | curved | 0.00252..0.03708 | 0.08532..0.08748 | -0.00108..0.00108 | stem,leaf-0,leaf-1,leaf-2 |
| @part | 180 | leaf-0 | curved | 0.03708..0.03762 | 0.0864..0.112502 | -0.017121..0 | branch-0 |
| @part | 180 | leaf-1 | curved | 0.03708..0.03762 | 0.0864..0.1152 | -0.00495..0.00495 | branch-0 |
| @part | 180 | leaf-2 | curved | 0.03708..0.03762 | 0.0864..0.112502 | 0..0.017121 | branch-0 |
| @part | 180 | branch-1 | curved | 0.000032..0.012205 | 0.10152..0.10368 | 0.002344..0.035318 | stem,leaf-3,leaf-4,leaf-5 |
| @part | 180 | leaf-3 | curved | 0.011458..0.027909 | 0.1026..0.128702 | 0.029974..0.035265 | branch-1 |
| @part | 180 | leaf-4 | curved | 0.006751..0.016333 | 0.1026..0.1314 | 0.033736..0.037308 | branch-1 |
| @part | 180 | leaf-5 | curved | -0.004825..0.011458 | 0.1026..0.128702 | 0.035265..0.04107 | branch-1 |
| @part | 180 | branch-2 | curved | -0.030205..-0.001832 | 0.11772..0.11988 | 0.001036..0.02224 | stem,leaf-6,leaf-7,leaf-8 |
| @part | 180 | leaf-6 | curved | -0.029998..-0.019935 | 0.1188..0.144902 | 0.021795..0.035964 | branch-2 |
| @part | 180 | leaf-7 | curved | -0.033345..-0.027089 | 0.1188..0.1476 | 0.01779..0.026117 | branch-2 |
| @part | 180 | leaf-8 | curved | -0.040499..-0.029998 | 0.1188..0.144902 | 0.007944..0.021795 | branch-2 |
| @part | 180 | branch-3 | curved | -0.030205..-0.001832 | 0.13392..0.13608 | -0.02224..-0.001036 | stem,leaf-9,leaf-10,leaf-11 |
| @part | 180 | leaf-9 | curved | -0.040499..-0.029998 | 0.135..0.161102 | -0.021795..-0.007944 | branch-3 |
| @part | 180 | leaf-10 | curved | -0.033345..-0.027089 | 0.135..0.1638 | -0.026117..-0.01779 | branch-3 |
| @part | 180 | leaf-11 | curved | -0.029998..-0.019935 | 0.135..0.161102 | -0.035964..-0.021795 | branch-3 |
| @part | 180 | branch-4 | curved | 0.000032..0.012205 | 0.15012..0.15228 | -0.035318..-0.002344 | stem,leaf-12,leaf-13,leaf-14 |
| @part | 180 | leaf-12 | curved | -0.004825..0.011458 | 0.1512..0.177302 | -0.04107..-0.035265 | branch-4 |
| @part | 180 | leaf-13 | curved | 0.006751..0.016333 | 0.1512..0.18 | -0.037308..-0.033736 | branch-4 |
| @part | 180 | leaf-14 | curved | 0.011458..0.027909 | 0.1512..0.177302 | -0.035265..-0.029974 | branch-4 |

@inventory 280: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 280 | * | bounds | -0.062998..0.05852 | 0..0.28 | -0.063886..0.063886 | - |
| @part | 280 | pot | hollow | -0.0532..0.0532 | 0..0.0952 | -0.0532..0.0532 | ground,soil |
| @part | 280 | soil | curved | -0.0472..0.0472 | 0.006..0.0952 | -0.0472..0.0472 | pot,stem |
| @part | 280 | stem | cylinder | -0.00392..0.00392 | 0.0952..0.2352 | -0.00392..0.00392 | soil,branch-0,branch-1,branch-2,branch-3,branch-4 |
| @part | 280 | branch-0 | curved | 0.00392..0.05768 | 0.13272..0.13608 | -0.00168..0.00168 | stem,leaf-0,leaf-1,leaf-2 |
| @part | 280 | leaf-0 | curved | 0.05768..0.05852 | 0.1344..0.175003 | -0.026633..0 | branch-0 |
| @part | 280 | leaf-1 | curved | 0.05768..0.05852 | 0.1344..0.1792 | -0.0077..0.0077 | branch-0 |
| @part | 280 | leaf-2 | curved | 0.05768..0.05852 | 0.1344..0.175003 | 0..0.026633 | branch-0 |
| @part | 280 | branch-1 | curved | 0.00005..0.018985 | 0.15792..0.16128 | 0.003646..0.054939 | stem,leaf-3,leaf-4,leaf-5 |
| @part | 280 | leaf-3 | curved | 0.017824..0.043413 | 0.1596..0.200203 | 0.046627..0.054857 | branch-1 |
| @part | 280 | leaf-4 | curved | 0.010501..0.025407 | 0.1596..0.2044 | 0.052478..0.058035 | branch-1 |
| @part | 280 | leaf-5 | curved | -0.007506..0.017824 | 0.1596..0.200203 | 0.054857..0.063886 | branch-1 |
| @part | 280 | branch-2 | curved | -0.046985..-0.00285 | 0.18312..0.18648 | 0.001612..0.034596 | stem,leaf-6,leaf-7,leaf-8 |
| @part | 280 | leaf-6 | curved | -0.046664..-0.031009 | 0.1848..0.225403 | 0.033903..0.055944 | branch-2 |
| @part | 280 | leaf-7 | curved | -0.05187..-0.042138 | 0.1848..0.2296 | 0.027674..0.040627 | branch-2 |
| @part | 280 | leaf-8 | curved | -0.062998..-0.046664 | 0.1848..0.225403 | 0.012357..0.033903 | branch-2 |
| @part | 280 | branch-3 | curved | -0.046985..-0.00285 | 0.20832..0.21168 | -0.034596..-0.001612 | stem,leaf-9,leaf-10,leaf-11 |
| @part | 280 | leaf-9 | curved | -0.062998..-0.046664 | 0.21..0.250603 | -0.033903..-0.012357 | branch-3 |
| @part | 280 | leaf-10 | curved | -0.05187..-0.042138 | 0.21..0.2548 | -0.040627..-0.027674 | branch-3 |
| @part | 280 | leaf-11 | curved | -0.046664..-0.031009 | 0.21..0.250603 | -0.055944..-0.033903 | branch-3 |
| @part | 280 | branch-4 | curved | 0.00005..0.018985 | 0.23352..0.23688 | -0.054939..-0.003646 | stem,leaf-12,leaf-13,leaf-14 |
| @part | 280 | leaf-12 | curved | -0.007506..0.017824 | 0.2352..0.275803 | -0.063886..-0.054857 | branch-4 |
| @part | 280 | leaf-13 | curved | 0.010501..0.025407 | 0.2352..0.28 | -0.058035..-0.052478 | branch-4 |
| @part | 280 | leaf-14 | curved | 0.017824..0.043413 | 0.2352..0.275803 | -0.054857..-0.046627 | branch-4 |

@inventory 600: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 600 | * | bounds | -0.134996..0.1254 | 0..0.6 | -0.136899..0.136899 | - |
| @part | 600 | pot | hollow | -0.114..0.114 | 0..0.204 | -0.114..0.114 | ground,soil |
| @part | 600 | soil | curved | -0.1032..0.1032 | 0.0108..0.204 | -0.1032..0.1032 | pot,stem |
| @part | 600 | stem | cylinder | -0.0084..0.0084 | 0.204..0.504 | -0.0084..0.0084 | soil,branch-0,branch-1,branch-2,branch-3,branch-4 |
| @part | 600 | branch-0 | curved | 0.0084..0.1236 | 0.2844..0.2916 | -0.0036..0.0036 | stem,leaf-0,leaf-1,leaf-2 |
| @part | 600 | leaf-0 | curved | 0.1236..0.1254 | 0.288..0.375006 | -0.057071..0 | branch-0 |
| @part | 600 | leaf-1 | curved | 0.1236..0.1254 | 0.288..0.384 | -0.0165..0.0165 | branch-0 |
| @part | 600 | leaf-2 | curved | 0.1236..0.1254 | 0.288..0.375006 | 0..0.057071 | branch-0 |
| @part | 600 | branch-1 | curved | 0.000108..0.040682 | 0.3384..0.3456 | 0.007813..0.117727 | stem,leaf-3,leaf-4,leaf-5 |
| @part | 600 | leaf-3 | curved | 0.038195..0.093029 | 0.342..0.429006 | 0.099915..0.117551 | branch-1 |
| @part | 600 | leaf-4 | curved | 0.022502..0.054443 | 0.342..0.438 | 0.112452..0.124361 | branch-1 |
| @part | 600 | leaf-5 | curved | -0.016084..0.038195 | 0.342..0.429006 | 0.117551..0.136899 | branch-1 |
| @part | 600 | branch-2 | curved | -0.100682..-0.006108 | 0.3924..0.3996 | 0.003453..0.074134 | stem,leaf-6,leaf-7,leaf-8 |
| @part | 600 | leaf-6 | curved | -0.099995..-0.066449 | 0.396..0.483006 | 0.07265..0.11988 | branch-2 |
| @part | 600 | leaf-7 | curved | -0.111149..-0.090296 | 0.396..0.492 | 0.059301..0.087057 | branch-2 |
| @part | 600 | leaf-8 | curved | -0.134996..-0.099995 | 0.396..0.483006 | 0.026479..0.07265 | branch-2 |
| @part | 600 | branch-3 | curved | -0.100682..-0.006108 | 0.4464..0.4536 | -0.074134..-0.003453 | stem,leaf-9,leaf-10,leaf-11 |
| @part | 600 | leaf-9 | curved | -0.134996..-0.099995 | 0.45..0.537006 | -0.07265..-0.026479 | branch-3 |
| @part | 600 | leaf-10 | curved | -0.111149..-0.090296 | 0.45..0.546 | -0.087057..-0.059301 | branch-3 |
| @part | 600 | leaf-11 | curved | -0.099995..-0.066449 | 0.45..0.537006 | -0.11988..-0.07265 | branch-3 |
| @part | 600 | branch-4 | curved | 0.000108..0.040682 | 0.5004..0.5076 | -0.117727..-0.007813 | stem,leaf-12,leaf-13,leaf-14 |
| @part | 600 | leaf-12 | curved | -0.016084..0.038195 | 0.504..0.591006 | -0.136899..-0.117551 | branch-4 |
| @part | 600 | leaf-13 | curved | 0.022502..0.054443 | 0.504..0.6 | -0.124361..-0.112452 | branch-4 |
| @part | 600 | leaf-14 | curved | 0.038195..0.093029 | 0.504..0.591006 | -0.117551..-0.099915 | branch-4 |

@inventory 800: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 800 | * | bounds | -0.179995..0.1672 | 0..0.8 | -0.182531..0.182531 | - |
| @part | 800 | pot | hollow | -0.152..0.152 | 0..0.272 | -0.152..0.152 | ground,soil |
| @part | 800 | soil | curved | -0.1376..0.1376 | 0.0144..0.272 | -0.1376..0.1376 | pot,stem |
| @part | 800 | stem | cylinder | -0.0112..0.0112 | 0.272..0.672 | -0.0112..0.0112 | soil,branch-0,branch-1,branch-2,branch-3,branch-4 |
| @part | 800 | branch-0 | curved | 0.0112..0.1648 | 0.3792..0.3888 | -0.0048..0.0048 | stem,leaf-0,leaf-1,leaf-2 |
| @part | 800 | leaf-0 | curved | 0.1648..0.1672 | 0.384..0.500007 | -0.076095..0 | branch-0 |
| @part | 800 | leaf-1 | curved | 0.1648..0.1672 | 0.384..0.512 | -0.022..0.022 | branch-0 |
| @part | 800 | leaf-2 | curved | 0.1648..0.1672 | 0.384..0.500007 | 0..0.076095 | branch-0 |
| @part | 800 | branch-1 | curved | 0.000144..0.054243 | 0.4512..0.4608 | 0.010417..0.156969 | stem,leaf-3,leaf-4,leaf-5 |
| @part | 800 | leaf-3 | curved | 0.050926..0.124038 | 0.456..0.572007 | 0.133219..0.156734 | branch-1 |
| @part | 800 | leaf-4 | curved | 0.030003..0.072591 | 0.456..0.584 | 0.149936..0.165815 | branch-1 |
| @part | 800 | leaf-5 | curved | -0.021445..0.050926 | 0.456..0.572007 | 0.156734..0.182531 | branch-1 |
| @part | 800 | branch-2 | curved | -0.134243..-0.008144 | 0.5232..0.5328 | 0.004605..0.098846 | stem,leaf-6,leaf-7,leaf-8 |
| @part | 800 | leaf-6 | curved | -0.133326..-0.088598 | 0.528..0.644007 | 0.096867..0.15984 | branch-2 |
| @part | 800 | leaf-7 | curved | -0.148199..-0.120395 | 0.528..0.656 | 0.079069..0.116076 | branch-2 |
| @part | 800 | leaf-8 | curved | -0.179995..-0.133326 | 0.528..0.644007 | 0.035305..0.096867 | branch-2 |
| @part | 800 | branch-3 | curved | -0.134243..-0.008144 | 0.5952..0.6048 | -0.098846..-0.004605 | stem,leaf-9,leaf-10,leaf-11 |
| @part | 800 | leaf-9 | curved | -0.179995..-0.133326 | 0.6..0.716007 | -0.096867..-0.035305 | branch-3 |
| @part | 800 | leaf-10 | curved | -0.148199..-0.120395 | 0.6..0.728 | -0.116076..-0.079069 | branch-3 |
| @part | 800 | leaf-11 | curved | -0.133326..-0.088598 | 0.6..0.716007 | -0.15984..-0.096867 | branch-3 |
| @part | 800 | branch-4 | curved | 0.000144..0.054243 | 0.6672..0.6768 | -0.156969..-0.010417 | stem,leaf-12,leaf-13,leaf-14 |
| @part | 800 | leaf-12 | curved | -0.021445..0.050926 | 0.672..0.788007 | -0.182531..-0.156734 | branch-4 |
| @part | 800 | leaf-13 | curved | 0.030003..0.072591 | 0.672..0.8 | -0.165815..-0.149936 | branch-4 |
| @part | 800 | leaf-14 | curved | 0.050926..0.124038 | 0.672..0.788007 | -0.156734..-0.133219 | branch-4 |

@inventory 1100: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | 1100 | * | bounds | -0.247493..0.2299 | 0..1.1 | -0.250981..0.250981 | - |
| @part | 1100 | pot | hollow | -0.209..0.209 | 0..0.374 | -0.209..0.209 | ground,soil |
| @part | 1100 | soil | curved | -0.1892..0.1892 | 0.0198..0.374 | -0.1892..0.1892 | pot,stem |
| @part | 1100 | stem | cylinder | -0.0154..0.0154 | 0.374..0.924 | -0.0154..0.0154 | soil,branch-0,branch-1,branch-2,branch-3,branch-4 |
| @part | 1100 | branch-0 | curved | 0.0154..0.2266 | 0.5214..0.5346 | -0.0066..0.0066 | stem,leaf-0,leaf-1,leaf-2 |
| @part | 1100 | leaf-0 | curved | 0.2266..0.2299 | 0.528..0.68751 | -0.104631..0 | branch-0 |
| @part | 1100 | leaf-1 | curved | 0.2266..0.2299 | 0.528..0.704 | -0.03025..0.03025 | branch-0 |
| @part | 1100 | leaf-2 | curved | 0.2266..0.2299 | 0.528..0.68751 | 0..0.104631 | branch-0 |
| @part | 1100 | branch-1 | curved | 0.000198..0.074584 | 0.6204..0.6336 | 0.014323..0.215832 | stem,leaf-3,leaf-4,leaf-5 |
| @part | 1100 | leaf-3 | curved | 0.070023..0.170553 | 0.627..0.78651 | 0.183177..0.215509 | branch-1 |
| @part | 1100 | leaf-4 | curved | 0.041254..0.099812 | 0.627..0.803 | 0.206162..0.227996 | branch-1 |
| @part | 1100 | leaf-5 | curved | -0.029487..0.070023 | 0.627..0.78651 | 0.215509..0.250981 | branch-1 |
| @part | 1100 | branch-2 | curved | -0.184584..-0.011198 | 0.7194..0.7326 | 0.006331..0.135913 | stem,leaf-6,leaf-7,leaf-8 |
| @part | 1100 | leaf-6 | curved | -0.183323..-0.121823 | 0.726..0.88551 | 0.133192..0.21978 | branch-2 |
| @part | 1100 | leaf-7 | curved | -0.203774..-0.165543 | 0.726..0.902 | 0.108719..0.159605 | branch-2 |
| @part | 1100 | leaf-8 | curved | -0.247493..-0.183323 | 0.726..0.88551 | 0.048544..0.133192 | branch-2 |
| @part | 1100 | branch-3 | curved | -0.184584..-0.011198 | 0.8184..0.8316 | -0.135913..-0.006331 | stem,leaf-9,leaf-10,leaf-11 |
| @part | 1100 | leaf-9 | curved | -0.247493..-0.183323 | 0.825..0.98451 | -0.133192..-0.048544 | branch-3 |
| @part | 1100 | leaf-10 | curved | -0.203774..-0.165543 | 0.825..1.001 | -0.159605..-0.108719 | branch-3 |
| @part | 1100 | leaf-11 | curved | -0.183323..-0.121823 | 0.825..0.98451 | -0.21978..-0.133192 | branch-3 |
| @part | 1100 | branch-4 | curved | 0.000198..0.074584 | 0.9174..0.9306 | -0.215832..-0.014323 | stem,leaf-12,leaf-13,leaf-14 |
| @part | 1100 | leaf-12 | curved | -0.029487..0.070023 | 0.924..1.08351 | -0.250981..-0.215509 | branch-4 |
| @part | 1100 | leaf-13 | curved | 0.041254..0.099812 | 0.924..1.1 | -0.227996..-0.206162 | branch-4 |
| @part | 1100 | leaf-14 | curved | 0.070023..0.170553 | 0.924..1.08351 | -0.215509..-0.183177 | branch-4 |
<!-- @generated-plant-parts:end -->

`potted-plant/<높이-mm>`의 허용 높이는 0.18, 0.28, 0.60, 0.80, 1.10m다. 화분 바닥 중심이 원점, +Y가 위, +Z는 관찰을 위한 앞이다. 각 H에서 화분 높이는 0.34H, 외경은 0.38H, 흙 표면은 0.34H, 줄기는 흙에서 0.84H까지, 수관의 외경 상한은 0.60H다. pot 벽 두께는 max(0.006,0.018H)m이고 열린 윗면의 inner wall과 바깥 wall은 둥근 rim에서 연결된다. 줄기 지름은 0.028H이고 가지 다섯은 y=(0.48+0.09i)H에서 시작해 방위 72i°, 길이 0.18H로 뻗는다(i=0..4). 각 끝에 길이 0.16H, 폭 0.055H의 닫힌 잎 세 개를 위쪽 Y축에 대해 −25°,0°,+25°로 놓아 총 15개가 된다. 맨 위 가지(i=4)의 중앙 잎 끝은 y=H라 선언 높이와 실제 AABB가 같다. 같은 H에서 반복 순서와 변종 외형은 고정이다.

`pot/outer/inner/rim/sole`, `soil/upper/edge/underside`, `stem/outer/contact`, `branch-0..4/outer/contact`, `leaf-0..14/front/back/edge`가 안정 주소다. 잎은 앞·뒤가 각각 winding과 normal을 가진 닫힌 얇은 부피이고 UV가 각 면의 길이 축을 따른다. 45°·상부·방 거리 view에서 pot 개구, 연결된 가지와 잎 사이 빈 공간이 드러나야 한다. ref03 조리대 작은 화분, ref04 책장 식물은 0.18/0.28m 변종으로 채택하고 ref02의 바닥 화분은 0.60..1.10m 변종으로 채택한다. ref01의 외부 수목·생울타리는 spaces의 대지 owner이므로 이 prototype으로 옮기지 않는다. ref05 창 밖 식물도 이 실내 화분의 배치 증거로 쓰지 않는다. 실제 종의 특정과 성장·바람 응답은 이 형상에서 `unverified`다.

<!-- @authored-address-state:start -->
@address-state 180: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
@address-state 280: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
@address-state 600: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
@address-state 800: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
@address-state 1100: pot, soil, stem, branch-0, leaf-0, leaf-1, leaf-2, branch-1, leaf-3, leaf-4, leaf-5, branch-2, leaf-6, leaf-7, leaf-8, branch-3, leaf-9, leaf-10, leaf-11, branch-4, leaf-12, leaf-13, leaf-14
<!-- @authored-address-state:end -->

## 개별 책 {#books}

`book/<높이-mm>x<두께-mm>x<깊이-mm>`는 높이·두께(X)·깊이(Z)의 세 값을 모두 ID에 넣는다. 허용 조합은 `180x30x120`, `240x35x160`, `300x50x200` 세 가지다. 선반 접촉 중심이 원점, +Z가 책등이 보이는 앞이다. 표지 두 장은 두께 0.004m로 각각 x=−T/2..−T/2+0.004와 x=T/2−0.004..T/2, y=0..H,z=−D/2..D/2−0.006이다. 종이 블록은 x=−T/2+0.004..T/2−0.004, y=0.004..H−0.004,z=−D/2..D/2−0.006이며 책등은 양 표지의 +Z 끝을 잇는 z=D/2−0.006..D/2의 별도 판이다. 책등의 앞 모서리 반경 0.004m는 이 판의 폐합 범위 안에서 깎고 뒤쪽 접합면은 두 표지와 종이에 면 접촉한다. `cover-left/right/outer/inner/top/bottom/fore-edge/spine-edge`, `spine/outer/inner/top/bottom`, `pages/front/left/right/top/bottom/back`의 실제 면을 분리한다. 각각 닫힌 부피이며 표지 접합선은 책등의 안쪽에서 끝난다. 정면·상부·45°에서 책등과 개별 폭이 읽혀야 한다. ref04 벽 책장과 ref02 작은 침실 책상·선반의 개별 책을 채택하되 ref03의 장식 그릇을 책으로 바꾸지 않는다. ref01·05에는 책 치수 근거가 없다. 책의 수·회전은 instances가, 제목·인쇄는 미정 설정이 정하기 전까지 `unverified`다.

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

`folded-towel/<높이-mm>`의 허용 전체 높이는 0.08, 0.12, 0.16m이고 폭 0.38, 접힌 깊이 0.60m다. 선반 접촉 중심 원점, +Z가 접힌 앞이다. 세 겹의 부피는 각각 높이 h=(H−0.008)/3이고 앞쪽 모서리 반경 0.02m다. 아래에서 위로 `layer-0`은 y=0..h, `layer-1`은 y=h+0.004..2h+0.004, `layer-2`는 y=2h+0.008..H에 놓는다. 두 0.004m 음영 틈의 뒤쪽 z=−0.30..−0.27에는 `fold-0`이 y=h..h+0.004로, 앞쪽 z=+0.27..+0.30에는 `fold-1`이 y=2h+0.004..2h+0.008로 놓여 아래·위 겹의 대면적 접촉면에 각각 닿는다. 각 fold의 X 폭은 0.38m이며 세 겹과 두 접힘은 한 연속 접촉 그래프를 만든다. `layer-0..2/upper/fold-front/fold-back/fold-side/underside`와 `fold-0..1/front/back/top/sole/side`가 각 부품의 전 표면을 덮고 layer 번호는 아래에서 위로 증가한다. 정면·측면·45°에서 겹수가 읽혀야 한다. ref02 욕실·linen 수납의 쌓인 수건을 채택한다. ref01·03·04·05에는 접힌 수건을 판독할 근거가 없다. 섬유 유연성과 실제 습기 응답은 `unverified`다.

다음 세 상태는 높이 토큰 80·120·160mm를 각각 전개한다. `h=(H−0.008)/3`의 무한소수 경계는 표에서 0.0000001m 이내로 바깥 반올림했고, 실제 접촉면은 같은 원래 식을 공유한다.

@scalar-control fold-gap-total: 0.008
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

@axis-control default: wall, X, 0.195, handle recess center

`storage-basket`은 폭 0.40, 깊이 0.65, 높이 0.28m다. 선반 접촉 중심 원점, +Z가 꺼내는 앞이다. 바닥 두께 0.012m, 네 벽 두께 0.010m, 상단 rim 폭 0.018m이며 내부는 열린 빈 공간이다. 양쪽 손잡이는 x=±0.195m 측벽의 z=−0.06..+0.06,y=0.208..0.243m인 0.12×0.035m 관통 구멍을 감싼 두께 0.012m 띠다. 보강 띠는 벽의 안쪽 x=±(0.188..0.200)에 매립되어 전체 폭을 늘리지 않는다. 그 바깥 경계는 z=±0.072,y=0.196..0.255m이며 위 rim과 0.007m 떨어진다. `wall/outer/inner/edge`, `rim/upper/edge/underside`, `bottom/upper/edge/underside`, `handle-left/right/outer/inner/cut-edge/contact`가 안정 주소다. 상부·정면·45°에서 내부와 구멍 둘을 확인한다. ref02의 1층 수납과 상층 linen의 바구니 역할을 채택하고 ref04의 책을 바구니 안 내용물로 자동 생성하지 않는다. ref01·03·05는 바구니 형상 근거가 없다. 내용물·개수는 instances가 결정하고 손잡이 하중은 `unverified`다.

벽은 y=0.012..0.262, rim은 y=0.262..0.280이다. 벽 내부의 빈 공간은 x=±0.190,z=±0.315로 관통하고 rim의 열린 안쪽은 x=±0.182,z=±0.307이다. 각 손잡이의 외곽 x=−0.200..−0.188 또는 +0.188..+0.200, y=0.196..0.255,z=±0.072를 벽에서 먼저 절삭하고 동일한 외곽의 별도 띠 부품을 넣는다. 띠 중앙은 y=0.208..0.243,z=±0.060으로 절삭한다. 벽과 띠는 바깥 모서리를 공유하지만 부피를 복제하지 않는다.

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

`entry-charger`는 폭 0.07, 깊이 0.12, 높이 0.015m다. [벽걸이 선반](002-storage-and-sleep.md#entry-charging-shelf)에 닿는 아래면 중심이 원점, +Z가 조작면이다. 본체 위쪽 x=±0.026,z=±0.0375,y=0.013..0.015m를 절삭해 0.052×0.075×0.002m 인터페이스를 flush로 끼운다. 앞쪽 edge z=+0.05..+0.06,x=±0.006,y=0.0045..0.0105m에는 폭 0.012·높이 0.006·깊이 0.010m 단자 구멍을 실제로 절삭한다. `body/front/back/top/edge/sole/port-inner/port-edge`, `interface/front/back/edge`가 안정 주소다. 정면·상부·측면과 현관 리뷰 거리 관찰에서 과장된 두꺼운 판으로 보이지 않는지 확인한다. ref02의 현관 충전 기능을 settings의 평벽 선반에 연결한다. ref01·03·04·05의 창·작업 기기를 충전기 형상으로 삼지 않는다. 실제 충전 과정은 systems 결정 전까지 `unverified`다.

`port`는 빈 구멍의 내면 주소이며 별도 고체 부품이 아니다. 아래 두 `@void`는 body의 정확한 직육면체 절삭 체적이다. 첫 절삭에 interface가 측면·바닥으로 접하고 두 번째는 빈 단자 구멍이다. 이 표의 `support`는 모델 원점 y=0에서 선반 상면과 닿는 접촉 평면이다.

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

`living-rug`는 폭 2.80, 깊이 3.65, 높이 0.016m, `bedroom-rug/1600x2200`은 폭 1.60, 깊이 2.20, 높이 0.012m다. 바닥 접촉 중심이 원점, +Z가 긴 축이다. base 높이는 living 0.013m·bedroom 0.009m, pile 높이는 두 변종 모두 0.003m다. 상면 pile 부피와 0.025m 폭의 직조 둘레 띠를 별도 주소 `pile/upper/edge/underside`, `bound-edge/upper/inner/outer/underside`, `base/upper/edge/contact`로 나누고 바닥판에 녹이지 않는다. 상면 UV는 장축 Z를 따른다. 위·낮은 측면·실내 거리 view에서 둘레와 소파 발 또는 침대 곁의 접촉이 보여야 한다. ref02 침실 러그와 거실 러그, ref03 소파 앞 직물 경계를 채택한다. ref01·04·05에는 러그 상세가 없어 문턱 재료를 직물로 치환하지 않는다. 실제 pile 섬유 개별 형상과 미끄럼은 `unverified`다.

`round-rug/1200`은 ref02의 작은 침실에서 보이는 원형 러그를 채택한 지름 1.20m·높이 0.012m 변종이다. 접지 중심이 원점이고 장식 회전은 둘레가 균등하므로 +Z가 방 입구를 향한다. y=0..0.009의 닫힌 원판 base, y=0.009..0.012의 pile, 바깥 반경 0.60m에서 안쪽으로 0.025m 폭의 bound-edge를 갖는다. 원형 둘레는 [공통 곡면 분할](000-representation.md#model-uv-and-topology)의 24구간을 사용하고 `pile/upper/edge/underside`, `bound-edge/upper/inner/outer/underside`, `base/upper/edge/contact`를 직사각 변종과 같이 낸다. 실제 작은 침실의 문 호와 침대 발 사이 통행을 침범하는지는 instances의 배치 검증 전까지 `unverified`다.

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

`wall-art/600x420`은 폭 0.60, 높이 0.42, 전체 깊이 0.035m다. 벽 접합 뒷면 중심이 원점, +Z가 보는 앞이다. 폭 0.025m 프레임 띠, z=0..0.012의 뒤판, z=0.012..0.013의 중앙 이미지 수신용 빈 종이 면, z=0.013..0.021의 0.008m 매트, z=0.031..0.035의 0.004m 전면 cover를 가진다. z=0.021..0.031은 0.010m 빈 공기층이고 프레임은 외곽에서 z=0.012..0.035를 연결한다. `frame/front/edge/back`, `mat/front/back/edge`, `artwork/front/back/edge`, `cover/front/back/edge`, `back/outer/contact`가 안정 주소다. 실제 그림 내용·색은 model이 결정하지 않고 materials의 결합 전까지 중립 면이다. 정면·측면·45°와 침실 거리에서 사진 billboard가 아닌 실제 두께·frame이 보여야 한다. ref02 작은 침실 벽의 액자 한 점을 채택한다. ref01·03·04·05의 창 너머 장면을 액자 이미지로 붙이지 않는다. 특정 가족 사진·직업 단서는 설정에 없으므로 표현하지 않으며 실제 그림 내용은 `unverified`다.

프레임의 안쪽 경계는 x=±0.275,y=±0.185이고 이 개구를 z=0.012..0.035에 관통 절삭한다. 매트는 그 개구를 채우는 테두리로서 중앙 x=±0.230,y=±0.140을 z=0.013..0.021에 절삭한다. 종이 artwork는 그 중앙 x=±0.230,y=±0.140을 채우고 뒤판에 붙으며, 투명 cover는 프레임 개구 전체 x=±0.275,y=±0.185에서 z=0.031..0.035로 프레임 안쪽 네 면에 닿는다. 빈 공기층에는 감춘 지지대나 중복 평판이 없다.

@scalar-control frame-border-width: 0.025
@scalar-control cover-air-gap: 0.010

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

@axis-control cup: handle, Y, 0.050, handle ring center
@axis-control cup: handle, Y, 0.034, lower joining pad
@axis-control cup: handle, Y, 0.042, lower joining pad edge
@axis-control cup: handle, Y, 0.063, upper joining pad start
@axis-control cup: handle, Y, 0.069, upper joining pad edge

`decor-bowl`은 외경 0.22, 높이 0.07m, 벽 두께 0.008m이고 아래면 중심 원점, +Y 위다. 상단 개구 내경 0.204m, 안쪽 바닥 y=0.014이며 `shell/outer/inner/rim/sole`로 나눈다. `decor-tray`는 전체 폭 0.36·깊이 0.24·높이 0.032m이며 y=0..0.018m의 타원형 바닥과 y=0.018..0.032m의 높이 0.014m·두께 0.006m 둘레 턱을 가진 낮은 판이고 `base/upper/underside/edge`, `rim/inner/outer/top/underside`이다. `decor-cup`은 몸체 외경 0.085, 높이 0.095, 벽 두께 0.006m의 빈 원통과 외경 0.04m 손잡이를 가진다. 손잡이는 YZ 평면의 외경 0.04m인 닫힌 고리로 튜브 지름 0.006m, 중심 y=0.050,z=+0.0625에 둔다. 고리의 뒤쪽 끝 z=+0.0425는 몸체 외벽에 닿고 앞쪽 끝은 z=+0.0825다. 한 handle 부품 안의 위·아래 접합 pad는 각각 y=0.034..0.042와 0.063..0.069, x=±0.006m이며 뒷면은 컵의 반지름 0.0425m인 원통 바깥면을 따라 굽는다. 두 pad는 몸체 외벽의 유한 곡면에 접하고 빈 내벽 반지름 0.0365m 안으로 들어가지 않는다. pad의 앞면은 고리 몸체에 연속 접합한다. 바닥 접촉 중심 기준 전체 AABB는 x=±0.0425,y=0..0.095,z=−0.0425..+0.0825m다. 주소는 `body/outer/inner/rim/sole`, `handle/outer/inner/contact`다. 세 물체는 모두 놓이는 아래면 중심이 원점이고 +Z는 손잡이가 향한 앞이다. 위·측면·45°와 식탁 거리에서 빈 내부와 서로 다른 높이가 읽혀야 한다. ref03 낮은 탁자의 그릇과 조리대의 작은 소품, ref02 식탁의 그릇을 채택한다. ref01·04·05의 식사 장면은 없으므로 음식·브랜드·문구는 만들지 않는다. 각 소품의 개수와 놓이는 상판은 instances가 맡고 식품 접촉 성능은 `unverified`다.

컵 pad 뒷면은 `z_back(x)=sqrt(R²−x²)`로서 R=0.0425m이고 |x|≤0.006m다. 앞면은 각 pad의 높이에서 `z_front(y)=0.0625−sqrt(0.02²−(y−0.050)²)+0.001`이며, 몸체 쪽 X 폭 0.012m를 고리 쪽 X 폭 0.006m로 선형으로 좁힌 닫힌 입체다. 위 pad는 y=0.063..0.069, 아래 pad는 y=0.034..0.042를 채운다. 앞면의 0.001m는 같은 handle 고리 외벽 속으로 들어가는 결합 여유이므로 내부가 연속한다. 뒷면만 몸체 외면과 공유하고 pad 내부는 몸체 바깥쪽에 있다. 따라서 handle의 Z 최소값은 sqrt(0.0425²−0.006²)=0.042074m(바깥쪽 반올림)이고, 단순 AABB의 0.000426m 겹침은 고체 관통이 아니다. `@bore`는 Y축 원통 내부의 위쪽 열린 구멍, `@ellipse`는 타원형 rim의 안쪽·바깥쪽 반축을 적는다. `support`는 탁자 상면의 y=0 접촉이다.

@scalar-control bowl-wall-thickness: 0.008
@scalar-control bowl-inner-diameter: 0.204
@scalar-control cup-handle-diameter: 0.04
@scalar-control cup-upper-pad-start: 0.063
@scalar-control cup-aabb-contact-overlap: 0.000426
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
| @part | cup | handle | curved | -0.006..0.006 | 0.03..0.071 | 0.042074..0.0825 | body |

<!-- @authored-address-state:start -->
@address-state bowl: shell
@address-state tray: base, rim
@address-state cup: body, handle
<!-- @authored-address-state:end -->

## 거실 화면 {#living-display}

`living-display`는 폭 1.43, 높이 0.80, 깊이 0.045m다. 벽 mount 접합면 중심이 원점, +Z가 시청자 쪽이다. mount는 폭 0.18·높이 0.12·깊이 0.018m로 z=0..0.018이다. 뒤판 housing은 폭 1.43·높이 0.80·깊이 0.021m로 z=0.018..0.039이고 bezel의 0.006m 깊이를 합치면 display 외함의 전체 깊이가 0.027m다. bezel은 바깥 가장자리에서 폭 0.018m를 차지하며 중앙 screen을 위한 전면 개구를 실제로 절삭한다. screen은 z=0.039..0.042m의 두께 0.003m 판이고 bezel 전면 z=0.045보다 0.003m 물린다. `screen/front/back/edge`, `bezel/front/back/edge`, `housing/front/back/edge`, `mount/outer/contact`가 안정 주소다. 정면·측면·45°에서 bezel와 벽 이격을 확인한다. ref02와 ref03 거실의 미디어 장치를 채택하며 ref01·04·05의 유리 벽을 화면으로 오인하지 않는다. 영상 내용과 전력 상태는 이 형상에서 `unverified`다.

bezel의 중앙 개구는 x=±0.697,y=±0.382,z=0.039..0.045를 관통하고 그 내벽이 screen의 절단 edge에 닿는다. housing 뒤판과 screen 뒷면은 z=0.039에서 맞닿으며 두 부품의 면은 복제하지 않는다.

@scalar-control housing-plus-bezel-depth: 0.027

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

## 천장 매입등 {#recessed-light}

`recessed-light`는 외경 0.12, 전체 깊이 0.04m다. 천장 접합면 중심이 원점이고 +Y가 천장 안쪽이므로 보이는 trim은 외경 0.12m·내경 0.095m의 닫힌 고리로 y=−0.025..0이고, 별도 천장 구멍을 요구하지 않는 얕은 housing-body는 외경 0.085m, y=−0.037..−0.028다. housing-flange는 별도 닫힌 원판으로 외경 0.10m,y=−0.028..−0.025이며 housing-body 상면과 trim 아래면의 반지름 0.0475..0.05m 환형 접촉면에 닿는다. 이는 천장면 아래에서 마감되는 0.04m 표면 부착 다운라이트이며 천장 안으로 매립된 부품이라고 주장하지 않는다. 확산면 지름 0.095m·두께 0.003m는 y=−0.040..−0.037에 놓여 housing-body의 아래면과 반지름 0..0.0425m의 원판 면으로 닿는다. 방 쪽 −Y에서 수직으로 보면 발광면의 지름 0.095m 전체가 앞을 향하고, 비발광 몸체·flange·trim은 그 면을 가리지 않는다. `housing-body/outer/sole/top`, `housing-flange/top/edge/underside`, `trim/front/edge/contact`, `diffuser/front/back/edge`가 안정 주소다. diffuser의 발광 과정은 system emitter와 별도 대응하고 housing은 emissive가 아니다. 아래·45°와 실내 거리에서 trim 깊이를 확인한다. ref03·04·05의 작은 천장 점등을 채택하고 ref01의 실내 빛점을 특정 fixture의 형상 근거로 쓰지 않는다. ref02는 두 층 반복 위치의 검사 자료다. 실제 광량은 systems 소유이며 이 모델 H2의 결과로는 `unverified`다.

`@radial`은 동심 Y축 부품의 실제 내·외 반지름이며 `ceiling`은 y=0 접촉 평면이다. housing-flange가 몸체의 윗면과 맞대고 trim의 고리 아래면에서 유한 환형 접촉면을 만든다. diffuser의 −Y face가 네 부품 중 가장 방 쪽이며 그 원판의 투영은 다른 부품에 가려지지 않는다.

@inventory default: housing-body, housing-flange, trim, diffuser
@emitter-face default: diffuser, -Y
@radial default: housing-body, 0, 0.0425
@radial default: housing-flange, 0, 0.05
@radial default: trim, 0.0475, 0.06
@radial default: diffuser, 0, 0.0475

| kind | state | part | shape | X min..max | Y min..max | Z min..max | contact |
| --- | --- | --- | --- | --- | --- | --- | --- |
| @envelope | default | * | bounds | -0.06..0.06 | -0.04..0 | -0.06..0.06 | - |
| @part | default | housing-body | cylinder | -0.0425..0.0425 | -0.037..-0.028 | -0.0425..0.0425 | housing-flange,diffuser |
| @part | default | housing-flange | cylinder | -0.05..0.05 | -0.028..-0.025 | -0.05..0.05 | housing-body,trim |
| @part | default | trim | hollow | -0.06..0.06 | -0.025..0 | -0.06..0.06 | ceiling,housing-flange |
| @part | default | diffuser | cylinder | -0.0475..0.0475 | -0.04..-0.037 | -0.0475..0.0475 | housing-body |

<!-- @authored-address-state:start -->
@address-state default: housing-body, housing-flange, trim, diffuser
<!-- @authored-address-state:end -->

## 가는 원통 식탁 펜던트 {#dining-pendant}

`dining-pendant`는 천장 cord 고정점이 원점, +Y가 천장 안쪽, 아래가 식탁으로 향한다. 전체 하향 길이 1.00m 중 cord는 y=−0.62..0에 지름 0.006m, 가는 원통 shade는 y=−1.00..−0.62에 지름 0.045m, 하단 diffuser는 지름 0.038m·두께 0.003m로 y=−0.989..−0.986에 후퇴한다. 천장 canopy는 지름 0.08, 높이 0.018m로 천장면 아래 y=−0.018..0에 닿는다. cord가 지나는 중앙 지름 0.006m 구멍을 절삭하고 그 edge에서 cord에 접하므로 천장 안쪽으로 들어가지 않는다. shade는 안쪽 반지름 0.019m인 `shade-wall`(y=−1.00..−0.625)과 그 위의 닫힌 `shade-cap`(y=−0.625..−0.620) 두 부품으로 연결하고 cap 상면에 cord 단면을 맞댄다. `cord/outer/end`, `canopy/outer/contact`, `shade-wall/outer/inner/edge`, `shade-cap/top/underside/edge`, `diffuser/front/back/edge`가 안정 주소다. 원통 내부는 diffuser까지 열린 음영 공간이며 원판형 0.38m shade를 남기지 않는다. 정면·측면·45°와 ref03 식탁 거리에서 가는 세로선으로 보여야 한다. ref03의 원통 펜던트를 채택하고 ref02는 식탁 위 매달린 위치 관계만 채택한다. ref01·04·05에는 펜던트 형상 증거가 없다. 발광은 system emitter가 소유하고 모델 형상만으로 광량은 `unverified`다.

다음 `@radial`은 Y축 동심 부품의 실제 내·외반경이다. `ceiling`은 y=0의 천장 접합 평면이다. shade의 벽·cap은 서로 맞댐이고 diffuser 반지름 0.019m가 벽의 내반경에 면 접촉한다.

@scalar-control excluded-plate-shade-diameter: 0.38

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

@axis-control bedside-globe: globe, Y, 0.072, sphere cut and neck top

세 변종의 부품 표는 바닥 또는 놓인 상판을 y=0으로 삼는다. reading shade의 중앙 mounting bridge는 독립 `shade-bridge` 부품이고 안쪽 개구와 정확히 맞닿는다. desk-task head의 음각은 diffuser X 외곽까지 도달하므로 양쪽 측벽은 열리고, Y/Z 둘레 벽만 남는다. diffuser는 그 음각의 안쪽 면에 붙으며 체적을 공유하지 않는다.

@scalar-control reading-shade-wall: 0.005
@scalar-control reading-diffuser-stem-clearance: 0.001

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
| @part | desk-task | diffuser | curved | -0.045..0.045 | 0.36..0.364 | 0.045..0.135 | task-head |

`portable-lamp/reading`의 전체 점유는 폭·깊이 0.25, 높이 1.24m이고 바닥 받침 지름 0.25m로, 지름 0.018m stem이 y=0.025..1.10, 0.20m 지름의 원통 shade가 y=1.03..1.24다. `portable-lamp/bedside-globe`의 전체 점유는 폭·깊이 0.22, 높이 0.29m이며 상판 받침 지름 0.12·높이 0.015m, 짧은 stem 높이 0.055m, 구형 diffuser 지름 0.22m, 총 높이 0.29m다. `portable-lamp/desk-task`의 전체 점유는 x=±0.065,y=0..0.42,z=−0.065..+0.14m이며 받침 지름 0.13m, 총 높이 0.42m다. 이 변종은 0.015m 지름의 고정 두 구간 stem이 y=0.02..0.25와 y=0.25..0.36, 길이 0.14m 헤드가 +Z 방향으로 뻗어 아래쪽 diffuser 지름 0.09m를 드러낸다. 세 변종 모두 받침 아래면 중심이 원점, +Z가 빛을 향하는 방향이다. `base/upper/edge/sole`은 공통 주소다. reading은 y=0.025..1.10의 `stem-lower/outer/top/contact`, `shade/outer/inner/edge`, `shade-bridge/upper/edge/underside`, 아래쪽 y=1.03..1.034의 `diffuser/front/back/edge`를 낸다. shade의 외경은 0.20m, 벽 두께는 0.005m이고 독립 `shade-bridge` 부품은 y=1.10..1.12에서 stem 상면과 shade 내벽에 각각 유한 면으로 닿는다. diffuser는 외경 0.19m·중앙 통과 구멍 지름 0.020m인 얇은 환형 판으로 그 외곽이 shade 내벽에 닿는다. 지름 0.018m stem은 0.001m 반경 여유를 두고 diffuser 구멍을 통과하므로 발광판을 관통하지 않는다. bedside-globe는 y=0.015..0.070의 `stem-short/outer/top/contact`와 중심 y=0.18인 `globe/outer/inner/contact`를 낸다. 구는 반지름 0.11m로 y=0.072에서 수평 절단해 닫고, 같은 globe 부품의 반지름 0.009m 원통형 목을 y=0.070..0.072에 잇는다. 목의 하단에서 x/z=±0.006m 정사각형은 stem-short 상단 반지름 0.009m 원판 안에 들어가 유한 면으로 닿는다. 나머지 globe 외면은 확산면이다. desk-task는 `stem-lower/outer/top/contact`, `stem-upper/outer/top/contact`, y=0.36..0.42·z=0..0.14의 `task-head/outer/inner/edge`, 헤드 아래 중심 z=+0.09,y=0.36..0.364의 `diffuser/front/back/edge`를 낸다. 변종에 없는 stem·shade·globe·head·diffuser의 주소를 빈 부품으로 만들지 않는다. reading·desk-task의 diffuser와 bedside-globe의 globe 외면은 각각 별도 system emitter가 필요하다. 정면·측면·45°에서 바닥형/탁상형의 크기 차이, 구체와 두 구간 작업등을 판별한다. ref03의 거실 독서등, ref04의 구형 탁상등과 작업등을 각각 채택하고 ref02 협탁의 낮은 조명을 크기 관계로 받는다. ref01·05의 외피 빛 반사를 램프 형상으로 가져오지 않는다. 전기 안전·조도는 `unverified`다.

<!-- @authored-address-state:start -->
@address-state reading: base, stem-lower, shade, shade-bridge, diffuser
@address-state bedside-globe: base, stem-short, globe
@address-state desk-task: base, stem-lower, stem-upper, task-head, diffuser
<!-- @authored-address-state:end -->
