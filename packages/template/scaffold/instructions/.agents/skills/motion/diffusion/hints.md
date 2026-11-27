# Hints

Hints bring the composed performance to a motion model as keys, joint paths or a clip to regenerate, and check that the result still keeps them.

## Model input

Bring the performance into the model's frame rate, skeleton and body in this order:

1. Sample the installed vocabulary's performance at the model's frame rate.
2. Map the polygon man's joints to the model's via a declared joint table.
3. Use the model's units, up axis, facing and start placement.
4. Scale to the model's body or fit its body to the cast member.
   - Most models assume one set of proportions.

## Techniques

With any technique, give the model the beat's [manner](../compose/composition.md#action-axes) as text where it takes text.

### Keyframe in-betweening

Give the model full or partial poses at the beat's instants. A tool that preserves keys keeps them exactly; any other lands near them, so correct afterwards. Keep the keys few and far enough apart for the model to fill, within its documented gap and length.

Plain imputation of keys at every step leaves jumps around each key, and loose guidance drifts off them. Prefer a model trained for in-betweening, or one that enforces its constraints by a final optimization, and check the result either way.

### Joint and path control

Give the model the global positions of chosen joints, or the root's path on the ground, per frame with a mask. The result stays close to them, more loosely when several joints conflict.

### Interval regeneration

Give the model the whole clip, with a time window or a body part to regenerate. The clip is kept outside the window or part, as the model documents it.

### Style transfer

Give the model the clip and a reference of the style. The timing and path are kept, while the manner changes.

### Text or music

Give the model a description of the manner, or the score. This keeps nothing of the performance, so use it only beside one of the techniques above.

## Checks

A contact exact on the polygon man reaches the model only approximately, so after retargeting back, measure on the polygon man:

- the distance from each authored key and target;
- every authored contact and grip, checked under [retargeting](../retargeting.md#contacts-and-time).

A clip that misses a key or contact the beat decides is generated again or replaced by the composed motion, never accepted for its look.

Sources: [CondMDI](https://arxiv.org/html/2405.11126), [Kimodo constraints](https://research.nvidia.com/labs/sil/projects/kimodo/docs/user_guide/constraints.html), [Kimodo limitations](https://research.nvidia.com/labs/sil/projects/kimodo/docs/key_concepts/limitations.html), [OmniControl](https://arxiv.org/html/2310.08580), [GMD](https://arxiv.org/html/2305.12577), [MDM editing](https://github.com/GuyTevet/motion-diffusion-model), [MoMask](https://github.com/EricGuo5513/momask-codes), [HumanML3D representation](https://raw.githubusercontent.com/EricGuo5513/HumanML3D/main/motion_representation.ipynb), [PHC retargeting](https://github.com/ZhengyiLuo/PHC/blob/master/docs/retargeting.md), [Cascadeur inbetweening](https://cascadeur.com/help/category/278), [Cascadeur on control](https://digitalproduction.com/2026/02/18/cascadeur-on-physics-ai-and-control/), [Animaj in-betweening](https://www.animaj.com/post/inside-animajs-siggraph-2026-paper-anton-rael-on-ai-motion-in-betweening).
