import {
  type AutoMovieComposition,
  type AutoMoviePhysicsCache,
  type IAutoMovieSchedule,
  Quaternion,
  Vector3,
  preparePhysicalGeometry,
} from "@automovie/engine";
import type { IAutoMovieVector3, IAutoMoviePhysicalProfile as P } from "@automovie/interface";
import * as THREE from "three";

import { ImpactMarks } from "../../../consequences/effects/ImpactMarks";
import { ImpactSpray } from "../../../consequences/effects/ImpactSpray";
import { SoundAssets } from "../../../consequences/sound/SoundAssets";
import { SoundCues } from "../../../consequences/sound/SoundCues";
import { RingCamera } from "../../../entities/cameras/ring-camera/RingCamera";
import { Fighter } from "../../../entities/cast/fighter/Fighter";
import type { FighterFigure } from "../../../entities/cast/fighter/FighterFigure";
import { fighterA } from "../../../entities/cast/fighter/fighterA";
import { fighterB } from "../../../entities/cast/fighter/fighterB";
import { Referee } from "../../../entities/cast/referee/Referee";
import type { RefereeFigure } from "../../../entities/cast/referee/RefereeFigure";
import { RingLights } from "../../../entities/lights/ring-lights/RingLights";
import { Bell } from "../../../entities/props/bell/Bell";
import { Ring } from "../../../entities/sets/ring/Ring";
import { CameraTrack } from "../../../interactions/cinematography/CameraTrack";
import { BoutLaws } from "../../../interactions/kickboxing/BoutLaws";
import { BoutPerformance } from "../../../interactions/kickboxing/BoutPerformance";
import { ContactReceipts } from "../../../interactions/kickboxing/ContactReceipts";
import type { IRingCast } from "../../../interactions/kickboxing/IRingCast";
import { RefereePerformance } from "../../../interactions/officiating/RefereePerformance";
import { RefereeTrack } from "../../../interactions/officiating/RefereeTrack";

/**
 * The ring stage of the kickboxing film: the cast every scene composes, and
 * the mount that resolves the film's composition once and shows any second
 * of it. It only composes entities, interaction entry points and
 * consequences; every decision lives with them.
 *
 * ```ts
 * const stage = new RingStage();
 * const mounted = await stage.mount(composition, 180, progress);
 * mounted.seek(150);
 * ```
 *
 * @evidence docs/body/screenplay/kickboxing.md#s01 The cast, set, camera, lighting and sound of every scene of the one continuous ring scene.
 */
export class RingStage {
  /** Everyone the scenes compose. */
  public readonly cast: IRingCast;

  /** Build the cast from the settings. */
  public constructor() {
    const a: Fighter = new Fighter(fighterA);
    this.cast = Object.freeze({
      a,
      b: new Fighter(fighterB, a),
      referee: new Referee(),
      ring: new Ring(),
      camera: new RingCamera(),
      bell: new Bell(),
    });
  }

