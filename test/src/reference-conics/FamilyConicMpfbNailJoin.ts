import {
  AutoMovieViewLoft,
  AutoMovieLoftViewFullSource as Full,
  AutoMovieSolidIntersection as Intersection,
  AutoMovieConstructionSeeds as Seeds,
  AutoMovieSolidVector as Vec,
  inspectAutoMovieMeshTopology,
  measureAutoMovieMeshCrossings,
  realizeAutoMovieConstruction,
} from "@automovie/engine";
import {
  AutoMovieHumanNailLoop as Loop,
  AutoMovieHumanDigitNails as Nails,
} from "@automovie/human";
import type {
  IAutoMovieConstructionJoin,
  IAutoMovieConstructionRealization,
  IAutoMovieConstructionSharedLoop,
  IAutoMovieHumanDigitNails,
  IAutoMovieHumanNail,
  IAutoMovieSolidIntersection,
  IAutoMovieSolidSurface,
  IAutoMovieViewPart,
  AutoMovieVector3Tuple as P3,
} from "@automovie/interface";

import type { FamilyConicMpfbDigitTips as Tips } from "./FamilyConicMpfbDigitTips";
import { FamilyConicMpfbNailMesh as Mesh } from "./FamilyConicMpfbNailMesh";
import { FamilyConicMpfbNailPatch as Patch } from "./FamilyConicMpfbNailPatch";
import type { FamilyConicMpfbNailStock as Stock } from "./FamilyConicMpfbNailStock";
import { FamilyConicMpfbPairedNail as Paired } from "./FamilyConicMpfbPairedNail";

/** Native connection and clipped-depth receipts for the actual bed and plate. */
export namespace FamilyConicMpfbNailJoin {
  /** Only one percent of the clipping budget is spent on native curve solves. */
  const CONTACT_MM: number = Nails.CLIP_MM / 100;
  /** Separation of one clipping tolerance over the established fold chord. */
  const GRAZING: number = Math.atan2(Nails.CLIP_MM, Nails.CHORD_MM);
  /** Two samples per quarter supply a preliminary length for bed-pitch count. */
  const PILOT_COUNT: number = 8;

  /** An actual retained exterior and its optional explicit material boundary. */
  export interface IExterior {
    /** Indexed skin and nail triangles of the realized exterior. */
    mesh: IAutoMovieConstructionRealization.IMesh;
    /** Index-buffer offset at which the plate triangles begin. */
    plateFrom?: number;
  }

  /** Verify a one-skin material patch from its committed mesh incidence. */
  export function observePatch(
    cap: Tips.ICap,
    made: IAutoMovieHumanDigitNails.IMade,
    keep: (result: IExterior) => void,
    stock?: Stock.IPatch,
  ) {
    const patch = Patch.realize(cap, made, stock);
    const { mesh, seam, plateFrom } = patch;
    const topology = inspectAutoMovieMeshTopology(Mesh.topologyInput(mesh));
    const plateId: number = mesh.owners.indexOf(made.nail.plate.name);
    const bedId: number = mesh.owners.indexOf(cap.family.name);
    const direction = Mesh.clipping(
      mesh,
      plateId,
      bedId,
      made.nail.frame.dorsal,
    );
    const clearance = {
      ...direction,
      maximumMm: Math.max(direction.maximumMm, patch.inward),
    };
    const distalBoundary: number = Mesh.boundary(
      mesh,
      bedId,
      cap.view.stations[0]!,
    );
    const incidence = Mesh.seamIncidence(mesh.indices, seam, plateFrom);
    const skin = Mesh.topologyInput({
      positions: mesh.positions,
      indices: mesh.indices.slice(0, plateFrom),
    });
    const crown = Mesh.topologyInput({
      positions: mesh.positions,
      indices: mesh.indices.slice(plateFrom),
    });
    const crossings = {
      skin: measureAutoMovieMeshCrossings(crown, skin).length,
      crown: measureAutoMovieMeshCrossings(crown, crown).length,
    };
    const retained: boolean =
      topology.nonManifoldEdges === 0 &&
      topology.degenerate === 0 &&
      distalBoundary === 0 &&
      incidence.invalid === 0 &&
      crossings.skin === 0 &&
      crossings.crown === 0 &&
      clearance.maximumMm <= Nails.CLIP_MM;
    keep({ mesh, plateFrom });
    return {
      topology,
      distalBoundary,
      incidence,
      crossings,
      clearance,
      nominalInward: patch.nominalInward,
      retained,
      columns: patch.columns,
      rows: patch.rows,
      support: patch.support,
      profile: patch.milliseconds,
    };
  }

