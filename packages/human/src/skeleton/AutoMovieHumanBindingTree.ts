import type { IAutoMovieHumanBindingArm } from "./IAutoMovieHumanBindingArm";
import type { IAutoMovieHumanBindingLimb } from "./IAutoMovieHumanBindingLimb";
import type { IAutoMovieHumanBindingPlane } from "./IAutoMovieHumanBindingPlane";
import type { IAutoMovieHumanBindingRegion } from "./IAutoMovieHumanBindingRegion";
import type { IAutoMovieHumanBindingTree } from "./IAutoMovieHumanBindingTree";
import { AutoMovieHumanAxillaBinding } from "./AutoMovieHumanAxillaBinding";
import { AutoMovieHumanBindingInfluence } from "./AutoMovieHumanBindingInfluence";
import { AutoMovieHumanBindingInputs } from "./AutoMovieHumanBindingInputs";
import { AutoMovieHumanBindingRegions } from "./AutoMovieHumanBindingRegions";
import { AutoMovieHumanCrotchBinding } from "./AutoMovieHumanCrotchBinding";
import { AutoMovieHumanHeadBinding } from "./AutoMovieHumanHeadBinding";
import { AutoMovieHumanHingeBinding } from "./AutoMovieHumanHingeBinding";
import type { AutoMovieHumanJointCentres } from "./AutoMovieHumanJointCentres";
import type { AutoMovieHumanJointTransition } from "./AutoMovieHumanJointTransition";
import { AutoMovieHumanJawBinding } from "./AutoMovieHumanJawBinding";
import { AutoMovieHumanKnuckleBinding } from "./AutoMovieHumanKnuckleBinding";
import { AutoMovieHumanLimbCapsule } from "./AutoMovieHumanLimbCapsule";
import { AutoMovieHumanSkeletonMath as Math3D } from "./AutoMovieHumanSkeletonMath";
import { AutoMovieHumanSkinStep } from "./AutoMovieHumanSkinStep";

/**
 * The binding tree of one body, grown from the fixed inputs the binding reads.
 *
 * Each joint becomes a limb that holds the capsule and the cut its region
 * declares ({@link AutoMovieHumanBindingRegions}); the tree knows no region. It
 * only finds a bone's region, sets the limbs beside each other, and then widens
 * every region's ramp to what its turn needs, reading the skin each sample's
 * leading bone holds under the starting ramps. Skin depth at a joint is the
 * distance to the nearest skin, measured, so a ramp follows the limb that is
 * there rather than a radius read elsewhere.
 */
export namespace AutoMovieHumanBindingTree {
  /**
   * The region that owns a Human joint.
   *
   * @param bone The Human joint.
   * @returns Its region, or undefined for a joint no region names (the root).
   */
  export function regionOf(
    bone: string,
  ): IAutoMovieHumanBindingRegion | undefined {
    return AutoMovieHumanBindingRegions.find(
      (r: IAutoMovieHumanBindingRegion): boolean => r.bones.test(bone),
    );
  }

