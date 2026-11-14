import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
} from "../core";
import { HORSE_BANDS } from "./HORSE_BANDS";

/**
 * A saddle horse with its tack: a coarse body of one bar per bone, a saddle with stirrups, reins and a lead rope.
 *
 * The horse stands square on level ground, facing `+Z`, with the middle of its trunk over the origin. Its parts are its bones, named by `createHorse.Bone`, a vocabulary of its own: a trunk, a neck, a head and a tail, and four bones down each limb. Each bone is a bar from joint to joint, so the horse is posed by moving joints; `createHorse.rig` gives the joints at rest and `rideHorse` poses the limbs through a gait. Bone lengths are fixed fractions of the height at the withers and each bone's share of the body's mass is the measured one.
 *
 * The rider's contacts ride the trunk: the saddle's `seat`, the two stirrups, the two reins where the hands hold them, and the pommel and cantle a mounting rider grips. `lead` is the lead rope's held run, beside the head on the horse's left.
 *
 * @param params Any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The horse.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the horse stands, that its parts are its bones under its own vocabulary, how it is posed and where the rider's contacts are.
 * @evidence contracts/development/implementation.md#principled-implementation Limb bones laid from the shoulder and hip joints down at standing angles that put every hoof on the ground; segment lengths as fractions of withers height from Kubo et al. 1992 and Matsuura et al. 2008, and segment mass shares from Kubo et al. 1992, Table 5, stated per part so the mass properties follow the measured distribution.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, take the rest joints from `rig`, lay a bar per bone, then the tack and its contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The scapula and the pelvis are part of the trunk, as Kubo's trunk includes them; ears, mane and hooves are not modelled.
 * @evidence contracts/development/implementation.md#efficient-algorithms Twenty bones, the withers and ten tack parts.
 * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work Each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHorse(
  params: createHorse.IParams = {},
  seed?: number | string,
): Archetype<createHorse.Affordance, createHorse.Dimension> {
  const d: Record<createHorse.Dimension, number> = ArchetypeDraw.dimensions(
    "horse",
    createHorse.BANDS,
    seed,
    params,
  );
  const builder: ArchetypeBuilder<
    createHorse.Affordance,
    createHorse.Dimension
  > = new ArchetypeBuilder({
    archetype: "horse",
    id: params.id,
    name: "saddle horse",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const h: number = d.withersHeight;
  const barrel: number = d.girth / (2 * Math.PI);
  const rig: createHorse.IRig = createHorse.rig(d);
  const coat: string = "#8a5a3a";
  const share: typeof createHorse.MASS = createHorse.MASS;

  // The trunk, neck, head and tail.
  const back: number = rig.back;
  const half: number = rig.trunk / 2;
  builder.rod(
    "trunk",
    barrel,
    v(0, back - barrel, -half),
    v(0, back - barrel, half),
    { color: coat, round: true, share: share.trunk },
  );
  builder.ball("withers", 0.05 * h, v(0, 0.95 * h, half - 0.05 * h), {
    color: coat,
    share: 0.01,
  });
  const poll: IAutoMovieVector3 = v(0, back + 0.27 * h, half + 0.27 * h);
  const nose: IAutoMovieVector3 = v(0, poll.y - 0.31 * h, poll.z + 0.18 * h);
  builder.rod("neck", 0.08 * h, v(0, back - 0.06 * h, half), poll, {
    color: coat,
    share: share.neck,
  });
  builder.rod("head", 0.06 * h, poll, nose, {
    color: coat,
    round: true,
    share: share.head,
  });
  // The tail hangs from the croup: its root sits just inside the trunk's rounded rear end, up and back from that end's centre.
  const dock: IAutoMovieVector3 = v(
    0,
    back - barrel + 0.65 * barrel,
    -half - 0.65 * barrel,
  );
  builder.rod(
    "tail",
    0.02 * h,
    dock,
    v(0, dock.y - 0.4 * h, dock.z - 0.1 * h),
    { color: "#3a2a1e", share: share.tail },
  );

  // The limbs: one bar per bone, from each joint to the next.
  for (const limb of createHorse.LIMBS) {
    const joints: readonly IAutoMovieVector3[] = rig.limbs[limb];
    const fore: boolean = limb.endsWith("Fore");
    const shares: readonly number[] = fore ? share.fore : share.hind;
    createHorse.BONES[limb].forEach(
      (bone: createHorse.Bone, k: number): void => {
        builder.rod(
          bone,
          (k === 0 ? 0.055 : k === 1 ? 0.035 : 0.022) * h,
          joints[k]!,
          joints[k + 1]!,
          { color: coat, share: shares[k]! },
        );
      },
    );
  }

  // The saddle on the back behind the withers, and what the rider holds and stands in.
  const top: number = back + 0.04;
  const centre: number = half - 0.45;
  builder.box(
    "saddle",
    v(createHorse.SEAT_WIDTH, 0.04, d.seatSize),
    v(0, top - 0.02, centre),
    { color: "#4a3324", share: 1 },
  );
  builder.affordance({
    id: "seat",
    kind: "seat",
    frame: ArchetypeFrame.upright(v(0, top, centre + d.seatSize / 2)),
    extent: null,
    depth: d.seatSize,
    width: createHorse.SEAT_WIDTH,
    astride: true,

    // A horse is mounted from its near side, the left.
    mount: "left",
  });
  for (const [id, z] of [
    ["pommel", centre + d.seatSize / 2],
    ["cantle", centre - d.seatSize / 2],
  ] as const) {
    builder.rod(id, 0.015, v(-0.06, top + 0.03, z), v(0.06, top + 0.03, z), {
      color: "#4a3324",
      share: 0.01,
    });
    builder.affordance({
      id,
      kind: "handle",
      frame: ArchetypeFrame.upright(v(0, top + 0.03, z)),
      extent: null,
      grip: "power",
      aperture: 0.03,
      length: 0.12,
    });
  }
  for (const [side, sign] of [
    ["left", 1],
    ["right", -1],
  ] as const) {
    const x: number = sign * (barrel + 0.03);
    const tread: IAutoMovieVector3 = v(x, top - d.stirrupDrop, centre + 0.05);
    builder.rod(
      `leather-${side}`,
      0.008,
      v(x, top - 0.02, centre + 0.05),
      v(x, tread.y + 0.01, tread.z),
      { color: "#4a3324", share: 0.01 },
    );
    builder.box(
      `stirrup-${side}`,
      v(d.stirrupWidth, 0.01, 0.05),
      v(x, tread.y - 0.005, tread.z),
      { color: "#b9bcc0", share: 0.01 },
    );
    builder.affordance({
      id: `${side}Stirrup`,
      kind: "stirrup",
      frame: ArchetypeFrame.upright(tread),
      extent: null,
      width: d.stirrupWidth,
      length: d.stirrupDrop,
    });

    // A rein from the corner of the mouth back to where the hand holds it, above the withers.
    const hand: IAutoMovieVector3 = v(sign * 0.08, back + 0.15, half - 0.1);
    const bit: IAutoMovieVector3 = v(
      sign * 0.05 * h,
      nose.y + 0.03 * h,
      nose.z - 0.03 * h,
    );
    // The strap runs on behind the hand by half the held run, so the run the hand closes on is all strap.
    const run: IAutoMovieVector3 = Vector3.normalize(
      Vector3.subtract(bit, hand),
    );
    builder.rod(
      `rein-${side}`,
      d.reinWidth / 2,
      Vector3.subtract(hand, Vector3.scale(run, createHorse.HELD.rein / 2)),
      bit,
      { color: "#4a3324", share: 0.01 },
    );
    builder.affordance({
      id: `${side}Rein`,
      kind: "rein",
      frame: ArchetypeFrame.facing(
        hand,
        v(0, 1, 0),
        Vector3.subtract(bit, hand),
      ),
      extent: null,
      grip: "power",
      aperture: d.reinWidth,
      length: createHorse.HELD.rein,
    });
  }
  const held: IAutoMovieVector3 = v(0.25, nose.y - 0.35, nose.z - 0.05);
  const halter: IAutoMovieVector3 = v(0.03 * h, nose.y, nose.z - 0.05 * h);
  builder.rod(
    "lead",
    createHorse.LEAD / 2,
    Vector3.subtract(
      held,
      Vector3.scale(
        Vector3.normalize(Vector3.subtract(halter, held)),
        createHorse.HELD.lead / 2,
      ),
    ),
    halter,
    { color: "#d8d2c4", share: 0.01 },
  );
  builder.affordance({
    id: "lead",
    kind: "rein",
    frame: ArchetypeFrame.facing(
      held,
      v(1, 0, 0),
      Vector3.subtract(halter, held),
    ),
    extent: null,
    grip: "power",
    aperture: createHorse.LEAD,
    length: createHorse.HELD.lead,
  });
  return builder.build(d.mass);
}

/**
 * Companion types, proportions and bands of {@link createHorse}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each bone, affordance, dimension, proportion and band states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation The horse's own closed bone vocabulary, with segment lengths as fractions of withers height and segment masses as percentages of body mass, the two forms the equine studies report.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The vocabulary lives with the horse because `IAutoMovieBone` names humanoid bones only; nothing here changes a humanoid type, and a second species would declare its own union the same way (#3373, #2805).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No humanoid bone stands in for a horse's, the defect #2805 removed.
 */
