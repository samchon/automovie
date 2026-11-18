import {
  Quaternion,
  Vector3,
  resolveAutoMovieCenterOfMass,
  resolveAutoMovieHumanoidSurfaces,
} from "@automovie/engine";
import type {
  AutoMovieHumanSide,
  AutoMovieHumanoidBone,
  AutoMovieHumanoidRegion,
  IAutoMovieMotionCoupling,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanCarried,
  IAutoMovieMotionHumanCarriedCoupling,
  IAutoMovieMotionHumanCarriedCouplingPose,
  IAutoMovieMotionHumanContactWindow,
  IAutoMovieMotionHumanPosture,
  IAutoMovieQuaternion,
  IAutoMovieResolveCenterOfMass,
  IAutoMovieResolvedBone,
  IAutoMovieVector3,
} from "@automovie/interface";

import { HumanRefusal } from "../law/HumanRefusal";
import { resolveHumanPosture } from "../posture/resolveHumanPosture";
import { HumanCarriedCouplingFit } from "./HumanCarriedCouplingFit";
import { HumanCarriedCouplingLoad } from "./HumanCarriedCouplingLoad";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";
import { HumanCarriedDrag } from "./HumanCarriedDrag";

/** The borne regions held by the bearer's left and right hands. */
type Grip = Parameters<typeof HumanCarriedCouplingFit.read>[3];

/** A borne region a hand holds, or no grip for that hand. */
type HeldRegion = Grip[number];

/** A reachable placement and the grip its reach was checked against. */
interface IGripFit {
  read: HumanCarriedCouplingFit.IRead;
  held: Grip;
}

/** The contacts contributed by one bearer. */
interface IBearingSide {
  role: string;
  row: IAutoMovieMotionHumanCarried.IRow;
  held: Grip;
}

/** A borne region and the surface it bears on. */
interface IBearingContact {
  role: string;
  region: AutoMovieHumanoidRegion;
  on: AutoMovieHumanoidRegion;
}

/** A second bearer's anchor in the first bearer's anchor frame. */
type Bearer = NonNullable<IAutoMovieMotionCoupling["bearers"]>[string];

/** The key stance's actual resolved bearing frames. */
type Bones = HumanCarriedCouplingFit.IRead["theirs"];

/** Bearer and borne region pairs follow the row's left-to-right order. */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/**
 * The per-pair solve of a named carry's coupling (`HumanCarriedCoupling`):
 * the key pose that rests the borne body on the bearer, the contacts read on
 * both key bodies, the bearing shares and the capacity, in one record. The
 * meeting kind and the carry's tables stay with `HumanCarriedCoupling`, which
 * delegates its `couple` here.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what the solve owns and where the kind and the tables stay.
 * @evidence contracts/development/design.md#principled-representation One function from two bodies, a row and a carry to the coupling record.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The coupling's solve alone; read by `HumanCarriedCoupling.couple`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts The tables it reads are the coupling's own (`HumanCarriedCoupling.HOLDS`, `NEARER`), not copies.
 */
export namespace HumanCarriedCouplingCouple {
  /**
   * The role names and contact tables supplied by `HumanCarriedCoupling`.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names the role and grip data read by the solve.
   * @evidence contracts/development/design.md#principled-representation Each supported carry supplies a default pair of grips and may provide ordered nearer alternatives.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Reads just the meeting's roles and grip tables; `HumanCarriedCoupling` owns their values.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Uses the existing carry and region vocabularies with no per-body overrides.
   */
  export interface IContacts {
    /** The first bearer's role name. */
    readonly BEARER: string;

    /** The borne person's role name. */
    readonly BORNE: string;

    /** The trailing surface's role name for a drag. */
    readonly GROUND: string;

    /** The optional second helper's role name. */
    readonly SECOND: string;

    /** Default held regions for every carry. */
    readonly HOLDS: Readonly<Record<IAutoMovieMotionHumanCarried.Carry, Grip>>;

    /** Alternative grips in preference order, only for carries that provide them. */
    readonly NEARER: Readonly<
      Partial<Record<IAutoMovieMotionHumanCarried.Carry, readonly Grip[]>>
    >;
  }

