# future-citizen-house

This is a coding-agent-first AutoMovie production repository. Author production facts, construction and final screenplay documents, source, assets, and delivery indexes as ordinary tracked files. Production execution consumes typed source directly.

## Authoring routes

`AGENTS.md` is the shared coding-agent entry point. It routes contract lookup through the [contract skill](.agents/skills/contract/SKILL.md), production work through [production lifecycle](.agents/skills/production-lifecycle/SKILL.md), graph changes through [evidence graph](.agents/skills/evidence-graph/SKILL.md), implementation through [source authoring](.agents/skills/source-authoring/SKILL.md), and observation or completion through [review verification](.agents/skills/review-verification/SKILL.md). Read the current production selection and claims from `lint.config.ts` and their actual owners from `docs`; the entry point is not a generated facts inventory.

Use [Production kinds](.agents/skills/production-lifecycle/production-kinds.md) before selecting `kind` in `lint.config.ts`. Use [Production documents](docs/README.md) for physical document ownership, [Contract targets](.agents/skills/evidence-graph/contract-targets.md) for shared and language target forms, [Production-specific contract](.agents/skills/evidence-graph/work-specific.md) for local discovery results, and [Evidence staging](.agents/skills/evidence-graph/staging.md) before changing a branch stage or evidence annotation. Those routes own their semantics; this README only makes them reachable.

## Static-document updates

Scaffold installation is one-way. After creation, `AGENTS.md`, `CLAUDE.md`, `.agents/skills`, contracts, READMEs, configuration, and source are project-owned tracked files. The coding agent maintains them through ordinary reviewed edits and commits; package upgrades do not regenerate or overwrite them. Adopt an upstream instruction or contract change only as an explicit project change, preserving authored content and reconciling its affected callers, claims, and reviews.

Use ordinary coding-agent tools for authoring. Scaffold creation does not register an MCP client or write client configuration.

## First run

```bash
npm install --package-lock=false
npm run lint
```

The blank scaffold is intentionally incomplete. Select the production kind through the routed lifecycle procedure, author its prerequisites, then use the commands below at the stages their linked procedures name.

## Canonical command routes

Use the commands declared in `package.json`:

| Command | Purpose |
| --- | --- |
| `npm run lint` | Check the complete TypeScript program and active authored evidence. |
| `npm run format` | Format source with the configured compiler formatter. |

The scaffold provides instructions, contracts, and source lint, not prewritten production or viewer code. Author only the concrete source the requested work needs through the packages' public APIs. It supplies no film build, capture, render, or publication command.

The installed `automovie` CLI separately provides Markdown TOC maintenance, external-asset inspection, and capability routes. Read its local help before invoking a command. These operations do not authorize a project state store.

## Visual work

When the task needs a model view, building walkthrough, or film playback, follow [Live viewing](.agents/skills/review-verification/live-viewing.md) to implement the required view over the production's own source. A page and its controls are authored for that need, not selected from seeded viewer templates.

## Ownership

- All source code belongs under `src`, including command entry points, viewer code, review declarations, and any test source. The typed production declaration is the one exception: `lint.config.ts` sits at the project root, where the compiler plugin and the production resolver both read it. Source location does not make tooling a production design owner; the typed evidence declaration selects the authored populations.
- `public` holds HTML and static assets. Keep executable code in imported `src` modules rather than inline HTML scripts or asset directories.
- `docs` holds authored decisions, contracts, and review observations. Git holds change history. Neither is replaced by a generated state ledger.
- `package.json` is the only project JSON file. Keep package and compiler settings there; do not create another JSON configuration, design store, registry, migration journal, receipt, or cache file in the project.
- Execute production and measurement functions over typed values. Images, media, and reader-facing documents are outputs; serialized project state is not an authoring product.

Run the applicable [Author process Self-Review](.agents/skills/review-verification/self-review.md) before handing off a completed authoring, evidence, review, or stage-transition boundary.

## 현재 재작성

