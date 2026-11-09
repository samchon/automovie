# Library API for film owners

The shared library under `src/entities`, `src/laws`, `src/interactions` and `src/consequences`. A scene chains capabilities; a film orders scenes and mounts them with `StageMount`. Read the JSDoc of each module for its laws and limits. Last updated 10:05: transfer admission and the rear-seat approach, `hover`, `escort`, the stop of play and the Bludger rally, pitch flight lanes, sprint and quick guide, the impact-started cap, `sameGap`, walks around people and the overlap audit, gestures over a walk, `liftChin`, gaze on a hand, the hand on the knee, the station outside the corridor window.

## Figures

Students are drawn as the production's block mannequin (rigid segments solved by two-bone limb fitting, dressed in the coarse uniform layers, hair and Harry's glasses), because Human calibration currently throws in the head law for every parameter set (reported to the coordinator). The API will not change when Human returns.

## A film in four steps

```ts
import { AutoMovieComposition } from "@automovie/engine";
import { VerticalCamera } from "../../../entities/cameras/vertical-camera/VerticalCamera";
import { carinaMalfoy } from "../../../entities/cast/student/carinaMalfoy";
import { harryPotter } from "../../../entities/cast/student/harryPotter";
import { Student } from "../../../entities/cast/student/Student";
import { InvitationNote } from "../../../entities/props/invitation-note/InvitationNote";
import { SideCourtyard } from "../../../entities/sets/side-courtyard/SideCourtyard";
import { StageMount } from "../../../interactions/staging/StageMount";
import { StageTime } from "../../../interactions/staging/StageTime";

// 1. Cast and stage (a film's thin stage file).
const set = new SideCourtyard();
const carina = new Student(carinaMalfoy), harry = new Student(harryPotter);
const note = new InvitationNote(), camera = new VerticalCamera();

// 2. A scene: a few chained lines inside StageTime.scene(id, start, end, ...parts).
const s01 = StageTime.scene("s01", 0, 15,
  carina.enter("startingPlace", { facing: "bench.centre", holds: { right: note.id } })
    .walkTo("bench.centreFront", { pace: "hesitant" })
    .offer(note, "bench.centre", { height: "seatedChest" })
    .withdraw(),
  harry.enter("passage", { facing: "westGap" }),
  camera.wide([carina], { start: 0, from: "eastEnd" }),
);

// 3. The film's composition: scenes in order.
const composition = AutoMovieComposition.sequence(s01 /*, s02, s03 */);

// 4. Mount in create(): works in Node capture and in the Viewer.
const mounted = StageMount.mount({ set, students: [carina, harry], props: [note], camera, composition, duration: 60 });
return { scene: mounted.scene, camera: mounted.camera, seek: mounted.seek, dispose: mounted.dispose };
```

