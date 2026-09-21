# IC Design Lab — CMOS Inverter WebXR v1

This is a browser-based Meta Quest prototype.

## Files

- `index.html` — entry page
- `main.js` — Three.js/WebXR scene and interaction logic
- `style.css` — desktop browser UI

## Deploy to GitHub Pages

Create a folder in your existing GitHub Pages repository, for example:

```text
quest-cmos-inverter/
├── index.html
├── main.js
└── style.css
```

Then open:

```text
https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/quest-cmos-inverter/
```

Use HTTPS. WebXR immersive sessions require a secure context.

## Meta Quest

1. Open the URL in Meta Quest Browser.
2. Select `ENTER VR`.
3. Use either Touch controllers or hand tracking if available.
4. Point at the floating control panel.
5. Trigger/pinch on:
   - VIN LOW
   - MID
   - VIN HIGH
   - -0.10
   - +0.10
   - CURRENT ON/OFF
   - LABELS ON/OFF

## What v1 demonstrates

- real WebXR immersive session
- 6DoF headset tracking
- controller target rays
- optional hand tracking request
- shared input behavior through WebXR select events
- interactive in-world controls
- VIN-dependent PMOS/NMOS channel highlighting
- illustrative current path
- desktop fallback

## Physics note

The transition-region voltage/output relation in this prototype is illustrative.
It is not yet calculated from BSIM/SPICE device models.
