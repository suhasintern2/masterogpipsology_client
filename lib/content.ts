// ─── Master of Pipsology — Content Source of Truth ───────────────────────────
// All copy, stats, and structured data lives here. Swap numbers and quotes
// for real client data before launch.

export interface NavLink {
  label: string;
  href: string;
}

export interface Stat {
  value: string;
  label: string;
}

export interface Market {
  id: string;
  heading: string;
  kicker: string;
  body: string;
  tags: string[];
}

export interface CurriculumChapter {
  number: string;
  title: string;
  description: string;
}

export interface Achievement {
  value: string;
  label: string;
}

export interface Testimonial {
  quote: string;
  name: string;
  role: string;
  cohort: string;
}

export interface FooterColumn {
  heading: string;
  links: { label: string; href: string }[];
}

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  title: string;
  pedigree: string;
  experience: string;
  metric: string;
  image: string;
  bio: string;
  quote: string;
  tags: string[];
}

export interface GalleryMoment {
  id: string;
  title: string;
  subtitle: string;
  image: string;
  tag: string;
}

// ─── Navigation ───────────────────────────────────────────────────────────────

export const NAV_LINKS: NavLink[] = [
  { label: 'Programme', href: '#curriculum' },
  { label: 'Markets', href: '#markets' },
  { label: 'Faculty', href: '#team' },
  { label: 'Results', href: '#gallery' },
];

export const CTA_PRIMARY = 'Join the next cohort';
export const CTA_SECONDARY = 'See the curriculum';

// ─── Hero ─────────────────────────────────────────────────────────────────────

export const COHORT_BADGE = 'Cohort 14 · Starts 6 January 2025';

export const HERO_HEADLINE_LINES = [
  'Trade with the edge',
  'the institutions use',
  'every day.',
];

export const HERO_SUBLINE =
  'Education before execution. A 12-week live programme covering risk architecture, market structure, order flow and execution psychology. Built for traders who are serious about consistency.';

export const HERO_STATS: Stat[] = [
  { value: '1,400+', label: 'Graduates' },
  { value: '78%', label: 'Retention after 6 months' },
  { value: '4.9 / 5', label: 'Average programme rating' },
];

export const TICKER_SYMBOLS = [
  { symbol: 'EUR/USD', change: '+0.12%', positive: true },
  { symbol: 'GBP/JPY', change: '-0.34%', positive: false },
  { symbol: 'XAU/USD', change: '+0.87%', positive: true },
  { symbol: 'BTC/USD', change: '+2.14%', positive: true },
  { symbol: 'S&P 500', change: '+0.51%', positive: true },
  { symbol: 'NAS 100', change: '+0.73%', positive: true },
  { symbol: 'ETH/USD', change: '-1.02%', positive: false },
  { symbol: 'USD/CAD', change: '+0.09%', positive: true },
];

// ─── Marquee ──────────────────────────────────────────────────────────────────

export const MARQUEE_ITEMS = [
  'Risk First',
  'Position Sizing',
  'Market Structure',
  'Order Flow',
  'Liquidity Analysis',
  'Trade Journaling',
  'Execution Psychology',
  'Drawdown Management',
  'Session Timing',
  'Multi-timeframe Analysis',
];

// ─── Markets ──────────────────────────────────────────────────────────────────

export const MARKETS: Market[] = [
  {
    id: 'forex',
    heading: 'Forex',
    kicker: 'The global reserve market',
    body: 'The foreign exchange market moves $7.5 trillion a day. We teach you where institutions place their orders, how to read displacement from manipulation, and how to position for high-probability reversals at key structural levels.',
    tags: ['Major pairs', 'London & NY sessions', 'Interbank flow'],
  },
  {
    id: 'equities',
    heading: 'Equities',
    kicker: 'Individual stocks and indices',
    body: 'From single-name momentum plays to index futures, equities demand a firm grasp of relative strength and earnings catalysts. Our module covers gap theory, volume spread analysis and the unique risk dynamics of leveraged equity instruments.',
    tags: ['US indices', 'Sector rotation', 'Earnings plays'],
  },
  {
    id: 'crypto',
    heading: 'Crypto',
    kicker: 'Digital assets with structural logic',
    body: 'Crypto markets run 24/7 and exhibit textbook liquidity patterns — often more cleanly than traditional markets. The programme applies the same market-structure principles to Bitcoin, Ethereum and major altcoins, with sessions on on-chain signals.',
    tags: ['Bitcoin & Ethereum', 'On-chain data', 'Futures basis'],
  },
];

// ─── Gallery / Achievements ────────────────────────────────────────────────────

export const ACHIEVEMENT_STATS: Stat[] = [
  { value: '1,400+', label: 'Graduates' },
  { value: '78%', label: '6-month retention' },
  { value: '14', label: 'Cohorts delivered' },
  { value: '97%', label: 'Would recommend' },
];

