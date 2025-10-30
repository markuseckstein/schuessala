# 🃏 Schafkopf P2P Payment Tracker

A peer-to-peer web application for tracking payments during Schafkopf card games. No server required, all data stays on your devices!

## Features

### Game Support
- **Rufspiel** (5 cents base) - Partnership game
- **Solo** (20 cents base) - One vs three
- **Wenz** (20 cents base) - Only Unters as trumps
- **Laufende** bonus (3-8: adds 15-40 cents)
- **Schneider** multiplier (×2)
- **Schwarz** multiplier (×3)

### Technical Features
- ✅ **True Peer-to-Peer** using WebRTC (PeerJS)
- ✅ **QR Code joining** for easy table access
- ✅ **Real-time sync** across all 4 players
- ✅ **Optimized settlements** to minimize transactions
- ✅ **PWA support** - install like a native app
- ✅ **Offline capable** once connected
- ✅ **No registration** required
- ✅ **Privacy-first** - no data sent to servers

## Quick Start

### Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### Usage

1. **Create a Table**
   - Open the app
   - Enter your name
   - Click "Neuen Tisch erstellen"
   - Share the QR code or 4-digit code

2. **Join a Table**
   - Scan QR code or enter the 4-digit code
   - Enter your name
   - Wait for all 4 players

3. **Play**
   - Select game variant
   - Select player(s) using toggle buttons
   - Mark win/loss
   - Add bonuses (Schneider/Schwarz/Laufende)
   - Submit round

4. **View Balances**
   - See live running totals
   - View optimized settlement suggestions
   - Check game history

## Architecture

### Tech Stack
- **Frontend**: Svelte 4 + TypeScript
- **Build Tool**: Vite 5
- **Styling**: TailwindCSS + DaisyUI
- **P2P**: PeerJS (WebRTC wrapper)
- **QR Codes**: qr-code-styling
- **PWA**: vite-plugin-pwa

### Project Structure
```
src/
├── lib/
│   ├── p2p/
│   │   └── PeerManager.ts       # WebRTC connection handling
│   ├── game/
│   │   ├── Calculator.ts        # Payment calculations
│   │   └── types.ts             # TypeScript types
│   └── storage/
│       └── localStorage.ts      # Player name persistence
├── stores/
│   ├── gameStore.ts             # Game state management
│   └── peerStore.ts             # P2P connection state
├── components/
│   ├── QRDisplay.svelte         # QR code display
│   ├── RoundEntry.svelte        # Round input form
│   └── BalanceView.svelte       # Balance & settlement view
└── routes/
    ├── Home.svelte              # Landing page
    ├── Join.svelte              # Join table flow
    └── Table.svelte             # Active game view
```

## Game Rules Reference

### Payment Calculation

**Base Formula:**
```
amount = (base_rate × multiplier) + laufende_bonus
```

**Multipliers:**
- Normal: ×1
- Schneider: ×2
- Schwarz: ×3

**Laufende Bonus:**
- 3 laufende: +15ct
- 4 laufende: +20ct
- 5 laufende: +25ct
- 6 laufende: +30ct
- 7 laufende: +35ct
- 8 laufende: +40ct

**Example:**
Solo (20ct) + Schwarz (×3) + 4 Laufende (+20ct)
= 20 × 3 + 20 = **80ct per player**

### Payment Distribution

**Rufspiel (2v2):**
- Winners: Each gets amount from each loser (2 transactions)
- Losers: Each pays amount to each winner (2 transactions)
- Total: 4 transactions

**Solo/Wenz (1v3):**
- Winner: Gets amount from each of 3 opponents
- Loser: Pays amount to each of 3 opponents
- Total: 3 transactions

## Deployment

### Static Hosting (Recommended)
Deploy to any static host:
- **Netlify**: Drop the `dist/` folder
- **Vercel**: Connect GitHub repo
- **GitHub Pages**: Enable in repo settings
- **Cloudflare Pages**: Connect repo

### Build
```bash
npm run build
# Upload dist/ folder to your host
```

## Browser Compatibility

- Chrome/Edge: ✅ Full support
- Firefox: ✅ Full support
- Safari: ✅ Full support
- Mobile browsers: ✅ Full support

**Note:** WebRTC requires HTTPS in production (except localhost)

## Known Limitations

1. **NAT Traversal**: ~10% of restrictive networks may block P2P connections
2. **No Persistence**: Game history lost when all players disconnect
3. **4 Players Required**: Can't start rounds with fewer players
4. **Host Dependency**: Host must stay connected (auto-election implemented)

## Future Enhancements

- [ ] IndexedDB persistence for offline game history
- [ ] TURN server fallback for restrictive networks
- [ ] Export game history to CSV/PDF
- [ ] Host migration improvements
- [ ] Additional game variants (Geier, Sie)
- [ ] Customizable payment rates

## License

MIT

## Contributing

PRs welcome! Please ensure:
- TypeScript types are correct
- Code follows existing style
- Game calculations are accurate
- No server dependencies added

---

**Made with ❤️ for Bavarian card players**
