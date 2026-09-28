// No hidden CSS state: without JS or observer support, everything stays visible.
const preference = matchMedia('(prefers-reduced-motion: reduce)');
const active = new Set<Animation>();
let observer: IntersectionObserver | undefined;
function animate(element: Element, frames: Keyframe[], options: KeyframeAnimationOptions) {
  if (preference.matches || !element.animate) return;
  const animation = element.animate(frames, options);
  active.add(animation);
  animation.finished.catch(() => {}).finally(() => active.delete(animation));
}
function stop() {
  observer?.disconnect();
  active.forEach((animation) => animation.cancel());
  active.clear();
}
try {
  if (!preference.matches && 'IntersectionObserver' in window) {
    const sections = Array.from(document.querySelectorAll('.countdown-section, .details-section, .dress-section, .gallery-section, .gifts-section, .rsvp-section'));
    const cards = Array.from(document.querySelectorAll('.countdown-item, .gallery-card'));
    observer = new IntersectionObserver((entries) => {
      try {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer?.unobserve(entry.target);
          if (entry.target.contains(document.activeElement)) continue;
          const index = sections.indexOf(entry.target);
          const isCard = index < 0;
          const target = isCard ? entry.target : entry.target.querySelector('.container');
          if (!target) continue;
          const transform = isCard || index % 3 === 0 ? 'translateY(8px)' : `translateX(${index % 3 === 1 ? -8 : 8}px)`;
          const order = isCard ? Array.from(entry.target.parentElement!.children).indexOf(entry.target) : 0;
          animate(target, [{ opacity: 0, transform }, { opacity: 1, transform: 'translate(0)' }], {
            duration: 560, delay: isCard ? Math.min(order, 3) * 65 : 0,
            easing: 'cubic-bezier(.2,.7,.3,1)', fill: 'backwards',
          });
          // One pulse after arrival, never a recurring timer.
          if (entry.target.matches('.countdown-item')) {
            const number = entry.target.querySelector('strong');
            if (number) animate(number, [{ transform: 'scale(1)' }, { transform: 'scale(1.025)' }, { transform: 'scale(1)' }],
              { duration: 1600, delay: 6500 + order * 120, easing: 'ease-in-out' });
          }
        }
      } catch { stop(); }
    }, { threshold: 0.08 });
    [...sections, ...cards].forEach((element) => observer!.observe(element));
  }
} catch { stop(); }
preference.addEventListener('change', (event) => { if (event.matches) stop(); });
document.addEventListener('focusin', () => {
  active.forEach((animation) => {
    const target = (animation.effect as KeyframeEffect | null)?.target;
    if (target instanceof Element && target.contains(document.activeElement)) animation.cancel();
  });
});
