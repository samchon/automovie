---
name: motion-laws
description: Holds the rules for designing and checking an action law that hold in any project, namely effector goals, declaration, variation, transitions, contacts, layers and verification. Use when designing, writing or verifying a law.
---

# Laws

A law is a function that, given a body and its inputs, produces the same motion every time. Each page below covers one part of designing or checking one. Those pages ship to productions unchanged, so they name roles rather than this repository's packages and paths; this router stays in the repository.

| Read | For |
| --- | --- |
| [Effector goals](authoring.md) | Interaction as effector goals on targets |
| [Law design](declaration.md) | What every action declares: its plan, entry state, events, outcome and time scale |
| [Variation](variation.md) | Parameters, skill and seed, and draws that replay |
| [Time, transitions and layers](transitions.md) | Pose as a function of time, declared cuts and layers |
| [Contacts](contacts.md) | Support frames, feet, held objects and contact between performers |
| [Verification](verification.md) | Bounded checks, body sweeps and frame review |

Effector goals covers reach, balance, the path in time and the order of the fits, and every other rule depends on it. Time, transitions and layers also covers inertialization and redirection, and its layers, such as gaze and breathing, run over every action.
