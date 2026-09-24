# 재료 공통 틀

## 색 공간과 선형 변환 {#material-color-space}

모든 재료의 기준색은 sRGB 8비트 hex로 저작하고, 렌더러에 넘기는 base color는 그 hex를 IEC 61966-2-1 sRGB 전달 함수로 선형화한 값이다. 변환식은 채널 값 c(0–1)가 0.04045 이하이면 c / 12.92, 그보다 크면 ((c + 0.055) / 1.055)^2.4이며 각 재료 H2는 hex와 소수점 셋째 자리까지의 선형 RGB를 함께 적는다. 두 값이 어긋나면 hex가 저작 결정이고 선형값은 파생값이므로 source는 hex에서 선형값을 다시 계산해 문서 값과 대조한다. 이 hex는 [레퍼런스 권위](../settings/20-verification.md#reference-authority)에 따라 원본 사진의 픽셀을 샘플링한 값이 아니라 [공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar)의 색 관계(따뜻한 백색 siding, 짙은 charcoal, 흰 trim, 붉은갈색 벽돌, 꿀빛/중간갈색 목재, 회베이지 직물)를 이 branch가 수치로 정한 선택이다. 출력은 [고정 노출과 white balance](../settings/20-verification.md#lighting-state) 아래 sRGB로 표시하며 재료 값이 view별 노출 보정을 흡수하지 않는다. source owner는 `src/materials/frame.ts`이고, 리뷰는 각 재료의 hex→선형 재계산 일치와 중성 조명 견본 판에서 흰 계열(siding·trim·천장)이 서로 구별되는지를 관찰한다.

## 비트맵 없는 표면 응답 {#material-no-bitmap}

조정자 지시에 따라 이 production은 텍스처 이미지(색·거칠기·법선·변위 맵)를 저작하지 않는다. 각 재료는 base color, roughness, metallic, transmission의 상수 네 값만으로 응답을 정하고, 유리만 ior와 두께를 더한다. 발광(emission)은 재료 값으로 쓰지 않으며 조명 기구의 빛은 systems가 소유한다. siding course·벽돌 줄눈·shingle 중첩·마루 판·타일 줄눈처럼 반복 결이 필요한 곳은 [표현 수준](../settings/20-verification.md#fidelity)이 요구하는 읽힘을 색 패치가 아닌 실제 geometry(모델/instance의 두께 있는 부재)와 재료 상수의 대비로 얻는다. 나중에 비트맵이 허용되면 적용 계약은 다음과 같다. 물리 scale 1 texel 단위는 m, UV는 host 면의 세계 좌표 투영(벽은 수평 U·수직 V, 바닥은 X/Z)이며 반복 방향은 siding/마루의 판 길이 방향을 U에 둔다. 비트맵이 없거나 로드에 실패하면 여기 적은 상수 응답이 그대로 fallback이다. source owner는 `src/materials/frame.ts`이며, 리뷰는 재료 객체에 map 슬롯이 비어 있고 결이 geometry로만 읽히는지를 검사 모드와 중성 조명 근접 view에서 관찰한다.

## 거칠기·금속성 관례 {#material-response-conventions}

roughness는 0–1 상수로 다음 대역을 쓴다. 광택 유리·거울 0.02–0.05, 반광 도장·에나멜·도기 0.25–0.40, 무광 도장 벽·목재 오일 마감 0.45–0.65, 벽돌·콘크리트·shingle·직물 0.80–0.95. metallic은 도장하지 않은 노출 금속(스테인리스 가전, 수전, 거울 은막)만 1.0이고 도장된 금속 부재(창틀·차고문·검은 분체 도장 난간살과 손잡이)는 표면이 도막이므로 0.0으로 둔다. transmission은 투명 유리만 0보다 크다. 이 대역은 [빛과 기준 상태](../settings/20-verification.md#lighting-state)의 오후 key와 하늘 fill 아래에서 재료 사이의 광택 위계를 만들기 위한 저작 선택이며 측정한 BRDF가 아니다. 각 재료 H2의 값은 이 대역 안에 들어야 하고 벗어나면 그 H2가 이유를 적는다. source owner는 `src/materials/frame.ts`이며, 리뷰는 같은 조명의 견본 구 배열에서 대역 순서대로 하이라이트 폭이 좁아지는지를 관찰한다.

## 면 결합 규칙 {#material-binding-rule}

재료는 [완결 시각 표면의 소유 분해](../spaces/03-surface-owners.md#exterior-surface-handoff)와 [방 내부의 완결 면 소유](../spaces/03-surface-owners.md#interior-surface-handoff)가 정한 owner의 면에 결합하고, 면의 경계·두께·개수는 바꾸지 않는다. 한 면에는 정확히 한 재료가 붙고 두 재료가 만나는 선은 host owner가 이미 가진 부재 경계(trim 돌출, 문턱, 걸레받이, 기단 윗선)와 일치해야 한다. 같은 면을 삼각형 단위로 나눠 다른 재료를 칠하는 방식으로 경계를 새로 만들지 않는다. 바깥면 법선은 host owner가 정한 바깥 방향이며 재료는 단면(single-sided) 기본값을 쓰고 유리·얇은 커튼만 양면이다. source owner는 `src/materials/bindings.ts`이고, 리뷰는 컴파일된 산출물에서 재료 없는 면·두 재료를 받은 면의 수가 0인지와 경계선이 host 부재 끝선과 일치하는지를 검사 모드 view로 관찰한다.

## 재료 리뷰 견본 {#material-review-set}

재료 판정은 극적 shot 전에 고정된 견본으로 한다. 첫째 견본은 중성 조명 판이다. [리뷰 프레임 조건](../settings/20-verification.md#frame-condition)의 1536×1024 canvas와 중성 배경 위에 모든 재료 H2를 0.5 m 구와 0.5 m 평판으로 한 줄씩 놓고, 색온도 6500 K 상당의 방향광 하나와 균일한 환경광 아래 고정 노출로 찍는다. 이 판은 hex 명도 순서(흰 trim > 천장 > 실내 벽 > siding, charcoal 창틀 < 차고문)와 roughness 대역별 하이라이트 폭 순서를 한 화면에서 반증한다. 둘째 견본은 기준 상태 판이다. 같은 배열을 [빛과 기준 상태](../settings/20-verification.md#lighting-state)의 오후 key·하늘 fill과 켜진 따뜻한 실내등 아래 다시 찍어 따뜻한 조명에서 흰 계열이 서로 합쳐지거나 올리브·청회색 침구가 구별을 잃는지 본다. 셋째는 실제 host 위 거리 견본이다. 외부는 01 기본 view(사람 눈높이 1.6 m, 약 20 m)와 벽 앞 2 m 근접 view, 실내는 각 방 threshold view(바닥 위 1.6 m, 수직 FOV 60°)와 가구 앞 1 m 근접 view에서 재료 경계가 host 부재 끝선과 맞는지, 재료 없는 면이나 두 재료를 받은 면이 있는지, 반복 결을 만드는 geometry가 비트맵 없이 읽히는지 관찰한다. 넷째는 상태 견본이다. 이 production의 재료에는 시간 변화나 젖음·마모 상태가 없으므로 기준 상태 하나만 검사하고, 문 열림 상태에서 문짝 모서리가 같은 재료를 유지하는지만 더 본다. source owner는 `src/materials/review.ts`이며 관찰 위치와 결과는 컴파일된 산출물과 현재 GPU 프레임에서 읽고, 판이 없거나 실패하면 해당 재료 판정은 unverified로 남긴다.
