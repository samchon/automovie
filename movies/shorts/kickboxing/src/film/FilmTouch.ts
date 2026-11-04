import { AutoMovieHumanClinicalIk, AutoMovieHumanRigControls, type AutoMovieHumanSkeleton, type IAutoMovieHumanPose } from "@automovie/human";
import { createAutoMovieSignedMeshQuery } from "@automovie/engine";
import type { IAutoMovieMesh } from "@automovie/interface";
import * as THREE from "three";
import { ActionClock } from "../motion/core/ActionClock";
import { MotionAction } from "../motion/core/MotionAction";
import { ContactTrace } from "../motion/interaction/ContactTrace";
import { LabActor } from "../motion-lab/LabActor";
import { LabBodyStage } from "../motion-lab/LabBodyStage";
import { labContactFrame } from "../motion-lab/labContactFrame";
import type { FilmExchange } from "./FilmExchange";

/**
 * Cooperative lead-glove touch from two actual supported entries.
 * @evidence contracts/common.md#implementation-and-ownership Both original left Hand-bound glove surfaces approach a shared WORLD contact plane through existing public clinical IK. Their original convex triangle geometry supplies separate centre goals; the centres need not coincide. The first actual full-surface interception supplies stopped clinical poses, small recoil and connected return. Original support goals, right guards and native limits remain unchanged. Failed construction or sampling restores both actors.
 * @evidence contracts/common.md#authoring-interface Construction borrows the film's adopted actor pair and ends at the complete .75-second return. evaluate uses gesture-local seconds; the retained contact uses film seconds beginning at .8. This cooperative guard relationship creates no strike response, knockdown or injury claim. Actual moving-image acceptance remains separate.
 */
export class FilmTouch {
  /** Complete authored gesture and recovery, seconds. */
  public static readonly duration: number = .75;
  /** Consumer-visible local duration. */
  public readonly duration: number = FilmTouch.duration;
  /** Original supported placements and connected arm endpoints. */
  private readonly entries: Record<"a" | "b", FilmTouch.Entry>;
  /** Canonical actual first-interception query. */
  private readonly trace: ContactTrace.Result;
  /** Both actual stopped poses, not the unachieved terminal request. */
  private readonly stopped: Record<"a" | "b", IAutoMovieHumanPose>;
  /** Public Engine measurements of the actual conservative displayed stopping pair. */
  private readonly acceptance: FilmTouch.Acceptance;
  /** Same adopted actual entry restored before every independent seek. */
  private readonly restoreEntry: () => void;

