---
name: motion
description: Programs deterministic scene performance, staging, camera, timing and physical responses by end-effector goals, composing the installed motion vocabulary and writing a law only for what it lacks. Use when composing or authoring actions, interactions, consequences or scene composition, accepting catalog cases, reviewing segments, or rendering a motion hint and its control channels.
---

# Programmed motion

Realize the screenplay's performance through code. Read [project context](../production/project-context.md), the final screenplay and its [research](../story/planning/research.md) first. A single moving instance needs only its promised behavior; a whole-video commission needs its complete progression.

Work in this order, because each step can only use what the one before settled:

1. Confirm the [research](../story/planning/research.md) for every practice, crowd conduct and camera style the scenes show.
2. Start from the coarse entities [entity work](../development/entities.md#coarse-first) builds.
3. [Compose](#compose-the-vocabulary) each person's performance from the installed motion vocabulary.
4. [Write a production law](#write-a-production-law) only for what the vocabulary lacks.
5. Accept every entity and motion module in its [catalog cases](catalog-cases.md).
6. [Compose the film](#compose-the-film) segment by segment.
7. Deliver a commissioned [detail option](../development/entities.md#detail) last.

## Compose the vocabulary {#compose-the-vocabulary}

Compose each person's performance from the installed motion vocabulary, as its README and public types give it. The package owns its actions with their studies and checks, so a second implementation in the production duplicates that work without its checks. [Source layout](../development/source-layout.md#how-the-parts-work-together) says how a cast entity's capabilities carry those actions into a scene.

When a vocabulary action misbehaves in a case, hand the user the case and its numbers under [installed packages](../development/reuse.md#installed-packages) rather than patching it in the production.

## Write a production law {#write-a-production-law}

Write a law only for an action the vocabulary lacks and for what is not a person, such as an animal, a vehicle, a crowd moving as a mass, a camera or a light.

Confirm its [research](../story/planning/research.md) study first, because a law written without one invents the practice. Design it under the [shared motion rules](#shared-motion-rules), answer the [behaviors contract](../contracts/development/behaviors.md), and unit-test it against its study's values through [testing](../development/testing.md). Contact and reactions use the installed engine through [physical feedback](physical-feedback.md).

## Compose the film {#compose-the-film}

Compose the film from accepted cases through their entity API and the screenplay alone, one short contiguous segment scene by scene under [staging](staging.md) and [frame evaluation](frame-evaluation.md). Pass [segment review](segment-review.md) before extending from a segment's accepted ending.

A defect the film shows in a body, contact or behavior goes back to its module and its case, as the [composition contract](../contracts/development/composition.md#composition-only) requires.

## Shared motion rules {#shared-motion-rules}

Author every body movement, composed or written, as [end-effector goals](authoring.md) on targets, never as coordinates or tuned joint angles: a fist on the opponent's struck region, each foot on the floor at its step, both hands on a prop's grip, the hips on a seat or mount. The other rules build on that one:

| Rule | Read when |
| --- | --- |
| [Laws](laws.md) | Designing an action: its plan, entry state, events, outcome and time scale |
| [Variation](variation.md) | A performance differs by parameters, skill or seed |
| [Transitions](transitions.md) | A performance changes action or target mid-motion |
| [Contacts](contacts.md) | It plants, sits, grips, hands over or touches another body |
| [Layers](layers.md) | Gaze, breathing or another layer runs over the action |
| [Verification](verification.md) | A case needs its bounded checks and frame review |

## Other resources

Use [retargeting](retargeting.md) for external clips or changed rigs and [method references](method-references.md) when choosing an algorithm for a production law. Render the motion hint and its [control channels](control-channels.md) from the accepted performance, and hand scene output and its timing to [assembly](../production/assembly.md).
