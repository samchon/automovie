import { Quaternion } from "@automovie/engine";
import { AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type AutoMovieHumanSupportFrame, type IAutoMovieHumanPose } from "@automovie/human";
import type { IAutoMovieQuaternion } from "@automovie/interface";
import type { MotionAction } from "../core/MotionAction";

/**
 * Geometry-derived rolling placement for an authored articulated descent.
 *
 * @evidence contracts/common.md#implementation-and-ownership A fixed canonical quadrature cancels each interval's lowest original rigid vertex's horizontal material displacement, then exact same-pose full-cloud height places the body above the floor. This is approximate kinematic rolling, not a force, impact, COM or continuous collision solution. Contact changes and quadrature retain finite-sampling error for the consumer to inspect.
 * @evidence contracts/common.md#authoring-interface Original bone-local vertices and public same-body FK are required. Local root rotation follows the actor heading; root displacement stays in its fixed heading frame. The caller must independently inspect displayed geometry, other actors, contact velocity and intervening samples.
 */
export class DownGrounding {
  /** Detached numerical inputs; only pure FK/shape callables are borrowed. */
  private readonly config: DownGrounding.Config;
  /** Two exact consecutive shapes avoid repeated FK/cloud work during held rest. */
  private readonly surfaces: Map<string, DownGrounding.Surface> = new Map();
  /** Owned original rigid vertices, never simplified or shrunk. */
  private readonly points: readonly AutoMovieHumanSupportFrame.IPoint[];
  /** Fixed canonical root offsets, independent of playback order or frame rate. */
  private readonly roots: readonly MotionAction.Vec3[];
  /** Number of fixed integration intervals, including the exact endpoint. */
  private readonly intervals: number;
  /** Canonical interval in seconds; the final node is exactly duration. */
  public readonly stepSeconds: number;
  /** Construction only: excludes host fitting, world matrices, drawing and encoding. */
  public readonly preparation: Readonly<{ milliseconds: number; vertices: number; canonicalNodes: number; evaluations: number; reusedShapes: number }>;
  /** Actual public FK calls during preparation and subsequent sampling. */
  private evaluations: number = 0;
  /** Exact whole-shape cache hits, not assumed numerical equivalence. */
  private reusedShapes: number = 0;

  /**
   * Prepare one bounded deterministic track; no actor or drawing is mutated.
   * Copies original vertices and numerical configuration, borrowing only the pure authored shape and same-body public FK. Fixed midpoint material-velocity quadrature accumulates horizontal no-slip requests. An exact two-shape cache bounds retention and reuses held poses; the root grid retains N+1 tuples. Invalid geometry, quaternion, native clinical bounds and an ungrounded entry refuse.
   * Duration, floor and entry root use seconds/metres in the fixed actor-heading frame. Frequency is an authored 30..240Hz quadrature choice, not measured biomechanics. Building is O(NV) plus public FK; construct once per independent descent and inspect its finite-sampling error through the consumer.
   */
  public constructor(config: DownGrounding.Config) {
    const started: number = performance.now();
    if (!Number.isFinite(config.duration) || config.duration <= 0 || !Number.isFinite(config.floorY) || !Number.isFinite(config.samplesPerSecond) || config.samplesPerSecond < 30 || config.samplesPerSecond > 240 || !config.points.length)
      throw new Error("A grounded descent needs original vertices, a finite floor, positive duration and 30..240 canonical samples per second");
    if (config.entryRoot.length !== 3 || !config.entryRoot.every(Number.isFinite)) throw new Error("Descent entry root must be finite metres");
    this.points = config.points.map((point: AutoMovieHumanSupportFrame.IPoint): AutoMovieHumanSupportFrame.IPoint => {
      if (!AutoMovieHumanRigControls.isJoint(point.bone) || point.localPoint.length !== 3 || !point.localPoint.every(Number.isFinite)) throw new Error("Descent surface requires finite original bone-bound vertices");
      return { bone: point.bone, localPoint: [...point.localPoint] };
    });
    this.config = { ...config, entryRoot: [...config.entryRoot], points: this.points };
    this.intervals = Math.ceil(config.duration * config.samplesPerSecond);
    this.stepSeconds = config.duration / this.intervals;
    const roots: MotionAction.Vec3[] = [[...config.entryRoot]];
    let previous: DownGrounding.Surface = this.surface(0);
    const expectedY: number = config.floorY - previous.minimum;
    if (Math.abs(expectedY - config.entryRoot[1]) > .00025) throw new Error("Descent entry must already be grounded within the unchanged 0.25 mm contact tolerance");
    roots[0]![1] = expectedY;
    for (let index: number = 1; index <= this.intervals; index++) {
      const current: DownGrounding.Surface = this.surface(index * this.stepSeconds);
      const midpoint: DownGrounding.Surface = this.surface((index - .5) * this.stepSeconds);
      const contact: number = midpoint.lowest;
      const oldRoot: MotionAction.Vec3 = roots[index - 1]!;
      roots.push([oldRoot[0] - (current.positions[contact]![0] - previous.positions[contact]![0]), config.floorY - current.minimum, oldRoot[2] - (current.positions[contact]![2] - previous.positions[contact]![2])]);
      previous = current;
    }
    this.roots = roots;
    this.preparation = Object.freeze({ milliseconds: performance.now() - started, vertices: this.points.length, canonicalNodes: roots.length, evaluations: this.evaluations, reusedShapes: this.reusedShapes });
  }

