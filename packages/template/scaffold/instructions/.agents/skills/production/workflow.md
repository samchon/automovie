# Production workflow

The order of a production's tasks, and what each hands to the next.

## Handoffs

For a finished film, the tasks connect like this:

```mermaid
flowchart LR
    request[Request] --> story[Story]
    story --> motion[Motion]
    story --> image[Image when needed]
    motion --> video[Video: direct rendering or generation]
    image --> video
    video --> assembly[Assembly]
    assembly --> delivery[Delivery review]
```

| Task | Receives | Hands on |
| --- | --- | --- |
| [Story](../story/SKILL.md) | The request and adopted facts | The screenplay |
| [Motion](../motion/SKILL.md) | The screenplay and simple 3D subjects | The motion hint |
| [Image](../image/SKILL.md) | Subject facts and the adopted look | Appearance references and shot frames |
| [Video](../video/SKILL.md) | The screenplay, the reviewed hint, images and audio | The final picture |
| [Assembly](assembly.md) | Programmed scenes or finished takes, sound and captions | The complete video |

The screenplay states what the audience sees and hears: events, lines, cuts and sound. The motion hint is the performed action, staging, camera and timing, on [simple 3D subjects](../development/entities.md#coarse-first).

Accept the performance on polygon people and coarse objects. Video then finishes the picture, by direct rendering that selects commissioned [entity detail options](../development/entities.md#detail) or by generation that uses images and prompts to give the hint its look. The final picture is directly rendered scenes or accepted generated clips, called takes.

Image can develop alongside motion, but a shot frame needs its motion-hint frame first.

Commissioned sound comes from [audio](../audio/SKILL.md).

## Order by output

The commissioned output selects the steps and where they end.

### Screenplay

1. Record the commission in [project context](project-context.md).
2. Write the screenplay along its [story route](../story/workflow/SKILL.md).
3. Pass [delivery review](../review/delivery-review.md).

A short runs [brief](../story/layers/brief.md#what-it-holds) (shared subject facts) → screenplay. Long work develops settings → treatments → scripts → screenplay: world facts, events, performed scenes, then the final audiovisual plan.

### Whole motion hint

1. Record the commission in [project context](project-context.md).
2. Write the screenplay along its [story route](../story/workflow/SKILL.md).
3. Program the film in the [order](../motion/SKILL.md#order) motion sets.
4. Assemble the whole timeline under [assembly](assembly.md).
5. Pass [delivery review](../review/delivery-review.md).

On the short route, step 3 runs inside the route as a programmed film draft, before its narrative review.

### Direct 3D film

The whole motion hint's steps, with the film finished under [direct rendering](../video/direct-film.md) before assembly.

### Generated film

Run the whole motion hint's steps through step 3, then the [generated film](../video/generated-film.md) steps once its [prerequisites](../video/generated-film.md#prerequisites) are met. Assembly and delivery review follow on the finished takes.

Choose the video model with the user under [video diffusion](../video/diffusion/SKILL.md) before preparing any image or rendering any input for it, because the inputs it accepts determine what to make.

### Standalone asset

An asset has no story or film. It runs its own task and ends at [asset review](../review/delivery-review.md#assets).
