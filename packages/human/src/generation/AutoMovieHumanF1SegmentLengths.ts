import { AutoMovieHumanSegmentFrame as F } from "./AutoMovieHumanSegmentFrame";
import {
  AutoMovieHumanSegmentScaling as Scaling,
} from "./AutoMovieHumanSegmentScaling";
import { AutoMovieHumanF1Placing as T } from "./AutoMovieHumanF1Placing";
import type {
  AutoMovieVector3Tuple,
  IAutoMovieHumanF1Placing,
  IAutoMovieHumanF1SegmentLengths,
  IAutoMovieHumanSegmentJoint,
} from "@automovie/interface";

/**
 * f1's segment lengths as working fields (#3172) and the chain they make: each length moves the joint at its segment's far end, so the
 * joint centres, the relative frames and every datum stored past it follow (`AutoMovieHumanSegmentScaling`). The law is the limb law's
 * (`test/src/reference-conics/FamilyConicLimbLaw.ts`, `chainWith`, `extremityFrames`), proved on f1 in step 2 of #3151.
 *
 * Every length is a joint-centre distance of the bind skeleton in millimetres, a rigid quantity of the segment that no posture changes.
 * f1's values are read from her chain (`AutoMovieHumanF1Placing.CHAIN`, the reference rig's bind joints re-based), never stored here, so
 * `reference()` is f1 exactly and `chain(reference())` is the stored chain itself. A published landmark length differs from its joint
 * centre length by the landmark-to-centre offsets (de Leva 1996, `docs/anatomy/skeleton.md`): ANSUR II acromion-radiale is the upper arm
 * from the acromion to radiale, ISO 7250-1 6.3.1 hand length is stylion to dactylion III, ISO 8559-1 5.5.5 foot length is pternion to the
 * longest toe's tip; their conversion is a separate input adapter, not this law.
 */
export namespace AutoMovieHumanF1SegmentLengths {

  /*
   * The fingers and their segment prefixes; the thumb's bones are its metacarpal's, proximal's and distal's.
   */
  const FINGERS: readonly string[] = ["index", "middle", "ring", "pinky", "thumb"];

  /*
   * The toes, whose later joints follow the foot's length (no source gives a toe's bones).
   */
  const TOES: readonly string[] = ["bigtoe", "indextoe", "middletoe", "ringtoe", "littletoe"];

  const joint = (name: string): IAutoMovieHumanSegmentJoint => {
    const found: IAutoMovieHumanSegmentJoint | undefined = T.CHAIN.find((j: IAutoMovieHumanSegmentJoint): boolean => j.name === name);
    if (found === undefined) throw new Error("f1's chain has no joint " + name);
    return found;
  };
  const norm = (v: AutoMovieVector3Tuple): number => Math.hypot(v[0], v[1], v[2]);

  /*
   * The hand's and the foot's axes in their own frames: the hand along the wrist centre's line to the middle finger's first joint, across
   * from the fifth metacarpal head to the second, square to it; the foot along its course end square to the sole's normal
   * (`leg.fan.up`), across from the fifth toe's first joint to the first, square to both. The limb law's `extremityAxes`.
   */
  function axes(): { hand: [AutoMovieVector3Tuple, AutoMovieVector3Tuple]; foot: [AutoMovieVector3Tuple, AutoMovieVector3Tuple] } {
    const handAlong: AutoMovieVector3Tuple = F.unit(joint("middle.proximal").offset);
    const handAcross: AutoMovieVector3Tuple = F.perpendicular(F.sub(joint("index.proximal").offset, joint("pinky.proximal").offset), handAlong);
    const up: AutoMovieVector3Tuple = F.unit(T.DIRECTIONS["leg.fan.up"]!.local);
    const footAlong: AutoMovieVector3Tuple = F.perpendicular(T.POINTS["footEnd"]!.local, up);
    const footAcross: AutoMovieVector3Tuple = F.perpendicular(F.perpendicular(F.sub(joint("bigtoe.proximal").offset, joint("littletoe.proximal").offset), up), footAlong);
    return { hand: [handAlong, handAcross], foot: [footAlong, footAcross] };
  }

