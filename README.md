# Bilingual Pictionary

Free, static, no-account bilingual (English/Spanish) Pictionary game for mixed-language
families. v1 is single-device pass-and-play only — everyone gathers around one
phone/tablet/laptop. Words are shown in both languages at once for every prompt.

## Files
- `index.html` — setup screen + game screen + rules
- `pictionary.js` — game logic (team setup, word draw, dice challenge, timer, scoring)
- `words.js` — bilingual word bank, tiered by difficulty/age range (kids/family/adults)
- `styles.css` — visual theme (distinct from other ventures' navy/gold palette)

## v1 scope (deliberate cut, see PORTFOLIO.md/STATUS.md)
Single-device pass-and-draw only. **Not included**: real online multiplayer with a live
drawing-stream between remote players — that needs real-time infrastructure
(WebSocket/WebRTC) this portfolio hasn't used anywhere else yet, and was explicitly
deferred to a v2 decision rather than blocking v1.

## Local development
No build step. Serve the directory with any static server, e.g.:
```
python3 -m http.server 8000
```

## Deploy
Push to a GitHub repo with Pages enabled on the root of `main` (or push `site/` as the
repo root).
