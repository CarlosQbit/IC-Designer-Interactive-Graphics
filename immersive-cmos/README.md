# IC Design Lab — Immersive CMOS WebXR v2

This version is designed to make the transition from a normal Quest Browser page
into a true WebXR `immersive-vr` session explicit.

## What changed from v1

- Large `ENTER IMMERSIVE VR` launcher.
- Direct call to `navigator.xr.requestSession("immersive-vr")`.
- `local-floor` is required for floor-relative 6DoF.
- `bounded-floor` and `hand-tracking` are optional.
- Browser UI disappears when the XR session starts.
- Added a surrounding virtual lab: floor, walls, platform and overhead spatial cues.
- Existing in-world CMOS controls remain available.

## GitHub Pages

Upload the complete folder:

```text
immersive-cmos/
├── index.html
├── main.js
├── style.css
└── README.md
```

Then open:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/immersive-cmos/
```

## On Meta Quest

1. Open the HTTPS URL in Meta Quest Browser.
2. Press `ENTER IMMERSIVE VR`.
3. Approve the immersive session if the system asks.
4. The browser panel should be replaced by the XR world.
5. Physically move your head/body to inspect the device.
6. Point + trigger (or supported hand input) at the in-world control panel.

WebXR immersive sessions require an explicit user action; a website cannot silently
force itself into immersive VR.
