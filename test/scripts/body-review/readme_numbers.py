"""Refresh the counted figures of the study README from the shipped receipts.

Usage, from anywhere: python test/scripts/body-review/readme_numbers.py
"""
import json, os, re
os.chdir(os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", ".."))
S = "test/studies/human-body/connected-basis/"
p = json.load(open(S + "pose-correctives-receipt.json", encoding="utf-8"))
v = json.load(open(S + "envelope-receipt.json", encoding="utf-8"))
c = json.load(open(S + "census-receipt.json", encoding="utf-8"))
readme = open(S + "README.md", encoding="utf-8").read()

pose = [x for x in p["correctives"] if x["id"].startswith("pose/")]
mid = sum(1 for x in pose if "#" in x["id"] or abs(float(re.sub(r"#.*", "", x["id"].split("@")[1])) * 8 % 1) > 1e-9)
single = list({u["state"]: u for u in p["unpublished"] if ":" not in u["state"]}.values())
states = len({u["state"] for u in p["unpublished"]})
unpub = "; ".join(f"`{u['state']}` ({', '.join(u['pairs'])})" for u in single)

def sub(pattern, repl, count=1):
    global readme
    new, n = re.subn(pattern, repl, readme, count=count)
    assert n == count, pattern
    readme = new

sub(r"revision `[^`]+`\. It is the remainder", f"revision `{p['basis']}`. It is the remainder")
sub(r"ramping from the previous sample to this one\. \d+ of them\.", f"ramping from the previous sample to this one. {p['volumeCorrectives']} of them.")
sub(r"\d+ of them; \d+ were queued midpoints", f"{len(pose)} of them; {mid} were queued midpoints")
sub(r"\d+ (?:single-axis )?states stayed beyond their budget and are unpublished, listed in the receipt with the pairs that remained: [^.]*\.", f"{len(single)} single-axis states stayed beyond their budget and are unpublished, listed in the receipt with the pairs that remained: {unpub}.")

state = [x for x in p["correctives"] if x["id"].startswith("state/")]
sub(r"\d+ state correctives were published\.", f"{len(state)} state correctives were published.")

# envelope reach
names = {"measureWaistCirc": "waist girth", "measureHipsCirc": "hips girth", "measureBustCirc": "bust girth", "measureUnderbustCirc": "underbust girth", "measureShoulderDist": "shoulder breadth", "measureThighCirc": "thigh girth", "measureUpperarmCirc": "upperarm girth", "measureCalfCirc": "calf girth"}
mass = ", ".join(f"{m['statureMetres']:.2f} m {'woman' if m['sex'] < 0 else 'man'} {m['massKilograms'][0]:.0f} to {m['massKilograms'][1]:.0f} kg" for m in v["reach"]["mass"])
girths = ", ".join(f"{names[g['channel']]} {g['metres'][0]:.2f} to {g['metres'][1]:.2f} m" for g in v["reach"]["girths"])
sub(r"at \d+ years, [^;]*; and each tape measurement's span.*? m\. The channel census",
    f"at {v['reach']['ageYears']} years, {mass}; and each tape measurement's span (a girth read as a tape reads it, the section's convex hull), {girths}. The channel census")

# census summary
lines = []
for name, label in [("channels", "every channel at each endpoint, alone"), ("joints", "every mobile joint axis at the four fractions of its range"), ("combos", "every parent-child flexion pair and the shoulder/hip abduction against elbow/knee flexion at their extremes"), ("shapes", "every published pose corrective's full angle on each macro extreme and on every channel end past the source's unit node"), ("traits", "every individuality channel at each extreme on each of those shapes, and the review combinations")]:
    s = c["sets"].get(name)
    if s is None:
        continue
    findings = s["findings"]
    detail = "" if not findings else " — " + "; ".join(f"`{f['name']}` ({', '.join(x['part'] + ' x ' + x['other'] for x in f['fresh'])})" for f in findings[:12]) + (" and more" if len(findings) > 12 else "")
    lines.append(f"- `{name}` ({label}): {s['states']} states, {s['clean']} clean, {s['withFindings']} with a crossing the rest does not have, {len(s['refused'])} refused by the builder{detail}.")
census = "The rest pose crosses on " + ("no pair" if not c["restPairs"] else f"{len(c['restPairs'])} pairs") + ", so every finding is absolute.\n\n" + "\n".join(lines)
if "{{CENSUS_AFTER}}" in readme:
    readme = readme.replace("{{CENSUS_AFTER}}", census)
else:
    i = readme.index("The rest pose crosses on ")
    j = readme.index("\n## Limits", i)
    readme = readme[:i] + census + "\n" + readme[j:]
open(S + "README.md", "w", encoding="utf-8", newline="\n").write(readme)
print("ok", len(pose), mid, len(p["unpublished"]))
