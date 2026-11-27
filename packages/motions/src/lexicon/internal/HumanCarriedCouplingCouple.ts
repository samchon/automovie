import { Quaternion, Vector3, AutoMovieEngineKinematics } from "@automovie/engine";
import type { AutoMovieHumanSide, AutoMovieHumanoidBone, AutoMovieHumanoidRegion, IAutoMovieMotionCoupling, IAutoMovieMotionHumanBody, IAutoMovieMotionHumanCarried, IAutoMovieMotionHumanCarriedCoupling, IAutoMovieMotionHumanCarriedCouplingPose, IAutoMovieMotionHumanContactWindow, IAutoMovieMotionHumanPosture, IAutoMovieQuaternion, IAutoMovieResolveCenterOfMass, IAutoMovieResolvedBone, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieMotionHumanTarget } from "../../compose/internal/AutoMovieMotionHumanTarget";
import { AutoMovieMotionHumanRefusal } from "../../law/AutoMovieMotionHumanRefusal";
import { humanPostureHeading } from "../../posture/internal/humanPostureHeading";
import { HumanCarriedCouplingFit } from "./HumanCarriedCouplingFit";
import { HumanCarriedCouplingLoad } from "./HumanCarriedCouplingLoad";
import { HumanCarriedCouplingPose } from "./HumanCarriedCouplingPose";
import type { HumanCarriedGripGaps } from "./HumanCarriedGripGaps";
import { HumanCarriedNeckClear } from "./HumanCarriedNeckClear";
import { HumanCarriedPitch } from "./HumanCarriedPitch";

/*
 * Bearer and borne region pairs follow the row's left-to-right order.
 */
const SIDES: readonly AutoMovieHumanSide[] = ["left", "right"];

/*
 * The per-pair solve of a named carry's coupling (`HumanCarriedCoupling`): the
 * key pose that rests the borne body on the bearer, the contacts read on both
 * key bodies, the bearing shares and the capacity, in one record. The meeting
 * kind and the carry's tables stay with `HumanCarriedCoupling`, which delegates
 * its `couple` here.
 */
export namespace HumanCarriedCouplingCouple {
  /*
   * The role names and contact tables supplied by `HumanCarriedCoupling`.
   */
  export interface IContacts {
    /*
     * The first bearer's role name.
     */
    readonly BEARER: string;

    /*
     * The borne person's role name.
     */
    readonly BORNE: string;

    /*
     * The trailing surface's role name for a drag.
     */
    readonly GROUND: string;

    /*
     * The optional second helper's role name.
     */
    readonly SECOND: string;

    /*
     * Default held regions for every carry.
     */
    readonly HOLDS: Readonly<Record<IAutoMovieMotionHumanCarried.Carry, Grip>>;

    /*
     * Alternative grips in preference order, only for carries that provide
     * them.
     */
    readonly NEARER: Readonly<
      Partial<Record<IAutoMovieMotionHumanCarried.Carry, readonly Grip[]>>
    >;
  }

