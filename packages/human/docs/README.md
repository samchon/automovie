# Human research workspace

This folder is the research workspace of the Human rebuild (campaign #2788, research phase #2791). It is written for the developers of `@automovie/human`, mostly agents, and is not a manual: users read the package README, the public types and their JSDoc.

## Rules

- Nothing in code or JSDoc refers to this folder, so it may be deleted when the rebuild completes without breaking anything.
- A value lives in code as a typed constant whose JSDoc names its primary source and explains itself. This folder keeps the reading, comparisons and reasoning behind the value.
- Cite only a source you read, with where you read it. A source you could not open is recorded as not read, never summarized from a search result.
- Update the workspace whenever research changes, during development too.
- Screenshots go to pull requests and issues. This folder keeps only diagrams it needs.
- `package.json` `files` does not publish this folder.

## Layout

| Path | Holds |
| --- | --- |
| `sources/` | One file per source: what it is, its licence and terms, population and protocol where it has them, and what Human takes from it |
| `anatomy/<part>.md` | Per part: values with their grade (measured, derived, population-fitted, conventional), form rules, and what was tried |
| `aesthetics/` | Proportion canons, contour rhythm and other form rules, attractiveness findings |
| `techniques/` | Modeling, junction, UV, skinning, garment, hair, material and determinism techniques |
| `decisions/` | The campaign's fixed decisions and the reasons for each |
| `references/` | MakeHuman and game character creator survey, for comparison only |
| `failures/` | Approaches tried and abandoned, with the render or fact that ended them |
| `core/` | What `interface`, `engine` and `viewer` lack for Human, each gap with its proposed core change |
