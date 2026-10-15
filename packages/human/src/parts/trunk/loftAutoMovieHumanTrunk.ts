import {
  IAutoMovieSurfaceCage,
  IAutoMovieSurfaceCoordinate,
  IAutoMovieSurfaceNetwork,
  IAutoMovieSweep,
  IAutoMovieSweepSection,
  sampleAutoMovieSurfaceNetwork,
} from "@automovie/engine";
import { IAutoMovieQuaternion, IAutoMovieVector3 } from "@automovie/interface";

import { AutoMovieHumanBranch } from "../../junction/AutoMovieHumanBranch";
import { AutoMovieHumanSide } from "../../junction/AutoMovieHumanSide";
import { IAutoMovieHumanCage } from "../../junction/IAutoMovieHumanCage";
import { IAutoMovieHumanRing } from "../../junction/IAutoMovieHumanRing";
import { IAutoMovieHumanRingShape } from "../../junction/IAutoMovieHumanRingShape";
import { IAutoMovieHumanSurfaceCoordinate } from "../../junction/IAutoMovieHumanSurfaceCoordinate";
import { shapeAutoMovieHumanRing } from "../../junction/shapeAutoMovieHumanRing";
import { IAutoMovieHumanMeasurements } from "../../measure/IAutoMovieHumanMeasurements";
import { AutoMovieHumanVector } from "../../skeleton/AutoMovieHumanVector";
import { IAutoMovieHumanSkeleton } from "../../skeleton/IAutoMovieHumanSkeleton";
import { AUTOMOVIE_HUMAN_TRUNK_FORM } from "./AUTOMOVIE_HUMAN_TRUNK_FORM";
import { IAutoMovieHumanTrunkFrame } from "./IAutoMovieHumanTrunkFrame";
import { measureAutoMovieHumanTrunkFrame } from "./measureAutoMovieHumanTrunkFrame";
import { profileAutoMovieHumanTrunk } from "./profileAutoMovieHumanTrunk";
import { sectionAutoMovieHumanTrunkCrotch } from "./sectionAutoMovieHumanTrunkCrotch";

/**
 * Loft the trunk: one sweep up the body from the crotch to the neck-base ring, with the shoulder tubes leaving openings in its flanks for the mid-upper-arm rings and the hip tubes leaving its lower edge on either side of a fork curve for the mid-thigh rings.
 *
 * The sweep's sections are the trunk profile's level superellipses, read at the crotch, at even steps from the buttock level to the axilla and at the shoulder line, every one in a level plane as anthropometry measures them, so the section family is one continuous family from the pelvis through the axilla and the surface between stations reproduces the profile: between stations the engine interpolates every section parameter monotonically, so no section bulges past its neighbours and no band appears where one family would switch to another. Each tube is a short sweep from inside its opening to its junction ring, joined to the trunk by a bridge that leaves the opening tangent to the trunk, and its last section is pinned to the ring the neighbouring part shares, so the junction welds coincident vertices as before.
 *
 * Topology is fixed by the patch layout alone: twelve columns around the trunk (four in front, two on each flank, four behind), a two-by-two opening on each flank (the eight vertices of the upper-arm ring), and loops of twelve under the pelvis for the thigh rings, so every identity yields the same cage.
 *
 * @param measurements Resolved measurements of the person
 * @param skeleton The person's skeleton
 * @returns The trunk cage in millimetres with its five rings
 */
export function loftAutoMovieHumanTrunk(
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
): IAutoMovieHumanCage {
  const network: INetwork = networkOf(measurements, skeleton);
  const sampled: IAutoMovieSurfaceCage = sampleAutoMovieSurfaceNetwork({
    network: network.value,
    tier: TIER,
  });
  return emit(network, sampled);
}

/** Exponent of the crotch section and of the thighs' first sections, one superellipse family so their contours agree. */
const FORK_EXPONENT: number = 2.5;

/** The fork curve under the crotch: its two inner points lie `drop` trunk rows below the crotch and `inset` of the crotch depth in from the front and the back. */
const FORK = { drop: 0.5, inset: 0.12 } as const;

/** Steps between the stations from the axilla to the shoulder line, where the planes lean toward the neck ring's. */
const UPPER_STEPS: number = 4;

/** Share of the neck ring's lean the shoulder line's and the slope's planes take. */
const NECK_TILT = { shoulder: 0.8, slope: 1 } as const;

/** Exponent of the thighs' medial sides at the crotch, flattened where they press together. */
const MEDIAL_EXPONENT: number = 4;

/** Steps between the stations from the buttock level to the axilla, about 25 mm each in an adult. */
const STEPS: number = 16;

/** The tier the human profile samples; one tier keeps one topology until resolution tiers reach the other parts. */
const TIER = "medium" as const;

