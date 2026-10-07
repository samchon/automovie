/**
 * Named anatomical motion gaps of the lower-limb rig, keyed by
 * `<bone>.<axis>` (both sides share one entry under the side-free bone name).
 *
 * The connected body's rig gives the knee one hinge, the foot one transform
 * for the talocrural and subtalar joints together, and the toes one bone per
 * foot unless the basis declares toe rays. An axis the rig holds is shown
 * held; this table states which anatomical motion that held or combined axis
 * leaves unrepresented, so the editor names the gap instead of implying the
 * motion is impossible. It records representation limits, not clinical
 * ranges.
 *
 * @author Samchon
 */
export const HUMAN_BODY_MOTION_GAPS: Readonly<Record<string, string>> = {
  "LowerLeg.abduction":
    "Knee varus and valgus are not in this rig: the knee is one hinge (#2712).",
  "LowerLeg.twist":
    "Tibial rotation about the shank is not in this rig: the knee is one hinge (#2712).",
  "Foot.flexion":
    "Talocrural dorsiflexion and plantarflexion; the subtalar joint is not separated from it (#2708).",
  "Foot.abduction":
    "One combined foot turn: subtalar inversion and eversion are not separated from forefoot adduction and abduction (#2708).",
  "Foot.twist":
    "Subtalar inversion and eversion about their own axis are not in this rig (#2708).",
  "Toes.abduction":
    "Toe splay needs per-ray phalanges, which this basis does not declare (#2711).",
  "Toes.twist": "Toe rotation is not in this rig (#2711).",
};
