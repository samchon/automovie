---
name: motion-laws
description: Holds the rules for designing and checking an action law that hold in any project, namely effector goals, declaration, variation, transitions, contacts, layers and verification. Use when designing, writing or verifying a law.
---

# Laws

A law is a function that, given a body and its inputs, produces the same motion every time. Each file below covers one part of designing or checking one; they name roles rather than this repository's packages and paths, because they ship to productions unchanged.

| Rule | Covers |
| --- | --- |
| [Effector goals](authoring.md) | Interaction as effector goals on targets: reach, balance, the path in time and the order of the fits. Every other rule depends on it |
| [Law design](declaration.md) | What every action declares: its plan, entry state, events, outcome and time scale |
| [Variation](variation.md) | Parameters, skill and seed, and draws that replay |
| [Transitions](transitions.md) | Pose as a function of time, declared cuts, inertialization and redirection |
| [Contacts](contacts.md) | Support frames, feet, held objects and contact between performers |
| [Layers](layers.md) | Gaze, breathing and other motion that runs over every action |
| [Verification](verification.md) | Bounded checks, body sweeps and frame review |
