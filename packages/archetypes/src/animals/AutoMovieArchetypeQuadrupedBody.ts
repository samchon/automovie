import { Vector3 } from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";

import {
  type AutoMovieArchetypeBuilder,
  type AutoMovieArchetypeFriction,
  AutoMovieArchetypeUnits,
} from "../core";
import { AutoMovieArchetypeQuadrupedHead } from "./AutoMovieArchetypeQuadrupedHead";
import { QuadrupedAttachments } from "./quadruped/QuadrupedAttachments";
import type { QuadrupedProportions } from "./quadruped/QuadrupedProportions";
import { QuadrupedScapula } from "./quadruped/QuadrupedScapula";

/**
 * A four-legged animal's body as one bar per bone, built from its species'
 * proportions: the bone vocabulary every quadruped shares, the joints at rest,
 * and the bars laid on a model under construction.
 *
 * The animal stands square on level ground, facing `+Z`, with the middle of its
 * trunk over the origin. Its bones are a trunk, the hindquarters behind it, a
 * neck, a head and a tail, and four bones down each limb; each is a bar from
 * joint to joint, so the animal is posed by moving joints. A species differs
 * from another only by its `IBody`: bone lengths and standing angles as
 * fractions of the height at the withers and degrees, mass shares as
 * percentages, and the few shapes of the head, neck and tail.
 */
export namespace AutoMovieArchetypeQuadrupedBody {
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
   * The bones, each also the id of the part that draws it: the trunk (with the
   * shoulder blades and the pelvis's front), the hindquarters (the pelvis
   * behind the hip joints and the buttock's muscles, out to the point of
   * buttock), the neck, the head and the tail; down a fore limb the humerus,
   * the radius, the cannon and the pastern (with the hoof or the paw); down a
   * hind limb the femur, the tibia, the cannon and the pastern. The cannon is
   * the metacarpus or metatarsus and the pastern the digit, under the names a
   * horse's carry. Every limb bone hangs from the one above it; a fore limb's
   * uppermost hangs from its shoulder blade, which hangs from the trunk, and a
   * hind limb's from the hindquarters.
   */
  export type Bone =
    | "trunk"
    | "hindquarters"
    | "neck"
    | "head"
    | "tail"
    | QuadrupedScapula.Bone
    | `${"leftFore" | "rightFore"}${"Humerus" | "Radius" | "Cannon" | "Pastern"}`
    | `${"leftHind" | "rightHind"}${"Femur" | "Tibia" | "Cannon" | "Pastern"}`;

  /**
   * Each limb's four bones from the top down, which are also the ids of the
   * parts that draw them.
   */
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

  /**
   * The dimensions every quadruped draws, metres unless stated:
   *
   * - `withersHeight`: the withers above the ground, which scales every bone.
   * - `mass`: body mass, kilograms.
   * - `girth`: the heart girth's circumference, which sizes the barrel.
   * - `tempo`: how far this animal's stride time lies from the mean, in standard
   *   deviations.
   */
  export type Dimension = "withersHeight" | "mass" | "girth" | "tempo";

  /** A species' body: the proportions the rig and the bars are built from. */
  export interface IBody {
    /**
     * Bone lengths as fractions of withers height, from the top of each limb
     * down, and the torso's axial control span.
     */
    lengths: Readonly<QuadrupedProportions.ILengths>;

    /**
     * Initial neutral directions, degrees from down toward the front. Shared
     * grounding and parent-solid construction may articulate the first two
     * links, preserving all lengths, footprint and distal directions.
     */
    stance: Readonly<QuadrupedProportions.IStance>;

    /** The back's height as a fraction of the height at the withers. */
    back: number;

    /**
     * The point of buttock behind the point of shoulder, as a fraction of the
     * height at the withers.
     */
    buttock: number;

    /**
     * Optional measured mass shares, percent of body mass as printed;
     * normalized by their sum. Without shares the builder distributes the
     * authored total mass by solid volume, an explicit coarse uniform-density
     * approximation.
     */
    mass?: Readonly<QuadrupedProportions.IBodyMass>;

