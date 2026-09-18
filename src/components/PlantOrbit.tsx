import { useLayoutEffect, useRef, useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { Check, CloudOff, Leaf, ShieldCheck, Sprout } from "lucide-react";
import { STOCK_IMAGES } from "../lib/images";

type Ring = "outer" | "inner";

interface AvatarItem {
  kind: "avatar";
  ring: Ring;
  angle: number;
  src: string;
}

interface PillItem {
  kind: "pill";
  ring: Ring;
  angle: number;
  icon: ReactNode;
  label: string;
}

interface CardItem {
  kind: "card";
  ring: Ring;
  angle: number;
  icon: ReactNode;
}

interface CheckItem {
  kind: "check";
  ring: Ring;
  angle: number;
}

type OrbitItem = AvatarItem | PillItem | CardItem | CheckItem;

const STAGE_W = 1000;
const STAGE_H = 410;
const CENTER = { x: 500, y: 517 };
const RADIUS: Record<Ring, number> = { outer: 410, inner: 337 };

function positionOnRing(ring: Ring, angle: number) {
  const rad = (angle * Math.PI) / 180;
  const r = RADIUS[ring];
  return {
    left: CENTER.x + r * Math.cos(rad),
    top: CENTER.y - r * Math.sin(rad),
  };
}

function arcPath(r: number) {
  const dy = CENTER.y - STAGE_H;
  const dx = Math.sqrt(r * r - dy * dy);
  return `M ${CENTER.x - dx} ${STAGE_H} A ${r} ${r} 0 0 1 ${CENTER.x + dx} ${STAGE_H}`;
}

const ITEMS: OrbitItem[] = [
  { kind: "avatar", ring: "outer", angle: 152, src: STOCK_IMAGES.diagnoseHero },
  { kind: "pill", ring: "outer", angle: 121, icon: <Leaf size={13} strokeWidth={2} />, label: "AI diagnosis" },
  { kind: "avatar", ring: "outer", angle: 90, src: STOCK_IMAGES.community },
  { kind: "pill", ring: "outer", angle: 59, icon: <CloudOff size={13} strokeWidth={2} />, label: "Works offline" },
  { kind: "avatar", ring: "outer", angle: 28, src: STOCK_IMAGES.growth },
  { kind: "pill", ring: "inner", angle: 142, icon: <ShieldCheck size={13} strokeWidth={2} />, label: "No account needed" },
  { kind: "avatar", ring: "inner", angle: 105, src: STOCK_IMAGES.careCalendar },
  { kind: "card", ring: "inner", angle: 68, icon: <Sprout size={20} strokeWidth={1.8} /> },
  { kind: "check", ring: "inner", angle: 35 },
];

function OrbitAvatar({ src }: { src: string }) {
  return (
    <div className="h-14 w-14 overflow-hidden rounded-full border border-neutral-200 bg-white p-0.5 shadow-sm">
      <img src={src} alt="" className="grayscale-photo h-full w-full rounded-full object-cover" />
    </div>
  );
}

function OrbitPill({ icon, label }: { icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5 whitespace-nowrap rounded-full border border-neutral-300 bg-white px-3 py-1.5 text-xs font-medium text-neutral-700 shadow-sm">
      <span className="flex shrink-0 text-black">{icon}</span>
      {label}
    </div>
  );
}

function OrbitCard({ icon }: { icon: ReactNode }) {
  return (
    <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-neutral-300 bg-neutral-50 text-black shadow-sm">
      {icon}
    </div>
  );
}

function OrbitCheck() {
  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-black text-white shadow-sm">
      <Check size={16} strokeWidth={2.5} />
    </div>
  );
}

function renderItem(item: OrbitItem) {
  switch (item.kind) {
    case "avatar":
      return <OrbitAvatar src={item.src} />;
    case "pill":
      return <OrbitPill icon={item.icon} label={item.label} />;
    case "card":
      return <OrbitCard icon={item.icon} />;
    case "check":
      return <OrbitCheck />;
  }
}

export function PlantOrbit() {
  const frameRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  useLayoutEffect(() => {
    const frame = frameRef.current;
    if (!frame) return;
    const measure = () => setScale(Math.min(1, Math.max(0.55, frame.clientWidth / STAGE_W)));
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(frame);
    return () => ro.disconnect();
  }, []);

  return (
    <div
      ref={frameRef}
      className="relative mx-auto w-full max-w-[1000px] overflow-hidden"
      style={{ height: STAGE_H * scale }}
    >
      <div
        className="absolute left-1/2 top-0"
        style={{
          width: STAGE_W,
          height: STAGE_H,
          transform: `translateX(-50%) scale(${scale})`,
          transformOrigin: "top center",
        }}
      >
        <svg
          className="pointer-events-none absolute inset-0"
          width={STAGE_W}
          height={STAGE_H}
          viewBox={`0 0 ${STAGE_W} ${STAGE_H}`}
          fill="none"
          style={{
            maskImage: "linear-gradient(to bottom, #000 62%, transparent 100%)",
            WebkitMaskImage: "linear-gradient(to bottom, #000 62%, transparent 100%)",
          }}
        >
          <motion.path
            d={arcPath(RADIUS.outer)}
            stroke="#e5e5e5"
            strokeWidth={2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.3, ease: "easeOut" }}
          />
          <motion.path
            d={arcPath(RADIUS.inner)}
            stroke="#d4d4d4"
            strokeWidth={2}
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: 1.3, ease: "easeOut", delay: 0.1 }}
          />
        </svg>

        {ITEMS.map((item, i) => (
          <motion.div
            key={i}
            className="absolute -translate-x-1/2 -translate-y-1/2"
            style={positionOnRing(item.ring, item.angle)}
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 + i * 0.07, ease: [0.22, 1, 0.36, 1] }}
          >
            <motion.div
              animate={{ y: [0, -5, 0] }}
              transition={{
                duration: 4 + (i % 4) * 0.5,
                repeat: Infinity,
                ease: "easeInOut",
                delay: (i * 0.4) % 2,
              }}
            >
              {renderItem(item)}
            </motion.div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
