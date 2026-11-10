# @automovie/motions

Human motion for AutoMovie. A coding agent chains actions per person, such as walk, approach, look, gesture, sit, pick up, punch and guard. A performance places those chains on the film clock and returns any person's pose at any second. Each action is a law that brings the hands, feet and body onto targets, scaled to the body that performs it, so one chain fits people of different stature and proportion.

Poses depend only on the chain, the seed and the bodies. An action can be interrupted mid-motion with `until`, and the performance refuses an interruption that the action does not allow.

## Use

The package needs Node.js 22.23.2 or later, and the body comes from `@automovie/human`.

```bash
npm install @automovie/motions @automovie/human
```

```ts
import { AutoMovieHumanCanonicalBody, type IAutoMovieHumanParameters } from "@automovie/human";
import { HumanChain, HumanPerformance, createHumanBody } from "@automovie/motions";

declare const parameters: IAutoMovieHumanParameters;

// The canonical skeleton and contact profile of one person.
const prepared = AutoMovieHumanCanonicalBody.prepare(parameters, { mass: 72, id: "a" });
const body = createHumanBody(prepared.skeleton, prepared.profile);

const performance = new HumanPerformance({
  seed: "scene-12",
  performers: [
    { subject: "a", body, at: { x: 0, y: 0, z: 0 }, yaw: 0, proficiency: { level: "trained" } },
  ],
  composition: HumanChain.subject("a").walk({ to: { x: 0, y: 0, z: 4 } }).stand({ seconds: 2 }).node,
});

const pose = performance.pose("a", 1.5);
```

Positions are world metres on the floor, `yaw` is degrees about +Y with 0 facing +Z, and `proficiency` changes timing, path and balance without widening any joint's range.

To see that pose, draw `prepared` as a polygon man; the [Human README](../human/README.md#polygon-man) shows how, with the same object named `body`.

## Entry points

| Export | Purpose |
| --- | --- |
| `HumanChain` | One method per action. `HumanChain.subject(id)` starts a chain, `until` interrupts an action, and `with` runs another person's chain at the same time. |
| `HumanPerformance` | Places a composition, one chain or chains joined by `next` and `with`, and samples it: `pose`, `posture`, `bones`, `prop`, `segments` and `aim`. It refuses a composition that breaks a law or a rule you pass in. |
| `createHumanBody` | Derives a person's body from a canonical skeleton and contact profile. |
| `HUMAN_ACTIONS` | The closed table of action laws by name. |
| `HUMANOID_GAITS`, `HUMANOID_PROFILE` | The humanoid gait tables for the engine's gait motion. |

Props, additive layers such as breathing and gaze, and the striking and kickboxing actions are exported from the package root. Each law's JSDoc names its source in the motor-control, gait or sports literature and marks the values that are provisional.
