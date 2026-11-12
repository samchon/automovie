# Extend the vocabulary

What to do when a beat needs a movement the motion vocabulary does not seem to have. Try each route in order and stop at the first that stages the beat, because every later route costs more and is checked less.

## 1. Parameters and seed

Read the nearest action's parameters again in the vocabulary's types. Most missing movements are an existing action with another target, hand, manner, count or hold, and a different performance of the same action is another seed.

## 2. A composition

Compose the movement from several actions under [compose](compose.md): a sequence, a cut, two people in parallel, a mutual join.

## 3. A layer

A movement that runs over other actions without interrupting them, such as an arm held around a partner during another act, is a layer on the performance. A layer may move only the body parts the active action leaves free, so it adds to an action and never fights it.

## 4. A gap in the vocabulary

A person's act that none of the routes above stages is a gap in the vocabulary. The installed vocabulary performs only its own actions, so a human action law written in the production cannot be performed by it. Hand the user the beat, its [performance study](../story/planning/research.md#performance-study) and what you tried under [a defect or a gap](../development/reuse.md#a-defect-or-a-gap), and continue with the work that does not depend on it.

## 5. What is not a person

Write a production law for what the vocabulary does not cover at all: an animal, a vehicle, a crowd moving as a mass, a camera or a light.

Confirm its [research](../story/planning/research.md) study first, because a law written without one invents the practice. Design it under the shared motion rules below, answer the [behaviors contract](../contracts/development/behaviors.md), and unit-test it against its study's values through [testing](../development/testing.md). Contact and reactions use the installed engine through [physical feedback](physical-feedback.md), and [method references](method-references.md) help choose an algorithm.

| Rule | Read when |
| --- | --- |
| [Effector goals](authoring.md) | Always: a law states movement as goals on targets, never as tuned joint angles |
| [Laws](laws.md) | Designing its plan, entry state, events, outcome and time scale |
| [Variation](variation.md) | It differs by parameters, skill or seed |
| [Transitions](transitions.md) | It changes action or target mid-motion |
| [Contacts](contacts.md) | It plants, grips or touches |
| [Layers](layers.md) | A layer runs over it |
| [Verification](verification.md) | It needs its bounded checks and frame review |
