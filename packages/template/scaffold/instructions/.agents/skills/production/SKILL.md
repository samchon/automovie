---
name: production
description: Keeps a production's scope, workflow, caches, media and assembly.
---

# Production

The request and [project context](project-context.md) decide which skills run and what completes the work.

| Read | For |
| --- | --- |
| [Production workflow](workflow.md) | Planning the path, its branches and each task's handoff |
| [Project context](project-context.md) | Establishing scope, the delivery profile, decisions and setup authority |
| [Sustained runs](sustained-runs.md) | Running, observing or resuming sustained work |
| [Stage caches](stage-caches.md) | Caching and resuming expensive stages |
| [Media records](media-records.md) | Saving media and generation requests with their records |
| [Reorganization](reorganization.md) | Reorganizing the production |
| [Assembly and handoff](assembly.md) | Assembling the film, rendering it once and handing it off |
| [Captions](captions.md) | Writing and timing a film's caption tracks |

## Commissioned outputs

| Output | Complete when |
| --- | --- |
| Screenplay | Its text passes the writing workflow; no source or media is owed |
| Standalone asset | Its views and controls pass the asset part of delivery review; no narrative is owed |
| Whole motion hint | Every main scene is programmed and the whole timeline is assembled; no generator is owed |
| Direct 3D film | The programmed film is rendered at its commissioned detail; no diffusion is owed |
| Generated film | Finished takes of the chosen video model are assembled |

The writing workflow passes a screenplay at its [completion](../story/workflow/routes.md#completion). Stills or pilot clips do not complete a whole motion hint, and the motion hint behind a generated film's takes is a separate output.

[Delivery review](../review/delivery-review.md) accepts each output. A rendered file with passing checks is reported as technical completion; the output is complete only when that review's acceptance is recorded.

## Routing

The entry file's skills table names each task's owner.
