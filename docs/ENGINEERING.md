# AFTERHOURS · Engineering notes

**English** · [简体中文](ENGINEERING.zh-CN.md)

[Back to README](../README.md) · [Explore the website](https://playertc5418-art.github.io/afterhours/)

## Spatial navigation

Raycast proxies represent interactive spaces in the architecture. Their projected positions change with the scene, keeping interaction in the same perspective as the visible rooms.

Room inspection and object activation are separate actions:

```text
overview → entering → inspecting → handoff
```

The transitions coordinate camera motion, scroll ownership, and focus. Inspection provides a back action and Escape handling; drag thresholds distinguish orbiting from clicking. Object poses and screen projections then help connect the three-dimensional scene to DOM chapters. GSAP and Lenis coordinate animation and scroll; Three.js owns the spatial view.

## Graphics experiments

### Fluid typography

Two half-float render targets alternate between read and write. A fragment shader samples backward through the previous velocity field for semi-Lagrangian advection, adds a rotation response from neighboring velocity differences, and injects pointer forces through a Gaussian splat. Dissipation and edge attenuation gradually settle the field.

The text shader samples velocity and ink to displace UVs, separate RGB channels, and leave a subtle trail. A low-resolution simulation limits the field-update cost independently of the display resolution; the final display pass still has screen-space rendering costs.

This is a simplified interactive flow field, without a full divergence/pressure/projection pipeline. If the required floating-point render targets are unavailable, the text shader falls back to an analytical pointer ripple.

### GPU particle morphing

Canvas2D text sampling and sculpture geometry provide target point sets. Buffer attributes hold those targets, scatter directions, and random seeds. During animation, the vertex shader handles per-particle interpolation delays, scatter, pointer repulsion, and a radial shockwave.

The CPU updates uniforms rather than rebuilding and uploading every particle position each frame. Target sampling and buffer construction still happen during preparation. A lower particle count is selected for the mobile branch.

### Image reveal and material study

The reveal shader derives halftone-dot sizes from image luminance. A scan front blends noise, grid, halftone, and source-image stages. A local pointer lens changes UV sampling and separates color channels to produce screen-space refraction and dispersion.

The material study derives solid, line, and point representations from one base form. The layers synchronize time, pointer, scroll, and twist inputs, with clipping and opacity controlling the visual states. Invisible layers stop participating in drawing. Derived line/point geometry means this is not literally a single geometry object for every representation.

## Renderer and preparation

### Shared renderer, explicit state

The opening road and architecture share the `WebGLRenderer` created by `RenderHost`. Home-scene preparation runs first; the opening then draws over it before presentation. Once the home scene takes over, the canvas moves to its container.

The handoff restores render target, viewport, scissor, clearing behavior, output color space, tone mapping, exposure, and shadows. Sharing a context makes these state boundaries explicit. The claim applies to the opening and host site; standalone experiences own their own runtimes.

### Worker-side environment data

A Worker fetches baked environment data, checks headers, dimensions, and byte lengths, and decompresses gzip when required. Transferable buffers return to the main thread, which constructs half-float textures. The Worker does not create a WebGL context or perform GPU uploads. Failures settle resources through the fallback path. A download that remains pending for 15 seconds is terminated, allowing the existing procedural environments to prepare the scene. The outer preparation deadline allows 90 seconds.

### Incremental compilation and draw priming

Compilation candidates are deduplicated by material, object type, instancing attributes, vertex layout, and morph layout. Batches of eight representatives call `compileAsync`, yielding between batches.

Compilation is followed by actual framebuffer draws: up to four objects per batch, through a `32 × 32` viewport/scissor region, including shadow-state preparation. This exercises first-use work beyond program compilation; it is not the resolution of the final scene.

Preparation restores object visibility, culling, targets, and scissor state. Paused or hidden pages wait before priming; cancellation uses `AbortSignal`. Resource release waits for relevant in-flight compilation work.

### Readiness before reveal

Modules, fonts, scene construction, surface resources, shaders, and warm-up each report progress. Resources record completion and fallback. The normal path separates three states:

```text
ready → presented → entered
```

Skip, reduced-motion, and failure paths are handled separately. The visible loading sequence does not substitute for actual preparation readiness.

These choices move and distribute work. Network conditions, drivers, shader caches, and GPU capability still influence performance; no fixed frame rate is implied.

## Standalone experiences

- **Singularity:** Three.js imagery and camera control with distance-responsive Web Audio.
- **Gravity Off:** Three.js rendering and Rapier simulation for release, drag, gravity changes, pause, and reassembly.
- **Xiaojian:** miniature worlds combining geometry, materials, lighting, weather, and sound.

Their host-site miniatures are navigation objects. The main page does not run all three full applications or duplicate the standalone physics simulation.

## Scope

The repository distributes static output, rather than the complete development project. Internal module names explain the implementation; they are not links to public source files in this repository.

Recorded checks cover Windows Chromium and mobile-size emulation. Physical phones, Safari, and low-end GPUs need separate acceptance. This document adds no new benchmark claims.

[Back to README](../README.md)
