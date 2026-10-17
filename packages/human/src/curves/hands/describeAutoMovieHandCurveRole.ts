/** Classify the current hand factory's named construction courses for inspection.
 *
 * Sections include nonplanar branch collars as well as transverse shaft/palm
 * courses. Guides follow the generating family or connect its MCP supports;
 * neither label certifies a skin envelope, a clinical crease or measured fit.
 * Custom station names and unrecognized courses retain an unspecified role.
 */
export function describeAutoMovieHandCurveRole(
  name: string,
): "section" | "guide" | "feature" | "unspecified" {
  const course: string = name.endsWith("Right") ? name.slice(0, -5) : name;
  if (
    /^hand_(?:thumb|index|middle|ring|pinky)_(?:branchJunction|branchMid)$/.test(
      course,
    ) ||
    /^hand_thumb_(?:proximalFree|proximalNearJoint|IP|distalShaft|pulp|nearTip)$/.test(
      course,
    ) ||
    /^hand_(?:index|middle|ring|pinky)_(?:proximalFree|PIP|middleShaft|DIP|pulp|nearTip)$/.test(
      course,
    ) ||
    /^hand_wristCollar_(?:0|0\.5|1)$/.test(course) ||
    /^hand_palmSection_0\.(?:45|65)$/.test(course)
  )
    return "section";
  if (
    /^hand_(?:thumb|index|middle|ring|pinky)_meridian[0-3]$/.test(course) ||
    /^hand_knuckleArch_[0-3]\.[05]$/.test(course) ||
    /^hand_palm_(?:XPositive|dorsalRadial|ZPositive|radialVolar|XNegative|volarUlnar|ZNegative|ulnarDorsal)$/.test(
      course,
    ) ||
    /^hand_palm_MCP_(?:thumb|index|middle|ring|pinky)_(?:dorsal|volar)$/.test(
      course,
    )
  )
    return "guide";
  return "unspecified";
}