    /**
     * The withers' ball's radius as a fraction of the height at the withers;
     * its top stands at the withers height, just behind the neck's root.
     */
    withers: number;

    /**
     * The neck's root below the back and the neck bar's radius, fractions of
     * the height at the withers.
     */
    neck: Readonly<QuadrupedProportions.INeck>;

    /**
     * The head, fractions of the height at the withers: the poll above the back
     * and ahead of the shoulder joints, the nose below and ahead of the poll,
     * the head bar's radius, and the mouth's corners above and behind the
     * nose.
     */
    head: Readonly<QuadrupedProportions.IHead>;

    /**
     * The tail: its bar's radius and its tip below and behind its root,
     * fractions of the height at the withers, and its root up and back from the
     * hindquarters' rounded end's centre, a fraction of the barrel's radius.
     */
    tail: Readonly<QuadrupedProportions.ITail>;

    /**
     * Each limb bone's radius, from the top down, as a fraction of the height
     * at the withers.
     */
    bones: readonly [number, number, number, number];

    /** How far each limb stands inside the barrel's side, metres. */
    inset: number;

    /** The coat's colour, and the tail's. */
    colors: Readonly<QuadrupedProportions.IColors>;

    /**
     * Known foot contact material; absent means unknown friction, never an
     * assumed hoof or rubber paw.
     */
    foot?: AutoMovieArchetypeFriction.Material;
  }

  /** The joints and landmarks of a quadruped at rest, in the model's space. */
  export interface IRig {
    /** The back's height above the ground, metres. */
    back: number;

    /**
     * The trunk capsule's axial span, metres; connected joints lie in their
     * parent solids.
     */
    trunk: number;

    /**
     * Each connected neutral chain: shoulder/hip, elbow/stifle, carpus/hock,
     * fetlock and terminal endpoint. Four lengths, footprint and distal
     * directions are preserved; endpoint height gives the flat terminal
     * cylinder's sole ground Y=0.
     */
    limbs: Readonly<Record<Limb, readonly IAutoMovieVector3[]>>;

    /**
     * The point of buttock, `IBody.buttock` behind the initial shoulder site,
     * at the initial hind conformation's height. This provisional rump landmark
     * is independent of later neutral joint connection; no measured buttock
     * height is claimed.
     */
    buttock: IAutoMovieVector3;

    /** The neck's root on the trunk, where its bar starts. */
    neck: IAutoMovieVector3;

    /** The neck bar's radius, metres. */
    neckRadius: number;

    /**
     * The top of the neck at its root, just ahead of the withers, where a neck
     * strap crosses it.
     */
    crest: IAutoMovieVector3;

    /** The poll, where the head meets the neck. */
    poll: IAutoMovieVector3;

    /** The head bar's radius, metres. */
    headRadius: number;

    /** The nose, the head's front end. */
    nose: IAutoMovieVector3;

    /** The mouth's corners' middle, where a bit lies across the head. */
    mouth: IAutoMovieVector3;

    /**
     * The barrel's radius, the heart girth over two pi, metres: the trunk's and
     * the hindquarters' bars' radius.
     */
    barrel: number;

    /**
     * The centre of the hindquarters' rounded rear end, a ball of the barrel's
     * radius whose rearmost point is the point of buttock.
     */
    quarters: IAutoMovieVector3;

    /**
     * The tail's root, just inside the hindquarters' rounded rear end, up and
     * back from that end's centre.
     */
    dock: IAutoMovieVector3;
  }

