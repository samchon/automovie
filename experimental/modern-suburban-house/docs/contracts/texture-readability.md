<!--
@evidence discovery/design/materials.md#work-specific-material-requirements 사용자가 2026-09-24 텍스처 이미지 보류를 철회하고 단색으로만 읽히는 표면을 결함으로 판정했다. 공유 재료 계약은 실제 읽힘을 모든 재료 H2마다 강제하지 않으므로 이 계약이 가시 표면의 결, 물리 scale, UV·이음 결속과 매끈한 표면의 광학적 읽힘을 보존한다. 가장 이른 owner는 materials/00-material-frame.md#material-texture-response이며 lint.config.ts의 house-material-texture-readability 원칙 claim이 materials H2 모집단 전체에 건다.
-->

# 재료 표면의 실제 읽힘

모든 materials H2와 후속 source의 가시 표면에 적용한다. 사용자의 2026-09-24 지시 「텍스쳐 팍팍 묻히고 소품들 마무으리하라」가 같은 날의 비트맵 보류 지시를 대체했다.

## 결·광학 반응·물리 결속 {#material-texture-readability}

리뷰 거리에서 마감이 단색 판으로만 읽히면 미완료다. 반복 결이 있는 재료는 저작된 원형과 부재의 두께·이음에 더하여 결정론적으로 생성한 색/거칠기/법선 텍스처 중 필요한 채널을 써서 그 재료로 읽히게 한다. 유리·거울·유약처럼 실제로 매끈한 표면은 무늬를 억지로 넣지 않되 투과·반사·광택과 주변 조명의 관계가 실제 프레임에서 읽혀야 한다. 원본 레퍼런스 이미지를 붙이거나 불투명한 픽셀 배열을 프롬프트에서 옮겨 적지 않는다. 생성식, seed, 입력, 출처와 파라미터는 검토 가능한 TypeScript 함수에 남긴다.

재료 H2마다 결합 surface/part id, 반복 모듈의 미터 치수 또는 의도된 매끈함, UV 투영의 축·원점·회전, 부재 끝과 코너에서 이음이 끊기거나 이어지는 조건, 로드 실패 시 기준색 응답, 근접·리뷰 거리의 반증 관찰을 밝힌다. 후속 source는 같은 실제 메시와 결합을 `validateTextureScale`에 넣어 검사하고 검사 모집단과 결과를 기록한다. fallback 색은 결이 빠진 최종 합격을 뜻하지 않는다. 미실현·미측정 면은 `unverified`로 남긴다.

Review question: 이 H2가 소유한 표면은 실제 부재와 결속된 물리 scale·투영·이음 또는 매끈한 광학 응답을 정하고, 현 GPU 프레임에서 단색 대체판이 아니라 그 재료로 읽히는가?

Sources: 사용자의 2026-09-24 텍스처 재개 지시, 제공된 다섯 레퍼런스의 재료 관계, [공통 재료와 외피 인상](../settings/20-verification.md#visual-grammar).
