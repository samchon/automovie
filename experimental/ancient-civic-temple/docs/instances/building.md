# 신전 건물 부재 배치

공간의 평면·지붕·개구부를 한 번 조립한 결과에 [판정된 원형](../models/columns.md)을 배치한다. 이 문서는 독립 건축 부재의 수와 변환을 소유하며 외피 실체, 원형 형상, 표면 물성은 각 부모가 소유한다. 모든 ID는 역할과 기준선 이름에서 만들고 난수·카메라·생성 순서에 의존하지 않는다. 배치가 해당 원형의 치수와 접촉하지 않거나 통행 개구부를 막으면 실패다.

## 주랑과 포치 원주·보 {#columns-beams}

<!--
@evidence principles/core/common.md#declared-basis court·ring 기준선과 원주·보 원형의 주두/밑면을 입력으로 삼고, 북·남 네 축과 동·서 세 내부 축만 배치 결정으로 더한다.
@evidence principles/core/common.md#scope-preservation 중정 네 변의 14개 주랑 원주와 정문 포치의 두 원주, 네 변 보와 포치 보까지 이 단위가 주소화해 정문과 제실의 중앙 통과축을 남긴다.
@evidence principles/core/common.md#substantive-completion 모서리 공유, 경사별 원형 선택, 변별 보 회전, 주두-보 접촉과 출입축 공백을 수치·반례 위치로 고정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공간이 준 court 경계와 모델이 준 기둥 높이만으로는 14개 축과 동측 19° 배정이 정해지지 않으므로 이 단위가 축선 오프셋·공유 모서리·원형 membership을 결정한다.
@evidence principles/design/instances.md#instance-prototype-boundary 주랑은 columns.md의 12°·19° 원형만, 포치는 별도 포치 원형만 사용하며 크기를 개별 scale로 바꾸지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 주랑 축선은 court 경계에서 0.175m, 모서리 네 축과 변 중간 축은 같은 평면 기준선과 간격식에서 나온다.
@evidence principles/design/instances.md#instance-verification-address 북·남 네 기둥의 중앙 출입축 공백과 동측 중간 19° 세 기둥의 보 접촉을 별도 반례 위치로 지정한다.
@evidence obligations/design/instances.md#addressable-instance-decisions 원주·보의 수, 축선과 접촉 높이를 이 H2가 단독으로 정한다.
@evidence obligations/design/instances.md#instance-prototype-membership 12° 기둥은 북·남 각 네 축과 서측 중간 세 축, 19° 기둥은 동측 중간 세 축, 포치 기둥은 두 축에만 들어간다.
@evidence obligations/design/instances.md#instance-identity-transform 원주는 colonnade/side/axis, 보도 side 이름으로 ID를 만들고 원형 크기 1·회전 0 또는 90°로 둔다.
@evidence obligations/design/instances.md#instance-variation-tiers 지붕 경사에 따른 12°·19° 두 원형만 허용하고 단순화 tier나 밀도 전환을 쓰지 않는다.
@evidence obligations/design/instances.md#instance-placement-review 북·남 보 아래 양끝과 동측 보 중앙에서 주두 윗면-보 아랫면 접촉, 정문·제실 축의 보행 폭을 본다.
@evidence models/columns.md#colonnade-column 주랑의 0.34m 기단과 12°·19° 높이 원형을 그대로 쓴다.
@evidence models/columns.md#porch-column 현관 X=±1.35m의 두 포치 원형을 쓰고 3.20m 주두 위에 포치 보를 놓는다.
@evidence models/entablature.md#colonnade-beam 네 변의 보 변형과 동측 양끝 턱을 각 변 원주 위에 둔다.
@evidence models/entablature.md#porch-entablature 포치의 두 원주 위에 한 수평 보를 놓고 작은 박공을 받는 포치 원형의 상면 접촉을 확인한다.
@evidence spaces/building.md#plan-datums court·ring·porch 기준선을 축선과 중심 위치의 유일한 입력으로 삼는다.
@evidence spaces/rooms/colonnade.md#ring-volume 주랑의 네 변 안에서 원주가 실제 보행 폭을 침범하지 않고 양쪽 문 앞 중앙축을 비우도록 축을 나눈다.
@evidence spaces/rooms/entrance.md#entrance-volume 후퇴 포치 안의 두 원주가 정문 중앙 시선을 사이에 두고 박공 보를 받게 둔다.
@evidence settings/20-envelope.md#colonnade 네 면 주랑의 석주·목재 보 연속을 열네 주랑 원주와 네 변 보의 바닥-주두 접촉으로 실현한다.
@evidence settings/20-envelope.md#entrance-porch 후퇴한 포치에서 두 원주와 한 보가 정문 앞을 막지 않고 작은 박공 아래 이어진다.
@evidence settings/10-building.md#use-profile 기둥 위치를 중앙 출입축 밖으로 놓아 주랑과 정문에서 사람·운반물의 통행 포락을 남긴다.
@evidence materials/00-surface-palette.md#stone 원주의 석재 기단·몸통이 포치와 주랑에서 반복돼도 밝은 돌 결속을 유지한다.
@evidence materials/00-surface-palette.md#timber 주두 위 네 변 보와 포치 보는 어두운 목재 표면의 반복 배치다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 기둥 원형 높이·기단 폭과 주랑 court·ring 기준선을 모두 대조했고 북남 통행축 및 동측 턱 접촉은 기존 부모 치수로 성립한다.
-->

