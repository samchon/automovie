# src/everyday/sitHandSpans.ts#sitHandSpans

## @evidence contracts/development/common.md#meaningful-documentation

States the legs' course, the three spans a hand can have, when each applies and what is read at plan time.

## @evidence contracts/development/implementation.md#principled-implementation

The legs are coursed once (`courseHumanLegs`) so the thighs the hands are laid on are the thighs every reader places. A hand on an armrest and a hand laid on its thigh keep the sit's own spans; a hanging hand its rising thigh meets before seat contact (`sitHandMeet`) lands on the thigh as the thigh comes up, its rest opening at that instant and reached over the law's own reach time, seated less contact.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One prepare: the course, the meeting instants, then two light readers.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No constant of its own: the reach time is the law's, the armrest share is the law's `REACHING`, the meeting instant is the body's own geometry; a meeting at or after contact leaves the sit's span unchanged.

## @evidence contracts/development/implementation.md#efficient-algorithms

Plan-time cost class: the legs' course and one meeting scan per hand without an armrest; a read of a span or a progress is constant work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The course and the meeting instants are made once for the plan and read by every second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The returned readers hold the legs' course and two numbers for as long as the plan holds them.

# src/everyday/sitHandSpans.ts#ISitHandSpansProps

## @evidence contracts/development/common.md#meaningful-documentation

States each member and its frame of seconds.

## @evidence contracts/development/design.md#principled-representation

The body, the sit's lowering by its own seconds, the entry, the armrest predicate and the sit's own timing and armrest share.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the spans and the course need, each a value the sit already owns.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.

# src/everyday/sitHandSpans.ts#ISitHandSpansSpans

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The legs' stamp and two readers by side and second.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What the sit's posture and its arm primitives read.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None.
