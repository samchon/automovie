import {
  AutoMovieHuman,
  AutoMovieHumanConverter,
  IAutoMovieHumanTraits,
} from "@automovie/human";
import { IAutoMovieModel } from "@automovie/interface";
import {
  IAutoMovieModelObject,
  buildModel,
  mountViewer,
} from "@automovie/viewer";
import * as THREE from "three";

// Human inspection page: the current AutoMovieHuman output through the viewer.
const traits: IAutoMovieHumanTraits = {
  version: 1,
  sex: "female",
  age: 30,
  stature: null,
  population: "european",
  build: { adiposity: 0, muscularity: 0, slimness: 0, cuteness: 0 },
};
const converter: AutoMovieHumanConverter = new AutoMovieHumanConverter();
const human: AutoMovieHuman = AutoMovieHuman.fromTraits({
  id: "human",
  traits,
  converter,
});
const model: IAutoMovieModel = human.getModel({
  appearance: converter.toAppearance(traits),
});
const object: IAutoMovieModelObject = buildModel(model);
const scene: THREE.Scene = new THREE.Scene();
scene.background = new THREE.Color(0xf2f4f8);
scene.add(
  object.object,
  new THREE.HemisphereLight(0xffffff, 0x9aa3b2, 2),
);
const camera: THREE.PerspectiveCamera = new THREE.PerspectiveCamera(
  35,
  1,
  0.01,
  100,
);
camera.position.set(0, 1, 4);
camera.lookAt(0, 0.9, 0);
mountViewer(
  document.querySelector<HTMLCanvasElement>("#view")!,
  scene,
  camera,
  (): void => {},
);
