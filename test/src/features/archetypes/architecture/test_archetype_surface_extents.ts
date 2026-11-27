import { type AutoMovieArchetype, AutoMovieArchetypeBoard, AutoMovieArchetypeCamera, AutoMovieArchetypeClipboard, AutoMovieArchetypeLaptop, AutoMovieArchetypePaper, AutoMovieArchetypePhone, AutoMovieArchetypeTablet, AutoMovieArchetypeAtm, AutoMovieArchetypeSignPost, AutoMovieArchetypeWatch, AutoMovieArchetypeScenicParadeBanner, AutoMovieArchetypeScenicStandard, AutoMovieArchetypeMachine } from "@automovie/archetypes";
import type {
  IAutoMovieAffordance,
  IAutoMovieModel,
  IAutoMovieVector3,
} from "@automovie/interface";
import { buildModel } from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/** How far out along the face normal each probe ray starts, metres. */
const PROBE: number = 0.005;

/** How far from the face centre the probe may meet the model, metres. */
const MILLIMETRE: number = 0.001;

/** The angular tolerance of the reading direction and the face normal, radians. */
const DEGREE: number = Math.PI / 180;

/**
 * Where a listed face's top lies in model space: `"upright"` for a face whose
 * top is model `+Y` projected onto the face plane (an upright phone, ATM, board
 * or sign, and a laptop lid's hinge-to-top direction, which leans back up the
 * lid), or a fixed model direction for a face lying flat, which its producer
 * documents.
 */
type Top = "upright" | IAutoMovieVector3;

/**
 * One listed producer's builds, the affordance it lists and where that face's
 * top lies.
 */
interface IListed {
  /** The producer named in the list. */
  name: string;

  /** The graphic-bearing affordance id. */
  surface: string;

  /** The face's top in model space. */
  top: Top;

  /** Every build: each kind and model the producer admits, at three seeds. */
  builds: () => AutoMovieArchetype[];
}

/** The seeds each build is drawn at. */
const SEEDS: readonly number[] = [1, 2, 3];

/** Build a producer at each seed. */
const seeded: (
  produce: (seed: number) => AutoMovieArchetype,
) => AutoMovieArchetype[] = (
  produce: (seed: number) => AutoMovieArchetype,
): AutoMovieArchetype[] => SEEDS.map(produce);

/** The model `-Z` a flat face's documented top points along. */
const BACK: IAutoMovieVector3 = { x: 0, y: 0, z: -1 };

/**
 * The explicit producer list of #4095: every graphic-bearing `screen` and
 * `face`.
 */
