"""Freeze the episode edit against saved VoxCPM bytes and prepare its PCM mix.

The direct procedural film owns one untrimmed hard-cut edit. This is not a native
compiled-shot certification. Sound effects below are authored synthesis; speech
remains the actual retained VoxCPM candidates and retains its unheard status.
"""
import hashlib
import json
from pathlib import Path
import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs/body/screenplay/001-chronicle/001-road.md"
TAKES = ROOT / "public/audio/001-road/takes.json"
FPS = 24
RATE = 48000

# id, source H2, location/date, minimum performed seconds, spoken line numbers.
# Every entry is consumed by the runtime staging selector and actual capture.
SHOTS = [
 ("cart", "road", "November 28, 1805 · Near Vyškov", 13, [1]),
 ("fork", "road", "Evening · Rousínov", 8, [2]),
 ("orders", "road", "French headquarters", 12, [3, 4]),
 ("arrival", "letter", "The post house", 6, []),
 ("petition", "letter", "Murat · Soult · Lannes", 9, [5, 6]),
 ("paper", "letter", "The joint petition", 8, [7, 8]),
 ("writing", "letter", "", 6, []),
 ("delivery", "letter", "Napoleon · Emperor of the French", 7, [9]),
 ("boast", "letter", "", 6, [10]),
 ("challenge", "letter", "", 10, [11, 12, 13]),
 ("withdraw", "letter", "", 7, [14]),
 ("departures", "letter", "", 6, []),
 ("dictation", "letter", "", 8, [15, 16]),
 ("descent", "plans", "Night of November 28–29", 7, []),
 ("empty", "plans", "The heights · Later", 5, []),
 ("ascent", "plans", "Allied troops occupy the heights", 7, []),
 ("conference", "plans", "Allied headquarters", 10, [17]),
 ("columns", "plans", "On the next march", 9, []),
 ("mail", "night", "December 1 · French headquarters", 8, [18]),
 ("wine", "night", "", 7, []),
 ("sleep", "night", "Later that night", 8, [19]),
 ("raygern", "night", "The same night · Raygern", 10, []),
 ("duel", "night", "December 2 · Dawn", 11, [20, 21, 22]),
 ("village", "battle", "December 2 · Goldbach · The south", 9, [23]),
 ("davout", "battle", "Davout · Friant's leading men", 9, [24]),
 ("march", "battle", "The main body is still on the road", 5, []),
 ("center", "battle", "The center · Napoleon's position", 10, [25, 26]),
 ("climb", "battle", "Pratzen · Vandamme and Saint-Hilaire", 9, []),
 ("counterattack", "battle", "The heights", 9, []),
 ("north", "battle", "The north · Lannes · Murat · Liechtenstein", 9, []),
 ("eagle", "battle", "Behind the center · The French 4th Line", 8, []),
 ("guard", "battle", "Rapp · Guard cavalry", 12, []),
 ("rapp", "battle", "Rapp returns wounded", 6, []),
 ("ammunition", "battle", "The south", 5, []),
 ("rearguard", "victory", "The southern retreat route", 8, []),
 ("tangle", "victory", "The north · A late withdrawal order", 7, []),
 ("ice", "victory", "At the pond's edge", 11, []),
 ("cheers", "victory", "That night · The victorious army", 8, []),
 ("bowl", "victory", "", 10, []),
 ("separate", "victory", "", 6, []),
 ("straw", "victory", "", 7, []),
 ("silence", "victory", "", 2, []),
 ("author", "victory", "Author's Commentary", 27, [27]),
]

def digest(data: bytes) -> str:
    """Identify actual inputs and saved output bytes."""
    return hashlib.sha256(data).hexdigest()

