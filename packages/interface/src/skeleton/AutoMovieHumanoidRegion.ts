/**
 * Closed vocabulary of anatomical surface regions on a humanoid body: the
 * places another body or an object touches, strikes, grips or presents to.
 *
 * Names follow surface anatomy (Gray's Anatomy surface landmarks; the region
 * divisions of anatomical charts): head and face, neck, the anterior and
 * posterior trunk with the hypochondriac regions over the liver (right) and
 * spleen (left) and the lumbar regions over the kidneys, and the limbs by
 * segment and aspect. Paired regions carry their side, the body's own left
 * or right. Contact points the body itself presents (the palm, the index
 * fingertip, the sole, the heel, the seat) are regions too, so another body
 * or an object can be aimed at them. Each region is anchored to one humanoid bone and resolved to a
 * point and an outward normal on that bone's collision shapes by the engine,
 * so the same name serves a generated Human, an imported character or a
 * parametric figure. The list grows additively; no name is ever repurposed.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the anatomical source of the names, the side convention, the anchoring to bones and the additive growth rule.
 * @evidence contracts/development/design.md#principled-representation Surface-anatomy regions, each anchored to one humanoid bone, so a name means the same place on any rig.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Names only; the point and normal are resolved by the engine from each body's collision shapes.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts A closed union that grows additively and never repurposes a name, instead of free strings.
 */
export type AutoMovieHumanoidRegion =
  | "crown"
  | "forehead"
  | "face"
  | "noseBridge"
  | "nose"
  | "mouth"
  | "chin"
  | "jawLeft"
  | "jawRight"
  | "cheekLeft"
  | "cheekRight"
  | "templeLeft"
  | "templeRight"
  | "earLeft"
  | "earRight"
  | "headBack"
  | "throat"
  | "nape"
  | "neckLeft"
  | "neckRight"
  | "sternum"
  | "chestLeft"
  | "chestRight"
  | "solarPlexus"
  | "abdomen"
  | "liver"
  | "spleen"
  | "ribsLeft"
  | "ribsRight"
  | "upperBack"
  | "lowerBack"
  | "kidneyLeft"
  | "kidneyRight"
  | "groin"
  | "seat"
  | "pocketFrontLeft"
  | "pocketFrontRight"
  | "hipLeft"
  | "hipRight"
  | "shoulderLeft"
  | "shoulderRight"
  | "upperArmLeft"
  | "upperArmRight"
  | "elbowLeft"
  | "elbowRight"
  | "forearmLeft"
  | "forearmRight"
  | "wristLeft"
  | "wristRight"
  | "palmLeft"
  | "palmRight"
  | "handBackLeft"
  | "handBackRight"
  | "indexTipLeft"
  | "indexTipRight"
  | "thighFrontLeft"
  | "thighFrontRight"
  | "thighOuterLeft"
  | "thighOuterRight"
  | "thighInnerLeft"
  | "thighInnerRight"
  | "kneeLeft"
  | "kneeRight"
  | "shinLeft"
  | "shinRight"
  | "calfLeft"
  | "calfRight"
  | "footTopLeft"
  | "footTopRight"
  | "soleLeft"
  | "soleRight"
  | "heelLeft"
  | "heelRight";
