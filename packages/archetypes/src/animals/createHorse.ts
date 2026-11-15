import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  ArchetypeUnits,
  Archetype,
  ArchetypeBuilder,
  ArchetypeDraw,
  ArchetypeFrame,
} from "../core";
import { HORSE_BANDS } from "./HORSE_BANDS";
import { HorseHarness } from "./HorseHarness";
import { QuadrupedBody } from "./QuadrupedBody";

/**
 * A horse with its tack: a coarse body of one bar per bone, under a riding saddle with stirrups, reins and a lead rope, or in a driving harness.
 *
 * The horse stands square on level ground, facing `+Z`, with the middle of its trunk over the origin. Its body is the shared quadruped's (`QuadrupedBody`) drawn by the horse's proportions, `BODY`: its parts are its bones, named by `QuadrupedBody.Bone`, a trunk, the hindquarters behind it, a neck, a head and a tail, and four bones down each limb. Each bone is a bar from joint to joint, so the horse is posed by moving joints; `createHorse.rig` gives the joints at rest and `rideHorse` poses the limbs through a gait. Bone lengths are fixed fractions of the height at the withers and each bone's share of the body's mass is the measured one. The trunk runs Kubo's shoulder to hip; the hindquarters carry the body on from the hip joint to the point of buttock, which Jensen et al. place behind the point of shoulder.
 *
 * Under the saddle (`tack` `saddle`, the default) the rider's contacts ride the trunk: the saddle's `seat`, the two stirrups, the two reins where the hands hold them, and the pommel and cantle a mounting rider grips. `lead` is the lead rope's held run, beside the head on the horse's left. In harness (`tack` `harness`) the horse wears a breast collar, a driving saddle with its tugs, terrets, girth and backstrap, a breeching and a bridle with blinkers, as `HorseHarness` lays them; its one contact is the `hitch` between the tugs, which a cart's `coupling` is held on. The traces and the driving lines run between the horse and the vehicle, so the towing ride lays them (`createCart.lines`).
 *
 * @param params The tack and any dimension the author fixes.
 * @param seed The seed that draws every dimension left free inside its band; absent, each takes the middle of its band.
 * @returns The horse.
 * @throws {ArchetypeRefusal} For a fixed dimension outside its band, or a tack that is not one of `TACKS`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States how the horse stands, that its parts are the shared quadruped's bones, how it is posed, where the body ends and where each tack's contacts are.
 * @evidence contracts/development/implementation.md#principled-implementation The shared body (`QuadrupedBody.lay`) from the horse's proportions: segment lengths as fractions of withers height from Kubo et al. 1992 and Matsuura et al. 2008, and segment mass shares from Kubo et al. 1992, Table 5, stated per part so the mass properties follow the measured distribution; the tack is placed on the rig's landmarks.
 * @evidence contracts/development/implementation.md#clear-and-simple-structure Draw the dimensions, take the rest joints from `rig`, lay the body, then the tack and its contacts.
 * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The body's simplifications are `QuadrupedBody.lay`'s, stated there; every tack size no source gives is a named estimate.
 * @evidence contracts/development/implementation.md#efficient-algorithms Twenty-one bones, the withers and a few tens of tack parts.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work The body is the shared quadruped's; each call builds one independent model.
 * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
 */
