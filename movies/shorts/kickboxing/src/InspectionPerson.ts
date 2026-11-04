import {
  type AutoMovieHumanRigControls,
  AutoMovieHumanSkeleton,
  type IAutoMovieHumanParameters,
  type IAutoMovieHumanPose,
} from "@automovie/human";
import {
  type AutoMovieHumanPolygon,
  buildHumanCartoonFace,
  buildHumanPolygon,
} from "@automovie/viewer/human-polygon";
import * as THREE from "three";

/**
 * Original Human polygon with one public clinical evaluator and independent root.
 * Clinical motion is movie-owned; this reusable instance applies no paired placement.
 *
 * @evidence contracts/common.md#implementation-and-ownership Public skeleton FK supplies the original public polygon drawing, including the canonical neck and foot descriptors. The actor parent alone owns scene placement.
 * @evidence contracts/common.md#authoring-interface Poses use public clinical degrees and body axes +X forward, +Y up, +Z left; scene placement uses metres. Dispose retires this instance's owned drawing and face.
 */
export class InspectionPerson {
  /** Actor-local parent; position and heading are independent scene controls. */
  public readonly object: THREE.Group = new THREE.Group();
  /** Actual original drawing and emitted mesh registry for inspection. */
  public readonly drawing: AutoMovieHumanPolygon.IDrawing;
  /** Lightweight FK prepared once for this person's fixed dimensions. */
  public readonly evaluate: AutoMovieHumanSkeleton.PoseEvaluator;
  /** Current complete body-local FK; scene root is applied separately. */
  public output: AutoMovieHumanSkeleton.IOutput;
  /** Fixed neutral geometry used to measure anatomical reach independently. */
  public readonly neutral: AutoMovieHumanSkeleton.IOutput;
  /** Separately owned cartoon face attached to the real head bone. */
  private face: ReturnType<typeof buildHumanCartoonFace>;
  /** Current public head articulation signature; unchanged faces reuse their owned drawing. */
  private facePose: string = "{}";
  /** Increases whenever the actual face mesh population is replaced. */
  public geometryRevision: number = 0;

  /**
   * Prepare a low-cost body without generating the dense Human skin.
   * A supplied evaluator is borrowed and must use these exact complete parameters
   * with the required neck/foot descriptors; each pose still returns owned FK.
   */
  public constructor(
    parameters: IAutoMovieHumanParameters,
    color: number,
    prepared?: AutoMovieHumanSkeleton.PoseEvaluator,
  ) {
    this.evaluate = prepared ?? AutoMovieHumanSkeleton.prepare(parameters);
    this.neutral = this.evaluate({});
    this.output = this.neutral;
    const colors: Record<string, number> = Object.fromEntries(
      this.neutral.bones.map(
        (bone: AutoMovieHumanSkeleton.IBone): [string, number] => [
          bone.bone,
          color,
        ],
      ),
    );
    this.drawing = buildHumanPolygon(this.neutral, { partColors: colors });
    try {
      this.face = buildHumanCartoonFace(this.drawing.head);
    } catch (error) {
      this.drawing.dispose();
      throw error;
    }
    this.drawing.head.object.add(this.face.object);
    this.object.add(this.drawing.object);
  }

  /**
   * Apply a public pose and refresh the actual registered geometry.
   *
   * @evidence contracts/common.md#implementation-and-ownership The public evaluator produces the complete pose; the drawing consumes that output once without a second FK or hand placement.
   * @evidence contracts/common.md#authoring-interface The input uses clinical degrees. Out-of-range requests remain observable in output.clamped; no root adjustment or contact claim is made.
   */
  public pose(pose: IAutoMovieHumanPose): void {
    this.output = this.evaluate(pose);
    this.drawing.setPose(this.output);
    this.prepareFace(pose);
    this.object.updateWorldMatrix(true, true);
  }

