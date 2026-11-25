# Contributing to AFTERHOURS

[简体中文](CONTRIBUTING.zh-CN.md) · [Back to README](README.md)

## What is in this repository

This repository contains the deployed static site and its documentation, not the full TypeScript source project or a blanket open-source code license. Preview the static build locally with a static HTTP server; there is no `npm install` or source build step here.

## Report a reproducible issue

State the page or experiment, browser and OS, viewport or device, exact steps to reproduce, expected behavior, and actual behavior. Note whether reduced motion is enabled or a WebGL fallback triggered, attach a screenshot or short clip when helpful, and strip personal data from console logs.

## Improve documentation or previews

1. Fork and clone the repository.
2. Work on a scoped branch and update both English and Simplified Chinese docs when changing technical facts.
3. Place media under `docs/readme/`, capture the real application rather than synthetic stand-ins, and check both desktop and narrow layouts.
4. Document capture steps, implementation evidence, and remaining limitations in your pull request.

Published bundles are build output rather than authoring source. For behavior changes, open an issue to discuss the approach before touching generated bundles; docs, translations, reproduction reports, and focused examples are valuable on their own.

## Share fairly

Preserve third-party copyright and license notices, and credit borrowed ideas, adapted code, recordings, fonts, and materials. Do not present artistic approximations as scientific validation, configuration parameters as benchmarks, or emulated viewports as physical-device testing. Follow each asset's own terms—a code license does not automatically relicense artwork, audio, or other third-party materials.
