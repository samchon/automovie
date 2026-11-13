# Behavior statements

Contract: [behaviors.md](../behaviors.md).

## Studied laws

1. Key poses in the performer's own body frame, their timing, reach, contact surfaces, legal and illegal actions, outcome rules and variation ranges come from the cited study.
2. Every constant is a named law that states its source or derivation. None was tuned until a scene looked right.
3. The unit tests compare the behavior's results with the study's values.
4. The behavior was written after its study.
5. It performs no action the study does not record.
6. Durations and speeds scale with the body, under [time scale](../../../motion/laws.md#scale-time-with-the-body).
7. The action is not one the installed motion vocabulary performs, alone or joined with others. A vocabulary defect is reported under [installed packages](../../../development/reuse.md#installed-packages), never reimplemented.
8. A person's row or law is registered with the vocabulary under [extend](../../../motion/extend.md), so the vocabulary performs it.
9. A deliberately stylized departure states its factor and reason.

## Relational goals

1. Each goal names its end effector, target, approach, window and whether the target is frozen or tracked, under [end-effector goals](../../../motion/authoring.md#write-the-goal).
2. No absolute coordinate, offset or tuned joint angle stands in for a goal.
3. The behavior declares its [out-of-reach rule](../../../motion/authoring.md#out-of-reach) in its documentation, and the code follows that sentence. No target is clamped silently.
4. Each contact has a declared window and [support frame](../../../motion/contacts.md#windows-and-support-frames).
5. An interaction decides the outcome class from the composed intents by its research outcome table first.
6. Geometry then realizes and audits that outcome, so a geometric miss fails the audit instead of changing the outcome.
7. A consequence such as sweat, a scuff, dust or a sound cue follows only from a computed outcome.
8. The unit tests assert each bound of [motion verification](../../../motion/verification.md) that applies, each against a bound taken from the requirement or the study:
    - end-effector-to-target distance;
    - penetration;
    - slip;
    - range of motion;
    - balance;
    - continuity at cuts.
9. The unit tests run across bodies of several statures and proportions, and against the partners and props the scenes use.

## Deterministic evaluation

1. The behavior resolves its composition into a frozen schedule once, and each pose is a pure function of that plan and film time, under [plan once](../../../motion/laws.md#plan-once-evaluate-by-time).
2. It plans from the [entry state](../../../motion/laws.md#continue-from-the-entry-state): the displayed pose and velocity, the planted feet and what the hands hold.
3. It names its [events and decisive instant](../../../motion/laws.md#events-and-the-decisive-instant).
4. It declares the [cuts](../../../motion/transitions.md#declared-cuts) it admits, with their windows and kinds, and an unlisted cut is refused when the plan is built.
5. Variation draws from the installed packages' seeded generator, from a [stream](../../../motion/variation.md#independent-draws) keyed by the film seed and stable identities, and never from `Math.random` or a clock.
6. Variation stays within the domain its cited law bounds, and no seed or skill value changes an outcome class.
7. No result depends on history that only sequential playback builds or on a transient source. Exception: a stated limitation that names the consumer it affects.