def main() -> None:
    """Validate all source takes before constructing this edit and its exact mix."""
    record = json.loads(TAKES.read_text(encoding="utf-8"))
    if not record["complete"] or record["sourceSha256"] != digest(SOURCE.read_bytes()):
        raise ValueError("Incomplete takes or changed screenplay")
    takes = {int(t["id"].split("-")[1]): t for t in record["takes"]}
    if set(takes) != set(range(1, 28)):
        raise ValueError("The complete 27-line population is required")
    for take in takes.values():
        path = TAKES.parent / take["file"]
        if digest(path.read_bytes()) != take["sha256"]:
            raise ValueError(f"Changed candidate {path}")
    shots, cues, cursor = [], [], 0
    for identity, unit, caption, minimum, line_ids in SHOTS:
        length = max(minimum, sum(takes[i]["duration"] + .75 for i in line_ids) + 2.5)
        frames = int(np.ceil(length * FPS))
        start = cursor / FPS
        duration = frames / FPS
        local = 1.35
        for line_id in line_ids:
            take = takes[line_id]
            cues.append({**take, "start": start + local, "end": start + local + take["duration"], "shot": identity})
            local += take["duration"] + .75
        shots.append({"id": identity, "unit": unit, "caption": caption,
                      "start": start, "duration": duration, "frames": frames,
                      "source": f"docs/body/screenplay/001-chronicle/001-road.md#{unit}"})
        cursor += frames
    if [int(c["id"].split("-")[1]) for c in cues] != list(range(1, 28)):
        raise ValueError("Every take must occur once in canonical order")
    duration = cursor / FPS
    mix = np.zeros((round(duration * RATE), 2), dtype=np.float64)
    for cue in cues:
        samples, rate = sf.read(TAKES.parent / cue["file"], dtype="float64")
        if rate != RATE or samples.ndim != 1:
            raise ValueError("The current edit requires its actual 48 kHz mono takes")
        gain = min(3.5, .105 / max(cue["rms"], .001), .82 / max(cue["peak"], .001))
        at = round(cue["start"] * RATE)
        mix[at:at+len(samples)] += samples[:, None] * gain
        cue["gain"] = gain
    rng = np.random.default_rng(18051202)
    effects = []
    def effect(kind, at, length, level=.12):
        """Place a retained deterministic effect with explicit type and output time."""
        n = max(1, round(length * RATE))
        t = np.arange(n) / RATE
        noise = rng.standard_normal(n)
        if kind == "gun":
            wave = (noise*.7 + np.sin(2*np.pi*65*t)*.3)*np.exp(-t*18)
        elif kind == "cannon":
            wave = (noise*.35 + np.sin(2*np.pi*(52-9*t)*t)) * np.exp(-t*4)
        elif kind == "hum":
            frequency = np.where((t % 4) < 2, 146.83, 164.81)
            phase = 2*np.pi*np.cumsum(frequency)/RATE
            wave = (np.sin(phase)+.25*np.sin(2*phase))*.18*np.sin(np.pi*np.minimum(1,t/.5))*np.minimum(1,(length-t)/.5)
        elif kind == "ice":
            wave = noise*.4*np.exp(-t*5)+np.sin(2*np.pi*(500-170*t)*t)*np.exp(-t*2)
        else:
            wave = (noise*.4 + np.sin(2*np.pi*110*t)*.4)*np.exp(-t*35)
        at_frame = round(at*RATE)
        end = min(len(mix), at_frame+n)
        mix[at_frame:end] += wave[:end-at_frame,None]*level
        effects.append({"kind":kind,"start":at,"duration":length,"level":level})
    for shot in shots:
        identity, at, length = shot["id"], shot["start"], shot["duration"]
        if identity in ["cart","village","ammunition","counterattack","north","guard","rearguard"]:
            for t in np.arange(1.4,length-1,2.7): effect("gun",at+float(t),.65,.10)
        if identity in ["cart","climb","counterattack"]: effect("cannon",at+3,1.5,.18)
        if identity == "wine": effect("hum",at+.7,length-1.1,.14)
        if identity == "ice": effect("ice",at+3.6,2.2,.12)
        if identity in ["fork","descent","ascent","columns","raygern","march","rearguard","tangle"]:
            for t in np.arange(.2,length-.2,.42): effect("equipment",at+float(t),.14,.045)
    peak = float(np.max(np.abs(mix)))
    master = min(1.0, .94/max(peak,.001))
    mix *= master
    target = ROOT / "public/audio/001-road/episode-mix.wav"
    sf.write(target,mix,RATE,subtype="PCM_16")
    saved,_ = sf.read(target)
    film = {"title":"The Road Gives Way", "episode":1,"fps":FPS,"width":1280,"height":720,
            "duration":duration,"frames":cursor,"sourceSha256":record["sourceSha256"],
            "shots":shots,"cues":cues,"audio":"/audio/001-road/episode-mix.wav",
            "mix":{"sha256":digest(target.read_bytes()),"frames":len(saved),"sampleRate":RATE,
                   "peak":float(np.max(np.abs(saved))),"masterGain":master,
                   "effects":effects,"acceptance":"candidate-unheard"},
            "route":"production-owned procedural staging through public viewer APIs; no native compiled-shot certification"}
    (ROOT / "public/film.json").write_text(json.dumps(film,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"shots":len(shots),"frames":cursor,"duration":duration,"cues":len(cues),"mixPeak":film["mix"]["peak"]}))

if __name__ == "__main__":
    main()
