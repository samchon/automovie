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
| Join people in a mutual action | `HumanChain.mutual(HumanMutual.highFive, { one: a, other: b })`, or `HumanChain.pair(a, b).handshake()` |
| Sit on an object, or take it | `chain.sit({ seat: HumanObject.seat(chair, placement) })`, `chain.pickUp({ prop: "glass", handle: "body" })` |
| Let another chain align to an action | Pass an anchor id as the last argument, `chain.punch(params, "jab")` |
| Time an action to an instant of another action | `b.stand().flinch().sync({ of: "jab", event: "contact" })` |
| Time an action to speech or music | `a.stand().gesture({ kind: "wave" }).sync({ of: "dialogue", event: "accent", index: 2, align: "strokeStart" })` |
| Cut an action on a cue | `chain.stand().until({ of: "music", event: "beat", index: 4 })` |

`sync` puts one instant of the action (`align`, its start when absent) on the instant named, and starts the action as early as its body needs for that. Where the performer's previous action still runs then, it is cut there, which its cancel table must allow. Speech and music are cue tracks given to the performance; the screenplay and the score decide their seconds:

```ts
new HumanPerformance({
  seed,
  performers,
  cues: {
    dialogue: HumanCue.dialogue([{ from: 1, to: 4, accents: [2.0, 3.2] }]), // lineStart, accent, phraseEnd, lineEnd
    music: HumanCue.beats({ bpm: 96, count: 16 }), // beat, downbeat
  },
  composition,
});
```

With `over`, the last action carries the body and the actions put over it take only the parts they move: a walk keeps the pelvis and the legs and yields its arms, hands and head. An action's `overlay` and `yields` in `HUMAN_ACTIONS` say which actions can ride a carrier and what a carrier gives up. Two overlays that need one hand at one time are refused, naming both.

What an action is directed at is an `AutoMovieMotionTarget`: a region of another person, a region of the performer's own body, a named point of a prop, a point in the world, or none.

## Objects

An object says where a person meets it through its affordances: a seat, a handle, a surface. `HumanObject` gives the actions what they read of it, placed where the scene puts it, so no coordinate of the object is written by hand. The object is any model that declares affordances, such as one from `@automovie/archetypes`:

```ts
const chair = createSeat({ kind: "dining" }, "scene-3/chair-1");
const glass = createDrinkware({ kind: "glass" });

new HumanPerformance({
  seed,
  performers,
  props: [HumanObject.prop("glass", glass, { at: { x: 0.2, y: 0.74, z: 0.4 }, yaw: 0 })],
  composition: HumanChain.subject("a")
    .sit({ seat: HumanObject.seat(chair, { at: { x: 0, y: 0, z: -0.5 }, yaw: 0 }) })
    .pickUp({ prop: "glass", handle: "body" }).node,
});
```

A prop's affordance ids are also its named points, so `{ kind: "prop", subject: "glass", point: "lip" }` is a target. An affordance the object lacks is refused with the ones it has.

A hand keeps what it picked up until an action puts it down or hands it over. An action that works with the held object names it, and the object's own point then meets the target instead of the bare hand: `chain.pickUp({ prop: "glass", handle: "body" }).handToFace({ task: "drink", prop: "glass" })`. Any other use of a holding hand is refused, naming the free hand.

A seat too low to sit down on from standing is refused with the least height that fits. A seat higher than the feet reach the floor from is not refused: the body gets onto it, and the feet take its rests or hang.

## Mutual actions

A mutual action is one thing two or more people do together. It is stated once: its roles, and the action each role performs. `HumanChain.mutual` plays every chain of the cast, then has every role perform its part at once from one meeting, so no role chases another. An action that follows or meets a person who moves plans from where that person's actions take them, so compose that person's chain first. `HumanMutual` holds the vocabulary's (`handshake`, `highFive`, `handOver`); a production states its own as an `IHumanMutual` over its registered actions:

```ts
const toast: IHumanMutual<object, "host" | "guest"> = {
  name: "toast",
  roles: ["host", "guest"],
  act: (role, params, cast) => ({ name: "raiseGlass", params: { toward: cast[role === "host" ? "guest" : "host"] } }),
};
HumanChain.mutual(toast, { host: a, guest: b }, {}, "toast"); // anchored toast.host and toast.guest
```

## Layers

A layer adds to whatever a person does and takes no part of the body from an action: breathing, gaze, a sigh, a mood. Give the performance each person's layers, for the whole film or in a window between two instants:

