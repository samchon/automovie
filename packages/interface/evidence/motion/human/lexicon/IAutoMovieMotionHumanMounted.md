# src/motion/human/lexicon/IAutoMovieMotionHumanMounted.ts#IAutoMovieMotionHumanMounted

## @evidence contracts/development/common.md#meaningful-documentation

on: The moving prop's subject id. frame: The carrier contact whose frame the figures are planned in. figures: The ordered seat figures, at least one, the last seated. stride: The carrier's stride time, seconds, which levels the pelvis out of the saddle and times a hand ride. respond: The share of the carrier's pitch and roll the trunk leans against. aids: The rider's aids. aided: The transitions that each need an aid.

## @evidence contracts/development/design.md#principled-representation

A closed seat vocabulary with named supports per figure and seconds per transfer and hold; the carrier and its contacts are named, never described.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanMounted` and its generated schema.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No mount geometry, gait or contact position is supplied by the author; every support is one of the carrier's declared contacts.

# src/motion/human/lexicon/IAutoMovieMotionHumanMounted.ts#IAutoMovieMotionHumanMounted.IFigure

## @evidence contracts/development/common.md#meaningful-documentation

seat: The seat kind. transfer: Seconds from the previous figure, more than none. hold: Seconds held, none or more. supports: The carrier contacts each body part bears on. handRide: Whether the held reins are pushed along the neck once a stride.

## @evidence contracts/development/design.md#principled-representation

Seconds on the action's own clock and contact ids of the carrier.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanMounted`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Supports a seat kind does not read are refused by the law, not ignored.

# src/motion/human/lexicon/IAutoMovieMotionHumanMounted.ts#IAutoMovieMotionHumanMounted.IWhip

## @evidence contracts/development/common.md#meaningful-documentation

hand: The striking hand. cue: The cue track whose instants, film seconds, are the strokes' contacts.

## @evidence contracts/development/design.md#principled-representation

A hand side and a cue track id, so the strokes follow the author's stride cue.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanMounted`.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The striking hand must hold a rein in the figure, which the law checks.

# src/motion/human/lexicon/IAutoMovieMotionHumanMounted.ts#IAutoMovieMotionHumanMounted.ISupports

## @evidence contracts/development/common.md#meaningful-documentation

Each member names the part and what it holds or rests on.

## @evidence contracts/development/design.md#principled-representation

One optional contact id per supporting part.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parts the current seat kinds read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A hand holds one contact through the whole performance; the law refuses a hand that changes contact.

# src/motion/human/lexicon/IAutoMovieMotionHumanMounted.ts#IAutoMovieMotionHumanMounted.Seat

## @evidence contracts/development/common.md#meaningful-documentation

Lists each kind, its posture and the supports it reads.

## @evidence contracts/development/design.md#principled-representation

A closed literal union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The kinds `HumanMounted` plans.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/lexicon/IAutoMovieMotionHumanMounted.ts#IAutoMovieMotionHumanMounted.IAid

## @evidence contracts/development/common.md#meaningful-documentation

kind: The aid. hand: The hand or leg that gives it, both when absent. cue: The cue track of the transitions it cues, film seconds. latency: Seconds from the aid's onset to the transition, more than none.

## @evidence contracts/development/design.md#principled-representation

A closed aid vocabulary, a side, a cue track and a latency in seconds.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by `HumanMounted`'s aids.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The transitions are the carrier's own published instants; the latency is the author's.

# src/motion/human/lexicon/IAutoMovieMotionHumanMounted.ts#IAutoMovieMotionHumanMounted.Aid

## @evidence contracts/development/common.md#meaningful-documentation

Lists each rider and driver aid and what moves.

## @evidence contracts/development/design.md#principled-representation

A closed literal union.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The aids `HumanMounted` gives.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/motion/human/lexicon/IAutoMovieMotionHumanMounted.ts#IAutoMovieMotionHumanMounted.IPhase

## @evidence contracts/development/common.md#meaningful-documentation

index: The figure begun last. share: How far its transfer has gone, eased, 1 through its hold.

## @evidence contracts/development/design.md#principled-representation

An index into the figures and a share in [0, 1].

## @evidence contracts/development/design.md#minimal-and-owned-surface

Returned by the mounted clock to the mounted law.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
