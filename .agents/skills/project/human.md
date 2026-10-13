# Human development

## Development

- Ground anatomical claims under the contracts skill's [Anatomical Source](../contracts/anatomy.md#anatomical-source) chapter, and cite the source of every reference.
- Keep units, coordinates and shared boundaries consistent. Regenerate affected derivatives when their source changes.
- Develop anatomy as connected parts.
- Generate skin and interior tissue from one shared skeleton and rest frame so their correspondence holds by construction. Do not reconcile independently sourced geometry through registration or optimization.
- Distinguish numerical, clinical and visual judgments. Missing or refused results remain unverified.
- Preserve the last valid state when an operation fails.

## Visual debugging

Follow [3D modeling's visual debugging procedure](../3d-modeling/SKILL.md#visual-debugging), including viewer recovery priority, the restriction on dependent work during failure, measurement and current hardware observation. Inspect the final Human consumer and its connected parts under that procedure.

## Visual debugging files

Keep `.shots` limited to the current task's required inputs, references, working artifacts and viewer runtime files. Delete unrelated and superseded folders and files after identifying their actual use.

Save completed viewer displays automatically to `.shots/output`. Keep only images needed for the current visual judgment, including the active before/after comparison, and remove every other file from that directory. Replace superseded images instead of accumulating capture histories. Store required metadata and logs outside `.shots/output`.

Resolve cleanup targets inside this checkout's `.shots` before deleting them. Keep the viewer available while cleaning its files, and preserve the inputs and runtime files it still needs.

## Supervision

Audit every 30 minutes.

1. Check the goal, scope and quality criteria.
2. Compare source provenance, results and before/after views under matching conditions.
3. Check viewer ownership, PID, HTTP readiness, hardware GPU, source freshness, stale/errors, resident models and captures.
4. Find the causes of repeated symptoms, failed premises and representation limits.
5. Choose the fastest method at the same quality and full scope. Assess resources, duplicate work and waits. Parallelize independent work.
6. Check roles, skills, actor rechecks and outputs. Distinguish running work from idle workers. Respect writing and execution grants. Reassign, combine or retire owners.
7. Change strategy when premises fail or visual gains stall. Gains stall when two consecutive renders under matching conditions show no improvement. Change the source, correspondence or representation, because a new solver, tolerance or parameterization on the same representation is not a strategy change. Execute the change before the next audit and verify its result. Record a verdict on every foundational alternative an owner proposes.
8. Record audit times, missed checks, corrections and the next due time. Keep each actor's audit separate.

Keep the viewer available between audits.

[Visual debugging](#visual-debugging) owns the work restrictions during viewer failure. Protect other owners' processes while restoring the viewer.