  /**
   * Inspect both actual faces along complete parent footprint rays. The first
   * share is the native nail loop's interior anchor.
   */
  export function anchors(
    cap: Tips.ICap,
    made: IAutoMovieHumanDigitNails.IMade,
  ) {
    const { nail } = made;
    const plate = AutoMovieViewLoft.create(
      Nails.attachmentPlate(nail.plate, nail.bed),
    );
    const host = AutoMovieViewLoft.create(
      Nails.addReliefs(cap.view, cap.family, [nail.bed, nail.strip]),
    );
    if (plate.chain === null || host.chain === null)
      throw new Error(
        JSON.stringify([...plate.diagnostics, ...host.diagnostics]),
      );
    const prepared = Loop.prepare(nail, plate.chain, host.chain, cap.tip);
    // Four subdivisions of each initial contact-clock cell resolve each side
    // and its corners. Shares include the native anchor and outer guards.
    const count: number = 4 * PILOT_COUNT;
    const shares: number[] = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 4];
    const rays = Array.from({ length: count }, (_, i) => {
      const clock: number = (2 * Math.PI * i) / count;
      const readings = shares.map((s) => ({
        host: prepared.chart(clock, s),
        plate: prepared.read(clock, s),
      }));
      const inside = (face: (typeof readings)[number]["plate"]): boolean =>
        face !== null && Math.max(face.gap, face.floorGap) < 0;
      const exit: number = readings.findIndex(
        ({ plate }): boolean => !inside(plate),
      );
      if (exit <= 0) return { clock, readings, boundary: null };
      let lo: number = shares[exit - 1]!,
        hi: number = shares[exit]!;
      // A 24-step bisection resolves a scale difference under 4e-7.
      for (let k: number = 0; k < 24; ++k) {
        const m: number = (hi + lo) / 2;
        if (inside(prepared.read(clock, m))) lo = m;
        else hi = m;
      }
      return {
        clock,
        readings,
        boundary: {
          share: lo,
          host: prepared.chart(clock, lo),
          plate: prepared.read(clock, lo),
          outside: prepared.read(clock, hi),
        },
      };
    });
    return { shares, rays };
  }

  /**
   * Attach one real nail to its scoped host through the live production
   * planner.
   */
  export function observe(
    cap: Tips.ICap,
    made: IAutoMovieHumanDigitNails.IMade,
    kept?: (mesh: IAutoMovieConstructionRealization.IMesh) => void,
    paired: boolean = false,
  ) {
    const { nail } = made;
    const bedded: IAutoMovieViewPart = Nails.addReliefs(cap.view, cap.family, [
      nail.bed,
      nail.strip,
    ]);
    const sources: Map<string, IAutoMovieViewPart> = new Map([
      [bedded.name, bedded],
    ]);
    const loopSources: Map<string, IAutoMovieConstructionSharedLoop.ISource> =
      new Map();
    const contacts: (
      | ReturnType<typeof contact>
      | ReturnType<typeof pairedContact>
    )[] = [];
    const root = Nails.attach(
      { type: "source", name: bedded.name, source: bedded.name },
      sources,
      [made],
      (plate, digit) => {
        const measured = paired
          ? pairedContact(plate, digit, nail, cap.tip, loopSources)
          : contact(plate, digit, nail);
        contacts.push(measured);
        return measured;
      },
    );
    if (root.type !== "join") throw new Error("Nail planner emitted no join");
    // Each surface spends one quarter of the 0.01 mm clipping bound on chord.
    const madeJoin: IAutoMovieConstructionRealization.IRealization =
      realizeAutoMovieConstruction(
        { name: bedded.name, root },
        { sources, loopSources, chord: Nails.CLIP_MM / 4000 },
      );
    const contactReceipt = contacts[0]!;
    const retained = madeJoin.joins.find((r): boolean => r.name === root.name);
    const mesh = madeJoin.mesh;
    if (retained !== undefined && madeJoin.diagnostics.length === 0)
      kept?.(mesh);
    const topology = inspectAutoMovieMeshTopology(Mesh.topologyInput(mesh));
    const plateId: number = mesh.owners.indexOf(nail.plate.name);
    const bedId: number = mesh.owners.indexOf(bedded.name);
    const clearance =
      retained === undefined
        ? null
        : Mesh.clipping(mesh, plateId, bedId, nail.frame.dorsal);
    const rejectedSide = madeJoin.diagnostics.find(
      (d): boolean => d.contract === "one kept side",
    );
    const loop =
      root.loop !== undefined && "source" in root.loop
        ? loopSources.get(root.loop.source)
        : undefined;
    const clock: number = Number(
      rejectedSide?.detail.match(/clock ([\d.]+)/)?.[1],
    );
    const side =
      loop?.kind === "ready" && Number.isFinite(clock)
        ? sideWitness(
            loop,
            sources.get(root.seed.partFace)!,
            bedded,
            clock,
            root.count,
          )
        : null;
    return {
      contact: contactReceipt,
      count: root.count,
      topology,
      distalBoundary: Mesh.boundary(mesh, bedId, bedded.stations[0]!),
      clearance,
      side,
      retained: retained !== undefined,
      diagnostics: madeJoin.diagnostics,
    };
  }

  /** The two side criteria at and around a reported direction reversal. */
  function sideWitness(
    loop: Extract<IAutoMovieConstructionSharedLoop.ISource, { kind: "ready" }>,
    plate: IAutoMovieViewPart,
    digit: IAutoMovieViewPart,
    clock: number,
    count: number,
  ) {
    const part = native(plate),
      host = native(digit);
    return [-1, 0, 1].map((i) => {
      const t: number = clock + (2 * Math.PI * i) / count;
      const p = loop.partAt(t),
        h = loop.at(t);
      const a = part.jet(...p.point),
        b = host.jet(...h.point);
      const tangent: P3 = Vec.unit(
        Vec.add(Vec.scale(b.u, h.first[0]), Vec.scale(b.v, h.first[1])),
      )!;
      const nA: P3 = Vec.unit(Vec.cross(a.u, a.v))!,
        nB: P3 = Vec.unit(Vec.cross(b.u, b.v))!;
      const square = Vec.unit(Vec.cross(nA, tangent))!;
      const away: P3 = Vec.add(
        Vec.scale(b.u, h.first[1]),
        Vec.scale(b.v, -h.first[0]),
      );
      const outside = Vec.unit(
        Vec.sub(away, Vec.scale(tangent, Vec.dot(tangent, away))),
      )!;
      const angle: number = Math.atan2(
        Vec.norm(Vec.cross(nA, nB)),
        Math.abs(Vec.dot(nA, nB)),
      );
      return {
        t,
        part: p.point,
        host: h.point,
        tangent,
        nA,
        nB,
        angle,
        normalSide: Vec.dot(square, nB),
        loopSide: -Vec.dot(square, outside),
        rule: angle < GRAZING ? "smooth" : "crossing",
      };
    });
  }

  /** Measure the parent's actual native footprint and publish both chart jets. */
  function pairedContact(
    plate: IAutoMovieViewPart,
    digit: IAutoMovieViewPart,
    nail: IAutoMovieHumanNail.INail,
    tip: number,
    loops: Map<string, IAutoMovieConstructionSharedLoop.ISource>,
  ): Pick<IAutoMovieConstructionJoin, "seed" | "tolerance" | "grazing"> & {
    curveLength: number;
    loop: IAutoMovieConstructionSharedLoop.IReference;
  } {
    const record = Paired.prepare(nail, plate, digit, tip);
    const parent = native(digit);
    const length = (clock: number): number => {
      const row = record.at(clock);
      const field = parent.jet(...row.point);
      return Vec.norm(
        Vec.add(
          Vec.scale(field.u, row.first[0]),
          Vec.scale(field.v, row.first[1]),
        ),
      );
    };
    const count: number = 4 * PILOT_COUNT;
    const step: number = (2 * Math.PI) / count;
    const curveLength: number =
      (Array.from(
        { length: count },
        (_, i) => length(i * step) + 2 * length((i + 0.5) * step),
      ).reduce((sum, x): number => sum + x, 0) *
        step) /
      3;
    const key: string = "nail-outline." + plate.name;
    loops.set(key, record);
    const [s, phi] = record.partAt(0).point;
    const [y, theta] = record.at(0).point;
    return {
      seed: {
        type: "point",
        partFace: plate.name,
        hostFace: digit.name,
        part: [s / 1000, phi],
        host: [y / 1000, theta],
      },
      tolerance: CONTACT_MM / 1000,
      grazing: GRAZING,
      curveLength,
      loop: { type: "source", source: key },
    };
  }

  /** The two complete original fields may have axial and phase reliefs. */
  function native(view: IAutoMovieViewPart): IAutoMovieSolidSurface {
    const source = Full.create(view);
    return {
      name: view.name,
      domain: [...source.domain],
      period: 2 * Math.PI,
      orientation: 1,
      point: source.point,
      pointAt: source.pointAt,
      jet: source.jet,
    };
  }

  /** Measure native crossings on the plate's two flank and two face meridians. */
  function contact(
    plate: IAutoMovieViewPart,
    digit: IAutoMovieViewPart,
    nail: IAutoMovieHumanNail.INail,
  ): Pick<
    IAutoMovieConstructionJoin,
    "seed" | "tolerance" | "grazing" | "parameter"
  > & {
    curveLength: number;
    shortestChord: number;
    minimumAngle: number;
    rejected: string[];
  } {
    const part: IAutoMovieSolidSurface = native(plate);
    const host: IAutoMovieSolidSurface = native(digit);
    const { origin, distal, dorsal } = nail.frame;
    const [fold, free] = nail.plan.span;
    const centre: P3 = Vec.add(origin, Vec.scale(distal, (fold + free) / 2));
    const parameter: IAutoMovieSolidIntersection.Parameter = {
      kind: "angle",
      centre,
      normal: dorsal,
      reference: distal,
    };
    const rejected: string[] = [];
    for (const phi of [0, Math.PI / 2, -Math.PI / 2, Math.PI]) {
      const found = Seeds.create(
        {
          type: "search",
          partFace: plate.name,
          hostFace: digit.name,
          phase: phi,
          from: 0,
          to: 1,
        },
        part,
        plate.stations,
        host,
        0,
        CONTACT_MM,
      );
      if (typeof found === "string") {
        rejected.push(found);
        continue;
      }
      const walked = Intersection.trace({
        part,
        host,
        seed: found,
        parameter,
        count: PILOT_COUNT,
        tolerance: CONTACT_MM,
        grazing: GRAZING,
      });
      const { curve, diagnostics } = walked;
      if (curve === null || diagnostics.length !== 0) {
        rejected.push(...diagnostics.map((d): string => d.detail));
        continue;
      }
      const step: number = (2 * Math.PI) / curve.points.length;
      let length: number = 0,
        shortest: number = Infinity;
      for (let i: number = 0; i < curve.points.length; ++i) {
        const a = curve.points[i]!,
          b = curve.points[(i + 1) % curve.points.length]!;
        const midpoint = curve.at(a.t + step / 2);
        if (midpoint === null)
          throw new Error(
            "The measured contact has no midpoint on its native surfaces",
          );
        length +=
          (step *
            (Vec.norm(a.tangent) +
              4 * Vec.norm(midpoint.tangent) +
              Vec.norm(b.tangent))) /
          6;
        shortest = Math.min(shortest, Vec.norm(Vec.sub(a.point, b.point)));
      }
      return {
        seed: {
          type: "point",
          partFace: plate.name,
          hostFace: digit.name,
          part: [found.s / 1000, found.phi],
          host: [found.y / 1000, found.theta],
        },
        tolerance: CONTACT_MM / 1000,
        grazing: GRAZING,
        parameter: {
          type: "angle",
          centre: {
            x: centre[0] / 1000,
            y: centre[1] / 1000,
            z: centre[2] / 1000,
          },
          normal: { x: dorsal[0], y: dorsal[1], z: dorsal[2] },
          reference: { x: distal[0], y: distal[1], z: distal[2] },
        },
        curveLength: length,
        shortestChord: shortest,
        minimumAngle: Math.min(...curve.points.map((p): number => p.angle)),
        rejected,
      };
    }
    throw new Error("No admitted native nail contact. " + rejected.join(" / "));
  }
}
