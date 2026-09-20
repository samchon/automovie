/** Does the precondition hold at every strength, not only at full?
 *
 * `tongueOut` alone is a face nobody can make: the tongue leaves through shut
 * lips on all eighteen. The channel has to imply an open mouth, and the basis
 * has no mechanism for implying anything -- it has combination correctives and
 * nothing else. It turns out not to need one.
 *
 * Fold the whole `jawOpen` displacement into the `tongueOut` endpoint, and
 * author a corrective on `(tongueOut+, jawOpen+)` carrying its negative. A
 * corrective activates on the product of its drivers, so with `J` folded at
 * full strength the double count cancels exactly rather than approximately:
 *
 *   w_t (T + J + N) + w_j J - w_t w_j J
 *
 * reads `T + J + N` at (1, 0), at (1, 1) and at (1, 0.5) alike, plain `J` when
 * the tongue is in, and `0.5T + J + 0.5N` at half a tongue out of a mouth
 * already open. Every corner and every middle.
 *
 * What that algebra does not say is whether the geometry it produces is clear.
 * At full strength it is the pose already measured -- tongue out of a mouth
 * wide open, with the five percent narrowing, zero crossings on all eighteen.
 * The strengths in between have never been looked at, and a channel is driven
 * through them on the way to anywhere. So this walks the implied pose from shut
 * to full and counts what crosses.
 *
 * Usage, from the test package:
 *   ttsx -P tsconfig.json --no-plugins scripts/face-review/measure-tongue-precondition.ts
 */
import { measureAutoMovieModelCrossings } from "@automovie/engine";
import {
  type IAutoMovieHumanFaceBasis,
  type IAutoMovieHumanFaceBasisDocument,
  createHumanFaceBasisBuilder,
} from "@automovie/human";
import type { IAutoMovieMesh, IAutoMovieModel } from "@automovie/interface";
import fs from "node:fs";
import { gunzipSync } from "node:zlib";

const published = "studies/human-face/connected-basis/global-face";
const basis: IAutoMovieHumanFaceBasis = JSON.parse(
  gunzipSync(fs.readFileSync(`${published}/basis.json.gz`)).toString("utf8"),
);
const documents: IAutoMovieHumanFaceBasisDocument[] = JSON.parse(
  fs.readFileSync(`${published}/subjects.json`, "utf8"),
);
const build = createHumanFaceBasisBuilder(basis);

/** Strengths the channel is driven through on its way to full. */
const LADDER = [0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1];

/** Jaw openings offered to each of those strengths. */
const OPENINGS = [0, 0.2, 0.4, 0.6, 0.8, 1];

/**
 * Subjects the curve is shaped on before it is checked on everyone.
 *
 * The two with the largest leftover at full opening and the two with none, so
 * a curve that only suits one end of the population shows here.
 */
const PROBE = ["rupert-grint", "kdy1", "oh-seung-yoon", "michael-gambon"];

/** Narrowings offered to the strength that no opening could clear. */
const SHARES = [0.05, 0.1, 0.15, 0.2, 0.3, 0.4];

/** The strength where the tongue is widest exactly at the lip aperture. */
const STUCK = 0.6;

/** Half width the tongue tip gives up at full strength, from the sweep. */
const NARROWING = 0.05;

/**
 * The narrowing, at a share, either ramped from the root or spent evenly.
 *
 * Ramped, the tip gives up the whole share and the root none. That suits a
 * tongue right out, where only a narrow shaft is in the aperture. Halfway out
 * it is the widest part of the tongue that sits in the aperture, and a ramp
 * weighted towards the tip barely touches it.
 */
