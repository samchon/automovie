# 물체 모델의 공통 재현 계약

이 파일은 [생활 프로그램](../settings/002-household.md#household-program)과 [표면 분해](../settings/003-spatial-basis.md#surface-decomposition)를 물체의 주소·척도·중립 관찰 규칙으로 바꾼다. 개별 형상은 뒤의 모델 H2가 소유한다.

## 단위·주소·표면 완결성 {#model-address-and-scale}

<!--
@evidence principles/core/common.md#scope-preservation 식탁·의자 척도와 prototype/part/face 주소를 모든 물체의 공통 입력으로 두고, 인물·외피와 재료·배치·광량은 명시된 다른 owner에 남긴다.
@evidence principles/core/common.md#substantive-completion 바닥형 원점, face의 삼각형 전수 분할, 네 다리 번호와 상태별 address/inventory 대조를 정해 다음 H2가 부품 주소 체계를 새로 고르지 않는다.
@evidence principles/core/common.md#declared-basis delivery-scope의 실내 가구·소품 범위와 surface-decomposition의 물체 형상 소유를 받아 식탁 0.74m·의자 0.45m 및 face 주소 규칙을 이 모델 계약에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation delivery-scope는 생활 물체의 범위를, surface-decomposition은 형상 owner를 정한다. 이 H2는 거기 없는 국소 원점·네 다리 번호·face 전수 분할을 추가한다.
@evidence principles/design/models.md#representation-contract 한 부품의 가시·숨은 면을 안정 part/face로 분할하고 모든 삼각형을 중복·누락 없이 덮으며 이음·빈 공간도 주소에 실어야 한다고 정한다.
@evidence principles/design/models.md#spatial-convention 바닥 접촉 중심을 기본 원점, +Y를 위, +Z를 사용 전면으로 두고 식탁 상면과 의자 좌면을 다른 물체 치수의 공통 기준으로 삼는다.
@evidence principles/design/models.md#reviewable-structure address-state와 inventory의 일대일 관계 및 face 집합의 삼각형 누락·중복을 검사 대상으로 명명해 겉보기 실루엣만으로 주소 완결을 주장하지 않는다.
@evidence principles/design/models.md#model-observable-style-basis ref02~05의 생활 물체는 안정된 차단 형상 주소로 읽고 ref01의 외피는 물체 part로 옮기지 않는다. 색·마감·인물 유사성은 이 H2의 관찰 주장이 아니다.
@evidence principles/design/models.md#model-scale-layer-completion 식탁 0.74m·의자 0.45m를 기준으로 각 물체 H2가 외곽과 부품 치수를 닫게 하고, face가 필요한 측면만 분할하되 숨은 접촉면도 주소로 남긴다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work delivery-scope의 가구·소품 범위, coordinate-datum의 m·Y-up, surface-decomposition의 형상·배치·finish 분리를 시험했다. 바닥형 원점과 +Z 사용 전면, 식탁·의자 높이, part/face 주소는 그 범위 안의 국소 규칙이며 방별 접촉과 상태를 새로 요구하지 않는다.
@evidence obligations/core/common.md#purpose-fit 여섯 models 파일은 공통 주소·검사 규칙과 실내외 생활 물체의 형상 원형을 나누어 소유하므로 뒤 source가 면·점유를 임의로 고르지 않는다.
@evidence obligations/core/common.md#layer-boundary 이 절은 model의 형상·face·scale만 소유하고 재료 ID·방별 transform·개수·광량은 materials·instances·systems로 보낸다.
@evidence obligations/core/common.md#production-language 여섯 모델 파일은 한국어 설명을 중심으로 쓰고 prototype·part·face·AABB 및 library·edge·shaft 같은 기술어는 영어로 병기한다.
@evidence obligations/design/models.md#addressable-model-decisions 공통 주소·척도는 이 H2, UV와 곡면은 다음 H2, 관절과 점유·관찰은 독립 H2로 나누고 47개 물체 원형은 001~005의 개별 또는 묶음 H2가 소유한다.
@evidence obligations/design/models.md#reference-scale 식탁 상면 y=0.74m와 의자 좌면 y=0.45m를 저작 척도로 삼고 모든 원형의 m 단위 외곽을 비교한다.
@evidence settings/001-production.md#delivery-scope 이 library의 실내 설비·가구·소품과 작은 대지 비품을 재사용 가능한 prototype으로 나누고 film·인물 asset은 모델 모집단에 넣지 않는다.
@evidence settings/001-production.md#delivery-fidelity primitive 이름이나 색 패치 대신 각 물체의 실제 점유·부품·face를 정해 리뷰 거리에서 읽히는 blocking 형상을 요구한다.
@evidence settings/001-production.md#build-or-adopt 가구·설비·소품의 형상과 part/face 주소를 models가 맡고 건축·배치·발광·finish는 각각 다른 분기에 남긴다.
@evidence settings/001-production.md#settings-coverage-map 물체 원형과 안정 face 주소를 이 파일군에 두고 방별 배치·반복은 instances, finish 결합은 materials로 연결한다.
@evidenceExclude settings/001-production.md#module-boundary CommonJS 브라우저 경계는 모델 형상 문서가 아니라 source·viewer 구성의 의무다. 이 H2는 생성될 원형의 좌표·주소만 정한다.
@evidence settings/002-household.md#inherited-defaults 바닥형 물체의 원점을 접촉 영역 중심으로 두는 본문 규칙은 바닥 가구와 -Y 중력의 기본 관계를 따른다.
@evidence settings/003-spatial-basis.md#coordinate-datum 같은 m·오른손 Y-up을 원형의 국소 좌표 기본값으로 쓰되 건물 +X/+Z와 방별 transform은 instances가 다룬다.
@evidence settings/003-spatial-basis.md#surface-decomposition 모델은 물체 형상·표면 주소만 내고 건축 표면·instance·emitter·finish의 단독 소유를 침범하지 않는다.
@evidenceExclude spaces/001-citizen-house.md#citizen-house-space 본채 house·두 층과 site의 parent/child 귀속은 spaces 구조다. 모델은 그 안에 놓일 prototype의 국소 점유만 정의한다.
@evidenceExclude spaces/002-spatial-graph.md#mass-and-storeys 본채 11×12m 외곽·층 datum·벽 두께는 건축 space 값이다. 여기의 식탁·의자 척도는 물체에만 적용한다.
@evidenceExclude spaces/002-spatial-graph.md#ground-level 1층 slab·plinth와 천장 표면은 storey owner가 만든다. 모델의 바닥 접촉면은 그 실물 표면을 instances에서 소비한다.
@evidenceExclude spaces/002-spatial-graph.md#upper-level 2층 slab와 방 바닥·천장은 storey owner가 만든다. 바닥형 물체의 접촉 원점과 천장형 물체의 별도 고정점은 이 모델의 국소 좌표이며 상층 표면을 생성하지 않는다.
@evidenceExclude spaces/002-spatial-graph.md#ground-partition 현관·작업실·공용실·powder·수납의 다섯 cell과 shared wall은 공간 분할이다. 모델 ID는 방 ID가 아니며 가구·설비만 정의한다.
@evidenceExclude spaces/002-spatial-graph.md#upper-partition 복도 직결 여섯 목적지와 일곱 상층 cell은 spaces가 소유한다. 모델 원형은 각 방의 호출에서 재사용된다.
@evidenceExclude spaces/003-surface-ownership.md#whole-surface-owners 전후좌우 입면과 지붕의 다섯 완결 건축 표면은 각 envelope owner가 형성한다. 모델 face 주소는 독립 물체 안에서만 닫힌다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 식탁 상면과 의자 좌면을 모든 원형의 척도로 놓고 물체 안의 part/face까지만 주소화한다. 집 외피와 방별 위치를 이 공통 원점 규칙이 생성하지 않아 납품 범위의 분기 경계가 유지된다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 네 발의 번호를 회전 뒤에도 재배정하지 않고 face마다 삼각형을 빠짐없이 한 번만 담는 조건과 상태별 address/inventory 일대일 조건을 적었다. 다음 원형 H2는 주소 구조를 새로 고를 필요가 없다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 주택의 생활 물체 범위와 settings의 표면 분해를 근거로 삼고, y=0.74 식탁과 y=0.45 의자 및 국소 face 규칙은 이 절의 선택으로 제시한다. 참조 이미지에서 이 수치를 측량했다고 주장하지 않는다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 delivery-scope가 허용한 가구·소품과 surface-decomposition이 맡긴 물체 형상을 `leg-0..3` 순서 및 노출·접촉 face 주소로 구체화한다. 두 부모는 그 번호나 좌표축을 미리 정하지 않는다.
@evidenceReview principles/design/models.md#representation-contract #46718c6 `prototype/part/face`의 한 face가 부품 삼각형의 부분집합이고 전체 face가 중복 없이 부품을 덮도록 정했다. 숨은 접합도 주소로 남겨 외관만 보이는 원형에 빈 면 소유자가 생기는 경우를 막는다.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e 바닥 접촉 영역 중심의 원점과 +Z 사용 전면을 선언하고 네 발의 ±X·±Z 조합을 고정한다. 원형을 방에 회전 배치해도 번호가 바뀌지 않으므로 코드가 좌표 관례를 추측할 필요가 없다.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b `@address-state`와 `@inventory`의 part 집합을 맞대고 산문에 없는 part와 face 삼각형의 누락·중복을 실패 대상으로 삼는다. 예쁜 대각 실루엣만으로 주소 완결을 승인할 수 없다.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 ref01의 건축 외피는 물체 part가 아니고 ref02~05의 물체만 차단 형상 주소로 받는다. 이 절의 ref 분류로 색·광원·인물 닮음을 모델 스타일 결정이라고 확장할 수 없다.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e y=0.74와 y=0.45 기준 뒤에 각 원형의 실제 외곽·오프셋을 요구하고 숨은 sole과 접합면도 part 소유에 넣는다. 큰 bounding box만 있는 경우에는 이 공통 완료 조건을 통과하지 못한다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 delivery-scope의 물체 범위, coordinate-datum의 m·Y-up, surface-decomposition의 형상 소유를 대조했다. 접지 중심·+Z 전면·네 발 번호는 원형 내부 표현이며 새 방 경계나 운영 상태를 요구하지 않고 실제 방 접촉은 배치가 판단한다.
@evidenceReview obligations/core/common.md#purpose-fit #7b32c66 이 파일은 뒤의 물체 원형들이 같은 원점·척도·face 주소로 구현되게 하는 공통 계약을 맡는다. 이 역할을 빼면 서로 다른 H2가 식탁 높이나 다리 번호를 따로 정하게 된다.
@evidenceReview obligations/core/common.md#layer-boundary #5271f94 본문은 geometry의 local frame, AABB와 표면 주소까지만 정하고 재료 ID·방별 transform·광량은 결정하지 않는다. 얼굴과 인체도 이 물체 설계 역할에 포함시키지 않는다.
@evidenceReview obligations/core/common.md#production-language #3ef4142 본문은 한국어로 원점과 표면 규칙을 설명하면서 `prototype/part/face`, `AABB`, `winding`을 구현 주소로 병기한다. 이 영어 표기는 납품 설명의 언어를 대체하지 않는다.
@evidenceReview obligations/design/models.md#addressable-model-decisions #226db18 주소와 척도는 이 H2에, UV는 뒤의 `model-uv-and-topology`에, 상태와 점유는 각각 별도 H2에 놓인다. face 결정이 개별 가구 표 안에만 흩어져 독립 수정 주소를 잃는 구조가 아니다.
@evidenceReview obligations/design/models.md#reference-scale #2598af4 식탁 상면 y=0.74와 의자 좌면 y=0.45를 m 단위의 공통 대조점으로 선언했다. 다른 원형의 높이가 이 기준과 어긋나면 같은 주택의 가구 척도라는 주장을 반증할 수 있다.
@evidenceReview settings/001-production.md#delivery-scope #e314261 이 절의 대상은 주택 환경에 놓일 가구·설비·소품의 재사용 원형이다. 별도의 resident asset이나 시간축 장면을 모델 주소 체계에 넣지 않아 library의 정지 납품 경계를 따른다.
@evidenceReview settings/001-production.md#delivery-fidelity #374c8c8 물체마다 실루엣만 그린 primitive 이름이 아니라 치수·part와 노출 face를 지정하도록 요구한다. 실제 source와 화면의 읽힘은 아직 검증 전이므로 주소 규칙 자체를 구현 성공으로 세지 않는다.
@evidenceReview settings/001-production.md#build-or-adopt #e6ac669 물체의 재사용 형상과 part/face 주소를 이 모델군에 배정한다. 건축 면, 배치, 발광과 finish 결합을 이 좌표 계약이 대신 만들지 않아 제작 분기 책임을 유지한다.
@evidenceReview settings/001-production.md#settings-coverage-map #eb1d6cc prototype과 그 face ID는 모델 단계의 출력이고 방별 membership·transform은 instances의 입력으로 남는다. 마감 결합도 face 주소를 소비할 뿐 이 절의 값이 아니다.
@evidenceExcludeReview settings/001-production.md#module-boundary #6450145 이 H2의 본문은 m·Y-up, 접지 원점과 part 주소를 정할 뿐 CJS·ESM 로더 또는 브라우저 import 경로를 선택하지 않는다. 모듈 경계 검사는 실행 source와 viewer의 관계라 모델 형상 모집단에서 이 항목을 구현했다고 할 수 없다.
@evidenceReview settings/002-household.md#inherited-defaults #7cf71e1 바닥형 물체의 sole을 지지면에 놓고 접촉 영역 중심을 원점으로 삼는 문장이 -Y 중력 기본값의 물체 쪽 표현이다. 직업·책 제목 같은 미정 생활 설정을 face 이름으로 구체화하지 않는다.
@evidenceReview settings/003-spatial-basis.md#coordinate-datum #2227bc8 모든 길이를 m로 쓰고 +Y를 위로 고정했다. 건물의 전역 위치와 방별 회전은 이 local frame에 넣지 않아 같은 원형을 공간 좌표에 배치할 수 있다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition #0451742 물체가 노출하는 face는 모델 주소로, 마감 ID와 방 안 위치는 다른 소유자로 구분한다. 건축 창호의 표면을 이 part 규칙으로 재소유하지 않는다.
@evidenceExcludeReview spaces/001-citizen-house.md#citizen-house-space #b6afc3e 이 절은 물체 국소 원점·part 주소만 정하고 `citizen-site` 아래 house와 두 storey의 포함 관계를 생성하지 않는다. 본채 조립을 고쳐야 할 물체 차원의 근거가 없다.
@evidenceExcludeReview spaces/002-spatial-graph.md#mass-and-storeys #1efc285 식탁·의자의 y 기준과 바닥형 원점은 본채 11×12m 외곽, 층 datum 또는 벽 두께를 다시 정의하지 않는다. 그 수치는 건축 H2에 남겨 물체 척도가 매스 치수로 오인되지 않게 한다.
@evidenceExcludeReview spaces/002-spatial-graph.md#ground-level #8a83d4e sole 주소는 지지면과의 접촉을 나타낼 뿐 1층 slab·plinth와 연속 천장을 만들지 않는다. 어느 방 바닥에 놓일지는 후속 배치로 정하므로 이 공통 H2가 ground-level의 표면을 수정할 이유가 없다.
@evidenceExcludeReview spaces/002-spatial-graph.md#upper-level #f24bb63 천장형·벽부착형 원형의 고정점은 각 물체가 정하고 2층 slab와 방 바닥·천장은 상층 공간이 만든다. 공통 좌표 관례에는 upper-level의 opening이나 datum을 바꿀 결론이 없다.
@evidenceExcludeReview spaces/002-spatial-graph.md#ground-partition #5445973 현관·작업실·공용부·powder·수납의 cell은 모델 ID로 표현하지 않는다. 이 절의 face 및 다리 번호는 그 다섯 방의 shared wall이나 문 연결을 다시 자르지 않는다.
@evidenceExcludeReview spaces/002-spatial-graph.md#upper-partition #506a629 모델의 local +Z와 sole은 복도에 연결된 상층 방들의 문 위치를 정하지 않는다. 재사용 원형의 room membership은 후속 단계가 주므로 상층 cell 수나 통행 그래프는 그대로이다.
@evidenceExcludeReview spaces/003-surface-ownership.md#whole-surface-owners #209ea3f 물체 안의 face 완결과 전후좌우 입면·지붕의 완결 표면은 서로 다른 owner다. 이 H2가 건축 외주 삼각형을 갖지 않으므로 envelope 다섯 면의 단독 저작을 재배정하지 않는다.
-->

바닥형 물체의 접촉은 설정의 -Y 중력 기본값을 따르며 원형의 sole가 그 지지면을 노출한다.

모든 길이는 m이며 오른손 Y-up이다. 별도 명시가 없으면 바닥형 물체의 원점은 바닥 접촉 영역 중심이고 +Z는 사용하는 앞쪽이다. 천장형과 벽부착형은 자기 H2의 고정점과 전방을 따로 적는다. 저작 척도는 식탁 상면 y=0.74와 의자 좌면 y=0.45를 기준으로 한다. 각 H2가 최외곽 폭×높이×깊이와 부품 치수·오프셋을 확정하며 source는 primitive 기본값이나 남은 점유 공간으로 부품 치수를 발명하지 않는다. `prototype/part`가 안정 주소이고 부품의 가시 측면이 다른 downstream 응답을 필요로 하면 `prototype/part/face`다. 한 부품을 face로 나누면 face ID 집합은 그 부품의 모든 삼각형을 중복 없이 빠짐없이 덮는다. 두께 있는 판의 앞·뒤·노출 edge·위아래를, 접지 다리의 shaft·상단 접합·바닥 sole을 해당 H2가 이름으로 나눈다. 숨은 접촉면도 안정 주소를 갖되 시각 마감 약속으로 세지 않는다. 각 주소는 local frame, vertex AABB, winding·normal, UV 원점·축, 이음과 의도된 빈 공간을 운반한다. 모델은 재료 ID·색·방별 transform·개수·광량을 고르지 않는다. 얼굴·인체 모델은 이 library의 물체 모집단에 없다.

네 발 물체에서 `leg-0..3`의 순서는 `0=(−X,−Z)`, `1=(−X,+Z)`, `2=(+X,−Z)`, `3=(+X,+Z)`이며 번호는 회전이나 방 배치에 따라 다시 매기지 않는다. ref01의 외피를 독립 물체 part로 옮기지 않고 ref02~05의 물체가 받는 안정 주소만 정의한다. 실제 모델 source의 face 완결 여부는 아직 `unverified`다.

각 prototype의 `@address-state state:`는 해당 상태에서 face 주소를 받는 독립 part ID 집합이다. 같은 상태의 `@inventory`와 일대일로 맞아야 하고, H2 산문에 한 번도 등장하지 않는 part를 선언할 수 없다. `model-address-audit`는 산문 주소→part, inventory→산문 주소, 상태별 address↔inventory를 모두 검사한다. 주소 상태 선언은 모델 설계의 별도 저작값이며 검증은 이를 inventory에서 재생성하거나 고치지 않는다. 산문의 part/face 경로에서 `/`는 계층 구분이며 여러 part를 줄여 적은 표현은 `@address-state`의 개별 ID로 풀어 읽는다.

## 메트릭 UV와 곡면 분할 {#model-uv-and-topology}

<!--
@evidence principles/core/common.md#scope-preservation 평면·원통·구·얇은 잎과 관 끝까지 UV·삼각형 분할을 닫고 마감의 반복 길이와 색은 materials에 넘긴다.
@evidence principles/core/common.md#substantive-completion 평면의 법선별 U/V축, 곡면 이음, 24×12 구 분할, 열린 공동의 rim, 관의 자유 끝·용접 끝·꺾임을 구별해 source가 세분화와 닫힘을 임의로 고르지 않는다.
@evidence principles/core/common.md#declared-basis surface-decomposition의 물체 표면 주소·finish 분리에서 UV가 필요한 면을 받고, 24개 둘레·12개 위도 구간과 호 길이 투영은 이 모델 층에서 정한다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation coordinate-datum은 m 단위를, surface-decomposition은 모델 표면 주소와 materials의 결합 책임을 정한다. 이 H2는 각 face의 미터 UV와 닫힌 곡면 위상을 추가한다.
@evidence principles/design/models.md#representation-contract 2-manifold 폐곡면과 두께 있는 rim을 요구하고 자유 끝 반구, 용접 끝 원판, 꺾임 구 조인트의 내부 교차면 제거를 서로 다른 조립 결과로 정한다.
@evidence principles/design/models.md#spatial-convention ±X·±Z·±Y 평면의 U/V축과 각 face AABB 최소 접점 원점, 둥근 외벽의 local −Z 이음을 수치 분할과 함께 고정한다.
@evidence principles/design/models.md#reviewable-structure 부품별 경계·비다양체 edge, winding·normal·UV와 face별 삼각형 중복·누락을 검사하고 얇은 잎·관 끝도 폐곡면 검사에서 빠뜨리지 않는다.
@evidence principles/design/models.md#model-observable-style-basis ref02~04의 원통 등·도기·잎에 동일한 24각 차단 밀도를 쓰고 원경 픽셀에서 세분화를 역산하지 않아 참조 이미지를 제품 외관 약속으로 확대하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 실제 호 길이 UV, 얇은 부재의 edge 두께, 용접한 관 끝과 비어 있는 공동의 rim을 함께 정해 표면 속성과 폐곡면이 서로 다른 구현에서 빠지지 않게 한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work coordinate-datum의 m 단위와 surface-decomposition의 모델 표면 주소·materials 결합을 시험했다. 평면 face의 미터 UV, 곡면 이음, 자유 관 끝의 닫힘은 모델이 소유하는 표면 속성이고 새 공간 개구·가변 상태·부착 위치를 요구하지 않는다.
@evidence settings/003-spatial-basis.md#coordinate-datum 전역 m 단위를 평면 UV의 실제 거리와 곡면 호 길이에 그대로 쓴다.
@evidence settings/003-spatial-basis.md#surface-decomposition 물체가 노출하는 안정 face 주소에 미터 UV와 곡면 정점 속성을 붙이고 finish 선택은 materials에 남긴다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 평면, 둥근 벽, 얇은 잎과 열린 공동까지 UV와 닫힘을 규정한다. 실제 무늬의 반복과 grain은 이 m 좌표를 받을 재료 결정에 남겨 표면 설계의 약속을 넓히지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 법선별 평면 투영, 24×12 구의 두 극 부채, 관의 자유 끝 반구와 용접 끝 원판이 각각 별도 제작 규칙이다. source가 끝을 막을지 또는 UV를 0..1로 바꿀지 새로 고를 공백이 없다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb coordinate-datum의 m를 UV의 실제 길이로 쓰고 surface-decomposition이 맡긴 물체 face에 속성을 붙인다. 24개 경도·12개 위도 및 −Z seam은 이 설계가 고른 분할값이다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 coordinate-datum은 단위, surface-decomposition은 물체의 안정 면과 재료 소비 관계를 준다. 이 H2는 ±법선별 U/V축과 열린 cavity의 두께 있는 rim까지 결정하므로 부모 문장을 재진술한 단위가 아니다.
@evidenceReview principles/design/models.md#representation-contract #46718c6 자유 관 끝의 24×6 반구, 공동의 내벽·rim, 용접부의 내부 교차면 제거가 서로 다른 닫힌 결과를 지정한다. 단순 원통 기본 primitive 하나로 이 경계들을 대신할 수 없다.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e ±X면 U=+Z·V=+Y, ±Z면 U=+X·V=+Y, ±Y면 U=+X·V=+Z로 기록하고 뒤쪽 −Z를 둥근 벽의 이음으로 삼는다. UV는 face AABB의 최소 접점에서 m로 시작한다.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b producer가 연결 성분·경계 edge·normal·UV 및 face별 삼각형 중복과 누락을 검사하도록 명시한다. 얇은 잎의 edge나 관의 끝에서 열린 모서리가 남으면 폐곡면 주장을 반증한다.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 ref02~04의 등·도기·잎은 같은 정수 분할로 다루지만 ref01·05 원경 픽셀을 세분화 지시로 쓰지 않는다. 생활 물체의 차단 곡면 수준만 정하며 실제 마감의 광학 재현은 이 절의 스타일 근거가 아니다.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e 호 길이를 U로 남기는 외벽과 평면 m 투영, 열린 공동의 안팎 벽, 끝면이 있는 관의 조립이 한 단위에 결합되어 있다. UV만 있는 빈 껍질이나 닫혔지만 속성이 없는 부품이면 이 규칙에 맞지 않는다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 coordinate-datum의 m·Y-up과 surface-decomposition의 물체 face 및 재료 결합 권한을 대조했다. 뒤쪽 seam, 24각 분할, 관 끝 폐합은 그 면 안의 국소 표현이고 새 방 개구·접촉 위치·운영 상태를 요구하지 않는다.
@evidenceReview settings/003-spatial-basis.md#coordinate-datum #2227bc8 0..1 재정규화 대신 실제 m 거리와 둘레 호 길이를 UV에 운반하므로 전역 단위와 표면 속성이 일치한다. 곡면 ring 수는 단위 설정이 아니라 이 모델 H2가 정한다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition #0451742 모델은 face의 정점 속성과 UV seam을 노출하고 materials가 그 좌표에 실제 반복 길이와 색을 결합한다. `unverified`로 남긴 텍스처 결과를 이 표면 분할의 완료라고 주장하지 않는다.
-->

평면 face의 primary UV는 0..1로 재정규화하지 않은 m 좌표다. 국소 법선 ±X면은 U=+Z·V=+Y, ±Z면은 U=+X·V=+Y, ±Y면은 U=+X·V=+Z이고 원점은 그 face AABB의 각 U/V 최소 접점이다. 반대쪽 법선 face는 winding만 뒤집고 UV의 물리 축은 유지한다. 둥근 외벽은 local −Z 뒤쪽을 U=0 이음으로 하여 둘레 실제 호 길이를 U, local 높이를 V로 쓰고 안쪽 벽은 반대 winding을 쓴다. 곡면 좌판·쿠션·잎은 뒤쪽 local −Z 이음에서 각 위도 ring의 실제 edge 길이를 U, 아래쪽 pole부터의 meridian 길이를 V로 쓴다. 원형·원통형 둘레는 24개 같은 각도 구간, 닫힌 타원·구형은 같은 24개 경도와 12개 위도 구간을 사용한다. 양 극은 단일 vertex와 각각 24개 삼각형 부채로 닫고 퇴화 ring을 내지 않는다. 90° 둥근 모서리는 6개 구간, 얇은 잎은 8개 경계 vertex와 앞뒤 한 장씩을 두께 edge로 연결한다. 이 정수 규칙이 각 ID·상태에서 vertex 순서와 UV ring을 고정한다. 두 면의 서로 다른 투영은 모델 face edge에서만 끊고 한 face 안에서 UV를 임의 회전하거나 크기를 정규화하지 않는다. 실제 마감의 반복 길이·grain 축·색은 materials가 이 metric 좌표를 소비해 결정한다. 각 닫힌 부품은 퇴화 삼각형·비다양체 모서리 없이 2-manifold여야 하며 의도적으로 열린 cavity는 rim에서 두께를 가진 내·외벽으로 닫는다. 산출 producer는 부품별 position/index·연결 성분·경계/비다양체 edge·normal·UV·점유와 face별 삼각형 중복/누락을 검사한다. ref02~04의 원통 등·도기·잎을 같은 수치 세분화로 저작하고 ref01·05의 원경에서 곡면 밀도를 역산하지 않는다. 실제 재료 텍스처의 UV 반복 결과는 `unverified`다.

평평한 상·하면을 가진 둥근 직물 상자와 출입 매트는 위도 ring 대상이 아니다. 그 상·하면에는 ±Y 평면의 m 단위 X/Z 투영을 쓰고, 둥근 둘레에만 뒤쪽 −Z 이음에서 실제 호 길이 U와 높이 Y를 V로 쓴다. V형 접힘 홈의 두 경사면은 각각 자체 실제 표면 길이로 V를 이어 seam에서만 끊는다. 화분의 얇은 쐐기 잎은 시작점부터 끝면까지의 실제 길이를 V, 끝면의 접선 폭을 U로 쓰며 시작점 U=0을 공유한다.

중심선을 따라 쓸어 만드는 원형 관·막대의 닫힌 자유 끝에는 바깥 반지름만큼 진행 방향으로 뻗는 반구를 붙인다. 반구는 적도에서 극까지 동일한 여섯 위도 구간, 둘레 24구간과 단일 극점으로 닫으며 내부에 평평한 끝 원판을 남기지 않는다. 속 빈 관의 막힌 끝에서는 같은 중심선 끝에 안반지름의 반구 공동을 만들어 바깥 반구와의 양수 두께를 유지하고 안쪽 통로를 봉인한다. 기울어진 축의 반구는 기본 24×6 ring을 만든 뒤 선언 AABB의 실제 축별 극값이 되는 구면의 ±X·±Y·±Z 접점 중 바깥 반구에 속하고 기존 vertex가 아닌 점을 해당 경도·위도 삼각형에 삽입한다. 접점이 edge에 있으면 양쪽 삼각형을 함께 나누고, 꼭짓점에 있으면 재사용하며, 삼각형 경계 판정의 동률은 낮은 위도 ring 다음 낮은 경도 index 순서로 푼다. 추가 vertex의 UV는 같은 구면 좌표에서 계산하고 재분할한 면은 원래 winding을 따른다. 식물 가지처럼 축이 XZ 평면에 있는 반구의 첫 둘레 꼭짓점은 +Y 방향이다. 열린 출구는 해당 H2가 지정한 평평한 환형 끝면으로 닫는다. 다른 고체에 일부라도 용접되는 관 끝은 해당 H2가 다른 끝 형상을 명시하지 않으면 진행 방향에 수직인 평평한 원판에서 끝내고 두 고체의 합집합에서 내부 교차면을 제거한다. 해당 H2가 반구를 명시한 끝은 그 반구를 먼저 만든 뒤 합집합하고 내부 교차면만 제거한다. 상대 고체 밖에 남는 원판·반구 조각은 노출 face로 발행한다. 중심선이 꺾이는 두 관은 해당 H2가 달리 지정하지 않으면 꺾임 중심에 두 관과 같은 반지름의 구 조인트를 합쳐 외부 홈을 메우고 내부 교차면을 제거한다. XY 평면에서 폭을 가진 선분을 Z 전깊이로 압출한 막대의 둥근 끝은 선분 끝에서 XY 반원 12구간을 바깥으로 붙여 같은 Z 깊이로 압출한다. 이 반원은 선분 법선 두 경계각과 호 안의 ±X·±Y 극값 각을 모두 vertex로 둔다. 이 연속 각 구간마다 한 분할을 먼저 주고 남은 분할 수를 각 구간의 각도 비례로 계산해 정수부부터 준 뒤, 소수 잔여가 큰 순서대로 하나씩 배분해 합계를 12로 맞춘다. 같은 잔여의 우선순위는 반원 시작각부터의 순서다. 이로써 기울어진 선분의 둥근 끝도 선언한 축별 실제 극값에 닿는다. 단면 24각의 첫 꼭짓점은 Y축 관이면 +X, X축 관이면 +Y, Z축 관이면 +X에 두어 각 축 방향 극값이 선언 AABB에 정확히 닿게 한다. 각 H2는 중심선 끝과 열린 출구 여부를 선언하고 이 규칙에서 실제 외곽·face를 계산한다. 점유 구간 자체로 선언한 원기둥은 중심선 스윕의 자유 끝이 없으므로 그 구간의 끝 평면으로 닫는다.

## 관절 상태와 변종 식별 {#model-articulation-ownership}

<!--
@evidence principles/core/common.md#scope-preservation cabinet·murphy·flex 책상·변기 lid의 명시 상태와 변종을 모델 결과로 남기고 방 배치 회전·발광·시간 경로는 각 후속 owner에 둔다.
@evidence principles/core/common.md#substantive-completion 같은 ID·상태의 부품과 AABB가 고정되도록 mm 토큰과 누락 상태 거부를 정하고 작업/손님, folded/open, closed/open의 결과 경계를 식별한다.
@evidence principles/core/common.md#declared-basis ref04의 접이식 전면과 ref02의 침대·수납은 두 고정 상태를 고르는 관찰 근거이며 중간 운동을 본 근거가 아니다. 유한 상태 키와 정수 mm 거부는 이 층의 결정이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation flex-states가 허용한 작업·손님 정지 상태를 model ID의 부품 집합으로 구분하고, 중간 운동은 정의하지 않는다.
@evidence principles/design/models.md#representation-contract 변종 키가 바뀌면 실제 geometry와 part 집합이 바뀌고 같은 키는 동일 AABB를 내게 하며, cabinet 문·서랍과 murphy 판은 각 H2의 안정 부품으로 둔다.
@evidence principles/design/models.md#spatial-convention 폭·높이·깊이의 m×1000 정수 mm를 ID 토큰으로 쓰고 회전은 model local frame이 아니라 후속 instance transform이 소유하게 한다.
@evidence principles/design/models.md#reviewable-structure 닫힘과 검사 열림, 접힌 작업 상태와 펼친 손님 상태를 각각 같은 ID 규칙 아래 비교해 상태별 부품 누락과 AABB 변화 오류를 볼 수 있게 한다.
@evidence principles/design/models.md#model-observable-style-basis ref04의 접힘과 ref02의 수납은 정지한 두 차단 실루엣으로만 표현한다. 그 이미지에서 실제 기계 작동 속도나 충돌 안전을 읽었다고 주장하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion cabinet 형상형과 폭·높이·깊이, murphy와 flex 책상의 상태를 유한 키에 담아 각 키의 점유와 부품 집합이 한 번씩만 정해지게 한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work flex-states의 접힌 침대·펼친 침대와 고정 책상·선반 조건을 시험했다. 두 침대 결과와 책상 보조판 키는 정지 형상만 선택하며 새 시간 경로·부착면·room cell 변경을 요구하지 않는다.
@evidence obligations/design/models.md#articulation-ownership murphy·flex 책상·cabinet의 명명된 고정 상태와 변종 키를 명시하고 중간 운동·시간축은 motions 소유로 둔다.
@evidence settings/002-household.md#flex-states murphy-bed 작업/손님과 flex 책상 folded/open을 명시 상태로 만들고 자동 변형이나 중간 동작은 내지 않는다.
@evidenceExclude settings/001-production.md#runtime-and-restart 단계 재시작과 판정 권한은 제작 운영·lint 설정의 조건이다. 원형 모델의 명시 상태는 이 H2가 소유하지만 세션 재개는 모델 부품이 아니다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 `murphy-bed`의 작업/손님, `work-desk/flex`의 folded/open 및 cabinet의 문 상태를 고정된 원형 결과로 다룬다. 배치 회전·점등·시간 경로는 그 결과를 소비할 다른 분기의 일로 남아 있다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 동일 ID·상태에서 형상·part 집합·AABB가 같아야 하고 상태 없는 murphy 및 flex desk 호출과 비정수 mm 토큰은 거부한다. 각 결과의 정체성과 실패 조건이 빈 상태명보다 구체적이다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb ref04의 접힌 전면과 ref02의 침대·수납을 두 정지 결과의 관찰 근거로 한정한다. ID에 mm와 유한 상태를 싣는 선택은 사진이 알려 준 동작이 아니라 이 단위의 저작값이다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 flex-states가 허용한 작업과 손님 결과를 `murphy-bed`의 상태별 부품 집합으로 해석하고 flex 책상의 보조판도 같은 유한 선택으로 둔다. 부모의 방 사용 규칙에는 이 ID·AABB 불변식이 없다.
@evidenceReview principles/design/models.md#representation-contract #46718c6 cabinet의 문·서랍과 murphy 판을 자기 H2의 part 집합으로 지정하며 상태 키가 geometry와 AABB를 바꾸게 한다. 한 메시를 이름만 바꿔 두 결과라고 부르는 표현은 이 계약에 어긋난다.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e 결과를 바꾸는 폭·높이·깊이는 m×1000 정수 mm 토큰으로 식별한다. 같은 원형을 방에서 돌리는 transform은 이 토큰에 숨기지 않아 local 치수와 배치 회전을 분리한다.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b 닫힌 cabinet과 열린 검사 상태, 접힌 작업 침대와 펼친 손님 침대의 부품·AABB를 각각 비교할 수 있게 했다. 열린 lid를 자동 애니메이션으로 가정하면 이 고정 형상 검사를 통과할 수 없다.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 ref04의 접힘과 ref02의 수납은 정지한 두 실루엣으로만 받는다. 작동 속도와 실제 충돌 회피는 `unverified`여서 참조 이미지의 가구 형태가 운동 성능 주장으로 바뀌지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e cabinet의 형상형·세 치수·상태와 murphy 및 flex desk의 상태가 결과 키에 들어간다. 키를 빼먹어 서로 다른 외곽이 같은 ID로 합쳐지면 이 H2의 완결 조건을 깨뜨린다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 flex-states의 작업·손님 정지 상태와 고정 책상·선반 조건을 대조했다. murphy의 두 부품 결과와 desk 보조판의 folded/open은 새 시간 경로나 room cell을 만들지 않고 배치·동작은 후속 owner에 남으므로 부모 상태 목록을 고칠 필요가 없다.
@evidenceReview obligations/design/models.md#articulation-ownership #96abfe1 쓰기 가능한 중간 운동을 제공하지 않고 cabinet 문·murphy 판·desk 보조판 및 변기 lid의 명명된 고정 결과만 각 원형에 맡긴다. motions가 바꿀 시간축 인터페이스를 이미 구현했다고 세지 않는다.
@evidenceReview settings/002-household.md#flex-states #a162198 작업실의 침대 접힘/펼침과 책상 보조판 folded/open을 상태 없는 호출 거부와 상태별 부품 결과로 받는다. 방의 실제 배치 전환이나 진행 동작은 이 모델 키만으로 재현되지 않는다.
@evidenceExcludeReview settings/001-production.md#runtime-and-restart #73ea0da 이 H2에서 거부하는 것은 prototype의 누락 상태나 비정수 mm 치수다. 제작 세션의 재개·판정 권한은 부품 집합과 관계없는 운영 조건이어서 모델 상태 선택으로 구현하거나 수정할 수 없다.
-->

같은 prototype ID와 같은 명시 상태는 동일한 형상·부품 집합·AABB를 낸다. 폭·높이·깊이·형상형이 결과를 바꾸면 해당 토큰을 ID 또는 H2의 유한 변종 키에 모두 넣고, m×1000이 정수 mm가 아니면 거부한다. `murphy-bed`의 작업/손님과 flex 책상의 `folded|open`은 하나의 정체성 아래 명시 상태가 선택하는 결과이며 상태 없는 호출은 거부한다. cabinet의 `closed|open`은 ID 토큰이다. 이 단계의 관절은 명시 상태에서 고정된 부품·pivot만 정의하고 쓰기 가능한 중간 운동이나 작동 시간축은 만들지 않는다. 변기 lid도 H2의 열린 검사 형상 하나만 낸다. `cabinet` 문과 서랍의 `closed|open`·`murphy-bed`의 접힘·`work-desk/flex`의 보조판·변기의 고정 열린 lid는 각각 자기 모델 H2가 정한 부품 집합이다. 배치 회전은 instances가, 발광 상태는 systems가 소유한다. ref04의 접이식 전면은 두 고정 상태로만 채택하고 ref02의 침대·수납도 중간 동작 근거로 삼지 않는다. 실제 작동 경로·시간·충돌 회피는 `unverified`다.

## 점유·접합 검사 {#model-bounds-and-states}

<!--
@evidence principles/core/common.md#scope-preservation 모든 변종의 envelope·part·접촉 상대를 전개하고 하중 접합, 비하중 식물 접점, 매달림, underside를 각각 판정해 작은 부품을 상위 AABB 속에 숨기지 않는다.
@evidence principles/core/common.md#substantive-completion 실제 vertex 점유와 선언 범위, 평면 접촉 면적, pin–bore와 용기 공동, 곡면 접선을 각각 검사하는 구조 행의 의미와 실패 조건을 정한다.
@evidence principles/core/common.md#declared-basis 하중 지지와 접점은 각 prototype H2의 형상·행에서 받고 식물의 한 점 접촉만 명시적 예외로 둔다. @part 범위를 source 성공 결과로 오인하지 않는 검사 경계는 이 공통 결정이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation surface-decomposition의 물체 형상 소유와 coordinate-datum의 m 기준에 실제 vertex 점유 및 핀·공동·받침의 국소 접합 검사를 더한다.
@evidence principles/design/models.md#representation-contract @inventory·@envelope·@part와 void·pin·contact 행을 연결하고 곡면의 AABB 중첩을 접촉 증명으로 대체하지 않도록 실제 절삭면과 닫힌 고체를 요구한다.
@evidence principles/design/models.md#spatial-convention X/Y/Z 닫힌 범위와 -Y의 X/Z, -Z의 X/Y 접촉 좌표를 고정하며 wrapper translation과 받침 높이도 local m 값으로 계산한다.
@evidence principles/design/models.md#reviewable-structure 한 부품이라도 빠지거나 접지 직사각형 네 모서리가 host 밖이면 실패하고, 문·보조판·수납 침대는 닫힘과 열린 검사 상태에서 핀 주변 틈을 다시 잰다.
@evidence principles/design/models.md#model-observable-style-basis ref02~04의 부품 접합은 구조 안전을 보여 주지 않으므로 양수 면적과 닫힌 형상의 차단 검사로 한정한다. 원경 ref01·05에서 접합 수치를 역산하지 않는다.
@evidence principles/design/models.md#model-scale-layer-completion 선언 외곽, 개별 부품, 실제 접합면과 의도된 빈 공간을 함께 대조하고 식물만 접선 예외로 분리해 유효한 AABB가 끊긴 조립을 숨기지 못하게 한다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work surface-decomposition의 형상·배치 분리와 coordinate-datum의 m 단위를 시험했다. vertex AABB와 부품 사이 유한 접촉은 국소 원형 안에서 재고 방과 닿는 최종 위치는 instances에 남기므로 새 방 경계·상태가 필요하지 않다.
@evidence obligations/core/common.md#proportionate-development 공통 점유·접합 규칙은 한 H2에 모으되 개별 또는 묶음 물체 H2 안에서 각 원형의 상태별 inventory·part·envelope를 구별해 큰 수납·가구를 소품 한 줄로 축약하지 않는다.
@evidence obligations/design/models.md#model-representation-completion 001~005의 물체 H2가 상태별 inventory·address-state·envelope·part를 소유하고 문서 감사의 구조 통과와 source 구현·렌더 의미 검증의 미완료를 분리한다.
@evidence settings/002-household.md#design-subject-conditions 실제 vertex 합집합의 AABB를 각 원형에 기록해 가구가 가상 보행 envelope 검사에 쓰일 수 있게 한다; 이 H2의 검사는 원형 자체의 점유와 접합에 한정된다.
@evidence settings/003-spatial-basis.md#surface-decomposition 물체의 실제 점유와 부품 접합은 models에서 검사하고 방별 transform·반복은 instances에 남긴다.
@evidence settings/003-spatial-basis.md#coordinate-datum 부품의 X/Y/Z 범위와 접촉 치수는 건물과 같은 m 단위로 측정한다.
@evidenceExclude settings/003-spatial-basis.md#ground-graph 현관·공용부·작업실의 벽과 문 연결은 spaces가 소유한다. 이 H2는 그 안에 놓일 가구의 점유와 접합만 검사하며 route를 다시 설계하지 않는다.
@evidenceExclude settings/003-spatial-basis.md#upper-graph 일자 복도와 각 침실·욕실·수납의 직접 문 연결은 spaces 소유다. 모델 점유는 통행 검사 입력이지만 복도 분기를 정하지 않는다.
@evidenceExclude spaces/002-spatial-graph.md#stage-one-verification 방 cell·문·route·가구 통행의 전체 구조 검사는 spaces/instances가 수행한다. 이 H2는 prototype 자체의 실제 점유·접합만 검사한다.
@evidenceExclude spaces/002-spatial-graph.md#door-interface 0.06m jamb·0.045m leaf와 문턱판은 건축 문 인터페이스다. 물체 모델은 문의 geometry를 복제하지 않는다.
@evidenceExclude spaces/002-spatial-graph.md#wall-junctions 내벽 T/L 접합을 층 owner가 한 번 닫는다. 물체 부품의 `@joint`는 자기 prototype 내부 접합에만 쓴다.
@evidenceExclude spaces/002-spatial-graph.md#stair-opening 상층 slab의 x=-1.24..1.58 계단 구멍은 storey/stair owner가 절삭한다. 물체의 @void는 가구 내부 공동에만 적용한다.
@evidenceExclude spaces/002-spatial-graph.md#stair-enclosure 계단과 상층 설비실·작은 침실을 막는 측벽은 공간 경계다. 모델 지지 접합 검사는 그 벽을 새 가구 판으로 대체하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 모델 H2의 모든 상태에 `@envelope`·`@part`와 접촉 경로를 요구하고 바닥·벽·매달림·상부장 밑을 다른 경우로 판정한다. 작은 부품을 본체 AABB 안에 숨기는 축소가 허용되지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 실제 vertex 합집합, 유한 면 접촉, 절삭 공동과 핀 끝의 닫힌 단면을 서로 다른 구조 행에 결부했다. source가 단지 AABB가 겹친다는 이유로 고체가 맞닿았다고 결정할 수 없다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb 지지 상대와 부품 치수는 각 원형의 `@part`·`@flat-contact` 등에서 받는다. 식물 접선만 허용하는 예외와 실제 geometry를 재야 한다는 검증 경계는 이 공통 절의 결정이다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 surface-decomposition이 정한 물체 소유와 coordinate-datum의 m 단위 위에, 모든 vertex의 실제 범위와 pin·bore·받침의 유한 접촉 판정을 추가한다. 부모는 이 검사식이나 구조 행을 포함하지 않는다.
@evidenceReview principles/design/models.md#representation-contract #46718c6 `@inventory`의 부품을 `@part` 점유와 실제 연결 성분으로 대조하고 `@void` 절삭 뒤에도 고체와 공동을 검사한다. 그 결과가 없으면 표에 적힌 외곽만으로 닫힌 모델을 주장할 수 없다.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e `@flat-contact`의 -Y는 X/Z, -Z는 X/Y 직사각형이며 각 축 범위와 받침 translation을 m로 해석한다. 접촉 검사 좌표가 구현에서 숨은 다른 단위로 바뀌면 선언 범위와 맞지 않는다.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b 실제 다리 sole 네 모서리의 포함 여부와 문·보조판·침대의 상태별 pin 틈을 실패 조건으로 둔다. 하나의 닫힌 상태만 찍어 열린 변종의 누락 부품을 지나칠 수 없다.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 ref02~04의 보이는 가구 접합은 유한 면과 빈 공간의 blocking 검사로만 바꾼다. `unverified`인 실제 하중이나 사람 안전은 참조 이미지의 인상으로 인증하지 않는다.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e `@envelope`와 각 part의 실제 외곽, 지지 경로 및 `@void`가 모두 서로 맞아야 한다. 식물의 접선 예외도 별도 식으로 제시되어 AABB가 맞는 끊긴 조립은 완료 모델이 되지 않는다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 surface-decomposition의 형상·배치 분리와 coordinate-datum의 m 기준을 대조했다. 실제 vertex AABB와 핀·공동 접합은 국소 원형의 결정이고 최종 방 접촉·통행은 instances에서 재므로 settings의 방 그래프나 새 상태를 요구하지 않는다.
@evidenceReview obligations/core/common.md#proportionate-development #78feb28 공통 검사를 이 H2에 모아 `@flat-contact`, `@suspension-face`, `@cavity-min`의 뜻을 재사용하게 한다. 개별 원형의 상태별 `@part` 값은 각 물체 H2에 남아 큰 수납 가구의 결정을 한 문장으로 축약하지 않는다.
@evidenceReview obligations/design/models.md#model-representation-completion #76dd818 구조 행 대조는 문서의 선언을 검사할 수 있지만 실제 source mesh의 face와 GPU 결과는 별도 미검증이라고 적었다. 이 구분으로 형식상 닫힌 표를 표현의 의미 완료로 오인하지 않는다.
@evidenceReview settings/002-household.md#design-subject-conditions #741a9e2 모든 vertex의 AABB를 후속 instances가 받을 값으로 정의한다. 0.60m 가상 보행 원통과 실물 가구의 간섭은 이 H2가 재지 않으므로 통행 인증을 원형 점유 검사에 귀속하지 않는다.
@evidenceReview settings/003-spatial-basis.md#surface-decomposition #0451742 models가 부품의 범위와 접합을 확정하고 방별 transform은 instances가 사용한다. 한 부품의 local 접촉 성공으로 실제 room floor와의 접촉을 승인하지 않는다.
@evidenceReview settings/003-spatial-basis.md#coordinate-datum #2227bc8 `@part`의 X/Y/Z 범위와 `@bore`·`@radial`의 수치는 동일한 m 좌표에서 해석한다. 건물 지면의 세계 좌표는 이 local 계측의 결과가 아니다.
@evidenceExcludeReview settings/003-spatial-basis.md#ground-graph #38b01ba 이 H2는 원형의 실제 AABB와 지지 경로를 재지만 현관에서 공용실·작업실로 통하는 문이나 계단을 배치하지 않는다. 따라서 1층 연결 그래프를 수정할 근거는 원형 검사에서 나오지 않는다.
@evidenceExcludeReview settings/003-spatial-basis.md#upper-graph #6e5ba76 상층 복도에서 각 침실·욕실·수납으로 통하는 직접 문의 위치는 여기의 `@part` 좌표와 별개다. 점유를 제공하되 통행은 후속 배치가 묻기 때문에 상층 분기를 새로 정하지 않는다.
@evidenceExcludeReview spaces/002-spatial-graph.md#stage-one-verification #45dc0e0 실제 prototype 범위를 제공하는 일과 모든 room·문·route에서 가구가 통행을 막지 않는지 검사하는 일은 구분된다. 이 H2의 구조 행이 전수 공간 검사의 완료 기록으로 쓰이지 않는다.
@evidenceExcludeReview spaces/002-spatial-graph.md#door-interface #f75b937 모델의 `@joint`와 pin은 원형 내부 연결이다. jamb 0.06m, leaf 0.045m 및 0.016m 문턱판은 건축 개구에서 파생되므로 이 접합 검사로 문짝 geometry를 다시 만들지 않는다.
@evidenceExcludeReview spaces/002-spatial-graph.md#wall-junctions #0c7c374 내벽 끝의 T/L solid는 층 owner가 boundary 끝으로부터 한 번 닫는다. 부품끼리의 `@flat-contact`가 그 wall junction의 좌표나 room cell을 소비하지 않아 별도 가구 연결로 대체할 수 없다.
@evidenceExcludeReview spaces/002-spatial-graph.md#stair-opening #e8f2534 `@void`는 물체 안 공동에 쓰이며 upper slab의 x=-1.24..1.58 계단 구멍을 절삭하지 않는다. 모델의 구멍 검사를 통과해도 층간 headroom은 별도 공간 검사가 남는다.
@evidenceExcludeReview spaces/002-spatial-graph.md#stair-enclosure #8152e06 계단 void 양쪽의 upper-service·child-bedroom-1 측벽은 방 clear edge와 slab을 잇는 건축 부재다. 이 H2의 지지 접합은 그 벽의 계단 쪽 마감면이나 16mm 구멍 가장자리를 만들지 않는다.
-->

이 H2가 재는 실제 AABB는 후속 instances의 가상 보행 envelope 검사에 제공한다. 이 모델 검사는 통행 가능성이나 사용성 인증을 판정하지 않는다.

source는 모든 부품 vertex의 합집합으로 실제 점유를 재고 선언 점유를 넘기면 그 prototype을 실패시킨다. 각 독립 부품의 AABB가 선언 점유 안에 있어야 하고 부품마다 바닥·벽 또는 다른 부품과 닿는 경로가 있어야 한다. 하중을 지지하는 접합은 관통이나 점·선 접촉이 아니라 지정된 유한 면으로 대조한다. `@shear-z state: part, Ymin..Ymax, Zcenter-min..Zcenter-max, Z-half-depth`는 Y를 따라 중심 Z가 선형 이동하는 닫힌 사각 단면을 두 수평 끝면에서 자른다. `@flat-contact state: guest, host, -Y|-Z, plane, Umin..Umax, Vmin..Vmax`는 guest에 일체화한 평평한 받침과 host의 면이 공유하는 직사각형이다. -Y에서는 U=X·V=Z, -Z에서는 U=X·V=Y다. 두 범위의 곱이 양수이고 범위의 네 모서리가 host의 실점유 안에 있어야 한다. `wall` host는 지정 평면의 외부 건축 벽이며 room 배치에서 다시 대조한다. 비하중 장식 식물의 줄기–가지·가지–잎은 [화분 H2](004-decor-and-fixtures.md#potted-plant)가 선언한 정확한 접선 하나만 허용하고 생산자가 그 접점을 상태마다 대조한다. 이 예외를 등기구·위생기구·좌석 지지에 확대하지 않는다. 임의의 미정 소형 부품을 상위 AABB에 넣어 넘어가는 허용 규칙은 없다. 각 prototype H2의 `@inventory state:`는 그 상태의 독립 부품 ID 모집단을, `@envelope`은 전체 선언 점유를, `@part`는 각 부품의 닫힌 X/Y/Z 범위·기본 형상·접촉 상대를 적는다. 모든 허용 폭 변종과 상태를 전개하고 한 부품이라도 표에서 빠지면 검사 실패다. 비상자 AABB가 겹칠 때는 `@joint`의 절삭면과 형상 교차 증명 없이는 통과시키지 않는다. 표와 설명 문장의 수치가 다르면 둘 중 하나를 암묵적으로 우선하지 않고 설계를 실패시킨다. 이 표는 source 구현이 아니라 검증 가능한 설계 입력이다. ref02~04의 부품 접합은 그림에서 구조 안전을 판정하지 않고 이 수치 경계로만 검사하며 ref01·05의 원경은 물체 접합 값을 주지 않는다. 실제 기하 생성 전의 접촉·점유 결과는 `unverified`다.

`@piece`로 분해한 부품은 각 행의 닫힌 직육면체를 실제 점유 고체로 삼고 그 합집합을 검사한다. 같은 부품에 `@shear-z`가 있으면 해당 구간은 직육면체가 아니라 선언한 경사 단면이 실제 점유다. `@cap-contact state: 첫 부품, 둘째 부품, X|Y|Z, +|-`는 첫 부품의 지정 최외곽 면과 둘째 부품의 반대 면이 겹치는 평면 영역을 실제 닫힌 접합면으로 선언한다. 이 선언은 두 점유의 일치 평면과 양수 면적을 검사하며, 원통 끝면은 원판과 상대 점유의 교집합을 잰다. `@cavity-contact state: 홈을 낸 부품, 삽입 부품, X|Y|Z`는 `@void`의 바깥 점유 안쪽 경계에 삽입 부품의 해당 면이 유한 면적으로 닿는다고 선언한다. 원통 홈은 `@bore-x state: host, X 범위, 중심 Y, 중심 Z, 반지름`으로 `@void`의 둘레 상자와 실제 원형 절삭을 구별하고 같은 축의 핀과 유한 원통면을 맞춘다. 뒤의 source도 이 접합 영역을 실제 부품 면으로 구현해야 한다. 구멍이나 경사 단면 때문에 그 영역이 실제 고체가 아니면 해당 형상 증명을 별도로 적는다. `@part`의 전체 AABB만으로 곡면의 접촉 면적을 증명하지 않는다.

다른 prototype을 재사용하는 wrapper는 `@compose state: 원형-H2, 상태-ID, dx, dy, dz`로 하나의 child와 국소 m 평행이동을 명시한다. wrapper의 `@inventory`는 새로 만드는 부품만 열거하고 `@envelope`은 그 부품과 child의 실제 점유 합집합이어야 한다. child의 안정 part/face 주소를 wrapper에 복제하지 않으며 child가 없거나 접촉면이 비면 검사 실패다.

별도 instance로 배치할 원형이 받침인 경우 `@support state: 원형-H2, 상태-ID, 받침-part, dx, dy, dz`로 자식의 정확한 part 상면 또는 그 상면을 절삭한 cavity 바닥과 자기 `support@N` 면을 결합한다. 이때 자기 `@envelope`은 자기 부품만 선언하고 원형을 중복 생성하지 않는다. 한 상태에 `support@N`이 있으면 `@compose` 또는 `@support`가 반드시 있어야 하며 자식의 유한 면적 접촉, 높이 N, 실제 상태 ID를 기계로 대조한다.

문·보조판·수납 침대의 세 가동 경첩 계열은 같은 경계 규칙을 따른다. 각 축의 반경과 길이로 핀 점유를 먼저 계산하고, 회전 부품 및 고정 부품에서 그 점유와 실제 겹치는 구간을 절삭하거나 핀을 부품 밖으로 옮긴다. 절삭한 면 또는 명시한 접합판이 핀과 유한 면적으로 만나야 하며 점·선 접촉, 숨은 핀의 전면 돌출, 고정 부품과의 빈 틈은 실패다. 닫힘과 검사 열림 상태를 각각 잰다. 경첩 계열의 개별 축·절삭·접합판 좌표는 각 prototype H2가 결정한다. 세탁기·건조기의 드럼 도어는 ref02의 닫힌 서비스 장치 외관을 나타내는 고정 외피이며 이 단계에 가동 경첩 계열로 넣지 않는다. 보이는 barrel·tongue의 접합 형상은 [세탁기 H2](003-service-fixtures.md#laundry-appliances)가 정하고 실제 문 열림 동작은 `unverified`로 남긴다.

`@prose-gap 상태: 앞쪽 부품, 뒤쪽 부품, X|Y|Z, 산문명`은 두 부품의 같은 축에서 앞쪽 최소 경계와 뒤쪽 최대 경계의 양의 차를 해당 산문명 앞의 m 단위 수치와 대조한다. 상태 `*`는 해당 두 부품이 함께 있는 모든 상태를 뜻한다. 이 행에는 차이 값을 다시 쓰지 않는다.

`@prose-part 산문명: part-ID`는 산문의 부품 명칭을 같은 H2의 `@part` 또는 `@piece` ID에 묶는 어휘 행이다. ID 끝의 `*`는 같은 접두사의 실제 부품 집합을 뜻하며 그 집합의 축별 합집합 경계도 검사한다. ID 뒤의 `!void`는 그 명칭이 같은 부품의 `@void` 절삭 구간을 가리킨다는 뜻이며 다른 고체 경계로 대체할 수 없다. 파서는 수치 앞의 가장 가까운 명칭과 문장에 명시한 상태를 선택하고 그 부품·축의 행 경계, 중심, 반폭, 전폭과 대조한다. 이름 없는 다른 부품의 동일 수치는 증거가 아니다. `@prose-dim 산문명: part-ID`는 같은 어휘 연결을 폭·높이·깊이, 원통의 X/Z 지름 및 최단 축이 실제 두께인 부품의 두께 주장에만 적용한다. `@curve-linear`의 host 두께와 guest가 host보다 앞선 간격은 같은 부품 어휘와 곡면 행의 필드로 대조한다. 부품의 곡면 내부 좌표를 외곽 AABB와 혼동하지 않도록 이 별도 연결을 쓴다.

`@axis-control state: part, X|Y|Z, 값, 의미`는 해당 부품 AABB 안의 절단선·이음·구멍 중심 같은 내부 기준 좌표를 명시한다. 좌표 감사는 이 행의 상태·부품 존재와 범위 포함을 확인하고 해당 H2 산문의 같은 축 수치에 대한 증인으로 삼는다. source는 이 기준을 해당 face 또는 절삭 형상으로 구현해야 하며 선언만으로 형상 구현을 주장하지 않는다.

`@prose-bore-diameter state: part-ID, 산문명`은 산문명의 뒤에 붙은 지름 수치 하나를 같은 상태·부품의 `@bore` 반지름 두 배와 대조한다. 같은 수의 `@scalar-control`을 함께 고쳐도 보어 행과 다르면 실패한다.

`@prose-envelope 산문명: state`는 H2 안에서 명명한 prototype 산문을 정확한 `@envelope` 상태에 결합한다. 산문의 폭·높이·깊이를 그 상태의 X/Y/Z 전폭과 대조하며 다른 상태의 같은 수치로 통과시키지 않는다.

`@scalar-control 이름: 값`은 `@part`의 축 범위나 다른 구조 행에서 직접 읽거나 한 구간의 중심·반폭·전폭으로 계산할 수 없는 세부 치수·비율·반올림 경계를 검사하는 색인이다. 독립 선택의 소유자는 해당 H2 산문이고, 다른 구조 행이나 식에서 유도되는 값의 소유자는 그 입력 행이나 식이다. 이 색인은 어느 쪽에도 두 번째 설계 입력을 만들지 않는다. `excluded-` 이름은 산문이 명시적으로 채택하지 않은 과거 값이나 다른 owner의 값을 가리키며 현재 모델 source 입력이 아니다. 이름은 H2 안에서 유일하고 그 값이 설명 산문에도 실제 쓰여야 한다. 좌표 감사는 이 행과 구간에서 계산한 수치를 별도로 세며, 같은 값이라는 사실만으로 그 세부의 형상 구현을 증명하지 않는다. 새 숫자를 산문에 넣으면 기존 구조 행이나 식의 유도 여부를 먼저 확인하고, 단순 구간 계산으로는 감사가 닿지 못할 때만 이 검사 색인을 추가한다.

`@cavity-profile state: part, round|ellipse, 바닥제수, 어깨분수, 벽제수, 목 안반지름`은 좁은 목을 가진 중공 용기의 단면을 정한다. `@part`의 폭 W·높이 H·깊이 D에서 `round` 몸통의 바깥 반지름은 min(W,D)/2이고 몸통 중심 Z는 part의 최소 Z에 그 반지름을 더한 곳이며 남는 +Z 점유는 주둥이 같은 돌출에 쓴다. `ellipse` 몸통의 바깥 X/Z 반경은 W/2와 D/2이며 중심은 part의 X/Z 중점이다. 벽 두께는 min(W,D)/벽제수, 닫힌 바닥의 높이는 H/바닥제수, 어깨 높이는 H×어깨분수다. 바닥 위에서 어깨까지 안쪽 반경은 몸통 바깥 반경에서 벽 두께를 뺀 값이다. 어깨에서 상단까지 바깥 반경은 몸통 바깥 반경에서 목 안반지름+벽 두께로, 안쪽 반경은 몸통 안쪽 반경에서 목 안반지름으로 선형 보간하고, 상단의 안팎 경계를 rim으로 닫는다. `ellipse`의 어깨 아래 단면은 타원이고 목은 원형이다. 두께·내부 반경·바닥·어깨가 모두 양수이고 목이 몸통보다 좁아야 하며, 별도 `@bore`를 같은 part에 겹쳐 적지 않는다. 이 행은 후속 source가 실제 내벽과 단면 축소를 만들게 하는 설계 입력이며 형상 구현의 검증 결과는 아니다.

`@vessel-attachments state[,state]: part, spoutY, channel, gripY최소..최대, holeX최소..최대, holeY최소..최대, gripZ`는 같은 `round` cavity profile을 가진 용기의 주둥이와 관통 손잡이 비율을 소유한다. 값은 모두 양의 분수이며 spoutY·gripY·holeY는 H, channel은 목 안반지름, holeX는 몸통 반지름 R, gripZ는 W에 곱한다. 주둥이 내반경에 벽 두께를 더한 외반경이 local X·Y 점유를 넘지 않아야 하고 몸통 전면부터 +Z 경계까지 길이가 양수여야 한다. 손잡이 판은 y=gripY×H에서 x=R(y)−벽 두께/2..R, z=몸통 중심 Z±gripZ×W이고 holeX×R·holeY×H 사각형을 Z로 관통 절삭한다. 구멍은 몸통 외벽 밖이며 판 안에 양의 두께를 남기고 판의 안쪽 가장자리가 몸통 외벽과 겹쳐야 한다. 이 비율은 문서의 구조 행 한 곳에서만 정하고 후속 source가 소비한다.

`@vessel-closure state[,state]: part, capHeight`는 열린 `@cavity-profile` 입구를 같은 part의 닫힌 캡으로 막는 상태를 정한다. capHeight는 H의 양의 분수다. 캡의 바닥은 y=H−capHeight×H, 상단은 part의 Y 최댓값이다. 캡은 그 전 높이에서 profile 바깥 반지름 R_out(y)까지 채운 닫힌 회전체로, 바닥 원판도 y=H−capHeight×H의 R_out까지 채운다. 바닥의 profile 안반지름 R_in보다 R_out이 크므로 첫 단면부터 빈 목을 막고, 그 위에서는 profile 벽과 유한 부피로 합쳐 최종 형상에 열린 통로가 남지 않는다. 캡은 선언 AABB를 넘지 않아야 하고 그 아래 몸통 공동은 그대로 비어 있어야 한다.

`@part`의 `suspension` 접촉은 물체의 상부 걸림 부위에 있는 아래를 보는 면이 독립 물체의 위를 보는 면에 매달리는 상태다. local y=0은 배치 기준인 최고점이지만 그 위쪽 면 자체를 하중 접촉으로 세지 않는다. 옷걸이에서는 갈고리 안쪽 24각 면, 코트와 일상 옷에서는 각각 탭의 관통 구멍 안쪽 24각 면을 걸림면으로 삼는다. 본체를 바닥에 붙여 계산하지 않으며 실제 봉·걸이와의 변환 및 유한 면 접촉은 instances가 검증한다.

`@suspension-face state: part/face`는 `suspension`인 각 `@part`의 아래를 보는 걸림면 주소를 하나씩 선언한다. 해당 H2의 실제 절삭·단면이 이 face를 생성해야 하며 위쪽 끝면이나 없는 부품의 주소는 허용하지 않는다.

`@part`의 `underside` 접촉은 상부장 같은 독립 물체의 밑면을 local y=0 접합 평면으로 삼는다. 이때 부품 최고 y가 0이어야 하고 접합할 상부장과의 실제 면적·배치 일치는 instances가 검증한다.

`@material-face state: part/face`는 같은 부품의 일반 가시 면과 구분되는 재료 응답을 필요로 하는 실제 면을 표시한다. 이 주소는 model의 표면 분할 결정이며 finish·texture 규모·UV 결합은 materials가 소유한다. `model-owner-audit.cjs`의 표면 결합 검사는 선언된 state/part/face의 별도 결합과 그 밖의 부품의 기본 결합을 센다.

`@pin-face state: pin, receiver`는 원통 핀의 끝 원판이 receiver의 닫힌 접합면에 유한 면적으로 닿음을 선언한다. `@emitter-face state: part, -Y`는 방에서 아래로 보이는 발광 face를 지정하며 다른 부품이 그 면을 가리면 실패다. `@tangent state: host, guest, hostRadius, guestHalfWidth`는 Y축 24각 원통 host의 실제 각 변과 guest 뒷면의 공유 경계를 guest X 전폭에서 검증한다. host와 guest의 AABB를 고체 접합 증명으로 대신하지 않는다. `@bore-z state: part, centerX, centerY, radius, Zmin..Zmax`는 Z축 원형 절삭이며 부품 가장자리를 가로지를 때에도 실제 원호 벽과 남은 고체가 모두 양수 면적이어야 한다. `@bore-x state: part, Xmin..Xmax, centerY, centerZ, radius`는 X축 원형 구멍이다. 절삭 구간의 양 끝과 안쪽 벽은 열린 면이 아니라 두께 있는 고체의 노출 face다.

`@sole-grid state: part, X폭제수, Z깊이제수, X중심여유제수, Z중심여유제수`는 네 모서리 다리의 지면 발바닥을 W×D의 `@part` 점유에서 계산한다. 각 발바닥은 폭 W/X폭제수, 깊이 D/Z깊이제수이고 중심은 x=±(W/2−W/X중심여유제수), z=±(D/2−D/Z중심여유제수)다. 네 발바닥은 part의 실제 지면 단면이며 `@flat-contact` 직사각형은 그중 하나에 전부 포함되어야 한다.

`@cavity-min state: part, 바닥높이비, 측벽두께비`는 위로 열린 직사각 공동을 가진 닫힌 용기의 구조 최소 두께다. 바닥높이비는 host 높이 H에, 측벽두께비는 min(host X 폭, host Z 깊이)에 곱한다. `@void`의 위 끝은 host 위 끝에 닿아야 하며 바닥 아래와 X/Z 양쪽 측벽에 각각 이 최소 두께 이상의 고체가 남아야 한다. 이 비율은 형상의 별도 치수가 아니라 허용 하한이고, 실제 공동 경계는 `@void` 한 곳에서만 정한다.

`@formula-cylinder-grid state: part, 반지름비, 아래중심높이비, 위중심높이비`는 반지름비×min(W,H)인 네 Z축 원통의 X 중심 ±(W/2−r), Y 중심 아래·위 비율×H를 생성하고 실제 합집합의 외곽과 양수 부피 연결을 `@part`에 대조한다. `@formula-disc-pair state: part, 중심높이비`는 Y 중심 비율×H, 반지름 W/2인 측판 두 장의 상단을 대조한다. `@formula-seat-slab state[,state]: part, 두께제수`는 좌판의 y=sH..sH+H/두께제수와 X/Z 전폭을 계산하며 s는 같은 H2의 `@scalar-control outdoor-seat-height-ratio`다. `@formula-wheel-pair state: part`는 해당 상태의 차축 X 중심과 Y 반지름을 `@axis-control`에서 읽어 양쪽 바퀴의 X 외곽 ±(차축 X+반지름)을 계산한다. 네 행은 각 H2가 산문으로 정한 식을 검사기가 읽을 수 있게 하는 형식 표지이며 독립 치수 입력이 아니다. 생산자는 식의 산문 피연산자, 구조 행, 계산 외곽을 대조하고 어느 하나가 달라지면 실패시킨다.

`@radial state: part, inner, outer`는 원점 XZ 중심을 가진 Y축 원판 또는 환형 단면, `@radial-at state: part, centerX, centerZ, inner, outer`는 평행 이동한 같은 단면, `@radial-z state: part, centerX, centerY, inner, outer`는 Z축 원판 또는 환형 단면을 정한다. inner=0이면 중심까지 채우고, 양수이면 그 안은 비운다. `@ellipse state: part, innerX, innerZ, outerX, outerZ[, centerX, centerZ]`는 Y축 타원 고리의 두 반축과 중심을 정하며 생략한 중심은 원점이다. 이 행의 반축과 위치는 `@part`의 AABB와 별도로 서로 대조한다. `@grid state: prefix, columns, rows, pitchX, pitchZ, width, depth, Ymin..Ymax, contact`는 X/Z 격자의 `prefix-0..` 부품을 행 우선 순서로 배치하고 각 부품을 선언 폭·깊이·높이의 닫힌 상자로 만든다.

방사 행은 해당 부품의 원형 부분을 측정하며 별도 산문이 수치로 닫은 일체형 접합 패드를 금지하지 않는다. [샤워 bracket](003-service-fixtures.md#shower)은 원형 고리 뒤로 벽의 접촉 평면까지 뻗은 직사각 패드를 합쳐야 하므로 패드 모서리는 `@radial-at` 바깥 반지름 밖에 있다. 그 패드는 `@flat-contact`의 유한 벽 접촉을 만들며 전체 `@part` AABB 안에 남는다. 이런 추가 부피를 산문이나 별도 구조 행 없이 임의로 만들 수는 없다.

`@curve-linear state: host, guest, originY, spanY, c0, c1, hostDepth, gap, guestDepth`는 t=(y−originY)/spanY에서 host의 뒤 경계 z=c0+c1t, 앞 경계 z+hostDepth, guest의 뒤 경계는 host 앞 경계+gap, 앞 경계는 다시 guestDepth를 더한 선형 층이다. `@curve-layer`의 다항식 우선순위는 아래 문단이 소유한다. `@plant-spec`은 [화분](004-decor-and-fixtures.md#potted-plant)의 JSON 입력으로, `heights`는 mm 상태 목록, `branchAzimuthsDegrees`는 +X부터 +Z로 증가하는 줄기 24각 꼭짓점 방위 목록이고 나머지 이름 붙은 값은 최종 높이 H의 무차원 비율이다. `wallMinimum`만 m 단위 바닥 두께 하한이며 `leafFanDegrees`는 각도다. `model-plant-producer`가 상태별 `@part`·`@envelope`을 이 입력에서 생성한다. `@component-count state: part-ID, N`은 같은 상태의 그 부품을 `@void`로 절삭한 뒤 양수 면을 공유하는 닫힌 고체 연결 성분 수를 확정한다. 점·선 접촉은 연결로 세지 않는다. `@cabinet-spec`은 [수납 외함](002-storage-and-sleep.md#cabinet-and-shelf)의 m 단위 패널·틈·문·손잡이·선반 피치 JSON 입력이며 `hingeHalfWidth`는 숨은 사각 힌지의 국소 X 또는 Z 반폭이고 원형 반경이 아니다. `@cabinet-variants`는 호출 가능한 정확한 형상형/폭-mm×높이-mm×깊이-mm/상태 목록이다. `model-cabinet-producer`가 그 유한 목록의 행을 생성하며 입력·출력 불일치는 실패다.

`@plant-join state: branch-ID, baseX, baseY, baseZ, tipX, tipY, tipZ, radius`는 화분 가지의 두 반구 중심과 반지름을 m로 적고 `@plant-apex state: leaf-ID, X, Y, Z`는 잎 쐐기의 단일 시작점을 m로 적는다. 두 행은 `@plant-spec`에서 생성된 계측 결과이며 독립 설계 입력이 아니다. 접선 검사는 줄기 24각 단면의 24개 직선 변부터 가지 `@plant-join`의 밑동 반구 중심까지의 최단거리가 가지 반지름과 일치하는지, 잎 `@plant-apex`와 가지 끝 중심·반지름이 접하는지 대조하고, 가지 `@part` AABB가 이 중심·반지름의 외곽과 같은지도 재야 한다.

일반 얇은 잎의 여덟 경계 vertex 규칙과 달리 [화분](004-decor-and-fixtures.md#potted-plant)의 부채 잎은 가지 끝 접점 하나와 끝면의 네 꼭짓점을 가진 다섯 vertex의 닫힌 쐐기다. 시작점에서 폭·두께가 함께 0으로 수렴하므로 퇴화 삼각형을 만들지 않고 네 측면 삼각형과 끝면 두 삼각형으로 닫는다. 끝면 두께는 가지에서 바깥 방사방향 한쪽으로만 생기며 접선 거리와 비관통 조건을 각 상태에서 다시 계산한다.

`@curve-layer state: shell, cover, c0, c1, c2, shellDepth, coverDepth, seatGap`이 있으면 cover의 `@piece` 두 행은 채운 상자가 아니라 실제 곡면 점유의 AABB다. shell의 Y 구간에서 t=(y−Ymin)/(Ymax−Ymin), 뒤 곡선 z=c0+c1t+c2t²이다. 첫 cover 조각은 Ymin에서 이음 Y까지 z의 뒤 경계를 곡선+shellDepth+seatGap으로 잘라 좌면 앞 edge까지 채운다. 둘째 조각은 이음 Y부터 Ymax까지 곡선+shellDepth..곡선+shellDepth+coverDepth를 채운다. 두 조각의 X 구간은 같고 이음 Y 평면에서 하나의 닫힌 부품으로 합친다. 이 우선순위는 cover 두 조각에만 적용하며 다른 `@piece`는 계속 채운 상자다. 각 조각의 선언 AABB가 계산한 실제 곡면 극값과 맞지 않거나 seatGap이 음수이면 실패다.

모델 설계 모집단 계정: 이 파일의 공통 규칙 5절과 `001`~`005`의 물체 원형 47절이 현재 library의 모델 설계다. 각 물체 절은 허용 상태의 `@inventory`·`@envelope`·`@part`·`@address-state`와 필요한 표면·접합·관찰을 소유하고, 다섯 문서 감사의 구조 오류는 0이었다. 이 구조 결과는 모델 source의 실제 mesh·face 완결을 인증하지 않는다. 식별되는 생활 기능과 reference 관계는 각 물체 절의 산문과 evidence에서 별도로 판단하며 독립 evidence review는 아직 대기 중이다. 구현된 modelSources의 geometry, materials·instances 결합, GPU 관찰과 최종 방 읽힘은 현재 `unverified`다.

## 중립 관찰과 재현 한계 {#model-neutral-observation}

<!--
@evidence principles/core/common.md#scope-preservation 모든 명명 상태에 같은 중립 촬영 조건을 적용하고 실제 방 거리 비교를 별도로 남기며 광학·하중·방수·안전의 비검증 범위를 관찰 결과에 섞지 않는다.
@evidence principles/core/common.md#substantive-completion 18% 회색 배경, 0.50m 눈금, 고정 노출과 직교 여섯 방향에 하부·필요한 측면·근접·단면을 더하는 유한 재촬영 절차를 정한다.
@evidence principles/core/common.md#declared-basis ref02의 절개는 부품 상하 관계의 검사 자료, ref03~05는 방 읽힘과 밀도 기준으로 한정한다. 배경·축척·반복 view 집합은 이 모델 모집단의 저작 선택이다.
@evidence principles/core/inherited-units.md#derived-parent-differentiation delivery-review-condition의 컴파일된 topology 관찰 분모와 review-apparatus의 재현 가능한 GPU 프레임 조건에 모델 상태별 고정 배경·눈금·직교 뷰 비교를 더한다.
@evidence principles/design/models.md#representation-contract 모델 proxy의 실루엣·틈·face 주소·점유만 이 view 집합에서 판정하고 물리 성능이나 사진 같은 마감을 geometry가 약속하지 않는다고 정한다.
@evidence principles/design/models.md#spatial-convention 같은 직교 fit와 0.50m 눈금으로 상태별 크기를 비교하고 +Z 정면·+X 우측·−Z 배면·+Y 상부·−Y 하부의 방향을 고정한다.
@evidence principles/design/models.md#reviewable-structure 기본 여섯 뷰와 하부, 가려진 접합·관통·얇은 부재의 근접/단면을 반복해 한 대각 뷰에서 숨은 틈을 보지 못하는 경우를 반증한다.
@evidence principles/design/models.md#model-observable-style-basis ref01은 건축 외피, ref03~05는 생활 물체의 방 거리 읽힘으로만 사용한다. 중립 view는 사진 같은 조명·마감을 재현하는 양식 근거가 아니다.
@evidence principles/design/models.md#model-scale-layer-completion 모든 상태의 외곽 비례와 접합 상세를 같은 축척에서 비교하고 상태 변화 때 전체 뷰와 접합 근접 뷰를 모두 다시 찍도록 관찰 분모를 닫는다.
@evidenceExclude upstream/design/models.md#settings-and-space-revision-from-model-work delivery-review-condition의 컴파일된 topology 관찰 분모, review-apparatus의 GPU·카메라 조건, spatial-observation의 방·외관 관찰, roles-and-accessibility의 독립 reviewer, verification-boundary의 실제 source·frame 검증을 시험했다. 고정 축척의 모델 상태 뷰는 물체의 틈과 접합만 비교하고 방·외관 판정이나 구현 검증을 대신하지 않으므로 이 부모들의 관찰 범위를 바꾸지 않는다.
@evidence obligations/design/models.md#representation-ceiling 반복 가능한 blocking 실루엣·틈·표면만 판단하고 광학·하중·방수·전기·인체 안전을 모델 외형에서 추론하지 않는다.
@evidence obligations/design/models.md#model-review-set 18% 회색·0.50m 눈금·직교 camera와 여섯 기본 실루엣 뷰, 하부·접합 근접 뷰를 모든 상태에 반복한다.
@evidence settings/001-production.md#delivery-review-condition 컴파일 점유·주소와 중립 형상 뷰를 분리하고 section이나 한 대표 장면으로 외관·모든 방의 최종 판정을 대체하지 않는다.
@evidence settings/001-production.md#verification-boundary 실제 모델 source·GPU 프레임 결과가 없으면 형상 구현은 unverified로 남기고 문서의 수치 검사만으로 완료를 선언하지 않는다.
@evidence settings/001-production.md#roles-and-accessibility 중립 형상 view를 작성자 비교 절차로 두며 별도 reviewer의 최종 방·외관 판정이나 운영자 접근성 판정을 대신하지 않는다.
@evidence settings/004-observation.md#review-apparatus 중립 model view를 별도 검사로 정의하고 최종 방/외관 frame은 지정 WebGL 장치·카메라·source 기준으로 다시 관찰하도록 분리한다.
@evidenceExclude settings/004-observation.md#operator-access 카메라 선택·숨김·유리 및 flex 상태 UI는 viewer와 instances의 조작 계약이다. 여기에는 모델 상태의 고정 형상과 비교 뷰만 있다.
@evidenceExclude settings/004-observation.md#accessibility-products 키보드 focus·대안 조작과 텍스트 topology는 viewer·README 납품이다. 모델 절의 face 주소는 그 UI 자체를 제공하지 않는다.
@evidence spaces/001-citizen-house.md#spatial-observation 모델은 방 리뷰 거리에 추가해 중립 정면·측면·상부·대각 뷰를 정하고 spatial observation의 전체 외관·방 관찰을 대체하지 않는다.
@evidenceExclude spaces/002-spatial-graph.md#single-stair 두 flight·중간 참과 층간 route는 건축 source 관찰 대상이다. 중립 모델 뷰는 계단을 재현하지 않는다.
@evidenceExclude spaces/002-spatial-graph.md#upper-corridor 일자 복도의 폭·길이와 여러 문 직접 연결은 spatial observation 대상이다. 모델의 여러 원형 뷰로 복도 도달성을 승인하지 않는다.
@evidenceReview principles/core/common.md#scope-preservation #24155e1 모든 명명 상태를 같은 배경·눈금·노출에서 되풀이하고 실제 방 거리 관찰을 따로 요구한다. 물체 실루엣 검사로 외관이나 안전의 미검증 부분을 납품 범위에서 지우지 않는다.
@evidenceReview principles/core/common.md#substantive-completion #5b9d0e7 18% 회색, 0.50m 눈금, 고정 노출과 직교 fit의 기본 여섯 방향을 주고 필요하면 하부·좌측·근접/단면을 더한다. 상태가 바뀌면 같은 세트를 다시 찍는 구체적 절차다.
@evidenceReview principles/core/common.md#declared-basis #7ccd1cb ref02 절개는 부품 상하 관계, ref03~05는 방 거리의 읽힘을 위한 자료로 쓴다. 회색 배경과 눈금 및 여섯 view는 참조 사진의 계측 사실이 아니라 이 모델 모집단의 선택이다.
@evidenceReview principles/core/inherited-units.md#derived-parent-differentiation #0632226 delivery-review-condition의 compiled topology 분모와 review-apparatus의 GPU 프레임 조건을 유지하면서 물체 상태별 직교 실루엣·접합 근접 뷰를 추가한다. 부모의 방·외관 검사에는 이 중립 반복 집합이 없다.
@evidenceReview principles/design/models.md#representation-contract #46718c6 이 뷰가 물을 수 있는 것은 외곽 비례, 틈, 노출 face와 점유라고 본문이 제한한다. 실제 하중·방수·전기 인증은 결과가 없는 경우 `unverified`로 남아 proxy의 주장 범위를 넘지 않는다.
@evidenceReview principles/design/models.md#spatial-convention #5bbf49e +Z 정면, +X 우측, −Z 배면, +Y 상부, −Y 하부의 방향과 동일 직교 fit·0.50m 눈금을 둔다. 원형마다 임의 원근을 선택하면 이 상태 비교 조건에 맞지 않는다.
@evidenceReview principles/design/models.md#reviewable-structure #c22ab4b 기본 여섯 방향에서 보이지 않는 접합·관통·얇은 부재에는 하부 또는 해당 부품 근접/단면을 더한다. 한 대각 view가 베개 밑이나 구멍 안을 감추면 추가 관찰이 필요하다.
@evidenceReview principles/design/models.md#model-observable-style-basis #328d161 ref01은 독립 물체의 척도 원본에서 제외하고 ref03~05는 방 안 읽힘과 밀도에만 쓴다. 이 중립 셋의 key light는 참조 사진의 완성 조명이나 마감 복제가 아니다.
@evidenceReview principles/design/models.md#model-scale-layer-completion #6df8b7e 각 명명 상태를 같은 카메라·눈금으로 다시 보고 접합 상세까지 드러내게 한다. 상태 하나의 전체 실루엣만 있고 바뀐 접합의 근접 관찰이 없다면 이 관찰 설계가 덜 지급된다.
@evidenceExcludeReview upstream/design/models.md#settings-and-space-revision-from-model-work #3e4d880 delivery-review-condition의 compiled topology 분모, review-apparatus의 GPU 조건, spatial-observation의 방·외관 범위, roles-and-accessibility의 별도 reviewer 및 verification-boundary의 실제 source 검증을 대조했다. 중립 형상 뷰는 물체 상태의 비교 입력일 뿐 그 분모나 판정 권한·장치를 바꾸지 않는다.
@evidenceReview obligations/design/models.md#representation-ceiling #80e74d3 차단 형상의 비례·틈·표면은 관찰 대상으로 적고 광학, 하중, 방수, 전기, 인체 안전은 입증 대상에서 분리한다. 정밀해 보이는 뷰도 제품 인증을 뜻하지 않는다.
@evidenceReview obligations/design/models.md#model-review-set #8d4744e 회색 배경과 0.50m 눈금 아래 여섯 기본 뷰를 모든 상태에 반복하고 하부·접합 뷰를 추가하는 유한 집합이다. 이전 버전과 같은 raster·노출을 써서 차이를 비교할 수 있다.
@evidenceReview settings/001-production.md#delivery-review-condition #c796e5c 모델의 중립 비교는 compiled topology가 정하는 방·외관 전체 분모에 덧붙는 검사다. ref02 절개나 한 대표 화면으로 각 room threshold와 외피 경계를 대신하지 않는다.
@evidenceReview settings/001-production.md#verification-boundary #589d028 실제 source mesh와 GPU 관찰이 없으면 결과를 `unverified`로 적는다. 산문의 18% 배경 규칙이나 문서 구조 검사만으로 현재 형상 구현을 통과시켰다고 기록하지 않는다.
@evidenceReview settings/001-production.md#roles-and-accessibility #7e65861 작성자가 한국어 H2에 ID·치수를 남기고 별도 reviewer가 중립 뷰를 판정하도록 역할을 구분한다. 물체 뷰의 합격은 운영자 UI 접근성이나 최종 방·외관의 독립 판정이 아니다.
@evidenceReview settings/004-observation.md#review-apparatus #1872595 물체의 직교 비교 조건은 final 방/외관의 WebGL 1600×1000·FOV50° 원근 관찰을 변경하지 않는다. 실제 GPU의 source·URL·RENDERER 기록이 없으면 그 최종 프레임을 이 중립 계획으로 인증할 수 없다.
@evidenceExcludeReview settings/004-observation.md#operator-access #a2cf7d9 이 H2는 고정 물체 뷰의 카메라·축척을 판독 조건으로 적고 사용자의 궤도 이동·상태 선택 UI를 구현하지 않는다. flex와 유리 선택 뒤의 표시·검사 무효화는 viewer·instances가 맡을 조작이다.
@evidenceExcludeReview settings/004-observation.md#accessibility-products #2e72dbe 안정 ID를 한국어로 설명하더라도 키보드 focus와 선택·회전·확대 대안 또는 텍스트 topology를 이 모델 뷰가 제공하지 않는다. viewer와 README의 접근성 납품을 face 주소 검사로 대체할 수 없다.
@evidenceReview spaces/001-citizen-house.md#spatial-observation #a4c6c2d 방 리뷰 거리와 별도로 물체의 정면·측면·상부·대각을 반복하되 실제 room의 threshold·모서리·중심 네 방위는 남긴다. 물체만 찍은 뷰가 compiled 공간 관찰 id의 실패를 지우지 않는다.
@evidenceExcludeReview spaces/002-spatial-graph.md#single-stair #5e2ddc9 여섯 직교 원형 뷰는 모델 표면을 비교하며 두 flight·참·상층 도착의 계단 형상이나 route를 생성하지 않는다. 계단 headroom과 접합은 공간 owner의 별도 검사가 필요하다.
@evidenceExcludeReview spaces/002-spatial-graph.md#upper-corridor #3cb298b 물체의 각도별 촬영은 upper-corridor의 4.20m 일자 통로와 여섯 방문 연결을 계측하지 않는다. 개별 가구가 읽혀도 복도에서 방까지 도달성은 검증되지 않는다.
-->

작성자는 안정된 prototype ID와 치수를 한국어 모델 H2에 기록하고 별도 reviewer가 이 중립 뷰를 판정한다. viewer의 키보드 접근성은 이 형상 관찰의 통과 조건이 아니다.

각 물체의 모든 명명 상태를 같은 18% 회색 배경, 0.50m 눈금, 한 방향 key light, 고정 노출, 색·라벨 off, 동일 raster와 직교 camera fit에서 반복 관찰한다. 기본 실루엣 여섯 뷰는 정면(+Z), 우측(+X), 배면(−Z), 상부(+Y), 대각(+X/+Z), 반대 대각(−X/−Z)이다. 하부(−Y)를 더하고, 접합·관통·얇은 부재·개구·가려진 면은 해당 부품에 맞춘 근접 뷰 또는 단면으로 각각 드러낸다. 비대칭이 왼쪽에만 있으면 좌측(−X)도 더한다. 상태가 바뀌면 전체 뷰와 그 상태의 접합 근접 뷰를 다시 찍는다. 같은 카메라·축척·배경·조명·raster의 이전 버전과 비교하며 실제 방의 리뷰 거리 뷰는 별도로 비교한다. 이 관찰은 비례·틈·표면 주소·점유를 묻는다. 광학·하중·방수·전기·인체 안전·제품 인증은 입증하지 않으며 결과가 없으면 `unverified`다. ref02의 절개는 부품의 상·하 관계를 검사하는 자료로만 채택하고 전달 화면으로 채택하지 않는다. ref01은 건축 외피 자료여서 독립 물체의 척도 원본으로 쓰지 않는다. ref03·04·05는 각 방의 읽힘과 소품 밀도만 제약하며 픽셀에서 물체 치수를 역산하지 않는다.
