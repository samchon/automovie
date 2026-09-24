/** Fixed glazing follows spaces/003#glazing-interface in placed geometry.
 * Member centres are read from the placed webs, never from a second bay formula.
 * Scenarios: both facade axes and normals; clear, frosted and split panes; the
 * privacy-height boundary. Checked: the jambs 0.02 outside the effective span,
 * bays of at most 1.25, the four-part section, head and sill parts butting the
 * same part of each vertical member, glass seated 0.006 with 0.004 clearance to
 * the web, continuous optical bands, gaskets on both glass faces and setting
 * blocks bridging the sill web and the glass. Negative twins break each rule.
 * This checks geometry, not watertightness or optical quality. */
import assert from "node:assert/strict";
import { builtEnvironmentElementBounds } from "@automovie/engine";
import { Assembly, initialState } from "../assembly";
import type { Frame } from "../walls";
import { facade, type Glazing } from "./facade";

const tolerance = 1e-7;
const SECTION = { body: [0.020, -0.070, -0.015], web: [0.010, -0.015, 0.015], plate: [0.020, 0.015, 0.035], cover: [0.018, 0.035, 0.070] } as const;
type Span = [number, number];
const near = (actual: number, expected: number, message: string) => assert.ok(Math.abs(actual - expected) < tolerance, message + ": " + actual + " != " + expected);
const spanNear = (actual: Span, expected: Span, message: string) => { near(actual[0], expected[0], message); near(actual[1], expected[1], message); };

function assertGlazingSection(a: Assembly, f: Frame, w: Glazing): void {
  const depth = f.along === "x" ? "z" : "x";
  const placed = (id: string) => {
    const box = builtEnvironmentElementBounds(a.environment, id);
    assert.ok(box, id + ": missing placed geometry");
    const n = [(box.min[depth] - f.plane) * f.normal, (box.max[depth] - f.plane) * f.normal].sort((p, q) => p - q) as Span;
    return { u: [box.min[f.along], box.max[f.along]] as Span, y: [box.min.y, box.max.y] as Span, n };
  };
  const material = (id: string) => a.environment.elements.find((element) => element.id === id)!.model;

  const centres = a.environment.elements
    .filter((element) => /-mullion-\d+-web$/.test(element.id) && element.id.startsWith(w.id + "-"))
    .map((element) => { const { u } = placed(element.id); return { index: Number(element.id.split("-").at(-2)), m: (u[0] + u[1]) / 2 }; })
    .sort((p, q) => p.m - q.m);
  assert.ok(centres.length > 2, "fixture must contain an internal mullion");
  near(centres[0].m, w.a - 0.02, "jamb centre");
  near(centres.at(-1)!.m, w.b + 0.02, "jamb centre");
  for (const split of w.breaks ?? []) assert.ok(centres.some(({ m }) => Math.abs(m - split) < tolerance), "priority split");

  for (const { index, m } of centres) for (const [part, [s, n0, n1]] of Object.entries(SECTION)) {
    const member = placed(w.id + "-mullion-" + index + "-" + part);
    spanNear(member.u, [m - s, m + s], "vertical section");
    spanNear(member.n, [n0, n1], "frame depth");
    spanNear(member.y, [w.sill - 0.04, w.head + 0.04], "vertical member height");
  }

  const panes = a.environment.elements.filter((element) => element.id.startsWith(w.id + "-pane-")).map((element) => element.id);
  const seen = new Set<string>();
  const split = w.privacy === "lower" ? Math.min(w.head, w.sill + 1.25) : w.head;
  for (let bay = 0; bay < centres.length - 1; bay++) {
    const m0 = centres[bay].m, m1 = centres[bay + 1].m;
    assert.ok(Math.min(m1, w.b) - Math.max(m0, w.a) <= 1.25 + tolerance, "bay width");
    for (const [name, c] of [["head", w.head + 0.02], ["sill", w.sill - 0.02]] as const) {
      for (const [part, [s, n0, n1]] of Object.entries(SECTION)) {
        const member = placed(w.id + "-" + name + "-" + bay + "-" + part);
        spanNear(member.u, [m0 + s, m1 - s], "butt joint");
        spanNear(member.y, [c - s, c + s], "horizontal section");
        spanNear(member.n, [n0, n1], "frame depth");
      }
    }
    const bands = panes.filter((id) => { const { u } = placed(id); return u[0] > m0 && u[1] < m1; })
      .map((id) => ({ id, ...placed(id) })).sort((p, q) => p.y[0] - q.y[0]);
    assert.ok(bands.length >= 1, "nonempty optical bands");
    let bottom = w.sill - 0.006;
    for (const band of bands) {
      spanNear(band.u, [m0 + 0.014, m1 - 0.014], "pane seat");
      assert.ok(band.u[0] - (m0 + SECTION.web[0]) > 0.004 - tolerance && (m1 - SECTION.web[0]) - band.u[1] > 0.004 - tolerance, "web clearance");
      spanNear(band.n, [-0.009, 0.009], "glass plane");
      near(band.y[0], bottom, "vertical glass continuity");
      assert.ok(band.y[1] > band.y[0], "positive pane height");
      // The 6mm seat extensions inherit the adjacent band, so a band's state is set by where it starts.
      const frosted = w.privacy === "all" || (w.privacy === "lower" && band.y[0] < split - tolerance);
      assert.equal(material(band.id), frosted ? "box-frosted" : "box-glass", "optical band");
      bottom = band.y[1];
      seen.add(band.id);
    }
    near(bottom, w.head + 0.006, "glass reaches head seat");

    const seat = w.id + "-bay-" + bay;
    for (const [side, n] of [["in", [-0.015, -0.009]], ["out", [0.009, 0.015]]] as const) {
      spanNear(placed(seat + "-gasket-left-" + side).u, [m0 + 0.014, m0 + 0.020], "gasket seat");
      spanNear(placed(seat + "-gasket-right-" + side).u, [m1 - 0.020, m1 - 0.014], "gasket seat");
      for (const edge of ["left", "right", "sill", "head"]) spanNear(placed(seat + "-gasket-" + edge + "-" + side).n, n as unknown as Span, "gasket face");
    }
    for (const q of [0.25, 0.75]) spanNear(placed(seat + "-setting-" + q).y, [w.sill - 0.010, w.sill - 0.006], "setting block");
  }
  assert.equal(seen.size, panes.length, "all panes belong to a real bay");
}