  /** Place one cooperative gesture without constructing another actor or solver. */
  public constructor(private readonly actors: Record<"a" | "b", LabActor>) {
    const rollback: () => void = checkpoint(actors);
    try {
      if (actors.a.id !== "a" || actors.b.id !== "b") throw new Error("Film touch requires the named independent a and b performers");
      for (const actor of Object.values(actors)) actor.adopt();
      const centres: Record<"a" | "b", THREE.Vector3> = { a: actors.a.glove("left").getWorldPosition(new THREE.Vector3()), b: actors.b.glove("left").getWorldPosition(new THREE.Vector3()) };
      const centre: THREE.Vector3 = centres.a.clone().add(centres.b).multiplyScalar(.5);
      const direction: THREE.Vector3 = centres.b.clone().sub(centres.a);
      if (direction.length() <= 1e-8) throw new Error("Opening touch requires two initially distinct glove centres");
      direction.normalize();
      const extents: Record<"a" | "b", FilmTouch.Surface> = { a: surface(actors.a.glove("left")), b: surface(actors.b.glove("left")) };

      // A one-millimetre query overlap exceeds both original .25mm fitting errors; displayed motion stops at the actual earlier surface interception.
      const overlap: number = 4 * .00025;
      const goals: Record<"a" | "b", THREE.Vector3> = { a: centre.clone().addScaledVector(direction, -(extents.a.innerRadius - overlap / 2)), b: centre.clone().addScaledVector(direction, extents.b.innerRadius - overlap / 2) };
      this.entries = { a: prepare(actors.a, goals.a, extents.a), b: prepare(actors.b, goals.b, extents.b) };
      this.restoreEntry = checkpoint(actors);
      const captures: Map<number, { poses: Record<"a" | "b", IAutoMovieHumanPose>; restore: () => void }> = new Map();
      this.trace = ContactTrace.resolve({
        actionId: "opening-touch", actorId: actors.a.id, targetId: actors.b.id,
        start: 0, end: .32, stepSeconds: 1 / 60, refinementSteps: 8, maximumCaptures: 96, grazeCosine: 0,
        capture: (seconds: number): ContactTrace.Frame => {
          this.restoreEntry();
          this.place(seconds, ActionClock.ease(seconds / .32), false);
          captures.set(seconds, { poses: { a: structuredClone(actors.a.pose), b: structuredClone(actors.b.pose) }, restore: checkpoint(actors) });
          const sample: MotionAction.Sample = actors.a.constrained();
          sample.elapsed = seconds;
          return labContactFrame(actors.a, actors.b, sample, { action: "jab", side: "left", defense: "none" }, "left");
        },
      });
      if (!this.trace.event || this.trace.stopTime === null || this.trace.receipt.pair?.attack !== `${actors.a.id}:left-glove` || this.trace.receipt.pair.receiver !== `${actors.b.id}:left-glove`) throw new Error("Opening touch requires an actual left-glove to left-glove interception", { cause: structuredClone(this.trace) });
      const stopped: { poses: Record<"a" | "b", IAutoMovieHumanPose>; restore: () => void } | undefined = captures.get(this.trace.stopTime);
      if (!stopped) throw new Error("Opening touch lost its actual conservative stopping poses");
      stopped.restore();
      this.acceptance = inspectContact(actors, this.trace);
      this.stopped = structuredClone(stopped.poses);
      this.evaluate(this.duration);
    } catch (error: unknown) { rollback(); throw error; }
  }

  /**
   * Sample a gesture independently of prior seek order or browser frame cadence.
   * @evidence contracts/common.md#implementation-and-ownership Restores the immutable supported entry and samples the same clinical path. Actual intercepted poses supply both recoil and recovery; no midpoint penetration is displayed. The paired transaction restores both original actors if either support or arm fails.
   * @evidence contracts/common.md#authoring-interface Local seconds must lie in [0,.75]. The caller adopts the returned complete ending before the next action. Every displayed sample independently retains the original support and full-floor admission; no neutral whole-body reset is inserted.
   */
  public evaluate(seconds: number): void {
    const clock: FilmTouch.Clock = FilmTouch.clock(seconds, this.trace.stopTime!);
    const rollback: () => void = checkpoint(this.actors);
    try {
      this.restoreEntry();
      this.place(seconds, clock.weight, clock.phase !== "delivery");
    } catch (error: unknown) { rollback(); throw error; }
  }

  /**
   * Read the actual cooperative contact on the common film clock.
   * @evidence contracts/common.md#implementation-and-ownership Returns only the original ContactTrace event and detached finite-query receipt. No attack reaction is emitted; the film's touch cue consumes the explicit cooperative action identity.
   * @evidence contracts/common.md#authoring-interface seconds is .8 plus the conservative local stopping time; the WORLD point and normal belong to the receipt's separately named witness time. Finite articulated sampling, containment and swept-interior limitations remain attached.
   */
  public contacts(): FilmExchange.Contact[] {
    const event: MotionAction.ContactEvent = this.trace.event!;
    return [{ eventId: "opening-touch", actionId: "opening-touch", actorId: "a", targetId: "b", seconds: .8 + event.time, relation: "guard", point: [...event.point], normal: [...event.normal], provenance: "Cooperative actual original left Hand-bound glove touch; native support, full-surface ContactTrace and displayed pair surface-distance/vertex-depth inspection within original .25mm precision; no strike response", query: structuredClone(this.trace.receipt) }];
  }