  /**
   * A quadruped's joints and landmarks at rest.
   *
   * @param body The species' body.
   * @param dimensions The animal's dimensions: its withers height and girth are
   *   read.
   * @returns The rest rig.
   */
  export function rig(
    body: IBody,
    dimensions: Readonly<Partial<Record<Dimension, number>>>,
  ): IRig {
    const h: number = dimensions.withersHeight!;
    const barrel: number = dimensions.girth! / (2 * Math.PI);
    const trunk: number = body.lengths.trunk * h;
    const back: number = body.back * h;

    /**
     * Initial provisional chain; body connection is resolved after the torso
     * landmarks exist.
     */
    function chain(limb: Limb): IAutoMovieVector3[] {
      const fore: boolean = limb.endsWith("Fore");
      const lengths: readonly number[] = fore
        ? body.lengths.fore
        : body.lengths.hind;
      const angles: readonly number[] = fore
        ? body.stance.fore
        : body.stance.hind;
      const x: number =
        (limb.startsWith("left") ? 1 : -1) * (barrel - body.inset);

      // Start at a provisional terminal centre on Y=0, then list joints from the top down.
      // Shared neutral construction later places the real terminal cylinder's sole on ground.
      let y: number = 0;
      let z: number = 0;
      const up: IAutoMovieVector3[] = [Vector3.create(x, 0, 0)];
      for (let k: number = 3; k >= 0; k--) {
        const angle: number = angles[k]! * AutoMovieArchetypeUnits.DEGREE;
        y += lengths[k]! * h * Math.cos(angle);
        z -= lengths[k]! * h * Math.sin(angle);
        up.push(Vector3.create(x, y, z));
      }
      const top: number = (fore ? 1 : -1) * (trunk / 2) - z;
      return up
        .reverse()
        .map(
          (p: IAutoMovieVector3): IAutoMovieVector3 =>
            Vector3.create(p.x, p.y, p.z + top),
        );
    }
    const joints: Record<Limb, IAutoMovieVector3[]> = {
      leftFore: chain("leftFore"),
      rightFore: chain("rightFore"),
      leftHind: chain("leftHind"),
      rightHind: chain("rightHind"),
    };
    const shoulder: IAutoMovieVector3 = joints.leftFore[0]!;
    const hip: IAutoMovieVector3 = joints.leftHind[0]!;
    const buttock: IAutoMovieVector3 = Vector3.create(
      0,
      hip.y,
      shoulder.z - body.buttock * h,
    );
    const poll: IAutoMovieVector3 = Vector3.create(
      0,
      back + body.head.poll.rise * h,
      trunk / 2 + body.head.poll.ahead * h,
    );
    const nose: IAutoMovieVector3 = Vector3.create(
      0,
      poll.y - body.head.nose.drop * h,
      poll.z + body.head.nose.ahead * h,
    );

    // The hindquarters' rear end is a ball of the barrel's radius whose rearmost point is the point of buttock.
    const quarters: IAutoMovieVector3 = Vector3.create(
      0,
      buttock.y,
      buttock.z + barrel,
    );
    const neck: IAutoMovieVector3 = Vector3.create(
      0,
      back - body.neck.root * h,
      trunk / 2,
    );
    const neckRadius: number = body.neck.radius * h;
    return {
      back,
      trunk,
      limbs: QuadrupedAttachments.conform(
        joints,
        QuadrupedAttachments.solids({ back, trunk, barrel, quarters }),
        body.bones[3]! * h,
      ),
      buttock,
      neck,
      neckRadius,
      crest: Vector3.create(0, neck.y + neckRadius, neck.z),
      poll,
      headRadius: body.head.radius * h,
      nose,
      mouth: Vector3.create(
        0,
        nose.y + body.head.mouth * h,
        nose.z - body.head.mouth * h,
      ),
      barrel,
      quarters,
      dock: Vector3.create(
        0,
        quarters.y + body.tail.dock * barrel,
        quarters.z - body.tail.dock * barrel,
      ),
    };
  }

