# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.Kind

## @evidence contracts/development/common.md#meaningful-documentation

The sequence names distinguish the pool races, springboard dive, water polo, artistic figure, crew strokes, completed and aborted sailing maneuvers, supported exits, paired rescue actions, and fin-based swimming.

## @evidence contracts/development/design.md#principled-representation

Aquatic planning dispatches on this closed set. The branch selects the model and contact rules used to interpret the participant, water plane and named props.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Each kind selects a plan inside the aquatic action. World geometry, performer registration and scene prop identities remain with their existing owners.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.Station

## @evidence contracts/development/common.md#meaningful-documentation

The type identifies the front and rear stations of a two-person shell and identifies the stroke seat as the one that sets cadence.

## @evidence contracts/development/design.md#principled-representation

The bow and stroke literals are the two station prefixes used by the racing shell. The scull planner fits the named seat, its slide, both handles and both stretchers before playing the stroke.

## @evidence contracts/development/design.md#minimal-and-owned-surface

A performer names one station. The shell supplies its geometry and moving affordances, and the scull law owns the stroke clock.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.Role

## @evidence contracts/development/common.md#meaningful-documentation

The comment groups the role names by the three sequences that read them. The parameter comment gives the default role for each family.

## @evidence contracts/development/design.md#principled-representation

The literals distinguish actor duties within water polo, artistic swimming and sailing. The shared parameter object accepts roles across families, including combinations that fall back to a default branch. Assigning the roles to their own kind variants remains open.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The role selects duties while the performance continues to own the performer identity. The selected family owns how the role changes support or control motion.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams

## @evidence contracts/development/common.md#meaningful-documentation

The fields identify the water plane and staging points in metres, the normalized phase, scene entities, support shapes and time budgets. The duration comment distinguishes the capped rescue approach from the dive's breath-hold budget and the durations of the repeated fin strokes and distress action.

## @evidence contracts/development/design.md#principled-representation

The kind selects a law that interprets the remaining fields. The common dispatcher bounds phase, the fin planner requires a blade with both dimensions and enforces the duck dive's reachable depth, and the rescuer computes a reachable approach distance from its time limit. The current optional fields permit incompatible combinations in typed callers. Expressing the per-kind field requirements in the public type remains open.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The parameters reuse world vectors, human sides and scene identifiers. The performance owns live participant and prop frames. The law owns phase durations, the rescue approach calculation and the dive's reachable depth.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.kind

## @evidence contracts/development/common.md#meaningful-documentation

The required sequence selects a member of the documented aquatic kind set.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.water

## @evidence contracts/development/common.md#meaningful-documentation

The field specifies the horizontal water plane's world height in metres, with zero as the default.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.support

## @evidence contracts/development/common.md#meaningful-documentation

The field names the support and its required geometry. A direct exit uses the material deck face when available, with local positive Z into the water and at most 0.5 m of freeboard.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.prop

## @evidence contracts/development/common.md#meaningful-documentation

The field identifies the tool or ball by its scene subject. It gives fin-based sequences the required `blade` affordance and its two dimensions.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.wall

## @evidence contracts/development/common.md#meaningful-documentation

The distance-only race carries the wall in metres ahead of entry and uses 6 when the wall prop and distance are both omitted.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.at

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives world metres and distinguishes a polo release aim from the common shore destination of a tow. Tow direction reads the two horizontal coordinates.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.side

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the duty whose side the field selects for paddling, pool play, base support, and sailing.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.phase

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the fractional unit, inclusive bounds and zero default.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.station

## @evidence contracts/development/common.md#meaningful-documentation

The field names a bow or stroke station on the articulated shell used by double scull.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.role

## @evidence contracts/development/common.md#meaningful-documentation

The comment names the consuming families and states the attack, figure and helm defaults in matching order.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.duration

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives seconds, branch defaults and applicable failure behavior. The rescuer compares its approach distance divided by swim speed with the supplied limit and reports the resulting reachable distance. The fin planner uses the same parameter as a breath-hold budget for duck dives.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.partner

## @evidence contracts/development/common.md#meaningful-documentation

The field names the other performer for both directions of the tow or lift. During the paired tow the rescuer reads the other performer's displayed chest.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.depth

## @evidence contracts/development/common.md#meaningful-documentation

The depth comment gives the water surface reference, metre units, separate fin-swim and duck-dive defaults and the dive's reach constraint.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.bases

## @evidence contracts/development/common.md#meaningful-documentation

The comment gives the required distinct participants, their placement order and the flyer's corresponding foot supports.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.footRest

## @evidence contracts/development/common.md#meaningful-documentation

The comment locates the optional reference in prop-local coordinates and identifies the seated stroke and initial stance that use it.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.leftGrip

## @evidence contracts/development/common.md#meaningful-documentation

The field names the tracked prop affordance for the left hand.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.rightGrip

## @evidence contracts/development/common.md#meaningful-documentation

The field names the tracked prop affordance for the right hand.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.boom

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the optional articulation that drives the boom's signed port and starboard travel.

# src/motion/IAutoMovieMotionHumanAquatic.ts#IAutoMovieMotionHumanAquatic.IParams.rudder

## @evidence contracts/development/common.md#meaningful-documentation

The comment identifies the optional articulation that drives signed rudder motion.
