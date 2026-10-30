import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";

import { locate } from "../../src/film.ts";
import type { Film } from "../../src/film.ts";

/**
 * Check the actual frozen edit against the canonical source and retained takes.
 * @evidence contracts/testing.md#observable-behavior Executes locate at every actual cut and cue, validates source bytes and untrimmed speech, and rejects invalid seeks. Real viewer pixels, acting and listening are separate inspection checks.
 * @evidence contracts/testing.md#independent-cases Canonical six H2 order, source SHA, 27 retained take durations and exact cut starts are independent of locate; both sides of every cut and NaN/negative/infinite time cover boundary failures.
 */
export async function test_episode_edit(): Promise<void> {
const root = path.resolve(import.meta.dirname, "../..");
const film: Film = JSON.parse(
  await readFile(path.join(root, "public/film.json"), "utf8"),
);
const takes = JSON.parse(
  await readFile(path.join(root, "public/audio/001-road/takes.json"), "utf8"),
);
const sha=(bytes:Uint8Array)=>createHash('sha256').update(bytes).digest('hex');
const selection=JSON.parse(await readFile(path.join(root,'public/audio/001-road/selection.json'),'utf8'));
assert.equal(selection.sourceSha256,film.sourceSha256);
for(const original of takes.takes){assert.equal(sha(await readFile(path.join(root,'public/audio/001-road',original.file))),original.sha256);}
assert.equal(
  film.sourceSha256,
  createHash("sha256")
    .update(
      await readFile(
        path.join(root, "docs/body/screenplay/001-chronicle/001-road.md"),
      ),
    )
    .digest("hex"),
);
assert.deepEqual(
  [...new Set(film.shots.map((s) => s.unit))],
  ["road", "letter", "plans", "night", "battle", "victory"],
);
assert.equal(film.cues.length, 27);
assert.equal(film.cues.filter((c) => c.speaker === "AUTHOR").length, 1);
for (let i = 0; i < film.shots.length; i++) {
  const shot = film.shots[i]!;
  assert.equal(locate(film, shot.start).shot.id, shot.id);
  if (i) {
    const previous = film.shots[i - 1]!;
    assert.ok(
      Math.abs(previous.start + previous.duration - shot.start) < 1e-10,
    );
    assert.equal(locate(film, shot.start - 1 / film.fps).shot.id, previous.id);
  }
}
for (const cue of film.cues) {
  const take = takes.takes.find((t: { id: string }) => t.id === cue.id);
  assert.equal(cue.text, take.text);
  const change=selection.changes.find((c:{id:string})=>c.id===cue.id);
  if(change){
    assert.equal(cue.file,change.file);assert.equal(cue.sha256,change.sha256);assert.equal(cue.acceptance,'candidate-unheard');
    const provenance=await readFile(path.join(root,change.provenance));assert.equal(sha(provenance),change.provenanceSha256);
    const receipt=JSON.parse(provenance.toString('utf8'));const alternative=receipt.candidates.find((c:{file:string})=>c.file===change.file);
    assert.equal(alternative.inputs.text,take.text);assert.equal(alternative.sha256,change.sha256);
    assert.equal(cue.duration,alternative.signal.frames/alternative.signal.sampleRate);
    assert.equal(cue.selection?.provenanceSha256,change.provenanceSha256);
  }else{assert.equal(cue.duration,take.duration);assert.equal(cue.file,take.file);}
  assert.equal(sha(await readFile(path.join(root,'public/audio/001-road',cue.file))),cue.sha256);
  assert.ok(Math.abs(cue.end - cue.start - cue.duration) < 1e-10);
  assert.equal(cue.frames/cue.sampleRate,cue.duration);
  assert.equal(locate(film, cue.start).shot.id, cue.shot);
  assert.equal(locate(film, cue.end).shot.id, cue.shot);
}
assert.equal(locate(film, film.duration).shot.id, "author");
assert.throws(() => locate(film, -1), RangeError);
assert.throws(() => locate(film, NaN), RangeError);
assert.throws(() => locate(film, Infinity), RangeError);
const mix = await readFile(
  path.join(root, "public/audio/001-road/episode-mix.wav"),
);
assert.equal(mix.toString("ascii", 0, 4), "RIFF");
assert.equal(mix.toString("ascii", 8, 12), "WAVE");
const ids=new Set(film.shots.map(s=>s.id));
for(const event of film.events){assert.ok(ids.has(event.shot));assert.ok(event.start>=0&&event.duration>0&&event.start+event.duration<=film.duration+1e-9);assert.ok(event.pan>=-1&&event.pan<=1);}
assert.ok(film.events.some(e=>e.shot==='return-fire'&&e.action==='fire'));
assert.equal(film.shots[film.shots.findIndex(s=>s.id==='rapp')+1]!.id,'ammunition');
console.log(
  "Episode edit: source identity, six-unit order, every measured take, every cut boundary and invalid seeks passed. Actual rendering and listening remain separate checks.",
);

}