  /**
   * Read retained construction and query evidence without another solve.
   * @evidence contracts/common.md#implementation-and-ownership Copies immutable raw WORLD targets, source IK outcomes, actual stopped poses and the already computed trace. Query work includes canonical captures while source IK is reported separately.
   * @evidence contracts/common.md#authoring-interface The snapshot describes finite geometry queries and native support, not balance, force, uninterrupted viewing or complete continuous collision proof. Actor resources remain owned by the film.
   */
  public inspect(): object { return structuredClone({ duration: this.duration, entries: this.entries, stopped: this.stopped, trace: this.trace, acceptance: this.acceptance, contacts: this.contacts(), recoveryLimit: "Recovery reverses the same fixed-body clinical entry-to-actual-stop path. It has no independent articulated swept certificate; every requested display sample still undergoes the original native support and floor inspection." }); }

  /**
   * Resolve the fixed gesture clock, including an actual-interception branch.
   * @evidence contracts/common.md#implementation-and-ownership Delivery follows its original .32-second smooth path until actual interception. A .02-second dwell and .06-second four-percent recoil precede a continuous return ending exactly at .75. Knowledge of future contact never changes delivery samples before it.
   * @evidence contracts/common.md#authoring-interface Weight interpolates entry to terminal during delivery and entry to actual stop during the contact branch. It is an authored clinical weight, not force. Without an actual stop only the original [0,.32] delivery clock is available. Invalid local time or a contact outside (0,.32] refuses.
   */
  public static clock(seconds: number, stop?: number): FilmTouch.Clock {
    if (!Number.isFinite(seconds) || seconds < 0 || seconds > FilmTouch.duration) throw new Error("Touch seek must be within [0,.75] seconds");
    if (stop !== undefined && (!Number.isFinite(stop) || stop <= 0 || stop > .32)) throw new Error("Touch interception must be within (0,.32] seconds");
    if (stop === undefined && seconds > .32) throw new Error("Touch recovery requires an actual interception");
    if (stop === undefined || seconds < stop) return { phase: "delivery", weight: ActionClock.ease(Math.min(seconds / .32, 1)) };
    if (seconds < stop + .02) return { phase: "contact", weight: 1 };
    if (seconds < stop + .08) return { phase: "recoil", weight: 1 - .04 * ActionClock.ease((seconds - stop - .02) / .06) };
    return { phase: seconds === FilmTouch.duration ? "complete" : "recovery", weight: .96 * (1 - ActionClock.ease((seconds - stop - .08) / (FilmTouch.duration - stop - .08))) };
  }

  /** Reuse existing support and arm application for the same requested clinical path. */
  private place(seconds: number, weight: number, returning: boolean): void {
    for (const id of ["a", "b"] as const) {
      const actor: LabActor = this.actors[id];
      const entry: FilmTouch.Entry = this.entries[id];
      const placement: MotionAction.BodyPlacement = actor.prepareBody(entry.body);
      const blended: IAutoMovieHumanPose = AutoMovieHumanRigControls.blend(entry.body.pose, returning ? this.stopped[id] : entry.terminal, weight);
      const pose: IAutoMovieHumanPose = structuredClone(placement.pose);
      pose.arms = { left: structuredClone(blended.arms?.left ?? {}), right: structuredClone(pose.arms?.right ?? {}) };
      const output: ReturnType<typeof actor.person.evaluate> = actor.person.evaluate(pose);
      if (output.clamped.some((row: { path: string }): boolean => row.path.startsWith("arms.left."))) throw new Error("Touch left arm exceeded public clinical bounds", { cause: structuredClone(output.clamped) });
      const hand: (typeof output.posed)[number] | undefined = output.posed.find((row: (typeof output.posed)[number]): boolean => row.bone === "leftHand");
      if (!hand) throw new Error("Touch requires the original left Hand FK");
      const target: MotionAction.Vec3 = new THREE.Vector3(...entry.pad).applyQuaternion(new THREE.Quaternion(...hand.rotation)).add(new THREE.Vector3(...hand.position)).toArray();
      const sample: MotionAction.Sample = { ...LabBodyStage.sample(placement), pose, phase: seconds === this.duration ? "complete" : returning ? "retraction" : "delivery", elapsed: seconds, progress: seconds / this.duration, effectors: [{ bone: "leftHand", localPoint: [...entry.pad], target, role: "guard", constraint: "hard", radius: entry.surface.outerRadius }] };
      actor.applyArm(sample, placement, "left", channels());
    }
  }
}