  /*
   * The digits' later joints: a finger's middle and distal, the thumb's proximal and distal, by bone index.
   */
  const bone = (name: string): [string, number] | null => {
    const [digit, part] = name.split(".");
    if (digit === undefined || part === undefined || !FINGERS.includes(digit)) return null;
    if (digit === "thumb") return part === "proximal" ? [digit, 0] : part === "distal" ? [digit, 1] : null;
    return part === "middle" ? [digit, 0] : part === "distal" ? [digit, 1] : null;
  };

  /**
   * f1's own lengths, read from her chain and datums.
   *
   * @evidence contracts/development/implementation.md#principled-implementation Each length is the norm or projection of the stored offset its definition names.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One reading per field.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No length is a stored literal; an absent joint is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work over the chain.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure reading coordinates no shared work.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one plain record.
   */
  export function reference(): IAutoMovieHumanF1SegmentLengths.IFields {
    const { hand, foot } = axes();
    const phalanges: Record<string, IAutoMovieHumanF1SegmentLengths.IBones> = Object.fromEntries(
      FINGERS.map((digit: string): [string, IAutoMovieHumanF1SegmentLengths.IBones] => {
        const [a, b] = digit === "thumb" ? ["thumb.proximal", "thumb.distal"] : [digit + ".middle", digit + ".distal"];
        return [digit, [norm(joint(a!).offset), norm(joint(b!).offset), norm(T.POINTS[digit + "End"]!.local)]];
      }),
    );
    return {
      upperArm: norm(joint("forearm").offset),
      forearm: norm(joint("hand").offset),
      thigh: norm(joint("tibia").offset),
      shank: norm(joint("foot").offset),
      pelvisToThorax: norm(joint("thorax").offset),
      thoraxToHead: norm(joint("head").offset),
      handLength: F.dot(joint("middle.proximal").offset, hand[0]),
      handBreadth: F.dot(F.sub(joint("index.proximal").offset, joint("pinky.proximal").offset), hand[1]),
      footLength: F.dot(T.POINTS["footEnd"]!.local, foot[0]),
      footBreadth: F.dot(F.sub(joint("bigtoe.proximal").offset, joint("littletoe.proximal").offset), foot[1]),
      phalanges,
    };
  }

  /** f1's lengths, read once. */
  export const F1: IAutoMovieHumanF1SegmentLengths.IFields = reference();

  /*
   * The ratios of a person's lengths to f1's; exactly one where they are equal.
   */
  function ratios(fields: IAutoMovieHumanF1SegmentLengths.IFields): Record<Exclude<keyof IAutoMovieHumanF1SegmentLengths.IFields, "phalanges">, number> & { phalanges: Record<string, IAutoMovieHumanF1SegmentLengths.IBones> } {
    const r = (key: Exclude<keyof IAutoMovieHumanF1SegmentLengths.IFields, "phalanges">): number => fields[key] / F1[key];
    return {
      upperArm: r("upperArm"),
      forearm: r("forearm"),
      thigh: r("thigh"),
      shank: r("shank"),
      pelvisToThorax: r("pelvisToThorax"),
      thoraxToHead: r("thoraxToHead"),
      handLength: r("handLength"),
      handBreadth: r("handBreadth"),
      footLength: r("footLength"),
      footBreadth: r("footBreadth"),
      phalanges: Object.fromEntries(
        FINGERS.map((digit: string): [string, IAutoMovieHumanF1SegmentLengths.IBones] => {
          const base: IAutoMovieHumanF1SegmentLengths.IBones = F1.phalanges[digit]!;
          const own: IAutoMovieHumanF1SegmentLengths.IBones = fields.phalanges[digit] ?? base;
          return [digit, [own[0] / base[0], own[1] / base[1], own[2] / base[2]]];
        }),
      ),
    };
  }

