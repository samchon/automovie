# Human development

## Development

- Ground anatomy in scientific evidence. State assumptions and uncertainty. Preserve source provenance and rights.
- Keep units, coordinates and shared boundaries consistent. Regenerate affected derivatives when their source changes.
- Develop anatomy as connected parts.
- Distinguish numerical, clinical and visual judgments. Missing or refused results remain unverified.
- Preserve the last valid state when an operation fails.

## Visual debugging

Follow [3D modeling](../3d-modeling/SKILL.md) for measurement and [viewer verification](../viewer-verification/SKILL.md) for rendered observation.

- Inspect the current final geometry through its actual consumer with a hardware renderer. Enlarge the affected region and inspect it at use distance.
- Inspect opposing views and assembled neighbors in the required states.
- Measure landmarks, distances and angles on the same geometry that renders. State units, coordinate frames and measurement uncertainty; validate quantitative readings.
- Compare the render with the engine's resolved geometry to distinguish viewer faults from engine or data faults.
- Compare before and after under matching conditions. After each correction, render again and read the output directly. Accept demonstrated effects and record unobserved results separately.

## Supervision

Audit every 30 minutes.

1. Check the goal, scope and quality criteria.
2. Compare source provenance, results and before/after views under matching conditions.
3. Check viewer ownership, PID, HTTP readiness, hardware GPU, source freshness, stale/errors, resident models and captures.
4. Find the causes of repeated symptoms, failed premises and representation limits.
5. Choose the fastest method at the same quality and full scope. Assess resources, duplicate work and waits. Parallelize independent work.
6. Check roles, skills, actor rechecks and outputs. Distinguish running work from idle workers. Respect writing and execution grants. Reassign, combine or retire owners.
7. Change strategy when premises fail or visual gains stall. Execute the change and verify its result.
8. Record audit times, missed checks, corrections and the next due time. Keep each actor's audit separate.

Keep the viewer available between audits.

If the viewer fails, pause dependent visual work, prioritize owner recovery and protect other owners' processes. Independent numerical work may continue within its resource limits.
