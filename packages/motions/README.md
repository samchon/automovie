# @automovie/motions

Everyday human motion for AutoMovie: action laws that bring a person's hands, feet and body onto targets, scaled to the measured body, seeded, and interruptible. An authoring agent chains actions per person (walk, approach, look, gesture, sit, pick up, hand over, punch, guard…), and a performance places them on the film clock and answers any person's pose at any second. The same chain, seed and bodies always produce the same poses.

Use it to author human staging and motion that a renderer or video diffusion takes as hints. Laws read every distance from the body they move, so one chain fits any stature from 1.45 m up.

## Use

```bash
npm install @automovie/motions
```

```ts
import { AutoMovieHumanCanonicalBody } from "@automovie/human";
import { HumanChain, HumanPerformance, createHumanBody } from "@automovie/motions";

// A canonical rig and its contact profile, prepared from Human parameters.
const prepared = AutoMovieHumanCanonicalBody.prepare(params, { mass: 72, id: "a" });
const body = createHumanBody(prepared.skeleton, prepared.profile);

const performance = new HumanPerformance({
  seed: "scene-12",
  performers: [{ subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } }],
  composition: HumanChain.subject("a").walk({ to: { x: 0, y: 0, z: 4 } }).stand({ seconds: 2 }).node,
});
const pose = performance.pose("a", 1.5); // a canonical pose of every rig bone
```

## Surface

| Export | Owns |
| --- | --- |
| `HumanChain` | The fluent chain: one method per action, `until` cuts, `with` for simultaneous people |
| `HumanPerformance` | Places a composition, checks every cut against the laws' interrupt tables, and samples poses, bones, props and aims |
| `HUMAN_ACTIONS`, `HumanActionName` | The closed table of action laws by name |
| `IHumanActionLaw`, `IHumanActionPlan`, `IHumanActionContext` | The law contract: a plan of duration, events, contact windows, holds and a posture per second |
| `IHumanPosture`, `resolveHumanPosture` | Effector goals (root, joints, limb points, bend hints, planted contacts) and their IK resolution |
| `IHumanLayer` | Additive layers over every action, such as breathing and gaze |
| `IHumanProp` | Props with prop-local points, affordances and colliders, carried by grip windows and holds |
| `HumanSkill` | Proficiency axes and the seeded variability streams |
| `HUMANOID_GAITS`, `HUMANOID_PROFILE` | The humanoid gait tables the engine's gait oscillator binds |

Each law's JSDoc states its source in the motor-control, gait or sports literature and marks provisional values.
