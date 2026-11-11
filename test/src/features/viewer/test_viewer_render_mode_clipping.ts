import {
  EDGE_SHELL_NAME,
  type IAutoMovieRenderModeHandle,
  applyAutoMovieInspectionShade,
  applyRenderMode,
} from "@automovie/viewer";
import { TestValidator } from "@nestia/e2e";
import * as THREE from "three";

/**
 * The hand-written shader materials the viewer installs, the depth pass, the outline shell and the faces shade, carry everything three.js needs to cut them by a clipping plane, so a section given to one of them cuts it on the page.
 *
 * three.js cuts a `ShaderMaterial` only when its `clipping` switch is on and both stages hold the clipping chunks in their places: the vertex stage declares the clip position before `main` and assigns it inside `main` from an `mvPosition` declared earlier, and the fragment stage declares the planes before `main` and discards inside it. three.js resolves an include only where it starts its line, so one behind a comment marker or another statement brings no chunk in, and it throws when it builds a program that names a chunk it does not ship.
 *
 * Scenarios:
 *
 * 1. The material the depth pass gives a mesh meets every condition.
 * 2. The shell the outline pass adds beside a mesh meets every condition, and the fill it gives the mesh is a built-in basic material, which three.js cuts by itself.
 * 3. The material the faces shade gives a mesh meets every condition, its `mvPosition` coming from three.js's own projection chunk.
 * 4. A bare shader material without clipping fails the six clipping conditions, the depth program in a material whose switch is off fails the switch alone, and the depth program fails a known set for each of three edits: one chunk name misspelt fails that chunk's condition and the shipped-chunk condition, the fragment discard commented out fails that discard, and the vertex assignment moved behind another statement on its line fails that assignment and the `mvPosition` before it.
 *
 * @evidence contracts/development/testing.md#behavioral-verification Applies the public passes and shade to an actual three.js scene and reads the program text and clipping switch of the materials they install, which is what three.js compiles. It does not compile GLSL or draw a pixel, so it fails for a dropped switch, a chunk that is missing, misspelt, on the wrong side of `main` or not at the start of its line, and an `mvPosition` declared too late, and not for a program that holds every chunk and still draws wrongly.
 * @evidence contracts/development/testing.md#independent-expectations The conditions are three.js's own rule for clipping a shader material, stated above, and the shipped chunk names are read from the installed `THREE.ShaderChunk`, not from the viewer's sources. Whether the pixels are cut is outside this oracle and was observed on a browser page.
 * @evidence contracts/development/testing.md#distinguishing-cases The three installed materials meet every condition while five controls each fail a known set: none of the clipping conditions met, the switch alone, one misspelt chunk, one commented-out include and one include behind another statement on its line, so a check that always passes or always fails is told apart.
 * @evidence contracts/development/testing.md#execution-ownership This named portable unit builds its own scenes and materials and starts no browser, server or GPU.
 * @evidence contracts/development/common.md#meaningful-documentation Lists the 4 numbered scenarios it runs, each sentence naming the input and the behavior it pins (first: The material the depth pass gives a mesh meets every condition.).
 */