/** A horizontal section plane: first axis `+Z` (forward), second `+X` (the person's left), normal `+Y`. */
const HORIZONTAL: IAutoMovieQuaternion = { x: -0.5, y: -0.5, z: -0.5, w: 0.5 };

/** The same count at every tier. */
const fixed = (n: number): IAutoMovieSurfaceNetwork.ICounts => ({
  lowest: n,
  low: n,
  medium: n,
  high: n,
});

/** Where each tube's last row starts: the loop there repeats the ring's section, one row before the ring. */
const COLLAR = { arm: 2 / 3, thigh: 1 / 2 } as const;

/** Rows of the trunk from the crotch to the axilla; the hip bridges and tubes take rows of the same height, so the subdivided surface meets no change of row spacing at the hips. */
const LOWER_ROWS: number = 10;

/** Trunk strips by `v`, a twelfth of a turn per column: front across the anterior midline, left flank, back, right flank. */
const STRIPS: Array<{
  name: string;
  v: [number, number];
  columns: number;
}> = [
  { name: "front", v: [-1 / 6, 1 / 6], columns: 4 },
  { name: "left", v: [1 / 6, 1 / 3], columns: 2 },
  { name: "back", v: [1 / 3, 2 / 3], columns: 4 },
  { name: "right", v: [2 / 3, 5 / 6], columns: 2 },
];

interface INetwork {
  value: IAutoMovieSurfaceNetwork;
  shapes: Array<{ ring: string; shape: IAutoMovieHumanRingShape }>;
}