  /**
   * Read the exact current floor witness and fixed-grid rolling root.
   *
   * @evidence contracts/common.md#implementation-and-ownership Two neighboring precomputed roots interpolate only horizontal translation. At most one same-pose original-cloud FK supplies exact vertical nonpenetration and the actual minimum vertex; a two-entry exact-shape cache reuses held-pose results. No achieved host result replaces the original requested contact. A cache miss scans O(V) original vertices after public FK; retained storage is O(V+N), including two surfaces and the root grid. Preparation separately records actual evaluations, reuse and elapsed cost.
   * @evidence contracts/common.md#authoring-interface Returns detached metre tuples. The reported contact is an instantaneous rolling pivot, not a persistent planted material point or a measured force. Its material velocity is bounded only by the finite canonical quadrature and must be checked at h and h/2 through the real consumer.
   */
  public sample(seconds: number): DownGrounding.Placement {
    if (!Number.isFinite(seconds)) throw new Error("Descent time must be finite local seconds");
    const time: number = Math.max(0, Math.min(this.config.duration, seconds));
    const coordinate: number = time / this.stepSeconds;
    const index: number = Math.min(this.intervals - 1, Math.floor(coordinate));
    const fraction: number = coordinate - index;
    const left: MotionAction.Vec3 = this.roots[index]!;
    const right: MotionAction.Vec3 = this.roots[index + 1]!;
    const surface: DownGrounding.Surface = this.surface(time);
    const rootOffset: MotionAction.Vec3 = [left[0] + (right[0] - left[0]) * fraction, this.config.floorY - surface.minimum, left[2] + (right[2] - left[2]) * fraction];
    const point: AutoMovieHumanSupportFrame.IPoint = this.points[surface.lowest]!;
    const local: MotionAction.Vec3 = surface.positions[surface.lowest]!;
    return { rootOffset, point: structuredClone(point), position: [local[0] + rootOffset[0], local[1] + rootOffset[1], local[2] + rootOffset[2]], floorMinimum: surface.minimum + rootOffset[1], canonicalStepSeconds: this.stepSeconds };
  }

