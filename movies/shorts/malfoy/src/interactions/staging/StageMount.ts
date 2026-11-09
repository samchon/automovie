import {
  resolveAutoMovieSchedule,
  type AutoMovieComposition,
  type IAutoMovieSchedule,
} from "@automovie/engine";
import type { IAutoMovieVector3 } from "@automovie/interface";
import * as THREE from "three";

import type { VerticalCamera } from "../../entities/cameras/vertical-camera/VerticalCamera";
import type { Student } from "../../entities/cast/student/Student";
import { StudentBody } from "../../entities/cast/student/StudentBody";
import { StudentFigure } from "../../entities/cast/student/StudentFigure";
import { Daylight } from "../../entities/lights/daylight/Daylight";
import type { IStageProp } from "../../entities/props/IStageProp";
import type { IStageSet } from "../../entities/sets/IStageSet";
import type { IBodyPosture } from "../../laws/body/IBodyPosture";
import { CameraTrack } from "../cinematography/CameraTrack";
import { BroomTrack } from "../flight/BroomTrack";
import type { IStageWorld } from "./IStageWorld";
import { PropTrack } from "./PropTrack";
import { StageLaws } from "./StageLaws";
import { StagePerformance } from "./StagePerformance";

/**
 * Mount a film's composition on a set: resolve the schedule once with the
 * stage laws, index the performance, the props and the camera, build the
 * Three scene (daylight, the set, each student's dressed figure, each prop)
 * and return an exact-time `seek` that places everything for any second.
 * It needs no DOM, network or texture, so it runs the same in the Viewer and
 * in Node capture; a film's own stage file only names its set and cast.
 *
 * ```ts
 * const mounted = StageMount.mount({ set, students: [carina, harry], props: [note], camera, composition, duration: 60 });
 * mounted.seek(35.7);
 * ```
 *
 * @evidence docs/body/settings/cinematography/vertical-look.md#normal The delivered 9:16 lens.
 * @evidence contracts/development/behaviors.md#deterministic-evaluation The composition resolves once into a frozen schedule; `seek` is a pure function of it and the second.
 * @evidence contracts/development/implementation.md#bound-retention-and-release-resources The mount owns the scene's figures, props, set and lights and releases them in `dispose`.
 * @evidence contracts/development/implementation.md#reuse-equivalent-work One schedule, performance index, prop track and camera track serve every seek.
 * @evidence contracts/development/common.md#meaningful-documentation States what is built, what `seek` places and where it runs.
 */
export namespace StageMount {
  /** What to mount. */
  export interface IInput {
    /** The set. */
    set: IStageSet;

    /** Every student who may appear. */
    students: Student[];

    /** Every prop that may appear. */
    props: IStageProp[];

    /** The camera. */
    camera: VerticalCamera;

    /** The film's composition. */
    composition: AutoMovieComposition;

    /** Film seconds. */
    duration: number;

    /** Progress messages. */
    progress?: (message: string) => void;

    /** Builds the consequences drawn over the performance (spells, shields, falling masonry, balls), from the resolved parts. */
    effects?: (resolved: IResolved) => IEffect[];
  }

  /** The resolved parts a consequence reads. */
  export interface IResolved {
    world: IStageWorld;
    schedule: IAutoMovieSchedule;
    performance: StagePerformance;
    props: PropTrack;
  }

  /** A consequence drawn over the performance. */
  export interface IEffect {
    /** Its root object. */
    object: THREE.Object3D;

    /** Place it for a second. */
    place(seconds: number): void;

    /** Audit findings, such as a body inside a danger region. */
    findings?: string[];

    /** Release it. */
    dispose(): void;
  }

  /** A mounted stage, structurally a film production. */
  export interface IMounted {
    /** The scene. */
    scene: THREE.Scene;

    /** The camera. */
    camera: THREE.PerspectiveCamera;

    /** The resolved schedule. */
    schedule: IAutoMovieSchedule;

    /** The performance index. */
    performance: StagePerformance;

    /** The props' track. */
    props: PropTrack;

    /** The camera's track. */
    track: CameraTrack;

    /** Audit findings of the effects. */
    findings: string[];

    /** Place everything for a second. */
    seek(seconds: number): void;

    /** Release the scene. */
    dispose(): void;
  }

