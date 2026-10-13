# Production and acceptance boundaries

## Reference authority {#references}

<!--
@evidence principles/core/common.md#scope-preservation All five original files and comparison roles are preserved as additions to mandatory compiled observations.
@evidence principles/core/common.md#substantive-completion Visual image authority is distinguished from dimensional non-authority; fountain/statue conflicts link to decision owners.
@evidence principles/core/common.md#declared-basis User-distributed paths/files directly ground form, atmosphere, materials and relationships.
@evidence principles/core/settings.md#fact-status References are neither archaeological evidence nor dimension drawings; use, construction and circulation determine dimensions.
@evidence principles/core/settings.md#source-support Original paths/roles from 01-exterior.png through 05-records-service-wing.png make the same material retrievable.
@evidence principles/core/settings.md#capability-boundary Image comparisons add questions without reducing mandatory observations or turning pixels/image numbers into measurements.
@evidence principles/core/settings.md#constraint-sufficiency Fountain-height conflicts route to fountain, and human cult-statue conflicts to sanctuary.
@evidence principles/core/settings.md#observable-identity Exterior, courtyard, sanctuary and records/service remain distinct visual questions; section axonometrics are inspection material.
-->

The user's original images are at D:/AutoMovieBench/refs-20260916/1951/: 01-exterior.png covers exterior; 02-section-axonometric.png section inspection; 03-courtyard-fountain.png courtyard; 04-worship-hall.png sanctuary; and 05-records-service-wing.png records/service. They visually ground form, atmosphere, materials and spatial relationships rather than supplying dimension drawings or actual archaeological evidence. Pixel ratios and numbers within images are not inverted into measurements. Dimensions follow [scale](10-building.md#scale) and use/construction/circulation grounds. The five comparisons add to [mandatory observations](../contracts/obligations-spaces.md#compiled-observations) without reducing that set. Conflicting fountain forms are resolved explicitly in [fountain](30-interiors.md#fountain), and the human-form cult statue in [sanctuary](30-interiors.md#sanctuary).

## Fidelity {#fidelity}

<!--
@evidence principles/core/common.md#scope-preservation Massing, members, materials, light, shadows, depth and complete interior identity remain the delivery surface.
@evidence principles/core/common.md#substantive-completion Deterministic 3D itself delivers the work; documents, topology or boxes cannot establish substitute completion.
@evidence principles/core/common.md#declared-basis Actual solids and readable members at review distance are user requirements.
@evidence principles/core/settings.md#fact-status Photographic fine-weathering replication is not proven; member readability remains a criterion to achieve.
@evidence principles/core/settings.md#source-support No claim restores every reference blemish, and neither image generation nor pasted photographs is adopted.
@evidence principles/core/settings.md#capability-boundary Deterministic 3D is direct delivery, without repaint or externally generated images as another surface.
@evidence principles/core/settings.md#constraint-sufficiency Fidelity cannot justify omitting gables, eaves, frames, leaves, level changes, fixtures or complete interiors.
@evidence principles/core/settings.md#observable-identity Permitted image inference concerns individual solid members and each room's identity at review distance.
@evidence obligations/core/settings.md#production-fidelity-tier Actual deterministic 3D supports solid/room identity judgment, without photographic weathering claims or visual completion from structural data alone.
-->

User instruction: deterministic 3D with actual solid masses/members, materials, light, shadows and depth is the delivery surface. Gables, eaves, columns, frames, leaves, level changes and fixtures must read as solids, and every room must retain identity at review distance. Documents, topology or bounding boxes cannot replace images in a completion claim. Photographic fine-weathering replication is not proven; image generation, repaint and pasted photographs are not used. Fidelity is not a reason to omit required solid members or complete interiors.

## Runtime boundary {#runtime-boundary}

<!--
@evidence principles/core/common.md#scope-preservation One source-consumption path runs from producer engine interpretation through current topology/mesh/transform/material delivery.
@evidence principles/core/common.md#substantive-completion CJS server interpretation and client artifact consumption settle the viewer module boundary.
@evidence principles/core/common.md#declared-basis Engine CommonJS preservation and prohibited workarounds are user instructions; the CJS producer structure is author-adopted.
@evidence principles/core/settings.md#fact-status API execution/viewer implementation remain unverified; selecting a structure does not establish successful operation.
@evidence principles/core/settings.md#source-support Concrete APIs must be checked in installed source before execution rather than treating remembered possibilities as facts.
@evidence principles/core/settings.md#capability-boundary Clients draw received geometry without engine ESM directory re-exports, monkey patches or workaround configurations.
@evidence principles/core/settings.md#constraint-sufficiency AABBs/UI reauthoring cannot change source geometry, and stale results cannot appear as success.
@evidence principles/core/settings.md#observable-identity Transfer preserves actual source meshes/materials without redefining the building's appearance.
-->