/**
 * Narrow cooperative gesture data, without another rig or event owner.
 * Clock describes the existing finite gesture branches; Entry retains its actual supported body, independent original WORLD request and bounded source fit. Neither declaration creates contact or changes actor ownership.
 * Clock weights refer to either terminal delivery or the actual stopped arm as documented. Entry distinguishes actor-local body offsets, Hand-local pad and WORLD glove-centre goal in metres, with public clinical poses and measured native work.
 */
export namespace FilmTouch {
  /**
   * Authored clock branch and closed-unit clinical path weight.
   * @evidence contracts/common.md#implementation-and-ownership Exposes only the deterministic gesture phase and interpolation parameter; it does not assert a contact or force.
   * @evidence contracts/common.md#authoring-interface Delivery weight references the terminal arm, while subsequent phases reference the actual intercepted arm. The finite local clock owns this distinction.
   */
  export interface Clock { phase: "delivery" | "contact" | "recoil" | "recovery" | "complete"; weight: number }
  /**
   * Retained original body, independent terminal request and bounded source fit.
   * @evidence contracts/common.md#implementation-and-ownership Stores copied actual-entry body data, independently geometry-authored external glove-centre goal, measured convex surface extents, native fitted arm and source work. Actual final support and contact still belong to the real host.
   * @evidence contracts/common.md#authoring-interface Body offsets are actor-local metres, worldTarget is WORLD metres and pad is the original Hand-local glove centre. Surface radii use actual original metre geometry, never smaller replacement collision meshes. Source error uses metres, iterations count native updates and milliseconds measure only the source clinical solve.
   */
  export interface Entry { body: MotionAction.BodyPlacement; terminal: IAutoMovieHumanPose; pad: MotionAction.Vec3; worldTarget: MotionAction.Vec3; surface: Surface; source: { error: number; iterations: number; milliseconds: number; clamped: AutoMovieHumanSkeleton.IOutput["clamped"] } }
  /**
   * Measured original convex glove geometry about its actual bound centre.
   * @evidence contracts/common.md#implementation-and-ownership The nearest original face plane bounds a contained ball and the furthest original vertex bounds the exterior. Geometry is inspected rather than replaced; full original triangles remain the contact query input.
   * @evidence contracts/common.md#authoring-interface Radii are metres after the actual mesh scale. The existing complete SphereGeometry source supplies closure; the measured triangles must also enclose their origin and satisfy every convex face half-space. measurementMs includes this once-per-gesture inspection, separately from clinical fitting.
   */
  export interface Surface { innerRadius: number; outerRadius: number; vertices: number; triangles: number; measurementMs: number }
  /**
   * Actual conservative stopping pair measured through public Engine queries.
   * @evidence contracts/common.md#implementation-and-ownership Retains both original surfaces' nearest points to the source witness and every original vertex's oriented depth against the other. The summed witness distances bound their instantaneous separation; no nominal hand position or future penetration supplies acceptance.
   * @evidence contracts/common.md#authoring-interface All distances use WORLD metres at local seconds. The unchanged .25mm production precision bounds surface separation and the sampled vertex-depth proxy. Matrices and finite-query limitations remain attached; this is not exact articulated CCD or full overlap depth.
   */
  export interface Acceptance { seconds: number; distanceUpperBoundMetres: number; maximumVertexDepthMetres: { a: number; b: number }; worldMatrices: { a: number[]; b: number[] }; queryMs: number; limits: string[] }
}

