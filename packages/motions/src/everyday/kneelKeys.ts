import { Vector3 } from "@automovie/engine";
import type {
  IAutoMovieHumanLimbGoal,
  IAutoMovieMotionHumanBody,
  IAutoMovieMotionHumanFoot,
  IAutoMovieMotionHumanPosture,
  IAutoMovieVector3,
} from "@automovie/interface";

import { AutoMovieMotionHumanRange } from "../compose/AutoMovieMotionHumanRange";
import { HumanFoot } from "../posture/HumanFoot";
import { HumanFrame } from "../posture/HumanFrame";
import { hipJoints } from "../posture/hipJoints";
import { kneelPlace } from "./kneelPlace";
import { kneelTrailingFoot } from "./kneelTrailingFoot";

/**
 * The key states of a kneel, solved from the body: standing, the kneeling
 * leg stepped back, on one knee, on both knees and sitting back on the heels.
 *
 * Every place follows from the leg's two lengths and the knee's radius over
 * the floor. On one knee the kneeling knee touches the floor straight under
 * its hip joint with the thigh upright, and the front foot stays planted with
 * its shank upright, so the hips stand behind the front ankle by what the
 * thigh's length leaves after the height difference. A kneeling foot is
 * tucked: it stands on its toes straight behind its knee, heading the way the
 * body faces so the leg stays in one plane, as far back as puts the ankle a
 * shank from the knee and as steeply as puts the ankle at its dorsiflexion
 * range. Where that pitch is more than the toes extend, the toes hold their
 * range and the foot's toe joint rises by what keeps the toes' tip on the
 * floor. Sitting back, each thigh turns back about its knee until the knee
 * flexes `SIT` degrees, the high-flexion band measured in kneeling (141.6
 * degrees, Acker et al. 2011, J Arthroplasty 26:319; up to 157 +- 6 in deep
 * postures, Hemmerich et al. 2006, J Orthop Res 24:770).
 *
 * @evidence contracts/development/common.md#meaningful-documentation States each key state, how its places follow from the body and the sources of the sitting flexion.
 * @evidence contracts/development/design.md#principled-representation Key states as a root and two feet, each foot a floor point, a heading, a pitch and its toes' angle.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Owns the kneel's geometry; the kneel law and its phase preparation read the keys, the crawl laws read `tucked` and `SIT`.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No world coordinate is typed; every place is read from the body's measure and its range table.
 */
export namespace kneelKeys {
  /** Knee flexion sitting back on the heels, degrees (Acker et al. 2011; inside the range table's 150). */
  export const SIT: number = 145;

  /** How far a toe joint may move between keys and still stand, metres: a staying foot differs by round-off, a step by centimetres. */
  const STILL: number = 1e-4;

  /**
   * Whether a foot keeps its floor point from one key to the next.
   *
   * @param from The foot in the first key.
   * @param to The foot in the second key.
   * @returns Whether the toe joint stays within `STILL` of its place.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the test and its tolerance.
   * @evidence contracts/development/implementation.md#principled-implementation The Euclidean distance of the two toe joints against a tolerance between round-off and a step.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure One distance and one comparison, shared by the foot courses and the plant windows.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The tolerance is named and derived; nothing is special-cased.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#reuse-equivalent-work A pure function of its inputs.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function still(from: IFoot, to: IFoot): boolean {
    return Vector3.length(Vector3.subtract(from.at, to.at)) <= STILL;
  }

  /** A range-table limit the kneel needs, signed degrees; throws when the table has none. */
  function required(
    bone: Parameters<typeof AutoMovieMotionHumanRange.limit>[0],
    motion: Parameters<typeof AutoMovieMotionHumanRange.limit>[1],
  ): number {
    const end: number | null = AutoMovieMotionHumanRange.limit(bone, motion);
    if (end === null) throw new Error(`${bone} has no ${motion} limit`);
    return end;
  }

  /**
   * A foot's place on the floor.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning and its unit.
   * @evidence contracts/development/design.md#principled-representation The toe joint's point, a heading, a pitch and the toes' angle define the foot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by the kneel law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The ankle is derived by `HumanFoot.pivot`, not stored.
   */
  export interface IFoot {
    /** The toes' joint, world metres. */
    at: IAutoMovieVector3;

