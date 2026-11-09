<!--
@evidence shared/discovery/common.md#shared-work-boundary The inspected instructions, research and settings yield the requirements listed under "Findings and owners"; each is assigned to an existing owner, so no work-specific contract is adopted, and the language risks are listed with their owners.
@evidence shared/discovery/common.md#canonical-realization Every adopted requirement is located at its canonical owner as listed under "Canonical owners"; none lives only in status notes, selectors or repeated guidance.
@evidence shared/discovery/common.md#production-coverage The after-research and after-settings checkpoints are recorded under "Production coverage" with each element kind's source owner, research basis and question; the before-composition and after-delivery checkpoints remain open.
@evidence shared/discovery/settings.md#instructions-and-backcast "Instruction inventory and backcast" breaks every instruction H2 into its elements, names each element's settings owner, and records the facts the planned screenplays would otherwise invent.
@evidence shared/discovery/settings.md#settings-form "Observed settings form" states the positive choices the settings body uses to mark owners, order facts, separate evidence from invention and route readers.
-->

# Discovery results

The inspected scope: `docs/instructions/` (commission, motion, direction), `PROJECT.md`, the six studies and index under `docs/research/`, and every settings file under `docs/body/settings/`, at the settings construction stage of the `short-with-settings` route. Screenplays, source and delivered media do not exist yet; the checkpoints that need them stay open.

## Findings and owners

Each finding changes what may honestly be created or omitted; all have an existing owner, so no `docs/contracts/work` question is adopted.

