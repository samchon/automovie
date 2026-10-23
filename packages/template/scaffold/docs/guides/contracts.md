# Choosing evidence scope

Evidence records accountable relationships; it does not decide whether a story works, an asset looks right, or a soundtrack is intelligible. Keep that judgment in [review](../../.agents/skills/review/SKILL.md).

## Baseline and production questions

The installed configuration selects two questions for exported source declarations and two for exported test functions. It keeps implementation, ownership, documentation, and test validity accountable without importing a library-development checklist into every creative decision. A project with no such declarations has no corresponding answers to write.

| Checklist | Useful respondent |
| --- | --- |
| [Narrative](../../.agents/skills/contracts/narrative.md) | A final screenplay unit; a whole-work response for coverage across units |
| [Assets](../../.agents/skills/contracts/assets.md) | An asset builder or an asset review document with actual observations |
| [Delivery](../../.agents/skills/contracts/delivery.md) | A handoff report for the assembled video or standalone asset |

These are available review criteria, not automatically enabled claims. A short film may need formal asset or delivery evidence; a long film may use an existing external review process. Choose by the risk of a lost requirement or stale claim, not runtime alone.

For a small task, review the script against a compact map to executable shots and the actual edit. Do not create worldbuilding, intermediate outlines, or a tag on every helper to establish that map. For repeated or long work, use mechanical coverage where maintaining the map manually would be unreliable.

## Connect a screenplay to source

If the production adopts formal script-to-source coverage, add this claim to `claims` in `evidence.config.ts` after the script exists, adjusting paths to the production. Retain the existing baseline claims.

```typescript
{
  name: "screenplay realized by shot source",
  type: "typescript",
  files: ["src/shots/**/*.ts"],
  symbol: "function",
  reference: {
    type: "markdown",
    files: ["docs/scripts/**/*.md"],
    symbol: "h2",
    noEvidenceExclude: true,
  },
}
```

Use H2 units with stable explicit anchors for required screen events, and select only executable shot builders that the actual edit calls. For a single short script, use `files: ["docs/script.md"]` in the reference. The relationship is many-to-many: several shots can realize one scene and one shot can realize several script units. This is coverage, not a checklist requiring every function to realize every scene.

A selected source function adds a tag like this inside its JSDoc, after a blank comment line:

```text
@evidence docs/scripts/arrival.md#door-opens Stages the arrival and the visible door opening before the next cut.
```

The target path is relative to the reference root, which defaults to the configuration directory in this example. Every selected script H2 must be covered; the checker cannot prove that a tagged function is called, that the edit includes its shot, or that the event is visible. Review follows those links into the assembled output. Non-executable notes belong outside the selected script scope. Record authorized omissions and revise the scope deliberately rather than excluding an unmet event to get a pass.

## Adopt a checklist where it applies

Add a claim for the selected respondent and one checklist, keeping its population narrow enough to answer meaningfully. For example, a file-level asset review claim can select `docs/review/assets/*.md` with `type: "markdown"` and `symbol: "file"`, referencing `contracts/assets.md` with `symbol: "h2"` and `checklist: true` under `root: ".agents/skills"`. Answer its two headings in HTML comments before the report's first heading so they attach to the file. Each report names the asset, current source/media identities, inspection conditions, and observations it actually covers.

Use the same pattern for delivery reports. For narrative, use a unit-level respondent for staging and a whole-work respondent for cross-unit coverage when per-scene answers would repeat or cannot establish the whole. Split the selected checklist targets accordingly rather than asserting that one scene proves every episode.

The installed `@wrtnlabs/evidence` README owns configuration syntax and annotation semantics. Inspect the actual selected population with `npx evidence list` and `npx evidence inspect '<target>'`, then run `npm run evidence`. No matching claim hosts means inactive coverage; an empty selection is not a successful review. For large scripts, separate evidence files can keep prose readable using the package's documented mechanism.

## Changing scope

Before changing a checklist heading or its selection, find every current answer and dependent review. Update the adopted obligations, selectors, and answers together, retaining any still-required coverage. For a production-specific requirement, add the smallest question or relationship that can detect its loss; do not duplicate an existing contract.

These defaults use no automatic approval lifecycle or fingerprint gate. After changing content, update its dependent evidence and observations manually. If a production needs enforced stale-review detection or stronger relationships, adopt the installed evidence package's supported mechanisms explicitly and verify their actual populations.
