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

A Worker fetches baked environment data, checks headers, dimensions, and byte lengths, and decompresses gzip when required. Transferable buffers return to the main thread, which constructs half-float textures. The Worker does not create a WebGL context or perform GPU uploads. Failures settle resources through the fallback path. A download that remains pending for 15 seconds is terminated, allowing the existing procedural environments to prepare the scene. PBR image maps also use neutral textures after 15 seconds of waiting; a later successful image load replaces the neutral map. The outer preparation deadline allows 90 seconds.

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

- **Singularity:** native WebGL and custom GLSL imagery, camera control, and distance-responsive Web Audio.
- **Gravity Off:** Three.js rendering and Rapier simulation for release, drag, gravity changes, pause, and reassembly.
- **Xiaojian:** miniature worlds combining geometry, materials, lighting, weather, and sound.

Their host-site miniatures are navigation objects. The main page does not run all three full applications or duplicate the standalone physics simulation.

## Scope

The repository distributes static output, rather than the complete development project. Internal module names explain the implementation. The shipped-file reading guide below links to public distribution files, not the full authoring tree.

Recorded checks cover Windows Chromium and mobile-size emulation. Physical phones, Safari, and low-end GPUs need separate acceptance. This document adds no new benchmark claims.

[Back to README](../README.md)


## Build the idea in smaller pieces

The examples below deliberately remove application plumbing. They explain the shipped algorithms; they are **not drop-in files or a complete runnable source project**. Start with one pass or interaction, inspect its inputs, then add the surrounding lifecycle.

### 1. Understand the ping-pong boundary

Read and write different textures during a simulation step. Sampling from the same texture currently attached for rendering would create a feedback problem. A reduced sketch of the field update is:

```js
uniforms.uPrev.value = read.texture;
renderer.setRenderTarget(write);
renderer.render(fieldScene, fieldCamera);
renderer.setRenderTarget(null);
[read, write] = [write, read];
```

The field shader backtraces through the previous velocity, then adds a pointer splat and decay. The display shader samples the resulting field. Learn the two passes separately: first visualize velocity as color, then use it to perturb text UVs. A useful experiment is to change dissipation while holding pointer force constant.

### 2. Separate particle targets from animation state

The actual shader delays each particle using its stored seed:

```glsl
float local = smoothstep(aSeed * 0.45,
                         aSeed * 0.45 + 0.55, uMix);
vec3 p = mix(shape(uFrom), shape(uTo), local);
p += aScatter * sin(local * 3.14159) * 0.55 * motion;
```

Targets remain in vertex attributes while uniforms describe the current transition. Repulsion and the radial impulse are additional position offsets. To study the effect, disable scatter first: the plain interpolation makes the correspondence and resampling limitations easier to see.

### 3. Treat reveal, lens, and framing as separate controls

The reveal uses image luminance to size dots, then a scan mask to blend stages. Lens refraction changes the lookup UV near the pointer; it does not alter the original image. Aspect-aware cover sampling is a separate step.

Test with a flat gray image before a detailed photograph: that exposes the dot grid and scan mask. Then enable the lens at a fixed reveal value. Keeping the controls independent helps distinguish a framing error from a shader effect.

### 4. Deform every representation consistently

The material study derives surfaces, lines, and points from the same base form. Apply corresponding twist and clip inputs to every visible representation. Otherwise the solid may move while the wire view remains in its original pose.

Watch visibility as well as opacity. Hiding a completed layer prevents an unnecessary draw; setting its opacity to zero alone does not express that scheduling decision.

### 5. Transfer environment data, then upload on the main thread

The environment Worker transfers the decoded buffers:

```js
self.postMessage({ maps }, {
  transfer: maps.map(map => map.data)
});
```

Ownership moves rather than leaving a reusable copy in the Worker. The receiver still constructs textures and performs GPU uploads. Header, dimensions, byte length, gzip detection, cancellation, and timeout handling are part of the implementation—not optional details hidden by this small example.

