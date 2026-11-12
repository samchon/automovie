---
name: motion
description: Programs deterministic scene performance, staging, camera, timing and physical responses by end-effector goals, composing the installed motion vocabulary and writing a law only for what is not a person. Use when composing or authoring actions, interactions, consequences or scene composition, accepting catalog cases, reviewing segments, or rendering a motion hint and its control channels.
---

# Programmed motion

Realize the screenplay's performance through code. Read [project context](../production/project-context.md), the final screenplay and its [research](../story/planning/research.md) first. A single moving instance needs only its promised behavior; a whole-video commission needs its complete progression.

Work in this order, because each step can only use what the one before settled:

1. Study the laws and measurements the scenes need that no study holds yet, under [research](../story/planning/research.md#when-to-study).
2. Start from the coarse entities [entity work](../development/entities.md#coarse-first) builds.
3. [Compose](#compose-the-vocabulary) each person's performance from the installed motion vocabulary.
4. [Extend](extend.md) only for what composing cannot stage.
5. Accept every entity and motion module in its [catalog cases](catalog-cases.md).
6. [Compose the film](#compose-the-film) segment by segment.
7. Deliver a commissioned [detail option](../development/entities.md#detail) last.

## Compose the vocabulary {#compose-the-vocabulary}

A person's act is composed from the installed motion vocabulary, as its README and public types give it. The package owns its actions with their studies and checks, so motion code for a person written in the production duplicates that work without its checks, and the vocabulary cannot perform it.

| Task | Read |
| --- | --- |
| Turn a beat into a composition | [Compose](compose.md) |
| The vocabulary refuses a composition | [Refusals](refusals.md) |
| A beat needs a movement the vocabulary seems to lack, or what is not a person | [Extend](extend.md) |

[Source layout](../development/source-layout.md#how-the-parts-work-together) says how a cast entity's capabilities carry those actions into a scene.

When a vocabulary action misbehaves in a case, hand the user the case and its numbers under [installed packages](../development/reuse.md#installed-packages) rather than patching it in the production.

## Compose the film {#compose-the-film}

Compose the film from accepted cases through their entity API and the screenplay alone, one short contiguous segment scene by scene under [staging](staging.md) and [frame evaluation](frame-evaluation.md). Pass [segment review](segment-review.md) before extending from a segment's accepted ending.

A defect the film shows in a body, contact or behavior goes back to its module and its case, as the [composition contract](../contracts/development/composition.md#composition-only) requires.

## Other resources

Use [retargeting](retargeting.md) for external clips or changed rigs. Render the motion hint and its [control channels](control-channels.md) from the accepted performance, and hand scene output and its timing to [assembly](../production/assembly.md).