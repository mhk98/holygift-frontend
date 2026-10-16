"use client";
import { useRef, useEffect, useCallback, Children } from "react";

interface Props {
  children: React.ReactNode;
  itemWidthClass: string;
  gap?: number;
  autoplay?: boolean;
  interval?: number;
  showArrows?: boolean;
}

export default function HorizontalCarousel({
  children,
  itemWidthClass,
  gap = 10,
  autoplay = true,
  interval = 6000,
  showArrows = false,
}: Props) {
  const trackRef      = useRef<HTMLDivElement>(null);
  const indexRef      = useRef(0);
  const timerRef      = useRef<ReturnType<typeof setInterval> | null>(null);
  const isDragging    = useRef(false);
  const dragStartX    = useRef(0);
  const dragStartSL   = useRef(0);   // scrollLeft at drag start
  const dragDist      = useRef(0);   // total horizontal distance moved
  const count         = Children.count(children);

  // ── auto-play timer ──────────────────────────────────────────────────────

  const scrollToIndex = useCallback((idx: number) => {
    const track = trackRef.current;
    if (!track) return;
    const item = track.children[idx] as HTMLElement | undefined;
    if (item) track.scrollTo({ left: item.offsetLeft, behavior: "smooth" });
    indexRef.current = idx;
  }, []);

  const goNext = useCallback(() => {
    const track = trackRef.current;
    if (!track) return;
    const next = indexRef.current + 1;
    if (track.scrollLeft >= track.scrollWidth - track.clientWidth - 1 || next >= count) {
      trackRef.current?.scrollTo({ left: 0, behavior: "smooth" });
      indexRef.current = 0;
    } else {
      scrollToIndex(next);
    }
  }, [count, scrollToIndex]);

  const goPrev = useCallback(() => {
    const prev = indexRef.current - 1;
    scrollToIndex(prev < 0 ? count - 1 : prev);
  }, [count, scrollToIndex]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) { clearInterval(timerRef.current); timerRef.current = null; }
  }, []);

  const startTimer = useCallback(() => {
    stopTimer();
    if (!autoplay) return;
    timerRef.current = setInterval(goNext, interval);
  }, [autoplay, goNext, interval, stopTimer]);

  // Keep indexRef in sync with manual scroll / snap
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onScroll = () => {
      const sl = track.scrollLeft;
      let closest = 0, minDiff = Infinity;
      Array.from(track.children).forEach((el, i) => {
        const diff = Math.abs((el as HTMLElement).offsetLeft - sl);
        if (diff < minDiff) { minDiff = diff; closest = i; }
      });
      indexRef.current = closest;
    };
    track.addEventListener("scroll", onScroll, { passive: true });
    return () => track.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => { startTimer(); return stopTimer; }, [startTimer, stopTimer]);

  // ── pointer drag ─────────────────────────────────────────────────────────

  const onPointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target.closest("button, a, input, [role='button']")) return;
    const track = trackRef.current;
    if (!track) return;
    isDragging.current  = true;
    dragStartX.current  = e.clientX;
    dragStartSL.current = track.scrollLeft;
    dragDist.current    = 0;
    track.setPointerCapture(e.pointerId);
    track.style.cursor        = "grabbing";
    track.style.scrollBehavior = "auto";   // instant during drag
    stopTimer();
  }, [stopTimer]);

  const onPointerMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    const track = trackRef.current;
    if (!track) return;
    const dx = e.clientX - dragStartX.current;
    dragDist.current   = Math.abs(dx);
    track.scrollLeft   = dragStartSL.current - dx;
  }, []);

  const onPointerUp = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const track = trackRef.current;
    if (!track) return;
    track.releasePointerCapture(e.pointerId);
    track.style.cursor        = "grab";
    track.style.scrollBehavior = "smooth";

    // Snap to nearest item after releasing
    const sl = track.scrollLeft;
    let closest = 0, minDiff = Infinity;
    Array.from(track.children).forEach((el, i) => {
      const diff = Math.abs((el as HTMLElement).offsetLeft - sl);
      if (diff < minDiff) { minDiff = diff; closest = i; }
    });
    scrollToIndex(closest);
    startTimer();
  }, [scrollToIndex, startTimer]);

  // Prevent click-through after a drag (e.g. don't navigate on ProductCard)
  const onClickCapture = useCallback((e: React.MouseEvent) => {
    if (dragDist.current > 5) {
      e.preventDefault();
      e.stopPropagation();
    }
  }, []);

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div className="relative overflow-hidden">
      <div
        ref={trackRef}
        className="flex overflow-x-auto scrollbar-hide select-none"
        style={{ gap, scrollBehavior: "smooth", cursor: "grab" }}
        onPointerEnter={stopTimer}
        onPointerLeave={() => { if (!isDragging.current) startTimer(); }}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onClickCapture={onClickCapture}
        onDragStart={(e) => e.preventDefault()}
      >
        {Children.map(children, (child, i) => (
          <div key={i} className={`flex-none ${itemWidthClass}`}>
            {child}
          </div>
        ))}
      </div>

      {showArrows && (
        <>
          <button
            onClick={() => { stopTimer(); goPrev(); startTimer(); }}
            aria-label="Previous"
            style={{
              position: "absolute", left: 4, top: "40%", transform: "translateY(-50%)",
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: "rgba(0,0,0,0.35)", color: "#fff", fontSize: 22,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", zIndex: 10,
            }}
          >‹</button>
          <button
            onClick={() => { stopTimer(); goNext(); startTimer(); }}
            aria-label="Next"
            style={{
              position: "absolute", right: 4, top: "40%", transform: "translateY(-50%)",
              width: 32, height: 32, borderRadius: "50%", border: "none",
              background: "rgba(0,0,0,0.35)", color: "#fff", fontSize: 22,
              cursor: "pointer", display: "flex", alignItems: "center",
              justifyContent: "center", zIndex: 10,
            }}
          >›</button>
        </>
      )}
    </div>
  );
}
