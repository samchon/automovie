import {
  FamilyConicCaptureFraming as Framing,
} from "../../../reference-conics/FamilyConicCaptureFraming";
import {
  FamilyConicOriginalCatalog as Original,
} from "../../../reference-conics/FamilyConicOriginalCatalog";
import {
  FamilyConicSourceCapture as Source,
} from "../../../reference-conics/FamilyConicSourceCapture";
import {
  NodeCanvasCamera as Camera,
} from "../../../reference-conics/render/NodeCanvasCamera";
import {
  NodeCanvasRaster as Raster,
} from "../../../reference-conics/render/NodeCanvasRaster";
import type {
  NodeCanvasTypes as N,
} from "../../../reference-conics/render/NodeCanvasTypes";
import type { IAutoMovieViewPart as Part } from "@automovie/interface";

/**
 * Source availability, fixed connection framing and case attribution remain independent.
 *
 * Scenarios:
 * 1. A failed actual factory preserves its available fixed counterpart; a failed counterpart preserves its actual neighbour.
 * 2. Complete explicitly associated F1 parent/child bounds fit one fixed camera, while a similarly named foreign owner cannot change it.
 * 3. Foreign body-frame registration is refused, without alignment or changed-case fitting.
 * 4. An explicit native case changes the header, while omitted and explicit f1 produce byte-identical default PNGs.
 * 5. Admitted source-only input rejects an unknown key, and declared breast/hand owner bounds remain available independently of nose.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Calls the actual catalog, fixed-framing helper and existing rasterizer with two tiny made parts, literal metre samples and an empty scene; no person, source solver, reference file or realization executes.
 * @evidence contracts/development/testing.md#independent-expectations Associated bounds at ±0.1 m must project inside the 900-pixel frame. A foreign point at 100 m must leave the camera scale set by the declared owner. The matching header comparison varies only the subject argument.
 * @evidence contracts/development/common.md#meaningful-documentation Actual and reference factory failures stay separate. Exact F1 owner framing, a foreign registration refusal, case-label PNGs and known source selection each have a case.
 */
