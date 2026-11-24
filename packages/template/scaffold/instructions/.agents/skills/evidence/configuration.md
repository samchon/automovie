# Evidence configuration

Make `evidence.config.ts` select the work the commission has. The installed evidence package's README and types own its options, their spelling, its selectors and its annotations.

## Engineering

Keep the default engineering claims: every source declaration and test answers the shared engineering checklists of the [development contracts](../contracts/development/SKILL.md), except that scenes, films and catalog cases document their realization under the composition and films contracts instead of common.

Enable entities, behaviors and composition when their folders get the first declaration unless the route opens them later.

With composition enabled, Evidence checks for the [catalog sources, film and acceptance record](../motion/catalog-cases.md). Check playable scenes when [answering for composition](answering.md#film-composition). The director judges what the registered film plays.

## Story

Use the adopted [route](../story/workflow/routes.md#choosing-the-route) when it runs narrative passes. For [a screenplay without passes](../story/workflow/routes.md#who-writes-the-screenplay), use `narrative: { mode: "none" }` when configuring its film. With development composition enabled, code realizes the instructions as well as the screenplay. Omit `narrative` for a standalone asset.

Open the narrative stage on a finished draft. Follow the route for when to enable and disable it. A closed layer can be disabled without affecting subsequent layers.

On the short narrative route, Evidence selects research when the first study appears in `docs/research/`. On other routes, enable research when the first study is written. Complete work is the default scope; a pilot follows [scope expansion](../story/correction/repair.md#scope-expansion).

## Changing the graph

Inspect every affected population and relationship together, including those outside a pilot and the engineering claims. Closed narrative work keeps its boundary under [closed passes](../story/correction/repair.md#closed-passes).
