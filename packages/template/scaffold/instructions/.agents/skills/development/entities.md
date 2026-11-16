# Entity work

Build the subjects the commission's scenes need, each in the entity folder [source layout](source-layout.md#source) gives, under the [entities contract](../contracts/development/entities.md). Read [project context](../production/project-context.md) first, and before building a subject search the installed packages for one that already provides it, under [installed packages](reuse.md#installed-packages). A standalone asset defines its views and controls without a screenplay.

## Coarse first

A motion hint guides video diffusion, which supplies the appearance, so models stay coarse and the accuracy goes to motion, staging, timing, range and camera readability.

### People

A person is the polygon man. The installed human package prepares a canonical body from parameters taken from the cast record's body facts, the installed renderer draws that body, and the installed motion vocabulary plans on it, so the figure on screen is the body the motion was solved on. A crowd is a group of polygon men the installed motion vocabulary performs as one group, its bodies drawn from the crowd record. [Installed packages](reuse.md#installed-packages) names these packages, and their READMEs give the calls.

### Objects

What a person holds, uses, sits on, rides or fights with comes from the installed archetypes, such as a cup, a chair, a door, a horse and the cart it draws, a bow and its arrows, or a sword. Each is already a coarse form, built from the record's facts as parameters and a seed, and the installed packages move it.

An archetype declares its affordances, the places where a person meets it, such as a grip, a seat, a surface or a hinge. The installed motion vocabulary attaches an action to an affordance, so one action fits every size the object takes.

An object no archetype offers is built in the production as a coarse form and declares its affordances, and where it moves or is struck its mass and articulations, as the installed packages type them, because without them it can be drawn but not sat on, gripped or opened.

### Everything else

Every other subject is the simplest form that identifies it, such as a trunk and a crown for a tree, chosen, sized and checked under 3D modeling's [coarse forms](../3d-modeling/coarse-forms.md).

### What stays out

A fact the coarse form cannot show, such as a face, a fabric or a makeup state, is not modeled on it. It reaches a generated film through the record's canon references and the generation prompt, under [image](../image/SKILL.md) and [video](../video/SKILL.md), and a direct 3D film through a [detail](#detail) option that shows it. A 2D image can be an appearance reference or a conditioning input, never a substitute for coded motion.

## Detail

A commission may need more than identification, such as a direct 3D film. Detail is then an option of the entity, built from the same definition as the coarse form, which stays the default. Identity, dimensions, pivots, attachments, contacts and controls belong to that definition rather than to the surface, so nothing a scene relies on moves when the option changes.

Author motion, accept catalog cases and review segments on the coarse form. It shows joints and contacts plainly and captures quickly, and a defect repaired only on a detailed model stays in the coarse one.

Select the detailed form only for the delivery that commissions it, and record the choice in [project context](../production/project-context.md). Then capture the same segments at both settings and compare their proportions, pivots, contact, deformation, visibility, timing and silhouette.

[3D modeling](../3d-modeling/SKILL.md#requested-detail) owns how a detailed form is made, rigged and verified, and [direct film](../direct-film/SKILL.md) what a direct 3D film's detail adds.

## Inspection and handoff

Accept the entity alone first, in its [catalog cases](../motion/catalog-cases.md), against its settings or brief record at every view and state the scenes use. Then inspect it in its commissioned use, with its scene cameras, neighbors and motion, segment by segment under [segment review](../motion/segment-review.md).

The entity names the settings or brief facts it realizes under the [entities contract](../contracts/development/entities.md); settings never link code.
