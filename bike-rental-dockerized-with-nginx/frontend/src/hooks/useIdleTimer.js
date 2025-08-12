import { useEffect, useRef } from "react";

export default function useIdleTimer(onIdle, timeout = 300000) { // default 5 min
  const timer = useRef(null);

  const resetTimer = () => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(onIdle, timeout);
  };

  useEffect(() => {
    const events = ["mousemove", "mousedown", "keydown", "touchstart", "scroll"];
    const handleEvent = () => resetTimer();

    events.forEach((event) => window.addEventListener(event, handleEvent));
    resetTimer();

    return () => {
      events.forEach((event) => window.removeEventListener(event, handleEvent));
      if (timer.current) clearTimeout(timer.current);
    };
  }, [onIdle, timeout]);
}