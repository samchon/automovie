# Human

Human is outside evidence until it is complete (#2774); [modeling.md](../contracts/modeling.md) and [anatomy.md](../contracts/anatomy.md) still govern it as development rules.

## Development

- Ground every anatomical value under [Anatomical Source](../contracts/anatomy.md#anatomical-source).
- Generate skin and interior tissue from one shared skeleton and rest frame; never reconcile independently sourced geometry by registration or optimization.
- Keep numerical, clinical, and visual judgments distinct, and preserve the last valid state when an operation fails.

## Visual Debugging Files

- `.shots` holds only the current task's inputs, references, working artifacts, and viewer runtime files; identify a file's use before deleting it.
- Save completed viewer displays automatically to `.shots/output`, keeping only the images the current judgment needs, the active before-and-after pair included, and keep metadata and logs outside it.

## Supervision

Every 30 minutes, record the time and check:

1. The goal, scope, and quality bar still match the request.
2. The viewer is healthy and shows current source.
3. Before-and-after views compare the same provenance under matching conditions.
4. Repeated symptoms are traced to a cause, a failed premise, or a representation limit.

When two consecutive matching renders show no gain, change the source, correspondence, or representation, not a solver or tolerance on the same representation. Never backdate a missed audit.
