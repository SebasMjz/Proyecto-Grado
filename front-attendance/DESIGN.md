# Design System

<!-- impeccable:design-schema 1 -->

## Direction Contract

### THESIS
A high-prestige Web3 credential dApp for short-term events (hackathons, academic conferences, technical workshops). Refuses generic corporate dashboards and dated bright-red/blue templates; embraces an authentic, deep obsidian and radiant amber-gold aesthetic with cryptographic emerald verification badges and monospace transaction identifiers.

### OWN-WORLD
- Ground: Deep Obsidian Starlight (`#060b17`)
- Surface: Elevated Midnight Slate (`#0d1527`), border `rgba(255, 255, 255, 0.08)`
- Primary Action: Radiant Amber Gold (`#f59e0b` / `#fbbf24`), text `#060b17`
- Cryptographic Proof: Emerald Verified (`#10b981`), IPFS/Explorer Cyan (`#38bdf8`)
- Typography: Plus Jakarta Sans / Inter for UI, JetBrains Mono for on-chain addresses & hashes

### STORY
Organizers effortlessly track real-time attendance across short sessions using dynamic QR check-ins. When the event concludes, quorum-eligible attendees are minted verifiable, non-transferable Soulbound Tokens (ERC-5192) directly to their EVM addresses, with metadata pinned to IPFS and immediate diploma previews.

### FIRST VIEWPORT
- Sticky topbar with live Testnet status beacon, quick mint access, and interactive Web3 wallet pill.
- Prominent metrics showing live event sessions, total attendees checked-in, and issued SBT credentials.
- Multi-step visual timeline for blockchain minting (IPFS metadata -> Web3 signature -> On-chain block lock).

### FORM
- Seed: seed:a7853af421f027dd
- Mode: Operate & Experience

### FINISH
unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance.

## Palette Tokens

| Role | Color | Hex | Usage |
|---|---|---|---|
| Background Primary | Deep Obsidian | `#060b17` | Root application background |
| Surface Secondary | Elevated Midnight | `#0d1527` | Cards, table headers, containers |
| Surface Card High | High Elevation | `#111b33` | Modals, floating popups |
| Brand Primary | Radiant Amber | `#f59e0b` | Buttons, highlights, active states |
| Brand Primary Light | Bright Gold | `#fbbf24` | Icons, active labels, token IDs |
| Verified Success | Emerald | `#10b981` | Minted status, live network beacons |
| Explorer Cyan | IPFS Cyan | `#38bdf8` | Transaction hashes, IPFS CIDs |
| Text Primary | White Slate | `#f8fafc` | Headings and primary copy |
| Text Secondary | Slate | `#94a3b8` | Subtitles and labels |
| Border | Translucent White | `rgba(255,255,255,0.08)` | Card borders, dividers |

## Typography

- **Headings & Body**: `Plus Jakarta Sans`, `Inter`, sans-serif
- **Code & Hashes**: `JetBrains Mono`, `ui-monospace`, `monospace`
- **Heading Tracking**: `-0.02em` for modern crispness
