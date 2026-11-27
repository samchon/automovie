import { AutoMovieArchetypeRefusal, AutoMovieArchetypeWindow } from "@automovie/archetypes";
import { validateModel } from "@automovie/engine";
import type {
  IAutoMovieModelPart,
  IAutoMovieVector3,
} from "@automovie/interface";
import { TestValidator } from "@nestia/e2e";

/**
 * An explicitly calibrated pane leaves its sash while the rails, handle and
 * their genuine hinge or slider continue to work. Unknown failure stays unknown.
 *
 * Scenarios:
 * 1. All three kinds at both dimension endpoints contain four nonoverlapping
 *    authored 80 mm rails around a distinct pane of 1/8 inch thickness.
 * 2. An authored 50 J calibration breaks only the pane at 50 J and not at 49 J;
 *    all parts and mass survive exactly once across the two resulting bodies.
 * 3. Opening the intact sash carries pane and handle by the same rigid motion.
 *    After fracture the remaining rails and handle still open by that motion,
 *    with no bound-part reference to the absent pane; all pieces are admitted.
 * 4. Without calibration even a large hit does not assert a known failure;
 *    zero, negative and non-finite calibrations are refused.
 * 5. BREAKING remains a converted historical bag-test reference, not a default.
 *
 * @evidence contracts/development/common.md#meaningful-documentation States authored construction and energy premises separately from measured material failure, and lists geometry, fracture, consumer and admission scenarios.
 * @evidence contracts/development/testing.md#behavioral-verification Calls real createWindow, broken, affordance and articulate consumers and validateModel; tests actual rail/pane solids, surviving ownership and post-fracture operation rather than inspecting a configuration alone.
 * @evidence contracts/development/testing.md#independent-expectations Width/height endpoints and the authored 80 mm rails derive clear pane dimensions, rail centres and a gapless nonoverlapping partition. A 90 degree casement maps centre (0,y,0) to (width/2,y,-width/2); vertical and horizontal sliders translate by their declared travel. The 50 J test budget and zero momentum are authored mechanics inputs, not a glass measurement.
 * @evidence contracts/development/testing.md#distinguishing-cases All three kinds, both size endpoints, unknown and explicit calibration, below and exact threshold, intact and broken operation, and five invalid calibration values.
 * @evidence contracts/development/testing.md#execution-ownership One discovered in-memory unit owns its objects and reads engine admission; it starts no renderer, compiler, watcher or host and makes no visual claim.
 */
