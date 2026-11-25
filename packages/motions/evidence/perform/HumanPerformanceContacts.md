# src/perform/HumanPerformanceContacts.ts#HumanPerformanceContacts.hold

## @evidence contracts/development/common.md#meaningful-documentation

States hand takeover, held-prop transfer and refusal when a different contact drives a holding hand.

## @evidence contracts/development/implementation.md#principled-implementation

Only a matching contact within the placed action can take over a hold. The plan's final holds extend that state at their declared absolute times, provided their closures survive the placed end.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The existing hold takeover pass precedes insertion of the new plan's declared holds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

An incompatible drive throws HumanRefusal with its hand/prop; riding keeps the declared hand-use policy.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans current holds and the plan's contacts/driven hands, then appends its declared holds; no geometry or fitting is introduced here.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reads existing plan hold/contact metadata rather than recomputing grasp geometry.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Mutates the person's ordered holds and marks each closed hold with the schedule index of the action that took it over (`takenBy`), so a cut can undo it. The marks are fields of the placed holds and go with them.

# src/perform/HumanPerformanceContacts.ts#HumanPerformanceContacts.cutHolds

## @evidence contracts/development/common.md#meaningful-documentation

States the schedule identity, inclusive time and both custody changes.

## @evidence contracts/development/implementation.md#principled-implementation

Removes an owned hold only if its closure lies after the resolved end. Reopens an earlier hold only if the cut action supplied its deleted takeover.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Keeps surviving holds in order, then clears planning reads once if a hold changed.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps closures at the cut boundary with the same 1 ns action-window allowance as hold admission. An unrelated action's takeover is never undone.

## @evidence contracts/development/implementation.md#efficient-algorithms

For H holds, one O(H) in-place compaction with at most one weak lookup per live hold.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the existing ordered hold records and the scheduler's cut boundary. Takeover ownership is the hold's own `takenBy` field.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Deletes the reopened hold's `takenBy` field and retains no new record.

# src/perform/HumanPerformanceContacts.ts#HumanPerformanceContacts.contacts

## @evidence contracts/development/common.md#meaningful-documentation

States clipped live spans, stop application, plan settling, mutual-contact selection, that one limb's capsules stop as one part and the grid bounds each side states.

## @evidence contracts/development/implementation.md#principled-implementation

Delegates unchanged signed-distance scan and event ordering to the engine; current performance bones define actual colliders and the nearest carried capsule determines the mutual stop. The bounds are certified on the grid: a weapon's measured from its own path, a person's 0 only where its pose provably holds still.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Collects original weapons and owners, then snapshots the constructor-fixed ordered cast only when a live weapon exists; actual frame/body readers keep those mutable person records live, apply stop changes and commit events/hits.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps STEP, live clipping, every engine scan and crossing search (a grid second is left unread only where both certified bounds rule it out), taper, nearest-body decision and whole-performance invalidation on changed stops; no pose is cached by time.

## @evidence contracts/development/implementation.md#efficient-algorithms

Retains engine weapon/body/sample search cost. The actual append-only stop producer permits O(1) unchanged-installation checks per query; sorted O(S log S) signatures for S stops run only when that Map grows or the explicit final Map arrives. Each sampled capsule reads both ends once, grouped carried chains run once, and each queried actor prepares genuine profile-name demand once; under one installed stop set each actor's displayed/FK bones at an exact second are evaluated once for every weapon's scan. The capsules of one limb of one action form one engine group, so after its first contact the limb's other capsules are scanned no more. Owner metadata removes the final event weapon scan. A grid bound reads each grid second of a weapon's window once a search, shared with the scan's own reads, and lets the scan skip the bones of a still person. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The sole live stops source is the event resolver's private native Map: both writes add an id only after absence checks, so identical Map identity and size prove no entry changed during this call. A new Map or increased size still takes the original full content comparison and every changed stop forgets person memos. Chain endpoints share only one explicit query. The constructor-fixed actor/body and copied canonical profile names justify a bound query producer. Bones are shared by exact second only while one stop set is installed: the memo is cleared when the stops change, before the nearest-person reads, and again after the plans settle and every person is forgotten, so each read observes the state it was read in; weapon axes are shared the same way, and a limb's capsules share their chain's evaluation at a second.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The ordered cast references, at most one fixed-name query producer per actually queried actor, adapter/owner/event maps, installed-stop Map/size reference and signature last only this synchronous resolution; their stop population is bounded by input weapons. The bones memo holds one collider-bone map per actor and distinct second read under the current stop set, released at each stop change and on return, as is the axes memo of one axis per live weapon and distinct second read. Each grouped axis map ends before its callback returns. Only existing person stops, plan stops and hit records persist, without any new pose/time history.
