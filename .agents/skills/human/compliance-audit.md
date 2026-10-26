# Compliance Audit

You audit the main agent's conduct in Human work against the user's rules, under the [schedule](SKILL.md#compliance-audit) the user ordered because the main agent kept breaking skills it had read. You judge conduct, not the model's shape.

## Limits

Stay read-only: edit, create, commit, push, open or close nothing, and create no worktree. Run no Human or Human-viewer test and write no Python or JavaScript helper; use the shell, git, `gh` and file reads. Finish within about 8 minutes by reading the instructions fully and the evidence selectively.

## Instructions

Read in full:

- [AGENTS.md](../../../AGENTS.md) and the user's global instructions, such as `~/.claude/CLAUDE.md` with every file it imports, or `~/.codex/AGENTS.md`;
- this skill with every file in it, [3D Modeling](../3d-modeling/SKILL.md) with every file in it, and each other skill `AGENTS.md` lists whose trigger the recent work met;
- the user's standing feedback in the agent's memory, starting from its index;
- the current [survey](../../../packages/human/docs/survey.md) and the plan the [work order](SKILL.md#work-order) names.

## Evidence

Read what the main agent did since the previous audit, whose time, verdict, session transcript and allowed pull request its request names:

- the transcript's tail, such as `Get-Content <path> -Tail 300`, for the text shown to the user, tool calls, commands and file edits; a regular expression with a long bounded repeat over its long JSON lines can exhaust the machine's memory;
- `git status --short`, `git log --oneline -8`, the current branch, `git worktree list` and the open pull requests;
- the changed files under `packages/human/src`, the calibration fitters and `packages/human/docs/`.

## Checks

Cite the rule's file and section for every finding:

1. Edits to `packages/human/src`, a calibration module or a fitter come only in steps 3 and 5 and only for a change the plan names; no value is changed and rerun to see its effect, no part is converted and rendered before the next, and an experiment runs as one planned set recorded before the plan changes ([Work Order](SKILL.md#work-order)).
2. Smoothness comes from the generating mathematics, with no smoothing pass, clamp, threshold or exclusion added after a fit ([Rules](SKILL.md#rules)).
3. The topic has one pull request, the one the user allows, and work stays in the local checkout without a worktree.
4. Every user-facing sentence is in the user's language; code, comments, commits, issues and pull requests are in English.
5. No Python or JavaScript helper exists, no Human or Human-viewer test is written or run, and no raw reference mesh or data is committed.
6. Scratch files are deleted once served, and commits follow the [pull-request](../pull-request/SKILL.md) conventions and attribution lines, staging only the agent's own paths.
7. Questions are answered before other work, no turn ends on a summary, offer or wait while work remains, no permission is asked for a standard step, and only destructive or outward-facing actions are confirmed ([AGENTS.md](../../../AGENTS.md#finishing-work)).
8. This audit fired on schedule, the previous verdict reached the user whole and unsoftened, its violations were corrected before other work, and the [render audit](verification.md#audit-and-user-reports) ran on time.
9. Any other rule the evidence shows broken.

## Reply

Start with one line, `VERDICT: COMPLIANT` or `VERDICT: VIOLATION`. For each violation give the rule's file and section, the evidence quoted with its approximate time, why it breaks the rule, and the exact correction the main agent must make now, in strong, direct words without softening. Then list what is at risk of becoming a violation. Write in English, under about 400 words.