export namespace createHorse {
  /** The four limbs. */
  export type Limb = "leftFore" | "rightFore" | "leftHind" | "rightHind";

  /** Every limb, in a fixed order. */
  export const LIMBS: readonly Limb[] = [
    "leftFore",
    "rightFore",
    "leftHind",
    "rightHind",
  ];

  /**
   * The horse's bones, each also the id of the part that draws it: the trunk (with the shoulder blades and the pelvis), the neck, the head and the tail; down a fore limb the humerus, the radius, the cannon and the pastern (with the hoof); down a hind limb the femur, the tibia, the cannon and the pastern. Every limb bone hangs from the one above it and the uppermost from the trunk.
   */
  export type Bone =
    | "trunk"
    | "neck"
    | "head"
    | "tail"
    | `${"leftFore" | "rightFore"}${"Humerus" | "Radius" | "Cannon" | "Pastern"}`
    | `${"leftHind" | "rightHind"}${"Femur" | "Tibia" | "Cannon" | "Pastern"}`;

  /** Each limb's four bones from the top down, which are also the ids of the parts that draw them. */
  export const BONES: Readonly<
    Record<Limb, readonly [Bone, Bone, Bone, Bone]>
  > = {
    leftFore: [
      "leftForeHumerus",
      "leftForeRadius",
      "leftForeCannon",
      "leftForePastern",
    ],
    rightFore: [
      "rightForeHumerus",
      "rightForeRadius",
      "rightForeCannon",
      "rightForePastern",
    ],
    leftHind: [
      "leftHindFemur",
      "leftHindTibia",
      "leftHindCannon",
      "leftHindPastern",
    ],
    rightHind: [
      "rightHindFemur",
      "rightHindTibia",
      "rightHindCannon",
      "rightHindPastern",
    ],
  };