2026-09-21 조정자 정정에 따라 제자리 재작성을 진행한다. settings·spaces·spaceSources의 선언은 review에 유지하며 재작성 전 세대의 판정은 무효로 했다. 수정된 본문과 source가 다시 연 검사 및 실제 GPU 화면 대조를 독립 reviewer가 재검토한다. [원점 재검토](.wiki/99-worklog/2026-09-21-reassessment.md#restart-review)와 [저작 권한](docs/settings/001-production.md#runtime-and-restart)이 범위와 결정을 소유한다.

불합격한 Canvas2D 구현을 제거하고 production 내부 CJS 서버 → 공개 engine → WebGL 클라이언트 경로를 작성했다. 새 집 형상을 입면·층·계단·12개 방·대지의 완결 owner로 제자리 재작성했다. 뷰어는 같은 typed producer를 CommonJS로 실행하며 evidence 검증은 별도의 canonical lint가 맡는다. tsx 설치 뒤 실제 실행에서 드러난 개구부 좌표, 건물 단위 루트와 문짝 원점 오류를 수리했다. three와 @types/three는 package.json에 선언했고 조정자가 설치했다. 독립 판정 v-071은 settings·spaces·spaceSources와 다섯 reference에서 같은 건물로 읽히는 시각 축을 PASS로 판정했다. 단서였던 재료·부재·가구의 단순함은 후속 개선 대상으로 남아 있다. 캐노피는 v-076에서 조경 이동의 설계 추적까지 PASS를 받아 닫혔다. v-076이 기록한 실제 WebGL2의 RENDERER는 `ANGLE (AMD, AMD Radeon(TM) 8060S Graphics (0x00001586) Direct3D11 vs_5_0 ps_5_0, D3D11)`다. 이 판정 이력을 현재 트리의 신규 GPU 실행이나 전체 마감 완료로 해석하지 않는다.

조정자 시작 명령은 이 production 디렉터리에서 `npm run viewer -- --port 4174`다. `--port`는 1–65535 범위의 정수를 받으며 생략 시 1953의 배정 포트인 4174를 사용한다. 열 경로는 `http://127.0.0.1:4174/`다. 이 명령은 `tsx`로 TypeScript 서버를 실행하며 review citation의 미작성 여부를 시작 조건으로 삼지 않는다. [tsx의 공식 실행 계약](https://tsx.hirok.io/typescript)에 따라 타입·evidence 검증은 기존 `npm run lint`가 전체 source와 같은 package.json compilerOptions로 수행한다. 검사 plugin·stage·requireReview와 engine의 CommonJS 경계는 유지한다. 런타임의 문법·모듈 로딩·native geometry 오류는 그대로 실패하며, 서버 실행 성공은 lint 통과나 독립 시각 판정을 뜻하지 않는다. 고정 크기 캡처 경로는 `http://127.0.0.1:4174/?capture=1`이며 canvas가 1600×1000 CSS pixel, pixel ratio 1을 사용한다. 서버 시작과 기존 프로세스 교체는 조정자가 맡는다. source 수정은 기존 화면을 무효화하므로 lint 후 조정자가 서버를 재시작한다.

2026-09-24에 upper slab 네 piece의 평면 범위를 외벽 중심면(x=±5.38, z=±5.88)까지로 줄였다. 이전에는 외곽 x=±5.50, z=±6.00까지 뻗어 y=2.908..3.184에서 입면 stone panel 외면과 같은 평면을 이뤘다. [표면 분해](docs/settings/003-spatial-basis.md#surface-decomposition)의 "동일한 면을 두 번 생성하지 않는다"를 어기던 source 결함이고, 재료 [층간 띠](docs/materials/002-exterior-solids.md#opaque-floor-band) 결합의 선행 조건이다. slab piece 수·ID·계단 구멍과 외관은 그대로이며 slab 가장자리는 외벽 몸체 안에 묻힌다.

현재 구현은 원근·PBR·그림자·등기구 광원·키보드 조작, 낮/사적/야간 차폐와 작업/손님 침대 상태를 제공한다. 같은 CJS producer의 현재 cell·surface·connector·face·opening에서 관찰 목록을 도출하고 실패한 위치도 남긴다. 절개와 외곽선은 검사 모드에서만 켜진다. 공개 engine 진단, room/storey 포함·도달, 개별 tread bounds와 실제 삼각형에 대한 문 통행 원통 검사 결과를 정보 패널에서 읽는다. 방 안 전체 동선과 계단 상승의 연속 원통 충돌, 구조·법규·에너지·실제 설비 성능은 unverified다. 후속 재료·창호·차양·가구·조경의 구현과 해당 시각 판정은 별도로 남아 있다.

## 캐노피 r2 구현

[v-073 제출 설계](docs/spaces/003-surface-ownership.md#roof-face)를 [지붕 owner](src/house/envelope/roof.ts), [우측 입면](src/house/envelope/right.ts), [대지](src/house/site/garden.ts)가 구현한다. 설계 문서의 기존 source 부재 설명은 v-073 제출 당시의 기록으로 보존했다. 현재 소스는 열린 frame과 PV, 주보·분절 rail·기둥, 경사 지붕, 거터·배수관·집수구를 실제 geometry로 생성한다. 고정 방·층·문·계단의 그래프는 유지한다.

뷰어의 `/scene` 응답에는 같은 `buildHouse()`가 실행한 `canopyAudit`가 포함된다. 실제 부품 bounds·개구부 확장 영역·거름망 인출 경로·개수를 읽을 수 있으며 기존 관찰에 부재별 검사 위치가 추가된다. 이 수치와 일부 GPU 캡처는 전체 시각 합격이나 구조·배수·장비 성능 인증을 뜻하지 않는다. v-076으로 캐노피와 관련 조경 근거는 닫혔고 후속 커튼월·유리·마감·가구·조경 설계가 남아 있다. 관찰용 입면 normal의 기존 방향 문제도 다음 입면 설계에 남긴다.

## 캐노피 시각 재검토 v-074

v-074는 캐노피 치수·부재·배수 구현을 통과시키고 검은 연속 PV 면의 시각 표현을 거부했다. 현재 수리는 승인된 mesh·배치·간격을 유지하고 [캐노피 재질](src/house/canopy-finish.ts), 표면 owner의 material binding, [뷰어 조명](src/viewer/illumination.mjs)을 바꾼다. PV 셀은 실제 mesh의 미터 단위 UV에 맞춘 반복 재질이며 사진이나 대체 geometry가 아니다. 셀 사이 유리는 얇은 표면의 alpha 합성, 그림자는 셀 mask로 근사한다. 실물의 광투과율·굴절·발전 성능으로 해석하지 않는다.

하늘 환경은 모든 카메라에서 같은 반사광을 제공한다. 기존 태양 방향과 노출은 유지하며 그림자 해상도를 높였다. 실내 등기구는 하향 조명으로 투영하고 절개에서 제거된 광원도 함께 제외하여 하부 검사에 남던 가짜 광점을 막는다. 관찰은 기존 필수 집합과 다섯 reference를 유지한다. v-075는 이 캐노피 표현의 셀 간격·프레임·레일 리듬을 실제 GPU 캡처에서 확인해 시각 PASS로 판정했다.

전면 조경 감소는 양측 2m 유지관리 장비 접근대와 전면 cassette 작업대를 비운 의도된 이동이다. v-075가 지적한 [조경 이동·보존의 설계 근거](docs/spaces/003-surface-ownership.md#roof-face)를 보완하여 나무 4개·관목 48그룹과 낮은 풀의 목적지·보존 범위·garden 소유자를 연결했다. 해당 형상을 삭제하지 않았다. 이전보다 전면이 빈 인상은 남아 있고 후속 조경 설계가 해결해야 한다. v-076은 이 설계 추적·실행 연결과 캐노피의 충실도·시각 축을 모두 PASS로 판정했다.

## 현재 재료 전달 범위

[Assembly.material](src/house/assembly.ts)은 표면 owner가 지정한 재료 이름으로 native material을 생성한다. 현재 `pv`의 [셀 색상·alpha 텍스처](src/house/canopy-finish.ts)에 더해 `stone`, `paving`, `plaster`, `oak`, `felt`, `linen`, `tile`, `soil`에 [절차 생성 색상 texture](src/materials/bindings.ts)를 붙인다. 7개 PNG는 [생성 코드](src/materials/generate-textures.mjs)가 만들며, `felt`와 `linen`은 같은 직물 이미지를 공유한다. 재료별 roughness도 [Assembly.material](src/house/assembly.ts)에 따로 지정되어 있고 그 밖의 이름은 명시된 단색으로 남는다. 이 경로는 현재 화면의 재료 차이를 보여 주지만 재료 설계·source 단계의 비준이나 모든 표면의 시각 판정은 아니다.

[뷰어의 material uploader](src/viewer/scene.mjs)는 native 색·roughness·metallic·emissive·transmission·ior·thickness·clearcoat와 primary UV 또는 surface-metres 투영으로 생성한 UV의 baseColorTexture를 전달한다. normalTexture·metallicRoughnessTexture·occlusionTexture·emissiveTexture가 있으면 명시적 오류를 낸다. 따라서 그런 텍스처를 source에 추가하는 것만으로는 화면에 표시되지 않는다. 2026-09-24부터 uploader는 native material 레코드가 같은 모든 part placement를 world 좌표로 구운 정적 batch 하나로 모은다. instance palette는 vertex color 비율로 옮기고 거울 변환은 winding을 뒤집으며, 각 batch는 담은 placement id 목록을 유지한다. 같은 texture asset은 GPU source 하나를 공유한다. 이 머신의 channel chromium(AMD 8060S, D3D11)에서 프레임당 draw 호출이 499~1,078회에서 52~54회로 줄었고 프레임 시간은 외관 43→16ms, 실내 31~56→22~42ms였다. 고정 카메라 관찰 여덟 곳의 픽셀 변화는 0.003~0.094%, 평균 절대차 0.0025 이하다. 기본 외관의 초기 카메라는 bounds가 실제 정점 기준으로 조밀해져 약 4cm 옮겨졌다. 재료 variant 수가 늘어도 draw 호출은 finish 수를 따른다. 이 제한은 production 뷰어의 현재 지원 범위이며 엔진의 지원 여부를 판정한 것이 아니다. 반사·투과 수치는 저작 표현값이고 실측 광학 성능은 unverified다. 재료 설계·source 전달·시각 확인은 [design branch 절차](.agents/skills/source-authoring/design-branches.md)와 [선행 관계 gate](.agents/skills/evidence-graph/staging.md#transitions)를 따른다.

[재료 설계](docs/materials/001-binding-and-scale.md)는 불투명 외피·유리/PV·목재·직물/도장·습식 마감을 분해한다. [관찰 집합](docs/materials/007-observation.md)은 현재 topology 전수 관찰과 다섯 reference에 거리·접합·상태 표본을 더한다. v-082의 설계 PASS 뒤 2026-09-24에 `materials: evidence`로 전진했고 [공통](docs/accounts/materials/core-common.md)·[재료](docs/accounts/materials/design-materials.md) 의무 account를 더했다. 현재 `src/materials/bindings.ts`는 외관 시범 결합에 사용되지만 [선행 관계 gate](.agents/skills/evidence-graph/staging.md#transitions)에 필요한 `materials: review`가 아직 아니므로 graph lint는 비활성 `materialSources`에 남은 host로 보고한다. 이 결합과 전후 캡처를 정식 재료 source 또는 전수 시각 PASS로 기록하지 않는다. 새 창호 깊이·차양·가구 형상은 이 설계에서 승인하지 않는다.
