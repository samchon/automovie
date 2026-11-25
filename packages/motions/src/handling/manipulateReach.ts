import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanManipulate,
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import { typeText } from "../everyday/typeText";
import { HumanHand } from "../posture/HumanHand";

/**
 * Where the wrist stands for one press of a keyed contact sequence
 * (`manipulate`): the hand turned as the act keeps it, the pressing digit
 * straight, its tip over the site at typing's hover height (`typeText.HOVER`)
 * and advanced along the digit by as much as its swing down to the key's bottom
 * shortens its reach.
 *
 * A straight digit of length r from its first joint, swung down by the hover
 * height and the key's travel d, reaches sqrt(r^2 - d^2) ahead of that joint,
 * not r: a tip placed straight over the key would stop short of it by the
 * difference. The knuckle advances along the digit by r - sqrt(r^2 - d^2), and
 * the press is a swing about the first joint that ends on the key, which the
 * digit's own inverse kinematics then fits.
 *
 * @param body The body.
 * @param side The hand.
 * @param digit The pressing digit, as `manipulate.Finger` names it.
 * @param site The site, world metres.
 * @param normal The site's outward unit normal, world.
 * @param depth The key's travel, metres.
 * @param rotation The hand's world rotation from its rest for the act.
 * @returns The wrist's world point.
 */
export function manipulateReach(
  body: IAutoMovieMotionHumanBody,
  side: AutoMovieHumanSide,
  digit: string,
  site: IAutoMovieVector3,
  normal: IAutoMovieVector3,
  depth: number,
  rotation: IAutoMovieQuaternion,
): IAutoMovieVector3 {
  return manipulateReach.prepare(body, side, rotation, [digit])(
    digit,
    site,
    normal,
    depth,
  );
}

/**
 * Fixed-body preparation for the plan and fingering's repeated press
 * placements.
 */
export namespace manipulateReach {
  /**
   * Prepare each requested digit's straight geometry in the fixed hand frame.
   *
   * @param body The unchanged canonical body and rest skeleton.
   * @param side The hand.
   * @param rotation The fixed hand rotation from its rest for this sequence.
   * @param requested The sequence's digits. Omit to prepare every available
   *   digit.
   * @returns The wrist point for a digit, world site and normal, and key depth
   *   in metres.
   */
  export function prepare(
    body: IAutoMovieMotionHumanBody,
    side: AutoMovieHumanSide,
    rotation: IAutoMovieQuaternion,
    requested: Iterable<string> = DIGITS.keys(),
  ): (
    digit: string,
    site: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    depth: number,
  ) => IAutoMovieVector3 {
    const wristName: AutoMovieHumanoidBone = `${side}Hand`;
    const wrist: IAutoMovieVector3 | undefined = body.rest.get(wristName);
    const handed: "Left" | "Right" = side === "left" ? "Left" : "Right";
    const reached: ReadonlySet<AutoMovieHumanoidBone> =
      body.topology.reachableBones;
    const digits: Map<string, IDigit> = new Map();
    for (const digit of new Set(requested)) {
      const declared: IDigitSite | undefined = DIGITS.get(digit);
      if (
        declared === undefined ||
        wrist === undefined ||
        !reached.has(wristName)
      )
        continue;
      const first: AutoMovieHumanoidBone = `${side}${declared.first}`;
      const knuckle: IAutoMovieVector3 | undefined = body.rest.get(first);
      const region: IAutoMovieHumanoidSurfaces.IFrame | undefined =
        body.surfaces.regions[`${declared.surface}${handed}`];
      if (
        knuckle === undefined ||
        region === undefined ||
        !reached.has(region.bone)
      )
        continue;
      const tip: IAutoMovieVector3 = HumanHand.offset(
        body,
        side,
        declared.surface,
        "flat",
      ).point;
      const span: IAutoMovieVector3 = Vector3.subtract(
        tip,
        Vector3.subtract(knuckle, wrist),
      );
      digits.set(digit, {
        radius: Vector3.length(span),
        along: Vector3.normalize(Quaternion.rotateVector(rotation, span)),
        tip: Quaternion.rotateVector(rotation, tip),
      });
    }
    const geometry: ReadonlyMap<string, IDigit> = digits;
    return (
      digit: string,
      site: IAutoMovieVector3,
      normal: IAutoMovieVector3,
      depth: number,
    ): IAutoMovieVector3 => {
      const prepared: IDigit | undefined = geometry.get(digit);
      if (prepared === undefined)
        throw new TypeError(
          `The ${side} hand has no prepared reach for "${digit}".`,
        );
      const radius: number = prepared.radius;
      const drop: number = typeText.HOVER + depth;
      const slope: number = Vector3.dot(prepared.along, normal);
      const tangentSquared: number =
        drop * drop * Math.max(0, 1 - slope * slope);
      // Advance the knuckle by the chord's lost horizontal reach. An
      // oblique digit also drops along its own axis by drop * slope.
      const advance: number =
        radius -
        drop * slope -
        Math.sqrt(Math.max(0, radius * radius - tangentSquared));
      return Vector3.subtract(
        Vector3.addScaled(
          Vector3.addScaled(site, normal, typeText.HOVER),
          prepared.along,
          advance,
        ),
        prepared.tip,
      );
    };
  }
}

/** The first joint of a pressing digit before prefixing its hand side. */
type FirstJoint =
  | "ThumbMetacarpal"
  | `${"Index" | "Middle" | "Ring" | "Little"}Proximal`;

/** The flat tip and its pivot in a canonical hand. */
interface IDigitSite {
  /** The region read from the flat hand. */
  surface: `${IAutoMovieMotionHumanManipulate.Finger}Tip`;

  /** The first joint of the span to that tip. */
  first: FirstJoint;
}

/** A string address names one of the five authored digit sites. */
const DIGITS: ReadonlyMap<string, IDigitSite> = new Map<
  IAutoMovieMotionHumanManipulate.Finger,
  IDigitSite
>([
  ["thumb", { surface: "thumbTip", first: "ThumbMetacarpal" }],
  ["index", { surface: "indexTip", first: "IndexProximal" }],
  ["middle", { surface: "middleTip", first: "MiddleProximal" }],
  ["ring", { surface: "ringTip", first: "RingProximal" }],
  ["little", { surface: "littleTip", first: "LittleProximal" }],
]);

/** The actual straight-digit geometry in one fixed hand rotation. */
interface IDigit {
  /** The straight digit's first-joint-to-tip length, metres. */
  radius: number;

  /** Its unit direction in the fixed world hand rotation. */
  along: IAutoMovieVector3;

  /** Wrist-to-tip offset turned into that same world rotation, metres. */
  tip: IAutoMovieVector3;
}
