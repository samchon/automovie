import { AutoMovieArchetypeRefusal, createArmour } from "@automovie/archetypes";
import { physicalHullFaces } from "@automovie/engine";
import type {
  IAutoMovieBodyMeasure,
  IAutoMoviePhysicalHullFaces,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

import { armourJointObservation } from "../internal/armourJointObservation";

/**
 * Actual helmet and limb walls retain positive shared joints and their gauge.
 *
 * Scenarios:
 *
 * 1. Both open/associated-visored sallets and missing/surviving-visored closed
 *    helmets, unfitted and at authored head radii0.1/0.3m, at both original
 *    1.5/3mm plate band ends retain shared actual row/sector faces. The0.3m
 *    regression exposes face-dependent rescaling that previously left each
 *    wall's gauge correct but opened gaps.
 * 2. Those same actual cell planes retain the independent original head+pad cavity
 *    and exact normal gauge at the original1e-12 positional precision; unfitted
 *    ellipses retain at least the authored gauge with equality on their
 *    thinnest face, and every actual inner row/sector edge meets.
 * 3. Both brimmed records, fitted and unfitted at both original plate band ends,
 *    share their actual bowl-base inner edge and have positive actual
 *    cross-section intersection area with the brim.
 * 4. Head radius0.148m with1.5mm plate refuses structurally for both brimmed
 *    records when the real padded bowl course cannot join the source rim.
 *    Valid0.1m cases ensure that refusal is not an always-reject substitute.
 * 5. Every gauntlet, vambrace and greave record, fitted and unfitted at both plate
 *    band ends, keeps a shared circumferential face at every sector boundary.
 *    Unfitted guards/cuffs retain at least the authored gauge and fitted ones
 *    retain exact gauge. Guards retain their actual record or independently
 *    supplied segment length without axial shrinkage.
 *
 * The radii are authored geometric regression inputs, not anthropometric bands.
 * Expected contacts are read from transformed emitted cells; no generating
 * lattice dimensions or expected profile vertices are reproduced.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States actual row/sector/brim joint observations, causal head-size regressions, fitted exact/unfitted minimum gauge, independent guard lengths and original plate/pad precision.
 * @evidence contracts/development/testing.md#behavioral-verification Builds public actual pieces, matches transformed cell corners, measures noncollinear shared faces and clips actual bowl/brim sections; independently reads real hull-plane support and structured refusal instead of accepting individually valid disconnected cells.
 * @evidence contracts/development/testing.md#independent-expectations Positive contact area and matching actual boundaries define a connected wall; original1.5/3mm and0.75inch source values and museum guard lengths remain literal. Actual cell coordinates and engine hull-plane observations supply contact/gauge, without copying the producer's lattice or homothety formula.
 * @evidence contracts/development/testing.md#distinguishing-cases All six helmet source states fitted/unfitted at both band ends, two head sizes including0.3m row failure, row/azimuth joints and the0.148m disconnected-brim refusal with valid controls; every gauntlet/limb record in fitted and unfitted circumferential courses plus exact guard lengths.
 * @evidence contracts/development/testing.md#execution-ownership One portable actual-producer and numerical-geometry unit; it starts no Human generator, renderer, capture, file or process.
 */
export function test_archetype_armour_joints(): void {
  const findings: string[] = [];
  const EPSILON: number = 1e-12;
  const PLATE: readonly [number, number] = [0.0015, 0.003];
  const PAD: number = 0.75 * 0.0254;
  const helmets: readonly {
    kind: createArmour.Kind;
    model: createArmour.Model;
  }[] = [
    { kind: "openHelmet", model: "met26453" },
    { kind: "openHelmet", model: "met25388" },
    { kind: "closedHelmet", model: "met23232" },
    { kind: "closedHelmet", model: "met26508" },
  ];
  for (const headRadius of [undefined, 0.1, 0.3])
    for (const helmet of helmets)
      for (const thickness of PLATE) {
        const piece: ReturnType<typeof createArmour> = createArmour({
          ...helmet,
          measure: headRadius === undefined ? undefined : { headRadius },
          thickness,
        });
        const cells: ReadonlyMap<string, readonly IAutoMovieVector3[]> =
          armourJointObservation.cells(piece);
        bowlCourse(
          helmet.model + " " + headRadius,
          cells,
          thickness,
          headRadius !== undefined,
        );
        if (headRadius !== undefined)
          for (const [id, corners] of cells) {
            const faces: IAutoMoviePhysicalHullFaces.IFace[] =
              physicalHullFaces(corners).faces;
            const inner: number = Math.min(
              ...faces.map(
                (face: IAutoMoviePhysicalHullFaces.IFace): number =>
                  face.offset,
              ),
            );
            if (Math.abs(inner + headRadius + PAD) > EPSILON)
              findings.push(helmet.model + " " + id + " changed actual cavity");
          }
      }
  const measures: readonly (Partial<IAutoMovieBodyMeasure> | undefined)[] = [
    undefined,
    { headRadius: 0.1 },
  ];
  for (const model of ["met26512", "met21972"] as const) {
    for (const measure of measures)
      for (const thickness of PLATE) {
        const piece: ReturnType<typeof createArmour> = createArmour({
          kind: "brimmedHelmet",
          model,
          measure,
          thickness,
        });
        const cells: ReadonlyMap<string, readonly IAutoMovieVector3[]> =
          armourJointObservation.cells(piece);
        let contacts: number = 0;
        bowlCourse(model, cells, thickness, measure !== undefined);
        for (const [id, brim] of cells) {
          if (!id.startsWith("brim-")) continue;
          const bowl: readonly IAutoMovieVector3[] | undefined = cells.get(
            "bowl-0-" + id.slice("brim-".length),
          );
          if (bowl === undefined) {
            findings.push(model + " " + id + " has no actual bowl base");
            continue;
          }
          contacts++;
          const top: number = Math.max(
            ...brim.map((point: IAutoMovieVector3): number => point.y),
          );
          const base: number = Math.min(
            ...bowl.map((point: IAutoMovieVector3): number => point.y),
          );
          const shared: ReturnType<typeof armourJointObservation.shared> =
            armourJointObservation.shared(brim, bowl, EPSILON);
          const area: number = armourJointObservation.overlap(
            brim,
            bowl,
            top,
            EPSILON,
          );
          if (
            !(Math.abs(top - base) <= EPSILON && shared.count >= 2 && area > 0)
          )
            findings.push(
              model +
                " " +
                id +
                " lacks its matching inner course or positive actual joint area",
            );
        }
        if (contacts === 0)
          findings.push(model + " has no observed brim joints");
      }
    try {
      createArmour({
        kind: "brimmedHelmet",
        model,
        measure: { headRadius: 0.148 },
        thickness: PLATE[0],
      });
      findings.push(
        model + " accepted a padded bowl whose base lies outside its brim rim",
      );
    } catch (error) {
      if (
        !(
          error instanceof AutoMovieArchetypeRefusal && error.axis === "measure"
        )
      )
        findings.push(
          model + " did not give a structured joint feasibility refusal",
        );
    }
  }
  const limbs: readonly {
    kind: createArmour.Kind;
    model: createArmour.Model;
    length: number;
  }[] = [
    { kind: "gauntlet", model: "met23255", length: 0.294 },
    { kind: "gauntlet", model: "met23256", length: 0.21 },
    { kind: "gauntlet", model: "met23199", length: 0.267 },
    { kind: "vambrace", model: "met24896", length: 0.21 },
    { kind: "vambrace", model: "met35850", length: 0.461 },
    { kind: "greave", model: "met22970", length: 0.353 },
    { kind: "greave", model: "met22276", length: 0.383 },
  ];
  for (const limb of limbs)
    for (const fitted of [false, true])
      for (const thickness of PLATE) {
        const piece: ReturnType<typeof createArmour> = createArmour({
          kind: limb.kind,
          model: limb.model,
          thickness,
          measure: fitted
            ? {
                forearmRadius: 0.05,
                forearm: 0.22,
                shankRadius: 0.07,
                shank: 0.37,
                hand: 0.19,
              }
            : undefined,
        });
        const prefix: string = limb.kind === "gauntlet" ? "cuff-" : "guard-";
        const cells: ReadonlyMap<string, readonly IAutoMovieVector3[]> =
          armourJointObservation.cells(piece);
        const course: (readonly IAutoMovieVector3[])[] = [...cells]
          .filter(([id]: [string, readonly IAutoMovieVector3[]]): boolean =>
            id.startsWith(prefix),
          )
          .map(
            ([, points]: [
              string,
              readonly IAutoMovieVector3[],
            ]): readonly IAutoMovieVector3[] => points,
          );
        let minimumGauge: number = Infinity;
        for (let index: number = 0; index < course.length; index++) {
          const label: string = limb.model + " " + fitted + " " + index;
          joined(label, course[index]!, course[(index + 1) % course.length]!);
          minimumGauge = Math.min(
            minimumGauge,
            wallGauge(label, course[index]!, thickness, fitted),
          );
        }
        if (course.length === 0 || Math.abs(minimumGauge - thickness) > EPSILON)
          findings.push(
            limb.model + " lost its radial course or minimum gauge",
          );
        if (limb.kind !== "gauntlet") {
          const ys: number[] = course.flatMap(
            (points: readonly IAutoMovieVector3[]): number[] =>
              points.map((point: IAutoMovieVector3): number => point.y),
          );
          const length: number = fitted
            ? limb.kind === "greave"
              ? 0.37
              : 0.22
            : limb.length;
          if (Math.abs(Math.max(...ys) - Math.min(...ys) - length) > EPSILON)
            findings.push(
              limb.model + " changed the actual axial guard length",
            );
        }
      }
  TestValidator.equals(
    "actual armour courses and brim share connected wall sections",
    findings,
    [],
  );

  /**
   * Every bowl's row/sector joints and gauge are observed from its actual
   * cells.
   */
  function bowlCourse(
    label: string,
    cells: ReadonlyMap<string, readonly IAutoMovieVector3[]>,
    thickness: number,
    fitted: boolean,
  ): void {
    const sectors: number =
      1 +
      Math.max(
        ...[...cells.keys()]
          .filter((id: string): boolean => id.startsWith("bowl-"))
          .map((id: string): number => Number(id.split("-")[2])),
      );
    let minimumGauge: number = Infinity;
    let rowContacts: number = 0;
    let sectorContacts: number = 0;
    for (const [id, points] of cells) {
      if (!id.startsWith("bowl-")) continue;
      const row: number = Number(id.split("-")[1]);
      const sector: number = Number(id.split("-")[2]);
      const nextRow: readonly IAutoMovieVector3[] | undefined = cells.get(
        `bowl-${row + 1}-${sector}`,
      );
      const nextSector: readonly IAutoMovieVector3[] | undefined = cells.get(
        `bowl-${row}-${(sector + 1) % sectors}`,
      );
      if (nextRow !== undefined) {
        rowContacts++;
        joined(label + " " + id + " row", points, nextRow);
      }
      if (nextSector !== undefined) {
        sectorContacts++;
        joined(label + " " + id + " sector", points, nextSector);
      }
      minimumGauge = Math.min(
        minimumGauge,
        wallGauge(label + " " + id, points, thickness, fitted),
      );
    }
    if (Math.abs(minimumGauge - thickness) > EPSILON)
      findings.push(label + " lost its bowl minimum normal gauge");
    if (rowContacts === 0 || sectorContacts === 0)
      findings.push(label + " has no observable row/sector contact set");
  }

  /** Actual opposite hull planes expose exact fitted or minimum unfitted gauge. */
  function wallGauge(
    label: string,
    points: readonly IAutoMovieVector3[],
    thickness: number,
    fitted: boolean,
  ): number {
    const gauge: number = armourJointObservation.gauge(points, EPSILON);
    if (
      gauge < thickness - EPSILON ||
      (fitted && Math.abs(gauge - thickness) > EPSILON)
    )
      findings.push(label + " changed the actual wall gauge");
    return gauge;
  }

  /** A connected wall interface has four actual shared corners and nonzero area. */
  function joined(
    label: string,
    first: readonly IAutoMovieVector3[],
    second: readonly IAutoMovieVector3[],
  ): void {
    const contact: ReturnType<typeof armourJointObservation.shared> =
      armourJointObservation.shared(first, second, EPSILON);
    if (!(contact.count >= 4 && contact.area > 0))
      findings.push(label + " has no positive shared actual wall face");
  }
}
