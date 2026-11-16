import {
  ANKLE_DORSIFLEXION,
  Quaternion,
  Vector3,
  wrapDegrees,
} from "@automovie/engine";
import type {
  IAutoMovieQuaternion,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { IHumanBody } from "../body/IHumanBody";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { HumanLegChain } from "../posture/HumanLegChain";
import { walkLeg } from "./walkLeg";
import type { walkLegClearance } from "./walkLegClearance";
import type { walkStanceCourse } from "./walkStanceCourse";
import { walkStanceTerms } from "./walkStanceTerms";
import { walkStanceOutline } from "./walkStanceOutline";

/**
 * The stances of a stance course read at a course (`walkStanceCourse`):
 * each knot's pelvis at its trunk's tilt, each stance's reach,
 * dorsiflexion, trailing and turn, the soles laid flat and turned, the base
 * the feet bear and each foot's share of the weight; with the outline
 * operations the model reads them through. Outline mathematics belongs to
 * `walkStanceOutline`.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and who reads it.
 * @evidence contracts/development/design.md#principled-representation The geometry half of one course's problem, built once per problem and read by `walkStanceModel`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface One builder provides prepared stance, load and support readings to the model.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reading is the body's own measure and range.
 */
export namespace walkStanceGeometry {
  /**
   * The geometry of a course's problem over its knots.
   *
   * @param body The body.
   * @param knots The knots.
   * @returns The knot count, the step, the reach, the units and ranges, the variables' readers, each stance's reading at a course, each foot's share of the weight and the base the feet bear.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States prepared world-frame geometry, course variables, units and the separate goal-only and full constraint readers.
   * @evidence contracts/development/implementation.md#principled-implementation Uses the body's exact foot pivots and leg-chain posing, original ankle/trailing constraints and sole-bearing half-plane clipping; finite course values and immutable body/placement/frame data are the owning problem's premises.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Goal construction is shared by planted and read; prepared sole/load data serve support, while walkStanceOutline owns polygon mathematics.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Retains the original heading, twist, support clipping, load interpolation and reach-shell behavior with unchanged thresholds and body measures.
   * @evidence contracts/development/implementation.md#efficient-algorithms Preparation is linear in knots and their fixed foot outlines. A planted read performs only its requested goal geometry; a full read additionally poses one leg, and support forms the original two-sole hull.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Each knot shares three exact pitch/roll pelvis readings; each stance shares five exact pitch/turn/slide pivot readings and six exact clipped support regions under its fixed placement. Public planted outputs copy pivot records, fixed outlines/loads retain their original inputs, and full readings always read current held swivels.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The problem retains fixed per-knot geometry, three pelvis records per knot and at most five pivot plus six clipped-region records per stance, O(k) for bounded sole size, released with its closure; no query history or global cache grows.
   */
  export function of(
    body: IHumanBody,
    knots: readonly walkStanceCourse.IKnot[],
  ): {
    n: number;
    step: number;
    limit: number;
    lengthwise: number;
    dorsal: number;
    unloadedDorsal: number;
    size: number;
    pitchOf: (side: "left" | "right") => number;
    slideOf: (side: "left" | "right") => number;
    turnOf: (side: "left" | "right") => number;
    scheduled: number[][];
    planted: (x: Float64Array, k: number, j: number) => walkStanceCourse.IPlanted;
    read: (x: Float64Array, k: number, j: number) => {
      reach: number;
      dorsi: number;
      trail: number;
      twist: number;
      leg: walkLegClearance.ILeg | null;
      planted: walkStanceCourse.IPlanted;
    };
    load: (k: number, j: number) => number;
    support: (x: Float64Array, k: number) => IAutoMovieVector3[];
  } {
    const n: number = knots.length;
    const step: number = n > 1 ? knots[1]!.seconds - knots[0]!.seconds : 1;
    const limit: number = walkStanceTerms.reachOf(body);
    // A length a constraint reads, in the degrees the leg turns about its hip
    // to move its ankle by it, so a constraint on a length and one on an
    // angle are met within the same tolerance (`MET`).
    const lengthwise: number = 180 / (Math.PI * limit);
    const dorsal: number = ANKLE_DORSIFLEXION.loaded - walkLeg.ANKLE;
    const unloadedDorsal: number = ANKLE_DORSIFLEXION.unloaded - walkLeg.ANKLE;
    const size: number = walkStanceTerms.WIDTH * n;
    const pitchOf: ReturnType<typeof of>["pitchOf"] = (side: "left" | "right"): number =>
      side === "left" ? 1 : 2;
    const slideOf: ReturnType<typeof of>["slideOf"] = (side: "left" | "right"): number =>
      side === "left" ? 7 : 9;
    const turnOf: ReturnType<typeof of>["turnOf"] = (side: "left" | "right"): number =>
      side === "left" ? 5 : 6;
    const scheduled: number[][] = knots.map((knot: walkStanceCourse.IKnot): number[] =>
      knot.stances.map((s: walkStanceCourse.IStance): number =>
        HumanFoot.pitch(s.placement.rotation),
      ),
    );
    const flat: (p: IAutoMovieVector3) => IAutoMovieVector3 = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: p.x,
      y: 0,
      z: p.z,
    });

    // A stance's differences use the base tilt and one probe of each trunk
    // axis. Keep those three exact readings per knot, independent of which
    // foot requested them; the next iterate replaces the oldest entries.
    const pelves: {
      pitch: number;
      roll: number;
      pelvis: walkStanceCourse.IPelvis;
    }[][] = knots.map((): [] => []);
    const pelvisAt: (k: number, pitch: number, roll: number) => walkStanceCourse.IPelvis = (k: number, pitch: number, roll: number): walkStanceCourse.IPelvis => {
      const entries: (typeof pelves)[number] = pelves[k]!;
      const kept: (typeof entries)[number] | undefined = entries.find(
        (entry: (typeof entries)[number]): boolean => entry.pitch === pitch && entry.roll === roll,
      );
      if (kept !== undefined)
        return kept.pelvis;
      const pelvis: walkStanceCourse.IPelvis = knots[k]!.pelvis({ pitch, roll });
      if (entries.length === 3) entries.shift();
      entries.push({ pitch, roll, pelvis });
      return pelvis;
    };

    /** A foot's five distinct values in one coordinate-difference sweep. */
    type IPivot = {
      pitch: number;
      turn: number;
      dx: number;
      dz: number;
      foot: HumanFoot.IPlacement;
      heading: number;
    };
    const pivots: IPivot[][][] = knots.map(
      (knot: walkStanceCourse.IKnot): IPivot[][] => knot.stances.map((): IPivot[] => []),
    );
    const footAt: (x: Float64Array, k: number, j: number) => IPivot = (
      x: Float64Array, k: number, j: number,
    ): IPivot => {
      const s: walkStanceCourse.IStance = knots[k]!.stances[j]!;
      const o: number = walkStanceTerms.WIDTH * k;
      const pitch: number = x[o + pitchOf(s.side)]!;
      const turn: number = x[o + turnOf(s.side)]!;
      const dx: number = x[o + slideOf(s.side)]!;
      const dz: number = x[o + slideOf(s.side) + 1]!;
      const entries: IPivot[] = pivots[k]![j]!;
      const known: IPivot | undefined = entries.find(
        (entry: IPivot): boolean => Object.is(entry.pitch, pitch) && Object.is(entry.turn, turn) && Object.is(entry.dx, dx) && Object.is(entry.dz, dz),
      );
      if (known !== undefined) return known;
      const placement: HumanFoot.IPlacement = HumanFoot.turned(
        walkStanceOutline.slid(s.placement, dx, dz), turn,
      );
      const heading: number = HumanFoot.heading(placement.rotation);
      const made: IPivot = {
        pitch, turn, dx, dz, heading,
        foot: HumanFoot.pivot(body, s.side, "mtp", HumanFoot.point(body, s.side, "mtp", placement), heading, pitch),
      };
      if (entries.length === 5) entries.shift();
      entries.push(made);
      return made;
    };

    // Fitting a planted leg needs its goals alone, without posing its knee
    // or evaluating the stance's constraints first.
    const planted: (
      x: Float64Array,
      k: number,
      j: number,
    ) => walkStanceCourse.IPlanted = (
      x: Float64Array,
      k: number,
      j: number,
    ): walkStanceCourse.IPlanted => {
      const o: number = walkStanceTerms.WIDTH * k;
      const s: walkStanceCourse.IStance = knots[k]!.stances[j]!;
      const pelvis: walkStanceCourse.IPelvis = pelvisAt(k, x[o + 3]!, x[o + 4]!);
      const hip: IAutoMovieVector3 = {
        ...pelvis.hips[s.side],
        y: pelvis.hips[s.side].y - x[o]!,
      };
      const pivoted: IPivot = footAt(x, k, j);
      return {
        side: s.side,
        pelvis: pelvis.rotation,
        hip,
        ankle: { ...pivoted.foot.ankle },
        rotation: { ...pivoted.foot.rotation },
        heading: pivoted.heading,
        drop: x[o]!,
      };
    };

    // A stance's full constraint reading extends the same planted goals;
    // fit preparation and course recording stop at those goals instead.
    const read: ReturnType<typeof of>["read"] = (
      x: Float64Array,
      k: number,
      j: number,
    ): ReturnType<ReturnType<typeof of>["read"]> => {
      const o: number = walkStanceTerms.WIDTH * k;
      const s: walkStanceCourse.IStance = knots[k]!.stances[j]!;
      const plant: walkStanceCourse.IPlanted = planted(x, k, j);
      const { hip, ankle, heading }: walkStanceCourse.IPlanted = plant;
      const pitch: number = x[o + pitchOf(s.side)]!;
      const reach: number = Vector3.distance(ankle, hip);
      // The leg as the posture's fit poses it, at the swivel the take holds
      // (`HumanLegChain`): its knee then bends where the shown knee does, and
      // the ankle's dorsiflexion is the shank's lean over the foot's heading
      // (as `walkLeg.lean` reads it, there of its own knee) plus the pitch.
      // A held swivel's first-order piece moves it with the leg's own
      // variables (`ISwivel`).
      const swivel: HumanLegChain.ISwivel | undefined =
        s.swivel === undefined
          ? undefined
          : {
              branch: s.swivel.branch,
              swivel:
                s.swivel.swivel +
                (s.swivel.slope ?? []).reduce(
                  (sum: number, g: number, v: number): number =>
                    sum + g * (x[walkStanceTerms.legOf(o, s.side, v)]! - s.swivel!.about![v]!),
                  0,
                ),
            };
      // The leg as the posture poses it at the ankle the course places: one
      // the leg cannot reach stands on its reachable shell along the line to
      // the ankle (`hingedArmSwivel.branches`), as the shown leg does, and
      // the reach's own constraint answers for the excess.
      const posed: HumanLegChain.IPosed | null =
        swivel === undefined
          ? null
          : HumanLegChain.pose(body, s.side, plant.pelvis, hip, ankle, swivel);
      const held: IAutoMovieVector3 = posed?.ankle ?? ankle;
      const forward: IAutoMovieVector3 = HumanFrame.point(
        { origin: { x: 0, y: 0, z: 0 }, yaw: heading },
        { x: 0, y: 0, z: 1 },
      );
      const shin: IAutoMovieVector3 | null =
        posed === null ? null : Vector3.subtract(posed.knee, held);
      return {
        reach,
        dorsi:
          (shin === null
            ? walkLeg.lean(body, hip, held, heading)
            : (Math.atan2(Vector3.dot(shin, forward), shin.y) * 180) / Math.PI) +
          pitch,
        trail: walkLeg.trailing(
          body,
          { x: 0, y: 0, z: 0 },
          Quaternion.rotateVector(
            Quaternion.inverse(plant.pelvis),
            Vector3.subtract(held, hip),
          ),
          0,
        ),
        twist: wrapDegrees(heading - HumanFoot.heading(plant.pelvis)),
        leg:
          posed === null
            ? null
            : { ...posed, side: s.side, rotation: plant.rotation },
        planted: plant,
      };
    };
    // How deep inside the base the knot's feet bear a point at a course's
    // pitches and turns, metres, negative outside: a foot's pitch raises a
    // point of its sole by its distance from the pivot's line times the
    // pitch's sine, so the foot bears its outline up to where that height
    // reaches `HumanFoot.BEARING`, a region that shrinks continuously as the
    // heel rises; the toes lie flat ahead of the ball.
    // Each stance's sole laid flat, read once, and turned on the floor about
    // its ankle as the course turns the foot.
    /** The immutable scheduled sole and its floor-frame landmarks. */
    type ISole = {
      outline: IAutoMovieVector3[];
      ball: IAutoMovieVector3;
      heel: IAutoMovieVector3;
      ahead: IAutoMovieVector3;
      ankle: IAutoMovieVector3;
    };
    const soles: ISole[][] = knots.map((knot: walkStanceCourse.IKnot): ISole[] =>
      knot.stances.map((s: walkStanceCourse.IStance): ISole => ({
        outline: walkStanceOutline.hull(HumanFoot.sole(body, s.side, s.placement).map(flat)),
        ball: flat(HumanFoot.point(body, s.side, "ball", s.placement)),
        heel: flat(HumanFoot.point(body, s.side, "heel", s.placement)),
        ahead: Vector3.normalize(
          flat(
            Quaternion.rotateVector(s.placement.rotation, { x: 0, y: 0, z: 1 }),
          ),
        ),
        ankle: flat(s.placement.ankle),
      })),
    );
    const sole: (k: number, j: number, turn: number, dx: number, dz: number) => ISole = (
      k: number,
      j: number,
      turn: number,
      dx: number,
      dz: number,
    ): ISole => {
      const out: ISole = soles[k]![j]!;
      if (turn === 0 && dx === 0 && dz === 0) return out;
      const turning: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        turn,
      );
      const about: (p: IAutoMovieVector3) => IAutoMovieVector3 = (p: IAutoMovieVector3): IAutoMovieVector3 => {
        const q: IAutoMovieVector3 = Vector3.add(
          out.ankle,
          Quaternion.rotateVector(turning, Vector3.subtract(p, out.ankle)),
        );
        return { x: q.x + dx, y: 0, z: q.z + dz };
      };
      return {
        outline: out.outline.map(about),
        ball: about(out.ball),
        heel: about(out.heel),
        ahead: Quaternion.rotateVector(turning, out.ahead),
        ankle: about(out.ankle),
      };
    };

    /** A sole's exact clipped bearing region and its shared rigid placement. */
    type IRegion = {
      pitch: number;
      turn: number;
      dx: number;
      dz: number;
      sole: ISole;
      outline: IAutoMovieVector3[];
    };
    const regions: IRegion[][][] = knots.map(
      (knot: walkStanceCourse.IKnot): IRegion[][] => knot.stances.map((): IRegion[] => []),
    );

    // The base and scheduled pitch plus four single-foot probes use at most
    // six bearing regions per stance. The other foot stays unchanged.
    const region: (k: number, j: number, pitch: number, turn: number, dx: number, dz: number) => IAutoMovieVector3[] = (
      k: number,
      j: number,
      pitch: number,
      turn: number,
      dx: number,
      dz: number,
    ): IAutoMovieVector3[] => {
      const entries: IRegion[] = regions[k]![j]!;
      const placed: IRegion | undefined = entries.find(
        (entry: IRegion): boolean => Object.is(entry.turn, turn) && Object.is(entry.dx, dx) && Object.is(entry.dz, dz) && Object.is(entry.pitch, pitch),
      );
      if (placed !== undefined) return placed.outline;
      const rigid: ISole = entries.find(
        (entry: IRegion): boolean => Object.is(entry.turn, turn) && Object.is(entry.dx, dx) && Object.is(entry.dz, dz),
      )?.sole ?? sole(k, j, turn, dx, dz);
      const { outline, ball, heel, ahead }: ISole = rigid;
      const rise: number = Math.sin((Math.abs(pitch) * Math.PI) / 180);
      const out: IAutoMovieVector3[] = rise < 1e-9 ? outline : pitch < 0
        ? walkStanceOutline.clip(outline, ball, ahead, -HumanFoot.BEARING / rise)
        : walkStanceOutline.clip(
            outline,
            heel,
            Vector3.scale(ahead, -1),
            -HumanFoot.BEARING / rise,
          );
      if (entries.length === 6) entries.shift();
      entries.push({ pitch, turn, dx, dz, sole: rigid, outline: out });
      return out;
    };
    // A planted foot's share of the weight at a knot: the whole of it when it
    // stands alone or the take names no centre of pressure; otherwise in
    // proportion to how near the centre of pressure lies to it, against how
    // near it lies to the other foot (each nearness its distance to that
    // foot's outline, none inside it), as the centre of pressure lies where
    // the weight bears.
    const shares: number[][] = knots.map((knot: walkStanceCourse.IKnot, k: number): number[] => {
      const pressure: IAutoMovieVector3 | undefined = knot.borne?.[0];
      if (knot.stances.length < 2 || pressure === undefined)
        return knot.stances.map((): number => 1);
      const far: number[] = knot.stances.map((_: walkStanceCourse.IStance, j: number): number =>
        Math.max(0, -walkStanceOutline.depth(soles[k]![j]!.outline, pressure)),
      );
      const sum: number = far[0]! + far[1]!;
      return sum > 0
        ? [far[1]! / sum, far[0]! / sum]
        : knot.stances.map((): number => 0.5);
    });
    const load: ReturnType<typeof of>["load"] = (k: number, j: number): number => shares[k]![j]!;
    // The base the knot's feet bear at a course's pitches and turns.
    const support: ReturnType<typeof of>["support"] = (x: Float64Array, k: number): IAutoMovieVector3[] =>
      walkStanceOutline.hull(
        knots[k]!.stances.flatMap(
          (s: walkStanceCourse.IStance, j: number): IAutoMovieVector3[] =>
            region(
              k,
              j,
              x[walkStanceTerms.WIDTH * k + pitchOf(s.side)]!,
              x[walkStanceTerms.WIDTH * k + turnOf(s.side)]!,
              x[walkStanceTerms.WIDTH * k + slideOf(s.side)]!,
              x[walkStanceTerms.WIDTH * k + slideOf(s.side) + 1]!,
            ),
        ),
      );

    return {
      n,
      step,
      limit,
      lengthwise,
      dorsal,
      unloadedDorsal,
      size,
      pitchOf,
      slideOf,
      turnOf,
      scheduled,
      planted,
      read,
      load,
      support,
    };
  }
}