    /** Degrees about +Y. */
    heading: number;

    /** Degrees; negative with the heel up. */
    pitch: number;

    /** The toes' extension, degrees. */
    toes: number;

    /** Whether the foot bears on the floor. */
    planted: boolean;
  }

  /**
   * A key state: the root and both feet.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation A root and a foot per side.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Two members, both read by the kneel law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No joint angle is stored; the legs are solved from the feet.
   */
  export interface IKey {
    /** The root, world metres. */
    root: IAutoMovieVector3;

    /** The feet. */
    feet: Record<"left" | "right", IFoot>;
  }

  /**
   * The solved key states and the frame they were solved in.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Each member states its meaning.
   * @evidence contracts/development/design.md#principled-representation The keys in order from standing down, with the frame and the sitting pivot.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Five members, all read by the kneel law.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts The stepped key carries the kneeling root; its height on the way is the law's, found from the legs' reach.
   */
  export interface IKeys {
    /** Standing, stepped back, on one knee, then on both knees and sitting back when asked. */
    keys: IKey[];

    /** The heading's unit vector. */
    forward: IAutoMovieVector3;

    /** The hip joints from the root. */
    rest: Record<"left" | "right", IAutoMovieVector3>;

    /** The root's place about which it turns as the hips sit back: the first knee's, as the root. */
    pivot: IAutoMovieVector3;

    /** The standing leg's length from hip joint to ankle as a share of the thigh and the shank. */
    extension: number;
  }

