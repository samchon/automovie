import {
  AutoMovieEngineKinematics,
  AutoMovieEngineQuaternion,
  AutoMovieEngineVector3,
} from "@automovie/engine";
import {
  AutoMovieHumanBodyAnatomy,
  AutoMovieHumanCanonicalBody,
  AutoMovieHumanFootPrior,
} from "@automovie/human";
import type {
  IAutoMovieHumanBindBone,
  IAutoMovieHumanCanonicalBody,
  IAutoMovieHumanParameters,
  IAutoMovieHumanSkeleton,
  IAutoMovieHumanoidSurfaces,
  IAutoMovieVector3,
} from "@automovie/interface";
import {
  AutoMovieRenderHumanCartoon,
  AutoMovieRenderHumanPolygon,
} from "@automovie/render";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

import { HumanPopulation } from "../../../../packages/motions/src/executable/population/HumanPopulation";

/**
 * Stock bind measurements reach their displayed and physical surfaces.
 *
 * The average men and women exercise jaw, eye, contact and heel landmarks.
 * The stock ear rays follow their anatomical station and reflect across the
 * median plane. The narrow and broad presets exercise one surveyed axis at common stature. An
 * asymmetric foot checks sided length and preservation of the sole box.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Builds real population bodies and their polygon and face handles, traces the actual position buffers and profile hulls, and samples the articulated mark, head around its rest pivot and neutral ear rays on both sides.
 * @evidence contracts/development/testing.md#independent-expectations Uses selected population measures, existing jaw and eye joints, head contact rays and declared foot extents transformed to the foot's own yaw. The ear ray is intersected independently against the drawn polygon. The sampled hull and drawing readings are separate values. The comparisons allow Float32 mesh rounding and double-precision ray normalization.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the stock and asymmetric controls and the geometry observed for them.
 */
