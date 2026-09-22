"""Compare two census directories on the states both recorded, per set.

Usage: python test/scripts/body-review/compare_census.py .shots/body-review/census8 .shots/body-review/census9
"""
import json, glob, sys, collections
def load(d, s):
    out = {}
    for f in glob.glob(f"{d}/{s}-*.json") + glob.glob(f"{d}/{s}.json"):
        j = json.load(open(f, encoding="utf-8"))
        for st in j["states"]:
            out[st["name"]] = st
    return out
def bad(st):
    return len(st.get("fresh") or []) + len(st.get("grown") or []) > 0 or st.get("refused") is not None
a, b = sys.argv[1], sys.argv[2]
for s in ["channels", "joints", "combos", "shapes", "traits"]:
    x, y = load(a, s), load(b, s)
    common = set(x) & set(y)
    c = collections.Counter((bad(x[n]), bad(y[n])) for n in common)
    print(s, "common", len(common), "only-new", len(set(y) - set(x)), "fixed", c[(True, False)], "regressed", c[(False, True)], "still", c[(True, True)], "clean", c[(False, False)])
    reg = sorted(n for n in common if not bad(x[n]) and bad(y[n]))
    if reg: print("  regressed:", reg[:15])
