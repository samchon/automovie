# @automovie/evidence

Evidence configuration for an AutoMovie production. A production's `evidence.config.ts` calls `createEvidenceConfig`, and `@wrtnlabs/evidence` then checks that the production's code, and its writing when that is commissioned, answers the checklists in its contracts. A project created by `automovie create` already has this package and a working configuration.

## Configure

```ts
import { createEvidenceConfig } from "@automovie/evidence";

export default createEvidenceConfig({ location: import.meta.dirname });
```

`location` is the absolute project directory. With nothing else set, exported types, interfaces and classes under `src/**/*.ts` answer `contracts/development/design.md`, exported functions and class methods answer `contracts/development/implementation.md`, and exported test functions under `test/**/test_*.ts` answer `contracts/development/testing.md`. All of them also answer `contracts/development/common.md`. No narrative is selected.

Those bundled contracts are read from `<location>/.agents/skills`. A production inside a pnpm workspace, where the root holds the one shared skills tree, passes that tree's absolute path:

```ts
import { createEvidenceConfig } from "@automovie/evidence";
import { resolve } from "node:path";

export default createEvidenceConfig({
  location: import.meta.dirname,
  skills: resolve(import.meta.dirname, "../../../.agents/skills"),
});
```

The production's own `work/**` and `language/**` contracts always live under `<location>/docs/contracts`, in either layout.

### Narrative

Add `narrative` when the production writes a screenplay:

```ts
export default createEvidenceConfig({
  location: import.meta.dirname,
  narrative: {
    mode: "short",
    construction: { brief: "evidence", screenplay: "evidence" },
    naturalness: { screenplay: "evidence" },
  },
});
```

`short` is a brief under `docs/body/brief` followed by the screenplay, `short-with-settings` establishes compact settings first, and `long` keeps all four layers: settings, treatments, scripts and screenplay. A stage you leave out stays a disabled draft. The scope is the complete work unless `scope` names a pilot's exact first part.

### Research and development contracts

```ts
export default createEvidenceConfig({
  location: import.meta.dirname,
  research: "evidence",
  development: {
    entities: "evidence",
    behaviors: "evidence",
    composition: "evidence",
  },
});
```

| Option | Holds | To |
| --- | --- | --- |
| `research` | Each study in `docs/research/` | The story research principles |
| `development.entities` | Exports under `src/entities/` | `contracts/development/entities.md` |
| `development.behaviors` | Exports under `src/laws/`, `src/interactions/` and `src/consequences/` | `contracts/development/behaviors.md`, each citing the study it follows |
| `development.composition` | Exports under `src/composition/` | `contracts/development/composition.md`, citing the screenplay scenes, beats and files they realize |

Every study must be cited by some behavior, and every screenplay scene, beat and file must be realized by some composition. Omitted stages stay disabled.

### Your own claims

Top-level `claims` replaces the engineering defaults, so start from `createEngineeringClaims()` to extend them. `narrative.claims` appends claims without changing the narrative baseline. Both take ordinary `IEvidenceClaim[]` from `@wrtnlabs/evidence`.

## Run

```bash
npm run evidence
```

The exit code is 0 for a complete analysis without errors, 1 for violations and 2 for an invalid configuration or incomplete analysis. `npx evidence list` prints the configured targets, `npx evidence inspect <target>` explains one, and `--only <targets...>` with optional `--shallow` narrows a check. The `@wrtnlabs/evidence` documentation covers addresses, annotations and fingerprints.

A passing graph means the checklists were answered. It does not accept the writing or the delivered video, which remain the reviewers' call.
