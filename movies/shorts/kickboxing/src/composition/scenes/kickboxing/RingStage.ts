import {
  preparePhysicalGeometry,
  Quaternion,
  Vector3,
  type AutoMovieComposition,
  type AutoMoviePhysicsCache,
  type IAutoMovieSchedule,
} from "@automovie/engine";
import type {
  IAutoMovieVector3,
  IAutoMoviePhysicalProfile as P,
} from "@automovie/interface";
import { resolveAutoMovieHumanCalibration } from "@automovie/human";
import { createAutoMovieHttpArtifactStore } from "@automovie/render";
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
import { RefereeBody } from "../../../entities/cast/referee/RefereeBody";
import type { RefereeFigure } from "../../../entities/cast/referee/RefereeFigure";
import { RingLights } from "../../../entities/lights/ring-lights/RingLights";
import { Bell } from "../../../entities/props/bell/Bell";
import { Ring } from "../../../entities/sets/ring/Ring";
import { CameraTrack } from "../../../interactions/cinematography/CameraTrack";
import { FinishSight } from "../../../interactions/cinematography/FinishSight";
import { BoutLaws } from "../../../interactions/kickboxing/BoutLaws";
import { BoutPerformance } from "../../../interactions/kickboxing/BoutPerformance";
import { PictureMeasures } from "../../../interactions/kickboxing/PictureMeasures";
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

  /**
   * Build the cast from the settings.
   *
   * @param calibrations Human's body calibrations of the fighters' shared controls and the referee's, read from the artifact store; each body calibrates itself when its entry is absent.
   */
  public constructor(calibrations: RingStage.ICalibrations = {}) {
    const a: Fighter = new Fighter(
      fighterA,
      undefined,
      undefined,
      calibrations.fighter,
    );
    this.cast = Object.freeze({
      a,
      b: new Fighter(fighterB, a),
      referee: new Referee(undefined, calibrations.referee),
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
    const schedule: IAutoMovieSchedule = BoutLaws.resolve(
      cast,
      composition,
      seed,
    );
    const violations: string[] = BoutLaws.check(schedule);
    const queries = await preparePhysicalGeometry();
    const performance: BoutPerformance = new BoutPerformance(
      cast,
      schedule,
      queries,
    );
    progress?.("Resolving the referee and camera");
    const referee: RefereeTrack.ITrack = RefereeTrack.resolve(
      cast,
      schedule,
      duration,
    );
    const sight: FinishSight.Reader = FinishSight.colliders(
      cast,
      schedule,
      referee,
      performance,
      queries,
    );
    const camera: CameraTrack.ISample[] = CameraTrack.resolve(
      cast,
      schedule,
      referee,
      duration,
      sight,
    );
    // The visibility law's audit on the delivered lens and the displayed colliders.
    const finishing = CameraTrack.strike(schedule);
    const watched = finishing ? sight(finishing) : undefined;
    const clearance: number | undefined = watched
      ? CameraTrack.clearance(camera, watched)
      : undefined;
    const framing: number | undefined = watched
      ? CameraTrack.framing(camera, watched)
      : undefined;
    progress?.("Measuring contacts");
    const measured = ContactReceipts.measure(
      cast,
      schedule,
      performance,
      queries,
    );
    const points: Record<string, IAutoMovieVector3> = {};
    for (const r of measured.receipts) {
      const receiver: Fighter = r.receiver === cast.a.id ? cast.a : cast.b;
      const region = receiver.body.regions[r.region]!;
      const s: P.ITransform = performance.at(r.seconds)[r.receiver]!.segments[
        region.bone
      ]!;
      points[r.anchor] = Vector3.add(
        s.position,
        Quaternion.rotateVector(s.rotation, region.localPoint),
      );
    }
    progress?.("Measuring the picture");
    const picture: Record<string, number> = PictureMeasures.displayed(
      cast,
      schedule,
      performance,
      camera,
      duration,
    );
    const cues: SoundCues.ICue[] = SoundCues.of(
      seed,
      schedule,
      measured.receipts,
      duration,
    );
    const scene: THREE.Scene = new THREE.Scene();
    scene.background = new THREE.Color(RingStage.BACKGROUND);
    const lights: RingLights = new RingLights();
    const ring = cast.ring.figure();
    const figures: Record<string, FighterFigure> = {
      [cast.a.id]: cast.a.figure(),
      [cast.b.id]: cast.b.figure(),
    };
    const official: RefereeFigure = cast.referee.figure();
    const spray: ImpactSpray = new ImpactSpray(seed, measured.receipts, points);
    scene.add(
      lights.object,
      ring.object,
      figures[cast.a.id]!.object,
      figures[cast.b.id]!.object,
      official.object,
      spray.object,
    );
    const view: THREE.PerspectiveCamera = cast.camera.camera;
    let last: Record<string, Record<string, P.ITransform>> = {};
    let shown: number = 0;
    const seek = (seconds: number): void => {
      shown = seconds;
      const bodies = performance.at(seconds);
      for (const fighter of [cast.a, cast.b]) {
        const body = bodies[fighter.id]!;
        figures[fighter.id]!.place(
          fighter.body.complete(body.output, body.root, body.segments),
          { jaw: body.jaw, wince: body.wince },
          ImpactMarks.at(measured.receipts, fighter.id, seconds),
        );
      }
      const placed = RefereePerformance.at(cast, schedule, referee, seconds);
      official.place(placed.output, placed.root, placed.jaw);
      spray.place(seconds);
      const shot = CameraTrack.at(camera, seconds);
      view.position.set(shot.position.x, shot.position.y, shot.position.z);
      view.lookAt(shot.target.x, shot.target.y, shot.target.z);
      view.updateProjectionMatrix();
      last = {
        [cast.a.id]: bodies[cast.a.id]!.segments,
        [cast.b.id]: bodies[cast.b.id]!.segments,
        [cast.referee.id]: placed.segments,
      };
      scene.updateMatrixWorld(true);
    };
    // Everything `seek` places at a second, read without placing it: the
    // fighters' poses, marks and faces, the referee, the droplets and the lens.
    const digest = (seconds: number): string => {
      const bodies = performance.at(seconds);
      const official = RefereePerformance.at(cast, schedule, referee, seconds);
      return JSON.stringify({
        fighters: [cast.a, cast.b].map((fighter: Fighter) => {
          const body = bodies[fighter.id]!;
          return {
            pose: body.pose,
            root: body.root,
            segments: body.segments,
            jaw: body.jaw,
            wince: body.wince,
            marks: ImpactMarks.at(measured.receipts, fighter.id, seconds),
          };
        }),
        referee: {
          root: official.root,
          segments: official.segments,
          jaw: official.jaw,
        },
        spray: spray.visible(seconds),
        camera: CameraTrack.at(camera, seconds),
      });
    };
    seek(0);
    return {
      digest,
      scene,
      camera: view,
      schedule,
      violations,
      findings: [
        ...measured.findings.map((finding: string): string => {
          const receipt = measured.receipts.find((r) =>
            finding.startsWith(`${r.anchor}:`),
          );
          return receipt
            ? `${finding}; closest ${receipt.separation.toFixed(3)} m at ${receipt.seconds.toFixed(3)} s`
            : finding;
        }),
        ...(clearance !== undefined && !(clearance > 0)
          ? [
              `${finishing!.intent.anchor}: occluded from the delivered camera by ${(-clearance).toFixed(3)} m`,
            ]
          : []),
        ...(framing !== undefined && !(framing > 0)
          ? [
              `${finishing!.intent.anchor}: outside the delivered frame by ${(-framing).toFixed(3)}`,
            ]
          : []),
      ],
      measures: {
        ...picture,
        "foreground-overlap": SoundCues.overlap(
          cues.filter((c) => c.asset !== SoundCues.BED),
        ),
        ...(clearance === undefined || framing === undefined
          ? {}
          : { "finish-clearance": clearance, "finish-in-frame": framing }),
      },
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
            Object.fromEntries(
              Object.entries(segments).map(([bone, t]) => [
                bone,
                {
                  ...t,
                  velocity: { x: 0, y: 0, z: 0 },
                  angularVelocity: { x: 0, y: 0, z: 0 },
                },
              ]),
            ),
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

  /**
   * Human's body calibrations of the cast, read from the development
   * server's artifact store under the digest of Human's source (computed and
   * stored on a miss), with that Human package identity the frame digest
   * carries. Outside the development server, nothing: every body calibrates
   * itself and the page publishes no frame digest.
   *
   * @returns The calibrations and the Human package's source digest.
   */
  public static async calibrate(): Promise<{
    calibrations: RingStage.ICalibrations;
    source?: string;
  }> {
    const response: Response | undefined = await fetch(
      RingStage.SOURCES,
    ).catch((): undefined => undefined);
    if (!response?.ok) return { calibrations: {} };
    const sources = (await response.json()) as {
      human: string;
      production: string;
    };
    const options = {
      store: createAutoMovieHttpArtifactStore(RingStage.ARTIFACTS),
      toolchain: { "@automovie/human#src": sources.human },
    };
    const [fighter, referee] = await Promise.all([
      resolveAutoMovieHumanCalibration(fighterA.parameters, options),
      resolveAutoMovieHumanCalibration(RefereeBody.PARAMETERS, options),
    ]);
    return { calibrations: { fighter, referee }, source: sources.human };
  }

  /** The development server's artifact store. */
  public static readonly ARTIFACTS: string = "/__automovie/artifacts";

  /** The development server's source digests of Human and this production. */
  public static readonly SOURCES: string = "/__automovie/sources";

  /** The soundtrack's assets. */
  public static readonly SOUND: Readonly<Record<string, string>> =
    SoundAssets.paths;

  /** Arena darkness behind the ring. */
  public static readonly BACKGROUND: number = 0x0b0e14;
}

/** Companion types of {@link RingStage}. */
export namespace RingStage {
  /** Human's body calibrations the cast is built from. */
  export interface ICalibrations {
    /** The fighters' shared body controls. */
    fighter?: Awaited<ReturnType<typeof resolveAutoMovieHumanCalibration>>;

    /** The referee's body controls. */
    referee?: Awaited<ReturnType<typeof resolveAutoMovieHumanCalibration>>;
  }

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

    /** Outcome audit findings against the measured contacts, and the finish's visibility audit. */
    findings: string[];

    /** Named measurements of the mount, such as the finish's sight clearance in metres. */
    measures: Record<string, number>;

    /** Measured contacts. */
    receipts: ContactReceipts.IReceipt[];

    /** The soundtrack's cues. */
    cues: SoundCues.ICue[];

    /** Place everything for a second. */
    seek(seconds: number): void;

    /** The state `seek` would place at a second, as text, without placing it: the frame digest's input. */
    digest(seconds: number): string;

    /** Bodies for the review overlay. */
    bodies: { id: string; profile: P }[];

    /** The displayed segments for the review overlay. */
    frame(): AutoMoviePhysicsCache.IFrame;

    /** Release the scene. */
    dispose(): void;
  }
}
