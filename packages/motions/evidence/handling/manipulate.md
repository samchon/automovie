# src/handling/manipulate.ts#manipulate.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the resolved sequence and refusals; the namespace documents finger, site, timing and hand-goal conventions.

## @evidence contracts/development/implementation.md#principled-implementation

The existing sequence/fingering result is prepared by manipulatePlan with the same minimum-jerk wrist and digit goal equations.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Sequence owns contact admission and timing; manipulatePlan owns invariant preparation and active-contact evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No press, authored order, key depth, time, event or hand goal is discarded or approximated.

## @evidence contracts/development/implementation.md#efficient-algorithms

Sequence keeps its Viterbi cost while fixed contact geometry/windows are prepared once and each displayed posture selects at most two contacts by binary search.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Only fixed body, entry posture, sequence and skill interval share prepared geometry; each requested second evaluates its actual active press.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns O(N) prepared contacts and windows until release and stores no evaluated-time pose history.

# src/handling/manipulate.ts#manipulate.sequence

## @evidence contracts/development/common.md#meaningful-documentation

States resolved sites, fingers and action-relative press times; parameter declarations give the site/digit/time/depth meanings.

## @evidence contracts/development/implementation.md#principled-implementation

Prop affordances are placed at the original action-start frame, skill/random timing remains in original contact order and the same exact fingering owner chooses free digits.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Site resolution, time admission, clock draws and hand-wise fingering precede the returned press records.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Missing sites, empty sequences and partly supplied times retain their original refusals; no random draw or contact ordering changes.

## @evidence contracts/development/implementation.md#efficient-algorithms

Each distinct named site is resolved once per sequence, plus the original linear timing and bounded-state fingering work.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Repeated site names share only the same prop/start-frame point, normal and default travel; individual depths, hands and times stay contact-specific.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The local distinct-site map ends with this call; returned presses retain only the geometry and values they use.