const LISTED: readonly IListed[] = [
  {
    name: "createPhone",
    surface: "screen",
    top: "upright",
    builds: () => seeded((seed) => AutoMovieArchetypePhone.create({}, seed)),
  },
  {
    name: "createTablet",
    surface: "screen",
    top: "upright",
    builds: () =>
      (["wifi", "cellular"] as const).flatMap((model) =>
        seeded((seed) => AutoMovieArchetypeTablet.create({ model }, seed)),
      ),
  },
  {
    name: "createLaptop",
    surface: "screen",
    top: "upright",
    builds: () =>
      (["air13", "air15"] as const).flatMap((model) =>
        seeded((seed) => AutoMovieArchetypeLaptop.create({ model }, seed)),
      ),
  },
  {
    name: "createCamera",
    surface: "screen",
    top: "upright",
    builds: () =>
      (["grIII", "x100vi"] as const).flatMap((model) =>
        seeded((seed) => AutoMovieArchetypeCamera.create({ model }, seed)),
      ),
  },
  {
    name: "createWatch",
    surface: "face",
    top: BACK,
    builds: () => seeded((seed) => AutoMovieArchetypeWatch.create({}, seed)),
  },
  {
    name: "createAtm",
    surface: "screen",
    top: "upright",
    builds: () => [
      ...seeded((seed) => AutoMovieArchetypeAtm.create({}, seed)),
      ...seeded((seed) => AutoMovieArchetypeMachine.create({ kind: "atm" }, seed)),
    ],
  },
  {
    name: "createBoard",
    surface: "face",
    top: "upright",
    builds: () =>
      AutoMovieArchetypeBoard.KINDS.flatMap((kind) =>
        (Object.keys(AutoMovieArchetypeBoard.SIZES[kind]) as AutoMovieArchetypeBoard.Size[]).flatMap(
          (size) => seeded((seed) => AutoMovieArchetypeBoard.create({ kind, size }, seed)),
        ),
      ),
  },
  {
    name: "createScenicStandard",
    surface: "face",
    top: "upright",
    builds: () =>
      AutoMovieArchetypeScenicStandard.KINDS.flatMap((kind) =>
        seeded((seed) => AutoMovieArchetypeScenicStandard.create({ kind }, seed)),
      ),
  },
  {
    name: "createScenicParadeBanner",
    surface: "face",
    top: "upright",
    builds: () => seeded((seed) => AutoMovieArchetypeScenicParadeBanner.create({}, seed)),
  },
  {
    name: "createClipboard",
    surface: "face",
    top: BACK,
    builds: () =>
      (["56055", "604037"] as const).flatMap((model) =>
        seeded((seed) => AutoMovieArchetypeClipboard.create({ model }, seed)),
      ),
  },
  {
    name: "createPaper",
    surface: "face",
    top: BACK,
    builds: () => seeded((seed) => AutoMovieArchetypePaper.create({ format: "sheet" }, seed)),
  },
  {
    name: "createSignPost",
    surface: "face",
    top: "upright",
    builds: () =>
      (["STOP 30 in", "STOP 36 in"] as const).flatMap((model) =>
        seeded((seed) => AutoMovieArchetypeSignPost.create({ model }, seed)),
      ),
  },
];

/**
 * Every graphic-bearing `screen` and `face` on #4095's explicit producer list
 * states a drawable area, lies on the model's outer surface and reads upright.
 *
 * Scenarios:
 *
 * 1. Each listed producer is built across its kinds, models and three seeds, and
 *    its listed surface states positive finite `width` and `depth`.
 * 2. A ray cast from 5 mm out along the frame's local `+Y` back toward the face
 *    centre meets the drawn model within 1 mm of that centre, and the face it
 *    meets has its outward normal within 1 degree of local `+Y`.
 * 3. Local `-Z` lies within 1 degree of the face's top: model `+Y` projected onto
 *    the measured face plane for an upright face or a laptop lid, and model
 *    `-Z` for a watch dial, a clipboard and a flat sheet as their producers
 *    document.
 * 4. The ATM's screen splits its 381 mm diagonal (width짼 + depth짼 = 381짼 mm짼
 *    within 0.5 mm짼) and lies on the cabinet's front face, z = 0.400 m.
 *
 * @evidence contracts/development/common.md#meaningful-documentation Lists the producers, the three geometric checks and the ATM's measured diagonal and face.
 * @evidence contracts/development/testing.md#behavioral-verification Builds each producer through its public entry and casts rays at the drawn render model, reading the surface it meets.
 * @evidence contracts/development/testing.md#independent-expectations The face's position and normal come from the rendered geometry, the top from model `+Y` on that measured plane or the producer's documented flat orientation, and the ATM figures from NCR's 381 mm diagonal and 800 mm cabinet depth.
 * @evidence contracts/development/testing.md#distinguishing-cases A frame inside the cabinet, a missing dimension, a frame turned upside down or mirrored about its normal, or a face hidden behind another part each fail; tool working faces and articulated surfaces are not listed and not read.
 * @evidence contracts/development/testing.md#execution-ownership Runs in memory on CPU three.js ray casts against locally built models, with no host.
 */
