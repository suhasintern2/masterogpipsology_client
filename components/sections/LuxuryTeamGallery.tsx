'use client';
import React, { useState, useRef } from 'react';
import Image from 'next/image';
import {
  motion,
  AnimatePresence,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion';
import { TEAM_MEMBERS, GALLERY_MOMENTS, type TeamMember } from '@/lib/content';

export function LuxuryTeamGallery(): React.ReactElement {
  const [activeTab, setActiveTab] = useState<'faculty' | 'moments'>('faculty');
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const sliderRef = useRef<HTMLDivElement>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  const updateScrollProgress = () => {
    if (!sliderRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current;
    const total = scrollWidth - clientWidth;
    setScrollProgress(total > 0 ? scrollLeft / total : 0);
  };

  const scrollByAmount = (amount: number) => {
    if (sliderRef.current) {
      sliderRef.current.scrollBy({ left: amount, behavior: 'smooth' });
    }
  };

  return (
    <div
      id="team"
      className="relative w-full bg-[#08080A] text-[#F3ECE0] overflow-hidden"
      style={{
        // Zero gap with Burj Khalifa basement above
        marginTop: '-2px',
        paddingTop: '20px',
      }}
    >
      {/* Deep atmospheric gold & obsidian ambient light */}
      <div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `
            radial-gradient(ellipse 75% 35% at 50% 0%, rgba(212,175,55,0.09) 0%, transparent 65%),
            radial-gradient(circle 600px at 15% 40%, rgba(185,140,55,0.05) 0%, transparent 65%),
            radial-gradient(circle 700px at 85% 60%, rgba(212,175,55,0.04) 0%, transparent 70%)
          `,
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-12 lg:px-16 pt-12 pb-28 relative z-10">
        {/* Section Header */}
        <div className="flex flex-col items-center text-center mb-14">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6 }}
            className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full border text-xs font-body font-medium tracking-widest uppercase mb-4"
            style={{
              borderColor: 'rgba(212,175,55,0.4)',
              backgroundColor: 'rgba(212,175,55,0.08)',
              color: '#E8CA65',
              boxShadow: '0 0 20px rgba(212,175,55,0.15)',
            }}
          >
            <span className="w-2 h-2 rounded-full bg-[#E8CA65] animate-pulse" />
            The Institutional Faculty
          </motion.div>

          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="display font-medium leading-[1.08] tracking-tight max-w-3xl mb-4"
            style={{ fontSize: 'clamp(2.4rem, 5vw, 4.2rem)', color: '#FAF6F0' }}
          >
            Architects of the framework.<br />
            <span className="italic bg-gradient-to-r from-[#F5E5C9] via-[#E2BE68] to-[#FAF1DE] bg-clip-text text-transparent">
              Mentors in live execution.
            </span>
          </motion.h2>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-base sm:text-lg text-[#AEA699] font-body max-w-xl leading-relaxed mb-8"
          >
            Tactile 3D interactive dossier. Every mentor actively manages institutional capital and audits your live trades directly.
          </motion.p>

          {/* Mode Switcher Tabs & Slider Controls */}
          <div className="flex flex-wrap items-center justify-between w-full max-w-4xl gap-4 pt-4 border-t border-white/[0.08]">
            <div className="flex items-center p-1 rounded-xl bg-white/[0.04] border border-white/[0.08]">
              <button
                onClick={() => setActiveTab('faculty')}
                className={`px-4 py-2 rounded-lg text-xs font-body font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'faculty'
                    ? 'bg-[#D4AF37]/25 text-[#FAF1DE] border border-[#D4AF37]/60 shadow-[0_0_18px_rgba(212,175,55,0.25)]'
                    : 'text-[#A0988E] hover:text-[#E8E0D5]'
                }`}
              >
                <span>Faculty Leadership</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 border border-white/10 font-mono">
                  {TEAM_MEMBERS.length}
                </span>
              </button>
              <button
                onClick={() => setActiveTab('moments')}
                className={`px-4 py-2 rounded-lg text-xs font-body font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === 'moments'
                    ? 'bg-[#D4AF37]/25 text-[#FAF1DE] border border-[#D4AF37]/60 shadow-[0_0_18px_rgba(212,175,55,0.25)]'
                    : 'text-[#A0988E] hover:text-[#E8E0D5]'
                }`}
              >
                <span>Trading Floor & Moments</span>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-black/40 border border-white/10 font-mono">
                  {GALLERY_MOMENTS.length}
                </span>
              </button>
            </div>

            {/* Slider Arrows & Status */}
            {activeTab === 'faculty' && (
              <div className="flex items-center gap-3">
                <span className="hidden sm:inline-block text-[11px] font-mono text-[#8C8477]">
                  Drag or scroll to explore
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => scrollByAmount(-400)}
                    aria-label="Scroll faculty left"
                    className="w-10 h-10 rounded-xl border border-white/[0.12] bg-white/[0.03] hover:bg-[#D4AF37]/15 hover:border-[#D4AF37]/50 flex items-center justify-center text-[#E5DDD0] transition-all duration-200 active:scale-95"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="15 18 9 12 15 6" />
                    </svg>
                  </button>
                  <button
                    onClick={() => scrollByAmount(400)}
                    aria-label="Scroll faculty right"
                    className="w-10 h-10 rounded-xl border border-white/[0.12] bg-white/[0.03] hover:bg-[#D4AF37]/15 hover:border-[#D4AF37]/50 flex items-center justify-center text-[#E5DDD0] transition-all duration-200 active:scale-95"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="9 18 15 12 9 6" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── PROFESSIONALLY CREATIVE 3D FACULTY MOVEMENT GALLERY ─── */}
        {activeTab === 'faculty' ? (
          <div className="relative">
            <div
              ref={sliderRef}
              onScroll={updateScrollProgress}
              className="flex gap-7 overflow-x-auto pt-6 pb-12 scrollbar-none cursor-grab active:cursor-grabbing select-none"
              style={{
                scrollbarWidth: 'none',
                perspective: '1400px',
                scrollSnapType: 'x mandatory',
              }}
            >
              {TEAM_MEMBERS.map((member, index) => (
                <CreativeFacultyCard
                  key={member.id}
                  member={member}
                  index={index}
                  onInspect={() => setSelectedMember(member)}
                />
              ))}
            </div>

            {/* Interactive Progress Bar */}
            <div className="mt-2 flex items-center justify-between gap-4">
              <div className="flex-1 h-1 bg-white/[0.08] rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-[#D4AF37] to-[#FAF1DE] rounded-full"
                  style={{ width: `${Math.max(15, scrollProgress * 100)}%` }}
                />
              </div>
              <span className="text-[11px] font-mono text-[#8C8477]">
                {TEAM_MEMBERS.length} Key Faculty Members
              </span>
            </div>
          </div>
        ) : (
          /* ─── TRADING FLOOR & MOMENTS MOSAIC GRID ─── */
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-5 pt-2">
            {GALLERY_MOMENTS.map((moment, i) => (
              <motion.div
                key={moment.id}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="group relative rounded-2xl overflow-hidden bg-[#121216] border border-white/[0.08] hover:border-[#D4AF37]/60 transition-all duration-500 hover:shadow-[0_12px_40px_rgba(0,0,0,0.6),0_0_25px_rgba(212,175,55,0.15)] cursor-pointer"
              >
                <div className="relative h-64 sm:h-72 w-full overflow-hidden">
                  <Image
                    src={moment.image}
                    alt={moment.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                    className="object-cover group-hover:scale-110 transition-transform duration-700 ease-out brightness-90 group-hover:brightness-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#08080A] via-[#08080A]/30 to-transparent opacity-90" />
                  <div className="absolute top-3 left-3">
                    <span className="px-2.5 py-1 rounded-md text-[10px] font-body tracking-wider uppercase bg-black/70 backdrop-blur-md text-[#EAD078] border border-[#D4AF37]/30">
                      {moment.tag}
                    </span>
                  </div>
                  <div className="absolute bottom-3.5 left-4 right-4">
                    <h4 className="font-display font-medium text-lg text-[#FBF8F3] mb-1 group-hover:text-[#F3E2B8] transition-colors">
                      {moment.title}
                    </h4>
                    <p className="text-xs text-[#A59D91] line-clamp-2 leading-relaxed">
                      {moment.subtitle}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* ─── DOSSIER INSPECTION MODAL ─── */}
      <AnimatePresence>
        {selectedMember && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/85 backdrop-blur-xl"
            onClick={() => setSelectedMember(null)}
          >
            <motion.div
              initial={{ scale: 0.92, opacity: 0, y: 25 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.92, opacity: 0, y: 25 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full max-w-3xl rounded-3xl bg-[#0F0F14] border border-[#D4AF37]/45 shadow-[0_25px_80px_rgba(0,0,0,0.85),0_0_50px_rgba(212,175,55,0.18)] overflow-hidden text-[#F5EFEB]"
            >
              {/* Top ambient gold accent */}
              <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-[#D4AF37] to-transparent" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedMember(null)}
                aria-label="Close dossier"
                className="absolute top-5 right-5 z-20 w-10 h-10 rounded-full bg-white/[0.08] border border-white/[0.14] hover:bg-[#D4AF37]/20 hover:border-[#D4AF37]/60 flex items-center justify-center text-[#FAF1DE] transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </button>

              <div className="grid grid-cols-1 md:grid-cols-12 max-h-[85vh] overflow-y-auto">
                <div className="relative md:col-span-5 h-72 md:h-full min-h-[340px] bg-[#0A0A0C]">
                  <Image
                    src={selectedMember.image}
                    alt={selectedMember.name}
                    fill
                    sizes="(max-width: 768px) 100vw, 360px"
                    className="object-cover object-top"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F14] md:bg-gradient-to-r md:from-transparent md:to-[#0F0F14] opacity-90" />
                </div>

                <div className="md:col-span-7 p-6 sm:p-8 flex flex-col justify-between">
                  <div>
                    <div className="inline-block px-3 py-1 rounded-full text-[10px] font-mono uppercase tracking-widest text-[#E8CA65] bg-[#D4AF37]/12 border border-[#D4AF37]/35 mb-3">
                      {selectedMember.pedigree}
                    </div>
                    <h3 className="display font-medium text-3xl sm:text-4xl text-[#FBF8F3] tracking-tight mb-1">
                      {selectedMember.name}
                    </h3>
                    <p className="text-sm font-body text-[#D4AF37] mb-5">
                      {selectedMember.role}
                    </p>

                    <p className="text-sm sm:text-base text-[#C2BBB0] font-body leading-relaxed mb-6">
                      {selectedMember.bio}
                    </p>

                    <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] relative mb-6">
                      <span className="display text-3xl text-[#D4AF37]/35 absolute top-2 left-3 leading-none">“</span>
                      <p className="text-xs sm:text-sm italic text-[#E5DDD0] pl-5 leading-relaxed">
                        {selectedMember.quote}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2 mb-4">
                      {selectedMember.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-2.5 py-1 rounded-lg text-xs font-body bg-white/[0.04] border border-white/[0.08] text-[#D8D0C2]"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-white/[0.08] flex items-center justify-between text-xs font-mono text-[#A59D91]">
                    <span>Focus: <strong className="text-[#FAF1DE]">{selectedMember.tags[0]}</strong></span>
                    <span>Discipline: <strong className="text-[#E8CA65]">{selectedMember.tags[1]}</strong></span>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── CREATIVE 3D GYROSCOPIC TILT FACULTY CARD ───
interface CreativeFacultyCardProps {
  member: TeamMember;
  index: number;
  onInspect: () => void;
}

function CreativeFacultyCard({ member, index, onInspect }: CreativeFacultyCardProps): React.ReactElement {
  const cardRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth springs for 3D tilt
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [10, -10]), { stiffness: 200, damping: 22 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-10, 10]), { stiffness: 200, damping: 22 });
  const glareOpacity = useSpring(useTransform(mouseX, [-0.5, 0, 0.5], [0.4, 0, 0.4]), { stiffness: 160, damping: 25 });
  const glareAngle = useTransform(mouseX, [-0.5, 0.5], ['40deg', '140deg']);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x);
    mouseY.set(y);
  };

  const handleMouseLeave = () => {
    mouseX.set(0);
    mouseY.set(0);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 70, rotateY: index % 2 === 0 ? -12 : 12, scale: 0.94 }}
      whileInView={{ opacity: 1, y: 0, rotateY: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.8, delay: index * 0.09, type: 'spring', damping: 24 }}
      style={{
        rotateX,
        rotateY,
        transformStyle: 'preserve-3d',
        scrollSnapAlign: 'start',
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      onClick={onInspect}
      className="flex-shrink-0 w-[310px] sm:w-[360px] md:w-[390px] rounded-3xl overflow-hidden bg-gradient-to-b from-[#181820] to-[#0D0D12] border border-white/[0.12] hover:border-[#D4AF37]/80 transition-all duration-500 group relative cursor-pointer shadow-[0_15px_40px_rgba(0,0,0,0.7)] hover:shadow-[0_25px_60px_rgba(0,0,0,0.85),0_0_35px_rgba(212,175,55,0.25)]"
    >
      {/* Specular Light Sheen Glare */}
      <motion.div
        aria-hidden="true"
        className="absolute inset-0 pointer-events-none z-30"
        style={{
          opacity: glareOpacity,
          background: `linear-gradient(${glareAngle}, transparent 25%, rgba(255,225,140,0.22) 50%, transparent 75%)`,
        }}
      />

      {/* Portrait Frame */}
      <div className="relative h-[390px] sm:h-[430px] w-full overflow-hidden bg-[#0A0A0C]">
        <Image
          src={member.image}
          alt={member.name}
          fill
          sizes="(max-width: 640px) 310px, (max-width: 768px) 360px, 390px"
          className="object-cover object-top filter brightness-[0.96] contrast-[1.04] group-hover:scale-108 group-hover:brightness-105 transition-transform duration-700 ease-out"
        />

        {/* Gradient vignette for text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0D0D12] via-[#0D0D12]/20 to-transparent opacity-95" />

        {/* Pedigree Pill Badge */}
        <div className="absolute top-4 left-4 z-20">
          <span className="px-3 py-1 rounded-full text-[11px] font-body font-medium tracking-wide uppercase bg-black/65 backdrop-blur-md text-[#EAD078] border border-[#D4AF37]/35 shadow-sm">
            {member.pedigree}
          </span>
        </div>

        {/* Floating Name & Title Inside Portrait */}
        <div className="absolute bottom-4 left-5 right-5 z-20">
          <div className="text-[11px] uppercase tracking-widest text-[#D4AF37] font-body font-semibold mb-1">
            {member.title}
          </div>
          <h3 className="display font-medium text-2xl sm:text-3xl text-[#FAF6F0] tracking-tight group-hover:text-[#F3E2B8] transition-colors">
            {member.name}
          </h3>
        </div>
      </div>

      {/* Card Base Details */}
      <div className="p-5 flex flex-col justify-between gap-4 border-t border-white/[0.07] bg-[#0E0E14]">
        <p className="text-xs sm:text-sm text-[#A8A196] font-body line-clamp-2 leading-relaxed">
          {member.bio}
        </p>

        <div className="flex items-center justify-between pt-2 border-t border-white/[0.06]">
          <span className="text-xs font-mono text-[#D8B45E]">
            {member.tags[0]}
          </span>
          <span className="text-xs font-body font-medium text-[#FAF1DE] group-hover:translate-x-1 transition-transform flex items-center gap-1.5">
            Dossier
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </span>
        </div>
      </div>
    </motion.div>
  );
}
