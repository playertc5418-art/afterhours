# Contributing to AFTERHOURS

[简体中文](CONTRIBUTING.zh-CN.md) · [Back to README](README.md)

## What is in this repository

The public repository holds the deployed static website and its documentation. It does not currently contain the complete TypeScript development project or declare a blanket code license. You can preview the published files with a local HTTP server; there is no `npm install` or source build step in this repository.

## Report a reproducible issue

Include the page or experiment, browser and operating system, viewport or device, exact actions, expected result, and actual result. Mention reduced-motion settings and whether WebGL fallback appeared. Add a screenshot or short recording when it explains the issue. Redact private information from console logs.

## Improve the documentation or previews

1. Fork and clone the repository.
2. Make a focused branch and update both language versions when changing technical claims.
3. Keep media in `docs/readme/`; record the actual application rather than fabricating an effect. Check desktop and narrow layouts.
4. Explain the capture steps, implementation evidence, and any remaining limitations in the pull request.

Static publishing artifacts are not the authoring source. For behavior changes, open an issue describing the proposed change before editing a generated bundle. Documentation, translations, reproduction reports, and targeted examples are useful contributions on their own.

## Share fairly

Keep third-party copyright and license notices. Credit borrowed ideas, adapted code, sound recordings, fonts, and materials. Do not describe artistic approximation as scientific validation, configuration values as benchmarks, or a simulated viewport as a physical-device test. Refer to each asset's existing terms; a code license would not automatically relicense artwork, recordings, or other third-party material.
