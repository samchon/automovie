---
name: human
description: Defines the anatomy rules, visual debugging files, and supervision for automovie's human package and its viewer and playground surfaces. Use with the 3d-modeling skill before working on packages/human, a human figure, or the Human inspection application.
---

# Human

Human is outside evidence until it is complete (#2774); these rules govern it meanwhile, beside the [3d-modeling skill](../3d-modeling/SKILL.md).

## Anatomy

- Ground each anatomical value in a primary measurement, a dissection study, or an established physiological account, with its quantity, protocol, population, and conditions, and mark it measured, derived, population-fitted, or conventional. Cite only a source you read.
- Extending a value beyond the population, site, direction, or state it was measured at is a new inference that needs its own grounds and a geometry check. Photographs and generated images guide shape comparison but supply no hidden-tissue measurement.
- Keep raw observations, normalized indices, and authored targets separate; clinical motion capacity and requested performance are distinct quantities.
- Admit only values and combinations a living body can take, deriving each dependent bound from the structure that limits it. Reject an impossible state with its cause and leave the caller's values unchanged.
- A public input is a named measurement, a named physiological motion, or a closed-set choice, never a vertex, curve, strand, or patch, and each conversion between simple and detailed inputs is deterministic.
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
