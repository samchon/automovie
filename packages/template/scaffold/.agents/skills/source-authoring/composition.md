# Source Composition Handbook

Arrange repeated subjects and shot definitions through one typed planning input and pure producers. [Compilation](compilation.md) owns execution and [TypeScript](typescript.md) owns module shape. Compose recurring responsibilities when a copied shot changes only its inputs; retain explicit shots where no responsibility repeats.

## Each module has one second

Keep the work inside a build proportionate to what the shot itself stages: let the engine regenerate a formation from its runtime instead of walking its members. Compute shared deterministic inputs once per execution and pass the resulting typed values to each consumer rather than repeating the same derivation inside every shot factory.

Keep the derivation executable from its declared inputs. A copied result literal can become stale when those inputs change; a source function retains that relationship without an intermediate project store. [Compilation](compilation.md) owns execution and the producer-consumer boundary.

## Every subject is a class

Use a class extending `AutoMovieSubject` for each independent subject. Read its installed declaration for constraints, callable motions, utility queries and `render(context)` contributions. A utility delegates shared arithmetic to its engine owner, and a contribution contains only that subject's work.

`design()` returns the subject's typed design value for its consumers to validate and use. Equal declared inputs produce equal values; calling the method does not require publishing or reopening a design file.

## A group of subjects is a subject

A cluster holds figures, a group holds clusters, a building holds wings and storeys, a forest holds trees, and a world holds terrain plus placed buildings. The shape is identical at every level, which is what makes a mass scene authorable: a group advancing or a repeated floor stack being raised is one call, not two thousand copied records.

Extend `AutoMovieSubjectGroup`, state `members()`, and `render` composes them for you. Override it only to add something the group owns that no member does (a banner, a shared route, a dust cue), and merge with `super.render(context)` rather than replacing what the members said.

Keep populations compact. A formation materializes its members from count, layout, anchor, facing, and seed, and the runtime represents them as bounded chunks rather than scene nodes, so a member's own `render` usually contributes nothing and the group's cue is what a shot stages. A member that rendered itself individually is the first step toward ten thousand nodes.

Buildings use the same rule without pretending they are formations. A building class emits `IAutoMovieBuiltEnvironment`; its element hierarchy carries local full TRS and reusable model ids, while its independent logical-space hierarchy carries rooms, floors, voids, boundaries, openings, and stair/lift/bridge connectivity. One such record may hold several independent building units through its `buildings` root table plus the sky-bridges that couple them, so a keep, its yawed annex, and the bridge between them are one `design()` and one `render()` rather than three subjects that have to agree. Write a repeated storey as a loop over its index: the slab, its logical space, its room, its door, and the stair up to it all derive from the same number, and the looped record must be the same artifact as the hand-expanded one. `render(context)` delegates to `lowerBuiltEnvironment(design())`, and the shot consumes that derived contribution.

Merge subject contributions through `mergeAutoMovieSubjectContributions(subjects.map(subject => subject.render(context)))`; read that public export for its complete merge contract.

The contribution keeps `set` and `spaces` alongside `models` and `builtEnvironments`. The shot places the merged `set` in its stage and calls `mergeAutoMovieSpaces` on the merged `spaces` when assembling that stage. Actors, cameras, lights, script, blocking, performance, and event samples remain the shot's assembly responsibility; a subject contribution is not a partial shot program.

The building owns its interior, exterior envelope, roof, facade attachments, exterior stairs, ladders, rails, and helipad. Surrounding ground, parks, sky, and natural water stay in the world subject. Water simulation is its own subject/domain; an interior water feature composes it with a building space instead of making fluid an architecture-only feature.

## A shot names subjects and asks them to render

A shot module imports the subjects it stages and merges what they return. When a shot restates a member's dimensions, re-derives a layout, or rebuilds a motion, the vocabulary is missing and the shot has absorbed work that belongs a layer down.

Project source may import modules under its source roots. [Compilation](compilation.md) governs deterministic execution; source admission refuses import cycles and identifies the failing linked module.

## Let the engine carry the repetition

A formation design materializes its members from count, layout, anchor, facing, and seed. Keep its runtime representation in bounded chunks rather than scene nodes. Large non-formation populations use compact instance sets the same way.

Do not expand either into per-member scene nodes or per-member curves. Author the unit's cues and let the runtime regenerate members from index and seed. Promoting a member to a named actor is for a persistent named performer with a close camera or unique prop, not for reaching individual behavior.

At compile time, inspect `context.formationRuntime[id]` for chunks, bounds, hero inventory, LOD, and phase, and regenerate a single representative through `context.engine` when you need one. Recreating layout arithmetic in source produces a second answer that will disagree with the first.

## Derive variation from declared seeds

Derive population variation from the declared design seed and member index. Evaluation order is not member identity. [Compilation](compilation.md) owns execution reproducibility.

## One factory per recurring kind of shot

A factory takes the parameters that actually differ and returns the shot definition. What repeats lives in the factory; what varies lives in the table that calls it.

Name factories for what the shot _is_, not for what it looks like: a factory named for an action reads at the call site, and one named for a camera move hides the beat behind the lens. Keep them honest about what they cannot know. A factory that supplies a default predicate, a default event time, or a default acceptance criterion produces shots that satisfy their contract and prove nothing, which is worse than a shot that fails to compile.

Follow [TypeScript](typescript.md#module-shape) for cohesive module responsibilities and source-size boundaries.

## Derive the design value from the same table

`IAutoMovieDefinedShotContract` is the shot contract minus `id` and `source`. When a consumer needs the complete `IAutoMovieShotContract`, derive that typed value from the same planning input instead of transcribing its fields into a second authority.

Keep the plan and derivation in their source owner. Pass the returned value directly to the selected public consumer, and use that same producer for execution and measurements. [Ownership](ownership.md) governs the authored input and output boundary; a record-shaped value is not an instruction to serialize it into a file.

Derive the complete contract by adding the planned `id` and static `source: { module, export }` binding to the same `IAutoMovieDefinedShotContract` value.

A shot's source binding names a module path and a static export. Keep those export identities explicit while sharing the pure factory and typed planning table; repeated shots do not require a code-generation script or generated source tree.

## Assemble the edit from the same table

The film's shot order is data the table already holds. Build the edit by walking it rather than by listing placements by hand, and a reordered sequence stays one edit instead of a renumbering.

Placement timing, transitions, and edge states still belong to the edit's own rules. Deriving the order does not license deriving a continuity claim: an edge state asserts a measured fact about two specific shots, and a factory cannot know it.

## Reuse techniques, not content

Read the public package APIs and the design branch that owns the current problem. Derive repetition, surface allocation, quantities, placement, and phase changes from the production's reviewed inputs. A shared concern has one source owner; a complete visual surface is not split merely to distribute files.

Create production modules only when their active branch needs real implementation. A familiar example may suggest a technique, but its dimensions, layout, assets, identities, and content are not production authority.
