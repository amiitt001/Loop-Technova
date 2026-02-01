import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { Calendar, Clock, MapPin, RefreshCw, ArrowRight } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, onSnapshot } from 'firebase/firestore';
import ThreeBackground from '../components/ThreeBackground';

const Events = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

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
      const eventsList = snapshot.docs.map(doc => {
        const data = doc.data();
        let type = 'upcoming';
        if (data.status === 'Past') type = 'past';
        const dateDisplay = data.date?.toDate ? data.date.toDate().toLocaleDateString() : data.date;

        return {
          id: doc.id,
          ...data,
          dateDisplay,
          type
        };
      });

      eventsList.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'upcoming' ? -1 : 1;
        return new Date(b.date) - new Date(a.date);
      });

      setEvents(eventsList);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching events:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

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
            "itemListElement": events.map((event, index) => ({
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
                  "https://loop-technova.vercel.app/logo.png"
                ],
                "description": event.description || "Join us for an exciting tech event at GCET."
              }
            }))
          })}
        </script>
      </Helmet>

      <div style={{ textAlign: 'center', marginBottom: '4rem' }} className="animate-fade-in">
        <h1 className="text-accent" style={{ fontSize: '3rem', marginBottom: '1rem' }}>EVENTS TIMELINE</h1>
        <p style={{ color: 'var(--text-dim)', maxWidth: '600px', margin: '0 auto' }}>
          Explore our schedule of <strong>hackathons, coding bootcamps, and tech talks</strong>.
          Stay ahead of the curve with LOOP's hands-on sessions designed for students.
        </p>
        {loading && <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem' }}><RefreshCw className="spin" /></div>}
      </div>

      <div className="timeline">
        {!loading && events.length === 0 && <p style={{ textAlign: 'center', color: '#71717a' }}>No events announced yet.</p>}

        {events.map((event, index) => (
          <div key={event.id} className={`timeline-item ${event.type} animate-fade-in`} style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="timeline-dot"></div>
            <div
              className="timeline-content cursor-pointer group"
              onClick={() => navigate(`/events/${event.id}`)}
            >
              <div style={{
                position: 'absolute',
                top: '-10px',
                right: '20px',
                background: event.type === 'upcoming' ? 'var(--accent)' : '#333',
                color: event.type === 'upcoming' ? '#000' : '#888',
                padding: '0.2rem 0.8rem',
                borderRadius: '12px',
                fontSize: '0.7rem',
                fontWeight: 'bold',
                textTransform: 'uppercase'
              }}>
                {event.status || event.type}
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
