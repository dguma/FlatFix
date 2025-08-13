import React, { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE } from '../config';
import './Home.css';

const Home: React.FC = () => {
  const { user } = useAuth();
  const [onlineTechs, setOnlineTechs] = useState<number | null>(null);

  const fetchCount = async () => {
    try {
      const res = await fetch(`${API_BASE || ''}/api/profile/technicians/online-count`);
      if (res.ok) {
        const data = await res.json();
        setOnlineTechs(data.onlineTechnicians);
      }
    } catch {}
  };

  useEffect(() => {
    let cancelled = false;
    const wrapped = async () => { if (!cancelled) await fetchCount(); };
    wrapped();
    const id = setInterval(wrapped, 15000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  // When user's availability changes (technician toggles) refresh count quickly
  useEffect(() => {
    fetchCount();
  }, [user?.isAvailable]);

  const PIXABAY = 'https://cdn.pixabay.com/photo/2015/05/31/12/08/reparing-791413_1280.jpg';
  const UNSPLASH_FALLBACK = 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=1920&q=60';
  const [heroSrc, setHeroSrc] = useState<string>(PIXABAY);

  // Service data for dynamic rendering & filtering (removed 'roadside' category from grid)
  type ServiceItem = { id:string; icon:string; title:string; desc:string; price:string; category: 'tire' | 'access' | 'power' | 'fuel' };
  const services: ServiceItem[] = useMemo(() => ([
    { id:'air', icon:'💨', title:'Air Inflation', desc:'Low pressure? We inflate & inspect your tire health.', price:'$20 Base', category:'tire' },
    { id:'spare', icon:'🔧', title:'Spare Tire Replace', desc:'Swap to your spare, torque, inflate & safety check.', price:'$20 + $15', category:'tire' },
    { id:'shop', icon:'🏪', title:'Shop Coordination', desc:'Wheel removal, mounting logistics & reinstall.', price:'Base + Labor + Distance', category:'tire' },
    { id:'lockout', icon:'🔑', title:'Lockout', desc:'Non-destructive entry to get you moving again.', price:'$20 + Service', category:'access' },
    { id:'jump', icon:'⚡', title:'Jumpstart', desc:'Battery recovery—up to 3 jumps capped.', price:'Cap: $45', category:'power' },
    { id:'fuel', icon:'⛽', title:'Fuel Delivery', desc:'Emergency fuel (≤2 gal) to reach a station.', price:'$20 + $10/gal', category:'fuel' }
  ]), []);

  const [filter, setFilter] = useState<'all' | ServiceItem['category']>('all');
  const filteredServices = useMemo(() => filter === 'all' ? services : services.filter(s => s.category === filter), [filter, services]);

  // Roadside assistance external providers (towing, winch, long-distance)
  interface Provider { id:string; name:string; url:string; tagline:string; services:string[]; coverage?:string; notes?:string }
  const roadsideProviders: Provider[] = useMemo(() => ([
    { id:'aaa', name:'AAA', url:'https://www.aaa.com/membership/', tagline:'Nationwide towing & roadside membership', services:['Towing','Battery','Fuel','Lockout'], coverage:'National US', notes:'Membership required' },
    { id:'urgent-ly', name:'Urgent.ly', url:'https://www.geturgently.com/', tagline:'On-demand towing marketplace', services:['Towing','Accident','Winch'], coverage:'Most Major Metros', notes:'Per-use pricing' },
    { id:'honkmobile', name:'HONK', url:'https://www.honkforhelp.com/', tagline:'Fast digital dispatch network', services:['Towing','Jumpstart','Lockout','Fuel'], coverage:'US & Canada (select)', notes:'No annual fees' },
    { id:'mach1', name:'Mach1 Services', url:'https://www.mach1services.com/', tagline:'App-based pay-per-use roadside help', services:['Towing','Tire','Fuel','Lockout'], coverage:'Expanding', notes:'App required' }
  ]), []);
  const [zip, setZip] = useState('');
  const [detectingZip, setDetectingZip] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  const detectZipViaGeolocation = async () => {
    setZipError(null);
    if (!navigator.geolocation) { setZipError('Geolocation not supported'); return; }
    setDetectingZip(true);
    try {
      const pos: GeolocationPosition = await new Promise((res, rej) => navigator.geolocation.getCurrentPosition(res, rej, { enableHighAccuracy:true, timeout:10000 }));
      const { latitude, longitude } = pos.coords;
      const resp = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}`, { headers:{ 'Accept':'application/json', 'User-Agent':'ZipFix.ai/1.0 (roadside-zip)' } });
      if (resp.ok) {
        const data = await resp.json();
        const pc = data?.address?.postcode || '';
        if (pc) setZip(pc); else setZipError('Zip not found, enter manually');
      } else setZipError('Lookup failed');
    } catch (e:any) { setZipError('Location denied or failed'); }
    finally { setDetectingZip(false); }
  };

  // Filter providers (placeholder logic could be extended for regional coverage)
  // Simple zip -> region mapping (stub). In future replace with real coverage logic.
  const zipRegion = (z:string): 'national' | 'metro' | 'other' => {
    if (!z) return 'other';
    if (/^(90|91|92|93)/.test(z)) return 'metro'; // west coast sample
    return 'national';
  };
  const visibleProviders = useMemo(() => {
    if (!zip) return roadsideProviders; // show all until zip entered
    const region = zipRegion(zip);
    // Example filter: if metro region, drop purely national membership marketing example
    return roadsideProviders.filter(p => {
      if (region === 'metro') return true; // keep all for now (placeholder)
      return true; // fallback retains all until real logic defined
    });
  }, [zip, roadsideProviders]);

  const handleZipSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Force re-evaluation (zip state already set via onChange) & scroll providers into view
    const grid = document.querySelector('.providers-grid');
    if (grid) grid.scrollIntoView({ behavior:'smooth', block:'start' });
  };

  // Intersection Observer for reveal items (initial: hero narrative) + lazy init for services
  useEffect(() => {
    const baseItems = Array.from(document.querySelectorAll('[data-reveal]:not(.service-card)')) as HTMLElement[];
    let serviceObserved = false;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
        } else if (entry.boundingClientRect.top > 0 && !entry.target.classList.contains('service-card')) {
          // Only remove the reveal state for non-service cards so service cards
          // remain visible after initial reveal (prevents disappearing on filter changes)
          entry.target.classList.remove('in');
        }
      });
    }, { threshold: 0.35 });
    baseItems.forEach(el => observer.observe(el));

    const attachServiceObserver = () => {
      if (serviceObserved) return;
      const serviceItems = Array.from(document.querySelectorAll('.service-card[data-reveal]')) as HTMLElement[];
      serviceItems.forEach(el => observer.observe(el));
      serviceObserved = true;
    };
    const onScroll = () => {
      if (window.scrollY > window.innerHeight * 0.35) {
        attachServiceObserver();
        window.removeEventListener('scroll', onScroll);
      }
    };
    window.addEventListener('scroll', onScroll, { passive:true });
    // Fallback: ensure attached after idle/timeout
    const timer = window.setTimeout(attachServiceObserver, 4000);
    return () => { window.removeEventListener('scroll', onScroll); clearTimeout(timer); observer.disconnect(); };
  }, []);

  // When the filter changes, ensure currently rendered service cards are visible.
  // Without this, newly filtered subsets may start hidden (opacity 0) until they re-intersect.
  useEffect(() => {
    const cards = document.querySelectorAll('.services-grid .service-card');
    cards.forEach(c => c.classList.add('in'));
  }, [filter]);

  return (
    <div className="home">
      <section className="hero" style={{ position:'relative', overflow:'hidden' }}>
        <img
          src={heroSrc}
          alt="roadside assistance"
          onError={() => setHeroSrc(UNSPLASH_FALLBACK)}
          loading="eager"
          decoding="async"
          style={{ position:'absolute', inset:0, width:'100%', height:'100%', objectFit:'cover', zIndex:0, objectPosition:'center', filter:'grayscale(5%) brightness(0.6)' }}
        />
        <div className="container hero-content">
          <h1 className="hero-title">
            <span className="accent">On‑Demand Roadside & Tire Relief</span><br />Fast. Transparent. Wherever You Are.
          </h1>
          <p className="hero-subtitle">
            ZipFix.ai gets you rolling again with mobile tire help, jumpstarts, lockouts, fuel delivery and shop coordination. Real technicians. Real-time availability. Upfront pricing—no surprises.
          </p>
          <ul className="hero-bullets">
            <li>24/7</li>
            <li>Live Availability</li>
            <li>No Membership</li>
            <li>Transparent Pricing</li>
            <li>Mobile Technicians</li>
            <li>Secure Payment</li>
          </ul>
          {onlineTechs !== null && (
            <div className="online-badge" aria-label={`Technicians online now: ${onlineTechs}`}>
              <span className="pulse" aria-hidden="true" />
              Technicians Online: {onlineTechs}
            </div>
          )}

          <div className="hero-actions">
            {!user && (
              <>
                <Link to="/register" className="btn btn-primary btn-large">
                  Get Started
                </Link>
                <Link to="/login" className="btn btn-outline btn-large">
                  Sign In
                </Link>
              </>
            )}
            {user && user.userType === 'customer' && (
              <>
                <Link to="/request-service" className="btn btn-primary btn-large">
                  Request Service
                </Link>
                <Link to="/customer-dashboard" className="btn btn-outline btn-large">
                  My Requests
                </Link>
              </>
            )}
            {user && user.userType === 'technician' && (
              <>
                <Link to="/technician-dashboard" className="btn btn-primary btn-large">
                  View Jobs
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Scroll Reveal Narrative Section */}
      <section className="reveal-wrapper" id="why-zipfix">
        <div className="container reveal-grid" data-reveal-parent>
          <div className="reveal-item" data-reveal>
            <h3>Real Technicians</h3>
            <p>Verified pros with the right equipment—not random gig guesses.</p>
          </div>
          <div className="reveal-item" data-reveal>
            <h3>Live Availability</h3>
            <p>See active technicians in real-time before you commit.</p>
          </div>
          <div className="reveal-item" data-reveal>
            <h3>Transparent Pricing</h3>
            <p>Upfront service pricing. No memberships. No surprise upsells.</p>
          </div>
          <div className="reveal-item" data-reveal>
            <h3>Smart Shop Coordination</h3>
            <p>We handle the logistics so you keep moving while tires get mounted.</p>
          </div>
          <div className="reveal-item" data-reveal>
            <h3>Roadside + More</h3>
            <p>Air, spares, fuel, jumpstarts, lockouts—all in one unified flow.</p>
          </div>
        </div>
      </section>

  <section className="services" id="services">
        <div className="container">
          <h2 className="services-title">Our Services<span className="services-accent" aria-hidden="true" /></h2>
          <p className="services-intro">Everything you need on the roadside in a unified, on‑demand flow. No memberships. Just request, confirm, and we roll.</p>

          <div className="service-filters" role="tablist" aria-label="Service Categories">
            {['all','tire','power','access','fuel'].map(cat => (
              <button
                key={cat}
                role="tab"
                aria-selected={filter===cat}
                className={"filter-pill" + (filter===cat ? ' active' : '')}
                onClick={() => setFilter(cat as any)}
              >{cat === 'all' ? 'All' : cat.charAt(0).toUpperCase()+cat.slice(1)}</button>
            ))}
          </div>

          <div className="services-grid" data-reveal-parent>
            {filteredServices.map(s => (
              <div key={s.id} className="service-card" data-reveal>
                <div className="service-icon ring" aria-hidden="true">{s.icon}</div>
                <h3>{s.title}</h3>
                <p className="desc">{s.desc}</p>
                <div className="price-badge">{s.price}</div>
                <div className="card-actions">
                  <Link to={user && user.userType === 'customer' ? '/request-service' : !user ? '/register' : '/login'} className="btn-mini primary" aria-label={`Request ${s.title}`}>Request</Link>
                </div>
              </div>
            ))}
          </div>
          <p className="pricing-footnote">Prices shown reflect service fees only. Any tire shop or fuel costs are passed through directly without markup.</p>
        </div>
      </section>

      {/* External Roadside Directory (Towing / Extended Services) - moved below core services */}
      <section className="roadside-dir" id="roadside-providers" data-reveal>
        <div className="container">
          <h2 className="roadside-title">Need Towing Or Heavy Roadside?</h2>
          <p className="roadside-intro">We focus on rapid mobile fixes. For towing, winch-outs, accident recovery or long-distance transport, connect with a trusted provider below. Enter your zip (or detect) to explore options. Links open in a new tab.</p>
          <form className="zip-form" onSubmit={handleZipSubmit}>
            <label htmlFor="zip" className="sr-only">ZIP Code</label>
            <input id="zip" name="zip" value={zip} onChange={e=>setZip(e.target.value.replace(/[^0-9]/g,''))} placeholder="ZIP" maxLength={10} inputMode="numeric" aria-label="Enter ZIP code to filter providers" />
            <button type="submit" className="zip-btn" aria-label="Apply ZIP filter">Search</button>
            <button type="button" onClick={detectZipViaGeolocation} disabled={detectingZip} className="zip-btn" aria-label="Detect ZIP automatically">{detectingZip ? 'Locating...' : 'Detect'}</button>
            {zipError && <span className="zip-error" role="alert">{zipError}</span>}
          </form>
          <div className="providers-grid">
            {visibleProviders.map(p => (
              <a key={p.id} href={p.url} target="_blank" rel="noopener noreferrer" className="provider-card">
                <div className="pc-head">
                  <h3>{p.name}</h3>
                  <span className="pc-badge">{p.coverage || 'Coverage Varies'}</span>
                </div>
                <p className="pc-tagline">{p.tagline}</p>
                <ul className="pc-services" aria-label="Services">
                  {p.services.map(svc => <li key={svc}>{svc}</li>)}
                </ul>
                {p.notes && <div className="pc-notes">{p.notes}</div>}
              </a>
            ))}
          </div>
        </div>
      </section>

      <section className="how-it-works" id="how-it-works" data-reveal>
        <div className="container hiw-inner">
          <div className="hiw-header">
            <h2 className="hiw-title">How It Works</h2>
            <p className="hiw-sub">Three simple steps from stress to rolling again. No call centers. No waiting on hold.</p>
          </div>
          <ol className="hiw-steps" data-reveal-parent>
            <li className="hiw-step" data-reveal>
              <div className="bubble">1</div>
              <h3>Request</h3>
              <p>Share your location & choose a service. See real technician availability instantly.</p>
            </li>
            <li className="hiw-step" data-reveal>
              <div className="bubble">2</div>
              <h3>Confirm</h3>
              <p>We notify nearby equipped techs. First qualified acceptance routes to you—track progress.</p>
            </li>
            <li className="hiw-step" data-reveal>
              <div className="bubble">3</div>
              <h3>Resolve</h3>
              <p>Service performed on-site. Transparent pricing. You’re back on the road—fast.</p>
            </li>
          </ol>
          <div className="hiw-cta">
            <Link to={!user ? '/register' : user.userType === 'customer' ? '/request-service' : '/technician-dashboard'} className="hiw-button" aria-label="Begin now">{!user ? 'Create Free Account' : user.userType === 'customer' ? 'Start A Request' : 'View Jobs'}</Link>
            <button type="button" className="hiw-secondary" onClick={()=> window.scrollTo({ top:0, behavior:'smooth'})}>Back To Top</button>
          </div>
        </div>
      </section>

      <footer className="site-footer" data-reveal>
        <div className="container footer-grid">
          <div className="footer-brand">
            <h3>ZipFix.ai</h3>
            <p>On‑demand mobile tire & roadside relief. Fast, transparent, technician powered.</p>
            <button className="to-top" onClick={()=>window.scrollTo({top:0, behavior:'smooth'})} aria-label="Scroll to top">↑ Top</button>
          </div>
          <nav className="footer-col" aria-label="Primary">
            <h4>Platform</h4>
            <ul>
              <li><a href="#services">Services</a></li>
              <li><a href="#why-zipfix">Why ZipFix</a></li>
              <li><a href="#how-it-works">How It Works</a></li>
              <li><a href="#roadside-providers">Roadside Directory</a></li>
            </ul>
          </nav>
          <nav className="footer-col" aria-label="Account">
            <h4>Account</h4>
            <ul>
              {!user && <li><Link to="/login">Sign In</Link></li>}
              {!user && <li><Link to="/register">Register</Link></li>}
              {user?.userType === 'customer' && <li><Link to="/request-service">Request Service</Link></li>}
              {user?.userType === 'technician' && <li><Link to="/technician-dashboard">Technician Dashboard</Link></li>}
              <li><Link to="/profile">Profile</Link></li>
            </ul>
          </nav>
          <div className="footer-col">
            <h4>Contact</h4>
            <ul>
              <li><a href="mailto:support@zipfix.ai">support@zipfix.ai</a></li>
              <li><a href="/terms">Terms</a></li>
              <li><a href="/privacy">Privacy</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-base">
          <p>© {new Date().getFullYear()} ZipFix.ai. All rights reserved.</p>
        </div>
      </footer>

      <button className="floating-top" aria-label="Scroll to top" onClick={()=>window.scrollTo({ top:0, behavior:'smooth'})}>↑</button>
    </div>
  );
};

export default Home;