  /**
   * A foot tucked behind a knee that rests on the floor: on its toes straight
   * behind the knee, the ankle at its dorsiflexion range.
   *
   * @param body The body.
   * @param side The leg.
   * @param kneeAt The knee joint, world metres.
   * @param yaw The heading the knee points along, degrees about +Y.
   * @param floor The height of the toes' joint when the foot stands flat, world metres.
   * @returns The foot.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the posture, each input and its unit; the namespace gives the toes' rule.
   * @evidence contracts/development/implementation.md#principled-implementation The toes' joint is found on the floor behind the knee where the ankle is a shank from the knee, and the foot's pitch is the one that leaves the ankle at its dorsiflexion range against the shank's slope.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A foot from a distance and a pitch, a bisection for the distance and a fixed-point loop for the pitch.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The ranges are read from the range table; past the toes' range the toes' joint rises instead of the toes overextending.
   * @evidence contracts/development/implementation.md#efficient-algorithms Six fixed-point pitch updates and the final placement retain all seven 40-step distance bisections. Fixed rotation/socket/toe height prepare once per pitch; each distance trial emits only its observed point instead of a discarded full foot record.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reuses HumanFoot.prepareAt for each fixed-pitch ankle transform; callers solve a foot once and translate it with its knee.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function tucked(
    body: IAutoMovieMotionHumanBody,
    side: "left" | "right",
    kneeAt: IAutoMovieVector3,
    yaw: number,
    floor: number,
  ): IFoot {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const forward: IAutoMovieVector3 = HumanFrame.forward(yaw);
    const dorsiflexion: number = required(`${side}Foot`, "flexion");
    const extension: number = required(`${side}Toes`, "flexion");
    const toe: number = Vector3.length(
      Vector3.subtract(
        HumanFoot.offset(body, side, "toe"),
        HumanFoot.offset(body, side, "mtp"),
      ),
    );
    const atPitch: (pitch: number) => (d: number) => IAutoMovieVector3 = (
      pitch: number,
    ): ((d: number) => IAutoMovieVector3) => {
      const height: number =
        floor +
        toe * Math.sin((Math.max(0, pitch - extension) * Math.PI) / 180);
      return (d: number): IAutoMovieVector3 => ({
        ...Vector3.subtract(kneeAt, Vector3.scale(forward, d)),
        y: height,
      });
    };
    const foot: (d: number, pitch: number) => IFoot = (
      d: number,
      pitch: number,
    ): IFoot => ({
      at: atPitch(pitch)(d),
      heading: yaw,
      pitch: -pitch,
      toes: Math.min(extension, pitch),
      planted: true,
    });
    const ankle: (at: IFoot) => IAutoMovieVector3 = (at: IFoot): IAutoMovieVector3 =>
      HumanFoot.pivot(body, side, "mtp", at.at, at.heading, at.pitch).ankle;
    const back: (pitch: number) => number = (pitch: number): number => {
      const at: (d: number) => IAutoMovieVector3 = atPitch(pitch);
      const pivot: ReturnType<typeof HumanFoot.prepareAt> = HumanFoot.prepareAt(
        body,
        side,
        "mtp",
        yaw,
        -pitch,
      );
      // Forty halvings narrow a bracket under a metre to below a picometre,
      // past a double's resolution of a coordinate of a metre.
      let lo: number = 0;
      let hi: number = m.shank + m.footLength;
      for (let i: number = 0; i < 40; i++) {
        const mid: number = (lo + hi) / 2;
        if (
          Vector3.length(Vector3.subtract(pivot(at(mid)).ankle, kneeAt)) <
          m.shank
        )
          lo = mid;
        else hi = mid;
      }
      return (lo + hi) / 2;
    };
    // Six substitutions of the pitch for the slope it gives the shank. The
    // map contracts: a degree of pitch moves the ankle by the toe-joint-to-
    // ankle lever times a radian's share, about 0.12 m / 0.43 m of the shank's
    // slope, so each round shrinks the error to about 0.3 of the last and six
    // rounds take a 30 degree start below 0.03 degrees.
    let pitch: number = 90 - dorsiflexion;
    for (let i: number = 0; i < 6; i++) {
      const rise: number = ankle(foot(back(pitch), pitch)).y - kneeAt.y;
      pitch =
        90 -
        dorsiflexion +
        (Math.asin(Math.max(-1, Math.min(1, rise / m.shank))) * 180) / Math.PI;
    }
    return foot(back(pitch), pitch);
  }

  /**
   * A root's circular path about a pivot from one place to another, as the
   * hips turn about the knees when the body sits back on its heels.
   *
   * @param pivot The pivot, world metres.
   * @param a The root at progress 0.
   * @param b The root at progress 1.
   * @returns The root at a progress in [0, 1].
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the turn, each input in world metres and the progress the reader takes.
   * @evidence contracts/development/implementation.md#principled-implementation A spherical interpolation of the two arms from the pivot, so the root keeps its distance from the knees when the arms are equally long, as the kneel's thigh-long arms are.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure The two arms, their angle and its sine are computed once; the reader forms one weighted sum per progress.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Arms closer than a millionth of a radian return the first root instead of dividing by a vanishing sine.
   * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per phase to prepare and two sines per reading.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work The endpoints and pivot are fixed for a phase, so their arms and angle are shared by every reading of it.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The reader holds two arm vectors, the pivot, the first root and two scalars until its plan is released.
   */
  export function prepareTurn(
    pivot: IAutoMovieVector3,
    a: IAutoMovieVector3,
    b: IAutoMovieVector3,
  ): (u: number) => IAutoMovieVector3 {
    const from: IAutoMovieVector3 = Vector3.subtract(a, pivot);
    const to: IAutoMovieVector3 = Vector3.subtract(b, pivot);
    const angle: number = Math.acos(
      Math.max(
        -1,
        Math.min(
          1,
          Vector3.dot(from, to) / (Vector3.length(from) * Vector3.length(to)),
        ),
      ),
    );
    if (angle < 1e-6) return (_u: number): IAutoMovieVector3 => a;
    const sine: number = Math.sin(angle);
    return (u: number): IAutoMovieVector3 =>
      Vector3.add(
        pivot,
        Vector3.add(
          Vector3.scale(from, Math.sin((1 - u) * angle) / sine),
          Vector3.scale(to, Math.sin(u * angle) / sine),
        ),
      );
  }

  /** How far short of the hip's extension range a thigh reaching behind is kept, degrees (provisional). */
  const SPARE: number = 5;

  /** The width over which `lean`'s corner at zero is rounded, degrees (provisional). */
  const ROUND: number = 2;