  /**
   * Refresh the requested rigid head attachments before capturing physical geometry.
   * @evidence contracts/common.md#implementation-and-ownership Rebuilds the same displayed face once for a changed head pose and advances its population revision. A full-body floor query can capture that exact population before solving without another FK.
   * @evidence contracts/common.md#authoring-interface Pose uses admitted public head units; this changes owned face geometry only. The next pose application uses the same face and updates its real carrier matrices.
   */
  public prepareFace(pose: IAutoMovieHumanPose): void {
    const signature: string = JSON.stringify(pose.head ?? {});
    if (signature !== this.facePose) {
      const next: ReturnType<typeof buildHumanCartoonFace> =
        buildHumanCartoonFace(this.drawing.head, undefined, pose.head);
      this.face.object.removeFromParent();
      this.face.dispose();
      this.face = next;
      this.drawing.head.object.add(next.object);
      this.facePose = signature;
      this.geometryRevision++;
    }
  }

  /**
   * Borrow every current displayed rigid mesh with its nearest canonical carrier.
   * @evidence contracts/common.md#implementation-and-ownership Traverses the actual drawing and attachments, stopping at nested canonical carriers. Original part ids and named equipment stay stable while attachment paths distinguish the current face's separate meshes.
   * @evidence contracts/common.md#authoring-interface Nodes remain owned by this person and may be replaced at the next face revision. The caller measures their real matrices; this registry introduces no proxy geometry or collision exemptions.
   */
  public collisionParts(): readonly {
    id: string;
    bone: AutoMovieHumanRigControls.Joint;
    mesh: THREE.Mesh;
  }[] {
    const result: {
      id: string;
      bone: AutoMovieHumanRigControls.Joint;
      mesh: THREE.Mesh;
    }[] = [];
    const carriers: Set<THREE.Object3D> = new Set(this.drawing.bones.values());
    for (const [bone, group] of this.drawing.bones) {
      let ancestor: THREE.Object3D | null = group;
      let visible: boolean = true;
      while (ancestor) {
        visible = visible && ancestor.visible;
        ancestor = ancestor.parent;
      }
      if (!visible) continue;
      const visit: (node: THREE.Object3D, path: string) => void = (
        node: THREE.Object3D,
        path: string,
      ): void => {
        if (!node.visible) return;
        if (node !== group && carriers.has(node)) return;
        if (node instanceof THREE.Mesh)
          result.push({
            id:
              this.drawing.parts.get(bone) === node
                ? bone
                : node.name === "left-glove" || node.name === "right-glove"
                  ? node.name
                  : `${bone}:attachment${path}`,
            bone: bone as AutoMovieHumanRigControls.Joint,
            mesh: node,
          });
        node.children.forEach((child: THREE.Object3D, index: number): void =>
          visit(child, `${path}/${index}`),
        );
      };
      visit(group, "");
    }
    return result;
  }

  /**
   * Return real posed bone coordinates after this actor's current scene root.
   *
   * @evidence contracts/common.md#implementation-and-ownership Reads the public current FK and applies the actual actor parent world matrix once; missing bone identities throw.
   * @evidence contracts/common.md#authoring-interface Bone ids are exact Human ids and the returned owned tuple is world metres, with no implied surface contact.
   */
  public point(bone: string): [number, number, number] {
    const found: AutoMovieHumanSkeleton.IPlacement | undefined =
      this.output.posed.find(
        (item: AutoMovieHumanSkeleton.IPlacement): boolean =>
          item.bone === bone,
      );
    if (!found) throw new Error(`Missing Human bone: ${bone}`);
    this.object.updateWorldMatrix(true, false);
    return new THREE.Vector3(...found.position)
      .applyMatrix4(this.object.matrixWorld)
      .toArray();
  }

  /**
   * Release the drawing, face and actor parent after removing this instance.
   *
   * @evidence contracts/common.md#implementation-and-ownership Face and drawing have separate public owners; both retire even if one disposer throws.
   * @evidence contracts/common.md#authoring-interface This instance must not be posed or displayed after disposal; errors from either retirement remain observable.
   */
  public dispose(): void {
    const errors: unknown[] = [];
    try {
      this.face.dispose();
    } catch (error) {
      errors.push(error);
    }
    try {
      this.drawing.dispose();
    } catch (error) {
      errors.push(error);
    }
    this.object.removeFromParent();
    if (errors.length)
      throw new AggregateError(errors, "Inspection person retirement failed");
  }
}