  /*
   * The coupling of a carry between two bodies, refused when the bearer cannot
   * balance the borne mass.
   * Parameter rules: The meeting's role names, default grips and nearer grips.
   * Parameter bearer: The bearer's body.
   * Parameter borne: The borne body.
   * Parameter row: The carry's row.
   * Parameter carry: The carry, for its holds.
   * Parameter extra: Kilograms the borne person carries besides their body.
   * Parameter second: A second helper on the carry's other side: its body, its
   * side's row and carry; none when absent.
   * Returns: The coupling, its key, holds and centre in the frame of the
   * bearer's bone the resting region rides on.
   * A `participant` refusal on `mass` with the feasible
   * borne mass, when no lean of the bearer balances it; a `reach` refusal on
   * `carry` when no bearer's stance and borne legs within their ranges bring
   * a held region within the bearer's arm (`HumanCarriedCouplingFit.fit`) by
   * the carry's described grip nor any of its nearer ones
   * (`HumanCarriedCoupling.NEARER`); a `parameter` refusal on `mass` for a
   * negative extra mass.
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
      throw new AutoMovieMotionHumanRefusal({
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
    const grips: readonly Grip[] = [
      rules.HOLDS[carry],
      ...(rules.NEARER[carry] ?? []),
    ];
    const secondBones: Bones | undefined =
      second === undefined
        ? undefined
        : HumanCarriedCouplingPose.stood(second.body, { incline: 0, depth: 0 });
    const planted: HumanCarriedGripGaps.IPlantedContact | undefined =
      second === undefined
        ? undefined
        : {
            region: second.row.mine,
            height: HumanCarriedCouplingPose.region(
              second.body,
              secondBones!,
              second.row.theirs,
            ).y,
          };
    // The grips are the carry's candidates in its order, each tested for
    // feasibility by the bearer's fit, and the first feasible one is held
    // (`AutoMovieMotionHumanTarget.feasible`, Miller and Allen 2004).
    const chosen: IGripFit = AutoMovieMotionHumanTarget.feasible<
      Grip,
      IGripFit
    >({
      candidates: grips,
      test: (grip: Grip): IGripFit => ({
        read: HumanCarriedCouplingFit.read(
          bearer,
          borne,
          row,
          rules.HOLDS[carry],
          second === undefined,
          grip,
          planted,
        ),
        held: grip,
      }),
    });
    // The borne body is pitched forward over its supports where its centre
    // lies behind all of them (`HumanCarriedPitch`), and then its pelvis set
    // back off the bearer's neck where the pitched key rests it there
    // (`HumanCarriedNeckClear`).
    const {
      read: { fit, mine, theirs },
      held,
    }: IGripFit = {
      ...chosen,
      read: HumanCarriedNeckClear(
        bearer,
        borne,
        HumanCarriedPitch(borne, row, chosen.held, chosen.read),
      ),
    };
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
    const keyHeading: IAutoMovieQuaternion = humanPostureHeading(keyed);
    const root: IAutoMovieVector3 = fit.place({ x: 0, y: 0, z: 0 });
    const inverse: IAutoMovieQuaternion = Quaternion.inverse(
      anchored.worldRotation,
    );
    const local: (point: IAutoMovieVector3) => IAutoMovieVector3 = (
      point: IAutoMovieVector3,
    ): IAutoMovieVector3 =>
      Quaternion.rotateVector(
        inverse,
        Vector3.subtract(point, anchored.worldPosition),
      );

    // A second helper stands where its side's region meets the borne
    // body's region on that side, facing as the first does.
    const besides: IBearingSide[] = [{ role: rules.BEARER, row, held }];
    const bearers: Record<string, Bearer> = {};
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
      const reaches: (grip: Grip) => boolean = (grip: Grip): boolean =>
        SIDES.every((hand: AutoMovieHumanSide, index: number): boolean => {
          const region: HeldRegion =
            second.row.holds[index] === null ? null : (grip[index] ?? null);
          if (region === null) return true;
          const surface: IAutoMovieMotionHumanBody["surfaces"]["regions"][AutoMovieHumanoidRegion] =
            borne.surfaces.regions[region];
          const place: IAutoMovieMotionHumanCarriedCouplingPose.IHold =
            AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfacePlace(
              surface,
              mine.get(surface.bone)!,
            );
          const fingers: IAutoMovieVector3 | undefined =
            second.row.holds[index]?.fingers;
          return (
            HumanCarriedCouplingFit.gap(
              second.body,
              still,
              hand,
              {
                point: Vector3.subtract(fit.place(place.point), shift),
                normal: Quaternion.rotateVector(fit.turn, place.normal),
                ...(fingers === undefined
                  ? {}
                  : {
                      forward: Quaternion.rotateVector(
                        fit.turn,
                        Quaternion.rotateVector(
                          mine.get(surface.bone)!.worldRotation,
                          fingers,
                        ),
                      ),
                    }),
              },
              second.row.holds[index]?.shape,
            ) <= 0
          );
        });
      const options: readonly Grip[] = [
        rules.HOLDS[second.carry],
        ...(rules.NEARER[second.carry] ?? []),
      ];
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
      SIDES.forEach((hand: AutoMovieHumanSide, index: number): void => {
        const held: HeldRegion =
          side.row.holds[index] === null ? null : (side.held[index] ?? null);
        if (held !== null)
          bearing.push({
            role: side.role,
            region: held,
            on: hand === "left" ? "palmLeft" : "palmRight",
          });
      });
    }
    const model: IAutoMovieResolveCenterOfMass.IModel = borne.massModel;
    const centre: IAutoMovieVector3 = fit.place(
      AutoMovieEngineKinematics.resolveAutoMovieCenterOfMassPlace(model, mine),
    );

    // A drag (`HumanCarriedDrag.CARRIES`, its names the declared union
    // `IAutoMovieMotionHumanCarriedDrag.Name`) leaves the dragged body's lowest
    // region on the floor, which bears its share of the weight with the
    // dragger's contacts.
    if (
      carry === "armpitDrag" ||
      carry === "collarDrag" ||
      carry === "ankleDrag"
    ) {
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
    // The clinging hands bear their share with the resting regions and the
    // palms under the held ones: each is a point support at its palm in the
    // same statics (`HumanCarriedCouplingLoad.shares`), so a borne centre
    // that lies ahead of the seat is balanced by the hands that hold on,
    // not put on the seat alone.
    const clinging: IClingContact[] = besides.flatMap(
      (side: IBearingSide): IClingContact[] =>
        SIDES.flatMap(
          (hand: AutoMovieHumanSide, index: number): IClingContact[] => {
            const cling: HeldRegion = side.row.clings[index] ?? null;
            return cling === null ? [] : [{ role: side.role, hand, cling }];
          },
        ),
    );
    const palmOf = (hand: AutoMovieHumanSide): AutoMovieHumanoidRegion =>
      hand === "left" ? "palmLeft" : "palmRight";
    const points: IAutoMovieVector3[] = [
      ...bearing.map(
        (b: IBearingContact): IAutoMovieVector3 =>
          fit.place(HumanCarriedCouplingPose.region(borne, mine, b.region)),
      ),
      // A clinging palm presses where it clings, on the first bearer's
      // region (its goal there), not where the key's arm happens to hang.
      ...clinging.map(
        (c: IClingContact): IAutoMovieVector3 =>
          c.role === rules.BEARER
            ? HumanCarriedCouplingPose.region(bearer, theirs, c.cling)
            : fit.place(
                HumanCarriedCouplingPose.region(borne, mine, palmOf(c.hand)),
              ),
      ),
    ];
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
    clinging.forEach((c: IClingContact, k: number): void => {
      const index: number = bearing.length + k;
      contacts.push({
        part: c.hand === "left" ? "leftHand" : "rightHand",
        region: palmOf(c.hand),
        on: { role: c.role, region: c.cling },
        kind: "grip",
        load: loads[index]!,
        at: local(points[index]!),
      });
    });
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
            Quaternion.multiply(fit.turn, keyHeading),
          ),
        ),
        legs: fit.legs,
        stance: fit.stance,
      },
      ...(second === undefined ? {} : { bearers }),
    };
    HumanCarriedCouplingLoad.bearable(bearer, coupling, rules.BEARER, theirs);
    if (second !== undefined)
      HumanCarriedCouplingLoad.bearable(
        second.body,
        coupling,
        rules.SECOND,
        secondBones,
      );
    return coupling;
  }

  /*
   * The contact window part a region's bone belongs to.
   */
  const part: (
    body: IAutoMovieMotionHumanBody,
    name: AutoMovieHumanoidRegion,
  ) => IAutoMovieMotionHumanContactWindow["part"] = (
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

/*
 * The borne regions held by the bearer's left and right hands.
 */
type Grip = Parameters<typeof HumanCarriedCouplingFit.read>[3];

/*
 * A borne region a hand holds, or no grip for that hand.
 */
type HeldRegion = Grip[number];

/*
 * A reachable placement and the grip its reach was checked against.
 */
interface IGripFit {
  read: HumanCarriedCouplingFit.IRead;
  held: Grip;
}

/*
 * The contacts contributed by one bearer.
 */
interface IBearingSide {
  role: string;
  row: IAutoMovieMotionHumanCarried.IRow;
  held: Grip;
}

/*
 * A borne region and the surface it bears on.
 */
interface IBearingContact {
  role: string;
  region: AutoMovieHumanoidRegion;
  on: AutoMovieHumanoidRegion;
}

/*
 * A borne hand that clings to a bearer: the bearer's role, the hand and the
 * bearer's region it holds.
 */
interface IClingContact {
  role: string;
  hand: AutoMovieHumanSide;
  cling: AutoMovieHumanoidRegion;
}

/*
 * A second bearer's anchor in the first bearer's anchor frame.
 */
type Bearer = NonNullable<IAutoMovieMotionCoupling["bearers"]>[string];

/*
 * The key stance's actual resolved bearing frames.
 */
type Bones = HumanCarriedCouplingFit.IRead["theirs"];