const networkOf = (
  measurements: IAutoMovieHumanMeasurements,
  skeleton: IAutoMovieHumanSkeleton,
): INetwork => {
  const frame: IAutoMovieHumanTrunkFrame = measureAutoMovieHumanTrunkFrame(
    measurements,
    skeleton,
    "left",
  );
  const profile: profileAutoMovieHumanTrunk.IProfile =
    profileAutoMovieHumanTrunk(frame);
  const ring = (
    site: "neckBase" | "upperArm" | "thigh",
    side: AutoMovieHumanSide | null,
  ): IAutoMovieHumanRingShape =>
    shapeAutoMovieHumanRing({
      skeleton,
      measurements,
      site,
      side,
      part: "trunk",
    });
  const neck: IAutoMovieHumanRingShape = ring("neckBase", null);
  const arms: Record<AutoMovieHumanSide, IAutoMovieHumanRingShape> = {
    left: ring("upperArm", "left"),
    right: ring("upperArm", "right"),
  };
  const thighs: Record<AutoMovieHumanSide, IAutoMovieHumanRingShape> = {
    left: ring("thigh", "left"),
    right: ring("thigh", "right"),
  };

  // trunk stations at the profile's levels, millimetres, increasing in height
  const L: IAutoMovieHumanTrunkFrame.ILevels = frame.levels;
  const shoulderLine: number = frame.acromion.y;
  const levels: number[] = [
    L.crotch,
    ...Array.from(
      { length: STEPS + 1 },
      (_: unknown, k: number): number => L.buttock + ((L.axilla - L.buttock) * k) / STEPS,
    ),
    ...Array.from(
      { length: UPPER_STEPS },
      (_: unknown, k: number): number => L.axilla + ((shoulderLine - L.axilla) * (k + 1)) / UPPER_STEPS,
    ),
  ];
  // above the axilla the planes lean progressively toward the neck ring's, reaching its share at the shoulder line
  const lean = (y: number): number =>
    y <= L.axilla ? 0 : NECK_TILT.shoulder * Math.min(1, (y - L.axilla) / (shoulderLine - L.axilla));
  // at the crotch the section is the outer contour of the two thighs side by side; at the gluteal furrow below it each
  // thigh's tube starts on its own half of that contour, in the same superellipse family, so the bridges between them
  // join two nearly coincident loops
  const lobe = (y: number): { centre: number; depth: number; half: number } => ({
    centre: (profile.front(y) + profile.back(y)) / 2,
    depth: (profile.front(y) - profile.back(y)) / 2,
    half: profile.half(y),
  });
  const crotch = lobe(L.crotch);
  const furrow = lobe(L.gluteal);
  // a level plane turned part of the way to the neck ring's plane, which leans forward: its front lies at the jugular
  // notch, lower than its back at cervicale, as the clavicles lie lower than the trapezius
  const tilt = (share: number): IAutoMovieQuaternion => {
    const a: IAutoMovieQuaternion = HORIZONTAL;
    let b: IAutoMovieQuaternion = ringRotation(neck, 0);
    if (a.x * b.x + a.y * b.y + a.z * b.z + a.w * b.w < 0) b = { x: -b.x, y: -b.y, z: -b.z, w: -b.w };
    const q: IAutoMovieQuaternion = {
      x: a.x + (b.x - a.x) * share,
      y: a.y + (b.y - a.y) * share,
      z: a.z + (b.z - a.z) * share,
      w: a.w + (b.w - a.w) * share,
    };
    const n: number = Math.hypot(q.x, q.y, q.z, q.w);
    return { x: q.x / n, y: q.y / n, z: q.z / n, w: q.w / n };
  };
  // the front and back of the profile where a plane through a centre, turned by a rotation, meets them: the plane's
  // height changes with depth by its slope, so the profile is read at the height the plane reaches there
  const reach = (
    centre: IAutoMovieVector3,
    rotation: IAutoMovieQuaternion,
  ): { front: number; back: number; slope: number } => {
    const normal: IAutoMovieVector3 = rotate(rotation, { x: 0, y: 0, z: 1 });
    const slope: number = normal.z / normal.y;
    const meet = (read: (y: number) => number): number => {
      let z: number = read(centre.y);
      for (let k: number = 0; k < 8; ++k) z = read(centre.y - slope * (z - centre.z));
      return z;
    };
    return { front: meet(profile.front), back: meet(profile.back), slope };
  };
  const sections: Array<{ centre: IAutoMovieVector3; section: IAutoMovieSweepSection }> =
    levels.map((y: number, k: number) => {
      if (k === 0)
        return {
          centre: AutoMovieHumanVector.of(0, y, crotch.centre),
          section: sectionAutoMovieHumanTrunkCrotch({
            depth: crotch.depth,
            half: crotch.half,
            exponent: FORK_EXPONENT,
            medial: MEDIAL_EXPONENT,
            recess: {
              front: AUTOMOVIE_HUMAN_TRUNK_FORM.crotch.frontRecess * frame.buttock.depth,
              back: AUTOMOVIE_HUMAN_TRUNK_FORM.crotch.backRecess * frame.buttock.depth,
            },
          }),
        };
      const widest: number = profile.widest(y);
      const half: number =
        y >= shoulderLine - 1
          ? Math.max(profile.half(L.axilla), frame.acromion.x - 15)
          : profile.half(y);
      const square: { front: number; back: number } = profile.squareness(y);
      const centre: IAutoMovieVector3 = AutoMovieHumanVector.of(0, y, widest);
      // the shoulder line's plane leans toward the neck ring's, so its front and back are read where that plane meets them
      const plane =
        lean(y) > 0 ? reach(centre, tilt(lean(y))) : { front: profile.front(y), back: profile.back(y), slope: 0 };
      const stretch: number = Math.hypot(1, plane.slope);
      return {
        centre,
        section: {
          type: "superellipse",
          right: metres(Math.max(20, (plane.front - widest) * stretch)),
          up: metres(half),
          left: metres(Math.max(20, (widest - plane.back) * stretch)),
          down: metres(half),
          exponents: [square.front, square.back, square.back, square.front],
        },
      };
    });
  // the trapezius slope from the shoulder line to the neck base, then the neck ring itself
  const shoulder = sections[sections.length - 1]!;
  const neckOrigin: IAutoMovieVector3 = neck.frame.origin;
  const slopeY: number = shoulderLine + 0.45 * (neckOrigin.y - shoulderLine);
  const neckHalf: number = (neck.radii[3]! + neck.radii[9]!) / 2;
  // the slope's plane is the neck ring's, its front and back where that plane meets the profile
  const slopeCentre: IAutoMovieVector3 = AutoMovieHumanVector.of(0, slopeY, (shoulder.centre.z + neckOrigin.z) / 2);
  const slopePlane = reach(slopeCentre, tilt(NECK_TILT.slope));
  const slopeStretch: number = Math.hypot(1, slopePlane.slope);
  sections.push({
    centre: AutoMovieHumanVector.of(
      0,
      slopeY,
      (shoulder.centre.z + neckOrigin.z) / 2,
    ),
    section: {
      type: "superellipse",
      right: metres(Math.max(25, (slopePlane.front - slopeCentre.z) * slopeStretch)),
      up: metres(neckHalf + 0.45 * (millimetres((shoulder.section as IAutoMovieSweepSection.ISuperellipse).up) - neckHalf)),
      left: metres(Math.max(25, (slopeCentre.z - slopePlane.back) * slopeStretch)),
      down: metres(neckHalf + 0.45 * (millimetres((shoulder.section as IAutoMovieSweepSection.ISuperellipse).up) - neckHalf)),
      exponents: [2.2, 2.2, 2.2, 2.2],
    },
  });
  sections.push({ centre: neckOrigin, section: ringSection(neck, 0) });

  const spinePoints: IAutoMovieVector3[] = sections.map((s) => toMetres(s.centre));
  const ats: number[] = chordShares(spinePoints);
  const trunk: IAutoMovieSweep = {
    spine: { points: spinePoints, normal: { x: 0, y: 0, z: 1 } },
    // the planes stay level between stations too, however the spine bends through the sections' centres
    orientation: "fixed",
    // anthropometry measures every trunk section in a horizontal plane, so each station below the neck ring lies in one
    // whatever the spine's bend, its first axis forward and its second toward the person's left
    stations: sections.map((s, k: number): IAutoMovieSweep.IStation => ({
      at: ats[k]!,
      section: s.section,
      rotation:
        k === sections.length - 1
          ? ringRotation(neck, 0)
          : k === sections.length - 2
            ? tilt(NECK_TILT.slope)
            : k > 0 && lean(levels[k]!) > 0
              ? tilt(lean(levels[k]!))
              : HORIZONTAL,
    })),
  };
  // the station nearest the axilla opens the shoulder band, which ends at the shoulder line
  const axillaIndex: number = levels.reduce(
    (best: number, y: number, k: number): number =>
      Math.abs(y - L.axilla) < Math.abs(levels[best]! - L.axilla) ? k : best,
    0,
  );
  const uAxilla: number = ats[Math.min(axillaIndex, levels.length - 2)]!;
  const uShoulder: number = ats[levels.length - 1]!;

  // each tube's spine length, which spaces its collar loop one row before its ring
  const lengths: Record<string, number> = {};
  // shoulder tubes from inside each opening to the upper-arm ring
  const armTube = (side: AutoMovieHumanSide): IAutoMovieSweep => {
    const shape: IAutoMovieHumanRingShape = arms[side];
    const sign: number = side === "left" ? 1 : -1;
    const start: IAutoMovieVector3 = AutoMovieHumanVector.of(
      sign * (frame.acromion.x + 0.3 * frame.deltoid),
      frame.shoulder.y,
      frame.shoulder.z,
    );
    lengths[`upperArm.${side}`] = AutoMovieHumanVector.distance(start, shape.frame.origin);
    const r0: number = (1.2 * frame.armGirth) / (2 * Math.PI);
    return {
      spine: {
        points: [toMetres(start), toMetres(shape.frame.origin)],
        normal: shape.directions[0]!,
      },
      // the last row repeats the ring, so the loop next to it sits at the ring's own radii and the joined girth is the ring's
      stations: [
        { at: 0, section: circle(r0) },
        { at: COLLAR.arm, section: ringSection(shape, 0), rotation: ringRotation(shape, 0) },
        { at: 1, section: ringSection(shape, 0), rotation: ringRotation(shape, 0) },
      ],
    };
  };

  // hip tubes from under the pelvis to the mid-thigh ring; their first axis faces back, so the ring starts half a turn round
  const thighTube = (side: AutoMovieHumanSide): IAutoMovieSweep => {
    const shape: IAutoMovieHumanRingShape = thighs[side];
    const sign: number = side === "left" ? 1 : -1;
    // each tube starts one trunk row below the crotch on its half of the two thighs' contour, the contour at the gluteal
    // furrow carried toward the ring's extent by the start's share of the way down to the ring
    const y: number = L.crotch - (L.axilla - L.crotch) / LOWER_ROWS;
    const w: number = Math.min(1, Math.max(0, (L.gluteal - y) / (L.gluteal - shape.frame.origin.y)));
    const xs: number[] = shape.positions.map((p: IAutoMovieVector3): number => sign * p.x);
    const zs: number[] = shape.positions.map((p: IAutoMovieVector3): number => p.z);
    const lerp = (a: number, b: number): number => a + (b - a) * w;
    const outer: number = lerp(furrow.half, Math.max(...xs));
    const lobe = {
      depth: lerp(furrow.depth, (Math.max(...zs) - Math.min(...zs)) / 2),
      centre: lerp(furrow.centre, (Math.max(...zs) + Math.min(...zs)) / 2),
    };
    const start: IAutoMovieVector3 = AutoMovieHumanVector.of((sign * outer) / 2, y, lobe.centre);
    lengths[`thigh.${side}`] = AutoMovieHumanVector.distance(start, shape.frame.origin);
    return {
      spine: {
        points: [toMetres(start), toMetres(shape.frame.origin)],
        normal: { x: 0, y: 0, z: -1 },
      },
      stations: [
        {
          at: 0,
          // level like the crotch section above it, first axis backward, second toward the person's left
          rotation: quaternionOf(
            { x: 0, y: 0, z: -1 },
            { x: 1, y: 0, z: 0 },
            { x: 0, y: -1, z: 0 },
          ),
          section: {
            type: "superellipse",
            right: metres(lobe.depth),
            up: metres(outer / 2),
            left: metres(lobe.depth),
            down: metres(outer / 2),
            // the second axis points to the person's left, so the medial quadrants are the negative ones on the left thigh
            exponents:
              side === "left"
                ? [FORK_EXPONENT, FORK_EXPONENT, MEDIAL_EXPONENT, MEDIAL_EXPONENT]
                : [MEDIAL_EXPONENT, MEDIAL_EXPONENT, FORK_EXPONENT, FORK_EXPONENT],
          },
        },
        {
          at: COLLAR.thigh,
          section: ringSection(shape, shape.count / 2),
          rotation: ringRotation(shape, shape.count / 2),
        },
        {
          at: 1,
          section: ringSection(shape, shape.count / 2),
          rotation: ringRotation(shape, shape.count / 2),
        },
      ],
    };
  };

  const sweeps: Record<string, IAutoMovieSweep> = {
    trunk,
    leftShoulder: armTube("left"),
    rightShoulder: armTube("right"),
    leftHip: thighTube("left"),
    rightHip: thighTube("right"),
  };

  const patches: IAutoMovieSurfaceNetwork.IPatch[] = [];
  const bands: Array<{ u: [number, number]; rows: number }> = [
    { u: [0, uAxilla], rows: LOWER_ROWS },
    { u: [uAxilla, uShoulder], rows: 2 },
    // one row from the shoulder line to the neck ring: the leaning shoulder plane comes within a few millimetres of the
    // ring at the front and back, so more rows there would crowd into a crease
    { u: [uShoulder, 1], rows: 1 },
  ];
  for (const band of bands)
    for (const strip of STRIPS) {
      if (band === bands[1] && strip.columns === 2) continue;
      patches.push({
        type: "sweep",
        name: `trunk.${strip.name}.${patches.length}`,
        sweep: "trunk",
        u: band.u,
        v: strip.v,
        rows: fixed(band.rows),
        columns: fixed(strip.columns),
      });
    }
  for (const name of ["leftShoulder", "rightShoulder"])
    patches.push({
      type: "sweep",
      name,
      sweep: name,
      u: [0, 1],
      v: [0, 1],
      rows: fixed(3),
      columns: fixed(8),
    });
  // hip tube strips by v, matched to the pieces of the loop they meet: half the back strip, the flank, half the front strip, the fork curve;
  // the tube's v runs from the back (0) through the left (1/4) to the front (1/2), so its outer half meets the trunk's half loop
  // direction for direction and its medial half meets the fork; a twelfth of a turn per column, so the tube ends on the ring's
  // twelve directions with the anterior one at v 0.5
  const hipLeft: Array<{ v: [number, number]; columns: number }> = [
    { v: [0, 2 / 12], columns: 2 },
    { v: [2 / 12, 4 / 12], columns: 2 },
    { v: [4 / 12, 6 / 12], columns: 2 },
    { v: [6 / 12, 12 / 12], columns: 6 },
  ];
  const hipStrips: Record<string, typeof hipLeft> = {
    leftHip: hipLeft,
    rightHip: [...hipLeft].reverse().map((s) => ({
      v: [1 - s.v[1], 1 - s.v[0]] as [number, number],
      columns: s.columns,
    })),
  };
  for (const name of ["leftHip", "rightHip"])
    hipStrips[name]!.forEach((s, k: number): void => {
      patches.push({
        type: "sweep",
        name: `${name}.${k}`,
        sweep: name,
        u: [0, 1],
        v: s.v,
        rows: fixed(2),
        columns: fixed(s.columns),
      });
    });

  const [u0, u1] = bands[1]!.u;
  const start = (name: string): IAutoMovieSurfaceNetwork.IEdge[] => [
    edge(name, [0, 0], [0, 1], 8),
  ];
  patches.push(
    {
      type: "bridge",
      name: "joinLeftShoulder",
      from: {
        edges: [
          edge("trunk", [u0, 1 / 6], [u0, 1 / 3], 2),
          edge("trunk", [u0, 1 / 3], [u1, 1 / 3], 2),
          edge("trunk", [u1, 1 / 3], [u1, 1 / 6], 2),
          edge("trunk", [u1, 1 / 6], [u0, 1 / 6], 2),
        ],
        tangent: "across",
      },
      to: { edges: start("leftShoulder"), tangent: "forward" },
      rows: fixed(2),
      tension: 0.8,
    },
    {
      type: "bridge",
      name: "joinRightShoulder",
      from: {
        edges: [
          edge("trunk", [u0, 5 / 6], [u1, 5 / 6], 2),
          edge("trunk", [u1, 5 / 6], [u1, 2 / 3], 2),
          edge("trunk", [u1, 2 / 3], [u0, 2 / 3], 2),
          edge("trunk", [u0, 2 / 3], [u0, 5 / 6], 2),
        ],
        tangent: "across",
      },
      to: { edges: start("rightShoulder"), tangent: "forward" },
      rows: fixed(2),
      tension: 0.8,
    },
  );
  const hipStart = (name: string): IAutoMovieSurfaceNetwork.IEdge[] =>
    hipStrips[name]!.map(
      (s): IAutoMovieSurfaceNetwork.IEdge =>
        edge(name, [0, s.v[0]], [0, s.v[1]], s.columns),
    );
  patches.push(
    {
      type: "bridge",
      name: "joinLeftHip",
      from: {
        edges: [
          edge("trunk", [0, 0.5], [0, 1 / 3], 2),
          edge("trunk", [0, 1 / 3], [0, 1 / 6], 2),
          edge("trunk", [0, 1 / 6], [0, 0], 2),
          { type: "curve", curve: "fork" },
        ],
        tangent: "across",
      },
      to: { edges: hipStart("leftHip"), tangent: "forward" },
      rows: fixed(1),
      tension: 0.6,
    },
    {
      type: "bridge",
      name: "joinRightHip",
      from: {
        edges: [
          { type: "curve", curve: "fork", reverse: true },
          edge("trunk", [0, 1], [0, 5 / 6], 2),
          edge("trunk", [0, 5 / 6], [0, 2 / 3], 2),
          edge("trunk", [0, 2 / 3], [0, 0.5], 2),
        ],
        tangent: "across",
      },
      to: { edges: hipStart("rightHip"), tangent: "forward" },
      rows: fixed(1),
      tension: 0.6,
    },
  );

  const crotchFront: number = profile.front(L.crotch);
  const crotchBack: number = profile.back(L.crotch);
  const row: number = (L.axilla - L.crotch) / LOWER_ROWS;
  const value: IAutoMovieSurfaceNetwork = {
    sweeps,
    nodes: {
      forkFront: { type: "sweep", sweep: "trunk", u: 0, v: 0 },
      forkBack: { type: "sweep", sweep: "trunk", u: 0, v: 0.5 },
    },
    curves: {
      fork: {
        from: "forkFront",
        to: "forkBack",
        through: [
          toMetres(
            AutoMovieHumanVector.of(
              0,
              L.crotch - FORK.drop * row,
              crotchFront - FORK.inset * (crotchFront - crotchBack),
            ),
          ),
          toMetres(
            AutoMovieHumanVector.of(
              0,
              L.crotch - FORK.drop * row,
              crotchBack + FORK.inset * (crotchFront - crotchBack),
            ),
          ),
        ],
        segments: fixed(6),
        normal: { x: 0, y: -1, z: 0 },
      },
    },
    patches,
    rings: [
      {
        name: "neckBase",
        edges: [
          edge("trunk", [1, 0], [1, 1 / 6], 2),
          edge("trunk", [1, 1 / 6], [1, 1 / 3], 2),
          edge("trunk", [1, 1 / 3], [1, 2 / 3], 4),
          edge("trunk", [1, 2 / 3], [1, 5 / 6], 2),
          edge("trunk", [1, 5 / 6], [1, 1], 2),
        ],
        positions: neck.positions.map(toMetres),
      },
      ...(["left", "right"] as const).flatMap((side) => [
        {
          name: `upperArm.${side}`,
          edges: [edge(`${side}Shoulder`, [1, 0], [1, 1], 8)],
          positions: arms[side].positions.map(toMetres),
        },
        {
          name: `thigh.${side}`,
          edges: [edge(`${side}Hip`, [1, 0.5], [1, 1.5], 12)],
          positions: thighs[side].positions.map(toMetres),
        },
        // the loop one row before each ring, pinned to the ring moved back along its axis, so the trunk's share of the joined girth is the ring's own
        {
          name: `upperArm.${side}.collar`,
          edges: [edge(`${side}Shoulder`, [COLLAR.arm, 0], [COLLAR.arm, 1], 8)],
          positions: collarOf(arms[side], (1 - COLLAR.arm) * lengths[`upperArm.${side}`]!),
        },
        {
          name: `thigh.${side}.collar`,
          edges: [edge(`${side}Hip`, [COLLAR.thigh, 0.5], [COLLAR.thigh, 1.5], 12)],
          positions: collarOf(thighs[side], (1 - COLLAR.thigh) * lengths[`thigh.${side}`]!),
        },
      ]),
    ],
  };
  return {
    value,
    shapes: [
      { ring: "neckBase", shape: neck },
      { ring: "upperArm.left", shape: arms.left },
      { ring: "upperArm.right", shape: arms.right },
      { ring: "thigh.left", shape: thighs.left },
      { ring: "thigh.right", shape: thighs.right },
    ],
  };
};

