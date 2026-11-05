# Central motion review: 23–53 seconds

This independent review compares the current central segment with the current screenplay and settings. It does not accept the segment or the whole film. The blind recipient response was locked first in [.cache/motion-core-review-r1/first-response.md](../../.cache/motion-core-review-r1/first-response.md), with exact observation paths and limitations. All findings below were gathered in one inspection round before author repair. No production code, narrative, compiler, native proof or media was changed or run in Phase 2.

## Observation boundary

I operated actual Play, Pause and seek in the live Viewer at 540×960. I inspected the complete interval as sampled rendered frames, including transition samples and six frames captured during an actual Play run from 23 seconds to a Pause reading of 52.34 seconds. My interface cannot watch continuous video or hear audio. I have not watched or listened to this film, and cannot approve smoothness, continuous contact persistence, timing feel or soundtrack. The image evidence establishes observed poses, crop and overlap only. The initial console error was a missing favicon; playback operated after initialization.

The broad rescue result was legible without source: Harry hangs below one broom, Carina comes down beside him, and both end on her broom. The requirements correct one ambiguity in my blind interpretation: no reciprocal hand-to-hand rescue clasp is required. The fixed construction explicitly avoids Carina pulling Harry up by one arm. Harry must grasp her empty rear shaft with his left hand, release the old shaft with his right, join both hands on the new shaft, load his lower ribs/forearm, and swing into a rear straddle. Repair must make that hand-to-broom exchange legible without adding a wrist catch.

## Whole batch of findings by cause

### 1. The choice is represented by a hand target and an escaping speck, without a readable grasp state or continuous prize transition

At 32–34 seconds the gold speck is close to Carina's forward hand; at 36 seconds it is above and away. In the blind reading this could be either a missed catch or a choice to abandon pursuit. The fixed story requires her open left hand near the prize, her attention turning to Harry, then that hand closing on her own shaft while the unheld Snitch escapes.

[sampleFlight.ts](../../src/sampleFlight.ts:81) owns the reaching target and object path. The wrist offer fades over 33.7–35 seconds while head yaw grows over 33.4–35, so a choice cue exists. It is incomplete in the actual representation: [createRider.ts](../../src/createRider.ts:65) uses the same unoriented 48 mm palm marker for every state, and only translates it at line 199. There is no open-hand, closing-hand or shaft-grasp display control. A gold sphere only 40 mm across is correct to settings; the fixed 40-degree portrait camera and wide composition leave it only a few pixels.

There is also a source-confirmed discontinuity at 35 seconds, not a watched-motion claim. Immediately before that branch, the Snitch approaches offset (x−0.51, 32.75, −5.02); the escape branch starts at (x−1, 33, −5.1). That is a roughly 0.56 m position jump. The settings forbid teleporting. The escape should start from the same accepted position and motion state, rather than switch independently defined paths.

Owners and remedy: sampleFlight owns one continuous prize trajectory and a clear attention/reach/withdraw/regrip sequence; createRider owns coarse readable hand states and hand orientation; sampleFlight/createFlightScene jointly own the delivered framing of hand, prize and endangered rider. Preserve the actual Snitch dimensions and story. A closer or better staged view can improve readability without requiring detailed fingers or photographic faces.

### 2. The long hang lacks the required changing body and grip behavior

The sampled 25–35 second poses show a clear overhead hand and feet in empty air, but the hang remains nearly vertical and stiff. This is explained by the controller, not merely by low polygon detail. In [sampleFlight.ts](../../src/sampleFlight.ts:47), after slip reaches one at 26 seconds and before mount begins at 45, Harry's pelvis has a fixed offset below a constant-speed root. His bank remains zero. Both hips and knees reach zero flexion and stay there. The old right-hand target stays at one fixed local shaft point. Only the free arm has a short sinusoidal attempt at 26.5–29.5, with no corresponding body swing.

Consequently the controller omits the scripted boots searching for support, the body swinging away from the attempted second grip, and the right fingers creeping along the shaft. The 23–26 entry also lowers the pelvis from the seat without an explicit further left-hand Snitch reach: the early Snitch path is already anchored near Carina, and Harry's free-hand controls do not initiate that overreach. The loss of support is visible, but its specific reaching cause is weak.