  /** Evaluate the original rigid vertices in the rotated fixed actor-heading frame. */
  private surface(seconds: number): DownGrounding.Surface {
    const shape: DownGrounding.Shape = this.config.shape(seconds);
    const key: string = JSON.stringify(shape);
    const cached: DownGrounding.Surface | undefined = this.surfaces.get(key);
    if (cached) { this.reusedShapes++; return cached; }
    const output: AutoMovieHumanSkeleton.IOutput = this.config.evaluate(shape.pose);
    this.evaluations++;
    if (output.clamped.length) throw new Error(`Descent authored clinical controls exceed native bounds: ${JSON.stringify(output.clamped)}`);
    const rotation: AutoMovieHumanRigControls.Rotation = shape.rootRotation;
    if (rotation.length !== 4 || !rotation.every(Number.isFinite) || Math.abs(Math.hypot(...rotation) - 1) > .000001) throw new Error("Descent root requires a unit local quaternion");
    const root: IAutoMovieQuaternion = { x: rotation[0], y: rotation[1], z: rotation[2], w: rotation[3] };
    const placements: Map<string, { origin: MotionAction.Vec3; x: MotionAction.Vec3; y: MotionAction.Vec3; z: MotionAction.Vec3 }> = new Map(output.posed.map((placement: AutoMovieHumanSkeleton.IPlacement): [string, { origin: MotionAction.Vec3; x: MotionAction.Vec3; y: MotionAction.Vec3; z: MotionAction.Vec3 }] => {
      const combined: IAutoMovieQuaternion = Quaternion.multiply(root, { x: placement.rotation[0], y: placement.rotation[1], z: placement.rotation[2], w: placement.rotation[3] });
      const q: AutoMovieHumanRigControls.Rotation = [combined.x, combined.y, combined.z, combined.w];
      return [placement.bone, { origin: rotate(rotation, placement.position), x: rotate(q, [1, 0, 0]), y: rotate(q, [0, 1, 0]), z: rotate(q, [0, 0, 1]) }];
    }));
    let minimum: number = Infinity;
    let lowest: number = -1;
    const positions: MotionAction.Vec3[] = this.points.map((point: AutoMovieHumanSupportFrame.IPoint, index: number): MotionAction.Vec3 => {
      const bone: { origin: MotionAction.Vec3; x: MotionAction.Vec3; y: MotionAction.Vec3; z: MotionAction.Vec3 } | undefined = placements.get(point.bone);
      if (!bone) throw new Error(`Descent source has no public FK carrier ${point.bone}`);
      const [x, y, z]: MotionAction.Vec3 = point.localPoint;
      const position: MotionAction.Vec3 = [bone.origin[0] + bone.x[0] * x + bone.y[0] * y + bone.z[0] * z, bone.origin[1] + bone.x[1] * x + bone.y[1] * y + bone.z[1] * z, bone.origin[2] + bone.x[2] * x + bone.y[2] * y + bone.z[2] * z];
      if (position[1] < minimum) { minimum = position[1]; lowest = index; }
      return position;
    });
    const result: DownGrounding.Surface = { positions, minimum, lowest };
    if (this.surfaces.size >= 2) this.surfaces.delete(this.surfaces.keys().next().value!);
    this.surfaces.set(key, result);
    return result;
  }
}

/**
 * Original geometry and authored clinical trajectory needed by the rolling placement.
 */