중정 경계 X=±3.5m, Z=−1.75/6.10m에서 중정 바깥쪽 0.175m의 축선을 쓴다. 북·남 변은 각 X=−3.675, −1.225, 1.225, 3.675m의 네 원주를 두고, 동·서 변은 양끝 모서리를 공유하므로 내부 세 축만 균등 분할한다. 총 주랑 원주는 14개다. 북·남·서와 네 모서리는 12° 원형, 동측 중간은 19° 원형이다. 네 보의 로컬 X 장축을 각 변에 맞추고 각각 같은 경사 원형의 주두 상면에 보 아랫면을 붙인다. 포치 원주는 X=±1.35m, Z=10.00m의 두 축이고 3.20m 보를 받는다. 이 원주와 보는 정문·제실 문 중앙축을 채우지 않는다. 반복 ID는 변과 축 좌표를 포함한다. 모든 배치는 단일 상세 tier이며 개별 임의 배율이나 시드가 없다.

## 문과 채광구 {#openings}

<!--
@evidence principles/core/common.md#declared-basis spaces/openings의 passage center·wallLow/High·swing과 clerestory profile·sill, models/openings의 폭·두께별 원형에서 틀과 문짝의 배치를 유도한다.
@evidence principles/core/common.md#scope-preservation 여덟 passage마다 틀과 문짝을, 여덟 채광구마다 host 두께에 맞는 틀을 배치하고 양개문 두 곳과 외개문 여섯 곳을 모두 포함한다.
@evidence principles/core/common.md#substantive-completion 벽 길이축 회전, 양쪽 또는 swing 쪽 경첩, 열린 90° 상태, 창틀의 sill−frame 원점을 정해 각 opening의 변환을 재현할 수 있게 한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation passage와 채광구의 구멍·치수는 공간과 모델이 정했지만, 이 단위가 각 host의 실제 틀·문짝 수, 경첩 쪽 변환, 열린 통행 상태를 정한다.
@evidence principles/design/instances.md#instance-prototype-boundary 여덟 문 passage별 틀·문짝과 여덟 채광구의 host 두께별 원형만 쓰고 문 폭이나 창 유리를 추가하지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 틀 중심은 passage의 center와 wallLow/High 중앙, 창은 profile 중앙과 sill에서 유도한다.
@evidence principles/design/instances.md#instance-verification-address 정문·제실 양개문의 양쪽 경첩과 서비스 외부 문의 열림 방향, 북·남·동·서 여덟 채광구를 반례 집합으로 지정한다.
@evidence obligations/design/instances.md#instance-prototype-membership 여덟 passage가 각각 틀 하나와 양개/외개 원형 한 쌍 또는 하나를 받고 채광구 여덟 개가 두 두께 변형을 공유한다.
@evidence obligations/design/instances.md#instance-identity-transform 문 ID와 leaf side로 안정 ID를 만들고 host 축에 따라 0 또는 90° 회전한다.
@evidence obligations/design/instances.md#instance-variation-tiers 문 기본 상태는 열린 90°이며 닫힌 원형을 실제 경첩 주위의 배치 회전으로 열어 둔다; 임의 단계별 LOD나 새 문짝은 없다.
@evidence obligations/design/instances.md#instance-placement-review 각 문턱에서 바닥 접촉과 실제 void 일치, 반대편 시점에서 문짝이 벽 속에 사라지지 않는지를 본다.
@evidence models/openings.md#door-frame 통과 폭·높이·벽 두께별 문틀 원형을 같은 passage에 결속한다.
@evidence models/openings.md#double-door-leaf 정문과 제실은 각각 두 half leaf를 경첩 양쪽에 배치한다.
@evidence models/openings.md#single-door-leaf 여섯 방·서비스 문은 해당 통과 폭의 외개문을 한 장씩 둔다.
@evidence models/openings.md#window-frame 0.30/0.60m host 두께와 0.4m 빈 채광구를 유지한다.
@evidence spaces/openings.md#doors passage 표의 center, axis, wallLow/High, swing을 직접 읽는다.
@evidence spaces/openings.md#clerestories 각 창의 경계·sill·profile 좌표를 직접 읽는다.
@evidence spaces/storey.md#threshold-support 문틀과 열린 문짝의 원점을 각 통과구 완성 바닥에 붙이고 실제 턱 위 통로를 남긴다.
@evidence spaces/openings.md#boundary-ownership 각 문틀·창틀은 새 구멍을 만들지 않고 기존 벽의 한 통과·채광 host에만 붙인다.
@evidence settings/20-envelope.md#openings 두 양개문과 여섯 단개문을 통과구별 열린 상태로 배치하고 여덟 높은 채광구에 빈 틀을 둔다.
@evidence materials/00-surface-palette.md#timber 열린 문짝 여덟 통과구의 목재 원형을 벽과 구별되는 표면으로 둔다.
@evidence materials/00-surface-palette.md#stone 문틀과 창틀의 석재 표면이 실제 개구부 깊이에 이어지게 배치한다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 여덟 통과 폭·스윙과 여덟 창의 두께/높이를 현재 passage·profile에 대조했고 추가 구멍이나 원형 치수 변경 없이 배치할 수 있다.
-->

