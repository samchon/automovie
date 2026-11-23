# src/lexicon/HumanStagePiste.ts#HumanStagePiste.Kind

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the three fencing weapons and kendo.

## @evidence contracts/development/design.md#principled-representation

Four explicit literals, each with its footwork, attack and target rule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by compose for the footwork style, the attack, the reply and the target rule.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The caller chooses the weapon. No props are guessed or created.

# src/lexicon/HumanStagePiste.ts#HumanStagePiste.Result

## @evidence contracts/development/common.md#meaningful-documentation

Names the performer or performers the touch is awarded to.

## @evidence contracts/development/design.md#principled-representation

A touch for either performer, a double touch and no touch are distinct literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Chooses the exchange's actions and the announced result.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The script supplies the outcome before either performer is placed.

# src/lexicon/HumanStagePiste.ts#HumanStagePiste.IActor

## @evidence contracts/development/common.md#meaningful-documentation

Defines the preparatory chain, the body-relative mark shift in metres, the held blade and the target.

## @evidence contracts/development/design.md#principled-representation

One existing chain, a stage direction with a positive distance, the held blade's prop subject and a motion target.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compose reads every member: the shift from the first four, the attack or reply from the blade and target.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Props and preparatory actions stay in the caller's own chain; the blade must already be held when the exchange starts.

# src/lexicon/HumanStagePiste.ts#HumanStagePiste.ITake

## @evidence contracts/development/common.md#meaningful-documentation

Documents the anchor, time and length units, the optional editing cue and the optional spacing check.

## @evidence contracts/development/design.md#principled-representation

A closed result independent of the two performers' marks and targets, with the footwork's duration in seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

compose uses each input to place the shift, check the spacing and the rules, and choose the exchange.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The reserved space is an authored bound on travel between the floor marks. Physical pose remains the motion laws' responsibility.

# src/lexicon/HumanStagePiste.ts#HumanStagePiste.IAnnouncement

## @evidence contracts/development/common.md#meaningful-documentation

States the result and the unit and reference of its time.

## @evidence contracts/development/design.md#principled-representation

Film seconds and the closed scripted result.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Produced by the take's reader for editing and playback.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No computed score is embedded in the record.

# src/lexicon/HumanStagePiste.ts#HumanStagePiste.IPlaced

## @evidence contracts/development/common.md#meaningful-documentation

Identifies the composition and the reader's presence condition.

## @evidence contracts/development/design.md#principled-representation

The reader receives the placed schedule and reads the deciding action from it.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A caller places the composition, then reads the result through this record.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A missing or cut deciding action, or a double touch outside the epee's window, yields no result.

# src/lexicon/HumanStagePiste.ts#HumanStagePiste.compose

## @evidence contracts/development/common.md#meaningful-documentation

Describes the phases, the result's branches, the required space and the refusal cases.

## @evidence contracts/development/implementation.md#principled-implementation

The rules are the weapon's valid target and double-touch rule; each full planned translation is subtracted from the opening distance for a conservative reserve. HumanChain places the advances, and the registered blade actions, synchronised on the attack's decisive instant, place the exchange.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Admit the weapon, numbers and rules, place the approach's advances, then the exchange and its reader.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Cast, timing, marks, targets and outcome come from the script; reach, the parry's meeting and every pose belong to the blade actions.

## @evidence contracts/development/implementation.md#efficient-algorithms

Validation reads fixed input fields and constant sets, placement builds two intents per advance and at most three for the exchange, and the reader scans the schedule's entries for at most two anchors.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses HumanChain.mutual, the HumanBlade rows, HumanBound and the registered stageBladeFootwork.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The reader captures the anchors and the result, with no frame cache or native resource.
