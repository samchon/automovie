# Production workflow

The default lint and evidence configurations cover ordinary TypeScript development. Add the [narrative profile](../../workflow/README.md#configure-the-production) when the requested deliverable requires a screenplay; standalone assets can retain the baseline and adopt their own scoped duties. Choose the narrative mode from the requested deliverable. The narrative architecture has fixed responsibilities; the source layout can adapt to the production.

## Production paths

| Mode | Required path |
| --- | --- |
| Long film or series | Instructions and discovery → settings → treatments → scripts → final screenplay → execution and edit → whole-work delivery |
| Short video | Instructions and discovery → final screenplay → execution and edit → delivery |
| Standalone asset or motion | Required appearance and controls → asset source → observed model or animation → handoff |

Scripts and final screenplay each have their own construction and expression-revision pass. Settings and treatments finish within construction. The [storytelling guide](storytelling.md) owns these responsibilities and the [lifecycle guide](narrative-lifecycle.md) owns their evidence and independent review order. A short video's direct entry is the user's explicit exception; it does not make long-form layers optional.

A clear request can supply a short video's brief. Larger works record creative instructions once and trace them into settings and events. Write complete bodies before their evidence pass; disabled means drafting rather than completion. Keep partial scope and pilots distinct from the requested whole.

When taking over existing settings, scripts, or completed work, preserve the supplied documents or a verifiable source revision separately from new authored bodies. Record their identity, adopted requirements, fixed quotations, and reinterpretation boundaries through instructions. A prior finished work supplies material and choices to assess; it does not automatically approve this production's layers. `docs/revision` holds reviewed construction originals for expression passes, not unassessed reference intake.

## Source ownership

| Location, when used | Owns |
| --- | --- |
| `docs/instructions/` | User requirements and delegated creative choices |
| `docs/body/settings/` | Canon, baseline facts, constraints, and their outline |
| `docs/body/treatments/` | Events, causes, consequences, and information release |
| `docs/body/scripts/` | Executable scenes, performances, and release partition |
| `docs/body/screenplay/` | Final audiovisual realization of the scene scripts |
| `docs/revision/`, `docs/naturalness/` | Frozen construction and expression working editions |
| `docs/evidence/`, `docs/review/` | Evidence, current reviews, verdicts, and findings |
| `src/assets/` | Models, rigs, reusable authored controls |
| `src/shots/` | Executable staging, performance, camera, and sound choices |
| `src/film/` | Assembled edit, captions, sound placement, and delivery entries |
| `public/` | Retained fixed media and browser static inputs |

Create content files when needed; empty classification trees add nothing. A small program can combine source roles in one entry. Split them where independent changes or reuse justify it, keeping shared values with one owner. Narrative source partition and runtime source organization are different concerns.

The final screenplay owns the required audience experience; shot code realizes it, and the edit selects what reaches the artifact. Trace those relationships and inspect the delivered result. A named source function is not proof that its shot is included or visible. Keep acquisition outside deterministic replay and measure final timing from accepted audio and actual performance.

## Project ownership and customization

The installed instructions, contracts, workflow helpers, configuration, and source belong to this production; package upgrades do not migrate them. Adapt its language, subject-specific criteria, paths, and tool choices while preserving the selected path's responsibilities and evidence relationships. A layout change updates selectors, imports, command entries, links, and existing answers together.

Keep routing in `AGENTS.md`, task goals and boundaries in skills, and branch detail in guides. Installed APIs own their callable behavior. The blank scaffold supplies no viewer or render host; choose and wire the actual delivery entry before claiming a runnable production.

Prove a representative render and media path before scaling repeated work. After a source fact, event, voice take, asset, or edit changes, update dependent bodies, evidence, current reviews, timing, and observations. Whole-work completion requires the separate final review, not a sum of local or pilot successes.
