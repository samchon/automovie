# src/perform/HumanSegmentPlant.ts#HumanSegmentPlant.settled

## @evidence contracts/development/common.md#meaningful-documentation

States when a planted limb needs no second fit, what is compared, what is written to the seeds and what false means.

## @evidence contracts/development/implementation.md#principled-implementation

A fit's solution places the limb on its goal within the fit's own resolution; a second fit of the same goal on a pose that differs from the first fit's only by that solution solves the same task again. The clamp is the one operation between them in the caller's plain case, so exact equality of the limb's records across it shows the solution untouched.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One pass over the pose's records for the planted limbs' bones, then the seeds.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A planted limb without a leaf seed of its own (not fitted by this evaluation) or with any record the clamp changed is not accepted, and then every plant is fitted as before. The pose kept is the leaf's, which differs from a second fit's within the fit's resolution.

## @evidence contracts/development/implementation.md#efficient-algorithms

J name tests and at most four exact record comparisons a planted limb, in place of one limb fit each.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The leaf fit and the planted stage of one evaluation ask the same goal object of the same body at the same second; the solution is shared only while the limb's records are exactly the fit's.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Retains nothing; writes at most four seeds into the caller's map.

# src/perform/HumanSegmentPlant.ts#HumanSegmentPlant.fit

## @evidence contracts/development/common.md#meaningful-documentation

States the post-clamp input, complete current goals, planted-stage continuation names and returned resolver record.

## @evidence contracts/development/implementation.md#principled-implementation

Fits exactly the goals with planted equal to true on the actual displayed pose, after transitions and applicable clamps; ordered attachment admission and the ordinary resolver keep connected goals and paired arms coherent.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One ordered goal filter returns immediately for an empty cold request; nonempty or continued requests keep the original attachment-order check, nearby-name projection and ordinary refit.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Every supplied goal's planted property is still inspected before an empty return; no selected plant, field, clamp, ordering check, near seed or actual solve is skipped. Empty goals have no attachment edge or fit and retain the original pose identity and fresh empty seed/value records.

## @evidence contracts/development/implementation.md#efficient-algorithms

Scans L entries once. An empty cold selection omits the goal dictionary, two four-node order traversals and unused native refit setup; nonempty selection retains the full existing fit cost. Continued queries preserve all four candidate-name reads, including empty selections. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Delegates the physical solve to the private refitHumanPosture, the same ordered kernel and limb memory as resolveHumanPosture.refit with its native issuer: the input is the displayed evaluation's own clamped intermediate, so untouched records are shared rather than cloned twice per limb and once more for the result. Continuation interpretation stays with HumanSegmentPose.nearby; different poses, goals, cold queries and nearby histories still resolve independently.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The filtered goal dictionary, order and optional nearby projection belong to this synchronous call and release on return or failure. Goal payloads remain borrowed; the resolver preserves its no-plant pose identity or fitted-result ownership. No callback, reader, cache or process is retained here.
