---
name: motion
description: Programs deterministic scene performance, staging, camera, timing, and physical responses from researched laws. Use when authoring or changing laws, interactions, consequences or scene composition, assembling a motion hint, or upgrading a moving entity's representation.
---

# Programmed motion

Realize the requested performance through code, in the order below, because each step can only use what the one before settled. Read [project context](../production/profile.md), the final screenplay, its [research](../story/planning/research.md) and the installed engine APIs first. A single moving instance needs only its promised behavior; a whole-video commission needs its complete progression.

1. Confirm that every practice, official, crowd and camera style the scenes show has its [research](../story/planning/research.md), and write a missing study before any behavior, camera or staging code, because code written without one invents the practice.
2. Start from the low-cost entities that [entity work](../development/entities.md#coarse-first) builds.
3. Write the laws, interactions and consequences under the [behaviors contract](../contracts/development/behaviors.md), each unit-tested against its study's values through [testing](../development/testing.md). Contact and reactions use the installed engine through [physical feedback](physics.md).
4. Perfect every entity and motion module as isolated cases before composing the film: each technique against each defense and outcome, each movement, each official or bystander behavior, each fall and each entity state the screenplay uses. Compose the cases through the entity API in the [catalog film](../development/layout.md#source), one labelled interval per case, and review each case's interval in consecutive frames with a joint overlay. Capture it from several named views with `npm run capture` as the [README](../../../README.md#node-frame-capture) gives, adding `--events` at fast contacts. Review every still against the [performance study](../story/planning/research.md#performance-study) and the settings model sheets, repair each failing case at its module by cause and recapture it, and accept a case only when no still shows a flaw.
5. Compose the film from accepted cases through their entity API and the screenplay alone, one short contiguous segment scene by scene under [staging](staging.md) and [frame evaluation](timeline.md), with its entities, camera and any requested voice preview, and pass [segment review](segments.md) before extending from its accepted ending. A defect the film shows in a body, contact or behavior is repaired in its owning module and re-accepted in its case, never patched in a scene, because the scene only composes.
6. When the commission asks for more than identifiable figures, upgrade the selected entities under [entity work](../development/entities.md#coarse-first) once low-cost performance works, and recheck the contacts, deformation, visibility and timing the upgrade can change.

Use [retargeting](retargeting.md) for external clips or changed rigs and [method research](research.md) when choosing an algorithm. Hand scene output and its timing to [finishing](../production/finishing.md).
