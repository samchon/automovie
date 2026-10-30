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
import argparse
import sys

ROOT = Path(__file__).resolve().parents[1]
if ROOT.name == 'scripts':
    ROOT = ROOT.parent
sys.path.insert(0,str(ROOT/'scripts'))
from episode_foley import synthesize
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
 ("return-fire", "battle", "The village holds", 4, []),
 ("center", "battle", "The center · Napoleon's position", 10, [25, 26]),
 ("climb", "battle", "Pratzen · Vandamme and Saint-Hilaire", 10, []),
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
    selection_path=TAKES.parent/'selection.json'
    selection=json.loads(selection_path.read_text(encoding='utf-8'))
    if selection['sourceSha256']!=record['sourceSha256'] or selection['selection']!='provisional':
        raise ValueError('Selection does not identify this canonical source')
    changed=set()
    for change in selection['changes']:
        identity=int(change['id'].split('-')[1])
        if identity in changed or identity not in takes or change['acceptance']!='candidate-unheard':
            raise ValueError('Invalid or duplicate provisional selection')
        changed.add(identity)
        receipt_path=(ROOT/change['provenance']).resolve()
        receipt=json.loads(receipt_path.read_text(encoding='utf-8'))
        if not receipt_path.is_relative_to(ROOT) or digest(receipt_path.read_bytes())!=change['provenanceSha256'] or receipt['sourceSha256']!=record['sourceSha256']:
            raise ValueError('Alternative provenance changed')
        candidates=[c for c in receipt['candidates'] if c['file']==change['file'] and c['sha256']==change['sha256']]
        if len(candidates)!=1 or not receipt['complete']:
            raise ValueError('Selected candidate absent from complete provenance')
        candidate=candidates[0];original=takes[identity]
        if candidate['inputs']['text']!=original['text'] or candidate['inputs']['voice']!=original['inputs']['voice'] or candidate['inputs']['reference']!=original['inputs']['reference'] or candidate['inputs']['model']!=original['inputs']['model']:
            raise ValueError('Alternative changed protected source or voice inputs')
        actual=(TAKES.parent/change['file']).resolve()
        if not actual.is_relative_to(TAKES.parent) or digest(actual.read_bytes())!=change['sha256']:
            raise ValueError('Selected audio bytes changed')
        samples,rate=sf.read(actual,dtype='float64')
        if samples.ndim!=1 or rate!=RATE or len(samples)!=candidate['signal']['frames']:
            raise ValueError('Selected audio profile changed')
        measured={'frames':len(samples),'sampleRate':rate,'duration':len(samples)/rate,'peak':float(np.max(np.abs(samples))),'rms':float(np.sqrt(np.mean(samples**2)))}
        takes[identity]={**original,**measured,'file':change['file'],'sha256':change['sha256'],
                         'inputKey':candidate['inputKey'],'inputs':candidate['inputs'],
                         'sourceTake':{'file':original['file'],'sha256':original['sha256']},
                         'selection':{'file':'public/audio/001-road/selection.json','sha256':digest(selection_path.read_bytes()),**change}}
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
    events = []
    by_id = {shot["id"]: shot for shot in shots}
    def event(identity, action, at, length, sound=None, gain=.08, pan=0):
        """Own an exact interval consumed by both actual staging and mix."""
        shot = by_id[identity]
        start = shot["start"] + round(at*FPS)/FPS
        length = max(1/FPS, round(length*FPS)/FPS)
        if start < shot["start"] or start+length > shot['start']+shot['duration']+1e-8:
            raise ValueError("Event outside the admitted edit")
        events.append({"id":f"{identity}:{action}:{len(events)}", "shot":identity,
                       "action":action,"start":start,"duration":length,
                       "sound":sound,"gain":gain,"pan":pan})
    def steps(identity, start, end, sound="footstep", period=.85, gain=.038):
        for at in np.arange(start,end,period/2):
            event(identity,"hoof" if sound=="hoofbeat" else "step",float(at),min(.22,by_id[identity]['duration']-float(at)),sound,gain)
    event("cart","cartridge-jostle",.9,.4,"equipment",.09)
    event("cart","push",3,4)
    event("cart","rear-fire",by_id["cart"]["duration"]-3.5,.125,"musket",.15,-.6)
    event("cart","reload",0,2.7,"equipment",.045)
    steps("cart",3,7)
    steps("cart",by_id["cart"]["duration"]-3,by_id["cart"]["duration"]-.2)
    event("cart","distant-cannon",3,1.4,"cannon",.12,-.7)
    event("fork","crowd-push",4,1.1,"equipment",.08)
    steps("fork",0,by_id["fork"]["duration"]-.2)
    for identity in ["orders","dictation"]:
        event(identity,"fold",0,1.1,"equipment",.025)
        event(identity,"courier-walk",3,2)
        event(identity,"mount",5,1)
        event(identity,"depart",6,max(1,by_id[identity]["duration"]-6))
        steps(identity,6,by_id[identity]["duration"]-.2,"hoofbeat",.8,.06)
        event(identity,"next-room",max(0,by_id[identity]["duration"]-3),3,"murmur",.06,.7)
    event("dictation","write",0,by_id["dictation"]["duration"]-.1,"pen",.05)
    event("arrival","feather-brush",1.1,1,"equipment",.035)
    event("arrival","murat-enter",0,3)
    event("arrival","soult-approach",1.7,3)
    event("arrival","lannes-arrival",3.2,2.8)
    steps("arrival",0,5.9,gain=.045)
    event("paper","paper-slide",1,3,"pen",.025)
    event("writing","write",0,by_id["writing"]["duration"]-.1,"pen",.07)
    event("delivery","handoff",0,1.5,"equipment",.025)
    event("conference","route",1,4)
    event("conference","fold-exit",7,3,"equipment",.04)
    for identity in ["descent","ascent","march"]:
        steps(identity,0,by_id[identity]["duration"]-.2)
    event("columns","dismount",.8,1)
    event("columns","halt",1.8,1)
    event("columns","wheel-lift",3,3,"equipment",.065)
    steps("columns",0,1.8)
    steps("columns",6,by_id["columns"]["duration"]-.2)
    event("mail","reading",0,by_id["mail"]["duration"],"murmur",.045,-.4)
    event("wine","drink",.7,3)
    event("wine","hum",.7,by_id["wine"]["duration"]-1,"murmur",.045)
    event("sleep","outside-cheer",1.35,3.5,"cheer",.10,.7)
    event("sleep","wake",1.35,1.2)
    event("raygern","halt",3,2)
    steps("raygern",0,3,"equipment",.85,.045)
    steps("raygern",5,by_id["raygern"]["duration"]-.2,"equipment",.85,.06)
    for identity, times in {"village":[.2,5.6],"davout":[.7,6.5],"return-fire":[.5,2.3],"climb":[1.2,5.3,7.6],"counterattack":[1,4.8,7],"north":[1.5,4.5,7],"guard":[1,2.5,6],"rearguard":[2.2,5.2]}.items():
        for at in times:
            event(identity,"fire",at,.125,"musket",.12)
            event(identity,"reload",at+.125,1.5,"equipment",.022)
    event("village","ammo",2,1.4,"equipment",.025)
    event("ammunition","ammo",0,2,"equipment",.035)
    event("counterattack","cannon-hit",3,1.4,"cannon",.17,-.5)
    event("guard","path-opens",3,.5)
    event("guard","contact",5,1,"equipment",.07)
    event("guard","reinforce",7,2,"hoofbeat",.07,-.5)
    event("tangle","late-order",2,1,"equipment",.04)
    event("tangle","turn",3,2,"equipment",.075)
    event("ice","ice-contact",3,.5,"ice",.09)
    event("ice","water-rise",3.2,2.5,"water",.07)
    event("ice","reroute",5,3,"equipment",.045)
    event("cheers","crowd-cheer",0,by_id["cheers"]["duration"],"cheer",.075,-.4)
    event("bowl","bowl-transfer",3,3,"equipment",.026)
    event("straw","hand-press",1.5,3,"equipment",.015)
    for identity in ["cheers","bowl","separate"]:
        steps(identity,0,min(4,by_id[identity]["duration"]-.2),gain=.023)
    for index, item in enumerate(events):
        if not item["sound"]:
            continue
        samples=synthesize(item["sound"],RATE,item["duration"],18051202+index)
        at=round(item["start"]*RATE);end=min(len(mix),at+len(samples))
        pan=item["pan"];stereo=np.array([np.sqrt((1-pan)/2),np.sqrt((1+pan)/2)])
        mix[at:end] += samples[:end-at,None]*item["gain"]*stereo
    peak = float(np.max(np.abs(mix)))
    master = min(1.0, .94/max(peak,.001))
    mix *= master
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output-root',type=Path,default=ROOT)
    target_root=parser.parse_args().output_root.resolve()
    target = target_root / "public/audio/001-road/episode-mix.wav"
    target.parent.mkdir(parents=True,exist_ok=True)
    sf.write(target,mix,RATE,subtype="PCM_16")
    saved,_ = sf.read(target)
    film = {"title":"The Road Gives Way", "episode":1,"fps":FPS,"width":1280,"height":720,
            "duration":duration,"frames":cursor,"sourceSha256":record["sourceSha256"],
            "shots":shots,"cues":cues,"audio":"/audio/001-road/episode-mix.wav",
            "mix":{"sha256":digest(target.read_bytes()),"frames":len(saved),"sampleRate":RATE,
                   "peak":float(np.max(np.abs(saved))),"masterGain":master,
                   "effects":events,"acceptance":"candidate-unheard"},
            "events":events,"performance":{"walkPeriod":.85,"runPeriod":.58,"horsePeriod":.8},
            "route":"production-owned procedural staging through public viewer APIs; no native compiled-shot certification"}
    (target_root / "public/film.json").write_text(json.dumps(film,ensure_ascii=False,indent=2)+"\n",encoding="utf-8")
    print(json.dumps({"shots":len(shots),"frames":cursor,"duration":duration,"cues":len(cues),"mixPeak":film["mix"]["peak"]}))

if __name__ == "__main__":
    main()
