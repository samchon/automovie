# Generation

Generation submits each planned [request](requests.md), inspects its takes and chooses one. Read the provider and setup authority in [project context](../production/project-context.md) and use the selected service's existing connector, CLI or API.

## First path

Before a batch, prove one representative request end to end on a case with the intended performance, contacts and identity continuity: the input, the generation, the download, and stills extracted from the downloaded file. Fix input or integration causes before multiplying them.

## Submission

Bind each request to its exact input bytes and source revision and record it under [media records](../production/media-records.md#records). Check the existing job state before retrying, since a retry can bill another job, and keep to the adopted cost and quality limits. A transient URL, seed or finished job is not a take: keep the downloaded original apart from its derivatives.

Hosted models screen prompts and inputs for violence, weapons, blood, real people and minors, and some [bill a refused job and suspend accounts that repeat them](https://docs.dev.runwayml.com/api-details/moderation/). Read the provider's usage policy before submitting a fight or a stunt, and write its action as movement and impact, as the screenplay does. Report a beat that is still refused to the user, who may choose another provider or an open model.

## Inspection and choice

Generate the takes per request that [project context](../production/project-context.md) records, and choose among them before rewriting a prompt, because takes of one request differ and a choice costs less than another round of wording. Where the model offers a draft tier or several outputs per job, choose among cheap drafts first, then make the final from the chosen draft by the model's documented draft-to-final path.

Extract stills from the take's file at the spacing [capture](../visual-debugging/capture.md#times) sets and check identity, positions, contacts, camera and motion against the hint's stills at matched times under [comparison](../visual-debugging/comparison.md), first the contacts and outcomes its beats decide. Choose among takes for fidelity to the screenplay beat and the hint, never for an effect the screenplay did not decide. Leave a take's sound and continuous motion to the user, as [what you can observe](../../../AGENTS.md#what-you-can-observe) sets.

A take that loses action, identity or causality is repaired at the source, the request or the selection, never hidden by a cut; a local flaw in an otherwise right take is repaired under [finishing](finishing.md#partial-repair). A framing the takes keep losing is repaired at the hint's camera under [staging](../motion/staging.md), within the screenplay's camera entry, because a take follows the hint's framing more closely than the prompt's words. When motion or camera drifts, regenerate with a stricter adherence or a shorter request rather than a longer prompt.

## Placement in time

Map a take's decoded timestamps and time base into the film; a nominal frame rate cannot place an action, especially at variable rates. Trimming, retiming and rebasing are different operations, which [FFmpeg's filters](https://ffmpeg.org/ffmpeg-filters.html) document, and a shortest-stream option or silent padding must not hide lost material.

Where an extension returns its input joined to the new part, place only the new part; an edit can return slightly shorter than its input, so measure it. A new take, trim or speed change requires rechecking its timing against its neighbors.

## Handoff

Finish the accepted takes under [finishing](finishing.md), measure their actual timing and hand them with their source relationships and limits to [assembly](../production/assembly.md).