User instruction: preserve @automovie/engine's CommonJS boundary without converting it to ESM. Author decision: adopt a CJS server producer interpreting source through public engine APIs and delivering current topology plus actual mesh/transform/material artifacts to the client. The viewer does not call engine ESM directory re-exports. Module-compatibility hardcoding, monkey patches, workaround configuration files and repository modifications are prohibited. Draw actual producer-delivered geometry, without substituting AABB models, rebuilding the building inside UI or showing stale results as success. API execution/viewer implementation is still unverified; confirm concrete public APIs in installed source before implementation.

## GPU observation {#gpu-observation}

<!--
@evidence principles/core/common.md#scope-preservation GPU path, RENDERER and direct current-source/reference comparison are required; blank displays count as defects.
@evidence principles/core/common.md#substantive-completion Playwright channel chromium/WebGL capture and actual RENDERER reporting settle observation conditions.
@evidence principles/core/common.md#declared-basis Capture paths and software-frame exclusion follow user instructions and the 3d-modeling Visual debugging procedure.
@evidence principles/core/settings.md#fact-status Current GPU, RENDERER and visual agreement remain unverified; future captures are not described as already observed.
@evidence principles/core/settings.md#source-support Hardware observation belongs to the user-specified GPU skill; device names/RENDERER values are not invented.
@evidence principles/core/settings.md#capability-boundary Default headless software-rasterizer frames cannot serve as GPU evidence or be replaced by other measurements.
@evidence principles/core/settings.md#constraint-sufficiency Reviewers open current-source frames directly; error banners, blank canvases and obscuring labels cannot pass.
@evidence principles/core/settings.md#observable-identity The building itself must appear in actual captures before reference comparison is possible.
-->

User instruction: capture through Playwright channel chromium and WebGL under the repository 3d-modeling skill's Visual debugging procedure, reporting the actual RENDERER string. Default headless software-rasterizer frames are not GPU observations. Blank canvases, error banners and labels obscuring the building are defects. Reviewers open frames corresponding to current source and compare them directly with references. Before geometry implementation, current GPU, RENDERER and visual agreement remain unverified and cannot be replaced by other measurements.

## Work and execution authority {#execution-authority}

<!--
@evidence principles/core/common.md#scope-preservation Production authorship, dependency-triggered installation, viewer startup, verification and output storage have owners; lockfile delivery links to author-commits.
@evidence principles/core/common.md#substantive-completion Changed package.json dependencies trigger root pnpm install by the author; coordinator starts the handed-off viewer, and npm run lint verifies.
@evidence principles/core/common.md#declared-basis The 2026-09-22 user correction changes only installation within prior production-limited authority; README ownership and viewer-startup assignment remain.
@evidence principles/core/settings.md#fact-status Authority-change dates/conditions are explicit; naming an install command does not establish install/lint/viewer success.
@evidence principles/core/settings.md#source-support Outside-production pnpm install is confined to the latest direct instruction; README grounds verification commands without implying their results.
@evidence principles/core/settings.md#capability-boundary Authors install at root and hand over the changed lockfile only when dependencies change; viewer startup and other production/repository edits remain unauthorized.
@evidence principles/core/settings.md#constraint-sufficiency Installation trigger, actor, directory, command and commit linkage are settled; four viewer handoff items and verification flag/direct-binary prohibitions remain.
@evidence principles/core/settings.md#observable-identity Installation/observation authority introduces no new geometry, material or scene state; comparison outputs require external storage only.
-->

