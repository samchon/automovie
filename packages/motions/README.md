# @automovie/motions

Human motion for AutoMovie. A coding agent composes what each person does from a vocabulary of actions, such as walk, approach, look, gesture, sit, touch, pick up, punch and guard. A performance places those compositions on the film clock and returns any person's pose at any second. Each action brings the hands, feet and body onto targets, scaled to the body that performs it, so one composition fits people of different stature and proportion.

Poses depend only on the composition, the seed and the bodies. An action can be interrupted mid-motion with `until`, and the performance refuses an interruption the action does not allow.

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

## Compose

`HumanChain.subject(id)` starts one person's chain. Every action of the vocabulary is a method of the chain that takes that action's own parameters, so an editor lists the actions and their parameters, and the type checker rejects a misspelt action, a parameter the action does not take and a value outside a closed set. `HumanActionName` lists the vocabulary with one line per action, and `IHumanActionParams` maps each name to its parameters.

| To | Write |
| --- | --- |
| Perform one action after another | `chain.sit({ seat }).rise()` |
| Name the action as data | `chain.act("sit", { seat })`, typed by the name |
| Interrupt the last action | `chain.walk({ to }).until({ share: 0.5 }).stand()` |
| Do two things at once with one body | `chain.walk({ to }).over((u) => u.handToFace({ task: "read" }))` |
| Run two people at once | `a.with(b)` |
| Join two people in a mutual action | `HumanChain.pair(a, b).handshake()` |
| Let another chain align to an action | Pass an anchor id as the last argument, `chain.punch(params, "jab")` |

With `over`, the last action carries the body and the actions put over it take only the parts they move: a walk keeps the pelvis and the legs and yields its arms, hands and head. An action's `overlay` and `yields` in `HUMAN_ACTIONS` say which actions can ride a carrier and what a carrier gives up. Two overlays that need one hand at one time are refused, naming both.

What an action is directed at is an `AutoMovieMotionTarget`: a region of another person, a region of the performer's own body, a named point of a prop, a point in the world, or none.

## Refusals

A composition the vocabulary cannot perform throws a `HumanRefusal` when the performance is built. It names the performer, the action and its occurrence, the axis at fault, the value given, what the axis accepts and one sentence saying what to change, as fields and in its message:

```ts
import { HumanRefusal } from "@automovie/motions";

try {
  new HumanPerformance(input);
} catch (error) {
  if (error instanceof HumanRefusal) console.log(error.kind, error.axis, error.value, error.feasible, error.fix);
}
// a.handshake#1 hand: handshake needs the right hand, which holds bottle since pickUp (pickUp); feasible: left; fix: put bottle down or hand it over first, or perform handshake with the free hand
```

Repair a refusal at the axis it names. `HumanRefusal.Kind` lists the classes with the place each is repaired. A refusal never depends on the seed, so a composition that plans under one seed plans under every seed.

## Verify

A composition that plans can still perform badly, so check a scene on three things before accepting it.

1. `HumanVerdicts.of(performance)` reads every physical bound that holds for any human motion, such as a hand passing into the body, a foot skating and a joint leaving its range, and places each finding on the performer and the action it happens in. Accept only a clean report.
2. `HumanSignature` reads what human-movement studies measure on a performer, such as the trunk's inclination, a joint's flexion, the centre of mass and the cadence. Assert the value your scene's act is known to have in a unit test.
3. Look at stills of the performance. Numbers do not show a pose that reads wrongly.

```ts
import { HumanSignature, HumanVerdicts } from "@automovie/motions";

const report = HumanVerdicts.of(performance);
if (!report.clean) throw new Error(HumanVerdicts.describe(report));

const reader = HumanSignature.of(performance, "a", body, 0);
const lean = HumanSignature.trunk(reader, 1.5) - HumanSignature.trunk(reader, 0);
```

## Entry points

| Export | Purpose |
| --- | --- |
| `HumanChain` | One typed method per action, `act` for an action by name, `until` to interrupt, `with` and `pair` for several people. |
| `HumanPerformance` | Places a composition and samples it: `pose`, `posture`, `bones`, `prop`, `segments` and `aim`. It refuses a composition that breaks a law or a rule you pass in. |
| `HumanRefusal` | The error a refused composition throws, with the axis and the fix. |
| `HumanVerdicts`, `HumanSignature` | The physical bounds of a performance, and the kinematic readings a unit test asserts. |
| `createHumanBody` | Derives a person's body from a canonical skeleton and contact profile. |
| `HUMAN_ACTIONS` | The table of action laws by name. |
| `HUMANOID_GAITS`, `HUMANOID_PROFILE` | The humanoid gait tables for the engine's gait motion. |

Props, additive layers such as breathing and gaze, and the kickboxing rules are exported from the package root. Each action's JSDoc names its source in the motor-control, gait or sports literature and marks the values that are provisional.