export namespace DownGrounding {
  /**
   * One authored clinical shape and local rigid orientation before translation.
   * @evidence contracts/common.md#implementation-and-ownership The shape callback owns articulation and orientation; placement changes translation only and refuses native clinical clamps.
   * @evidence contracts/common.md#authoring-interface Pose uses public Human clinical units and rootRotation is a unit quaternion after the actor heading. Return independently owned data from a pure fixed-input sampler.
   */
  export interface Shape { /** Public clinical units. */ pose: IAutoMovieHumanPose; /** Actor-local rigid orientation. */ rootRotation: AutoMovieHumanRigControls.Rotation }
  /**
   * Fixed inputs borrowed for this one immutable descent.
   * @evidence contracts/common.md#implementation-and-ownership Original rigid vertices and numerical values are copied; pure same-body FK and shape callbacks remain borrowed. No live actor, last frame, solver output, reduced proxy or film policy is used to derive the root grid.
   * @evidence contracts/common.md#authoring-interface Geometry must include every surface the consumer promises to keep above the fixed floor. Entry is already grounded, duration is positive seconds and 30..240Hz is the authored finite quadrature. Callbacks must remain pure and alive with the track.
   */
  export interface Config {
    /** Original emitted rigid vertices, including all body regions and equipment to be checked. */ points: readonly AutoMovieHumanSupportFrame.IPoint[];
    /** Same-body public FK. */ evaluate: AutoMovieHumanSkeleton.PoseEvaluator;
    /**
     * Deterministic side-effect-free authored shape.
     *
     * @evidence contracts/common.md#implementation-and-ownership The action owner supplies one pure clinical-pose/local-root-rotation sampler over its fixed immutable entry. DownGrounding borrows it to author original-cloud floor placement before the real actor independently checks support; no achieved target or live drawing state enters this callback.
     * @evidence contracts/common.md#authoring-interface Input is finite action-local seconds within zero through duration. Return public Human clinical units and a unit actor-local x/y/z/w quaternion, with fixed body and geometry throughout the track. The callback remains alive with this instance and does not itself admit floor contact, force or balance.
     */
    shape: (seconds: number) => Shape;
    /** Positive total local seconds. */ duration: number;
    /** Floor height relative to actor origin, in metres. */ floorY: number;
    /** Exact actual entry root offset in the fixed heading frame. */ entryRoot: MotionAction.Vec3;
    /** Explicit canonical integration frequency, 30..240 Hz. */ samplesPerSecond: number;
  }
  /**
   * Detached authored placement and its actual original minimum vertex.
   * @evidence contracts/common.md#implementation-and-ownership Carries the raw requested root and the true emitting material point from the authored FK. A changing lowest point is an instantaneous rolling pivot, not a persistent planted anchor or measured load.
   * @evidence contracts/common.md#authoring-interface Root and position use fixed actor-heading metres, point.localPoint retains bone metres, and canonicalStepSeconds exposes integration resolution. Convert to WORLD once at the scene boundary and independently inspect actual geometry.
   */
  export interface Placement {
    /** Root in the fixed actor-heading frame. */ rootOffset: MotionAction.Vec3;
    /** Original emitting carrier and local vertex. */ point: AutoMovieHumanSupportFrame.IPoint;
    /** Pivot in the fixed actor-heading frame, including root offset. */ position: MotionAction.Vec3;
    /** Complete-cloud minimum after placement, metres. */ floorMinimum: number;
    /** Finite integration spacing, not continuous proof. */ canonicalStepSeconds: number;
  }
  /**
   * One public FK and its complete original rigid point cloud.
   * @evidence contracts/common.md#implementation-and-ownership Stores only immutable internal rotated vertex coordinates and their actual minimum/index for a two-entry exact-shape cache. There is no achieved fit result or graphics resource.
   * @evidence contracts/common.md#authoring-interface Positions precede root translation in fixed actor-heading metres. The class never exposes or mutates the cached arrays through its public placement result.
   */
  export interface Surface { /** Rotated points before root translation. */ positions: MotionAction.Vec3[]; /** Lowest height. */ minimum: number; /** Stable first minimum index. */ lowest: number }
}

/** Rotate a metre tuple through the public Engine quaternion operation. */
function rotate(rotation: readonly number[], point: MotionAction.Vec3): MotionAction.Vec3 {
  const quaternion: IAutoMovieQuaternion = { x: rotation[0]!, y: rotation[1]!, z: rotation[2]!, w: rotation[3]! };
  const result: { x: number; y: number; z: number } = Quaternion.rotateVector(quaternion, { x: point[0], y: point[1], z: point[2] });
  return [result.x, result.y, result.z];
}
