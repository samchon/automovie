# Human research workspace

This folder keeps the Human rebuild's scientific sources, measurement protocols, reconstruction studies and rejected hypotheses. It is a developer research workspace; users read the package README and public declarations. The rebuild began in #2788 and #2791; [#2834](https://github.com/samchon/automovie/issues/2834) now owns continuation of PR #2829 on `feat/human-loft`.

## Current checkpoint

The source inventory below was checked at `758d17b5`. Preparing a checkpoint merge with remaining defects does not mean the joined body, human-looking face or complete campaign has passed visual acceptance. The current issue ledger owns outstanding observations and their exact capture sources; historical notes below retain their original experiment stages rather than silently becoming current results.

| Implemented chain | Actual source and remaining boundary |
| --- | --- |
| Detailed identity and converter | `src/structures/IAutoMovieHumanIdentity.ts` composes head identity; `src/measure/AutoMovieHumanConverter.ts` resolves beginner traits. `AutoMovieHumanGirthGrowth.ts` and `AutoMovieHumanGirthRegression.ts` separate growth and adult response; that extraction is not an anatomical correction. |
| Part sources and assembly | `src/human/generateAutoMovieHumanCages.ts` generates parts; `joinAutoMovieHumanCages.ts` welds shared rings; `generateAutoMovieHumanRest.ts` caches each assembly's emitted skin and generating construction. `src/junction/meshAutoMovieHumanCage.ts` fits controls, subdivides through the engine and applies relief. Matching source, cage and final skin are separate quantities. |
| Shared frames and consumers | `src/junction/AutoMovieHumanCageFrame.ts`, `capAutoMovieHumanCage.ts` and `frameAutoMovieHumanHead.ts` own reusable construction; parts, facial tint and inspection consume their actual definitions. An extraction does not prove the generated form. |
| Face source | `83c9c4ad` commits external nasal/perioral courses and pigment correspondence; `8f05ae5b` commits shared-frame head/orbit/ear work. [Facial research](anatomy/face-courses.md) separates these from rejected private cavity prototypes. No complete-head pass follows from either commit. |
| Hands and terminal supports | `f4fff1d0` shares MCP/shaft/thumb courses; `b73ee44d` shares limb collar supports. [Hand research](techniques/hand-curve-network.md) retains rejected controls and measurement limits. Residual hand and ankle defects remain open. |
| Appearance, pose and expression | `src/human/AutoMovieHuman.ts` emits joined or isolated skin, attachments, generated skin finish and hair cards. Joined skin still uses placeholder distance-based weights; pose admission/conversion exists, while `express()` returns neutral. Underwear and generated expression targets are not emitted by this assembly. |
| Core capabilities | [Core survey](core/gaps.md) separates already implemented axes, skinning, morph drivers, gaze, images and materials from remaining proposals. |

The supervisor retained gross acceptance for foot body/toes/nails and neck body, excluding ankle and jaw/nape junctions. Remaining responsibilities are tracked separately:

| Issues | Responsibility |
| --- | --- |
| [#2835](https://github.com/samchon/automovie/issues/2835), [#2836](https://github.com/samchon/automovie/issues/2836), [#2837](https://github.com/samchon/automovie/issues/2837) | Trunk masses/physical planes, shoulder/axilla and pelvis/groin |
| [#2838](https://github.com/samchon/automovie/issues/2838), [#2839](https://github.com/samchon/automovie/issues/2839), [#2840](https://github.com/samchon/automovie/issues/2840) | Limb/ankle transitions, jaw/nape and hand flow |
| [#2841](https://github.com/samchon/automovie/issues/2841), [#2842](https://github.com/samchon/automovie/issues/2842) | Head/facial sources and gaze/lid contact |
| [#2843](https://github.com/samchon/automovie/issues/2843), [#2844](https://github.com/samchon/automovie/issues/2844), [#2845](https://github.com/samchon/automovie/issues/2845) | Posed deformation/contact/ROM, appearance acceptance and generated expression channels |
| [#2846](https://github.com/samchon/automovie/issues/2846), [#2847](https://github.com/samchon/automovie/issues/2847) | Basic underwear and final reproduction through public parameters |

## Next representation experiment

The proposed direction gives each part front, side and oblique contours plus physical sections, places them with relative frames/proportions, shares a small family of Bezier and oval rounding rules, and fits a low-dimensional set of named coefficients to reference meshes outside the package. This is a proposal for the next experiment, not an implemented or validated system. Existing fitting of subdivision controls to authored source curves is a different operation from fitting an anatomical parameter family to references.

[Parametric curve families](techniques/parametric-curve-family.md) compares representations and proposes a bounded torso experiment with measurement feasibility, shared junction derivatives, identity holdout and source-to-displayed-skin checks. It also distinguishes lofts from primitives, sweeps, trims and booleans for general assets; no universal Bezier/loft rule or new acceptance threshold is adopted.

Evaluate that proposal on actual final skin and shared junctions while preserving independent measurements and their protocols. Breadth, depth, tape girth, a fitted reference residual and a rendered contour do not substitute for one another. [Trunk](anatomy/trunk.md), [pelvis](anatomy/pelvis.md), [hand](techniques/hand-curve-network.md) and [face](anatomy/face-courses.md) notes preserve correspondence failures that a new representation must not repeat.

## Rules

- Nothing in code or JSDoc refers to this folder, so it may be deleted when the rebuild completes without breaking anything.
- A value lives in code as a typed constant whose JSDoc names its primary source and explains itself. This folder keeps the reading, comparisons and reasoning behind the value.
- Cite only a source you read, with where you read it. A source you could not open is recorded as not read, never summarized from a search result.
- Update the workspace whenever research changes, during development too.
- Screenshots go to pull requests and issues. This folder keeps only diagrams it needs.
- `package.json` `files` does not publish this folder.

The [Human skill](../../../.agents/skills/human/SKILL.md) owns the active modeling contract. Generic geometry, rig and renderer capability belongs in core; anatomy and Human parameter vocabulary belong in Human. Change missing core capability on the Human branch in its own commits. The old separate core-checkout procedure is retired.

Human currently has no `evidence.config.ts`: `lint.config.ts` documents the rebuild's temporary delay of checklist tags. This is not a build or review exemption. Keep scientific reasoning here and source justification in declaration comments; revisit the temporary selection when the rebuild is completed.

## Layout

| Path | Holds |
| --- | --- |
| `sources/` | One file per source: what it is, its licence and terms, population and protocol where it has them, and what Human takes from it |
| `anatomy/<part>.md` | Per part: values with their grade (measured, derived, population-fitted, conventional), form rules, and what was tried |
| `aesthetics/` | Proportion canons, contour rhythm and other form rules, attractiveness findings |
| `techniques/` | Modeling, junction, UV, skinning, garment, hair, material and determinism techniques |
| `decisions/` | Parameter, output and construction decisions with rationale not replaced by current instructions |
| `references/` | MakeHuman and game character creator survey, for comparison only |
| `failures/` | Approaches tried and abandoned, with the render or fact that ended them |
| `core/` | Implemented core capabilities and remaining hypotheses from the original gap survey |
