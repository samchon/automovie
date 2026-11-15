import { Quaternion, Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import { ArchetypeFrame, ArchetypeUnits, type ArchetypeBuilder } from "../core";
import type { createCannon } from "./createCannon";

/** The 1862 Ordnance Manual, read at its scan. */
const ORDNANCE: string =
  "Ordnance Manual for the Use of the Officers of the United States Army, 3rd ed., Lippincott, Philadelphia 1862 (https://archive.org/details/ordnancemanualfo00unitrich)";

/** Gibbon's manual, read at its scan. */
const GIBBON: string =
  "John Gibbon, The Artillerist's Manual, Van Nostrand, New York 1860 (https://archive.org/details/bub_gb_8FEkwTZd9FMC)";

/** An inch, metres. */
const IN: number = ArchetypeUnits.INCH;

/**
 * The 6-pdr bronze field gun, Model 1839-1844, on its M1841 carriage, as the 1862 Ordnance Manual gives them, in metres, kilograms and degrees, and the builder that draws them: kept apart from {@link createCannon} so each file stays within its size.
 *
 * The gun stands on level ground at `y = 0`, its axle across `X` at `z = 0`, its muzzle toward `+Z`. Every place an act reads comes from a read figure or is derived from read figures; the construction estimates below size only parts no act reads, and the elevating screw's place, read from an undimensioned plate, is provisional.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States the frame, what each figure is and its page, and which places are provisional or construction.
 * @evidence contracts/development/design.md#principled-representation The read figures as named members converted through `ArchetypeUnits`, the construction estimates apart, and one builder.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Read by `createCannon`'s bands and its producer, which calls `build`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every construction estimate is named as one; the vent's lean and the screw's place say where they come from.
 */
export namespace FIELD_GUN {
  /** The tube's table (p. 19), the carriage's (p. 74), the wheel's and axle's (p. 68), the vent (p. 16), Plate 2, and Gibbon's vent and trunnions. */
  export const SOURCE: string = `${ORDNANCE}: Principal Dimensions and Weights of Guns, Model 1839-1844, brass field 6-pdr, p. 19; Principal Dimensions and Weights of Field-Gun Carriages and Limbers, 6-pdr gun, p. 74; Wheels No. 1 and Axle-Trees No. 1, p. 68; the vent, p. 16; Plate 2, Field Carriage, undimensioned; ${GIBBON}, pp. 60, 62 and 306`;

  /** The tube (p. 19). */
  export const TUBE: Readonly<
    Record<
      | "bore"
      | "boreLength"
      | "baseRing"
      | "whole"
      | "breech"
      | "swell"
      | "trunnion"
      | "trunnionLength"
      | "rimbases"
      | "trunnionToFace"
      | "mass"
      | "preponderance",
      number
    >
  > = {
    /** The bore's diameter, 3.67 in. */
    bore: 3.67 * IN,
    /** The bore's length, 57.5 in. */
    boreLength: 57.5 * IN,
    /** From the rear of the base-ring to the face of the muzzle, 60 in. */
    baseRing: 60 * IN,
    /** The whole length of the piece, 65.6 in; the cascabel is the rest behind the base-ring. */
    whole: 65.6 * IN,
    /** The base-ring's diameter, 10.3 in. */
    breech: 10.3 * IN,
    /** The swell of the muzzle's diameter, twice its 4.125 in semi-diameter. */
    swell: 2 * 4.125 * IN,
    /** The trunnions' diameter, 3.67 in. */
    trunnion: 3.67 * IN,
    /** Each trunnion's length, 2.8 in. */
    trunnionLength: 2.8 * IN,
    /** Between the rimbases, 9.5 in. */
    rimbases: 9.5 * IN,
    /** From the trunnions' axis to the face of the muzzle, 34.91 in. */
    trunnionToFace: 34.91 * IN,
    /** The piece's weight, 884 lb. */
    mass: 884 * ArchetypeUnits.POUND,
    /** Its preponderance, 47 lb: the weight the breech bears on a support at the rear of the base-ring, the piece hung on its trunnions (p. 15). */
    preponderance: 47 * ArchetypeUnits.POUND,
  };

  /** The carriage (pp. 68 and 74). */
  export const CARRIAGE: Readonly<
    Record<
      | "trunnionHeight"
      | "trunnionBehind"
      | "trailContact"
      | "trailEnd"
      | "plates"
      | "elevation"
      | "depression"
      | "wheel"
      | "track"
      | "axle"
      | "arm"
      | "tyre"
      | "spokes"
      | "mass"
      | "wheelMass"
      | "axleMass",
      number
    >
  > = {
    /** The trunnions' axis above the ground, 43.1 in. */
    trunnionHeight: 43.1 * IN,
    /** The trunnions' axis behind the axle-tree's, the piece in battery on level ground, 0.5 in. */
    trunnionBehind: 0.5 * IN,
    /** Between the points where the trail and the wheels touch the ground, 74.4 in. */
    trailContact: 74.4 * IN,
    /** From the front of the wheels to the end of the trail, the piece in battery, 116.6 in. */
    trailEnd: 116.6 * IN,
    /** Between the insides of the trunnion-plates, 9.6 in. */
    plates: 9.6 * IN,
    /** The gun's vertical field of fire above the horizontal, 12 degrees. */
    elevation: 12,
    /** And below it, 8 degrees. */
    depression: 8,
    /** The wheel's height, 57 in. */
    wheel: 57 * IN,
    /** The track of the wheels, 60 in. */
    track: 60 * IN,
    /** The axle-tree's whole length, 78.84 in. */
    axle: 78.84 * IN,
    /** The axle-tree's arm at the shoulder, 3 in across. */
    arm: 3 * IN,
    /** Wheel No. 1's tire, 2.75 in wide. */
    tyre: 2.75 * IN,
    /** Wheel No. 1's spokes, 14. */
    spokes: 14,
    /** The gun-carriage without wheels, 540 lb. */
    mass: 540 * ArchetypeUnits.POUND,
    /** One wheel, 180 lb. */
    wheelMass: 180 * ArchetypeUnits.POUND,
    /** Axle-tree No. 1, 116 lb, part of the carriage's 540. */
    axleMass: 116 * ArchetypeUnits.POUND,
  };

  /** The vent (p. 16): it "is in the vertical plane passing through the axis, and makes an angle of 80° with it. It enters the bore at a distance from the bottom equal to one-fourth the diameter of the bore"; its outer end leans to the rear, the gunner's side (Gibbon, p. 306: "The vent of most pieces being inclined to the rear"). */
  export const VENT: number = 80;

  /**
   * Construction estimates, read by no act, each sizing a part the manual gives no figure for:
   *
   * - `cascabel`: the cascabel's knob radius as a share of the base-ring's.
   * - `stockDepth`: the stock's depth as a share of its width, the trunnion-plates' read 9.6 in.
   * - `spoke`: a spoke's radius as a share of the tire's width.
   * - `nave`: the nave's radius as a multiple of the axle arm's.
   * - `naveLength`: the nave's length as a multiple of the tire's width.
   */
  export const ESTIMATES: Readonly<
    Record<"cascabel" | "stockDepth" | "spoke" | "nave" | "naveLength", number>
  > = {
    cascabel: 0.5,
    stockDepth: 0.75,
    spoke: 0.25,
    nave: 3,
    naveLength: 3,
  };

  /**
   * Builds the field gun on the producer's builder: the tube on its trunnions, the cheeks and the stock to the trail's end, the axle and the two wheels, with every part's share of the read weights.
   *
   * The tube's 884 lb is shared between its breech and its chase so that the breech bears the read 47 lb preponderance at the rear of the base-ring; the trunnions take their volume's part at the tube's mean density. The carriage's wood and irons share its 540 lb less the axle-tree's read 116 lb by volume, and each wheel carries its read 180 lb by the volumes of its disc, spokes and nave.
   *
   * @param builder The producer's builder.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what is built and how the weights are shared.
   * @evidence contracts/development/implementation.md#principled-implementation The tube lies level with its axis on the trunnions' axis (Gibbon, p. 62: "In all our pieces, the axis of the trunnions is in the same plane with the axis of the piece"), the trunnions 43.1 in up and 0.5 in behind the axle, so its muzzle stands 5.91 in ahead of the wheels as p. 74 reads; the trail's underside runs from the top of the axle arm to its ground contact 74.4 in behind the wheels', and lies on the ground to its end 116.6 in behind their front; the elevation is a hinge on the trunnions' axis.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The tube, the carriage, the wheels, then the affordances.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tube is two rods at the base-ring's and the swell's diameters meeting at the trunnions, the cheeks and stock are boxes, a wheel is a disc of its tire's width with its spokes.
   * @evidence contracts/development/implementation.md#efficient-algorithms About twenty parts.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Builds one model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function build(
    builder: ArchetypeBuilder<createCannon.Affordance, createCannon.Dimension>,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const t: typeof TUBE = TUBE;
    const c: typeof CARRIAGE = CARRIAGE;
    const e: typeof ESTIMATES = ESTIMATES;
    const bronze: string = "#8c6a3a";
    const wood: string = "#6b5a3e";
    const iron: string = "#3f4246";

    // The places along Z: the trunnions' axis, the muzzle's face, the base-ring's rear and the cascabel's end.
    const radius: number = c.wheel / 2;
    const axis: number = c.trunnionHeight;
    const trunnions: number = -c.trunnionBehind;
    const muzzle: number = trunnions + t.trunnionToFace;
    const base: number = muzzle - t.baseRing;
    const end: number = muzzle - t.whole;

    // The tube's shares: the breech bears the preponderance at the base-ring's rear.
    const breech: number = t.breech / 2;
    const chase: number = t.swell / 2;
    const knob: number = breech * e.cascabel;
    const trunnion: number = t.trunnion / 2;
    const vBreech: number = Math.PI * breech * breech * (trunnions - base);
    const vKnob: number = Math.PI * knob * knob * (base - end);
    const vChase: number = Math.PI * chase * chase * (muzzle - trunnions);
    const vTrunnions: number = 2 * Math.PI * trunnion * trunnion * t.trunnionLength;
    const density: number = t.mass / (vBreech + vKnob + vChase + vTrunnions);
    const tube: number = t.mass - density * vTrunnions;
    const rearArm: number =
      (vBreech * (trunnions - base) / 2 + vKnob * (trunnions - (base + end) / 2)) /
      (vBreech + vKnob);
    const frontArm: number = (muzzle - trunnions) / 2;
    const rear: number =
      (t.preponderance * (trunnions - base) + tube * frontArm) / (rearArm + frontArm);
    const front: number = tube - rear;

    // The carriage's and wheels' shares of the whole.
    const total: number = t.mass + c.mass + 2 * c.wheelMass;
    builder.rod("breech", breech, v(0, axis, base), v(0, axis, trunnions), {
      color: bronze,
      share: (rear * vBreech) / (vBreech + vKnob) / total,
    });
    builder.rod("cascabel", knob, v(0, axis, end), v(0, axis, base), {
      color: bronze,
      share: (rear * vKnob) / (vBreech + vKnob) / total,
    });
    builder.rod("chase", chase, v(0, axis, trunnions), v(0, axis, muzzle), {
      color: bronze,
      share: front / total,
    });
    builder.rod(
      "trunnions",
      trunnion,
      v(-(t.rimbases / 2 + t.trunnionLength), axis, trunnions),
      v(t.rimbases / 2 + t.trunnionLength, axis, trunnions),
      { color: bronze, share: (density * vTrunnions) / total },
    );

    // The carriage: the trail's underside from the top of the axle arm to its ground contact, then on the ground to its end.
    const width: number = c.plates;
    const depth: number = width * e.stockDepth;
    const arm: number = c.arm / 2;
    const contact: number = -c.trailContact;
    const trailEnd: number = radius - c.trailEnd;
    const slope: number = Math.atan2(radius + arm, -contact);
    const run: number = Math.hypot(radius + arm, contact);
    const under: IAutoMovieVector3 = v(0, (radius + arm) / 2, contact / 2);
    const stockCentre: IAutoMovieVector3 = Vector3.add(
      under,
      v(0, (depth / 2) * Math.cos(slope), (-depth / 2) * Math.sin(slope)),
    );
    const vStock: number = width * depth * run;
    const vTrail: number = width * depth * (contact - trailEnd);
    const cheek: number = t.trunnionLength;
    const cheekLength: number = trunnions + trunnion - (base - trunnion);
    const cheekHeight: number = axis - radius;
    const vCheeks: number = 2 * cheek * cheekLength * cheekHeight;
    // The screw stands on the stock's top at the base-ring's rear and reaches the breech's underside.
    const screwTop: number = axis - breech;
    const screwFoot: number =
      ((radius + arm) * (base - contact)) / -contact + depth / Math.cos(slope);
    const vScrew: number = Math.PI * arm * arm * (screwTop - screwFoot);
    const wooden: number = c.mass - c.axleMass;
    const vWood: number = vStock + vTrail + vCheeks + vScrew;
    builder.box("stock", v(width, depth, run), stockCentre, {
      color: wood,
      rotation: Quaternion.fromAxisAngle(v(1, 0, 0), (-slope * 180) / Math.PI),
      share: (wooden * vStock) / vWood / total,
    });
    builder.box(
      "trail",
      v(width, depth, contact - trailEnd),
      v(0, depth / 2, (contact + trailEnd) / 2),
      { color: wood, share: (wooden * vTrail) / vWood / total },
    );
    for (const [side, sign] of [
      ["left", 1],
      ["right", -1],
    ] as const)
      builder.box(
        `cheek-${side}`,
        v(cheek, cheekHeight, cheekLength),
        v(sign * (width / 2 + cheek / 2), (axis + radius) / 2, (trunnions + trunnion + base - trunnion) / 2),
        { color: wood, share: (wooden * vCheeks) / 2 / vWood / total },
      );
    builder.rod("screw", arm, v(0, screwFoot, base), v(0, screwTop, base), {
      color: iron,
      share: (wooden * vScrew) / vWood / total,
    });
    builder.rod("axle", arm, v(-c.axle / 2, radius, 0), v(c.axle / 2, radius, 0), {
      color: iron,
      share: c.axleMass / total,
    });

    // The wheels: a disc of the tire's width, its spokes through the nave, turning on the axle.
    const spoke: number = c.tyre * e.spoke;
    const nave: number = arm * e.nave;
    const naveLength: number = c.tyre * e.naveLength;
    const vDisc: number = Math.PI * radius * radius * c.tyre;
    const vSpokes: number = (c.spokes / 2) * Math.PI * spoke * spoke * 2 * radius;
    const vNave: number = Math.PI * nave * nave * naveLength;
    const vWheel: number = vDisc + vSpokes + vNave;
    for (const [k, side, sign] of [
      [0, "left", 1],
      [1, "right", -1],
    ] as const) {
      const x: number = (sign * c.track) / 2;
      const parts: string[] = [`wheel-${side}`, `nave-${side}`];
      builder.rod(`wheel-${side}`, radius, v(x - c.tyre / 2, radius, 0), v(x + c.tyre / 2, radius, 0), {
        color: wood,
        share: (c.wheelMass * vDisc) / vWheel / total,
      });
      builder.rod(`nave-${side}`, nave, v(x - naveLength / 2, radius, 0), v(x + naveLength / 2, radius, 0), {
        color: wood,
        share: (c.wheelMass * vNave) / vWheel / total,
      });
      for (let n: number = 0; n < c.spokes / 2; n++) {
        const angle: number = (2 * Math.PI * n) / c.spokes;
        const along: IAutoMovieVector3 = v(0, Math.cos(angle) * radius, Math.sin(angle) * radius);
        const hub: IAutoMovieVector3 = v(x + sign * (c.tyre / 2 + spoke), radius, 0);
        builder.rod(`spoke-${side}-${n}`, spoke, Vector3.subtract(hub, along), Vector3.add(hub, along), {
          color: wood,
          share: (c.wheelMass * vSpokes) / (c.spokes / 2) / vWheel / total,
        });
        parts.push(`spoke-${side}-${n}`);
      }
      builder.affordance({
        id: k === 0 ? "leftSpin" : "rightSpin",
        kind: "knob",
        frame: ArchetypeFrame.facing(v(x, radius, 0), v(1, 0, 0), v(0, 1, 0)),
        extent: null,
        travel: 360,
        parts,
      });
    }

    // The elevation: a hinge on the trunnions' axis whose positive travel raises the muzzle up to the read 12 degrees and whose reverse lowers it the read 8.
    builder.affordance({
      id: "elevation",
      kind: "hinge",
      frame: ArchetypeFrame.facing(v(0, axis, trunnions), v(-1, 0, 0), v(0, 0, 1)),
      extent: null,
      travel: c.elevation,
      reverse: c.depression,
      parts: ["breech", "cascabel", "chase", "trunnions"],
    });
    builder.affordance({
      id: "muzzle",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.facing(v(0, axis, muzzle), v(0, 0, 1), v(1, 0, 0)),
      extent: null,
      rides: "elevation",
    });

    // The vent: from its entry a quarter of the bore's diameter ahead of the bore's bottom, up through the metal at 80 degrees to the axis, leaning to the rear, to the breech's top.
    const entry: number = muzzle - t.boreLength + t.bore / 4;
    const rise: number = breech - t.bore / 2;
    const lean: number = (VENT * Math.PI) / 180;
    builder.affordance({
      id: "vent",
      kind: "surface",
      direction: "along",
      frame: ArchetypeFrame.facing(
        v(0, axis + breech, entry - rise / Math.tan(lean)),
        v(0, Math.sin(lean), -Math.cos(lean)),
        v(1, 0, 0),
      ),
      extent: null,
      rides: "elevation",
    });

    // The elevating screw's handle under the breech at the base-ring's rear, where the breech rests: Plate 2 draws it there without dimensions, so its place is provisional, its travel bounded by the vertical field of fire (p. 74). The trail's end, where the handspike bears.
    builder.affordance({
      id: "elevatingScrew",
      kind: "knob",
      frame: ArchetypeFrame.facing(v(0, screwTop, base), v(0, 1, 0), v(1, 0, 0)),
      extent: null,
    });
    builder.affordance({
      id: "trail",
      kind: "surface",
      frame: ArchetypeFrame.upright(v(0, depth, trailEnd)),
      extent: null,
      width,
    });
  }
}
