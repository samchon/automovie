"""Run the external visual detectors for the face likeness measurement.

This adapter is the only place the MediaPipe runtime is called. It reads a
manifest of images, runs the Face Landmarker on every image and the Hair
Segmenter only on images marked as photographs, and writes raw observations:
the image SHA-256 and size, 478 landmarks in pixels, the detector's facial
transformation matrix, its blendshape scores and, for a photograph, a binary
hair mask PNG. It computes no comparison; `measure-face-likeness.ts` owns
every metric so that the arithmetic is unit tested in the TypeScript suite.

A render's hair is never segmented here. The capture's visible hair ID pass
(`capture-articulation.mjs`) is the render mask, because a selfie-trained
segmenter misses dark card hair on a render (see the package study notes).
An image with zero or several detected faces is written with `face: null`,
which the measurement keeps as a missing observation, never a zero score.

Usage, from the repository root inside a Python 3.11 environment holding
`mediapipe==0.10.35`, `numpy` and `Pillow`:

    python test/scripts/face-review/detect-face-likeness.py MANIFEST OUTPUT \
        FACE_LANDMARKER_TASK HAIR_SEGMENTER_TFLITE

MANIFEST is JSON `{"images": [{"id", "path", "photo": bool}]}`. OUTPUT must
be a new directory; it receives `detections.json`, and for each photograph
`<id>__hair.png` plus a lossless `<id>__rgb.png` of the decoded pixels.
Both model files are hashed into the output so a later run can prove it
used the same instrument. The models are Google's published
`face_landmarker.task` and `hair_segmenter.tflite`; the operator downloads
them, checks their model cards and licenses, and does not commit them.
"""
from __future__ import annotations

import hashlib
import json
from pathlib import Path
import sys

import mediapipe as mp
import numpy as np
from PIL import Image, ImageOps


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    manifest_path, output_path, face_model, hair_model = (Path(arg).resolve() for arg in sys.argv[1:5])
    if output_path.exists():
        raise ValueError("Output directory must be new")
    output_path.mkdir(parents=True)
    manifest = json.loads(manifest_path.read_text(encoding="utf8"))
    face_options = mp.tasks.vision.FaceLandmarkerOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(face_model)),
        output_face_blendshapes=True,
        output_facial_transformation_matrixes=True,
        num_faces=2,
    )
    hair_options = mp.tasks.vision.ImageSegmenterOptions(
        base_options=mp.tasks.BaseOptions(model_asset_path=str(hair_model)),
        output_category_mask=True,
        output_confidence_masks=False,
    )
    records = []
    with mp.tasks.vision.FaceLandmarker.create_from_options(face_options) as landmarker, mp.tasks.vision.ImageSegmenter.create_from_options(hair_options) as segmenter:
        for entry in manifest["images"]:
            path = Path(entry["path"]).resolve()
            # EXIF orientation is applied first and grayscale sources are
            # expanded, so both models observe the displayed RGB pixels.
            rgb = np.ascontiguousarray(np.asarray(ImageOps.exif_transpose(Image.open(path)).convert("RGB")))
            image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
            detected = landmarker.detect(image)
            face = None
            # num_faces=2 lets a second face be seen and refused instead of
            # the detector silently choosing one person in a group photo.
            if len(detected.face_landmarks) == 1 and len(detected.face_landmarks[0]) == 478:
                face = {
                    "landmarks": [[p.x * image.width, p.y * image.height] for p in detected.face_landmarks[0]],
                    "transform": np.asarray(detected.facial_transformation_matrixes[0]).tolist(),
                    "blendshapes": {c.category_name: c.score for c in detected.face_blendshapes[0]},
                }
            record = {
                "id": entry["id"],
                "path": str(path),
                "sha256": sha256(path),
                "width": image.width,
                "height": image.height,
                "faces": len(detected.face_landmarks),
                "face": face,
                "hairMask": None,
                "rgb": None,
            }
            if entry["photo"]:
                mask = segmenter.segment(image).category_mask.numpy_view().squeeze() == 1
                if mask.shape != (image.height, image.width):
                    raise ValueError(f"Segmentation size does not match {path}")
                name = f"{entry['id']}__hair.png"
                Image.fromarray((mask * 255).astype(np.uint8)).save(output_path / name)
                record["hairMask"] = name
                # The decoded, orientation-corrected pixels the detectors saw,
                # losslessly, so colour sampling reads exactly those pixels.
                Image.fromarray(rgb).save(output_path / f"{entry['id']}__rgb.png")
                record["rgb"] = f"{entry['id']}__rgb.png"
            records.append(record)
            print(entry["id"], "faces", record["faces"], flush=True)
    (output_path / "detections.json").write_text(json.dumps({
        "instrument": {
            "faceLandmarkerSha256": sha256(face_model),
            "hairSegmenterSha256": sha256(hair_model),
            "mediapipeVersion": mp.__version__,
        },
        "images": records,
    }, indent=1) + "\n", encoding="utf8")


if __name__ == "__main__":
    main()
