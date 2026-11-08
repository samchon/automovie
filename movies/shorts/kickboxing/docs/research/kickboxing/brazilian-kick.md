# The Brazilian kick

The [screenplay](../../body/screenplay/kickboxing.md) finishes at 150.000 with A's right Brazilian kick. A's instep and lower shin come down behind B's left ear, where the jaw meets the neck, over B's lowered left arm. Before the motion was rebuilt, the owner required a measurement of whether the original Human rig can reach that target within its range of motion, following the technique recorded in [championship exchanges](exchanges.md#brazilian-kick). This page records the measurement and its result.

## Law {#law}

The coaching description in [championship exchanges](exchanges.md#brazilian-kick) and the measurement below give the law the finishing kick follows, in the kicker's own body frame:

- It launches in the body kick's chamber: the same raised, folded right knee at the same [chamber key](techniques.md#kick-timing), so a receiver who reads body kicks sees a body kick.
- Turnover: the support heel turns toward the target and the hips roll over, so the right knee climbs above the receiver's shoulder line and turns across his guard. The kicker rises onto the straightened support leg, the pelvis tilts back (the trunk "leans back", read as 30°) and hikes the kicking hip (the hips "roll over", read as 30° of obliquity), so the thigh climbs past the hip's own flexion; the knee goes as high as the thigh carries it while the lower leg still reaches the target. The receiver who reads a body kick sinks into his elbow block, which lowers his shoulder line and the region under that knee.
- Range: the stance distance is the horizontal run of that turnover (the thigh at the hip's flexion plus the tilt, then the shank to the ankle's front, where the instep and distal shin meet on the region), so the fighters stand a leg apart at the contact, never chest to chest.
- Delivery: the folded lower leg opens and descends; the instep and distal shin arrive from above and slightly behind the receiver's head, never as a horizontal swing.
- Target: the junction of jaw and neck behind the receiver's left ear, as a region of his actual head and neck.
- The pelvis and support pivot are fitted together with the kicking leg, because the measurement below shows the hip alone runs out of range; the fit holds the support foot and may turn it about the floor normal.
- The kick guard holds throughout: the right glove forward at the head line, the left glove at the cheek.
- Timing: the round kick's launch-to-impact and recoil, from the same measured phases.

Its outcome is in the [outcome table](exchanges.md#outcomes): it lands when the receiver answers the body-kick chamber with the elbow block.

## Earlier measurement {#measurement}

### Method {#method}

The measurement used the authored comparison runtime at commit a86cceca0, constructed in the development Viewer at `http://127.0.0.1:5199/` from the movie's own modules. Each sample evaluates the film at one second, fits both bodies through Human's shared limb fitting and reads the displayed pose. Contact is the signed separation between declared colliders, from the engine's exact geometry query (`preparePhysicalGeometry().contact`). The colliders are A's `rightMidfoot` box (the instep) and `rightLowerLeg` capsule (the lower shin), against B's `neck` and `head` capsules. The receiving point is expressed in B's own frame relative to his head joint.

The kick path relates every pose to the receiver:

- The chamber is the body-kick chamber.
- The impact ankle is placed so that the instep collider meets B's neck collider, projected from behind B's left ear.
- The knee is the highest one the thigh and shank allow for that ankle.
- An over-the-head phase raises the leg about the hip until the ankle clears the top of B's head collider.

### Result {#result}

| Second | Instep–neck separation (m) | Instep vertical speed (m/s) | A's right knee height (m) | B's left shoulder height (m) | A's right hip flexion / adduction / rotation (°) | Worst fitting residual (m) |
| --- | --- | --- | --- | --- | --- | --- |
| 149.80 | 0.398 | +12.4 | 1.228 | 1.370 | 106.6 / −20 / 45 | 0.147 |
| 149.90 | 0.004 | +6.6 | 1.320 | 1.346 | 130 / −20 / 45 | 0.122 |
| 149.95 | 0.020 | +0.7 | 1.320 | 1.345 | 130 / −20 / 45 | 0.062 |
| 150.00 | 0.041 | −0.1 | 1.314 | 1.345 | 130 / −20 / 43 | 0.076 |

The table shows where the kick stands:

- **Target region: reached.** The nearest instep point at 150.000 lies 6.6 cm behind B's head joint, 6.8 cm to his left and 9.5 cm below it, on the neck collider. That is the jaw–neck junction behind the left ear, not the crown and not the face.
- **Contact: not achieved.** The instep comes within 0.4 cm of the neck surface at 149.90 but never compresses it. A landing receipt needs at least 1 cm of compression.
- **Descending path: not achieved.** The foot is still rising 0.1 s before contact and is level at contact. The over-the-head phase is never realized: the foot never rises above about 1.32 m, while the top of B's head is near 1.6 m.
- **Knee over the guard: marginal.** At contact the knee sits about 3 cm below B's left shoulder line instead of above it.
- **Range of motion is the limit.** From 149.90, A's right hip sits on three bounds at once: flexion 130° (Human's clinical maximum is 132.1°), adduction 20° and rotation 45°. Those two are Human's clinical bounds for these channels. The knee at 80–86° flexion is well inside its range. No further reach can come from the hip alone.
- **Guard rule: holds.** A's right glove stays 0.60–0.66 m ahead of his head at +5–6 cm head height, and his left glove stays at the cheek, 0.28 m from the head joint. Both hold through chamber, delivery and recoil.
- **B's tell: present.** B's left glove drops from 1.51 m to 1.09 m at contact, below his left shoulder. He has read the body kick, as the composed intent requires.

### Conclusion {#conclusion}

The target is anatomically reachable for the ankle within a few millimetres. The question-mark shape is not: Human's hip range is exhausted while the pelvis and support keep the roundhouse-derived orientation. The coaching description supplies the missing degrees of freedom: the support heel turns toward the target, the hips roll over and the trunk leans back. A kick that turns over must therefore fit the pelvis and support pivot together with the kicking leg, not only the leg against a fixed pelvis. This is whole-body reach under ROM limits, which is universal fitting logic; the Engine now provides it as a whole-body fit from a held support. The fitting request is a pelvis-and-support degree of freedom within the shared limb fit, bounded by the pelvis channels (tilt, obliquity and rotation of ±90°, ±90° and ±180°) and by support balance.

Lowering the contact point would leave the screenplay's jaw–neck feature, so it is not an option. Until whole-body fitting exists, the Brazilian kick reaches its target region and preserves the guard rule and B's tell. It does not land with compression or descend over the head, and its contact remains a refused receipt in the runtime inspection.
