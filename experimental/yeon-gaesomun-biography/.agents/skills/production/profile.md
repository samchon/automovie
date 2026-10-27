# Maintain project context

The project-root [PROJECT.md](../../../PROJECT.md) owns the current project overview, commissioned scope, adopted choices and constraints. Read it when starting or resuming work, and before choosing a workflow. Update it when a consequential choice is adopted or changed, before downstream work relies on that choice. Keep one concise current account; Git preserves superseded choices. This file is shared project context, so write for the user and the next agent rather than a particular session.

## What to record

Record what the current project actually needs. An instance-only request need not define a story or soundtrack; a screenplay-only request need not choose a renderer or generation provider. Leave an undecided nonblocking choice explicit and continue work that does not depend on it. Do not manufacture a complete questionnaire or empty category tree.

| Topic | Record when relevant |
| --- | --- |
| Overview and intended result | What is being made, for whom, and the intended use or experience, briefly enough to establish the project's direction. Link to detailed creative owners. |
| Commissioned scope | The promised output and its boundary: an asset or instance, a screenplay, a complete motion-video hint, a finished direct 3D video, or a finished video through a chosen generation workflow. Record an authorized slice, deferred work and exclusions so another session does not expand or shrink the commission. |
| Adopted approach | Programmed motion and staging, representation and selective detail options, required identity or object controls, relevant engine or physical feedback, and necessary sound. Record the reason and limits where they affect later choices; read installed APIs before claiming a control exists. |
| Tools and operating constraints | Chosen API providers or local tools, runtime and output requirements, hardware, performance, time, cost and rights limits, and setup authority. Identify any approved environment location, dependencies or downloads needed for the selected setup, without secrets. |
| Authority and unresolved choices | Which choices the user fixed, which the agent made within delegation and why, what remains delegated, and what is still unresolved. Record missing authority only where it actually blocks the proposed action. |

## How it controls the work

Use the profile's adopted scope to select the relevant skills and their completion criteria. A whole motion-video hint requires coded performance and staging for its main scenes and assembly of the entire timeline; supporting stills and isolated clips cannot establish that commission. A requested direct 3D film remains a valid route and receives its commissioned visual and sound quality. Newly authored 3D instances start with low-cost form and control verification, including performance when animated, before selected detail upgrades through code options. [Motion](../motion/SKILL.md) owns that process and [3D modeling](../3d-modeling/SKILL.md) owns the asset representations; apply them within the user's actual request.

Treat an adopted user decision as fixed within its stated scope. Routine decisions within delegation can be made and recorded without another permission round; an existing setup approval remains sufficient within its bounds. A proposal or inference is not an adopted user choice. When the user changes direction, update the current profile and affected owners together, preserving completed narrative proof under [upstream repair](../screenwriting/repair.md). Unresolved choices do not silently become defaults.

## Keep each fact with its owner

Creative instructions stay in `docs/instructions`; canon, events and screenplay text stay with their narrative layers. Keep progress, findings, evidence and review outcomes in their existing records. Link to those owners rather than reproducing them in PROJECT.md. The profile states the adopted project; a checklist or a recorded preference alone proves no execution or approval.

Executable configuration and source own implementation. The project README holds actual setup and run commands; `.env.example` holds required variable names and nonsecret examples; a Git-ignored `.env` holds secrets. Create provider-specific files after selecting the provider, use its existing connector, API or CLI, and add an adapter only where needed, for example under `src/integrations`. Document how the actual host loads configuration; a `.env` file supplies no loader. Installed APIs own syntax and capabilities. Use [development](../development/SKILL.md) for integrations and [audio](../audio/SKILL.md) for sound and approved local setup.
