# src/actions/jumpPush.ts#jumpPush.standing

## @evidence contracts/development/common.md#meaningful-documentation

States the frame, the lowering it mirrors, the defect it removes and the unreachable result.

## @evidence contracts/development/implementation.md#principled-implementation

The posture's own gravity-axis lowering at the planted leg's least knee bend, applied to the hip the heel rule reads.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One lowering read and one vertical offset.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No reach gate, blend or threshold: the hip is the one the posture's lowering gives the asked ankle.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

One constant-time reach read.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the lowering's own prepared reach.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector or the input and retains nothing.

# src/actions/jumpPush.ts#jumpPush.IProps

## @evidence contracts/development/common.md#meaningful-documentation

Each member states its meaning, frame and unit.

## @evidence contracts/development/design.md#principled-representation

The entry, the two feet's roles and places, and the jump's heading, root path and knee rule.

## @evidence contracts/development/design.md#minimal-and-owned-surface

The members the push-off reads.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The root path and the knee rule are the jump's own, passed in.

# src/actions/jumpPush.ts#jumpPush.IProps.rootAt

## @evidence contracts/development/common.md#meaningful-documentation

Defines local seconds and the unlowered world-metre push root.

## @evidence contracts/development/implementation.md#principled-implementation

The actual jump.plan producer supplies jumpPath's quintic Hermite from entry position/velocity/acceleration to the nominal terminal root and solved launch slope.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One phase-local root reader is consumed by the hip rule and raw push posture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Reads the push curve rather than future free-flight roots; no lowered root is fed back into the nominal rule.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Delegates fixed-size curve evaluation to jumpPath's prepared Hermite reader.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The hip and posture readers share the same authored phase curve.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

The supplying plan owns the reader; calls return fresh world vectors and acquire no resource.

# src/actions/jumpPush.ts#jumpPush.IProps.knee

## @evidence contracts/development/common.md#meaningful-documentation

Inputs are a world-metre root, leg side and degree heading; output is a world-metre pole.

## @evidence contracts/development/implementation.md#principled-implementation

The jump.plan producer delegates to jumpAirborne.knee using the actual body's rest knee and the supplied pole heading.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One spatial pole reader is shared by the timed push and pure terminal producer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Keeps the support foot's actual heading rather than substituting the flight heading at release.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Delegates fixed-size frame operations to jumpAirborne.knee.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Uses the same existing pole owner for endpoint and interior demand.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh vector and retains no resource.

# src/actions/jumpPush.ts#jumpPush.IPush

## @evidence contracts/development/common.md#meaningful-documentation

Each member states what it gives.

## @evidence contracts/development/design.md#principled-representation

The paths the jump's posture reads through the push and after.

## @evidence contracts/development/design.md#minimal-and-owned-surface

One phase sample, the fixed-entry arm course and one complete leg writer serve jumpPushPosture; the original entered-rate view remains available without changing its meaning.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

The legs are written whole, so no caller recombines their parts.

# src/actions/jumpPush.ts#jumpPush.IPush.sample

## @evidence contracts/development/common.md#meaningful-documentation

Defines local seconds and the original raw root, degree heading/pelvis, unitless progress and carried-time coefficient in IPhase.

## @evidence contracts/development/implementation.md#principled-implementation

jumpPush.of evaluates the same root Hermite, minimum-jerk progress and engine carriedRate, then the original heading/pelvis formulas with their exact terminal values.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One explicit value record feeds arm assembly, the heel's actual hip and the final raw posture.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No lowered root, sampled replacement curve, changed entry rate or timing epsilon enters the sample.

## @evidence contracts/development/implementation.md#efficient-algorithms

Fixed entry/target differences prepare once. Each requested phase still evaluates its shared root/progress/carry/yaw/pelvis arithmetic once, with speedup unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The fixed planned entry/targets permit coefficient reuse; consumers share only this exact local time's explicit phase values. Different times construct independent samples without a callback result cache.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns a fresh phase record/root and interior pelvis tuple; the terminal pelvis retains its existing readonly endpoint tuple. No query history or resource is retained.

# src/actions/jumpPush.ts#jumpPush.IPush.swinging

## @evidence contracts/development/common.md#meaningful-documentation

Names the side and clinical flexion-rate unit.

## @evidence contracts/development/implementation.md#principled-implementation

jumpPush.of reads that bone's entered joint-rate map once, with the declared absent rate of zero, and keeps it with the same arm course.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

One prepared scalar read.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Does not resample, scale or clamp an available entry rate.

## @evidenceExclude contracts/development/implementation.md#efficient-algorithms

Constant-time scalar access.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The actual push arm writer uses this same entered rate.

## @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources

Returns one scalar and retains no new resource.

# src/actions/jumpPush.ts#jumpPush.IPush.arm

## @evidence contracts/development/common.md#meaningful-documentation

Names the phase sample, side and clinical-degree result from the original entered angle/rate.

## @evidence contracts/development/implementation.md#principled-implementation

The actual producer retains entered+(60-entered)*progress+entryRate*carry in its original addition order, including its endpoint arithmetic.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Two fixed entry tracks supply the same current sample's progress/carry without another clock evaluation.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

