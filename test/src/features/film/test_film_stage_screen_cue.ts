import {
  Quaternion,
  cutSequence,
  renderProductionSound,
  sequenceEventTimeline,
} from "@automovie/engine";
import type {
  IAutoMovieCut,
  IAutoMovieInteractionEvent,
  IAutoMoviePlaybackEvent,
  IAutoMovieRenderSpec,
  IAutoMovieRigidTransform,
  IAutoMovieSequenceRenderFrame,
  IAutoMovieShot,
  IAutoMovieVector3,
} from "@automovie/interface";
import { HumanObject, type HumanPerformance } from "@automovie/motions";
import {
  type IAutoMovieEffectViewerObject,
  type IAutoMovieModelObject,
  buildInstancedEffect,
  buildModel,
  collectAutoMovieOwnedResources,
  renderSequenceAndSee,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { filmEffectValuesClose } from "../internal/filmEffectValuesClose";
import { nclose, vclose } from "../internal/predicates";
import { filmStageScreenCue } from "./filmStageScreenCue";

/** Film-source marks bound to the authored fixture. */
const {
  CONTACT,
  RELEASE,
  FPS,
  panel,
  rehearse,
  flash,
}: typeof filmStageScreenCue = filmStageScreenCue;
const AUDIO_HZ: number = 48_000;
type Panel = filmStageScreenCue.Panel;

/** Values read from actual posed and built scene state in one capture. */
interface IRead {
  /** Output frame and source second. */
  frame: number;
  source: number;

  /** Native displayed part ids on each placed model and fragment. */
  parts: readonly { ids: readonly string[]; at: IAutoMovieVector3 }[];

  /** Positions read from the renderer's exposed instance matrices. */
  particles: readonly IAutoMovieVector3[];

  /** The sampled point light and on-camera head turn. */
  glow: number;
  head: number;

  /** Stereo sample on the same output clock, left channel. */
  sound: number;
}

/**
 * Film playback of a foam rehearsal token and a decorative breakaway panel.
 *
 * Scenarios:
 *
 * 1. In the wide shot the panel is whole. The next camera enters at the contact,
 *    displaying its detached tile, a local glow and a short sound.
 * 2. The performer reacts two frames after the contact. Subsequent capture reads
 *    show the tile departing, while the same panel remains in place.
 * 3. In the alternate take the token passes the panel. The panel stays whole, the
 *    response remains at rest and the contact layer is silent.
 * 4. Reversed and repeated reads through the same native scene settle to the same
 *    matrices, head angles, sample positions and video clock.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Specifies the two theatrical outcomes, visible edit, exact clock and reverse capture.
 * @evidence contracts/development/testing.md#behavioral-verification Runs the public motion, editorial, capture, particle display and PCM mix entry points. Capture observes generated model parts, native billboard matrices, actual pose, light intensity and audio samples.
 * @evidence contracts/development/testing.md#independent-expectations The literal source marks .25/.5 and 7/12 place the cue at output frame 0, contact at 6 and response at 8. The scenery face stands at z -.5; the visual effect belongs to that site, and 12,000 is the independently expected output sample for the contact sound.
 * @evidence contracts/development/testing.md#distinguishing-cases Includes contact and pass, outgoing and incoming camera, tile visible at contact, onset before response, audible sample and reversed/repeated frame observations.
 * @evidence contracts/development/testing.md#execution-ownership This async entry runs public sequence capture using an in-memory host. It captures the actual draw objects' transforms and buffers without requiring a GPU or writing a video.
 */
export async function test_film_stage_screen_cue(): Promise<void> {
  await verifyTake(true);
  await verifyTake(false);
}

/**
 * Collect one full capture route and re-read staged values by absolute source
 * time.
 */
async function verifyTake(contact: boolean): Promise<void> {
  const pane: Panel = panel();
  const placed: IAutoMovieRigidTransform = HumanObject.frame({
    at: { x: 0, y: 0, z: 0 },
    yaw: 0,
  });
  const performance: HumanPerformance = rehearse(pane, placed, contact);
  const collected: readonly IAutoMovieInteractionEvent[] =
    performance.hits("panel");
  TestValidator.equals(
    "only the contact take reaches the panel",
    collected.length,
    contact ? 1 : 0,
  );
  const hit: IAutoMovieInteractionEvent | undefined = collected[0];
  const fracture: ReturnType<typeof performance.fracture<Panel>> =
    hit === undefined
      ? null
      : performance.fracture({
          subject: "panel",
          hit: hit.id,
          model: pane,
          budget: { energy: 1, momentum: { x: 0, y: 0, z: 0 } },
        });
  TestValidator.predicate(
    "the contact has the authored second, a world point and a mounted remainder",
    contact
      ? hit !== undefined &&
          nclose(hit.time, CONTACT) &&
          hit.point !== null &&
          fracture !== null
      : hit === undefined && fracture === null,
  );
  const derive: (
    id: string,
    camera: string,
    duration: number,
    events: IAutoMovieInteractionEvent[],
  ) => IAutoMovieShot = (id, camera, duration, events): IAutoMovieShot => ({
    id,
    name: null,
    scene: "rehearsal-room",
    camera,
    cameraMotion: null,
    performances: [],
    objectMotions: [],
    duration,
    events,
  });
  const cue: IAutoMovieInteractionEvent = {
    id: "rehearsal-cue",
    kind: "release",
    source: "scriptedCue",
    time: RELEASE,
    actor: "performer",
    target: null,
    object: "foam-token",
    point: null,
    actionIndex: null,
    reaction: null,
  };
  const shots: IAutoMovieShot[] = [
    derive("wide", "wide-camera", CONTACT, [cue]),
    derive("detail", "detail-camera", 1, hit === undefined ? [] : [hit]),
  ];
  const cut: IAutoMovieCut = cutSequence(
    {
      sequence: { id: "screen-cue", name: "Foam scenery rehearsal" },
      fps: FPS,
      entries: [
        {
          shot: shots[0]!.id,
          trim: { start: RELEASE, duration: CONTACT - RELEASE },
          transition: null,
        },
        {
          shot: shots[1]!.id,
          trim: { start: CONTACT, duration: 0.5 },
          transition: null,
        },
      ],
      pacing: "Hold the wide through the setup, then observe the panel.",
      continuity: "The incoming angle continues the same source clock.",
      requiredEvents: [
        { entry: 0, event: cue.id },
        ...(hit === undefined ? [] : [{ entry: 1, event: hit.id }]),
      ],
    },
    shots,
  );
  if (!cut.success) throw new Error("The authored stage edit was refused.");
  const events: IAutoMoviePlaybackEvent[] = sequenceEventTimeline(
    cut.sequence,
    shots,
  );
  TestValidator.equals(
    "one cue per visible film occurrence",
    events.map(({ id }) => id),
    hit === undefined ? [cue.id] : [cue.id, hit.id],
  );
  TestValidator.predicate(
    "source trim puts the visible contact at output frame six",
    nclose(events[0]!.globalTime, 0) &&
      (hit === undefined || nclose(events[1]!.globalTime, 6 / FPS)),
  );
  // One film frame of a decaying click, mixed by the film's one mixer at the
  // contact frame; the alternate take has no cue and stays silent.
  const click: Float32Array = Float32Array.from(
    { length: AUDIO_HZ / FPS },
    (_: unknown, index: number): number =>
      index >= AUDIO_HZ / 25
        ? 0
        : 0.26 *
          Math.cos((index / AUDIO_HZ) * 2 * Math.PI * 190) *
          Math.exp((-7 * index) / (AUDIO_HZ / 25)),
  );
  const contactFrame: number | undefined =
    hit === undefined ? undefined : Math.round(events[1]!.globalTime * FPS);
  const audio: { left: Float32Array } =
    contactFrame === undefined
      ? { left: new Float32Array((3 * AUDIO_HZ) / 4) }
      : {
          left: ((pcm: Float32Array): Float32Array =>
            pcm.filter((_: number, index: number): boolean => index % 2 === 0))(
            renderProductionSound({
              plan: {
                version: 1,
                inputFingerprint: "test_film_stage_screen_cue",
                fps: FPS,
                totalFrames: (3 * FPS) / 4,
                sampleRate: 48_000,
                channels: 2,
                events: [],
                cues: [
                  {
                    id: "click",
                    asset: "click",
                    startFrame: contactFrame,
                    durationFrames: 1,
                    sourceOffsetFrame: 0,
                    sourceDurationFrames: 1,
                    gain: 1,
                    fadeInFrames: 0,
                    fadeOutFrames: 0,
                    bus: "effects",
                    seed: 0,
                  },
                ],
                dialogue: [],
              },
              assets: new Map([["click", click]]),
            }).pcm,
          ),
        };
  const spec: IAutoMovieRenderSpec = {
    target: cut.sequence.id,
    frameFormat: { fps: FPS, width: 384, height: 216 },
    toneMapping: "none",
    codec: "h264",
    pixelFormat: "yuv420p",
    crf: 20,
  };
  const hitPoint: IAutoMovieVector3 | null = hit?.point ?? null;
  const effect: IAutoMovieEffectViewerObject | undefined =
    hitPoint === null ? undefined : buildInstancedEffect(flash(hitPoint));
  const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
    45,
    16 / 9,
    0.01,
    30,
  );
  const light: THREE.PointLight = new THREE.PointLight("#ffbc6b", 0);
  if (hitPoint !== null) light.position.set(hitPoint.x, hitPoint.y, hitPoint.z);
  const built: Map<Panel, IAutoMovieModelObject> = new Map();
  const restingHead = performance
    .bones("observer", 0)
    .get("head")!.worldRotation;
  const captured: IAutoMovieSequenceRenderFrame[] = [];
  const data: IRead[] = [];

  /** Use shot-local seconds for actors and particles and output seconds for PCM. */
  function read(frame: IAutoMovieSequenceRenderFrame): IRead {
    const source: number = frame.shotTimeSeconds;
    camera.position.set(frame.shot === "wide" ? 4 : 2.2, 2, -4);
    camera.lookAt(0, 1, 0);
    const pieces = fracture?.at(source) ?? [
      { fragment: null, model: pane, frame: placed },
    ];
    const parts = pieces.map((piece): IRead["parts"][number] => {
      let display: IAutoMovieModelObject | undefined = built.get(piece.model);
      if (display === undefined) {
        display = buildModel(piece.model);
        built.set(piece.model, display);
      }
      const { position, rotation } = piece.frame;
      display.object.position.set(position.x, position.y, position.z);
      display.object.quaternion.set(
        rotation.x,
        rotation.y,
        rotation.z,
        rotation.w,
      );
      display.object.updateMatrixWorld(true);
      const origin: THREE.Vector3 = display.object.getWorldPosition(
        new THREE.Vector3(),
      );
      return {
        ids: [...display.parts.keys()],
        at: { x: origin.x, y: origin.y, z: origin.z },
      };
    });
    effect?.update(camera, source);
    light.intensity = effect?.stats.active === true ? 1.2 : 0;
    const particles: IAutoMovieVector3[] = [];
    const matrix: THREE.Matrix4 = new THREE.Matrix4();
    for (let i: number = 0; i < (effect?.object.count ?? 0); ++i) {
      effect!.object.getMatrixAt(i, matrix);
      particles.push({
        x: matrix.elements[12]!,
        y: matrix.elements[13]!,
        z: matrix.elements[14]!,
      });
    }
    return {
      frame: frame.index,
      source,
      parts,
      particles,
      glow: light.intensity,
      head:
        Quaternion.angle(
          restingHead,
          performance.bones("observer", source).get("head")!.worldRotation,
        ) *
        (180 / Math.PI),
      sound: audio.left[Math.round(frame.timeSeconds * AUDIO_HZ)]!,
    };
  }
  try {
    await renderSequenceAndSee({
      sequence: cut.sequence,
      shots,
      spec,
      frameDir: "frames",
      outputPath: "rehearsal.mp4",
      adapters: {
        captureFrame: async (frame): Promise<string> => {
          captured.push(frame);
          data.push(read(frame));
          return frame.path;
        },
        encode: async (_args, filename): Promise<string> => filename,
      },
    });
    const before: IRead = data[5]!;
    const cutIn: IRead = data[6]!;
    TestValidator.equals(
      "capture reads 18 output frames and two camera positions",
      [data.length, captured[5]!.shot, captured[6]!.shot],
      [18, "wide", "detail"],
    );
    TestValidator.equals(
      "unbroken parts in the outgoing camera",
      before.parts.map(({ ids }) => ids),
      [["base", "left-rail", "right-rail", "top", "tile"]],
    );
    TestValidator.equals(
      "the incoming camera displays the declared state",
      cutIn.parts.map(({ ids }) => ids),
      contact
        ? [["base", "left-rail", "right-rail", "top"], ["tile"]]
        : [["base", "left-rail", "right-rail", "top", "tile"]],
    );
    TestValidator.predicate(
      "visible event and PCM land at the same output instant",
      nclose(cutIn.source, CONTACT) &&
        before.particles.length === 0 &&
        before.sound === 0 &&
        (contact
          ? cutIn.particles.length === 3 &&
            cutIn.particles.every((point) =>
              vclose(point, hit!.point!, 0.004),
            ) &&
            cutIn.sound > 0.1 &&
            cutIn.glow > 0
          : cutIn.particles.length === 0 &&
            cutIn.sound === 0 &&
            cutIn.glow === 0),
    );
    TestValidator.predicate(
      "the tile and performer move after the contact only in that take",
      nclose(cutIn.head, 0) &&
        nclose(data[7]!.head, 0) &&
        (contact
          ? data[12]!.parts[1]!.at.y < cutIn.parts[1]!.at.y &&
            data[17]!.head > 10
          : data.every(
              (frame) =>
                frame.parts.length === 1 &&
                frame.particles.length === 0 &&
                frame.sound === 0 &&
                nclose(frame.head, 0),
            )),
    );
    TestValidator.predicate(
      "reverse and repeated captures reconstruct the same recorded frame",
      filmEffectValuesClose(
        [17, 3, 6, 12, 6, 0].map((index) => read(captured[index]!)),
        [17, 3, 6, 12, 6, 0].map((index) => data[index]!),
      ),
    );
  } finally {
    if (effect !== undefined) {
      for (const resource of collectAutoMovieOwnedResources(effect.object))
        resource.dispose();
      effect.object.dispose();
    }
    for (const model of built.values())
      for (const resource of collectAutoMovieOwnedResources(model.object))
        resource.dispose();
  }
}
