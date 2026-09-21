import { Assembly, identity, rectangle, v } from "../assembly";
export function roof(a: Assembly): void {
  const slab = a.box("roof-slab", "house", "stone", 0, 6.254, 0, 11, 0.292, 12);
  for (const x of [-5.5, 5.5]) a.box("roof-edge-x-" + x, "house", "metal", x, 6.4, 0, 0.1, 0.12, 12.2);
  for (const z of [-6, 6]) a.box("roof-edge-z-" + z, "house", "metal", 0, 6.4, z, 11.2, 0.12, 0.1);
  const nx = Math.ceil(11.6 / 1.2), nz = Math.ceil(13 / 1.9), frames: Parameters<Assembly["repeat"]>[3] = [], panels: Parameters<Assembly["repeat"]>[3] = [];
  for (let i = 0; i < nx; i++) for (let j = 0; j < nz; j++) {
    const x = -5.8 + (i + 0.5) * 11.6 / nx, z = -6.7 + (j + 0.5) * 13 / nz;
    frames.push({ id: i + "-" + j, translation: v(x, 6.76, z), rotation: identity, scale: v(11.6 / nx - 0.025, 0.12, 13 / nz - 0.025) });
    panels.push({ id: i + "-" + j, translation: v(x, 6.825, z), rotation: identity, scale: v(11.6 / nx - 0.07, 0.012, 13 / nz - 0.07) });
  }
  a.repeat("canopy-cassettes", "house", "metal", frames);
  a.repeat("canopy-pv-panels", "house", "pv", panels);
  for (const x of [-4.8, 0, 4.8]) for (const z of [-5.4, 0, 5.4]) a.box("canopy-support-" + x + "-" + z, "house", "metal", x, 6.55, z, 0.08, 0.3, 0.08);
  a.environment.boundaries.push({ id: "roof-face", kind: "roof", spaces: ["house"], elements: [slab], face: { origin: v(0, 6.4, 0), rotation: { x: -Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 }, outline: rectangle(-5.5, 5.5, -6, 6), thickness: 0.292 } });
  for (const [id, y, up] of [["canopy-top", 6.831, true], ["canopy-soffit", 6.7, false]] as const) a.environment.boundaries.push({ id, kind: "roof", spaces: ["house"], elements: [], face: { origin: v(0, y, -0.2), rotation: { x: up ? -Math.SQRT1_2 : Math.SQRT1_2, y: 0, z: 0, w: Math.SQRT1_2 }, outline: rectangle(-5.8, 5.8, -6.5, 6.5), thickness: 0.12 } });
}
