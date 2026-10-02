/**
 * The tissue budget of a contact pair: how far a vertex of either segment may
 * move to part it, in metres.
 *
 * The figure is half of the soft tissue the two surfaces give up together, so
 * it is the ceiling of a corrective row and a pair the budget cannot clear is
 * reported unsolved and never pushed harder. The figures follow the fold each
 * pair belongs to. Fingers and toes are small and get little (8 and 10 mm). An
 * arm against the trunk or a leg against the other leg is fat and muscle on
 * both sides (25 mm). The folds where a limb closes on a soft mass get 50 mm:
 * the knee, where the calf and hamstrings flatten against each other by
 * centimetres and which is what stops the joint; the hip, where the thigh
 * folds onto the groin at 62 degrees and onto the belly beyond 90; the
 * shoulder's root fold, where the upper arm folds onto the chest and girdle;
 * the same root fold inside one segment, since the dominant-bone partition
 * gives one segment the axillary, pectoral or inguinal skin that folds onto
 * itself; and the trunk against itself, the belly folding at the waist as the
 * trunk flexes with the thighs in a squat or a seated slump. Everything else
 * gets 15 mm.
 *
 * At 140 degrees of knee flexion this rig's calf stands 46 mm past the fold
 * plane, more than the 30 mm or so a real calf gives, which the knee receipt
 * records against the source pivot and does not hide. The figures are
 * conventions of the solver, not measurements of a population.
 */
export function bodyContactBudget(a: string, b: string): number {
  const digit = /Thumb|Index|Middle|Ring|Little/;
  const arm = /UpperArm|LowerArm/;
  const torso = /^(chest|upperChest|spine|hips|leftShoulder|rightShoulder)$/;
  const leg = /UpperLeg|LowerLeg|Foot$/;
  if (digit.test(a) || digit.test(b)) return 0.008;
  if (/Toes/.test(a) || /Toes/.test(b)) return 0.01;
  const girdle = /^(chest|upperChest|leftShoulder|rightShoulder)$/;
  if (
    (/UpperArm$/.test(a) && girdle.test(b)) ||
    (/UpperArm$/.test(b) && girdle.test(a))
  )
    return 0.05;
  if (
    a === b &&
    /(UpperArm|UpperLeg|Shoulder)$|^(upperChest|chest|spine|hips)$/.test(a)
  )
    return 0.05;
  if ((arm.test(a) && torso.test(b)) || (arm.test(b) && torso.test(a)))
    return 0.025;
  if (
    (a.endsWith("UpperLeg") && b.endsWith("LowerLeg")) ||
    (a.endsWith("LowerLeg") && b.endsWith("UpperLeg"))
  )
    return a.slice(0, 4) === b.slice(0, 4) ? 0.05 : 0.025;
  if (leg.test(a) && leg.test(b)) return 0.025;
  if (
    (leg.test(a) && /^(hips|spine|chest|upperChest)$/.test(b)) ||
    (leg.test(b) && /^(hips|spine|chest|upperChest)$/.test(a))
  )
    return 0.05;
  if (arm.test(a) && arm.test(b)) return 0.025;
  if (torso.test(a) && torso.test(b)) return 0.05;
  return 0.015;
}
