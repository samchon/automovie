# Tracing

Tracing turns a performer in footage, such as a dancer, into the polygon man's motion. It serves three uses:

| Use | What is taken from the trace |
| --- | --- |
| A clip the user chose to trace, from footage or a generated video | The whole motion, cleaned, then [retargeted](../retargeting.md) onto the cast member |
| Keys for the composed performance | Poses at chosen instants, which the vocabulary [composes](../compose/SKILL.md) between or a model in-betweens under [hints](hints.md) |
| A [performance study](../../story/planning/research.md#performance-study), from real footage only | Timing, ranges and paths, recorded as estimates with their method |

## Rights first

Trace only footage the production may use. Ask the user before tracing anyone else's, and keep the answer in the footage's [record](../../production/media-records.md#records) with each of these:

- the footage's own license, since video platforms' terms forbid downloading or extracting content without permission;
- the choreography, which copyright can protect once filmed, though single steps and social dances are not;
- the performer's consent where the face, voice or recognizable likeness is kept;
- the estimator's and the body model's licenses, as [clips](clips.md#licenses) sets.

## Footage

Estimators and capture services agree on the footage they need:

- a fixed camera at chest height, no zoom, no cuts, no wide or fisheye lens, square to the performer;
- the whole body from head to feet in frame for the whole take, unobstructed, in snug clothing of a color apart from the background, under bright, even light;
- one performer, or performers who never cross or touch, because most estimators lose a person behind another and refuse contact between them;
- at least 1080p and as high a frame rate as the camera gives, because fast motion such as dance blurs and skips poses between frames;
- floor work shot from a three-quarter angle, and hands large in frame where fingers matter.

Several cameras around the performer, calibrated together, recover what one camera hides, such as spins and floor work.

## Estimate

Estimate the body and its world path with a model that grounds the motion, stating whether the camera was static or moving and its focal length where known, because a wrong assumption bends the root path. Resample the footage to the frame rate the estimator expects, because some time their output by a fixed rate. Estimate fingers separately where the shot shows them. [Motion models](models.md#pose-estimators) shows current estimators.

## Clean

1. Remove outliers, then filter jitter with a speed-adaptive filter such as the [One Euro filter](https://gery.casiez.net/1euro/): tune its cutoff on slow motion, then its speed coefficient on fast motion.
2. Set the ground plane, and detect each plant and grip for [retargeting](../retargeting.md#preserve-contacts-and-time) to hold.
3. Where the motion floats, slides or penetrates beyond what cleanup fixes, replay it through a physics-tracking model such as [PHC](https://github.com/ZhengyiLuo/PHC).
4. Retarget through a stated joint table onto the cast member's prepared body, and solve the contacts again there.

## Verify

Overlay the reprojected skeleton on the source footage and compare them on consecutive frames under [comparison](../../visual-debugging/comparison.md), first at fast moves, spins and contacts. Measure foot sliding on frames where a foot is planted, and for dance the offset of each accented move from the music's beat. A trace that the footage contradicts is cleaned again or re-shot, never accepted for its look.

Sources: [Rokoko capture](https://support.rokoko.com/hc/en-us/articles/48823622640785-Best-Practices-for-Video-Capture-Rokoko-Vision-3-0), [DeepMotion capture](https://deepmotion.com/article/single-person-capture-guidelines-for-animate-3d), [Plask](https://plask.ai/docs/44), [Pose2Sim](https://github.com/perfanalytics/pose2sim), Hanagami v. Epic Games, 85 F.4th 931 (9th Cir. 2023), [GVHMR paper](https://arxiv.org/html/2409.06662), [Cascadeur dance cleanup](https://cascadeur.com/tutor/kpopdancemocapcleanup), [Copyright Office Circular 52](https://www.copyright.gov/circs/circ52.pdf), [YouTube terms](https://www.youtube.com/t/terms), [TikTok terms](https://www.tiktok.com/legal/page/us/terms-of-service/en), [SMPL license](https://smpl.is.tue.mpg.de/modellicense.html), [EDGE](https://github.com/Stanford-TML/EDGE).