/** The ring's control positions moved `distance` millimetres back along its axis, into the part, in metres. */
const collarOf = (
  shape: IAutoMovieHumanRingShape,
  distance: number,
): IAutoMovieVector3[] => {
  const n: IAutoMovieVector3 = AutoMovieHumanVector.normalize(shape.frame.normal);
  return shape.positions.map((p: IAutoMovieVector3) =>
    toMetres(AutoMovieHumanVector.offset(p, [n, -distance])),
  );
};

/** A circle of radius `r` millimetres. */
const circle = (r: number): IAutoMovieSweepSection => ({
  type: "superellipse",
  right: metres(r),
  up: metres(r),
  left: metres(r),
  down: metres(r),
  exponents: [2, 2, 2, 2],
});

/** The ring's section as a superellipse with its first axis along vertex `first`. */
const ringSection = (
  shape: IAutoMovieHumanRingShape,
  first: number,
): IAutoMovieSweepSection => {
  const n: number = shape.count;
  const r = (k: number): number => metres(shape.radii[(first + k) % n]!);
  return {
    type: "superellipse",
    right: r(0),
    up: r(n / 4),
    left: r(n / 2),
    down: r((3 * n) / 4),
    exponents: [2, 2, 2, 2],
  };
};

/** Rotation taking `+X` to the ring direction of vertex `first`, `+Z` to the ring's normal. */
const ringRotation = (
  shape: IAutoMovieHumanRingShape,
  first: number,
): IAutoMovieQuaternion => {
  const z: IAutoMovieVector3 = AutoMovieHumanVector.normalize(shape.frame.normal);
  const raw: IAutoMovieVector3 = shape.directions[first % shape.count]!;
  const x: IAutoMovieVector3 = AutoMovieHumanVector.normalize(
    AutoMovieHumanVector.offset(raw, [z, -AutoMovieHumanVector.dot(raw, z)]),
  );
  const y: IAutoMovieVector3 = AutoMovieHumanVector.cross(z, x);
  return quaternionOf(x, y, z);
};

