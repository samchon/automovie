# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.Target

## @evidence contracts/development/common.md#meaningful-documentation

States the units and frame of both forms.

## @evidence contracts/development/design.md#principled-representation

A union of a fixed point and a function of film seconds, both in world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by the attention and reach cues.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A tracked target is read at each sample, never frozen.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.IPoint

## @evidence contracts/development/common.md#meaningful-documentation

States the unit and frame.

## @evidence contracts/development/design.md#principled-representation

One world point.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A `Target` member.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.ITrack

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and the result's frame.

## @evidence contracts/development/design.md#principled-representation

A pure function of film seconds giving world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A `Target` member, for a partner's body region.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.ITrack.at

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and the result's frame.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature; the author's function owns its computation.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature; the author's function owns its structure.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature; nothing is implemented here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature; the layer calls it once per sample that reads the target.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature; nothing is implemented here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature; the layer retains only the function.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.IWindow

## @evidence contracts/development/common.md#meaningful-documentation

States the film-second window and the blend time with its bound.

## @evidence contracts/development/design.md#principled-representation

Start, end and blend in film seconds; `0 < ease` and `2 ease <= to - from` are runtime admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Extended by each held cue.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.IAttend

## @evidence contracts/development/common.md#meaningful-documentation

States what turns and what is kept.

## @evidence contracts/development/design.md#principled-representation

A window and a target.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The orientation cue.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.Act

## @evidence contracts/development/common.md#meaningful-documentation

Names each act and whether it touches.

## @evidence contracts/development/design.md#principled-representation

Closed literals from the social and feeding ethograms.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The reach cue's act, which decides its contact rule and instants.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Closed literals, not free text.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.IReach

## @evidence contracts/development/common.md#meaningful-documentation

States the act, the target and the clearance's unit.

## @evidence contracts/development/design.md#principled-representation

A window, an act, a target and the held clearance in metres, zero for a touching act and positive for a sniff, checked at admission.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The muzzle cue.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.IAround

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and the result.

## @evidence contracts/development/design.md#principled-representation

A pure function of film seconds giving a displayed pose.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A reach's obstacle, such as the mare a foal suckles from.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.IAround.at

## @evidence contracts/development/common.md#meaningful-documentation

States the argument's unit and the result.

## @evidenceExclude contracts/development/implementation.md#principled-implementation

A signature; the author's function owns its computation.

## @evidenceExclude contracts/development/implementation.md#clear-and-simple-structure

A signature; the author's function owns its structure.

## @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts

A signature; nothing is implemented here.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

A signature; the layer calls it once per sample of the reach.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

A signature; nothing is implemented here.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

A signature; the author's function owns its resources.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.Side

## @evidence contracts/development/common.md#meaningful-documentation

Names the animal's own left and right.

## @evidence contracts/development/design.md#principled-representation

Closed literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ear cue's side.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.EarCarriage

## @evidence contracts/development/common.md#meaningful-documentation

Names each carriage with its EquiFACS action unit.

## @evidence contracts/development/design.md#principled-representation

Closed literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ear cue's carriage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.IEar

## @evidence contracts/development/common.md#meaningful-documentation

States the side and the carriage.

## @evidence contracts/development/design.md#principled-representation

A window, a side and a carriage.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The ear cue.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

One ear per cue, so the two are independent channels.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.TailCarriage

## @evidence contracts/development/common.md#meaningful-documentation

Names each carriage.

## @evidence contracts/development/design.md#principled-representation

Closed literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The tail cue's carriage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.ITail

## @evidence contracts/development/common.md#meaningful-documentation

States the carriage.

## @evidence contracts/development/design.md#principled-representation

A window and a carriage.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The tail cue.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.JawAction

## @evidence contracts/development/common.md#meaningful-documentation

Names both actions.

## @evidence contracts/development/design.md#principled-representation

Closed literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The jaw cue's action.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.IJaw

## @evidence contracts/development/common.md#meaningful-documentation

States the action.

## @evidence contracts/development/design.md#principled-representation

A window and an action.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The jaw cue.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.Call

## @evidence contracts/development/common.md#meaningful-documentation

Names both calls.

## @evidence contracts/development/design.md#principled-representation

Closed literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The vocalization cue's call and its mark.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.IVocalize

## @evidence contracts/development/common.md#meaningful-documentation

States the call and its onset second.

## @evidence contracts/development/design.md#principled-representation

A call and one film second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The vocalization cue.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It poses nothing: a jaw opening for a neigh is its own jaw cue.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.HeadCarriage

## @evidence contracts/development/common.md#meaningful-documentation

Names each carriage.

## @evidence contracts/development/design.md#principled-representation

Closed literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The carriage cue's carriage.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.ICarriage

## @evidence contracts/development/common.md#meaningful-documentation

States the carriage.

## @evidence contracts/development/design.md#principled-representation

A window and a carriage.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The carriage cue; it shares the head channel with attention and reaches.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.LipAction

## @evidence contracts/development/common.md#meaningful-documentation

Names both actions with their action units.

## @evidence contracts/development/design.md#principled-representation

Closed literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The lip cue's action.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.ILip

## @evidence contracts/development/common.md#meaningful-documentation

States the action.

## @evidence contracts/development/design.md#principled-representation

A window and an action.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The lip cue; a slack lower lip adds to the jaw's opening.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.IShake

## @evidence contracts/development/common.md#meaningful-documentation

States what rolls.

## @evidence contracts/development/design.md#principled-representation

A window.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The shake cue; the trunk's shake is the stance's.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.Region

## @evidence contracts/development/common.md#meaningful-documentation

Names each region.

## @evidence contracts/development/design.md#principled-representation

Closed literals.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The twitch cue's region.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.ITwitch

## @evidence contracts/development/common.md#meaningful-documentation

States the region and its onset second.

## @evidence contracts/development/design.md#principled-representation

A region and one film second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The twitch cue.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It poses nothing: the coarse body has no skin surface to ripple, so the twitch is a named mark for the take, not a deformation.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.Cue

## @evidence contracts/development/common.md#meaningful-documentation

The union of every cue.

## @evidence contracts/development/design.md#principled-representation

Discriminated by `kind`.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What `AutoMovieArchetypeEquineExpression.layer` takes.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/animals/AutoMovieArchetypeEquineExpressionCue.ts#AutoMovieArchetypeEquineExpressionCue.IMark

## @evidence contracts/development/common.md#meaningful-documentation

States the call, its film second and its instant label.

## @evidence contracts/development/design.md#principled-representation

A call, a second and the label it also carries among the ride's instants.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Published by the layered ride for sound.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
