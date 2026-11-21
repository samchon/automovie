import { Quaternion, Vector3 } from "@automovie/engine";
import type {
  IAutoMovieIntegrateMotionTrajectory,
  IAutoMovieTransform,
  IAutoMovieVector3,
} from "@automovie/interface";

import type { Archetype } from "./Archetype";
import { ArchetypeFrame } from "./ArchetypeFrame";
import { ArchetypeRefusal } from "./ArchetypeRefusal";
import { ArchetypeUnits } from "./ArchetypeUnits";

/**
 * Declared wheel support and exact vertical coupling geometry for planar towing.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Distinguishes axle-body pitch, level four-wheel support with an optional real drawbar hinge, and unsupported legacy height changes.
 * @evidence contracts/development/design.md#principled-representation Actual model-space wheel/pivot points and an existing articulation id describe mechanical freedoms; no vehicle kind or guessed part name enters the law.
 * @evidence contracts/development/design.md#minimal-and-owned-surface Producer readers supply Support, and ArchetypeRide.towed consumes the prepared projected reach and rigid placement.
 * @evidence contracts/development/design.md#prohibited-design-shortcuts No contact tolerance, vehicle-specific height offset, synthetic suspension or invented shaft flexibility replaces declared geometry.
 */
export namespace ArchetypeTowing {
  /**
   * Actual front steering pivot and its declared yaw articulation.
   *
   * @evidence contracts/development/common.md#meaningful-documentation The pivot is a model-space metre point and turn names the source's actual steering articulation.
   * @evidence contracts/development/design.md#principled-representation An existing source point/id pair describes one steerable front axle; the reader admits actual support geometry.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Shared by producer support descriptors and the existing front option.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No independently adjustable wheelbase or steering angle duplicates the actual model.
   */
  export interface IFront<Id extends string> {
    /** Actual model-space front axle centre/pivot, metres. */
    pivot: IAutoMovieVector3;
    /** Source steering articulation. */
    turn: Id;
  }

  /**
   * Producer-declared support: a freely pitching single axle or grounded front/rear axles.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Axle points are actual neutral wheel centres in metres; their Y is their floor clearance. A four-wheeler may name a real drawbar pitch articulation, otherwise coupling height is fixed.
   * @evidence contracts/development/design.md#principled-representation A closed union separates whole-body axle pitch from a level two-axle chassis; optional pitch is an actual articulation, not permission to deform a rigid pole.
   * @evidence contracts/development/design.md#minimal-and-owned-surface createCart.towing/createCannon.towing read this from their actual source models for the generic towing owner.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No kind tag, numerical correction knob, mutable registry or unmeasured mechanical angle limit is added.
   */
  export type Support<Id extends string> =
    | { kind: "singleAxle"; axle: IAutoMovieVector3 }
    | {
        kind: "fixedGround";
        axle: IAutoMovieVector3;
        front: IFront<Id>;
        pitch?: Id;
      };

  /**
   * One authored ground plane under a horizontal world point: a point on it and its upward unit normal.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names a world-metre point on the plane and its upward unit normal.
   * @evidence contracts/development/design.md#principled-representation A point and a normal fix one plane, the form an authored footing's landing query returns.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Read only by `prepare`'s terrain support; a footing owner adapts its own surfaces to it.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No height field or inferred terrain: the caller names the plane under each queried point.
   */
  export interface IPlane {
    /** A point on the plane, world metres. */
    point: IAutoMovieVector3;
    /** Its upward unit normal. */
    normal: IAutoMovieVector3;
  }

  /**
   * The authored ground plane under a horizontal world point, for a single axle drawn over sloped ground.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Takes world X and Z in metres and returns the plane under that point.
   * @evidence contracts/development/design.md#principled-representation A pure query over the scene's authored ground, so the wheels' support is the ground under the axle rather than under the leader.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Supplied by a caller that owns footing, such as a draft take, and read by `prepare`.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts A query that finds no plane must refuse; it never returns a default height.
   */
  export type Ground = (x: number, z: number) => IPlane;

