# Evidence in a production

`evidence.config.ts` calls the installed `@automovie/evidence` package with one options object. Its default selects engineering duties; `lint.config.ts` checks ordinary TypeScript correctness independently. Installed package READMEs, public types, and JSDoc own configuration options, selectors, annotations, and checker behavior. This guide owns the authoring procedure and its relationship to the production's contracts.

## Choose the production scope

Keep the default configuration for ordinary coding and standalone assets, adding actual asset or delivery duties where their respondents can establish them. A blank project needs no story mode, stages, or narrative gate.

For video writing, add narrative options to the same configuration object. Choose long mode for settings → treatments → scripts → final screenplay, or short mode for direct final screenplay entry. The engineering baseline remains active. Read the installed `@automovie/evidence` README for the minimal configuration and supported additions rather than copying a local factory or maintaining a second config file.

Start each creative pass disabled while composing its complete draft. Activate its evidence stage only after the body and a verifiable complete-draft snapshot exist. Disabled stages permit drafting; they do not release the chosen route's completion responsibilities. [Narrative lifecycle](narrative-lifecycle.md) owns pass order, expression revision, independent review, promotion, upstream repair, and whole-work completion.

Complete work is the default narrative scope. Use a first-part pilot only when the user commissions that slice, retain work-wide settings and the exact selected part's lineage, and disclose which whole-work obligations remain unestablished. Restore complete scope and its populations before claiming completion of the whole work.

## Put each respondent with its owner

The [storytelling guide](storytelling.md#working-files) lists default creative locations. Construction answers remain detached from the creative body; rewriting answers accompany the working edition in comments. Review records mirror the actual current units and have a verdict for the whole selected population. Read [evidence writing](../../.agents/skills/evidence-writing/SKILL.md) for the respondents and audit, and installed `@wrtnlabs/evidence` documentation for their actual annotation and fingerprint syntax.

Production-specific and language-specific questions belong in the appropriate family under `.agents/skills/contracts/story/{work,language}`. Adopt a question with its actual population and owning layer/pass through the config object. A scene answers its own behavior; a population respondent answers a whole-work duty. Shared questions remain in force. The [contracts guide](contracts.md) owns requirement adoption and source-to-output responsibilities.

Engineering support duties stay outside creative body, frozen and working editions, creative evidence and review, narrative user instructions, and story-contract inputs. Physical aliases do not change ownership. A duty consuming those inputs needs an explicitly owned narrative work claim. Read the installed package's supported composition and boundary rules when changing those selectors; keep the contracts, respondents, parent relationships, and review mirrors consistent.

## Complete a pass check

After writing the selected body and its evidence, run the project's checker for the submitted pass:

```sh
npm run production:check -- --layer screenplay --pass construction
npm run production:check -- --layer screenplay --pass naturalness
```

Read the complete package report and readiness diagnostics. They distinguish preparation for an independent reading from structural completion, including prerequisites, current reviews, population verdicts, layout and identity checks, and rewriting transfers. The installed `@automovie/evidence` documentation owns exact fields and exit behavior. A failed completion result can still identify a body ready for review; structural readiness cannot issue an artistic verdict.

The checker evaluates captured inputs. Reevaluate after source or filesystem changes; a saved result describes its original capture. Review the complete selected scope rather than using a filtered target result as proof of a full pass. Keep a pilot distinct from the complete work and check the final delivered image, sound, timing, and edit separately.

During expression review, retain the frozen construction and finish the working edition's complete independent round before transferring it. Transfer every provided working file to its actual body counterpart with HTML comments removed and every other byte preserved, following the [closed construction boundary](narrative-lifecycle.md#complete-expressive-rewriting). Navigation indexes, when supplied, participate in that transfer; absent optional indexes need no fabricated copies. Pending initial promotion prevents downstream consumption and completion even when the working edition is ready to reread; later semantic body repairs follow [upstream repair](narrative-lifecycle.md#upstream-repair-and-scope).

## Upstream provenance and retained responsibilities

The production skills and story contracts adapt [`wrtnlabs/wrtn-novels`, `packages/template/scaffold/.agents/skills`](https://github.com/wrtnlabs/wrtn-novels/tree/6a9178bb2d96038d93b5313cd28682061cf44a03/packages/template/scaffold/.agents/skills) at commit `6a9178bb2d96038d93b5313cd28682061cf44a03`. Their MIT copyright and permission notice are retained in [LICENSE.novels](../../.agents/skills/LICENSE.novels). The installed `@automovie/evidence` package owns the adapted reusable graph and topology implementation and its source notice.

Related questions may share one checklist here; their respondents and pass responsibilities remain distinct.

| Upstream responsibility | Production owner |
| --- | --- |
| Workflow and four creative layers | [Production](../../.agents/skills/production/SKILL.md), [storytelling](storytelling.md), and [lifecycle](narrative-lifecycle.md) |
| Instructions and delegated direction | [Instructions](../../.agents/skills/instructions/SKILL.md) and [direction](../../.agents/skills/instructions/direction.md) |
| Requirement discovery | [Discovery](../../.agents/skills/discovery/SKILL.md) |
| Settings, treatments, and scripts | [Settings](../../.agents/skills/settings/SKILL.md), [treatments](../../.agents/skills/treatments/SKILL.md), and [scripts](../../.agents/skills/scripts/SKILL.md) |
| Final prose and its independent drafting context | [Final audiovisual screenplay](../../.agents/skills/screenplay/SKILL.md) |
| Naturalness, original editions, and revision cycles | [Rewriting](../../.agents/skills/rewriting/SKILL.md) and [cycles](../../.agents/skills/rewriting/cycles.md) |
| Principles, obligations, discovery, upstream, naturalness, and review contract families | [Story contracts](../../.agents/skills/contracts/story/index.md) |
| Language discovery, value fidelity, idiom, relationship speech, and population comparisons | [Discovery questions](../../.agents/skills/contracts/story/shared/discovery/common.md), [language ownership](../../.agents/skills/contracts/story/shared/obligations/common.md), and [expression questions](../../.agents/skills/contracts/story/shared/naturalness/common.md) |
| Evidence writing | [Creative evidence](../../.agents/skills/evidence-writing/SKILL.md) |
| Graph configuration, narrative topology, and revision identity checks | Installed `@automovie/evidence` package and the production's config object |
| Independent reading, original-source audit, finding exchange, and whole-work review | [Narrative review](narrative-review.md) and [lifecycle](narrative-lifecycle.md) |
| Read-only audience estimation | [Estimation](../../.agents/skills/estimation/SKILL.md) |

Video replaces final prose with image, sound, performance, and editing decisions, and novel length recommendations with the production's duration and delivery promises. Korean-only selection becomes responsibility for the actual chosen language; speculative signal bans remain outside active contracts. The upstream reader-book exporter and central baseline migration commands belong to its distribution system. Generated production instructions and authored files remain editable project property, while reusable checking implementation lives in the installed package. These distribution choices remove no creative pass or its checks. Short direct entry and standalone assets follow their own explicit routes.
