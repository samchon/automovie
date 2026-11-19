# Entities

Each exported declaration under `src/entities/` answers these items in its doc comment, beside [common](common.md), [design](design.md) and [implementation](implementation.md). An entity is one cast member, crowd, prop, set, camera or light.

Its settings realization answer names each fact it realizes as `docs/body/settings/<domain>/<subject>.md#<fact>` or `docs/body/brief/<domain>/<subject>.md#<fact>`, and each measurement's study as `docs/research/<discipline>/<topic>.md` with the section it uses.

For a short's screenplay decision, cite its scene file and anchor. With no narrative pass, name the screenplay or instruction section and tag each instruction as `@evidence docs/instructions/<topic>.md#<anchor> <how>`.

## Settings realization

Does the entity realize the cited facts and measurements and stay identifiable and on-model in every required view and state, on coarse and commissioned detailed forms?

- Cite the subject record and its facts, or the scene section and local name for a scene-only instance. When placing instances of the same model, preserve their separate positions, holders and histories across cuts and detail settings.
- Show where each fact is realized, including any appearance that needs the commissioned detail option.
- Derive the cast body from its record and an incidental body from the standing state. Without a cast layer, use the commissioned appearance, screenplay or asset instructions. Use the same prepared body for the polygon man and its motion.
- Keep law, action and archetype parameters within their owner's range. Source measurements to a [study](../../story/planning/research.md#when-to-study) section or sourced package value. Derive placement, weights, texture coordinates and measurements from the generating definition so detail changes preserve them.
- Keep durable choices at their owner. Cite a [short's scene decisions](../../story/layers/brief.md#what-it-holds) by file and anchor. A direct screenplay owns story choices. The instructions own [implementation choices for a fixed screenplay](../../story/correction/repair.md#concretization) and standalone asset decisions.

## Object shape

Is the entity immutable and constructed from its subject's facts? Do its capabilities express actions and targets, leaving contact alignment to motion and outcomes to scenes?

- Compose a class from small fragments, cited facts and immutable configuration. Use `readonly` fields and keep other entities outside its imports.
- A capability returns an immutable action and target. The vocabulary resolves poses, offsets and contact times within the chosen action. For skilled performance, cite the observation behind its cue or pace wherever the capability chooses it. People and crowds use vocabulary compositions and [registered extensions](../../motion/laws/extension.md), or a commissioned or user-chosen clip after [retargeting](../../motion/retargeting.md).
- Resolve equipment, fatigue and habits into explicit schedule snapshots. A habit connects the trigger and response its fact describes at a timing its research supports.

## Controls and source

Does one module provide the subject's controls and variants, generate coarse and commissioned detailed forms from one definition, and rebuild from fixed inputs?

- Expose the controls the scenes need. Produce the default coarse form and commissioned detail from one definition, parameterized by variant or seed. Give a detail option the deformations its actions require.
- Trace an installed producer's actual output and connection frames through drawing and interaction. Rebuild from fixed inputs with usage rights. For adopted assets, name the channels and deformations preserved by conversion and runtime.
- Declare the [affordances](../../development/entities.md#objects) used when a person holds, operates, sits on or rides an object.
