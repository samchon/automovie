# @automovie/evidence

Configures the evidence check of an AutoMovie production. A production's `evidence.config.ts` calls `createEvidenceConfig`, and `@wrtnlabs/evidence` then checks that the production's code, and its writing once `narrative` is set, answers the checklists in its contracts. A production created by `automovie create` already has this package and a working configuration.

## Configure

To add the package to a project made another way, run `npm install --save-dev @automovie/evidence @wrtnlabs/evidence` and place the checklists it reads under `.agents/skills`. The package needs Node.js 22.23.2 or later.

```ts
import { createEvidenceConfig } from "@automovie/evidence";

export default createEvidenceConfig({ location: import.meta.dirname });
```

`location` is the production's absolute directory. With nothing else set, these engineering defaults apply, and the narrative checks are off:

| Declarations | Answer |
| --- | --- |
| Exported types, interfaces and classes under `src/**/*.ts` | `contracts/development/design.md` |
| Exported functions and class methods under `src/**/*.ts` | `contracts/development/implementation.md` |
| Exported test functions under `test/**/test_*.ts` | `contracts/development/testing.md` |
| All of the above | `contracts/development/common.md` |

A declaration answers a checklist in its doc comment, with one `@evidence <checklist>#<item>` tag per item followed by the answer.

The bundled contracts are read from `<location>/.agents/skills`. A production inside a pnpm workspace, where the root holds the one shared skills tree, names that tree, absolute or relative to `location`:

```ts
import { createEvidenceConfig } from "@automovie/evidence";

export default createEvidenceConfig({
  location: import.meta.dirname,
  skills: "../../../.agents/skills",
});
```

The production's own contracts, `work/**` and `language/**`, hold the questions specific to that work and to its language, and live under `<location>/docs/contracts` in either layout.

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

`construction` checks how each layer is built from the one before it, and `naturalness` is the separate check of the screenplay's expression. Setting a layer to `"evidence"` turns its check on.

`short` is a brief under `docs/body/brief` followed by the screenplay, and `long`, the mode of a series, has four layers: settings, treatments, scripts and screenplay. A layer you leave out stays a disabled draft. The checks cover the complete work unless `scope` names the first part that a pilot covers.

`none` checks no narrative layer, for a screenplay written outside them, and takes no `construction`, `naturalness` or `scope`.

### Research and development contracts

Add `research` when the production keeps research studies, and `development` when it builds the film's entities, behaviors and scenes in code:

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

| Option | Checks | Against |
| --- | --- | --- |
| `research` | Each study in `docs/research/` | `contracts/story/shared/principles/research.md` |
| `development.entities` | Exports under `src/entities/` | `contracts/development/entities.md` |
| `development.behaviors` | Exports under `src/laws/`, `src/interactions/` and `src/consequences/` | `contracts/development/behaviors.md`, each citing the study it follows |
| `development.composition` | Exports under `src/composition/` | `contracts/development/composition.md`, citing the screenplay scenes, beats and files they realize |

Every study must be cited by some behavior, and every screenplay scene, beat and file must be realized by some composition. Under `narrative: { mode: "none" }`, every section of `docs/instructions/` must be realized by some composition too, because no narrative layer cites them. An option you leave out stays disabled.

### Your own claims

A claim binds a set of declarations to the checklist they answer. Top-level `claims` adds claims to the engineering defaults, and `narrative.claims` adds claims to the ones `narrative` configures. Both take `IEvidenceClaim[]` from `@wrtnlabs/evidence`.

`createEvidenceConfig` is the package's only entry. The `@automovie/evidence/internal` subpath serves this repository's own tests and tools and promises no stability.

## Run

```bash
npm run evidence
```

The exit code is 0 for a complete analysis without errors, 1 for violations and 2 for an invalid configuration or incomplete analysis. `npx evidence list` prints the configured targets, `npx evidence inspect <target>` explains one, and `npm run evidence -- --only <targets...>`, optionally with `--shallow`, checks only those targets. The [`@wrtnlabs/evidence` documentation](https://github.com/wrtnlabs/evidence#readme) covers addresses, annotations and fingerprints.

A passing check means the checklists were answered. Whether the writing and the delivered video are good is still decided in review.
