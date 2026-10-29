import { frameTimes } from "@automovie/render";
import { DEFAULT_CHROME_EXECUTABLE } from "@automovie/render/node/chrome";
import { createViewerCaptureSession } from "@automovie/viewer/node";
import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { once } from "node:events";
import { finished } from "node:stream/promises";
import { createWriteStream } from "node:fs";
import { mkdir, readFile, readdir, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { chromium } from "playwright";

const root = path.resolve(import.meta.dirname, "..");
const film = JSON.parse(
  await readFile(path.join(root, "public/film.json"), "utf8"),
);
const repository=path.resolve(root,"../..");
const outputs=path.join(root,"public/outputs/episode-one");
await mkdir(outputs,{recursive:true});
const legacy=(await readdir(outputs,{withFileTypes:true})).filter(entry=>entry.isFile()&&entry.name!=="latest.json");
if(legacy.length){const destination=path.join(outputs,"legacy-first-round");await mkdir(destination,{recursive:true});for(const entry of legacy)await rename(path.join(outputs,entry.name),path.join(destination,entry.name));await writeFile(path.join(destination,"identity-limit.txt"),"These first-round observations predate retained runtime source identities. The screenplay SHA does not identify the executed implementation. Do not renew their claims against a later source revision.\n");}
const sourceFiles=["index.html","package.json","tsconfig.json","vite.config.ts","vite.capture.config.ts","scripts/capture.ts","scripts/prepare-film.py","public/film.json","public/audio/001-road/takes.json","public/audio/001-road/episode-mix.wav",".capture/capture.mjs"].map(file=>path.join(root,file));
for(const directory of [path.join(root,"src"),... ["engine","interface","viewer","render"].map(name=>path.join(repository,"packages",name,"src"))]){for(const file of await readdir(directory,{recursive:true}))if(/\.(?:ts|css)$/.test(file))sourceFiles.push(path.join(directory,file));}
const takes=JSON.parse(await readFile(path.join(root,"public/audio/001-road/takes.json"),"utf8"));for(const take of takes.takes)sourceFiles.push(path.join(root,"public/audio/001-road",take.file));
sourceFiles.push(path.join(repository,"pnpm-lock.yaml"));
sourceFiles.sort((a,b)=>a.localeCompare(b,"en"));
const fingerprint=async()=>{const files=[];for(const file of sourceFiles){const bytes=await readFile(file);files.push({path:path.relative(repository,file).split(path.sep).join("/"),bytes:bytes.length,sha256:createHash("sha256").update(bytes).digest("hex")});}return files;};
const inputs=await fingerprint();const runtimeIdentity=createHash("sha256").update(JSON.stringify(inputs)).digest("hex");
const run=`${new Date().toISOString().replace(/[:.]/g,"-")}-${runtimeIdentity.slice(0,12)}`;
const output=path.join(outputs,"runs",run);await mkdir(output,{recursive:true});
await writeFile(path.join(output,"baseline.json"),JSON.stringify({run,runtimeIdentity,inputs,profile:{width:film.width,height:film.height,fps:film.fps,frames:film.frames,duration:film.duration},audioAcceptance:"candidate-unheard"},null,2));
const browser = await chromium.launch({
  executablePath: DEFAULT_CHROME_EXECUTABLE,
  headless: true,
  args: ["--use-angle=d3d11", "--ignore-gpu-blocklist", "--enable-webgl"],
});
const page = await browser.newPage({
  viewport: { width: 1280, height: 720 },
  deviceScaleFactor: 1,
});
const errors: string[] = [];
const served:{url:string;sha256:string}[]=[];const pending:Promise<void>[]=[];
page.on("response",response=>{if(response.request().resourceType()==="script"||response.request().resourceType()==="stylesheet")pending.push(response.body().then(bytes=>{served.push({url:response.url(),sha256:createHash("sha256").update(bytes).digest("hex")});}));});
page.on("pageerror", (error) => errors.push(error.message));
const session = await createViewerCaptureSession({
  page,
  url: "http://127.0.0.1:5187/?capture",
  passes: ["beauty"],
  hideSelector: null,
});
await page.waitForFunction(() => Reflect.get(window, "__afReady") === true);
const observations: unknown[] = [];
const inspect = async () => ({runtimeIdentity,...await page.evaluate(() => Reflect.get(window, "__afInspect")())});
const probe = process.argv.includes("--probe");
try {
  if (probe) {
    const hashes = new Map<number, string>();
    for (const shot of film.shots) {
      for (const [label, local] of [
        ["entry", 0],
        ["middle", Math.min(4, shot.duration / 2)],
        ["exit", shot.duration - 1 / film.fps],
      ] as const) {
        const t = shot.start + local;
        await session.capture(t, async (_pass, bytes) => {
          await writeFile(
            path.join(output, `probe-${shot.id}-${label}.png`),
            bytes,
          );
          hashes.set(t, createHash("sha256").update(bytes).digest("hex"));
        });
        observations.push({ ...(await inspect()), sample: label });
      }
    }
    const replay = [];
    for (const shot of [...film.shots].reverse()) {
      const t = shot.start + Math.min(4, shot.duration / 2);
      let hash = "";
      await session.capture(t, async (_pass, bytes) => {
        hash = createHash("sha256").update(bytes).digest("hex");
      });
      replay.push({
        shot: shot.id,
        time: t,
        identical: hash === hashes.get(t),
      });
    }
    const ui = await browser.newPage({
      viewport: { width: 1440, height: 1040 },
    });
    await ui.goto("http://127.0.0.1:5187/");
    await ui.bringToFront();
    await ui.waitForFunction(() => Reflect.get(window, "__afReady") === true);
    await ui.locator("#play").click();
    await ui.waitForFunction(
      () => Reflect.get(window, "__afInspect")().time > 0.2,
      null,
      { timeout: 20000 },
    );
    const playing = await ui.evaluate(() => ({
      time: Reflect.get(window, "__afInspect")().time,
      paused: (document.getElementById("audio") as HTMLAudioElement).paused,
    }));
    await ui.locator("#play").click();
    const paused = await ui.evaluate(
      () => Reflect.get(window, "__afInspect")().time,
    );
    await ui.waitForTimeout(250);
    const held = await ui.evaluate(
      () => Reflect.get(window, "__afInspect")().time,
    );
    await ui.locator("#seek").focus();
    await ui.keyboard.press("End");
    const seekEnd = await ui.evaluate(() =>
      Reflect.get(window, "__afInspect")(),
    );
    await ui.locator("#orbit").focus();
    await ui.keyboard.press("Home");
    const orbit = await ui.evaluate(() => Reflect.get(window, "__afInspect")());
    await ui.locator("#reset").click();
    const reset = await ui.evaluate(() => Reflect.get(window, "__afInspect")());
    await ui.screenshot({ path: path.join(output, "viewer-controls.png") });
    await ui.close();
    await writeFile(
      path.join(output, "probe-observations.json"),
      JSON.stringify(
        {
          observations,
          replay,
          controls: { playing, paused, held, seekEnd, orbit, reset },
          errors,
        },
        null,
        2,
      ),
    );
    if (replay.some((item) => !item.identical))
      throw new Error("History-dependent rendered seek detected");
    if (
      playing.paused ||
      playing.time <= 0 ||
      paused !== held ||
      seekEnd.time < (film.frames - 2) / film.fps
    )
      throw new Error("Interactive playback controls failed");
  } else {
    const ffmpeg =
      process.env.FFMPEG ??
      "D:/github/samchon/.automovie-runtime/voxcpm/Lib/site-packages/imageio_ffmpeg/binaries/ffmpeg-win-x86_64-v7.1.exe";
    const encoder = spawn(
      ffmpeg,
      [
        "-y",
        "-f",
        "image2pipe",
        "-vcodec",
        "png",
        "-framerate",
        String(film.fps),
        "-i",
        "pipe:0",
        "-i",
        path.join(root, "public/audio/001-road/episode-mix.wav"),
        "-map",
        "0:v:0",
        "-map",
        "1:a:0",
        "-c:v",
        "libx264",
        "-preset",
        "fast",
        "-crf",
        "19",
        "-pix_fmt",
        "yuv420p",
        "-c:a",
        "aac",
        "-b:a",
        "192k",
        "-movflags",
        "+faststart",
        path.join(output, "the-road-gives-way.mp4"),
      ],
      { stdio: ["pipe", "ignore", "pipe"] },
    );
    const log = createWriteStream(path.join(output, "encode.log"));
    const completion = once(encoder, "exit");
    const logCompletion = finished(log);
    encoder.stderr.pipe(log);
    let failure: Error | undefined;
    encoder.stdin.on("error", (error) => {
      failure = error;
    });
    const schedule = frameTimes(film.fps, film.duration);
    let frame = 0;
    for (const time of schedule) {
      if (failure) throw failure;
      await session.capture(time, async (_pass, bytes) => {
        if (!encoder.stdin.write(bytes)) await once(encoder.stdin, "drain");
      });
      if (frame % 240 === 0) {
        observations.push(await inspect());
        console.log(JSON.stringify({ frame, total: schedule.length, time }));
      }
      frame++;
    }
    encoder.stdin.end();
    const [code] = await completion;
    await logCompletion;
    if (code !== 0) throw new Error(`Encoder exited ${code}`);
    await writeFile(
      path.join(output, "capture-observations.json"),
      JSON.stringify(
        { frames: frame, observations, errors, completed: true },
        null,
        2,
      ),
    );
  }
  if (errors.length) throw new Error(errors.join("\n"));
  if(JSON.stringify(await fingerprint())!==JSON.stringify(inputs))throw new Error("Runtime inputs changed during this run; observations are not a frozen baseline");
  await Promise.all(pending);await writeFile(path.join(output,"completed.json"),JSON.stringify({run,runtimeIdentity,served,errors,completed:true},null,2));
  await writeFile(path.join(outputs,"latest.json"),JSON.stringify({run,runtimeIdentity,path:path.relative(root,output).split(path.sep).join("/"),kind:probe?"inspection":"complete-capture"},null,2));
  console.log(JSON.stringify({run,runtimeIdentity,output}));
} catch(error) {
  await writeFile(path.join(output,"failed.json"),JSON.stringify({run,runtimeIdentity,error:String(error),errors},null,2));throw error;
} finally {
  await session.close();
  await browser.close();
}