  /**
   * Lay the neutral bone bars, withers and explicitly profiled coarse ear
   * plates.
   *
   * @param body The species' body.
   * @param builder The model under construction.
   * @param withers The animal's height at the withers, metres.
   * @param rig The animal's rest rig, from `rig`.
   */
  export function lay<Affordance extends string, D extends string>(
    body: IBody,
    builder: AutoMovieArchetypeBuilder<Affordance, D>,
    withers: number,
    rig: IRig,
  ): void {
    const v: typeof Vector3.create = Vector3.create;
    const h: number = withers;
    const barrel: number = rig.barrel;
    const coat: string = body.colors.coat;

    // The shares as percents of the body's mass, the printed ones' rounding removed by their own sum.
    const share: IBody["mass"] = body.mass;
    const scale: number =
      share === undefined
        ? 1
        : 100 /
          (share.trunk +
            share.withers +
            share.neck +
            share.head +
            share.tail +
            2 *
              [...share.fore, ...share.hind].reduce(
                (a: number, b: number): number => a + b,
                0,
              ));

    // The two unchanged torso solids also define neutral limb connection; their measured or authored total share is divided by their volumes.
    const half: number = rig.trunk / 2;
    const parents: Readonly<
      Record<QuadrupedAttachments.Parent, QuadrupedAttachments.ICapsule>
    > = QuadrupedAttachments.solids(rig);
    const rear: IAutoMovieVector3 = parents.trunk.from;
    const quarters: IAutoMovieVector3 = parents.hindquarters.to;
    const capsule: (length: number) => number = (length: number): number =>
      Math.PI * barrel * barrel * length + (4 / 3) * Math.PI * barrel ** 3;
    const trunkVolume: number = capsule(2 * half);
    const quartersVolume: number = capsule(
      Vector3.length(Vector3.subtract(quarters, rear)),
    );
    builder.rod("trunk", barrel, rear, parents.trunk.to, {
      color: coat,
      round: true,
      share:
        share === undefined
          ? undefined
          : (scale * share.trunk * trunkVolume) /
            (trunkVolume + quartersVolume),
    });
    builder.rod("hindquarters", barrel, rear, quarters, {
      color: coat,
      round: true,
      share:
        share === undefined
          ? undefined
          : (scale * share.trunk * quartersVolume) /
            (trunkVolume + quartersVolume),
    });
    builder.ball(
      "withers",
      body.withers * h,
      v(0, (1 - body.withers) * h, half - body.withers * h),
      {
        color: coat,
        share: share === undefined ? undefined : scale * share.withers,
      },
    );
    builder.rod("neck", rig.neckRadius, rig.neck, rig.poll, {
      color: coat,
      share: share === undefined ? undefined : scale * share.neck,
    });
    AutoMovieArchetypeQuadrupedHead.lay(
      builder,
      rig,
      h,
      body.head,
      coat,
      share === undefined ? undefined : scale * share.head,
    );
    const dock: IAutoMovieVector3 = rig.dock;
    builder.rod(
      "tail",
      body.tail.radius * h,
      dock,
      v(0, dock.y - body.tail.drop * h, dock.z - body.tail.back * h),
      {
        color: body.colors.tail,
        share: share === undefined ? undefined : scale * share.tail,
      },
    );

    // The limbs: one bar per bone, from each joint to the next.
    for (const limb of LIMBS) {
      const joints: readonly IAutoMovieVector3[] = rig.limbs[limb];
      const shares: readonly number[] | undefined = limb.endsWith("Fore")
        ? share?.fore
        : share?.hind;
      if (limb === "leftFore" || limb === "rightFore")
        builder.rod(
          QuadrupedScapula.BONES[limb],
          body.bones[0]! * h,
          QuadrupedScapula.bar(joints[0]!, h).from,
          QuadrupedScapula.bar(joints[0]!, h).to,
          { color: coat, round: false, share: 0 },
        );
      BONES[limb].forEach((bone: Bone, k: number): void => {
        builder.rod(bone, body.bones[k]! * h, joints[k]!, joints[k + 1]!, {
          color: coat,
          round: false,
          share: shares === undefined ? undefined : scale * shares[k]!,
          // The digit ends in the foot.
          ...(k === 3 ? { surface: body.foot } : {}),
        });
      });
    }
  }
}