export const RESULTS_WALL_RECORDS = [
  { label: 'Cohort 12 avg monthly return', value: '+4.2%' },
  { label: 'Prop firm pass rate', value: '68%' },
  { label: 'Live accounts funded', value: '312' },
  { label: 'Lowest drawdown recorded', value: '−2.1%' },
];

export const CERTIFICATE_NAME = 'Master of Pipsology';
export const CERTIFICATE_SUBTITLE = 'Professional Trading Certification';
export const AUDIT_BODY = 'Verified by TradeAudit™';

// ─── Curriculum ───────────────────────────────────────────────────────────────

export const CURRICULUM_INTRO =
  'Twelve weeks of live sessions, structured as six modules. Each builds directly on the last — skip one and you feel it.';

export const CURRICULUM_CHAPTERS: CurriculumChapter[] = [
  {
    number: '01',
    title: 'Risk architecture',
    description:
      'Position sizing, R-multiples, maximum drawdown parameters and portfolio heat. You will not place a live trade until this is internalised.',
  },
  {
    number: '02',
    title: 'Market structure',
    description:
      'Breaks of structure, changes of character, premium and discount zones. How to read a chart before you read a price.',
  },
  {
    number: '03',
    title: 'Order flow and liquidity',
    description:
      'Where stops accumulate, how institutions engineer liquidity, displacement versus manipulation. The lens that makes everything else click.',
  },
  {
    number: '04',
    title: 'Entries and execution',
    description:
      'Model-based entry criteria, confirmation timeframes, limit versus market orders. Precision over volume.',
  },
  {
    number: '05',
    title: 'Trade management',
    description:
      'Partial closes, trailing stops, re-entry after a stop-out, and when to walk away. The psychology of an open position.',
  },
  {
    number: '06',
    title: 'Review and compounding',
    description:
      'Building a trade journal that compounds your edge, not your losses. Monthly review protocol and how to raise risk as account equity grows.',
  },
];

// ─── Testimonial ──────────────────────────────────────────────────────────────

export const TESTIMONIAL: Testimonial = {
  quote:
    'I had three losing months in a row before joining. By week four I understood why — I was chasing entries rather than waiting for structure. The programme does not give you a holy grail. It gives you a framework that makes the market legible.',
  name: 'Marcus Adeyemi',
  role: 'Full-time trader',
  cohort: 'Cohort 11',
};

// ─── Final CTA ────────────────────────────────────────────────────────────────

export const FINAL_CTA_HEADLINE = 'Cohort 14 starts 6 January.';
export const FINAL_CTA_SUBLINE =
  'Seats are capped at 40. Applications close 20 December.';

// ─── Footer ───────────────────────────────────────────────────────────────────

export const FOOTER_COLUMNS: FooterColumn[] = [
  {
    heading: 'Programme',
    links: [
      { label: 'Curriculum', href: '#curriculum' },
      { label: 'Faculty & Leadership', href: '#team' },
      { label: 'Results', href: '#gallery' },
      { label: 'Apply now', href: '#cta' },
    ],
  },
  {
    heading: 'Company',
    links: [
      { label: 'About us', href: '#footer' },
      { label: 'Instructors', href: '#footer' },
      { label: 'Press', href: '#footer' },
      { label: 'Contact', href: 'mailto:hello@masterofpipsology.com' },
    ],
  },
  {
    heading: 'Locations',
    links: [
      { label: 'London, UK', href: '#' },
      { label: 'Dubai, UAE', href: '#' },
      { label: 'Lagos, Nigeria', href: '#' },
      { label: 'Online (global)', href: '#' },
    ],
  },
];

export const RISK_DISCLAIMER =
  'Trading foreign exchange, equities and cryptocurrency involves substantial risk of loss and is not appropriate for all investors. Past performance is not indicative of future results. The programme is educational in nature and does not constitute financial advice. Always consult a qualified financial adviser before risking capital.';

export const BRAND_NAME = 'Master of Pipsology';
export const BRAND_TAGLINE = 'Trading education. No shortcuts.';

// ─── Team & Faculty ───────────────────────────────────────────────────────────