  /** The length of strap a hand closes on, metres, for a rein and for the lead rope: a hand's breadth and a half, and two; estimates, no source read gives them. */
  export const HELD: Readonly<{ rein: number; lead: number }> = {
    rein: 0.2,
    lead: 0.3,
  };

  /**
   * The affordance ids:
   *
   * - `seat`: the saddle's seat, facing forward.
   * - `pommel`, `cantle`: the front and the back of the saddle, gripped when mounting.
   * - `leftStirrup`, `rightStirrup`: the stirrups' treads on `+X` and `-X`, each hanging its drop below the saddle.
   * - `leftRein`, `rightRein`: the reins where the hands hold them above the withers, each frame at the middle of the held run, which runs forward to the mouth.
   * - `lead`: the middle of the lead rope's held run beside the head on the horse's left, running up to the halter.
   */
  export type Affordance =
    | "seat"
    | "pommel"
    | "cantle"
    | "leftStirrup"
    | "rightStirrup"
    | "leftRein"
    | "rightRein"
    | "lead";

  /**
   * The free dimensions, metres unless stated:
   *
   * - `withersHeight`: the withers above the ground, which scales every bone.
   * - `mass`: body mass, kilograms.
   * - `girth`: the heart girth's circumference, which sizes the barrel the rider's legs lie round.
   * - `seatSize`: the saddle's seat from the pommel's nail to the cantle.
   * - `stirrupDrop`: a stirrup's tread below the saddle's seat.
   * - `stirrupWidth`: the tread's width.
   * - `reinWidth`: a rein's width.
   * - `tempo`: how far this horse's stride time lies from the mean, in standard deviations.
   */
  export type Dimension =
    | "withersHeight"
    | "mass"
    | "girth"
    | "seatSize"
    | "stirrupDrop"
    | "stirrupWidth"
    | "reinWidth"
    | "tempo";

