import { mountViewer } from "@automovie/viewer";
import * as THREE from "three";

import type { Film } from "./film.ts";
import { locate } from "./film.ts";
import { Staging } from "./staging.ts";
import "./style.css";

const element = <T extends HTMLElement>(id: string): T => {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing host element ${id}`);
  return node as T;
};
const film: Film = await fetch("/film.json").then((r) => {
  if (!r.ok) throw new Error("Missing frozen film edit");
  return r.json();
});
if (new URLSearchParams(location.search).has("capture"))
  document.body.classList.add("capture");
const scene = new THREE.Scene();
scene.add(new THREE.HemisphereLight("#e9e6dc", "#4f5f6f", 2.4));
const sun = new THREE.DirectionalLight("#ffe8bd", 2.8);
sun.position.set(-3, 8, 6);
scene.add(sun);
const camera = new THREE.PerspectiveCamera(38, 16 / 9, 0.08, 180);
const staging = new Staging(scene, camera, film);
const canvas = element<HTMLCanvasElement>("canvas"),
  audio = element<HTMLAudioElement>("audio"),
  seek = element<HTMLInputElement>("seek"),
  orbit = element<HTMLInputElement>("orbit");
const play = element<HTMLButtonElement>("play"),
  select = element<HTMLSelectElement>("shots"),
  status = element<HTMLParagraphElement>("status");
audio.src = film.audio;
seek.max = String(film.duration);
const download = element<HTMLAnchorElement>("download");
download.href = film.audio;
let current = 0,
  playing = false,
  inspection = 0;
const titles: Record<string, string> = {
  road: "01 · AN ARMY CLEARS THE ROAD",
  letter: "02 · A LETTER REQUESTED BY THREE MEN",
  plans: "03 · THE HEIGHTS LEFT EMPTY",
  night: "04 · A NIGHT ON STRAW, A NIGHT ON THE ROAD",
  battle: "05 · WHILE THE VILLAGES HOLD",
  victory: "06 · EMPTY PLACES IN THE VICTORIOUS ARMY",
};
const qualifications: Record<string, string> = {
  writing:
    "Reconstruction based on Subervie's account, recorded later by Thiébault.",
  wine: "A reconstruction of the night from Lejeune's later account.",
  eagle: "Sequence based on Rapp's later memoir.",
  guard: "Sequence based on Rapp's later memoir.",
};
for (const shot of film.shots) {
  const option = document.createElement("option");
  option.value = String(shot.start);
  option.textContent = `${shot.unit} / ${shot.id}`;
  select.append(option);
}
/**
 * Draw the requested output instant and publish the original native completion.
 * Seconds are finite and nonnegative. Explicit seek renders before completion;
 * ordinary playback follows the actual retained PCM media clock.
 */
function draw(seconds: number): void {
  const { shot, local, time } = locate(film, seconds);
  current = time;
  staging.frame(shot, local, inspection);
  element("chapter").textContent =
    shot.id === "cart"
      ? "NAPOLEON: IMPERATOR · THE ROAD GIVES WAY"
      : titles[shot.unit]!;
  element("place").textContent = shot.caption;
  element("qualification").textContent = qualifications[shot.id] ?? "";
  const cue = film.cues.find((c) => time >= c.start && time < c.end);
  const subtitle = element("subtitle");
  subtitle.replaceChildren();
  if (cue && cue.speaker !== "AUTHOR") {
    const label = document.createElement("strong");
    label.textContent = cue.speaker;
    subtitle.append(label, document.createTextNode(cue.text));
  }
  const plate = element("plate");
  plate.style.display = shot.id === "author" ? "block" : "none";
  if (shot.id === "author") {
    const author = film.cues.find((c) => c.speaker === "AUTHOR")!;
    plate.replaceChildren();
    const heading = document.createElement("h1");
    heading.textContent = "Author's Commentary";
    const p = document.createElement("p");
    p.textContent = author.text;
    plate.append(heading, p);
  }
  element("fade").style.opacity =
    shot.id === "straw"
      ? String(Math.max(0, (local - shot.duration + 1.5) / 1.5))
      : shot.id === "silence"
        ? "1"
        : "0";
  seek.value = String(time);
  element("clock").textContent =
    `${Math.floor(time / 60)}:${String(Math.floor(time % 60)).padStart(2, "0")} / ${Math.floor(film.duration/60)}:${String(Math.floor(film.duration%60)).padStart(2,"0")}`;
  select.value = String(shot.start);
}
const mounted = mountViewer(
  canvas,
  scene,
  camera,
  () => {
    draw(playing ? Math.min(audio.currentTime, film.duration) : current);
  },
  { pixelRatio: 1, antialias: true, preserveDrawingBuffer: true },
);
mounted.renderer.outputColorSpace = THREE.SRGBColorSpace;
mounted.renderer.toneMapping = THREE.ACESFilmicToneMapping;
mounted.renderer.toneMappingExposure = 1;
function redraw(): void {
  draw(current);
  mounted.renderer.render(scene, camera);
  mounted.completeFrame(current);
}
function pause(): void {
  playing = false;
  audio.pause();
  play.textContent = "Play";
}
play.addEventListener("click", () => {
  if (playing) {
    pause();
    return;
  }
  audio.currentTime = current;
  void audio
    .play()
    .then(() => {
      playing = true;
      play.textContent = "Pause";
    })
    .catch((error) => {
      status.textContent = `Audio playback failed: ${String(error)}`;
    });
});
seek.addEventListener("input", () => {
  current = Number(seek.value);
  audio.currentTime = current;
  redraw();
});
select.addEventListener("change", () => {
  current = Number(select.value);
  audio.currentTime = current;
  redraw();
});
orbit.addEventListener("input", () => {
  inspection = Number(orbit.value);
  redraw();
});
element("reset").addEventListener("click", () => {
  inspection = 0;
  orbit.value = "0";
  redraw();
});
audio.addEventListener("ended", () => {
  pause();
  current = (film.frames - 1) / film.fps;
  redraw();
});
window.addEventListener("resize", () => {
  mounted.renderer.setSize(canvas.clientWidth, canvas.clientHeight, false);
  camera.aspect = canvas.clientWidth / canvas.clientHeight;
  camera.updateProjectionMatrix();
  redraw();
});
const context = mounted.renderer.getContext();
const debug = context.getExtension("WEBGL_debug_renderer_info");
const renderer = debug
  ? context.getParameter(debug.UNMASKED_RENDERER_WEBGL)
  : context.getParameter(context.RENDERER);
Object.assign(window, {
  __afSeek: (sample: number | { time: number }) => {
    pause();
    inspection = 0;
    orbit.value = "0";
    current = typeof sample === "number" ? sample : sample.time;
    redraw();
  },
  __afInspect: () => ({
    time: current,
    shot: locate(film, current).shot.id,
    sourceSha256: film.sourceSha256,
    camera: {
      position: camera.position.toArray(),
      quaternion: camera.quaternion.toArray(),
      fov: camera.fov,
    },
    renderer,
    size: [canvas.width, canvas.height],
    actors: staging.actors.map((a) => ({
      name: a.name,
      position: a.root.position.toArray(),
      quaternion: a.root.quaternion.toArray(),
      parts: a.root.children.length,
      clamped: a.clamped,
      joints: a.points.map((p) => p.toArray()),
    })),
    calls: mounted.renderer.info.render.calls,
    triangles: mounted.renderer.info.render.triangles,
  }),
  __afFilm: film,
});
redraw();
status.textContent = `Viewer ready · ${film.shots.length} programmed shots · ${film.cues.length} fixed VoxCPM takes · ${renderer} · Candidate soundtrack has not received listening acceptance.`;
Object.assign(window, { __afReady: true });
window.addEventListener("pagehide", () => {
  pause();
  mounted.stop();
});
