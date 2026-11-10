---
name: motion
description: Defines how body motion is authored and verified in this repository, centred on effector goals, and owns the shared motion rules productions receive. Use when authoring or verifying body motion, the motions vocabulary, a human action law, an engine motion primitive or retargeting, or a motion capture verdict.
---

# Motion

This repository develops the motion vocabulary that productions install. A production composes its actions, writes a law of its own only for an action the vocabulary lacks, and reports a defect in a shipped action back here. So an action here is finished only when it works for any body and any partner without a production patching it.

Author every action by [effector goals](authoring.md), the rule the rest depends on. Then follow, as the work needs:

- [Transitions](transitions.md): time purity, declared cuts, inertialization and redirection.
- [Contacts](contacts.md): support frames, feet, held objects and contact between performers.
- [Verification](verification.md): capture verdicts, body sweeps and frame review.

Those four files ship unchanged to productions, so they name roles rather than this repository's packages and paths. This file holds what applies only here.

## Owners

- The [package boundaries](../project/SKILL.md#packages) place action content in `motions` and universal motion primitives in `engine`.
- Retargeting a recorded or generated clip onto the canonical humanoid rig belongs to `engine` (`retargetHumanoidMotion`, with `preserveRetargetContacts` and `validateRetargetContacts` keeping its contacts); [contacts](contacts.md) and [verification](verification.md) judge the result like any authored motion.
- Each algorithm has one owner. Read the owning package's exports before writing a helper; a second segment distance or angle wrap drifts from the first and leaves two bugs to fix.

## Bodies, research and captures

- Verify human motion only on the polygon man at Human parameters through the canonical skeleton path, under [human](../human/SKILL.md).
- Each action family keeps its scope, current state and primary references in its sub-issue of the motions campaign, #3201. Read that sub-issue before authoring, and add the sources you use there, so the next author starts from them.
- Captures run with `pnpm --dir packages/motions node:capture -- --case <key>`. A key can expand into several cases, such as one per gesture or per body, and each case writes `packages/motions/media/capture/<case>/manifest.json` with its stills and verdicts. The command exits with code 1 whenever a verdict fails, so pnpm's lifecycle error after the manifests are written reports a failed verdict, not a crash.
- The test workflow (`.github/workflows/test.yml`) excludes the tests that prepare polygon men by name, so run them locally with `--include`.
