import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, MapPin, RefreshCw, ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import ThreeBackground from '../components/ThreeBackground';

const Events = () => {
  const [upcomingEvents, setUpcomingEvents] = useState([]);
  const [pastEvents, setPastEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, major: 0, minor: 0 });
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const scrollToPastEvents = () => {
    const section = document.getElementById('past-events');
    if (section) {
      section.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Redirect to details page if ?register=ID is present
  useEffect(() => {
    const eventIdToOpen = searchParams.get('register');
    if (eventIdToOpen) {
      navigate(`/events/${eventIdToOpen}`);
    }
  }, [searchParams, navigate]);

  useEffect(() => {
    const q = query(collection(db, "events"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const allEvents = snapshot.docs.map(doc => {
        const data = doc.data();
        let normalizedStatus = 'upcoming'; // Default

        if (data.status === 'Past') normalizedStatus = 'past';
        else if (['Live', 'Active', 'Ongoing'].includes(data.status)) normalizedStatus = 'live';

        const dateDisplay = data.date?.toDate ? data.date.toDate().toLocaleDateString() : data.date;

        return {
          id: doc.id,
          ...data,
          dateDisplay,
          normalizedStatus,
          type: normalizedStatus // Restoration for CSS classes
        };
      });

      // Split into two lists
      // Timeline includes both LIVE and UPCOMING
      const timelineEvents = allEvents.filter(e => e.normalizedStatus === 'live' || e.normalizedStatus === 'upcoming');
      const past = allEvents.filter(e => e.normalizedStatus === 'past');

      // Sort Timeline: LIVE first, then UPCOMING (both ascending by date)
      timelineEvents.sort((a, b) => {
        // Priority: Live < Upcoming
        const priority = { 'live': 1, 'upcoming': 2 };
        if (priority[a.normalizedStatus] !== priority[b.normalizedStatus]) {
          return priority[a.normalizedStatus] - priority[b.normalizedStatus];
        }
        // Secondary: Date Ascending
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateA - dateB;
      });

      // Sort Past: Most recent past date first
      past.sort((a, b) => {
        const dateA = a.date?.toDate ? a.date.toDate() : new Date(a.date);
        const dateB = b.date?.toDate ? b.date.toDate() : new Date(b.date);
        return dateB - dateA;
      });

      // Calculate Stats for Current Year
      const currentYear = new Date().getFullYear();
      const thisYearEvents = allEvents.filter(e => {
        const d = e.date?.toDate ? e.date.toDate() : new Date(e.date);
        return d.getFullYear() === currentYear;
      });

      setStats({
        total: thisYearEvents.length,
        major: thisYearEvents.filter(e => e.eventType === 'Major').length,
        minor: thisYearEvents.filter(e => !e.eventType || e.eventType === 'Minor').length
      });

      setUpcomingEvents(timelineEvents);
      setPastEvents(past);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getTypeColor = (eventType) => {
    return eventType === 'Major' ? '#ef4444' : '#facc15'; // Red for Major, Yellow for Minor
  };

  return (
    <div className="container" style={{ padding: '8rem 0 4rem' }}>
      {/* SEO & Structured Data */}
      <ThreeBackground variant="events" />
      <Helmet>
        <title>Upcoming Tech Events & Workshops | LOOP Tech Club</title>
        <meta name="description" content="Discover upcoming hackathons, coding workshops, and tech seminars at Galgotias College. Join LOOP, the premier tech club for developers and innovators." />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "ItemList",
            "itemListElement": upcomingEvents.map((event, index) => ({
              "@type": "ListItem",
              "position": index + 1,
              "item": {
                "@type": "Event",
                "name": event.title,
                "startDate": event.date?.toDate ? event.date.toDate().toISOString() : new Date(event.date).toISOString(),
                "endDate": event.date?.toDate ? new Date(event.date.toDate().getTime() + 7200000).toISOString() : new Date(new Date(event.date).getTime() + 7200000).toISOString(), // Approx 2 hours later
                "eventStatus": "https://schema.org/EventScheduled",
                "eventAttendanceMode": "https://schema.org/OfflineEventAttendanceMode",
                "location": {
                  "@type": "Place",
                  "name": "Galgotias College of Engineering and Technology",
                  "address": {
                    "@type": "PostalAddress",
                    "streetAddress": "1, Knowledge Park II",
                    "addressLocality": "Greater Noida",
                    "postalCode": "201310",
                    "addressRegion": "UP",
                    "addressCountry": "IN"
                  }
                },
                "image": [
                  "https://loop.vercel.app/logo.png"
                ],
                "description": event.description || "Join us for an exciting tech event at GCET."
              }
            }))
          })}
        </script>
      </Helmet>

      <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="animate-fade-in">
        <h1 className="text-accent" style={{ fontSize: '3rem', marginBottom: '1rem' }}>EVENTS TIMELINE</h1>
        <p style={{ color: 'var(--text-dim)', maxWidth: '600px', margin: '0 auto', marginBottom: '2rem' }}>
          Explore our schedule of <strong>hackathons, coding bootcamps, and tech talks</strong>.
          Stay ahead of the curve with LOOP's hands-on sessions designed for students.
        </p>



        {/* Past Events Button */}
        <button
          onClick={scrollToPastEvents}
          style={{
            background: 'transparent',
            border: '1px solid var(--border-dim)',
            color: 'var(--text-dim)',
            padding: '0.8rem 1.5rem',
            borderRadius: '50px',
            cursor: 'pointer',
            fontFamily: 'var(--font-mono)',
            transition: 'all 0.3s ease',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem'
          }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = 'var(--border-dim)'; e.currentTarget.style.color = 'var(--text-dim)'; }}
        >
          View Past Events <ArrowRight size={16} />
        </button>

        {loading && <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}><RefreshCw className="spin" /></div>}
      </div>

      <div className="timeline">
        {!loading && upcomingEvents.length === 0 && <p style={{ textAlign: 'center', color: '#71717a' }}>No upcoming events announced yet.</p>}

        {upcomingEvents.map((event, index) => (
          <div key={event.id} className={`timeline-item ${event.type} animate-fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="timeline-dot"></div>
            <div
              className="timeline-content cursor-pointer group"
              onClick={() => navigate(`/events/${event.id}`)}
              style={{
                borderColor: event.eventType === 'Major' ? 'rgba(239, 68, 68, 0.5)' : 'var(--border-dim)'
              }}
            >
              {/* Badges Container */}
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '20px',
                display: 'flex',
                gap: '0.5rem'
              }}>
                {/* Event Type Badge */}
                <div style={{
                  background: getTypeColor(event.eventType || 'Minor'),
                  color: '#000',
                  padding: '0.2rem 0.8rem',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {event.eventType || 'Minor'}
                </div>
                {/* Status Badge */}
                <div style={{
                  background: 'var(--accent)',
                  color: '#000',
                  padding: '0.2rem 0.8rem',
                  borderRadius: '12px',
                  fontSize: '0.7rem',
                  fontWeight: 'bold',
                  textTransform: 'uppercase'
                }}>
                  {event.status}
                </div>
              </div>

              <h2 style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>{event.title}</h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginTop: '1rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Calendar size={14} color="var(--accent)" /> {event.dateDisplay}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Clock size={14} color="var(--accent)" /> {event.location || 'TBD'}
                </div>
              </div>

              {/* View Details Link */}
              <div className="mt-4 flex items-center gap-2 text-[var(--accent)] text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                View Details <ArrowRight size={14} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* PAST EVENTS GRID */}
      {!loading && pastEvents.length > 0 && (
        <div id="past-events" style={{ marginTop: '6rem', paddingTop: '4rem', borderTop: '1px solid var(--border-dim)' }}>
          <h2 style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '3rem', color: 'var(--text-dim)' }}>PAST EVENTS</h2>

          {/* Stats Bar */}
          {!loading && (
            <div style={{
              display: 'flex',
              justifyContent: 'center',
              gap: '2rem',
              flexWrap: 'wrap',
              marginBottom: '4rem'
            }}>
              <div className="stat-card">
                <span className="stat-number">{stats.total}</span>
                <span className="stat-label">Total Events ({new Date().getFullYear()})</span>
              </div>
              <div className="stat-card" style={{ borderColor: '#ef4444' }}>
                <span className="stat-number" style={{ color: '#ef4444' }}>{stats.major}</span>
                <span className="stat-label">Major Events</span>
              </div>
              <div className="stat-card" style={{ borderColor: '#facc15' }}>
                <span className="stat-number" style={{ color: '#facc15' }}>{stats.minor}</span>
                <span className="stat-label">Minor Events</span>
              </div>
            </div>
          )}

          <div className="past-events-grid">
            {pastEvents.map((event, index) => (
              <div
                key={event.id}
                className="past-event-card cursor-pointer group"
                onClick={() => navigate(`/events/${event.id}`)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                  <span style={{
                    fontSize: '0.7rem',
                    background: '#333',
                    color: '#888',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '4px'
                  }}>
                    PAST
                  </span>
                  <div style={{
                    background: getTypeColor(event.eventType || 'Minor'),
                    color: '#000',
                    padding: '0.1rem 0.5rem',
                    borderRadius: '8px',
                    fontSize: '0.6rem',
                    fontWeight: 'bold',
                    textTransform: 'uppercase'
                  }}>
                    {event.eventType || 'Minor'}
                  </div>
                </div>

                <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem', color: '#ccc' }}>{event.title}</h3>

                <div style={{ fontSize: '0.85rem', color: 'var(--text-dim)', display: 'flex', gap: '1rem' }}>
                  <span>{event.dateDisplay}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        .timeline {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
        }
        .timeline::before {
          content: '';
          position: absolute;
          top: 0;
          left: 50%;
          width: 2px;
          height: 100%;
          background: var(--border-dim);
          transform: translateX(-50%);
        }

        .timeline-item {
          display: flex;
          justify-content: flex-end; /* Default right alignment */
          padding-right: 50%;
          position: relative;
          margin-bottom: 3rem;
        }

        .timeline-item:nth-child(even) {
          justify-content: flex-start; /* Left alignment for even items */
          padding-right: 0;
          padding-left: 50%;
        }
        .timeline-item:nth-child(even) .timeline-content {
          text-align: left; /* Keep text left aligned inside card for readability */
        }
        .timeline-item:nth-child(even) .timeline-dot {
          left: -6px; /* Adjust dot for left items? No, dot is absolute to center line */
        }

        .timeline-dot {
          position: absolute;
          top: 20px;
          right: -6px;
          width: 14px;
          height: 14px;
          background: var(--bg-dark);
          border: 2px solid var(--accent);
          border-radius: 50%;
          z-index: 2;
          box-shadow: 0 0 10px var(--accent);
        }
        
        .timeline-item:nth-child(even) .timeline-dot {
          right: auto;
          left: -7px;
        }

        .stat-card {
            background: var(--bg-card);
            border: 1px solid var(--border-dim);
            padding: 1rem 2rem;
            borderRadius: 12px;
            display: flex;
            flex-direction: column;
            align-items: center;
            min-width: 120px;
        }
        .stat-number {
            font-size: 2rem;
            font-weight: bold;
            color: #fff;
        }
        .stat-label {
            font-size: 0.8rem;
            color: var(--text-dim);
            text-transform: uppercase;
            letter-spacing: 1px;
        }

        .timeline-content {
          background: var(--bg-card);
          border: 1px solid var(--border-dim);
          padding: 2rem;
          border-radius: 12px;
          width: 90%;
          position: relative;
          transition: all 0.3s ease;
        }

        .timeline-item.upcoming .timeline-content {
          border-color: rgba(0, 243, 255, 0.3);
        }
        .timeline-item.live .timeline-content {
          border-color: var(--accent);
          box-shadow: 0 0 15px rgba(0, 243, 255, 0.2);
        }
        .timeline-item:hover .timeline-content {
          transform: translateY(-5px);
          box-shadow: 0 10px 30px -10px rgba(0,0,0,0.5);
          border-color: var(--accent);
        }

        .register-btn {
          margin-top: 1.5rem;
          background: transparent;
          border: 1px solid var(--accent);
          color: var(--accent);
          padding: 0.6rem 1.5rem;
          border-radius: 50px;
          font-family: var(--font-mono);
          font-weight: bold;
          font-size: 0.9rem;
          cursor: pointer;
          transition: all 0.3s ease;
          display: inline-block;
        }
        .register-btn:hover {
          background: var(--accent);
          color: #000;
          box-shadow: 0 0 15px rgba(0, 243, 255, 0.4);
          transform: translateY(-2px);
        }

        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { 100% { transform: rotate(360deg); } }

        /* Past Events Grid */
        .past-events-grid {
            display: grid;
            grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
            gap: 2rem;
            max-width: 1000px;
            margin: 0 auto;
        }
        
        .past-event-card {
            background: var(--bg-card);
            border: 1px solid var(--border-dim);
            padding: 1.5rem;
            border-radius: 12px;
            transition: all 0.3s ease;
        }
        
        .past-event-card:hover {
            border-color: #666;
            transform: translateY(-3px);
        }

        /* Mobile Responsive */
        @media (max-width: 768px) {
          .timeline::before {
            left: 20px;
          }
          .timeline-item {
            padding-right: 0;
            padding-left: 50px;
            justify-content: flex-start;
          }
          .timeline-item:nth-child(even) {
            padding-left: 50px;
          }
          .timeline-dot, .timeline-item:nth-child(even) .timeline-dot {
            left: 14px;
            right: auto;
          }
          .timeline-content {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Events;
