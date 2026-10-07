---
name: scaffold
description: Defines how packages/template/scaffold and packages/template/language-contracts are maintained as the self-contained authoring harness every generated project inherits, including its instruction and contract materializers under packages/template/src, five trigger-partitioned contract and production skills, local contract inventory, and negative-probe and generated-consumer verification gates. Use before editing those sources, and to reach the applicable production authoring procedure when authoring production content inside this repository.
---

# Maintaining the scaffold

`packages/template/scaffold` is the empty authoring harness `automovie` stamps out, `packages/template/language-contracts` supplies its creation-selected language module, and the materializers under `packages/template/src` publish both. Generated projects inherit capability and contracts and never another production's content, so treat every change to these sources as a generated-project API change. The scaffold's [Ownership](../../../packages/template/scaffold/README.md#ownership) section owns source placement, allowed files and the source-first execution boundary, for shipped files and command side effects alike.

## Authoring procedures live with the production

The contract router and the procedures that author a production ship inside the scaffold as [contract](../../../packages/template/scaffold/.agents/skills/contract/SKILL.md), [production-lifecycle](../../../packages/template/scaffold/.agents/skills/production-lifecycle/SKILL.md), [evidence-graph](../../../packages/template/scaffold/.agents/skills/evidence-graph/SKILL.md), [source-authoring](../../../packages/template/scaffold/.agents/skills/source-authoring/SKILL.md) and [review-verification](../../../packages/template/scaffold/.agents/skills/review-verification/SKILL.md). This repository holds exactly one copy of each concern and restates none of them.

Read the applicable shipped skills before you interpret, author or review production content anywhere, a fixture or an experimental sandbox in this repository included.

Editing an instruction or contract document under the scaffold or language-contract roots changes what every future generated project is told to do. Apply the [documentation skill's instructions document](../documentation/instructions.md), verify that the links resolve from a generated project and not from this repository, and run the verification gates below.

## The shared contract inventory

Under `packages/template/scaffold`, the directories `docs/{discovery,obligations,principles}/{core,design,story,delivery}`, `docs/upstream/{design,story,delivery}` and `docs/naturalness/{core,story}` form the reserved shared inventory that `@automovie/template` ships. The family and domain boundary is part of the contract:

- `core` holds cross-shape foundations.
- `design` holds maps, objects, materials, instances, motion, systems and building space work. Object, map, motion, interior and exterior productions share this domain as separate active branches, so the partition never collapses into a video-only or undifferentiated design checklist.
- `story` holds the film ladder.
- `delivery` holds briefs, shots and release inputs.

`@automovie/evidence` pins every family and domain filename and ordered H2 anchor, so adding, removing, renaming, moving or reordering a shared H2 without the matching wiring fails the graph while it loads. Change the inventory in one coherent change that covers the target document, `EXPECTED_CONTRACTS`, the claim or reference that selects it, the evidence package's direct logic cases, and the routing guidance in `docs/README.md` and the shipped skill. A new target family also joins the reserved directory set and the contract walk. Do not recreate the deleted repository-shape probe that counts scaffold files or matches their text.

## Maps are a separate design branch

The scaffold provides `docs/maps -> src/maps` and does not widen spaces. Map owns the broad world's resolved extent, coordinates, feature content (terrain, water, ecology, land use, settlements, transport, infrastructure, weather), networks, state, and each site boundary and external access node. Spaces consumes that boundary and node and owns the site and building topology within it. Instances and systems may consume map identities and state without absorbing them.

The reason is ownership. The product requirements oblige a production author to create and verify the broad world, so treating it as engine-owned or external-only leaves those promises without an author, and putting it in spaces mixes world content with containment, envelope, opening and route decisions that change and fail independently. `automovie` owns this branch because its generated evidence graph and deterministic source consume it. If a shared package is later extracted with `wrtn-interia`, preserve these owner boundaries and migrate one canonical contract.

## Classify before adding

Decide what kind of rule you have before it goes into the inventory:

- A condition every selected authored H2, H3 and H4 must answer for itself is a no-exclusion principle checklist.
- What one inheriting unit learned by exercising its actual parents is an exclusion-permitted upstream checklist. A repair names the earliest corrected parent, and a truthful negative names the concrete parent decisions found sufficient.
- A role that the layer's primary H2 population, or a source family's selected public-export population, covers one or more times as the item requires is a no-exclusion obligation.
- An open search whose result no checklist can enumerate is a discovery duty.
- A production procedure is a skill document and not a target.
- A rule that belongs to one production is never added here. Follow [Production-specific contract](../../../packages/template/scaffold/.agents/skills/evidence-graph/work-specific.md) for its authored record and directory creation, and seed no production rule, negative ledger or empty-directory placeholder into the scaffold.

An anchor is a citation address, so choose it for the durable question and not the current wording. When an item's text changes, reread every citing host against the new text and repair each affected acknowledgement or exclusion from that reading, then repeat the applicable actual-output observations. Companion rows and fingerprints are never required.

Retire an item when it is wrong, absorbed or inapplicable. Inconvenience to one production is no reason, because that production's local targets are where its exceptions live.

## Verification

After a topology, contract or citation change:

1. Run the scaffold evidence gate.
2. Falsify each new edge or refusal with a disposable negative probe, restore it, and require the normal graph to pass.
3. Build and test the repository. The [development skill](../development/SKILL.md#testing) owns pure unit tests and changed-position coverage, and no completed-film fixture or coverage instrument exists to run.
4. When a change needs a generated-consumer observation, create a disposable project with the working-tree CLI and template after local verification. Verify the installed instructions, source lint and actual refusal boundaries. For an authorized instruction update, use the ordinary reviewed project edits defined by the linked static-document policy, preserve tracked production facts and repeat that same adoption to verify it leaves the instructions unchanged. Installation is one-way and this observation implies no automatic sync command. Keep temporary projects outside the workspace package population, protect other sessions' processes, and remove only the observation's own temporary files. Do not turn the observation into a permanent generated-file test.

Apply the scaffold's [static-document update policy](../../../packages/template/scaffold/README.md#static-document-updates) to installation and later project edits. In an authorized generated-consumer observation, start from the created project root and verify that Codex reaches its installed `AGENTS.md` and Claude Code imports that same entry point. Read the selected shape and the exact active owners through the project declaration and governed documents, not through a second generated inventory. A parent checkout's instructions do not prove the production's instructions load, and upgrading a package must not overwrite the project's installed files.

For render, pose, expression, geometry, material or motion changes, also follow the [3D modeling](../3d-modeling/SKILL.md) and [viewer-verification](../viewer-verification/SKILL.md) skills.

The [evidence graph skill](../evidence-graph/SKILL.md) owns this repository's own traceability and states how its citation discipline applies to a generated production's separate graph.