  /**
   * Resolve the film's composition and mount its scene.
   *
   * @param composition The film's composition.
   * @param duration The film's running time, seconds.
   * @param seed The film seed.
   * @param progress Receives progress messages.
   * @returns The mounted stage.
   */
  public async mount(
    composition: AutoMovieComposition,
    duration: number,
    seed: string,
    progress?: (message: string) => void,
  ): Promise<RingStage.IMounted> {
    const cast: IRingCast = this.cast;
    progress?.("Resolving the schedule");
    const schedule: IAutoMovieSchedule = BoutLaws.resolve(cast, composition);
    const violations: string[] = BoutLaws.check(schedule);
    const queries = await preparePhysicalGeometry();
    const performance: BoutPerformance = new BoutPerformance(cast, schedule, queries);
    progress?.("Resolving the referee and camera");
    const referee: RefereeTrack.ITrack = RefereeTrack.resolve(cast, schedule, duration);
    const camera: CameraTrack.ISample[] = CameraTrack.resolve(cast, schedule, referee, duration);
    progress?.("Measuring contacts");
    const measured = ContactReceipts.measure(cast, schedule, performance, queries);
    const points: Record<string, IAutoMovieVector3> = {};
    for (const r of measured.receipts) {
      const receiver: Fighter = r.receiver === cast.a.id ? cast.a : cast.b;
      const region = receiver.body.regions[r.region]!;
      const s: P.ITransform = performance.at(r.seconds)[r.receiver]!.segments[region.bone]!;
      points[r.anchor] = Vector3.add(s.position, Quaternion.rotateVector(s.rotation, region.localPoint));
    }
    const cues: SoundCues.ICue[] = SoundCues.of(seed, schedule, measured.receipts);
    const scene: THREE.Scene = new THREE.Scene();
    scene.background = new THREE.Color(RingStage.BACKGROUND);
    const lights: RingLights = new RingLights();
    const ring = cast.ring.figure();
    const figures: Record<string, FighterFigure> = { [cast.a.id]: cast.a.figure(), [cast.b.id]: cast.b.figure() };
    const official: RefereeFigure = cast.referee.figure();
    const spray: ImpactSpray = new ImpactSpray(seed, measured.receipts, points);
    scene.add(lights.object, ring.object, figures[cast.a.id]!.object, figures[cast.b.id]!.object, official.object, spray.object);
    const view: THREE.PerspectiveCamera = cast.camera.camera;
    let last: Record<string, Record<string, P.ITransform>> = {};
    let shown: number = 0;
    const seek = (seconds: number): void => {
      shown = seconds;
      const bodies = performance.at(seconds);
      for (const fighter of [cast.a, cast.b]) {
        const body = bodies[fighter.id]!;
        figures[fighter.id]!.place(fighter.body.complete(body.output, body.root, body.segments), { jaw: body.jaw, wince: body.wince }, ImpactMarks.at(measured.receipts, fighter.id, seconds));
      }
      const placed = RefereePerformance.at(cast, schedule, referee, seconds);
      official.place(placed.output, placed.root, placed.jaw);
      spray.place(seconds);
      const shot = CameraTrack.at(camera, seconds);
      view.position.set(shot.position.x, shot.position.y, shot.position.z);
      view.lookAt(shot.target.x, shot.target.y, shot.target.z);
      view.updateProjectionMatrix();
      last = { [cast.a.id]: bodies[cast.a.id]!.segments, [cast.b.id]: bodies[cast.b.id]!.segments, [cast.referee.id]: placed.segments };
      scene.updateMatrixWorld(true);
    };
    seek(0);
    return {
      scene,
      camera: view,
      schedule,
      violations,
      findings: measured.findings.map((finding: string): string => {
        const receipt = measured.receipts.find((r) => finding.startsWith(`${r.anchor}:`));
        return receipt ? `${finding}; closest ${receipt.separation.toFixed(3)} m at ${receipt.seconds.toFixed(3)} s` : finding;
      }),
      receipts: measured.receipts,
      cues,
      seek,
      bodies: [
        { id: cast.a.id, profile: cast.a.body.profile },
        { id: cast.b.id, profile: cast.b.body.profile },
        { id: cast.referee.id, profile: cast.referee.body.profile },
      ],
      frame: (): AutoMoviePhysicsCache.IFrame => ({
        seconds: shown,
        bodies: Object.fromEntries(
          Object.entries(last).map(([id, segments]) => [
            id,
            Object.fromEntries(Object.entries(segments).map(([bone, t]) => [bone, { ...t, velocity: { x: 0, y: 0, z: 0 }, angularVelocity: { x: 0, y: 0, z: 0 } }])),
          ]),
        ),
      }),
      dispose: (): void => {
        for (const f of Object.values(figures)) f.dispose();
        official.dispose();
        spray.dispose();
        ring.dispose();
        lights.dispose();
        scene.clear();
      },
    };
  }

  /** The soundtrack's assets. */
  public static readonly SOUND: Readonly<Record<string, string>> = SoundAssets.paths;

  /** Arena darkness behind the ring. */
  public static readonly BACKGROUND: number = 0x0b0e14;
}

/** Companion types of {@link RingStage}. */
export namespace RingStage {
  /** A mounted stage. */
  export interface IMounted {
    /** The scene. */
    scene: THREE.Scene;

    /** The delivered camera. */
    camera: THREE.PerspectiveCamera;

    /** The resolved schedule. */
    schedule: IAutoMovieSchedule;

    /** Legality violations of the schedule. */
    violations: string[];

    /** Outcome audit findings against the measured contacts. */
    findings: string[];

    /** Measured contacts. */
    receipts: ContactReceipts.IReceipt[];

    /** The soundtrack's cues. */
    cues: SoundCues.ICue[];

    /** Place everything for a second. */
    seek(seconds: number): void;

    /** Bodies for the review overlay. */
    bodies: { id: string; profile: P }[];

    /** The displayed segments for the review overlay. */
    frame(): AutoMoviePhysicsCache.IFrame;

    /** Release the scene. */
    dispose(): void;
  }
}
