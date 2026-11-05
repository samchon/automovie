---
name: motion
description: Programs deterministic scene performance, staging, timing, and physical responses. Use when authoring or changing animated behavior, assembling a motion hint, or upgrading a moving instance's representation.
---

# Programmed motion

Realize the requested performance through code, in the order below, because each step can only use what the one before settled. Read [project context](../production/profile.md), the final screenplay, the [performance study](../story/planning/research.md#performance-study) and the installed engine APIs first. A single moving instance needs only its promised behavior; a whole-video commission needs its complete progression.

1. Start from the low-cost representation that [asset work](../development/assets.md#coarse-first) builds.
2. Build the motion library before any scene: one reusable, data-driven module per movement family in `src/motion/`, under the [motion contract](../contracts/development/motion.md), unit-tested against the study's values through [testing](../development/testing.md) and watched in the moving Viewer with a joint overlay. Contact and reactions use the installed engine through [physical feedback](physics.md).
3. Stage one short contiguous segment through the real scene host under [staging](staging.md) and [frame evaluation](timeline.md), with its assets, performance, view and sound, transcribing the screenplay's choreography as data the modules execute; the film composes modules and never hand-tunes a shot. Pass [segment review](segments.md) before extending from its accepted ending, so defects do not spread through unwatched motion.
4. Once low-cost performance works, upgrade selected objects to the commissioned detail within measured budgets, and recheck the contacts, deformation, visibility and timing the upgrade can change.

Use [retargeting](retargeting.md) for external clips or changed rigs and [method research](research.md) when choosing an algorithm. Hand scene output and its timing to [finishing](../production/finishing.md).