문틀은 각 벽 깊이 중앙에 두고 로컬 X를 벽의 길이축에 맞춘다. 양개문은 좌우 경첩에 절반 문짝을 한 장씩, 나머지 여섯 문은 passage가 정한 swing 쪽 경첩에 한 장씩 둔다. 닫힌 원형의 양개 경첩은 로컬 (X=0.021m,Z=0), 외개 경첩은 (X=0,Z=0.031m)이므로 이 점을 실제 문턱의 경첩에 붙인 채 배치 회전으로 90° 연다. 양개 두 장은 현관에서 +Z, 제실에서 −Z로 함께 열리고, 외개문은 봉헌실·서비스 외부 문에서 −X, 나머지 동측 방과 마당 문에서 +X로 열린다. 회전 후 경첩 좌표를 빼서 배치 원점을 정하며 문짝의 원점을 경첩으로 잘못 간주하지 않는다. 완전히 열린 통로의 정면과 방 쪽에서 문짝이 벽을 관통하거나 통과폭을 막지 않아야 한다. 창틀은 profile 중앙과 `sill−frame` 높이를 쓰고 외부 면을 바라본다. 문·창의 반복 ID는 원래 opening ID를 보존한다.

## 지붕 기와와 목구조 {#roof-members}

<!--
@evidence principles/core/common.md#declared-basis 합성 roof patch의 평면과 모델의 0.40×0.52m 기와 원형·0.44m 행 피치를 입력으로 삼아 지붕 조각을 가로질러 한 월드 격자를 정한다.
@evidence principles/core/common.md#scope-preservation 모든 지붕 조각의 실제 기와, 경사별 용마루, 네 주랑 변의 서까래, 제실 트러스 둘과 낮은 천장 방의 보 반복을 각각 이 건물 배치의 집합으로 둔다.
@evidence principles/core/common.md#substantive-completion 기와의 축·법선·slab 상면의 면 접촉·두 피치와 patch 경계 검사를 정하고 트러스 Z 두 축 및 서까래·천장 보 간격을 주소화한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 모델은 한 기와·용마루·목부재의 단면을, 공간은 roof patch와 방 경계를 정했지만, 이 단위가 지붕 조각 간 공유 격자와 실제 부재별 진입·정지·반복 규칙을 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary tile.roof와 경사별 ridge, 단일 서까래·트러스·천장 보 원형만 반복하며 roof mesh와 원형 단면은 고치지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 기와 행과 열은 합성 roof patch의 평면·기울기·경계에서 유도하고 지붕 면 분할 순서가 달라도 같은 월드 격자를 쓴다.
@evidence principles/design/instances.md#instance-verification-address 동·서 골 및 제실/포치 용마루 접점과 처마 한 단위의 빈 반원을 최악 표본으로 지정한다.
@evidence obligations/design/instances.md#instance-prototype-membership 지붕 합성 평면에 온전히 든 tile.roof 원형과 실제 경계에서 잘린 같은 계보의 변형을 한 격자에 들이고 제실 트러스 둘과 업무방 천장 보 반복을 별도 집합으로 둔다.
@evidence obligations/design/instances.md#instance-identity-transform 기와 ID는 patch·월드 U/V 격자 좌표에서, 트러스 ID는 두 Z 좌표에서 만든다.
@evidence obligations/design/instances.md#instance-variation-tiers 기와는 한 0.40m 폭·0.44m 경사 행 피치로 고정하고, 끝 절단은 models/cladding.md의 실제 host 반공간 절단 변형으로 고른다. 배치 transform은 단위 scale이며 경계 실루엣 변형은 모델 계보 안에 남긴다.
@evidence obligations/design/instances.md#instance-placement-review 지붕 상면과 tile 바닥 접촉, 골·처마·용마루 공백, 제실 트러스와 네 실내 낮은 천장 보의 접촉을 조감·내부 올려보기로 본다.
@evidence models/cladding.md#roof-tile 0.40m 폭의 tegula/imbrex 모듈을 지붕 경사에 돌려 배치한다.
@evidence models/cladding.md#ridge-tile 용마루는 19°와 22° variant를 실제 박공 경사에서 선택한다.
@evidence models/entablature.md#rafter 네 주랑 변의 처마 아래에 서까래 원형을 0.50m 간격으로 반복하고 지붕 하부와 보 접촉을 본다.
@evidence models/entablature.md#sanctuary-truss 두 트러스의 로컬 tie를 제실에 Z=−8.30/−5.50m로 둔다.
@evidence models/entablature.md#ceiling-joist 네 낮은 천장 방에 0.60m 간격의 X방향 보를 둔다.
@evidence spaces/roofs/assembly.md#roof-junctions 합성 roof patch의 평면·두께·경계를 접촉의 단일 입력으로 쓴다.
@evidence spaces/roofs/colonnade.md#north-canopy 북쪽 주랑 처마와 골 경계에 실제 기와 격자를 정지시키며 낮은 지붕 하부의 서까래를 보에 잇는다.
@evidence spaces/roofs/colonnade.md#south-canopy 남쪽 주랑의 포치 접점과 파라펫 앞에서 온전한 기와 점유와 처마 서까래 접촉을 검사한다.
@evidence spaces/roofs/west.md#west-roof 서측 외쪽 지붕의 파라펫 안쪽 끝에서 기와 최고점과 코핑 하단의 실제 여유를 검사한다.
@evidence spaces/roofs/east.md#east-roof 동측 19° 박공 두 면에 기와와 해당 경사 용마루를 놓고 양쪽 골 접점을 검사한다.
@evidence spaces/roofs/sanctuary.md#sanctuary-roof 제실 22° 박공의 두 면과 용마루를 덮되 떠 있는 처마 아래 두 트러스의 보임을 유지한다.
@evidence spaces/roofs/porch.md#porch-roof 포치 22° 박공의 실제 두 면에 기와를 배치하고 작은 용마루와 앞 처마를 비우지 않는다.
@evidence spaces/junctions.md#plinth-coping 기와의 전체 최고점을 코핑 아랫면 4.69m와 비교해 서측 높은 끝에서 온전한 단위가 닿지 못하면 멈춘다.
@evidence spaces/junctions.md#gable-closures 제실·포치·동측 박공 기와와 용마루가 실제 박공 폐쇄와 관통하지 않게 배치 경계를 검사한다.
@evidence settings/20-envelope.md#roof-form 외쪽 12°와 동측 19°·제실/포치 22°의 세 지붕군에 같은 기와 원형을 경사 변환해 놓는다.
@evidence settings/20-envelope.md#ceilings 제실 노출 트러스와 낮은 업무방 천장 보 및 주랑 서까래가 지붕 아래에서 보이게 반복한다.
@evidence materials/00-surface-palette.md#roof-tile 붉은 지붕 재료가 실제 tegula·imbrex 형상마다 결속된 상태로 반복되는지 골과 처마에서 본다.
@evidence materials/00-surface-palette.md#timber 서까래·트러스·천장 보를 목재 원형으로 반복하면서 노출 하부의 목재 면을 남긴다.
@evidence upstream/design/instances.md#parent-revision-from-instance-work 기와 경사 원형·평면 datum과 트러스/천장 보 단면을 반복 경계에 맞췄으며 새로운 방 높이는 필요하지 않았다. 다만 전체 단위를 건너뛴 골 경계 결함을 직접 렌더에서 확인해 models/cladding.md에 실제 경계 절단 변형과 용마루 받침 구간을 먼저 명시했다.
-->

