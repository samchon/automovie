# src/actions/supportCourse.ts#supportCourse.ICourse

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its input, output and frame.

## @evidence contracts/development/design.md#principled-representation

Callbacks over the support law's contact records, returning world metres or a predicate.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three requirements the ladder access and vault courses use.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

None restates a key posture or a time.

# src/actions/supportCourse.ts#supportCourse.Place

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, units and null meaning.

## @evidence contracts/development/design.md#principled-representation

The same lookup the support keys use.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by levels and swings.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

A null place yields no goal rather than an invented point.

# src/actions/supportCourse.ts#supportCourse.Write

## @evidence contracts/development/common.md#meaningful-documentation

States the share's range and the effect.

## @evidence contracts/development/design.md#principled-representation

The share is the interval's own minimum-jerk weight.

## @evidence contracts/development/design.md#minimal-and-owned-surface

prepareSupportFootCourse returns it and support.plan applies it.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

It writes only its own leg and toes.

# src/actions/supportCourse.ts#supportCourse.ICrossing

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The contact it leaves, the one it reaches and world-metre waypoints.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Read by swings and support.plan's lift keys.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An empty list keeps the ordinary swing.

# src/actions/supportCourse.ts#supportCourse.ILeg

## @evidence contracts/development/common.md#meaningful-documentation

States each member, its frame and unit.

## @evidence contracts/development/design.md#principled-representation

The foot, its heading and two toe-joint points in world metres.

## @evidence contracts/development/design.md#minimal-and-owned-surface

What carried needs to build the stretch's writer.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Built only by swings.

# src/actions/supportCourse.ts#supportCourse.IKey

## @evidence contracts/development/common.md#meaningful-documentation

States each member.

## @evidence contracts/development/design.md#principled-representation

The key's heading, contacts and place lookup.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The three fields bearings reads from support.plan's keys.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

Reads the keys without changing them.

# src/actions/supportCourse.ts#supportCourse.IBearings

## @evidence contracts/development/common.md#meaningful-documentation

States the indexing of both lists.

## @evidence contracts/development/design.md#principled-representation

Indexed by key and by the interval that starts at that key.

## @evidence contracts/development/design.md#minimal-and-owned-surface

support.plan's transfer reads both.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

An interval keeps only bearings held at both of its keys.

# src/actions/supportCourse.ts#supportCourse.heel

## @evidence contracts/development/common.md#meaningful-documentation

States the goal, its frame and the result.

## @evidence contracts/development/implementation.md#principled-implementation

The toe joint's elevation alone leaves the ankle free to point the heel into the floor; the rigid hindfoot is levelled by aligning its sole normal with the world's down at the same height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One target record shared by swing and bearing goals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the body's own heel socket.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Builds one small record.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/supportCourse.ts#supportCourse.levels

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the empty case.

## @evidence contracts/development/implementation.md#principled-implementation

A bearing foot on a level fixture keeps its whole sole on it, so the heel goal accompanies the toe goal at the same height.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Filters the contacts by the course's own predicate.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only feet the course names receive a goal.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the key's contacts.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each key's goals are built once by its solve.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/supportCourse.ts#supportCourse.swings

## @evidence contracts/development/common.md#meaningful-documentation

States the stretch numbering, units and result.

## @evidence contracts/development/implementation.md#principled-implementation

A fitted key alone does not keep the swept foot above an edge between two keys; a straight toe-joint course between consecutive waypoints does, since each waypoint already clears the edge.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Resolves the stretch's two ends and delegates the foot to prepareSupportFootCourse.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Hands and feet without waypoints keep the support law's own interval.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant work per crossing; called once per stretch at plan time.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each stretch is distinct.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The writers are retained by the plan for its lifetime.

# src/actions/supportCourse.ts#supportCourse.carried

## @evidence contracts/development/common.md#meaningful-documentation

States the frame and the result.

## @evidence contracts/development/implementation.md#principled-implementation

While the root travels the stretch is expressed in the root's frame, so the foot's offset blends between two reachable offsets and stays reachable.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Delegates to prepareSupportFootCourse with both key roots.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The stretch's ends are the course's own points, a place on the floor plane read at the toes' joint's flat height above it.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant preparation per stretch.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Each stretch is distinct.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The writer lives as long as the plan.

# src/actions/supportCourse.ts#supportCourse.bearings

## @evidence contracts/development/common.md#meaningful-documentation

States the result's indexing and the undefined case.

## @evidence contracts/development/implementation.md#principled-implementation

The joint-space blend between keys can tilt a bearing foot; writing the foot flat at its placed toe point keeps the sole on the level fixture through the interval.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Builds per-key writers once, then keeps those held to the next key for the interval.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Only feet the course names and that bear at both keys are written.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in keys times contacts at plan time.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

An interval reuses its first key's writer for the same contact, since the place and yaw are the same.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains the writers for its lifetime.

# src/actions/supportCourse.ts#supportCourse.footHeading

## @evidence contracts/development/common.md#meaningful-documentation

States the input, the result and its unit.

## @evidence contracts/development/implementation.md#principled-implementation

The posed foot bone's rotation decomposed by HumanFoot.heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One resolve, one demanded bone, one heading.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The foot's own heading, not the body's.

## @evidence contracts/development/implementation.md#efficient-algorithms

Forward kinematics of the foot's chain alone.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Read once per key and foot at plan time.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.

# src/actions/supportCourse.ts#supportCourse.apply

## @evidence contracts/development/common.md#meaningful-documentation

States the inputs and the empty case.

## @evidence contracts/development/implementation.md#principled-implementation

Each writer owns a different leg, so their order does not matter.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One fold.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Writes only what the writers own.

## @evidence contracts/development/implementation.md#efficient-algorithms

Linear in the writers.

## @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work

Nothing is shared between calls.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing.
