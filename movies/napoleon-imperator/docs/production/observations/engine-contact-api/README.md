# Engine contact API observations

The coordinator inspected the existing public engine functions and ran their six applicable portable tests on 2026-10-30. [The successful original log](task-temp-tests.log) records exit 0 with all six passing: convex separation, closest segment points, two-bone IK, segment/projectile collision and invalid sphere radius/vector admission. [The first failed invocation](default-temp-failure.log) stopped before testing because the source runner's temporary path failed its physical-parent guard. Repeating the complete selected group with the existing task-owned TEMP/TMP succeeded without changing the guard or engine source.

```powershell
$env:TEMP = (Resolve-Path '.cache/scaffold-inspection/temp').Path
$env:TMP = $env:TEMP
pnpm test --include geometry_convex_separation math_segment_closest_points physics_collision physics_segment_sphere kinematics_two_bone_ik
```

| Original log | SHA-256 |
| --- | --- |
| `default-temp-failure.log` | `fd5d31f786a8e137b422a8e8de1fa99421961a5eb8eb89754d3c00cf1c76cc06` |
| `task-temp-tests.log` | `8fdc1af652e13b31add964afdb8cda88d4abb05109268709a6d21446fc880e88` |

The public `closestPointsBetweenSegments` returns rounded closest witnesses and distance; capsule checks must include actual radii and world transforms. `boundAutoMovieConvexSeparation` bounds filled convex hull separation conservatively, so zero includes unproved cases and cannot be interpreted as a clean pass or a confirmed penetration. `segmentSphere` returns the first straight-chord entry, and `projectileSphereHit` approximates a ballistic path by chords. Intermediate-time checks remain necessary where the actual curved or rotating motion exceeds that model. The native `detectBodyCollision` and `validateGroundContact` consume skeletal motion and FK; the production's procedural point poses need their actual geometry passed into supported geometry queries rather than a fabricated independent rig.

These observations establish tested API seams on this host. They do not establish whole-episode collision coverage, continuous collision freedom or visible contact quality. The production worker is implementing those queries against actual evaluated actors, props and authored contact conditions; its whole-sequence results and rendered observations remain separate. The API inspection found no need to invent a replacement collision engine before wiring these existing capabilities.

The [independent physics-instruction review](physics-instruction-review.md) retains its original bytes and found no actionable instruction defect after tracing actual public APIs and consumer adaptation points. It approves neither the unfinished integration nor a movie. Both productions received the physics-guide change through explicit instruction sync; final checks returned 0 and source/state digests match. The [sync archive](instruction-sync.zip) preserves all eight original planning, application and final-check logs, including the initial two relative-path failures from invoking the source CLI inside its package directory. The corrected invocation used absolute production paths. The [manifest](manifest.json) identifies every original log, report and expanded archive member and keeps failed and successful command outcomes separate.