### 6. Compile programs, then exercise a real draw

`compileAsync` prepares shader programs, while the first real draw can still require buffer upload, texture upload, shadow preparation, or driver work. The implementation groups representative variants in batches of eight, then primes small-area draws in batches of up to four objects.

These are scheduling choices rather than measured performance guarantees. Check actual entry-frame behavior after a cold load, a failed request, and a return transition. Restore viewport, scissor, target, visibility, and culling after preparation.

### 7. Keep physics time separate from display time

Gravity Off accumulates elapsed time, runs fixed simulation steps, and caps catch-up work. A reduced sketch is:

```js
accumulator += elapsed;
let steps = 0;
while (accumulator >= 1 / 60 && steps < 4) {
  simulation.step();
  accumulator -= 1 / 60;
  steps++;
}
```

The application adds pause and interaction states around that loop. A fixed step is not the same as rendering at 60 fps. Reassembly changes bodies to kinematic motion so a designed return does not fight free-body collisions.

### 8. Drive distance-responsive sound smoothly

Singularity maps inverse camera distance into a smoothed proximity value. It uses that value to target gain and low-pass frequency, with `setTargetAtTime` smoothing the change. Updating an AudioParam target smoothly avoids treating each display frame as an abrupt volume switch.

The visual preview cannot demonstrate sound quality. Open the actual page, enable audio through a user gesture, and compare far and near positions. Keep the recording's attribution separate from the synthesized ambience.

### 9. Give every small world an identity and an exit

Xiaojian checks the message origin, sender window, protocol version, and scene instance. A late ready or photo message from a previous world must not change the current world. Disposal sends a request, waits for acknowledgement or a bounded timeout, and then retires the frame.

Reproduce a lifecycle issue by switching scenes rapidly, returning to a cached scene, opening a dialog, and hiding the browser tab. Check what continues rendering or playing sound, rather than assuming a hidden iframe is inactive.

## Read the actual shipped implementation

The public files below are the current distribution, not the complete TypeScript authoring tree. Host bundles are deliberately labeled as bundles. Search function names inside them when following the walkthrough.

| Topic | Published file / entry point |
| --- | --- |
| Flow, particles, material study | [Host graphics bundle](../assets/World-C9Mo80hw.js): `createFlow`, `particleTextSteps`, `createArtifact` |
| Opening state and shared renderer | [Host entry bundle](../assets/index-Cu9ZWOIE.js): `RenderHost`, `Opening` |
| Environment decompression | [Worker distribution](../assets/environment.worker-CH5BMuaY.js) |
| Black-hole ray integration and post pass | [Singularity GLSL](../sites/blackhole/app/shaders.mjs) |
| Distance-to-sound mapping | [Singularity audio](../sites/blackhole/app/audio.mjs): `intensity`, `applyMix` |
| Render budget and context restoration | [Singularity renderer](../sites/blackhole/app/renderer.mjs) |
| Rigid bodies and reassembly | [Gravity Off bundle](../sites/gravity-off/app.js): simulation and fixed-step loop |

## Further reading

- [Three.js Raycaster](https://threejs.org/docs/pages/Raycaster.html): picking rays and intersection results.
- [Three.js BufferGeometry](https://threejs.org/docs/pages/BufferGeometry.html): per-vertex data and attributes.
- [Three.js WebGLRenderer](https://threejs.org/docs/pages/WebGLRenderer.html): rendering, targets, and compilation APIs.
- [Transferable objects — MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects): ownership transfer and detached buffers.
- [Rapier rigid bodies](https://rapier.rs/docs/user_guides/javascript/rigid_bodies/): dynamic and kinematic bodies.

These links explain the underlying APIs. The project-specific behavior and limitations described above come from the implementation, rather than implying endorsement by those projects.

[Contribute a reproduction or improvement](../CONTRIBUTING.md) · [Back to README](../README.md)