/** A vector turned by a unit quaternion. */
const rotate = (q: IAutoMovieQuaternion, v: IAutoMovieVector3): IAutoMovieVector3 => {
  const tx: number = 2 * (q.y * v.z - q.z * v.y);
  const ty: number = 2 * (q.z * v.x - q.x * v.z);
  const tz: number = 2 * (q.x * v.y - q.y * v.x);
  return {
    x: v.x + q.w * tx + (q.y * tz - q.z * ty),
    y: v.y + q.w * ty + (q.z * tx - q.x * tz),
    z: v.z + q.w * tz + (q.x * ty - q.y * tx),
  };
};

/** The unit quaternion of the rotation whose matrix columns are `x`, `y`, `z`. */
const quaternionOf = (
  x: IAutoMovieVector3,
  y: IAutoMovieVector3,
  z: IAutoMovieVector3,
): IAutoMovieQuaternion => {
  const m00 = x.x, m10 = x.y, m20 = x.z;
  const m01 = y.x, m11 = y.y, m21 = y.z;
  const m02 = z.x, m12 = z.y, m22 = z.z;
  const trace: number = m00 + m11 + m22;
  if (trace > 0) {
    const s: number = Math.sqrt(trace + 1) * 2;
    return { w: s / 4, x: (m21 - m12) / s, y: (m02 - m20) / s, z: (m10 - m01) / s };
  }
  if (m00 > m11 && m00 > m22) {
    const s: number = Math.sqrt(1 + m00 - m11 - m22) * 2;
    return { w: (m21 - m12) / s, x: s / 4, y: (m01 + m10) / s, z: (m02 + m20) / s };
  }
  if (m11 > m22) {
    const s: number = Math.sqrt(1 + m11 - m00 - m22) * 2;
    return { w: (m02 - m20) / s, x: (m01 + m10) / s, y: s / 4, z: (m12 + m21) / s };
  }
  const s: number = Math.sqrt(1 + m22 - m00 - m11) * 2;
  return { w: (m10 - m01) / s, x: (m02 + m20) / s, y: (m12 + m21) / s, z: s / 4 };
};