export function createHorse(
  params: createHorse.IParams = {},
  seed?: number | string,
): Archetype<createHorse.Affordance, createHorse.Dimension> {
  const tack: createHorse.Tack = ArchetypeDraw.choice(
    "horse",
    "tack",
    params.tack ?? "saddle",
    createHorse.TACKS,
  );
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
    name: tack === "saddle" ? "saddle horse" : "driving horse",
    dimensions: d,
  });
  const v: typeof Vector3.create = Vector3.create;
  const h: number = d.withersHeight;
  const rig: createHorse.IRig = createHorse.rig(d);
  const barrel: number = rig.barrel;
  const back: number = rig.back;
  const half: number = rig.trunk / 2;
  const nose: IAutoMovieVector3 = rig.nose;
  QuadrupedBody.lay(createHorse.BODY, builder, h, rig);

  if (tack === "saddle") {
    // The saddle on the back behind the withers, and what the rider holds and stands in.
    const top: number = back + 0.04;
    const centre: number = half - createHorse.SADDLE;
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
        symmetry: "none",
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
      const bit: IAutoMovieVector3 = v(sign * 0.05 * h, rig.mouth.y, rig.mouth.z);
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
        symmetry: "round",
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
      symmetry: "round",
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
  } else HorseHarness.lay(builder, d, rig);
  return builder.build(d.mass, { rests: createHorse.BODY.foot });
}

/**
 * Companion types, proportions and bands of {@link createHorse}.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Each bone, affordance, dimension, proportion and band states what it is and where it comes from.
 * @evidence contracts/development/design.md#principled-representation The horse's proportions in the shared quadruped body's forms, segment lengths as fractions of withers height and segment masses as percentages of body mass, the two forms the equine studies report.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The horse's proportions, tack and bands; the bone vocabulary is `QuadrupedBody`'s, shared by every quadruped (#3373, #2805, #3496).
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No humanoid bone stands in for a horse's, the defect #2805 removed.
 */
export namespace createHorse {
  /** What the horse wears: a riding saddle with its stirrups, reins and lead rope, or a driving harness. */
  export type Tack = "saddle" | "harness";

  /** Every tack, for a caller that reads one at run time. */
  export const TACKS: readonly Tack[] = ["saddle", "harness"];

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
   * - `hitch`: in harness, the middle between the tugs at the driving saddle, where a cart's shafts are held and its `coupling` is drawn from; the other ids belong to the riding saddle and a harnessed horse lacks them.
   */
  export type Affordance =
    | "seat"
    | "pommel"
    | "cantle"
    | "leftStirrup"
    | "rightStirrup"
    | "leftRein"
    | "rightRein"
    | "lead"
    | "hitch";

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
   * - `breechingDrop`: in harness, the breeching's seat below the point of buttock.
   */
  export type Dimension =
    | "withersHeight"
    | "mass"
    | "girth"
    | "seatSize"
    | "stirrupDrop"
    | "stirrupWidth"
    | "reinWidth"
    | "tempo"
    | "breechingDrop";

  /** The parameters: the tack, and any free dimension fixed to a value inside its band. */
  export interface IParams extends Partial<Record<Dimension, number>> {
    /** What the horse wears; `saddle` when absent. */
    tack?: Tack;

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

  /** The saddle's middle behind the shoulder joints, metres: an estimate, no source read gives it. A harness's tugs hang on the saddle pad there, so a cart's shafts are held there too. */
  export const SADDLE: number = 0.45;

  /** The saddle's seat width, metres: an estimate, no source read gives it. */
  export const SEAT_WIDTH: number = 0.3;

  /** A lead rope's diameter, metres: 5/8 in, a Weaver Leather cotton lead seen only in retailer listings. */
  export const LEAD: number = (5 / 8) * ArchetypeUnits.INCH;

  /**
   * The point of buttock behind the point of shoulder, as a fraction of the height at the withers: Jensen et al. 2019, Acta Vet Scand 61, Methods and Table 2, L1, the horizontal length "from the tuber ischium (point of the buttocks) to greater tubercle (point of the shoulder)", 185 cm on warmbloods of 172 cm mean height at the withers (https://www.ebi.ac.uk/europepmc/webservices/rest/PMC6933663/fullTextXML). The point of shoulder is taken at the shoulder joint.
   */
  export const BUTTOCK: number = 185 / 172;

