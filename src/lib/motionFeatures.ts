// Motion's animation + layout features (domMax: needed for the tracklist's shared-layout highlight).
// Loaded as a separate chunk by <LazyMotion> in providers.tsx so the first screen doesn't wait for it —
// the player (the only screen that animates with Motion) opens seconds later, by then it's loaded.
import { domMax } from 'motion/react'
export default domMax