No rate normalization, new clamp, nominal terminal substitution or altered shoulder target is used.

## @evidence contracts/development/implementation.md#efficient-algorithms

Constant arithmetic reads prepared start/difference/rate instead of repeating entry-map lookups and subtraction; speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

The immutable planned entry fixes each track, while every current progress/carry remains evaluated from the supplying phase sample without a time/result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The supplying push owns two three-scalar tracks; this method returns only a number and retains no phase, root, result or reader.

# src/actions/jumpPush.ts#jumpPush.IPush.elbow

## @evidence contracts/development/common.md#meaningful-documentation

Names the phase sample, side and the clinical-degree gap added to the jump's elbow rule.

## @evidence contracts/development/implementation.md#principled-implementation

The entered gap fades on the push's minimum-jerk progress and its rate on the engine's carriedRate, the arm track's own laws, so the elbow keeps its entered angle and rate and meets the rule at the take-off.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The same arm track holds the elbow's gap and gap rate beside the shoulder's.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

The entered elbow is read, never assumed straight; nothing is clamped or rescaled.

## @evidence contracts/development/implementation.md#efficient-algorithms

Two multiplications on the prepared gap and rate per sample.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Reuses the sample's progress and carry with the shoulder's track.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Returns a number and retains nothing.

# src/actions/jumpPush.ts#jumpPush.IPush.write

## @evidence contracts/development/common.md#meaningful-documentation

States the mutated caller-owned joint/goal records and the supplying phase sample's unlowered world geometry.

## @evidence contracts/development/implementation.md#principled-implementation

jumpPush.of supplies the existing heel/forefoot rocker and carried reaching leg; the exact end delegates to the shared jumpPushEnd producer where all entry-rate terms vanish.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

Write the shared terminal state or the existing interior pelvis, support and reaching goals.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

Preserves physical plant/contact and actual heel rule through release; flight independently starts from the achieved state rather than a fixed-angle substitute.

## @evidence contracts/development/implementation.md#efficient-algorithms

One actual hip-ancestry FK read, original heel-rule search and fixed goal writes remain per call. A supplied lazy workspace can share exactly unchanged hip dependencies with the following lowering; no alternative solver is introduced and speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Endpoint preparation and playback share jumpPushEnd; the phase sample supplies the same root/pelvis/yaw/progress already used by arm assembly. The optional synchronous getter is passed only to actual hip FK; jumpPushPosture owns the same workspace and lowering.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

Writes only the provided fresh records; its closure borrows immutable plan geometry and retains neither the optional query getter/reader nor an external handle.

# src/actions/jumpPush.ts#jumpPush.IPhase

## @evidence contracts/development/common.md#meaningful-documentation

Each field states its time, unit and unlowered phase provenance.

## @evidence contracts/development/design.md#principled-representation

Explicit values of the same authored phase curves keep equivalent same-time work separate from downstream physical fitting.

## @evidence contracts/development/design.md#minimal-and-owned-surface

Contains only the six quantities consumed by actual push posture and heel/reaching-goal construction.

## @evidence contracts/development/design.md#prohibited-design-shortcuts

No pose certification, contact result, cache identity or alternate support is represented.

# src/actions/jumpPush.ts#jumpPush

## @evidence contracts/development/common.md#meaningful-documentation

States the input and the result; the namespace and the law give the rules.

## @evidence contracts/development/implementation.md#principled-implementation

Each moved part follows a path at rest plus the entry rate times the engine's carried-rate term, carried no longer than its room affords; the heel rises by the walking stance's rule.

## @evidence contracts/development/implementation.md#clear-and-simple-structure

The carries, the pelvis and heading, the foot's rocker, then one writer.

## @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts

A foot rolling on its heel is laid flat before its heel rises, so the pivot never passes at a rate.

## @evidence contracts/development/implementation.md#efficient-algorithms

Three build-time heel-rule reads and every pitch trial remain. Two entry-arm tracks join fixed contact-pivot/socket, heel-rule, reaching-frame, quaternion-endpoint and spin-axis preparation; every phase computes original root/progress/carry/yaw/pelvis once for actual heel/arm/posture reads. Contact offsets keep their original fresh-MTP/borrowed-foot-socket ownership without repeated fixed rest/socket lookup. Speedup is unmeasured.

## @evidence contracts/development/implementation.md#reuse-equivalent-work

Existing heelRise, hipJoints, HumanFoot and quaternion owners prepare only body/side/contact/socket/heading or arc/axis prerequisites fixed by this push. The same current rocker selects its actual offset reader; changing geometry requires another plan. The three initial heel-rule observations borrow one synchronous FK source; current hips, pitches, rotation weights, spin angles and phase clocks still evaluate without a time/result cache.

## @evidence contracts/development/implementation.md#bound-retention-and-release-resources

The plan owns two three-scalar arm tracks, five yaw/pelvis coefficients and fixed pivot/socket/frame/arc/axis readers plus original inputs. The initial three-observation FK source ends locally, leaving two numeric coefficients; unused heel pivot/socket readers are absent without that rocker. No query history, FK reader or external handle enters retained closures.