  /**
   * Grow the binding tree.
   *
   * @param inputs The body's fixed binding inputs.
   * @param slotOf The rig slot of a Human joint's bone.
   * @param count Rig bones, the length of the pull table.
   * @returns The tree, its ramps sized.
   */
  export function grow(
    inputs: AutoMovieHumanBindingInputs.IInputs,
    slotOf: (bone: string) => number,
    count: number,
  ): IAutoMovieHumanBindingTree {
    const scale: number = inputs.scale;
    const joints: readonly AutoMovieHumanJointCentres.IJoint[] = inputs.joints;
    const skin: Float64Array = AutoMovieHumanBindingInputs.samples(inputs);
    const byBone: Map<string, AutoMovieHumanJointCentres.IJoint> = new Map(
      joints.map(
        (
          j: AutoMovieHumanJointCentres.IJoint,
        ): [string, AutoMovieHumanJointCentres.IJoint] => [j.bone, j],
      ),
    );
    const at: (bone: string) => Math3D.Vector = (
      bone: string,
    ): Math3D.Vector => Math3D.times(byBone.get(bone)!.position, scale);
    const limbs: Map<string, IAutoMovieHumanBindingLimb> = new Map();
    const directions: Map<string, Math3D.Vector> = new Map();

    for (const j of joints) {
      if (FOLDED.test(j.bone)) continue;
      const region: IAutoMovieHumanBindingRegion | undefined = regionOf(j.bone);
      const from: Math3D.Vector = Math3D.times(j.position, scale);
      const to: Math3D.Vector = (region?.end ?? AutoMovieHumanHingeBinding.end)({
        own: Math3D.times(j.tip ?? j.toward, scale),
        at,
      });

      // A limb's girth stands for its flesh unless its region says otherwise:
      // the thumb's metacarpal carries the thenar, the chest narrows into the
      // neck, and the clavicle has no flesh of its own.
      const capsule: IAutoMovieHumanBindingRegion.IRadii = (
        region?.radii ?? AutoMovieHumanHingeBinding.radii
      )({
        girth: AutoMovieHumanLimbCapsule.girth(j.radius, scale),
        from,
        to,
        skin,
        scale,
      });

      // A folded joint's children hang from the limb that carries it.
      let parent: string | null = j.parent;
      while (parent !== null && FOLDED.test(parent))
        parent = byBone.get(parent)!.parent;
      const above: IAutoMovieHumanBindingLimb | null =
        parent === null ? null : limbs.get(parent)!;
      const limb: IAutoMovieHumanBindingLimb = {
        bone: j.bone,
        slot: slotOf(j.bone),
        parent: above,
        from,
        to,
        near: capsule.near,
        far: capsule.far,
        turn: inputs.turns.get(j.bone) ?? 0,
        planes: [],
        lips: null,
        midline: 0,
        clear: null,
        side: j.bone.startsWith("left") ? 1 : j.bone.startsWith("right") ? -1 : 0,
        rivals: [],
        own: [],
        contest: 0,
        kids: [],
      };
      limbs.set(j.bone, limb);
      directions.set(j.bone, Math3D.unit(Math3D.sub(to, from)));
      if (above === null) continue;
      const d: Math3D.Vector = directions.get(j.bone)!;
      const e: Math3D.Vector = directions.get(parent!)!;
      const reach: number = AutoMovieHumanHingeBinding.reach(
        AutoMovieHumanLimbCapsule.depth(from, skin),
        above.near,
        capsule.radius,
      );

      // The region decides the cut's normal and where it lies.
      const normal: Math3D.Vector = (
        region?.normal ?? AutoMovieHumanHingeBinding.normal
      )(e, d, limb.side);
      const plane: IAutoMovieHumanBindingPlane | null = (
        region?.plane ?? AutoMovieHumanHingeBinding.plane
      )(from, normal, reach);
      if (plane !== null) limb.planes = [plane];
      region?.attach?.(limb, d, reach);

      // Within one bone there is nothing to cut: the toes are one channel.
      if (above.slot !== limb.slot) above.kids.push(limb);
    }

    // Digits are told from their neighbours by capsule, and a region may tell
    // its digit from more (the thumb from the palm).
    const digits: IAutoMovieHumanBindingLimb[] = [];
    for (const j of joints) {
      const region: IAutoMovieHumanBindingRegion | undefined = regionOf(j.bone);
      if (region?.digit !== true) continue;
      const limb: IAutoMovieHumanBindingLimb | undefined = limbs.get(j.bone);
      if (limb === undefined || limb.parent === null) continue;
      const hand: IAutoMovieHumanBindingLimb = limb.parent;
      if (!hand.kids.includes(limb)) continue;
      AutoMovieHumanKnuckleBinding.attach(limb, hand, region.rivals?.(hand) ?? []);
      digits.push(limb);
    }

    // The head is a ball from the chin to the crown, set against the neck, and
    // the jaw's cuts are its own.
    const head: IAutoMovieHumanBindingLimb = limbs.get("head")!;
    const jaw: IAutoMovieHumanBindingLimb = limbs.get("jaw")!;
    const crown: Math3D.Vector = head.to;
    AutoMovieHumanHeadBinding.ball(head, limbs.get("neck")!, jaw.to, crown, skin);
    jaw.lips = inputs.lips;
    jaw.planes = AutoMovieHumanJawBinding.planes(
      jaw.from,
      jaw.to,
      at("leftEye"),
      crown,
      inputs.lips,
    );

    const arm: (side: "left" | "right") => IAutoMovieHumanBindingArm = (
      side: "left" | "right",
    ): IAutoMovieHumanBindingArm => {
      const limb: IAutoMovieHumanBindingLimb = limbs.get(`${side}Shoulder`)!;
      limbs.get("chest")!.kids = limbs
        .get("chest")!
        .kids.filter((k: IAutoMovieHumanBindingLimb): boolean => k !== limb);
      return {
        limb,
        own: AutoMovieHumanLimbCapsule.family(limb),
        contest: AutoMovieHumanAxillaBinding.least(
          AutoMovieHumanLimbCapsule.depth(at(`${side}UpperArm`), skin),
        ),
      };
    };
    const arms: IAutoMovieHumanBindingArm[] = [arm("left"), arm("right")];
    const armed: Set<IAutoMovieHumanBindingLimb> = new Set(
      arms.flatMap((a: IAutoMovieHumanBindingArm): IAutoMovieHumanBindingLimb[] => a.own),
    );
    const trunk: IAutoMovieHumanBindingLimb[] = [...limbs].flatMap(
      ([bone, limb]: [string, IAutoMovieHumanBindingLimb]): IAutoMovieHumanBindingLimb[] =>
        armed.has(limb) || /Toe\d|Hallux/.test(bone) ? [] : [limb],
    );
    for (const a of arms) a.limb.rivals = trunk;
    const tree: IAutoMovieHumanBindingTree = {
      root: limbs.get("hips")!,
      chest: limbs.get("chest")!.slot,
      arms,
    };
    size(tree, [...limbs.values()], digits, skin, count, inputs.crotch);
    return tree;
  }

