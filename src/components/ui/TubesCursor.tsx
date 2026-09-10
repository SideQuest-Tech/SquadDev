import React, { useEffect, useRef } from 'react';

const TUBES_CDN = 'https://cdn.jsdelivr.net/npm/threejs-components@0.0.19/build/cursors/tubes1.min.js';

function randomColors(count: number): string[] {
  return Array.from({ length: count }, () =>
    '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0')
  );
}

/**
 * Full-page tubes cursor animation.
 * Click anywhere to randomize colors.
 * Used standalone: <TubesCursor />
 */
export default function TubesCursor(): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const appRef   = useRef<any>(null);

  useEffect(() => {
    // Delay init to ensure the canvas has final dimensions in the DOM
    const timer = setTimeout(() => {
      import(/* @vite-ignore */ TUBES_CDN)
        .then((mod: any) => {
          if (!canvasRef.current) return;
          appRef.current = mod.default(canvasRef.current, {
            tubes: {
              colors: ['#5e72e4', '#8965e0', '#f5365c'],
              lights: {
                intensity: 200,
                colors: ['#21d4fd', '#b721ff', '#f4d03f', '#11cdef'],
              },
            },
          });
        })
        .catch((err: unknown) => console.error('[TubesCursor] load failed:', err));
    }, 100);

    return () => {
      clearTimeout(timer);
      appRef.current?.dispose?.();
    };
  }, []);

  const handleClick = () => {
    if (!appRef.current) return;
    appRef.current.tubes.setColors(randomColors(3));
    appRef.current.tubes.setLightsColors(randomColors(4));
  };

  return (
    <div
      onClick={handleClick}
      className="h-screen w-screen bg-black overflow-hidden cursor-pointer"
    >
      <canvas ref={canvasRef} className="fixed inset-0 z-0" />
      <div className="relative h-full flex flex-col items-center justify-center gap-2.5 z-10">
        <h1 className="m-0 p-0 text-white text-[80px] font-bold uppercase leading-none select-none [text-shadow:0_0_20px_rgba(0,0,0,1)]">
          Tubes
        </h1>
        <h2 className="m-0 p-0 text-white text-[60px] font-medium uppercase leading-none select-none [text-shadow:0_0_20px_rgba(0,0,0,1)]">
          Cursor
        </h2>
        <p className="m-0 p-0 text-white text-xl leading-none select-none [text-shadow:0_0_20px_rgba(0,0,0,1)]">
          Click to change colors
        </p>
      </div>
    </div>
  );
}
