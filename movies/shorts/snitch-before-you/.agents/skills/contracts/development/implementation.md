# Implementation

Each exported function and class method answers every item in its doc comment with grounds a reviewer can check against its body, callees and callers, as well as the [common](common.md) item. The types it accepts and returns answer [design](design.md). Keep simple decisions brief, and invent no alternatives or history.

## Principled Implementation

Use a method the problem's semantics justify: a language idiom, documented API behavior, a recognized algorithm, or a cited physical principle, measurement or study of the real practice being reproduced, not precedent, popularity or what made one case look right.

State the method, the premises it relies on, why they hold for the inputs it actually receives, and any unresolved limitation. Premises include units, coordinate frames and timebases, what a transformation must leave unchanged, and a numeric method's precision and degeneracies.

## Clear and Simple Structure

Use the simplest decomposition that serves current requirements, with no layer, option, or abstraction for presumed future needs. A behavior several consumers already use is a current need: it lives once with its owner, an installed package or one shared module, and is imported rather than copied. Keep each decision with the responsibility that owns it.

State how the decomposition exposes that responsibility and why any non-obvious layer or separation is needed.

## Prohibited Implementation Shortcuts

Do not:

- tune a constant until one case or check passes;
- special-case a consumer, scene, fixture, expected answer, or measurement;
- replay a baked or fitted result in place of the computation it stands for;
- accept a tolerance that hides a missed requirement, such as a gap counted as contact;
- replace foreign methods, globals, or internals;
- add production behavior only to pass a test;
- keep a disproven assumption under wrappers, retries, or exceptions.

Take each value from the requirement, a cited source, a measurement, or a named parameter that states its origin. Contract-defined constants and paths for a real supported difference are allowed.

State any such special case or compensation present and its basis, or the violation that remains.

## Efficient algorithms

Judge the owning operation together with its helpers; moving work to another layer does not remove its cost. For a function that chooses an algorithm, data structure, or processing strategy, use the most efficient correct one for the supported workload, without needless traversal or allocation.

State the input dimensions that drive time and space, the dominant cost, and why any full scan or rebuild is needed. Do not claim unmeasured speedups.

## Reuse equivalent work

For an operation that coordinates work across requests, phases, or consumers, reuse completed or in-flight results whenever the contract permits. A matching key or a quiet watcher alone does not prove equivalence, and effectful work is not shared just because its results match.

State what is shared, which inputs, dependencies, and effects decide equivalence, and how identity and invalidation keep it valid.

## Bound retention and release resources

For an operation that owns retained state, handles, or running tasks, hold them only as long as the owner needs, and release them on completion, failure, cancellation, and transfer.

State the owner, the acquisition and release points, and what grows the retained population and its bound, keeping handles, bytes, and tasks distinct. If no bound exists, say so.