export function test_archetype_fracture_window(): void {
  const findings: string[] = [];
  const energy: number = 50;
  const momentum: IAutoMovieVector3 = { x: 0, y: 0, z: 0 };
  for (const kind of AutoMovieArchetypeWindow.KINDS) {
    const unknown: ReturnType<typeof AutoMovieArchetypeWindow.create> = AutoMovieArchetypeWindow.create({ kind });
    if (
      unknown.body.contact?.fracture !== undefined ||
      unknown.broken({ energy: 1e6, momentum }) !== null
    )
      findings.push(
        `${kind}: an uncalibrated pane claims a fracture threshold`,
      );
    for (const [width, height] of [
      [0.6, 0.9],
      [1.2, 1.2],
    ] as const) {
      const label: string = `${kind} ${width}x${height}`;
      const window: ReturnType<typeof AutoMovieArchetypeWindow.create> = AutoMovieArchetypeWindow.create({
        kind,
        width,
        height,
        fractureEnergy: energy,
      });
      const sill: number = window.dimensions.sillHeight!;
      if (window.body.contact?.fracture !== energy)
        findings.push(`${label}: the authored calibration was changed`);
      if (window.parts.length !== 10)
        findings.push(
          `${label}: has ${window.parts.length} parts instead of ten`,
        );
      box(
        window,
        "pane",
        width - 0.16,
        height - 0.16,
        0.003175,
        { x: 0, y: sill + height / 2, z: 0 },
        label,
      );
      for (const side of [-1, 1] as const) {
        box(
          window,
          side < 0 ? "sash-left" : "sash-right",
          0.08,
          height,
          0.03,
          { x: (side * (width - 0.08)) / 2, y: sill + height / 2, z: 0 },
          label,
        );
        box(
          window,
          side < 0 ? "sash-bottom" : "sash-top",
          width - 0.16,
          0.08,
          0.03,
          { x: 0, y: sill + height / 2 + (side * (height - 0.08)) / 2, z: 0 },
          label,
        );
      }
      if (window.broken({ energy: energy - 1, momentum }) !== null)
        findings.push(`${label}: breaks below its authored threshold`);
      const broken: ReturnType<typeof window.broken> = window.broken({
        energy,
        momentum,
      });
      if (
        broken === null ||
        broken.remainder === null ||
        broken.fragments.length !== 1
      ) {
        findings.push(`${label}: does not produce one pane and a remainder`);
        continue;
      }
      const shards: (typeof broken.fragments)[number] | undefined =
        broken.fragments[0];
      if (
        shards === undefined ||
        shards.id !== "shards" ||
        JSON.stringify(ids(shards.archetype.parts)) !== JSON.stringify(["pane"])
      ) {
        findings.push(`${label}: the fragment is not exclusively the pane`);
        continue;
      }
      const remainder: typeof window = broken.remainder;
      const all: string[] = [
        ...ids(remainder.parts),
        ...ids(shards.archetype.parts),
      ].sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
      if (JSON.stringify(all) !== JSON.stringify(ids(window.parts)))
        findings.push(`${label}: a part was lost or duplicated`);
      if (
        !(
          Math.abs(
            remainder.body.mass + shards.archetype.body.mass - window.body.mass,
          ) <= 1e-9
        )
      )
        findings.push(`${label}: mass was lost or duplicated`);
      if (
        JSON.stringify(
          remainder.affordances.map((a: { id: string }): string => a.id),
        ) !== JSON.stringify(["sash", "handle", "sill", "aperture"]) ||
        remainder.affordance("sash").parts?.includes("pane")
      )
        findings.push(
          `${label}: remaining sash or handle ownership is invalid`,
        );

      const travel: number =
        kind === "casement" ? 90 : window.dimensions.travel!;
      const opened: typeof window = window.articulate({ sash: travel });
      const openedFrame: typeof window = remainder.articulate({ sash: travel });
      const centre: IAutoMovieVector3 =
        kind === "casement"
          ? { x: width / 2, y: sill + height / 2, z: -width / 2 }
          : {
              x: kind === "sliding" ? -travel : 0,
              y: sill + height / 2 + (kind === "hung" ? travel : 0),
              z: 0,
            };
      if (
        !near(
          opened.parts.find(
            (p: IAutoMovieModelPart): boolean => p.id === "pane",
          )?.transform?.translation,
          centre,
        )
      )
        findings.push(`${label}: intact pane does not follow its sash`);
      for (const part of openedFrame.parts) {
        const intact: IAutoMovieModelPart | undefined = opened.parts.find(
          (p: IAutoMovieModelPart): boolean => p.id === part.id,
        );
        if (!near(part.transform?.translation, intact?.transform?.translation))
          findings.push(
            `${label}: remaining ${part.id} no longer follows the same opening`,
          );
      }
      if (
        !near(
          openedFrame.affordance("handle").frame.translation,
          opened.affordance("handle").frame.translation,
        )
      )
        findings.push(
          `${label}: handle contact no longer rides the remaining sash`,
        );
      for (const piece of [
        window,
        opened,
        remainder,
        openedFrame,
        shards.archetype,
      ])
        if (!validateModel({ model: piece }).success)
          findings.push(`${label}: ${piece.id} is not admitted`);
    }
    for (const fractureEnergy of [0, -1, Number.NaN, Infinity, -Infinity]) {
      let refused: boolean = false;
      try {
        AutoMovieArchetypeWindow.create({ kind, fractureEnergy });
      } catch (error) {
        if (!(error instanceof AutoMovieArchetypeRefusal)) throw error;
        refused = error.axis === "fractureEnergy";
      }
      if (!refused)
        findings.push(`${kind}: calibration ${fractureEnergy} was accepted`);
    }
  }
  if (
    !(
      Math.abs(AutoMovieArchetypeWindow.BREAKING - 25 * 0.3048 * 0.45359237 * 9.80665) <=
      1e-9
    )
  )
    findings.push("the historical bag-test reference conversion changed");
  TestValidator.equals(
    "calibrated pane fracture preserves the operating sash",
    findings,
    [],
  );

  /** Compare every component with a finite-safe geometric tolerance in metres. */
  function near(
    a: IAutoMovieVector3 | undefined,
    b: IAutoMovieVector3 | undefined,
  ): boolean {
    return (
      a !== undefined &&
      b !== undefined &&
      Math.abs(a.x - b.x) <= 1e-10 &&
      Math.abs(a.y - b.y) <= 1e-10 &&
      Math.abs(a.z - b.z) <= 1e-10
    );
  }

  /** Stable identities verify the pieces form a partition, independently of producer order. */
  function ids(parts: readonly IAutoMovieModelPart[]): string[] {
    return parts
      .map((p: IAutoMovieModelPart): string => p.id)
      .sort((a: string, b: string): number => (a < b ? -1 : a > b ? 1 : 0));
  }

  /** Read the actual primitive solids and centres instead of a copied dimension record. */
  function box(
    model: ReturnType<typeof AutoMovieArchetypeWindow.create>,
    id: string,
    width: number,
    height: number,
    depth: number,
    centre: IAutoMovieVector3,
    label: string,
  ): void {
    const part: IAutoMovieModelPart | undefined = model.parts.find(
      (p: IAutoMovieModelPart): boolean => p.id === id,
    );
    const shape: NonNullable<typeof part>["geometry"] | undefined =
      part?.geometry;
    if (
      shape?.type !== "primitive" ||
      shape.shape.type !== "box" ||
      !(
        Math.abs(shape.shape.width - width) <= 1e-12 &&
        Math.abs(shape.shape.height - height) <= 1e-12 &&
        Math.abs(shape.shape.depth - depth) <= 1e-12
      ) ||
      !near(part?.transform?.translation, centre)
    )
      findings.push(
        `${label}: ${id} is not the independent rail/pane construction`,
      );
  }
}
