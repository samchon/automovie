# src/posture/refitHumanPosture.ts#refitHumanPosture

## @evidence contracts/development/common.md#meaningful-documentation

States person/pose frame, attachment order, pair policy, lazy owned-or-borrowed reader scope and the direct solve. Member facts: continued: Defines the owned free-leg source and its continuous solver policy. constructed: Defines fresh assembly output and its known admission.

## @evidence contracts/development/implementation.md#principled-implementation

Retains the existing placed-arm order, world attachment transforms and independent-or-coupled arm law. A goal carrying its law's planned seed (`IAutoMovieHumanLimbGoal.seed`) is placed there in closed form (`HumanLimbFit.at`), over any seed the reader continues, so every reader of the goal places one limb; two seeded arms are not pair-fitted. Exact scalar FK dependencies permit unchanged articulation/ancestor math to be reused while changed limbs and descendant frames are recomputed normally. Member facts: continued: The free-curve producer owns deterministic phase continuation and checks all current physical constraints; this entry chooses the engine's current hinged correction for its legs. constructed: The ordinary direct solve.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One shared kernel owns original limb order/coupling; each entry passes its limb fit and whether its pose is an assembly's. Member facts: continued: The same kernel with the continuous limb fit. constructed: The same kernel on an assembly's pose.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every goal, rival, near seed, actual fit and ordering rule remains unchanged for an unseeded goal; a seeded goal is never refined at read time, and a seed that places no hinged chain throws rather than searching; no key, stored answer or approximation is added. Member facts: continued: No changed goal, branch answer, readiness flag or relaxed bound. constructed: No changed goal, skipped admission or altered constraint.

## @evidence contracts/development/implementation.md#efficient-algorithms

No-goal inputs return before graph/placed-arm construction/copying. At most four goals each pay their actual solve on the records it reads, with no key, lookup or result clone, and the whole pose's ordered admission runs once for the singly fitted limbs (`HumanLimbView.IAdmission`); speedup is unmeasured. Member facts: continued: Avoids generic pole/source ranking before an accepted current hinged correction. constructed: The same solves.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only same-valued FK prerequisites are shared. A standalone refit owns its lazy reader; an explicit parent can lend one across leaf calls in the same synchronous person evaluation; each fit is solved afresh. Member facts: continued: The same actual source reader, with no prior pose replay. constructed: The same.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Results are the solved records, sharing untouched records with the input pose; no-goal input keeps its borrowing contract. Readers end with the operation and never enter output. Member facts: continued: Source, readers and policy remain synchronous. constructed: Current source/output and FK loan remain within the caller's synchronous operation.
