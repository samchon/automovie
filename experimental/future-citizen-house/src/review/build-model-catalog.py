"""Copy reviewed model coordinate rows to static TypeScript records.

This authoring helper is kept in the production worklog. Runtime code never
reads Markdown or guesses extents from a prose label.
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs/models"
OUT = ROOT / "src/models"
OUT.mkdir(exist_ok=True)

def interval(token):
    a, b = token.replace("−", "-").split("..")
    return [float(a), float(b)]

def expand(token):
    m = re.fullmatch(r"(.+)-(\d+)\.\.(\d+)", token)
    return [f"{m[1]}-{n}" for n in range(int(m[2]), int(m[3])+1)] if m else [token]

for path in sorted(DOCS.glob("[0-9][0-9][1-9]-*.md")):
    source = path.read_text(encoding="utf-8")
    sections = re.split(r"(?=^## .*\{#[^}]+\})", source, flags=re.M)
    prototypes = []
    for sec in sections:
        h = re.match(r"## (.*) \{#([^}]+)\}", sec)
        if not h:
            continue
        title, anchor = h.groups()
        states = {}
        plant_spec = None
        for line in sec.splitlines():
            spec_match = re.match(r"@plant-spec:\s*(\{.+\})", line)
            if spec_match:
                plant_spec = json.loads(spec_match[1])
            inv = re.match(r"@inventory\s+([^:]+):\s*(.+)$", line)
            if inv:
                state = inv[1].strip()
                states[state] = {"state": state, "parts": [], "inventory": sum((expand(t.strip()) for t in inv[2].split(",")), [])}
        for line in sec.splitlines():
            if line.startswith("| @part |"):
                cells = [c.strip() for c in line.strip().strip("|").split("|")]
                _, state, pid, shape, x, y, z, _ = cells
                states[state]["parts"].append({"id": pid, "shape": shape, "x": interval(x), "y": interval(y), "z": interval(z)})
            for marker, field in (("@void", "voids"), ("@piece", "pieces")):
                m = re.match(rf"{marker}\s+([^:]+):\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+)$", line)
                if m:
                    st, pid = m[1].strip(), m[2].strip()
                    states[st].setdefault(field, {}).setdefault(pid, []).append({"x": interval(m[3]), "y": interval(m[4]), "z": interval(m[5])})
            m = re.match(r"@radial(?:-at)?\s+([^:]+):\s*(.+)$", line)
            if m:
                st = m[1].strip(); v = [t.strip() for t in m[2].split(",")]
                if len(v) == 3: pid, inner, outer = v; cx=cz=0
                else: pid, cx, cz, inner, outer = v
                states[st].setdefault("radial", {})[pid] = [float(cx), float(cz), float(inner), float(outer)]
            m = re.match(r"@ellipse\s+([^:]+):\s*(.+)$", line)
            if m:
                st = m[1].strip(); v = [t.strip() for t in m[2].split(",")]
                pid, ix, iz, ox, oz = v[:5]; cx,cz = (v[5:7] if len(v)>5 else [0,0])
                states[st].setdefault("ellipse", {})[pid] = [float(cx),float(cz),float(ix),float(iz),float(ox),float(oz)]
            m = re.match(r"@bore(-z|-x)?\s+([^:]+):\s*(.+)$", line)
            if m:
                axis, st = (m[1] or "-y"), m[2].strip(); v = [t.strip() for t in m[3].split(",")]
                states[st].setdefault("bores", {})[v[0]] = {"axis": axis, "args": v[1:]}
            m = re.match(r"@cavity-profile\s+([^:]+):\s*(.+)$", line)
            if m:
                st=m[1].strip(); v=[t.strip() for t in m[2].split(",")]
                states[st].setdefault("profiles", {})[v[0]] = v[1:]
            m = re.match(r"@plant-join\s+([^:]+):\s*(.+)$", line)
            if m:
                st=m[1].strip(); v=[t.strip() for t in m[2].split(",")]
                states[st].setdefault("joins", {})[v[0]] = [float(t) for t in v[1:]]
            m = re.match(r"@plant-apex\s+([^:]+):\s*(.+)$", line)
            if m:
                st=m[1].strip(); v=[t.strip() for t in m[2].split(",")]
                states[st].setdefault("apices", {})[v[0]] = [float(t) for t in v[1:]]
            m = re.match(r"@grid\s+([^:]+):\s*(.+)$", line)
            if m:
                st=m[1].strip(); v=[t.strip() for t in m[2].split(",")]
                prefix, cols, rows, pitchx, pitchz, width, depth, ys, _ = v
                cols,rows=int(cols),int(rows); pitchx,pitchz,width,depth=map(float,(pitchx,pitchz,width,depth))
                for row in range(rows):
                    for col in range(cols):
                        cx=(col-(cols-1)/2)*pitchx; cz=(row-(rows-1)/2)*pitchz
                        states[st]["parts"].append({"id":f"{prefix}-{row*cols+col}","shape":"box","x":[cx-width/2,cx+width/2],"y":interval(ys),"z":[cz-depth/2,cz+depth/2]})
        for state in states.values():
            if plant_spec is not None:
                state["plantSpec"] = plant_spec
            actual = {p["id"] for p in state["parts"]}
            expected = set(state.pop("inventory"))
            if actual != expected:
                raise ValueError(f"{anchor}/{state['state']} inventory mismatch missing={expected-actual} extra={actual-expected}")
        prototypes.append({"anchor": anchor, "name": title, "states": list(states.values())})
    basename = path.stem
    class_name = "Models" + basename.split("-",1)[0]
    body = json.dumps(prototypes, ensure_ascii=False, separators=(",",":"))
    output = (f'/** Static coordinates copied from reviewed docs/models/{path.name} @part and @inventory. */\n'
              f'import {{ ModelRepresentation, ModelPrototype }} from "./representation";\n'
              f'import {{ IAutoMovieMaterial, IAutoMovieModel }} from "@automovie/interface";\n'
              f'const prototypes: ModelPrototype[] = {body};\n'
              f'/** Reviewed model owners in {path.name}. */\n'
              f'export class {class_name} {{\n'
              f'  static catalog(): readonly ModelPrototype[] {{ return prototypes; }}\n'
              f'  static build(anchor: string, state: string, materialFor: (anchor: string, state: string, part: string) => IAutoMovieMaterial): IAutoMovieModel {{\n'
              f'    const prototype = prototypes.find(item => item.anchor === anchor);\n'
              f'    if (!prototype) throw Error(`unknown model ${{anchor}} in {class_name}`);\n'
              f'    return ModelRepresentation.build(prototype, state, materialFor);\n'
              f'  }}\n'
              f'}}\n')
    destination = OUT / (basename + ".ts")
    if "--check" in sys.argv:
        if not destination.is_file() or destination.read_text(encoding="utf-8") != output:
            raise ValueError(f"stale generated model catalog {destination}")
    else:
        destination.write_text(output, encoding="utf-8")
    print(path.name, len(prototypes), sum(len(s["parts"]) for p in prototypes for s in p["states"]))
