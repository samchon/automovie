# Behavior statements

Contract: [behaviors.md](../behaviors.md).

## Studied laws

1. A composition names its installed actions and operators, and the screenplay facts it realizes. It studies only what [research](../../../story/planning/research.md#what-needs-a-study) requires; installed defaults and ordinary screenplay choices need no new derivation.
2. A new motion law performs an action the installed vocabulary cannot express, alone or joined with others. A vocabulary defect follows [reuse](../../../development/reuse.md#a-defect-or-a-gap), never a replacement law.
3. Every constant the behavior adds states its source or derivation, and none was tuned until a scene looked right. Calling a package default adds no new constant to derive.
4. A motion law's key poses, reach, contact surfaces and variation ranges come from its prior study. A pure rule or table cites the rules it adds and tests their classifications and boundaries against independent expectations.
5. A motion law scales duration and speed with the body under [time scale](../../../motion/laws/declaration.md#time-scale), and its tests compare results with the study's values.
6. A composition's tests check its own choice and coordination through the vocabulary's measures under [motion checks](../../../development/testing.md#motion-checks), without repeating the installed actions' internal physical tests.
7. A person's row or law is registered with the vocabulary under [vocabulary extension](../../../motion/laws/extension.md), so the vocabulary performs it.
8. A deliberately stylized departure states its factor and reason.

## Relational goals

1. A composition supplies the actual performer, counterpart target, outcome and synchronization to the installed action. A motion law's goals name effector, target, approach, window and whether the target is frozen or tracked, under [effector goals](../../../motion/laws/authoring.md#writing-a-goal).
2. No absolute coordinate, offset or tuned joint angle stands in for a goal.
3. A motion law declares and follows its [out-of-reach rule](../../../motion/laws/authoring.md#out-of-reach). A composition retains the installed action's rule, and neither silently clamps a target.
4. A motion law declares each contact's window and [support frame](../../../motion/laws/contacts.md#windows-and-support-frames); a composition uses its action's declared events and contacts.
5. An interaction passes the screenplay's decided outcome to the vocabulary. A new outcome law realizes that class from the studied rules rather than choosing a different result for the story.
6. The action's actual receipt establishes its outcome; a geometric miss stays a failure. A scheduled impact event alone establishes no contact or solved impulse.
7. A consequence such as sweat, a scuff, dust or a sound cue follows only from a computed outcome.
8. A motion law's unit tests assert each bound of [motion verification](../../../motion/laws/verification.md) that applies, each taken from the requirement or the study:
    - end-effector-to-target distance;
    - penetration;
    - slip;
    - range of motion;
    - balance;
    - continuity at cuts.
9. A motion law's unit tests run across bodies of several statures and proportions, and against the partners and props the scenes use. Compositions verify their own cases without taking ownership of that SDK test population. Pure rules and tables test their input domains; they need no body or effector when they plan no motion.

## Deterministic evaluation

1. A composition shares the film's schedule resolution; it does not resolve a new performance at every sample. Each pose is a pure function of the plan and film time, under [plan and time](../../../motion/laws/declaration.md#plan-and-time).
2. A motion law plans from the [entry state](../../../motion/laws/declaration.md#entry-state): displayed pose and velocity, planted feet and held objects. A composition preserves that entry through the vocabulary's operators.
3. A motion law declares its [events and decisive instant](../../../motion/laws/declaration.md#events-and-the-decisive-instant); a composition synchronizes on the installed actions' events.
4. A motion law declares its [cuts](../../../motion/laws/transitions.md#declared-cuts), windows and kinds. A composition uses those admitted cuts, and an unlisted cut is refused when the plan is built. Pure rules and tables declare their inputs without inventing motion events or cuts.
5. Variation draws from the installed packages' seeded generator, from a [stream](../../../motion/laws/variation.md#independent-draws) keyed by the film seed and stable identities, never from `Math.random` or a clock.
6. Variation stays within the domain its cited law bounds, and no seed, skill or member trait changes an outcome class or the count of members an outcome takes.
7. No result depends on history that only sequential playback builds or on a transient source. Exception: a stated limitation that names the consumer it affects.
