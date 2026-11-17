---
name: motion-diffusion
description: Generates or refines body motion with a motion model hinted by the polygon man's composed performance, and traces a performer in footage into the polygon man's motion. Use when the user chooses generated or traced motion for a stretch of a performance, or when a study measures footage.
---

# Motion diffusion

A motion model fills, varies or restyles motion; it does not decide it. [Compose](../compose/composition.md) each person's actions first, so the beat's key poses, root path, contacts and timing are authored and exact, and let the model work only between and around them.

Use a model when the user chooses it for motion the vocabulary has no action for, such as a dance's flowing transitions, never for a stretch the vocabulary performs stiffly.

| Read | To |
| --- | --- |
| [Motion models](models.md) | Choose a generator or a pose estimator |
| [Hints](hints.md) | Bring the composed performance to a model, and check that the result keeps it |
| [Clips](clips.md) | Check a generated or captured clip and its licenses |
| [Tracing](tracing.md) | Trace a performer in footage into a clip, keys or a study's measurements |

Generate a stretch the user chose in these steps:

1. Choose the model with the user, and record it in [project context](../../production/project-context.md).
2. Read its documentation and licenses before anything is generated.
3. Hint it from the composed performance.
4. Freeze the result and check it as a clip.
5. [Retarget](../retargeting.md) it onto the cast member's polygon man, then run the [hint checks](hints.md#checks).
6. Accept it in the catalog as a [retargeted clip](../catalog-cases.md#what-each-case-owes).

The checks of steps 4 and 5 are that catalog case's tests.
