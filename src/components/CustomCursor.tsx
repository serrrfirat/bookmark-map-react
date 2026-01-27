import { useEffect, useRef } from 'react';

export function CustomCursor() {
  const cursorRef = useRef<HTMLDivElement>(null);
  const cursorPos = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });

  useEffect(() => {
    const cursor = cursorRef.current;
    if (!cursor) return;

    const onMouseMove = (e: MouseEvent) => {
      targetPos.current = { x: e.clientX, y: e.clientY };
    };

    const onMouseEnter = () => {
      cursor.style.opacity = '1';
    };

    const onMouseLeave = () => {
      cursor.style.opacity = '0';
    };

    // Scale on hover
    const onHoverStart = () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(2)';
    };

    const onHoverEnd = () => {
      cursor.style.transform = 'translate(-50%, -50%) scale(1)';
    };

    // Lerp animation with editorial easing
    const lerp = (start: number, end: number, factor: number) => {
      return start + (end - start) * factor;
    };

    let animationId: number;
    const animate = () => {
      cursorPos.current.x = lerp(cursorPos.current.x, targetPos.current.x, 0.12);
      cursorPos.current.y = lerp(cursorPos.current.y, targetPos.current.y, 0.12);
      
      cursor.style.left = `${cursorPos.current.x}px`;
      cursor.style.top = `${cursorPos.current.y}px`;
      
      animationId = requestAnimationFrame(animate);
    };

    animate();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseenter', onMouseEnter);
    document.addEventListener('mouseleave', onMouseLeave);

    // Add hover listeners to interactive elements
    const addHoverListeners = () => {
      const interactiveElements = document.querySelectorAll('a, button, [data-cursor-hover]');
      interactiveElements.forEach(el => {
        el.addEventListener('mouseenter', onHoverStart);
        el.addEventListener('mouseleave', onHoverEnd);
      });
    };
    
    addHoverListeners();
    // Re-attach periodically for dynamic content
    const interval = setInterval(addHoverListeners, 2000);

    return () => {
      clearInterval(interval);
      cancelAnimationFrame(animationId);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseenter', onMouseEnter);
      document.removeEventListener('mouseleave', onMouseLeave);
      const interactiveElements = document.querySelectorAll('a, button, [data-cursor-hover]');
      interactiveElements.forEach(el => {
        el.removeEventListener('mouseenter', onHoverStart);
        el.removeEventListener('mouseleave', onHoverEnd);
      });
    };
  }, []);

  return (
    <div
      ref={cursorRef}
      className="fixed pointer-events-none z-[9999] w-6 h-6 rounded-full border-2 border-[#3d7068] bg-white/50 transition-transform duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] opacity-0 hidden md:block backdrop-blur-sm"
      style={{
        transform: 'translate(-50%, -50%) scale(1)',
      }}
    />
  );
}

export default CustomCursor;