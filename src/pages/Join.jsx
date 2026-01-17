import React, { useState } from 'react';
import { Send, CheckCircle, AlertCircle } from 'lucide-react';
import { normalizeError, ApiError } from '../utils/errorHandler';



const Join = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        github: '',
        branch: '',
        year: '1st Year',
        college: 'Galgotias College of Engineering and Technology',
        domain: 'Full Stack Development',
        reason: ''
    });
    const [status, setStatus] = useState('idle'); // idle, submitting, success, error

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name || !formData.email || !formData.reason || !formData.branch || !formData.college) {
            alert("Please fill in all required fields.");
            return;
        }



        setStatus('submitting');
        try {
            const response = await fetch('/api/apply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                // Throw structured error to be caught below
                throw new ApiError(data.error || "Submission failed", data.code);
            }

            setStatus('success');
            setFormData({
                name: '',
                email: '',
                github: '',
                branch: '',
                year: '1st Year',
                college: 'Galgotias College of Engineering and Technology',
                domain: 'Full Stack Development',
                reason: ''
            });
        } catch (error) {
            console.error("Submission Error:", error);
            const safeMessage = normalizeError(error);
            alert(safeMessage); // Or set to state if you have an error toast
            setStatus('error');
        }
    };

    return (
        <div className="container" style={{ padding: '8rem 0 4rem', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>

            <div style={{ textAlign: 'center', marginBottom: '3rem' }} className="animate-fade-in">
                <h1 className="text-neon-cyan" style={{ fontSize: '3rem', marginBottom: '1rem' }}>JOIN THE SQUAD</h1>
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
                    border: '1px solid var(--neon-cyan)',
                    textAlign: 'center'
                }} className="animate-fade-in">
                    <CheckCircle size={64} color="var(--neon-green)" style={{ margin: '0 auto 1.5rem' }} />
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

                    <div style={{ marginBottom: '1.5rem' }}>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--text-dim)', fontSize: '0.9rem' }}>GitHub Profile URL (Optional)</label>
                        <input
                            type="url"
                            name="github"
                            value={formData.github}
                            onChange={handleChange}
                            className="input-field"
                            placeholder="https://github.com/username"
                        />
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
                        </select>
                    </div>

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

                    <button type="submit" disabled={status === 'submitting'} className="submit-btn">
                        {status === 'submitting' ? 'SENDING...' : 'SUBMIT APPLICATION'} <Send size={18} />
                    </button>

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
          border-color: var(--neon-cyan);
          background: rgba(0, 243, 255, 0.05);
        }

        .input-field option {
          background-color: var(--bg-card);
          color: #fff;
        }

        .submit-btn {
          width: 100%;
          background: var(--neon-cyan);
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