export function test_human_capture_scope_frames(): void {
  const failures: string[] = [];
  const check: (value: boolean, message: string) => void = (
    value: boolean,
    message: string,
  ): void => {
    if (!value) failures.push(message);
  };
  const outline: (value: number) => Part.IOutline = (
    value: number,
  ): Part.IOutline => ({
    knots: [
      { site: "a", station: 0, value },
      { site: "b", station: 10, value },
    ],
  });
  const part: Part = {
    name: "arm",
    axis: {
      at: (s: number): ReturnType<Part["axis"]["at"]> => ({
        origin: [0, s, 0],
        u: [1, 0, 0],
        v: [0, 0, 1],
      }),
    },
    stations: [0, 10],
    front: { positive: outline(1), negative: outline(-1) },
    side: { positive: outline(1), negative: outline(-1) },
    fullness: {
      kind: "top",
      shoulders: [outline(0.5), outline(0.5), outline(0.5), outline(0.5)],
    },
    order: 16,
    samples: 32,
  };
  const observed: Original.IResult = Original.create([
    {
      id: "arm",
      role: "family-original",
      read: (): never => {
        throw new Error("actual unavailable");
      },
      reference: (): Part => part,
    },
    {
      id: "neighbour",
      role: "family-original",
      read: (): Part => ({ ...part, name: "neighbour" }),
      reference: (): never => {
        throw new Error("reference unavailable");
      },
    },
  ]);
  check(
    observed.counterparts.some(
      (entry: Original.IResult["counterparts"][number]): boolean =>
        entry.id === "arm" && entry.definition === part,
    ),
    "failed actual source hid its independent fixed counterpart",
  );
  check(
    observed.parts.some(
      (entry: Original.IPart): boolean => entry.id === "neighbour",
    ) &&
      !observed.parts.some(
        (entry: Original.IPart): boolean => entry.id === "arm",
      ),
    "source availability was replaced by reference availability",
  );
  check(
    observed.unavailable.some(
      (entry: Original.IResult["unavailable"][number]): boolean =>
        entry.id === "arm",
    ) &&
      observed.unavailable.some(
        (entry: Original.IResult["unavailable"][number]): boolean =>
          entry.id === "neighbour/authored-reference",
      ),
    "separate source/reference failures were hidden",
  );
  const baseline: Framing.IBaseline = {
    file: { file: "made.json", sha256: "a".repeat(64) },
    frame: {
      origin: [0, 0, 0],
      axes: [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ],
    },
    originals: [
      {
        id: "nose/axis",
        points: [
          [0, 0, -0.01],
          [0, 0, 0.01],
        ],
        closed: false,
      },
    ],
    submitted: [
      {
        id: "band.nose/submitted/0/band/start/0",
        points: [
          [0, -0.1, -0.1],
          [0, 0.1, 0.1],
        ],
        closed: false,
      },
      {
        id: "band.nose.mirror/submitted/1/band/start/0",
        points: [
          [0, 0, 100],
          [0, 0, 101],
        ],
        closed: false,
      },
    ],
    provenance: null,
  };
  const plan: Framing.IPlan = Framing.plan("nose", baseline);
  const camera: N.Camera = Camera.fit("front", plan.points, 900, 900);
  for (const point of baseline.submitted[0]!.points) {
    const projected: N.Point = Camera.project(point, camera);
    check(
      projected[0] >= 0 &&
        projected[0] < 900 &&
        projected[1] >= 80 &&
        projected[1] < 875,
      "complete declared connection input was clipped by source-only bounds",
    );
  }
  check(
    camera.scale > 1000 &&
      plan.operatorOwners?.join(",") === "band.nose" &&
      plan.missingOperatorOwners.length === 0,
    "foreign similarly named owner changed the fixed frame",
  );
  check(
    !Framing.plan("unregistered", baseline).operatorAssociationRegistered,
    "unregistered prepared-band association was presented as complete",
  );
  const otherBounds: Framing.IBaseline = {
    ...baseline,
    originals: [
      ...baseline.originals,
      {
        id: "breast/axis",
        points: [
          [0, 0, -0.01],
          [0, 0, 0.01],
        ],
        closed: false,
      },
      {
        id: "hand/axis",
        points: [
          [0, 0, -0.01],
          [0, 0, 0.01],
        ],
        closed: false,
      },
    ],
    submitted: [
      ...baseline.submitted,
      {
        id: "band.breast/submitted/2/band/start/0",
        points: [
          [0, 0, 0.3],
          [0, 0, 0.4],
        ],
        closed: false,
      },
      {
        id: "wrist.arm/submitted/3/band/end/0",
        points: [
          [0, 0, 0.6],
          [0, 0, 0.7],
        ],
        closed: false,
      },
    ],
  };
  const breast: Framing.IPlan = Framing.plan("breast", otherBounds);
  const hand: Framing.IPlan = Framing.plan("hand", otherBounds);
  check(
    breast.operatorAssociationRegistered &&
      breast.operatorOwners?.join(",") === "band.breast" &&
      breast.points.some((point: N.Point): boolean => point[2] === 0.4),
    "declared breast operator bounds were absent",
  );
  check(
    hand.operatorAssociationRegistered &&
      hand.operatorOwners?.includes("wrist.arm") === true &&
      hand.points.some((point: N.Point): boolean => point[2] === 0.7),
    "declared hand wrist input bounds were absent",
  );
  let typoRefused: boolean = false;
  try {
    Source.requested(["--source-only", "--soruces=nose"], true);
  } catch {
    typoRefused = true;
  }
  check(
    typoRefused,
    "admitted source-only input ignored an unknown option key",
  );
  Framing.compatible(baseline, baseline.frame);
  let refused: boolean = false;
  try {
    Framing.compatible(baseline, { ...baseline.frame, origin: [1, 0, 0] });
  } catch {
    refused = true;
  }
  check(refused, "foreign coordinate registration was silently aligned");
  const headerCamera: N.Camera = Camera.fit(
    "front",
    [
      [0, 0, 0],
      [0, 1, 1],
    ],
    480,
    180,
  );
  const legacy: Buffer = Raster.render(
    headerCamera,
    [],
    [],
    "xray",
    "same scene",
  ).png;
  const explicit: Buffer = Raster.render(
    headerCamera,
    [],
    [],
    "xray",
    "same scene",
    undefined,
    "f1",
  ).png;
  const changed: Buffer = Raster.render(
    headerCamera,
    [],
    [],
    "xray",
    "same scene",
    undefined,
    "tissue-0.8",
  ).png;
  check(
    legacy.equals(explicit),
    "default f1 PNG bytes changed when passing the same explicit subject",
  );
  check(
    !legacy.equals(changed),
    "actual case was absent from the rendered header",
  );
  if (failures.length > 0) throw new Error(failures.join("\n"));
}
