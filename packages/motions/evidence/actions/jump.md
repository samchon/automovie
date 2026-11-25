# src/actions/jump.ts#jump.plan

## @evidence contracts/development/common.md#meaningful-documentation

States the physical entry and refusal; helper documentation distinguishes the raw nominal root, achieved endpoints and independent whole-body flight turn.

## @evidence contracts/development/implementation.md#principled-implementation

The same terminal heel/knee/toe producer supplies endpoint preparation and timed push. Its achieved canonical states supply both ballistic COM endpoints and root-frame free goals, replacing independently reconstructed takeoff geometry while retaining the existing minimum-jerk and sine flight paths. The root touches down behind the footprints by the flight's capture offset (Hof 2008; Pratt et al. 2006), its horizontal speed over the balance audit's pendulum frequency, the speed in closed form D / (T + 1 / omega), so the extrapolated centre lands over the feet.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Read entry/support, prepare achieved endpoint values, solve COM flight, prepare the original timed push, then evaluate the three phases through their owners.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves original floor/prop targets, entry velocity/acceleration, ROM, contact windows and momentum acceptance. No nominal root is replaced by its lowered value inside the heel rule; no flight plant, radius projection or epsilon hides the phase seam. World COM and whole-body angular C1 at takeoff remain unproved.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two endpoint preparations add bounded canonical solves/FK per plan. Push/landing share one fixed joint prefix and lazily prepared cosine-law reach. At an unaltered bare ground read, one leg fit can serve both clearance and display after dependency checks. Each free query prepares its actual authored shape, reads mass-bearing FK and lends that canonical result through exact resolver admission.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Raw endpoints and achieved COM boundaries share; their two actual COM readings borrow one local exact FK source, while timed entry-rate curves remain independent. The unchanged body's joint prefix, arm separation and minimum-knee reach prepare once; new dimensions/knee require new preparation and every current root/plant/hip remains observed. Free-query COM/display share one checked canonical source without a time key. Parent FK/projector loans share only exact prerequisites/static ROM metadata through current solves.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan retains body/phase geometry, two endpoints, one bounded joint prefix/reach producer, prepared push/flight closures and fixed mass demand. The local paired-endpoint FK source ends with its preparation, leaving two COM vectors. Each free posture carries only its own checked preparation; optional FK/projector loans stay synchronous and never enter the plan, token/output evidence or previous-frame history. The lowering producer retains only fixed body/knee/scalar prerequisites.
