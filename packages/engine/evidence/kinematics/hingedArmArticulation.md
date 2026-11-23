# src/kinematics/hingedArmArticulation.ts#hingedArmArticulation

## @evidence contracts/development/implementation.md#principled-implementation

The span is an exact sinusoid in the hinge angle because rotation about hinge leaves the along-hinge segment fixed and turns the rest in a circle. Its two arccos roots give the branches and swivel is a positional null space. Legality keeps exact zero. When the original first coarse candidate's actual legality and deviation equal certified global minima and no second key exists, every later candidate can only tie or lose, so returning it preserves the original winner and seed. A placed pole takes the feasible swivel nearest the desired one (Tolani, Goswami and Badler 2000, section 3.2.4; the swivel is the chain's one free parameter, section 3.2): the legal set's edge nearest the pole is found by stepping the swivel and bisecting the candidate's legality, each candidate scored as the sweep scores it. Each root limit is a sinusoid of the swivel (section 3.2.3), so a refusal covering every swivel of every swept branch certifies that no candidate is legal, and each violated limit is least violated at its sinusoid's least value, where the search for the least overshoot starts.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Pure chain geometry with the ROM policy injected through `score`, so `reachPose` owns the clinical decomposition and constraints while this function owns the branches and the sweep; the shared `aimRotation` aims the root.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rig, side or target is special-cased; the degeneracy thresholds are the engine's shared length scale, and a chain that cannot reach legally returns its least overshoot instead of being clamped into range.

## @evidence contracts/development/common.md#meaningful-documentation

States the hinge-only elbow, the span formula and its branches, the out-of-span behavior, the swivel sweep and its ordering, the certified-infeasible start, who owns scoring, every `null` case with its threshold, and each input's frame.

## @evidence contracts/development/implementation.md#efficient-algorithms

A cold fit with `closed` candidates scores those alone, at most two a branch, and returns a legal, met best with no search. Eligible cold fits (a `pole`, no `tie`, no `minimum`) first score per branch the pole start, each downhill step and one golden refinement, returning when legal; otherwise, at most two branches times 360 swivel steps plus bounded per-minimum golden refinement remain; with a certified `bound`, branch and bound (`hingedSwivelBounded`) scores only the steps and refines only the minima the bound cannot place behind a legal candidate, with the full sweep's choice, also under a `tie` (by buckets) and beside a `minimum` certificate (tested first on the sweep's first candidate). The caller's refusal and bound are built once a branch for the solve. Near mode retains its original tolerance-derived count. An exact first-candidate global-minimum certificate ends cold search after that one actual score. A cold fit certified infeasible by its refusal scores at most twelve closed-form starts a branch (`least`) and one pattern search with its refinement (`hingedSwivelPole`) instead of the sweep's 360 steps a branch and their refinements; that local search is a plan-time knot's answer to an empty feasible set, which a continuity course turns into a refusal or a planned stretch, never a read's. Failed pruned passes reuse identical completed steps/refinements. The shared comparator may read a required exact(a) before b and prove it ahead of b's lower bound without exact(b). Runtime speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Each hinge branch computes its mid direction and aim once for the solve. Within that unchanged branch/target/score, a full fallback reuses each actual step and completed refinement of the same bracket; it still compares all original candidates in their original order. An optional matching prepared target also shares source span coefficients/inverse root and this point's lowered goal. No scored answer crosses targets or solves.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

A solve retains at most two branches' 360 step candidates and one selected candidate per refined step, with their branch pose/probe closures. The bounded workspace releases at return or throw; only the selected rotations escape, with no history or external handle.