export function test_viewer_render_mode_clipping(): void {
  const stage = (): { scene: THREE.Scene; mesh: THREE.Mesh } => {
    const scene: THREE.Scene = new THREE.Scene();
    const mesh: THREE.Mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1),
      new THREE.MeshStandardMaterial({ color: 0xff0000 }),
    );
    scene.add(mesh);
    return { scene, mesh };
  };

  // The pattern three.js 0.186 resolves includes by: an include that starts its line, after spaces and tabs only.
  const pattern: RegExp = /^[ \t]*#include +<([\w\d./]+)>/gm;

  // Every include three.js resolves in a stage: the chunk's name and the offset of its line.
  const includes = (source: string): { name: string; at: number }[] =>
    Array.from(
      source.matchAll(pattern),
      (match: RegExpMatchArray): { name: string; at: number } => ({
        name: match[1]!,
        at: match.index!,
      }),
    );

  // Where a stage includes a chunk, as the offset of that line, or -1 when three.js resolves no such include.
  const where = (source: string, chunk: string): number =>
    includes(source).find(
      (include: { name: string; at: number }): boolean =>
        include.name === chunk,
    )?.at ?? -1;

  // A stage with each resolved include written out; a chunk three.js does not ship expands to nothing here, where three.js throws.
  const expand = (source: string): string =>
    source.replace(pattern, (_: string, name: string): string =>
      expand(
        (THREE.ShaderChunk as Record<string, string | undefined>)[name] ?? "",
      ),
    );

  // The conditions of a cut a material does not meet, by name; empty when three.js can cut it.
  const lacks = (material: unknown): string[] => {
    if (!(material instanceof THREE.ShaderMaterial))
      return ["a shader material"];
    const vertex: string = material.vertexShader;
    const fragment: string = material.fragmentShader;
    const declared = (source: string, chunk: string): boolean => {
      const at: number = where(source, chunk);
      return at >= 0 && at < source.indexOf("void main");
    };
    const used = (source: string, chunk: string): boolean => {
      const main: number = source.indexOf("void main");
      return main >= 0 && where(source, chunk) > main;
    };
    const assigned: number = where(vertex, "clipping_planes_vertex");
    const conditions: [string, boolean][] = [
      ["the clipping switch", material.clipping === true],
      [
        "the vertex declaration before main",
        declared(vertex, "clipping_planes_pars_vertex"),
      ],
      [
        "the vertex assignment inside main",
        used(vertex, "clipping_planes_vertex"),
      ],
      [
        "mvPosition declared before the vertex assignment",
        assigned >= 0 &&
          expand(vertex.slice(0, assigned)).includes("vec4 mvPosition"),
      ],
      [
        "the fragment declaration before main",
        declared(fragment, "clipping_planes_pars_fragment"),
      ],
      [
        "the fragment discard inside main",
        used(fragment, "clipping_planes_fragment"),
      ],
      [
        "only chunks three.js ships",
        [...includes(vertex), ...includes(fragment)].every(
          (include: { name: string; at: number }): boolean =>
            include.name in THREE.ShaderChunk,
        ),
      ],
    ];
    return conditions
      .filter(([, met]: [string, boolean]): boolean => !met)
      .map(([name]: [string, boolean]): string => name);
  };

  // 1. Depth pass.
  const deep: { scene: THREE.Scene; mesh: THREE.Mesh } = stage();
  const depth: IAutoMovieRenderModeHandle = applyRenderMode(
    deep.scene,
    "depth",
  );
  const program: THREE.ShaderMaterial = deep.mesh
    .material as THREE.ShaderMaterial;
  const source: { vertex: string; fragment: string } = {
    vertex: program.vertexShader,
    fragment: program.fragmentShader,
  };
  TestValidator.equals(
    "the depth pass material can be cut",
    lacks(deep.mesh.material),
    [],
  );
  depth.restore();

  // 2. Outline pass: a shell beside the mesh, and a built-in fill on it.
  const lined: { scene: THREE.Scene; mesh: THREE.Mesh } = stage();
  const outline: IAutoMovieRenderModeHandle = applyRenderMode(
    lined.scene,
    "outline",
  );
  const shell: THREE.Object3D | undefined =
    lined.scene.getObjectByName(EDGE_SHELL_NAME);
  TestValidator.equals(
    "the outline shell material can be cut",
    lacks(shell instanceof THREE.Mesh ? shell.material : null),
    [],
  );
  TestValidator.predicate(
    "the outline fill is a built-in basic material",
    lined.mesh.material instanceof THREE.MeshBasicMaterial,
  );
  outline.restore();

  // 3. Faces shade.
  const sided: { scene: THREE.Scene; mesh: THREE.Mesh } = stage();
  const faces: { update: () => void; restore: () => void } =
    applyAutoMovieInspectionShade(sided.scene, "faces");
  TestValidator.equals(
    "the faces shade material can be cut",
    lacks(sided.mesh.material),
    [],
  );
  faces.restore();

  // 4. Controls: the check names what each broken material lacks.
  TestValidator.equals(
    "a bare shader material lacks the six clipping conditions",
    lacks(
      new THREE.ShaderMaterial({
        vertexShader:
          "void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 ); }",
        fragmentShader: "void main() { gl_FragColor = vec4( 1.0 ); }",
      }),
    ),
    [
      "the clipping switch",
      "the vertex declaration before main",
      "the vertex assignment inside main",
      "mvPosition declared before the vertex assignment",
      "the fragment declaration before main",
      "the fragment discard inside main",
    ],
  );
  TestValidator.equals(
    "the depth program with its switch off lacks the switch alone",
    lacks(
      new THREE.ShaderMaterial({
        vertexShader: source.vertex,
        fragmentShader: source.fragment,
      }),
    ),
    ["the clipping switch"],
  );
  TestValidator.equals(
    "the depth program with a misspelt chunk lacks that chunk and names it unshipped",
    lacks(
      new THREE.ShaderMaterial({
        clipping: true,
        vertexShader: source.vertex.replace(
          "clipping_planes_pars_vertex",
          "clipping_planes_par_vertex",
        ),
        fragmentShader: source.fragment,
      }),
    ),
    ["the vertex declaration before main", "only chunks three.js ships"],
  );
  TestValidator.equals(
    "the depth program with its fragment discard commented out lacks that discard",
    lacks(
      new THREE.ShaderMaterial({
        clipping: true,
        vertexShader: source.vertex,
        fragmentShader: source.fragment.replace(
          "#include <clipping_planes_fragment>",
          "// #include <clipping_planes_fragment>",
        ),
      }),
    ),
    ["the fragment discard inside main"],
  );
  TestValidator.equals(
    "the depth program with its vertex assignment behind another statement lacks that assignment",
    lacks(
      new THREE.ShaderMaterial({
        clipping: true,
        vertexShader: source.vertex.replace(
          "#include <clipping_planes_vertex>",
          "; #include <clipping_planes_vertex>",
        ),
        fragmentShader: source.fragment,
      }),
    ),
    [
      "the vertex assignment inside main",
      "mvPosition declared before the vertex assignment",
    ],
  );
}