export const TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'member-1',
    name: 'Place for Name',
    role: 'Founder & Chief Market Strategist',
    title: 'Managing Principal',
    pedigree: 'Ex-Barclays Capital · FX Flow Desk',
    experience: '16+ Years',
    metric: '$480M+ Flow Executed',
    image: '/team/member-1.png',
    bio: 'Pioneered the institutional order flow framework taught across 14 cohorts. Former senior liquidity architect in London and Dubai.',
    quote: 'The market leaves footprint anomalies every second. Our discipline is learning how to read them without emotion.',
    tags: ['Order Flow', 'Macro Architecture', 'FX Liquidity'],
  },
  {
    id: 'member-2',
    name: 'Place for Name',
    role: 'Head of Quantitative Risk Architecture',
    title: 'Risk Director',
    pedigree: 'Ex-Citadel Securities · Algorithmic Risk',
    experience: '12+ Years',
    metric: '99.8% Variance Control',
    image: '/team/member-2.png',
    bio: 'Directs capital preservation mechanics, asymmetric R-multiple modeling, and downside convexity across student portfolios.',
    quote: 'Risk is not a secondary calculation after the entry. Risk is the entire trade.',
    tags: ['Portfolio Heat', 'Downside Convexity', 'R-Multiples'],
  },
  {
    id: 'member-3',
    name: 'Place for Name',
    role: 'Lead Index & Equities Execution',
    title: 'Senior Desk Mentor',
    pedigree: 'Chicago Board of Trade (CBOT) Veteran',
    experience: '14+ Years',
    metric: '18,000+ Hours Live Tape',
    image: '/team/member-3.png',
    bio: 'Specializes in session open auction dynamics, institutional volume profiles, and high-velocity index execution on Nasdaq and S&P.',
    quote: 'Tape reading is the language of participants who cannot hide their size.',
    tags: ['Index Auctions', 'Volume Profile', 'Session Timing'],
  },
  {
    id: 'member-4',
    name: 'Place for Name',
    role: 'Director of Market Structure',
    title: 'Senior Faculty',
    pedigree: 'Ex-Nomura FX Desk · Multi-Asset Strategist',
    experience: '11+ Years',
    metric: '1,200+ Student Audits',
    image: '/team/member-4.jpg',
    bio: 'Oversees multi-timeframe structural mapping, liquidity sweep identification, and institutional imbalance zones.',
    quote: 'Structure gives you context. Context prevents you from becoming exit liquidity.',
    tags: ['Market Structure', 'Liquidity Sweeps', 'Imbalances'],
  },
  {
    id: 'member-5',
    name: 'Place for Name',
    role: 'Head of Behavioral Performance',
    title: 'Trading Psychologist',
    pedigree: 'Performance Consultant to Tier-1 Prop Funds',
    experience: '15+ Years',
    metric: '92% Emotional Adherence',
    image: '/team/member-5.jpg',
    bio: 'Applies cognitive neuroscience and state-control protocols to eliminate revenge trading, hesitation, and over-leverage.',
    quote: 'You do not trade the market. You trade your nervous system’s reaction to ambiguity.',
    tags: ['State Control', 'Execution Psychology', 'Journal Audits'],
  },
  {
    id: 'member-6',
    name: 'Place for Name',
    role: 'Senior Proprietary Trader & Cohort Mentor',
    title: 'Execution Lead',
    pedigree: 'MOP Cohort 1 Graduate · Institutional Desk',
    experience: '9+ Years',
    metric: '14 Cohorts Mentored',
    image: '/team/member-6.jpg',
    bio: 'Walks students through live London and New York overlaps, real-time trade journaling, and post-session forensic reviews.',
    quote: 'Consistency is built in the forensic review of losing days, not winning streaks.',
    tags: ['Live Execution', 'Session Overlap', 'Forensic Review'],
  },
];

// ─── Desk & Cohort Moments ───────────────────────────────────────────────────

export const GALLERY_MOMENTS: GalleryMoment[] = [
  {
    id: 'moment-1',
    title: 'Cohort 12 Masterclass Dubai',
    subtitle: 'Live session tape reading at the Burj Plaza suite',
    image: '/team/member-7.jpg',
    tag: 'Live Seminar',
  },
  {
    id: 'moment-2',
    title: 'London Desk Intensive',
    subtitle: 'Institutional risk modeling and auction profile reviews',
    image: '/team/member-8.jpg',
    tag: 'Trading Floor',
  },
  {
    id: 'moment-3',
    title: 'Executive Trading Suite',
    subtitle: 'Multi-screen execution desks during US non-farm payrolls',
    image: '/team/member-9.jpg',
    tag: 'High Impact Session',
  },
  {
    id: 'moment-4',
    title: 'Annual Faculty Dinner',
    subtitle: 'Celebrating $120M+ in verified student funded payouts',
    image: '/team/member-10.jpg',
    tag: 'Community & Gala',
  },
  {
    id: 'moment-5',
    title: 'Institutional Flow Briefing',
    subtitle: 'Weekly proprietary market outlook and liquidity heatmaps',
    image: '/team/member-11.jpg',
    tag: 'Strategy Desk',
  },
  {
    id: 'moment-6',
    title: 'One-on-One Portfolio Defense',
    subtitle: 'Rigorous trade journal defense and risk parameter sign-off',
    image: '/team/member-12.jpg',
    tag: 'Cohort Mentorship',
  },
  {
    id: 'moment-7',
    title: 'Graduation & Awards Ceremony',
    subtitle: 'Induction of certified institutional risk architects',
    image: '/team/member-13.jpg',
    tag: 'Certification',
  },
  {
    id: 'moment-8',
    title: 'Private Desk Debrief',
    subtitle: 'Post-market forensic debrief with senior liquidity partners',
    image: '/team/member-14.jpg',
    tag: 'Private Room',
  },
];