기와는 지붕 조각의 동일한 평면끼리 하나의 월드 격자로 놓는다. 로컬 +Z가 경사의 위쪽이고 로컬 +Y가 지붕 법선이며, 밑면은 `upper`에 직접 닿는다. 원형의 평판 폭은 0.40m이고 둥근기와를 포함한 전체 X 점유는 −0.20~+0.285m, 경사 길이는 0.52m다. 좌우 피치는 0.40m, 경사 위쪽 피치는 0.44m라서 위아래 단위가 0.08m 겹친다. 월드 수평 피치는 경사 피치에 cos(경사각)을 곱한다. 조각 경계에서는 전체 점유가 합성 평면 위에 닿으면 원형을 재사용하고 부분 점유이면 실제 경계 반공간으로 자른 모델 변형을 선택한다. 변형 ID는 평면 그룹·U/V·조각 번호다. 골과 처마의 부분 기와도 남아 평판 바탕이 넓은 빈 띠로 드러나지 않아야 한다. 세 박공 용마루 앞 마지막 0.16m는 평판만 이어 덮개 발을 받친다. 서측 높은 끝의 모든 부재를 코핑 하단 4.69m보다 0.01m 낮은 월드 Y≤4.68m에서 자른다. roof upper의 붉은 바탕을 기와 형상으로 세지 않는다. 제실 트러스는 Z=−8.30/−5.50m, 업무방 천장 보는 각 방 Z구간에서 0.60m 간격으로 반복한다. 처마 서까래는 별도 원형이 있으므로 네 주랑 변의 0.50m 간격에서 roof underside와 보 사이 접촉을 확인한다.

