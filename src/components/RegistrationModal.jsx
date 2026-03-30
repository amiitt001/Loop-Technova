import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Instagram, ExternalLink, User, Mail, Hash, Building2, Users } from 'lucide-react';
import { db } from '../firebase';
import { collection } from 'firebase/firestore';

const RegistrationModal = ({ event, onClose }) => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        enrollmentId: '',
        department: '',
        teamName: ''
    });
    const [errors, setErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [instagramVisited, setInstagramVisited] = useState(false);
    const [instagramFollowed, setInstagramFollowed] = useState(false);

    // Spam Protection State
    const [startTime] = useState(Date.now());
    const [honeypot, setHoneypot] = useState('');

    const validate = () => {
        const newErrors = {};
        if (!formData.name.trim()) newErrors.name = 'Full Name is required';
        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Invalid email format';
        }

        // Legacy Validation only if no custom questions
        if (!event.questions || event.questions.length === 0) {
            if (!formData.enrollmentId?.trim()) newErrors.enrollmentId = 'ID is required';
            if (!formData.department?.trim()) newErrors.department = 'Department is required';
        }
        // Dynamic Validation
        else {
            event.questions.forEach(q => {
                if (q.required) {
                    const val = formData[q.id];
                    if (!val || (Array.isArray(val) && val.length === 0)) {
                        newErrors[q.id] = 'This field is required';
                    }
                }
            });
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // Spam Check 1: Honeypot
        if (honeypot) {
            console.log("Bot detected (honeypot)");
            return;
        }

        // Spam Check 2: Time-based
        if (Date.now() - startTime < 3000) {
            alert("Please take your time to fill out the form.");
            return;
        }

        if (!validate()) return;

        setIsSubmitting(true);

        try {
            const registrationData = {
                eventId: event.id,
                eventTitle: event.title,
                name: formData.name,
                email: formData.email,
                // Server generates createdAt, no need to send it
                // Save legacy fields if they exist, else N/A
                enrollmentId: formData.enrollmentId || 'N/A',
                department: formData.department || 'N/A',
                teamName: formData.teamName || '',
                // Save dynamic responses properly
                responses: event.questions ? event.questions.map(q => ({
                    question: q.label,
                    answer: formData[q.id] || (q.type === 'checkbox' ? [] : '') // Ensure empty value
                })) : []
            };

            const response = await fetch('/api/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(registrationData)
            });

            const result = await response.json();

            if (!response.ok) {
                if (response.status === 409) {
                    alert(result.error || "You have already registered for this event with this email.");
                } else {
                    throw new Error(result.error || 'Registration failed');
                }
                setIsSubmitting(false);
                return;
            }

            setIsSubmitting(false);
            setIsSuccess(true);
        } catch (error) {
            console.error("Error registering: ", error);
            alert(error.message || "Registration failed. Please try again.");
            setIsSubmitting(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
        // Clear error when user types
        if (errors[e.target.name]) {
            setErrors({ ...errors, [e.target.name]: null });
        }
    };

    return (
        <AnimatePresence>
            {event && (
                <>
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        style={{
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            width: '100%',
                            height: '100%',
                            background: 'rgba(0, 0, 0, 0.8)',
                            backdropFilter: 'blur(5px)',
                            zIndex: 10000
                        }}
                    />
                    <motion.div
                        initial={{ x: '100%' }}
                        animate={{ x: 0 }}
                        exit={{ x: '100%' }}
                        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                        style={{
                            position: 'fixed',
                            top: 0,
                            right: 0,
                            width: '100%',
                            maxWidth: '500px',
                            height: '100%',
                            background: 'var(--bg-card)',
                            borderLeft: '1px solid var(--accent)',
                            zIndex: 10001,
                            padding: '2rem',
                            overflowY: 'auto',
                            boxShadow: '-10px 0 30px rgba(0, 243, 255, 0.1)'
                        }}
                    >
                        <button onClick={onClose} style={{
                            position: 'absolute',
                            top: '1.5rem',
                            right: '1.5rem',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-dim)',
                            cursor: 'pointer'
                        }}>
                            <X size={24} />
                        </button>

                        {!isSuccess ? (
                            <>
                                <h2 style={{ fontSize: '1.8rem', marginBottom: '0.5rem', color: '#fff' }}>Register for Event</h2>
                                <p style={{ color: 'var(--accent)', marginBottom: '2rem', fontSize: '1.1rem', fontWeight: 'bold' }}>
                                    {event.title}
                                </p>

                                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                                    <InputField
                                        label="Full Name"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        error={errors.name}
                                        placeholder="John Doe"
                                        icon={User}
                                    />
                                    <InputField
                                        label="Email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        error={errors.email}
                                        placeholder="john@example.com"
                                        icon={Mail}
                                    />

                                    {/* Dynamic Questions (if any) */}
                                    {event.questions && event.questions.length > 0 ? (
                                        event.questions.map((q) => {
                                            if (q.type === 'text') {
                                                return (
                                                    <InputField
                                                        key={q.id}
                                                        label={q.label}
                                                        name={q.id}
                                                        value={formData[q.id] || ''}
                                                        onChange={handleChange}
                                                        required={q.required}
                                                        placeholder="Your answer"
                                                    />
                                                );
                                            }
                                            if (q.type === 'radio') {
                                                return (
                                                    <div key={q.id} className="mb-4">
                                                        <label className="block mb-2 text-zinc-400 text-sm">{q.label}</label>
                                                        <div className="flex flex-col gap-2">
                                                            {q.options.map((opt, idx) => (
                                                                <label key={idx} className="flex items-center gap-2 cursor-pointer hover:text-main transition-colors">
                                                                    <input
                                                                        type="radio"
                                                                        name={q.id}
                                                                        value={opt}
                                                                        onChange={handleChange}
                                                                        checked={formData[q.id] === opt}
                                                                        className="accent-[var(--accent)]"
                                                                    />
                                                                    <span className="text-sm text-zinc-300">{opt}</span>
                                                                </label>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            if (q.type === 'checkbox') {
                                                return (
                                                    <div key={q.id} className="mb-4">
                                                        <label className="block mb-2 text-zinc-400 text-sm">{q.label}</label>
                                                        <div className="flex flex-col gap-2">
                                                            {q.options.map((opt, idx) => {
                                                                const checked = (formData[q.id] || []).includes(opt);
                                                                return (
                                                                    <label key={idx} className="flex items-center gap-2 cursor-pointer hover:text-main transition-colors">
                                                                        <input
                                                                            type="checkbox"
                                                                            name={q.id}
                                                                            value={opt}
                                                                            // Custom handler for checkbox array
                                                                            onChange={(e) => {
                                                                                const val = e.target.value;
                                                                                const current = formData[q.id] || [];
                                                                                const newVals = checked
                                                                                    ? current.filter(v => v !== val)
                                                                                    : [...current, val];
                                                                                setFormData(prev => ({ ...prev, [q.id]: newVals }));
                                                                            }}
                                                                            checked={checked}
                                                                            className="accent-[var(--accent)]"
                                                                        />
                                                                        <span className="text-sm text-zinc-300">{opt}</span>
                                                                    </label>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        })
                                    ) : (
                                        /* Default Static Fields if no dynamic questions */
                                        <>
                                            <InputField
                                                label="Enrollment ID"
                                                name="enrollmentId"
                                                value={formData.enrollmentId}
                                                onChange={handleChange}
                                                error={errors.enrollmentId}
                                                placeholder="123456"
                                                icon={Hash}
                                            />
                                            <InputField
                                                label="Department"
                                                name="department"
                                                value={formData.department}
                                                onChange={handleChange}
                                                error={errors.department}
                                                placeholder="CS / IT"
                                                icon={Building2}
                                            />

                                            <InputField
                                                label="Team Name (Optional)"
                                                name="teamName"
                                                value={formData.teamName}
                                                onChange={handleChange}
                                                placeholder="e.g. Code Warriors"
                                                icon={Users}
                                            />
                                        </>
                                    )}

                                    {/* Instagram Verification Section */}
                                    <div style={{ marginBottom: '1.5rem', padding: '1.5rem', background: 'var(--bg-dark)', borderRadius: '12px', border: '1px solid var(--border-dim)' }}>
                                        <h3 style={{ color: '#fff', fontSize: '1.1rem', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                            <Instagram color="#E1306C" size={20} /> Required Verification
                                        </h3>
                                        <p style={{ color: 'var(--text-dim)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                                            To register, you must follow us on Instagram <strong>@gcetloop</strong>.
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
                                        disabled={isSubmitting || !instagramFollowed}
                                        style={{
                                            width: '100%',
                                            padding: '1rem',
                                            marginTop: '1rem',
                                            background: (isSubmitting || !instagramFollowed) ? 'var(--text-dim)' : 'var(--accent)',
                                            color: '#000',
                                            border: 'none',
                                            borderRadius: '8px',
                                            fontWeight: 'bold',
                                            fontSize: '1rem',
                                            cursor: (isSubmitting || !instagramFollowed) ? 'not-allowed' : 'pointer',
                                            transition: 'all 0.3s ease',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            gap: '0.5rem'
                                        }}
                                    >
                                        {isSubmitting ? 'Processing...' : 'CONFIRM REGISTRATION'}
                                    </button>
                                    {/* Honeypot Field (Hidden) */}
                                    <input
                                        type="text"
                                        name="website_confirm"
                                        value={honeypot}
                                        onChange={(e) => setHoneypot(e.target.value)}
                                        style={{ display: 'none', tabindex: '-1', autocomplete: 'off' }}
                                    />
                                </form>
                            </>
                        ) : (
                            <div style={{
                                height: '100%',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                justifyContent: 'center',
                                textAlign: 'center'
                            }}>
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    transition={{ type: 'spring', stiffness: 200, damping: 10 }}
                                >
                                    <CheckCircle size={80} color="var(--accent)" style={{ marginBottom: '1.5rem' }} />
                                </motion.div>
                                <h3 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Registered!</h3>
                                <p style={{ color: 'var(--text-dim)', marginBottom: '2rem' }}>
                                    You have successfully registered for <br />
                                    <span style={{ color: '#fff' }}>{event.title}</span>.
                                </p>
                                <p style={{ fontSize: '0.9rem', color: 'var(--text-dim)' }}>
                                    A confirmation email has been sent to {formData.email}.
                                </p>
                                <button
                                    onClick={onClose}
                                    style={{
                                        marginTop: '2rem',
                                        padding: '0.8rem 2rem',
                                        background: 'transparent',
                                        border: '1px solid var(--border-dim)',
                                        color: '#fff',
                                        borderRadius: '8px',
                                        cursor: 'pointer',
                                        transition: 'all 0.3s'
                                    }}
                                    onMouseEnter={(e) => e.target.style.borderColor = '#fff'}
                                    onMouseLeave={(e) => e.target.style.borderColor = 'var(--border-dim)'}
                                >
                                    Close
                                </button>
                            </div>
                        )}
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
};

const InputField = ({ label, name, type = "text", value, onChange, error, placeholder, icon: Icon }) => (
    <div className="w-full mb-6">
        <label className="block mb-2 text-zinc-400 text-sm font-medium">
            {label}
        </label>
        <div className="relative group">
            {Icon && (
                <div className={`absolute left-4 top-1/2 -translate-y-1/2 transition-colors duration-300 ${error ? 'text-[#ff0055]' : 'text-zinc-500 group-focus-within:text-[var(--accent)]'}`}>
                    <Icon size={18} />
                </div>
            )}
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`
                    w-full bg-main/20 border rounded-xl p-3 text-main outline-none transition-all duration-300
                    ${Icon ? 'pl-11' : 'pl-4'}
                    ${error
                        ? 'border-[#ff0055] focus:shadow-[0_0_20px_rgba(255,0,85,0.2)]'
                        : 'border-zinc-800 focus:border-[var(--accent)] focus:bg-[var(--accent)]/5 focus:shadow-[0_0_20px_rgba(0, 243, 255,0.1)]'}
                `}
            />
            {error && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 text-[#ff0055]">
                    <AlertCircle size={18} />
                </div>
            )}
        </div>
        {error && (
            <p className="text-[#ff0055] text-xs mt-2 flex items-center gap-1">
                <AlertCircle size={12} /> {error}
            </p>
        )}
    </div>
);

export default RegistrationModal;
