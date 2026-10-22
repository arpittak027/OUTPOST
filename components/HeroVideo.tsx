"use client";

import { useState } from "react";
import Image from "next/image";

export function HeroVideo() {
  const [play, setPlay] = useState(false);

  return (
    <div className="aspect-16/9.25 overflow-hidden rounded-2xl border border-white/12 bg-[#101117] shadow-2xl shadow-black/80 ring-1 ring-white/10">
      {play ? (
        <video
          autoPlay
          controls
          playsInline
          preload="metadata"
          className="size-full object-cover"
          poster="/videos/hero-poster.jpg"
        >
          <source src="/videos/hero.webm" type="video/webm" />
          <source src="/videos/hero.mp4" type="video/mp4" />
        </video>
      ) : (
        <button
          type="button"
          onClick={() => setPlay(true)}
          aria-label="Play the Outpost product walkthrough"
          className="group relative flex size-full items-center justify-center cursor-pointer"
        >
          <Image
            src="/videos/hero-poster.jpg"
            alt="Preview of the Outpost product walkthrough"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-black/20 transition-colors group-hover:bg-black/40" />
          <span className="relative z-10 flex items-center gap-2.5 rounded-full bg-black/75 px-6 py-3 text-sm font-semibold text-white ring-1 ring-white/20 backdrop-blur-md transition-all group-hover:scale-105 group-hover:bg-black/90 group-hover:ring-amber-500/50 shadow-2xl">
            <svg
              className="size-4 fill-amber-400 text-amber-400"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
            Play walkthrough
          </span>
        </button>
      )}
    </div>
  );
}
