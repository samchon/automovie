---
name: motion
description: Defines how body motion is authored and verified in this repository, centred on effector goals, and owns the shared motion rules productions receive. Use when authoring or verifying body motion, the motions vocabulary, a human action law, an engine motion primitive or retargeting, or a motion capture verdict.
---

# Motion

This repository develops the motion vocabulary that productions install. A production composes its actions, writes a law of its own only for an action the vocabulary lacks, and reports a defect in a shipped action back here. So an action here is finished only when it works for any body and any partner without a production patching it.

Author every action by [effector goals](authoring.md), the rule the rest depends on. Then follow, as the work needs:

- [Transitions](transitions.md): pose as a function of time, declared cuts, inertialization and redirection.
- [Contacts](contacts.md): support frames, feet, held objects and contact between performers.
- [Verification](verification.md): bounded checks, body sweeps and frame review.

Those four files ship unchanged to productions, so they name roles rather than this repository's packages and paths. This file holds what applies only here.

## Here

- The [package boundaries](../project/SKILL.md#packages) say which package owns action content and which owns universal motion primitives, retargeting included. Each algorithm has one owner, so read the owning package before writing a helper; a second copy drifts from the first and leaves two bugs to fix.
- Verify human motion only on polygon men generated at Human parameters, across the bodies [verification](verification.md) requires, under [human](../human/SKILL.md).
- An action's study is the primary sources its law cites in its documentation, and each action family's sub-issue of the motions campaign, #3201, collects them with the family's scope and current state. Read the sub-issue before authoring and add the sources you use there, so the next author starts from them.
- The motions package's capture script runs the cases. A capture reports a failed verdict through its exit status, not a crash, and CI skips the tests that prepare polygon men, so run those locally.
