# Tracing

Tracing turns a performer in footage, such as a dancer, into the polygon man's motion, for one of three uses:

| Use | What is taken from the trace |
| --- | --- |
| A clip the user chose to trace | The whole motion |
| Keys for the composed performance | Poses at chosen instants |
| A performance study | Timing, ranges and paths |

Clean traced footage or generated motion, then [retarget](../retargeting.md) to the cast member. Fill gaps with [composition](../compose/composition.md) or [model in-betweening](hints.md). For studies, use real footage and record estimates and method.

## Source footage

### Rights

Trace only footage the production may use. Ask the user before tracing anyone else's, and keep the answer in the footage's [record](../../production/media-records.md#records) with each of these rights:

- the footage license and platform permission to download or extract it
- choreography rights, which may cover filmed work
  - Single steps and social dances are outside that protection.
- the performer's consent for retained face, voice or recognizable likeness
- the estimator's and the body model's licenses, as [clips](clips.md#licenses) sets.

### Footage

Estimators and capture services agree on the footage they need:

- a fixed chest-height camera square to the performer
  - Avoid zoom, cuts, wide lenses and fisheye.
- the whole body in frame from head to feet for the whole take, unobstructed;
- snug clothing in a color apart from the background;
- bright, even light;
- one performer, or performers who never cross or touch
  - Most estimators lose hidden people and refuse contact.
- at least 1080p at the camera's highest frame rate
  - Fast motion otherwise blurs and skips poses.
- a three-quarter angle for floor work and large hands for finger detail

Use jointly calibrated cameras when one view hides required motion.

## Motion recovery

### Estimation

Use a [grounded estimator](models.md#pose-estimators). Record camera motion and known focal length. Resample to its expected rate. Estimate fingers separately where visible.

### Cleanup

Clean the estimate in this order:

1. Remove outliers, then filter jitter with a speed-adaptive filter.
2. Set the ground plane, and detect each plant and grip for [retargeting](../retargeting.md#contacts-and-time) to hold.
3. Replay floating, sliding or penetrating motion through a physics tracker.
4. Retarget to the prepared cast body through a declared joint table.
   - Solve contacts again on that body.

The [One Euro filter](https://gery.casiez.net/1euro/) is one speed-adaptive filter: tune its cutoff on slow motion, then its speed coefficient on fast motion. [PHC](https://github.com/ZhengyiLuo/PHC) is one physics-tracking model.

### Verification

Compare consecutive reprojected frames with the source under [comparison](../../visual-debugging/comparison.md). Start with fast moves, spins and contacts. Measure planted-foot slide and accented dance timing against the beat. Clean or reshoot a contradicted trace.

Sources: [Rokoko capture](https://support.rokoko.com/hc/en-us/articles/48823622640785-Best-Practices-for-Video-Capture-Rokoko-Vision-3-0), [DeepMotion capture](https://deepmotion.com/article/single-person-capture-guidelines-for-animate-3d), [Plask](https://plask.ai/docs/44), [Pose2Sim](https://github.com/perfanalytics/pose2sim), Hanagami v. Epic Games, 85 F.4th 931 (9th Cir. 2023), [GVHMR paper](https://arxiv.org/html/2409.06662), [Cascadeur dance cleanup](https://cascadeur.com/tutor/kpopdancemocapcleanup), [Copyright Office Circular 52](https://www.copyright.gov/circs/circ52.pdf), [YouTube terms](https://www.youtube.com/t/terms), [TikTok terms](https://www.tiktok.com/legal/page/us/terms-of-service/en), [SMPL license](https://smpl.is.tue.mpg.de/modellicense.html), [EDGE](https://github.com/Stanford-TML/EDGE).
