# Implementation

The router that links this page names the functions and methods that answer this checklist, whether they also answer [common](common.md), and where each answers. Use evidence from its body, callees and callers. Its input and result types answer [design](design.md).

## Principled implementation

Ground the method in the problem's semantics, documented behavior, a recognized algorithm or cited practice evidence. Prevent each non-finite value at the operation that would produce it, through its denominator, an overflow bound checked before the operation or a domain bound, rather than detecting it afterwards.

State the method, why its premises hold for the actual inputs and any limits. Include relevant units, frames, timebases, invariants, precision and degeneracies.

## Clear and simple structure

Keep decisions with the responsibilities that own them. Add only layers and options current requirements use. Put behavior used by multiple consumers in one package or shared module.

State how the decomposition exposes that responsibility and why any non-obvious layer or separation is needed.

## Prohibited implementation shortcuts

Do not:

- tune a constant until one case or check passes;
- special-case a consumer, scene, fixture, expected answer, or measurement;
- replay a baked or fitted result in place of the computation it stands for;
- use a tolerance that admits a result outside the requirement;
- replace foreign methods, globals, or internals;
- add production behavior only to pass a test;
- keep a disproven assumption under wrappers, retries, or exceptions.

Take each value from the requirement, a cited source, a measurement, or a named parameter that states its origin. Contract-defined constants and paths for a real supported difference are allowed.

State any such special case or compensation present and its basis, or the violation that remains.

## Efficient algorithms

Include helper costs when choosing the most efficient correct algorithm for the supported workload. Avoid needless traversal and allocation.

State the input dimensions that drive time and space, the dominant cost, and why any full scan or rebuild is needed. Do not claim unmeasured speedups.

## Reuse equivalent work

Prepare work once and keep reads pure, so a read depends only on its inputs and holds no cache, memo or fill-on-first-read state. Where repeated reads share work, the caller prepares it once and passes the prepared form.

State what is prepared, who prepares it and when, and how each read uses only its inputs and the prepared form.

## Bound retention and release resources

For an operation that owns retained state, handles, or running tasks, hold them only as long as the owner needs, and release them on completion, failure, cancellation, and transfer.

State the owner, the acquisition and release points, and what grows the retained population and its bound, keeping handles, bytes, and tasks distinct. If no bound exists, say so.
