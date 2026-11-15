# Clips

A generated or captured clip is frozen data, never generated at playback, and it lacks what the installed vocabulary guarantees. Check each of these before [retargeting](../retargeting.md) it onto the polygon man:

- **Contacts.** Expect foot sliding, penetration, jitter and floating; correct them under [retargeting](../retargeting.md#preserve-contacts-and-time).
- **Objects and partners.** A model generates one body without the object or partner it touches, so a contact between two clips is never shared. An exchange stays a mutual join or an object's affordance in the composed performance.
- **Rotations.** Many models output joint positions only, and any body parameters come from a later fit to a neutral shape. Convert positions to rotations by a stated fit rather than relabeling them, and treat the fit as derived.
- **Proportions.** The model's skeleton has its own proportions; retarget to the cast member's prepared body, and check that the authored contacts survive.
- **Reproducibility.** Hosted outputs expire and a seed does not repeat a clip, as [media records](../../production/media-records.md#records) says. Freeze the bytes at once and record them there, with the hints given.

## Licenses

Each rights layer [media records](../../production/media-records.md#records) lists must allow the clip's use. The SMPL and SMPL-X body models and the AMASS data forbid commercial use without a separate license, though most code built on them is MIT. Several capture models are research-only, and some open weights exclude whole regions.

Sources: [SMPL license](https://smpl.is.tue.mpg.de/modellicense.html), [AMASS license](https://amass.is.tue.mpg.de/license.html), [HumanML3D](https://github.com/EricGuo5513/HumanML3D), [PhysDiff](https://arxiv.org/abs/2212.02500), [PyTorch reproducibility](https://docs.pytorch.org/docs/2.15/notes/randomness.html), [Footskate Cleanup](https://research.cs.wisc.edu/graphics/Gallery/kovar.vol/Cleanup).