  /** The parameters: any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** The model's id, unique in a scene; `horse` when absent. */
    id?: string;
  }

  /**
   * Bone lengths as fractions of the height at the withers, from the top of each limb down: Kubo et al. 1992, Jpn J Equine Sci 3:149, Table 4 (antebrachium 0.382 m, metacarpus 0.280 m, fore digit 0.185 m, crus 0.384 m, metatarsus 0.368 m, hind digit 0.183 m, shoulder to hip 1.317 m, on thoroughbreds of about 1.62 m; https://www.jstage.jst.go.jp/article/jes1990/3/2/3_2_149/_pdf) and Matsuura et al. 2008, J Equine Sci 19:9, Table 2 (humerus 0.300 m and femur 0.350 m at 1.584 m; https://www.ebi.ac.uk/europepmc/webservices/rest/PMC4019204/fullTextXML).
   */
  export const LENGTHS: Readonly<{
    fore: readonly [number, number, number, number];
    hind: readonly [number, number, number, number];
    trunk: number;
  }> = {
    fore: [0.189, 0.236, 0.173, 0.114],
    hind: [0.221, 0.237, 0.227, 0.113],
    trunk: 0.813,
  };

  /**
   * Each bone's standing direction, degrees from straight down toward the front, from the top of each limb down. The cannons stand upright and the pasterns slope forward so the fetlock stands as high as Kubo's digit length allows; the humerus, the femur and the tibia take the slopes that put the shoulder joint at 0.635 and the hip joint at 0.717 of the withers height. These are a consistent standing pose built from the lengths, not measured angles.
   */
  export const STANCE: Readonly<{
    fore: readonly [number, number, number, number];
    hind: readonly [number, number, number, number];
  }> = {
    fore: [-46.5, 0, 0, 32.6],
    hind: [25, -35, 0, 32.6],
  };

  /** The back, where the saddle sits, as a fraction of the height at the withers: an estimate, no source read gives it. The withers themselves are a ball on the trunk whose top stands at the withers height. */
  export const BACK: number = 0.95;

  /**
   * Mass shares, percent of body mass (Kubo et al. 1992, Table 5): the torso 59.5 with the tail's 0.1 apart, the neck 7.0, the head 4.4; down a fore limb the scapula and brachium 4.6, the antebrachium 0.9, the metacarpus 0.3 and the digit 0.3; down a hind limb the thigh 6.9, the crus 1.0, the metatarsus 0.4 and the digit 0.3.
   */
  export const MASS: Readonly<{
    trunk: number;
    neck: number;
    head: number;
    tail: number;
    fore: readonly [number, number, number, number];
    hind: readonly [number, number, number, number];
  }> = {
    trunk: 59.5,
    neck: 7,
    head: 4.4,
    tail: 0.1,
    fore: [4.6, 0.9, 0.3, 0.3],
    hind: [6.9, 1, 0.4, 0.3],
  };

  /** The saddle's seat width, metres: an estimate, no source read gives it. */
  export const SEAT_WIDTH: number = 0.3;

  /** A lead rope's diameter, metres: 5/8 in, a Weaver Leather cotton lead seen only in retailer listings. */
  export const LEAD: number = 0.0159;

  /** The horse's joints at rest, in the model's space. */
  export interface IRig {
    /** The back's height above the ground, metres. */
    back: number;

    /** The distance from the shoulder joints to the hip joints, metres. */
    trunk: number;

    /** Each limb's five joints from the top down: the shoulder or hip joint, the elbow or stifle, the carpus or hock, the fetlock, and the hoof on the ground. */
    limbs: Readonly<Record<Limb, readonly IAutoMovieVector3[]>>;
  }

  /**
   * The horse's joints at rest.
   *
   * @param dimensions The horse's dimensions, as `Archetype.dimensions` gives them.
   * @returns The rest rig.
   */
  export function rig(
    dimensions: Readonly<Partial<Record<Dimension, number>>>,
  ): IRig {
    const h: number = dimensions.withersHeight!;
    const barrel: number = dimensions.girth! / (2 * Math.PI);
    const trunk: number = LENGTHS.trunk * h;
    const limbs: Partial<Record<Limb, IAutoMovieVector3[]>> = {};
    for (const limb of LIMBS) {
      const fore: boolean = limb.endsWith("Fore");
      const lengths: readonly number[] = fore ? LENGTHS.fore : LENGTHS.hind;
      const angles: readonly number[] = fore ? STANCE.fore : STANCE.hind;
      const x: number = (limb.startsWith("left") ? 1 : -1) * (barrel - 0.08);

      // From the hoof on the ground up to the top joint, then listed from the top down.
      let y: number = 0;
      let z: number = 0;
      const up: IAutoMovieVector3[] = [Vector3.create(x, 0, 0)];
      for (let k: number = 3; k >= 0; k--) {
        const angle: number = (angles[k]! * Math.PI) / 180;
        y += lengths[k]! * h * Math.cos(angle);
        z -= lengths[k]! * h * Math.sin(angle);
        up.push(Vector3.create(x, y, z));
      }
      const top: number = (fore ? 1 : -1) * (trunk / 2) - z;
      limbs[limb] = up
        .reverse()
        .map(
          (p: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.create(p.x, p.y, p.z + top),
        );
    }
    return {
      back: BACK * h,
      trunk,
      limbs: limbs as Record<Limb, IAutoMovieVector3[]>,
    };
  }

  /** The band of each free dimension. */
  export const BANDS: typeof HORSE_BANDS = HORSE_BANDS;
}
