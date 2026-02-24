import React, { useState, useEffect } from 'react';
import { signInWithEmailLink, isSignInWithEmailLink, sendSignInLinkToEmail } from 'firebase/auth';
import { Send, CheckCircle, AlertCircle, Instagram, ExternalLink } from 'lucide-react';
import { auth } from '../firebase';


const Join = () => {
    const [formData, setFormData] = useState({
        name: '',
        admissionNumber: '',
        email: '',
        github: '',
        branch: '',
        year: '1st Year',
        college: 'Galgotias College of Engineering and Technology',
        domain: 'Full Stack Development',
        customDomain: '',
        linkedin: '',
        reason: ''
    });

    const [status, setStatus] = useState('idle'); // idle, submitting, success, error
    const [instagramVisited, setInstagramVisited] = useState(false);
    const [instagramFollowed, setInstagramFollowed] = useState(false);

    // Spam Protection State
    const [startTime] = useState(Date.now());
    const [botCheck, setBotCheck] = useState('');

    // Email Verification State
    const [verificationStatus, setVerificationStatus] = useState('idle'); // idle, sending, sent, verified
    const [verificationError, setVerificationError] = useState('');

    // Handle incoming email link
    useEffect(() => {
        if (isSignInWithEmailLink(auth, window.location.href)) {
            let email = window.localStorage.getItem('emailForSignIn');

            // If email is missing (e.g. user opened link on different device), prompt for it
            if (!email) {
                email = window.prompt('Please provide your email for confirmation');
            }

            if (email) {
                // Restore form data if available
                const savedData = window.localStorage.getItem('joinFormData');
                if (savedData) {
                    setFormData(JSON.parse(savedData));
                }

                signInWithEmailLink(auth, email, window.location.href)
                    .then((result) => {
                        // User is signed in
                        window.localStorage.removeItem('emailForSignIn');
                        window.localStorage.removeItem('joinFormData');
                        setVerificationStatus('verified');
                        // Update form email just in case
                        setFormData(prev => ({ ...prev, email: email }));
                    })
                    .catch((error) => {
                        console.error("Verification error:", error);
                        setVerificationError("Verification failed or link expired. Please try again.");
                    });
            }
        }
    }, []);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleVerifyEmail = async () => {
        if (!formData.email) {
            alert("Please enter an email address first.");
            return;
        }

        setVerificationStatus('sending');
        setVerificationError('');

        const actionCodeSettings = {
            // URL you want to redirect back to. The domain (www.example.com) for this
            // URL must be in the authorized domains list in the Firebase Console.
            url: window.location.href,
            handleCodeInApp: true,
        };

        try {
            // Save email and form data to persistence
            window.localStorage.setItem('emailForSignIn', formData.email);
            window.localStorage.setItem('joinFormData', JSON.stringify(formData));

            await sendSignInLinkToEmail(auth, formData.email, actionCodeSettings);
            setVerificationStatus('sent');
        } catch (error) {
            console.error("Error sending link:", error);
            setVerificationError(error.message);
            setVerificationStatus('idle');
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Spam Check 1: Honeypot (Bot Trap)
        if (botCheck) {
            console.log("Bot detected (honeypot)");
            return; // Silently fail
        }

        // Spam Check 2: Time-based (Speed Trap)
        // If submitted in less than 3 seconds
        if (Date.now() - startTime < 3000) {
            alert("Please take your time to fill out the form.");
            return;
        }

        const finalDomain = formData.domain === 'Others' ? formData.customDomain : formData.domain;

        if (!formData.name || !formData.email || !formData.admissionNumber || !formData.reason || !formData.branch || !formData.college) {
            alert("Please fill in all required fields.");
            return;
        }

        // Sanitize Inputs
        const sanitizedData = {
            ...formData,
            email: formData.email.trim().toLowerCase(),
            name: formData.name.trim(),
            admissionNumber: formData.admissionNumber.trim(),
            domain: finalDomain
        };

        setStatus('submitting');

        try {
            // 1. Backend Submission (Validation + DB + Email + Google Sheet)
            const response = await fetch('/api/apply', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(sanitizedData)
            });

            const result = await response.json();

            if (!response.ok) {
                // Handle duplicate specifically
                if (response.status === 409) {
                    alert("You have already submitted an application with this email address.");
                } else {
                    throw new Error(result.error || result.message || "Submission failed");
                }
                setStatus('error');
                return;
            }

            // 2. Success State
            setStatus('success');
            setFormData({
                name: '',
                admissionNumber: '',
                email: '',
                github: '',
                branch: '',
                year: '1st Year',
                college: 'Galgotias College of Engineering and Technology',
                domain: 'Full Stack Development',
                customDomain: '',
                linkedin: '',
                reason: ''
            });

        } catch (error) {
            console.error("Application Submission Error:", error);
            alert(`Application Failed: ${error.message}. Please try again or contact support.`);
            setStatus('error');
        }
    };

    return (
        <div className="container" style={{ padding: '8rem 0 4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>


            <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="animate-fade-in">
                <h1 className="text-accent" style={{ fontSize: '3rem', marginBottom: '1rem' }}>JOIN THE SQUAD</h1>
                <p style={{ color: 'var(--text-dim)', maxWidth: '500px' }}>
                    Ready to build the future? Fill out the form below to apply for membership.
                </p>
            </div>

            {status === 'success' ? (
                <div style={{
                    width: '100%',
                    maxWidth: '600px',
                    background: 'var(--bg-card)',
                    padding: '3rem',
                    borderRadius: '16px',
                    border: '1px solid var(--accent)',
                    textAlign: 'center'
                }} className="animate-fade-in">
                    <CheckCircle size={64} color="var(--accent)" style={{ margin: '0 auto 1.5rem' }} />
                    <h2 style={{ fontSize: '2rem', marginBottom: '1rem', color: '#fff' }}>Application Sent!</h2>
                    <p style={{ color: 'var(--text-dim)' }}>
                        We have received your application. Our team will review it and get back to you soon.
                    </p>
                    <button
                        onClick={() => setStatus('idle')}
                        style={{
                            marginTop: '2rem',
                            background: 'transparent',
                            border: '1px solid var(--border-dim)',
                            color: '#fff',
                            padding: '0.8rem 2rem',
                            borderRadius: '8px',
                            cursor: 'pointer'
                        }}>
                        Submit Another
                    </button>
                </div>
            ) : (
                <form onSubmit={handleSubmit} style={{
                    width: '100%',
                    maxWidth: '600px',
                    background: 'var(--bg-card)',
                    padding: '3rem',
                    borderRadius: '16px',
                    border: '1px solid var(--border-dim)'
                }} className="animate-fade-in form-glow">

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Full Name *</label>
                            <input
                                type="text"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="John Doe"
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Admission Number *</label>
                            <input
                                type="text"
                                name="admissionNumber"
                                value={formData.admissionNumber}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="123456"
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>College Email *</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="john@college.edu"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Branch *</label>
                            <input
                                type="text"
                                name="branch"
                                value={formData.branch}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="CSE / IT / ECE"
                                required
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Year *</label>
                            <select
                                name="year"
                                value={formData.year}
                                onChange={handleChange}
                                className="input-field"
                            >
                                <option>1st Year</option>
                                <option>2nd Year</option>
                                <option>3rd Year</option>
                                <option>4th Year</option>
                            </select>
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>College Name *</label>
                        <input
                            type="text"
                            name="college"
                            value={formData.college}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="University / College Name"
                            required
                        />
                    </div>

                    <div style={{ marginBottom: '1.5rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>GitHub Profile (Optional)</label>
                            <input
                                type="url"
                                name="github"
                                value={formData.github}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="https://github.com/username"
                            />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>LinkedIn Profile *</label>
                            <input
                                type="url"
                                name="linkedin"
                                value={formData.linkedin}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="https://linkedin.com/in/username"
                                required
                            />
                        </div>
                    </div>

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Domain Interest *</label>
                        <select
                            name="domain"
                            value={formData.domain}
                            onChange={handleChange}
                            className="input-field"
                        >
                            <option>Full Stack Development</option>
                            <option>AI / ML</option>
                            <option>Cybersecurity</option>
                            <option>Cloud / DevOps</option>
                            <option>UI / UX Design</option>
                            <option>Content & Marketing</option>
                            <option>Others</option>
                        </select>
                    </div>

                    {formData.domain === 'Others' && (
                        <div style={{ marginBottom: '1.5rem' }} className="animate-fade-in">
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Specify Domain *</label>
                            <input
                                type="text"
                                name="customDomain"
                                value={formData.customDomain}
                                onChange={handleChange}
                                className="input-field"
                                placeholder="E.g. Game Development, Blockchain, etc."
                                required
                            />
                        </div>
                    )}

                    <div style={{ marginBottom: '2rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>Why do you want to join? *</label>
                        <textarea
                            name="reason"
                            value={formData.reason}
                            onChange={handleChange}
                            className="input-field"
                            rows="4"
                            placeholder="Tell us about your passion..."
                            required
                        ></textarea>
                    </div>

                    <div style={{ marginBottom: '2rem', padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border-dim)' }}>
                        <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <Instagram color="#E1306C" size={20} /> Required Verification
                        </h3>
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                            To join the squad, you must follow us on Instagram <strong>@gcetloop</strong>.
                        </p>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <a
                                href="https://www.instagram.com/gcetloop"
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={() => setInstagramVisited(true)}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    gap: '0.5rem',
                                    padding: '0.8rem',
                                    background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                                    color: 'white',
                                    borderRadius: '8px',
                                    textDecoration: 'none',
                                    fontWeight: 'bold',
                                    fontSize: '0.9rem'
                                }}
                            >
                                <ExternalLink size={16} /> Visit @gcetloop on Instagram
                            </a>

                            <label style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.8rem',
                                cursor: instagramVisited ? 'pointer' : 'not-allowed',
                                opacity: instagramVisited ? 1 : 0.5,
                                transition: 'opacity 0.3s ease'
                            }}>
                                <input
                                    type="checkbox"
                                    checked={instagramFollowed}
                                    onChange={(e) => setInstagramFollowed(e.target.checked)}
                                    disabled={!instagramVisited}
                                    style={{ width: '18px', height: '18px', accentColor: 'var(--accent)' }}
                                />
                                <span style={{ color: '#fff', fontSize: '0.9rem' }}>
                                    I have successfully followed LOOP on Instagram.
                                </span>
                            </label>
                        </div>
                    </div>



                    <button
                        type="submit"
                        disabled={status === 'submitting' || !instagramFollowed}
                        className="submit-btn"
                        style={{
                            opacity: (status === 'submitting' || !instagramFollowed) ? 0.5 : 1,
                            cursor: (status === 'submitting' || !instagramFollowed) ? 'not-allowed' : 'pointer'
                        }}
                    >
                        {status === 'submitting' ? 'SENDING...' : 'SUBMIT APPLICATION'} <Send size={18} />
                    </button>

                    {/* Honeypot Field (Hidden) - Renamed to avoid autofill */}
                    <input
                        type="text"
                        name="fax_number_check"
                        value={botCheck}
                        onChange={(e) => setBotCheck(e.target.value)}
                        style={{ display: 'none', tabindex: '-1', autocomplete: 'off' }}
                    />

                    {status === 'error' && (
                        <p style={{ color: '#ff0055', marginTop: '1rem', textAlign: 'center', fontSize: '0.9rem' }}>
                            Something went wrong. Please try again.
                        </p>
                    )}

                </form>
            )}

            <style>{`
        .input-field {
          width: 100%;
          background: rgba(255,255,255,0.05);
          border: 1px solid var(--border-dim);
          padding: 1rem;
          border-radius: 8px;
          color: #fff;
          font-family: var(--font-main);
          outline: none;
          transition: all 0.3s ease;
        }
        .input-field:focus {
          border-color: var(--accent);
          background: rgba(0, 243, 255, 0.05);
        }

        .input-field option {
          background-color: var(--bg-card);
          color: #fff;
        }

        .submit-btn {
          width: 100%;
          background: var(--accent);
          color: #000;
          font-weight: bold;
          font-family: var(--font-display);
          padding: 1rem;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.5rem;
          transition: all 0.3s ease;
        }
        .submit-btn:hover {
          box-shadow: 0 0 20px rgba(0, 243, 255, 0.5);
          transform: translateY(-2px);
        }
      `}</style>
        </div>
    );
};

export default Join;
