import { AutoMovieEngineQuaternion, AutoMovieEngineVector3 } from "@automovie/engine";
import type {
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { AutoMovieArchetype } from "../AutoMovieArchetype";
import { AutoMovieArchetypeFrame } from "../AutoMovieArchetypeFrame";
import { AutoMovieArchetypeRefusal } from "../AutoMovieArchetypeRefusal";
import { AutoMovieArchetypeUnits } from "../AutoMovieArchetypeUnits";

/*
 * Declared wheel support and exact vertical coupling geometry for planar
 * towing.
 */
export namespace ArchetypeTowing {
  /*
   * Front steering pivot and its declared yaw articulation.
   */
  export interface IFront<Id extends string> {
    /*
     * Model-space front axle centre/pivot, metres.
     */
    pivot: IAutoMovieVector3;
    /*
     * Source steering articulation.
     */
    turn: Id;
  }

  /*
   * Producer-declared support with one pitching axle or two grounded axles.
   */
  export type Support<Id extends string> =
    | ISingleAxleSupport
    | IFixedGroundSupport<Id>;

  /*
   * One authored ground plane under a horizontal world point: a point on it and
   * its upward unit normal.
   */
  export interface IPlane {
    /*
     * A point on the plane, world metres.
     */
    point: IAutoMovieVector3;
    /*
     * Its upward unit normal.
     */
    normal: IAutoMovieVector3;
  }

  /*
   * The authored ground plane under a horizontal world point, for a single axle
   * drawn over sloped ground.
   */
  export type Ground = (x: number, z: number) => IPlane;

  /*
   * Prepared geometric operations read by the existing planar heading
   * integrator.
   */
  export interface IPrepared<Id extends string> {
    /*
     * Front steering, or null for one planar link.
     */
    front: IFront<Id> | null;
    /*
     * Rear-to-front longitudinal separation, metres; zero for one link.
     */
    body: number;
    /*
     * Horizontal reach and model-X pitch at a world hitch/ground height.
     */
    height: (hitch: number, ground: number) => { reach: number; pitch: number };
    /*
     * The ground datum under the axle for a hitch and a heading: the course
     * datum without declared terrain, else the height that puts the wheel on
     * the authored plane under the axle.
     */
    ground: (hitch: IAutoMovieVector3, theta: number, datum: number) => number;
    /*
     * Place the supported vehicle and return front/drawbar travels.
     */
    pose: (
      hitch: IAutoMovieVector3,
      ground: number,
      theta: number,
      phi: number,
    ) => {
      placement: IAutoMovieTransform;
      travels: Partial<Record<Id, number>>;
    };
  }

  /*
   * What `prepare` reads of a towed ride's options: explicit axle and front
   * data, producer support and optional authored ground.
   */
  export interface IOptions<Id extends string> {
    /*
     * Explicit model-space axle point, metres.
     */
    axle?: IAutoMovieVector3;
    /*
     * Explicit front steering pivot and articulation.
     */
    front?: IFront<Id>;
    /*
     * Producer-read support.
     */
    support?: Support<Id>;
    /*
     * Authored ground under a single axle; the course datum when absent.
     */
    ground?: Ground;
  }

  /*
   * Admit one producer-declared towing geometry without inferring a vehicle
   * kind.
   * Parameter trailer: Neutral source, with its own coupling/articulation frames.
   * Parameter coupling: Source coupling contact id.
   * Parameter options: Existing explicit axle/front data plus optional support, and
   * optional authored ground under a single axle.
   * Returns: Shared height/projection/placement operations for this source.
   * For contradictory geometry, invalid
   * points/axes, unsupported heights or an unreachable vertical hitch.
   */
  export function prepare<Id extends string, D extends string>(
    trailer: AutoMovieArchetype<Id, D>,
    coupling: Id,
    options: IOptions<Id>,
  ): IPrepared<Id> {
    const support: Support<Id> | undefined = options.support;
    const terrain: Ground | undefined = options.ground;
    if (terrain !== undefined && support?.kind !== "singleAxle")
      refuse(
        "ground",
        "Authored ground under the axle needs declared single-axle support",
      );
    if (support === null || options.axle === null || options.front === null)
      refuse("support", "Towing geometry declarations cannot be null");
    if (
      support !== undefined &&
      support.kind !== "singleAxle" &&
      support.kind !== "fixedGround"
    )
      refuse(
        "support",
        "Towing support must declare a supported closed geometry kind",
      );
    if (
      support !== undefined &&
      (support.axle === undefined || support.axle === null)
    )
      refuse("support", "Producer support must declare its actual axle point");
    if (
      support?.kind === "fixedGround" &&
      (support.front === undefined || support.front === null)
    )
      refuse(
        "support",
        "Fixed ground support must declare its actual front axle",
      );
    const axle: IAutoMovieVector3 = {
      ...(support?.axle ?? options.axle ?? { x: 0, y: 0, z: 0 }),
    };
    const declaredFront: IFront<Id> | undefined =
      support?.kind === "fixedGround" ? support.front : undefined;
    if (
      support !== undefined &&
      options.axle !== undefined &&
      !same(axle, options.axle)
    )
      refuse("axle", "Explicit axle and producer support disagree");
    if (
      declaredFront !== undefined &&
      options.front !== undefined &&
      (declaredFront.turn !== options.front.turn ||
        !same(declaredFront.pivot, options.front.pivot))
    )
      refuse("front", "Explicit front axle and producer support disagree");
    if (support?.kind === "singleAxle" && options.front !== undefined)
      refuse(
        "support",
        "A single-axle support cannot also declare a front axle",
      );
    const selected: IFront<Id> | undefined = options.front ?? declaredFront;
    const front: IFront<Id> | null =
      selected === undefined
        ? null
        : { pivot: { ...selected.pivot }, turn: selected.turn };
    const local: IAutoMovieVector3 = {
      ...trailer.affordance(coupling).frame.translation,
    };
    const pivot: IAutoMovieVector3 = front?.pivot ?? axle;
    const scale: number = Math.max(
      ...[axle, pivot, local].flatMap((p: IAutoMovieVector3): number[] => [
        Math.abs(p.x),
        Math.abs(p.y),
        Math.abs(p.z),
      ]),
    );
    if (
      Math.abs(local.x - pivot.x) > 64 * Number.EPSILON * scale ||
      (front !== null &&
        Math.abs(pivot.x - axle.x) > 64 * Number.EPSILON * scale)
    )
      refuse(
        "coupling",
        "Planar towing requires coupling and support on one centreline",
      );
    const qy: number = local.y - pivot.y;
    const qz: number = local.z - pivot.z;
    const forward: 1 | -1 = support?.kind === "singleAxle" && qz < 0 ? -1 : 1;
    if (!(forward * qz > 0))
      refuse(
        "coupling",
        "The coupling must lie ahead along its declared towing direction",
      );
    const body: number = front === null ? 0 : pivot.z - axle.z;
    if (front !== null && !(body > 0))
      refuse("pivot", "The front axle must lie ahead of the rear axle");
    if (
      support !== undefined &&
      !(axle.y > 0 && (front === null || pivot.y > 0))
    )
      refuse(
        "support",
        "Actual wheel centres require positive neutral ground clearance",
      );
    const pitchId: Id | undefined =
      support?.kind === "fixedGround" ? support.pitch : undefined;
    if (front !== null) {
      const steering: ReturnType<typeof trailer.affordance> =
        trailer.affordance(front.turn);
      const axis: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
        steering.frame,
        "y",
      );
      if (
        steering.kind !== "wheel" ||
        !same(steering.frame.translation, pivot) ||
        Math.abs(axis.x) > 64 * Number.EPSILON ||
        Math.abs(axis.z) > 64 * Number.EPSILON ||
        Math.abs(axis.y - 1) > 64 * Number.EPSILON
      )
        refuse(
          "front",
          "Front steering must be the actual upright wheel articulation at the declared pivot",
        );
    }
    let pitchSign: number = 1;
    if (pitchId !== undefined) {
      const joint: ReturnType<typeof trailer.affordance> =
        trailer.affordance(pitchId);
      const axis: IAutoMovieVector3 = AutoMovieArchetypeFrame.axis(
        joint.frame,
        "y",
      );
      if (
        joint.kind !== "hinge" ||
        trailer.affordance(coupling).rides !== pitchId ||
        !same(joint.frame.translation, pivot) ||
        Math.abs(axis.y) > 64 * Number.EPSILON ||
        Math.abs(axis.z) > 64 * Number.EPSILON ||
        Math.abs(Math.abs(axis.x) - 1) > 64 * Number.EPSILON ||
        trailer.travel(pitchId) !== 0
      )
        refuse(
          "support",
          "Drawbar pitch must be an actual neutral sagittal hinge at the front pivot",
        );
      pitchSign = Math.sign(axis.x);
    }
    const radius: number = Math.hypot(qy, qz);
    if (!(radius > 0))
      refuse(
        "support",
        "The actual coupling lever must have represented positive length",
      );
    const free: boolean =
      support?.kind === "singleAxle" || pitchId !== undefined;

    /*
     * One lever gives both the heading projection and the exact supported pose.
     */
    function height(
      hitch: number,
      ground: number,
    ): { reach: number; pitch: number } {
      if (!free) {
        const expected: number = ground + local.y;
        if (
          Math.abs(hitch - expected) >
          64 *
            Number.EPSILON *
            Math.max(scale, Math.abs(hitch), Math.abs(expected))
        )
          refuse(
            "support",
            "A level support cannot change coupling height; supply actual axle support or a declared drawbar hinge",
          );
        return { reach: qz, pitch: 0 };
      }
      const vertical: number = hitch - ground - pivot.y;
      const ratio: number = vertical / radius;
      if (!(radius > 0 && Math.abs(ratio) < 1))
        refuse(
          "support",
          "The hitch height has no strictly forward projection within the actual rigid lever",
        );
      const reach: number = radius * Math.sqrt((1 - ratio) * (1 + ratio));
      if (!(reach > 0))
        refuse(
          "support",
          "The actual towing lever has no represented horizontal reach",
        );
      const angle: number =
        Math.atan2(qy, qz) - Math.atan2(vertical, forward * reach);
      return { reach, pitch: Math.atan2(Math.sin(angle), Math.cos(angle)) };
    }
    /*
     * The datum that seats the wheel on the authored plane under the solved
     * axle.
     */
    function ground(
      hitch: IAutoMovieVector3,
      theta: number,
      datum: number,
    ): number {
      if (terrain === undefined) return datum;
      const sin: number = Math.sin(theta);
      const cos: number = Math.cos(theta);
      let reach: number = Math.abs(qz);
      let plane: IPlane = terrain(hitch.x - sin * reach, hitch.z - cos * reach);
      for (let attempt: number = 0; attempt < 4; attempt++) {
        const { point, normal } = plane;
        if (!(normal.y > 0))
          refuse("ground", "The ground under the axle must face up");
        if (Math.abs(normal.x * cos - normal.z * sin) > 64 * Number.EPSILON)
          refuse(
            "ground",
            "A single axle cannot stand level across ground that slopes along it",
          );
        const base: number =
          point.y -
          (normal.x * (hitch.x - point.x) + normal.z * (hitch.z - point.z)) /
            normal.y;
        const slope: number = -(normal.x * sin + normal.z * cos) / normal.y;
        const centre: number = pivot.y / normal.y;
        const k: number = hitch.y - base - centre;
        const a: number = 1 + slope * slope;
        const disc: number =
          k * k * slope * slope - a * (k * k - radius * radius);
        if (!(disc >= 0))
          refuse(
            "ground",
            "The hitch height has no reach within the actual lever over this ground",
          );
        reach = (-k * slope + Math.sqrt(disc)) / a;
        if (!(reach > 0))
          refuse(
            "ground",
            "The actual lever has no forward reach over this ground",
          );
        const solved: number = base - slope * reach + centre - pivot.y;
        const next: IPlane = terrain(
          hitch.x - sin * reach,
          hitch.z - cos * reach,
        );
        if (
          next.normal.x === normal.x &&
          next.normal.y === normal.y &&
          next.normal.z === normal.z &&
          Math.abs(
            (next.point.y - point.y) * normal.y +
              normal.x * (next.point.x - point.x) +
              normal.z * (next.point.z - point.z),
          ) <=
            64 *
              Number.EPSILON *
              Math.max(1, Math.abs(point.y), Math.abs(next.point.y))
        )
          return solved;
        plane = next;
      }
      return refuse(
        "ground",
        "The axle's ground plane does not settle; author a plane under the whole wheel track",
      );
    }
    return {
      front:
        front === null ? null : { pivot: { ...front.pivot }, turn: front.turn },
      body,
      height,
      ground,
      pose: (
        hitch: IAutoMovieVector3,
        ground: number,
        theta: number,
        phi: number,
      ): {
        placement: IAutoMovieTransform;
        travels: Partial<Record<Id, number>>;
      } => {
        const solved: { reach: number; pitch: number } = height(
          hitch.y,
          ground,
        );
        const travels: Partial<Record<Id, number>> = {};
        if (front !== null)
          travels[front.turn] = (theta - phi) / AutoMovieArchetypeUnits.DEGREE;
        if (pitchId !== undefined)
          travels[pitchId] =
            solved.pitch / (pitchSign * AutoMovieArchetypeUnits.DEGREE);
        const yaw: number =
          front === null ? theta + (forward < 0 ? Math.PI : 0) : phi;
        const rotation: IAutoMovieTransform["rotation"] = AutoMovieEngineQuaternion.multiply(
          AutoMovieEngineQuaternion.fromAxisAngle(
            { x: 0, y: 1, z: 0 },
            yaw / AutoMovieArchetypeUnits.DEGREE,
          ),
          AutoMovieEngineQuaternion.fromAxisAngle(
            { x: 1, y: 0, z: 0 },
            front === null ? solved.pitch / AutoMovieArchetypeUnits.DEGREE : 0,
          ),
        );
        const world: IAutoMovieVector3 = {
          x: hitch.x - Math.sin(theta) * solved.reach,
          y: ground + pivot.y,
          z: hitch.z - Math.cos(theta) * solved.reach,
        };
        return {
          placement: {
            translation: AutoMovieEngineVector3.subtract(
              world,
              AutoMovieEngineQuaternion.rotateVector(rotation, pivot),
            ),
            rotation,
            scale: { ...AutoMovieArchetypeFrame.UNIT },
          },
          travels,
        };
      },
    };

    /*
     * Coordinate contradictions are refused, rather than choosing one input
     * silently.
     */
    function same(
      a: IAutoMovieVector3 | null | undefined,
      b: IAutoMovieVector3 | null | undefined,
    ): boolean {
      return (
        a !== null &&
        a !== undefined &&
        b !== null &&
        b !== undefined &&
        a.x === b.x &&
        a.y === b.y &&
        a.z === b.z
      );
    }

    /*
     * A missing declared freedom is an actionable model/support refusal.
     */
    function refuse(axis: string, reason: string): never {
      throw new AutoMovieArchetypeRefusal({
        kind: "parameter",
        archetype: trailer.archetype,
        axis,
        value: coupling,
        feasible: null,
        reason,
        fix: "Supply compatible producer towing geometry and a reachable hitch without lifting its grounded supports.",
      });
    }
  }

  /*
   * Refuse a front axle whose required steering exceeds its lock.
   */
  export function checkSteering<Id extends string, D extends string>(
    trailer: AutoMovieArchetype<Id, D>,
    front: IFront<Id> | null,
    heading: IAutoMovieIntegrateMotionTrajectory.ITrajectory,
  ): void {
    // A front axle turned past its lock at any knot refuses the course, naming the most it needed.
    if (front !== null) {
      const lock: number = trailer.affordance(front.turn).travel ?? 0;
      let most: number = 0;
      for (let k: number = 0; k < heading.knots; k++) {
        const x: readonly number[] = heading.at(
          Math.min(heading.t0 + k * heading.h, heading.t1),
        ).x;
        most = Math.max(
          most,
          Math.abs((x[0]! - x[1]!) / AutoMovieArchetypeUnits.DEGREE),
        );
      }
      if (most > lock)
        throw new AutoMovieArchetypeRefusal({
          kind: "parameter",
          archetype: trailer.archetype,
          axis: "front",
          value: most,
          feasible: {
            kind: "range",
            minimum: 0,
            maximum: lock,
            unit: "degrees",
          },
          reason: `the leader's path turns the front axle ${most} degrees, past its ${lock} degree lock`,
          fix: "lead the trailer on wider turns",
        });
    }
  }

  /*
   * A support that pitches freely around one axle.
   */
  interface ISingleAxleSupport {
    kind: "singleAxle";
    axle: IAutoMovieVector3;
  }

  interface IFixedGroundSupport<Id extends string> {
    kind: "fixedGround";
    axle: IAutoMovieVector3;
    front: IFront<Id>;
    pitch?: Id;
  }
}