  /**
   * Resolve a composition on a world without drawing anything: the schedule,
   * performance and prop track tests read.
   *
   * @param input The set, students, props and composition.
   * @returns The resolved parts.
   */
  export function resolve(input: Pick<IInput, "set" | "students" | "props" | "composition">): {
    world: IStageWorld;
    schedule: IAutoMovieSchedule;
    performance: StagePerformance;
    props: PropTrack;
  } {
    const world: IStageWorld = {
      set: input.set,
      students: new Map(input.students.map((s) => [s.id, s])),
      props: new Map(input.props.map((p) => [p.id, p])),
    };
    // Each later pass reads counterparts placed later in walk order from the pass before. A relation chained through
    // several people (she walks to where he stepped after giving her room) needs a pass per link, so passes repeat
    // until no entry's timing or end point moves, at most eight.
    let schedule: IAutoMovieSchedule = resolveAutoMovieSchedule(input.composition, new StageLaws(world));
    for (let pass = 1; pass < 8; pass++) {
      const next: IAutoMovieSchedule = resolveAutoMovieSchedule(input.composition, new StageLaws(world, schedule));
      const settled: boolean = StageMount.settled(schedule, next);
      schedule = next;
      if (settled) break;
    }
    return { world, schedule, performance: new StagePerformance(world, schedule), props: PropTrack.resolve(world, schedule) };
  }

  /**
   * Every time two people on the ground overlap: their floor points closer
   * than 0.3 m (two body radii; a face-to-face stop keeps 0.32 m), sampled
   * every 0.1 s, one finding per overlap with its first second.
   *
   * @param performance The resolved performance.
   * @param duration Film seconds.
   * @returns Findings such as "carina and harry overlap at 54.1 s (0.12 m apart)".
   */
  export function collisions(performance: StagePerformance, duration: number): string[] {
    const ids: string[] = performance.subjects();
    const found: string[] = [];
    const open: Set<string> = new Set();
    for (let t = 0; t <= duration + 1e-9; t += 0.1)
      for (let i = 0; i < ids.length; i++)
        for (let j = i + 1; j < ids.length; j++) {
          const a: IAutoMovieVector3 | undefined = performance.position(ids[i]!, t);
          const b: IAutoMovieVector3 | undefined = performance.position(ids[j]!, t);
          const key: string = `${ids[i]}|${ids[j]}`;
          const d: number = a !== undefined && b !== undefined && a.y < 0.4 && b.y < 0.4 ? Math.hypot(a.x - b.x, a.z - b.z) : Infinity;
          if (d < 0.3 && !open.has(key)) {
            open.add(key);
            found.push(`${ids[i]} and ${ids[j]} overlap at ${t.toFixed(1)} s (${d.toFixed(2)} m apart)`);
          } else if (d >= 0.3) open.delete(key);
        }
    return found;
  }

  /**
   * Whether two passes agree: the same entries with the same start and end
   * within a microsecond and every step ending within a millimetre.
   *
   * @param a One pass.
   * @param b The next.
   * @returns Whether resolving again would change nothing.
   */
  export function settled(a: IAutoMovieSchedule, b: IAutoMovieSchedule): boolean {
    if (a.entries.length !== b.entries.length) return false;
    return a.entries.every((x, k) => {
      const y: IAutoMovieSchedule.IEntry = b.entries[k]!;
      if (Math.abs(x.start - y.start) > 1e-6 || Math.abs(x.end - y.end) > 1e-6) return false;
      const p = (x.state as IStageWorld.Step | undefined);
      const q = (y.state as IStageWorld.Step | undefined);
      if (p?.kind !== "student" || q?.kind !== "student") return true;
      return Math.hypot(p.to.position.x - q.to.position.x, p.to.position.y - q.to.position.y, p.to.position.z - q.to.position.z) < 1e-3;
    });
  }