export function test_archetype_surface_extents(): void {
  const findings: string[] = [];
  for (const listed of LISTED)
    for (const model of listed.builds()) {
      const label: string = `${listed.name} ${model.name} ${listed.surface}`;
      const affordance: IAutoMovieAffordance | undefined =
        model.affordances.find(
          (candidate: IAutoMovieAffordance): boolean =>
            candidate.id === listed.surface,
        );
      if (affordance === undefined) {
        findings.push(`${label}: missing`);
        continue;
      }
      findings.push(...inspect(label, model, affordance, listed.top));
    }
  TestValidator.equals(
    "listed surfaces state an area on the outer surface",
    findings,
    [],
  );

  const atm: IAutoMovieAffordance = AutoMovieArchetypeAtm.create({}, 1).affordance("screen");
  const width: number = atm.width! * 1000;
  const depth: number = atm.depth! * 1000;
  TestValidator.predicate(
    "the ATM screen splits its 15 in diagonal",
    Math.abs(width * width + depth * depth - 381 * 381) <= 0.5,
  );
  TestValidator.predicate(
    "the ATM screen lies on the cabinet's front face",
    Math.abs(atm.frame.translation.z - 0.4) <= 1e-9,
  );
}

/** Check one listed surface; returns a finding per failed check. */
function inspect(
  label: string,
  model: IAutoMovieModel,
  affordance: IAutoMovieAffordance,
  top: Top,
): string[] {
  const findings: string[] = [];
  if (!(affordance.width! > 0) || !(affordance.depth! > 0))
    findings.push(`${label}: width or depth is not positive and finite`);

  const frame: THREE.Matrix4 = new THREE.Matrix4().compose(
    new THREE.Vector3().copy(affordance.frame.translation),
    new THREE.Quaternion().copy(affordance.frame.rotation),
    new THREE.Vector3(1, 1, 1),
  );
  const centre: THREE.Vector3 = new THREE.Vector3().setFromMatrixPosition(
    frame,
  );
  const out: THREE.Vector3 = new THREE.Vector3(0, 1, 0)
    .transformDirection(frame)
    .normalize();
  const reading: THREE.Vector3 = new THREE.Vector3(0, 0, -1)
    .transformDirection(frame)
    .normalize();

  const built: ReturnType<typeof buildModel> = buildModel(model);
  const meshes: THREE.Mesh[] = [...built.parts.values()].filter(
    (part: THREE.Object3D): part is THREE.Mesh => part instanceof THREE.Mesh,
  );
  try {
    built.object.updateMatrixWorld(true);
    const hit: THREE.Intersection | undefined = new THREE.Raycaster(
      centre.clone().addScaledVector(out, PROBE),
      out.clone().negate(),
    ).intersectObjects(meshes, false)[0];
    if (hit === undefined || hit.face === null || hit.face === undefined) {
      findings.push(`${label}: the probe meets no geometry`);
      return findings;
    }
    if (hit.point.distanceTo(centre) > MILLIMETRE)
      findings.push(
        `${label}: the probe meets the model ${hit.point.distanceTo(centre)} m from the face centre`,
      );
    const normal: THREE.Vector3 = hit.face.normal
      .clone()
      .transformDirection(hit.object.matrixWorld)
      .normalize();
    if (normal.angleTo(out) > DEGREE)
      findings.push(`${label}: local +Y is not the met face's normal`);
    const expected: THREE.Vector3 =
      top === "upright"
        ? new THREE.Vector3(0, 1, 0)
            .addScaledVector(normal, -normal.y)
            .normalize()
        : new THREE.Vector3(top.x, top.y, top.z);
    if (reading.angleTo(expected) > DEGREE)
      findings.push(`${label}: local -Z is not toward the face's top`);
  } finally {
    for (const mesh of meshes) {
      mesh.geometry.dispose();
      for (const material of [mesh.material].flat()) material.dispose();
    }
  }
  return findings;
}
