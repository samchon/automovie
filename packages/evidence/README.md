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
  },
});
```

`construction` checks how each layer is built from the one before it. Setting a layer to `"evidence"` turns its check on, and setting a finished layer back to `"disabled"` leaves the layers still running unaffected.

`short` is a brief under `docs/body/brief` followed by the screenplay, and `long`, the mode of a series, has four layers: settings, treatments, scripts and screenplay. A layer you leave out stays a disabled draft. The checks cover the complete work unless `scope` names the first part that a pilot covers.

The screenplay is one folder per film with one file per scene: `docs/body/screenplay/<film>/NNN-<scene>.md` for a short, and `docs/body/screenplay/NNN-part/NNN-episode/NNN-<scene>.md` for a series, where each scene file realizes one scene of its episode's script. Both depths are selected on either route.

`none` checks no narrative layer, for a screenplay no narrative pass writes, and takes no `construction` or `scope`.

### Research and development contracts

Add `research` to hold each study in `docs/research/` to the research contract, and `development` when it builds the film's entities, behaviors and scenes in code:

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
| `development.composition` | Exports under `src/composition/` | `contracts/development/composition.md`, citing the screenplay scene files, sections and beats they realize |

Every study must be cited by some behavior. Every screenplay section and beat must be realized by some scene, and every scene file by the film that orders it. Under `narrative: { mode: "none" }` with `development.composition`, every section of `docs/instructions/` must be realized by some composition or entity too, with no exclusion, because no narrative layer cites them. An option you leave out stays disabled.

### Your own claims

A claim binds a set of declarations to the checklist they answer. Top-level `claims` adds claims to the engineering defaults, and `narrative.claims` adds claims to the ones `narrative` configures. Both take `IEvidenceClaim[]` from `@wrtnlabs/evidence`.

`createEvidenceConfig` is the package's only entry. The `@automovie/evidence/internal` subpath serves this repository's own tests and tools and promises no stability.

## Run

```bash
npm run evidence
```

The exit code is 0 for a complete analysis without errors, 1 for violations and 2 for an invalid configuration or incomplete analysis. `npx evidence list` prints the configured targets, `npx evidence inspect <target>` explains one, and `npm run evidence -- --only <targets...>`, optionally with `--shallow`, checks only those targets. The [`@wrtnlabs/evidence` documentation](https://github.com/wrtnlabs/evidence#readme) covers addresses, annotations and fingerprints.

A passing check means the checklists were answered. Whether the writing and the delivered video are good is still decided in review.