  /**
   * Mount a composition.
   *
   * @param input What to mount.
   * @returns The mounted stage.
   */
  export function mount(input: IInput): IMounted {
    input.progress?.("Resolving the schedule");
    const { world, schedule, performance, props } = resolve(input);
    input.progress?.("Framing the camera");
    const track: CameraTrack = CameraTrack.resolve(world, schedule, performance, input.duration, props);
    input.progress?.("Building the scene");
    const scene: THREE.Scene = new THREE.Scene();
    scene.background = new THREE.Color(input.set.sky);
    const light: Daylight = new Daylight(input.set.light);
    const scenery: IStageSet.IFigure = input.set.figure();
    scene.add(light.object, scenery.object);
    const bodies: Map<string, { body: StudentBody; figure: StudentFigure }> = new Map();
    for (const student of input.students) {
      const body: StudentBody = new StudentBody(student.measure);
      const figure: StudentFigure = new StudentFigure(student.profile, body);
      scene.add(figure.object);
      bodies.set(student.id, { body, figure });
    }
    const propFigures: Map<string, { prop: IStageProp; figure: IStageProp.IFigure }> = new Map();
    for (const prop of input.props) {
      const figure: IStageProp.IFigure = prop.figure();
      scene.add(figure.object);
      propFigures.set(prop.id, { prop, figure });
    }
    const brooms: BroomTrack = BroomTrack.resolve(performance, schedule);
    const effects: IEffect[] = input.effects?.({ world, schedule, performance, props }) ?? [];
    for (const effect of effects) scene.add(effect.object);
    const view: THREE.PerspectiveCamera = input.camera.camera;
    const seek = (seconds: number): void => {
      const hands: Map<string, StudentBody.IJoints> = new Map();
      for (const [id, { body, figure }] of bodies) {
        const posture: IBodyPosture | undefined = performance.posture(id, seconds);
        if (!posture) {
          figure.object.visible = false;
          continue;
        }
        const joints: StudentBody.IJoints = body.solve(posture);
        const found = performance.entry(id, seconds)!;
        figure.place(joints, { riding: found.step.to.support !== "stand" && found.step.to.support !== "seat" });
        hands.set(id, joints);
      }
      for (const [id, { prop, figure }] of propFigures) {
        if (prop.kind === "broom") {
          const b = brooms.at(id, seconds);
          figure.object.visible = b !== undefined;
          if (b) {
            const f = StudentBody.frame(b.heading, b.pitch, b.roll);
            figure.object.position.set(b.position.x, b.position.y, b.position.z);
            figure.object.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(f.forward.x, f.forward.y, f.forward.z), new THREE.Vector3(f.up.x, f.up.y, f.up.z), new THREE.Vector3(-f.left.x, -f.left.y, -f.left.z)));
          }
          continue;
        }
        const segment: PropTrack.ISegment | undefined = props.at(id, seconds);
        if (!segment) {
          figure.object.visible = false;
          continue;
        }
        figure.object.visible = true;
        figure.form?.(props.formAt(id, seconds, "crane"));
        figure.level?.(props.levelAt(id, seconds));
        if (segment.kind === "held") {
          const joints: StudentBody.IJoints | undefined = hands.get(segment.subject);
          if (!joints) {
            figure.object.visible = false;
            continue;
          }
          const arm: StudentBody.IArm = joints.arms[segment.hand];
          figure.object.position.set(arm.hand.x, arm.hand.y, arm.hand.z);
          orient(figure.object, prop, joints, arm);
        } else {
          const p: IAutoMovieVector3 = PropTrack.point(segment, seconds);
          figure.object.position.set(p.x, p.y + (segment.kind === "rest" ? prop.rest : 0), p.z);
          figure.object.quaternion.identity();
          if (prop.kind === "invitation-note") figure.object.rotation.set(0, 0, segment.kind === "fall" ? Math.PI / 2 - 0.3 : Math.PI / 2);
        }
      }
      for (const effect of effects) effect.place(seconds);
      const shot: CameraTrack.ISample = track.at(seconds);
      view.position.set(shot.position.x, shot.position.y, shot.position.z);
      view.lookAt(shot.target.x, shot.target.y, shot.target.z);
      view.updateProjectionMatrix();
      scene.updateMatrixWorld(true);
    };
    seek(0);
    input.progress?.("Ready");
    return {
      scene,
      camera: view,
      schedule,
      performance,
      props,
      track,
      findings: [...effects.flatMap((e) => e.findings ?? []), ...StageMount.collisions(performance, input.duration)],
      seek,
      dispose: (): void => {
        for (const { figure } of bodies.values()) figure.dispose();
        for (const { figure } of propFigures.values()) figure.dispose();
        for (const effect of effects) effect.dispose();
        scenery.dispose();
        light.dispose();
        scene.clear();
      },
    };
  }

  /** Turn a held prop: wands along the forearm, everything else upright facing the holder's forward. */
  function orient(object: THREE.Object3D, prop: IStageProp, joints: StudentBody.IJoints, arm: StudentBody.IArm): void {
    if (prop.kind === "wand" || prop.kind === "beater-bat") {
      const along: THREE.Vector3 = new THREE.Vector3(arm.hand.x - arm.wrist.x, arm.hand.y - arm.wrist.y, arm.hand.z - arm.wrist.z).normalize();
      object.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), along);
      return;
    }
    const f = joints.frame.forward;
    object.quaternion.setFromUnitVectors(new THREE.Vector3(1, 0, 0), new THREE.Vector3(f.x, 0, f.z).normalize());
  }
}
