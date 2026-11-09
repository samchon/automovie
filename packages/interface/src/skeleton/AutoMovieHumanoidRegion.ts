/**
 * Closed vocabulary of anatomical surface regions on a humanoid body: the
 * places another body or an object touches, strikes, grips or presents to.
 *
 * Names follow surface anatomy (Gray's Anatomy surface landmarks; the region
 * divisions of anatomical charts): head and face, neck, the anterior and
 * posterior trunk with the hypochondriac regions over the liver (right) and
 * spleen (left) and the lumbar regions over the kidneys, and the limbs by
 * segment and aspect. Paired regions carry their side, the body's own left
 * or right. Each region is anchored to one humanoid bone and resolved to a
 * point and an outward normal on that bone's collision shapes by the engine,
 * so the same name serves a generated Human, an imported character or a
 * parametric figure. The list grows additively; no name is ever repurposed.
 */
export type AutoMovieHumanoidRegion =
  | "headTop"
  | "forehead"
  | "face"
  | "nose"
  | "chin"
  | "jawLeft"
  | "jawRight"
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
  | "handBackLeft"
  | "handBackRight"
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
  | "footTopRight";