/** Both performers roll back together; the film retains ownership of each drawing. */
function checkpoint(actors: Record<"a" | "b", LabActor>): () => void {
  const restores: (() => void)[] = [actors.a.checkpoint(), actors.b.checkpoint()];
  return (): void => { for (const restore of restores) restore(); };
}

/** Select the same coupled public chain in source and final fixed-body consumption. */
function channels(): AutoMovieHumanRigControls.DegreeChannel[] {
  return ["arms.left.shoulder.flexion", "arms.left.shoulder.abduction", "arms.left.shoulder.rotation", "arms.left.elbow.flexion"];
}

/** Fit an independent WORLD terminal request once, retaining original feet and right guard. */
function prepare(actor: LabActor, worldTarget: THREE.Vector3, extent: FilmTouch.Surface): FilmTouch.Entry {
  const context: MotionAction.Context = actor.context("left", actor.local(worldTarget.toArray()));
  if (!context.prepareSupport) throw new Error("Touch needs the actual source support preparation boundary");
  const rotation: AutoMovieHumanRigControls.Rotation = new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(0, 1, 0), -actor.yaw).multiply(actor.person.object.quaternion).toArray();
  const request: MotionAction.BodyPlacement = { pose: structuredClone(actor.pose), rootOffset: [0, 0, 0], rootRotation: rotation, support: { kind: "feet", left: .5, right: .5, patches: [structuredClone(actor.patches.left.low), structuredClone(actor.patches.right.low)] } };
  const body: MotionAction.BodyPlacement = actor.prepareBody(context.prepareSupport(request));
  const pad: MotionAction.Vec3 = actor.glove("left").position.toArray();
  const target: MotionAction.Vec3 = actor.person.object.worldToLocal(worldTarget.clone()).toArray();
  const started: number = performance.now();
  const solved: AutoMovieHumanClinicalIk.IResult = AutoMovieHumanClinicalIk.solve(actor.person.evaluate, structuredClone(body.pose), { channels: channels(), targets: [{ bone: "leftHand", localPoint: [...pad], position: target }], iterations: 16, tolerance: .00025 });
  const milliseconds: number = performance.now() - started;
  if (solved.error > .00025 || solved.output.clamped.some((row: { path: string }): boolean => row.path.startsWith("arms.left."))) throw new Error("Touch surface-centre goal is unreachable within the original clinical budget", { cause: { actorId: actor.id, worldTarget: worldTarget.toArray(), surface: extent, error: solved.error, iterations: solved.iterations, clamped: structuredClone(solved.output.clamped) } });
  return { body, terminal: structuredClone(solved.pose), pad, worldTarget: worldTarget.toArray(), surface: structuredClone(extent), source: { error: solved.error, iterations: solved.iterations, milliseconds, clamped: structuredClone(solved.output.clamped) } };
}