export function verifyFixedGlazingFill(): number {
  let checked = 0;
  const cases: Pick<Glazing, "privacy" | "head">[] = [
    { head: 2.6 }, { head: 2.6, privacy: "all" },
    { head: 2.6, privacy: "lower" },
    { head: 1.65, privacy: "lower" }, { head: 1.3, privacy: "lower" },
  ];
  for (const along of ["x", "z"] as const) for (const normal of [-1, 1] as const) {
    for (const state of cases) {
      const a = new Assembly(initialState);
      const f: Frame = {
        id: "test-facade", along, normal, plane: 0,
        a: -2, b: 2, floor: 0, top: 3, depth: 0.24, spaces: ["house"],
      };
      const w: Glazing = {
        id: "test-glazing", room: "house", a: -1.5, b: 1.5,
        sill: 0.4, breaks: [-0.26], ...state,
      };
      facade(a, f, [w]);
      assertGlazingSection(a, f, w);
      const element = (id: string) => a.environment.elements.find((e) => e.id === id)!;
      const twin = (id: string, change: (t: (typeof a.environment.elements)[number]["transform"]) => void, message: RegExp) => {
        const t = element(id).transform, saved = structuredClone(t);
        change(t);
        assert.throws(() => assertGlazingSection(a, f, w), message);
        Object.assign(t, saved);
      };
      twin(w.id + "-head-0-cover", (t) => { t.scale.x -= 0.004; }, /butt joint/);
      twin(w.id + "-sill-1-web", (t) => { t.scale.x += 0.020; }, /butt joint/);
      twin(w.id + "-mullion-1-body", (t) => { t.scale.z += 0.020; }, /frame depth/);
      const pane = a.environment.elements.find((e) => e.id.startsWith(w.id + "-pane-"))!.id;
      twin(pane, (t) => { t.scale.x -= 0.005; }, /pane seat/);
      twin(pane, (t) => { t.scale.y -= 0.01; }, /vertical glass continuity|glass reaches head seat/);
      twin(pane, (t) => { t.scale.x += 0.012; }, /pane seat/);
      const model = element(pane).model;
      element(pane).model = a.primitive(model === "box-glass" ? "frosted" : "glass");
      assert.throws(() => assertGlazingSection(a, f, w), /optical band/);
      element(pane).model = model;
      assertGlazingSection(a, f, w);
      checked++;
    }
  }
  return checked;
}