export function test_human_stock_polygon_landmarks(): void {
  const widths: number[] = [];
  const spans: number[] = [];
  for (const name of [
    "m-narrow",
    "m-average",
    "m-broad",
    "f-average",
    "asymmetric",
  ]) {
    const end: HumanPopulation.IEnd = HumanPopulation.ENDS.find(
      (entry: HumanPopulation.IEnd): boolean =>
        entry.name === (name === "asymmetric" ? "f-average" : name),
    )!;
    const params: IAutoMovieHumanParameters = HumanPopulation.params(end);
    const measures: Record<HumanPopulation.Variable, number> =
      HumanPopulation.measures(end);
    const feet: NonNullable<
      NonNullable<IAutoMovieHumanParameters["extremities"]>["feet"]
    > = params.extremities!.feet!;
    if (name === "asymmetric") feet.left.footLength *= 1.05;
    const body: IAutoMovieHumanCanonicalBody.IBody =
      AutoMovieHumanCanonicalBody.prepare(params, {
        id: name,
        mass: measures.mass,
      });
    const input: Pick<IAutoMovieHumanSkeleton.IOutput, "bones" | "posed"> =
      AutoMovieHumanCanonicalBody.display(body);
    const drawing: AutoMovieRenderHumanPolygon.IDrawing =
      AutoMovieRenderHumanPolygon.build(input);
    try {
      drawing.object.updateMatrixWorld(true);
      const bone = (id: string): IAutoMovieHumanBindBone =>
        input.bones.find(
          (entry: IAutoMovieHumanBindBone): boolean => entry.bone === id,
        )!;
      if (name.startsWith("m-")) {
        TestValidator.equals(
          `${name} surveyed breadth`,
          AutoMovieHumanBodyAnatomy.resolve(params).biacromialBreadth,
          measures.biacromial,
        );
        spans.push(
          bone("leftUpperArm").position[2] - bone("rightUpperArm").position[2],
        );
        const chest: THREE.Box3 = new THREE.Box3().setFromObject(
          drawing.parts.get("chest")!,
        );
        widths.push(chest.max.z - chest.min.z);
      }
      if (name === "m-average") {
        const fallback: IAutoMovieHumanParameters = structuredClone(params);
        delete fallback.body.anatomy!.biacromialBreadth;
        TestValidator.predicate(
          "omitted breadth still resolves from the stature prior",
          AutoMovieHumanBodyAnatomy.resolve(fallback).biacromialBreadth !==
            measures.biacromial,
        );
        const override: IAutoMovieHumanParameters = structuredClone(params);
        override.body.anatomy!.biacromialBreadth = measures.biacromial + 15;
        const before = AutoMovieHumanBodyAnatomy.resolve(params);
        const after = AutoMovieHumanBodyAnatomy.resolve(override);
        TestValidator.predicate(
          "a direct breadth override leaves the across-back input independent",
          after.biacromialBreadth === measures.biacromial + 15 &&
            after.acrossBackShoulderWidth === before.acrossBackShoulderWidth,
        );
      }
      if (name === "m-average" || name === "f-average")
        checkHead(drawing, body, bone);
      if (name === "m-average" || name === "f-average" || name === "asymmetric")
        for (const side of ["left", "right"] as const) {
          const yaw: number =
            AutoMovieHumanFootPrior.PRIOR.yaw * (side === "left" ? 1 : -1);
          const canonical: IAutoMovieVector3 = {
            x: Math.sin(yaw),
            y: 0,
            z: Math.cos(yaw),
          };
          const surface: number[] = [];
          for (const [id, mesh] of drawing.parts) {
            if (
              !id.startsWith(side) ||
              !/Subtalar|Midfoot|Hallux|Toe[2-5]/u.test(id)
            )
              continue;
            const position:
              | THREE.BufferAttribute
              | THREE.InterleavedBufferAttribute =
              mesh.geometry.getAttribute("position");
            const point: THREE.Vector3 = new THREE.Vector3();
            for (let i: number = 0; i < position.count; ++i) {
              point
                .fromBufferAttribute(position, i)
                .applyMatrix4(mesh.matrixWorld);
              surface.push(canonical.z * point.x + canonical.x * point.z);
            }
          }
          const hull: number[] = [];
          for (const segment of body.profile.segments) {
            if (
              segment.bone !== `${side}Foot` &&
              segment.bone !== `${side}Toes`
            )
              continue;
            for (const shape of segment.shapes)
              if (shape.kind === "hull")
                for (const p of shape.points) {
                  const local: IAutoMovieVector3 = AutoMovieEngineVector3.add(
                    shape.transform.position,
                    AutoMovieEngineQuaternion.rotateVector(
                      shape.transform.rotation,
                      p,
                    ),
                  );
                  const world: IAutoMovieVector3 = AutoMovieEngineVector3.add(
                    segment.neutral.position,
                    AutoMovieEngineQuaternion.rotateVector(
                      segment.neutral.rotation,
                      local,
                    ),
                  );
                  hull.push(AutoMovieEngineVector3.dot(world, canonical));
                }
          }
          const label: string = `${name} ${side}`;
          TestValidator.predicate(
            `${label} draw and hull equal the surveyed length`,
            Math.abs(
              Math.max(...surface) -
                Math.min(...surface) -
                feet[side].footLength / 1000,
            ) < FLOAT32_MARGIN &&
              Math.abs(Math.max(...hull) - Math.max(...surface)) <
                FLOAT32_MARGIN &&
              Math.abs(Math.min(...hull) - Math.min(...surface)) <
                FLOAT32_MARGIN,
          );
          const segment = body.profile.segments.find(
            (entry): boolean => entry.bone === `${side}Foot`,
          )!;
          TestValidator.predicate(
            `${label} separate flat contact sole`,
            segment.contactShapes?.some(
              (shape): boolean => shape.kind === "box",
            ) === true,
          );
        }
    } finally {
      drawing.dispose();
    }
  }
  TestValidator.predicate(
    "the stock input orders joint and drawn shoulder widths",
    spans[0]! < spans[1]! &&
      spans[1]! < spans[2]! &&
      widths[0]! < widths[1]! &&
      widths[1]! < widths[2]!,
  );
}