  /**
   * The forward tilt of the pelvis that keeps the legs inside the hips'
   * extension range while a foot stands far behind: people lean the trunk
   * forward as they step back into a lunge, because the hip extends only
   * about 30 degrees against the pelvis.
   *
   * @param body The body.
   * @param hips The hip joints, world metres.
   * @param ankles The ankles, world metres.
   * @param forward The heading's unit vector.
   * @returns Degrees, never negative.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the tilt, why people make it, each input and the result's unit.
   * @evidence contracts/development/implementation.md#principled-implementation The thigh's slope behind the vertical is the hip-to-ankle line's slope less the angle the two-bone leg puts between that line and the thigh; the tilt is what that slope exceeds the range less `SPARE` by, the greater of the two legs.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure A law of cosines per leg and one rounded maximum with zero.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The range is read from the range table; the corner at zero is rounded over 2 degrees so the tilt starts without a jump in its speed.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Reads `AutoMovieMotionHumanRange.limit`, as `tucked` does.
   * @evidenceExclude contracts/development/implementation.md#efficient-algorithms Constant work with no algorithm to choose.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function lean(
    body: IAutoMovieMotionHumanBody,
    hips: Record<"left" | "right", IAutoMovieVector3>,
    ankles: Record<"left" | "right", IAutoMovieVector3>,
    forward: IAutoMovieVector3,
  ): number {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    let most: number = -Infinity;
    for (const side of ["left", "right"] as const) {
      const range: number = -required(`${side}UpperLeg`, "extension");
      const to: IAutoMovieVector3 = Vector3.subtract(ankles[side], hips[side]);
      const length: number = Math.max(
        1e-6,
        Math.min(m.thigh + m.shank, Vector3.length(to)),
      );
      const line: number = Math.atan2(-Vector3.dot(to, forward), -to.y);
      const inside: number = Math.acos(
        Math.max(
          -1,
          Math.min(
            1,
            (m.thigh * m.thigh + length * length - m.shank * m.shank) /
              (2 * m.thigh * length),
          ),
        ),
      );
      most = Math.max(
        most,
        ((line - inside) * 180) / Math.PI - (range - SPARE),
      );
    }
    // A smooth maximum with zero: (x + sqrt(x^2 + w^2)) / 2 leaves x past the
    // corner and reaches w / 2 at it.
    return (most + Math.sqrt(most * most + ROUND * ROUND)) / 2;
  }

  /**
   * Solve the key states.
   *
   * @param body The body.
   * @param standing The standing posture the kneel starts from.
   * @param kind On one knee, on both knees or sitting back.
   * @param k The knee that goes down first.
   * @param at The floor point that knee comes down on, world metres; the reverse lunge's when absent.
   * @returns The key states.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States the inputs and the result; the namespace gives the geometry.
   * @evidence contracts/development/implementation.md#principled-implementation Each place is solved from the thigh, the shank, the knee's radius and the ankle's and toes' ranges.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Standing feet, the kneeling height, the tucked feet, the sitting root, then the key list.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts The knee's radius is the shank collider's, marked provisional in the namespace of the law.
   * @evidence contracts/development/implementation.md#efficient-algorithms Solves one tucked foot for a one-knee route, two for both-knee routes, each retaining seven 40-step bisections; sitting-pivot geometry is demanded only by sitBack.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Standing placements are read once per side and the first knee's tucked foot serves every key after the step.
   * @evidenceExclude contracts/development/implementation.md#bound-retention-and-release-resources A pure function that retains nothing.
   */
  export function solve(
    body: IAutoMovieMotionHumanBody,
    standing: IAutoMovieMotionHumanPosture,
    kind: "one" | "both" | "sitBack",
    k: "left" | "right",
    at?: IAutoMovieVector3,
  ): IKeys {
    const m: IAutoMovieMotionHumanBody["measure"] = body.measure;
    const f: "left" | "right" = k === "left" ? "right" : "left";
    const yaw: number = standing.yaw;
    const up: IAutoMovieVector3 = { x: 0, y: 1, z: 0 };
    const forward: IAutoMovieVector3 = HumanFrame.forward(yaw);

    // Standing feet as toes' joints on the floor with their headings.
    const flat = (
      side: "left" | "right",
    ): IAutoMovieMotionHumanFoot.IPlacement => {
      const goal: IAutoMovieHumanLimbGoal = standing.limbs[`${side}Leg`]!;
      return {
        ankle: goal.point,
        rotation: goal.rotation ?? HumanFrame.turn(yaw),
      };
    };
    const standingFeet: Record<"left" | "right", IAutoMovieMotionHumanFoot.IPlacement> = {
      left: flat("left"),
      right: flat("right"),
    };
    const stood = (side: "left" | "right"): IFoot => ({
      at: HumanFoot.point(body, side, "mtp", standingFeet[side]),
      heading: HumanFoot.heading(standingFeet[side].rotation),
      pitch: 0,
      toes: 0,
      planted: true,
    });
    const foot0: Record<"left" | "right", IFoot> = {
      left: stood("left"),
      right: stood("right"),
    };
    const ankleOf: (side: "left" | "right", foot: IFoot) => IAutoMovieVector3 = (
      side: "left" | "right",
      foot: IFoot,
    ): IAutoMovieVector3 =>
      HumanFoot.pivot(body, side, "mtp", foot.at, foot.heading, foot.pitch)
        .ankle;

    // The kneeling height: the knee joint a shank radius over the floor, the
    // hip joint a thigh above it.
    const knee: number = m.shankRadius;
    const hipY: number = knee + m.thigh;
    const frontAnkle: IAutoMovieVector3 = standingFeet[f].ankle;
    const above: number = hipY - (frontAnkle.y + m.shank);
    const behind: number = Math.sqrt(
      Math.max(0, m.thigh * m.thigh - above * above),
    );
    const rest: Record<"left" | "right", IAutoMovieVector3> = hipJoints(
      body,
      { x: 0, y: 0, z: 0 },
      HumanFrame.turn(yaw),
    );
    const standingHips: Record<"left" | "right", IAutoMovieVector3> =
      hipJoints(body, standing.root, HumanFrame.turn(yaw));
    const hipK: IAutoMovieVector3 = kneelPlace({
      body, hip: standingHips[k], front: frontAnkle, forward, behind, height: hipY,
      across: Vector3.subtract(rest[f], rest[k]), ...(at === undefined ? {} : { at }),
    });
    const rootKneel: IAutoMovieVector3 = Vector3.subtract(hipK, rest[k]);

    const kneeK: IAutoMovieVector3 = Vector3.subtract(
      hipK,
      Vector3.scale(up, m.thigh),
    );
    const backFoot: IFoot = tucked(body, k, kneeK, yaw, foot0[k].at.y);

    const feet: (front: IFoot) => IKey["feet"] = (front: IFoot): IKey["feet"] =>
      f === "left" ? { left: front, right: backFoot } : { left: backFoot, right: front };
    // A front foot the knee came down ahead of trails it on its toes.
    const trail: IFoot = kneelTrailingFoot(body, f, Vector3.add(rootKneel, rest[f]), foot0[f], forward);
    const keys: IKey[] = [
      { root: standing.root, feet: foot0 },
      { root: rootKneel, feet: feet(trail) },
      { root: rootKneel, feet: feet(trail) },
    ];
    if (kind !== "one") {
      const secondFoot: IFoot = tucked(
        body,
        f,
        { ...Vector3.add(rootKneel, rest[f]), y: knee },
        yaw,
        foot0[f].at.y,
      );
      keys.push({ root: rootKneel, feet: feet(secondFoot) });
      if (kind === "sitBack") {
        // Only sitting back turns the thigh about the knee to SIT degrees.
        const shankDir: IAutoMovieVector3 = Vector3.normalize(
          Vector3.subtract(ankleOf(k, backFoot), kneeK),
        );
        const across: IAutoMovieVector3 = Vector3.normalize(
          Vector3.cross(shankDir, up),
        );
        const normal: IAutoMovieVector3 = Vector3.normalize(
          Vector3.cross(across, shankDir),
        );
        const open: number = ((180 - SIT) * Math.PI) / 180;
        const hipSit: IAutoMovieVector3 = Vector3.add(
          kneeK,
          Vector3.scale(
            Vector3.add(
              Vector3.scale(shankDir, Math.cos(open)),
              Vector3.scale(normal, Math.sin(open)),
            ),
            m.thigh,
          ),
        );
        keys.push({
          root: Vector3.subtract(hipSit, rest[k]),
          feet: feet(secondFoot),
        });
      }
    }
    return {
      keys,
      forward,
      rest,
      pivot: Vector3.subtract(kneeK, rest[k]),
      extension: Math.min(
        1,
        Vector3.length(Vector3.subtract(frontAnkle, standingHips[f])) /
          (m.thigh + m.shank),
      ),
    };
  }
}