const edge = (
  sweep: string,
  from: [number, number],
  to: [number, number],
  segments: number,
): IAutoMovieSurfaceNetwork.ISweepEdge => ({
  type: "sweep",
  sweep,
  from: { u: from[0], v: from[1] },
  to: { u: to[0], v: to[1] },
  segments: fixed(segments),
});

/** Each point's share of the polyline's chord length, 0 at the first and 1 at the last. */
const chordShares = (points: IAutoMovieVector3[]): number[] => {
  const lengths: number[] = [0];
  for (let k: number = 1; k < points.length; ++k)
    lengths.push(
      lengths[k - 1]! + AutoMovieHumanVector.distance(points[k - 1]!, points[k]!),
    );
  const total: number = lengths[lengths.length - 1]!;
  return lengths.map((l: number): number => l / total);
};

const metres = (mm: number): number => mm / 1000;
const millimetres = (m: number): number => m * 1000;
const toMetres = (p: IAutoMovieVector3): IAutoMovieVector3 => ({
  x: p.x / 1000,
  y: p.y / 1000,
  z: p.z / 1000,
});

/** Turn the sampled network into the trunk cage: millimetres, chart addresses and rings. */
const emit = (
  network: INetwork,
  sampled: IAutoMovieSurfaceCage,
): IAutoMovieHumanCage => {
  const positions: number[] = sampled.cage.positions;
  const vertices: IAutoMovieHumanCage.IVertex[] = [];
  for (let k: number = 0; k < positions.length; k += 3)
    vertices.push({
      position: {
        x: millimetres(positions[k]!),
        y: millimetres(positions[k + 1]!),
        z: millimetres(positions[k + 2]!),
      },
    });
  const patches: IAutoMovieSurfaceNetwork.IPatch[] = network.value.patches;
  const faces: IAutoMovieHumanCage.IFace[] = sampled.cage.faces.map(
    (face: number[], f: number): IAutoMovieHumanCage.IFace => {
      const corners = sampled.corners[f]!;
      const raw = corners.map((c: IAutoMovieSurfaceCoordinate) =>
        addressOf(patches[c.patch]!, c.s, c.t),
      );
      return {
        vertices: [face[0]!, face[1]!, face[2]!, face[3]!],
        coordinates: unwrap(raw) as IAutoMovieHumanCage.IFace["coordinates"],
      };
    },
  );
  const rings: IAutoMovieHumanRing[] = network.shapes.map(
    ({ ring, shape }): IAutoMovieHumanRing => ({
      site: shape.site,
      side: shape.side,
      vertices: sampled.rings[ring]!,
      start: shape.start,
      frame: shape.frame,
    }),
  );
  return { vertices, faces, creases: [], rings };
};

