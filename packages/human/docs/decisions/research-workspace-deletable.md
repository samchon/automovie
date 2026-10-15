# The research workspace may be deleted

## Decision

`packages/human/docs` is a research workspace for the developers, not a manual. It may be deleted when the campaign completes, so no code or JSDoc refers to it, and `package.json` `files` does not publish it.

## Reasons

- Keeping prose in sync with source is costly; a workspace that may be deleted carries no promise of being current after the campaign.
- A value's justification must survive the workspace, so it lives in the JSDoc of the constant that holds the value, citing the primary source directly.
- Research held only in issue comments, evidence tags and session memory was lost in the basis era (#2791); a folder in the branch keeps it reviewable while the work runs.

## Consequences

- The package README is a short overview; explanation lives in JSDoc.
- A source file here records the reading and the reasoning; the cited number itself is repeated in code with its citation.
