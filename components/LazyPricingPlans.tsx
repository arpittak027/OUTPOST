"use client";

import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const PricingPlans = dynamic(
  () => import("@/components/PricingPlans").then((module) => module.PricingPlans),
  {
    loading: () => (
      <div
        className="mx-auto h-96 max-w-5xl animate-pulse rounded-2xl border border-white/10 bg-white/5"
        aria-label="Loading pricing plans"
      />
    ),
  }
);

export function LazyPricingPlans() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(false);

  useEffect(() => {
    const element = sectionRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShouldLoad(true);
          observer.disconnect();
        }
      },
      { rootMargin: "400px" }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={sectionRef}>
      {shouldLoad ? (
        <PricingPlans />
      ) : (
        <div className="h-96" aria-label="Pricing plans load when needed" />
      )}
    </div>
  );
}
