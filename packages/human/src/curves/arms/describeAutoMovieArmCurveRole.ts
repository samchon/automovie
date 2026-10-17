/** Describe the arm family's generated support loops and constant-phase rails.
 *
 * These roles identify construction semantics only: a support is not a palpable crease, and a longitudinal phase rail is not an independently measured muscle or tendon boundary. Unknown names retain an explicit unspecified role.
 */
export function describeAutoMovieArmCurveRole(
  name: string,
): "section" | "guide" | "unspecified" {
  const match: RegExpMatchArray | null = /^(left|right)\.(.+)$/.exec(name);
  if (match === null) return "unspecified";
  const course: string = match[2]!;
  if (/^armLongitudinal\.phase(0[0-9]|1[01])$/.test(course)) return "guide";
  if (
    [
      "upperArm.midTube",
      "upperArm.relaxedMidCourse",
      "upperArm.distalTransition",
      "elbow.jointCourse",
      "forearm.relaxedMaximumCourse",
      "forearm.halfExcessAreaCourse",
      "forearm.distalTaperCourse",
      "wrist.midTube",
    ].includes(course)
  )
    return "section";
  return "unspecified";
}
