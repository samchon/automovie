# Archetype actor contact matrix

[#3830](https://github.com/samchon/automovie/issues/3830) retains the actor-contact acceptance from [#3365](https://github.com/samchon/automovie/issues/3365#issuecomment-6949535539). These cases use the emitted archetype and displayed polygon actor on the same build. Reproduce the observations with fixed source, dependency lockfile, Node runtime and seeds, as specified in [#3620](https://github.com/samchon/automovie/pull/3620).

## Admitted cases

Each row takes model seeds `0` through `199`. Its actor seed stays fixed as declared in the test, so model variation cannot be confused with a second actor draw. The two body names refer to the surveyed body fixtures in `motionHumanBody`.

| Producer and grip or support | Relation and act | Actor |
| --- | --- | --- |
| `createDrinkware` glass, body | Hold after pickup | `m-average` |
| `createDrinkware` glass, body | Use the rim to drink | `f-average` |
| `createDrinkware` glass, body | Carry through a 1 m walk | `m-average` |
| `createDrinkware` mug, handle | Hold after pickup | `f-average` |
| `createDrinkware` mug, cylindrical body | Use the rim to drink | `m-average` |
| `createDrinkware` mug, handle | Carry through a 1 m walk | `f-average` |
| `createPhone`, front glass | Use by swiping across the central half | `f-average` |
| `createSeat` stool, seat disc | Support a seated drinking gesture | `m-average` |
| `createSeat` bar stool, seat disc | Support a seated drinking gesture | `m-average` |
| `createCar` sedan, driver cushion | Ride through a 90° turn and 1 m translation | `m-average` |

The vessel rows cover every pair of producer variant, legal relation-act and body values at strength two. The grip follows the variant and act: the mug hook is shared by holding and carrying, and the cylindrical body has a feasible presentation to the lips. The mug-hook drinking refusal records the known coupling with facing. The phone, stools and sedan use their authored supported placements. Driving control, rising trot and coupled multi-person carry have their own maintained witnesses below.

## Physical observations

The vessel checks read the actual cylinder top and radius, then transform the physical rim into the posed mouth frame. At each held sample, the palm and the bracing thumb must each be within 10 mm of the actual grip part. The index finger curls from its idle pose for a body grasp, and the little finger curls for the mug hook. The curled finger must retain its local pose within 1°. The hook's curled fingers fit around the vessel and need not all touch the handle bar. Wrist-local material drift is limited to 1 mm across two prop-fixed points and the full relative rotation at a 30 mm lever arm. An axial twist that leaves both points fixed must fail. Both sides of the cut, the eight divisions of the held interval and the drinking pose at `atMouth` are sampled.

The touchscreen check measures the seeded case collider and calculates the 94-percent glass width from that measurement. It compares the actual index fingertip to touch-in, midpoint and touch-out on the glass within 9 mm. The supported stroke phase is 285 ms within 5 ms, as in the maintained kiosk test. The phone is fixed at the same 30° tilt and design height as that test.

The stool check measures the top and radius of the seat disc, then reads the actor's anatomical seat region at seating and during the supported act. The moving sedan check reads its resolved prop frame and compares it to the authored course, stationary through 3 s and at its 90° heading and 1 m translation at 7 s. It places the anatomical seat region in that same resolved car frame and compares it against the actual driver cushion. The posed pelvis supplies the heading. The support budget is 10 mm and the heading budget is 1°. The tests read entry, turn boundaries, half-second intervals and exit. A cushion below 0.8 times the popliteal height above the entry sole plane must refuse the sit. A separate standing control supplies the actual floor from its lowest posed sole. The threshold and refusal value are compared in world metres. Each sedan seed counts as an observed admission or a refusal with the measured height and feasible range. Each 100-seed range must observe both outcomes; the fixed seeds currently refuse 13, 16, 26, 39, 76, 77, 78 and 123.

The free glass, mug-handle, phone and stool dimensions exercised here are measured on colliders at every seed. Each nondegenerate interval must span at least 80 percent of its source band, in line with the maintained device-band tests. The sedan records the actual cushion-top spread across complete sourced models and checks the construction's seat height provenance per seed. The existing model and band tests retain broader dimensions, material facts and manufacturer profile checks. A clinical population mean does not supply an additional hard bound.

These samples bound the stated point measurements. The existing motion suites own their longer-interval dynamics and other contacts. The tests report the worst seed and time for each physical metric. The local phone sweep's greatest gap was 6.38 × 10⁻¹⁶ m at seed `180`, at `1.189916771549177` film seconds. The installed phone fixture reads the posed fingertips at touch-in, midpoint and touch-out for seeds `0` and `180`. The maintained `Snapshot` take provides a camera witness with its own right grip and left support. When a view occludes a contact, record the view limitation alongside its numerical measurement.

## Refused cases

| Case | Expected refusal |
| --- | --- |
| Grasp a plain glass by the mug handle | Missing handle affordance |
| Drink from the mug hook on `m-average` at model seed `0` | `handToFace` facing reach |
| Ask the right index tip to end outside the phone glass | Endpoint range on `to` |
| Put the bar-stool seat 1.5 m behind the performer | Seat reach |
| Board the moving sedan from a standing base | Base refusal offering `sit` |
| Try to sit on a sedan cushion below the surveyed body's minimum | Seat reach with its measured lower bound |

## Existing witnesses and ownership

`test_archetype_catalogue_contacts` keeps its actual rail threshold, music and articulated surfaces. `test_archetype_tool_use` runs actual tool and working surface witnesses. `test_motion_ride_keyboard_press` runs both the named desktop keyboard and laptop with opposed G/H contacts, 10 mm fingertip error, 1 mm prop drift and floor placement refusal. `test_motion_operate_swipe_touchscreen` retains the tablet and phone path, reversal, cut and invalid endpoints. `test_motion_posture_seat_support` retains the two extremes, seating signature and related support refusals. `test_motion_mount_rider_attachment` retains independent bicycle and horse attachment measures, including reins, stirrups, rising and dismounts. `test_archetype_scenic_parade_banner_shared_carry` owns the existing two-actor load witness.

[#3832](https://github.com/samchon/automovie/issues/3832) tracks powered and towed transport seat, control and access acts. [#3847](https://github.com/samchon/automovie/issues/3847) tracks the mount, lead, rising-trot and equine rider seed sweep. [#3846](https://github.com/samchon/automovie/issues/3846) tracks active seat and pelvis across gaits and overlays. [#3835](https://github.com/samchon/automovie/issues/3835) tracks inert stage-prop cast and physical contact acceptance. [#3796](https://github.com/samchon/automovie/issues/3796) tracks its seeded container and period-scenery witnesses.

## Run

The tests split the expensive seated and drinking rows into independent ranges to fit the runner's scenario limit. Four ranges of 50 seeds cover each drink, eight ranges of 25 seeds cover each stool, and two ranges of 100 cover the sedan. The source-band scenario takes every stool seed once without planning a film. The handheld tests run all seeds for holding and carrying and read the full vessel source bands.

```powershell
pnpm test:esbuild --include test_archetype_catalogue_actor_ test_archetype_catalogue_contacts test_archetype_tool_use test_motion_mount_rider_attachment
```
