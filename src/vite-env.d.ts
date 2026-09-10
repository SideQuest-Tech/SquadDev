/// <reference types="vite/client" />

declare module '*.jpg' { const src: string; export default src; }
declare module '*.jpeg' { const src: string; export default src; }
declare module '*.png' { const src: string; export default src; }
declare module '*.webp' { const src: string; export default src; }
declare module '*.svg' { const src: string; export default src; }

declare module 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js' {
  const factory: (canvas: HTMLCanvasElement, opts?: Record<string, unknown>) => any
  export default factory
}
