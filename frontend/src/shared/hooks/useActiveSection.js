import { useState, useEffect, useCallback, useRef } from 'react';

/**
 * Custom hook to detect the active section within a scroll container using
 * IntersectionObserver, scroll boundary fallback, and native scrollsnapchange enhancement,
 * with anti-conflict lock mechanism during manual navigation.
 *
 * @param {string[]} sectionIds - Array of section element IDs (e.g. ['hero', 'about', 'skills', 'projects', 'blog', 'contact'])
 * @param {React.RefObject} containerRef - React ref to the scroll container element (null for window)
 * @param {string} [activeTab] - Current active tab to re-bind observers when switching back to portfolio
 * @returns {{ activeSection: string, scrollToSection: (id: string) => void }}
 */
export function useActiveSection(sectionIds, containerRef, activeTab = 'about') {
  const [activeSection, setActiveSection] = useState(sectionIds[0] || 'hero');
  const isManualScrollingRef = useRef(false);
  const scrollLockTimerRef = useRef(null);
  const visibleRatiosRef = useRef(new Map());

  const scrollToSection = useCallback(
    (id) => {
      const target = document.getElementById(id);
      if (!target) {
        // Retry in case DOM element is still rendering during tab switch
        setTimeout(() => {
          const retryTarget = document.getElementById(id);
          if (retryTarget) {
            scrollToSection(id);
          }
        }, 100);
        return;
      }

      // 1. Immediately update active state for instant UI responsiveness
      setActiveSection(id);

      // 2. Lock observer/snap overrides during smooth scroll transition
      isManualScrollingRef.current = true;
      if (scrollLockTimerRef.current) {
        clearTimeout(scrollLockTimerRef.current);
      }

      const container = containerRef?.current;
      if (container) {
        // Temporarily disable scroll-snap to prevent intermediate sections
        // from halting the smooth scroll animation (caused by scroll-snap-stop: always)
        const originalSnapType = container.style.scrollSnapType;
        container.style.scrollSnapType = 'none';

        // Calculate exact target offset within container
        const containerRect = container.getBoundingClientRect();
        const targetRect = target.getBoundingClientRect();
        const targetTop = targetRect.top - containerRect.top + container.scrollTop;

        container.scrollTo({
          top: targetTop,
          behavior: 'smooth',
        });

        // 3. Re-enable scroll snap and release lock after smooth scroll settles
        scrollLockTimerRef.current = setTimeout(() => {
          if (container) {
            container.style.scrollSnapType = originalSnapType || '';
          }
          isManualScrollingRef.current = false;
        }, 850);
      } else {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start',
        });

        scrollLockTimerRef.current = setTimeout(() => {
          isManualScrollingRef.current = false;
        }, 850);
      }
    },
    [containerRef]
  );

  useEffect(() => {
    // If user is currently browsing another tab, don't bind to stale/missing DOM elements
    if (activeTab && activeTab !== 'about') return;

    let observer = null;
    let handleSnapChange = null;
    let handleContainerScroll = null;
    const retryTimers = [];

    const bindObservers = () => {
      const container = containerRef?.current || null;
      const elements = sectionIds
        .map((id) => document.getElementById(id))
        .filter(Boolean);

      if (elements.length === 0) return false;

      // 1. Cross-browser IntersectionObserver with center-band rootMargin
      observer = new IntersectionObserver(
        (entries) => {
          // If programmatic scroll is in progress, ignore observer updates
          if (isManualScrollingRef.current) return;

          // Maintain persistent ratio map across all sections
          entries.forEach((entry) => {
            if (entry.target?.id) {
              visibleRatiosRef.current.set(entry.target.id, entry.intersectionRatio);
            }
          });

          // Determine section with highest ratio among all tracked sections
          let highestId = null;
          let highestRatio = 0;

          sectionIds.forEach((id) => {
            const ratio = visibleRatiosRef.current.get(id) || 0;
            if (ratio > highestRatio) {
              highestRatio = ratio;
              highestId = id;
            }
          });

          if (highestId && highestRatio > 0.15) {
            setActiveSection(highestId);
          }
        },
        {
          root: container,
          // Symmetrical rootMargin focuses detection on the vertical center of the viewport
          rootMargin: '-30% 0px -30% 0px',
          threshold: [0, 0.15, 0.3, 0.5, 0.7, 0.9],
        }
      );

      elements.forEach((el) => observer.observe(el));

      // 2. Native scrollsnapchange support (Chromium 129+)
      if (container && 'onscrollsnapchange' in HTMLElement.prototype) {
        handleSnapChange = (e) => {
          if (isManualScrollingRef.current) return;
          const snappedEl = e.snapTargetBlock;
          if (snappedEl && sectionIds.includes(snappedEl.id)) {
            setActiveSection(snappedEl.id);
          }
        };
        container.addEventListener('scrollsnapchange', handleSnapChange, { passive: true });
      }

      // 3. Boundary edge scroll listener (Guarantees top 'hero' and bottom 'contact' detection)
      if (container) {
        let ticking = false;
        handleContainerScroll = () => {
          if (isManualScrollingRef.current) return;

          if (!ticking) {
            window.requestAnimationFrame(() => {
              if (isManualScrollingRef.current) {
                ticking = false;
                return;
              }

              const { scrollTop, scrollHeight, clientHeight } = container;

              // Top edge boundary
              if (scrollTop <= 60 && sectionIds.length > 0) {
                setActiveSection(sectionIds[0]);
              }
              // Bottom edge boundary (e.g. Follow Me / Contact section)
              else if (scrollTop + clientHeight >= scrollHeight - 60 && sectionIds.length > 0) {
                setActiveSection(sectionIds[sectionIds.length - 1]);
              }

              ticking = false;
            });
            ticking = true;
          }
        };

        container.addEventListener('scroll', handleContainerScroll, { passive: true });
      }

      // Return true only if all expected sections are observed
      return elements.length === sectionIds.length;
    };

    // Staggered retries to ensure dynamically rendered sections (e.g. blog/contact) are bound
    const trySetup = (delay) => {
      const timer = setTimeout(() => {
        if (observer) observer.disconnect();
        const allBound = bindObservers();
        if (!allBound && delay < 600) {
          trySetup(delay + 150);
        }
      }, delay);
      retryTimers.push(timer);
    };

    if (!bindObservers()) {
      trySetup(80);
    }

    return () => {
      retryTimers.forEach(clearTimeout);
      if (scrollLockTimerRef.current) clearTimeout(scrollLockTimerRef.current);
      if (observer) observer.disconnect();
      visibleRatiosRef.current.clear();

      const container = containerRef?.current || null;
      if (container) {
        if (handleSnapChange && 'onscrollsnapchange' in HTMLElement.prototype) {
          container.removeEventListener('scrollsnapchange', handleSnapChange);
        }
        if (handleContainerScroll) {
          container.removeEventListener('scroll', handleContainerScroll);
        }
      }
    };
  }, [sectionIds, containerRef, activeTab]);

  return { activeSection, scrollToSection };
}

export default useActiveSection;