| Finding | Observable application and failure | Owner |
| --- | --- | --- |
| Every interaction is authored as effectors brought to targets | A beat whose action names no effector and target, or code that keys joint angles where a contact defines the pose, fails | [Motion instruction](../../../instructions/motion.md#effectors-to-targets); [effector-targeting study](../../../research/motion/effector-targeting.md); behaviour code under the development contract `contracts/development/behaviors.md#relational-goals`, which already asks behaviours to aim at the counterpart's actual region rather than coordinates |
| Contacts must read at 720 × 1280 | A contact hidden, cut away from or floating short of its target fails | The [seen-contacts choice](../../../instructions/direction.md#seen-contacts-and-pace); measurable targets in the [effector-targeting study](../../../research/motion/effector-targeting.md#measurable-targets); framing shapes in [vertical look](../../../body/settings/cinematography/vertical-look.md#inserts); acceptance under delivery review |
| Rescues must be physically possible | A rescue staged from too far away or too late, or a falling body caught at arm's length, fails | [The edge](../../../body/settings/world/practice-duelling.md#edge), [saving a rider in the air](../../../body/settings/world/quidditch.md#air-rescue), the [wrist-grip](../../../research/duel/practice-duelling.md#wrist-grip) and [falling-rider](../../../research/flight/broom-riding-and-snitch-catch.md#reaching-a-falling-rider) laws |
| Bare bodies carry identity | Two figures that cannot be told apart on the hint fail | Recognition facts in each cast record (`#recognition`) and `#on-the-hint` facts in each prop record |
| No carry-over between films | A film that relies on another's event fails | [Baseline reset](../../../body/settings/world/four-films.md#baseline-reset) and each record's state-change facet |
| Silent hints | Any produced audio, or a screenplay sound layer other than dialogue text, fails | [Sound palette](../../../body/settings/sound/palette.md) |
| A rescue must be possible by hand alone | A fall stopped by a spell would contradict the premises' rescue by grip and by broom | [Magic limits](../../../body/settings/world/magic.md#limits) and [no wands in play](../../../body/settings/world/quidditch.md#no-wands) |

### Language

Inspected: the commission's English requirement, names and titles, units and spelling.

- Register: British Hogwarts students' English; Carina's slightly formal register and Harry's informal one are owned by their cast `#lexicon` facts.
- Names and titles: "Madam Hooch", "Carina Malfoy", "Harry Potter", spell names in italics with their English charm names, owned by the records that introduce them.
- Units: metric throughout; canon imperial values (wand inches, the pitch's feet) appear once with their metric conversion at their owner ([wands](../../../body/settings/props/wands.md), [pitch](../../../body/settings/sets/quidditch-pitch.md)).
- Spelling: British spelling in creative bodies and research prose ("colour", "metres", "behaviour"); code identifiers keep their package spelling.
- Dates: the in-world year is never shown; ages are stated in years.

## Canonical owners

| Requirement | Canonical owner |
| --- | --- |
| Film names, premises, duration, raster, representation, silence, language, canon boundary | [Commission](../../../instructions/commission.md) |
| Motion method | [Motion](../../../instructions/motion.md) |
| Carina's canon placement, period, tone, baseline relationship | [Direction](../../../instructions/direction.md) |
| Output files, exclusions, tools, authority | [PROJECT.md](../../../../PROJECT.md) |
| World facts, people, places, objects, look, sound | The settings files under `docs/body/settings/` |

The bridging claims in `evidence.config.ts` select the settings files for the shared questions; they add no requirement.

## Production coverage

| Checkpoint | Element kinds found | Source owner | Research basis | Question |
| --- | --- | --- | --- | --- |
| After research | Human figures and their contacts | `src/entities` (figures), `src/interactions` (contacts) | Effector targeting; teen movement | `contracts/development/entities.md`, `behaviors.md` |
| After research | Walking, reaching, handover, sitting, bending | `src/laws` | Teen movement | `behaviors.md` |
| After research | Duel stance, cast, shield, footwork, grips | `src/interactions` | Practice duelling | `behaviors.md` |
| After research | Riding astride and pillion, Snitch catch | `src/interactions` | Broom riding | `behaviors.md` |
| After settings | Spell jets and shields, crane flight, Snitch flight, broom flight and broken-tail spiral | `src/consequences` and `src/laws` | Magic and Quidditch settings (canon adopted), riding study | `behaviors.md` |
| After settings | Sets and props as coarse geometry | `src/entities` | Settings records | `entities.md` |
| After settings | Cameras and framing | `src/composition` | Vertical short coverage | `contracts/development/composition.md` |

No element kind found lacks a source folder, a research basis or a question. The checkpoints before composition and after delivery review are open until those stages run.

## Instruction inventory and backcast

| Instruction | Elements | Settings owners |
| --- | --- | --- |
| [Four films](../../../instructions/commission.md#four-films) | Four names, two fifteen-year-old leads | [Release units](../../../body/settings/world/four-films.md#release-units); both cast `#name-age-house` |
| [Shared world](../../../instructions/commission.md#shared-world) | One cast, world, props, library; baseline reset | [Baseline reset](../../../body/settings/world/four-films.md#baseline-reset); state-change facets |
| [look-at-me-duel](../../../instructions/commission.md#look-at-me-duel) | Private, practice, recurring wrist grip, rescue | [Practice duelling](../../../body/settings/world/practice-duelling.md); [duelling room](../../../body/settings/sets/duelling-room.md); Carina's [coaching](../../../body/settings/cast/carina-malfoy.md#coaching); Harry's [blind retreat](../../../body/settings/cast/harry-potter.md#retreats-blind) |
| [paper-crane-invitation](../../../instructions/commission.md#paper-crane-invitation) | Crane invitation to tea, retrieval, shared hold, bench | [Paper crane](../../../body/settings/props/paper-crane.md); [paper flight](../../../body/settings/world/magic.md#paper-flight); [bench](../../../body/settings/sets/clock-tower-courtyard.md#bench) |
| [snitch-before-you](../../../instructions/commission.md#snitch-before-you) | Fourteen riders, practice, near catch, rescue, tandem flight | [Quidditch](../../../body/settings/world/quidditch.md); [riders](../../../body/settings/crowds/quidditch-riders.md); [Hooch](../../../body/settings/cast/rolanda-hooch.md); [brooms](../../../body/settings/props/broomsticks.md); [balls](../../../body/settings/props/quidditch-balls.md); [pitch](../../../body/settings/sets/quidditch-pitch.md) |
| [three-oclock](../../../instructions/commission.md#three-oclock) | Invitation out, repeated walk, note offered and withdrawn, simultaneous bend | [Folded note](../../../body/settings/props/folded-note.md); [Charms corridor](../../../body/settings/sets/charms-corridor.md) and its [corridor walk](../../../body/settings/sets/charms-corridor.md#corridor-walk); Harry [at the window](../../../body/settings/cast/harry-potter.md#window); Carina's [half step](../../../body/settings/cast/carina-malfoy.md#half-step) |
| [Vertical sixty seconds](../../../instructions/commission.md#vertical-sixty-seconds) | 9:16, 60 s, 24 fps | [Vertical look](../../../body/settings/cinematography/vertical-look.md); [release units](../../../body/settings/world/four-films.md#release-units) |
| [Bare bodies](../../../instructions/commission.md#bare-bodies) | Figures carry pose only; appearance for later | [Bare bodies](../../../body/settings/world/four-films.md#bare-bodies); cast `#appearance` and `#recognition` |
| [Silent hints](../../../instructions/commission.md#silent-hints) | No audio | [Sound palette](../../../body/settings/sound/palette.md) |
| [English](../../../instructions/commission.md#english) | British English speech | Cast `#lexicon` facts |
| [Canon boundary](../../../instructions/commission.md#canon-boundary) | Canon adopted, not checked; no adaptation | [Canon frame](../../../body/settings/world/four-films.md#canon-frame) |
| [Motion](../../../instructions/motion.md#effectors-to-targets) | Effectors to targets | Cast `#contact-style`, prop `#handling` facets |
| [Direction](../../../instructions/direction.md) | Carina's place, quiet autumn, tone, seen contacts and pace, baseline | [Carina's family](../../../body/settings/cast/carina-malfoy.md#family); [October](../../../body/settings/world/four-films.md#october); [register](../../../body/settings/world/four-films.md#register); [inserts](../../../body/settings/cinematography/vertical-look.md#inserts); both cast relationship facets |

Backcast — facts each planned screenplay would otherwise invent, now owned by settings: why the duel is private and where its danger is (the room is empty; the platform has unrailed 0.9 m edges; Harry retreats blind); why a fall must be stopped by hand (no fall-stopping charm; no wands in Quidditch play); why the crane pulls between two hands (its charm pulls toward its addressee); what the note says at minimum (the hour of three); where a repeated walk can go (the 30 m corridor behind Harry's back at the window); how two can bend together (facing positions under 0.8 m over a note on the corridor's flagstones); what a Seeker's turn from the Snitch costs (a catch during a stoppage still counts) and who else could save a rider in each case (the who-can-reach table); how two ride one broom (rear footrests, pillion hold); who else is present and what they do for their whole presence (riders and Hooch); when and in what light everything happens. Left to the screenplays: every event, choice, outcome, line of dialogue and its order.

## Observed settings form

- Each file opens with one H1 naming its subject and a short paragraph stating which films use it, whether it is canon adopted or invention, and which records hold neighbouring subjects.
- Facets are the domain's H2 list in a fixed order; an inapplicable facet says `N/A` with its reason and the owner that holds the fact instead.
- Each H3 is one checkable fact with a stable anchor; values carry units, and measured values link to the research section they come from.
- Inventions are marked "Production's invention" and inferences state their translation; canon is marked as adopted.
- Habits give trigger, response, speed and reliability in that order.
- Facts that could be events are written as baselines and possibilities ("can", "within a film"), leaving events to the screenplays.
