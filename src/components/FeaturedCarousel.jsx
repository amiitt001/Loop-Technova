import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

/**
 * FeaturedCarousel
 * - Mobile-first horizontal swipe carousel for featured members (Leads/Heads)
 * - Circular/arc visual with center focus (scale + translate illusion)
 * - Uses Framer Motion for smooth transitions
 * - Tailwind-friendly classes; also includes inline styles for required transforms
 *
 * Props:
 * - members: array of { id, name, role, img, color }
 * - className: optional wrapper classes
 * - mobileOnly: boolean - if true, shows grid fallback on desktop
 */
const FeaturedCarousel = ({ members = [], className = '', mobileOnly = true }) => {
    const [active, setActive] = useState(0);
    const [isMobile, setIsMobile] = useState(false);
    const [reducedMotion, setReducedMotion] = useState(false);
    const startRef = useRef({ x: 0, y: 0, dragging: false });
    const trackRef = useRef(null);
    const scrollRaf = useRef(null);

    useEffect(() => {
        const mq = window.matchMedia('(max-width: 640px)');
        const onChange = (e) => setIsMobile(e.matches);
        setIsMobile(mq.matches);
        if (mq.addEventListener) mq.addEventListener('change', onChange);
        else mq.addListener(onChange);

        const rm = window.matchMedia('(prefers-reduced-motion: reduce)');
        const onRM = (e) => setReducedMotion(e.matches);
        setReducedMotion(rm.matches);
        if (rm.addEventListener) rm.addEventListener('change', onRM);
        else rm.addListener(onRM);

        return () => {
            if (mq.removeEventListener) mq.removeEventListener('change', onChange);
            else mq.removeListener(onChange);
            if (rm.removeEventListener) rm.removeEventListener('change', onRM);
            else rm.removeListener(onRM);
        };
    }, []);

    // Clamp active index
    useEffect(() => {
        if (active < 0) setActive(0);
        if (active > members.length - 1) setActive(Math.max(0, members.length - 1));
    }, [active, members.length]);

    // Set initial active: prefer first leadership (Head/Lead/President/etc), else center item
    useEffect(() => {
        if (!members || members.length === 0) return;
        const leadershipIdx = members.findIndex(m => /Head|President|Vice President|Lead/i.test(m.role || ''));
        if (leadershipIdx >= 0) {
            setActive(leadershipIdx);
            // center immediately
            setTimeout(() => scrollToActive(true), 0);
            return;
        }

        const center = Math.floor(members.length / 2);
        setActive(center);
        setTimeout(() => scrollToActive(true), 0);
    }, [members]);

    // Touch / swipe handlers that don't interfere with vertical scroll.
    const handleTouchStart = (e) => {
        const t = e.touches[0];
        startRef.current = { x: t.clientX, y: t.clientY, dragging: false };
    };

    const handleTouchMove = (e) => {
        if (!e.touches || e.touches.length === 0) return;
        const t = e.touches[0];
        const dx = t.clientX - startRef.current.x;
        const dy = t.clientY - startRef.current.y;

        // If horizontal movement is dominant, treat as carousel drag and prevent vertical capture.
        if (!startRef.current.dragging && Math.abs(dx) > 10 && Math.abs(dx) > Math.abs(dy)) {
            startRef.current.dragging = true;
        }

        if (startRef.current.dragging) {
            // prevent the page from snapping while we determine swipe
            e.stopPropagation();
            e.preventDefault();
        }
    };

    const handleTouchEnd = (e) => {
        const last = e.changedTouches ? e.changedTouches[0] : null;
        if (!last) return;
        const dx = last.clientX - startRef.current.x;
        const threshold = 40; // px swipe threshold
        if (Math.abs(dx) > threshold) {
            if (dx < 0) setActive((s) => Math.min(s + 1, members.length - 1));
            else setActive((s) => Math.max(s - 1, 0));
        }
        startRef.current.dragging = false;
    };

    // Low-end device heuristic: limit motion when prefers-reduced-motion or low CPU
    const lowEndDevice = typeof navigator !== 'undefined' && (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 2);
    const useReduced = reducedMotion || lowEndDevice;

    // Fallback: when not mobile or no members, render a compact grid
    if (!isMobile && mobileOnly) {
        return (
            <div className={`w-full ${className}`}>
                <div className="grid grid-cols-3 gap-4">
                    {members.slice(0, 6).map((m) => (
                        <div key={m.id} className="flex flex-col items-center p-3 bg-gray-900 rounded-lg border border-gray-800">
                            <div className="w-16 h-16 rounded-full overflow-hidden border-2" style={{ borderColor: m.color || 'var(--neon-cyan)' }}>
                                {m.img ? <img src={m.img} alt={m.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-lg font-bold text-white">{m.name.charAt(0)}</div>}
                            </div>
                            <div className="mt-2 text-sm font-semibold">{m.name}</div>
                            <div className="text-xs text-gray-400">{m.role}</div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Scroll the track to center the active card
    const scrollToActive = (instant = false) => {
        const track = trackRef.current;
        if (!track) return;
        const children = track.children;
        const card = children[active];
        if (!card) return;
        const cardCenter = card.offsetLeft + card.offsetWidth / 2;
        const target = Math.max(0, cardCenter - track.clientWidth / 2);
        try {
            track.scrollTo({ left: target, behavior: instant || useReduced ? 'auto' : 'smooth' });
        } catch (e) {
            track.scrollLeft = target;
        }
    };

    // Update active based on current scroll position (nearest card to center)
    const handleScroll = () => {
        const track = trackRef.current;
        if (!track) return;
        if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
        scrollRaf.current = requestAnimationFrame(() => {
            const children = Array.from(track.children);
            const center = track.scrollLeft + track.clientWidth / 2;
            let nearest = 0;
            let nearestDist = Infinity;
            children.forEach((c, idx) => {
                const cCenter = c.offsetLeft + c.clientWidth / 2;
                const d = Math.abs(cCenter - center);
                if (d < nearestDist) {
                    nearestDist = d;
                    nearest = idx;
                }
            });
            if (nearest !== active) setActive(nearest);
        });
    };

    useEffect(() => {
        // center active whenever it changes
        scrollToActive();
    }, [active]);

    useEffect(() => {
        return () => {
            if (scrollRaf.current) cancelAnimationFrame(scrollRaf.current);
        };
    }, []);

    // Carousel rendering (mobile / reduced-motion fallback)
    return (
        <div className={`w-full ${className}`} style={{ perspective: '900px' }}>
            <div
                className="relative w-full"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <div
                    className="relative flex gap-3 overflow-x-auto py-2 px-2 hide-scrollbar"
                    style={{
                        WebkitOverflowScrolling: 'touch'
                    }}
                    ref={trackRef}
                    onScroll={handleScroll}
                >
                    {members.map((m, i) => {
                        const offset = i - active;
                        // Limit visual influence to a small window to keep perf
                        const absOff = Math.abs(offset);

                        // Compute transform: horizontal spacing + subtle arc + scale for depth illusion
                        // Only use vertical translate + scale for depth illusion — horizontal positioning uses native scroll
                        const ty = -Math.max(0, 12 - absOff * 6); // lift center slightly
                        const scale = Math.max(0.76, 1 - absOff * 0.12);
                        const opacity = Math.max(0.4, 1 - absOff * 0.36);
                        const zIndex = 100 - absOff;

                        // If reduced motion or low-end, use simpler static transforms and less animation
                        const animateProps = useReduced ? { opacity } : { opacity, transform: `translateY(${ty}px) scale(${scale})` };

                        return (
                            <motion.div
                                key={m.id}
                                className="flex-shrink-0"
                                style={{
                                    minWidth: '150px',
                                    maxWidth: '170px',
                                    zIndex,
                                    willChange: 'transform, opacity',
                                    touchAction: 'pan-y'
                                }}
                                animate={animateProps}
                                transition={{ type: 'spring', stiffness: useReduced ? 120 : 220, damping: useReduced ? 20 : 28 }}
                                onClick={() => setActive(i)}
                            >
                                <div className="bg-[var(--bg-card)] border border-[var(--border-dim)] rounded-lg p-2 flex flex-col items-center">
                                    <div
                                        className="rounded-full overflow-hidden flex items-center justify-center"
                                        style={{
                                            width: 64,
                                            height: 64,
                                            border: `2px solid ${m.color || 'var(--neon-cyan)'}`
                                        }}
                                    >
                                        {m.img ? (
                                            <img src={m.img} alt={m.name} className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="text-lg font-bold">{m.name.charAt(0)}</div>
                                        )}
                                    </div>

                                    <div className="mt-2 text-sm font-semibold text-white text-center" style={{ fontSize: 13 }}>{m.name}</div>
                                    <div className="text-xs text-gray-400 text-center">{m.role}</div>
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
                {/* Indicators */}
                <div className="w-full flex justify-center mt-3 gap-2">
                    {members.map((_, i) => (
                        <button
                            key={i}
                            aria-label={`Go to ${i + 1}`}
                            onClick={() => setActive(i)}
                            className={`w-2 h-2 rounded-full ${i === active ? 'bg-white' : 'bg-gray-700'}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
};

export default FeaturedCarousel;