Owners and remedy: sampleFlight owns coordinated reach, loss of thigh support, body swing, failed return reach, foot search, weakening/sliding old grip and Harry's attention toward danger and Carina. Keep the hanging hand anchored to the actual shaft while the body reacts around it; a time-varying clinical pose alone must not become a hidden tether or automatic levitation. createRider must display the resulting torso and hand changes. The source can remain deterministic and the magic broom path authored; a full rigid-body simulation is not demanded.

### 3. Endpoint wrist fitting is being asked to carry support and mounting that it does not establish

The sampled 42–44 second images place Harry's reaching hand around Carina's rear hip/shaft area, but the far-side left hand, her dark robe, his forearm and the brown wood overlap. By 46 seconds his right hand is off the upper shaft; by 47–49 he bends beside the rear seat, and by 51–53 both are astride. The final state is legible, while the intermediate support transfer is largely inferred.

The source supplies meaningful order: left target converges by 43, right transfer runs 44.3–45.2, mount runs 45–50.5, and load/recovery are authored. However, [sampleFlight.ts](../../src/sampleFlight.ts:60) combines a prescribed pelvis lift, leg angles and whole-root bank with wrist-only IK. It has no lower-rib/shaft or hooked-left-forearm contact, no explicit thigh/shaft support or boot/bristle clearance condition. The support record at line 93 is a clock label, not a consequence of measured support. It even reports seated=false at 23 despite the visible seated entry pose. The mount label alone cannot establish when load is safely supported.

[createRider.ts](../../src/createRider.ts:147) fits positional hand joints with the public Human clinical IK and reports error/clamps. It does not solve grasp orientation, finger closure, forearm support or body/prop clearance. Its shirt, tie, badge and robe are translated from a chest point at lines 178–186 but do not follow the posed torso rotation; the robe remains locally upright. That hides part of Carina's forward fold and Harry's chest-over-shaft action even when the skeleton bends.

Owners and remedy: sampleFlight owns explicit ordered grasp/support/release/mount states and a body path that realizes lower-rib contact, forearm hook, left-thigh crossing and settled straddle. createRider owns coarse grasp states, relevant forearm/body controls and garments following the actual torso frame. createBroom already supplies the declared 2.4 m body and 0.65 m rear wood section; retain that shared geometry/contact frame rather than adding a separate rescue prop. Verify seat/thigh support, hand order, forearm/rib contact, body/shaft/bristle clearance and their resulting visible state through the affected action. Do not replace the fixed transfer with a hand-to-hand pull-up.

### 4. One fixed camera offset hides contact, attention and required distant consequence

The actual portrait samples keep both full bodies inside the frame, but leave much empty sky, reduce the prize and hands, and cross two shafts near Carina's head around 37–44. The far-side new left-hand target is placed at +Z relative to its shaft, while [sampleFlight.ts](../../src/sampleFlight.ts:89) always locates the camera at target+(3.5,1.35,−6.3). The view therefore looks through near-side bodies/props toward the hand whose new support must be understood. The camera tracks a simple group target rather than the changing information needed by the exchange.

The upper loose broom is visibly cropped as it departs, including the bristle crop at the end. The controller independently moves it by additional east/up/right offsets after 44.3 seconds. Its eastward derivative is 7 plus a nonnegative phase derivative, so this implements an added acceleration followed by return to 7 m/s, rather than the settings' gradual slowing of a riderless broom. Its escape route and the camera must be designed together so it clears Harry's head, remains distinguishable from the occupied shaft during the transfer, and then exits intelligibly.

Carina's and Harry's final heads point low in the sampled shared ride. Current head orientation uses the evaluated head rotation, including their persistent spinal lean; Harry's neck flexion is zero again after 35 and Carina's yaw fades by 47. Neither has an explicit recovery gaze control. A lifted recovery eye line should preserve the torso support posture rather than straighten the whole body just to turn the face.