  /**
   * The chain at a person's lengths: each long bone's far joint scaled by its length's ratio, the digits' and toes' first joints and the
   * datums stored in the hand and the foot scaled along and across them, each finger's later joints by its bones' ratios and each toe's
   * by the foot's length. f1's lengths return the stored chain itself.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The limb law's chain: a segment's length moves its far joint along the segment; the hand's and the foot's spread their children by along and across ratios.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One scale table handed to the shared chain edit.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Nonpositive or nonfinite lengths are refused by the edit; rotations are never touched.
   * @evidence contracts/development/implementation.md#efficient-algorithms Linear in the chain's length.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work An unchanged person borrows the stored chain.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns the stored chain or one edited array.
   */
  export function chain(fields: IAutoMovieHumanF1SegmentLengths.IFields, base: readonly IAutoMovieHumanSegmentJoint[] = T.CHAIN): readonly IAutoMovieHumanSegmentJoint[] {
    const k = ratios(fields);
    const { hand, foot } = axes();
    const spreadHand: (p: AutoMovieVector3Tuple) => AutoMovieVector3Tuple = Scaling.spread(hand[0], hand[1], k.handLength, k.handBreadth);
    const spreadFoot: (p: AutoMovieVector3Tuple) => AutoMovieVector3Tuple = Scaling.spread(foot[0], foot[1], k.footLength, k.footBreadth);
    const scales: Map<string, Scaling.IScale> = new Map<string, Scaling.IScale>([
      ["forearm", k.upperArm],
      ["hand", k.forearm],
      ["tibia", k.thigh],
      ["foot", k.shank],
      ["thorax", k.pelvisToThorax],
      ["head", k.thoraxToHead],
    ]);

    // A joint whose parent is the hand or the foot is spread with it, before any bone ratio of its own name (the limb law's order).
    for (const j of base) {
      const later: [string, number] | null = bone(j.name);
      const [digit, part] = j.name.split(".");
      if (j.parent === "hand") scales.set(j.name, spreadHand);
      else if (j.parent === "foot") scales.set(j.name, spreadFoot);
      else if (later !== null) scales.set(j.name, k.phalanges[later[0]]![later[1]]!);
      else if (digit !== undefined && TOES.includes(digit) && part === "distal") scales.set(j.name, k.footLength);
    }
    return Scaling.chain(base, scales);
  }

  /**
   * A stored datum's local coordinates at a person's lengths: a datum of the hand or the foot spread with its segment, a digit's end by its
   * last bone's ratio (a toe's by the foot's length); every other datum as stored.
   *
   * @evidence contracts/development/implementation.md#principled-implementation The limb law's `extremityFrames.local`, so courses ending in the hand, the foot and the digits follow their segments.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One branch per kind of segment.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts An unknown datum is refused.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The stored local is borrowed at ratio one.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one point.
   */
  export function local(fields: IAutoMovieHumanF1SegmentLengths.IFields, name: string): AutoMovieVector3Tuple {
    const placed: IAutoMovieHumanF1Placing.IPlaced | undefined = T.POINTS[name];
    if (placed === undefined) throw new Error("f1 has no datum " + name);
    const k = ratios(fields);
    const { hand, foot } = axes();
    if (placed.frame === "hand") return Scaling.spread(hand[0], hand[1], k.handLength, k.handBreadth)(placed.local);
    if (placed.frame === "foot") return Scaling.spread(foot[0], foot[1], k.footLength, k.footBreadth)(placed.local);
    const end: RegExpMatchArray | null = name.match(/^([a-z]+)End$/);
    if (end !== null && placed.frame.endsWith(".distal")) {
      const ratio: number = TOES.includes(end[1]!) ? k.footLength : (k.phalanges[end[1]!]?.[2] ?? 1);
      return ratio === 1 ? placed.local : F.scale(placed.local, ratio);
    }
    return placed.local;
  }
}
