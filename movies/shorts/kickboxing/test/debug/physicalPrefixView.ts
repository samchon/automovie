import type { AutoMoviePhysicsCache as Cache } from "@automovie/engine";
import { type IAutoMovieViewerHandle, mountViewer } from "@automovie/viewer";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

import { FilmActor } from "../../src/assets/person/FilmActor";
import { createPersonParameters } from "../../src/assets/person/createPersonParameters";
import { createKickboxingScene } from "../../src/films/createKickboxingScene";
import { FighterBody } from "../../src/motion/fighter/FighterBody";
import { BoutTargetSource } from "../../src/physics/BoutTargetSource";
import { FilmTransport } from "../../src/runtime/FilmTransport";
import type { FilmPlan } from "../../src/shots/kickboxing/ring-bout/FilmPlan";
import { MovieAudio } from "../../src/sound/MovieAudio";

/** Mount the actual film actors and stage against an explicitly unaccepted completed prefix. No dynamics are rerun and no archive identity is synthesized. */
async function main(): Promise<void> {
  const params: URLSearchParams = new URLSearchParams(location.search);
  const file: string = params.get("file") ?? "native-prefix-round89.json";
  if (!/^native-[a-z0-9-]+\.json$/.test(file))
    throw new Error("Expected a captured native data filename");
  const response: Response = await fetch(`/.cache/physical/${file}`);
  if (!response.ok) throw new Error("No captured running-simulation prefix");
  const snapshot: { frames: Cache.IFrame[]; step: number } =
    await response.json();
  const offset: number = Number(params.get("offset"));
  if (!Number.isFinite(offset) || !snapshot.frames.length)
    throw new Error("Expected actual simulation start and completed frames");
  const source: BoutTargetSource = new BoutTargetSource();
  const actors: Record<FilmPlan.ActorId, FilmActor> = {
    a: new FilmActor("a", source.rigs.a, createPersonParameters(1800, true)),
    b: new FilmActor("b", source.rigs.b, createPersonParameters(1800, true)),
    referee: new FilmActor(
      "referee",
      source.rigs.referee,
      createPersonParameters(1780, false),
    ),
  };
  const stage: createKickboxingScene.IStage = createKickboxingScene();
  for (const actor of Object.values(actors)) {
    stage.scene.add(actor.person.object);
    actor.showRig();
  }
  const canvas: HTMLCanvasElement = element<HTMLCanvasElement>("view");
  const controls: OrbitControls = new OrbitControls(stage.camera, canvas);
  controls.enabled = false;
  controls.target.copy(stage.target(offset));
  const hidden: Map<THREE.Mesh, boolean> = new Map();
  const audio: MovieAudio = new MovieAudio();
  const transport: FilmTransport = new FilmTransport(audio, place);
  transport.sound = false;
  const viewer: IAutoMovieViewerHandle = mountViewer(
    canvas,
    stage.scene,
    stage.camera,
    (): boolean => {
      if (transport.tick()) return true;
      if (controls.enabled) {
        controls.update();
        draw();
      }
      return true;
    },
    { pixelRatio: 1, preserveDrawingBuffer: true },
  );
  const end: number = offset + snapshot.frames.at(-1)!.seconds;
  transport.interval = [offset, end];
  const seek: HTMLInputElement = element<HTMLInputElement>("seek");
  seek.min = String(offset);
  seek.max = String(end);
  seek.oninput = (): void => transport.seek(Number(seek.value));
  element<HTMLButtonElement>("play").onclick = (): void => {
    void transport.play().catch(fail);
  };
  element<HTMLButtonElement>("pause").onclick = (): void => transport.pause();
  element<HTMLButtonElement>("film").onclick = (): void => {
    controls.enabled = false;
    element<HTMLInputElement>("orbit").checked = false;
    place(transport.seconds);
  };
  element<HTMLInputElement>("orbit").onchange = (): void => {
    controls.enabled = element<HTMLInputElement>("orbit").checked;
    controls.target.copy(stage.target(transport.seconds));
  };
  element<HTMLSelectElement>("mode").onchange = (): void =>
    place(transport.seconds);
  Reflect.set(window, "__physicalPrefix", {
    seek: (seconds: number): void => transport.seek(seconds),
    view: (
      position: [number, number, number],
      target: [number, number, number],
    ): void => {
      controls.enabled = true;
      element<HTMLInputElement>("orbit").checked = true;
      stage.camera.position.set(...position);
      controls.target.set(...target);
      controls.update();
      draw();
    },
    inspect: (): object => ({
      ready: true,
      seconds: transport.seconds,
      start: offset,
      end,
      nativeIntervals: snapshot.frames.length - 1,
      accepted: false,
    }),
  });
  Reflect.set(window, "__afSeek", (local: number): void =>
    transport.seek(offset + local),
  );
  transport.seek(offset);
  element<HTMLElement>("status").textContent =
    `Unaccepted running-simulation prefix: ${offset.toFixed(3)}–${end.toFixed(3)} s. Original polygon actors, stage and camera; silent inspection only.`;
  window.addEventListener(
    "beforeunload",
    (): void => {
      transport.pause();
      viewer.stop();
      controls.dispose();
      audio.dispose();
      for (const actor of Object.values(actors)) actor.dispose();
      stage.dispose();
    },
    { once: true },
  );

  /** Place only completed native frames through the production's real actor adapter. */
  function place(seconds: number): void {
    const index: number = Math.max(
      0,
      Math.min(
        snapshot.frames.length - 1,
        Math.round((seconds - offset) * 120),
      ),
    );
    const frame: Cache.IFrame = snapshot.frames[index]!;
    const intent: ReturnType<BoutTargetSource["frames"]> = source.frames(
      offset + frame.seconds,
    );
    const mode: string = element<HTMLSelectElement>("mode").value;
    for (const [mesh, visible] of hidden) mesh.visible = visible;
    hidden.clear();
    for (const id of ["a", "b", "referee"] as const) {
      actors[id].physical(frame.bodies[id]!, FighterBody.pose(intent[id]));
      actors[id].showRig(mode !== "surface");
      if (mode === "skeleton")
        actors[id].person.object.traverse((object: THREE.Object3D): void => {
          if (object instanceof THREE.Mesh) {
            hidden.set(object, object.visible);
            object.visible = false;
          }
        });
    }
    if (!controls.enabled) stage.placeCamera(seconds);
    seek.value = String(seconds);
    element<HTMLOutputElement>("time").value = seconds.toFixed(3);
    draw(seconds);
  }

  /** Publish only the original draw and its actual film clock. */
  function draw(seconds?: number): void {
    viewer.renderer.render(stage.scene, stage.camera);
    viewer.completeFrame(seconds);
  }
}

/** Owned inspection controls fail rather than silently dropping a required guide. */
function element<T extends HTMLElement>(id: string): T {
  const found: HTMLElement | null = document.getElementById(id);
  if (!found) throw new Error("Missing prefix control: " + id);
  return found as T;
}

/** Keep inspection failure visible and separate from the operational film. */
function fail(error: unknown): void {
  element<HTMLElement>("status").textContent = String(error);
}

void main().catch(fail);