  /**
   * The coupling of a carry between two bodies, refused when the bearer
   * cannot balance the borne mass.
   *
   * @param rules The meeting's role names, default grips and nearer grips.
   * @param bearer The bearer's body.
   * @param borne The borne body.
   * @param row The carry's row.
   * @param carry The carry, for its holds.
   * @param extra Kilograms the borne person carries besides their body.
   * @param second A second helper on the carry's other side: its body, its side's row and carry; none when absent.
   * @returns The coupling, its key, holds and centre in the frame of the bearer's bone the resting region rides on.
   * @throws {HumanRefusal} A `participant` refusal on `mass` with the feasible borne mass, when no lean of the bearer balances it; a `reach` refusal on `carry` when no bearer's stance and borne legs within their ranges bring a held region within the bearer's arm (`HumanCarriedCouplingFit.fit`) by the carry's described grip nor any of its nearer ones (`HumanCarriedCoupling.NEARER`); a `parameter` refusal on `mass` for a negative extra mass.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs, the frame of the result and both refusals.
   * @evidence contracts/development/implementation.md#principled-implementation The key pose places the borne resting region on the bearer's at the bearer's fitted stance and turns it about that point to the row's hold places, a lone bearer's stance and the borne legs changed least so the arms reach (`HumanCarriedCouplingFit.fit`) by the described grip or, where it misses, the first nearer one that reaches, and the record keeps both so the bearer takes that stance and the borne body those legs; each contact is read on both key bodies; the bearing shares are the least-norm solution of the three equilibrium equations (the shares sum to one and their centre lies under the borne centre) with none a pull; the capacity is the moment-balance bound of `HumanLoad.lean`.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Key pose, contacts, centre, shares, capacity, record.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A contact the least-norm solution would have pull the borne body down, which a resting contact cannot, bears nothing and the rest are solved again in balance; collinear bearing contacts share by the lever rule along their line (`HumanCarriedCouplingLoad.shares`).
   * @evidence contracts/development/implementation.md#efficient-algorithms One mass model and load-share solve per meeting. A nearer grip requires another stance fit only where every earlier grip missed; a second helper checks one reach gap per held region tried.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The contact and mass calculations read the exact bearing stance and borne key bones already resolved for the successful reach check. The region places and the centre use the engine's surface resolution and mass model.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function; the record keeps no body or bone.
   */
  export function couple(
    rules: IContacts,
    bearer: IAutoMovieMotionHumanBody,
    borne: IAutoMovieMotionHumanBody,
    row: IAutoMovieMotionHumanCarried.IRow,
    carry: IAutoMovieMotionHumanCarried.Carry,
    extra: number = 0,
    second?: IAutoMovieMotionHumanCarriedCoupling.ICoupleSecond,
  ): IAutoMovieMotionCoupling {
    if (!(extra >= 0))
      throw new HumanRefusal({
        kind: "parameter",
        axis: "mass",
        value: extra,
        feasible: { kind: "range", minimum: 0, maximum: null, unit: "kg" },
        reason: "a borne person carries no negative mass",
        fix: "give the mass they carry, or none",
      });
    // A lone bearer's stance and the borne legs are fitted so its arms
    // reach the holds; a second helper keeps both bearers upright. The
    // described grip is taken where it reaches, a nearer one only where it
    // does not, so a later grip costs a fit only when an earlier one missed.
    const grips: readonly Grip[] = [rules.HOLDS[carry], ...(rules.NEARER[carry] ?? [])];
    const choose = (k: number): IGripFit => {
      try {
        return {
          read: HumanCarriedCouplingFit.read(
            bearer,
            borne,
            row,
            rules.HOLDS[carry],
            second === undefined,
            grips[k]!,
          ),
          held: grips[k]!,
        };
      } catch (error) {
        if (
          error instanceof HumanRefusal &&
          error.kind === "reach" &&
          k + 1 < grips.length
        )
          return choose(k + 1);
        throw error;
      }
    };
    const { read: { fit, mine, theirs }, held }: IGripFit = choose(0);
    // The key frame is the bone the resting region rides on, so the borne
    // body goes with that bone wherever the bearer's action takes it.
    const anchor: AutoMovieHumanoidBone = HumanCarriedCouplingPose.anchor(
      bearer,
      row.theirs,
    );
    const anchored: IAutoMovieResolvedBone = theirs.get(anchor)!;
    const keyed: IAutoMovieMotionHumanPosture = HumanCarriedCouplingPose.key(
      row,
      fit.legs,
    );
    const root: IAutoMovieVector3 = fit.place({ x: 0, y: 0, z: 0 });
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      anchored.worldRotation,
    );
    const local = (point: IAutoMovieVector3): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, anchored.worldPosition),
      );

    // A second helper stands where its side's region meets the borne
    // body's region on that side, facing as the first does.
    const besides: IBearingSide[] = [{ role: rules.BEARER, row, held }];
    const bearers: Record<string, Bearer> = {};
    const secondBones: Bones | undefined = second === undefined
      ? undefined
      : HumanCarriedCouplingPose.stood(second.body, { incline: 0, depth: 0 });
    if (second !== undefined) {
      const still: Bones = secondBones!;
      const shift: IAutoMovieVector3 = Vector3.subtract(
        fit.place(
          HumanCarriedCouplingPose.region(borne, mine, second.row.mine),
        ),
        HumanCarriedCouplingPose.region(second.body, still, second.row.theirs),
      );
      const own: AutoMovieHumanoidBone = HumanCarriedCouplingPose.anchor(
        second.body,
        second.row.theirs,
      );
      const bone: IAutoMovieResolvedBone = still.get(own)!;
      bearers[rules.SECOND] = {
        position: local(Vector3.add(bone.worldPosition, shift)),
        rotation: Quaternion.normalize(
          Quaternion.multiply(inverse, bone.worldRotation),
        ),
        anchor: own,
      };
      // The second helper stands upright where it is placed, so its grip is
      // the first of its carry's whose every held region lies within its
      // arm there (`HumanCarriedCouplingFit.gap`), or the described one.
      const reaches = (grip: Grip): boolean =>
        SIDES.every(
          (hand: AutoMovieHumanSide, index: number): boolean => {
            const region: HeldRegion =
              second.row.holds[index] === null ? null : (grip[index] ?? null);
            if (region === null) return true;
            const surface: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
              borne.surfaces.regions[region];
            const place: IAutoMovieMotionHumanCarriedCouplingPose.IHold =
              resolveAutoMovieHumanoidSurfaces.place(surface, mine.get(surface.bone)!);
            return (
              HumanCarriedCouplingFit.gap(second.body, still, hand, {
                point: Vector3.subtract(fit.place(place.point), shift),
                normal: Quaternion.rotateVector(fit.turn, place.normal),
              }) <= 0
            );
          },
        );
      const options: readonly Grip[] = [rules.HOLDS[second.carry], ...(rules.NEARER[second.carry] ?? [])];
      besides.push({
        role: rules.SECOND,
        row: second.row,
        held: options.find(reaches) ?? rules.HOLDS[second.carry],
      });
    }

    // The contacts: each bearer's resting region, which a lift held at the
    // arms' reach leaves in the air (`IRow.rise`), its palms under the held
    // regions, and the clinging hands.
    const bearing: IBearingContact[] = [];
    for (const side of besides) {
      if (!((side.row.rise ?? 0) > 0))
        bearing.push({
          role: side.role,
          region: side.row.mine,
          on: side.row.theirs,
        });
      SIDES.forEach(
        (hand: AutoMovieHumanSide, index: number): void => {
          const held: HeldRegion =
            side.row.holds[index] === null ? null : (side.held[index] ?? null);
          if (held !== null)
            bearing.push({
              role: side.role,
              region: held,
              on: hand === "left" ? "palmLeft" : "palmRight",
            });
        },
      );
    }
    const model: IAutoMovieResolveCenterOfMass.IModel = borne.massModel;
    const centre: IAutoMovieVector3 = fit.place(
      resolveAutoMovieCenterOfMass.place(model, mine),
    );

    // A drag leaves the dragged body's lowest region on the floor, which
    // bears its share of the weight with the dragger's contacts.
    if (carry in HumanCarriedDrag.CARRIES) {
      let lowest: HeldRegion = null;
      let height: number = Number.POSITIVE_INFINITY;
      for (const name of Object.keys(
        borne.surfaces.regions,
      ) as AutoMovieHumanoidRegion[]) {
        const y: number = fit.place(
          HumanCarriedCouplingPose.region(borne, mine, name),
        ).y;
        if (y < height) {
          height = y;
          lowest = name;
        }
      }
      if (lowest !== null)
        bearing.push({ role: rules.GROUND, region: lowest, on: lowest });
    }
    const points: IAutoMovieVector3[] = bearing.map(
      (b: IBearingContact): IAutoMovieVector3 =>
        fit.place(HumanCarriedCouplingPose.region(borne, mine, b.region)),
    );
    const loads: number[] = HumanCarriedCouplingLoad.shares(points, centre);
    const contacts: IAutoMovieMotionCoupling.IContact[] = bearing.map(
      (
        b: IBearingContact,
        index: number,
      ): IAutoMovieMotionCoupling.IContact => ({
        part: part(borne, b.region),
        region: b.region,
        on: { role: b.role, region: b.on },
        kind: "bear",
        load: loads[index]!,
        at: local(points[index]!),
      }),
    );
    for (const side of besides)
      SIDES.forEach(
        (hand: AutoMovieHumanSide, index: number): void => {
          const cling: HeldRegion =
            side.row.clings[index] ?? null;
          if (cling !== null)
            contacts.push({
              part: hand === "left" ? "leftHand" : "rightHand",
              region: hand === "left" ? "palmLeft" : "palmRight",
              on: { role: side.role, region: cling },
              kind: "grip",
              load: 0,
            });
        },
      );
    const coupling: IAutoMovieMotionCoupling = {
      bearer: rules.BEARER,
      borne: rules.BORNE,
      contacts,
      mass: model.mass + extra,
      centre: local(centre),
      anchor,
      key: {
        position: local(root),
        rotation: Quaternion.normalize(
          Quaternion.multiply(
            inverse,
            Quaternion.multiply(fit.turn, resolveHumanPosture.heading(keyed)),
          ),
        ),
        legs: fit.legs,
        stance: fit.stance,
      },
      ...(second === undefined ? {} : { bearers }),
    };
    HumanCarriedCouplingLoad.bearable(bearer, coupling, rules.BEARER, theirs);
    if (second !== undefined)
      HumanCarriedCouplingLoad.bearable(second.body, coupling, rules.SECOND, secondBones);
    return coupling;
  }

  /** The contact window part a region's bone belongs to. */
  const part = (
    body: IAutoMovieMotionHumanBody,
    name: AutoMovieHumanoidRegion,
  ): IAutoMovieMotionHumanContactWindow["part"] => {
    const bone: AutoMovieHumanoidBone = body.surfaces.regions[name].bone;
    const limb: IAutoMovieMotionHumanContactWindow["part"] | undefined = (
      {
        leftHand: "leftHand",
        rightHand: "rightHand",
        leftFoot: "leftFoot",
        rightFoot: "rightFoot",
        leftUpperArm: "leftUpperArm",
        rightUpperArm: "rightUpperArm",
        leftLowerArm: "leftLowerArm",
        rightLowerArm: "rightLowerArm",
        leftUpperLeg: "leftUpperLeg",
        rightUpperLeg: "rightUpperLeg",
        leftLowerLeg: "leftLowerLeg",
        rightLowerLeg: "rightLowerLeg",
      } as Partial<
        Record<
          AutoMovieHumanoidBone,
          IAutoMovieMotionHumanContactWindow["part"]
        >
      >
    )[bone];
    return limb ?? (bone === "hips" ? "seat" : "back");
  };
}