## 중정 분수와 건물 검토 {#fountain-review}

<!--
@evidence principles/core/common.md#declared-basis courtBack/courtFront와 중정 완성 바닥, fixture.fountain의 단일 정지 원형을 입력으로 삼아 중앙 한 점의 배치 높이와 ID를 결정한다.
@evidence principles/core/common.md#scope-preservation 중정의 분수 한 개와 건물 전체 01~05 고정 관찰에서 원주·문·지붕·목구조·재료의 접촉과 가림을 함께 검사한다.
@evidence principles/core/common.md#substantive-completion 분수의 X/Z 산술 중심·Y 바닥 접촉·단일 ID와 중앙 보행 접점을 고정하고 건물 부재가 끊기거나 관통하는 실패를 뷰별로 판정하게 한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation 공간의 열린 중정과 모델의 한 수반만으로는 배치 ID와 바닥 변환이 정해지지 않으므로 이 단위가 court 중점의 한 배치와 전체 건물의 관찰 표본을 더한다.
@evidence principles/design/instances.md#instance-prototype-boundary 분수는 fixture.fountain 한 원형만 중정에 두고 수반·물줄기 형상을 배치에서 바꾸지 않는다.
@evidence principles/design/instances.md#instance-derivation-authority 분수 중심은 courtBack/courtFront의 중간 Z와 X=0, 높이는 중정 바닥에서 유도한다.
@evidence principles/design/instances.md#instance-verification-address 제실 문 중앙에서 분수 하나와 열린 출입축, 중정 대각에서 수반-포장 접촉과 물/석재 경계를 본다.
@evidence obligations/design/instances.md#instance-prototype-membership 중정 분수는 정확히 하나이며 다른 방·마당에는 복제하지 않는다.
@evidence obligations/design/instances.md#instance-identity-transform element.building.fountain이라는 단일 ID와 바닥 원점·항등 회전을 사용한다.
@evidence obligations/design/instances.md#instance-variation-tiers 물줄기는 고정 정지 원형의 한 상태이고 동적 변형·대체 tier를 선언하지 않는다.
@evidence obligations/design/instances.md#instance-placement-review 01 외관·02 절개·03 중정·04 제실·05 업무 주랑을 각각 고정 주광과 1600×1000 조건으로 보고 모든 독립 건물 부재의 접촉·가림을 판정한다.
@evidence models/fixtures.md#fountain 낮은 석재 수반과 물/물줄기의 일곱 part를 한 정지 원형으로 유지한다.
@evidence spaces/rooms/courtyard.md#court-volume 중정 바닥과 열린 하늘, 단일 분수의 위치를 소비한다.
@evidence settings/30-interiors.md#fountain 중앙 중정의 낮은 수반 하나를 네 주랑 변 사이의 산술 중심에 고정하고 접근 여백을 남긴다.
@evidence settings/30-interiors.md#services 정지한 물면과 단일 물줄기를 분수 원형의 고정 상태로 두고 별도 동적 변형을 추가하지 않는다.
@evidence materials/00-surface-palette.md#water 분수 한 원형의 물면·물줄기를 수반 석재와 구분해 중앙의 고정 상태로 관찰한다.
@evidence materials/00-surface-palette.md#stone 수반 테두리의 밝은 석재가 중정 바닥과 접촉하면서 물과 구분되는지 사선에서 본다.
@evidence materials/00-surface-palette.md#paving 중앙 수반 밑면이 중정의 절단 석재 포장 위에 붙고 포장 속으로 묻히거나 뜨지 않게 둔다.
@evidence settings/00-delivery.md#review-condition 다섯 고정 시점 1600×1000 조건으로 주랑·문·지붕·분수의 부재 접촉과 가림을 판정한다.
@evidence settings/00-delivery.md#coordinates 모든 부재를 부모가 정한 m·Y상향·남쪽 +Z 좌표에서 놓고 모델별 로컬 축을 회전으로 맞춘다.
@evidence settings/00-delivery.md#coverage-map 건물은 공간 유지·독립 부재·외부 개체 세 문서의 집합으로 납품하며 소품 인스턴스는 별도 미완료 집합으로 남긴다.
@evidence settings/00-delivery.md#build-scope 공간 면·건축 부재·이웃과 식생을 조립하되 형상은 각 부모 모델/공간을 소비한다.
@evidence settings/00-delivery.md#delivery-scope 하나의 재사용 가능한 신전 library의 고정 건물 환경을 조립하며 film이나 인물은 만들지 않는다.
@evidence settings/00-delivery.md#governing-aim 정문-중정-제실 축과 주랑에서 직접 닿는 방들을 실제 조립 결과로 남겨 연출 가능한 공간을 만든다.
@evidence settings/00-delivery.md#working-language 배치 문서는 한국어로 쓰고 정확한 모델/공간/부재 ID만 코드 언어로 유지한다.
@evidence settings/40-environment.md#daylight 동일한 고정 주광과 노출에서 외관·각 방·접촉을 비교하며 배치에 발광면이나 날씨 상태를 추가하지 않는다.
@evidence settings/50-production.md#references 제공 이미지 01~05의 역할 뷰는 전체 관찰 모집단에 더해 비교하며 치수를 사진에서 실측했다고 주장하지 않는다.
@evidence settings/50-production.md#runtime-boundary CommonJS production producer와 공개 engine lowering의 같은 결과를 뷰어로 넘기고 ESM 변환·공유 package 수정으로 문제를 우회하지 않는다.
@evidence settings/50-production.md#fidelity 건축 접합과 방 읽힘은 실제 형상·재료로 검사하며 개별 소품을 정밀 조각처럼 세밀하게 만들어야 한다고 확대하지 않는다.
@evidence settings/50-production.md#gpu-observation 실제 AMD renderer를 읽은 브라우저에서 독립 정육면체와 신전 렌더를 직접 열어 GPU 문자열과 픽셀의 일치를 함께 확인한다.
@evidence settings/50-production.md#measurement-truth 정상·흰 화면 실패·이전 source의 캡처와 unsupported 질문을 구분하고 현재 결과의 수치는 실제 compiled 환경에서 읽는다.
@evidence settings/50-production.md#acceptance 이번 2026-09-28 재개 원문의 자가 판정·evidence 종료 override에 따라 유일 저작자가 전수 렌더를 읽으며 시각/검증 미완료가 남으면 완료를 선언하지 않는다.
@evidence settings/50-production.md#execution-authority 이번 재개가 viewer·검증 이어받기를 허용하며 모든 실행은 새 창 없이 production 내부의 파이프·숨김 자식으로 수행한다; 공유 package와 의존성은 동결한다.
@evidence settings/50-production.md#author-commits 최신 feat/benchmark-one-hour-completion과 Draft PR2627을 이어받고 검증된 이 production만 감독자와 index 순서를 조율해 명시 경로로 commit/push한다.
@evidence spaces/observations.md#geometry-observations 현재 환경에서 유도한 방 중심·모서리·문턱, 노출 입면·외곽 모서리·지붕·하부·외부 출입과 접합 질문을 모두 검사하며 다섯 reference만으로 대체하지 않는다.
@evidence spaces/observations.md#viewer-path inspection 절개와 납품 beauty를 구분하고 같은 생산 결과·렌즈·1600×1000 raster로 실제 방·부재를 직접 본다.
@evidence obligations/core/common.md#purpose-fit building.md는 건축 부재, envelope.md는 보존한 공간 실체, site.md는 이웃·식생의 수와 변환을 각각 소유하여 어느 파일을 빼도 해당 membership과 접촉 판정이 없어지게 한다.
@evidence obligations/core/common.md#layer-boundary 세 문서는 membership·ID·변환·tier·배치 판정만 정하고 원형 형상·공간 경계·재료 recipe는 각 부모에 남긴다.
@evidence obligations/core/common.md#production-language 한국어 본문으로 모든 위치·접촉·범위를 설명하며 코드 ID와 m 수치만 정확한 기술 식별자로 유지한다.
@evidence obligations/core/common.md#proportionate-development 실제 기와 반복과 열린 문·기둥/보 접촉은 별도 상세 배치 H2로, 보존한 shell과 작은 풀은 다른 독립 집합으로 나누어 수반 한 문단으로 430m² 건물의 전 membership을 대신하지 않는다; 아직 배치하지 않은 소품의 부모 H2는 전수 모집단에 그대로 남는다.
@evidenceExclude upstream/design/instances.md#parent-revision-from-instance-work 분수 반지름과 중정 중앙 포장·방문축을 함께 대조했고 수반 한 개가 통로를 막지 않아 부모 위치를 바꿀 필요가 없었다.
-->