const narrowed = (
  tongue: IAutoMovieMesh,
  strength: number,
  even = false,
): number[] => {
  const positions = [...tongue.positions];
  let back = Infinity;
  let front = -Infinity;
  for (let i = 2; i < positions.length; i += 3) {
    back = Math.min(back, positions[i]);
    front = Math.max(front, positions[i]);
  }
  const reach = front - back;
  for (let row = 0; row < positions.length / 3; row++) {
    const forward = reach === 0 ? 0 : (positions[row * 3 + 2] - back) / reach;
    positions[row * 3] *= 1 - strength * (even ? 1 : NARROWING * forward);
  }
  return positions;
};

/** Every crossing pair of a model, and the tongue-and-lips one alone. */
const crossing = (model: IAutoMovieModel) => {
  let lips = 0;
  let everywhere = 0;
  for (const one of measureAutoMovieModelCrossings(model)) {
    const pair = [one.part, one.other];
    const count = one.triangles + one.otherTriangles;
    everywhere += count;
    if (
      pair.some((each) => each.includes("tongue")) &&
      pair.some((each) => each.includes("lips"))
    )
      lips += count;
  }
  return { lips, everywhere };
};

/** Crossings of one subject with the tongue at `out` and the jaw at `open`. */
const at = (
  document: IAutoMovieHumanFaceBasisDocument,
  out: number,
  open: number,
) => {
  const model = build({
    ...document,
    expression: { tongueOut: out, jawOpen: open },
  });
  const part = model.parts.find(
    (each) => each.id === "Human.tongue01/Human.tongue01",
  );
  if (part === undefined || part.geometry.type !== "mesh")
    throw new Error("no tongue mesh in the built model");
  part.geometry.mesh.positions = narrowed(part.geometry.mesh, out);
  return crossing(model).lips;
};

/** The stuck strength, narrowed evenly by a share, over a jaw ladder. */
const evenly = (
  document: IAutoMovieHumanFaceBasisDocument,
  share: number,
  open: number,
) => {
  const model = build({
    ...document,
    expression: { tongueOut: STUCK, jawOpen: open },
  });
  const part = model.parts.find(
    (each) => each.id === "Human.tongue01/Human.tongue01",
  );
  if (part === undefined || part.geometry.type !== "mesh")
    throw new Error("no tongue mesh in the built model");
  part.geometry.mesh.positions = narrowed(part.geometry.mesh, share, true);
  return crossing(model).lips;
};

const rows: Record<string, unknown> = {};
console.log(
  `${"subject / tongue out".padEnd(26)} ` +
    OPENINGS.map((one) => `jaw ${one}`.padStart(8)).join("") +
    "   least that clears",
);
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  if (PROBE.includes(name) === false) continue;
  console.log(name);
  const curve = LADDER.map((out) => {
    const counts = OPENINGS.map((open) => at(document, out, open));
    const least = OPENINGS.find((_, i) => counts[i] === 0) ?? null;
    console.log(
      `  ${String(out).padEnd(24)} ` +
        counts.map((one) => String(one).padStart(8)).join("") +
        `   ${least === null ? "never" : least}`,
    );
    return { out, counts, least };
  });
  rows[name] = curve;
  const unreachable = curve.filter((one) => one.least === null);
  if (unreachable.length > 0)
    console.log(
      `  no opening clears ${unreachable.map((one) => one.out).join(", ")}`,
    );
}

console.log(
  `
an even narrowing at tongueOut ${STUCK}, which no opening cleared:`,
);
console.log(
  `${"subject / share".padEnd(26)} ` +
    OPENINGS.map((one) => `jaw ${one}`.padStart(8)).join(""),
);
for (const document of documents) {
  const name = document.id.replace("-connected", "");
  if (PROBE.includes(name) === false) continue;
  console.log(name);
  for (const share of SHARES)
    console.log(
      `  ${String(share).padEnd(24)} ` +
        OPENINGS.map((open) =>
          String(evenly(document, share, open)).padStart(8),
        ).join(""),
    );
}

fs.writeFileSync(
  "../.shots/human-2469/investigation-2498/tongue-precondition-curve.json",
  `${JSON.stringify(rows, null, 2)}\n`,
);