  /**
   * Prepared geometric operations read by the existing planar heading integrator.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Exposes actual front steering, rear/front separation, height-dependent projected reach and a supported rigid pose with real articulation travels.
   * @evidence contracts/development/design.md#principled-representation Both integration and sample placement consume one admitted geometry snapshot and the same height equation.
   * @evidence contracts/development/design.md#minimal-and-owned-surface Only the existing towing integrator/emitter uses this prepared record.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts No stored sampled pose, independent reach estimate or hidden body lift supplies a coupling.
   */
  export interface IPrepared<Id extends string> {
    /** Actual front steering, or null for one planar link. */
    front: IFront<Id> | null;
    /** Rear-to-front longitudinal separation, metres; zero for one link. */
    body: number;
    /**
     * Horizontal reach and model-X pitch at a world hitch/ground height.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Inputs are world metre heights and output reach is positive metres with pitch in radians.
     * @evidence contracts/development/implementation.md#principled-implementation Keep the actual axle/pivot height and rigid link length, solve its vertical component, and take the positive horizontal projection; a level rigid support refuses a different height.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure One finite height admission and closed-form circle projection.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No whole-body translation, distance clamp or geometric reach outside the declared circle is accepted.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant scalar/trigonometric work without a new integration loop.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work The same operation supplies heading and final placement.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh scalars and retains no samples.
     */
    height: (hitch: number, ground: number) => { reach: number; pitch: number };
    /**
     * The ground datum under the axle for a hitch and a heading: the course datum without declared terrain, else the height that puts the actual wheel on the authored plane under the axle.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Inputs are the world hitch point, the planar heading in radians and the course datum in metres; the output is the world datum `height` and `pose` read, metres.
     * @evidence contracts/development/implementation.md#principled-implementation On a plane of upward normal n the wheel's centre stands r/n_y above the plane under it; the axle lies `reach` behind the hitch along the heading, so the lever circle and the plane's line along the heading intersect in one quadratic, solved in closed form and re-solved while the plane under the solved axle changes.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Without terrain return the datum; with it solve the circle-line intersection on the queried plane.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts A plane sloping across the axle, an unreachable lever or a plane that will not settle under the axle refuses; no wheel is lifted or sunk to hide it.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant work per plane query, at most four queries.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the lever, wheel clearance and refusal of `prepare` with `height` and `pose`.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns one scalar and retains nothing.
     */
    ground: (hitch: IAutoMovieVector3, theta: number, datum: number) => number;
    /**
     * Place the supported vehicle and return actual front/drawbar travels.
     *
     * @evidence contracts/development/common.md#meaningful-documentation Hitch is a world point, ground a world Y datum, theta/phi are planar link headings in radians, and output is a rigid model placement plus source articulation degrees.
     * @evidence contracts/development/implementation.md#principled-implementation Put the actual axle/front pivot at its ground clearance behind the hitch, then rotate about that actual point; a four-wheel body stays level while its declared pole hinge changes pitch.
     * @evidence contracts/development/implementation.md#clear-and-simple-structure Resolve shared height, construct yaw/pitch, anchor the actual support point and return independent travel/frame records.
     * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts Never scale a wheel, stretch a pole, alter its contact or translate a chassis to hide a height mismatch.
     * @evidence contracts/development/implementation.md#efficient-algorithms Constant quaternion/vector work.
     * @evidence contracts/development/implementation.md#reuse-equivalent-work Shares the admitted support and height operation with integration.
     * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Returns fresh transforms/travels without retaining caller points.
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

  /**
   * What `prepare` reads of a towed ride's options: explicit axle and front data, producer support and optional authored ground.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Names each optional geometry declaration and its unit.
   * @evidence contracts/development/design.md#principled-representation Each member is an independent declaration; contradictions between them are refused at runtime by `prepare`.
   * @evidence contracts/development/design.md#minimal-and-owned-surface The subset of `ArchetypeRide.towed`'s options this owner reads.
   * @evidence contracts/development/design.md#prohibited-design-shortcuts Ground is admitted only with single-axle support, the one support whose body may pitch onto it.
   */
  export interface IOptions<Id extends string> {
    /** Explicit model-space axle point, metres. */
    axle?: IAutoMovieVector3;
    /** Explicit front steering pivot and articulation. */
    front?: IFront<Id>;
    /** Producer-read actual support. */
    support?: Support<Id>;
    /** Authored ground under a single axle; the course datum when absent. */
    ground?: Ground;
  }