A prop target (`bend(note)`, `pickUp(note)`, `lookAt(crane)`, `walkTo(cup)`) resolves wherever the prop is at that second: held (its holder's hand), resting, fallen or flying.

Interactions: `sharedReach(a, b, prop, { start, until?: "contact" | "lean", hold? })` (from `src/interactions/everyday/sharedReach`) bends both from the same second until the heads meet, or into a lean of 0.45 of the hinge, then straightens both. `sameGap(mover, blocker, { start, side? = "right", metres? = 0.4, pace? = "hurried" })` (from `src/interactions/everyday/sameGap`): the blocker sidesteps into the mover's path and the mover stops a hand's breadth from him (0.32 m between pelvis points, `distance: "faceToFace"`); follow it with `blocker.giveRoom(mover)`, whose palms rise only as the step back begins.

Every student must `enter` before acting (at t = 0 by default; `enter` takes no time). A student not yet entered is not drawn, so a person "out of view" can simply enter later with `{ start: 15 }` on the following step, or enter at an out-of-view place such as `passage`.

## Timing and anchors

- Every capability takes `{ start?: number; contact?: number; anchor?: string }`. `start` holds the performer still until that absolute film second; `contact` makes the action's own contact instant (the grip closing, the hand opening, the crane caught, the hand at the forehead) land exactly on that second. A second the composition has already passed throws with the reached time in the message.
- `StageTime.scene(id, start, end, ...parts)` starts the parts at `start` and holds every single-subject part until `end`; it also marks the scene for Carina's first-offer habit.
- `StageTime.until(seconds, ...subjects)` holds subjects until a second; `student.until(seconds)` ends a chain there.
- Parts of a scene run in parallel; within a chain, intents run in sequence. Relations (walk to a person, offer to a person, receive from a person) read the counterpart where it really is when the action's own motion begins (after a `start` or `contact` lead): the stage resolves the composition repeatedly, until no entry's timing or end point moves (at most eight passes), so walk order and chained relations do not matter. A walk to a person ends where that person is on arrival. A walk longer than 0.6 m goes forward and turns to its end facing over the last step (into a seat behind as well); a move begun from a bend straightens over its first 0.5 s. A walk whose straight line would pass within 0.5 m of a person on the ground bends around that person at 0.6 m (not the person it walks to). `mounted.findings` (and `StageMount.collisions(performance, duration)`) reports every time two people on the ground come closer than 0.3 m, such as `"carina and harry overlap at 54.1 s (0.12 m apart)"`.

## Queries for schedule tests

```ts
const { schedule, performance, props } = StageMount.resolve({ set, students, props: [note], composition });
schedule.entries.filter((e) => e.subject === "harry" && e.intent.capability === "receive")[0].contact; // contact second
schedule.entries.find((e) => e.intent.anchor === "scene:s02")!.end;  // a scene's start
props.owner("note", 40);       // "harry" | "carina" | null (resting or falling)
performance.posture("carina", 12.5); // IBodyPosture, or undefined before entering
performance.position("harry", 30);   // floor point, or seat point when riding
```

Entry `outcome` carries law decisions: `"withdrawn"` for a habit-withdrawn offer, `"buckled"` for a receive with `pull`, `"transferred"` or `"not-admitted"` for a `transfer`.

## Students

`new Student(carinaMalfoy)`, `new Student(harryPotter)`, `new Student(practicePlayers["G-K"])` (twelve ids: `S-C1..3`, `S-B1`, `S-B2`, `S-K`, `G-C1..3`, `G-B1`, `G-B2`, `G-K`). Each capability below is callable on the student or on any chain (`carina.walkTo(...).sit(...)`). `Where` is a place name, a student or prop, or a world point.

### Everyday

| Capability | Intent and law |
| --- | --- |
| `enter(where, { facing?, heading?, seat?, holds?: { right?: propId, left? }, pockets?, riding? })` | Places the student at t (0 by default); `seat: true` on a seat place starts seated |
| `hold(seconds)`, `until(seconds)` | Stays as is, breathing |
| `say(words, { seconds? })` | A silent entry with the words (2.5 words/s by default); the body keeps its posture |
| `walkTo(where, { pace?: "hesitant" \| "ordinary" \| "hurried" \| "run", facing?, distance?: "conversation" \| "handing" \| "faceToFace" \| metres, at?: "behindLeftShoulder" \| "behindRightShoulder" \| "front", offset?: { forward, left }, hands?: "pockets", mood?: "embarrassed", gesture?: { kind: "touchForehead" \| "pushGlasses", hand?, after? = 0.3 } })` | Whole steps (gait law); to a person stops at 1.0 m, 0.7 m or 0.32 m, or at `offset` in that person's own frame (e.g. `{ forward: -0.6, left: 0.5 }` = behind her left shoulder); to a seat place stops with the calves at the seat edge, back to the seat; `facing` keeps facing a target (walks backward if needed); `gesture` lays a forehead touch or glasses push over the walk from `after` seconds into it without changing its length |
| `turnTo(where)` | One or two steps in place |
| `step("back" \| "forward" \| "left" \| "right", metres, { away?, quick? })` | Steps without turning; `away` steps straight away from a person |
| `sit(seat)`, `stand()` | 2.0 s / 1.6 s; seat places: corridor `bench.left`, `bench.right`; courtyard `bench.centre` |
| `shift("left" \| "right", metres = 0.5)` | Seated slide, 1 s per 0.6 m |
| `lookAt(where \| null, { part?: "head" \| "leftHand" \| "rightHand" })`, `lookBack(where)` | Head (and up to 0.6 rad of trunk twist) to a target; a person is looked at in the face, or at the named hand wherever it is that instant; null looks ahead |
| `liftChin({ seconds? = 1 })` | The chin lifts about 10° with the shoulders square, held, eased in and out over 0.2 s |
| `offer(prop, to, { hand?, height?: "chest" \| "seatedChest" \| "waist" })` | Hand to the handover point (people) or toward a place; Carina's first personal offer to Harry per scene is withdrawn by habit (outcome `withdrawn`) |
| `withdraw({ hand? })`, `drawBack({ hand? })` | Hand back to the chest |
| `receive(prop, from, { hand?, pull? })` | Reach to the giver's held prop and close (contact); `pull` tugs once (outcome `buckled`) |
| `release(prop)` | Opens the hand (contact at the start); the prop passes to a receiver whose grip closed earlier, else falls |
| `openPalm(toward, { hand? })`, `lowerHand(hand, { to?: "side" \| "knee" })`, `pocketHands(hands?)` | Palm up held out; lower to the side, or seated onto the top of the knee (a held note then rests on the knee under the hand); hands into pockets |
| `hide(prop)` | Right hand sweeps the prop behind the right hip |
| `drop(prop)` | Lets go: a sheet flutters down at 1.5 s/m |
| `pickUp(prop \| [propA, propB])` | From the floor (bend, 2 s, contact 1 s) or from the sill (1.2 s); two props take one per hand |
| `putDown(prop, place)` | Lays it at a place such as `sill.note` |
| `unfold(prop, { until?: "half" \| "open" })`, `fold(prop)` | Crane forms `half`, `open`, `folded` |
| `raise(prop)`, `drink(prop)`, `read(prop)` | Cup lifted; a sip lowers the tea; paper up with head down |
| `launch(crane, toward)`, `reachAfter(crane)`, `catch(crane, { hand? })` | Crane glides at 1.2 m/s; `catch` closes when it arrives (its contact is computed; pin the launch's `start` to place it) |
| `touchForehead({ hand? = "left" })`, `pushGlasses({ hand? = "right" })` | Settings habits as explicit gestures (1.6 s, contact 0.3; 0.8 s, contact 0.4) |
| `giveRoom(from, { metres? = 0.5 })` | A half-metre step straight away from that person; the forearms rise in front of the chest, elbows bent and low, palms toward the person, as the step begins |
| `bend(toward, { depth? = 1, meet? })`, `straighten()` | Hip hinge toward a floor point or a prop; `depth < 1` stops in a lean; `meet: person` bends exactly as far as both heads meet halfway (outcome `met`) |

### Duel

`onGuard(opponent)`, `advance(opponent, steps)`, `retreat(opponent, { steps?, to? })`, `circle(opponent, "left" \| "right", { steps?, to? })`, `jinx(opponent, { aim?: "wand-hand" \| "wand-shoulder" \| "body" })`, `disarm(opponent)`, `deflect("floor" \| where)`, `shield(seconds)`, `levitate(prop, to)`, `grip(of, { part?: "wrist" \| "forearm" })` (the hand follows the gripped wand hand every instant until `letGo()`), `turnUnder()`, `letGo()`, `runAt(where, { distance?, wand?: "low", pace?: "run" \| "sprint" })` (2.5 m/s, or 3 m/s at `sprint`, the run-in study's fast end; wand tip down below the target's chest from the first step), `guidedTo(place, { steps?, quick?, start })` (the guided partner, paired with `guideAside` at the same start), `parry(of)`, `guideAside(partner, to, { steps?, quick? })` (0.6 m in 0.4 s per step, or 0.7 m in 0.35 s when `quick`), `wand("hand" \| "pocket" \| "low" \| "up")`. Timing from `DuelLaw` (aim 0.25 s, gesture 0.2 s, contact at their end; streak 5 m/s; shield forms 0.25 s Carina / 0.4 s Harry). Outcomes are decided rule-first by `DuelLaw.outcome` (deflected when the defender's `deflect` contact falls while the streak is in flight and the distance allows reaction plus sweep; blocked by a standing `shield`; otherwise hit or disarmed). Draw them by passing `effects: StageEffects.duel({ cap, seed })` (from `src/consequences/effects/StageEffects`) to `StageMount.mount`: streaks (a deep-blue jinx bar with a white core at both tips, scarlet disarm, 5 m/s; they read over the sky) with impact flashes, shield ovals that grow, stand and fade, and the `FallingMasonry` cap. The cap (`new FallingMasonry("cap")`, add it to `props`) fails at the first jinx impact within 0.35 m of `crackedFillet` (send the deflection there with `deflect("crackedFillet", { contact })`), or at `cap.fail({ tipping, start })` when pinned with `start`; an unpinned `cap.fail({ tipping })` only sets the tipping and waits for that impact. Tipping 0.8–1.5 s (default 1.2), free fall 0.74 s, flat landing south of the upright, three seeded fragments at 2–4 m/s (toward a shield within 2.5 m of the landing that is formed by the time they arrive, kept within 40° of the direction away from the upright) that stop on a shield standing as they reach it, dust. `mounted.findings` lists anyone inside the danger region when the cap reaches head height.

### Flight and Quidditch

`mount(broom)`, `fly(route, { speed?, lean? })` (smooth route through places or points, banking by tan φ = v²/(g r)), `reach(target, { hand?, close? })`, `slip({ hang? })` (hangs, broom sinks 0.4 m/s), `swingArm()`, `offerRear(rider)`, `transfer(onto)` (3.9 s, five phases), `pass(to)`, `strike(ball, toward)` (0.5 s, contact 0.3), `stopPlay()` (the right arm goes straight up and stays up until `reach(..., { close: true })`), `hover({ facing? })` (brakes at 3 m/s² along the heading to rest, turning the broom to face a person or place), `escort(rider, { seconds, distance? = 3.5, side? = "left" })` (flies to a station beside a moving rider at 12 m/s and keeps it, matching heading, speed and height). Through any flight action's `start`/`contact` lead the broom flies on as before. Riding or hanging, `touchForehead`, `pushGlasses` (the named hand), `stopPlay` (right arm straight up), `swingArm`, `pass` and `strike` are drawn over the rider; `reach` opens the hand toward the target straight from the shoulder, at most an arm's length, riding with the broom, until `reach({ close: true })`; `lookAt` turns a rider's head (within 80°). Bank limits: Harry 60°, Carina 50° (profile `bank`), 30° once a second rider is aboard; Carina lowers her chest at 12 m/s or more. The host's broom dips 0.75 m under a second rider and recovers over 2.5 s, carrying its rider. A rider's broom never stops: non-`fly` steps carry it on at its speed. `enter(place, { riding: "broom-id", heading })` starts seated in flight at an air place (hovering until a `fly`). Any non-`fly` step (hold, until, say, gestures, reach, slip) carries the broom on at its speed and climb for the whole step, lead included. `offerRear(rider)` brings the host in wide of the hanging rider (a metre out and a little low behind his torso) and ends on his free-hand side with her seat ahead of his chest, her shaft 0.4 m beside his torso at lower-chest height, so the rear section is within reach of his free hand; she then matches his speed and sink. `transfer(onto)` is admitted (outcome `"transferred"`) only when, as the free hand starts to close, the shafts are parallel within 10°, the speeds within 0.5 m/s and the host's rear section within 0.5 m of his free hand; otherwise it is `"not-admitted"` and he keeps hanging from his own broom. Admitted, he hangs from his own broom through the lead and the first phase while the free hand closes on the rear section; through the swing the other hand lets go and joins it and he swings across to hang below it two-handed; the chest comes over the shaft; the leg comes over into the rear seat 0.5 m behind the host's live broom; the released broom flies on riderless (keeps heading, slows 1 m/s², sinks 0.3 m/s). Props: `new Broom("broom-<id>", house)` for every rider (drawn under its rider automatically), `new QuidditchBall("snitch" | "quaffle" | "B-1", kind)` with `ball.fly(route, { speed, start })`, `new BeaterBat(id)` (hold via `enter(..., { holds: { right: id } })`). `PracticePlay.compose({ set: pitch, players, from, to, seed, quaffle?, bludgers?, bats?: { "G-B1": "bat-G-B1", ... }, passes?, stop? })` returns the twelve players' and the balls' composition: seeded straight stretches round each `station.<id>`; Quaffle passes every 2–5 s or at your `passes: [{ from, to, at }]`, and the last receiver keeps it at the chest; the Bludgers rally between the Beaters, each swing (`strike`) meeting its Bludger at the bat where the Beater's flight carries him, the Bludgers flying 8–12 m/s between bats. `stop: { at, toward, by?, strike?, watch?, rescuer?, side? }`: Beater `by` bats Bludger `strike` toward the place `toward` at second `at`, turns his head to the rider `watch` and has his arm up within 1 s, then hovers facing that rider; everyone else turns the head to `watch` at once and brakes to a hover facing it; `rescuer` flies to 3.5 m beside `watch` and escorts it to the end (`escort`). Without `watch`, everyone faces `toward` and the rescuer flies to 3.5 m short of it.

## Sets (places, seats, camera stations)

World metres, +Y up; each class's JSDoc states its frame.

| Set | Places | Stations |
| --- | --- | --- |
| `TrainingCourt` | `centre`, `centre.middle`, `centre.southWest`, `centre.northEast`, `centre.south`, `supportZone`, `underCap`, `westLane`, `southApproach`, `northWall`, `baseCorner`, `capFrontEdge`, `crackedFillet`, `wallWestEnd`; `inDanger(point, radius)` | `southApproach`, `south`, `southWest`, `southEast`, `east`, `west` |
| `SchoolCorridor` | `bench.left`, `bench.right` (seats), `bench.frontEdge`, `bench.frontRightCorner`, `bench.rightEnd`, `sill.rightEnd`, `sill.cupA`, `sill.cupB`, `sill.note`, `rightEndStanding`, `frontRoute`, `openFront`, `corridor` | `front`, `openFront`, `rightEnd`, `leftEnd`, `window`, `outsideWindow` (beyond the window wall, looking in through the pane at the sill; not pulled back inside the walls) |
| `SideCourtyard` | `bench`, `bench.centre` (seat), `bench.centreFront`, `benchFront`, `startingPlace`, `clearPaving`, `westGap`, `westGap.middle`, `passage` (out of view), `openSouth` | `eastEnd`, `openSouth`, `south`, `southEast`, `southWest` |
| `QuidditchPitch` | `centre`, `middleThird`, `westGoalFront`, `eastGoalFront`, `seekersHeight`, `seekersHeight.north`, `seekersHeight.south`, `westSouthGap`, `eastSouthGap`, `eastSouthGap.north`, `eastSouthGap.south`, `eastSouthPost.hookInside`, `eastSouthPost.hookOutside`, `eastRunoff`, `eastRunoff.chase`, `eastRunoff.far`, `eastPost.south\|middle\|north`, `eastHoop.*`, `westPost.*`, `westHoop.*`, `station.S-C1` … `station.G-K`; flight lanes: `seekers.north.start\|scan\|race\|approach\|dive`, `seekers.south.start\|scan\|race\|level\|approach\|dive`, `hook.north`, `hook.south`, `eastSouthPost.hookInsideOut`, `eastSouthPost.hookOutsideOut`, `runoff.north\|south`, `climb.north\|south`, `chase.north\|south`, `dance.north\|south`, `dance.northAhead`, `under.north`, `tandem.level\|out\|turn\|back\|home`, `snitch.waits\|gap\|hook\|hookOut\|runoff\|climb\|ahead\|first\|away\|beyond\|atNorthRider\|pastShoulder\|climbing\|high\|gone\|glint`, `keeper.runoff\|short\|alongside\|home` (air places carry their height; values in the pitch record's flight lanes) | `aboveWestGoalFront`, `behindEastHoops`, `southTouchline`, `eastRunoffSouth` |

## Props

`new PaperCrane("crane")`, `new TeaCup("cupA")`, `new InvitationNote("note")`, `new Wand("wand-carina", "hawthorn")`, `new Wand("wand-harry", "holly")`. A prop starts in a hand through `enter(..., { holds })`, or at a place through `StageTime.rest(cupA, "sill.cupA")` (optionally a third argument, the absolute second) placed among the scene's parts. `new FallingMasonry("cap")`, `new Broom(id, house)`, `new QuidditchBall(id, kind)`, `new BeaterBat(id)`. Shields are drawn by the duel effects from `shield()` intents, not a prop.

## Camera

`new VerticalCamera()` (50° vertical lens on 720 × 1280). Every shot lasts until the next shot starts; give each its `start`. Distances fit the subjects' spread across the frame as seen from the shot's bearing, then move out until every subject's projected body (whole body for `wide` and `full`, shoulders for `medium`) sits inside 6% side margins; a station gives the bearing (and, for `wide`, the lens height), staying inside the set's walls unless the station itself stands outside them. When a wall pulls a lone subject's lens in close, the bearing swings (up to half a turn) to where the room lets it stand back. Two or more subjects without `screen` read left to right in the order given. A single-subject push, pull or follow keeps the camera's current bearing. A `hold` frames its subjects over the whole shot, so later arrivals stay in frame.

| Capability | Framing |
| --- | --- |
| `wide(subjects, { start, from?: station, height? })` | Wide; with a station the lens stands at that station and aims at the subjects |
| `twoShot([left, right], { start, from?, size?: "full" \| "medium", height?: "standing" \| "seated" \| "low", keep? })` | `left` reads screen left, `right` screen right; from a station's side if it keeps that order, else mirrored across the action line |
| `medium(subjects, opts)`, `follow(subject, opts)` | Head to hips; or full size tracking with a 0.5 s operator lag |
| `pushIn(subjects, { start, seconds?, size?: "medium" \| "close", keep?: "hands" })`, `pullBack(subjects, { start, seconds?, size? })` | Moves from the previous framing without a cut; the lens never comes within 0.9 m of a framed subject |
| `alongside([rider], { start, side?, view?: "front" \| "rear" \| "side", distance? })` | Rides beside a rider, on the side of its broom heading averaged over the last 0.3 s (a new route swings the camera round instead of snapping it); a hanging rider's legs are kept in frame |
| `shot(subjects, { size, ... })` | Any combination; `cut: false` moves instead of cutting |
