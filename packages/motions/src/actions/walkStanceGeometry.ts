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

/**
 * The stances of a stance course read at a course (`walkStanceCourse`):
 * each knot's pelvis at its trunk's tilt, each stance's reach,
 * dorsiflexion, trailing and turn, the soles laid flat and turned, the base
 * the feet bear and each foot's share of the weight; with the outline
 * helpers the model reads them through.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States what is read and who reads it.
 * @evidence contracts/development/design.md#principled-representation The geometry half of one course's problem, built once per problem and read by `walkStanceModel`.
 * @evidence contracts/development/design.md#minimal-and-owned-surface The geometry's builder and the four outline helpers.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts Every reading is the body's own measure and range.
 */
export namespace walkStanceGeometry {
  /**
   * The geometry of a course's problem over its knots.
   *
   * @param body The body.
   * @param knots The knots.
   * @returns The knot count, the step, the reach, the units and ranges, the variables' readers, each stance's reading at a course, each foot's share of the weight and the base the feet bear.
   */
  export function of(
    body: IHumanBody,
    knots: readonly walkStanceCourse.IKnot[],
  ) {
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
    const pitchOf = (side: "left" | "right"): number =>
      side === "left" ? 1 : 2;
    const slideOf = (side: "left" | "right"): number =>
      side === "left" ? 7 : 9;
    const turnOf = (side: "left" | "right"): number =>
      side === "left" ? 5 : 6;
    const scheduled: number[][] = knots.map((knot: walkStanceCourse.IKnot): number[] =>
      knot.stances.map((s: walkStanceCourse.IStance): number =>
        HumanFoot.pitch(s.placement.rotation),
      ),
    );
    const flat = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
      x: p.x,
      y: 0,
      z: p.z,
    });

    // Each knot's pelvis at the trunk's tilt it was last read at: the
    // differences that move the drop, a pitch or a turn read it again.
    const pelves: { pitch: number; roll: number; pelvis: walkStanceCourse.IPelvis }[] = [];
    const pelvisAt = (k: number, pitch: number, roll: number): walkStanceCourse.IPelvis => {
      const kept = pelves[k];
      if (kept !== undefined && kept.pitch === pitch && kept.roll === roll)
        return kept.pelvis;
      const pelvis: walkStanceCourse.IPelvis = knots[k]!.pelvis({ pitch, roll });
      pelves[k] = { pitch, roll, pelvis };
      return pelvis;
    };

    // A stance's reach, dorsiflexion, trailing and turn from the pelvis at a
    // course's values for its knot.
    const read = (
      x: Float64Array,
      k: number,
      j: number,
    ): {
      reach: number;
      dorsi: number;
      trail: number;
      twist: number;
      leg: walkLegClearance.ILeg | null;
      planted: walkStanceCourse.IPlanted;
    } => {
      const o: number = walkStanceTerms.WIDTH * k;
      const s: walkStanceCourse.IStance = knots[k]!.stances[j]!;
      const pelvis: walkStanceCourse.IPelvis = pelvisAt(k, x[o + 3]!, x[o + 4]!);
      const hip: IAutoMovieVector3 = {
        ...pelvis.hips[s.side],
        y: pelvis.hips[s.side].y - x[o]!,
      };
      const placement: HumanFoot.IPlacement = HumanFoot.turned(
        slid(s.placement, x[o + slideOf(s.side)]!, x[o + slideOf(s.side) + 1]!),
        x[o + turnOf(s.side)]!,
      );
      const heading: number = HumanFoot.heading(placement.rotation);
      const pitch: number = x[o + pitchOf(s.side)]!;
      const pivoted: HumanFoot.IPlacement = HumanFoot.pivot(
        body,
        s.side,
        "mtp",
        HumanFoot.point(body, s.side, "mtp", placement),
        heading,
        pitch,
      );
      const ankle: IAutoMovieVector3 = pivoted.ankle;
      const reach: number = Vector3.length(Vector3.subtract(ankle, hip));
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
          : HumanLegChain.pose(body, s.side, pelvis.rotation, hip, ankle, swivel);
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
            Quaternion.inverse(pelvis.rotation),
            Vector3.subtract(held, hip),
          ),
          0,
        ),
        twist: wrapDegrees(heading - HumanFoot.heading(pelvis.rotation)),
        leg:
          posed === null
            ? null
            : { ...posed, side: s.side, rotation: pivoted.rotation },
        planted: {
          side: s.side,
          pelvis: pelvis.rotation,
          hip,
          ankle,
          rotation: pivoted.rotation,
          heading,
          drop: x[o]!,
        },
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
    const soles: {
      outline: IAutoMovieVector3[];
      ball: IAutoMovieVector3;
      heel: IAutoMovieVector3;
      ahead: IAutoMovieVector3;
      ankle: IAutoMovieVector3;
    }[][] = knots.map((knot: walkStanceCourse.IKnot) =>
      knot.stances.map((s: walkStanceCourse.IStance) => ({
        outline: hull(HumanFoot.sole(body, s.side, s.placement).map(flat)),
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
    const sole = (
      k: number,
      j: number,
      turn: number,
      dx: number,
      dz: number,
    ) => {
      const out = soles[k]![j]!;
      if (turn === 0 && dx === 0 && dz === 0) return out;
      const turning: IAutoMovieQuaternion = Quaternion.fromAxisAngle(
        { x: 0, y: 1, z: 0 },
        turn,
      );
      const about = (p: IAutoMovieVector3): IAutoMovieVector3 => {
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
    }; // The part of a stance's sole it bears at a pitch and a turn.
    const region = (
      k: number,
      j: number,
      pitch: number,
      turn: number,
      dx: number,
      dz: number,
    ): IAutoMovieVector3[] => {
      const { outline, ball, heel, ahead } = sole(k, j, turn, dx, dz);
      const rise: number = Math.sin((Math.abs(pitch) * Math.PI) / 180);
      if (rise < 1e-9) return outline;
      return pitch < 0
        ? clip(outline, ball, ahead, -HumanFoot.BEARING / rise)
        : clip(
            outline,
            heel,
            Vector3.scale(ahead, -1),
            -HumanFoot.BEARING / rise,
          );
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
        Math.max(0, -depth(soles[k]![j]!.outline, pressure)),
      );
      const sum: number = far[0]! + far[1]!;
      return sum > 0
        ? [far[1]! / sum, far[0]! / sum]
        : knot.stances.map((): number => 0.5);
    });
    const load = (k: number, j: number): number => shares[k]![j]!;
    // The base the knot's feet bear at a course's pitches and turns.
    const support = (x: Float64Array, k: number): IAutoMovieVector3[] =>
      hull(
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
      read,
      load,
      support,
    };
  }


  /**
   * A convex outline cut by a line: the part where `(q - at) 쨌 normal` is at
   * least `offset`.
   *
   * @param outline The outline, counter-clockwise on the floor.
   * @param at A point of the line's reference, on the floor.
   * @param normal The kept side's unit direction, on the floor.
   * @param offset The kept side's least distance along it, metres.
   * @returns The kept part's corners.
   */
  export function clip(
    outline: readonly IAutoMovieVector3[],
    at: IAutoMovieVector3,
    normal: IAutoMovieVector3,
    offset: number,
  ): IAutoMovieVector3[] {
    const out: IAutoMovieVector3[] = [];
    for (let i: number = 0; i < outline.length; i++) {
      const a: IAutoMovieVector3 = outline[i]!;
      const b: IAutoMovieVector3 = outline[(i + 1) % outline.length]!;
      const da: number = Vector3.dot(Vector3.subtract(a, at), normal) - offset;
      const db: number = Vector3.dot(Vector3.subtract(b, at), normal) - offset;
      if (da >= 0) out.push(a);
      if (da >= 0 !== db >= 0) out.push(Vector3.lerp(a, b, da / (da - db)));
    }
    return out;
  }

  /**
   * The convex hull of points on the floor, counter-clockwise in x and z, by
   * Andrew's monotone chain; the few points of two soles need no more.
   *
   * @param points The points.
   * @returns The hull's corners.
   */
  export function hull(points: readonly IAutoMovieVector3[]): IAutoMovieVector3[] {
    const sorted: IAutoMovieVector3[] = [...points].sort(
      (a: IAutoMovieVector3, b: IAutoMovieVector3): number =>
        a.x - b.x || a.z - b.z,
    );
    if (sorted.length < 3) return sorted;
    const turn = (
      o: IAutoMovieVector3,
      a: IAutoMovieVector3,
      b: IAutoMovieVector3,
    ): number => (a.x - o.x) * (b.z - o.z) - (a.z - o.z) * (b.x - o.x);
    const chain = (order: IAutoMovieVector3[]): IAutoMovieVector3[] => {
      const out: IAutoMovieVector3[] = [];
      for (const p of order) {
        while (
          out.length >= 2 &&
          turn(out[out.length - 2]!, out[out.length - 1]!, p) <= 0
        )
          out.pop();
        out.push(p);
      }
      out.pop();
      return out;
    };
    return [...chain(sorted), ...chain([...sorted].reverse())];
  }

  /**
   * How deep inside a convex outline a point lies, metres, negative outside:
   * its distance to the nearest edge, signed.
   *
   * @param hull The outline, counter-clockwise on the floor.
   * @param point The point.
   * @returns Metres.
   */
  export function depth(
    hull: readonly IAutoMovieVector3[],
    point: IAutoMovieVector3,
  ): number {
    let inside: boolean = hull.length >= 3;
    let nearest: number = Infinity;
    for (let i: number = 0; i < hull.length; i++) {
      const a: IAutoMovieVector3 = hull[i]!;
      const b: IAutoMovieVector3 = hull[(i + 1) % hull.length]!;
      const ex: number = b.x - a.x;
      const ez: number = b.z - a.z;
      const px: number = point.x - a.x;
      const pz: number = point.z - a.z;
      // Counter-clockwise in x-z: the inside lies where the cross is positive.
      if (ex * pz - ez * px < 0) inside = false;
      const span: number = ex * ex + ez * ez;
      const u: number =
        span > 0 ? Math.min(1, Math.max(0, (px * ex + pz * ez) / span)) : 0;
      nearest = Math.min(nearest, Math.hypot(px - u * ex, pz - u * ez));
    }
    return inside ? nearest : -nearest;
  }

  /**
   * A placement slid on the floor.
   *
   * @param foot The placement.
   * @param dx The slide along x, metres.
   * @param dz The slide along z, metres.
   * @returns The slid placement; the same one for no slide.
   */
  export function slid(
    foot: HumanFoot.IPlacement,
    dx: number,
    dz: number,
  ): HumanFoot.IPlacement {
    return dx === 0 && dz === 0
      ? foot
      : {
          ankle: {
            x: foot.ankle.x + dx,
            y: foot.ankle.y,
            z: foot.ankle.z + dz,
          },
          rotation: foot.rotation,
        };
  }
}