/** Measure the actual original convex glove instead of asking both centres to coincide. */
function surface(glove: THREE.Mesh): FilmTouch.Surface {
  const started: number = performance.now();
  if (!(glove.geometry instanceof THREE.SphereGeometry) || glove.geometry.parameters.phiLength !== Math.PI * 2 || glove.geometry.parameters.thetaStart !== 0 || glove.geometry.parameters.thetaLength !== Math.PI) throw new Error("Touch expects the original complete bound glove sphere geometry");
  const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute | undefined = glove.geometry.getAttribute("position");
  const indices: THREE.BufferAttribute | null = glove.geometry.index;
  if (!position || position.itemSize !== 3 || !indices || indices.count % 3 !== 0) throw new Error("Touch requires original indexed glove triangles");
  const scale: THREE.Vector3 = glove.getWorldScale(new THREE.Vector3());
  const points: THREE.Vector3[] = Array.from({ length: position.count }, (_value: unknown, index: number): THREE.Vector3 => new THREE.Vector3(position.getX(index), position.getY(index), position.getZ(index)).multiply(scale));
  let innerRadius: number = Infinity;
  let outerRadius: number = 0;
  for (const point of points) outerRadius = Math.max(outerRadius, point.length());
  for (let index: number = 0; index < indices.count; index += 3) {
    const a: THREE.Vector3 = points[indices.getX(index)]!;
    const b: THREE.Vector3 = points[indices.getX(index + 1)]!;
    const c: THREE.Vector3 = points[indices.getX(index + 2)]!;
    const normal: THREE.Vector3 = b.clone().sub(a).cross(c.clone().sub(a));
    if (normal.lengthSq() < 1e-20) continue;
    normal.normalize();
    if (normal.dot(a) < 0) normal.negate();
    const distance: number = normal.dot(a);
    if (distance <= 0 || points.some((point: THREE.Vector3): boolean => normal.dot(point) > distance + 1e-8)) throw new Error("Touch requires the unchanged convex glove enclosing its bound centre");
    innerRadius = Math.min(innerRadius, distance);
  }
  if (!Number.isFinite(innerRadius) || innerRadius <= .001 || !Number.isFinite(outerRadius)) throw new Error("Touch glove has no finite positive surface extent");
  return { innerRadius, outerRadius, vertices: position.count, triangles: indices.count / 3, measurementMs: performance.now() - started };
}

/** Refuse a separated last-clear display instead of promoting the future witness to a touch. */
function inspectContact(actors: Record<"a" | "b", LabActor>, trace: ContactTrace.Result): FilmTouch.Acceptance {
  const started: number = performance.now();
  const meshes: Record<"a" | "b", IAutoMovieMesh> = { a: actors.a.worldMesh(actors.a.glove("left")), b: actors.b.worldMesh(actors.b.glove("left")) };
  const queries: Record<"a" | "b", ReturnType<typeof createAutoMovieSignedMeshQuery>> = { a: createAutoMovieSignedMeshQuery(meshes.a), b: createAutoMovieSignedMeshQuery(meshes.b) };
  const distanceUpperBoundMetres: number = queries.a(trace.event!.point).distance + queries.b(trace.event!.point).distance;
  const depth: (mesh: IAutoMovieMesh, query: ReturnType<typeof createAutoMovieSignedMeshQuery>) => number = (mesh: IAutoMovieMesh, query: ReturnType<typeof createAutoMovieSignedMeshQuery>): number => {
    let maximum: number = 0;
    for (let index: number = 0; index < mesh.positions.length; index += 3) maximum = Math.max(maximum, -query([mesh.positions[index]!, mesh.positions[index + 1]!, mesh.positions[index + 2]!]).signedDistance);
    return maximum;
  };
  const receipt: FilmTouch.Acceptance = { seconds: trace.stopTime!, distanceUpperBoundMetres, maximumVertexDepthMetres: { a: depth(meshes.a, queries.b), b: depth(meshes.b, queries.a) }, worldMatrices: { a: [...actors.a.person.object.matrixWorld.elements], b: [...actors.b.person.object.matrixWorld.elements] }, queryMs: performance.now() - started, limits: ["Instantaneous original full-surface proximity at the actual displayed conservative stop; .25mm production precision is not exact mathematical tangency", "All supplied original vertices receive oriented pseudonormal depth queries; this is not a complete solid overlap-depth or articulated CCD proof", "Original ContactTrace bracket and separately named witness time retain their finite sampling limits"] };
  if (receipt.distanceUpperBoundMetres > .00025 || receipt.maximumVertexDepthMetres.a > .00025 || receipt.maximumVertexDepthMetres.b > .00025) throw new Error("Displayed lead gloves do not realize the original bounded surface touch", { cause: receipt });
  return receipt;
}