The Keeper and other players are instantiated, not absent assets. [createFlightScene.ts](../../src/createFlightScene.ts:132) turns/signals/advances G-K, freezes Chaser positions after 39, holds the Quaffle at G-C2 and keeps both Bludgers north. Yet the locked portrait frames show none of the required distant Keeper recognition/approach/yield. G-C2 does not turn or hug the ball in this controller, and the other Chasers do not perform the specified brake/turn reaction. Statically retaining twelve meshes and all props does not make those causal reactions visible.

Owners and remedy: sampleFlight/createFlightScene own a continuous three-quarter transfer camera that separates the shafts and relevant hand, preserves bodies/ground and shows the required distant Keeper outside the transfer corridor. Adjust blocking and camera together, not just zoom. sampleFlight owns recovery gaze and a riderless trajectory consistent with its setting. createFlightScene owns the supporting players' actual recognition, stopping, ball retention and outside trailing/yield state. No new dialogue, extra rescue apparatus, portraits or Human full skin are needed.

## Omission boundary

These are central-segment omissions: the reaching cause of the slip; searching legs, body swing and creeping grip during the hang; readable open/closed prop grasps; explicit forearm/rib/thigh support and clearance through the mount; readable choice and contact framing; visible Keeper/field reaction; continuous Snitch escape; coherent loose-broom motion and recovery gaze.

These are implemented central elements whose completion or visibility needs repair: two distinct Human-driven hero rigs and house cues, both shared broom frames, old/new wrist targets in the intended order, an approach below Harry, prescribed load dip and recovery, a rear-straddle endpoint, twelve background riders, six hoops, four bats, Quaffle, two Bludgers and one Snitch. Full Human skin, portrait likeness and photorealism are outside this review requirement.

Opening 0–23 and ending 53–60 are pending whole-film implementation, not newly discovered missing beats within a claimed complete core. sampleFlight clamps to 23–53 and its comment explicitly says opening/ending extension remains pending. That boundary does not excuse central support, prop, reaction or camera omissions. The three fixed spoken lines and fixed story remain unchanged; no audio or final dialogue acceptance is made here.

## Evidence and acceptance limits

[core-round-two.json](../../.cache/motion-browser/core-round-two.json) contains fifteen selected time samples, with reported wrist residuals no greater than 0.0039191604 m and no reported ROM clamps. Its support entries are the controller's time labels. The diagnostic consumer reports wrist endpoints/error, selected prop positions and asset counts. It does not measure body support, hand closure/orientation, clearance, continuous stability or visible pixels. The existing rider contact unit test checks a small neutral wrist displacement and absolute replay of that pose; it does not exercise sampleFlight's full transfer.

The next combined repair round needs one full affected-interval inspection with all causes addressed together, meaningful phase-boundary/contact/clearance checks, and actual continuous normal-speed viewing plus consequential slow replay by an observer who has that capability. My sampled images and clock results cannot substitute for that unperformed check. No segment acceptance or whole-film completion is granted.

## Current source identity

| File | SHA-256 |
| --- | --- |
| src/sampleFlight.ts | 855E3BC0A07BE37261E78627288588AF0DB99FAAD56544B5369EF45B696E05FC |
| src/createFlightScene.ts | 4B708734AC13CAB56991B10A24CE07CC28B9C11CDA9E597C6A07222E0C4409AD |
| src/createRider.ts | 131A85AD78A3E530952876AEEABC52E010852623AABC0D196BFE6FB7CEFA7100 |
| src/createBroom.ts | 49892C0ECFAB0EC564B3433C133CD70425CFA9CB52E46B22E87F2F9EF158C449 |
| docs/body/screenplay/snitch-before-you.md | 58AEF312016E56D92378EFFE3B544345CD0FA060DA49E1243A017B6868FCA8C1 |

The reviewed requirement surface also includes current settings carina, harry, brooms, arena, east-keeper, players and snitch; PROJECT#motion-execution; motion/staging, review/video and contracts/motion. The actual entry createProduction invokes createFlightScene, which invokes sampleFlight and the same rider/broom adapters reviewed here.