```ts
new HumanPerformance({
  seed,
  performers,
  composition,
  layers: {
    a: [
      HumanBreath.layer(), // the whole film
      { layer: HumanGaze.layer([...]), from: 2, to: { of: "dialogue", event: "lineEnd" } },
      // Built from the window's seconds: she sighs when his wave ends.
      { from: { of: "bye", event: "end" }, layer: (w) => HumanAffect.layer([{ kind: "sigh", at: w.from }]) },
    ],
  },
});
```

An instant is a film second, or an event of an anchored action or of a cue track, as `sync` names it. A windowed layer comes in and goes out over its `fade`. Given an `anchor`, it has instants of its own (`onset`, `full`, `offset`, `end`) that a later layer's window names, and that an action is synced to or cut on when the layer's own window waits for no action. A layer that declares `channels` is refused in a window where one of the person's actions holds such a channel by a contact, and a layer's `apply` can read the action under it (`context.action()`).

## Extend

An action the vocabulary lacks is registered with it. Take the first of these that fits.

**A row** is a shipped action under a name of its own with some parameters fixed. It writes no motion: the action it is a row of plans it, so it is fitted, refused and checked as that action is, cuts like it and is carried over a walk where that action can be.

```ts
import { HumanActionRow, HumanChain, HumanPerformance, handToFace, touch } from "@automovie/motions";

// A touch with its target, effector, kind, hand and elbow fixed.
const salute = HumanActionRow.of("salute", touch, {
  target: { kind: "self", region: "templeRight" },
  with: "forefinger", // the hand continues the forearm, palm down
  kind: "hold",
  side: "right",
  elbow: "level", // the upper arm horizontal
});

// An entry a table lacks, given as the table's own row type.
const shave = HumanActionRow.of("shave", handToFace, {
  task: { region: "jawRight", effector, kind: "rub", count: 3, hold: 0.2, tangent: "up", head: 0, at: "atJaw" },
});

const Chain = HumanChain.extend({ salute, shave });
new HumanPerformance({
  seed,
  performers,
  laws: [salute, shave],
  composition: Chain.subject("a").walk({ to }).salute({ hold: 1.5 }).stand().node,
});
```

The chain method takes the parameters the row leaves open.

**A law** is for an action that owns what no shipped action plans: a change of base, an outcome between performers, a planner of its own. It is a record satisfying `IHumanActionLaw<Params>`: a `name`, the cuts it allows (`interrupts`, and `accepts` for what may be cut into it) and a `plan`, composed from the kernel the vocabulary uses (a clock, a base and part primitives passed to `composeAutoMovieMotionHumanAction`). It is registered the same way.

A registered name never replaces a vocabulary name, and registering changes no other action's motion.
## Lexicon

Named rows over the shipped actions, ready to register: emblems, habits, stances, gaits, pursuit, social acts, stage fighting, drills, blades, firearms, labour, riding and being carried. Each family is a namespace (`HumanEmblem`, `HumanGait` and so on), and `HUMAN_LEXICON` lists every family's rows as data. A row leaves open only what the scene decides: a target, a partner, a destination.

```ts
const { salute } = HumanEmblem;
const { slap } = HumanStageFight;
const Chain = HumanChain.extend({ salute, slap });
new HumanPerformance({
  seed,
  performers,
  laws: [salute, slap],
  composition: Chain.subject("a").salute().slap({ target: { kind: "person", subject: "b", region: "jawLeft" } }).node,
});
```
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
| `HumanChain` | One typed method per action, `act` for an action by name, `until` to interrupt, `over` for two things at once, `sync` to time, `with` and `pair` for several people, `extend` for registered actions. |
| `HumanActionRow`, `HumanCue` | A registered row of a shipped action; the cue tracks of speech and music. |
| `HumanMutual`, `HumanObject` | The vocabulary's mutual actions; an object's affordances as a seat or a prop. |
| `HumanPerformance` | Places a composition and samples it: `pose`, `posture`, `bones`, `prop`, `segments` and `aim`. It refuses a composition that breaks a law or a rule you pass in. |
| `HumanRefusal` | The error a refused composition throws, with the axis and the fix. |
| `HumanVerdicts`, `HumanSignature` | The physical bounds of a performance, and the kinematic readings a unit test asserts. |
| `createHumanBody` | Derives a person's body from a canonical skeleton and contact profile. |
| `HUMAN_ACTIONS` | The table of action laws by name. |
| `HUMANOID_GAITS`, `HUMANOID_PROFILE` | The humanoid gait tables for the engine's gait motion. |

Props, additive layers such as breathing and gaze, and the kickboxing rules are exported from the package root. Each action's JSDoc names its source in the motor-control, gait or sports literature and marks the values that are provisional.