분수 원점은 X=0, Z=(courtBack+courtFront)/2, Y=중정 바닥이다. 중정에는 이 한 수반만 반복 없이 두고 중앙 보행 접점과 물·석재 표면을 정면과 사선에서 본다. 건물 전체 검토는 이미지 01~05와 동일 역할의 뷰를 포함하고, 재료 결속·실제 기와 형상·열린 문 통과·주두와 보·목구조 하부가 각 뷰에서 끊기거나 관통하면 실패로 기록한다.

조립 납품은 이 파일의 독립 건축 부재, envelope.md의 원래 방·통행·외피·대지 전수 유지, site.md의 외부 개체 집합으로 나눈다. 단일 상세 tier이며 좌표는 m·Y 상향·남쪽 +Z다. 전수 관찰은 현재 환경에서 유도한 중심·모서리·문턱·입면·외곽 모서리·지붕·하부·외부 출입과 접합 질문이고 다섯 reference는 추가 비교다. inspection 절개는 검사 화면이며 납품 beauty의 대체물이 아니다. 한국어 배치 본문과 정확한 코드 ID를 사용하며 모델 형상·공간 경계·표면 recipe는 부모의 권한에 남긴다. 이미 선언된 소품 부모 H2와 그 인용 의무는 그대로 보존한다.

2026-09-28 최신 이어받기 원문이 이전 settings의 독립 reviewer·구 branch·중지 배정을 대체한다. 유일한 저작자가 실제 렌더를 보고 자가 판정·수리하고 evidence만으로 종료한다. 모든 실행은 새 창 없이 파이프/숨김 자식으로 하고 production·CommonJS·공유 package 동결을 유지한다. 실제 GPU는 요청 flag 대신 renderer 값과 독립 정육면체 픽셀로 확인한다. 흰 화면, stale source, unsupported 질문은 정상 렌더와 구분하여 보존한다. 검증된 production 경로만 공유 index 순서를 조율한 뒤 현재 branch와 PR2627에 commit/push한다. 이 실행·Git 사실이 형상 완료를 대신하지 않는다.