/** The chart address of a patch point: the trunk's main chart, or the branch chart of a shoulder or hip tube and its bridge. */
const addressOf = (
  patch: IAutoMovieSurfaceNetwork.IPatch,
  s: number,
  t: number,
): IAutoMovieHumanSurfaceCoordinate.IOn<"trunk"> => {
  const lerp = (r: [number, number], x: number): number => r[0] + (r[1] - r[0]) * x;
  const wrap = (v: number): number => ((v % 1) + 1) % 1;
  const branchOf = (name: string): AutoMovieHumanBranch<"trunk"> | null =>
    name.startsWith("leftShoulder") || name === "joinLeftShoulder"
      ? "leftShoulder"
      : name.startsWith("rightShoulder") || name === "joinRightShoulder"
        ? "rightShoulder"
        : name.startsWith("leftHip") || name === "joinLeftHip"
          ? "leftHip"
          : name.startsWith("rightHip") || name === "joinRightHip"
            ? "rightHip"
            : null;
  if (patch.type === "sweep") {
    const branch = branchOf(patch.name);
    if (branch === null)
      return { part: "trunk", side: null, branch: null, u: lerp(patch.u, t), v: wrap(lerp(patch.v, s)) };
    const hip: boolean = branch === "leftHip" || branch === "rightHip";
    return {
      part: "trunk",
      side: null,
      branch,
      u: 0.3 + 0.7 * lerp(patch.u, t),
      v: wrap(lerp(patch.v, s) - (hip ? 0.5 : 0)),
    };
  }
  return {
    part: "trunk",
    side: null,
    branch: branchOf(patch.name),
    u: 0.3 * t,
    v: wrap(s),
  };
};

/** Keep one face's corners within half a turn: a face across the wrap meridian writes 1 where it would write 0. */
const unwrap = (
  corners: IAutoMovieHumanSurfaceCoordinate.IOn<"trunk">[],
): IAutoMovieHumanSurfaceCoordinate.IOn<"trunk">[] => {
  const vs: number[] = corners.map((c) => c.v);
  if (Math.max(...vs) - Math.min(...vs) <= 0.5) return corners;
  return corners.map((c) => (c.v < 0.5 ? { ...c, v: c.v + 1 > 1 ? 1 : c.v + 1 } : c));
};