User instruction: author only inside this production. Do not change packages/*, repository .agents/*, other productions or human-face code. New files follow README ownership. The 2026-09-22 installation-authority correction replaces the former coordinator-only installation instruction. When this production's package.json dependencies change, the author runs `pnpm install` at repository root and includes changed `pnpm-lock.yaml` in the same commit as the production change. This grants no other root-file editing exception. Once a viewer exists, hand over start command, execution directory, port and path to open; the coordinator starts it. Commit/push follows [author commit procedure](#author-commits). Verification uses only README-owned npm run lint, without extra flags, alternative commands, direct binaries or additional configuration files. Leave no derived artifacts, caches or scratch files in the working tree; comparison output uses the coordinator's external capture path.

## Acceptance and completion {#acceptance}

<!--
@evidence principles/core/common.md#scope-preservation Massing/surface decomposition through finishes and both author/observer unfinished lists enter completion conditions.
@evidence principles/core/common.md#substantive-completion Observer measurement, independent reviewer judgment, coordinator assignment and forward stages have distinct responsibilities.
@evidence principles/core/common.md#declared-basis Acceptance authority and simultaneous completion are user instructions rather than author self-approval.
@evidence principles/core/settings.md#fact-status Review declarations and lint success are distinguished from visual completion.
@evidence principles/core/settings.md#source-support Observers are not infallible authorities; actual measurement must establish causes under the direct instruction.
@evidence principles/core/settings.md#capability-boundary Authors own repair/delegation but cannot declare review themselves; they submit to independent judgment.
@evidence principles/core/settings.md#constraint-sufficiency Reopening a closed stage records actual defects/reasons and preserves implementation order plus evidence-parent prerequisites.
@evidence principles/core/settings.md#observable-identity Neither side may retain unfinished building/room readability across any of five references; one attractive frame cannot close work.
-->

User instruction: the author owns source, delegation and repair; the observer measures only; a separate independent read-only reviewer judges. Observation is not assumed to establish cause; actual measurement confirms it. Close rough massing/spatial graph and declared surface decomposition first, then envelope, rule-based repeated modules, fit-out and finishes. Reopening closed stages records the actual affected defect and reason. Stages progress disabled→draft→evidence→review; authors do not declare review themselves. After submission, the coordinator assigns a reviewer. This user order gives implementation its broad sequence while evidence-parent prerequisites also apply. Completion requires both author and observer unfinished lists to be empty across all five references simultaneously. Neither lint success nor a review declaration alone supports visual completion.

## Measurement and failure records {#measurement-truth}

<!--
@evidence principles/core/common.md#scope-preservation Unsupported, discarded, worsened, erroneous, workaround and unfinished outcomes receive the same recording weight as success.
@evidence principles/core/common.md#substantive-completion Compiled artifacts answer numbers, frames answer form, and unavailable instruments leave unverified states.
@evidence principles/core/common.md#declared-basis Measurement ownership and failure reporting are user instructions; settings numbers are authored inputs.
@evidence principles/core/settings.md#fact-status Ranges, actual measurements and unverified states remain distinct; failures before process startup receive no invented exit codes.
@evidence principles/core/settings.md#source-support Numbers come from actual commands/artifacts rather than similar commands or remembered values.
@evidence principles/core/settings.md#capability-boundary Frames answer spatial identity rather than substituting as instruments for IDs, bindings or dimensions.
@evidence principles/core/settings.md#constraint-sufficiency Commands/exit codes each turn and observations at owning documents keep failure visible beside success.
@evidence principles/core/settings.md#observable-identity Images answer the subject's form and room identity at review distance.
-->

User instruction: read counts, IDs, positions, bindings and dimensions from actual compiled artifacts. Frames judge form and spatial identity at review distance. Unsupported states, failures, abandoned attempts, regressions, errors, workarounds and unfinished work receive the same weight as successes in observations/work records at their owners. Items without measurement instruments remain unverified rather than borrowing numbers from similar commands. Report actual executed commands and exit codes every turn; invent no exit code when a process never started. Settings ranges are authored inputs rather than compiled measurements.

## Author commit procedure {#author-commits}

<!--
@evidence principles/core/common.md#scope-preservation Production add→commit→push/reporting includes dependency-triggered lockfile delivery in the same unit.
@evidence principles/core/common.md#substantive-completion Explicit add paths differ for normal/dependency changes; both commit/push to the named branch, reporting non-fast-forward refusal without bypass.
@evidence principles/core/common.md#declared-basis The 2026-09-21 shared-checkout procedure and 2026-09-22 same-commit lockfile correction apply together; execution-authority supplies install conditions.
@evidence principles/core/settings.md#fact-status Hashes/push exit codes are reported after execution; a lockfile path in procedure proves no dependency change or installation.
@evidence principles/core/settings.md#source-support User-specified branch and two add commands retain exact notation; preventing frozen-install failure directly grounds same-commit delivery.
@evidence principles/core/settings.md#capability-boundary Only dependency-changed root pnpm-lock.yaml is excepted; staging others' paths, stash/revert, master, force-push and history rewriting remain prohibited.
@evidence principles/core/settings.md#constraint-sufficiency Lockfiles cannot be deferred to later commits; the limited root exception, cleanup, ignored wiki and error-reporting duties remain explicit.
@evidence principles/core/settings.md#observable-identity Viewer authorship is a commit boundary, but Git delivery does not replace visual building/room judgment.
-->

User instruction (2026-09-21, lockfile exception corrected 2026-09-22): authors directly commit and push at least at every turn end, stage completion and viewer authorship. The sole shared-checkout branch is benchmark/1951-1953-harness. At repository root, stage only this production's explicit path with `git add experimental/ancient-civic-temple`, then run `git commit -m "feat(experimental): <one-line change>"` and `git push origin benchmark/1951-1953-harness`. For dependency changes under [execution authority](#execution-authority), use `git add experimental/ancient-civic-temple pnpm-lock.yaml` so changed lockfile and production changes share one commit. Separate commits can break CI frozen install between them; do not defer the lockfile. This exception covers only root `pnpm-lock.yaml` changed by that dependency update. `git pull --rebase`, `git add -A`, staging other productions/packages/*/.agents/* or root files outside this exception, touching master, force-push, arbitrary history rewriting and modifying other authors' commits are prohibited. Neither stash nor revert another author's changes/staging. Report non-fast-forward push refusal without bypass. Before committing, clean generated artifacts, caches and scratch files from this production and exclude gitignored .wiki. Report commit hash and push exit code every turn. If sandboxing blocks Git/network, record exact errors and exit codes without bypass.