  /**
   * Widen every limb's ramp to what its joint's turn needs, by its pieces: each
   * joint's transition per sector, the legs' release below the crotch, the
   * digits' bands and the arms' band against the trunk. Rho is read on the
   * skin each sample's leading bone holds under the starting ramps.
   */
  function size(
    tree: IAutoMovieHumanBindingTree,
    limbs: readonly IAutoMovieHumanBindingLimb[],
    digits: readonly IAutoMovieHumanBindingLimb[],
    skin: Float64Array,
    count: number,
    crotch: number,
  ): void {
    // The bone that holds each skin sample under the starting ramps.
    const holder: Int32Array = new Int32Array(skin.length / 3);
    for (let i: number = 0; i < holder.length; i++)
      holder[i] = AutoMovieHumanBindingInfluence.influences(
        [skin[3 * i]!, skin[3 * i + 1]!, skin[3 * i + 2]!],
        tree,
        count,
      )[0]![0];

    // Each sector round the joint takes the half its own farthest skin needs:
    // the thin side of a joint turns on a short ramp, so the segment beside it
    // stays straight, and the thick side gets the length its stretch needs.
    const halves: Map<IAutoMovieHumanBindingLimb, number> = new Map();
    for (const limb of limbs) {
      const plane: IAutoMovieHumanBindingPlane | undefined = limb.planes[0];
      if (limb.parent === null || plane === undefined || limb.lips !== null)
        continue;
      if (plane.step !== AutoMovieHumanSkinStep.slide) continue;
      const sectors: AutoMovieHumanJointTransition.ISectors =
        AutoMovieHumanHingeBinding.size(limb, skin, holder);
      plane.sectors = sectors;
      plane.half = sectors.most;
      halves.set(limb, sectors.most);
    }
    for (const limb of limbs)
      AutoMovieHumanCrotchBinding.place(limb, crotch, halves.get(limb));
    for (const digit of digits)
      AutoMovieHumanKnuckleBinding.widen(digit, halves.get(digit) ?? 0);

    // The arm against the trunk, from the elbow's ramp down where the two are apart.
    for (const arm of tree.arms)
      AutoMovieHumanAxillaBinding.fit(
        arm,
        skin,
        holder,
        halves.get(
          arm.limb.kids.find((k: IAutoMovieHumanBindingLimb): boolean =>
            /UpperArm$/.test(k.bone),
          )!,
        ) ?? 0,
      );
  }
}

/** Joints that carry no skin of their own: their rig bones ride the next. */
const FOLDED: RegExp = /(Scapula|Subtalar|Midfoot|Eye)$|^atlas$/;
