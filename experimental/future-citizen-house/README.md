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

2026-09-21 조정자 정정에 따라 제자리 재작성을 진행한다. settings·spaces·spaceSources의 선언은 review에 유지하며 이전 판정은 무효다. 수정된 본문과 source가 다시 연 검사 및 실제 GPU 화면 대조를 독립 reviewer가 재검토한다. [원점 재검토](.wiki/99-worklog/2026-09-21-reassessment.md#restart-review)와 [저작 권한](docs/settings/001-production.md#runtime-and-restart)이 범위와 결정을 소유한다.

불합격한 Canvas2D 구현을 제거하고 production 내부 CJS 서버 → 공개 engine → WebGL 클라이언트 경로를 작성했다. 새 집 형상을 입면·층·계단·12개 방·대지의 완결 owner로 제자리 재작성했다. 뷰어는 같은 typed producer를 CommonJS로 실행하며 evidence 검증은 별도의 canonical lint가 맡는다. tsx 설치 뒤 실제 실행에서 드러난 개구부 좌표, 건물 단위 루트와 문짝 원점 오류를 수리했다. 현재 source의 HTTP 응답과 native payload 검사는 통과했으며 실제 Chromium WebGL 화면을 열었다. 다섯 reference 전수 대조와 독립 판정은 미지급이다. three와 @types/three는 package.json에 선언했고 조정자가 설치했다. 관찰한 RENDERER는 `ANGLE (AMD, AMD Radeon(TM) 8060S Graphics (0x00001586) Direct3D11 vs_5_0 ps_5_0, D3D11)`이며 다섯 reference의 화면 일치는 unverified다.

조정자 시작 명령은 이 production 디렉터리에서 `npm run viewer -- --port 4174`다. `--port`는 1–65535 범위의 정수를 받으며 생략 시 1953의 배정 포트인 4174를 사용한다. 열 경로는 `http://127.0.0.1:4174/`다. 이 명령은 `tsx`로 TypeScript 서버를 실행하며 review citation의 미작성 여부를 시작 조건으로 삼지 않는다. [tsx의 공식 실행 계약](https://tsx.hirok.io/typescript)에 따라 타입·evidence 검증은 기존 `npm run lint`가 전체 source와 같은 package.json compilerOptions로 수행한다. 검사 plugin·stage·requireReview와 engine의 CommonJS 경계는 유지한다. 런타임의 문법·모듈 로딩·native geometry 오류는 그대로 실패하며, 서버 실행 성공은 lint 통과나 독립 시각 판정을 뜻하지 않는다. 고정 크기 캡처 경로는 `http://127.0.0.1:4174/?capture=1`이며 canvas가 1600×1000 CSS pixel, pixel ratio 1을 사용한다. 서버 시작과 기존 프로세스 교체는 조정자가 맡는다. source 수정은 기존 화면을 무효화하므로 lint 후 조정자가 서버를 재시작한다.

현재 구현은 원근·PBR·그림자·등기구 광원·키보드 조작, 낮/사적/야간 차폐와 작업/손님 침대 상태를 제공한다. 같은 CJS producer의 현재 cell·surface·connector·face·opening에서 관찰 목록을 도출하고 실패한 위치도 남긴다. 절개와 외곽선은 검사 모드에서만 켜진다. 공개 engine 진단, room/storey 포함·도달, 개별 tread bounds와 실제 삼각형에 대한 문 통행 원통 검사 결과를 정보 패널에서 읽는다. 방 안 전체 동선과 계단 상승의 연속 원통 충돌, 구조·법규·에너지·실제 설비 성능 및 GPU 시각 판정은 unverified다. 이 소스 구현을 화면 승인으로 세지 않는다.
