# Entity statements

Contract: [entities.md](../entities.md).

## Settings realization {#settings-realization}

1. Every fact the entity realizes is named by its record path and anchor, with how it is realized.
2. Every cited fact is either shown by the entity's form or handed on with the consumer that carries it, such as a canon image, the generation prompt or a shot's sound description.
3. A fact the form cannot show, such as a face, a fabric, a makeup state or a voice, is handed on and not modeled. Exception: a commissioned detail option shows what it was commissioned to show.
4. A person's body parameters derive from the cast record's body facts, and one prepared body serves both the polygon man and the motion planned for it.
5. Each parameter of a research law or of an installed action, such as stature, proficiency or style, derives from a cited fact and stays within the range its law gives.
6. Each measurement names its study and section.
7. Placements, weights, texture coordinates and measurements derive from the subject's generating definition, so changing the detail option moves none of them.
8. A decision the settings or brief do not establish is written there first, and a measurement no research supports is studied first. Exception: when [no narrative pass runs](../../../story/workflow.md#who-writes-the-screenplay), such a decision is recorded in the screenplay, or for a fixed screenplay in the instructions.

## Object shape {#object-shape}

1. The entity is a class with `readonly` fields, constructed only from its settings or brief facts and immutable configuration.
2. It is composed of small fragments rather than inherited.
3. It imports no other entity.
4. Each capability returns an immutable intent record and never a pose, coordinate, offset or time.
5. A person's capability returns the installed motion vocabulary's own composition of the action, or a production law's intent for an action the vocabulary lacks. The entity adds no motion of its own.
6. State such as wardrobe by story day, wounds, fatigue or a learned habit exists only as an explicit snapshot computed at schedule resolution.
7. A habit is a trigger-to-response rule, with the trigger and response its fact describes and the timing its research supports.

## Controls and source {#controls-and-source}

1. The entity exposes the controls its scenes' behaviors and variation use.
2. A deformation a scene needs is present. Rig complexity no scene uses is not required.
3. Every version of the subject the scenes use is a parameter or the seed of this module. No copy of the module with edited constants exists.
4. The coarse form is the default, and each commissioned detail builds from the same definition.
5. A subject an installed package already provides is taken from it and not rebuilt.
6. The entity rebuilds from a fixed source with its usage rights.
7. An adopted or converted asset states which channels and deformation the conversion and the runtime retain.