  /**
   * The horse's body, the shared quadruped body's proportions: `LENGTHS`, `STANCE`, `BACK`, `BUTTOCK` and `MASS`, each with its source, and the shapes no source read gives, each an estimate the model is drawn by: the withers a ball of 0.05 of the withers height whose top stands at the withers (a nominal hundredth of a percent of the mass), the neck's root 0.06 below the back and its bar's radius 0.08, the poll 0.27 above the back and 0.27 ahead of the shoulder joints, the nose 0.31 below and 0.18 ahead of the poll, the head bar's radius 0.06 and the mouth's corners 0.03 above and behind the nose, the tail's bar 0.02 in radius reaching 0.4 down and 0.1 back from its root, its root 0.65 of the barrel's radius up and back from the hindquarters' rounded end's centre, the limb bones' radii 0.055 of the withers height for the humerus and the femur, 0.035 for the radius and the tibia, and 0.022 for the cannon and the pastern alike, and each limb 0.08 m inside the barrel's side. The feet are hooves, shod.
   */
  export const BODY: QuadrupedBody.IBody = {
    lengths: LENGTHS,
    stance: STANCE,
    back: BACK,
    buttock: BUTTOCK,
    mass: { ...MASS, withers: 0.01 },
    withers: 0.05,
    neck: { root: 0.06, radius: 0.08 },
    head: {
      poll: { rise: 0.27, ahead: 0.27 },
      nose: { drop: 0.31, ahead: 0.18 },
      radius: 0.06,
      mouth: 0.03,
    },
    tail: { radius: 0.02, drop: 0.4, back: 0.1, dock: 0.65 },
    bones: [0.055, 0.035, 0.022, 0.022],
    inset: 0.08,
    colors: { coat: "#8a5a3a", tail: "#3a2a1e" },
    foot: "hoof",
  };

  /**
   * The horse's joints and landmarks at rest, in the model's space: the shared quadruped's (`QuadrupedBody.IRig`) and the two places a harness is laid by.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States what it adds and each member's meaning.
   * @evidence contracts/development/design.md#principled-representation Points in the model's space.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Owned here; the harness and a drawn cart read the two places.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts None.
   */
  export interface IRig extends QuadrupedBody.IRig {
    /** The point of draft on the `+X` side: where the breast collar meets the barrel's side at the point of shoulder's height, just behind the elbow, as the IVC Carriage measuring chart takes the breast collar from the centre of the chest to just behind the elbow; the `-X` side's is its mirror. */
    draft: IAutoMovieVector3;

    /** The middle between the tugs, on the trunk's axis under the saddle's middle: a harness's `hitch`, where a cart's shafts are held. */
    hitch: IAutoMovieVector3;
  }

  /**
   * The horse's joints and landmarks at rest.
   *
   * @param dimensions The horse's dimensions, as `Archetype.dimensions` gives them.
   * @returns The rest rig.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the input and the result.
   * @evidence contracts/development/implementation.md#principled-implementation The shared quadruped's rig from `BODY`, then the point of draft on the barrel's surface at the shoulder joint's height beside the elbow, and the hitch on the trunk's axis `SADDLE` behind the shoulder joints.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The shared rig, then two points.
   * @evidenceExclude contracts/development/implementation.md#prohibited-implementation-shortcuts No case to refuse; the bands admit the dimensions.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work beyond the shared rig's.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses `QuadrupedBody.rig`.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources Retains nothing.
   */
  export function rig(
    dimensions: Readonly<Partial<Record<Dimension, number>>>,
  ): IRig {
    const body: QuadrupedBody.IRig = QuadrupedBody.rig(BODY, dimensions);
    const shoulder: IAutoMovieVector3 = body.limbs.leftFore[0]!;
    const axis: number = body.back - body.barrel;
    const side: number = Math.sqrt(
      Math.max(0, body.barrel * body.barrel - (axis - shoulder.y) ** 2),
    );
    return {
      ...body,
      draft: Vector3.create(side, shoulder.y, body.limbs.leftFore[1]!.z),
      hitch: Vector3.create(0, axis, body.trunk / 2 - SADDLE),
    };
  }

  /** The band of each free dimension. */
  export const BANDS: typeof HORSE_BANDS = HORSE_BANDS;
}