function checkHead(
  drawing: AutoMovieRenderHumanPolygon.IDrawing,
  body: IAutoMovieHumanCanonicalBody.IBody,
  bone: (id: string) => IAutoMovieHumanBindBone,
): void {
  const pivot: IAutoMovieHumanBindBone = bone("head");
  const chin: number = bone("jaw").tip![1] - pivot.position[1];
  const head: AutoMovieRenderHumanPolygon.IDrawingHead = drawing.head;
  const mesh: THREE.Mesh = drawing.parts.get("head")!;
  TestValidator.predicate(
    `${body.skeleton.id} chin, crown and triangle count`,
    Math.abs(head.min[1] - chin) < FLOAT32_MARGIN &&
      Math.abs(head.max[1] - (pivot.tip![1] - pivot.position[1])) <
        FLOAT32_MARGIN &&
      mesh.geometry.getIndex()!.count / 3 === 48,
  );

  const position: THREE.BufferAttribute | THREE.InterleavedBufferAttribute =
    mesh.geometry.getAttribute("position");
  const index: THREE.BufferAttribute = mesh.geometry.getIndex()!;
  const down: THREE.Ray = new THREE.Ray(
    new THREE.Vector3(),
    new THREE.Vector3(0, -1, 0),
  );
  const hit: THREE.Vector3 = new THREE.Vector3();
  let centreClearance: number = Infinity;
  const a: THREE.Vector3 = new THREE.Vector3();
  const b: THREE.Vector3 = new THREE.Vector3();
  const c: THREE.Vector3 = new THREE.Vector3();
  for (let i: number = 0; i < index.count; i += 3) {
    const contact: THREE.Vector3 | null = down.intersectTriangle(
      a.fromBufferAttribute(position, index.getX(i)),
      b.fromBufferAttribute(position, index.getX(i + 1)),
      c.fromBufferAttribute(position, index.getX(i + 2)),
      false,
      hit,
    );
    if (contact !== null)
      centreClearance = Math.min(centreClearance, -contact.y);
  }
  TestValidator.predicate(
    `${body.skeleton.id} head encloses the neck pivot`,
    Number.isFinite(centreClearance) && centreClearance > FLOAT32_MARGIN,
  );

  const leftEye: IAutoMovieHumanBindBone = bone("leftEye");
  const anchors: AutoMovieRenderHumanCartoon.IHeadAnchors = head.anchors!;
  const surfaces: IAutoMovieHumanoidSurfaces.ISurfaces =
    AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfaces(
      body.skeleton,
      body.profile,
    );
  const contact: IAutoMovieHumanoidSurfaces.IFrame = surfaces.regions.mouth;
  const station: IAutoMovieVector3 = body.profile.earRayOrigin!;
  const right: IAutoMovieHumanoidSurfaces.IFrame = surfaces.regions.earRight;
  const left: IAutoMovieHumanoidSurfaces.IFrame = surfaces.regions.earLeft;
  const neutral: IAutoMovieHumanoidSurfaces.IFrame = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfaceOffset(body.skeleton, body.profile, "earRight", { up: 0, out: 0 });
  const external = { ...body.profile };
  delete external.earRayOrigin;
  const fallback: IAutoMovieHumanoidSurfaces.ISurfaces = AutoMovieEngineKinematics.resolveAutoMovieHumanoidSurfaces(body.skeleton, external);
  const outward: THREE.Ray = new THREE.Ray(
    new THREE.Vector3(station.z, station.y, 0),
    new THREE.Vector3(0, 0, -1),
  );
  let earSkin: number = Infinity;
  for (let i: number = 0; i < index.count; i += 3) {
    const shell: THREE.Vector3 | null = outward.intersectTriangle(
      a.fromBufferAttribute(position, index.getX(i)),
      b.fromBufferAttribute(position, index.getX(i + 1)),
      c.fromBufferAttribute(position, index.getX(i + 2)),
      false,
      hit,
    );
    if (shell !== null) earSkin = Math.min(earSkin, -shell.z);
  }
  TestValidator.predicate(
    body.skeleton.id + " upper ear ray meets the visible head shell",
    Math.abs(right.point.y - station.y) < FLOAT32_MARGIN &&
      Math.abs(right.point.z - station.z) < FLOAT32_MARGIN &&
      Math.abs(-right.point.x - earSkin) < FLOAT32_MARGIN,
  );
  TestValidator.predicate(
    "zero tangent offset follows the same ray",
    AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(neutral.point, right.point)) < 1e-12 &&
      AutoMovieEngineVector3.length(AutoMovieEngineVector3.subtract(neutral.normal, right.normal)) < 1e-12,
  );
  TestValidator.equals("left ear reflects the right ear", { point: left.point, normal: left.normal }, {
    point: { ...right.point, x: -right.point.x },
    normal: { ...right.normal, x: -right.normal.x },
  });
  TestValidator.predicate("profiles without the landmark keep the bounds-centre station",
    Math.abs(fallback.regions.earRight.point.y - (head.min[1] + head.max[1]) / 2) < FLOAT32_MARGIN,
  );
  TestValidator.equals("mouth is independent of the neutral ear station", fallback.regions.mouth, contact);
  TestValidator.predicate(
    `${body.skeleton.id} attachment and contact share the head frame`,
    Math.abs(anchors.leftEye[0] - (leftEye.position[1] - pivot.position[1])) <
      FLOAT32_MARGIN &&
      Math.abs(anchors.leftEye[1] - (leftEye.position[2] - pivot.position[2])) <
        FLOAT32_MARGIN &&
      Math.abs(anchors.mouth[0] - contact.point.y) < 0.003 &&
      contact.bone === "head",
  );
  const face: AutoMovieRenderHumanCartoon.IFace =
    AutoMovieRenderHumanCartoon.buildFace(head, undefined, {
      jaw: { opening: 12 },
    });
  try {
    TestValidator.predicate(
      `${body.skeleton.id} articulation changes the mark`,
      face.object.getObjectByName("human.cartoon.mouth.open") !== undefined,
    );
  } finally {
    face.dispose();
  }
}

/* Ten micrometres allow single-precision vertices for bodies below 2 m. */
const FLOAT32_MARGIN: number = 1e-5;