  /**
   * Admit one producer-declared towing geometry without inferring a vehicle kind.
   *
   * @param trailer Actual neutral source, with its own coupling/articulation frames.
   * @param coupling Source coupling contact id.
   * @param options Existing explicit axle/front data plus optional actual support, and optional authored ground under a single axle.
   * @returns Shared height/projection/placement operations for this source.
   * @throws {ArchetypeRefusal} For contradictory geometry, invalid points/axes, unsupported heights or an unreachable vertical hitch.
   *
   * @evidence contracts/development/common.md#meaningful-documentation States actual support ownership, legacy level-only admission, duplicate-option contradictions, pitch freedoms and strict positive projected reach.
   * @evidence contracts/development/implementation.md#principled-implementation A rigid lever around an actual grounded axle/pivot satisfies h=qY*cos(pitch)-qZ*sin(pitch); its horizontal projection is sqrt(length²-h²). Both existing heading integration and pose emission share that lever, while fixed supports refuse unsupported height.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Admit options/source pivot data, prepare one lever, then expose its closed height solution and rigid placement.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No kind/part-name heuristic, 4 cm compensation, global epsilon, replacement of source methods or extra physics loop changes the model.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(A) source contact reads during preparation and constant work per geometry query; the caller keeps its existing single heading trajectory.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Actual source coordinates are snapshotted once and one height law determines both projected heading reach and exact support placement.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources Retains only fixed scalar geometry and source articulation ids; returned frames/travels are independent and no model buffers, handles or sampled cache survive.
   */
  export function prepare<Id extends string, D extends string>(
    trailer: Archetype<Id, D>,
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
    for (const point of [axle, pivot, local])
      if (![point.x, point.y, point.z].every(Number.isFinite))
        refuse("support", "Towing points must be finite model-space metres");
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
    if (front !== null && !(Number.isFinite(body) && body > 0))
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
      const axis: IAutoMovieVector3 = ArchetypeFrame.axis(steering.frame, "y");
      if (
        steering.kind !== "wheel" ||
        !same(steering.frame.translation, pivot) ||
        ![axis.x, axis.y, axis.z].every(Number.isFinite) ||
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
      const axis: IAutoMovieVector3 = ArchetypeFrame.axis(joint.frame, "y");
      if (
        joint.kind !== "hinge" ||
        trailer.affordance(coupling).rides !== pitchId ||
        !same(joint.frame.translation, pivot) ||
        ![axis.x, axis.y, axis.z].every(Number.isFinite) ||
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
    if (!(Number.isFinite(radius) && radius > 0))
      refuse(
        "support",
        "The actual coupling lever must have represented positive length",
      );
    const free: boolean =
      support?.kind === "singleAxle" || pitchId !== undefined;

    /** One lever gives both the heading projection and the exact supported pose. */
    function height(
      hitch: number,
      ground: number,
    ): { reach: number; pitch: number } {
      if (!Number.isFinite(hitch) || !Number.isFinite(ground))
        refuse("support", "Towing ground and hitch heights must be finite");
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
      if (
        !(
          Number.isFinite(radius) &&
          radius > 0 &&
          Number.isFinite(ratio) &&
          Math.abs(ratio) < 1
        )
      )
        refuse(
          "support",
          "The hitch height has no strictly forward projection within the actual rigid lever",
        );
      const reach: number = radius * Math.sqrt((1 - ratio) * (1 + ratio));
      if (!(Number.isFinite(reach) && reach > 0))
        refuse(
          "support",
          "The actual towing lever has no represented horizontal reach",
        );
      const angle: number =
        Math.atan2(qy, qz) - Math.atan2(vertical, forward * reach);
      return { reach, pitch: Math.atan2(Math.sin(angle), Math.cos(angle)) };
    }
    /** The datum that seats the actual wheel on the authored plane under the solved axle. */
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
        if (
          !(normal.y > 0) ||
          ![point.y, normal.x, normal.z].every(Number.isFinite)
        )
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
        if (!(Number.isFinite(reach) && reach > 0))
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
        if (![hitch.x, hitch.z, theta, phi].every(Number.isFinite))
          refuse("support", "Towing point and planar headings must be finite");
        const solved: { reach: number; pitch: number } = height(
          hitch.y,
          ground,
        );
        const travels: Partial<Record<Id, number>> = {};
        if (front !== null)
          travels[front.turn] = (theta - phi) / ArchetypeUnits.DEGREE;
        if (pitchId !== undefined)
          travels[pitchId] = solved.pitch / (pitchSign * ArchetypeUnits.DEGREE);
        const yaw: number =
          front === null ? theta + (forward < 0 ? Math.PI : 0) : phi;
        const rotation: IAutoMovieTransform["rotation"] = Quaternion.multiply(
          Quaternion.fromAxisAngle(
            { x: 0, y: 1, z: 0 },
            yaw / ArchetypeUnits.DEGREE,
          ),
          Quaternion.fromAxisAngle(
            { x: 1, y: 0, z: 0 },
            front === null ? solved.pitch / ArchetypeUnits.DEGREE : 0,
          ),
        );
        const world: IAutoMovieVector3 = {
          x: hitch.x - Math.sin(theta) * solved.reach,
          y: ground + pivot.y,
          z: hitch.z - Math.cos(theta) * solved.reach,
        };
        return {
          placement: {
            translation: Vector3.subtract(
              world,
              Quaternion.rotateVector(rotation, pivot),
            ),
            rotation,
            scale: { ...ArchetypeFrame.UNIT },
          },
          travels,
        };
      },
    };

    /** Coordinate contradictions are refused, rather than choosing one input silently. */
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

    /** A missing declared freedom is an actionable model/support refusal. */
    function refuse(axis: string, reason: string): never {
      throw new ArchetypeRefusal({
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

  /**
   * Refuse a front axle whose required steering exceeds its lock.
   *
   * @evidence contracts/development/common.md#meaningful-documentation Identifies the actual front axle articulation and the completed planar heading trajectory in radians.
   * @evidence contracts/development/implementation.md#principled-implementation Measure the maximum absolute link-heading difference across the existing knots against the articulation's own degree limit.
   * @evidence contracts/development/implementation.md#clear-and-simple-structure Apply one knot scan for a steerable axle and a single original refusal when it exceeds the lock.
   * @evidence contracts/development/implementation.md#prohibited-implementation-shortcuts No different sampling time, steering clamp or substitute articulation limit.
   * @evidence contracts/development/implementation.md#efficient-algorithms O(K) reads for K prepared knots, O(1) auxiliary space.
   * @evidence contracts/development/implementation.md#reuse-equivalent-work Read the existing continuous heading trajectory at its knots without a new integration.
   * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The synchronous validation keeps only the current maximum.
   */
  export function checkSteering<Id extends string, D extends string>(
    trailer: Archetype<Id, D>,
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
          Math.abs((x[0]! - x[1]!) / ArchetypeUnits.DEGREE),
        );
      }
      if (most > lock)
        throw new ArchetypeRefusal({
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
}
