# Entities

Each exported declaration under `src/entities/` answers these items in its doc comment, beside [common](common.md), [design](design.md) and [implementation](implementation.md). An entity is one cast member, crowd, prop, set, camera or light.

For a short's screenplay decision, cite its scene file and anchor. With no narrative pass, name the screenplay or instruction section and tag each instruction as `@evidence docs/instructions/<topic>.md#<anchor> <how>`.

## Settings realization

Does the entity realize the cited facts and measurements and stay identifiable and on-model in every required view and state, on coarse and commissioned detailed forms?

### Facts and instances

For a cast member, crowd, prop or set, cite its [subject file](../../story/document-layout.md#canon-records) once on the production entity type, including when it uses a shared class or installed motion. State what it realizes, for example `@evidence docs/body/brief/props/ball.md The ball uses the brief's red panels.` For a record outside the filmed scope, give the reason with `@evidenceExclude`.

Identify a scene-only instance by its scene section and local name. Show where the cited facts are realized, including appearance that needs the commissioned detail option. When several instances share a model, preserve their distinct positions, holders and histories across cuts and detail settings.

Derive a cast body from its record and an incidental body from the standing state. Without a cast layer, use the commissioned appearance, screenplay or asset instructions. Use the same prepared body for the polygon man and its motion.

### Measurements and decisions

Keep law, action and archetype parameters within their owner's range. Source measurements to a [study](../../story/planning/research.md#when-to-study) section or a sourced package value. Derive placement, weights, texture coordinates and measurements from the generating definition so detail changes preserve them.

Keep durable choices at their owner. Cite a [short's scene decisions](../../story/layers/brief.md#what-it-holds) by file and anchor. A direct screenplay owns story choices. Instructions own [implementation choices for a fixed screenplay](../../story/correction/repair.md#concretization) and standalone asset decisions.

In [source comments](../../development/modules.md#documenting-source), trace entity and capability choices to the record fact, study section or decision.

## Object shape

Is the entity immutable and constructed from its subject's facts? Do its capabilities express actions and targets, leaving contact alignment to motion and outcomes to scenes?

Compose the class from small fragments, cited facts and immutable configuration. Use `readonly` fields and keep other entities outside its imports.

A capability returns an immutable action and target. The vocabulary resolves poses, offsets and contact times within the chosen action. People and crowds use vocabulary compositions and [registered laws](../../motion/laws/SKILL.md), or a commissioned or user-chosen clip after [retargeting](../../motion/retargeting.md).

Resolve equipment, fatigue and habits into explicit schedule snapshots. Connect a habit's trigger and response as its fact describes, at a timing supported by its research.

## Controls and source

Does one module provide the subject's controls and variants, generate coarse and commissioned detailed forms from one definition, and rebuild from fixed inputs?

Expose the controls the scenes need. Generate the default coarse form and commissioned detail from one definition, parameterized by variant or seed. Give the detailed form the deformations its actions require. Declare the [affordances](../../development/entities.md#objects) used when a person holds, operates, sits on or rides the object.

Trace an installed producer's actual output and connection frames through drawing and interaction. Rebuild from fixed inputs with usage rights. For adopted assets, name the channels and deformations that conversion and runtime preserve.
